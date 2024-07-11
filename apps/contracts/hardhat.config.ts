import '@nomicfoundation/hardhat-toolbox';
import { HardhatUserConfig, vars } from 'hardhat/config';
import type { NetworkUserConfig } from 'hardhat/types';
import 'solidity-docgen';



const coinMarketCapApiKey: string = vars.get('COINMARKETCAP_API_KEY');
const privateKey: string = vars.get('PRIVATE_KEY');
const infuraApiKey: string = vars.get('INFURA_API_KEY');



interface DocgenConfig {
  outputDir?: string;
  pages?: 'files' | 'single' | 'items';
}
interface ExtendedHardhatUserConfig extends HardhatUserConfig {
  docgen?: DocgenConfig;
}

const chainIds = {
  'arbitrum-mainnet': 42161,
  avalanche: 43114,
  bsc: 56,
  ganache: 1337,
  hardhat: 31337,
  mainnet: 1,
  'optimism-mainnet': 10,
  'polygon-mainnet': 137,
  'polygon-mumbai': 80001,
  sepolia: 11155111,
};

function getChainConfig(chain: keyof typeof chainIds): NetworkUserConfig {
  let jsonRpcUrl: string = '';
  switch (chain) {
    case 'avalanche':
      jsonRpcUrl = 'https://api.avax.network/ext/bc/C/rpc';
      break;
    case 'bsc':
      jsonRpcUrl = 'https://bsc-dataseed1.binance.org';
      break;
    case 'sepolia':
      jsonRpcUrl = `https://sepolia.infura.io/v3/43babf32ce0346fabbf1c1069418a90b`;
      break;
    default:
      jsonRpcUrl = 'https://' + chain + '.infura.io/v3/' + infuraApiKey;
  }

  return {
    accounts: [privateKey],
    chainId: chainIds[chain],
    url: jsonRpcUrl,
  };
}

const config: ExtendedHardhatUserConfig = {
  defaultNetwork: 'hardhat',

  solidity: {
    version: '0.8.20',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },

  gasReporter: {
    token: 'ETH',
    currency: 'USD',
    gasPriceApi:
      'https://api.etherscan.io/api?module=proxy&action=eth_gasPrice',
    coinmarketcap: coinMarketCapApiKey,
    enabled:
      vars.get('REPORT_GAS') === 'false'
        ? false
        : Boolean(vars.get('REPORT_GAS')),
    showMethodSig: true,
    outputFile: 'gas-report.txt',
    noColors: true,
  },

  docgen: {
    outputDir: './docs',
    pages: 'files',
  },

  paths: {
    sources: './src',
    tests: './tests',
    cache: './cache',
    artifacts: './artifacts',
  },

  etherscan: {
    apiKey: {
      arbitrumOne: vars.get('ARBISCAN_API_KEY', ''),
      avalanche: vars.get('SNOWTRACE_API_KEY', ''),
      bsc: vars.get('BSCSCAN_API_KEY', ''),
      mainnet: vars.get('ETHERSCAN_API_KEY', ''),
      optimisticEthereum: vars.get('OPTIMISM_API_KEY', ''),
      polygon: vars.get('POLYGONSCAN_API_KEY', ''),
      polygonMumbai: vars.get('POLYGONSCAN_API_KEY', ''),
      sepolia: vars.get(
        'SEPOLIA_API_KEY',
        '8J72K47SVDN4R3BQ65EJRA4QJ4Z2DMUI9T'
      ),
    },
  },

  typechain: {
    outDir: 'typechain-types',
    target: 'ethers-v6',
  },

  networks: {
    hardhat: {
      chains: {
        99: {
          hardforkHistory: {
            berlin: 10000000,
            london: 20000000,
          },
        },
      },
    },
    ganache: {
      chainId: chainIds.ganache,
      url: 'http://localhost:8545',
    },
    arbitrum: getChainConfig('arbitrum-mainnet'),
    avalanche: getChainConfig('avalanche'),
    bsc: getChainConfig('bsc'),
    mainnet: getChainConfig('mainnet'),
    optimism: getChainConfig('optimism-mainnet'),
    'polygon-mainnet': getChainConfig('polygon-mainnet'),
    'polygon-mumbai': getChainConfig('polygon-mumbai'),
    sepolia: getChainConfig('sepolia'),
  },
};

export default config;
