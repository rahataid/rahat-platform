import { Module } from '@nestjs/common';
import { PrismaModule } from '@rumsan/prisma';
import { UsersModule as RSUserModule, UsersService as RSUserService } from '@rumsan/user'; // Import UsersModule and UsersService
import { UsersService } from './users.service';

@Module({
    imports: [
        PrismaModule,
        RSUserModule.register({ provide: RSUserService, useClass: UsersService })
    ],
    providers: [{ provide: RSUserService, useClass: UsersService }],
    exports: [{ provide: RSUserService, useClass: UsersService }]
})
export class UsersModule { }
