import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class BlockchainVendorDTO {
  @ApiProperty({
    example: 'getBalance',
  })
  @IsString()
  @IsNotEmpty()
  method: string;

  @ApiProperty({
    example: ['0x123456abcdef'],
  })
  @IsArray()
  params: any[];
}
