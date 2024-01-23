import { Injectable } from '@nestjs/common';
import { UserService, User } from '@rumsan/user';

@Injectable()
export class AppService {
  constructor(private userService: UserService) {}
  async getData() {
    const test: User = await this.userService.getById(1);
    return test;
  }
}
