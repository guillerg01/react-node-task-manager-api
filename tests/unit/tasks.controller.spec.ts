import { describe, expect, it, vi } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TasksController } from '../../src/tasks/tasks.controller.js';
import { TasksService, Task, TaskPage } from '../../src/tasks/tasks.service.js';

function controllerWith(tasks: Partial<TasksService>) {
  return new TasksController(tasks as TasksService);
}

const example: Task = {
  id: 'f07ed1b2-32d6-4a56-a1ed-c945495f8449',
  title: 'Plan release',
  assignee: 'Sam',
  status: 'pending',
  version: 1,
};
const page: TaskPage = { items: [example], page: 1, pageSize: 10, total: 1 };

describe('TasksController', () => {
  it('trims and creates a task', async () => {
    const create = vi.fn().mockResolvedValue(example);
    const controller = controllerWith({ create });
    await expect(
      controller.create({ title: ' Plan release ', assignee: ' Sam ' }),
    ).resolves.toEqual(example);
    expect(create).toHaveBeenCalledWith({
      title: 'Plan release',
      assignee: 'Sam',
    });
  });

  it.each([
    { title: ' ', assignee: 'Sam' },
    { title: 'x'.repeat(121), assignee: 'Sam' },
    { title: 'Title', assignee: '' },
    { title: 'Title', assignee: 'x'.repeat(101) },
    null,
  ])('rejects invalid task input', (body) => {
    expect(() => controllerWith({}).create(body)).toThrow(BadRequestException);
  });

  it('applies pagination defaults and validates the status filter', async () => {
    const findAll = vi.fn().mockResolvedValue(page);
    const controller = controllerWith({ findAll });
    await expect(controller.list()).resolves.toEqual(page);
    expect(findAll).toHaveBeenCalledWith({
      page: 1,
      pageSize: 10,
      status: undefined,
    });
    await controller.list('pending', '3', '25');
    expect(findAll).toHaveBeenLastCalledWith({
      page: 3,
      pageSize: 25,
      status: 'pending',
    });
    expect(() => controller.list('invalid')).toThrow(BadRequestException);
  });

  it.each([
    ['0', undefined],
    ['1000001', undefined],
    [undefined, '101'],
    ['1.5', undefined],
    [undefined, '0'],
  ])('rejects invalid pagination values', (requestedPage, requestedSize) => {
    expect(() =>
      controllerWith({}).list(undefined, requestedPage, requestedSize),
    ).toThrow(BadRequestException);
  });

  it('returns not found for a missing task', async () => {
    const updateStatus = vi.fn().mockResolvedValue(undefined);
    const controller = controllerWith({ updateStatus });
    await expect(
      controller.updateStatus('f07ed1b2-32d6-4a56-a1ed-c945495f8449', {
        status: 'done',
        version: 1,
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('rejects invalid update status', async () => {
    await expect(
      controllerWith({}).updateStatus('f07ed1b2-32d6-4a56-a1ed-c945495f8449', {
        status: 'blocked',
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
