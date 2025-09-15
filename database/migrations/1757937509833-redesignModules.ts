import { MigrationInterface, QueryRunner } from 'typeorm';

export class RedesignModules1757937509833 implements MigrationInterface {
  name = 'RedesignModules1757937509833';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "user_profiles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(100), "avatarUrl" character varying, "gender" character varying(20), "dateOfBirth" date, "bio" text, "followersCount" integer NOT NULL DEFAULT '0', "followingCount" integer NOT NULL DEFAULT '0', "ridesCount" integer NOT NULL DEFAULT '0', "isPrivate" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid, CONSTRAINT "REL_8481388d6325e752cd4d7e26c6" UNIQUE ("userId"), CONSTRAINT "PK_1ec6662219f4605723f1e41b6cb" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "resource_roles" ("id" character varying NOT NULL, "name" character varying NOT NULL, "description" character varying, CONSTRAINT "PK_02757dc4767f45cc4c3e351b8ea" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "user_devices" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "device_token" character varying(512) NOT NULL, "platform" character varying(50) NOT NULL, "appVersion" character varying, "name" character varying(100), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" uuid, CONSTRAINT "UQ_968092155b7725daf6d66e7bda5" UNIQUE ("device_token"), CONSTRAINT "PK_c9e7e648903a9e537347aba4371" PRIMARY KEY ("id"))`,
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
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "name"`);
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3"`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "email"`);
    await queryRunner.query(`ALTER TABLE "users" ADD "email" citext`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email")`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "UQ_a000cca60bcf04454e727699490"`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "phone"`);
    await queryRunner.query(`ALTER TABLE "users" ADD "phone" citext`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "UQ_a000cca60bcf04454e727699490" UNIQUE ("phone")`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_profiles" ADD CONSTRAINT "FK_8481388d6325e752cd4d7e26c6d" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_devices" ADD CONSTRAINT "FK_28bd79e1b3f7c1168f0904ce241" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
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
      `ALTER TABLE "user_devices" DROP CONSTRAINT "FK_28bd79e1b3f7c1168f0904ce241"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_profiles" DROP CONSTRAINT "FK_8481388d6325e752cd4d7e26c6d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "UQ_a000cca60bcf04454e727699490"`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "phone"`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD "phone" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "UQ_a000cca60bcf04454e727699490" UNIQUE ("phone")`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3"`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "email"`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD "email" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email")`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "name" character varying NOT NULL`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_761928cd601a00910d33cdccd0"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6757b51b99db443154511379c0"`,
    );
    await queryRunner.query(`DROP TABLE "resource_role_permissions"`);
    await queryRunner.query(`DROP TABLE "user_devices"`);
    await queryRunner.query(`DROP TABLE "resource_roles"`);
    await queryRunner.query(`DROP TABLE "user_profiles"`);
  }
}
