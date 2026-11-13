import { createDataSource } from './data-source.mjs';

const database = await createDataSource().initialize();
const lock = database.createQueryRunner();

try {
  await lock.connect();
  await lock.query('SELECT pg_advisory_lock(72026001)');
  await database.runMigrations();
} finally {
  await lock.query('SELECT pg_advisory_unlock(72026001)');
  await lock.release();
  await database.destroy();
}
