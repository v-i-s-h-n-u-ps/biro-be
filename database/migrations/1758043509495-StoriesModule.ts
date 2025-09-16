import { MigrationInterface, QueryRunner } from 'typeorm';

export class StoriesModule1758043509495 implements MigrationInterface {
  name = 'StoriesModule1758043509495';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "stories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "media" text NOT NULL, "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "userId" uuid, CONSTRAINT "PK_bb6f880b260ed96c452b32a39f0" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "story_view" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "storyId" uuid, "viewerId" uuid, CONSTRAINT "PK_3dde1e17de695c7a967525251c6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "ride_participants" ADD CONSTRAINT "FK_4311aae5162b4e6b75783b98e46" FOREIGN KEY ("role_id") REFERENCES "resource_roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
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
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
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
      `ALTER TABLE "ride_participants" DROP CONSTRAINT "FK_4311aae5162b4e6b75783b98e46"`,
    );
    await queryRunner.query(`DROP TABLE "story_view"`);
    await queryRunner.query(`DROP TABLE "stories"`);
  }
}
