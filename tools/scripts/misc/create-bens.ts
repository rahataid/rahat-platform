import { faker } from '@faker-js/faker';
import axios from 'axios';

// Type definitions
interface BeneficiaryData {
  birthDate: string;
  age: number;
  gender: string;
  location: string;
  latitude: number;
  longitude: number;
  notes: string;
  extras: {
    bank_name: string;
    bank_ac_name: string;
    bankedStatus: string;
    bank_ac_number: string;
    validBankAccount: boolean;
  };
  bankedStatus: string;
  internetStatus: string;
  phoneStatus: string;
  walletAddress?: string;
  piiData: {
    name: string;
    phone: string;
    extras: {
      bank: string;
      account: string;
    };
  };
}

interface GroupData {
  name: string;
  beneficiaries: { uuid: string }[];
}

interface PurposeData {
  groupPurpose: string;
}

interface GroupResponse {
  uuid: string;
  name: string;
}

interface BulkBeneficiaryResponse {
  uuid: string;
  name?: string;
  phone?: string;
  walletAddress?: string;
}

interface BulkResponse {
  success: boolean;
  count: number;
  beneficiariesData: BulkBeneficiaryResponse[];
}

// Configuration
const BASE_URL = 'http://localhost:5500/v1';
const PROJECT_ID = '30d1a534-b02f-4135-87e3-e820aede1dce';
const ACCESS_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcklkIjoxLCJ1dWlkIjoiYzZlZWY0ZmEtM2ZjOC00ZjU2LWE3M2YtMWQyMDI5Y2NmZGNiIiwibmFtZSI6IlJ1bXNhbiBBZG1pbiIsImVtYWlsIjoicnVtc2FuQG1haWxpbmF0b3IuY29tIiwicGhvbmUiOm51bGwsIndhbGxldCI6IjB4QUM2YkZhZjEwZTg5MjAyYzI5M2RENzk1ZUNlMTgwQkJmMTQzMGQ3QiIsInJvbGVzIjpbIkFkbWluIl0sInBlcm1pc3Npb25zIjpbeyJhY3Rpb24iOiJtYW5hZ2UiLCJzdWJqZWN0IjoiYWxsIiwiaW52ZXJ0ZWQiOmZhbHNlLCJjb25kaXRpb25zIjpudWxsfV0sInNlc3Npb25JZCI6ImQ5ZDc3NGVhLWFhZDMtNGFiZS1iOGNhLTY1YmY5NjU4MjhkMyIsImlhdCI6MTc1NjI5NTMzMywiZXhwIjoxNzU2MzgxNzMzfQ.7aDLFe3N1lNYXyPlEoG_5ISXmqql9tlFTdSqqzMPtnI';

const headers = {
  Authorization: `Bearer ${ACCESS_TOKEN}`,
  'Content-Type': 'application/json',
};

const numberOfBeneficiaries = 3000; // Reduced for testing
const BATCH_SIZE = 1500; // Process beneficiaries in batches of 10
const CONCURRENT_LIMIT = 10; // Limit concurrent requests to 5

// Track used wallet addresses to ensure uniqueness
const usedWalletAddresses = new Set<string>();

// Generate random beneficiary data
const generateBeneficiaryData = (): BeneficiaryData => {
  const randomName = faker.person.fullName();
  const areaCodes = ['980', '981', '982', '984', '985', '986'];
  const areaCode = areaCodes[Math.floor(Math.random() * areaCodes.length)];
  const phoneNumber = Math.floor(Math.random() * 9000000) + 1000000;
  const randomPhone = `+977${areaCode}${phoneNumber}`;

  // Generate unique wallet address
  let walletAddress: string;
  do {
    walletAddress = faker.finance.ethereumAddress();
  } while (usedWalletAddresses.has(walletAddress));
  usedWalletAddresses.add(walletAddress);

  return {
    birthDate: '1997-03-08',
    age: 20,
    gender: 'FEMALE',
    location: 'lalitpur',
    latitude: 26.24,
    longitude: 86.24,
    notes: '9785623749',
    extras: {
      bank_name: 'NMB Bank Limited',
      bank_ac_name: 'Ankit Neupane',
      bankedStatus: 'BANKED',
      bank_ac_number: '0010055573200018',
      validBankAccount: true,
    },
    bankedStatus: 'BANKED',
    internetStatus: 'HOME_INTERNET',
    phoneStatus: 'FEATURE_PHONE',
    walletAddress,
    piiData: {
      name: randomName,
      phone: randomPhone,
      extras: {
        bank: 'Laxmi Bank',
        account: '9872200001',
      },
    },
    // Remove projectUUIDs so beneficiaries are not automatically assigned
    // "projectUUIDs": [PROJECT_ID]
  };
};

