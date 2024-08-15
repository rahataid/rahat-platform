import { UUID } from "crypto";

export type TAuthApp = {
    uuid?: UUID;
    name?: string;
    description?: string;
    nonceMessage?: string;
    address?: string;
    createdBy?: string;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date;
};