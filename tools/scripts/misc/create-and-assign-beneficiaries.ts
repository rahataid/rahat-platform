import axios from 'axios';

// Configuration
const BASE_URL = 'http://localhost:5500/v1';
const PROJECT_ID = 'a22433bb-c0b4-48ac-b767-eefbfad7696c';
const ACCESS_TOKEN = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcklkIjoxLCJ1dWlkIjoiYmQyOTkxMjEtN2E4ZC00MDE1LThhYTItZTA4YzQzZDQ1YmMyIiwibmFtZSI6IlJ1bXNhbiBBZG1pbiIsImVtYWlsIjoicnVtc2FuQG1haWxpbmF0b3IuY29tIiwicGhvbmUiOm51bGwsIndhbGxldCI6IjB4QUM2YkZhZjEwZTg5MjAyYzI5M2RENzk1ZUNlMTgwQkJmMTQzMGQ3QiIsInJvbGVzIjpbIkFkbWluIl0sInBlcm1pc3Npb25zIjpbeyJhY3Rpb24iOiJtYW5hZ2UiLCJzdWJqZWN0IjoiYWxsIiwiaW52ZXJ0ZWQiOmZhbHNlLCJjb25kaXRpb25zIjpudWxsfV0sInNlc3Npb25JZCI6IjBkYzkzMjI3LTczMTUtNDk0YS1hZTQ1LWQyYWRlNGVjNmE1YyIsImlhdCI6MTc1MjEzNzczNywiZXhwIjoxNzUyMjI0MTM3fQ.EvZSd27ZQJOgLozMbHTDnDvAGX30VoBa-8_HNs-mGkI'; // Add your access token here

// Types
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
    piiData: {
        name: string;
        phone: string;
        extras: {
            bank: string;
            account: string;
        };
    };
    projectUUIDs: string[];
}

interface GroupPurposeData {
    groupPurpose: string;
}

interface AssignGroupData {
    action: string;
    payload: {
        beneficiaryGroupId: string;
    };
}

// API functions
const createBeneficiary = async (data: BeneficiaryData): Promise<any> => {
    try {
        const response = await axios.post(`${BASE_URL}/beneficiaries`, data, {
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
        console.log('✅ Beneficiary created:', response.data.data.uuid);
        return response.data.data;
    } catch (error: any) {
        console.error('❌ Error creating beneficiary:', error.response?.data || error.message);
        throw error;
    }
};

const addGroupPurpose = async (groupId: string, purpose: string): Promise<any> => {
    try {
        const response = await axios.patch(
            `${BASE_URL}/beneficiaries/groups/${groupId}/addGroupPurpose`,
            { groupPurpose: purpose },
            {
                headers: {
                    'Authorization': `Bearer ${ACCESS_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        console.log('✅ Group purpose added:', response.data);
        return response.data;
    } catch (error: any) {
        console.error('❌ Error adding group purpose:', error.response?.data || error.message);
        throw error;
    }
};

const assignGroupToProject = async (groupId: string): Promise<any> => {
    try {
        const data: AssignGroupData = {
            action: 'beneficiary.assign_group_to_project',
            payload: {
                beneficiaryGroupId: groupId
            }
        };

        const response = await axios.post(
            `${BASE_URL}/projects/${PROJECT_ID}/actions`,
            data,
            {
                headers: {
                    'Authorization': `Bearer ${ACCESS_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        console.log('✅ Group assigned to project:', response.data);
        return response.data;
    } catch (error: any) {
        console.error('❌ Error assigning group to project:', error.response?.data || error.message);
        throw error;
    }
};

// Generate random beneficiary data
const generateBeneficiaryData = (index: number): BeneficiaryData => {
    const names = [
        'Asal Poudel11',
        'Ram Shrestha',
        'Sita Tamang',
        'Gita Thapa',
        'Hari Gurung'
    ];

    const phones = [
        '+9779857738411',
        '+9779857738412',
        '+9779857738413',
        '+9779857738414',
        '+9779857738415'
    ];

    return {
        birthDate: "1997-03-08",
        age: 20,
        gender: "FEMALE",
        location: "lalitpur",
        latitude: 26.24,
        longitude: 86.24,
        notes: "9785623749",
        extras: {
            bank_name: "NMB Bank Limited",
            bank_ac_name: "Ankit Neupane",
            bankedStatus: "BANKED",
            bank_ac_number: "0010055573200018",
            validBankAccount: true
        },
        bankedStatus: "BANKED",
        internetStatus: "HOME_INTERNET",
        phoneStatus: "FEATURE_PHONE",
        piiData: {
            name: names[index],
            phone: phones[index],
            extras: {
                bank: "Laxmi Bank",
                account: "9872200001"
            }
        },
        projectUUIDs: [PROJECT_ID]
    };
};

// Main execution function
const main = async () => {
    console.log('🚀 Starting beneficiary creation and assignment script...');
    console.log(`📋 Project ID: ${PROJECT_ID}`);
    console.log(`🌐 Base URL: ${BASE_URL}`);

    if (!ACCESS_TOKEN) {
        console.error('❌ Please add your ACCESS_TOKEN to the script');
        return;
    }

    try {
        // Step 1: Create 5 beneficiaries
        console.log('\n📝 Step 1: Creating 5 beneficiaries...');
        const beneficiaries: any[] = [];

        for (let i = 0; i < 5; i++) {
            console.log(`\n👤 Creating beneficiary ${i + 1}/5...`);
            const beneficiaryData = generateBeneficiaryData(i);
            const beneficiary = await createBeneficiary(beneficiaryData);
            beneficiaries.push(beneficiary);

            // Add a small delay between requests
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        console.log('\n✅ All 5 beneficiaries created successfully!');
        console.log('📊 Beneficiary UUIDs:', beneficiaries.map(b => b.uuid));

        // Step 2: Create a group with the beneficiaries
        console.log('\n📝 Step 2: Creating beneficiary group...');
        const groupData = {
            name: `Test Group ${Date.now()}`,
            beneficiaries: beneficiaries.map((b: any) => ({ uuid: b.uuid })),
            projectId: PROJECT_ID
        };

        const groupResponse = await axios.post(`${BASE_URL}/beneficiaries/groups`, groupData, {
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        const groupId = (groupResponse.data as any).data?.uuid || 'dbbd00c7-1f2b-45b2-b924-7f9c6883aaaf';
        console.log('✅ Group created with ID:', groupId);

        // Step 3: Add group purpose
        console.log('\n📝 Step 3: Adding group purpose...');
        await addGroupPurpose(groupId, 'BANK_TRANSFER');

        // Step 4: Assign group to project
        console.log('\n📝 Step 4: Assigning group to project...');
        await assignGroupToProject(groupId);

        console.log('\n🎉 Script completed successfully!');
        console.log('📋 Summary:');
        console.log(`   - Created 5 beneficiaries`);
        console.log(`   - Created group: ${groupId}`);
        console.log(`   - Added group purpose: BANK_TRANSFER`);
        console.log(`   - Assigned group to project: ${PROJECT_ID}`);

    } catch (error: any) {
        console.error('\n❌ Script failed:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    }
};

// Run the script
if (require.main === module) {
    main().catch(console.error);
}

export { addGroupPurpose, assignGroupToProject, createBeneficiary, main };
