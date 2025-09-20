import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { type Request } from 'express';

import { CreateStoryDto } from '../dtos/create-story.dto';
import { MyStoryDto } from '../dtos/responses/my-story.dto';
import { StoryFeedItemDto } from '../dtos/responses/story-feed-item.dto';
import { StoriesService } from '../services/stories.service';

@Controller({ path: 'stories', version: '1' })
export class StoriesController {
  constructor(private readonly storiesService: StoriesService) {}

  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async createStory(@Req() req: Request, @Body() dto: CreateStoryDto) {
    return this.storiesService.createStory(req.user, dto.media);
  }

  @Get('feed')
  async getFeed(@Req() req: Request) {
    const feed = await this.storiesService.getFeedStories(req.user.id);
    const response = feed.map((item) =>
      plainToInstance(StoryFeedItemDto, item),
    );
    return response;
  }

  @Get('me')
  async getMyStories(@Req() req: Request) {
    const stories = await this.storiesService.getMyStories(req.user.id);
    const response = stories.map((item) => plainToInstance(MyStoryDto, item));
    return response;
  }

  @Post(':id/seen')
  @HttpCode(HttpStatus.NO_CONTENT)
  async markSeen(
    @Param('id', ParseUUIDPipe) storyId: string,
    @Req() req: Request,
  ) {
    await this.storiesService.markAsSeen(storyId, req.user);
  }
}
