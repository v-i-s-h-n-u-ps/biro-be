import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, MoreThan } from 'typeorm';
import { Repository } from 'typeorm';

import { ConnectionsService } from 'src/connections/services/connections.service';
import { User } from 'src/users/entities/users.entity';

import { Story } from '../entities/story.entity';
import { StoryView } from '../entities/story-view.entity';

type FeedHelper = {
  userId: string;
  name: string;
  profileImage: string;
  stories: {
    id: string;
    media: string;
    createdAt: Date;
    seen: boolean;
  }[];
};

@Injectable()
export class StoriesService {
  constructor(
    @InjectRepository(Story)
    private readonly storyRepo: Repository<Story>,
    @InjectRepository(StoryView)
    private readonly viewRepo: Repository<StoryView>,
    private readonly connectionsService: ConnectionsService,
  ) {}

  async createStory(user: User, mediaUrls: string[]) {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
    const stories = mediaUrls.map((url) =>
      this.storyRepo.create({
        user,
        media: url,
        expiresAt,
      }),
    );
    return this.storyRepo.save(stories);
  }

  async deleteExpiredStories() {
    const now = new Date();
    await this.storyRepo.delete({ expiresAt: MoreThan(now) });
  }

  /** Feed for a user: stories from followed users */
  async getFeedStories(userId: string) {
    const user = await this.connectionsService.getFollowing(userId);
    const followedIds = user.map((f) => f.id);
    const now = new Date();

    const stories = await this.storyRepo.find({
      where: { user: In(followedIds), expiresAt: MoreThan(now) },
      relations: ['user', 'views'],
      order: { createdAt: 'ASC' },
    });

    const feedMap = new Map<string, FeedHelper>();

    for (const story of stories) {
      const hasSeen = story.views.some((v) => v.viewer.id === userId);
      const key = story.user.id;
      if (!feedMap.has(key)) {
        feedMap.set(key, {
          userId: story.user.id,
          name: story.user.profile.name,
          profileImage: story.user.profile.avatarUrl,
          stories: [],
        });
      }
      feedMap.get(key)!.stories.push({
        id: story.id,
        media: story.media,
        createdAt: story.createdAt,
        seen: hasSeen,
      });
    }

    // sort stories unseen first
    return Array.from(feedMap.values()).map((item) => ({
      ...item,
      stories: item.stories.sort((a, b) => {
        if (a.seen === b.seen) {
          return a.createdAt.getTime() - b.createdAt.getTime();
        }
        return a.seen ? 1 : -1;
      }),
    }));
  }

  /** My own stories with viewers (excluding blocked users) */
  async getMyStories(userId: string) {
    const blockedUsers = await this.connectionsService.getBlockedUsers(userId);
    const blockedIds = blockedUsers.map((u) => u.id);
    const now = new Date();

    const stories = await this.storyRepo.find({
      where: { user: { id: userId }, expiresAt: MoreThan(now) },
      relations: ['views', 'views.viewer'],
      order: { createdAt: 'DESC' },
    });

    return stories.map((story) => ({
      storyId: story.id,
      media: story.media,
      createdAt: story.createdAt,
      viewers: story.views
        .filter((v) => !blockedIds.includes(v.viewer.id))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .map((v) => ({
          userId: v.viewer.id,
          name: v.viewer.profile.name,
          profileImage: v.viewer.profile.avatarUrl,
          viewedAt: v.createdAt,
        })),
    }));
  }

  /** Mark story as seen by a user */
  async markAsSeen(storyId: string, viewer: User) {
    const story = await this.storyRepo.findOne({
      where: { id: storyId },
      relations: ['views'],
    });
    if (!story) return null;

    const existing = story.views.find((v) => v.viewer.id === viewer.id);
    if (existing) return existing;

    const view = this.viewRepo.create({ story, viewer });
    return this.viewRepo.save(view);
  }
}
