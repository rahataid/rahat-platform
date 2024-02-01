import { Module } from '@nestjs/common';
import { ListenerService } from './listener.service';
import { AuthsModule } from '@rumsan/user';
import { BullModule } from '@nestjs/bull';
import { QUEUE } from '../constants';

@Module({
  imports: [
    AuthsModule,
    BullModule.registerQueue({
      name: QUEUE.RAHAT,
    }),
    BullModule.registerQueue({
      name: QUEUE.DEBUG,
    }),
  ],
  providers: [ListenerService],
})
export class ListenerModule {}
