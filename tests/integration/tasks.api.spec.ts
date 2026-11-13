import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { DataSource } from 'typeorm';
import { TasksRepository } from '../../src/tasks/tasks.repository.js';
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { Pool } from 'pg';
import { createApp } from '../../src/app.js';

const testUrl = process.env.TEST_DATABASE_URL;
if (!testUrl || !new URL(testUrl).pathname.endsWith('_test'))
  throw new Error('A dedicated TEST_DATABASE_URL is required');

let app: INestApplication;
let pool: Pool;

describe('task API', () => {
  beforeAll(async () => {
    pool = new Pool({ connectionString: testUrl });
    process.env.DATABASE_URL = testUrl;
    process.env.NODE_ENV = 'test';
    app = await createApp();
    await app.init();
  });

  beforeEach(async () => {
    await pool.query('TRUNCATE TABLE tasks');
  });

  afterAll(async () => {
    await app?.close();
    await pool?.end();
  });

  it('creates, lists, filters, and updates tasks', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/tasks')
      .send({ title: ' Write tests ', assignee: ' Lee ' })
      .expect(201);
    expect(created.body).toMatchObject({
      title: 'Write tests',
      assignee: 'Lee',
      status: 'pending',
    });
    expect(created.body.id).toMatch(/^[0-9a-f-]{36}$/i);
    expect(
      (await request(app.getHttpServer()).get('/api/tasks').expect(200)).body,
    ).toEqual({
      items: [created.body],
      page: 1,
      pageSize: 10,
      total: 1,
    });
    expect(
      (
        await request(app.getHttpServer())
          .get('/api/tasks?status=done')
          .expect(200)
      ).body,
    ).toEqual({
      items: [],
      page: 1,
      pageSize: 10,
      total: 0,
    });
    const updated = await request(app.getHttpServer())
      .patch(`/api/tasks/${created.body.id}/status`)
      .send({ status: 'in_progress', version: 1 })
      .expect(200);
    expect(updated.body.status).toBe('in_progress');
  });

  it('validates request values and unknown UUIDs', async () => {
    await request(app.getHttpServer())
      .post('/api/tasks')
      .send({ title: '', assignee: 'Lee' })
      .expect(400);
    await request(app.getHttpServer())
      .post('/api/tasks')
      .send({ title: 'x'.repeat(121), assignee: 'Lee' })
      .expect(400);
    await request(app.getHttpServer()).get('/api/tasks?status=bad').expect(400);
    await request(app.getHttpServer()).get('/api/tasks?page=0').expect(400);
    await request(app.getHttpServer())
      .get('/api/tasks?page=1000001')
      .expect(400);
    await request(app.getHttpServer())
      .get('/api/tasks?pageSize=101')
      .expect(400);
    await request(app.getHttpServer()).get('/api/tasks?page=1.5').expect(400);
    await request(app.getHttpServer())
      .patch('/api/tasks/not-a-uuid/status')
      .send({ status: 'done', version: 1 })
      .expect(400);
    await request(app.getHttpServer())
      .patch('/api/tasks/f07ed1b2-32d6-4a56-a1ed-c945495f8449/status')
      .send({ status: 'blocked' })
      .expect(400);
    await request(app.getHttpServer())
      .patch('/api/tasks/f07ed1b2-32d6-4a56-a1ed-c945495f8449/status')
      .send({ status: 'done', version: 1 })
      .expect(404);
  });

  it('returns deterministic pages and accurate totals, including empty pages', async () => {
    const firstId = 'f07ed1b2-32d6-4a56-a1ed-c945495f8449';
    const secondId = 'e07ed1b2-32d6-4a56-a1ed-c945495f8449';
    const thirdId = 'd07ed1b2-32d6-4a56-a1ed-c945495f8449';
    await pool.query(
      'INSERT INTO tasks (id, title, assignee, status, created_at) VALUES ($1, $2, $3, $4, $5), ($6, $7, $8, $9, $10), ($11, $12, $13, $14, $15)',
      [
        firstId,
        'First',
        'Lee',
        'pending',
        '2026-01-01T00:00:00Z',
        secondId,
        'Second',
        'Lee',
        'done',
        '2026-01-02T00:00:00Z',
        thirdId,
        'Third',
        'Lee',
        'pending',
        '2026-01-02T00:00:00Z',
      ],
    );
    const secondPage = await request(app.getHttpServer())
      .get('/api/tasks?page=2&pageSize=1')
      .expect(200);
    expect(secondPage.body).toEqual({
      items: [
        {
          id: thirdId,
          title: 'Third',
          assignee: 'Lee',
          status: 'pending',
          version: 1,
        },
      ],
      page: 2,
      pageSize: 1,
      total: 3,
    });
    const filtered = await request(app.getHttpServer())
      .get('/api/tasks?status=pending&page=2&pageSize=1')
      .expect(200);
    expect(filtered.body).toEqual({
      items: [
        {
          id: firstId,
          title: 'First',
          assignee: 'Lee',
          status: 'pending',
          version: 1,
        },
      ],
      page: 2,
      pageSize: 1,
      total: 2,
    });
    const empty = await request(app.getHttpServer())
      .get('/api/tasks?page=100&pageSize=1')
      .expect(200);
    expect(empty.body).toEqual({ items: [], page: 100, pageSize: 1, total: 3 });
  });

  it('keeps tasks in PostgreSQL after the app restarts', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/tasks')
      .send({ title: 'Persist', assignee: 'Lee' })
      .expect(201);
    await app.close();
    app = await createApp();
    await app.init();
    const listed = await request(app.getHttpServer())
      .get('/api/tasks')
      .expect(200);
    expect(listed.body.items).toEqual([created.body]);
  });

  it('checks database health', async () => {
    await request(app.getHttpServer())
      .get('/health')
      .expect(200, { status: 'ok' });
  });

  it('returns safe server errors and unavailable health on infrastructure failures', async () => {
    const repository = app.get(TasksRepository);
    const read = vi.spyOn(repository, 'findAll').mockRejectedValue(new Error('Internal database detail'));
    try {
      const response = await request(app.getHttpServer()).get('/api/tasks').expect(500);
      expect(response.body.message).toBe('Internal server error');
      expect(JSON.stringify(response.body)).not.toContain('Internal database detail');
    } finally {
      read.mockRestore();
    }
    const database = app.get(DataSource);
    const health = vi.spyOn(database, 'query').mockRejectedValue(new Error('Connection unavailable'));
    try {
      await request(app.getHttpServer()).get('/health').expect(503);
    } finally {
      health.mockRestore();
    }
  });

  it('rejects a concurrent status write using a stale task version', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/tasks')
      .send({ title: 'Shared task', assignee: 'Ana' })
      .expect(201);
    const responses = await Promise.all([
      request(app.getHttpServer())
        .patch(`/api/tasks/${created.body.id}/status`)
        .send({ status: 'done', version: 1 }),
      request(app.getHttpServer())
        .patch(`/api/tasks/${created.body.id}/status`)
        .send({ status: 'in_progress', version: 1 }),
    ]);
    expect(responses.map((response) => response.status).sort()).toEqual([
      200, 409,
    ]);
    const winner = responses.find((response) => response.status === 200);
    expect(winner?.body.version).toBe(2);
  });

  it('publishes the task contract through OpenAPI', async () => {
    const response = await request(app.getHttpServer())
      .get('/docs-json')
      .expect(200);
    expect(response.body.paths['/api/tasks'].post.responses).toHaveProperty(
      '201',
    );
    expect(
      response.body.paths['/api/tasks/{id}/status'].patch.responses,
    ).toHaveProperty('404');
    expect(
      response.body.components.schemas.TaskPageDto.properties,
    ).toHaveProperty('total');
    expect(response.body.components.schemas.CreateTaskDto.required).toEqual([
      'title',
      'assignee',
    ]);
  });
});
