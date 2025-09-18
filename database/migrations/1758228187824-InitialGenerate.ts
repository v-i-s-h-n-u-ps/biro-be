import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialGenerate1758228187824 implements MigrationInterface {
  name = 'InitialGenerate1758228187824';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "permissions" ("id" character varying NOT NULL, "description" character varying, CONSTRAINT "PK_920331560282b8bd21bb02290df" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "roles" ("id" character varying NOT NULL, "name" character varying NOT NULL, "description" character varying, CONSTRAINT "PK_c1433d71a4838793a49dcad46ab" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."user_profiles_gender_enum" AS ENUM('male', 'female', 'other')`,
    );
    await queryRunner.query(
      `CREATE TABLE "user_profiles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(100), "avatarUrl" character varying, "gender" "public"."user_profiles_gender_enum" NOT NULL, "dateOfBirth" date, "bio" text, "followersCount" integer NOT NULL DEFAULT '0', "followingCount" integer NOT NULL DEFAULT '0', "ridesCount" integer NOT NULL DEFAULT '0', "isPrivate" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "user_id" uuid, CONSTRAINT "REL_6ca9503d77ae39b4b5a6cc3ba8" UNIQUE ("user_id"), CONSTRAINT "PK_1ec6662219f4605723f1e41b6cb" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "firebaseUid" character varying NOT NULL, "email" citext, "phone" citext, "username" character varying(50) NOT NULL, "emailVerified" boolean NOT NULL DEFAULT true, "isActive" boolean NOT NULL DEFAULT true, "lastLoginAt" TIMESTAMP, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "profile_id" uuid, CONSTRAINT "UQ_e621f267079194e5428e19af2f3" UNIQUE ("firebaseUid"), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "UQ_a000cca60bcf04454e727699490" UNIQUE ("phone"), CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username"), CONSTRAINT "REL_23371445bd80cb3e413089551b" UNIQUE ("profile_id"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_e621f267079194e5428e19af2f" ON "users" ("firebaseUid") `,
    );
    await queryRunner.query(
      `CREATE TABLE "user_devices" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "device_token" character varying(512) NOT NULL, "platform" character varying(50) NOT NULL, "os_version" character varying(50), "appVersion" character varying, "name" character varying(100), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "user_id" uuid, CONSTRAINT "UQ_968092155b7725daf6d66e7bda5" UNIQUE ("device_token"), CONSTRAINT "PK_c9e7e648903a9e537347aba4371" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "stories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "media" text NOT NULL, "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "user_id" uuid, CONSTRAINT "PK_bb6f880b260ed96c452b32a39f0" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "story_view" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "story_id" uuid, "viewer_id" uuid, CONSTRAINT "PK_3dde1e17de695c7a967525251c6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "resource_roles" ("id" character varying NOT NULL, "name" character varying NOT NULL, "description" character varying, CONSTRAINT "PK_02757dc4767f45cc4c3e351b8ea" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."rides_status_enum" AS ENUM('upcoming', 'in_progress', 'completed', 'cancelled')`,
    );
    await queryRunner.query(
      `CREATE TABLE "rides" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying(255) NOT NULL, "image" text, "is_public" boolean NOT NULL DEFAULT true, "start_date" TIMESTAMP WITH TIME ZONE NOT NULL, "end_date" TIMESTAMP WITH TIME ZONE NOT NULL, "start_point" geography(Point,4326) NOT NULL, "end_point" geography(Point,4326) NOT NULL, "route" geography(LineString,4326), "status" "public"."rides_status_enum" NOT NULL DEFAULT 'upcoming', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "owner_id" uuid, CONSTRAINT "PK_ca6f62fc1e999b139c7f28f07fd" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "rides_route_idx" ON "rides" USING GiST ("route") `,
    );
    await queryRunner.query(
      `CREATE INDEX "rides_end_point_idx" ON "rides" USING GiST ("end_point") `,
    );
    await queryRunner.query(
      `CREATE INDEX "rides_start_point_idx" ON "rides" USING GiST ("start_point") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."ride_participants_status_enum" AS ENUM('pending', 'accepted', 'declined')`,
    );
    await queryRunner.query(
      `CREATE TABLE "ride_participants" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "status" "public"."ride_participants_status_enum" NOT NULL DEFAULT 'pending', "created_at" TIME WITH TIME ZONE NOT NULL DEFAULT now(), "ride_id" uuid, "user_id" uuid, "participant_role_id" character varying, CONSTRAINT "PK_e83231dd0230d8b127ad96a8b2c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."follows_status_enum" AS ENUM('pending', 'accepted')`,
    );
    await queryRunner.query(
      `CREATE TABLE "follows" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "status" "public"."follows_status_enum" NOT NULL DEFAULT 'pending', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "follower_id" uuid, "following_id" uuid, CONSTRAINT "UQ_8109e59f691f0444b43420f6987" UNIQUE ("follower_id", "following_id"), CONSTRAINT "PK_8988f607744e16ff79da3b8a627" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "user_blocks" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "blocker_id" uuid, "blocked_id" uuid, CONSTRAINT "PK_0bae5f5cab7574a84889462187c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "role_permissions" ("role_id" character varying NOT NULL, "permission_id" character varying NOT NULL, CONSTRAINT "PK_25d24010f53bb80b78e412c9656" PRIMARY KEY ("role_id", "permission_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_178199805b901ccd220ab7740e" ON "role_permissions" ("role_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_17022daf3f885f7d35423e9971" ON "role_permissions" ("permission_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "user_roles" ("user_id" uuid NOT NULL, "role_id" character varying NOT NULL, CONSTRAINT "PK_23ed6f04fe43066df08379fd034" PRIMARY KEY ("user_id", "role_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_87b8888186ca9769c960e92687" ON "user_roles" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b23c65e50a758245a33ee35fda" ON "user_roles" ("role_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "resource_role_permissions" ("resource_role_id" character varying NOT NULL, "permission_id" character varying NOT NULL, CONSTRAINT "PK_2f4a584ff2aea0f581e7b29962a" PRIMARY KEY ("resource_role_id", "permission_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6757b51b99db443154511379c0" ON "resource_role_permissions" ("resource_role_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_761928cd601a00910d33cdccd0" ON "resource_role_permissions" ("permission_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "ride_participants" DROP COLUMN "participant_role_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ride_participants" ADD "participant_role_id" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "ride_participants" ADD "role_id" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_profiles" ADD CONSTRAINT "FK_6ca9503d77ae39b4b5a6cc3ba88" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_23371445bd80cb3e413089551bf" FOREIGN KEY ("profile_id") REFERENCES "user_profiles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_devices" ADD CONSTRAINT "FK_28bd79e1b3f7c1168f0904ce241" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "stories" ADD CONSTRAINT "FK_ab4ee230faf536e7c5aee12f4ea" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "story_view" ADD CONSTRAINT "FK_d63cb87c2d329028f80737046b4" FOREIGN KEY ("story_id") REFERENCES "stories"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "story_view" ADD CONSTRAINT "FK_5db2dc800e218d8c4bd0b5e2261" FOREIGN KEY ("viewer_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "rides" ADD CONSTRAINT "FK_1bbb8165fbb06d82f5a9b429c92" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ride_participants" ADD CONSTRAINT "FK_8ceb6dc15e18660f94edea94005" FOREIGN KEY ("ride_id") REFERENCES "rides"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ride_participants" ADD CONSTRAINT "FK_ca2fb1233a6360fab299fa7abd7" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ride_participants" ADD CONSTRAINT "FK_b3aafb5b5b29ba217796871c5a8" FOREIGN KEY ("participant_role_id") REFERENCES "resource_roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "follows" ADD CONSTRAINT "FK_54b5dc2739f2dea57900933db66" FOREIGN KEY ("follower_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "follows" ADD CONSTRAINT "FK_c518e3988b9c057920afaf2d8c0" FOREIGN KEY ("following_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_blocks" ADD CONSTRAINT "FK_dfcd8a81016d1de587fbd2d70bf" FOREIGN KEY ("blocker_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_blocks" ADD CONSTRAINT "FK_7a0806a54f0ad9ced3e247cacd1" FOREIGN KEY ("blocked_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ride_participants" ADD CONSTRAINT "FK_4311aae5162b4e6b75783b98e46" FOREIGN KEY ("role_id") REFERENCES "resource_roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permissions" ADD CONSTRAINT "FK_178199805b901ccd220ab7740ec" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permissions" ADD CONSTRAINT "FK_17022daf3f885f7d35423e9971e" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_roles" ADD CONSTRAINT "FK_87b8888186ca9769c960e926870" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_roles" ADD CONSTRAINT "FK_b23c65e50a758245a33ee35fda1" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "resource_role_permissions" ADD CONSTRAINT "FK_6757b51b99db443154511379c09" FOREIGN KEY ("resource_role_id") REFERENCES "resource_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "resource_role_permissions" ADD CONSTRAINT "FK_761928cd601a00910d33cdccd0c" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "resource_role_permissions" DROP CONSTRAINT "FK_761928cd601a00910d33cdccd0c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "resource_role_permissions" DROP CONSTRAINT "FK_6757b51b99db443154511379c09"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_roles" DROP CONSTRAINT "FK_b23c65e50a758245a33ee35fda1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_roles" DROP CONSTRAINT "FK_87b8888186ca9769c960e926870"`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_17022daf3f885f7d35423e9971e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_178199805b901ccd220ab7740ec"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ride_participants" DROP CONSTRAINT "FK_4311aae5162b4e6b75783b98e46"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_blocks" DROP CONSTRAINT "FK_7a0806a54f0ad9ced3e247cacd1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_blocks" DROP CONSTRAINT "FK_dfcd8a81016d1de587fbd2d70bf"`,
    );
    await queryRunner.query(
      `ALTER TABLE "follows" DROP CONSTRAINT "FK_c518e3988b9c057920afaf2d8c0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "follows" DROP CONSTRAINT "FK_54b5dc2739f2dea57900933db66"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ride_participants" DROP CONSTRAINT "FK_b3aafb5b5b29ba217796871c5a8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ride_participants" DROP CONSTRAINT "FK_ca2fb1233a6360fab299fa7abd7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ride_participants" DROP CONSTRAINT "FK_8ceb6dc15e18660f94edea94005"`,
    );
    await queryRunner.query(
      `ALTER TABLE "rides" DROP CONSTRAINT "FK_1bbb8165fbb06d82f5a9b429c92"`,
    );
    await queryRunner.query(
      `ALTER TABLE "story_view" DROP CONSTRAINT "FK_5db2dc800e218d8c4bd0b5e2261"`,
    );
    await queryRunner.query(
      `ALTER TABLE "story_view" DROP CONSTRAINT "FK_d63cb87c2d329028f80737046b4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "stories" DROP CONSTRAINT "FK_ab4ee230faf536e7c5aee12f4ea"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_devices" DROP CONSTRAINT "FK_28bd79e1b3f7c1168f0904ce241"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_23371445bd80cb3e413089551bf"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_profiles" DROP CONSTRAINT "FK_6ca9503d77ae39b4b5a6cc3ba88"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ride_participants" DROP COLUMN "role_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ride_participants" DROP COLUMN "participant_role_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ride_participants" ADD "participant_role_id" character varying`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_761928cd601a00910d33cdccd0"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6757b51b99db443154511379c0"`,
    );
    await queryRunner.query(`DROP TABLE "resource_role_permissions"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b23c65e50a758245a33ee35fda"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_87b8888186ca9769c960e92687"`,
    );
    await queryRunner.query(`DROP TABLE "user_roles"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_17022daf3f885f7d35423e9971"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_178199805b901ccd220ab7740e"`,
    );
    await queryRunner.query(`DROP TABLE "role_permissions"`);
    await queryRunner.query(`DROP TABLE "user_blocks"`);
    await queryRunner.query(`DROP TABLE "follows"`);
    await queryRunner.query(`DROP TYPE "public"."follows_status_enum"`);
    await queryRunner.query(`DROP TABLE "ride_participants"`);
    await queryRunner.query(
      `DROP TYPE "public"."ride_participants_status_enum"`,
    );
    await queryRunner.query(`DROP INDEX "public"."rides_start_point_idx"`);
    await queryRunner.query(`DROP INDEX "public"."rides_end_point_idx"`);
    await queryRunner.query(`DROP INDEX "public"."rides_route_idx"`);
    await queryRunner.query(`DROP TABLE "rides"`);
    await queryRunner.query(`DROP TYPE "public"."rides_status_enum"`);
    await queryRunner.query(`DROP TABLE "resource_roles"`);
    await queryRunner.query(`DROP TABLE "story_view"`);
    await queryRunner.query(`DROP TABLE "stories"`);
    await queryRunner.query(`DROP TABLE "user_devices"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e621f267079194e5428e19af2f"`,
    );
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TABLE "user_profiles"`);
    await queryRunner.query(`DROP TYPE "public"."user_profiles_gender_enum"`);
    await queryRunner.query(`DROP TABLE "roles"`);
    await queryRunner.query(`DROP TABLE "permissions"`);
  }
}
