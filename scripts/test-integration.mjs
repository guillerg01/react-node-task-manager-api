import { spawnSync } from 'node:child_process';

const challengeNode = process.execPath;
const testDatabaseUrl = process.env.TEST_DATABASE_URL;
if (!testDatabaseUrl)
  throw new Error('TEST_DATABASE_URL is required for integration tests');
const databaseName = new URL(testDatabaseUrl).pathname.slice(1);
if (!databaseName.endsWith('_test'))
  throw new Error('TEST_DATABASE_URL must point to a database ending in _test');
const env = { ...process.env, DATABASE_URL: testDatabaseUrl };
const migration = spawnSync(challengeNode, ['scripts/migrate.mjs'], {
  env,
  stdio: 'inherit',
});
if (migration.status !== 0) process.exit(migration.status ?? 1);
const tests = spawnSync(
  challengeNode,
  [
    'node_modules/vitest/vitest.mjs',
    'run',
    '--config',
    'vitest.integration.config.mjs',
  ],
  { env, stdio: 'inherit' },
);
process.exit(tests.status ?? 1);
