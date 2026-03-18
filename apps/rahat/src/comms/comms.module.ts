import { DynamicModule, Global, Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AppModule } from '../app/app.module';
import { CommsService } from './comms.service';

@Global()
@Module({})
export class CommsModule {
  static forRoot(): DynamicModule {
    return {
      module: CommsModule,
      global: true,
      imports: [
        ClientsModule.register([
          {
            name: 'CORE_CLIENT',
            transport: Transport.REDIS,
            options: {
              host: process.env.REDIS_HOST,
              port: +process.env.REDIS_PORT,
              password: process.env.REDIS_PASSWORD,
            },
          },
        ]),
        AppModule
      ],
      providers: [
        CommsService,
        {
          provide: 'COMMS_CLIENT',
          useFactory: async (commsService: CommsService) => {
            await commsService.init();
            return commsService.getClient();
          },
          inject: [CommsService],
        },
      ],
      exports: ['COMMS_CLIENT'],
    };
  }
}
