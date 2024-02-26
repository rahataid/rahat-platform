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
        transport: Transport.TCP,
        options: {
          port: +process.env.PORT_BEN,
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
