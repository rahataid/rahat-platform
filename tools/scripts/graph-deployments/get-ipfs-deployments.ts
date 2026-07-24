import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

interface ContractInfo {
  address: string;
  startBlock: number;
}

interface NetworkContracts {
  [contractName: string]: ContractInfo;
}

interface DeploymentInfo {
  name: string;
  ipfsHash: string;
}

const DEPLOYMENTS: DeploymentInfo[] = [
  {
    name: 'wsd-stage-kenya',
    ipfsHash: 'QmQKcncg2FM8Nm1FhX6qcPp9VpWRoGioHYURvcVvbVHYUa',
  },
  {
    name: 'wsd-sms_voucher-prod',
    ipfsHash: 'QmeYt8R3cQ8ocekj2v7NR8krLaE4YE1pWJ8hMHfDTtQ3na',
  },
  {
    name: 'cambodia--prod-replica-cambodia',
    ipfsHash: 'QmaYuZCZ4dbrYWmJXi75BaGqvRrLWF2FA38ZfLy94zE6RZ',
  },
  {
    name: 'sms-bangladesh',
    ipfsHash: 'QmcyfHS5b2UjDpj1zyjRgWazt3sGrwE1dnfpDskwvDbEJB',
  },
  {
    name: 'c2c-demo-2nd',
    ipfsHash: 'QmfWfmQofMXf3fr2LVjeA97QxBoXurhAjkvjmM59khHVP7',
  },
  {
    name: 'aa-unicef-evm-dev',
    ipfsHash: 'QmdZJg6ngFJKwmD1ytZDM3WUjxq68yxjE9awW3mkQ1jTfV',
  },
  {
    name: 'glofas-oracle',
    ipfsHash: 'QmX6kjSGavxTN2EZ5ftj62F3kHsT7wHAVEY9Kq2jJDshai',
  },
  {
    name: 'aa-unicef-evm',
    ipfsHash: 'QmcGN7VP3fknPy9LfwTbeHGSzTg9mYYN7DtPNMDXaKE23E',
  },
  {
    name: 'cambodia-replica-prod-sms_voucher',
    ipfsHash: 'Qmb4JaVZGrJouHLGKeJhpVFFD1fJ6n6kDjsBFV44PCRvy5',
  },
  {
    name: 'cam-ken-kenya',
    ipfsHash: 'QmfX1F7cB9inc1B1e5tWo2kNVd9EH2LKvKL8zfZjCZ7HST',
  },
  {
    name: 'sms-zambia',
    ipfsHash: 'QmcyfHS5b2UjDpj1zyjRgWazt3sGrwE1dnfpDskwvDbEJB',
  },
  {
    name: 'sms-southafrica',
    ipfsHash: 'QmYGMxxqxN7gNDRfcAkAbJTKEUbPvGxatiSkADfm8wVSPL',
  },
  {
    name: 'cam-ken-sms-voucher-ckdev',
    ipfsHash: 'QmXbp9vRpkRcjo1S9K3ydmtJrGyF71T9zypHebUnAD6jTW',
  },
  {
    name: 'cam-ken-cambodia-ck-dev',
    ipfsHash: 'QmYvhMekdMGP1ihYc9quBBUgrzy7gaWcTPkBajYtRQ2fHM',
  },
  {
    name: 'wsd-smsvoucher-rep',
    ipfsHash: 'QmQhLr8Spm9LeBHK7pizqWhd3hXuuXBFVmwwP2K1xxP3qP',
  },
  {
    name: 'cambodia-prod-smsvoucher',
    ipfsHash: 'QmUdHQ7sGRXfphZPNGY8NTaekqdiLYSDVJr6P475gkxQQA',
  },
];

async function fetchIPFSData(ipfsHash: string): Promise<string> {
  try {
    const url = `https://ipfs.io/ipfs/${ipfsHash}`;
    console.log(`Fetching data from: ${url}`);

    const response = await axios.get(url, {
      timeout: 30000, // 30 second timeout
      headers: {
        Accept: 'application/json, text/plain, */*',
        'User-Agent': 'Mozilla/5.0 (compatible; Rahat-Platform/1.0)',
      },
    });

    console.log('Response status:', response.status);
    console.log('Content-Type:', response.headers['content-type']);

    return response.data;
  } catch (error) {
    console.error('Error fetching IPFS data:', error);
    throw error;
  }
}

function displayRawData(content: string, deploymentName: string): void {
  console.log(`\n=== Raw IPFS Data for ${deploymentName} ===`);
  console.log('Content length:', content.length, 'characters');
  console.log('\nFirst 500 characters:');
  console.log(content.substring(0, 500));

  if (content.length > 500) {
    console.log('\n... (truncated)');
    console.log('\nLast 200 characters:');
    console.log(content.substring(content.length - 200));
  }
}

