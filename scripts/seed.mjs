import { readFile } from 'node:fs/promises';
import { createDataSource } from './data-source.mjs';

const sql = await readFile(
  new URL('../seeds/demo-tasks.sql', import.meta.url),
  'utf8',
);
const database = await createDataSource().initialize();

try {
  const rows = await database.query(sql);
  console.log(`Inserted ${rows.length} demo tasks.`);
} finally {
  await database.destroy();
}
