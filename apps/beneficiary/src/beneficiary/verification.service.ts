import { InjectQueue } from '@nestjs/bull';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BQUEUE, BeneficiaryJobs, validateWallet } from '@rahataid/sdk';
import { PrismaService } from '@rumsan/prisma';
import { Queue } from 'bull';
import * as crypto from 'crypto'; // Import the crypto module
import { UUID } from 'crypto';
import * as zlib from 'zlib';

@Injectable()
export class VerificationService {

    constructor(private readonly configService: ConfigService,
        protected prisma: PrismaService,
        @InjectQueue(BQUEUE.RAHAT_BENEFICIARY)
        private readonly beneficiaryQueue: Queue,
    ) { }
    private readonly algorithm = 'aes-256-gcm'
    private readonly privateKey = this.configService.get('PRIVATE_KEY')

    getSecret = () => {
        if (!this.privateKey) {
            throw new Error('No PRIVATE_KEY found in config file');
        }
        const hash = crypto.createHash('sha256');
        hash.update(this.privateKey);
        return hash.digest('hex').split('').slice(0, 32).join('');
    };

    encrypt(data: string) {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(
            this.algorithm,
            this.getSecret(),
            iv
        );
        let encrypted = cipher.update(data, 'utf-8');
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        const tag = cipher.getAuthTag();

        // Combine IV, tag, and encryptedText with a delimiter
        const combinedData = `${iv.toString('hex')}:${tag.toString(
            'hex',
        )}:${encrypted.toString('hex')}`;

        // Compress the combined data
        const compressedData = zlib.deflateSync(combinedData);

        // Return the compressed data as a base64-encoded string
        return compressedData.toString('base64');
    }



    decrypt(data: string) {
        const compressedData = Buffer.from(data, 'base64');
        const decompressedData = zlib.inflateSync(compressedData).toString('utf-8');

        const [ivHex, tagHex, encryptedTextHex] = decompressedData.split(':');

        const decipher = crypto.createDecipheriv(
            this.algorithm,
            this.getSecret(),
            Buffer.from(ivHex, 'hex'),
        );

        decipher.setAuthTag(Buffer.from(tagHex, 'hex'));

        const decryptedText = Buffer.concat([
            decipher.update(Buffer.from(encryptedTextHex, 'hex')),
            decipher.final(),
        ]);

        return decryptedText.toString('utf-8');
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

    async validateWallet(validationData: validateWallet) {
        const { walletAddress, encryptedData } = validationData
        const decrypted = this.decrypt(encryptedData);

        if (decrypted === walletAddress.toString()) {
            return "success"
        }
        throw new UnauthorizedException('Invalid wallet address')
    }

    async verifySignature(data: string, signature: string) {
    }


}
