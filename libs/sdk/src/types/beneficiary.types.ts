import { Prisma } from '@prisma/client';

export type GroupWithBeneficiaries = Prisma.BeneficiaryGroupGetPayload<{
    include: {
        groupedBeneficiaries: {
            include: {
                Beneficiary: {
                    include: {
                        pii: true;
                    };
                };
            };
        };
    };
}>;

export interface GroupWithValidationAA extends GroupWithBeneficiaries {
    isGroupValidForAA: boolean;
    isAnyBeneficiaryInvalid?: boolean;
}