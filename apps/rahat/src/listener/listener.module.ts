import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AuthsModule } from '@rumsan/user';
import { QUEUE } from '../constants';
import { ListenerService } from './listener.service';
import { DevService } from '../utils/develop.service';

@Module({
  imports: [
    AuthsModule,
    BullModule.registerQueue({
      name: QUEUE.RAHAT,
    }),
    BullModule.registerQueue({
      name: QUEUE.HOST,
    }),
  ],
  providers: [ListenerService, DevService],
})
export class ListenerModule {}
