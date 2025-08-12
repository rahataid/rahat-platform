import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const CT_DB_HOST = 'ctsfdsn.rahat.io';
const CT_DB_PORT = 'd6501';
const CT_DB_USERNAME = 'postgres';
const CT_DB_PASSWORD = '';
const CT_DB_NAME = 'ct';

const DB_HOST = 'a.rahat.io';
const DB_PORT = '76';
const DB_USERNAME = 'postgres';
const DB_PASSWORD = '';
const DB_NAME = 'core';
const AA_DB_NAME = 'aa2';

const DATABASE_URL = `postgresql://${DB_USERNAME}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=public`;

export const CIPS_BANK = [
  {
    "bankId": "6601",
    "bankName": "Garima Bikas Bank Limited"
  },
  {
    "bankId": "2101",
    "bankName": "Prime Commercial Bank Limited"
  },
  {
    "bankId": "1801",
    "bankName": "Siddhartha Bank Limited"
  },
  {
    "bankId": "0401",
    "bankName": "Nabil Bank Ltd."
  },
  {
    "bankId": "0701",
    "bankName": "Himalayan Bank Limited"
  },
  {
    "bankId": "2301",
    "bankName": "NIC Asia Bank Limited"
  },
  {
    "bankId": "1601",
    "bankName": "Kumari Bank Ltd."
  },
  {
    "bankId": "7515",
    "bankName": "Kankai Bikas Bank Ltd"
  },
  {
    "bankId": "7502",
    "bankName": "Excel Development Bank Ltd."
  },
  {
    "bankId": "7607",
    "bankName": "Multipurpose Finance Company Limited"
  },
  {
    "bankId": "1901",
    "bankName": "Global IME Bank Limited"
  },
  {
    "bankId": "NCHL",
    "bankName": "Nepal Clearing House Limited"
  },
  {
    "bankId": "9912",
    "bankName": "Purnima Bikas Bank Limited"
  },
  {
    "bankId": "9998",
    "bankName": "Z-VAPT TEST2"
  },
  {
    "bankId": "8001",
    "bankName": "Kailash Bikas Bank Ltd."
  },
  {
    "bankId": "9001",
    "bankName": "Goodwill Finance Limited"
  },
  {
    "bankId": "9906",
    "bankName": "Central Finance Ltd"
  },
  {
    "bankId": "9915",
    "bankName": "Guheshwori Merchant Banking and Finance Limited"
  },
  {
    "bankId": "9999",
    "bankName": "Z-VAPT TEST"
  },
  {
    "bankId": "7518",
    "bankName": "Nepal Infrastructure Bank Ltd."
  },
  {
    "bankId": "9908",
    "bankName": "Corporate Development Bank"
  },
  {
    "bankId": "5001",
    "bankName": "Deva Bikas Bank Limited"
  },
  {
    "bankId": "9929",
    "bankName": "Karnali Development Bank td."
  },
  {
    "bankId": "2201",
    "bankName": "Laxmi Sunrise Bank Limited"
  },
  {
    "bankId": "1501",
    "bankName": "Machhapuchchhre Bank Limited"
  },
  {
    "bankId": "0201",
    "bankName": "Rastriya Banijya Bank Limited"
  },
  {
    "bankId": "0601",
    "bankName": "Standard Chartered Bank Nepal"
  },
  {
    "bankId": "9945",
    "bankName": "Kanchan Development Bank Ltd"
  },
  {
    "bankId": "7605",
    "bankName": "Narayani Development Bank"
  },
  {
    "bankId": "7517",
    "bankName": "Green Development Bank Ltd"
  },
  {
    "bankId": "7604",
    "bankName": "Janaki Finance Ltd."
  },
  {
    "bankId": "9902",
    "bankName": "Progressive Finance Co. Ltd."
  },
  {
    "bankId": "9911",
    "bankName": "Samriddhi Finance Company Ltd."
  },
  {
    "bankId": "2001",
    "bankName": "Citizens Bank International Limited"
  },
  {
    "bankId": "7516",
    "bankName": "Best Finance Company Ltd."
  },
  {
    "bankId": "8101",
    "bankName": "Shine Resunga Development Bank Ltd."
  },
  {
    "bankId": "9905",
    "bankName": "Pokhara Finance Ltd."
  },
  {
    "bankId": "1001",
    "bankName": "Everest Bank Limited"
  },
  {
    "bankId": "9938",
    "bankName": "Jebils Finance Ltd"
  },
  {
    "bankId": "9931",
    "bankName": "Mahalaxmi Bikas Bank Ltd."
  },
  {
    "bankId": "9919",
    "bankName": "ICFC Finance Limited"
  },
  {
    "bankId": "7001",
    "bankName": "Gandaki Bikas Bank Ltd"
  },
  {
    "bankId": "9801",
    "bankName": "United Finance Ltd."
  },
  {
    "bankId": "5901",
    "bankName": "Saptakoshi Development Bank Ltd."
  },
  {
    "bankId": "3001",
    "bankName": "Civil Bank Ltd."
  },
  {
    "bankId": "1101",
    "bankName": "Bank of Kathmandu Limited"
  },
  {
    "bankId": "5401",
    "bankName": "Lumbini Bikas Bank Ltd"
  },
  {
    "bankId": "0101",
    "bankName": "Nepal Bank Limited"
  },
  {
    "bankId": "9201",
    "bankName": "Shree Investment & Finance Co. Ltd."
  },
  {
    "bankId": "7201",
    "bankName": "Muktinath Bikas Bank Limited"
  },
  {
    "bankId": "7701",
    "bankName": "Nepal Finance Limited"
  },
  {
    "bankId": "2701",
    "bankName": "Janata Bank Nepal Limited"
  },
  {
    "bankId": "6001",
    "bankName": "Jyoti Bikash Bank Ltd"
  },
  {
    "bankId": "7509",
    "bankName": "Miteri Development Bank Limited"
  },
  {
    "bankId": "1701",
    "bankName": "Laxmi Bank Limited"
  },
  {
    "bankId": "7301",
    "bankName": "Shangrila Development Bank Limited"
  },
  {
    "bankId": "6701",
    "bankName": "Om Development Bank Limited"
  },
  {
    "bankId": "3101",
    "bankName": "Century Commercial Bank Limited"
  },
  {
    "bankId": "6401",
    "bankName": "Sindhu Bikash Bank Ltd."
  },
  {
    "bankId": "8301",
    "bankName": "Gurkhas Finance Limited"
  },
  {
    "bankId": "9939",
    "bankName": "Reliance Finance Ltd."
  },
  {
    "bankId": "2601",
    "bankName": "Prabhu Bank Limited"
  },
  {
    "bankId": "0801",
    "bankName": "Nepal SBI Bank Limited"
  },
  {
    "bankId": "4501",
    "bankName": "Sanima Bank Ltd."
  },
  {
    "bankId": "2501",
    "bankName": "NMB Bank Limited"
  },
  {
    "bankId": "0301",
    "bankName": "Agriculture Development Bank Ltd"
  },
  {
    "bankId": "9935",
    "bankName": "Manjushree Finance Limited"
  },
  {
    "bankId": "0501",
    "bankName": "Nepal Investment Bank Limited"
  },
  {
    "bankId": "6801",
    "bankName": "Kamana Sewa Bikas Bank Ltd."
  }
]

