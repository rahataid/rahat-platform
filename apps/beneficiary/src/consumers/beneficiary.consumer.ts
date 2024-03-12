import { MailerService } from '@nestjs-modules/mailer';
import { Process, Processor } from '@nestjs/bull';
import { BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BQUEUE, BeneficiaryJobs } from '@rahataid/sdk';
import { Job } from 'bull';

@Processor(BQUEUE.RAHAT_BENEFICIARY)
export class BeneficiaryConsumer {
    private readonly logger = new Logger(BeneficiaryConsumer.name);
    constructor(
        private readonly mailerService: MailerService,
        private readonly configService: ConfigService
    ) { }

    @Process(BeneficiaryJobs.SEND_EMAIL)
    async generateLink(job: Job<any>) {
        if (job.data) {
            return this.mailerService.sendMail({
                to: job.data.email,
                from: 'manjik.shrestha@rumsan.com',
                subject: 'Wallet Verification Link',
                template: './wallet-verification',
                context: {
                    encryptedData: `${this.configService.get<string>(
                        'VERIFICATION_URL'
                    )}?encrypted=${job.data.encrypted}`,
                    name: job.data.name,
                },
            }); // Add closing parenthesis here
        }
        throw new BadRequestException();
    }
}
