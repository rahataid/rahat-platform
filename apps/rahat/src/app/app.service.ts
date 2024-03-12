import { Injectable } from '@nestjs/common';
import { SettingsService } from '@rumsan/extensions/settings';

@Injectable()
export class AppService {
  async getData() {
    //const test = await this.userService.getById(1);
    console.log(SettingsService.get('SMTP.HOST'));
    return {};
  }
}
