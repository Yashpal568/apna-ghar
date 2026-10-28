import { Controller, Get, Inject, Res } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import type { Response } from 'express';
import type { Connection } from 'mongoose';

@Controller('health')
export class HealthController {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  @Get()
  getHealth() {
    return {
      status: 'ok' as const,
      service: 'apna-ghar-api' as const,
      timestamp: new Date().toISOString(),
      note: 'Liveness only; database readiness is reported separately.',
    };
  }

  @Get('ready')
  getReadiness(@Res() response: Response) {
    const databaseReady = this.connection.readyState === 1;
    return response.status(databaseReady ? 200 : 503).json({
      status: databaseReady ? 'ready' : 'not_ready',
      service: 'apna-ghar-api',
      checks: { database: databaseReady ? 'connected' : 'disconnected' },
      timestamp: new Date().toISOString(),
    });
  }
}
