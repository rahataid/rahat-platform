import { UUID } from 'crypto';
import { BankedStatus, Gender, InternetStatus, PhoneStatus } from '../enums';

export type TempBeneficiary = {
  uuid?: UUID;
  firstName: string;
  lastName: string;
  targetUUID?: UUID;
  govtIDNumber?: string;
  gender?: Gender;
  birthDate?: Date;
  walletAddress?: string;
  phone?: string;
  email?: string;
  archived?: boolean;
  location?: string;
  latitude?: number;
  longitude?: number;
  extras?: Record<string, any>;
  notes?: string;
  bankedStatus?: BankedStatus;
  internetStatus?: InternetStatus;
  phoneStatus?: PhoneStatus;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
  groupName?: string;
}

export type Beneficiary = {
  uuid?: UUID;
  gender?: Gender;
  walletAddress?: string;
  birthDate?: Date;
  age?: number
  location?: string;
  latitude?: number;
  longitude?: number;
  extras?: Record<string, any>;
  notes?: string;
  bankedStatus?: BankedStatus;
  internetStatus?: InternetStatus;
  phoneStatus?: PhoneStatus;
  piiData?: TPIIData;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
};

export type TPIIData = {
  beneficiaryId?: number;
  name?: string;
  phone: string;
  email?: string;
  extras?: Record<string, any>;
};

export type ASSIGNTOPROJECT = {
  projectId: string;
  beneficiaryId: string;
}
