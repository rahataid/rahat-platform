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
    example: ['08e8c1cd-3f65-46db-8408-a4fa3ce104b7', '024f68e9-50db-45a7-987a-d23b925eba52']
  })
  @IsArray()
  beneficiaries: string[]
}
