import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiExcludeEndpoint,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import {
  ChangeTaskStatusDto,
  CreateTaskDto,
  TaskDto,
  TaskPageDto,
} from './task.dto.js';
import {
  parsePositiveInteger,
  parseRequiredTrimmedText,
} from '../common/request-parsers.js';
import {
  CreateTaskInput,
  TASK_STATUSES,
  TaskPageQuery,
  TaskStatus,
  TasksService,
} from './tasks.service.js';

function record(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new BadRequestException('Invalid request');
  }
  return value as Record<string, unknown>;
}

function statusValue(value: unknown): TaskStatus | undefined {
  return typeof value === 'string' &&
    TASK_STATUSES.includes(value as TaskStatus)
    ? (value as TaskStatus)
    : undefined;
}

@Controller('api/tasks')
@ApiTags('Tasks')
@ApiBadRequestResponse({
  description:
    'Invalid input, unsupported status, malformed UUID, or pagination outside the documented bounds.',
})
@ApiInternalServerErrorResponse({
  description:
    'Unexpected server error. Internal details are excluded from the response.',
})
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Delete()
  @HttpCode(204)
  @ApiExcludeEndpoint()
  async removeAll(): Promise<void> {
    await this.tasks.removeAll();
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiExcludeEndpoint()
  async remove(@Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
    if (!(await this.tasks.remove(id))) throw new NotFoundException('Task not found');
  }

  @Get()
  @ApiOperation({
    summary: 'List tasks',
    description:
      'Filters and pagination run in PostgreSQL. Results use created_at DESC and id DESC for deterministic order. An out-of-range page returns empty items and the filtered total.',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: TASK_STATUSES,
    description: 'Omit to list tasks in all states.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    schema: { type: 'integer', minimum: 1, maximum: 1000000, default: 1 },
  })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
  })
  @ApiOkResponse({ type: TaskPageDto })
  list(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    if (status !== undefined && !statusValue(status))
      throw new BadRequestException('Invalid status');
    const query: TaskPageQuery = {
      status: status === undefined ? undefined : statusValue(status),
      page: parsePositiveInteger(page, 'page', 1, 1_000_000),
      pageSize: parsePositiveInteger(pageSize, 'pageSize', 10, 100),
    };
    return this.tasks.findAll(query);
  }

  @Post()
  @ApiOperation({
    summary: 'Create a task',
    description:
      'Creates a task with pending status. The database assigns its UUID. Whitespace-only titles and assignees are rejected.',
  })
  @ApiBody({ type: CreateTaskDto })
  @ApiCreatedResponse({ type: TaskDto })
  create(@Body() body: unknown) {
    const input = record(body);
    const task: CreateTaskInput = {
      title: parseRequiredTrimmedText(input.title, 120, 'title'),
      assignee: parseRequiredTrimmedText(input.assignee, 100, 'assignee'),
    };
    return this.tasks.create(task);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Change task status',
    description: 'Changes only the status and returns the saved task.',
  })
  @ApiParam({
    name: 'id',
    format: 'uuid',
    example: '17c2a87e-2f4b-4bc1-a1a4-58f811732f01',
  })
  @ApiBody({ type: ChangeTaskStatusDto })
  @ApiOkResponse({ type: TaskDto })
  @ApiNotFoundResponse({
    description: 'The UUID is valid but the task does not exist.',
  })
  @ApiConflictResponse({
    description:
      'The task changed after the supplied version was read. Reload it before retrying.',
  })
  async updateStatus(@Param('id') id: string, @Body() body: unknown) {
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        id,
      )
    ) {
      throw new BadRequestException('Invalid task ID');
    }
    const input = record(body);
    const status = statusValue(input.status);
    if (!status) throw new BadRequestException('Invalid status');
    if (input.version === undefined || typeof input.version !== 'number')
      throw new BadRequestException('Task version is required');
    const version = parsePositiveInteger(
      input.version,
      'version',
      1,
      2147483647,
    );
    const task = await this.tasks.updateStatus(id, status, version);
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }
}
