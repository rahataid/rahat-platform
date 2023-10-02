import { ApiProperty } from '@nestjs/swagger';

export class MailerDTO {
  @ApiProperty({
    example: 'example@example.com',
  })
  emailAddress: string;

  @ApiProperty({
    example: '1234',
  })
  otp: string;
}
