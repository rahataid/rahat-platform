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

export const verifiedBeneficiaryGroupUUID = "69ebc15f-555c-415b-bd34-e0e82f0ff5f5";
export const groupUUIDDelete = "2a08a49b-ea0e-4b1a-86f6-caa0475eba42";
export const invalidUUID = randomUUID();