const getBankId = (bankName: string): string | null => {
  const bankId = CIPS_BANK.find((bank) => bank.bankName.toLocaleLowerCase() === bankName.toLocaleLowerCase())?.bankId;
  return bankId || null;
}

const corePrisma = new PrismaClient(
  {
    datasourceUrl: DATABASE_URL
  }
);

const AA_DATABASE_URL = `postgresql://${DB_USERNAME}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${AA_DB_NAME}?schema=public`;

const aaPrisma = new PrismaClient(
  {
    datasourceUrl: AA_DATABASE_URL
  }
);

const CT_DATABASE_URL = `postgresql://${CT_DB_USERNAME}:${CT_DB_PASSWORD}@${CT_DB_HOST}:${CT_DB_PORT}/${CT_DB_NAME}?schema=public`;

const ctPrisma = new PrismaClient(
  {
    datasourceUrl: CT_DATABASE_URL
  }
);

const getBenfByPhoneFromCT = async (phone: string): Promise<any | null> => {
  const benf = await ctPrisma.$queryRaw`SELECT * FROM tbl_beneficiaries WHERE phone = ${phone}`;
  return benf;
}

const getBenfs = async () => {
  const benf = await corePrisma.beneficiary.findMany({
    where: {
      deletedAt: null
    },
    include: {
      pii: true
    }
  });

  console.log('-'.repeat(100));
  console.log(`Total beneficiaries in core: ${benf.length}`);
  console.log('-'.repeat(100));

  return benf;
}

