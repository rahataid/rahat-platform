import { Body, Controller, Get, Inject, Param, Patch, Post, Query } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiParam, ApiTags } from '@nestjs/swagger';
import { GetVendorOtp, VendorRegisterDto, VendorUpdateDto, VerifyVendorOtp } from '@rahataid/extensions';
import { BeneficiaryConstants, VendorJobs } from '@rahataid/sdk';
import { RequestDetails } from '@rumsan/extensions/decorators';
import { UUID } from 'crypto';
import { Address } from 'viem';


@ApiTags('Vendors')
@Controller('vendors')
export class UsersController {
  constructor(
    @Inject(BeneficiaryConstants.Client) private readonly client: ClientProxy
  ) { }

  @Post('')
  registerVendor(@Body() dto: VendorRegisterDto) {
    return this.client.send({ cmd: VendorJobs.REGISTER }, dto);
  }

  @Get('')
  listVendor(@Query() dto) {
    return this.client.send({ cmd: VendorJobs.LIST }, dto);
  }

  @Get('/stats')
  getVendorCount(@Query() dto) {
    return this.client.send({ cmd: VendorJobs.GET_COUNT }, dto);
  }

  @ApiParam({ name: 'id', required: true })
  @Get('/:id')
  getVendor(@Param('id') id: UUID | Address) {
    return this.client.send({ cmd: VendorJobs.GET }, { id })
  }

  @Post('/getOtp')
  getOtp(@Body() dto: GetVendorOtp, @RequestDetails() rdetails: any) {
    return this.client.send({ cmd: VendorJobs.GET_OTP }, { dto, rdetails })
  }

  @Post('/verifyOtp')
  verifyOtp(@Body() dto: VerifyVendorOtp, @RequestDetails() rdetails: any) {
    return this.client.send({ cmd: VendorJobs.VERIFY_OTP }, { dto, rdetails })
  }

  @Patch('/update')
  updateVendor(@Body() dto: VendorUpdateDto) {
    return this.client.send({ cmd: VendorJobs.UPDATE }, dto)
  }

}
