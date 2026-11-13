import { Injectable } from '@nestjs/common';
import { TasksRepository } from './tasks.repository.js';

export const TASK_STATUSES = ['pending', 'in_progress', 'done'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export interface Task {
  id: string;
  title: string;
  assignee: string;
  status: TaskStatus;
  version: number;
}

export interface CreateTaskInput {
  title: string;
  assignee: string;
}

export interface TaskPageQuery {
  status?: TaskStatus;
  page: number;
  pageSize: number;
}

export interface TaskPage {
  items: Task[];
  page: number;
  pageSize: number;
  total: number;
}

@Injectable()
export class TasksService {
  constructor(private readonly repository: TasksRepository) {}

  findAll(query: TaskPageQuery): Promise<TaskPage> {
    return this.repository.findAll(query);
  }

  create(input: CreateTaskInput): Promise<Task> {
    return this.repository.create(input);
  }

  remove(id: string): Promise<boolean> {
    return this.repository.remove(id);
  }

  removeAll(): Promise<void> {
    return this.repository.removeAll();
  }

  updateStatus(
    id: string,
    status: TaskStatus,
    version: number,
  ): Promise<Task | undefined> {
    return this.repository.updateStatus(id, status, version);
  }
}
