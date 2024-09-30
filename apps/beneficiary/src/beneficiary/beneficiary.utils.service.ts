import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { Beneficiary } from '@prisma/client';
import { AddToProjectDto, ListBeneficiaryDto } from '@rahataid/extensions';
import { AAPayload, BeneficiaryConstants, BeneficiaryEvents, BeneficiaryJobs, BeneficiaryPayload, generateRandomWallet, ProjectContants } from '@rahataid/sdk';
import { PaginatorTypes, PrismaService } from '@rumsan/prisma';
import { lastValueFrom } from 'rxjs';
import { isAddress } from 'viem';

@Injectable()
export class BeneficiaryUtilsService {
    constructor(private readonly prismaService: PrismaService, private eventEmitter: EventEmitter2, @Inject(ProjectContants.ELClient) private readonly client: ClientProxy) { }

    buildWhereClause(dto: ListBeneficiaryDto): Record<string, any> {
        const { projectId, startDate, endDate } = dto;
        const where: any = { deletedAt: null };

        if (projectId) {
            where.BeneficiaryProject =
                projectId === 'NOT_ASSGNED' ? { none: {} } : { some: { projectId } };
        }

        if (startDate && endDate) {
            where.createdAt = { gte: new Date(startDate), lte: new Date(endDate) };
        } else if (startDate) {
            where.createdAt = { gte: new Date(startDate) };
        } else if (endDate) {
            where.createdAt = { lte: new Date(endDate) };
        }

        return where;
    }

    // Method to attach PII data to the result
    async attachPiiData(
        result: PaginatorTypes.PaginatedResult<Beneficiary>
    ): Promise<PaginatorTypes.PaginatedResult<Beneficiary>> {
        const resultData = result.data;

        if (resultData.length > 0) {
            const beneficiaryIds = resultData.map((d) => d.id);
            const benfPiiData = await this.prismaService.beneficiaryPii.findMany({
                where: { beneficiaryId: { in: beneficiaryIds } },
            });

            const piiDataMap = new Map(
                benfPiiData.map((pii) => [pii.beneficiaryId, pii])
            );

            result.data = resultData.map((d) => ({
                ...d,
                piiData: piiDataMap.get(d.id) || null,
            }));
        }

        return result;
    }

    async ensureValidWalletAddress(walletAddress?: string): Promise<string> {
        if (!walletAddress) {
            return generateRandomWallet().address;
        }

        const existingBeneficiary = await this.prismaService.beneficiary.findUnique(
            {
                where: { walletAddress },
            }
        );

        if (existingBeneficiary) {
            throw new RpcException('Wallet address already exists');
        }
        if (!isAddress(walletAddress)) {
            throw new RpcException('Wallet should be valid Ethereum Address');
        }
        return walletAddress;
    }

    async ensureUniquePhone(phone: string): Promise<void> {
        const existingPiiData = await this.prismaService.beneficiaryPii.findUnique({
            where: { phone },
        });
        if (existingPiiData) {
            throw new RpcException('Phone number should be unique');
        }
    }

    async addPIIData(beneficiaryId: string, piiData: any): Promise<void> {
        await this.prismaService.beneficiaryPii.create({
            data: {
                beneficiaryId,
                phone: piiData.phone.toString(),
                ...piiData,
            },
        });
    }

    async assignToProjects(beneficiaryUuid: string, projectUuids: string[]): Promise<void> {
        const assignPromises = projectUuids.map((projectUuid) => {
            return this.assignBeneficiaryToProject({
                beneficiaryId: beneficiaryUuid,
                projectId: projectUuid
            })
        })

        await Promise.all(assignPromises)
    }

    async assignBeneficiaryToProject(assignBeneficiaryDto: AddToProjectDto) {
        const { beneficiaryId, projectId } = assignBeneficiaryDto;

        //fetch project and beneficiary detail in parallel
        const [projectData, beneficiaryData] = await Promise.all([
            this.prismaService.project.findUnique({ where: { uuid: projectId } }),
            this.prismaService.beneficiary.findUnique({
                where: { uuid: beneficiaryId },
                include: { pii: true }
            })
        ])

        if (!projectData) return;
        if (!beneficiaryData) throw new RpcException('Beneficiary not Found.')

        //Build Project Payload
        const projectPayload = this.buildProjectPayload(projectData, beneficiaryData)

        //Save beneficiary to Project
        await this.saveBeneficiaryToProject({
            beneficiaryId, projectId
        })

        this.eventEmitter.emit(BeneficiaryEvents.BENEFICIARY_ASSIGNED_TO_PROJECT, {
            projectUuid: projectId
        })

        return lastValueFrom(
            this.client.send({
                cmd: BeneficiaryJobs.ADD_TO_PROJECT, uuid: projectId
            }, projectPayload)
        )

    }


    private buildProjectPayload(projectData: any, beneficiaryData: any) {
        const payload: BeneficiaryPayload = {
            uuid: beneficiaryData.uuid,
            walletAddress: beneficiaryData.walletAddress,
            extras: beneficiaryData.extras || null,
            type: BeneficiaryConstants.Types.ENROLLED,
            isVerified: beneficiaryData.isVerified
        }

        //Handle aa project type
        if (projectData.type.toLowerCase() === 'aa') {
            delete payload.type;
            (payload as AAPayload).gender = beneficiaryData.gender;
            payload.extras = { ...payload.extras, phone: beneficiaryData.pii.phone }
        }

        return payload;

    }

    async saveBeneficiaryToProject(dto: AddToProjectDto) {
        return this.prismaService.beneficiaryProject.create({ data: dto })
    }


}

