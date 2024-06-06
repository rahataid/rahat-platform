import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsString } from "class-validator";


export class ImportTempBenefDto {

  @ApiProperty({
    description: 'Group Name',
    example: 'Demo'
  })
  @IsString()
  groupName: string

  @ApiProperty({
    description: 'Beneficiaries',
    example: ['1f3b3b3b-3b3b-3b3b-3b3b-3b3b3b3b3b3b', '1f3b3b3b-3b3b-3b3b-3b3b-3b3b3b3b3b3b']
  })
  @IsArray()
  beneficiaries: string[]
}
