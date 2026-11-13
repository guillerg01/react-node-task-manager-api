import { describe, expect, it } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import {
  parsePositiveInteger,
  parseRequiredTrimmedText,
} from '../../src/common/request-parsers.js';

describe('request parsers', () => {
  it('parses bounded positive integers and applies defaults', () => {
    expect(parsePositiveInteger(undefined, 'page', 1, 1_000_000)).toBe(1);
    expect(parsePositiveInteger('100', 'pageSize', 10, 100)).toBe(100);
  });

  it.each([
    '0',
    '-1',
    '1.5',
    '1e2',
    '1000001',
    '',
    'abc',
    Number.NaN,
    Number.POSITIVE_INFINITY,
  ])('rejects invalid pagination value %s', (value) =>
    expect(() => parsePositiveInteger(value, 'page', 1, 1_000_000)).toThrow(
      BadRequestException,
    ),
  );

  it('trims required text and enforces its feature supplied limit', () => {
    expect(parseRequiredTrimmedText('  title  ', 120, 'title')).toBe('title');
    expect(() => parseRequiredTrimmedText('  ', 120, 'title')).toThrow(
      BadRequestException,
    );
    expect(() =>
      parseRequiredTrimmedText('x'.repeat(121), 120, 'title'),
    ).toThrow(BadRequestException);
  });
});
