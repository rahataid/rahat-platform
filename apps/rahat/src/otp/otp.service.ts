import { Injectable } from '@nestjs/common';
import { CreateClaimDto } from '@rahataid/extensions';

@Injectable()
export class OtpService {

    async addOtpToClaim(data: CreateClaimDto) {

    }

    async getOtp(phone, vendor) {
        phone = phone.toString();
        // const otp = await pinService(phone, vendor);
        // if (!otp) return null;
        // return otp.toString();
    }
}


