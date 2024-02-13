import { InjectQueue } from '@nestjs/bull';
import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiParam, ApiTags } from '@nestjs/swagger';
import {
  BQUEUE,
  CreateBeneficiaryDto,
  ListBeneficiaryDto,
  JOBS,
  UpdateBeneficiaryDto,
  TFile,
  Enums,
} from '@rahat/sdk';
import { Queue } from 'bull';
import { UUID } from 'crypto';
import { DocParser } from './parser';

@Controller('beneficiaries')
@ApiTags('Beneficiaries')
export class BeneficiaryController {
  constructor(
    @Inject('BEN_CLIENT') private readonly client: ClientProxy,
    @InjectQueue(BQUEUE.RAHAT) private readonly queue: Queue
  ) {}

  @Get()
  async list(@Query() dto: ListBeneficiaryDto) {
    return this.client.send({ cmd: JOBS.BENEFICIARY.LIST }, dto);
  }

  @Post()
  async create(@Body() dto: CreateBeneficiaryDto) {
    return this.client
      .send({ cmd: JOBS.BENEFICIARY.CREATE }, dto)
      .subscribe((d) => this.queue.add(JOBS.BENEFICIARY.CREATE, d));
  }

  @Post('bulk')
  @UseInterceptors(FileInterceptor('file'))
  async uploadBulk(@UploadedFile() file: TFile, @Req() req: Request) {
    const docType: Enums.UploadFileType =
      req.body['doctype']?.toUpperCase() || Enums.UploadFileType.JSON;
    const beneficiaries = await DocParser(docType, file.buffer);

    return this.client.send(
      { cmd: JOBS.BENEFICIARY.CREATE_BULK },
      beneficiaries
    );
  }

  @Post(':uuid')
  @ApiParam({ name: 'uuid', required: true })
  async update(@Param('uuid') uuid: UUID, @Body() dto: UpdateBeneficiaryDto) {
    return this.client.send({ cmd: JOBS.BENEFICIARY.UPDATE }, { uuid, dto });
  }
}
