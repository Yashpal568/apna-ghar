import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();
    controller = module.get<HealthController>(HealthController);
  });

  it('returns an API liveness response', () => {
    expect(controller.getHealth().status).toBe('ok');
    expect(controller.getHealth().service).toBe('apna-ghar-api');
  });
});
