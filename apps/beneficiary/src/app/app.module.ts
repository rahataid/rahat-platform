import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BQUEUE } from '@rahat/sdk';

import { EventEmitterModule } from '@nestjs/event-emitter';
import { BeneficiaryModule } from '../beneficiary/beneficiary.module';
import { ListenersModule } from '../listeners/listener.module';
import { BeneficiaryProcessor } from '../processors/beneficiary.processor';
import { VendorsModule } from '../vendors/vendors.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    EventEmitterModule.forRoot({
      maxListeners: 10,
      ignoreErrors: false,
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST'),
          port: configService.get('REDIS_PORT'),
          password: configService.get('REDIS_PASSWORD'),
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: BQUEUE.RAHAT_BENEFICIARY,
    }),
    BeneficiaryModule,
    VendorsModule,
    ListenersModule,
  ],
  controllers: [AppController],
  providers: [AppService, BeneficiaryProcessor],
})
export class AppModule {}
