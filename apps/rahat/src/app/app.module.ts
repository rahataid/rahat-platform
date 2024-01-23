import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RumsanUserModule } from '@rumsan/user';
import { PrismaModule } from '@rumsan/prisma';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ListenerModule } from '../listener/listener.module';

@Module({
  imports: [
    EventEmitterModule.forRoot({ maxListeners: 10, ignoreErrors: false }),
    ListenerModule,
    RumsanUserModule,
    PrismaModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
