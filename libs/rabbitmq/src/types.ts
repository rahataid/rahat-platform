import { DynamicModule, ForwardReference, Type } from '@nestjs/common';
import * as amqp from 'amqp-connection-manager';

export type RabbitMQModuleOptions = {
  urls: string[];
  queues: { name: string; durable: boolean; options?: amqp.Options.AssertQueue }[];
  connectionOptions?: amqp.AmqpConnectionManagerOptions;
  ampqProviderName?: string;
  workerModuleProvider?: DynamicModule | Type<any> | Promise<DynamicModule> | ForwardReference<any>;
};
