import { ApiProperty } from '@nestjs/swagger';
import { TASK_STATUSES } from './tasks.service.js';
import type { TaskStatus } from './tasks.service.js';

export class CreateTaskDto {
  @ApiProperty({
    example: 'Prepare the weekly report',
    minLength: 1,
    maxLength: 120,
    description: 'Required title, trimmed before validation.',
  })
  title!: string;

  @ApiProperty({
    example: 'Ana Torres',
    minLength: 1,
    maxLength: 100,
    description: 'Required assignee, trimmed before validation.',
  })
  assignee!: string;
}

export class ChangeTaskStatusDto {
  @ApiProperty({
    enum: TASK_STATUSES,
    example: 'in_progress',
    description: 'The new status. All three states can be selected.',
  })
  status!: TaskStatus;

  @ApiProperty({
    type: 'integer',
    minimum: 1,
    example: 1,
    description:
      'Version returned when this task was read. Stale versions produce HTTP 409.',
  })
  version!: number;
}

export class TaskDto extends CreateTaskDto {
  @ApiProperty({
    format: 'uuid',
    example: '17c2a87e-2f4b-4bc1-a1a4-58f811732f01',
  })
  id!: string;

  @ApiProperty({ enum: TASK_STATUSES, example: 'pending' })
  status!: TaskStatus;

  @ApiProperty({ type: 'integer', minimum: 1, example: 1 })
  version!: number;
}

export class TaskPageDto {
  @ApiProperty({ type: [TaskDto] })
  items!: TaskDto[];

  @ApiProperty({ minimum: 1, example: 1 })
  page!: number;

  @ApiProperty({ minimum: 1, maximum: 100, example: 10 })
  pageSize!: number;

  @ApiProperty({
    minimum: 0,
    example: 12,
    description:
      'Total number of tasks matching the filter, including other pages.',
  })
  total!: number;
}
