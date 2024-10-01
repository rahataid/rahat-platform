import { Process, Processor } from "@nestjs/bull";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { BQUEUE } from "@rahataid/sdk";
import { JOBS } from "@rahataid/sdk/project/project.events";

@Processor(BQUEUE.META_TXN)
export class MetaTransationProcessor {

    constructor(
        private eventEmitter: EventEmitter2,
    ) { }

    @Process(JOBS.META_TRANSACTION.ADD_QUEUE)
    async processMetaTxn(job: any) {
        const res = await job.tx.wait();
        const EVENT = job.event;
        res.data && this.eventEmitter.emit(EVENT, { data: res.data });
        return res;
    }

}