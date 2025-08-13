import { Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { CreateClaimDto } from '@rahataid/extensions';
import { SettingsService } from '@rumsan/extensions/settings';
import { PrismaService } from '@rumsan/prisma';
import { englishToNepaliNumber } from 'nepali-number';
import prabhu from './sms/prabhu';

@Injectable()
export class OtpService {
    private readonly logger = new Logger(OtpService.name);

    constructor(
        protected prisma: PrismaService,
    ) { }

    async addOtpToClaim(data: CreateClaimDto) {
        const useStaticOtp = await this.getFromSettings('USE_STATIC_OTP')
        const staticOtp = +await this.getFromSettings('STATIC_OTP')

        const transportId = await this.getFromSettings('SMS_TRANSPORT_ID')
        const appId = await this.getFromSettings('APP_ID')
        const url = await this.getFromSettings('URL')

        if (!transportId || !appId || !url) {
            throw new RpcException('SMS_TRANSPORT_ID, APP_ID, URL are required')
        }

        if (useStaticOtp && staticOtp)
            this.logger.log(`Using static OTP: ${staticOtp} for phone number: ${data.phoneNumber}`);

        const otp = (useStaticOtp && staticOtp) ? staticOtp : await this.getOtp();
        this.logger.log(`Generated OTP: ${otp} for phone number: ${data.phoneNumber}`);

        const message = await this.createMessage(
            otp,
            data.amount)
        const sms = await this.loadSmsModule();

        await sms(data.phoneNumber, message, {
            transportId,
            appId,
            url
        });
        this.logger.log(`OTP Sent to phone number: ${data.phoneNumber}`);
        return { otp };
    }

    private async getOtp() {
        return Math.floor(1000 + Math.random() * 9000).toString()
    }

    private async loadSmsModule() {
        const smsModules = {
            prabhu,
        };
        const serviceName: string = await this.getFromSettings('provider') || 'prabhu';

        const module = smsModules[serviceName];

        return module;
    };

    private async createMessage(otp: string | number, amount: string | number) {
        let message: string = await this.getFromSettings('message') || 'नमस्ते, तपाईंको ओ.टी.पी ${otp} हो र तपाईंलाई प्राप्त हुने रकम रू. ${amount} हो। धन्यवाद - राहत';

        if (message.includes('${amount}')) {
            message = message.replace('${amount}', englishToNepaliNumber(amount.toString()));
        }
        if (message.includes('${otp}')) {
            message = message.replace('${otp}', englishToNepaliNumber(otp.toString()));
        }

        return message;
    }

    async getFromSettings(key: string) {
        const settings = new SettingsService(this.prisma);
        const smsSettings: any = await settings.getSettingsByName('COMMUNICATION')
        const result = smsSettings.value[key];
        return result;
    }

}


