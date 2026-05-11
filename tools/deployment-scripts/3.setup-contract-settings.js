/**
 * 3.setup-contract-settings.js
 *
 * Step 3 of the deployment setup workflow.
 *
 * Deploys the platform core contracts to the configured blockchain network and
 * saves the resulting contract addresses and ABIs into the deployment file.
 *
 * What it does:
 *   - Prompts to select the target deployment file
 *   - Reads RPC URL from CHAIN_SETTINGS in that file
 *   - Prompts for deployer private key and token metadata
 *   - Deploys 4 platform core contracts in order:
 *       RahatAccessManager -> ERC2771Forwarder -> RahatTreasury -> RahatToken
 *   - Upserts both CONTRACT and CONTRACTS settings in the selected deployment file
 *
 * Prerequisites:
 *   - A deployment file must exist (run 0.setup-project.js first)
 *   - CHAIN_SETTINGS must already exist in the selected deployment file
 *   - The deployer wallet must have enough gas funds
 *   - Contract ABI/bytecode JSON files must exist in tools/scripts/contracts/
 *
 * Usage:
 *   node tools/deployment-scripts/3.setup-contract-settings.js
 */

const fs = require('fs/promises');
const path = require('path');
const inquirer = require('inquirer');
const { Wallet, JsonRpcProvider, ContractFactory } = require('ethers');
const {
  getDeploymentFiles,
  askTargetFile,
  readDeploymentFile,
  writeDeploymentFile,
  buildSettingEntry,
  askConfirmation,
} = require('./_common');

const prompt = inquirer.prompt ?? inquirer.default?.prompt;
const CONTRACTS_DIR = path.resolve(__dirname, '../scripts/contracts');
const CHAIN_SETTINGS_NAME = 'CHAIN_SETTINGS';
const CONTRACT_SETTING_NAME = 'CONTRACT';
const CONTRACTS_SETTING_NAME = 'CONTRACTS';

const defaultTokenDetails = {
  name: 'RHT Coin',
  symbol: 'RHT',
  description: 'RHT Coin',
  decimals: 0,
  initialSupply: '100000',
};

function getSetting(settings, name) {
  return (Array.isArray(settings) ? settings : []).find(
    (setting) => setting && setting.name === name
  );
}

function parseSettingValue(settingEntry) {
  if (!settingEntry) {
    return null;
  }

  if (typeof settingEntry.value === 'string') {
    try {
      return JSON.parse(settingEntry.value);
    } catch {
      return null;
    }
  }

  return settingEntry.value ?? null;
}

function getRpcUrlFromChainSettings(payload) {
  const chainSettings = parseSettingValue(
    getSetting(payload.settings, CHAIN_SETTINGS_NAME)
  );

  if (!chainSettings?.rpcUrl || typeof chainSettings.rpcUrl !== 'string') {
    throw new Error(
      'CHAIN_SETTINGS.rpcUrl is missing. Please run 1.setup-chain-settings.js first.'
    );
  }

  return chainSettings.rpcUrl;
}

async function readArtifact(contractName) {
  const filePath = path.join(CONTRACTS_DIR, `${contractName}.json`);
  const content = await fs.readFile(filePath, 'utf8');
  return JSON.parse(content);
}

async function askDeploymentInputs() {
  const answers = await prompt([
    {
      type: 'password',
      name: 'deployerPrivateKey',
      message: 'Enter deployer private key:',
      default: process.env.DEPLOYER_PRIVATE_KEY || '',
      mask: '*',
      validate: (input) =>
        input && input.trim() ? true : 'Deployer private key is required.',
      filter: (input) => input.trim(),
    },
    {
      type: 'input',
      name: 'tokenName',
      message: 'Enter RahatToken name:',
      default: defaultTokenDetails.name,
      validate: (input) => (input && input.trim() ? true : 'Token name is required.'),
      filter: (input) => input.trim(),
    },
    {
      type: 'input',
      name: 'tokenSymbol',
      message: 'Enter RahatToken symbol:',
      default: defaultTokenDetails.symbol,
      validate: (input) => (input && input.trim() ? true : 'Token symbol is required.'),
      filter: (input) => input.trim(),
    },
    {
      type: 'input',
      name: 'tokenDescription',
      message: 'Enter RahatToken description:',
      default: defaultTokenDetails.description,
      validate: (input) =>
        input && input.trim() ? true : 'Token description is required.',
      filter: (input) => input.trim(),
    },
    {
      type: 'number',
      name: 'tokenDecimals',
      message: 'Enter RahatToken decimals:',
      default: defaultTokenDetails.decimals,
      validate: (input) =>
        Number.isInteger(input) && input >= 0 ? true : 'Token decimals must be a non-negative integer.',
    },
    {
      type: 'input',
      name: 'tokenInitialSupply',
      message: 'Enter RahatToken initial supply:',
      default: defaultTokenDetails.initialSupply,
      validate: (input) =>
        input && input.trim() ? true : 'Token initial supply is required.',
      filter: (input) => input.trim(),
    },
    {
      type: 'input',
      name: 'forwarderName',
      message: 'Enter ERC2771Forwarder name:',
      default: 'RahatForwarder',
      validate: (input) => input && input.trim() ? true : 'Forwarder name is required.',
      filter: (input) => input.trim(),
    },
  ]);

  return answers;
}

async function deployContract({ contractName, args, signer }) {
  const artifact = await readArtifact(contractName);
  const factory = new ContractFactory(artifact.abi, artifact.bytecode, signer);
  const contract = await factory.deploy(...args);
  await contract.waitForDeployment();
  const tx = contract.deploymentTransaction();
  const receipt = tx ? await tx.wait() : null;
  const address = await contract.getAddress();

  return {
    abi: artifact.abi,
    address,
    startBlock: receipt?.blockNumber ?? 1,
    contract,
  };
}

