import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { BQUEUE, JOBS } from '@rahataid/sdk';
import { Job } from 'bull';

@Processor(BQUEUE.RAHAT_BENEFICIARY)
export class BeneficiaryProcessor {
  private readonly logger = new Logger(BeneficiaryProcessor.name);

  @Process(JOBS.BENEFICIARY.UPDATE_STATS)
  async sample(job: Job<any>) {
    console.log('sample', job.data);
  }
}
