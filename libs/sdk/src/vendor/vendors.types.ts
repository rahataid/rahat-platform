import { Service } from '@rumsan/sdk/enums/enums';

export interface Vendor {
  id: number;
  uuid: string;
  name: string;
  email: string | null;
  phone: string | null;
  location: string | null;
  extras: Record<string, any> | null;
  wallet: string | null;
  service: Service;
  createdAt: Date;
  updatedAt: Date | null;
  deletedAt: Date | null;
}

export interface VendorCreateInput {
  id?: number;
  uuid: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  location?: string | null;
  wallet: string | null;
  service: Service;
  extras?: Record<string, any> | null;
  createdAt?: Date;
  updatedAt?: Date | null;
  deletedAt?: Date | null;
}
