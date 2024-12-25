

import { RabbitMQModuleOptions } from '@rahataid/queues/rabbitmq';

export const AMQP_CONNECTION = 'AMQP_CONNECTION';

export const BENEFICIARY_QUEUE = 'BENEFICIARY_QUEUE';

export const queueOptions: RabbitMQModuleOptions['queues'] = [
  {
    name: BENEFICIARY_QUEUE,
    durable: true,
    options: {
      //   arguments: {
      //     'x-max-priority': 10,
      //     'x-message-ttl': 30000,
      //     'x-max-length': 5000,
      //   },
      //   maxLength: 5000,
      //   maxPriority: 10,
      //   messageTtl: 30000,
    },
  },
];
