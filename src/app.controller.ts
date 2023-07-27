import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateAppSettingDto, GetSettingsByNameDto } from './app-settings.dto';
import { AppService } from './app.service';

@Controller('app')
@ApiTags('app')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post('settings')
  createAppSettings(@Body() createAppSettingsDto: CreateAppSettingDto) {
    return this.appService.createAppSettings(createAppSettingsDto);
  }

  @Get('settings')
  getAppSettings(@Query() query: GetSettingsByNameDto) {
    return this.appService.getAppSettings(query);
  }

  @Get('contracts')
  getContracts() {
    return this.appService.getContracts();
  }

  @Get('blockchain')
  getBlockchain() {
    return this.appService.getBlockchain();
  }

  @Get('contracts/:contractName')
  getContractByName(@Param('contractName') contractName: string) {
    return this.appService.getContractByName(contractName);
  }
}
