import { faker } from '@faker-js/faker';
import { Gender } from '@rumsan/sdk/enums';
import { BankedStatus, InternetStatus, PhoneStatus } from '@prisma/client';
import { ethers } from 'ethers';

const wallet = ethers.Wallet.createRandom();
const wallet2 = ethers.Wallet.createRandom();
const wallet3 = ethers.Wallet.createRandom();

const getRandomEnumValue = (enumObj) => {
    const enumValues = Object.values(enumObj);
    const randomIndex = Math.floor(Math.random() * enumValues.length);
    return enumValues[randomIndex];
};

export const benefData = [];

export const createBeneficiaryDto = {
    walletAddress: wallet.address,
    gender: getRandomEnumValue(Gender),
    birthDate: faker.date.birthdate().toISOString(),
    age: 26,
    location: faker.location.city(),
    latitude: faker.location.latitude(),
    longitude: faker.location.longitude(),
    extras: {
        email: faker.internet.email(),
        hasCitizenship: faker.datatype.boolean(),
        passportNumber: faker.number.int({ min: 10000 })
    },
    notes: faker.number.int({ min: 1000000 }).toString(),
    bankedStatus: getRandomEnumValue(BankedStatus),
    internetStatus: getRandomEnumValue(InternetStatus),
    phoneStatus: getRandomEnumValue(PhoneStatus),
    piiData: {
        // beneficiaryId: faker.number.int(),
        // email: faker.internet.email(), 
        name: faker.person.fullName(),
        phone: faker.phone.number(),
        extras: {
            bank: faker.string.alpha(),
            account: faker.finance.accountNumber()
        }
    },   
};

export const createBeneficiaryDtoWallet = {
    gender: getRandomEnumValue(Gender),
    birthDate: faker.date.birthdate().toISOString(),
    age: 26,
    location: faker.location.city(),
    latitude: faker.location.latitude(),
    longitude: faker.location.longitude(),
    extras: {
        email: faker.internet.email(),
        hasCitizenship: faker.datatype.boolean(),
        passportNumber: faker.number.int({ min: 10000 })
    },
    notes: faker.number.int({ min: 1000000 }).toString(),
    bankedStatus: getRandomEnumValue(BankedStatus),
    internetStatus: getRandomEnumValue(InternetStatus),
    phoneStatus: getRandomEnumValue(PhoneStatus),
    piiData: {
        // beneficiaryId: faker.number.int(),
        // email: faker.internet.email(), 
        name: faker.person.fullName(),
        phone: faker.phone.number(),
        extras: {
            bank: faker.string.alpha(),
            account: faker.finance.accountNumber()
        }
    },   
};


export const createBulkBeneficiaryDto = [
    {
        walletAddress: wallet2.address,
        gender: getRandomEnumValue(Gender),
        birthDate: faker.date.birthdate().toISOString(),
        age: 26,
        location: faker.location.city(),
        latitude: faker.location.latitude(),
        longitude: faker.location.longitude(),
        extras: {
            email: faker.internet.email(),
            hasCitizenship: faker.datatype.boolean(),
            passportNumber: faker.number.int({ min: 10000 })
        },
        notes: faker.number.int({ min: 1000000 }).toString(),
        bankedStatus: getRandomEnumValue(BankedStatus),
        internetStatus: getRandomEnumValue(InternetStatus),
        phoneStatus: getRandomEnumValue(PhoneStatus),
        piiData: {
            name: faker.person.fullName(),
            phone: faker.phone.number(),
            extras: {
                bank: faker.string.alpha(),
                account: faker.finance.accountNumber()
            }
        },   
    },
    {
        walletAddress: wallet3.address,
        gender: getRandomEnumValue(Gender),
        birthDate: faker.date.birthdate().toISOString(),
        age: 26,
        location: faker.location.city(),
        latitude: faker.location.latitude(),
        longitude: faker.location.longitude(),
        extras: {
            email: faker.internet.email(),
            hasCitizenship: faker.datatype.boolean(),
            passportNumber: faker.number.int({ min: 10000 })
        },
        notes: faker.number.int({ min: 1000000 }).toString(),
        bankedStatus: getRandomEnumValue(BankedStatus),
        internetStatus: getRandomEnumValue(InternetStatus),
        phoneStatus: getRandomEnumValue(PhoneStatus),
        piiData: {
            // beneficiaryId: faker.number.int(),
            // email: faker.internet.email(), 
            name: faker.person.fullName(),
            phone: faker.phone.number(),
            extras: {
                bank: faker.string.alpha(),
                account: faker.finance.accountNumber()
            }
        },   
    }
];

export const locationDto = faker.location.city();

