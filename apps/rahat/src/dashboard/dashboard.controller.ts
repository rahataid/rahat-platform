import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { APP } from '@rahataid/sdk';
import { AbilitiesGuard, ACTIONS, CheckAbilities, JwtGuard, SUBJECTS } from '@rumsan/user';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@ApiTags('Dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @ApiBearerAuth(APP.JWT_BEARER)
  @UseGuards(JwtGuard, AbilitiesGuard)
  @CheckAbilities({ actions: ACTIONS.READ, subject: SUBJECTS.USER })
  @Get('stats')
  async getStats() {
    return this.dashboardService.getDashboardStats();
  }
}
