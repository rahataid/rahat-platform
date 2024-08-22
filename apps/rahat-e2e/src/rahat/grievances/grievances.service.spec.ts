import { GrievanceService } from '../../../../rahat/src/grievance/grievance.service';
import { PrismaService } from '@rumsan/prisma';
import { GrievanceType, GrievanceStatus } from '@rahataid/sdk';
import { createGrievanceDTO, expectedGrievance } from './testFixtureData';

jest.mock('@rumsan/prisma', () => ({
    PrismaService: jest.fn().mockImplementation(() => ({
        grievance: {
            create: jest.fn(),
            findMany: jest.fn(),
        },
    })),
}));

describe('GrievanceService', () => {
    let grievanceService: GrievanceService;
    let prismaService: PrismaService;

    beforeEach(async () => {
        prismaService = new PrismaService();
        grievanceService = new GrievanceService(prismaService);
    });

    it('should create a new grievance', async () => {
        const userId = 1;
        prismaService.grievance.create = jest.fn().mockResolvedValue(expectedGrievance);
        const result = await grievanceService.createGrievance(createGrievanceDTO, userId);
        expect(result).toEqual(expectedGrievance);
        expect(prismaService.grievance.create).toHaveBeenCalledTimes(1);
        expect(prismaService.grievance.create).toHaveBeenCalledWith({
            data: {
                title: 'Test Grievance',
                description: 'This is a test grievance',
                project: {
                    connect: {
                        uuid: 'project-uuid',
                    },
                },
                reporterUser: {
                    connect: {
                        id: userId,
                    },
                },
                status: GrievanceStatus.NEW,
                reporterContact: "9843848488",
                type: GrievanceType.TECHNICAL,
                reportedBy: 'Hello Test',
            },
        });
    });

    it('should return list of grievances', async () => {
        prismaService.grievance.findMany = jest.fn().mockResolvedValue()
    });
});
