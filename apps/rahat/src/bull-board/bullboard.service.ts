import { createBullBoard } from '@bull-board/api';
import { BullAdapter, } from '@bull-board/api/bullAdapter';
import { FastifyAdapter } from '@bull-board/fastify';
import { InjectQueue } from '@nestjs/bull';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { Queue } from 'bull';


@Injectable()
export class BullBoardService implements OnModuleInit {
  constructor(
    @InjectQueue('RAHAT_BENEFICIARY') private readonly beneficiaryQueue: Queue,
    @InjectQueue('RAHAT') private readonly rahatQueue: Queue,
    @InjectQueue('RAHAT_PROJECT') private readonly projectQueue: Queue,
    @InjectQueue('HOST') private readonly hostQueue: Queue,
    @InjectQueue('META_TXN') private readonly metaTxnQueue: Queue,
  ) { }

  onModuleInit() {
    const serverAdapter = new FastifyAdapter();
    serverAdapter.setBasePath('/admin/queues');

    createBullBoard({
      queues: [
        new BullAdapter(this.beneficiaryQueue),
        new BullAdapter(this.rahatQueue),
        new BullAdapter(this.projectQueue),
        new BullAdapter(this.hostQueue),
        new BullAdapter(this.metaTxnQueue),
      ],
      serverAdapter,
    });

    // Removed the return statement as FastifyAdapter does not have a getRouter method
  }
}
