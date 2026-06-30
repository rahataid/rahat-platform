/**
 * 4.setup-access-manager.js
 *
 * Step 4 of the deployment setup workflow.
 *
 * Initializes the RahatAccessManager contract by granting the ADMIN_ROLE
 * to a specified address. This should run after core contracts are deployed.
 *
 * What it does:
 *   - Prompts to select the target deployment file
 *   - Reads the RahatAccessManager contract address from CONTRACT settings
 *   - Reads RPC URL from CHAIN_SETTINGS in that file
 *   - Prompts for new admin address and deployer private key
 *   - Calls grantRole() to grant ADMIN_ROLE to the new admin address
 *   - Logs the transaction details
 *
 * Prerequisites:
 *   - A deployment file must exist (run 0.setup-project.js first)
 *   - CHAIN_SETTINGS must exist in the deployment file
 *   - CONTRACT settings must exist with RahatAccessManager address (run 3.setup-contract-settings.js first)
 *   - The deployer wallet must have enough gas funds
 *
 * Usage:
 *   node tools/deployment-scripts/4.setup-access-manager.js
 */

const fs = require('fs/promises');
const path = require('path');
const inquirer = require('inquirer');
const { Wallet, JsonRpcProvider, Contract } = require('ethers');
const {
  getDeploymentFiles,
  askTargetFile,
  readDeploymentFile,
  askConfirmation,
} = require('./_common');

const prompt = inquirer.prompt ?? inquirer.default?.prompt;
const CONTRACTS_DIR = path.resolve(__dirname, './contracts');

const ADMIN_ROLE = 0n; // ADMIN_ROLE is typically 0
const CHAIN_SETTINGS_NAME = 'CHAIN_SETTINGS';
const CONTRACT_SETTING_NAME = 'CONTRACT';

async function getContractArtifact(contractName) {
  const artifactPath = path.join(CONTRACTS_DIR, `${contractName}.json`);
  const content = await fs.readFile(artifactPath, 'utf-8');
  return JSON.parse(content);
}

function getAllContracts(deploymentData) {
  // Try to find the contract address from CONTRACT setting
  const contractSettings = deploymentData.settings?.find(
    (s) => s.name === 'CONTRACT'
  );

  if (!contractSettings) {
    throw new Error(
      'CONTRACT settings not found. Please run 3.setup-contract-settings.js first.'
    );
  }

  let contractValue;
  try {
    contractValue =
      typeof contractSettings.value === 'string'
        ? JSON.parse(contractSettings.value)
        : contractSettings.value;
  } catch (err) {
    throw new Error(
      `Failed to parse CONTRACT settings: ${err.message}`
    );
  }

  return contractValue;
}

async function getRahatAccessManagerAddress(deploymentData) {
  const contractValue = getAllContracts(deploymentData);

  if (!contractValue.RAHATACCESSMANAGER) {
    throw new Error('RahatAccessManager address not found in CONTRACT settings');
  }

  return contractValue.RAHATACCESSMANAGER.address;
}

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

function getChainSettings(payload) {
  const chainSettings = parseSettingValue(
    getSetting(payload.settings, CHAIN_SETTINGS_NAME)
  );

  if (!chainSettings?.rpcUrl || typeof chainSettings.rpcUrl !== 'string') {
    throw new Error(
      'CHAIN_SETTINGS.rpcUrl is missing. Please run 1.setup-chain-settings.js first.'
    );
  }

  return chainSettings;
}

function getDeployerPrivateKey(payload) {
  // Try Keys.privateKey first (preferred location from 3.setup-keys.js)
  if (payload.Keys?.privateKey && typeof payload.Keys.privateKey === 'string') {
    return payload.Keys.privateKey;
  }

  // Fallback: try DEPLOYER_PRIVATE_KEY setting
  const deployerSetting = parseSettingValue(
    getSetting(payload.settings, 'DEPLOYER_PRIVATE_KEY')
  );

  if (deployerSetting && typeof deployerSetting === 'string') {
    return deployerSetting;
  }

  // Fallback: check if value is directly a string (not parsed as JSON)
  const rawSetting = getSetting(payload.settings, 'DEPLOYER_PRIVATE_KEY');
  if (rawSetting?.value && typeof rawSetting.value === 'string') {
    return rawSetting.value;
  }

  throw new Error(
    'Deployer private key is missing. Please run 3.setup-keys.js first to configure the deployer wallet.'
  );
}

