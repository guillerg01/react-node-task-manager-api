import { readFile } from 'node:fs/promises';
import { DataSource } from 'typeorm';

class CreateTasks1794590000000 {
  async up(runner) {
    const sql = await readFile(
      new URL('../migrations/001_create_tasks.sql', import.meta.url),
      'utf8',
    );
    await runner.query(sql);
  }

  async down(runner) {
    await runner.query('DROP TABLE tasks');
  }
}

class AddTaskVersion1794590001000 {
  async up(runner) {
    await runner.query(
      'ALTER TABLE tasks ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0)',
    );
  }

  async down(runner) {
    await runner.query('ALTER TABLE tasks DROP COLUMN version');
  }
}

export function createDataSource() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
  return new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    migrations: [CreateTasks1794590000000, AddTaskVersion1794590001000],
    migrationsTransactionMode: 'all',
    synchronize: false,
    poolSize: 3,
    extra: { connectionTimeoutMillis: 5000 },
  });
}
