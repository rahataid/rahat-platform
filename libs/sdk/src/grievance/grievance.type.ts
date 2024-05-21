
export enum GrievanceStatus {
  NEW = 'NEW',
  UNDER_REVIEW = 'UNDER_REVIEW',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED'
}

export enum GrievanceType {
  TECHNICAL = 'TECHNICAL',
  NON_TECHNICAL = 'NON_TECHNICAL',
  OTHER = 'OTHER'
}

export type Grievance = {
  id?: number;
  reportedById?: number;
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
  reportedBy?: {
    name: string;
    uuid: string;
    id: number;
  };

}
