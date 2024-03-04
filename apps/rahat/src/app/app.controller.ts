import { Controller, Get, Inject, Param, Post } from '@nestjs/common';
import { ClientProxy, Payload } from '@nestjs/microservices';
import { CreateSettingDto } from '@rahataid/extensions';
import { timeout } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { JOBS } from '../constants';
import { AppService } from './app.service';

@Controller('app')
export class AppController {
  constructor(
    private readonly appService: AppService,
    @Inject('PROJECT_CLIENT') private readonly client: ClientProxy
  ) {}

  @Get()
  getData() {
    return this.appService.getData();
  }

  @Get('test/:uuid')
  testComm(@Param('uuid') uuid: string) {
    return this.client
      .send({ cmd: 'test', uuid: uuid }, {})
      .pipe(timeout(5000));
  }

  @Post('project-settings')
  createSettings(@Payload() dto: CreateSettingDto) {
    let payload: any;
    payload = dto;
    payload.value.uuid = uuidv4();
    return this.client
      .send({ cmd: JOBS.SETTINGS.CREATE }, payload)
      .pipe(timeout(5000));
  }
}
