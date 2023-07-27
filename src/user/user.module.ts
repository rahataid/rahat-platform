import { Module } from '@nestjs/common';
import { PrismaModule } from 'nestjs-prisma';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  // imports: [AbilityModule],
  controllers: [UserController],
  providers: [UserService],
  imports: [PrismaModule],
})
export class UserModule {}
