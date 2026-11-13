import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { timingSafeEqual } from 'node:crypto';
import type { Request } from 'express';

@Injectable()
export class TaskDeletionGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const expected = process.env.TASK_DELETE_PASSWORD;
    const request = context.switchToHttp().getRequest<Request>();
    const supplied = request.get('x-admin-password');

    if (!expected || !supplied) throw new UnauthorizedException();

    const expectedBytes = Buffer.from(expected, 'utf8');
    const suppliedBytes = Buffer.from(supplied, 'utf8');
    if (
      expectedBytes.length !== suppliedBytes.length ||
      !timingSafeEqual(expectedBytes, suppliedBytes)
    ) {
      throw new UnauthorizedException();
    }

    return true;
  }
}
