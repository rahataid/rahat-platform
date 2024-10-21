import { Process, Processor } from "@nestjs/bull";
import { Inject, Logger } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { BQUEUE, MS_TIMEOUT } from "@rahataid/sdk";
import { JOBS } from "@rahataid/sdk/project/project.events";
import { timeout } from "rxjs";
import { ERC2771FORWARDER } from "../../utils/contracts";
import { createContractSigner } from "../../utils/web3";

@Processor(BQUEUE.META_TXN)
export class MetaTransationProcessor {

    private readonly logger = new Logger(MetaTransationProcessor.name);

    constructor(@Inject('RAHAT_CLIENT') private readonly client: ClientProxy) { }

    @Process(JOBS.META_TRANSACTION.ADD_QUEUE)
    async processMetaTxn(job: any) {

        this.logger.log(`Added job ${job.id} to queue`)
        const { params, uuid } = job.data;

        console.log("reached 0")
        const { metaTxRequest, txnUuid } = params;

        // Todo: Remove .toPromise()
        txnUuid && await this.client.send({ cmd: JOBS.META_TRANSACTION.PROJECT_CALL, uuid }, { txnUuid, metaTxRequest })
            .pipe(timeout(MS_TIMEOUT)).toPromise();

        const forwarderContract = await createContractSigner(
            ERC2771FORWARDER,
            process.env.ERC2771_FORWARDER_ADDRESS
        );

        console.log(metaTxRequest);

        metaTxRequest.gas = BigInt(metaTxRequest.gas);
        metaTxRequest.nonce = BigInt(metaTxRequest.nonce);
        metaTxRequest.value = BigInt(metaTxRequest.value);

        console.log("reached 2")
        const tx = await forwarderContract.execute(metaTxRequest);

        console.log("reached 3")
        const res = await tx.wait()

        console.log(res)

        // Todo: Remove .toPromise()
        await this.client.send({ cmd: JOBS.META_TRANSACTION.PROJECT_CALL, uuid }, { walletAddress: metaTxRequest.from })
            .pipe(timeout(MS_TIMEOUT)).toPromise();

        this.logger.warn(`Processed job ${job.id}`)
        return res;

    }
}