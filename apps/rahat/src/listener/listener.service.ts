import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { RUMSAN_USER_CONSTANTS as USER } from '@rumsan/user';

@Injectable()
export class ListenerService {
  @OnEvent(USER.EVENTS.OTP_CREATED)
  sendOTPEmail(data: any) {
    console.log('Use your messenger service!', data);
  }
}
