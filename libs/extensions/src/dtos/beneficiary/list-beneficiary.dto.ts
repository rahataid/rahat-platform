import { ApiPropertyOptional } from '@nestjs/swagger';
// import { PaginationDto } from '@rumsan/extensions/dtos';
import { IsOptional, IsString } from 'class-validator';

export class ListBeneficiaryDto {
  // @IsIn(['createdAt', 'updatedAt', 'fullName', 'gender'])
  // override sort = 'createdAt';

  // override order: 'asc' | 'desc' = 'desc';

  @ApiPropertyOptional({ example: 'd8f61ebb-ae83-4a8b-8f36-ed756aa27d12' })
  @IsString()
  @IsOptional()
  projectId?: string;

  @ApiPropertyOptional({ example: 'MALE' })
  @IsString()
  @IsOptional()
  gender?: string;

  @ApiPropertyOptional({ example: 'REFERRED' })
  @IsString()
  @IsOptional()
  type?: string;
}
