import { Module } from '@nestjs/common';
import { ListenerService } from './listener.service';

@Module({
  imports: [],
  providers: [ListenerService],
})
export class ListenerModule {}
