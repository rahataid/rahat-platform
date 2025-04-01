import { Module } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaModule, PrismaService } from '@rumsan/prisma';
import { UsersModule as RSUserModule, UsersService as RSUserService } from '@rumsan/user'; // Import UsersModule and UsersService
import { UsersService } from './users.service';

@Module({
    imports: [
        PrismaModule,
        RSUserModule.register({ provide: RSUserService, useClass: UsersService }),
    ],
    providers: [
        PrismaService,
        EventEmitter2,
        { provide: RSUserService, useClass: UsersService },
    ],
    exports: [
        PrismaService,
        EventEmitter2,
        { provide: RSUserService, useClass: UsersService }]
})
export class UsersModule { }
