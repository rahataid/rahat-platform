import { faker } from '@faker-js/faker';
import { Gender } from '@rumsan/sdk/enums';
import { BankedStatus, InternetStatus, PhoneStatus } from '@prisma/client';
import { ethers } from 'ethers';
import { randomUUID } from 'crypto';

const wallet = ethers.Wallet.createRandom();
const wallet2 = ethers.Wallet.createRandom();
const wallet3 = ethers.Wallet.createRandom();
export const invalidWallet = ethers.Wallet.createRandom();
export const invalidPhone = faker.phone.number();
export const invalidUUID = randomUUID();

const getRandomEnumValue = (enumObj) => {
    const enumValues = Object.values(enumObj);
    const randomIndex = Math.floor(Math.random() * enumValues.length);
    return enumValues[randomIndex];
};

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

export const resBeneficiary = {
    id: 254,
    uuid: 'dfa19283-9381-48aa-90f0-d8803907565d',
    gender: 'MALE',
    walletAddress: '0x77dE258eA6c0f40A38B559Fd19b595020c83b6de',
    birthDate: '1982-10-14T07:29:24.220Z',
    age: 26,
    location: 'Fort Loganchester',
    latitude: -20.3852,
    longitude: -72.9099,
    extras: {
      email: 'Andre.Satterfield12@hotmail.com',
      hasCitizenship: true,
      passportNumber: 1761665144069996
    },
    notes: '5969958020654386',
    bankedStatus: 'UNBANKED',
    internetStatus: 'HOME_INTERNET',
    phoneStatus: 'UNKNOWN',
    createdAt: '2024-08-06T16:02:19.200Z',
    updatedAt: '2024-08-06T16:02:19.200Z',
    deletedAt: null,
    isVerified: false
};

export const reqBeneficiary = {
    walletAddress: '0x77dE258eA6c0f40A38B559Fd19b595020c83b6de',
    gender: 'MALE',
    birthDate: '1982-10-14T07:29:24.220Z',
    age: 26,
    location: 'Fort Loganchester',
    latitude: -20.3852,
    longitude: -72.9099,
    extras: {
      email: 'Andre.Satterfield12@hotmail.com',
      hasCitizenship: true,
      passportNumber: 1761665144069996
    },
    notes: '5969958020654386',
    bankedStatus: 'UNBANKED',
    internetStatus: 'HOME_INTERNET',
    phoneStatus: 'UNKNOWN',
    piiData: {
      name: 'John Dooley III',
      phone: '350-724-3609 x500',
      extras: [Object]
    }
};

export const locationDto = faker.location.city();

export const sampleUpdate =  {
    id: 246,
    uuid: '3d9009ca-e8a5-424a-bdbd-06cb6dd502a2',
    gender: 'MALE',
    walletAddress: '0xa6171076A94E6d0D892D96415f42f928C332fB7c',
    birthDate: '1979-12-09T12:37:15.440Z',
    age: 26,
    location: 'Gilroy',
    latitude: 62.82,
    longitude: 105.749,
    extras: {
      email: 'Nathanael.Krajcik95@hotmail.com',
      hasCitizenship: true,
      passportNumber: 5332758484226031
    },
    notes: '1593499179585326',
    bankedStatus: 'BANKED',
    internetStatus: 'UNKNOWN',
    phoneStatus: 'FEATURE_PHONE',
    createdAt: '2024-08-06T11:10:05.901Z',
    updatedAt: '2024-08-06T11:10:05.901Z',
    deletedAt: null,
    isVerified: false,
    BeneficiaryProject: [],
    piiData: {
        beneficiaryId: 246,
        name: 'Allan Jenkins III',
        phone: '(589) 417-6930 x97261',
        email: null,
        extras: { bank: 'c', account: '69245417' }
    }
}

export const verifiedUUID = "5c788f0e-9869-4d5d-8f52-086a18da8fdf";

