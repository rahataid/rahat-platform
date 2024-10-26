import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { FastifyAdapter } from "@bull-board/fastify";
import { BullBoardModule } from "@bull-board/nestjs";
import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { BQUEUE } from '@rahataid/sdk';
import { SettingsModule } from '@rumsan/extensions/settings';
import { BeneficiaryModule } from '../beneficiary/beneficiary.module';
import { ListenersModule } from '../listeners/listener.module';
import { ProcessorsModule } from '../processors/processor.module';
import { VendorsModule } from '../vendors/vendors.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';


@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot({
      maxListeners: 50,
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
    BullBoardModule.forRoot({
      route: '/queues',
      adapter: FastifyAdapter, // Use FastifyAdapter for routing
    }),
    BullBoardModule.forFeature({
      name: BQUEUE.RAHAT_BENEFICIARY,
      adapter: BullMQAdapter, // Use FastifyAdapter for the queue
    }),

    BeneficiaryModule,
    VendorsModule,
    ListenersModule,
    SettingsModule,
    ProcessorsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
