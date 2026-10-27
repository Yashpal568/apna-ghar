import { Test, TestingModule } from '@nestjs/testing';
import { getConnectionToken } from '@nestjs/mongoose';
import type { Connection } from 'mongoose';
import type { Response } from 'express';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;
  let connection: { readyState: number };

  beforeEach(async () => {
    connection = { readyState: 1 };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: getConnectionToken(), useValue: connection }],
    }).compile();
    controller = module.get<HealthController>(HealthController);
  });

  it('returns an API liveness response without asserting database state', () => {
    expect(controller.getHealth().status).toBe('ok');
    expect(controller.getHealth().service).toBe('apna-ghar-api');
  });

  it('returns ready only when MongoDB is connected', () => {
    const response = { status: jest.fn().mockReturnThis(), json: jest.fn() } as unknown as Response;
    controller.getReadiness(response);
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({
      status: 'ready',
      checks: { database: 'connected' },
    }));
  });

  it('returns not ready when MongoDB is disconnected', () => {
    connection.readyState = 0;
    const response = { status: jest.fn().mockReturnThis(), json: jest.fn() } as unknown as Response;
    controller.getReadiness(response);
    expect(response.status).toHaveBeenCalledWith(503);
    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({
      status: 'not_ready',
      checks: { database: 'disconnected' },
    }));
  });
});
