import { Injectable } from '@nestjs/common';
import { UsersService, User } from '@rumsan/user';

@Injectable()
export class AppService {
  constructor(private userService: UsersService) {}
  async getData() {
    const test: User = await this.userService.getById(1);
    return test;
  }
}
