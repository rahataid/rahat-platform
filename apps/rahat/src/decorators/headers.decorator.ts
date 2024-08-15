import { SetMetadata } from '@nestjs/common';

export const CHECK_HEADERS_KEY = 'checkHeaders';

export const CheckHeaders = (...headers: string[]) => SetMetadata(CHECK_HEADERS_KEY, headers);