const main = async () => {
  console.log('🚀 Starting simple beneficiary script...');
  console.log(`📋 Project ID: ${PROJECT_ID}`);
  console.log(`🌐 Base URL: ${BASE_URL}`);

  try {
    // Step 1: Create beneficiaries in bulk
    console.log(
      `\n📝 Step 1: Creating ${numberOfBeneficiaries} beneficiaries in bulk...`
    );
    const beneficiaries: string[] = [];

    // Process beneficiaries in batches
    for (let batchStart = 0; batchStart < numberOfBeneficiaries; batchStart += BATCH_SIZE) {
      const batchEnd = Math.min(batchStart + BATCH_SIZE, numberOfBeneficiaries);
      const batchSize = batchEnd - batchStart;

      console.log(
        `\n📦 Creating batch ${Math.floor(batchStart / BATCH_SIZE) + 1}/${Math.ceil(numberOfBeneficiaries / BATCH_SIZE)} (${batchSize} beneficiaries)...`
      );

      // Generate batch data
      const batchData: BeneficiaryData[] = [];
      for (let i = 0; i < batchSize; i++) {
        const beneficiaryData = generateBeneficiaryData();
        batchData.push(beneficiaryData);
      }

      console.log(`📋 Sending batch of ${batchSize} beneficiaries...`);

      try {
        // Create beneficiaries with retry mechanism for database connection issues
        const batchUUIDs: string[] = [];

        for (let i = 0; i < batchData.length; i += CONCURRENT_LIMIT) {
          const concurrentBatch = batchData.slice(i, i + CONCURRENT_LIMIT);
          let retryCount = 0;
          const maxRetries = 5;
          let success = false;

          while (!success && retryCount < maxRetries) {
            try {
              const concurrentPromises = concurrentBatch.map(async (beneficiaryData) => {
                const response = await axios.post(
                  `${BASE_URL}/beneficiaries`,
                  beneficiaryData,
                  { headers }
                );
                return response.data.data.uuid;
              });

              const concurrentUUIDs = await Promise.all(concurrentPromises);
              batchUUIDs.push(...concurrentUUIDs);

              console.log(`📋 Created ${concurrentUUIDs.length} beneficiaries (${i + concurrentBatch.length}/${batchData.length} in this batch)`);
              success = true;
            } catch (error: any) {
              retryCount++;
              const errorMessage = error.response?.data?.message || error.message;
              const isConnectionError = errorMessage.includes('too many clients');
              const isWalletError = errorMessage.includes('Wallet address already exists');

              if (isConnectionError && retryCount < maxRetries) {
                const waitTime = Math.pow(2, retryCount) * 1000; // Exponential backoff: 2s, 4s, 8s, 16s, 32s
                console.log(`⚠️ Database connection limit reached. Waiting ${waitTime / 1000}s before retry ${retryCount}/${maxRetries}...`);
                await new Promise((resolve) => setTimeout(resolve, waitTime));
              } else if (isWalletError) {
                console.log(`⚠️ Wallet address conflict detected. This should not happen with our uniqueness check.`);
                throw error; // Re-throw wallet errors as they indicate a logic issue
              } else {
                throw error; // Re-throw other errors
              }
            }
          }

          // Small delay between concurrent groups to avoid overwhelming the database
          if (i + CONCURRENT_LIMIT < batchData.length) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }

        beneficiaries.push(...batchUUIDs);

        console.log(`✅ Batch created successfully!`);
        console.log(`📋 Created ${batchUUIDs.length} beneficiaries in this batch`);
        console.log(`📋 Total beneficiaries created so far: ${beneficiaries.length}`);
        console.log(`📋 Progress: ${((beneficiaries.length / numberOfBeneficiaries) * 100).toFixed(1)}%`);
      } catch (batchError: any) {
        console.error(`❌ Batch failed:`, batchError.response?.data || batchError.message);
        throw batchError; // Re-throw to stop the process
      }

      // Small delay between batches
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    console.log('\n✅ All beneficiaries created!');
    console.log('📋 Beneficiary UUIDs:', beneficiaries);

    // Step 2: Create group
    console.log('\n📝 Step 2: Creating group...');
    const groupName = `random group ${Date.now()}-${Math.floor(
      Math.random() * 100000
    )}`;
    const groupData: GroupData = {
      name: groupName,
      beneficiaries: beneficiaries.map((uuid) => ({ uuid })),
    };

    console.log('📋 Group data:', JSON.stringify(groupData, null, 2));

    const groupResponse = await axios.post(
      `${BASE_URL}/beneficiaries/groups`,
      groupData,
      { headers }
    );

    console.log(
      '📋 Group response:',
      JSON.stringify(groupResponse.data, null, 2)
    );

    let groupId: string;
    if (groupResponse.data?.data?.uuid) {
      groupId = groupResponse.data.data.uuid;
    } else {
      // Add a short delay to allow the group to appear in the list (eventual consistency)
      await new Promise((r) => setTimeout(r, 3000)); // longer delay

      // Fetch all groups (increase perPage)
      const groupsResponse = await axios.get(
        `${BASE_URL}/beneficiaries/groups/all`,
        { headers, params: { page: 1, perPage: 500 } }
      );

      console.log(
        'Group names in list:',
        groupsResponse.data.data.map((g: GroupResponse) => g.name)
      );

      const newGroup = groupsResponse.data.data.find(
        (g: GroupResponse) => g.name.trim() === groupName.trim()
      );

      if (newGroup && newGroup.uuid) {
        groupId = newGroup.uuid;
        console.log(`✅ Found new group with ID: ${groupId}`);
      } else {
        throw new Error(
          `❌ Could not find the created group "${groupName}" in the group list. Aborting.`
        );
      }
    }

    console.log(`✅ Group created with ID: ${groupId}`);

    // Step 3: Add group purpose
    console.log('\n📝 Step 3: Adding group purpose...');
    const purposeData: PurposeData = {
      groupPurpose: 'BANK_TRANSFER',
    };

    const purposeResponse = await axios.patch(
      `${BASE_URL}/beneficiaries/groups/${groupId}/addGroupPurpose`,
      purposeData,
      { headers }
    );
    console.log('✅ Group purpose added:', purposeResponse.data);

    // Step 4: Assign group to project
    // console.log('\n📝 Step 4: Assigning group to project...');
    // const assignData = {
    //     action: 'beneficiary.assign_group_to_project',
    //     payload: {
    //         beneficiaryGroupId: groupId,
    //     },
    // };

    // const assignResponse = await axios.post(
    //     `${BASE_URL}/projects/${PROJECT_ID}/actions`,
    //     assignData,
    //     { headers }
    // );
    // console.log('✅ Group assigned to project:', assignResponse.data);

    console.log('\n🎉 Script completed successfully!');
    console.log('📋 Summary:');
    console.log(`   - Created ${numberOfBeneficiaries} beneficiaries`);
    console.log(`   - Created group: ${groupId}`);
    console.log(`   - Added group purpose: BANK_TRANSFER`);
    // console.log(`   - Assigned group to project: ${PROJECT_ID}`);
  } catch (error: any) {
    console.error('❌ Script failed:', error.message);
    if (error.response) {
      console.error('📋 Response status:', error.response.status);
      console.error('📋 Response status text:', error.response.statusText);
      console.error('📋 Response data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('📋 Request error - no response received');
      console.error('📋 Request details:', error.request);
    } else {
      console.error('📋 Error details:', error);
    }
  }
};

main();
