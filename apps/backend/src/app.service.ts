import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  async getHealth() {
    await this.prisma.$queryRaw`SELECT 1`;
    return {
      data: {
        status: 'ok',
        service: 'studycasempa-backend',
        database: 'up',
        timestamp: new Date().toISOString(),
      },
      message: 'Service healthy',
    };
  }
}
