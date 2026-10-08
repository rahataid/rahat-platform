// This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
// If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { BeneficiaryEvents, BQUEUE } from '@rahataid/sdk';
import { EVENTS } from '@rumsan/user';
import { Queue } from 'bull';
import { BeneficiaryStatService } from '../beneficiary/beneficiaryStat.service';
import { EmailService } from './email.service';

const STATS_DEBOUNCE_MS = 5000;

@Injectable()
export class ListenersService {
  private readonly logger = new Logger(ListenersService.name);
  private otp: string;
  private readonly statsTimers = new Map<string, NodeJS.Timeout>();
  private statsRun: Promise<unknown> = Promise.resolve();

  constructor(
    @InjectQueue(BQUEUE.RAHAT_BENEFICIARY) private readonly queue: Queue,
    private readonly benStats: BeneficiaryStatService,
    private emailService: EmailService,
  ) { }

  @OnEvent(BeneficiaryEvents.BENEFICIARY_CREATED)
  @OnEvent(BeneficiaryEvents.BENEFICIARY_UPDATED)
  @OnEvent(BeneficiaryEvents.BENEFICIARY_REMOVED)
  @OnEvent(BeneficiaryEvents.VENDORS_CREATED)
  @OnEvent(BeneficiaryEvents.IMPORTED_TEMP_BENEFICIARIES_FROM_CT)
  @OnEvent(BeneficiaryEvents.IMPORTED_TEMP_BENEFICIARIES_FROM_EXCEL)
  @OnEvent(BeneficiaryEvents.REFRESH_STATS)
  onBeneficiaryChanged(eventObject?: { projectUuid?: string }) {
    this.scheduleStats('global', () => this.benStats.saveGlobalStats());
    if (eventObject?.projectUuid) this.scheduleProjectStats(eventObject.projectUuid);
  }

  // Assignment only changes project membership; global stats are unaffected.
  @OnEvent(BeneficiaryEvents.BENEFICIARY_ASSIGNED_TO_PROJECT)
  onAssignedToProject(eventObject?: { projectUuid?: string }) {
    if (eventObject?.projectUuid) this.scheduleProjectStats(eventObject.projectUuid);
  }

  private scheduleProjectStats(projectUuid: string) {
    this.scheduleStats(`project:${projectUuid}`, () => this.benStats.saveProjectStats(projectUuid));
  }

  // Debounced per key so bursts (imports, batched assignment) recompute once, and run one at a
  // time because each recompute scans the beneficiary table on the shared Prisma pool.
  // ponytail: in-process only; each replica recomputes on its own, move to a shared queue if that hurts
  private scheduleStats(key: string, run: () => Promise<unknown>) {
    clearTimeout(this.statsTimers.get(key));
    this.statsTimers.set(
      key,
      setTimeout(() => {
        this.statsTimers.delete(key);
        this.statsRun = this.statsRun
          .then(run)
          .catch((err) => this.logger.error(`Stats refresh failed (${key})`, err));
      }, STATS_DEBOUNCE_MS)
    );
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
}
