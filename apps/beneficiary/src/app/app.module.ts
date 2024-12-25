import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';
import { RabbitMQModule, WorkerModule } from '@rahataid/queues/rabbitmq';
import { BQUEUE, ProjectContants } from '@rahataid/sdk';
import { SettingsModule } from '@rumsan/extensions/settings';
import { BeneficiaryModule } from '../beneficiary/beneficiary.module';
import { queueOptions } from '../constants';
import { ListenersModule } from '../listeners/listener.module';
import { ProcessorsModule } from '../processors/processor.module';
import { VendorsModule } from '../vendors/vendors.module';
import { BeneficiaryWorker } from '../workers.beneficiary';
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

    BeneficiaryModule,
    VendorsModule,
    ListenersModule,
    SettingsModule,
    ProcessorsModule,
    RabbitMQModule.register({
      workerModuleProvider: WorkerModule.register([
        { provide: 'BeneficiaryWorker1', useClass: BeneficiaryWorker },
        { provide: 'BeneficiaryWorker2', useClass: BeneficiaryWorker },
      ]),
      ampqProviderName: 'AMQP_CONNECTION',
      urls: ['amqp://guest:guest@localhost'],
      queues: queueOptions,
      otherProviders: [
        {
          provide: ProjectContants.ELClient,
          useValue: ClientProxyFactory.create({ transport: Transport.TCP }),
        },
      ],
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
