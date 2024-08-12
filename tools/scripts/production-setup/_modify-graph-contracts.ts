import * as dotenv from 'dotenv';
import * as fs from 'fs/promises';
dotenv.config({ path: `${__dirname}/.env.setup` });


const modifyNetworksFile = async (
    networkName: string = 'mainnet',
) => {
    const graphNetworksPath = `${__dirname}/../../apps/graph/networks.json`;
    const deploymentFilePath = `${__dirname}/deployments/contracts.json`;
    try {
        const contractData = await fs.readFile(deploymentFilePath, 'utf8');
        const newAddresses = JSON.parse(contractData).contracts;

        const networksData = await fs.readFile(graphNetworksPath, 'utf8');
        const networks = JSON.parse(networksData);

        const newNetworksData = {
            ...networks,
            [networkName]: newAddresses,
        };

        const stringified = JSON.stringify(newNetworksData, null, 2);
        await fs.writeFile(graphNetworksPath, stringified, 'utf-8');

        console.log(`Modified networks.json.`);
    } catch (error) {
        console.error(
            `Error processing JSON file: ${deploymentFilePath}`,
            error
        );
    }
};

(async function () {
    const networkName = process.env.SUBGRAPH_NETWORK as string;
    modifyNetworksFile(networkName);
})();
