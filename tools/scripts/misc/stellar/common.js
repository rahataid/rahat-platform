require('dotenv').config({ path: __dirname + '/.env.stellar' });
const axios = require('axios');

const projectId = process.env.RAHAT_PROJECT_ID;

const API_URL = `https://api-aa-dev.rahat.io/v1/projects/${projectId}/actions`;
const RAHAT_ACCESS_TOKEN = process.env.RAHAT_ACCESS_TOKEN;
const STELLAR_HORIZON_URL = 'https://horizon.stellar.org';

console.log('RAHAT_API_URL:', API_URL);
console.log('RAHAT_ACCESS_TOKEN:', RAHAT_ACCESS_TOKEN);

const getBeneficiaresFromApi = async () => {
    const payload = {
        action: "beneficiary.list_by_project",
        payload: {
            page: 1,
            perPage: 500,
            order: "desc",
            sort: "createdAt"
        }
    };

    try {
        const response = await axios.post(API_URL, payload, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${RAHAT_ACCESS_TOKEN}`
            }
        });

        return response.data;
    } catch (error) {
        console.error('Error fetching beneficiaries:', error.message);
        throw error;
    }
}

const getBeneficiaryWallets = async () => {
    const beneficiaries = await getBeneficiaresFromApi();
    return beneficiaries.data.map(b => b.walletAddress);
}

const checkStellarAccount = async (walletAddress) => {
    const server = new Server(STELLAR_HORIZON_URL);
    try {
        const account = await server.loadAccount(walletAddress);
        return {
            exists: true,
            accountData: {
                accountId: account.accountId(),
                sequenceNumber: account.sequenceNumber(),
                balances: account.balances
            }
        };
    } catch (error) {
        if (error.response && error.response.status === 404) {
            return { exists: false };
        }
        return {
            exists: false,
            error: error.message
        };
    }
};


const saveJsonFile = (data, filePath) => {
    try {
        // Ensure directory exists
        const dataDir = path.dirname(filePath);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        // Write JSON file
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        console.log(`Data saved to: ${filePath}`);
        return true;
    } catch (error) {
        console.error(`Error saving file ${filePath}:`, error.message);
        return false;
    }
};

module.exports = {
    saveJsonFile,
    getBeneficiaryWallets,
    checkStellarAccount,
    getBeneficiaresFromApi,
}



