import { describe, expect, it, vi } from 'vitest';
import { TasksService } from '../../src/tasks/tasks.service.js';
import { TasksRepository } from '../../src/tasks/tasks.repository.js';

describe('TasksService', () => {
  it('delegates listing, creation, and status changes', async () => {
    const repository = {
      findAll: vi
        .fn()
        .mockResolvedValue({ items: [], page: 1, pageSize: 10, total: 0 }),
      create: vi.fn().mockResolvedValue({ id: 'id' }),
      updateStatus: vi.fn().mockResolvedValue({ id: 'id' }),
    } as unknown as TasksRepository;
    const service = new TasksService(repository);
    await expect(
      service.findAll({ status: 'done', page: 1, pageSize: 10 }),
    ).resolves.toEqual({ items: [], page: 1, pageSize: 10, total: 0 });
    await expect(
      service.create({ title: 'Title', assignee: 'Sam' }),
    ).resolves.toEqual({ id: 'id' });
    await expect(service.updateStatus('id', 'done', 1)).resolves.toEqual({
      id: 'id',
    });
    expect(repository.findAll).toHaveBeenCalledWith({
      status: 'done',
      page: 1,
      pageSize: 10,
    });
    expect(repository.create).toHaveBeenCalledWith({
      title: 'Title',
      assignee: 'Sam',
    });
    expect(repository.updateStatus).toHaveBeenCalledWith('id', 'done', 1);
  });
});
