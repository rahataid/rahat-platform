import { Module } from '@nestjs/common';

import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '@rumsan/prisma';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AbilityModule } from '../ability/ability.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AbilityModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