const updateBenfBankDetails = async (benfUuid: string, bankDetails: {
  bank_ac_number?: string,
  bank_ac_name?: string,
  bank_name?: string,
}) => {
  const benf = await corePrisma.beneficiary.findUnique({
    where: { uuid: benfUuid },
  })

  if (!benf) {
    throw new Error(`Beneficiary not found for uuid: ${benfUuid}`);
  }

  const updatedBenf = await corePrisma.beneficiary.update({
    where: { uuid: benfUuid },
    data: {
      extras: {
        ...JSON.parse(JSON.stringify(benf.extras)),
        ...bankDetails
      }
    }
  })

  return updatedBenf;
}

const processAndUpdateBenfBankDetails = async () => {
  const benfFoundMap = new Map<string, {
    coreUuid?: string,
    walletAddress?: string,
    name?: string,
    phone?: string,
    bank_ac_number?: number,
    bank_ac_name?: string,
    bank_name?: string,
    benfFromCT?: {
      gender?: string,
      bank_ac_number?: string,
      bank_ac_name?: string,
      bank_name?: string,
    }
  }>();
  const benfNotFoundMap = new Map<string, any>();
  console.log("\n===Finding beneficiaries===\n");
  const benf = await getBenfs();
  const details = await Promise.all(benf.map(async (benf) => {

    const phone = benf.pii?.phone;
    if (!phone) return null;
    const extras = JSON.parse(JSON.stringify(benf.extras));
    let benfFromCT = await getBenfByPhoneFromCT(phone);

    if (benfFromCT.length > 0) {
      console.log(`#### Found beneficiary in CT for phone: ${phone} ####`);
      benfFromCT = benfFromCT[0];
    } else {
      console.log(`#### No beneficiary found in CT for name: ${benf.pii?.name} phone: ${phone} ####`);
      benfFromCT = null;
    }

    const details = {
      coreUuid: benf.uuid,
      walletAddress: benf.walletAddress,
      name: benf.pii?.name,
      phone: benf.pii?.phone,
      bank_ac_number: extras?.bank_ac_number,
      bank_ac_name: extras?.bank_ac_name,
      bank_name: extras?.bank_name,
      benfFromCT: {
        ...(benfFromCT && {
          gender: benfFromCT?.gender,
          bank_ac_number: benfFromCT?.extras?.bank_ac_number?.toString().trim(),
          bank_ac_name: benfFromCT?.extras?.bank_ac_name?.trim(),
          bank_name: benfFromCT?.extras?.bank_name?.trim(),
          account_number: benfFromCT?.extras?.account_number?.toString().trim(),
          active_bank_account: benfFromCT?.extras?.active_bank_account?.trim(),
          bank_beneficiary_name: benfFromCT?.extras?.bank_beneficiary_name?.trim(),
        })
      }
    }
    if (benfFromCT) {
      benfFoundMap.set(phone, details as any);
    } else {
      benfNotFoundMap.set(phone, details);
    }
    return details;
  }));

  console.log('-'.repeat(100));
  console.log(`Total beneficiaries found in CT: ${benfFoundMap.size}`);
  console.log(`Total beneficiaries not found in CT: ${benfNotFoundMap.size}`);
  console.log('-'.repeat(100));

  benfFoundMap.forEach(async (value, key) => {
    let count = 0;

    if (value.bank_ac_number !== value.benfFromCT?.bank_ac_number) {
      count++;
      console.log(`#### Bank account number mismatch for phone: ${key} ####`);
    }

    if (value.bank_name !== value.benfFromCT?.bank_name) {
      count++;
      console.log(`#### Bank name mismatch for phone: ${key} ####`);
    }

    if (value.bank_ac_name !== value.benfFromCT?.bank_ac_name) {
      count++;
      console.log(`#### Bank account name mismatch for phone: ${key} ####`);
    }

    if (count === 0) {
      console.log(`#### No mismatch found for phone: ${key} ####`);
      return;
    }
    const { benfFromCT, coreUuid } = value;
    const { gender, ...restPayload } = benfFromCT!;

    console.log(`#### Updating beneficiary ${key} with payload: ${JSON.stringify(restPayload)} ####`);
    await updateBenfBankDetails(coreUuid!, restPayload);
  });
}

