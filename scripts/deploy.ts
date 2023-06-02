import * as fs from 'fs-extra';
import { JsonRpcProvider } from '@ethersproject/providers';
import { Wallet } from '@ethersproject/wallet';
import {
  BlackJackFactory,
  Decrypt1VerifierFactory,
  Decrypt3VerifierFactory,
  Decrypt4VerifierFactory,
  EncryptKeyFirstHalfFactory,
  EncryptKeySecondHalfFactory,
  ShuffleVerifierFactory
} from "../typechain";
import { BigNumber, BigNumberish } from 'ethers';
import { Cards, exp } from './types';
// import { BigNumber } from '@ethersproject/bignumber';
// import { ethers, utils } from 'ethers';

async function start() {
  const args = require('minimist')(process.argv.slice(2));

  if (!args.chainId) {
    throw new Error('--chainId chain ID is required');
  }
  const path = `${process.cwd()}/.env${args.chainId === 1 ? '.eth' :
    args.chainId === 4 ? '.rinkeby' :
      args.chainId === 56 ? '.bsc' :
        args.chainId === 42161 ? '.arb' :
          args.chainId === 97 ? '.bsctest' :
          args.chainId === 365 ? '.thetatest' : '.dev'
    }`;
  console.log(args.chainId)
  await require('dotenv').config({ path });
  const provider = new JsonRpcProvider(process.env.RPC_ENDPOINT);
  const wallet = new Wallet(`0x${process.env.KEY}`, provider);
  const sharedAddressPath = `${process.cwd()}/deployed-info/${args.chainId}.json`;
  // @ts-ignore
  const addressBook = JSON.parse(await fs.readFileSync(sharedAddressPath));
  addressBook.deployer = wallet.address;
  console.log("Deployer", addressBook.deployer)

  console.log('Deploying S1...');
  const s1 = await new EncryptKeyFirstHalfFactory(wallet).deploy()
  console.log('Deploy TX: ', s1.deployTransaction.hash);
  await s1.deployed();
  console.log('s1 deployed at ', s1.address);
  addressBook.s1 = s1.address;

  console.log('Deploying S2...');
  const s2 = await new EncryptKeySecondHalfFactory(wallet).deploy()
  console.log('Deploy TX: ', s2.deployTransaction.hash);
  await s2.deployed();
  console.log('s2 deployed at ', s2.address);
  addressBook.s2 = s2.address;

  console.log('Deploying Shuffle Verifier...');
  const verifier = await new ShuffleVerifierFactory({ ["__$468a0316f42500eed0d7296ab6ea1b7a22$__"]: s1.address, ["__$b4f655c0ef0f375346ca402b21ba4bf157$__"]: s2.address }, wallet).deploy();
  console.log('Deploy TX: ', verifier.deployTransaction.hash);
  await verifier.deployed();
  console.log('verifier deployed at ', verifier.address);
  addressBook.verifier = verifier.address;

  console.log('Deploying Decrypt1...');
  const decrypt1 = await new Decrypt1VerifierFactory(wallet).deploy()
  console.log('Deploy TX: ', decrypt1.deployTransaction.hash);
  await decrypt1.deployed();
  console.log('decrypt1 deployed at ', decrypt1.address);
  addressBook.decrypt1 = decrypt1.address;

  console.log('Deploying decrypt3...');
  const decrypt3 = await new Decrypt3VerifierFactory(wallet).deploy()
  console.log('Deploy TX: ', decrypt3.deployTransaction.hash);
  await decrypt3.deployed();
  console.log('decrypt3 deployed at ', decrypt3.address);
  addressBook.decrypt3 = decrypt3.address;

  console.log('Deploying decrypt4...');
  const decrypt4 = await new Decrypt4VerifierFactory(wallet).deploy()
  console.log('Deploy TX: ', decrypt4.deployTransaction.hash);
  await decrypt4.deployed();
  console.log('decrypt4 deployed at ', decrypt4.address);
  addressBook.decrypt4 = decrypt4.address;

  console.log('Deploying blackJack...');
  const blackJack = await new BlackJackFactory(wallet).deploy(
    addressBook.verifier,
    addressBook.decrypt1,
    addressBook.decrypt3,
    addressBook.decrypt4,
  )
  console.log('Deploy TX: ', blackJack.deployTransaction.hash);
  await blackJack.deployed();
  console.log('blackJack deployed at ', blackJack.address);
  addressBook.blackJack = blackJack.address;

  // let arr = new Array<number>(52);

  // let startingDeck: Cards = [...arr.keys()].map(i => `${i + 1}`); // 1 -> 52
  // await BlackJackFactory.connect(addressBook.blackJack, wallet).startNewGame(exp, { value: '20000000000000000' });

  await fs.writeFile(sharedAddressPath, JSON.stringify(addressBook, null, 2));
  console.log(`Contracts deployed and configured. ☼☽`);
}

start().catch((e: Error) => {
  console.error(e);
  process.exit(1);
});
