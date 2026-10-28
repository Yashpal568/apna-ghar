import { Test } from '@nestjs/testing';
import { getConnectionToken } from '@nestjs/mongoose';
import type { Connection } from 'mongoose';
import { HealthController } from '../src/health/health.controller';

describe('Health HTTP (e2e)', () => {
  let app: Awaited<ReturnType<Awaited<ReturnType<typeof Test.createTestingModule>>['createNestApplication']>>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: getConnectionToken(),
          useValue: { readyState: 1 } as Pick<Connection, 'readyState'>,
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.listen(0);
  });

  afterAll(async () => {
    await app?.close();
  });

  it('serves liveness over HTTP without depending on database readiness', async () => {
    const response = await fetch(`${await app.getUrl()}/api/v1/health`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(
      expect.objectContaining({
        status: 'ok',
        service: 'apna-ghar-api',
      }),
    );
  });

  it('serves database readiness over HTTP', async () => {
    const response = await fetch(`${await app.getUrl()}/api/v1/health/ready`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(
      expect.objectContaining({
        status: 'ready',
        checks: { database: 'connected' },
      }),
    );
  });
});
