import { HardhatUserConfig } from 'hardhat/config';
import '@nomiclabs/hardhat-waffle';
import '@nomiclabs/hardhat-ethers';
import 'hardhat-typechain';
import 'hardhat-deploy';
import "@nomiclabs/hardhat-etherscan";
import "hardhat-gas-reporter";

// You have to export an object to set up your config
// This object can have the following optional entries:
// defaultNetwork, networks, solc, and paths.
// Go to https://buidler.dev/config/ to learn more
const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
    },
    rinkeby: {
      url: "https://rinkeby.infura.io/v3/e8a57f941efb4963859baf57ee3ac209",
    },
    mainnet: {
      url: "https://bsc-dataseed.binance.org/",
    },
    testnet: {
      url: "https://data-seed-prebsc-1-s1.binance.org:8545/",
    },
    arbitrum: {
      url: "https://arb1.arbitrum.io/rpc",
    }
  },
  solidity: {
    compilers: [
      {
        version: '0.8.9',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: '0.6.11',
        settings: {
          optimizer: {
            enabled: true,
            runs: 100,
          },
        },
      },
    ],
  },
  paths: {
    sources: "./contracts",
    tests: "./tests",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  mocha: {
    timeout: 400000
  },
};

export default config;
