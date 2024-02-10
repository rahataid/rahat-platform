import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
export class CreateProjectDto {
  @ApiProperty({
    type: 'string',
    required: true,
    example: 'Blood Bank',
  })
  @IsString()
  name: string;

  // @ApiProperty({
  //   required: true,
  //   example: '0x1234567890123456789012345678901234567890',
  // })
  // @IsString()
  // @IsNotEmpty()
  // contractAddress: string;

  @ApiProperty({
    type: 'string',
    required: false,
    example: 'A project about blood donation',
  })
  @IsString()
  @IsOptional()
  description?: string;

  // @ApiProperty({
  //   type: 'number',
  //   required: false,
  //   example: 1,
  // })
  // @IsNumber()
  // @IsOptional()
  // owner?: number;

  @ApiProperty({
    type: 'string',
    required: false,
    example: 'anticipatory-action',
  })
  @IsString()
  type?: string;

  @ApiProperty({
    type: 'string',
    required: false,
    example: 'Some extra information',
  })
  @IsString()
  @IsOptional()
  extras?: string;
}
