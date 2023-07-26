import { Module } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { AuthsController } from './auths.controller';
import { AuthsService } from './auths.service';

@Module({
  controllers: [AuthsController],
  providers: [AuthsService, UserService],
})
export class AuthsModule {}
