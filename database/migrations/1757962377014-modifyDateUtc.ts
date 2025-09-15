import { MigrationInterface, QueryRunner } from 'typeorm';

export class ModifyDateUtc1757962377014 implements MigrationInterface {
  name = 'ModifyDateUtc1757962377014';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_blocks" RENAME COLUMN "createdAt" TO "created_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "follows" RENAME COLUMN "createdAt" TO "created_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_profiles" DROP COLUMN "createdAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_profiles" DROP COLUMN "updatedAt"`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "createdAt"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "updatedAt"`);
    await queryRunner.query(
      `ALTER TABLE "user_profiles" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_profiles" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_devices" DROP COLUMN "created_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_devices" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_devices" DROP COLUMN "updated_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_devices" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_blocks" DROP COLUMN "created_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_blocks" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "follows" DROP COLUMN "created_at"`);
    await queryRunner.query(
      `ALTER TABLE "follows" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "follows" DROP COLUMN "created_at"`);
    await queryRunner.query(
      `ALTER TABLE "follows" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_blocks" DROP COLUMN "created_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_blocks" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_devices" DROP COLUMN "updated_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_devices" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_devices" DROP COLUMN "created_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_devices" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "updated_at"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "created_at"`);
    await queryRunner.query(
      `ALTER TABLE "user_profiles" DROP COLUMN "updated_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_profiles" DROP COLUMN "created_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_profiles" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_profiles" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "follows" RENAME COLUMN "created_at" TO "createdAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_blocks" RENAME COLUMN "created_at" TO "createdAt"`,
    );
  }
}
