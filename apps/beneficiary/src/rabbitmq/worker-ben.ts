import { Global, Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { AmqpConnectionManager, ChannelWrapper } from 'amqp-connection-manager';
import { ConfirmChannel } from 'amqplib';

@Global()
@Injectable()
export class BeneficiaryWorker implements OnModuleInit {
  private readonly logger = new Logger(BeneficiaryWorker.name);

  constructor(
    @Inject('AMQP_CONNECTION') private readonly connection: AmqpConnectionManager,
  ) { }

  async onModuleInit() {
    try {
      const channelWrapper: ChannelWrapper = this.connection.createChannel({
        json: true,
        setup: async (channel: ConfirmChannel) => {
          await channel.assertQueue('beneficiary-queue', { durable: true });
          await channel.consume('beneficiary-queue', async (message) => {
            if (message) {
              const data = JSON.parse(message.content.toString());
              this.logger.log(`Received message: ${JSON.stringify(data)}`);
              await this.processMessage(data, channel, message);
            }
          });
        },
      });

      this.logger.log('Beneficiary Worker initialized.');
    } catch (err) {
      this.logger.error('Error initializing Beneficiary Worker:', err);
    }
  }

  private async processMessage(data: any, channel: ConfirmChannel, message: any) {
    try {
      this.logger.log('Starting message processing...');
      await this.processBeneficiary(data);
      this.logger.log('Message processing completed.');
      channel.ack(message); // Acknowledge the message after processing
      this.logger.log('Message acknowledged.');
    } catch (error) {
      this.logger.error('Error processing message:', error);
      // Optionally, you can handle the error and decide whether to nack the message
      // channel.nack(message);
    }
  }

  private async processBeneficiary(beneficiary: any) {
    this.logger.log(`Processing beneficiary: ${JSON.stringify(beneficiary)}`);
    await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate async processing
    this.logger.log(`Beneficiary processed: ${JSON.stringify(beneficiary)}`);
  }
}
