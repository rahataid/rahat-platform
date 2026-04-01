import QRCode from 'qrcode';
import { generateQRCode } from './qrGenerator';

jest.mock('qrcode', () => ({
    toBuffer: jest.fn()
}));

describe('generateQRCode', () => {
    it('should return a buffer when input is a string', async () => {
        const input = 'Jest Test';
        const mockBuffer = Buffer.from('mock-buffer');
        (QRCode.toBuffer as jest.Mock).mockResolvedValue(mockBuffer);
        const result = await generateQRCode(input);
        expect(result).toBe(mockBuffer);
        expect(QRCode.toBuffer).toHaveBeenCalledWith(input.toString());
    });

    it('should convert non-string inputs via toString and return a buffer', async () => {
        const input = 12345;
        const mockBuffer = Buffer.from('mock-buffer');
        (QRCode.toBuffer as jest.Mock).mockResolvedValue(mockBuffer);
        const result = await generateQRCode(input as any);
        expect(result).toBe(mockBuffer);
        expect(QRCode.toBuffer).toHaveBeenCalledWith(input.toString());
    });
});
