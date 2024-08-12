// email.service.ts

import { Injectable } from '@nestjs/common';
import { SettingsService } from '@rumsan/extensions/settings';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter;

  constructor() { }

  initialize() {
    if (!this.transporter) {
      console.log('Initializing email service');
      try {
        this.transporter = nodemailer.createTransport({
          pool: true,
          host: SettingsService.get('SMTP.HOST'),
          port: SettingsService.get('SMTP.PORT'),
          secure: SettingsService.get('SMTP.SECURE'),
          auth: {
            user: SettingsService.get('SMTP.USERNAME'),
            pass: SettingsService.get('SMTP.PASSWORD'),
          },
        });
      } catch {
        throw new Error("SMTP settings not available")
      }
    }
  }

  async sendEmail(
    to: string,
    subject: string,
    text: string,
    html?: string
  ): Promise<void> {
    try {
      this.initialize();
      const mailOptions = {
        from: SettingsService.get('SMTP.USERNAME'), // Replace with your email
        to: to,
        subject: subject,
        text: text,
        html: html,
      };
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent:', info.messageId);
    } catch (error) {
      //console.error('Error sending email:', error);
      //throw error; // Or handle it as per your application needs
    }
  }
}
