import { MigrationInterface, QueryRunner } from 'typeorm';

export class ModifyUserDeviceModel1757961357068 implements MigrationInterface {
  name = 'ModifyUserDeviceModel1757961357068';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_devices" ADD "os_version" character varying(50)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_devices" DROP COLUMN "os_version"`,
    );
  }
}
