import { Module } from "@nestjs/common";
import { RahatProcessor } from "./rahat.processor";
import { ProjectProcessor } from "./project.processor";
import { ClientsModule, Transport } from "@nestjs/microservices";

@Module({
    imports: [
        ClientsModule.register([
            {
                name: 'DEPLOYMENT_CLIENT',
                transport: Transport.REDIS,
                options: {
                    host: process.env.REDIS_HOST,
                    port: +process.env.REDIS_PORT,
                    password: process.env.REDIS_PASSWORD,
                },
            },
        ])
    ],
    providers: [RahatProcessor, ProjectProcessor]
})
export class ProcessorsModule { }