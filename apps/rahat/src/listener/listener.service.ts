import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AuthsService, EVENTS } from '@rumsan/user';
import { Queue } from 'bull';
import { JOBS, QUEUE } from '../constants';

@Injectable()
export class ListenerService {
  private otp: string;
  constructor(
    private authService: AuthsService,
    @InjectQueue(QUEUE.RAHAT) private readonly queue: Queue,
    @InjectQueue(QUEUE.DEBUG) private readonly debug: Queue
  ) {}
  @OnEvent(EVENTS.OTP_CREATED)
  async sendOTPEmail(data: any) {
    console.log('OTP: ' + data.otp);
    this.otp = data.otp;
    await this.queue.add(JOBS.EMAIL, { test: 'test' });
  }

  //TODO PLEASE REMOVE THIS
  @OnEvent(EVENTS.CHALLENGE_CREATED)
  async TEMP_createJwt(data: any) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const auth = await this.authService.loginByOtp(
      {
        challenge: data.challenge.challenge,
        service: 'EMAIL',
        otp: this.otp,
      },
      {
        ip: '::1',
        userAgent: 'na',
      }
    );
    await this.debug.add(JOBS.OTP, {
      otp: this.otp,
      access_token: auth.accessToken,
    });
    console.log(auth);
  }
}
