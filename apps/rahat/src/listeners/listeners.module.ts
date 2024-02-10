import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AuthsModule } from '@rumsan/user';
import { QUEUE } from '../constants';
import { ListenersService } from './listeners.service';
import { DevService } from '../utils/develop.service';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    AuthsModule,
    BullModule.registerQueue({
      name: QUEUE.RAHAT,
    }),
    BullModule.registerQueue({
      name: QUEUE.HOST,
    }),
    ClientsModule.registerAsync([
      {
        name: 'RAHAT_CLIENT',
        useFactory: (configService: ConfigService) => ({
          transport: Transport.REDIS,
          options: {
            host: configService.get('REDIS_HOST'),
            port: configService.get('REDIS_PORT'),
            password: configService.get('REDIS_PASSWORD'),
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  providers: [ListenersService, DevService],
})
export class ListenersModule {}
