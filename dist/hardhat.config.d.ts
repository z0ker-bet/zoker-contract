import { HardhatUserConfig } from 'hardhat/config';
import '@nomiclabs/hardhat-waffle';
import '@nomiclabs/hardhat-ethers';
import 'hardhat-typechain';
import 'hardhat-deploy';
import "@nomiclabs/hardhat-etherscan";
import "hardhat-gas-reporter";
declare const config: HardhatUserConfig;
export default config;
