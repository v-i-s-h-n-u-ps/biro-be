import { MigrationInterface, QueryRunner } from 'typeorm';

export class NotificationFieldsForDevice1758629235475
  implements MigrationInterface
{
  name = 'NotificationFieldsForDevice1758629235475';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_devices" ADD "notifications_enabled" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_devices" ADD "notifications_importance" integer`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_devices" DROP COLUMN "notifications_importance"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_devices" DROP COLUMN "notifications_enabled"`,
    );
  }
}
