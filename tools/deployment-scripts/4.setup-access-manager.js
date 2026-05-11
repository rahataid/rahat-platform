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
const CONTRACTS_DIR = path.resolve(__dirname, '../scripts/contracts');

const ADMIN_ROLE = 0n; // ADMIN_ROLE is typically 0

async function getContractArtifact(contractName) {
  const artifactPath = path.join(CONTRACTS_DIR, `${contractName}.json`);
  const content = await fs.readFile(artifactPath, 'utf-8');
  return JSON.parse(content);
}

async function getRahatAccessManagerAddress(deploymentData) {
  // Try to find the contract address from CONTRACT setting
  const contractSettings = deploymentData.settings?.find(
    (s) => s.key === 'CONTRACT'
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

  if (!contractValue.RahatAccessManager) {
    throw new Error('RahatAccessManager address not found in CONTRACT settings');
  }

  return contractValue.RahatAccessManager;
}

async function getChainSettings(deploymentData) {
  const chainSettings = deploymentData.settings?.find(
    (s) => s.key === 'CHAIN_SETTINGS'
  );

  if (!chainSettings) {
    throw new Error('CHAIN_SETTINGS not found in deployment file');
  }

  let chainValue;
  try {
    chainValue =
      typeof chainSettings.value === 'string'
        ? JSON.parse(chainSettings.value)
        : chainSettings.value;
  } catch (err) {
    throw new Error(
      `Failed to parse CHAIN_SETTINGS: ${err.message}`
    );
  }

  return chainValue;
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
      type: 'password',
      name: 'deployerPrivateKey',
      message: 'Enter the deployer private key:',
      mask: '*',
      validate: (input) => {
        if (!input) return 'Private key is required';
        if (!/^(0x)?[a-fA-F0-9]{64}$/.test(input)) {
          return 'Invalid private key format';
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
    deployerPrivateKey: answers.deployerPrivateKey,
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
    const accessManagerAddress = await getRahatAccessManagerAddress(
      deploymentData
    );

    // Ask for admin setup details
    const setupDetails = await askAdminSetupDetails();

    // Show summary
    console.log('\n📋 Setup Summary:');
    console.log('   Deployment File:', path.basename(selectedFile));
    console.log('   AccessManager:', accessManagerAddress);
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
      deployerPrivateKey: setupDetails.deployerPrivateKey,
      executionDelay: setupDetails.executionDelay,
    });

    console.log('\n✨ Admin setup completed successfully!\n');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
