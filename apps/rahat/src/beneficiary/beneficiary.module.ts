import { Module } from '@nestjs/common';
import { BeneficiaryController } from './beneficiary.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { BullModule } from '@nestjs/bull';
import { BQUEUE } from '@rahat/sdk';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'BEN_CLIENT',
        transport: Transport.REDIS,
        options: {
          host: process.env.REDIS_HOST,
          port: +process.env.REDIS_PORT,
          password: process.env.REDIS_PASSWORD,
        },
      },
    ]),
    BullModule.registerQueue({
      name: BQUEUE.RAHAT,
    }),
  ],
  controllers: [BeneficiaryController],
  providers: [],
})
export class BeneficiaryModule {}