const verifyBenfBankDetails = async () => {
  const benf = await getBenfs();
  const validBenf: string[] = [];
  const invalidBenf: string[] = [];

  for (const beneficiary of benf) {
    const phone = beneficiary.pii?.phone;
    console.log(`#### Verifying beneficiary ${phone} ####`);

    const extras = JSON.parse(JSON.stringify(beneficiary.extras));
    const bank_ac_number = extras?.bank_ac_number;
    const bank_ac_name = extras?.bank_ac_name;
    const bank_name = extras?.bank_name;

    const bankId = getBankId(bank_name);

    if (!bankId) {
      console.log(`#### Bank not found for name: ${bank_name} ####`);
      continue;
    }

    try {
      const res = await axios.post(
        'https://url/v1/payment-provider/json-rpc',
        {
          "provider": "cips",
          "method": "validateAccount",
          "params": {
            "bankId": bankId,
            "accountName": bank_ac_name,
            "accountId": bank_ac_number
          }
        },
        {
          headers: {
            'APP_ID': 'cc3b9a7-d6d65f15289b'
          }
        }
      );

      if (res.data) {
        console.log(res.data.data);
        if (res.data.data.isValid) {
          validBenf.push(phone!);
        } else {
          invalidBenf.push(phone!);
        }
      }
    } catch (error) {
      console.error(`#### Error verifying beneficiary ${phone}:`, error);
    }

    await new Promise(resolve => setTimeout(resolve, 3000));


  }

  console.log(`#### Total valid beneficiaries: ${validBenf.length} ####`);
  console.log(`#### Total invalid beneficiaries: ${invalidBenf.length} ####`);

  console.log(`#### Invalid beneficiaries: ${invalidBenf.join(', ')} ####`);
}

const syncBenfInAADb = async () => {
  const benfInAADb = await aaPrisma.$queryRaw`SELECT * FROM tbl_beneficiaries` as any;
  const walletAddress = benfInAADb.map((benf: any) => benf.walletAddress);
  const benfInCore = await corePrisma.beneficiary.findMany({
    where: {
      walletAddress: {
        in: walletAddress
      }
    },
    include: {
      pii: true
    }
  })

  if (benfInCore.length !== walletAddress.length) {
    console.log(`#### Total beneficiaries in core: ${benfInCore.length} ####`);
    console.log(`#### Total beneficiaries in AADb: ${walletAddress.length} ####`);
    throw new Error('Total beneficiaries in core and AADb are not the same');
  }

  const dataToSync = benfInCore.map((benf) => {
    return {
      walletAddress: benf.walletAddress,
      payload: {
        ...JSON.parse(JSON.stringify(benf.extras)),
        phone: benf.pii?.phone,
      }
    }
  })

  for (const { walletAddress, payload } of dataToSync) {
    try {
      await aaPrisma.$queryRaw`UPDATE tbl_beneficiaries SET extras = ${payload}::jsonb WHERE "walletAddress" = ${walletAddress}`;
      console.log(`#### Synced beneficiary ${walletAddress} ####`);
    } catch (error) {
      console.error(`#### Error syncing beneficiary ${walletAddress}:`, error);
    }
  }

  console.log('#'.repeat(100));
  console.log(`#### Synced ${dataToSync.length} beneficiaries ####`);
}


(async () => {
  try {
    // await processAndUpdateBenfBankDetails();
    // await verifyBenfBankDetails();
    await syncBenfInAADb();
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await corePrisma.$disconnect();
    await aaPrisma.$disconnect();
    await ctPrisma.$disconnect();
  }
})();
