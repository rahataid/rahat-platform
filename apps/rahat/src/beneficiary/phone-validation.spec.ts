import { ValidationPipe } from '@nestjs/common';
import { CreateBeneficiaryDto, UpdateBeneficiaryDto } from '@rahataid/extensions';
import { Enums } from '@rahataid/sdk';
import { DocParser } from './parser';

describe('beneficiary phone validation', () => {
  const pipe = new ValidationPipe({ transform: true, whitelist: true });
  const create = (phone: unknown) => pipe.transform(
    { piiData: { phone, name: 'Test', extras: { bank: 'bank' } } },
    { type: 'body', metatype: CreateBeneficiaryDto }
  );
  const update = (piiData: object) => pipe.transform(
    { piiData }, { type: 'body', metatype: UpdateBeneficiaryDto }
  );

  it.each(['+9779812345678', '+12', '+123456789012345'])('accepts valid E.164 %s', async (phone) => {
    const result = await create(phone);
    expect(result.piiData).toMatchObject({ phone, name: 'Test', extras: { bank: 'bank' } });
  });

  it.each(['9812345678', '+01234', '+1', '+1234567890123456', '+1 234', '', 1234])(
    'rejects invalid phone %s', async (phone) => {
      await expect(create(phone)).rejects.toThrow();
      await expect(update({ phone })).rejects.toThrow();
    }
  );

  it('allows an update that does not change the phone', async () => {
    await expect(update({ name: 'Updated' })).resolves.toMatchObject({ piiData: { name: 'Updated' } });
  });

  it('reports nested import validation errors without exposing row contents', async () => {
    const buffer = Buffer.from(JSON.stringify([{ piiData: { phone: '123', name: 'Sensitive name' } }]));
    await expect(DocParser(Enums.UploadFileType.JSON, buffer)).rejects.toThrow('E.164 format');
    await expect(DocParser(Enums.UploadFileType.JSON, buffer)).rejects.not.toThrow('Sensitive name');
  });
});
