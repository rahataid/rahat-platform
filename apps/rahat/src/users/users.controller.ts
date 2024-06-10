import { Body, Controller, Get, Inject, Param, Post, Query } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiParam, ApiTags } from '@nestjs/swagger';
import { VendorRegisterDto } from '@rahataid/extensions';
import { BeneficiaryConstants, VendorJobs } from '@rahataid/sdk';
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

}
