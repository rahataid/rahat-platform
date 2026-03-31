import * as dotenv from 'dotenv';
import * as fs from 'fs/promises';

dotenv.config();

const modifyNetworksFile = async (
  contractAddressesPath: string,
  networksFilePath: string
) => {
  try {
    const contractData = await fs.readFile(contractAddressesPath, 'utf8');
    const newAddresses = JSON.parse(contractData);

    const networksData = await fs.readFile(networksFilePath, 'utf8');
    const networks = JSON.parse(networksData);

    const newNetworksData = {
      ...networks,
      mainnet: newAddresses,
    };

    const stringified = JSON.stringify(newNetworksData, null, 2);
    await fs.writeFile(networksFilePath, stringified, 'utf-8');

    console.log(`Modified networks.json.`);
  } catch (error) {
    console.error(
      `Error processing JSON file: ${contractAddressesPath}`,
      error
    );
  }
};

(async function () {
  const rootPath = process.argv[2];
  const contractAddressesPath = `${rootPath}/tools/scripts/local-setup/web3_setup/deployments/contracts.json`; //need to update the path
  const networksFilePath = `${rootPath}/apps/graph/networks.json`;
  modifyNetworksFile(contractAddressesPath, networksFilePath);
})();
