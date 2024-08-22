import * as dotenv from 'dotenv';
dotenv.config();
import { faker } from '@faker-js/faker';
import { GrievanceType, GrievanceStatus } from '@rahataid/sdk';
import { randomUUID } from 'crypto';
import { CreateGrievanceDTO } from '@rahataid/extensions';

export const grievanceData = {
    projectId: process.env.PROJECT_ID,
    reporterContact: faker.phone.number(),
    title: faker.internet.domainWord(),
    description: faker.lorem.lines(),
    type: faker.helpers.enumValue(GrievanceType),
    status: faker.helpers.enumValue(GrievanceStatus),
    reportedBy: faker.person.fullName()
};

export const errorGrievance = {
    reporterContact: faker.phone.number(),
    title: faker.internet.domainWord(),
    description: faker.lorem.lines(),
    type: faker.helpers.enumValue(GrievanceType),
    status: faker.helpers.enumValue(GrievanceStatus),
    reportedBy: faker.person.fullName()
};

export const grievanceQuery = {
    sort: 'createdAt',
    order: 'asc',
    page: 1,
    perPage: 10,
    projectId: process.env.PROJECT_ID
};

export const errorGrievanceQuery = {
    sort: 'createdAt',
    order: 'asc',
    page: 1,
    perPage: 10,
    projectId: randomUUID()
};

export const createGrievanceDTO: CreateGrievanceDTO = {
    projectId: 'project-uuid',
    title: 'Test Grievance',
    description: 'This is a test grievance',
    reporterContact: "9843848488",
    type: GrievanceType.TECHNICAL,
    reportedBy: 'Hello Test',
    status: GrievanceStatus.NEW
};

export const expectedGrievance = {
    id: 1,
    title: 'Test Grievance',
    description: 'This is a test grievance',
    // projectId: 'project-uuid',
    reporterUserId: 1,
    status: GrievanceStatus.NEW,
};