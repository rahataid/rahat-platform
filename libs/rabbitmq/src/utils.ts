import { RabbitMQModuleOptions } from './types';

export const getQueueByName = (queues: RabbitMQModuleOptions['queues'], queueName: string) => {
  return queues.find(queue => queue.name === queueName);
};
