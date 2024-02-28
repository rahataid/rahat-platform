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
  AddToProjectDto,
  BQUEUE,
  CreateBeneficiaryDto,
  Enums,
  JOBS,
  ListBeneficiaryDto,
  TFile,
  UpdateBeneficiaryDto,
} from '@rahat/sdk';
import { Queue } from 'bull';
import { UUID } from 'crypto';
import { catchError, of } from 'rxjs';
import { ReferBeneficiaryDto } from './dto/refer.beneficiary.dto';
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

  @Get('stats')
  async getStats() {
    return this.client.send({ cmd: JOBS.BENEFICIARY.STATS }, {});
  }

  @Post()
  async create(@Body() dto: CreateBeneficiaryDto) {
    return this.client.send({ cmd: JOBS.BENEFICIARY.CREATE }, dto);
  }

  @Post('refer')
  async referBeneficiary(@Body() dto: ReferBeneficiaryDto) {
    return this.client.send({ cmd: JOBS.BENEFICIARY.REFER }, dto);
  }

  @Post('add-to-project')
  async addToProject(@Body() dto: AddToProjectDto) {
    return this.client.send({ cmd: JOBS.BENEFICIARY.ADD_TO_PROJECT }, dto);
  }

  @Post('bulk')
  async createBulk(@Body() dto: CreateBeneficiaryDto[]) {
    const data = dto.map((b) => ({
      ...b,
    }));
    return this.client
      .send({ cmd: JOBS.BENEFICIARY.CREATE_BULK }, data)
      .pipe(catchError((val) => of({ error: val.message })));
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile() file: TFile, @Req() req: Request) {
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
