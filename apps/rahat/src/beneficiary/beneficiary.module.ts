import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { BQUEUE, BeneficiaryConstants } from '@rahataid/sdk';
import { BeneficiaryController } from './beneficiary.controller';

@Module({
  imports: [
    ClientsModule.register([

      //Beneficiary Redis microservice

      {
        name: BeneficiaryConstants.Client,
        transport: Transport.REDIS,
        options: {
          host: process.env.REDIS_HOST,
          port: +process.env.REDIS_PORT,
          password: process.env.REDIS_PASSWORD,
          retryAttempts: 10,
          retryDelay: 2000,
        },
      },

      //Beneficiary TCP microservice
      // {
      //   name: BeneficiaryConstants.Client,
      //   transport: Transport.TCP,
      //   options: {
      //     port: Number(process.env.PORT_BEN),
      //   },
      // },
    ]),
    BullModule.registerQueue({
      name: BQUEUE.RAHAT,
    }),
  ],
  controllers: [BeneficiaryController],
  providers: [],
})
export class BeneficiaryModule { }
