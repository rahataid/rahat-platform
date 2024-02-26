import { Controller } from '@nestjs/common';
import { VendorsService } from './vendors.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { VendorRegisterDto } from './dto/vendor-register.dto';

@Controller('vendors')
export class VendorsController {
  constructor(private readonly service: VendorsService) {}

  @MessagePattern({ cmd: 'jobs.vendor.register' })
  registerVendor(@Payload() dto: VendorRegisterDto) {
    return this.service.registerVendor(dto);
  }
}
