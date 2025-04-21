import { Body, Controller, Post } from '@nestjs/common';
import { CreateClaimDto } from '@rahataid/extensions';
import { OtpService } from './otp.service';

@Controller('otp')
export class OtpController {
  constructor(private readonly otpService: OtpService) { }

  @Post('')
  addOtpToClaim(@Body() data: CreateClaimDto) {
    return this.otpService.addOtpToClaim(data);
  }
}
