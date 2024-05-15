import { ApiProperty } from '@nestjs/swagger';

export class FileUploadDto {
  @ApiProperty({ type: 'string', format: 'binary' })
  file: any;

  // @ApiProperty({ type: 'string', description: 'Folder name' })
  // folderName: string;

  // @ApiProperty({ type: 'string', description: 'Root folder name' })
  // rootFolderName: string;
}
