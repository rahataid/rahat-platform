import { Process, Processor } from "@nestjs/bull";
import { Inject, Logger } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { Project } from "@prisma/client";
import { BQUEUE, ProjectJobs } from "@rahataid/sdk";
import { Job } from "bull";

@Processor(BQUEUE.RAHAT_PROJECT)
export class ProjectProcessor {
    private readonly logger = new Logger(ProjectProcessor.name)

    constructor(
        @Inject('DEPLOYMENT_CLIENT') private readonly client: ClientProxy,
    ) { }

    @Process(ProjectJobs.PROJECT_CREATE)
    async processProjectCreation(job: Job<Project>) {
        this.logger.log("######## SENDING TASK TO WORKER ###########")

        const formattedProjectName = job.data.name.trim().split(/\s+/).join('_');
        const dbName = `rahat_${formattedProjectName}`;
        const deploymentRoot = process.env.DEPLOYMENT_ROOT;

        // fetch from db or assign responsibility to worker
        const environmentVariables = {
            PRIVATE_KEY: process.env.PRIVATE_KEY,
            REDIS_HOST: process.env.REDIS_HOST,
            REDIS_PORT: process.env.REDIS_PORT,
            REDIS_PASSWORD: process.env.REDIS_PASSWORD,
            DB_HOST: process.env.DB_HOST,
            DB_PORT: process.env.DB_PORT,
            DB_USERNAME: process.env.DB_USERNAME,
            DB_PASSWORD: process.env.DB_PASSWORD,
            DB_NAME: dbName,
            PROJECT_ID: job.data.uuid,
            DATABASE_URL: `postgresql://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${dbName}?schema=public`,
            DEPLOYER_PRIVATE_KEY: process.env.DEPLOYER_PRIVATE_KEY,
            ADMIN_PRIVATE_KEY: process.env.ADMIN_PRIVATE_KEY,
            VENDOR_PRIVATE_KEY: process.env.VENDOR_PRIVATE_KEY,
            RAHAT_ADMIN_PRIVATE_KEY: process.env.RAHAT_ADMIN_PRIVATE_KEY,
            VENDOR_WALLET: process.env.VENDOR_WALLET,
            ENROLLED_BENEFICIARY: process.env.ENROLLED_BENEFICIARY,
            NETWORK_PROVIDER: process.env.NETWORK_PROVIDER,
            NETWORK_ID: process.env.NETWORK_ID,
            CHAIN_NAME: process.env.CHAIN_NAME,
            CHAIN_ID: process.env.CHAIN_ID,
            CURRENCY_NAME: process.env.CURRENCY_NAME,
            CURRENCY_SYMBOL: process.env.CURRENCY_SYMBOL,
        };

        const dockerConfig = {
            deploymentPath: `${deploymentRoot}/${job.data.uuid}`,
            containerName: `${formattedProjectName}_container`,
            serviceName: `${formattedProjectName}_service`,
            imageName: "esatya/rahat-project-el:dev" //pull from db 
        }

        const workerPayload = {
            environmentVariables,
            dockerConfig
        }

        return this.client.emit({ cmd: "project.create" }, workerPayload);
    }
}
