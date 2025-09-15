import { MigrationInterface, QueryRunner } from 'typeorm';

export class RideModuleCompleteFlow1757972346642 implements MigrationInterface {
  name = 'RideModuleCompleteFlow1757972346642';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Ride participants
    await queryRunner.query(
      `CREATE TYPE "public"."ride_participants_status_enum" AS ENUM('pending', 'accepted', 'declined')`,
    );
    await queryRunner.query(`
      CREATE TABLE "ride_participants" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "status" "public"."ride_participants_status_enum" NOT NULL DEFAULT 'pending',
        "created_at" TIME WITH TIME ZONE NOT NULL DEFAULT now(),
        "rideId" uuid,
        "userId" uuid,
        "role_id" character varying,
        CONSTRAINT "PK_e83231dd0230d8b127ad96a8b2c" PRIMARY KEY ("id")
      )
    `);

    // Rides
    await queryRunner.query(
      `CREATE TYPE "public"."rides_status_enum" AS ENUM('upcoming', 'in_progress', 'completed', 'cancelled')`,
    );
    await queryRunner.query(`
      CREATE TABLE "rides" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title" character varying(255) NOT NULL,
        "image" text,
        "isPublic" boolean NOT NULL DEFAULT true,
        "start_date" TIMESTAMP WITH TIME ZONE NOT NULL,
        "end_date" TIMESTAMP WITH TIME ZONE NOT NULL,
        "start_point" geography(Point,4326) NOT NULL,
        "end_point" geography(Point,4326) NOT NULL,
        "route" geography(LineString,4326),
        "status" "public"."rides_status_enum" NOT NULL DEFAULT 'upcoming',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "ownerId" uuid,
        CONSTRAINT "PK_ca6f62fc1e999b139c7f28f07fd" PRIMARY KEY ("id")
      )
    `);

    // User profile gender update
    await queryRunner.query(`ALTER TABLE "user_profiles" DROP COLUMN "gender"`);
    await queryRunner.query(
      `CREATE TYPE "public"."user_profiles_gender_enum" AS ENUM('male', 'female', 'other')`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_profiles" ADD "gender" "public"."user_profiles_gender_enum" NOT NULL`,
    );

    // Foreign keys
    await queryRunner.query(
      `ALTER TABLE "ride_participants" ADD CONSTRAINT "FK_a811aba344edd629d449171e265" FOREIGN KEY ("rideId") REFERENCES "rides"("id") ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "ride_participants" ADD CONSTRAINT "FK_714076f3a2f3b2de06eba8cab94" FOREIGN KEY ("userId") REFERENCES "users"("id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "rides" ADD CONSTRAINT "FK_79233fc667bfcaa9118a4fecc3e" FOREIGN KEY ("ownerId") REFERENCES "users"("id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop FKs
    await queryRunner.query(
      `ALTER TABLE "rides" DROP CONSTRAINT "FK_79233fc667bfcaa9118a4fecc3e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ride_participants" DROP CONSTRAINT "FK_714076f3a2f3b2de06eba8cab94"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ride_participants" DROP CONSTRAINT "FK_a811aba344edd629d449171e265"`,
    );

    // Revert user_profiles.gender
    await queryRunner.query(`ALTER TABLE "user_profiles" DROP COLUMN "gender"`);
    await queryRunner.query(`DROP TYPE "public"."user_profiles_gender_enum"`);
    await queryRunner.query(
      `ALTER TABLE "user_profiles" ADD "gender" character varying(20)`,
    );

    // Drop rides + participants
    await queryRunner.query(`DROP TABLE "rides"`);
    await queryRunner.query(`DROP TYPE "public"."rides_status_enum"`);
    await queryRunner.query(`DROP TABLE "ride_participants"`);
    await queryRunner.query(
      `DROP TYPE "public"."ride_participants_status_enum"`,
    );
  }
}
