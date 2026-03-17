import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiBearerAuth, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { APP } from '@rahataid/sdk';
import {
  AbilitiesGuard,
  ACTIONS,
  CheckAbilities,
  JwtGuard,
  SUBJECTS,
} from '@rumsan/user';
import { UUID } from 'crypto';
import { CheckHeaders, ExternalAppGuard } from '../decorators';
import { ImportsService } from './imports.service';

@Controller('imports')
@ApiTags('Imports')
export class ImportsController {
  constructor(private readonly importsService: ImportsService) {}

  @Post()
  @UseGuards(ExternalAppGuard)
  @CheckHeaders('Signature')
  async create(
    @Req() req: Request,
    @Body()
    body: {
      fileUrl: string;
      groupName: string;
      groupUUID: string;
      beneficiaryCount: number;
      meta?: Record<string, unknown>;
    }
  ) {
    const origin = req.headers['origin'] || req.headers['referer'];
    const source = origin
      ? new URL(Array.isArray(origin) ? origin[0] : origin).host
      : req.ip;

    return this.importsService.create(body, source);
  }

  @ApiBearerAuth(APP.JWT_BEARER)
  @UseGuards(JwtGuard, AbilitiesGuard)
  @CheckAbilities({ actions: ACTIONS.READ, subject: SUBJECTS.USER })
  @Get()
  @ApiQuery({ name: 'status', required: false, enum: ['NEW', 'PROCESSING', 'IMPORTED', 'FAILED'] })
  @ApiQuery({ name: 'source', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'perPage', required: false, type: Number })
  async list(
    @Query('status') status?: string,
    @Query('source') source?: string,
    @Query('page') page?: number,
    @Query('perPage') perPage?: number
  ) {
    return this.importsService.list({ status, source, page: +page, perPage: +perPage });
  }

  @ApiBearerAuth(APP.JWT_BEARER)
  @UseGuards(JwtGuard, AbilitiesGuard)
  @CheckAbilities({ actions: ACTIONS.READ, subject: SUBJECTS.USER })
  @Get(':uuid')
  @ApiParam({ name: 'uuid', required: true })
  async findOne(@Param('uuid') uuid: UUID) {
    return this.importsService.findOne(uuid);
  }
}
