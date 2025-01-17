import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { BQUEUE, ProjectContants } from '@rahataid/sdk';
import { PrismaService } from '@rumsan/prisma';
import { QueueController } from './queue.controller';
import { QueueService } from './queue.service';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: ProjectContants.ELClient,
        transport: Transport.REDIS,
        options: {
          host: process.env['REDIS_HOST'] || 'localhost',
          port: parseInt(process.env['REDIS_PORT'] || '6379'),
          password: process.env['REDIS_PASSWORD'] || '',
        },
      },
    ]),
    BullModule.registerQueue({
      name: 'CONTRACT',
    }),
    BullModule.registerQueue({
      name: BQUEUE.RAHAT_BENEFICIARY,
    }),
    BullModule.registerQueue({
      name: BQUEUE.RAHAT,
    }),
    BullModule.registerQueue({
      name: BQUEUE.RAHAT,
    }),
    BullModule.registerQueue({
      name: BQUEUE.META_TXN
    }),
  ],
  providers: [PrismaService, QueueService],
  controllers: [QueueController],
  exports: [QueueService],
})
export class QueueModule { }