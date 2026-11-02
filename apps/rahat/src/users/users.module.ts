import { Module } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaModule } from '@rumsan/prisma';
import {
  UsersModule as RSUserModule,
  UsersService as RSUserService,
} from '@rumsan/user'; // Import UsersModule and UsersService
import { NotificationModule } from '../notification/notification.module';
import { CustomUsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    PrismaModule,
    NotificationModule,
    RSUserModule.register([
      { provide: RSUserService, useClass: UsersService },
    ]),
  ],
  controllers: [CustomUsersController],
  providers: [EventEmitter2, UsersService],
  exports: [EventEmitter2, UsersService], // Removed WalletService since it's globally available
})
export class UsersModule { }
