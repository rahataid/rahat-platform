import { DynamicModule, Global, Module, Provider } from '@nestjs/common';
import * as amqp from 'amqp-connection-manager';

@Global()
@Module({})
export class WorkerModule {
  static register(workers: { provide: any; useClass: any }[]): DynamicModule {
    const providers: Provider[] = workers.map(worker => ({
      provide: worker.provide,
      useClass: worker.useClass,
    }));

    return {
      module: WorkerModule,
      providers: [...providers],
      exports: providers,
    };
  }
}
