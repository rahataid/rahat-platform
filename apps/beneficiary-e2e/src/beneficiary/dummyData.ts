import { BankedStatus, Gender, InternetStatus, PhoneStatus } from "@prisma/client";

export const createBeneficiaryDto = {
    id: 1,
    uuid: "5c788f0e-9869-4d5d-8f52-086a18da8fdf",
    gender: "FEMALE",
    walletAddress: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    birthDate: "1997-03-08T00:00:00.000Z",
    age: 20,
    location: "lalitpur",
    latitude: 26.24,
    longitude: 86.24,
    extras: {
      email: "test@mailinator.com",
      hasCitizenship: true,
      passportNumber: "1234567"
    },
    notes: "9785623749",
    bankedStatus: "BANKED",
    internetStatus: "HOME_INTERNET",
    phoneStatus: "FEATURE_PHONE",
    createdAt: "2024-07-08T07:58:30.393Z",
    updatedAt: "2024-07-08T07:58:30.393Z",
    deletedAt: null,
    isVerified: false,
    BeneficiaryProject: [],
    piiData: {
      beneficiaryId: 1,
      name: "Ram Shrestha",
      phone: "98670023857",
      email: null,
      extras: {
        bank: "Laxmi Bank",
        account: "9872200001"
      }
    },
    // projectUUIDs: [ "175fe40a-eee3-48f8-9eb3-bc76d5aaeb56" ]
};

export const createBulkBeneficiaryDto = [
  {
    id: 1,
        uuid: "5c788f0e-9869-4d5d-8f52-086a18da8fdq",
      gender: "FEMALE",
      walletAddress: "0x742d35Cc6634C0532925a3b844Bc454e4438f44a",
      birthDate: "1997-03-08T00:00:00.000Z",
      age: 20,
      location: "lalitpur",
      latitude: 26.24,
      longitude: 86.24,
      extras: {
        email: "test@mailinator.com",
        hasCitizenship: true,
        passportNumber: "1234567"
      },
      notes: "9785623749",
      bankedStatus: "BANKED",
      internetStatus: "HOME_INTERNET",
      phoneStatus: "FEATURE_PHONE",
      createdAt: "2024-07-08T07:58:30.393Z",
      updatedAt: "2024-07-08T07:58:30.393Z",
      deletedAt: null,
      isVerified: false,
      BeneficiaryProject: [],
      piiData: {
        beneficiaryId: 1,
        name: "Ram Shrestha",
        phone: "98670023857",
        email: null,
        extras: {
          bank: "Laxmi Bank",
          account: "9872200001"
        }
      },
      // projectUUIDs: [ "175fe40a-eee3-48f8-9eb3-bc76d5aaeb56" ]
  },
  {
    id: 2,
      uuid: "5c788f0e-9869-4d5d-8f52-086a18da8fde",
      gender: "FEMALE",
      walletAddress: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
      birthDate: new Date(),
      age: 20,
      location: "lalitpur",
      latitude: 26.24,
      longitude: 86.24,
      extras: {
        email: "test@mailinator.com",
        hasCitizenship: true,
        passportNumber: "1234564"
      },
      notes: "9785623749",
      bankedStatus: "BANKED",
      internetStatus: "HOME_INTERNET",
      phoneStatus: "FEATURE_PHONE",
      createdAt: "2024-07-08T07:58:30.393Z",
      updatedAt: "2024-07-08T07:58:30.393Z",
      deletedAt: null,
      isVerified: false,
      BeneficiaryProject: [],
      piiData: {
        beneficiaryId: 1,
        name: "Rama Shrestha",
        phone: "98670023854",
        email: null,
        extras: {
          bank: "Laxmi Bank",
          account: "9872200002"
        }
      },
      // projectUUIDs: [ "175fe40a-eee3-48f8-9eb3-bc76d5aaeb56" ]
  }
];

export const listStats = [
  {
    "name": "BENEFICIARY_BANKEDSTATUS",
    "data": [
      {
        "id": "BANKED",
        "count": 1
      }
    ]
  },
  {
    "name": "BENEFICIARY_AGE_RANGE",
    "data": [
      {
        "id": "0-20",
        "count": 1
      },
      {
        "id": "20-40",
        "count": 0
      },
      {
        "id": "40-60",
        "count": 0
      },
      {
        "id": "60+",
        "count": 0
      }
    ]
  },
  {
    "name": "BENEFICIARY_GENDER",
    "data": [
      {
        "id": "FEMALE",
        "count": 1
      }
    ]
  },
  {
    "name": "BENEFICIARY_INTERNETSTATUS",
    "data": [
      {
        "id": "HOME_INTERNET",
        "count": 1
      }
    ]
  },
  {
    "name": "BENEFICIARY_PHONESTATUS",
    "data": [
      {
        "id": "FEATURE_PHONE",
        "count": 1
      }
    ]
  },
  {
    "name": "BENEFICIARY_TOTAL",
    "data": {
      "count": 1
    }
  }
];

export const tableStats = [
  {
    "name": "BENEFICIARY_BANKEDSTATUS",
    "data": [
      {
        "id": "BANKED",
        "count": 1
      }
    ],
    "group": "beneficiary",
    "createdAt": "2024-07-08T07:58:30.525Z",
    "updatedAt": "2024-07-08T07:58:30.525Z"
  },
  {
    "name": "BENEFICIARY_AGE_RANGE",
    "data": [
      {
        "id": "0-20",
        "count": 1
      },
      {
        "id": "20-40",
        "count": 0
      },
      {
        "id": "40-60",
        "count": 0
      },
      {
        "id": "60+",
        "count": 0
      }
    ],
    "group": "beneficiary",
    "createdAt": "2024-07-08T07:58:30.525Z",
    "updatedAt": "2024-07-08T07:58:30.525Z"
  },
  {
    "name": "BENEFICIARY_GENDER",
    "data": [
      {
        "id": "FEMALE",
        "count": 1
      }
    ],
    "group": "beneficiary",
    "createdAt": "2024-07-08T07:58:30.527Z",
    "updatedAt": "2024-07-08T07:58:30.527Z"
  },
  {
    "name": "BENEFICIARY_INTERNETSTATUS",
    "data": [
      {
        "id": "HOME_INTERNET",
        "count": 1
      }
    ],
    "group": "beneficiary",
    "createdAt": "2024-07-08T07:58:30.524Z",
    "updatedAt": "2024-07-08T07:58:30.524Z"
  },
  {
    "name": "BENEFICIARY_PHONESTATUS",
    "data": [
      {
        "id": "FEATURE_PHONE",
        "count": 1
      }
    ],
    "group": "beneficiary",
    "createdAt": "2024-07-08T07:58:30.524Z",
    "updatedAt": "2024-07-08T07:58:30.524Z"
  },
  {
    "name": "BENEFICIARY_TOTAL",
    "data": {
      "count": 1
    },
    "group": "beneficiary",
    "createdAt": "2024-07-08T07:58:30.523Z",
    "updatedAt": "2024-07-08T07:58:30.523Z"
  }
];