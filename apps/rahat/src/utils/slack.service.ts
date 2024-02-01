import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class SlackService {
  private readonly webhookUrl =
    'https://hooks.slack.com/triggers/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';

  async send(message: string): Promise<void> {
    try {
      const data = {
        email: 'rahat@mailinator.com',
        message: message,
      };

      await axios.post(this.webhookUrl, data);
    } catch (error) {
      // Handle any errors here
      console.error('Error posting data to webhook:', error);
      throw error;
    }
  }
}
