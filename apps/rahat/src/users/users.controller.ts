import { Body, Controller, Inject, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { VendorRegisterDto } from './dto/vendor-register.dto';
import { ClientProxy } from '@nestjs/microservices';
import { JOBS } from '../constants';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(@Inject('BEN_CLIENT') private readonly client: ClientProxy) {}

  @Post('vendors')
  registerVendor(@Body() dto: VendorRegisterDto) {
    return this.client.send({ cmd: JOBS.VENDOR.REGISTER }, dto);
  }
}
