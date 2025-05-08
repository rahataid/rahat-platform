import { Injectable } from '@nestjs/common';
import { CreateClaimDto } from '@rahataid/extensions';
import { SettingsService } from '@rumsan/extensions/settings';
import { PrismaService } from '@rumsan/prisma';
import prabhu from './sms/prabhu';

@Injectable()
export class OtpService {

    constructor(
        protected prisma: PrismaService,
    ) { }

    async addOtpToClaim(data: CreateClaimDto) {
        const otp = await this.getOtp();
        const message = await this.createMessage(
            otp,
            data.amount)
        const sms = await this.loadSmsModule();
        await sms(data.phoneNumber, message, {
            appId: this.getFromSettings('prabhu', 'appId'),
            token: this.getFromSettings('prabhu', 'token'),
            url: this.getFromSettings('prabhu', 'url')
        });
        return { otp };
    }

    private async getOtp() {
        return Math.floor(1000 + Math.random() * 9000).toString()
    }

    private async loadSmsModule() {
        const smsModules = {
            prabhu,
        };
        const serviceName: string = await this.getFromSettings('prabhu', 'provider') || 'prabhu';

        const module = smsModules[serviceName];

        return module;
    };

    private async createMessage(otp: string | number, amount: string | number) {
        let message: string = await this.getFromSettings('prabhu', 'message') || 'Hi, your OTP is ${otp} and the amount is ${amount}';

        if (message.includes('${amount}')) {
            message = message.replace('${amount}', amount.toString());
        }
        if (message.includes('${otp}')) {
            message = message.replace('${otp}', otp.toString());
        }

        return message;
    }

    async getFromSettings(provider: string, key: string) {
        const settings = new SettingsService(this.prisma);
        const smsSettings: any = await settings.getByName('SMS_SETTINGS')
        const result = smsSettings.value.find(item => item.provider === "prabhu");
        return result[key];
    }
}


