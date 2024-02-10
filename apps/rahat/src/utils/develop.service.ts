import { Injectable } from '@nestjs/common';
import {
  ClientProxy,
  ClientProxyFactory,
  Transport,
} from '@nestjs/microservices';
import { AuthsService } from '@rumsan/user';

@Injectable()
export class DevService {
  private client: ClientProxy;
  constructor(private authService: AuthsService) {
    if (process.env.NODE_ENV === 'production') return;
    this.client = ClientProxyFactory.create({
      transport: Transport.REDIS,
      options: {
        host: 'localhost',
        port: 6379,
        password: 'baal9670',
      },
    });
  }

  log(cmd: string, data: any) {
    if (process.env.NODE_ENV === 'production') return;
    this.client.send({ cmd, dev: true }, data).subscribe();
  }

  async otp(data: any) {
    if (process.env.NODE_ENV === 'production') return;
    const auth = await this.authService.loginByOtp(
      {
        challenge: data.challenge,
        service: 'EMAIL',
        otp: data.otp,
      },
      {
        ip: '::1',
        userAgent: 'na',
      }
    );
    this.client
      .send(
        { cmd: 'slack', dev: true },
        `OTP: ${data.otp}\nToken: ${auth.accessToken}`
      )
      .subscribe();
  }
}
