import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto'; // Import the crypto module
import * as zlib from 'zlib';
@Injectable()
export class EncryptionService {

  constructor(private readonly configService: ConfigService) { }
  //Take this to the .env file
  private readonly algorithm = this.configService.get('ENCRYPTION_ALGORITHM')
  private readonly secretKey = this.configService.get('ENCRYPTION_KEY')

  private generateKey(key: string) {
    crypto.createHash('sha256').update(key).digest();
  }

  encrypt(data: string) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      this.algorithm,
      this.secretKey,
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
      this.secretKey,
      Buffer.from(ivHex, 'hex'),
    );

    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));

    const decryptedText = Buffer.concat([
      decipher.update(Buffer.from(encryptedTextHex, 'hex')),
      decipher.final(),
    ]);

    return decryptedText.toString('utf-8');
  }

}