function summarizeDeploymentPlan(selectedFile, rpcUrl, deployerAddress, tokenInputs) {
  console.log('\nDeployment summary:');
  console.log(`- file: ${selectedFile}`);
  console.log(`- rpcUrl: ${rpcUrl}`);
  console.log(`- deployer: ${deployerAddress}`);
  console.log(`- token: ${tokenInputs.tokenName} (${tokenInputs.tokenSymbol})`);
  console.log(`- decimals: ${tokenInputs.tokenDecimals}`);
  console.log(`- initialSupply: ${tokenInputs.tokenInitialSupply}`);
  console.log('- contracts: RahatAccessManager, ERC2771Forwarder, RahatTreasury, RahatToken');
}

function buildContractsValueMap(deployedContracts) {
  return {
    RAHATACCESSMANAGER: {
      abi: deployedContracts.RAHATACCESSMANAGER.abi,
      address: deployedContracts.RAHATACCESSMANAGER.address,
    },
    ERC2771FORWARDER: {
      abi: deployedContracts.ERC2771FORWARDER.abi,
      address: deployedContracts.ERC2771FORWARDER.address,
    },
    RAHATTREASURY: {
      abi: deployedContracts.RAHATTREASURY.abi,
      address: deployedContracts.RAHATTREASURY.address,
    },
    RAHATTOKEN: {
      abi: deployedContracts.RAHATTOKEN.abi,
      address: deployedContracts.RAHATTOKEN.address,
    },
  };
}

async function writeUpdatedDeploymentFile(fileName, payload, contractsValue) {
  const settings = Array.isArray(payload.settings) ? payload.settings : [];
  const contractEntry = buildSettingEntry({
    name: CONTRACT_SETTING_NAME,
    value: contractsValue,
    dataType: 'OBJECT',
    requiredFields: '{}',
    isReadOnly: false,
    isPrivate: false,
  });
  const contractsEntry = buildSettingEntry({
    name: CONTRACTS_SETTING_NAME,
    value: contractsValue,
    dataType: 'OBJECT',
    requiredFields: '{}',
    isReadOnly: false,
    isPrivate: false,
  });

  const contractIndex = settings.findIndex(
    (setting) => setting && setting.name === CONTRACT_SETTING_NAME
  );
  const contractsIndex = settings.findIndex(
    (setting) => setting && setting.name === CONTRACTS_SETTING_NAME
  );

  if (contractIndex >= 0) {
    settings[contractIndex] = contractEntry;
  } else {
    settings.push(contractEntry);
  }

  if (contractsIndex >= 0) {
    settings[contractsIndex] = contractsEntry;
  } else {
    settings.push(contractsEntry);
  }

  payload.settings = settings;
  await writeDeploymentFile(fileName, payload);

  return contractIndex >= 0 || contractsIndex >= 0 ? 'updated' : 'added';
}

async function main() {
  const deploymentFiles = await getDeploymentFiles();

  if (!deploymentFiles.length) {
    throw new Error('No deployment files found. Run 0.setup-project.js first.');
  }

  const selectedFile = await askTargetFile(
    deploymentFiles,
    'Select one deployment file to update:'
  );
  const payload = await readDeploymentFile(selectedFile);
  const rpcUrl = getRpcUrlFromChainSettings(payload);
  const deploymentInputs = await askDeploymentInputs();

  const provider = new JsonRpcProvider(rpcUrl);
  const signer = new Wallet(deploymentInputs.deployerPrivateKey, provider);

  summarizeDeploymentPlan(selectedFile, rpcUrl, signer.address, deploymentInputs);

  const confirmed = await askConfirmation(
    'Proceed with deployment and update the selected file?',
    true
  );

  if (!confirmed) {
    console.log('No deployment files were modified.');
    return;
  }

  console.log('----------Deploying Rahat Access Manager-------------------');
  const RahatAccessManager = await deployContract({
    contractName: 'RahatAccessManager',
    args: [signer.address],
    signer,
  });

  console.log('----------Deploying ERC2771Forwarder-------------------');
  const ERC2771Forwarder = await deployContract({
    contractName: 'ERC2771Forwarder',
    args: [deploymentInputs.forwarderName],
    signer,
  });

  console.log('----------Deploying Rahat Treasury-------------------');
  const RahatTreasury = await deployContract({
    contractName: 'RahatTreasury',
    args: [RahatAccessManager.address, ERC2771Forwarder.address],
    signer,
  });

  console.log('----------Deploying Rahat Token-------------------');
  const RahatToken = await deployContract({
    contractName: 'RahatToken',
    args: [
      deploymentInputs.tokenName,
      deploymentInputs.tokenSymbol,
      deploymentInputs.tokenDescription,
      deploymentInputs.tokenDecimals,
      deploymentInputs.tokenInitialSupply,
      RahatTreasury.address,
      RahatAccessManager.address,
      ERC2771Forwarder.address,
    ],
    signer,
  });

  const contractsValue = buildContractsValueMap({
    RAHATACCESSMANAGER: RahatAccessManager,
    ERC2771FORWARDER: ERC2771Forwarder,
    RAHATTREASURY: RahatTreasury,
    RAHATTOKEN: RahatToken,
  });

  const action = await writeUpdatedDeploymentFile(
    selectedFile,
    payload,
    contractsValue
  );

  console.log('Deployed CONTRACT/CONTRACTS value:');
  console.log(JSON.stringify(contractsValue, null, 2));
  console.log(`${action.toUpperCase()}: ${selectedFile}`);
}

main().catch((error) => {
  console.error('Failed to update contract settings in deployment files.');
  console.error(error.message || error);
  process.exit(1);
});
