import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { IvrStatus, IvrTemplate } from '@prisma/client';
import { CreateIvrTemplateDto, UpdateIvrTemplateDto } from '@rahataid/extensions';
import { PrismaService } from '@rumsan/prisma';

@Injectable()
export class IvrTemplatesService {
    private readonly logger = new Logger(IvrTemplatesService.name);

    constructor(private readonly prisma: PrismaService) { }

    async create(dto: CreateIvrTemplateDto): Promise<IvrTemplate> {
        try {
            const data = {
                name: dto.name,
                description: dto.description,
                flowUrl: dto.flowUrl,
                ...(dto.flowUrl && { status: IvrStatus.ACTIVE }),
            };

            const template = await this.prisma.ivrTemplate.create({ data });
            return template;
        } catch (error) {
            this.logger.error(error);
            throw error;
        }
    }

    async findAll(): Promise<IvrTemplate[]> {
        try {
            return this.prisma.ivrTemplate.findMany({
                orderBy: { createdAt: 'desc' },
            });
        } catch (error) {
            this.logger.error(error);
            throw error;
        }
    }

    async findOne(id: number): Promise<IvrTemplate> {
        try {
            const template = await this.prisma.ivrTemplate.findUnique({
                where: { id },
            });
            if (!template) {
                throw new NotFoundException(`IVR template with ID ${id} not found`);
            }
            return template;
        } catch (error) {
            this.logger.error(error);
            throw error;
        }
    }

    async update(id: number, dto: UpdateIvrTemplateDto): Promise<IvrTemplate> {
        try {
            await this.findOne(id);
            const data = { ...dto, ...(dto.flowUrl && { status: IvrStatus.ACTIVE }), };

            return this.prisma.ivrTemplate.update({
                where: { id },
                data,
            });
        } catch (error) {
            this.logger.error(error);
            throw error;
        }
    }

    async remove(id: number): Promise<IvrTemplate> {
        try {
            await this.findOne(id);
            return this.prisma.ivrTemplate.update({
                where: { id },
                data: { status: IvrStatus.ARCHIVED },
            });
        } catch (error) {
            this.logger.error(error);
            throw error;
        }
    }
}

