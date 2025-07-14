import { faker } from '@faker-js/faker';
import axios from 'axios';

// Configuration
const BASE_URL = 'http://localhost:5500/v1';
const PROJECT_ID = 'ade76eab-ab56-4adc-8d31-0552f44f1302';
const ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcklkIjoxLCJ1dWlkIjoiYmQyOTkxMjEtN2E4ZC00MDE1LThhYTItZTA4YzQzZDQ1YmMyIiwibmFtZSI6IlJ1bXNhbiBBZG1pbiIsImVtYWlsIjoicnVtc2FuQG1haWxpbmF0b3IuY29tIiwicGhvbmUiOm51bGwsIndhbGxldCI6IjB4QUM2YkZhZjEwZTg5MjAyYzI5M2RENzk1ZUNlMTgwQkJmMTQzMGQ3QiIsInJvbGVzIjpbIkFkbWluIl0sInBlcm1pc3Npb25zIjpbeyJhY3Rpb24iOiJtYW5hZ2UiLCJzdWJqZWN0IjoiYWxsIiwiaW52ZXJ0ZWQiOmZhbHNlLCJjb25kaXRpb25zIjpudWxsfV0sInNlc3Npb25JZCI6IjUxNmM2NWIzLWMyNzQtNDI2Ny05ZmYyLTMzNGU5ZTg2ZjllOCIsImlhdCI6MTc1MjQ2OTUyNCwiZXhwIjoxNzUyNTU1OTI0fQ.6WxCMuheyjb7hJdf_caGbEBjz2dPxYH8SNYAX8NsdTI';

const headers = {
    'Authorization': `Bearer ${ACCESS_TOKEN}`,
    'Content-Type': 'application/json'
};

const numberOfBeneficiaries = 500;

// Generate random beneficiary data
const generateBeneficiaryData = () => {
    const randomName = faker.person.fullName();
    const areaCodes = ['980', '981', '982', '984', '985', '986', '988', '989'];
    const areaCode = areaCodes[Math.floor(Math.random() * areaCodes.length)];
    const phoneNumber = Math.floor(Math.random() * 9000000) + 1000000;
    const randomPhone = `+977${areaCode}${phoneNumber}`;

    return {
        "birthDate": "1997-03-08",
        "age": 20,
        "gender": "FEMALE",
        "location": "lalitpur",
        "latitude": 26.24,
        "longitude": 86.24,
        "notes": "9785623749",
        "extras": {
            "bank_name": "NMB Bank Limited",
            "bank_ac_name": "Ankit Neupane",
            "bankedStatus": "BANKED",
            "bank_ac_number": "0010055573200018",
            "validBankAccount": true
        },
        "bankedStatus": "BANKED",
        "internetStatus": "HOME_INTERNET",
        "phoneStatus": "FEATURE_PHONE",
        "piiData": {
            "name": randomName,
            "phone": randomPhone,
            "extras": {
                "bank": "Laxmi Bank",
                "account": "9872200001"
            }
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
        // Step 1: Create 2 beneficiaries
        console.log(`\n📝 Step 1: Creating ${numberOfBeneficiaries} beneficiaries...`);
        const beneficiaries: string[] = [];

        for (let i = 0; i < numberOfBeneficiaries; i++) {
            console.log(`\n👤 Creating beneficiary ${i + 1}/${numberOfBeneficiaries}...`);
            const beneficiaryData = generateBeneficiaryData();

            const response = await axios.post(`${BASE_URL}/beneficiaries`, beneficiaryData, { headers });
            const beneficiaryId = response.data.data.uuid;
            beneficiaries.push(beneficiaryId);

            console.log(`✅ Beneficiary created: ${beneficiaryId}`);
            console.log(`📋 Name: ${beneficiaryData.piiData.name}`);
            console.log(`📋 Phone: ${beneficiaryData.piiData.phone}`);

            // Small delay between requests
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        console.log('\n✅ All beneficiaries created!');
        console.log('📋 Beneficiary UUIDs:', beneficiaries);

        // Step 2: Create group
        console.log('\n📝 Step 2: Creating group...');
        const groupData = {
            "name": `random group ${Date.now()}`,
            "beneficiaries": beneficiaries.map(uuid => ({ uuid }))
        };

        console.log('📋 Group data:', JSON.stringify(groupData, null, 2));

        const groupResponse = await axios.post(`${BASE_URL}/beneficiaries/groups`, groupData, { headers });
        console.log('📋 Group response:', JSON.stringify(groupResponse.data, null, 2));

        // Get group ID from response or fetch it
        let groupId: string;
        if (groupResponse.data?.data?.uuid) {
            groupId = groupResponse.data.data.uuid;
        } else {
            // Fetch groups to find the new one
            const groupsResponse = await axios.get(`${BASE_URL}/beneficiaries/groups/all`, {
                headers,
                params: { page: 1, perPage: 100 }
            });
            const newGroup = groupsResponse.data.data.find((g: any) => g.name === groupData.name);
            groupId = newGroup?.uuid || 'fallback-id';
        }

        console.log(`✅ Group created with ID: ${groupId}`);

        // Step 3: Add group purpose
        console.log('\n📝 Step 3: Adding group purpose...');
        const purposeData = {
            "groupPurpose": "BANK_TRANSFER"
        };

        const purposeResponse = await axios.patch(
            `${BASE_URL}/beneficiaries/groups/${groupId}/addGroupPurpose`,
            purposeData,
            { headers }
        );
        console.log('✅ Group purpose added:', purposeResponse.data);

        // Step 4: Assign group to project
        console.log('\n📝 Step 4: Assigning group to project...');
        const assignData = {
            "action": "beneficiary.assign_group_to_project",
            "payload": {
                "beneficiaryGroupId": groupId
            }
        };

        const assignResponse = await axios.post(
            `${BASE_URL}/projects/${PROJECT_ID}/actions`,
            assignData,
            { headers }
        );
        console.log('✅ Group assigned to project:', assignResponse.data);

        console.log('\n🎉 Script completed successfully!');
        console.log('📋 Summary:');
        console.log(`   - Created ${numberOfBeneficiaries} beneficiaries`);
        console.log(`   - Created group: ${groupId}`);
        console.log(`   - Added group purpose: BANK_TRANSFER`);
        console.log(`   - Assigned group to project: ${PROJECT_ID}`);

    } catch (error: any) {
        console.error('❌ Script failed:', error.response?.data || error.message);
        if (error.response?.data) {
            console.error('📋 Error details:', JSON.stringify(error.response.data, null, 2));
        }
    }
};

main(); 