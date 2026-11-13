import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  VersionColumn,
} from 'typeorm';
import type { TaskStatus } from './tasks.service.js';

@Entity('tasks')
export class TaskEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 120 })
  title!: string;

  @Column({ type: 'varchar', length: 100 })
  assignee!: string;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status!: TaskStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @VersionColumn({ type: 'integer', default: 1 })
  version!: number;
}
