import { faker } from '@faker-js/faker';
import * as dotenv from 'dotenv';
import { ethers } from 'ethers';

dotenv.config();

export function generateVendorDto() {
    const wallet = ethers.Wallet.createRandom();
    return {
        dto: {
            service: 'EMAIL',
            name: faker.person.fullName(),
            email: faker.internet.email(),
            phone: faker.phone.number(),
            wallet: wallet.address,
            extras: { isVendor: true },
        },
        wallet,
    };
}

export function generateBeneficiaryDto() {
    const wallet = ethers.Wallet.createRandom();
    return {
        dto: {
            walletAddress: wallet.address,
            gender: 'UNKNOWN',
            birthDate: faker.date.birthdate().toISOString(),
            age: Math.floor(Math.random() * 30) + 20,
            location: faker.location.city(),
            latitude: faker.location.latitude(),
            longitude: faker.location.longitude(),
            extras: {
                email: faker.internet.email(),
                hasCitizenship: faker.datatype.boolean(),
                passportNumber: faker.number.int({ min: 10000 }),
            },
            notes: faker.number.int({ min: 1000000 }).toString(),
            bankedStatus: 'UNKNOWN',
            internetStatus: 'UNKNOWN',
            phoneStatus: 'UNKNOWN',
            piiData: {
                name: faker.person.fullName(),
                phone: faker.phone.number(),
                extras: {
                    bank: faker.string.alpha(),
                    account: faker.finance.accountNumber(),
                },
            },
        },
        wallet,
    };
}

export function generateWalkInInkindDto() {
    return {
        name: `E2E WALK_IN ${Date.now()}`,
        type: 'WALK_IN',
        description: 'E2E test walk-in inkind',
        quantity: 100,
    };
}

export function generatePreDefinedInkindDto() {
    return {
        name: `E2E PRE_DEFINED ${Date.now()}`,
        type: 'PRE_DEFINED',
        description: 'E2E test pre-defined inkind',
        quantity: 50,
    };
}
