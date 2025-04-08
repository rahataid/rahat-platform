// This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
// If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { BQUEUE, queueOptions, RABBIT_MQ } from '@rahataid/sdk';
import { SettingsModule } from '@rumsan/extensions/settings';
import { PrismaService } from '@rumsan/prisma';
import { RabbitMQModule, WorkerModule } from '@rumsan/rabbitmq';
import { BeneficiaryModule } from '../beneficiary/beneficiary.module';
import { ExportTargerBeneficiary } from '../consumers/target.export.rabbitmq.worker';
import { ListenersModule } from '../listeners/listener.module';
import { ProcessorsModule } from '../processors/processor.module';
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
    RabbitMQModule.register({
      workerModuleProvider: WorkerModule.register({
        globalDataProvider: {
          prismaService: PrismaService,
        },
        workers: [
          {
            provide: 'EXPORT_TARGET_BENEFICIARY',
            useClass: ExportTargerBeneficiary,
          },
        ],
      }),
      ampqProviderName: RABBIT_MQ.AMQP_CONNECTION,
      urls: [process.env.RABBIT_MQ_URL],
      queues: queueOptions,
    }),

    BeneficiaryModule,
    ListenersModule,
    SettingsModule,
    ProcessorsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
