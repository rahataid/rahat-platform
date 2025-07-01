import { faker } from '@faker-js/faker';
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { BeneficiaryJobs } from '@rahataid/sdk';
import { lastValueFrom } from 'rxjs';
import {
    BeneficiaryData,
    BeneficiaryImportConfig,
    StressTestExecutionConfig,
    StressTestExecutionResult,
    StressTestType
} from '../types/stress-test.interface';
import { BaseStressTestStrategy } from './base-stress-test.strategy';

@Injectable()
export class BeneficiaryImportStrategy extends BaseStressTestStrategy {

    constructor(
        @Inject('BEN_CLIENT') private readonly client: ClientProxy,
    ) {
        super();
    }

    getName(): string {
        return 'Beneficiary Import Stress Test';
    }

    getDescription(): string {
        return 'Stress tests the beneficiary import functionality by generating and importing multiple beneficiaries';
    }

    getSupportedTestType(): StressTestType {
        return StressTestType.BENEFICIARY_IMPORT;
    }

    protected validateSpecificConfig(config: StressTestExecutionConfig): boolean {
        const params = config.parameters as BeneficiaryImportConfig;

        if (!params.numberOfBeneficiaries || params.numberOfBeneficiaries <= 0) {
            this.logger.error('numberOfBeneficiaries must be a positive number');
            return false;
        }

        if (params.numberOfBeneficiaries > 10000) {
            this.logger.warn('numberOfBeneficiaries exceeds recommended limit of 10,000');
        }

        if (params.batchSize && (params.batchSize <= 0 || params.batchSize > 1000)) {
            this.logger.error('batchSize must be between 1 and 1000');
            return false;
        }

        return true;
    }

    async execute(config: StressTestExecutionConfig): Promise<StressTestExecutionResult> {
        this.logExecution(config);

        try {
            const params = config.parameters as BeneficiaryImportConfig;
            const startTime = Date.now();

            // Set default values
            const numberOfBeneficiaries = params.numberOfBeneficiaries || 5;
            const groupName = params.groupName || faker.string.uuid();
            const batchSize = params.batchSize || 1;
            const enableValidation = params.enableValidation ?? true;
            const generateBankDetails = params.generateBankDetails ?? true;

            this.logger.log(`Generating ${numberOfBeneficiaries} beneficiaries for group: ${groupName}`);

            // Generate beneficiary data
            const beneficiaries = this.generateBeneficiaryData(
                numberOfBeneficiaries,
                generateBankDetails
            );

            // Prepare import data
            const importData = {
                groupName,
                beneficiaries,
                batchSize,
                batchIndex: 1,
                enableValidation
            };

            // Send to beneficiary service
            const buffer = Buffer.from(JSON.stringify(importData));

            await lastValueFrom(
                this.client.send(
                    { cmd: BeneficiaryJobs.IMPORT_BENEFICIARIES_FROM_COMMUNITY_TOOL },
                    buffer
                )
            );

            const executionTime = Date.now() - startTime;
            const result = this.createSuccessResult(
                `Successfully imported ${numberOfBeneficiaries} beneficiaries to group '${groupName}'`,
                {
                    groupName,
                    numberOfBeneficiaries,
                    batchSize,
                    executionTime
                },
                {
                    totalJobsSubmitted: 1,
                    totalJobsCompleted: 1,
                    averageProcessingTime: executionTime
                }
            );

            this.logSuccess(result);
            return result;

        } catch (error) {
            this.logError(error);
            return this.createErrorResult(
                `Failed to import beneficiaries: ${error.message}`,
                [error.message]
            );
        }
    }

    private generateBeneficiaryData(count: number, includeBankDetails: boolean = true): BeneficiaryData[] {
        const beneficiaries: BeneficiaryData[] = [];

        for (let i = 0; i < count; i++) {
            const gender = faker.helpers.arrayElement(['MALE', 'FEMALE', 'OTHER'] as const);
            const bankedStatus = faker.helpers.arrayElement(['BANKED', 'UNBANKED', 'UNDER_BANKED'] as const);
            const phoneStatus = faker.helpers.arrayElement(['NO_PHONE', 'FEATURE_PHONE', 'SMART_PHONE'] as const);
            const internetStatus = faker.helpers.arrayElement(['NO_INTERNET', 'MOBILE_INTERNET', 'HOME_INTERNET'] as const);

            const beneficiary: BeneficiaryData = {
                firstName: faker.person.firstName(),
                lastName: faker.person.lastName(),
                govtIDNumber: faker.string.numeric(10),
                walletAddress: `0x${faker.string.hexadecimal({ length: 40 })}`,
                gender,
                bankedStatus,
                phoneStatus,
                internetStatus,
                email: faker.internet.email(),
                phone: `+97798${faker.string.numeric(8)}`,
                birthDate: faker.date.birthdate({ min: 18, max: 65, mode: 'age' }).toISOString(),
                location: faker.location.city(),
                latitude: faker.location.latitude(),
                longitude: faker.location.longitude(),
                notes: faker.lorem.sentence(),
                extras: {
                    occupation: faker.person.jobTitle(),
                    education: faker.helpers.arrayElement(['NONE', 'PRIMARY', 'SECONDARY', 'HIGHER']),
                    householdSize: faker.number.int({ min: 1, max: 10 }),
                    income: faker.number.int({ min: 1000, max: 10000 }),
                }
            };

            // Add bank details if requested
            if (includeBankDetails) {
                beneficiary.extras = {
                    ...beneficiary.extras,
                    bank_name: "Nabil Bank Ltd.",
                    bank_ac_name: `Manisha Dhaubanzar`,
                    bank_ac_number: '08110017501011'
                };
            }

            beneficiaries.push(beneficiary);
        }

        return beneficiaries;
    }
} 