import { faker } from '@faker-js/faker';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { BeneficiaryJobs } from '@rahataid/sdk';
import { PrismaService } from '@rumsan/prisma';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class StressTestingService {
    private readonly logger = new Logger(StressTestingService.name);

    constructor(
        protected prisma: PrismaService,
        @Inject('BEN_CLIENT') private readonly client: ClientProxy,
    ) { }

    private generateBeneficiaryData(numberOfBeneficiaries: number) {
        const beneficiaries: any[] = [];
        for (let i = 0; i < numberOfBeneficiaries; i++) {
            const gender = faker.helpers.arrayElement(['MALE', 'FEMALE', 'OTHER']);
            const bankedStatus = faker.helpers.arrayElement(['BANKED', 'UNBANKED', 'UNDER_BANKED']);
            const phoneStatus = faker.helpers.arrayElement(['NO_PHONE', 'FEATURE_PHONE', 'SMART_PHONE']);
            const internetStatus = faker.helpers.arrayElement(['NO_INTERNET', 'MOBILE_INTERNET', 'HOME_INTERNET']);

            beneficiaries.push({
                firstName: faker.person.firstName(),
                lastName: faker.person.lastName(),
                govtIDNumber: faker.string.numeric(10),
                walletAddress: `0x${faker.string.hexadecimal({ length: 40 })}`,
                gender,
                bankedStatus,
                phoneStatus,
                internetStatus,
                email: faker.internet.email(),
                phone: faker.phone.number(),
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
                    bank_name: "Kamana Sewa Bikas Bank Ltd.",
                    bank_ac_name: "Ankit Neupane",
                    bank_ac_number: "0010055573200018",
                }
            });
        }
        return beneficiaries;
    }

    async executeBenfImport(config: {
        numberOfBeneficiaries: number;
    }) {
        try {
            console.log(`Executing beneficiary import with config: ${JSON.stringify(config)}`);

            if (!config.numberOfBeneficiaries) {
                config.numberOfBeneficiaries = 5;
            }

            console.log(`Generating ${config.numberOfBeneficiaries} beneficiaries`);

            const benfs = await Promise.all(this.generateBeneficiaryData(config.numberOfBeneficiaries));

            this.logger.log(`Generated dummy beneficiaries: ${benfs.length}`);

            const info: {
                groupName: string;
                beneficiaries: any;
            } = {
                groupName: faker.string.uuid(),
                beneficiaries: benfs,
            };

            console.log(`Group name: ${info.groupName}`);
            console.log('--------------------------------');
            console.log(`Stress testing started`);
            console.log('--------------------------------');

            const data = Buffer.from(
                JSON.stringify({
                    ...info,
                    batchSize: 1,
                    batchIndex: 1,
                })
            );

            lastValueFrom(this.client.send(
                {
                    cmd: BeneficiaryJobs.IMPORT_BENEFICIARIES_FROM_COMMUNITY_TOOL,
                },
                data
            ));

            console.log('--------------------------------');
            console.log(`Stress testing completed, waiting for 2 seconds`);
            console.log('--------------------------------');


            console.log(`Successfully imported ${config.numberOfBeneficiaries} beneficiaries`);

            // await new Promise(resolve => setTimeout(resolve, 2000)); // sleep for 2 seconds

            console.log('--------------------------------');
            console.log(`Finding temp group`);
            console.log('--------------------------------');

            console.log(`Temp group name: ${info.groupName}`);

            const tempGroup = await this.prisma.tempGroup.findFirst({
                where: {
                    name: info.groupName
                }
            });

            if (!tempGroup) {
                return {
                    success: false,
                    message: `Group not found with name ${info.groupName}`
                };
            }

            return this.client.send(
                { cmd: BeneficiaryJobs.IMPORT_TEMP_BENEFICIARIES },
                {
                    groupUUID: tempGroup.uuid,
                }
            );

        } catch (error) {
            console.log(`Error: ${error}`);
            return {
                success: false,
                message: `Error: ${error}`
            };
        }
    }
}
