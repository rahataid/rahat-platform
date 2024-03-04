import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { VendorRegisterDto } from '@rahataid/extensions';
import { VendorsService } from './vendors.service';

@Controller('vendors')
export class VendorsController {
  constructor(private readonly service: VendorsService) {}

  @MessagePattern({ cmd: 'jobs.vendor.register' })
  registerVendor(@Payload() dto: VendorRegisterDto) {
    return this.service.registerVendor(dto);
  }
}
