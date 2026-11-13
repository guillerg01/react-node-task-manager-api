import 'reflect-metadata';
import { Logger, Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { DatabaseModule } from './database/database.module.js';
import { HealthController } from './health.controller.js';
import { TasksModule } from './tasks/tasks.module.js';

@Module({
  imports: [DatabaseModule, TasksModule],
  controllers: [HealthController],
})
class AppModule {}

export async function createApp() {
  const app = await NestFactory.create(AppModule, {
    logger: process.env.NODE_ENV === 'test' ? false : new Logger(),
  });
  const configured = process.env.WEB_ORIGIN?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  const origins = configured?.length
    ? configured
    : ['http://localhost:5173', 'http://127.0.0.1:5173'];
  app.enableCors({ origin: origins });
  app.enableShutdownHooks();
  const documentation = new DocumentBuilder()
    .setTitle('Task Manager API')
    .setDescription(
      'Create tasks, list them by status and page, and change their status. The public demo is shared and persists data in PostgreSQL. Requests and responses use JSON.',
    )
    .setVersion('1.0.0')
    .addTag(
      'Tasks',
      'Task creation, filtering, pagination, and status updates.',
    )
    .addTag('Health', 'Database connectivity.')
    .build();
  SwaggerModule.setup(
    'docs',
    app,
    () => SwaggerModule.createDocument(app, documentation),
    {
      swaggerOptions: { docExpansion: 'list' },
    },
  );
  return app;
}
