import { Body, Controller, Get, Inject, Param, Post } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiParam, ApiTags } from '@nestjs/swagger';
import { VendorRegisterDto } from '@rahataid/extensions';
import { BeneficiaryConstants, VendorJobs } from '@rahataid/sdk';
import { UUID } from 'crypto';
import { Address } from 'viem';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(
    @Inject(BeneficiaryConstants.Client) private readonly client: ClientProxy
  ) { }

  @Post('vendors')
  registerVendor(@Body() dto: VendorRegisterDto) {
    return this.client.send({ cmd: VendorJobs.REGISTER }, dto);
  }

  @Get('vendors')
  listVendor(dto) {
    return this.client.send({ cmd: VendorJobs.LIST }, dto);
  }

  @ApiParam({ name: 'id', required: true })
  @Get('vendors/:id')
  getVendor(@Param('id') id: UUID | Address) {
    return this.client.send({ cmd: VendorJobs.GET }, { id })
  }

}
