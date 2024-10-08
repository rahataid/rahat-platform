import { Process, Processor } from "@nestjs/bull";
import { Inject } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { BQUEUE } from "@rahataid/sdk";
import { JOBS } from "@rahataid/sdk/project/project.events";
import { ERC2771FORWARDER } from "../../utils/contracts";
import { createContractSigner } from "../../utils/web3";

@Processor(BQUEUE.META_TXN)
export class MetaTransationProcessor {

    constructor(@Inject('RAHAT_CLIENT') private readonly client: ClientProxy) { }

    @Process(JOBS.META_TRANSACTION.ADD_QUEUE)
    async processMetaTxn(job: any) {
        const { params, uuid } = job.data;

        const { metaTxRequest, txnUuid } = params;

        // Store txn details in project

        // This is not redirecting
        // return this.client.send({ cmd: 'rahat.jobs.metatxn.call.project', uuid: '56a4fba3-5408-448e-89ac-377d4df7b4ec', payload: {} }, { msg: 'This is test msgss!' }).pipe(timeout(MS_TIMEOUT))

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