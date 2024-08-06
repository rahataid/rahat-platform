import { UUID } from "crypto";

export type TAuthApp = {
    uuid?: UUID;
    name?: string;
    description?: string;
    publicKey?: string;
    createdBy?: string;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date;
};