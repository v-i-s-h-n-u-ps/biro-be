import { spawnSync } from 'child_process';
import { dataSource } from 'database/datasource';

async function generateMigration() {
  const migrationName = process.env.npm_config_name;

  if (!migrationName) {
    console.error(
      '❌ Please provide a migration name: npm run migrate:generate --name=MigrationName',
    );
    process.exit(1);
  }

  try {
    await dataSource.initialize();

    // Check for pending migrations
    const pendingMigrations = await dataSource.showMigrations();
    if (pendingMigrations) {
      console.error(
        '❌ There are pending migrations. Apply them first with `npm run migrate:run`',
      );
      await dataSource.destroy();
      process.exit(1);
    }

    await dataSource.destroy();

    // Run TypeORM generate command
    const result = spawnSync(
      'ts-node',
      [
        '-r',
        'tsconfig-paths/register',
        './node_modules/typeorm/cli.js',
        '-d',
        './database/datasource.ts',
        'migration:generate',
        `./database/migrations/${migrationName}`,
      ],
      { stdio: 'inherit', shell: true },
    );

    process.exit(result.status ?? 1);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

generateMigration();
