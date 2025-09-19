import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, SelectQueryBuilder } from 'typeorm';

import {
  FollowStatus,
  ParticipantStatus,
} from 'src/common/constants/common.enum';
import { Follow } from 'src/connections/entities/follows.entity';
import { RideParticipant } from 'src/rides/entities/ride-participants.entity';
import { Story } from 'src/stories/entities/story.entity';
import { StoryView } from 'src/stories/entities/story-view.entity';

import { User } from '../entities/users.entity';

interface SuggestionResult {
  user_id: string;
  shared_rides: number;
  recent_stories: number;
  story_age_days: number;
  connections: number;
  score: number;
}

interface UserIdRow {
  user_id: string;
}

@Injectable()
export class SuggestionService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Follow)
    private followRepository: Repository<Follow>,
    @InjectRepository(RideParticipant)
    private rideParticipantRepository: Repository<RideParticipant>,
    @InjectRepository(Story)
    private storyRepository: Repository<Story>,
  ) {}

  async getSuggestions(
    currentUserId: string,
    filters: {
      minSharedRides?: number;
      minConnections?: number;
      maxStoryAgeDays?: number;
    } = {},
  ): Promise<User[]> {
    const {
      minSharedRides = 0,
      minConnections = 0,
      maxStoryAgeDays = 3,
    } = filters;
    const status = FollowStatus.ACCEPTED;
    const participantStatus = ParticipantStatus.ACCEPTED;
    const dateThreshold = new Date(
      Date.now() - maxStoryAgeDays * 24 * 60 * 60 * 1000,
    );

    const excludedUsersSubQuery = this.followRepository
      .createQueryBuilder('follow')
      .select('follow.follower_id', 'user_id')
      .addSelect('follow.following_id', 'user_id')
      .where(
        'follow.following_id = :currentUserId AND follow.status = :status',
        { currentUserId, status },
      )
      .orWhere(
        'follow.follower_id = :currentUserId AND follow.status = :status',
        { currentUserId, status },
      );

    // Later, include current user
    const excludedUserIds = await this.followRepository
      .createQueryBuilder()
      .select('user_id')
      .from(`(${excludedUsersSubQuery.getQuery()})`, 'sub')
      .setParameters(excludedUsersSubQuery.getParameters())
      .getRawMany<UserIdRow>();

    const excludedIds = excludedUserIds
      .map((u) => u.user_id)
      .concat(currentUserId);

    // Subquery: Shared rides
    const sharedRidesSubQuery: SelectQueryBuilder<RideParticipant> =
      this.rideParticipantRepository
        .createQueryBuilder('rp1')
        .select('rp2.user_id', 'suggested_user')
        .addSelect('COUNT(DISTINCT rp1.ride_id)::integer', 'shared_count')
        .innerJoin(
          RideParticipant,
          'rp2',
          'rp1.ride_id = rp2.ride_id AND rp1.user_id != rp2.user_id',
        )
        .where('rp1.user_id = :currentUserId', { currentUserId })
        .andWhere('rp1.status = :participantStatus', { participantStatus })
        .andWhere('rp2.status = :participantStatus', { participantStatus })
        .groupBy('rp2.user_id')
        .having('COUNT(DISTINCT rp1.ride_id)::integer >= :minSharedRides', {
          minSharedRides,
        });

    // Subquery: Recent unseen stories
    const recentStoriesSubQuery: SelectQueryBuilder<Story> =
      this.storyRepository
        .createQueryBuilder('story')
        .select('story.user_id', 'suggested_user')
        .addSelect('MAX(story.created_at)', 'last_story_at')
        .addSelect('COUNT(story.id)::integer', 'recent_count')
        .leftJoin(
          StoryView,
          'sv',
          'story.id = sv.story_id AND sv.viewer_id = :currentUserId',
          { currentUserId },
        )
        .where('story.created_at > :dateThreshold', { dateThreshold })
        .andWhere('sv.id IS NULL')
        .groupBy('story.user_id');

    // Subquery: Network connections
    const networkConnectionsSubQuery: SelectQueryBuilder<Follow> =
      this.followRepository
        .createQueryBuilder('f1')
        .select(
          'COALESCE(f2.following_id, f3.follower_id, f4.following_id, f5.follower_id)',
          'suggested_user',
        )
        .addSelect(
          `(
          COALESCE(COUNT(DISTINCT f2.following_id), 0) +
          COALESCE(COUNT(DISTINCT f3.follower_id), 0) +
          COALESCE(COUNT(DISTINCT f4.following_id), 0) +
          COALESCE(COUNT(DISTINCT f5.follower_id), 0)
        )::integer`,
          'connection_count',
        )
        .leftJoin(
          Follow,
          'f2',
          'f1.following_id = f2.follower_id AND f2.status = :status AND f2.following_id != :currentUserId',
          { status, currentUserId },
        )
        .leftJoin(
          Follow,
          'f3',
          'f1.following_id = f3.following_id AND f3.status = :status AND f3.follower_id != :currentUserId',
          { status, currentUserId },
        )
        .leftJoin(
          Follow,
          'f4',
          'f1.follower_id = f4.follower_id AND f4.status = :status AND f4.following_id != :currentUserId',
          { status, currentUserId },
        )
        .leftJoin(
          Follow,
          'f5',
          'f1.follower_id = f5.following_id AND f5.status = :status AND f5.follower_id != :currentUserId',
          { status, currentUserId },
        )
        .where(
          '(f1.follower_id = :currentUserId OR f1.following_id = :currentUserId) AND f1.status = :status',
          { currentUserId, status },
        )
        .groupBy(
          'COALESCE(f2.following_id, f3.follower_id, f4.following_id, f5.follower_id)',
        )
        .having(
          `(
          COALESCE(COUNT(DISTINCT f2.following_id), 0) +
          COALESCE(COUNT(DISTINCT f3.follower_id), 0) +
          COALESCE(COUNT(DISTINCT f4.following_id), 0) +
          COALESCE(COUNT(DISTINCT f5.follower_id), 0)
        )::integer >= :minConnections`,
          { minConnections },
        );

    // Collect all parameters
    const allParameters = {
      currentUserId,
      status,
      participantStatus,
      minSharedRides,
      minConnections,
      maxStoryAgeDays,
      dateThreshold,
    };

    // Main query
    const query: SelectQueryBuilder<User> = this.userRepository
      .createQueryBuilder('user')
      .leftJoin(
        `(${sharedRidesSubQuery.getQuery()})`,
        'sr',
        'user.id = sr.suggested_user',
      )
      .leftJoin(
        `(${recentStoriesSubQuery.getQuery()})`,
        'rs',
        'user.id = rs.suggested_user',
      )
      .leftJoin(
        `(${networkConnectionsSubQuery.getQuery()})`,
        'nc',
        'user.id = nc.suggested_user',
      )
      .where(`user.id NOT IN (:...excludedIds)`, { excludedIds })
      .andWhere(
        'COALESCE(sr.shared_count, 0)::integer > 0 OR COALESCE(rs.recent_count, 0)::integer > 0 OR COALESCE(nc.connection_count, 0)::integer > 0',
      )
      .select([
        'user.id AS user_id',
        'COALESCE(sr.shared_count, 0)::integer AS shared_rides',
        'COALESCE(rs.recent_count, 0)::integer AS recent_stories',
        'COALESCE(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - rs.last_story_at)) / 86400, :maxStoryAgeDays)::float AS story_age_days',
        'COALESCE(nc.connection_count, 0)::integer AS connections',
      ])
      .addSelect(
        `(
          COALESCE(sr.shared_count, 0)::integer * 10 +
          COALESCE(nc.connection_count, 0)::integer * 5 +
          COALESCE(rs.recent_count, 0)::integer * 3 -
          COALESCE(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - rs.last_story_at)) / 86400, :maxStoryAgeDays)::float +
          RANDOM() * 2
        )`,
        'score',
      )
      .orderBy('score', 'DESC')
      .setParameters(allParameters);

    const rawResults: SuggestionResult[] = await query.getRawMany();

    if (rawResults.length === 0) {
      return [];
    }

    const orderedIds: string[] = rawResults.map((result) => result.user_id);

    const suggestions: User[] = await this.userRepository.find({
      where: { id: In(orderedIds) },
      relations: ['profile', 'roles'],
    });

    const idOrderMap = new Map<string, number>(
      orderedIds.map((id, index) => [id, index]),
    );
    suggestions.sort((a, b) => idOrderMap.get(a.id) - idOrderMap.get(b.id));

    return suggestions;
  }
}
