import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { StatsModule } from '@rahat/stats';
import { BQUEUE, ProjectContants } from '@rahataid/sdk';
import { PrismaModule } from '@rumsan/prisma';
import { BeneficiaryController } from './beneficiary.controller';
import { BeneficiaryService } from './beneficiary.service';
import { BeneficiaryStatService } from './beneficiaryStat.service';
import { EncryptionService } from './encryption.service';
@Module({
  imports: [
    ClientsModule.register([
      {
        name: ProjectContants.ELClient,
        transport: Transport.REDIS,
        options: {
          host: process.env.REDIS_HOST,
          port: +process.env.REDIS_PORT,
          password: process.env.REDIS_PASSWORD,
        },
      },
    ]),
    PrismaModule,
    StatsModule,
    BullModule.registerQueue({
      name: BQUEUE.RAHAT_BENEFICIARY,
    }),
    MailerModule.forRootAsync({
      useFactory: async () => ({
        transport: {
          host: "smtp.gmail.com",
          port: 465,
          secure: true,
          auth: {
            user: "raghav.kattel@rumsan.net",
            pass: "visoeqbmifpdihdu",
          },
        },
        defaults: { from: '"No Reply" <no-reply@rumsan.com>' },
        template: {
          dir: __dirname + '/templates',
          adapter: new HandlebarsAdapter(),
          options: { strict: true },
        },

      }),
    }),
  ],
  controllers: [BeneficiaryController],
  providers: [BeneficiaryService, BeneficiaryStatService, EncryptionService],
})
export class BeneficiaryModule {
}
