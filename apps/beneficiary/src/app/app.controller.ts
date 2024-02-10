import { Controller } from '@nestjs/common';

import { AppService } from './app.service';
import { MessagePattern } from '@nestjs/microservices';
import {
  CreateBeneficiaryDto,
  ListBeneficiaryDto,
  UpdateBeneficiaryDto,
} from '@rahat/sdk';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @MessagePattern({ cmd: 'list' })
  async list(dto: ListBeneficiaryDto) {
    return this.appService.list(dto);
  }

  @MessagePattern({ cmd: 'create' })
  async create(dto: CreateBeneficiaryDto) {
    return this.appService.create(dto);
  }

  @MessagePattern({ cmd: 'update' })
  async update(data: { uuid: string; dto: UpdateBeneficiaryDto }) {
    return this.appService.update(data.uuid, data.dto);
  }
}
