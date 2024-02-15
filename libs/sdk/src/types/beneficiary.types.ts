import { UUID } from 'crypto';
import { BankedStatus, Gender, InternetStatus, PhoneStatus } from '../enums';

export type TBeneficiary = {
  uuid?: UUID;
  gender?: Gender;
  walletAddress?: string;
  birthDate?: Date;
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
  name?: string;
  phone?: string;
  email?: string;
  extras?: Record<string, any>;
};
