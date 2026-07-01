import { Process, Processor } from "@nestjs/bull";
import { Injectable, Logger } from "@nestjs/common";
import { BQUEUE, ProjectJobs } from "@rahataid/sdk";
import { SettingsService } from "@rumsan/extensions/settings";
import { Job } from "bull";
import { WalletService } from "../wallet/wallet.service";

@Injectable()
@Processor(BQUEUE.FUND_VENDOR_WALLET)
export class WalletProcessor {
    private readonly logger = new Logger(WalletProcessor.name);
    private deployerPrivateKey: string;

    constructor(
        private readonly settings: SettingsService,
        private readonly walletService: WalletService,
    ) { }

    async onModuleInit() {
        const deployerPrivateKey = await this.settings.getByName('DEPLOYER_PRIVATE_KEY');
        this.deployerPrivateKey = deployerPrivateKey?.value as string;
    }

    @Process(ProjectJobs.FUND_VENDOR_WALLET)
    async processFundVendorWallet(job: Job<{ wallet: string }>) {
        const { wallet } = job.data;
        this.logger.log(`Processing fund vendor wallet job for ${wallet}`);
        if (!this.deployerPrivateKey) throw new Error('DEPLOYER_PRIVATE_KEY not set');
        await this.walletService.fundVendorWallet(wallet, this.deployerPrivateKey);
        this.logger.log(`Funded wallet: ${wallet}`);
    }
}
