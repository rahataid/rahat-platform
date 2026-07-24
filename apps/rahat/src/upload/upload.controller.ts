// This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
// If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
import {
  Controller,
  Injectable,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { FileUploadDto } from '@rahataid/extensions';
import { UploadService } from './upload.service';
@Controller('upload')
@ApiTags('Upload')
@Injectable()
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Upload file',
    type: FileUploadDto,
  })
  @Post('file')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: any,
    @Query('withFileName') withFileName?: string,
    @Query('folderName') folderNameParam?: string,
    @Query('rootFolderName') rootFolderNameParam?: string
  ) {
    const buffer = file.buffer;
    const mimeType = file.mimetype;
    const fileName = file.originalname.replace(/\s/g, '-');

    const folderName = folderNameParam || 'dev';
    const rootFolderName = rootFolderNameParam || 'aa';
    const shouldUploadWithFileName =
      String(withFileName).toLowerCase() === 'true' ||
      String(withFileName) === '1';

    return await this.uploadService.uploadFile(
      buffer,
      mimeType,
      fileName,
      folderName,
      rootFolderName,
      shouldUploadWithFileName
    );
  }
}
