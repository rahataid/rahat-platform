// This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
// If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { BQUEUE, ProjectContants } from '@rahataid/sdk';
import { SettingsModule } from '@rumsan/extensions/settings';
import { PrismaService } from '@rumsan/prisma';
import { AuthsModule, SignupModule } from '@rumsan/user';
import { NotificationModule } from '../notification/notification.module';
import { UsersModule } from '../users/users.module';
import { FileWalletStorage } from '../wallet/storages/fs.storage';
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
    SettingsModule,
    AuthsModule,
    SignupModule.forRoot({ autoApprove: true }),
    UsersModule,
    NotificationModule
  ],
  controllers: [VendorsController],
  providers: [VendorsService, PrismaService, FileWalletStorage]
})
export class AppUsersModule { }
