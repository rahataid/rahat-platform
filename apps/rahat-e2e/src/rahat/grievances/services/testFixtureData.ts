import { CreateGrievanceDTO } from "@rahataid/extensions";
import { GrievanceStatus, GrievanceType } from "@rahataid/sdk";

export const createGrievanceDTO: CreateGrievanceDTO = {
    // id: '1',
    // uuid: "uuid",
    projectId: process.env.PROJECT_ID,
    title: 'Test Grievance',
    description: 'This is a test grievance',
    reporterContact: "9843848488",
    type: GrievanceType.TECHNICAL,
    reportedBy: 'Hello Test',
    status: GrievanceStatus.NEW
};

export const userId = 1;

export const expectedGrievance = {
    id: 1,
    ...createGrievanceDTO,
    reporterUserId: userId,
    status: GrievanceStatus.NEW,
};

export const updatedGrievance = {
  id: 1,
  uuid: process.env.GRIEVANCE_UUID,
  reportedBy: 'Hello Test',
  reporterUserId: userId,
  reporterContact: "9843848488",
  title: 'Test Grievance',
  type: GrievanceType.TECHNICAL,
  projectId: process.env.PROJECT_ID,
  description: 'This is a test grievance',
  status: GrievanceStatus.UNDER_REVIEW,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null
};

export const grievancesList = [
    {
      "id": 1,
      "uuid": "7789a21f-b959-4486-97eb-f802d1b2b321",
      "reportedBy": "Sarvesh Karki",
      "reporterUserId": 1,
      "reporterContact": "9841234567",
      "title": "Grievance title",
      "type": "TECHNICAL",
      "projectId": "04cb0d02-e003-45ab-82a7-5b3b04889339",
      "description": "Grievance description",
      "status": "NEW",
      "createdAt": "2024-08-21T15:54:32.779Z",
      "updatedAt": "2024-08-21T15:54:32.779Z",
      "deletedAt": null,
      "project": {
        "name": "stickybeak",
        "uuid": "04cb0d02-e003-45ab-82a7-5b3b04889339"
      },
      "reporterUser": {
        "name": "Anupama Koirala",
        "uuid": "8e8f409e-b607-4ad1-b6cd-cc1e4f5a08c4",
        "id": 1
      }
    },
    {
      "id": 2,
      "uuid": "0ac168bb-c411-4cd2-994d-199522023de8",
      "reportedBy": "Ram Prasad",
      "reporterUserId": 1,
      "reporterContact": "9841234567",
      "title": "Jest Test",
      "type": "TECHNICAL",
      "projectId": "04cb0d02-e003-45ab-82a7-5b3b04889339",
      "description": "Hello, this is grievance test case",
      "status": "NEW",
      "createdAt": "2024-08-21T15:55:25.616Z",
      "updatedAt": "2024-08-21T15:55:25.616Z",
      "deletedAt": null,
      "project": {
        "name": "stickybeak",
        "uuid": "04cb0d02-e003-45ab-82a7-5b3b04889339"
      },
      "reporterUser": {
        "name": "Anupama Koirala",
        "uuid": "8e8f409e-b607-4ad1-b6cd-cc1e4f5a08c4",
        "id": 1
      }
}];