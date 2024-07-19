import * as dotenv from 'dotenv';
import { commonLib } from './_common';
dotenv.config({ path: `${__dirname}/.env.setup` });

const rahatTokenDetails = {
    name: 'RHT Coin',
    symbol: 'RHT',
    description: 'RHT Coin',
    decimals: 0,
    initialSupply: '100000',
};

class DeploymentSetup extends commonLib {
    constructor() {
        super();
    }
    public async setupRahatPayrollContracts() {
        const deployerAccount = this.getDeployerWallet();

        console.log('----------Depolying Rahat Access Manager-------------------');
        const RahatAccessManager = await this.deployContract('RahatAccessManager', [
            deployerAccount.address,
        ]);
        console.log({
            RahatAccessManager: RahatAccessManager.contract.target,
            blockNumber: RahatAccessManager.blockNumber,
        });

        console.log(
            '----------Depolying Rahat ERC7221Forwarder-------------------'
        );
        const ERC2771Forwarder = await this.deployContract('ERC2771Forwarder', [
            'RahatForwarder',
        ]);
        console.log({
            ERC2771Forwarder: ERC2771Forwarder.contract.target,
            blockNumber: ERC2771Forwarder.blockNumber,
        });

        console.log('----------Depolying Rahat Treasury-------------------');
        const RahatTreasury = await this.deployContract('RahatTreasury', [
            RahatAccessManager.contract.target,
            ERC2771Forwarder.contract.target,
        ]);
        console.log({
            RahatTreasury: RahatTreasury.contract.target,
            blockNumber: RahatTreasury.blockNumber,
        });




        console.log('----------Depolying Rahat Token-------------------');
        const RahatToken = await this.deployContract('RahatToken', [
            rahatTokenDetails.name,
            rahatTokenDetails.symbol,
            rahatTokenDetails.description,
            rahatTokenDetails.decimals,
            rahatTokenDetails.initialSupply,
            RahatTreasury.contract.target,
            RahatAccessManager.contract.target,
            ERC2771Forwarder.contract.target,

        ]);
        console.log({
            RahatToken: RahatToken.contract.target,
            blockNumber: RahatToken.blockNumber,
        });



        console.log('Writing deployed address to file');
        this.writeToDeploymentFile(
            'contracts',
            {
                contracts: {
                    RahatAccessManager: {
                        address: RahatAccessManager.contract.target,
                        startBlock: RahatAccessManager.blockNumber,
                    },
                    RahatTreasury: {
                        address: RahatTreasury.contract.target,
                        startBlock: RahatTreasury.blockNumber,
                    },
                    RahatToken: {
                        address: RahatToken.contract.target,
                        startBlock: RahatToken.blockNumber,
                    },

                    ERC2771Forwarder: {
                        address: ERC2771Forwarder.contract.target,
                        startBlock: ERC2771Forwarder.blockNumber,
                    },
                }
            },
        );
    }

    public async setupBlockchainNetowrk() {
        console.log("writing chain settings to file")
        const subgraphUrl = process.env.SUBGRAPH_QUERY_URL;
        const chainSettings = {
            rpcUrl: process.env.NETWORK_PROVIDER,
            chainName: process.env.CHAIN_NAME,
            chainId: process.env.NETWORK_ID,
            nativeCurrency: {
                name: process.env.CURRENCY_NAME,
                symbol: process.env.CURRENCY_SYMBOL,
            },
        };
        this.writeToDeploymentFile('contracts', { chainSettings, subgraphUrl });
    }

}

async function main() {
    const deploymentSetup = new DeploymentSetup();
    await deploymentSetup.setupRahatPayrollContracts();
    await deploymentSetup.setupBlockchainNetowrk();

}
main().catch((error) => {
    console.error(error);
    process.exit(1);
});
