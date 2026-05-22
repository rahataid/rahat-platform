import { Module } from '@nestjs/common';
import { PrismaService } from '@rumsan/prisma';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  controllers: [DashboardController],
  providers: [DashboardService, PrismaService],
})
export class DashboardModule {}
