import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt.auth.guard';
import { RoleGuard } from 'src/auth/guards/role.guard';
import { ReportsService } from './reports.service';

@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RoleGuard)
@Controller('reports')
@ApiTags('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard/summary')
  getDashboardSummary() {
    return this.reportsService.getDashboardSummary();
  }

  @Get('project/:address')
  async getProjectBasedReport(@Param('address') address: string) {
    return await this.reportsService.getProjectBasedReport(address);
  }
}
