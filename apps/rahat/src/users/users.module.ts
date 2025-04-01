import { Module } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaModule, PrismaService } from '@rumsan/prisma';
import { UsersModule as RSUserModule, UsersService as RSUserService } from '@rumsan/user'; // Import UsersModule and UsersService
import { WalletModule } from '../wallet/wallet.module';
import { WalletService } from '../wallet/wallet.service';
import { UsersService } from './users.service';

@Module({
    imports: [
        PrismaModule,
        WalletModule,
        RSUserModule.register([
            { provide: RSUserService, useClass: UsersService },
            WalletService,
        ]),
    ],
    providers: [
        PrismaService,
        EventEmitter2,
        WalletService,
        { provide: RSUserService, useClass: UsersService },
    ],
    exports: [
        PrismaService,
        EventEmitter2,
        WalletService,
        { provide: RSUserService, useClass: UsersService },
    ],
})
export class UsersModule { }
