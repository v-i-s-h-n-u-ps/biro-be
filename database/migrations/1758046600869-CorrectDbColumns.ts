import { MigrationInterface, QueryRunner } from 'typeorm';

export class CorrectDbColumns1758046600869 implements MigrationInterface {
  name = 'CorrectDbColumns1758046600869';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ----- Rename columns to snake_case -----
    await queryRunner.query(
      `ALTER TABLE "user_profiles" RENAME COLUMN "userId" TO "user_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "stories" RENAME COLUMN "userId" TO "user_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "story_view" RENAME COLUMN "storyId" TO "story_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "story_view" RENAME COLUMN "viewerId" TO "viewer_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ride_participants" RENAME COLUMN "rideId" TO "ride_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ride_participants" RENAME COLUMN "userId" TO "user_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "rides" RENAME COLUMN "ownerId" TO "owner_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "rides" RENAME COLUMN "isPublic" TO "is_public"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_blocks" RENAME COLUMN "blockerId" TO "blocker_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_blocks" RENAME COLUMN "blockedId" TO "blocked_id"`,
    );

    // ----- Drop old FK constraints if they exist -----
    await queryRunner.query(
      `ALTER TABLE "user_profiles" DROP CONSTRAINT IF EXISTS "FK_8481388d6325e752cd4d7e26c6d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "stories" DROP CONSTRAINT IF EXISTS "FK_655cd324a6949f46e1b397f621e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "story_view" DROP CONSTRAINT IF EXISTS "FK_ed6b64457e7de99b5cf9e8da85f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "story_view" DROP CONSTRAINT IF EXISTS "FK_917fefeb6d13266256fb712666d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ride_participants" DROP CONSTRAINT IF EXISTS "FK_a811aba344edd629d449171e265"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ride_participants" DROP CONSTRAINT IF EXISTS "FK_714076f3a2f3b2de06eba8cab94"`,
    );
    await queryRunner.query(
      `ALTER TABLE "rides" DROP CONSTRAINT IF EXISTS "FK_79233fc667bfcaa9118a4fecc3e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_blocks" DROP CONSTRAINT IF EXISTS "FK_eae09d4f95afa5ae30c28384607"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_blocks" DROP CONSTRAINT IF EXISTS "FK_18d34df8212648b698828f244fb"`,
    );

    // ----- Re-add FK constraints with updated column names -----
    await queryRunner.query(`
      ALTER TABLE "user_profiles"
      ADD CONSTRAINT "FK_user_profiles_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "stories"
      ADD CONSTRAINT "FK_stories_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "story_view"
      ADD CONSTRAINT "FK_story_view_story_id" FOREIGN KEY ("story_id") REFERENCES "stories"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "story_view"
      ADD CONSTRAINT "FK_story_view_viewer_id" FOREIGN KEY ("viewer_id") REFERENCES "users"("id") ON DELETE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "ride_participants"
      ADD CONSTRAINT "FK_ride_participants_ride_id" FOREIGN KEY ("ride_id") REFERENCES "rides"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "ride_participants"
      ADD CONSTRAINT "FK_ride_participants_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "rides"
      ADD CONSTRAINT "FK_rides_owner_id" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "user_blocks"
      ADD CONSTRAINT "FK_user_blocks_blocker_id" FOREIGN KEY ("blocker_id") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "user_blocks"
      ADD CONSTRAINT "FK_user_blocks_blocked_id" FOREIGN KEY ("blocked_id") REFERENCES "users"("id") ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverse renames
    await queryRunner.query(
      `ALTER TABLE "user_profiles" RENAME COLUMN "user_id" TO "userId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "stories" RENAME COLUMN "user_id" TO "userId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "story_view" RENAME COLUMN "story_id" TO "storyId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "story_view" RENAME COLUMN "viewer_id" TO "viewerId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ride_participants" RENAME COLUMN "ride_id" TO "rideId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ride_participants" RENAME COLUMN "user_id" TO "userId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "rides" RENAME COLUMN "owner_id" TO "ownerId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "rides" RENAME COLUMN "is_public" TO "isPublic"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_blocks" RENAME COLUMN "blocker_id" TO "blockerId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_blocks" RENAME COLUMN "blocked_id" TO "blockedId"`,
    );
  }
}
