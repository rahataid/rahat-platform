// This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
// If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
import { Process, Processor } from "@nestjs/bull";
import { Inject, Logger, OnModuleInit } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { BQUEUE, MS_TIMEOUT, ProjectContants } from "@rahataid/sdk";
import { JOBS } from "@rahataid/sdk/project/project.events";
import { SettingsService } from "@rumsan/extensions/settings";
import { timeout } from "rxjs";
import { ERC2771FORWARDER } from "../../utils/contracts";
import { createContractSigner } from "../../utils/web3";

@Processor(BQUEUE.META_TXN)
export class MetaTransationProcessor implements OnModuleInit {
    private readonly logger = new Logger(MetaTransationProcessor.name);
    private rpcUrl: string;
    private deployerPrivateKey: string;
    private forwarderAddress: string;

    constructor(
        @Inject(ProjectContants.ELClient) private readonly client: ClientProxy,
        private readonly settings: SettingsService,
    ) { }

    async onModuleInit() {
        const chainSettings = await this.settings.getByName('CHAIN_SETTINGS');
        const deployerPrivateKey = await this.settings.getByName('DEPLOYER_PRIVATE_KEY');
        const contracts = await this.settings.getByName('CONTRACTS');

        this.rpcUrl = (chainSettings?.value as any)?.rpcUrl;
        this.deployerPrivateKey = deployerPrivateKey?.value as string;
        this.forwarderAddress = (contracts?.value as any)?.ERC2771FORWARDER?.ADDRESS;
    }

    @Process(JOBS.META_TRANSACTION.ADD_QUEUE)
    async processMetaTxn(job: any) {
        this.logger.log(`Added job ${job.id} to queue`)
        await sleep(3000);
        this.logger.log(`Job ${job.id}: sleep done, reading job data`)
        const { params, trigger } = job.data;

        const { metaTxRequest } = params;
        this.logger.log(`Job ${job.id}: metaTxRequest ${JSON.stringify(metaTxRequest)}`)

        this.logger.log(`Job ${job.id}: creating forwarder contract signer for ${this.forwarderAddress}`)
        const forwarderContract = await createContractSigner(
            ERC2771FORWARDER,
            this.forwarderAddress,
            this.rpcUrl,
            this.deployerPrivateKey
        );
        this.logger.log(`Job ${job.id}: forwarder contract signer ready`)

        metaTxRequest.gas = BigInt(metaTxRequest.gas);
        metaTxRequest.nonce = BigInt(metaTxRequest.nonce);
        metaTxRequest.value = BigInt(metaTxRequest.value);
        this.logger.log(`Job ${job.id}: casted gas/nonce/value to BigInt`)

        this.logger.log(`Job ${job.id}: sending execute() tx`)
        const tx = await forwarderContract.execute(metaTxRequest);
        this.logger.log(`Job ${job.id}: tx sent, hash ${tx.hash}, waiting for confirmation`)
        const res = await tx.wait();
        this.logger.log(`Job ${job.id}: tx confirmed, status ${res.status}`)

        let triggerData = {
            payload: trigger?.payload
        }
        if (trigger?.spreadPayload) triggerData = { ...trigger?.payload }

        try {
            if (trigger) {
                this.logger.log(`Job ${job.id}: sending trigger event ${trigger.event_name} for project ${trigger.projectUuid}`)
                await this.client.send({ cmd: trigger.event_name, uuid: trigger.projectUuid }, triggerData)
                    .pipe(timeout(MS_TIMEOUT)).toPromise();
                this.logger.log(`Job ${job.id}: trigger event sent`)
            }
        } catch (error) {
            this.logger.error(`Job ${job.id}: trigger event failed`, error)
        }


        this.logger.warn(`Processed job ${job.id}`)
        return res;

    }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));