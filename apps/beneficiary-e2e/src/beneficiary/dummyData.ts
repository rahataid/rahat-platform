import { BankedStatus, Gender, InternetStatus, PhoneStatus } from "@prisma/client";

export const createBeneficiaryDto = {
  id: 1,
  uuid: '5c788f0e-9869-4d5d-8f52-086a18da8fdf',
  gender: 'FEMALE',
  walletAddress: '0x3a13290A8c26075F9B030C4CAF3A11ba037382b6',
  birthDate: '1997-03-08T00:00:00.000Z',
  age: 20,
  location: 'Jhamsikhel',
  latitude: 26.24,
  longitude: 86.24,
  extras: {
    hasCitizenship: true,
    passportNumber: "1234567",
    email: "test@mailinator.com"
  },
  notes: '9785623749',
  bankedStatus: 'BANKED',
  internetStatus: 'HOME_INTERNET',
  phoneStatus: 'FEATURE_PHONE',
  createdAt: '2024-07-22T05:53:53.473Z',
  updatedAt: '2024-07-22T05:53:53.473Z',
  deletedAt: null,
  isVerified: false,
  BeneficiaryProject: [        
    {      
      id: 1,
      uuid: 'b0213617-5f51-4a3f-b68b-93e50ff31ef3',
      projectId: 'b89775b8-7a17-42e4-b32f-98a1ea39874e',
      beneficiaryId: '7ce001c8-2336-4a6e-8f57-7e952dafb9bc',
      createdAt: '2024-07-22T05:53:53.535Z',
      updatedAt: '2024-07-22T05:53:53.535Z',
      deletedAt: null,
      Project: {
        id: 1,
        uuid: 'b89775b8-7a17-42e4-b32f-98a1ea39874e',
        name: 'Cash Distribution',
        description: 'Cash Distribution for the flood victims',
        status: 'NOT_READY',
        type: 'el',
        contractAddress: null,
        extras: null,
        createdAt: '2024-07-18T07:21:11.242Z',
        updatedAt: '2024-07-18T07:21:11.242Z',
        deletedAt: null
      }
    }
  ],
  piiData: {
    beneficiaryId: 2,
      name: 'Rama Shrestha',
      phone: '9843747289',
      email: null,
      extras: { bank: 'Laxmi Bank', account: '9872200002' }
  },
  // projectUUIDs: [
  //   "b89775b8-7a17-42e4-b32f-98a1ea39874e"
  // ]
};

export const updateBeneficiaryDto = {
  ...createBeneficiaryDto, 
  location: "Jhamsikhel",
};

export const createBulkBeneficiaryDto = [
  {
      id: 2,
      uuid: '5c788f0e-9869-4d5d-8f52-086a18da8fdf',
      gender: "FEMALE",
      walletAddress: "0x3a6eB782B7F99bd4B317fa64652CcF9002C7B35F",
      birthDate: "1997-03-08T00:00:00.000Z",
      age: 20,
      location: "Jhamsikhel",
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
        name: "Hari Krishna Shrestha",
        phone: "9843848493",
        email: null,
        extras: {
          bank: "Laxmi Bank",
          account: "9872200008"
        }
      },
      // projectUUIDs: [ "175fe40a-eee3-48f8-9eb3-bc76d5aaeb56" ]
  },
  {
    id: 3,
    uuid: '0xAb6323370B6dB2bAb7d2FB1454CC0334F395f1A5',
      gender: "FEMALE",
      walletAddress: "0xAb6323370B6dB2bAb7d2FB1454CC0334F395f1A5",
      birthDate: new Date(),
      age: 20,
      location: "Sanepa",
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
        name: "Mina Shrestha",
        phone: "9843029384",
        email: null,
        extras: {
          bank: "Laxmi Bank",
          account: "9872200004"
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

export const projectUUID = "b89775b8-7a17-42e4-b32f-98a1ea39874e";

export const createBeneficiaryGroupDto = {
  name: 'e2e Test',
  beneficiaries: [
    {
      uuid: "5c788f0e-9869-4d5d-8f52-086a18da8fdf"
    }
  ]
};

export const groupUUID = "b865ff84-0e8d-43b6-97f0-b7e09b862c49";

export const singleGroup = 
  {
  "id": 5,
    "uuid": "b865ff84-0e8d-43b6-97f0-b7e09b862c49",
    "name": "Swagger Test",
    "createdAt": "2024-07-22T11:21:42.077Z",
    "updatedAt": "2024-07-22T11:21:42.077Z",
    "deletedAt": null,
    "groupedBeneficiaries": [
      {
        "id": 2,
        "uuid": "b9fa310a-516a-4b8f-a29d-ed7b2a122b49",
        "beneficiaryGroupId": "b865ff84-0e8d-43b6-97f0-b7e09b862c49",
        "beneficiaryId": "7ce001c8-2336-4a6e-8f57-7e952dafb9bc",
        "createdAt": "2024-07-22T11:21:42.133Z",
        "updatedAt": "2024-07-22T11:21:42.133Z",
        "deletedAt": null,
        "Beneficiary": {
          "id": 2,
          "uuid": "7ce001c8-2336-4a6e-8f57-7e952dafb9bc",
          "gender": "FEMALE",
          "walletAddress": "0x3a13290A8c26075F9B030C4CAF3A11ba037382b6",
          "birthDate": "1997-03-08T00:00:00.000Z",
          "age": 20,
          "location": "Jhamsikhel",
          "latitude": 26.24,
          "longitude": 86.24,
          "extras": {
            "email": "test@mailinator.com",
            "hasCitizenship": true,
            "passportNumber": "1234567"
          },
          "notes": "9785623749",
          "bankedStatus": "BANKED",
          "internetStatus": "HOME_INTERNET",
          "phoneStatus": "FEATURE_PHONE",
          "createdAt": "2024-07-22T05:53:53.473Z",
          "updatedAt": "2024-07-22T08:50:09.018Z",
          "deletedAt": null,
          "isVerified": false,
          "pii": {
            "beneficiaryId": 2,
            "name": "Rama Shrestha",
            "phone": "9843747289",
            "email": null,
            "extras": {
              "bank": "Laxmi Bank",
              "account": "9872200002"
            }
          }
        }
      },
      {
        "id": 3,
        "uuid": "79954f90-35e0-4451-a26b-846e9ee6d498",
        "beneficiaryGroupId": "b865ff84-0e8d-43b6-97f0-b7e09b862c49",
        "beneficiaryId": "5c788f0e-9869-4d5d-8f52-086a18da8fdf",
        "createdAt": "2024-07-22T11:21:42.133Z",
        "updatedAt": "2024-07-22T11:21:42.133Z",
        "deletedAt": null,
        "Beneficiary": {
          "id": 1,
          "uuid": "5c788f0e-9869-4d5d-8f52-086a18da8fdf",
          "gender": "MALE",
          "walletAddress": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
          "birthDate": "1997-03-08T00:00:00.000Z",
          "age": 20,
          "location": "Jhasmikhel",
          "latitude": 26.24,
          "longitude": 86.24,
          "extras": {
            "email": "test@mailinator.com",
            "hasCitizenship": true,
            "passportNumber": "1234562"
          },
          "notes": "9785623749",
          "bankedStatus": "BANKED",
          "internetStatus": "HOME_INTERNET",
          "phoneStatus": "FEATURE_PHONE",
          "createdAt": "2024-07-08T07:58:30.393Z",
          "updatedAt": "2024-07-18T09:43:40.176Z",
          "deletedAt": null,
          "isVerified": false,
          "pii": null
        }
      }
    ]
};
