import { Process, Processor } from "@nestjs/bull";
import { Inject, Logger } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { BQUEUE, MS_TIMEOUT, ProjectContants } from "@rahataid/sdk";
import { JOBS } from "@rahataid/sdk/project/project.events";
import { timeout } from "rxjs";
import { ERC2771FORWARDER } from "../../utils/contracts";
import { createContractSigner, getBlocktimeStamp } from "../../utils/web3";

@Processor(BQUEUE.META_TXN)
export class MetaTransationProcessor {
    private readonly logger = new Logger(MetaTransationProcessor.name);
    constructor(
        @Inject(ProjectContants.ELClient) private readonly client: ClientProxy) { }

    @Process(JOBS.META_TRANSACTION.ADD_QUEUE)
    async processMetaTxn(job: any) {
        this.logger.log(`Added job ${job.id} to queue`)
        await sleep(3000);
        const { params, uuid } = job.data;

        const { metaTxRequest, txnUuid, txnDetails } = params;

        const forwarderContract = await createContractSigner(
            ERC2771FORWARDER,
            process.env.ERC2771_FORWARDER_ADDRESS
        );

        metaTxRequest.gas = BigInt(metaTxRequest.gas);
        metaTxRequest.nonce = BigInt(metaTxRequest.nonce);
        metaTxRequest.value = BigInt(metaTxRequest.value);
        try {
            const tx = await forwarderContract.execute(metaTxRequest);

            const res = await tx.wait()
            const blockTimestamp = await getBlocktimeStamp(res.hash)
            const payload: any = { res, vendorAddress: metaTxRequest.from }

            if (txnUuid) {
                payload.txnUuid = txnUuid;
                payload.txnDetails = txnDetails;
                payload.blockTimestamp = blockTimestamp;
            }

            // Todo: Remove .toPromise()
            await this.client.send({ cmd: JOBS.META_TRANSACTION.PROJECT_CALL, uuid }, payload)
                .pipe(timeout(MS_TIMEOUT)).toPromise();
            console.log(res)
            this.logger.warn(`Processed job ${job.id}`)
            return res;
        } catch (error) {
            console.log(error)
        }

    }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));