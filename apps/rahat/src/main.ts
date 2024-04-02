/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { NestApplication, NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { APP } from '@rahataid/sdk';
// import { RsExceptionFilter } from '@rumsan/extensions/exceptions';
import { RpcExceptionFilter } from '@rahataid/extensions';
import { ResponseTransformInterceptor } from '@rumsan/extensions/interceptors';
import { WinstonModule } from 'nest-winston';
import { AppModule } from './app/app.module';
import { loggerInstance } from './logger/winston.logger';

async function bootstrap() {
  const app: NestApplication = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger({
      instance: loggerInstance,
    }),
  });
  const globalPrefix = 'v1';
  app.enableCors();

  //must have this if you want to implicit conversion of string to number in dto
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    })
  );
  app.useGlobalFilters(new RpcExceptionFilter());
  app.useGlobalInterceptors(new ResponseTransformInterceptor());
  // app.setGlobalPrefix(globalPrefix);
  app.setGlobalPrefix('api').enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  const port = process.env.PORT || 3333;

  const config = new DocumentBuilder()
    .setTitle('Rahat Core')
    .setDescription('API service for Rahat Core')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: APP.JWT_BEARER },
      APP.JWT_BEARER
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, document);

  // Create microservice instance
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.REDIS,
    options: {
      host: process.env.REDIS_HOST,
      port: +process.env.REDIS_PORT,
      password: process.env.REDIS_PASSWORD,
    },
  });

  // Start microservice
  await app.startAllMicroservices();

  await app.listen(port);
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`
  );
  Logger.log(`Swagger UI: http://localhost:${port}/swagger`);
}

bootstrap();
