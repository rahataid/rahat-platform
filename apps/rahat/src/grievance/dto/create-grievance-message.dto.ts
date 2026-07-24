import { ApiProperty } from '@nestjs/swagger';
import { CreateGrievanceDTO } from '@rahataid/extensions';
import { Grievance } from '@rahataid/sdk';
import { IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateGrievanceMessageDTO {
  @ApiProperty()
  data: CreateGrievanceDTO & { projectId: string };

  @ApiProperty()
  @IsNumber()
  userId: number;

  @ApiProperty()
  @IsString()
  @IsUUID()
  projectId: string;
}

export class UpdateGrievanceMessageDTO {
  @ApiProperty()
  data: Partial<Grievance>;

  @ApiProperty()
  @IsUUID()
  uuid: string;
}

export class DeleteGrievanceMessageDTO {
  @ApiProperty()
  uuid: string;

  @ApiProperty()
  @IsOptional()
  userId?: number;
}
