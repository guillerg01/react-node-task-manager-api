import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { DataSource } from 'typeorm';

@Controller('health')
@ApiTags('Health')
export class HealthController {
  constructor(private readonly database: DataSource) {}

  @Get()
  @ApiOperation({ summary: 'Check database availability' })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: { status: { type: 'string', example: 'ok' } },
    },
  })
  @ApiServiceUnavailableResponse({
    description: 'The database cannot be reached.',
  })
  async check() {
    try {
      await this.database.query('SELECT 1');
      return { status: 'ok' };
    } catch {
      throw new ServiceUnavailableException('Service unavailable');
    }
  }
}
