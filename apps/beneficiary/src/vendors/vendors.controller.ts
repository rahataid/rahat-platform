import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { VendorAddToProjectDto, VendorRegisterDto } from '@rahataid/extensions';
import { VendorJobs } from '@rahataid/sdk';
import { VendorsService } from './vendors.service';

@Controller('vendors')
export class VendorsController {
  constructor(private readonly service: VendorsService) { }

  @MessagePattern({ cmd: VendorJobs.REGISTER })
  registerVendor(@Payload() dto: VendorRegisterDto) {
    return this.service.registerVendor(dto);
  }

  @MessagePattern({ cmd: VendorJobs.ASSIGN_PROJECT })
  assignToProject(@Payload() dto: VendorAddToProjectDto) {
    return this.service.assignToProject(dto)
  }

  @MessagePattern({ cmd: VendorJobs.LIST })
  list() {
    return this.service.listVendor();
  }

  @MessagePattern({ cmd: VendorJobs.LIST_BY_PROJECT })
  listByProject(dto) {
    return this.service.listProjectVendor(dto)
  }

  @MessagePattern({ cmd: VendorJobs.GET })
  getVendor(id) {
    return this.service.getVendor(id)
  }

}
