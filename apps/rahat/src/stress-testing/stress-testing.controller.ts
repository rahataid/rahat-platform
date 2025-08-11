import {
    Body,
    Controller,
    Get,
    Post,
    ValidationPipe
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { StressTestingService } from './stress-testing.service';
import {
    BeneficiaryImportConfig,
    StressTestExecutionConfig,
    StressTestExecutionResult,
    StressTestType
} from './types/stress-test.interface';

@Controller('stress-test')
@ApiTags('Stress Testing')
export class StressTestingController {
    constructor(
        private readonly stressTestingService: StressTestingService,
    ) { }

    @Post('execute')
    @ApiOperation({ summary: 'Execute a stress test with specified configuration' })
    @ApiResponse({ status: 200, description: 'Stress test executed successfully' })
    @ApiResponse({ status: 400, description: 'Invalid configuration' })
    @ApiBody({
        description: 'Stress test configuration',
        examples: {
            beneficiaryImport: {
                summary: 'Beneficiary Import Stress Test',
                value: {
                    testType: 'beneficiary_import',
                    parameters: {
                        numberOfBeneficiaries: 100,
                        groupName: 'test-group',
                        batchSize: 10,
                        enableValidation: true,
                        generateBankDetails: true
                    }
                }
            }
        }
    })
    async executeStressTest(
        @Body(ValidationPipe) config: StressTestExecutionConfig
    ): Promise<StressTestExecutionResult> {
        return this.stressTestingService.executeStressTest(config);
    }

    @Post('start')
    @ApiOperation({
        summary: 'Legacy endpoint - Execute beneficiary import stress test',
        deprecated: true
    })
    @ApiResponse({ status: 200, description: 'Legacy stress test executed successfully' })
    async startTest(@Body() config: any): Promise<StressTestExecutionResult> {
        return this.stressTestingService.executeBenfImport(config);
    }

    @Get('strategies')
    @ApiOperation({ summary: 'Get all available stress test strategies' })
    @ApiResponse({ status: 200, description: 'List of available strategies' })
    async getStrategies() {
        return {
            supportedTypes: this.stressTestingService.getSupportedTestTypes(),
            strategies: this.stressTestingService.getStrategyInfo()
        };
    }

    @Post('validate')
    @ApiOperation({ summary: 'Validate stress test configuration without executing' })
    @ApiResponse({ status: 200, description: 'Configuration validation result' })
    async validateConfig(
        @Body(ValidationPipe) config: StressTestExecutionConfig
    ): Promise<{ valid: boolean; message: string }> {
        const isValid = await this.stressTestingService.validateConfig(config);
        return {
            valid: isValid,
            message: isValid ? 'Configuration is valid' : 'Configuration is invalid'
        };
    }

    @Post('beneficiary-import')
    @ApiOperation({ summary: 'Execute beneficiary import stress test with typed parameters' })
    @ApiResponse({ status: 200, description: 'Beneficiary import stress test executed' })
    @ApiBody({
        description: 'Beneficiary import configuration',
        examples: {
            simple: {
                summary: 'Simple beneficiary import',
                value: {
                    numberOfBeneficiaries: 50,
                    groupName: 'stress-test-group'
                }
            },
            advanced: {
                summary: 'Advanced beneficiary import',
                value: {
                    numberOfBeneficiaries: 1000,
                    groupName: 'large-stress-test',
                    batchSize: 50,
                    enableValidation: true,
                    generateBankDetails: false
                }
            }
        }
    })
    async executeBeneficiaryImport(
        @Body(ValidationPipe) parameters: BeneficiaryImportConfig
    ): Promise<StressTestExecutionResult> {
        const config: StressTestExecutionConfig = {
            testType: StressTestType.BENEFICIARY_IMPORT,
            parameters
        };
        return this.stressTestingService.executeStressTest(config);
    }
}
