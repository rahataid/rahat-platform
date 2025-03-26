# Rahat Core Deployment Instructions

This guide explains the steps required to manually set up **Rahat Core**.

## Deploying Rahat Contracts

To deploy Rahat Core, you must deploy four contracts: **RahatAccessManager**, **RahatToken**, **RahatTreasury**, and **ERC2771Forwarder**.

### Prerequisites

Ensure the `.env` file is correctly configured with the following values:

- `NETWORK_PROVIDER =`
- `DEPLOYER_PRIVATE_KEY =`

### Deployment Resources

- All updated ABI files for contract deployment are available in the [contracts](../tools/scripts/contracts) directory.
- The deployment script can be found [here](../tools//scripts/local-setup/web3_setup/projectSeed.ts). This script deploys the contracts and records their addresses in the [deployment](../tools/scripts/local-setup/web3_setup/deployments/contracts.json) file. Additionally, the deployed contracts are added to the settings.

### Adding Network Settings

- The script for configuring network settings is located [here](../tools/scripts/local-setup/web3_setup/settingsSeed.ts). This script updates the database with the necessary blockchain settings.

Ensure these values are correctly assigned when adding blockchain settings:

- `CHAIN_ID =`
- `NETWORK_PROVIDER =`
- `CHAIN_NAME =`
- `CURRENCY_NAME =`
- `CURRENCY_SYMBOL =`
