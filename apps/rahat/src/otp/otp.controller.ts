import { Body, Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { BulkOtpDto, CreateClaimDto } from '@rahataid/extensions';
import { OTPJobs } from '@rahataid/sdk';
import { OtpService } from './otp.service';

@Controller('otp')
export class OtpController {
  constructor(private readonly otpService: OtpService) { }

  @MessagePattern({ cmd: OTPJobs.SEND_OTP })
  addOtpToClaim(@Body() data: CreateClaimDto) {
    return this.otpService.addOtpToClaim(data);
  }

  @MessagePattern({ cmd: OTPJobs.SEND_BULK_OTP })
  sendBulkOtp(@Body() data: BulkOtpDto) {
    return this.otpService.sendBulkOtp(data);
  }
}
