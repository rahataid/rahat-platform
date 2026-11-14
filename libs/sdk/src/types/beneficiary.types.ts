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

export interface BeneficiaryBankAccount {
    bank_name: string | null;
    bank_ac_name: string | null;
    bank_ac_number: string | null;
    validBankAccount: boolean | null;
}

type GroupedBeneficiaryWithBankAccount =
    GroupWithBeneficiaries['groupedBeneficiaries'][number] & {
        Beneficiary: GroupWithBeneficiaries['groupedBeneficiaries'][number]['Beneficiary'] & {
            BankAccount: BeneficiaryBankAccount | null;
        };
    };

export type GroupWithBankAccounts = Omit<
    GroupWithValidationAA,
    'groupedBeneficiaries'
> & {
    groupedBeneficiaries: GroupedBeneficiaryWithBankAccount[];
};