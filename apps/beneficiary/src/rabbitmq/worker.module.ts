import { Global, Module } from '@nestjs/common';
import { BeneficiaryWorker } from './worker-ben';

@Global()
@Module({
  providers: [BeneficiaryWorker],
  exports: [BeneficiaryWorker],
})
export class WorkerModule { }
