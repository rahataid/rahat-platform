import { Body, Controller, Get, Inject, Post } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiTags } from '@nestjs/swagger';
import { VendorRegisterDto } from '@rahataid/extensions';
import { BeneficiaryConstants, VendorJobs } from '@rahataid/sdk';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(
    @Inject(BeneficiaryConstants.Client) private readonly client: ClientProxy
  ) {}

  @Post('vendors')
  registerVendor(@Body() dto: VendorRegisterDto) {
    return this.client.send({ cmd: VendorJobs.REGISTER }, dto);
  }

  @Get('vendors')
  listVendor(){
    return this.client.send({cmd:VendorJobs.LIST},{});
  }

}
