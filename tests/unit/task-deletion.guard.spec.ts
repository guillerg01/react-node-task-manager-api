import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { TaskDeletionGuard } from '../../src/tasks/task-deletion.guard.js';

function contextWith(password?: string): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        get: (header: string) =>
          header === 'x-admin-password' ? password : undefined,
      }),
    }),
  } as ExecutionContext;
}

describe('TaskDeletionGuard', () => {
  beforeEach(() => {
    vi.stubEnv('TASK_DELETE_PASSWORD', 'test-secret');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('allows the configured password', () => {
    expect(
      new TaskDeletionGuard().canActivate(contextWith('test-secret')),
    ).toBe(true);
  });

  it.each([undefined, ''])('rejects an unconfigured secret', (secret) => {
    vi.stubEnv('TASK_DELETE_PASSWORD', secret);
    expect(() =>
      new TaskDeletionGuard().canActivate(contextWith('test-secret')),
    ).toThrow(UnauthorizedException);
  });

  it.each([undefined, '', 'wrong-value', 'short', 'test-secré'])(
    'rejects a missing or incorrect header without exposing the secret',
    (password) => {
      try {
        new TaskDeletionGuard().canActivate(contextWith(password));
        expect.unreachable();
      } catch (error) {
        expect(error).toBeInstanceOf(UnauthorizedException);
        expect((error as UnauthorizedException).getResponse()).toEqual({
          message: 'Unauthorized',
          statusCode: 401,
        });
      }
    },
  );
});
