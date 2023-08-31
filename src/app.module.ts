import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { BullModule } from '@nestjs/bull';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { BeneficiaryModule } from './beneficiary/beneficiary.module';
import { ProjectModule } from './project/project.module';
import { ReportsModule } from './reports/reports.module';
import { TransactionsModule } from './transactions/transactions.module';
import { UsersModule } from './users/users.module';
import { VendorsModule } from './vendors/vendors.module';

@Module({
  imports: [
    PrismaModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get<string>('REDIS_HOST'),
          port: +configService.get<number>('REDIS_PORT'),
          retryStrategy: (times) => {
            // reconnect after
            return Math.min(times * 50, 2000);
          },
          // might need to change on producttion
          maxRetriesPerRequest: 1000,
        },
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    ProjectModule,
    BeneficiaryModule,
    ReportsModule,
    AuthModule,
    TransactionsModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env`],
      // load: [
      //   async () => {
      //     return {
      //       BAAL: 4400,
      //     };
      //   },
      // ],
    }),
    VendorsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
