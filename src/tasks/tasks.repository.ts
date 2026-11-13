import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type {
  CreateTaskInput,
  Task,
  TaskPage,
  TaskPageQuery,
  TaskStatus,
} from './tasks.service.js';
import { TaskEntity } from './task.entity.js';

function taskResponse(entity: TaskEntity): Task {
  return {
    id: entity.id,
    title: entity.title,
    assignee: entity.assignee,
    status: entity.status,
    version: entity.version,
  };
}

@Injectable()
export class TasksRepository {
  constructor(
    @InjectRepository(TaskEntity)
    private readonly tasks: Repository<TaskEntity>,
  ) {}

  async findAll(query: TaskPageQuery): Promise<TaskPage> {
    const [entities, total] = await this.tasks.manager.transaction(
      'REPEATABLE READ',
      (manager) =>
        manager.getRepository(TaskEntity).findAndCount({
          where: query.status ? { status: query.status } : {},
          order: { createdAt: 'DESC', id: 'DESC' },
          take: query.pageSize,
          skip: (query.page - 1) * query.pageSize,
        }),
    );
    return {
      items: entities.map(taskResponse),
      page: query.page,
      pageSize: query.pageSize,
      total,
    };
  }

  async create(input: CreateTaskInput): Promise<Task> {
    return taskResponse(await this.tasks.save(this.tasks.create(input)));
  }

  async remove(id: string): Promise<boolean> {
    const result = await this.tasks.delete({ id });
    return result.affected === 1;
  }

  async removeAll(): Promise<void> {
    await this.tasks.clear();
  }

  async updateStatus(
    id: string,
    status: TaskStatus,
    version: number,
  ): Promise<Task | undefined> {
    const result = await this.tasks
      .createQueryBuilder()
      .update(TaskEntity)
      .set({ status, version: () => '"version" + 1' })
      .where('id = :id AND version = :version', { id, version })
      .returning(['id', 'title', 'assignee', 'status', 'version'])
      .execute();
    const saved = (result.raw as Task[])[0];
    if (saved) return saved;
    if (await this.tasks.existsBy({ id })) {
      throw new ConflictException(
        'Task was updated by another client. Reload and retry.',
      );
    }
    return undefined;
  }
}
