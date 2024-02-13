import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AuthsModule } from '@rumsan/user';
import { ListenersService } from './listeners.service';
import { DevService } from '../utils/develop.service';
import { ConfigService } from '@nestjs/config';
import { BQUEUE } from '@rahat/sdk';

@Module({
  imports: [
    AuthsModule,
    BullModule.registerQueue({
      name: BQUEUE.RAHAT,
    }),
    BullModule.registerQueue({
      name: BQUEUE.RAHAT_PROJECT,
    }),
    BullModule.registerQueue({
      name: BQUEUE.HOST,
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
