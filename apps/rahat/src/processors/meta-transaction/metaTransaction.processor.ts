import { Process, Processor } from "@nestjs/bull";
import { Inject } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { BQUEUE, ProjectContants } from "@rahataid/sdk";
import { JOBS } from "@rahataid/sdk/project/project.events";
import { lastValueFrom } from "rxjs";
import { ERC2771FORWARDER } from "../../utils/contracts";
import { createContractSigner } from "../../utils/web3";

@Processor(BQUEUE.META_TXN)
export class MetaTransationProcessor {

    constructor(
        @Inject(ProjectContants.ELClient) private readonly client: ClientProxy) { }

    @Process(JOBS.META_TRANSACTION.ADD_QUEUE)
    async processMetaTxn(job: any) {
        const { params, uuid } = job.data;

        const { metaTxRequest, txnUuid } = params;

        // Store txn details in project
        return lastValueFrom(this.client.send({ cmd: 'rahat.jobs.metatxn.call.project', uuid }, {}));

        const forwarderContract = await createContractSigner(
            ERC2771FORWARDER,
            process.env.ERC2771_FORWARDER_ADDRESS
        );

        metaTxRequest.gas = BigInt(metaTxRequest.gas);
        metaTxRequest.nonce = BigInt(metaTxRequest.nonce);
        metaTxRequest.value = BigInt(metaTxRequest.value);

        const tx = await forwarderContract.execute(metaTxRequest);
        const res = await tx.wait();

        // Send success txn to project

        return res;
    }



}