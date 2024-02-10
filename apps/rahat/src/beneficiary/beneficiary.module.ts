import { Module } from '@nestjs/common';
import { BeneficiaryController } from './beneficiary.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';

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
  ],
  controllers: [BeneficiaryController],
  providers: [],
})
export class BeneficiaryModule {}
