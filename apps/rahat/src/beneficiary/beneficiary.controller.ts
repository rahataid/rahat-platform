import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiParam, ApiTags } from '@nestjs/swagger';
import {
  CreateBeneficiaryDto,
  ListBeneficiaryDto,
  UpdateBeneficiaryDto,
} from '@rahat/sdk';
import { UUID } from 'crypto';

@Controller('beneficiaries')
@ApiTags('Beneficiaries')
export class BeneficiaryController {
  constructor(@Inject('BEN_CLIENT') private readonly client: ClientProxy) {}

  @Get()
  async list(@Query() dto: ListBeneficiaryDto) {
    return this.client.send({ cmd: 'list' }, dto);
  }

  @Post()
  async create(@Body() dto: CreateBeneficiaryDto) {
    return this.client.send({ cmd: 'create' }, dto);
  }

  @Post(':uuid')
  @ApiParam({ name: 'uuid', required: true })
  async update(@Param('uuid') uuid: UUID, @Body() dto: UpdateBeneficiaryDto) {
    return this.client.send({ cmd: 'update' }, { uuid, dto });
  }
}
