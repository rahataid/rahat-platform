import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';


@Controller('app')
@ApiTags('app')
export class AppController {
  constructor(private readonly appService: AppService,

  ) { }
}
