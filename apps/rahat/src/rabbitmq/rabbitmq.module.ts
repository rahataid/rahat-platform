import { Global, Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { RabbitMQController } from './rabbitmq.controller';
import { RabbitMQListener } from './rabbitmq.listener';
import { RabbitMQService } from './rabbitmq.service';

@Global()
@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'rabbit-mq-module',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://guest:guest@localhost'],
          queue: 'rabbit-mq-rahat',
          queueOptions: {
            durable: true,
          },
        },
      },
    ]),
  ],
  providers: [RabbitMQService],
  controllers: [RabbitMQListener, RabbitMQController],
  exports: [RabbitMQService,], // Export RabbitMQService for use in other modules
})
export class RabbitMQModule { }
