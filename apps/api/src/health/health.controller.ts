import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  getHealth() {
    return {
      status: 'ok',
      service: 'apna-ghar-api',
      timestamp: new Date().toISOString(),
      note: 'Liveness only; database readiness is not asserted.',
    };
  }
}
