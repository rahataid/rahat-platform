import { Process, Processor } from "@nestjs/bull";
import { Injectable, Logger } from "@nestjs/common";
import { BQUEUE, ProjectJobs } from "@rahataid/sdk";
import { SettingsService } from "@rumsan/extensions/settings";
import { Job } from "bull";
import { ethers, JsonRpcProvider } from "ethers";
import { ChainConfig } from "../wallet/types/chain-config.interface";

@Injectable()
@Processor(BQUEUE.FUND_VENDOR_WALLET)
export class WalletProcessor {
    private readonly logger = new Logger(WalletProcessor.name);
    private rpcUrl: string;
    private deployerPrivateKey: string;

    constructor(private readonly settings: SettingsService) { }

    async onModuleInit() {
        const chainSettings = await this.settings.getByName('CHAIN_SETTINGS');
        const deployerPrivateKey = await this.settings.getByName('DEPLOYER_PRIVATE_KEY');
        this.rpcUrl = (chainSettings?.value as unknown as ChainConfig)?.rpcUrl;
        this.deployerPrivateKey = deployerPrivateKey?.value as string;
    }

    @Process(ProjectJobs.FUND_VENDOR_WALLET)
    async processFundVendorWallet(job: Job<{ wallet: string }>) {
        const { wallet } = job.data;
        this.logger.log(`Processing fund vendor wallet job for ${wallet}`);

        try {
            if (!this.rpcUrl) throw new Error('rpcUrl is not set — check CHAIN_SETTINGS');
            if (!this.deployerPrivateKey) throw new Error('deployerPrivateKey is not set — check DEPLOYER_PRIVATE_KEY');

            const provider = new JsonRpcProvider(this.rpcUrl);
            const signer = new ethers.Wallet(this.deployerPrivateKey, provider);
            const tx = { to: wallet, value: ethers.parseEther('0.01') };

            const transactionResponse = await signer.sendTransaction(tx);
            this.logger.log(`Funding transaction sent: ${transactionResponse.hash}`);
            await transactionResponse.wait();
            this.logger.log(`Funding transaction confirmed: ${transactionResponse.hash}`);
        } catch (error) {
            this.logger.error(`Failed to fund vendor wallet ${wallet}: ${(error as Error).message}`);
            throw error;
        }
    }
}