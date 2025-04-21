import { Module } from '@nestjs/common';
import { OtpService } from './otp.service';
import { OtpController } from './otp.controller';

@Module({
  controllers: [OtpController],
  providers: [OtpService],
})
export class OtpModule {}
