import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class DevService {
  constructor(
    @Inject('RAHAT_CLIENT') private readonly rahatClient: ClientProxy
  ) {}

  log(cmd: string, data: any) {
    if (process.env.NODE_ENV === 'production') return;
    this.rahatClient.send({ cmd, dev: true }, data).subscribe();
  }

  async otp(data: any) {
    console.log('otp', data);
    if (process.env.NODE_ENV === 'production') return;
    this.rahatClient
      .send(
        { cmd: 'slack', dev: true },
        {
          otp: data.otp,
          challenge: data.challenge,
          origin: data.requestInfo.origin,
        }
      )
      .subscribe();
  }
}
