import { describe, expect, it, vi } from 'vitest';
import type { Repository } from 'typeorm';
import { TasksRepository } from '../../src/tasks/tasks.repository.js';
import { TaskEntity } from '../../src/tasks/task.entity.js';

describe('TasksRepository', () => {
  it('counts and paginates with a consistent database snapshot', async () => {
    const findAndCount = vi.fn().mockResolvedValue([[], 12]);
    const manager = {
      getRepository: () => ({ findAndCount }),
    };
    const transaction = vi.fn(
      async (
        _isolation: string,
        callback: (value: typeof manager) => Promise<unknown>,
      ) => callback(manager),
    );
    const tasks = {
      manager: { transaction },
    } as unknown as Repository<TaskEntity>;
    const repository = new TasksRepository(tasks);
    expect(
      await repository.findAll({ status: 'done', page: 2, pageSize: 5 }),
    ).toEqual({ items: [], page: 2, pageSize: 5, total: 12 });
    expect(transaction).toHaveBeenCalledWith(
      'REPEATABLE READ',
      expect.any(Function),
    );
    expect(findAndCount).toHaveBeenCalledWith({
      where: { status: 'done' },
      order: { createdAt: 'DESC', id: 'DESC' },
      take: 5,
      skip: 5,
    });
  });
});
