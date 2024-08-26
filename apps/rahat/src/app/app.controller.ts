import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { ApiTags } from '@nestjs/swagger';
import { AppJobs } from './app.jobs';
import { AppService } from './app.service';


@Controller('app')
@ApiTags('app')
export class AppController {

  constructor(private readonly appService: AppService) { }

  @MessagePattern({ cmd: AppJobs.COMMUNICATION.GET_SETTINGS })
  getSettings() {
    return this.appService.getCommunicationSettings()
  }
}
