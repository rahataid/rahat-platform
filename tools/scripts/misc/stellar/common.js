require('dotenv').config({ path: __dirname + '/.env.stellar' });
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const projectId = process.env.RAHAT_PROJECT_ID;

const API_URL = `http://localhost:5500/v1/projects/${projectId}/actions`;
const RAHAT_ACCESS_TOKEN = process.env.RAHAT_ACCESS_TOKEN;
const STELLAR_HORIZON_URL = 'https://horizon.stellar.org';

console.log('RAHAT_API_URL:', API_URL);
console.log('RAHAT_ACCESS_TOKEN:', RAHAT_ACCESS_TOKEN);

const getBeneficiaresFromApi = async () => {
  const payload = {
    action: 'beneficiary.list_by_project',
    payload: {
      page: 1,
      perPage: 500,
      order: 'desc',
      sort: 'createdAt',
    },
  };

  try {
    const response = await axios.post(API_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RAHAT_ACCESS_TOKEN}`,
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching beneficiaries from API:', error.message);
    throw error;
  }
};

const getBeneficiaresFromWalletStorage = async () => {
  try {
    const walletStoragePath =
      process.env.WALLET_STORAGE_PATH ||
      path.join(__dirname, '../../../../wallet_storage');

    console.log(`📁 Reading from wallet storage path: ${walletStoragePath}`);

    // Check if the wallet storage directory exists
    if (!fs.existsSync(walletStoragePath)) {
      console.warn(
        `⚠️  Wallet storage directory not found: ${walletStoragePath}`
      );
      return { data: [] };
    }

    const beneficiaries = [];

    // Recursively search through all subdirectories
    const getAllFiles = (dir) => {
      const files = fs.readdirSync(dir);

      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
          // Recursively search subdirectories
          getAllFiles(filePath);
        } else if (file.endsWith('.json')) {
          try {
            const fileContent = fs.readFileSync(filePath, 'utf8');
            const walletData = JSON.parse(fileContent);

            // Extract wallet address from the file
            // Handle both beneficiary format and direct wallet format
            const walletAddress =
              walletData.walletAddress ||
              walletData.address ||
              walletData.publicKey;
            const secret =
              walletData.secret ||
              walletData.privateKey ||
              walletData.secretKey;

            if (walletAddress) {
              beneficiaries.push({
                walletAddress: walletAddress,
                // Add other fields as needed
                uuid: walletData.uuid || file.replace('.json', ''),
                name: walletData.name || walletData.pii?.name,
                phone: walletData.phone || walletData.pii?.phone,
                secret: secret,
                mnemonic: walletData.mnemonic,
                blockchain: walletData.blockchain,
                filePath: filePath,
              });
            }
          } catch (fileError) {
            console.warn(
              `⚠️  Error reading file ${filePath}:`,
              fileError.message
            );
          }
        }
      }
    };

    // Start recursive search
    getAllFiles(walletStoragePath);

    console.log(
      `📋 Found ${beneficiaries.length} beneficiaries in wallet storage`
    );

    return {
      data: beneficiaries,
      success: true,
      count: beneficiaries.length,
    };
  } catch (error) {
    console.error('Error reading from wallet storage:', error.message);
    throw error;
  }
};

const getBeneficiaresFromSource = async () => {
  const dataSource = process.env.BENEFICIARY_DATA_SOURCE || 'API';

  console.log(`📋 Fetching beneficiary data from: ${dataSource}`);

  switch (dataSource.toUpperCase()) {
    case 'WALLET_STORAGE':
    case 'WALLETSTORAGE':
      return await getBeneficiaresFromWalletStorage();
    case 'API':
    default:
      return await getBeneficiaresFromApi();
  }
};

const getBeneficiaryWallets = async () => {
  const beneficiaries = await getBeneficiaresFromSource();
  return beneficiaries.data.map((b) => b.walletAddress);
};

const getAllWalletAddressesWithSecrets = async () => {
  const beneficiaries = await getBeneficiaresFromSource();
  return beneficiaries.data.map((b) => ({
    walletAddress: b.walletAddress,
    secret: b.secret,
    name: b.name,
    phone: b.phone,
    uuid: b.uuid,
    filePath: b.filePath,
  }));
};

const checkStellarAccount = async (walletAddress) => {
  const server = new Server(STELLAR_HORIZON_URL);
  try {
    const account = await server.loadAccount(walletAddress);
    return {
      exists: true,
      accountData: {
        accountId: account.accountId(),
        sequenceNumber: account.sequenceNumber(),
        balances: account.balances,
      },
    };
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return { exists: false };
    }
    return {
      exists: false,
      error: error.message,
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
  getAllWalletAddressesWithSecrets,
  checkStellarAccount,
  getBeneficiaresFromApi,
  getBeneficiaresFromWalletStorage,
  getBeneficiaresFromSource,
};
