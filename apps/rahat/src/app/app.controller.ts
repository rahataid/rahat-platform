import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateSettingDto } from '@rumsan/extensions/dtos';
import { AppService } from './app.service';


@Controller('app')
@ApiTags('app')
export class AppController {
  constructor(private readonly appService: AppService,

  ) { }

  @Post('settings')
  create(@Body() createSettingDto: CreateSettingDto) {
    return this.appService.createRahatAppSettings(createSettingDto)
  }

}
