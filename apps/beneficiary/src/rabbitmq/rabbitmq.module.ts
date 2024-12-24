import { DynamicModule, Global, Module, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import * as amqp from 'amqp-connection-manager';
import { RabbitMQController } from './rabbitmq.controller';
import { RabbitMQService } from './rabbitmq.service';
import { BeneficiaryWorker } from './worker-ben';

@Global()
@Module({})
export class RabbitMQModule implements OnModuleInit, OnModuleDestroy {
  static register(options: {
    urls: string[];
    queues: { name: string; durable: boolean }[];
  }): DynamicModule {
    const amqpProvider = {
      provide: 'AMQP_CONNECTION',
      useFactory: () => amqp.connect(options.urls),
    };

    return {
      module: RabbitMQModule,
      imports: [],
      controllers: [RabbitMQController],
      providers: [amqpProvider, RabbitMQService, BeneficiaryWorker],
      exports: [amqpProvider],
    };
  }

  async onModuleInit() {
    console.log('RabbitMQ Module initialized.');
  }

  async onModuleDestroy() {
    console.log('RabbitMQ Module destroyed.');
  }
}
