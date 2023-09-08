import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ReportsService } from './reports.service';

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
