import { InjectQueue } from '@nestjs/bull';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BQUEUE, BeneficiaryJobs, ValidateWallet, VerifySignature } from '@rahataid/sdk';
import { PrismaService } from '@rumsan/prisma';
import type { Address } from 'abitype';
import { Queue } from 'bull';
import * as crypto from 'crypto'; // Import the crypto module
import { UUID } from 'crypto';
import { recoverMessageAddress } from 'viem';



@Injectable()
export class VerificationService {

    constructor(private readonly configService: ConfigService,
        protected prisma: PrismaService,
        @InjectQueue(BQUEUE.RAHAT_BENEFICIARY)
        private readonly beneficiaryQueue: Queue,
    ) { }
    private readonly algorithm = 'aes-256-cbc'
    private readonly privateKey = this.configService.get('PRIVATE_KEY')
    private iv = crypto.randomBytes(16)
    // private wallet = privateKeyToAccount(this.privateKey)


    getSecret = () => {
        if (!this.privateKey) {
            throw new Error('No PRIVATE_KEY found in config file');
        }
        const hash = crypto.createHash('sha256');
        hash.update(this.privateKey);
        return hash.digest('hex').split('').slice(0, 32).join('');
    };

    encrypt(data: string): string {
        console.log(this.privateKey, this.iv, this.algorithm)
        const cipher = crypto.createCipheriv(this.algorithm, Buffer.from(this.getSecret()), this.iv)
        let encrypted = cipher.update(data)
        encrypted = Buffer.concat([encrypted, cipher.final()])
        return encrypted.toString('hex')
    }

    decrypt(data: string): string {
        const encryptedText = Buffer.from(data, 'hex')
        const decipher = crypto.createDecipheriv(this.algorithm, Buffer.from(this.getSecret()), this.iv)
        let decrypted = decipher.update(encryptedText)
        decrypted = Buffer.concat([decrypted, decipher.final()])
        return decrypted.toString('utf-8')

    }

    async generateLink(uuid: UUID) {
        const findUuid = await this.prisma.beneficiary.findUnique({
            where: { uuid },
            include: {
                pii: true,
            },
        });
        if (!findUuid) throw new Error('Data not Found');

        const encrypted = this.encrypt(findUuid.walletAddress);
        const email = findUuid.pii.email;
        const name = findUuid.pii.name;
        await this.beneficiaryQueue.add(BeneficiaryJobs.SEND_EMAIL, {
            encrypted,
            email,
            name,
        });
        return 'Success';
    }

    //set Beneficiary as verified based on walletAddress
    async setBeneficiaryAsVerified(walletAddress: string) {
        const ben = await this.prisma.beneficiary.findFirst({
            where: { walletAddress },
        });
        if (!ben) throw new Error('Data not Found');

        return this.prisma.beneficiary.update({
            where: { uuid: ben.uuid },
            data: {
                isVerified: true,
            },
        });
    }

    async validateWallet(validationData: ValidateWallet) {
        const { walletAddress, encryptedData } = validationData
        const decrypted = this.decrypt(encryptedData);
        console.log({ decrypted, walletAddress })
        if (decrypted === walletAddress.toString()) {
            this.setBeneficiaryAsVerified(walletAddress);

            return "success"
        }
        throw new UnauthorizedException('Invalid wallet address')
    }


    async verifySignature(verificationData: VerifySignature) {
        const decryptedAddress = this.decrypt(verificationData.encryptedData) as Address;
        console.log({ decryptedAddress: decryptedAddress.toString() })
        const recoveredAddress = await recoverMessageAddress({
            message: verificationData.encryptedData,
            signature: verificationData.signature,
        })
        console.log({ recoveredAddress })
        if (decryptedAddress === recoveredAddress) {
            this.setBeneficiaryAsVerified(decryptedAddress);
            return 'Success';
        }
        throw new UnauthorizedException('Wallet Not Verified');
    }
}
