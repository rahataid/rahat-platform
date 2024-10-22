import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { EventEmitter2, EventEmitterModule } from '@nestjs/event-emitter';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { BQUEUE, ProjectContants } from '@rahataid/sdk';
import { PrismaService } from '@rumsan/prisma';
import { BeneficiaryModule } from '../beneficiary/beneficiary.module';
import { BeneficiaryProcessor } from './beneficiary.processor';


@Module({
  imports: [
    ClientsModule.register([
      {
        name: ProjectContants.ELClient,
        transport: Transport.REDIS,
        options: {
          host: process.env.REDIS_HOST,
          port: +process.env.REDIS_PORT,
          password: process.env.REDIS_PASSWORD,
        },
      },
    ]),
    BullModule.registerQueue({
      name: BQUEUE.RAHAT_BENEFICIARY,
    }),
    BeneficiaryModule, EventEmitterModule],
  providers: [PrismaService, BeneficiaryProcessor, EventEmitter2],
  exports: [BeneficiaryProcessor],
})
export class ProcessorsModule { }