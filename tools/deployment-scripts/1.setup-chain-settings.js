const {
  prompt,
  getDeploymentFiles,
  askTargetFile,
  buildSettingEntry,
  upsertSettingInDeploymentFile,
  askConfirmation,
} = require('./_common');

const CHAIN_SETTINGS_NAME = 'CHAIN_SETTINGS';

const EVM_PRESETS = {
  testnet: [
    {
      key: 'base-sepolia',
      label: 'Base Sepolia',
      setting: {
        name: 'EVM',
        type: 'evm',
        rpcUrl: 'https://base-sepolia.g.alchemy.com/v2/bnfGi0PVbNMijQJFjFng2De86z-QvOMR',
        chainId: '84532',
        currency: {
          name: 'eth',
          symbol: 'eth',
        },
        explorerUrl: 'https://sepolia.basescan.org',
      },
    },
    {
      key: 'polygon-amoy',
      label: 'Polygon Test Network',
      setting: {
        name: 'EVM',
        type: 'evm',
        rpcUrl: 'https://rpc-amoy.polygon.technology',
        chainId: '80002',
        currency: {
          name: 'pol',
          symbol: 'pol',
        },
        explorerUrl: 'https://amoy.polygonscan.com',
      },
    },
  ],
  mainnet: [
    {
      key: 'base-mainnet',
      label: 'Base Main Network',
      setting: {
        name: 'EVM',
        type: 'evm',
        rpcUrl: 'https://mainnet.base.org',
        chainId: '8453',
        currency: {
          name: 'eth',
          symbol: 'eth',
        },
        explorerUrl: 'https://basescan.org',
      },
    },
    {
      key: 'polygon-mainnet',
      label: 'Polygon Main Network',
      setting: {
        name: 'EVM',
        type: 'evm',
        rpcUrl: 'https://polygon-rpc.com',
        chainId: '137',
        currency: {
          name: 'pol',
          symbol: 'pol',
        },
        explorerUrl: 'https://polygonscan.com',
      },
    },
  ],
};

const STELLAR_PRESETS = {
  testnet: [
    {
      key: 'stellar-testnet',
      label: 'Stellar Test Network',
      setting: {
        name: 'testnet',
        type: 'stellar',
        rpcUrl: 'https://soroban-testnet.stellar.org',
        chainId: 'Test SDF Network ; September 2015',
        currency: {
          name: 'stellar',
          symbol: 'XLM',
        },
        explorerUrl: 'https://stellar.expert/explorer/testnet',
      },
    },
  ],
  mainnet: [
    {
      key: 'stellar-mainnet',
      label: 'Stellar Main Network',
      setting: {
        name: 'mainnet',
        type: 'stellar',
        rpcUrl: 'https://mainnet.sorobanrpc.com',
        chainId: 'Public Global Stellar Network ; September 2015',
        currency: {
          name: 'stellar',
          symbol: 'XLM',
        },
        explorerUrl: 'https://stellar.expert/explorer/public',
      },
    },
  ],
};

function getPresetGroups(chainType) {
  return chainType === 'evm' ? EVM_PRESETS : STELLAR_PRESETS;
}

function formatPresetChoice(preset) {
  return {
    name: `${preset.label}: ${JSON.stringify(preset.setting)}`,
    value: preset.key,
    short: preset.label,
  };
}

async function askChainType() {
  const answers = await prompt([
    {
      type: 'list',
      name: 'chainType',
      message: 'Which chain settings do you want to add?',
      choices: [
        { name: 'EVM', value: 'evm' },
        { name: 'Stellar', value: 'stellar' },
      ],
      default: 'evm',
    },
  ]);

  return answers.chainType;
}

async function askNetworkTier(chainType) {
  const answers = await prompt([
    {
      type: 'list',
      name: 'networkTier',
      message:
        chainType === 'evm'
          ? 'Select EVM network type:'
          : 'Select Stellar network type:',
      choices: [
        { name: 'Test Network', value: 'testnet' },
        { name: 'Main Network', value: 'mainnet' },
      ],
      default: 'testnet',
    },
  ]);

  return answers.networkTier;
}

async function askPreset(chainType, networkTier) {
  const presetGroups = getPresetGroups(chainType);
  const presets = presetGroups[networkTier];

  const answers = await prompt([
    {
      type: 'list',
      name: 'presetKey',
      message: 'Select the prefilled chain settings:',
      choices: presets.map(formatPresetChoice),
    },
  ]);

  return presets.find((preset) => preset.key === answers.presetKey);
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
  const chainType = await askChainType();
  const networkTier = await askNetworkTier(chainType);
  const preset = await askPreset(chainType, networkTier);

  console.log('Selected CHAIN_SETTINGS value:');
  console.log(JSON.stringify(preset.setting, null, 2));

  const confirmed = await askConfirmation(
    `Apply this setting to ${selectedFile}?`,
    true
  );

  if (!confirmed) {
    console.log('No deployment files were modified.');
    return;
  }

  const action = await upsertSettingInDeploymentFile(
    selectedFile,
    buildSettingEntry({
      name: CHAIN_SETTINGS_NAME,
      value: preset.setting,
      dataType: 'OBJECT',
      requiredFields: '{}',
      isReadOnly: false,
      isPrivate: false,
    })
  );

  console.log(`${action.toUpperCase()}: ${selectedFile}`);
}

main().catch((error) => {
  console.error('Failed to update CHAIN_SETTINGS in deployment files.');
  console.error(error.message || error);
  process.exit(1);
});
