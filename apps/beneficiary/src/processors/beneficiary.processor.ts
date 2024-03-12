import { MailerService } from '@nestjs-modules/mailer';
import { Process, Processor } from '@nestjs/bull';
import { BadRequestException, Logger } from '@nestjs/common';
import { BQUEUE, BeneficiaryJobs } from '@rahataid/sdk';
import { Job } from 'bull';

@Processor(BQUEUE.RAHAT_BENEFICIARY)
export class BeneficiaryProcessor {
  private readonly logger = new Logger(BeneficiaryProcessor.name);
  constructor(
    private readonly mailerService: MailerService,
  ) { }

  @Process(BeneficiaryJobs.UPDATE_STATS)
  async sample(job: Job<any>) {
    console.log('sample', job.data);
  }

  @Process(BeneficiaryJobs.GENERATE_LINK)
  async generateLink(job: Job<any>) {
    console.log(job.data)
    if (job.data) {
      console.log('I am here')
      return this.mailerService.sendMail({
        to: job.data.email,
        from: "raghav.kattel@rumsan.net",
        subject: 'Wallet Verification Link',
        template: './wallet-verification',
        context: { encryptedData: job.data.encrypted, name: job.data.name },
      });
    }
    throw new BadRequestException()
  }
}
