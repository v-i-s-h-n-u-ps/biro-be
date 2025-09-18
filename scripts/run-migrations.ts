import { dataSource } from 'database/datasource';

async function runMigrations() {
  try {
    await dataSource.initialize();
    console.log('📦 Running migrations...');

    await dataSource.runMigrations();
    console.log('🟢 All migrations applied successfully');

    await dataSource.destroy();
  } catch (err) {
    console.error('💥 Error running migrations:', err);
    process.exit(1);
  }
}

runMigrations();
