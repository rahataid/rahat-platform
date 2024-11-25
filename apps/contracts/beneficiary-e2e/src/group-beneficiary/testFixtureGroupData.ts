import { faker } from "@faker-js/faker";
import { randomUUID } from "crypto";

export const groupBeneficiaryDto = {
    name: faker.word.sample(),
    beneficiaries: [
        {
            uuid: "32cb2dd2-e818-4160-9c41-b44e69630233"
        },
        {
            uuid: "ea605b47-aef4-42d4-8d10-306f5cc2b27f"
        }
    ]
};

export const updateDto = {
    name: 'lopsided',
    beneficiaries: [
      { uuid: '32cb2dd2-e818-4160-9c41-b44e69630233' },
      { uuid: 'ea605b47-aef4-42d4-8d10-306f5cc2b27f' },
    ]
}

export const verifiedBeneficiaryGroupUUID = "b865ff84-0e8d-43b6-97f0-b7e09b862c49";
export const groupUUIDDelete = "f8c06bbf-77a3-4bb8-bb25-6e4750ed3b92";
export const invalidUUID = randomUUID();