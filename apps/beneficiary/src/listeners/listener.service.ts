// This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
// If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { BeneficiaryEvents, BQUEUE } from '@rahataid/sdk';
import { EVENTS } from '@rumsan/user';
import { Queue } from 'bull';
import { BeneficiaryStatService } from '../beneficiary/beneficiaryStat.service';
import { EmailService } from './email.service';
@Injectable()
export class ListenersService {
  private otp: string;

  constructor(
    @InjectQueue(BQUEUE.RAHAT_BENEFICIARY) private readonly queue: Queue,
    private readonly benStats: BeneficiaryStatService,
    private emailService: EmailService,
  ) { }

  @OnEvent(BeneficiaryEvents.BENEFICIARY_CREATED)
  @OnEvent(BeneficiaryEvents.BENEFICIARY_UPDATED)
  @OnEvent(BeneficiaryEvents.BENEFICIARY_REMOVED)
  @OnEvent(BeneficiaryEvents.BENEFICIARY_ASSIGNED_TO_PROJECT)
  @OnEvent(BeneficiaryEvents.VENDORS_CREATED)
  async onBeneficiaryChanged(eventObject) {
    await this.benStats.saveAllStats(eventObject.projectUuid);
  }

  @OnEvent(EVENTS.OTP_CREATED)
  async sendOTPEmail(data: any) {
    this.otp = data.otp;
    this.emailService.sendEmail(
      data.address,
      'Login OTP',
      'Login OTP',
      `
        <div style="max-width:800px;max-height: 600px;overflow:auto;line-height:2;background: #333333;">
          <div style="margin:50px auto;width:70%;padding:40px 40px; border: 1px solid #fff; border-radius: 12px;">
            <div style="text-align: center;">
              <img src='https://assets.rumsan.net/rumsan-group/rahat-logo-white.png' width="250" title="stage4all" alt="stage4all">
            </div>
            <div style="color:#fff; text-align: center;">
              <h4 style="font-size:1.3em;">Your Rahat system login code</h4>
              <h2
                style="background: #373737;margin: 0 auto;width: 100%;padding: 0 10px;color: #fff;border-radius: 4px; letter-spacing: 10px">
                ${data.otp}</h2>
            </div>
            <div style="color: #fff; text-align: left;">
              <p>This is a one-time-code that expires in 5 minutes.</p>
              <p style="font-size:0.9em;">Please DO NOT share your code with anyone. Rahat team will never ask for it.</p>
            </div>
            <hr style=" border-top: 1px solid rgb(73, 72, 72)" />
            <div style="color:#fff!important">
              <p>If you didn't attempt to sign up but received this email, please ignore.
              </p>
              <p>
                Regards,<br />
                Team Rahat
              </p>
            </div>
          </div>
        </div>
      `
    );
  }

  @OnEvent(BeneficiaryEvents.DISBURSEMENT_CREATED)
  async sendDisbursementEmail(data: any) {
    this.emailService.sendEmail(
      data.email,
      'USDC Received',
      'USDC Received',
      `
       <div style="max-width: 600px; margin: 40px auto; padding: 30px; background: #1E1E1E; border-radius: 12px; box-shadow: 0px 4px 10px rgba(255, 255, 255, 0.1); font-family: Arial, sans-serif; text-align: center;">
          <div style="margin-bottom: 20px;">
            <img src="https://assets.rumsan.net/rumsan-group/rahat-logo-white.png" width="200" alt="Rahat Logo">
          </div>
          <h4 style="color: #ffffff; font-size: 1.4em; font-weight: 600; margin-bottom: 15px;">
            You have successfully received <span style="color: #00FFAA;">${data.amount} USDC</span>
          </h4>
          <p style="color: #bbbbbb; font-size: 1em; margin-bottom: 25px;">
            If you want to convert your funds to local currency, you can use our <a href="https://bit.ly/rahat-offramping" style="color: #00FFAA; text-decoration: none; font-weight: 600;">off-ramping service</a>.
          </p>
          <hr style="border-top: 1px solid #444;">
          <p style="color: #bbbbbb; font-size: 0.9em; margin-top: 20px;">
            Regards,<br> Team Rahat
          </p>
        </div>

      `
    );
  }

}
