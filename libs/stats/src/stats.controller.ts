import {
  Controller,
  Get,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  APP
} from '@rahataid/sdk';
import {
  AbilitiesGuard,
  ACTIONS,
  CheckAbilities,
  JwtGuard,
  SUBJECTS,
} from '@rumsan/user';
import { StatsService } from './stats.service';
@ApiTags('Stats')
@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) { }

  @ApiBearerAuth(APP.JWT_BEARER)
  @UseGuards(JwtGuard, AbilitiesGuard)
  @CheckAbilities({ actions: ACTIONS.READ, subject: SUBJECTS.USER })
  @Get()
  findAll() {
    return this.statsService.findAll();
  }

  @Get(':name')
  findOne(@Param('name') name: string) {
    return this.statsService.findOne(name);
  }

}