async function askAdminSetupDetails() {
  const answers = await prompt([
    {
      type: 'input',
      name: 'newAdminAddress',
      message: 'Enter the address to grant ADMIN_ROLE to:',
      validate: (input) => {
        if (!/^0x[a-fA-F0-9]{40}$/.test(input)) {
          return 'Please provide a valid Ethereum address (0x...)';
        }
        return true;
      },
    },
    {
      type: 'input',
      name: 'executionDelay',
      message: 'Execution delay in seconds (default 0):',
      default: '0',
      validate: (input) => {
        if (isNaN(input) || parseInt(input) < 0) {
          return 'Please enter a valid non-negative number';
        }
        return true;
      },
    },
  ]);

  return {
    newAdminAddress: answers.newAdminAddress,
    executionDelay: parseInt(answers.executionDelay),
  };
}

async function grantAdminRole({
  accessManagerAddress,
  rpcUrl,
  newAdminAddress,
  deployerPrivateKey,
  executionDelay,
}) {
  const provider = new JsonRpcProvider(rpcUrl);
  const signer = new Wallet(deployerPrivateKey, provider);

  const artifact = await getContractArtifact('RahatAccessManager');
  const accessManager = new Contract(
    accessManagerAddress,
    artifact.abi,
    signer
  );
  console.log('\n📝 Granting ADMIN_ROLE to:', newAdminAddress);
  console.log('   RahatAccessManager:', accessManagerAddress);
  console.log('   Execution Delay:', executionDelay, 'seconds');

  try {
    const tx = await accessManager.grantRole(
      ADMIN_ROLE,
      newAdminAddress,
      executionDelay
    );

    console.log('\n⏳ Transaction submitted:', tx.hash);
    const receipt = await tx.wait();

    console.log('✅ Role granted successfully!');
    console.log('   Block:', receipt.blockNumber);
    console.log('   Gas Used:', receipt.gasUsed.toString());

    return {
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      newAdminAddress,
      accessManagerAddress,
    };
  } catch (error) {
    console.error('❌ Failed to grant role:', error.message);
    throw error;
  }
}

async function main() {
  console.log('🔐 RahatAccessManager Admin Setup\n');

  try {
    // Get deployment files
    const files = await getDeploymentFiles();
    if (files.length === 0) {
      console.error(
        'No deployment files found. Please run 0.setup-project.js first.'
      );
      process.exit(1);
    }

    // Ask for target file
    const selectedFile = await askTargetFile(files);
    const deploymentData = await readDeploymentFile(selectedFile);

    // Get chain settings and contract address
    const chainSettings = await getChainSettings(deploymentData);
    const contracts = getAllContracts(deploymentData);
    const accessManagerAddress = await getRahatAccessManagerAddress(
      deploymentData
    );

    // Get deployer private key from deployment file
    const deployerPrivateKey = getDeployerPrivateKey(deploymentData);

    // Ask for admin setup details
    const setupDetails = await askAdminSetupDetails();

    // Show summary
    console.log('\n📋 Setup Summary:');
    console.log('   Deployed Contracts:');
    Object.entries(contracts).forEach(([name, contract]) => {
      if (contract?.address) {
        console.log(`     ${name}: ${contract.address}`);
      }
    });
    console.log('   New Admin:', setupDetails.newAdminAddress);
    console.log('   RPC URL:', chainSettings.rpcUrl.substring(0, 50) + '...');

    // Ask for confirmation
    const confirmed = await askConfirmation(
      'Proceed with granting ADMIN_ROLE?'
    );
    if (!confirmed) {
      console.log('❌ Cancelled.');
      process.exit(0);
    }

    // Grant role
    const result = await grantAdminRole({
      accessManagerAddress,
      rpcUrl: chainSettings.rpcUrl,
      newAdminAddress: setupDetails.newAdminAddress,
      deployerPrivateKey,
      executionDelay: setupDetails.executionDelay,
    });

    console.log('\n✨ Admin setup completed successfully!\n');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
