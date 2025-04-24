import { Injectable } from '@nestjs/common';
import { CreateClaimDto } from '@rahataid/extensions';
import prabhu from './sms/prabhu';

@Injectable()
export class OtpService {

    async addOtpToClaim(data: CreateClaimDto) {
        const otp = await this.getOtp();
        const message = await this.createMessage(
            otp,
            data.amount)
        const sms = await this.loadSmsModule();
        await sms(data.phoneNumber, message);
        return { otp };
    }

    private async getOtp() {
        return Math.floor(1000 + Math.random() * 9000).toString()
    }

    private async loadSmsModule() {
        const smsModules = {
            prabhu,
        };
        const serviceName: string = process.env.SMS_SERVICE || 'prabhu';

        const module = smsModules[serviceName];

        return module;
    };

    private async createMessage(otp: string | number, amount: string | number) {
        let message: string = process.env.OTP_MESSAGE || 'Hi, your OTP is ${otp} and the amount is ${amount}';

        if (message.includes('${amount}')) {
            message = message.replace('${amount}', amount.toString());
        }
        if (message.includes('${otp}')) {
            message = message.replace('${otp}', otp.toString());
        }

        return message;
    }
}


