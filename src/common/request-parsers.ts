import { BadRequestException } from '@nestjs/common';

export function parsePositiveInteger(
  value: unknown,
  name: string,
  defaultValue: number,
  max: number,
): number {
  if (value === undefined) return defaultValue;
  const normalized =
    typeof value === 'string'
      ? value
      : typeof value === 'number'
        ? String(value)
        : '';
  if (!/^\d+$/.test(normalized))
    throw new BadRequestException(`Invalid ${name}`);
  const parsed = Number(normalized);
  if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > max) {
    throw new BadRequestException(`Invalid ${name}`);
  }
  return parsed;
}

export function parseRequiredTrimmedText(
  value: unknown,
  maxLength: number,
  field: string,
): string {
  if (typeof value !== 'string')
    throw new BadRequestException(`Invalid ${field}`);
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > maxLength)
    throw new BadRequestException(`Invalid ${field}`);
  return trimmed;
}
