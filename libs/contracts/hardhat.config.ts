import '@nomicfoundation/hardhat-toolbox';
import { HardhatUserConfig } from 'hardhat/config';
// import 'solidity-docgen';


const chainIds = {
  ganache: 1337,
};

const config: HardhatUserConfig = {
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
  paths: {
    sources: './src/contracts',
    tests: './tests',
    cache: './build/cache',
    artifacts: './build/artifacts',
  },

  typechain: {
    outDir: 'typechain-types',
    target: 'ethers-v6',
  },

  networks: {
    ganache: {
      chainId: chainIds.ganache,
      url: 'http://localhost:8545',
    },

  },

};

export default config;
