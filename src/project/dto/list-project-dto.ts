import { ApiProperty } from '@nestjs/swagger';
import { BankStatus, InternetAccess, PhoneOwnership } from '@prisma/client';
import { IsOptional, IsString } from 'class-validator';

interface ProjectFilter {
  name?: string;
  orderBy?: string;
}

interface ProjectBeneficiaryFilter {
  name?: string;
  orderBy?: string;
  phone?: string;
  walletAddress?: string;
  order?: 'asc' | 'desc';
  bankStatus: BankStatus;
  phoneOwnership: PhoneOwnership;
  internetAccess: InternetAccess;
}

export class ListProjectDto {
  @ApiProperty({
    description: 'Page to load',
    example: '1',
    required: false,
  })
  @IsString()
  @IsOptional()
  page?: string;

  @ApiProperty({
    example: '10',
    required: false,
  })
  @IsString()
  @IsOptional()
  perPage?: string;

  @ApiProperty({
    type: 'string',
    required: false,
  })
  @IsOptional()
  name?: ProjectFilter['name'];

  @ApiProperty({
    type: 'string',
    required: false,
  })
  orderBy: ProjectFilter['orderBy'];
}

export class ListProjectBeneficiaryDto {
  @ApiProperty({
    description: 'Page to load',
    example: '1',
    required: false,
  })
  @IsString()
  @IsOptional()
  page?: string;

  @ApiProperty({
    example: '10',
    required: false,
  })
  @IsString()
  @IsOptional()
  perPage?: string;

  @ApiProperty({
    type: 'string',
    required: false,
  })
  @IsOptional()
  name?: ProjectBeneficiaryFilter['name'];

  @ApiProperty({
    type: 'string',
    required: false,
  })
  @IsOptional()
  phone?: ProjectBeneficiaryFilter['phone'];

  @ApiProperty({
    type: 'string',
    required: false,
  })
  @IsOptional()
  walletAddress?: ProjectBeneficiaryFilter['walletAddress'];

  @ApiProperty({
    type: 'string',
    required: false,
    example: 'name',
  })
  orderBy: ProjectBeneficiaryFilter['orderBy'];

  @ApiProperty({
    type: 'string',
    required: false,
    example: 'asc',
  })
  order: ProjectBeneficiaryFilter['order'];

  @ApiProperty({
    type: PhoneOwnership,
    required: false,
  })
  @IsOptional()
  phoneOwnership?: ProjectBeneficiaryFilter['phoneOwnership'];

  @ApiProperty({
    type: BankStatus,
    required: false,
  })
  @IsOptional()
  bankStatus?: ProjectBeneficiaryFilter['bankStatus'];

  @ApiProperty({
    type: InternetAccess,
    required: false,
  })
  @IsOptional()
  internetAccess?: ProjectBeneficiaryFilter['internetAccess'];
}
