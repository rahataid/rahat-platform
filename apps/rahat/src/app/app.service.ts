import { Injectable } from '@nestjs/common';
import { UsersService } from '@rumsan/user';

@Injectable()
export class AppService {
  constructor(private userService: UsersService) {}
  async getData() {
    const test = await this.userService.getById(1);
    return test;
  }
}
