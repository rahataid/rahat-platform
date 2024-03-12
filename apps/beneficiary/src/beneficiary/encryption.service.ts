import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto'; // Import the crypto module

@Injectable()
export class EncryptionService {
  //Take this to the .env file
  private readonly algorithm = 'aes-256-cbc';
  private readonly secretKey = 'vOVH6sdmpNWjRRIqCc7rdxs01lwHzfr3';

  encrypt(data: string) {
    const cipher = crypto.createCipheriv(
      this.algorithm,
      Buffer.from(this.secretKey),
      crypto.randomBytes(16)
    );
    let encrypted = cipher.update(data);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return encrypted.toString('hex');
  }

  decrypt(data: string) {
    const iv = Buffer.from(this.secretKey, 'hex');
    const encryptedText = Buffer.from(data, 'hex');
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      this.secretKey,
      iv
    );
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  }
}
