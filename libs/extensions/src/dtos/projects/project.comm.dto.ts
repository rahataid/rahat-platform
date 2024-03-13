import { ApiProperty } from '@nestjs/swagger';
import { IsObject, IsString } from 'class-validator';

export class ProjectCommunicationDto {
  @ApiProperty({ example: 'beneficiary.create', type: 'string' })
  @IsString()
  action: string;

  @ApiProperty({ example: { name: 'John Doe' }, type: 'object' })
  @IsObject()
  payload: any;
}
