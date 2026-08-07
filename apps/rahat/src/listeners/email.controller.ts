// This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
// If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { EmailJobs } from '@rahataid/sdk';
import { EmailService } from './email.service';

@Controller()
export class EmailController {
  constructor(private readonly emailService: EmailService) { }

  @MessagePattern({ cmd: EmailJobs.SEND_EMAIL })
  sendEmail(
    @Payload()
    payload: {
      to: string | string[];
      subject: string;
      text: string;
      html?: string;
    }
  ) {
    return this.emailService.sendEmail(
      payload.to,
      payload.subject,
      payload.text,
      payload.html
    );
  }
}
