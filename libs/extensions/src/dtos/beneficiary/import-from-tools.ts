import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";
import { UUID } from "crypto";


export class ImportTempBenefDto {

  @ApiProperty({
    description: 'Group UUID',
    example: '19d4dcfd-8ed9-42c4-b282-4820b79d6330'
  })
  @IsString()
  @IsNotEmpty()
  groupUUID: UUID
}
