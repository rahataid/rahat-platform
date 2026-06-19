import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiParam, ApiTags } from '@nestjs/swagger';
import { ACTIONS, APP, SUBJECTS } from '@rahataid/sdk';
import { AbilitiesGuard, CheckAbilities, JwtGuard } from '@rumsan/user';
import { CommsService } from './comms.service';
import { DateRangeQueryDto, ReportQueryDto } from './dto/comms-query.dto';

@Controller('comms')
@ApiTags('Comms')
@ApiBearerAuth(APP.JWT_BEARER)
export class CommsController {
  constructor(private readonly commsService: CommsService) {}

  @Get('transports')
  @UseGuards(JwtGuard, AbilitiesGuard)
  @CheckAbilities({ actions: ACTIONS.READ, subject: SUBJECTS.PUBLIC })
  listTransports() {
    return this.commsService.listTransports();
  }

  @Get('usage')
  @UseGuards(JwtGuard, AbilitiesGuard)
  @CheckAbilities({ actions: ACTIONS.READ, subject: SUBJECTS.PUBLIC })
  getUsage(@Query() query: DateRangeQueryDto) {
    return this.commsService.getUsage(query);
  }

  @Get('usage/xref/:xref')
  @UseGuards(JwtGuard, AbilitiesGuard)
  @CheckAbilities({ actions: ACTIONS.READ, subject: SUBJECTS.PUBLIC })
  @ApiParam({ name: 'xref', required: true, type: String })
  getUsageByXref(@Param('xref') xref: string, @Query() query: DateRangeQueryDto) {
    return this.commsService.getUsageByXref(xref, query);
  }

  @Get('credits')
  @UseGuards(JwtGuard, AbilitiesGuard)
  @CheckAbilities({ actions: ACTIONS.READ, subject: SUBJECTS.PUBLIC })
  getCredits(@Query() query: DateRangeQueryDto) {
    return this.commsService.getCredits(query);
  }

  @Get('credits/xref/:xref')
  @UseGuards(JwtGuard, AbilitiesGuard)
  @CheckAbilities({ actions: ACTIONS.READ, subject: SUBJECTS.PUBLIC })
  @ApiParam({ name: 'xref', required: true, type: String })
  getCreditsByXref(@Param('xref') xref: string, @Query() query: DateRangeQueryDto) {
    return this.commsService.getCreditsByXref(xref, query);
  }

  @Get('report')
  @UseGuards(JwtGuard, AbilitiesGuard)
  @CheckAbilities({ actions: ACTIONS.READ, subject: SUBJECTS.PUBLIC })
  getReport(@Query() query: ReportQueryDto) {
    return this.commsService.getReport(query);
  }
}