function extractContractInfo(content: string): { contracts: NetworkContracts; network: string } {
  const networkContracts: NetworkContracts = {};
  const lines = content.split('\n');

  let currentContractName = '';
  let currentAddress = '';
  let currentStartBlock = 0;
  let currentNetwork = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    // Look for network in mapping section
    if (trimmedLine.startsWith('network:')) {
      currentNetwork = trimmedLine.split(':')[1].trim();
    }

    // Look for contract name in mapping section
    if (trimmedLine.startsWith('name:')) {
      currentContractName = trimmedLine.split(':')[1].trim();
    }

    // Look for address in source section
    if (trimmedLine.startsWith('address:')) {
      currentAddress = trimmedLine.split(':')[1].trim().replace(/'/g, '');
    }

    // Look for startBlock in source section
    if (trimmedLine.startsWith('startBlock:')) {
      currentStartBlock = parseInt(trimmedLine.split(':')[1].trim());
    }

    // If we have all three pieces of information, add to mapping
    if (currentContractName && currentAddress && currentStartBlock > 0) {
      networkContracts[currentContractName] = {
        address: currentAddress,
        startBlock: currentStartBlock,
      };
      console.log(
        `Found contract: ${currentContractName} -> ${currentAddress} (startBlock: ${currentStartBlock})`
      );

      // Reset for next contract
      currentContractName = '';
      currentAddress = '';
      currentStartBlock = 0;
    }
  }

  return { contracts: networkContracts, network: currentNetwork };
}

function displayContractInfo(
  contracts: NetworkContracts,
  deploymentName: string,
  network: string
): void {
  console.log(`\n=== Contract Info for ${deploymentName} (${network}) ===`);
  console.log('{');
  Object.entries(contracts).forEach(([name, info], index) => {
    const comma = index < Object.keys(contracts).length - 1 ? ',' : '';
    console.log(`  "${name}": {`);
    console.log(`    "address": "${info.address}",`);
    console.log(`    "startBlock": ${info.startBlock}`);
    console.log(`  }${comma}`);
  });
  console.log('}');
}

function saveContractInfo(
  contracts: NetworkContracts,
  network: string,
  outputPath: string
): void {
  try {
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Create the network structure like in networks.json
    const networkData = {
      [network]: contracts
    };

    fs.writeFileSync(outputPath, JSON.stringify(networkData, null, 2));
    console.log(`\nContract info saved to: ${outputPath}`);
  } catch (error) {
    console.error('Error saving contract info to file:', error);
  }
}

async function processDeployment(deployment: DeploymentInfo): Promise<void> {
  console.log(`\n🔄 Processing deployment: ${deployment.name}`);
  console.log(`IPFS Hash: ${deployment.ipfsHash}`);

  try {
    const rawContent = await fetchIPFSData(deployment.ipfsHash);

    // Display raw data (optional - can be commented out for cleaner output)
    // displayRawData(rawContent, deployment.name);

    // Extract contract info and network
    console.log(`\nExtracting contract info for ${deployment.name}...`);
    const { contracts, network } = extractContractInfo(rawContent);

    if (Object.keys(contracts).length > 0) {
      // Display the contract info
      displayContractInfo(contracts, deployment.name, network);

      // Save to file in the deployments folder
      const outputDir = path.join(__dirname, 'deployments');
      const outputPath = path.join(outputDir, `${deployment.name}.json`);
      saveContractInfo(contracts, network, outputPath);

      console.log(`✅ Successfully processed ${deployment.name}!`);
      console.log(`Found ${Object.keys(contracts).length} contracts on network: ${network}`);
    } else {
      console.log(`⚠️  No contract info found for ${deployment.name}`);
    }
  } catch (error) {
    console.error(`❌ Failed to process ${deployment.name}:`, error);
  }
}

async function main(): Promise<void> {
  console.log('🚀 Starting IPFS deployment processing...');
  console.log(`Total deployments to process: ${DEPLOYMENTS.length}`);

  const results: { name: string; success: boolean; contractCount: number; network: string }[] =
    [];

  for (const deployment of DEPLOYMENTS) {
    try {
      const rawContent = await fetchIPFSData(deployment.ipfsHash);
      const { contracts, network } = extractContractInfo(rawContent);

      if (Object.keys(contracts).length > 0) {
        // Save to file in the deployments folder
        const outputDir = path.join(__dirname, 'deployments');
        const outputPath = path.join(outputDir, `${deployment.name}.json`);
        saveContractInfo(contracts, network, outputPath);

        results.push({
          name: deployment.name,
          success: true,
          contractCount: Object.keys(contracts).length,
          network: network,
        });

        console.log(
          `✅ ${deployment.name}: ${Object.keys(contracts).length} contracts (${network})`
        );
      } else {
        results.push({
          name: deployment.name,
          success: false,
          contractCount: 0,
          network: '',
        });
        console.log(`⚠️  ${deployment.name}: No contracts found`);
      }
    } catch (error) {
      results.push({
        name: deployment.name,
        success: false,
        contractCount: 0,
        network: '',
      });
      console.log(`❌ ${deployment.name}: Failed to process`);
    }
  }

  // Summary
  console.log('\n📊 Processing Summary:');
  console.log('=====================');
  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  console.log(`✅ Successful: ${successful.length}`);
  console.log(`❌ Failed: ${failed.length}`);
  console.log(`📁 Files saved in: ${path.join(__dirname, 'deployments')}`);

  if (successful.length > 0) {
    console.log('\nSuccessful deployments:');
    successful.forEach((result) => {
      console.log(`  - ${result.name}: ${result.contractCount} contracts (${result.network})`);
    });
  }

  if (failed.length > 0) {
    console.log('\nFailed deployments:');
    failed.forEach((result) => {
      console.log(`  - ${result.name}`);
    });
  }
}

// Run the script if called directly
if (require.main === module) {
  main().catch(console.error);
}

export {
  ContractInfo, DeploymentInfo,
  DEPLOYMENTS,
  displayContractInfo,
  extractContractInfo,
  fetchIPFSData, NetworkContracts, processDeployment,
  saveContractInfo
};

