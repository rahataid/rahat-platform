import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsNumber } from "class-validator";


export class ListOfframpProviderDto {
  @ApiPropertyOptional({ example: 1 })
  @IsNumber()
  page: number;

  @ApiPropertyOptional({ example: '10' })
  @IsNumber()
  perPage: number;

}
