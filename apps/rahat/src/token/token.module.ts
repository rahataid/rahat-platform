import { Module } from '@nestjs/common';
import { PrismaModule } from '@rumsan/prisma';
import { TokenController } from './token.controller';
import { TokenService } from './token.service';

@Module({
  controllers: [TokenController],
  providers: [TokenService],
  imports: [PrismaModule]
})
export class TokenModule { }
