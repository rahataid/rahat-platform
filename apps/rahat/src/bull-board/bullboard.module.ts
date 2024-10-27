import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { BQUEUE, ProjectContants } from '@rahataid/sdk';
import { BullBoardService } from './bullboard.service';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: BQUEUE.RAHAT_BENEFICIARY },
      { name: BQUEUE.RAHAT },
      { name: BQUEUE.RAHAT_PROJECT },
      { name: BQUEUE.HOST },
      { name: BQUEUE.META_TXN }
    ),
    ClientsModule.register([
      {
        name: ProjectContants.ELClient,
        transport: Transport.REDIS,
        options: {
          host: process.env.REDIS_HOST,
          port: +process.env.REDIS_PORT,
          password: process.env.REDIS_PASSWORD
        }
      }
    ]),
  ],
  providers: [BullBoardService],
  exports: [BullBoardService],
})
export class BullBoardModule { }
