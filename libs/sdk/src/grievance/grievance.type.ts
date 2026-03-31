
export enum GrievanceStatus {
  NEW = 'NEW',
  UNDER_REVIEW = 'UNDER_REVIEW',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
  IN_PROGRESS = 'IN_PROGRESS',
  REJECTED = 'REJECTED'
}

export enum GrievanceType {
  TECHNICAL = 'TECHNICAL',
  NON_TECHNICAL = 'NON_TECHNICAL',
  OTHER = 'OTHER',
  OPERATIONAL = 'OPERATIONAL',
  FINANCIAL = 'FINANCIAL',
}

export type Grievance = {
  id?: number;
  reportedBy: string;
  reporterUserId?: number;
  reporterContact: string;
  title: string;
  type: GrievanceType;
  projectId: string;
  description: string;
  status: GrievanceStatus;
  createdAt?: Date;
  updatedAt?: Date;
  project?: {
    name: string;
    uuid: string;
  };
  reporterUser?: {
    name: string;
    uuid: string;
    id: number;
  };

}
