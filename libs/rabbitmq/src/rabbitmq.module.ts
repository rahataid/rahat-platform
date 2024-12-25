import {
  DynamicModule,
  ForwardReference,
  Global,
  Module,
  OnModuleDestroy,
  OnModuleInit,
  Provider,
  Type,
} from '@nestjs/common';
import * as amqp from 'amqp-connection-manager';
import { QueueUtilsService } from './queue-utils.service';
import { RabbitMQService } from './rabbitmq.service';

@Global()
@Module({
  imports: [],
  providers: [],
  exports: [RabbitMQService, 'QUEUE_NAMES'], // Export QUEUE_NAMES globally
})
export class RabbitMQModule implements OnModuleInit, OnModuleDestroy {
  static register(options: {
    urls: string[];
    queues: { name: string; durable: boolean; options?: amqp.Options.AssertQueue }[];
    connectionOptions?: amqp.AmqpConnectionManagerOptions;
    ampqProviderName?: string;
    workerModuleProvider?:
    | DynamicModule
    | Type<any>
    | Promise<DynamicModule>
    | ForwardReference<any>;
    otherProviders?: Provider[];
  }): DynamicModule {
    const amqpProvider = {
      provide: options.ampqProviderName,
      useFactory: () => amqp.connect(options.urls, options?.connectionOptions),
    };

    return {
      module: RabbitMQModule,
      imports: options.workerModuleProvider ? [options.workerModuleProvider] : [], // Ensure it’s always a valid array
      providers: [
        amqpProvider,
        QueueUtilsService,
        RabbitMQService,
        {
          provide: 'QUEUE_NAMES',
          useValue: options.queues,
        },
        ...(options.otherProviders || []),
      ],
      exports: [amqpProvider, QueueUtilsService, RabbitMQService, 'QUEUE_NAMES', ...(options.otherProviders || [])], // Ensure QUEUE_NAMES is exported
    };
  }

  async onModuleInit() {
    console.log('RabbitMQ Module initialized.');
  }

  async onModuleDestroy() {
    console.log('RabbitMQ Module destroyed.');
  }
}
