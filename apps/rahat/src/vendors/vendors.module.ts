// This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
// If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { BQUEUE, ProjectContants } from '@rahataid/sdk';
import { AuthsModule, UsersModule } from '@rumsan/user';
import { WalletModule } from '../wallet/wallet.module';
import { WalletService } from '../wallet/wallet.service';
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
      },

    ]),
    BullModule.registerQueue({
      name: BQUEUE.RAHAT
    }),
    AuthsModule,
    UsersModule,
    WalletModule
  ],
  controllers: [VendorsController],
  providers: [VendorsService, WalletService]
})
export class AppUsersModule { }
