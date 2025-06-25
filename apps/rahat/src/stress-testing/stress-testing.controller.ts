// stress-testing.controller.ts
import {
    Body,
    Controller,
    Post
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { StressTestingService } from './stress-testing.service';

@Controller('stress-test')
@ApiTags('Stress Testing')
export class StressTestingController {
    constructor(
        private readonly stressTestingService: StressTestingService,
    ) { }

    @Post('start')
    async startTest(@Body() config: any) {
        return this.stressTestingService.executeBenfImport(config);
    }
}
