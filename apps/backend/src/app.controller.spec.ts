import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: {
            getHealth: jest.fn().mockResolvedValue({
              data: {
                status: 'ok',
                service: 'studycasempa-backend',
                database: 'up',
                timestamp: '2026-01-01T00:00:00.000Z',
              },
              message: 'Service healthy',
            }),
          },
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('health', () => {
    it('should return health payload', async () => {
      await expect(appController.getHealth()).resolves.toMatchObject({
        message: 'Service healthy',
        data: { status: 'ok', database: 'up' },
      });
    });
  });
});
