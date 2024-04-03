import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class StatDto {
  @ApiProperty({
    example: 'GENDER',
    description: 'Name of the stat',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    example: [
      { id: 'FEMALE', count: 848 },
      { id: 'MALE', count: 1052 },
    ],
    description: 'summary data',
    required: true,
  })
  @IsNotEmpty()
  data: object;

  @ApiProperty({
    example: 'pie_chart',
  })
  @IsOptional()
  @IsString()
  group?: string;
}
