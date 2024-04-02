import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app/app.module';
import { ExceptionFilter } from './exceptions/exception.filter';

async function bootstrap() {
  const PORT: number = +process.env.PORT_BEN;
  const configService = new ConfigService();
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.REDIS,
      options: {
        host: configService.get('REDIS_HOST'),
        port: configService.get('REDIS_PORT'),
        password: configService.get('REDIS_PASSWORD'),
      },
    }
  );
  app.useGlobalFilters(new ExceptionFilter());
  await app.listen();
  Logger.log(`🚀 Microservice is running on: http://localhost:${PORT}`);
}
bootstrap();
