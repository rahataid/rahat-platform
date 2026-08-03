import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class ListBeneficiariesByGroupDto {
  @ApiPropertyOptional({ example: 'createdAt' })
  @IsString()
  @IsOptional()
  sort?: string;

  @ApiPropertyOptional({ example: 'desc' })
  @IsString()
  @IsOptional()
  order?: 'asc' | 'desc';

  @ApiPropertyOptional({ example: 1 })
  @IsNumber()
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ example: '10' })
  @IsNumber()
  @IsOptional()
  perPage?: number;

  @ApiPropertyOptional({ example: 'John Doe' })
  @IsString()
  @IsOptional()
  name?: string;
}

export class ListBeneficiaryGroupDto {
  @ApiProperty({ example: 'createdAt' })
  @IsString()
  @IsOptional()
  sort: string;

  @ApiProperty({ example: 'asc' })
  @IsString()
  @IsOptional()
  order: 'asc' | 'desc';

  @ApiProperty({ example: 1 })
  @IsNumber()
  page: number;

  @ApiProperty({ example: '10' })
  @IsNumber()
  perPage: number;

  @ApiPropertyOptional({ example: 'd8f61ebb-ae83-4a8b-8f36-ed756aa27d12' })
  @IsString()
  @IsOptional()
  projectId?: string;
}

// export class ListProjectBeneficiaryDto {

//   @ApiProperty({ example: "ENROLLED" })
//   @IsString()
//   @IsOptional()
//   sort: string;

//   @ApiProperty({ example: "ENROLLED" })
//   @IsString()
//   @IsOptional()
//   order: 'asc' | 'desc';

//   @ApiProperty({ example: 1 })
//   @IsNumber()
//   page: number;

//   @ApiProperty({ example: 10 })
//   @IsNumber()
//   perPage: number;

//   @ApiProperty({ example: "ENROLLED" })
//   @IsString()
//   @IsOptional()
//   status: string;

//   @ApiProperty({ example: "NOT_ASSIGNED" })
//   @IsString()
//   @IsOptional()
//   type: string;

//   @ApiProperty({ example: 'd8f61ebb-ae83-4a8b-8f36-ed756aa27d12' })
//   @IsString()
//   @IsNotEmpty()
//   projectId: string;
// }
