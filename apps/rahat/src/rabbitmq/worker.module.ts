import { Global, Module } from '@nestjs/common';
import { BeneficiaryWorker } from './beneficiary.rabbitmq.worker';
import { QueueUtilsService } from './queue-utils.service';

@Global()
@Module({
  providers: [BeneficiaryWorker, QueueUtilsService],
  exports: [BeneficiaryWorker, QueueUtilsService],
})
export class WorkerModule { }
