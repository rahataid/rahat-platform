import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { BQUEUE, ProjectContants } from '@rahataid/sdk';
import { AuthsModule } from '@rumsan/user';
import { VendorsController } from './vendors.controller';
import { VendorsService } from './vendors.service';

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
      }
    ]),
    BullModule.registerQueue({
      name: BQUEUE.RAHAT,
    }),
    AuthsModule
  ],
  controllers: [VendorsController],
  providers: [VendorsService],
})
export class VendorsModule { }
