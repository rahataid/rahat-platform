import { Process, Processor } from "@nestjs/bull";
import { Inject } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { BQUEUE, MS_TIMEOUT } from "@rahataid/sdk";
import { JOBS } from "@rahataid/sdk/project/project.events";
import { timeout } from "rxjs";
import { ERC2771FORWARDER } from "../../utils/contracts";
import { createContractSigner } from "../../utils/web3";

@Processor(BQUEUE.META_TXN)
export class MetaTransationProcessor {

    constructor(
        @Inject('RAHAT_CLIENT') private readonly client: ClientProxy,
    ) { }

    @Process(JOBS.META_TRANSACTION.ADD_QUEUE)
    async processMetaTxn(job: any) {

        // Add txn details for offline txn

        const { params } = job;
        const { metaTxRequest, uuid } = params;
        const forwarderContract = await createContractSigner(
            ERC2771FORWARDER,
            process.env.ERC2771_FORWARDER_ADDRESS
        );

        metaTxRequest.gas = BigInt(metaTxRequest.gas);
        metaTxRequest.nonce = BigInt(metaTxRequest.nonce);
        metaTxRequest.value = BigInt(metaTxRequest.value);
        const tx = await forwarderContract.execute(metaTxRequest);

        const res = await tx.wait();

        uuid && await this.sendCmd(JOBS.META_TRANSACTION.PROJECT_CALL, uuid, res.data);

        return res;
    }

    async sendCmd(cmd: string, uuid: string, payload) {
        return this.client.send({ cmd, uuid }, {
            ...payload
        }).pipe(
            timeout(MS_TIMEOUT)
        );
    }



}