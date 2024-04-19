// email.service.ts

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class MessageSenderService {
    private readonly url
    constructor(
        private readonly configService: ConfigService,
    ) {
        this.url = this.configService.get('MESSAGE_SENDER_API');
    }

    async sendWhatappMessage(
        payload
    ): Promise<void> {

        axios.post(this.url, payload).catch((error) => {
            console.error(error);
        });
    }
}
