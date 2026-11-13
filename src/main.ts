import { createApp } from './app.js';

async function bootstrap() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
  const app = await createApp();
  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port, '0.0.0.0');
}

void bootstrap();
