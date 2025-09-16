import { MigrationInterface, QueryRunner } from 'typeorm';

export class CorrectDbColumns1758046600869 implements MigrationInterface {
  name = 'CorrectDbColumns1758046600869';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_profiles" DROP CONSTRAINT "FK_8481388d6325e752cd4d7e26c6d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "story_view" DROP CONSTRAINT "FK_ed6b64457e7de99b5cf9e8da85f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "story_view" DROP CONSTRAINT "FK_917fefeb6d13266256fb712666d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "stories" DROP CONSTRAINT "FK_655cd324a6949f46e1b397f621e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ride_participants" DROP CONSTRAINT "FK_a811aba344edd629d449171e265"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ride_participants" DROP CONSTRAINT "FK_714076f3a2f3b2de06eba8cab94"`,
    );
    await queryRunner.query(
      `ALTER TABLE "rides" DROP CONSTRAINT "FK_79233fc667bfcaa9118a4fecc3e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_blocks" DROP CONSTRAINT "FK_eae09d4f95afa5ae30c28384607"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_blocks" DROP CONSTRAINT "FK_18d34df8212648b698828f244fb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_profiles" RENAME COLUMN "userId" TO "user_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "stories" RENAME COLUMN "userId" TO "user_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_profiles" RENAME COLUMN "user_id" TO "userId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "stories" RENAME COLUMN "user_id" TO "userId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_profiles" DROP CONSTRAINT "REL_8481388d6325e752cd4d7e26c6"`,
    );
    await queryRunner.query(`ALTER TABLE "user_profiles" DROP COLUMN "userId"`);
    await queryRunner.query(`ALTER TABLE "story_view" DROP COLUMN "storyId"`);
    await queryRunner.query(`ALTER TABLE "story_view" DROP COLUMN "viewerId"`);
    await queryRunner.query(`ALTER TABLE "stories" DROP COLUMN "userId"`);
    await queryRunner.query(
      `ALTER TABLE "ride_participants" DROP COLUMN "rideId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ride_participants" DROP COLUMN "userId"`,
    );
    await queryRunner.query(`ALTER TABLE "rides" DROP COLUMN "ownerId"`);
    await queryRunner.query(`ALTER TABLE "rides" DROP COLUMN "isPublic"`);
    await queryRunner.query(
      `ALTER TABLE "user_blocks" DROP COLUMN "blockerId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_blocks" DROP COLUMN "blockedId"`,
    );
    await queryRunner.query(`ALTER TABLE "user_profiles" ADD "user_id" uuid`);
    await queryRunner.query(
      `ALTER TABLE "user_profiles" ADD CONSTRAINT "UQ_6ca9503d77ae39b4b5a6cc3ba88" UNIQUE ("user_id")`,
    );
    await queryRunner.query(`ALTER TABLE "users" ADD "profile_id" uuid`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "UQ_23371445bd80cb3e413089551bf" UNIQUE ("profile_id")`,
    );
    await queryRunner.query(`ALTER TABLE "story_view" ADD "story_id" uuid`);
    await queryRunner.query(`ALTER TABLE "story_view" ADD "viewer_id" uuid`);
    await queryRunner.query(`ALTER TABLE "stories" ADD "user_id" uuid`);
    await queryRunner.query(
      `ALTER TABLE "ride_participants" ADD "ride_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "ride_participants" ADD "user_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "rides" ADD "is_public" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(`ALTER TABLE "rides" ADD "owner_id" uuid`);
    await queryRunner.query(`ALTER TABLE "user_blocks" ADD "blocker_id" uuid`);
    await queryRunner.query(`ALTER TABLE "user_blocks" ADD "blocked_id" uuid`);
    await queryRunner.query(`ALTER TABLE "user_profiles" ADD "userId" uuid`);
    await queryRunner.query(
      `ALTER TABLE "user_profiles" ADD CONSTRAINT "UQ_8481388d6325e752cd4d7e26c6d" UNIQUE ("userId")`,
    );
    await queryRunner.query(`ALTER TABLE "stories" ADD "userId" uuid`);
    await queryRunner.query(`ALTER TABLE "story_view" ADD "storyId" uuid`);
    await queryRunner.query(`ALTER TABLE "story_view" ADD "viewerId" uuid`);
    await queryRunner.query(
      `ALTER TABLE "ride_participants" ADD "rideId" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "ride_participants" ADD "userId" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "rides" ADD "isPublic" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(`ALTER TABLE "rides" ADD "ownerId" uuid`);
    await queryRunner.query(`ALTER TABLE "user_blocks" ADD "blockerId" uuid`);
    await queryRunner.query(`ALTER TABLE "user_blocks" ADD "blockedId" uuid`);
    await queryRunner.query(
      `ALTER TABLE "user_profiles" ADD CONSTRAINT "FK_6ca9503d77ae39b4b5a6cc3ba88" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_23371445bd80cb3e413089551bf" FOREIGN KEY ("profile_id") REFERENCES "user_profiles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "story_view" ADD CONSTRAINT "FK_d63cb87c2d329028f80737046b4" FOREIGN KEY ("story_id") REFERENCES "stories"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "story_view" ADD CONSTRAINT "FK_5db2dc800e218d8c4bd0b5e2261" FOREIGN KEY ("viewer_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "stories" ADD CONSTRAINT "FK_ab4ee230faf536e7c5aee12f4ea" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ride_participants" ADD CONSTRAINT "FK_8ceb6dc15e18660f94edea94005" FOREIGN KEY ("ride_id") REFERENCES "rides"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ride_participants" ADD CONSTRAINT "FK_ca2fb1233a6360fab299fa7abd7" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "rides" ADD CONSTRAINT "FK_1bbb8165fbb06d82f5a9b429c92" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_blocks" ADD CONSTRAINT "FK_dfcd8a81016d1de587fbd2d70bf" FOREIGN KEY ("blocker_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_blocks" ADD CONSTRAINT "FK_7a0806a54f0ad9ced3e247cacd1" FOREIGN KEY ("blocked_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_profiles" ADD CONSTRAINT "FK_8481388d6325e752cd4d7e26c6d" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "stories" ADD CONSTRAINT "FK_655cd324a6949f46e1b397f621e" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "story_view" ADD CONSTRAINT "FK_ed6b64457e7de99b5cf9e8da85f" FOREIGN KEY ("storyId") REFERENCES "stories"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "story_view" ADD CONSTRAINT "FK_917fefeb6d13266256fb712666d" FOREIGN KEY ("viewerId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ride_participants" ADD CONSTRAINT "FK_a811aba344edd629d449171e265" FOREIGN KEY ("rideId") REFERENCES "rides"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ride_participants" ADD CONSTRAINT "FK_714076f3a2f3b2de06eba8cab94" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "rides" ADD CONSTRAINT "FK_79233fc667bfcaa9118a4fecc3e" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_blocks" ADD CONSTRAINT "FK_eae09d4f95afa5ae30c28384607" FOREIGN KEY ("blockerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_blocks" ADD CONSTRAINT "FK_18d34df8212648b698828f244fb" FOREIGN KEY ("blockedId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_blocks" DROP CONSTRAINT "FK_18d34df8212648b698828f244fb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_blocks" DROP CONSTRAINT "FK_eae09d4f95afa5ae30c28384607"`,
    );
    await queryRunner.query(
      `ALTER TABLE "rides" DROP CONSTRAINT "FK_79233fc667bfcaa9118a4fecc3e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ride_participants" DROP CONSTRAINT "FK_714076f3a2f3b2de06eba8cab94"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ride_participants" DROP CONSTRAINT "FK_a811aba344edd629d449171e265"`,
    );
    await queryRunner.query(
      `ALTER TABLE "story_view" DROP CONSTRAINT "FK_917fefeb6d13266256fb712666d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "story_view" DROP CONSTRAINT "FK_ed6b64457e7de99b5cf9e8da85f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "stories" DROP CONSTRAINT "FK_655cd324a6949f46e1b397f621e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_profiles" DROP CONSTRAINT "FK_8481388d6325e752cd4d7e26c6d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_blocks" DROP CONSTRAINT "FK_7a0806a54f0ad9ced3e247cacd1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_blocks" DROP CONSTRAINT "FK_dfcd8a81016d1de587fbd2d70bf"`,
    );
    await queryRunner.query(
      `ALTER TABLE "rides" DROP CONSTRAINT "FK_1bbb8165fbb06d82f5a9b429c92"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ride_participants" DROP CONSTRAINT "FK_ca2fb1233a6360fab299fa7abd7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ride_participants" DROP CONSTRAINT "FK_8ceb6dc15e18660f94edea94005"`,
    );
    await queryRunner.query(
      `ALTER TABLE "stories" DROP CONSTRAINT "FK_ab4ee230faf536e7c5aee12f4ea"`,
    );
    await queryRunner.query(
      `ALTER TABLE "story_view" DROP CONSTRAINT "FK_5db2dc800e218d8c4bd0b5e2261"`,
    );
    await queryRunner.query(
      `ALTER TABLE "story_view" DROP CONSTRAINT "FK_d63cb87c2d329028f80737046b4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_23371445bd80cb3e413089551bf"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_profiles" DROP CONSTRAINT "FK_6ca9503d77ae39b4b5a6cc3ba88"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_blocks" DROP COLUMN "blockedId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_blocks" DROP COLUMN "blockerId"`,
    );
    await queryRunner.query(`ALTER TABLE "rides" DROP COLUMN "ownerId"`);
    await queryRunner.query(`ALTER TABLE "rides" DROP COLUMN "isPublic"`);
    await queryRunner.query(
      `ALTER TABLE "ride_participants" DROP COLUMN "userId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ride_participants" DROP COLUMN "rideId"`,
    );
    await queryRunner.query(`ALTER TABLE "story_view" DROP COLUMN "viewerId"`);
    await queryRunner.query(`ALTER TABLE "story_view" DROP COLUMN "storyId"`);
    await queryRunner.query(`ALTER TABLE "stories" DROP COLUMN "userId"`);
    await queryRunner.query(
      `ALTER TABLE "user_profiles" DROP CONSTRAINT "UQ_8481388d6325e752cd4d7e26c6d"`,
    );
    await queryRunner.query(`ALTER TABLE "user_profiles" DROP COLUMN "userId"`);
    await queryRunner.query(
      `ALTER TABLE "user_blocks" DROP COLUMN "blocked_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_blocks" DROP COLUMN "blocker_id"`,
    );
    await queryRunner.query(`ALTER TABLE "rides" DROP COLUMN "owner_id"`);
    await queryRunner.query(`ALTER TABLE "rides" DROP COLUMN "is_public"`);
    await queryRunner.query(
      `ALTER TABLE "ride_participants" DROP COLUMN "user_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ride_participants" DROP COLUMN "ride_id"`,
    );
    await queryRunner.query(`ALTER TABLE "stories" DROP COLUMN "user_id"`);
    await queryRunner.query(`ALTER TABLE "story_view" DROP COLUMN "viewer_id"`);
    await queryRunner.query(`ALTER TABLE "story_view" DROP COLUMN "story_id"`);
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "UQ_23371445bd80cb3e413089551bf"`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "profile_id"`);
    await queryRunner.query(
      `ALTER TABLE "user_profiles" DROP CONSTRAINT "UQ_6ca9503d77ae39b4b5a6cc3ba88"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_profiles" DROP COLUMN "user_id"`,
    );
    await queryRunner.query(`ALTER TABLE "user_blocks" ADD "blockedId" uuid`);
    await queryRunner.query(`ALTER TABLE "user_blocks" ADD "blockerId" uuid`);
    await queryRunner.query(
      `ALTER TABLE "rides" ADD "isPublic" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(`ALTER TABLE "rides" ADD "ownerId" uuid`);
    await queryRunner.query(
      `ALTER TABLE "ride_participants" ADD "userId" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "ride_participants" ADD "rideId" uuid`,
    );
    await queryRunner.query(`ALTER TABLE "stories" ADD "userId" uuid`);
    await queryRunner.query(`ALTER TABLE "story_view" ADD "viewerId" uuid`);
    await queryRunner.query(`ALTER TABLE "story_view" ADD "storyId" uuid`);
    await queryRunner.query(`ALTER TABLE "user_profiles" ADD "userId" uuid`);
    await queryRunner.query(
      `ALTER TABLE "user_profiles" ADD CONSTRAINT "REL_8481388d6325e752cd4d7e26c6" UNIQUE ("userId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "stories" RENAME COLUMN "userId" TO "user_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_profiles" RENAME COLUMN "userId" TO "user_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "stories" RENAME COLUMN "user_id" TO "userId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_profiles" RENAME COLUMN "user_id" TO "userId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_blocks" ADD CONSTRAINT "FK_18d34df8212648b698828f244fb" FOREIGN KEY ("blockedId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_blocks" ADD CONSTRAINT "FK_eae09d4f95afa5ae30c28384607" FOREIGN KEY ("blockerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "rides" ADD CONSTRAINT "FK_79233fc667bfcaa9118a4fecc3e" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ride_participants" ADD CONSTRAINT "FK_714076f3a2f3b2de06eba8cab94" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ride_participants" ADD CONSTRAINT "FK_a811aba344edd629d449171e265" FOREIGN KEY ("rideId") REFERENCES "rides"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "stories" ADD CONSTRAINT "FK_655cd324a6949f46e1b397f621e" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "story_view" ADD CONSTRAINT "FK_917fefeb6d13266256fb712666d" FOREIGN KEY ("viewerId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "story_view" ADD CONSTRAINT "FK_ed6b64457e7de99b5cf9e8da85f" FOREIGN KEY ("storyId") REFERENCES "stories"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_profiles" ADD CONSTRAINT "FK_8481388d6325e752cd4d7e26c6d" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
