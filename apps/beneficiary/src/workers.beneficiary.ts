import { Global, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Beneficiary } from '@prisma/client';
import { BaseWorker, getQueueByName, QueueUtilsService, RabbitMQModuleOptions } from '@rahataid/queues/rabbitmq';
import { ProjectContants } from '@rahataid/sdk';
import { PrismaService } from '@rumsan/prisma';
import { AmqpConnectionManager, ChannelWrapper } from 'amqp-connection-manager';
import { AMQP_CONNECTION, BENEFICIARY_QUEUE } from './constants';
import { addBulkBeneficiaryToProjectUtil } from './utils/add-beneficiary';

@Global()
@Injectable()
export class BeneficiaryWorker extends BaseWorker<Beneficiary> {
  private channelWrapper: ChannelWrapper;

  constructor(
    @Inject(AMQP_CONNECTION) private readonly connection: AmqpConnectionManager,
    queueUtilsService: QueueUtilsService,
    private readonly prisma: PrismaService,
    @Inject('QUEUE_NAMES') private readonly queuesToSetup: RabbitMQModuleOptions['queues'],
    @Inject(ProjectContants.ELClient) private readonly client: ClientProxy,
  ) {
    const queue = getQueueByName(queuesToSetup, BENEFICIARY_QUEUE);
    super(queueUtilsService, BENEFICIARY_QUEUE, 10, 'batch', connection, queue?.options?.arguments);
  }

  async onModuleInit() {
    try {
      this.channelWrapper = this.connection.createChannel({
        json: true,
        setup: async channel => {
          await this.initializeWorker(channel);
        },
      });
    } catch (err) {
      this.logger.error('Error initializing Beneficiary Worker:', err);
    }
  }

  protected async processItem(batch): Promise<void> {
    this.logger.log(`Processing batch: ${batch.batchIndex}`);

    // Extract the beneficiaries data and project UUID from the batch
    const { data, projectUUID, ignoreExisting, referrerBeneficiary, referrerVendor, type } = batch;


    // Log the received batch for debugging
    this.logger.log(`Received data for batch: ${JSON.stringify(batch)}`);
    console.log('data', batch.data)

    try {
      //wait for 10 seconds
      // await new Promise(resolve => setTimeout(resolve, 10000));
      // Pass the batch to the utility function for further processing
      console.log('here')
      await addBulkBeneficiaryToProjectUtil(data, projectUUID, referrerBeneficiary, referrerVendor, type, this.client, this.prisma)

      this.logger.log('Batch successfully processed and saved to the database.');
    } catch (error) {
      console.log('error', error)
      this.logger.error('Error processing batch:', error);
      throw error; // Requeue if necessary
    }
  }
}
