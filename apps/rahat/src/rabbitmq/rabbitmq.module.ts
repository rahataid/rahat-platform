import { DynamicModule, Global, Module, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import * as amqp from 'amqp-connection-manager';
import { QueueUtilsService } from './queue-utils.service';
import { RabbitMQController } from './rabbitmq.controller';
import { RabbitMQService } from './rabbitmq.service';

@Global()
@Module({})
export class RabbitMQModule implements OnModuleInit, OnModuleDestroy {
  static register(options: {
    urls: string[];
    queues: { name: string; durable: boolean, worker: any }[];
  }): DynamicModule {
    const amqpProvider = {
      provide: 'AMQP_CONNECTION',
      useFactory: () => amqp.connect(options.urls),
    };

    const workerProviders = options.queues.map(queue => queue.worker);

    return {
      module: RabbitMQModule,
      imports: [],
      controllers: [RabbitMQController],
      providers: [amqpProvider, QueueUtilsService, RabbitMQService, ...workerProviders],
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
