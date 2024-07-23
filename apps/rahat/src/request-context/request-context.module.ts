import { Global, Module } from "@nestjs/common";
import { RequestContextService } from "./request-context.service";

@Global()
@Module({
    providers: [RequestContextService],
    exports: [RequestContextService]
})
export class RequestContextModule { }