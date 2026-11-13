import { Module } from '@nestjs/common';
import { TasksController } from './tasks.controller.js';
import { TasksRepository } from './tasks.repository.js';
import { TasksService } from './tasks.service.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskEntity } from './task.entity.js';
import { TaskDeletionGuard } from './task-deletion.guard.js';

@Module({
  imports: [TypeOrmModule.forFeature([TaskEntity])],
  controllers: [TasksController],
  providers: [TasksService, TasksRepository, TaskDeletionGuard],
})
export class TasksModule {}
