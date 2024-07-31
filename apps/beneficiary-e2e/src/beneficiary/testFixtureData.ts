import { faker } from '@faker-js/faker';
import { Gender } from '@rumsan/sdk/enums';
import { BankedStatus, InternetStatus, PhoneStatus } from '@prisma/client';
import { ethers } from 'ethers';

const wallet = ethers.Wallet.createRandom();

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
        beneficiaryId: faker.number.int(),
        email: faker.internet.email(), 
        name: faker.person.fullName(),
        phone: faker.phone.number(),
        extras: {
            bank: faker.string.alpha(),
            account: faker.finance.accountNumber()
        }
    },   
};

export const extraDto = {
    id: 1,
    uuid: '5c788f0e-9869-4d5d-8f52-086a18da8fdf',
    gender: 'MALE',
    walletAddress: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
    birthDate: '1997-03-08T00:00:00.000Z',
    age: 20,
    location: 'Jhasmikhel',
    latitude: 26.24,
    longitude: 86.24,
    extras: {
      email: 'test@mailinator.com',
      hasCitizenship: true,
      passportNumber: '1234562'
    },
    notes: '9785623749',
    bankedStatus: 'BANKED',
    internetStatus: 'HOME_INTERNET',
    phoneStatus: 'FEATURE_PHONE',
  };


export const createBulkBeneficiaryDto = [
    {
        gender: getRandomEnumValue(Gender),
        birthDate: faker.date.birthdate(),
        age: 26,
        location: faker.location.city(),
        latitude: faker.location.latitude(),
        longitude: faker.location.longitude(),
        extras: {
            email: faker.internet.email(),
            hasCitizenship: faker.datatype.boolean(),
            passportNumber: faker.number.int({ min: 10000 })
        },
        notes: faker.number.int({ min: 1000000 }),
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
        gender: getRandomEnumValue(Gender),
        birthDate: faker.date.birthdate(),
        age: 26,
        location: faker.location.city(),
        latitude: faker.location.latitude(),
        longitude: faker.location.longitude(),
        extras: {
            email: faker.internet.email(),
            hasCitizenship: faker.datatype.boolean(),
            passportNumber: faker.number.int({ min: 10000 })
        },
        notes: faker.number.int({ min: 1000000 }),
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
    }
];

export const locationDto = faker.location.city();

