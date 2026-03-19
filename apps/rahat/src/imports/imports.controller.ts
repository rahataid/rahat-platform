import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
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
import { Request, Response } from 'express';
import { CheckHeaders, ExternalAppGuard } from '../decorators';
import { ImportsService } from './imports.service';

@Controller('imports')
@ApiTags('Imports')
export class ImportsController {
  constructor(private readonly importsService: ImportsService) { }

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
  @ApiQuery({ name: 'sort', required: false, type: String, description: 'Field to sort by (default: createdAt)' })
  @ApiQuery({ name: 'order', required: false, enum: ['asc', 'desc'], description: 'Sort order (default: desc)' })
  async list(
    @Query() query: { status?: string; source?: string; page?: number; perPage?: number; sort?: string; order?: 'asc' | 'desc' }
  ) {
    return this.importsService.list({
      ...query,
      page: query.page ? +query.page : undefined,
      perPage: query.perPage ? +query.perPage : undefined,
    });
  }

  @ApiBearerAuth(APP.JWT_BEARER)
  @UseGuards(JwtGuard, AbilitiesGuard)
  @CheckAbilities({ actions: ACTIONS.READ, subject: SUBJECTS.USER })
  @Get(':uuid')
  @ApiParam({ name: 'uuid', required: true })
  async findOne(@Param('uuid') uuid: UUID) {
    return this.importsService.findOne(uuid);
  }

  @ApiBearerAuth(APP.JWT_BEARER)
  @UseGuards(JwtGuard, AbilitiesGuard)
  @CheckAbilities({ actions: ACTIONS.READ, subject: SUBJECTS.USER })
  @Get(':uuid/file')
  @Header('Content-Type', 'text/csv')
  @ApiParam({ name: 'uuid', required: true })
  async downloadFile(@Param('uuid') uuid: string, @Res() res: Response) {
    const { buffer, filename } = await this.importsService.getFileStream(uuid);
    console.log({ filename, buffer })
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'text/csv');
    res.send(buffer);
  }
}
