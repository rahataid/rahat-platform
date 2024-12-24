import { Global, Inject, Injectable, OnModuleInit } from "@nestjs/common";
import { AmqpConnectionManager, ChannelWrapper } from "amqp-connection-manager";
import { ConfirmChannel } from 'amqplib';
import { QueueUtilsService } from "./queue-utils.service";
import { BaseWorker } from "./worker.base";


@Global()
@Injectable()
export class BeneficiaryWorker extends BaseWorker<Record<string, any>[]> implements OnModuleInit {
  constructor(
    @Inject('AMQP_CONNECTION') private readonly connection: AmqpConnectionManager,
    queueUtilsService: QueueUtilsService
  ) {
    super(queueUtilsService, 'beneficiary-queue', 10, 'batch', connection); // Queue name and default batch size
  }

  private channelWrapper: ChannelWrapper;

  async onModuleInit() {
    try {
      this.channelWrapper = this.connection.createChannel({
        json: true,
        setup: async (channel: ConfirmChannel) => {
          await this.initializeWorker(channel);
        },
      });

      this.channelWrapper.on('close', () => {
        this.logger.error('AMQP channel closed');
      });

      this.channelWrapper.on('error', (err) => {
        this.logger.error('AMQP channel error:', err);
      });

      this.logger.log('Beneficiary Worker initialized.');
    } catch (err) {
      this.logger.error('Error initializing Beneficiary Worker:', err);
    }
  }

  protected async processItem(item): Promise<void> {
    // this.logger.log(`Processing beneficiary: ${JSON.stringify(item, null, 2)}`);
    console.log(
      `Last Batch Index: ${item[0].batchIndex}, Batch Size: ${item[0].batchSize}, Beneficiary: ${JSON.stringify(item.)}`
    )

    // this.prisma.create(item.data);

    // Add business login here
    return await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate async processing
    // this.logger.log(`Beneficiary processed: ${JSON.stringify(item, null, 2)}`);
  }


}

