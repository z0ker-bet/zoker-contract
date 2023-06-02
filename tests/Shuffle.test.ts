import chai, { expect } from "chai";
import asPromised from "chai-as-promised";
import { zeroAddress } from "ethereumjs-util";
import { BigNumber } from "ethers";
// @ts-ignore
import {
  ShuffleVerifierFactory,
  EncryptKeyFirstHalfFactory,
  EncryptKeySecondHalfFactory,
  Decrypt1VerifierFactory,
  Decrypt3VerifierFactory,
  Decrypt4VerifierFactory,
  DeckManagementFactory,
  BlackJackFactory,
} from "../typechain";
import hre from 'hardhat'
import '@nomiclabs/hardhat-ethers'
// import input from './input.json';
const snarkjs = require('snarkjs');

import * as fs from 'fs-extra';
import { generateDecrypt1CardInput, generateDecrypt3CardInput, generateDecrypt4CardInput, generateInput, generateShuffleInput, shuffle } from "./utils";
const wtns_calculate = require('../circuits/tests/shuffle/build/test_js/witness_calculator');
const inputDataShuffleA = require('./shuffleA.json');
const inputDataShuffleB = require('./shuffleB.json');

chai.use(asPromised);

describe("Deck", () => {
  let deployer: any;
  let user1: any;
  let s1: any;
  let s2: any;
  let verifier: any;
  let decrypt1: any;
  let decrypt3: any;
  let decrypt4: any;
  let deck: any;
  let blackJack: any;

  beforeEach(async () => {
    [deployer, user1] = await hre.ethers.getSigners();
    // EncryptKeyFirstHalfFactory
    s1 = await (await new EncryptKeyFirstHalfFactory(deployer).deploy()).deployed();
    s2 = await (await new EncryptKeySecondHalfFactory(deployer).deploy()).deployed();
    verifier = await (await new ShuffleVerifierFactory({ ["__$468a0316f42500eed0d7296ab6ea1b7a22$__"]: s1.address, ["__$b4f655c0ef0f375346ca402b21ba4bf157$__"]: s2.address }, deployer).deploy()).deployed();
    decrypt1 = await (await new Decrypt1VerifierFactory(deployer).deploy()).deployed();
    decrypt3 = await (await new Decrypt3VerifierFactory(deployer).deploy()).deployed();
    decrypt4 = await (await new Decrypt4VerifierFactory(deployer).deploy()).deployed();

    deck = await (await new DeckManagementFactory(deployer).deploy(
      verifier.address,
      decrypt1.address,
      decrypt3.address,
      decrypt4.address,
    )).deployed();

    blackJack = await (await new BlackJackFactory(deployer).deploy(
      verifier.address,
      decrypt1.address,
      decrypt3.address,
      decrypt4.address,
    )).deployed();
  })

  it("blackjack test user[2A] stand, dealer[8-9] => state = 16", async () => {
    const startingDeck = [...Array(52).keys()].map(i => `${i + 1}`); // 1 -> 52
    startingDeck[0] = '2';
    startingDeck[1] = '1';
    startingDeck[4] = '8';
    startingDeck[5] = '9';
    startingDeck[7] = '5';
    startingDeck[8] = '6';

    startingDeck[2] = '21';
    startingDeck[3] = '22';
    startingDeck[20] = '3';
    startingDeck[21] = '4';


    await blackJack.connect(deployer).startNewGame(startingDeck, { value: '20000000000000000' });

    const { result: resultA, publicSignals: publicSignals_a } = await generateShuffleInput(startingDeck, startingDeck, startingDeck.map(i => `${i}`), inputDataShuffleA.R, inputDataShuffleA.pk);

    await blackJack.connect(deployer).shuffleDeck(
      resultA[0],
      resultA[1],
      resultA[2],
      resultA[3],
    );

    // User Shuffle
    let currentDeck = await blackJack.connect(user1).getDeck(1);

    const { result: resultB, publicSignals: publicSignals } = await generateShuffleInput(startingDeck, startingDeck, currentDeck.map(i => i.toString()), inputDataShuffleB.R, inputDataShuffleB.pk);

    await blackJack.connect(user1).joinBoardAndShuffleDeck(
      1,
      resultB[0],
      resultB[1],
      resultB[2],
      resultB[3],
      { value: '2000000000000000000' }
    );


    // User decrypt
    const decks = await blackJack.connect(user1).getDeck(1);

    // find the index to find C1 (C1 not save in blockchain)
    const index0 = publicSignals.indexOf(decks[0].toString());
    const index1 = publicSignals.indexOf(decks[1].toString());
    const index2 = publicSignals.indexOf(decks[2].toString());
    const index3 = publicSignals.indexOf(decks[3].toString());
    const index4 = publicSignals.indexOf(decks[4].toString());
    const index5 = publicSignals.indexOf(decks[5].toString());
    const index6 = publicSignals.indexOf(decks[6].toString());
    const index7 = publicSignals.indexOf(decks[7].toString());
    const index8 = publicSignals.indexOf(decks[8].toString());
    const index9 = publicSignals.indexOf(decks[9].toString());


    const inputDataDecrypt0_3 = {
      "Y": [
        `${publicSignals[index0 - 52]}`,
        `${publicSignals[index1 - 52]}`,
        `${publicSignals[index2 - 52]}`,
        `${publicSignals[index3 - 52]}`,
        `${decks[0]}`,
        `${decks[1]}`,
        `${decks[2]}`,
        `${decks[3]}`,
      ],
      "skP": "3",
      "pkP": "64"
    };

    const resultDecrypt0_3 = await generateDecrypt4CardInput(inputDataDecrypt0_3.Y, inputDataDecrypt0_3.skP, inputDataDecrypt0_3.pkP);

    await blackJack.connect(user1).deal4(
      1,
      resultDecrypt0_3[0],
      resultDecrypt0_3[1],
      resultDecrypt0_3[2],
      resultDecrypt0_3[3],
    );

    // Dealer decrypt
    const cardsAfterUserDecrypted1 = await blackJack.connect(user1).getUserDecrypteds(1);

    // find the index to find C1 (C1 not save in blockchain)
    const index0_a = publicSignals_a.indexOf(cardsAfterUserDecrypted1[0].toString());
    const index1_a = publicSignals_a.indexOf(cardsAfterUserDecrypted1[1].toString());
    const index2_a = publicSignals_a.indexOf(cardsAfterUserDecrypted1[2].toString());
    const index3_a = publicSignals_a.indexOf(cardsAfterUserDecrypted1[3].toString());

    const inputDataDecrypt_a = {
      "Y": [
        `${publicSignals_a[index0_a - 52]}`,
        `${publicSignals_a[index1_a - 52]}`,
        `${publicSignals_a[index2_a - 52]}`,
        `${cardsAfterUserDecrypted1[0]}`,
        `${cardsAfterUserDecrypted1[1]}`,
        `${cardsAfterUserDecrypted1[2]}`,
      ],
      "skP": "2",
      "pkP": "16"
    };

    const resultDecrypt0_2_a = await generateDecrypt3CardInput(inputDataDecrypt_a.Y, inputDataDecrypt_a.skP, inputDataDecrypt_a.pkP);

    await blackJack.connect(deployer).deal3(
      1,
      resultDecrypt0_2_a[0],
      resultDecrypt0_2_a[1],
      resultDecrypt0_2_a[2],
      resultDecrypt0_2_a[3],
    );

    const inputDataDecrypt4_7 = {
      "Y": [
        `${publicSignals[index4 - 52]}`,
        `${publicSignals[index5 - 52]}`,
        `${publicSignals[index6 - 52]}`,
        `${publicSignals[index7 - 52]}`,
        `${decks[4]}`,
        `${decks[5]}`,
        `${decks[6]}`,
        `${decks[7]}`,
      ],
      "skP": "3",
      "pkP": "64"
    };

    const resultDecrypt4_7 = await generateDecrypt4CardInput(inputDataDecrypt4_7.Y, inputDataDecrypt4_7.skP, inputDataDecrypt4_7.pkP);

    await blackJack.connect(user1).stand(
      1,
      resultDecrypt4_7[0],
      resultDecrypt4_7[1],
      resultDecrypt4_7[2],
      resultDecrypt4_7[3],
    );

    const cardsAfterStand = await blackJack.connect(user1).getUserDecrypteds(1);

    // admin
    const inputDealHidden = await generateDecrypt1CardInput(
      `${publicSignals_a[index3_a - 52]}`,
      `${cardsAfterStand[3]}`,
      "2",
      "16"
    )
    await blackJack.connect(deployer).dealHiddenCard(
      1,
      inputDealHidden[0],
      inputDealHidden[1],
      inputDealHidden[2],
      inputDealHidden[3],
    );

    const playerCards = await blackJack.connect(deployer).getPlayerCards(1);

    console.log("playerCards", playerCards);

    const dealerCards = await blackJack.connect(deployer).getDealerCards(1);

    console.log("dealerCards", dealerCards);

    const board = await blackJack.connect(deployer).getBoard(1);

    console.log("board", board);
  });

  it("blackjack test user[2A89] stand, dealer[8-9] => state = 14", async () => {
    const startingDeck = [...Array(52).keys()].map(i => `${i + 1}`); // 1 -> 52
    startingDeck[0] = '2';
    startingDeck[1] = '1';
    startingDeck[4] = '8';
    startingDeck[5] = '9';
    startingDeck[7] = '5';
    startingDeck[8] = '6';

    startingDeck[2] = '21';
    startingDeck[3] = '22';
    startingDeck[20] = '3';
    startingDeck[21] = '4';


    await blackJack.connect(deployer).startNewGame(startingDeck, { value: '20000000000000000' });

    const { result: resultA, publicSignals: publicSignals_a } = await generateShuffleInput(startingDeck, startingDeck, startingDeck.map(i => `${i}`), inputDataShuffleA.R, inputDataShuffleA.pk);

    await blackJack.connect(deployer).shuffleDeck(
      resultA[0],
      resultA[1],
      resultA[2],
      resultA[3],
    );

    // User Shuffle
    let currentDeck = await blackJack.connect(user1).getDeck(1);

    const { result: resultB, publicSignals: publicSignals } = await generateShuffleInput(startingDeck, startingDeck, currentDeck.map(i => i.toString()), inputDataShuffleB.R, inputDataShuffleB.pk);

    await blackJack.connect(user1).joinBoardAndShuffleDeck(
      1,
      resultB[0],
      resultB[1],
      resultB[2],
      resultB[3],
      { value: '2000000000000000000' }
    );


    // User decrypt
    const decks = await blackJack.connect(user1).getDeck(1);

    // find the index to find C1 (C1 not save in blockchain)
    const index0 = publicSignals.indexOf(decks[0].toString());
    const index1 = publicSignals.indexOf(decks[1].toString());
    const index2 = publicSignals.indexOf(decks[2].toString());
    const index3 = publicSignals.indexOf(decks[3].toString());
    const index4 = publicSignals.indexOf(decks[4].toString());
    const index5 = publicSignals.indexOf(decks[5].toString());
    const index6 = publicSignals.indexOf(decks[6].toString());
    const index7 = publicSignals.indexOf(decks[7].toString());
    const index8 = publicSignals.indexOf(decks[8].toString());
    const index9 = publicSignals.indexOf(decks[9].toString());


    const inputDataDecrypt0_3 = {
      "Y": [
        `${publicSignals[index0 - 52]}`,
        `${publicSignals[index1 - 52]}`,
        `${publicSignals[index2 - 52]}`,
        `${publicSignals[index3 - 52]}`,
        `${decks[0]}`,
        `${decks[1]}`,
        `${decks[2]}`,
        `${decks[3]}`,
      ],
      "skP": "3",
      "pkP": "64"
    };

    const resultDecrypt0_3 = await generateDecrypt4CardInput(inputDataDecrypt0_3.Y, inputDataDecrypt0_3.skP, inputDataDecrypt0_3.pkP);

    await blackJack.connect(user1).deal4(
      1,
      resultDecrypt0_3[0],
      resultDecrypt0_3[1],
      resultDecrypt0_3[2],
      resultDecrypt0_3[3],
    );

    // Dealer decrypt
    const cardsAfterUserDecrypted1 = await blackJack.connect(user1).getUserDecrypteds(1);

    // find the index to find C1 (C1 not save in blockchain)
    const index0_a = publicSignals_a.indexOf(cardsAfterUserDecrypted1[0].toString());
    const index1_a = publicSignals_a.indexOf(cardsAfterUserDecrypted1[1].toString());
    const index2_a = publicSignals_a.indexOf(cardsAfterUserDecrypted1[2].toString());
    const index3_a = publicSignals_a.indexOf(cardsAfterUserDecrypted1[3].toString());

    const inputDataDecrypt_a = {
      "Y": [
        `${publicSignals_a[index0_a - 52]}`,
        `${publicSignals_a[index1_a - 52]}`,
        `${publicSignals_a[index2_a - 52]}`,
        `${cardsAfterUserDecrypted1[0]}`,
        `${cardsAfterUserDecrypted1[1]}`,
        `${cardsAfterUserDecrypted1[2]}`,
      ],
      "skP": "2",
      "pkP": "16"
    };

    const resultDecrypt0_2_a = await generateDecrypt3CardInput(inputDataDecrypt_a.Y, inputDataDecrypt_a.skP, inputDataDecrypt_a.pkP);

    await blackJack.connect(deployer).deal3(
      1,
      resultDecrypt0_2_a[0],
      resultDecrypt0_2_a[1],
      resultDecrypt0_2_a[2],
      resultDecrypt0_2_a[3],
    );

    const inputHit4 = await generateDecrypt1CardInput(
      `${publicSignals[index4 - 52]}`,
      `${decks[4]}`,
      "3",
      "64"
    )

    await blackJack.connect(user1).userHit(
      1,
      inputHit4[0],
      inputHit4[1],
      inputHit4[2],
      inputHit4[3],
    );

    const cards2 = await blackJack.connect(user1).getUserDecrypteds(1);
    const index41 = publicSignals_a.indexOf(cards2[4].toString());


    const inputDealHit4 = await generateDecrypt1CardInput(
      `${publicSignals_a[index41 - 52]}`,
      `${cards2[4]}`,
      "2",
      "16"
    )

    await blackJack.connect(deployer).dealHit(
      1,
      4,
      inputDealHit4[0],
      inputDealHit4[1],
      inputDealHit4[2],
      inputDealHit4[3],
    );

    const inputHit5 = await generateDecrypt1CardInput(
      `${publicSignals[index5 - 52]}`,
      `${decks[5]}`,
      "3",
      "64"
    )

    await blackJack.connect(user1).userHit(
      1,
      inputHit5[0],
      inputHit5[1],
      inputHit5[2],
      inputHit5[3],
    );


    const cards3 = await blackJack.connect(user1).getUserDecrypteds(1);
    const index51 = publicSignals_a.indexOf(cards3[5].toString());
    const inputDealHit5 = await generateDecrypt1CardInput(
      `${publicSignals_a[index51 - 52]}`,
      `${cards3[5]}`,
      "2",
      "16"
    )

    await blackJack.connect(deployer).dealHit(
      1,
      5,
      inputDealHit5[0],
      inputDealHit5[1],
      inputDealHit5[2],
      inputDealHit5[3],
    );

    const inputDataDecrypt6_9 = {
      "Y": [
        `${publicSignals[index6 - 52]}`,
        `${publicSignals[index7 - 52]}`,
        `${publicSignals[index8 - 52]}`,
        `${publicSignals[index9 - 52]}`,
        `${decks[6]}`,
        `${decks[7]}`,
        `${decks[8]}`,
        `${decks[9]}`,
      ],
      "skP": "3",
      "pkP": "64"
    };

    const resultDecrypt6_9 = await generateDecrypt4CardInput(inputDataDecrypt6_9.Y, inputDataDecrypt6_9.skP, inputDataDecrypt6_9.pkP);

    await blackJack.connect(user1).stand(
      1,
      resultDecrypt6_9[0],
      resultDecrypt6_9[1],
      resultDecrypt6_9[2],
      resultDecrypt6_9[3],
    );

    const cardsAfterStand = await blackJack.connect(user1).getUserDecrypteds(1);

    const cardsAfter = await blackJack.connect(user1).getUserDecrypteds(1);

    // find the index to find C1 (C1 not save in blockchain)
    const index6_a = publicSignals_a.indexOf(cardsAfterStand[6].toString());

    // admin
    const inputDealHidden = await generateDecrypt1CardInput(
      `${publicSignals_a[index3_a - 52]}`,
      `${cardsAfterStand[3]}`,
      "2",
      "16"
    )
    await blackJack.connect(deployer).dealHiddenCard(
      1,
      inputDealHidden[0],
      inputDealHidden[1],
      inputDealHidden[2],
      inputDealHidden[3],
    );

    const inputDeal6 = await generateDecrypt1CardInput(
      `${publicSignals_a[index6_a - 52]}`,
      `${cardsAfterStand[6]}`,
      "2",
      "16"
    )

    await expect(blackJack.connect(deployer).hitForDealer(
      1,
      6,
      inputDeal6[0],
      inputDeal6[1],
      inputDeal6[2],
      inputDeal6[3],
    )).eventually.rejected;

    const playerCards = await blackJack.connect(deployer).getPlayerCards(1);

    console.log("playerCards", playerCards);

    const dealerCards = await blackJack.connect(deployer).getDealerCards(1);

    console.log("dealerCards", dealerCards);

    const board = await blackJack.connect(deployer).getBoard(1);

    console.log("board", board);
  });

  it("blackjack test user[1256] stand, dealer[8-9] => state = 16", async () => {
    const startingDeck = [...Array(52).keys()].map(i => `${i + 1}`); // 1 -> 52
    startingDeck[2] = '8';
    startingDeck[3] = '9';
    startingDeck[6] = '10';
    startingDeck[7] = '3';
    startingDeck[8] = '4';
    startingDeck[9] = '7';


    await blackJack.connect(deployer).startNewGame(startingDeck, { value: '20000000000000000' });

    const { result: resultA, publicSignals: publicSignals_a } = await generateShuffleInput(startingDeck, startingDeck, startingDeck.map(i => `${i}`), inputDataShuffleA.R, inputDataShuffleA.pk);

    await blackJack.connect(deployer).shuffleDeck(
      resultA[0],
      resultA[1],
      resultA[2],
      resultA[3],
    );

    // User Shuffle
    let currentDeck = await blackJack.connect(user1).getDeck(1);

    const { result: resultB, publicSignals: publicSignals } = await generateShuffleInput(startingDeck, startingDeck, currentDeck.map(i => i.toString()), inputDataShuffleB.R, inputDataShuffleB.pk);

    await blackJack.connect(user1).joinBoardAndShuffleDeck(
      1,
      resultB[0],
      resultB[1],
      resultB[2],
      resultB[3],
      { value: '2000000000000000000' }
    );


    // User decrypt
    const decks = await blackJack.connect(user1).getDeck(1);

    // find the index to find C1 (C1 not save in blockchain)
    const index0 = publicSignals.indexOf(decks[0].toString());
    const index1 = publicSignals.indexOf(decks[1].toString());
    const index2 = publicSignals.indexOf(decks[2].toString());
    const index3 = publicSignals.indexOf(decks[3].toString());
    const index4 = publicSignals.indexOf(decks[4].toString());
    const index5 = publicSignals.indexOf(decks[5].toString());
    const index6 = publicSignals.indexOf(decks[6].toString());
    const index7 = publicSignals.indexOf(decks[7].toString());
    const index8 = publicSignals.indexOf(decks[8].toString());
    const index9 = publicSignals.indexOf(decks[9].toString());


    const inputDataDecrypt0_3 = {
      "Y": [
        `${publicSignals[index0 - 52]}`,
        `${publicSignals[index1 - 52]}`,
        `${publicSignals[index2 - 52]}`,
        `${publicSignals[index3 - 52]}`,
        `${decks[0]}`,
        `${decks[1]}`,
        `${decks[2]}`,
        `${decks[3]}`,
      ],
      "skP": "3",
      "pkP": "64"
    };

    const resultDecrypt0_3 = await generateDecrypt4CardInput(inputDataDecrypt0_3.Y, inputDataDecrypt0_3.skP, inputDataDecrypt0_3.pkP);

    await blackJack.connect(user1).deal4(
      1,
      resultDecrypt0_3[0],
      resultDecrypt0_3[1],
      resultDecrypt0_3[2],
      resultDecrypt0_3[3],
    );

    // Dealer decrypt
    const cardsAfterUserDecrypted1 = await blackJack.connect(user1).getUserDecrypteds(1);

    // find the index to find C1 (C1 not save in blockchain)
    const index0_a = publicSignals_a.indexOf(cardsAfterUserDecrypted1[0].toString());
    const index1_a = publicSignals_a.indexOf(cardsAfterUserDecrypted1[1].toString());
    const index2_a = publicSignals_a.indexOf(cardsAfterUserDecrypted1[2].toString());
    const index3_a = publicSignals_a.indexOf(cardsAfterUserDecrypted1[3].toString());

    const inputDataDecrypt_a = {
      "Y": [
        `${publicSignals_a[index0_a - 52]}`,
        `${publicSignals_a[index1_a - 52]}`,
        `${publicSignals_a[index2_a - 52]}`,
        `${cardsAfterUserDecrypted1[0]}`,
        `${cardsAfterUserDecrypted1[1]}`,
        `${cardsAfterUserDecrypted1[2]}`,
      ],
      "skP": "2",
      "pkP": "16"
    };

    const resultDecrypt0_2_a = await generateDecrypt3CardInput(inputDataDecrypt_a.Y, inputDataDecrypt_a.skP, inputDataDecrypt_a.pkP);

    await blackJack.connect(deployer).deal3(
      1,
      resultDecrypt0_2_a[0],
      resultDecrypt0_2_a[1],
      resultDecrypt0_2_a[2],
      resultDecrypt0_2_a[3],
    );

    const cardsDealerDecrypted = await blackJack.connect(user1).getDealerDecrypteds(1);

    const inputHit4 = await generateDecrypt1CardInput(
      `${publicSignals[index4 - 52]}`,
      `${decks[4]}`,
      "3",
      "64"
    )

    await blackJack.connect(user1).userHit(
      1,
      inputHit4[0],
      inputHit4[1],
      inputHit4[2],
      inputHit4[3],
    );

    const cards2 = await blackJack.connect(user1).getUserDecrypteds(1);
    const index41 = publicSignals_a.indexOf(cards2[4].toString());


    const inputDealHit4 = await generateDecrypt1CardInput(
      `${publicSignals_a[index41 - 52]}`,
      `${cards2[4]}`,
      "2",
      "16"
    )

    await blackJack.connect(deployer).dealHit(
      1,
      4,
      inputDealHit4[0],
      inputDealHit4[1],
      inputDealHit4[2],
      inputDealHit4[3],
    );

    const inputHit5 = await generateDecrypt1CardInput(
      `${publicSignals[index5 - 52]}`,
      `${decks[5]}`,
      "3",
      "64"
    )

    await blackJack.connect(user1).userHit(
      1,
      inputHit5[0],
      inputHit5[1],
      inputHit5[2],
      inputHit5[3],
    );


    const cards3 = await blackJack.connect(user1).getUserDecrypteds(1);
    const index51 = publicSignals_a.indexOf(cards3[5].toString());
    const inputDealHit5 = await generateDecrypt1CardInput(
      `${publicSignals_a[index51 - 52]}`,
      `${cards3[5]}`,
      "2",
      "16"
    )

    await blackJack.connect(deployer).dealHit(
      1,
      5,
      inputDealHit5[0],
      inputDealHit5[1],
      inputDealHit5[2],
      inputDealHit5[3],
    );

    const inputDataDecrypt6_9 = {
      "Y": [
        `${publicSignals[index6 - 52]}`,
        `${publicSignals[index7 - 52]}`,
        `${publicSignals[index8 - 52]}`,
        `${publicSignals[index9 - 52]}`,
        `${decks[6]}`,
        `${decks[7]}`,
        `${decks[8]}`,
        `${decks[9]}`,
      ],
      "skP": "3",
      "pkP": "64"
    };

    const resultDecrypt6_9 = await generateDecrypt4CardInput(inputDataDecrypt6_9.Y, inputDataDecrypt6_9.skP, inputDataDecrypt6_9.pkP);

    await blackJack.connect(user1).stand(
      1,
      resultDecrypt6_9[0],
      resultDecrypt6_9[1],
      resultDecrypt6_9[2],
      resultDecrypt6_9[3],
    );

    const cardsAfterStand = await blackJack.connect(user1).getUserDecrypteds(1);

    const cardsAfter = await blackJack.connect(user1).getUserDecrypteds(1);

    // find the index to find C1 (C1 not save in blockchain)
    const index9_a = publicSignals_a.indexOf(cardsAfterStand[5].toString());
    const index6_a = publicSignals_a.indexOf(cardsAfterStand[6].toString());
    const index7_a = publicSignals_a.indexOf(cardsAfterStand[7].toString());
    const index8_a = publicSignals_a.indexOf(cardsAfterStand[8].toString());

    // admin
    const inputDealHidden = await generateDecrypt1CardInput(
      `${publicSignals_a[index3_a - 52]}`,
      `${cardsAfterStand[3]}`,
      "2",
      "16"
    )
    await blackJack.connect(deployer).dealHiddenCard(
      1,
      inputDealHidden[0],
      inputDealHidden[1],
      inputDealHidden[2],
      inputDealHidden[3],
    );

    const playerCards = await blackJack.connect(deployer).getPlayerCards(1);

    console.log("playerCards", playerCards);

    const dealerCards = await blackJack.connect(deployer).getDealerCards(1);

    console.log("dealerCards", dealerCards);

    const board = await blackJack.connect(deployer).getBoard(1);

    console.log("board", board);
  });

  it("blackjack test user[1256] stand, dealer[8-4-10] => state = 17", async () => {
    const startingDeck = [...Array(52).keys()].map(i => `${i + 1}`); // 1 -> 52
    startingDeck[2] = '8';
    startingDeck[3] = '17';
    startingDeck[6] = '10';
    startingDeck[7] = '3';
    startingDeck[16] = '4';
    startingDeck[9] = '7';


    await blackJack.connect(deployer).startNewGame(startingDeck, { value: '20000000000000000' });

    const { result: resultA, publicSignals: publicSignals_a } = await generateShuffleInput(startingDeck, startingDeck, startingDeck.map(i => `${i}`), inputDataShuffleA.R, inputDataShuffleA.pk);

    await blackJack.connect(deployer).shuffleDeck(
      resultA[0],
      resultA[1],
      resultA[2],
      resultA[3],
    );

    // User Shuffle
    let currentDeck = await blackJack.connect(user1).getDeck(1);

    const { result: resultB, publicSignals: publicSignals } = await generateShuffleInput(startingDeck, startingDeck, currentDeck.map(i => i.toString()), inputDataShuffleB.R, inputDataShuffleB.pk);

    await blackJack.connect(user1).joinBoardAndShuffleDeck(
      1,
      resultB[0],
      resultB[1],
      resultB[2],
      resultB[3],
      { value: '2000000000000000000' }
    );


    // User decrypt
    const decks = await blackJack.connect(user1).getDeck(1);

    // find the index to find C1 (C1 not save in blockchain)
    const index0 = publicSignals.indexOf(decks[0].toString());
    const index1 = publicSignals.indexOf(decks[1].toString());
    const index2 = publicSignals.indexOf(decks[2].toString());
    const index3 = publicSignals.indexOf(decks[3].toString());
    const index4 = publicSignals.indexOf(decks[4].toString());
    const index5 = publicSignals.indexOf(decks[5].toString());
    const index6 = publicSignals.indexOf(decks[6].toString());
    const index7 = publicSignals.indexOf(decks[7].toString());
    const index8 = publicSignals.indexOf(decks[8].toString());
    const index9 = publicSignals.indexOf(decks[9].toString());


    const inputDataDecrypt0_3 = {
      "Y": [
        `${publicSignals[index0 - 52]}`,
        `${publicSignals[index1 - 52]}`,
        `${publicSignals[index2 - 52]}`,
        `${publicSignals[index3 - 52]}`,
        `${decks[0]}`,
        `${decks[1]}`,
        `${decks[2]}`,
        `${decks[3]}`,
      ],
      "skP": "3",
      "pkP": "64"
    };

    const resultDecrypt0_3 = await generateDecrypt4CardInput(inputDataDecrypt0_3.Y, inputDataDecrypt0_3.skP, inputDataDecrypt0_3.pkP);

    await blackJack.connect(user1).deal4(
      1,
      resultDecrypt0_3[0],
      resultDecrypt0_3[1],
      resultDecrypt0_3[2],
      resultDecrypt0_3[3],
    );

    // Dealer decrypt
    const cardsAfterUserDecrypted1 = await blackJack.connect(user1).getUserDecrypteds(1);

    // find the index to find C1 (C1 not save in blockchain)
    const index0_a = publicSignals_a.indexOf(cardsAfterUserDecrypted1[0].toString());
    const index1_a = publicSignals_a.indexOf(cardsAfterUserDecrypted1[1].toString());
    const index2_a = publicSignals_a.indexOf(cardsAfterUserDecrypted1[2].toString());
    const index3_a = publicSignals_a.indexOf(cardsAfterUserDecrypted1[3].toString());

    const inputDataDecrypt_a = {
      "Y": [
        `${publicSignals_a[index0_a - 52]}`,
        `${publicSignals_a[index1_a - 52]}`,
        `${publicSignals_a[index2_a - 52]}`,
        `${cardsAfterUserDecrypted1[0]}`,
        `${cardsAfterUserDecrypted1[1]}`,
        `${cardsAfterUserDecrypted1[2]}`,
      ],
      "skP": "2",
      "pkP": "16"
    };

    const resultDecrypt0_2_a = await generateDecrypt3CardInput(inputDataDecrypt_a.Y, inputDataDecrypt_a.skP, inputDataDecrypt_a.pkP);

    await blackJack.connect(deployer).deal3(
      1,
      resultDecrypt0_2_a[0],
      resultDecrypt0_2_a[1],
      resultDecrypt0_2_a[2],
      resultDecrypt0_2_a[3],
    );

    const inputHit4 = await generateDecrypt1CardInput(
      `${publicSignals[index4 - 52]}`,
      `${decks[4]}`,
      "3",
      "64"
    )

    await blackJack.connect(user1).userHit(
      1,
      inputHit4[0],
      inputHit4[1],
      inputHit4[2],
      inputHit4[3],
    );

    const cards2 = await blackJack.connect(user1).getUserDecrypteds(1);
    const index41 = publicSignals_a.indexOf(cards2[4].toString());


    const inputDealHit4 = await generateDecrypt1CardInput(
      `${publicSignals_a[index41 - 52]}`,
      `${cards2[4]}`,
      "2",
      "16"
    )

    await blackJack.connect(deployer).dealHit(
      1,
      4,
      inputDealHit4[0],
      inputDealHit4[1],
      inputDealHit4[2],
      inputDealHit4[3],
    );

    const inputHit5 = await generateDecrypt1CardInput(
      `${publicSignals[index5 - 52]}`,
      `${decks[5]}`,
      "3",
      "64"
    )

    await blackJack.connect(user1).userHit(
      1,
      inputHit5[0],
      inputHit5[1],
      inputHit5[2],
      inputHit5[3],
    );


    const cards3 = await blackJack.connect(user1).getUserDecrypteds(1);
    const index51 = publicSignals_a.indexOf(cards3[5].toString());
    const inputDealHit5 = await generateDecrypt1CardInput(
      `${publicSignals_a[index51 - 52]}`,
      `${cards3[5]}`,
      "2",
      "16"
    )

    await blackJack.connect(deployer).dealHit(
      1,
      5,
      inputDealHit5[0],
      inputDealHit5[1],
      inputDealHit5[2],
      inputDealHit5[3],
    );

    const inputDataDecrypt6_9 = {
      "Y": [
        `${publicSignals[index6 - 52]}`,
        `${publicSignals[index7 - 52]}`,
        `${publicSignals[index8 - 52]}`,
        `${publicSignals[index9 - 52]}`,
        `${decks[6]}`,
        `${decks[7]}`,
        `${decks[8]}`,
        `${decks[9]}`,
      ],
      "skP": "3",
      "pkP": "64"
    };

    const resultDecrypt6_9 = await generateDecrypt4CardInput(inputDataDecrypt6_9.Y, inputDataDecrypt6_9.skP, inputDataDecrypt6_9.pkP);

    await blackJack.connect(user1).stand(
      1,
      resultDecrypt6_9[0],
      resultDecrypt6_9[1],
      resultDecrypt6_9[2],
      resultDecrypt6_9[3],
    );

    const cardsAfterStand = await blackJack.connect(user1).getUserDecrypteds(1);
    // find the index to find C1 (C1 not save in blockchain)
    const index6_a = publicSignals_a.indexOf(cardsAfterStand[6].toString());

    // admin
    const inputDealHidden = await generateDecrypt1CardInput(
      `${publicSignals_a[index3_a - 52]}`,
      `${cardsAfterStand[3]}`,
      "2",
      "16"
    )
    await blackJack.connect(deployer).dealHiddenCard(
      1,
      inputDealHidden[0],
      inputDealHidden[1],
      inputDealHidden[2],
      inputDealHidden[3],
    );

    const inputDeal6 = await generateDecrypt1CardInput(
      `${publicSignals_a[index6_a - 52]}`,
      `${cardsAfterStand[6]}`,
      "2",
      "16"
    )

    await blackJack.connect(deployer).hitForDealer(
      1,
      6,
      inputDeal6[0],
      inputDeal6[1],
      inputDeal6[2],
      inputDeal6[3],
    );

    const playerCards = await blackJack.connect(deployer).getPlayerCards(1);

    console.log("playerCards", playerCards);

    const dealerCards = await blackJack.connect(deployer).getDealerCards(1);

    console.log("dealerCards", dealerCards);

    const board = await blackJack.connect(deployer).getBoard(1);

    console.log("board", board);
  });

  it("blackjack test user[A10], dealer[34] => state = 11", async () => {
    const startingDeck = [...Array(52).keys()].map(i => `${i + 1}`); // 1 -> 52
    startingDeck[1] = '10';
    startingDeck[9] = '2';

    await blackJack.connect(deployer).startNewGame(startingDeck, { value: '20000000000000000' });

    const { result: resultA, publicSignals: publicSignals_a } = await generateShuffleInput(startingDeck, startingDeck, startingDeck.map(i => `${i}`), inputDataShuffleA.R, inputDataShuffleA.pk);

    await blackJack.connect(deployer).shuffleDeck(
      resultA[0],
      resultA[1],
      resultA[2],
      resultA[3],
    );

    // User Shuffle
    let currentDeck = await blackJack.connect(user1).getDeck(1);

    const { result: resultB, publicSignals: publicSignals } = await generateShuffleInput(startingDeck, startingDeck, currentDeck.map(i => i.toString()), inputDataShuffleB.R, inputDataShuffleB.pk);


    await blackJack.connect(user1).joinBoardAndShuffleDeck(
      1,
      resultB[0],
      resultB[1],
      resultB[2],
      resultB[3],
      { value: '2000000000000000000' }
    );


    // User decrypt
    const decks = await blackJack.connect(user1).getDeck(1);

    // find the index to find C1 (C1 not save in blockchain)
    const index0 = publicSignals.indexOf(decks[0].toString());
    const index1 = publicSignals.indexOf(decks[1].toString());
    const index2 = publicSignals.indexOf(decks[2].toString());
    const index3 = publicSignals.indexOf(decks[3].toString());

    const inputDataDecrypt0_3 = {
      "Y": [
        `${publicSignals[index0 - 52]}`,
        `${publicSignals[index1 - 52]}`,
        `${publicSignals[index2 - 52]}`,
        `${publicSignals[index3 - 52]}`,
        `${decks[0]}`,
        `${decks[1]}`,
        `${decks[2]}`,
        `${decks[3]}`,
      ],
      "skP": "3",
      "pkP": "64"
    };

    const resultDecrypt0_3 = await generateDecrypt4CardInput(inputDataDecrypt0_3.Y, inputDataDecrypt0_3.skP, inputDataDecrypt0_3.pkP);

    await blackJack.connect(user1).deal4(
      1,
      resultDecrypt0_3[0],
      resultDecrypt0_3[1],
      resultDecrypt0_3[2],
      resultDecrypt0_3[3],
    );

    // Dealer decrypt
    const cardsAfterUserDecrypted1 = await blackJack.connect(user1).getUserDecrypteds(1);

    // find the index to find C1 (C1 not save in blockchain)
    const index0_a = publicSignals_a.indexOf(cardsAfterUserDecrypted1[0].toString());
    const index1_a = publicSignals_a.indexOf(cardsAfterUserDecrypted1[1].toString());
    const index2_a = publicSignals_a.indexOf(cardsAfterUserDecrypted1[2].toString());
    const index3_a = publicSignals_a.indexOf(cardsAfterUserDecrypted1[3].toString());

    const inputDataDecrypt_a = {
      "Y": [
        `${publicSignals_a[index0_a - 52]}`,
        `${publicSignals_a[index1_a - 52]}`,
        `${publicSignals_a[index2_a - 52]}`,
        `${cardsAfterUserDecrypted1[0]}`,
        `${cardsAfterUserDecrypted1[1]}`,
        `${cardsAfterUserDecrypted1[2]}`,
      ],
      "skP": "2",
      "pkP": "16"
    };

    const resultDecrypt0_2_a = await generateDecrypt3CardInput(inputDataDecrypt_a.Y, inputDataDecrypt_a.skP, inputDataDecrypt_a.pkP);

    await blackJack.connect(deployer).deal3(
      1,
      resultDecrypt0_2_a[0],
      resultDecrypt0_2_a[1],
      resultDecrypt0_2_a[2],
      resultDecrypt0_2_a[3],
    );

    const playerCards = await blackJack.connect(deployer).getPlayerCards(1);

    console.log("playerCards", playerCards);

    const dealerCards = await blackJack.connect(deployer).getDealerCards(1);

    console.log("dealerCards", dealerCards);

    const board = await blackJack.connect(deployer).getBoard(1);

    console.log("board", board);
  });

  it("blackjack test user[88] double 9 => bust, dealer[8]", async () => {
    const startingDeck = [...Array(52).keys()].map(i => `${i + 1}`); // 1 -> 52
    startingDeck[0] = '34';
    startingDeck[33] = '1';

    startingDeck[1] = '8';
    startingDeck[7] = '2';
    startingDeck[4] = '9';
    startingDeck[8] = '5';

    startingDeck[2] = '21';
    startingDeck[3] = '22';
    startingDeck[20] = '3';
    startingDeck[21] = '4';

    await blackJack.connect(deployer).startNewGame(startingDeck, { value: '20000000000000000' });

    const { result: resultA, publicSignals: publicSignals_a } = await generateShuffleInput(startingDeck, startingDeck, startingDeck.map(i => `${i}`), inputDataShuffleA.R, inputDataShuffleA.pk);

    await blackJack.connect(deployer).shuffleDeck(
      resultA[0],
      resultA[1],
      resultA[2],
      resultA[3],
    );

    // User Shuffle
    let currentDeck = await blackJack.connect(user1).getDeck(1);

    const { result: resultB, publicSignals: publicSignals } = await generateShuffleInput(startingDeck, startingDeck, currentDeck.map(i => i.toString()), inputDataShuffleB.R, inputDataShuffleB.pk);


    await blackJack.connect(user1).joinBoardAndShuffleDeck(
      1,
      resultB[0],
      resultB[1],
      resultB[2],
      resultB[3],
      { value: '2000000000000000000' }
    );


    // User decrypt
    const decks = await blackJack.connect(user1).getDeck(1);

    // find the index to find C1 (C1 not save in blockchain)
    const index0 = publicSignals.indexOf(decks[0].toString());
    const index1 = publicSignals.indexOf(decks[1].toString());
    const index2 = publicSignals.indexOf(decks[2].toString());
    const index3 = publicSignals.indexOf(decks[3].toString());
    const index4 = publicSignals.indexOf(decks[4].toString());
    const index5 = publicSignals.indexOf(decks[5].toString());
    const index6 = publicSignals.indexOf(decks[6].toString());
    const index7 = publicSignals.indexOf(decks[7].toString());
    const index8 = publicSignals.indexOf(decks[8].toString());
    const index9 = publicSignals.indexOf(decks[9].toString());

    const inputDataDecrypt0_3 = {
      "Y": [
        `${publicSignals[index0 - 52]}`,
        `${publicSignals[index1 - 52]}`,
        `${publicSignals[index2 - 52]}`,
        `${publicSignals[index3 - 52]}`,
        `${decks[0]}`,
        `${decks[1]}`,
        `${decks[2]}`,
        `${decks[3]}`,
      ],
      "skP": "3",
      "pkP": "64"
    };

    const resultDecrypt0_3 = await generateDecrypt4CardInput(inputDataDecrypt0_3.Y, inputDataDecrypt0_3.skP, inputDataDecrypt0_3.pkP);

    await blackJack.connect(user1).deal4(
      1,
      resultDecrypt0_3[0],
      resultDecrypt0_3[1],
      resultDecrypt0_3[2],
      resultDecrypt0_3[3],
    );

    // Dealer decrypt
    const cardsAfterUserDecrypted1 = await blackJack.connect(user1).getUserDecrypteds(1);

    // find the index to find C1 (C1 not save in blockchain)
    const index0_a = publicSignals_a.indexOf(cardsAfterUserDecrypted1[0].toString());
    const index1_a = publicSignals_a.indexOf(cardsAfterUserDecrypted1[1].toString());
    const index2_a = publicSignals_a.indexOf(cardsAfterUserDecrypted1[2].toString());
    const index3_a = publicSignals_a.indexOf(cardsAfterUserDecrypted1[3].toString());

    const inputDataDecrypt_a = {
      "Y": [
        `${publicSignals_a[index0_a - 52]}`,
        `${publicSignals_a[index1_a - 52]}`,
        `${publicSignals_a[index2_a - 52]}`,
        `${cardsAfterUserDecrypted1[0]}`,
        `${cardsAfterUserDecrypted1[1]}`,
        `${cardsAfterUserDecrypted1[2]}`,
      ],
      "skP": "2",
      "pkP": "16"
    };

    const resultDecrypt0_2_a = await generateDecrypt3CardInput(inputDataDecrypt_a.Y, inputDataDecrypt_a.skP, inputDataDecrypt_a.pkP);

    await blackJack.connect(deployer).deal3(
      1,
      resultDecrypt0_2_a[0],
      resultDecrypt0_2_a[1],
      resultDecrypt0_2_a[2],
      resultDecrypt0_2_a[3],
    );

    const inputDataDecrypt4_7 = {
      "Y": [
        `${publicSignals[index4 - 52]}`,
        `${publicSignals[index5 - 52]}`,
        `${publicSignals[index6 - 52]}`,
        `${publicSignals[index7 - 52]}`,
        `${decks[4]}`,
        `${decks[5]}`,
        `${decks[6]}`,
        `${decks[7]}`,
      ],
      "skP": "3",
      "pkP": "64"
    };

    const resultDecrypt4_7 = await generateDecrypt4CardInput(inputDataDecrypt4_7.Y, inputDataDecrypt4_7.skP, inputDataDecrypt4_7.pkP);

    await blackJack.connect(user1).userDoubleDown(
      1,
      resultDecrypt4_7[0],
      resultDecrypt4_7[1],
      resultDecrypt4_7[2],
      resultDecrypt4_7[3],
    );

    const getUserDecrypteds = await blackJack.connect(user1).getUserDecrypteds(1);
    const index41 = publicSignals_a.indexOf(getUserDecrypteds[4].toString());
    const inputDealHit4 = await generateDecrypt1CardInput(
      `${publicSignals_a[index41 - 52]}`,
      `${getUserDecrypteds[4]}`,
      "2",
      "16"
    )
    await blackJack.connect(deployer).dealDouble(
      1,
      4,
      inputDealHit4[0],
      inputDealHit4[1],
      inputDealHit4[2],
      inputDealHit4[3],
    );

    const playerCards = await blackJack.connect(deployer).getPlayerCards(1);

    console.log("playerCards", playerCards);

    const dealerCards = await blackJack.connect(deployer).getDealerCards(1);

    console.log("dealerCards", dealerCards);

    const board = await blackJack.connect(deployer).getBoard(1);

    console.log("board", board);
  });

  // it("blackjack test", async () => {
  //   const startingDeck = [...Array(52).keys()].map(i => `${i + 1}`); // 1 -> 52
  //   console.log(startingDeck[1]);
  //   console.log(startingDeck[13]);
  //   startingDeck[1] = '14';
  //   startingDeck[13] = '2';
  //   const destinationA = [...Array(52).keys()].map(i => `${i + 1}`); // 1 -> 52
  //   const destinationB = [...Array(52).keys()].map(i => `${i + 1}`); // 1 -> 52
  //   shuffle(destinationA);
  //   shuffle(destinationB);

  //   await blackJack.connect(deployer).startNewGame(startingDeck, { value: '20000000000000000' });

  //   const { result: resultA, publicSignals: publicSignals_a } = await generateShuffleInput(startingDeck, startingDeck, startingDeck.map(i => `${i}`), inputDataShuffleA.R, inputDataShuffleA.pk);

  //   console.log("publicSignals_a", publicSignals_a);

  //   await blackJack.connect(deployer).shuffleDeck(
  //     resultA[0],
  //     resultA[1],
  //     resultA[2],
  //     resultA[3],
  //   );

  //   // User Shuffle
  //   let currentDeck = await blackJack.connect(user1).getDeck(1);
  //   console.log("deck after dealer shuffle", currentDeck);

  //   const { result: resultB, publicSignals: publicSignals } = await generateShuffleInput(startingDeck, startingDeck, currentDeck.map(i => i.toString()), inputDataShuffleB.R, inputDataShuffleB.pk);


  //   await blackJack.connect(user1).joinBoardAndShuffleDeck(
  //     1,
  //     resultB[0],
  //     resultB[1],
  //     resultB[2],
  //     resultB[3],
  //     { value: '2000000000000000000' }
  //   );


  //   // User decrypt
  //   const decks = await blackJack.connect(user1).getDeck(1);
  //   console.log("deck after user shuffle", decks);

  //   // find the index to find C1 (C1 not save in blockchain)
  //   const index0 = publicSignals.indexOf(decks[0].toString());
  //   const index1 = publicSignals.indexOf(decks[1].toString());
  //   const index2 = publicSignals.indexOf(decks[2].toString());
  //   const index3 = publicSignals.indexOf(decks[3].toString());
  //   const index4 = publicSignals.indexOf(decks[4].toString());
  //   const index5 = publicSignals.indexOf(decks[5].toString());
  //   const index6 = publicSignals.indexOf(decks[6].toString());
  //   const index7 = publicSignals.indexOf(decks[7].toString());
  //   const index8 = publicSignals.indexOf(decks[8].toString());
  //   const index9 = publicSignals.indexOf(decks[9].toString());


  //   const inputDataDecrypt0_3 = {
  //     "Y": [
  //       `${publicSignals[index0 - 52]}`,
  //       `${publicSignals[index1 - 52]}`,
  //       `${publicSignals[index2 - 52]}`,
  //       `${publicSignals[index3 - 52]}`,
  //       `${decks[0]}`,
  //       `${decks[1]}`,
  //       `${decks[2]}`,
  //       `${decks[3]}`,
  //     ],
  //     "skP": "3",
  //     "pkP": "64"
  //   };

  //   const resultDecrypt0_3 = await generateDecrypt4CardInput(inputDataDecrypt0_3.Y, inputDataDecrypt0_3.skP, inputDataDecrypt0_3.pkP);

  //   await blackJack.connect(user1).deal4(
  //     1,
  //     resultDecrypt0_3[0],
  //     resultDecrypt0_3[1],
  //     resultDecrypt0_3[2],
  //     resultDecrypt0_3[3],
  //   );

  //   // Dealer decrypt
  //   const cardsAfterUserDecrypted1 = await blackJack.connect(user1).getUserDecrypteds(1);
  //   console.log("deck after user decrypt", cardsAfterUserDecrypted1);

  //   // find the index to find C1 (C1 not save in blockchain)
  //   const index0_a = publicSignals_a.indexOf(cardsAfterUserDecrypted1[0].toString());
  //   const index1_a = publicSignals_a.indexOf(cardsAfterUserDecrypted1[1].toString());
  //   const index2_a = publicSignals_a.indexOf(cardsAfterUserDecrypted1[2].toString());
  //   const index3_a = publicSignals_a.indexOf(cardsAfterUserDecrypted1[3].toString());

  //   const inputDataDecrypt_a = {
  //     "Y": [
  //       `${publicSignals_a[index0_a - 52]}`,
  //       `${publicSignals_a[index1_a - 52]}`,
  //       `${publicSignals_a[index2_a - 52]}`,
  //       `${cardsAfterUserDecrypted1[0]}`,
  //       `${cardsAfterUserDecrypted1[1]}`,
  //       `${cardsAfterUserDecrypted1[2]}`,
  //     ],
  //     "skP": "2",
  //     "pkP": "16"
  //   };

  //   const resultDecrypt0_2_a = await generateDecrypt3CardInput(inputDataDecrypt_a.Y, inputDataDecrypt_a.skP, inputDataDecrypt_a.pkP);

  //   await blackJack.connect(deployer).deal3(
  //     1,
  //     resultDecrypt0_2_a[0],
  //     resultDecrypt0_2_a[1],
  //     resultDecrypt0_2_a[2],
  //     resultDecrypt0_2_a[3],
  //   );

  //   const cardsDealerDecrypted = await blackJack.connect(user1).getDealerDecrypteds(1);
  //   console.log("deck after dealer decrypt", cardsDealerDecrypted);

  //   const inputHit4 = await generateDecrypt1CardInput(
  //     `${publicSignals[index4 - 52]}`,
  //     `${decks[4]}`,
  //     "3",
  //     "64"
  //   )

  //   await blackJack.connect(user1).userHit(
  //     1,
  //     inputHit4[0],
  //     inputHit4[1],
  //     inputHit4[2],
  //     inputHit4[3],
  //   );

  //   const cards2 = await blackJack.connect(user1).getUserDecrypteds(1);
  //   console.log("getUserDecrypteds", cards2);
  //   const index41 = publicSignals_a.indexOf(cards2[4].toString());


  //   const inputDealHit4 = await generateDecrypt1CardInput(
  //     `${publicSignals_a[index41 - 52]}`,
  //     `${cards2[4]}`,
  //     "2",
  //     "16"
  //   )

  //   await blackJack.connect(deployer).dealHit(
  //     1,
  //     4,
  //     inputDealHit4[0],
  //     inputDealHit4[1],
  //     inputDealHit4[2],
  //     inputDealHit4[3],
  //   );
  //   const xxx = await blackJack.connect(user1).getDealerDecrypteds(1);
  //   console.log("getDealerDecrypteds", xxx);

  //   const inputHit5 = await generateDecrypt1CardInput(
  //     `${publicSignals[index5 - 52]}`,
  //     `${decks[5]}`,
  //     "3",
  //     "64"
  //   )

  //   await blackJack.connect(user1).userHit(
  //     1,
  //     inputHit5[0],
  //     inputHit5[1],
  //     inputHit5[2],
  //     inputHit5[3],
  //   );


  //   const cards3 = await blackJack.connect(user1).getUserDecrypteds(1);
  //   const index51 = publicSignals_a.indexOf(cards3[5].toString());
  //   const inputDealHit5 = await generateDecrypt1CardInput(
  //     `${publicSignals_a[index51 - 52]}`,
  //     `${cards3[5]}`,
  //     "2",
  //     "16"
  //   )

  //   await blackJack.connect(deployer).dealHit(
  //     1,
  //     5,
  //     inputDealHit5[0],
  //     inputDealHit5[1],
  //     inputDealHit5[2],
  //     inputDealHit5[3],
  //   );

  //   const inputDataDecrypt6_9 = {
  //     "Y": [
  //       `${publicSignals[index6 - 52]}`,
  //       `${publicSignals[index7 - 52]}`,
  //       `${publicSignals[index8 - 52]}`,
  //       `${publicSignals[index9 - 52]}`,
  //       `${decks[6]}`,
  //       `${decks[7]}`,
  //       `${decks[8]}`,
  //       `${decks[9]}`,
  //     ],
  //     "skP": "3",
  //     "pkP": "64"
  //   };

  //   const resultDecrypt6_9 = await generateDecrypt4CardInput(inputDataDecrypt6_9.Y, inputDataDecrypt6_9.skP, inputDataDecrypt6_9.pkP);

  //   await blackJack.connect(user1).stand(
  //     1,
  //     resultDecrypt6_9[0],
  //     resultDecrypt6_9[1],
  //     resultDecrypt6_9[2],
  //     resultDecrypt6_9[3],
  //   );

  //   const cardsAfterStand = await blackJack.connect(user1).getUserDecrypteds(1);
  //   console.log("deck after user stand", cardsAfterStand);

  //   const cardsAfter = await blackJack.connect(user1).getUserDecrypteds(1);
  //   console.log("deck after user decrypt", cardsAfter);

  //   // find the index to find C1 (C1 not save in blockchain)
  //   const index9_a = publicSignals_a.indexOf(cardsAfterStand[5].toString());
  //   const index6_a = publicSignals_a.indexOf(cardsAfterStand[6].toString());
  //   const index7_a = publicSignals_a.indexOf(cardsAfterStand[7].toString());
  //   const index8_a = publicSignals_a.indexOf(cardsAfterStand[8].toString());

  //   // admin
  //   const inputDealHidden = await generateDecrypt1CardInput(
  //     `${publicSignals_a[index3_a - 52]}`,
  //     `${cardsAfterStand[3]}`,
  //     "2",
  //     "16"
  //   )
  //   await blackJack.connect(deployer).dealHiddenCard(
  //     1,
  //     inputDealHidden[0],
  //     inputDealHidden[1],
  //     inputDealHidden[2],
  //     inputDealHidden[3],
  //   );


  //   const inputDeal6 = await generateDecrypt1CardInput(
  //     `${publicSignals_a[index6_a - 52]}`,
  //     `${cardsAfterStand[6]}`,
  //     "2",
  //     "16"
  //   )


  //   const inputDeal7 = await generateDecrypt1CardInput(
  //     `${publicSignals_a[index7_a - 52]}`,
  //     `${cardsAfterStand[7]}`,
  //     "2",
  //     "16"
  //   )

  //   await blackJack.connect(deployer).hitForDealer(
  //     1,
  //     6,
  //     inputDeal6[0],
  //     inputDeal6[1],
  //     inputDeal6[2],
  //     inputDeal6[3],
  //   );

  //   await blackJack.connect(deployer).hitForDealer(
  //     1,
  //     7,
  //     inputDeal7[0],
  //     inputDeal7[1],
  //     inputDeal7[2],
  //     inputDeal7[3],
  //   );

  //   const cardsAfterStand2 = await blackJack.connect(user1).getUserDecrypteds(1);
  //   console.log("deck after user stand", cardsAfterStand2);

  //   const cardsAfterStand3 = await blackJack.connect(user1).getDealerDecrypteds(1);
  //   console.log("deck after user stand", cardsAfterStand3);


  //   const playerCards = await blackJack.connect(deployer).getPlayerCards(1);

  //   console.log("playerCards", playerCards);

  //   const dealerCards = await blackJack.connect(deployer).getDealerCards(1);

  //   console.log("dealerCards", dealerCards);

  //   const board = await blackJack.connect(deployer).getBoard(1);

  //   console.log("board", board);
  // });

    // it("blackjack test user[A89], dealer[34]", async () => {
  //   const startingDeck = [...Array(52).keys()].map(i => `${i + 1}`); // 1 -> 52
  //   startingDeck[1] = '8';
  //   startingDeck[7] = '2';
  //   startingDeck[4] = '9';
  //   startingDeck[8] = '5';

  //   await blackJack.connect(deployer).startNewGame(startingDeck, { value: '20000000000000000' });

  //   const { result: resultA, publicSignals: publicSignals_a } = await generateShuffleInput(startingDeck, startingDeck, startingDeck.map(i => `${i}`), inputDataShuffleA.R, inputDataShuffleA.pk);

  //   await blackJack.connect(deployer).shuffleDeck(
  //     resultA[0],
  //     resultA[1],
  //     resultA[2],
  //     resultA[3],
  //   );

  //   // User Shuffle
  //   let currentDeck = await blackJack.connect(user1).getDeck(1);
  //   console.log("deck after dealer shuffle", currentDeck);

  //   const { result: resultB, publicSignals: publicSignals } = await generateShuffleInput(startingDeck, startingDeck, currentDeck.map(i => i.toString()), inputDataShuffleB.R, inputDataShuffleB.pk);


  //   await blackJack.connect(user1).joinBoardAndShuffleDeck(
  //     1,
  //     resultB[0],
  //     resultB[1],
  //     resultB[2],
  //     resultB[3],
  //     { value: '2000000000000000000' }
  //   );


  //   // User decrypt
  //   const decks = await blackJack.connect(user1).getDeck(1);

  //   // find the index to find C1 (C1 not save in blockchain)
  //   const index0 = publicSignals.indexOf(decks[0].toString());
  //   const index1 = publicSignals.indexOf(decks[1].toString());
  //   const index2 = publicSignals.indexOf(decks[2].toString());
  //   const index3 = publicSignals.indexOf(decks[3].toString());
  //   const index4 = publicSignals.indexOf(decks[4].toString());
  //   const index5 = publicSignals.indexOf(decks[5].toString());

  //   const inputDataDecrypt0_3 = {
  //     "Y": [
  //       `${publicSignals[index0 - 52]}`,
  //       `${publicSignals[index1 - 52]}`,
  //       `${publicSignals[index2 - 52]}`,
  //       `${publicSignals[index3 - 52]}`,
  //       `${decks[0]}`,
  //       `${decks[1]}`,
  //       `${decks[2]}`,
  //       `${decks[3]}`,
  //     ],
  //     "skP": "3",
  //     "pkP": "64"
  //   };

  //   const resultDecrypt0_3 = await generateDecrypt4CardInput(inputDataDecrypt0_3.Y, inputDataDecrypt0_3.skP, inputDataDecrypt0_3.pkP);

  //   await blackJack.connect(user1).deal4(
  //     1,
  //     resultDecrypt0_3[0],
  //     resultDecrypt0_3[1],
  //     resultDecrypt0_3[2],
  //     resultDecrypt0_3[3],
  //   );

  //   // Dealer decrypt
  //   const cardsAfterUserDecrypted1 = await blackJack.connect(user1).getUserDecrypteds(1);

  //   // find the index to find C1 (C1 not save in blockchain)
  //   const index0_a = publicSignals_a.indexOf(cardsAfterUserDecrypted1[0].toString());
  //   const index1_a = publicSignals_a.indexOf(cardsAfterUserDecrypted1[1].toString());
  //   const index2_a = publicSignals_a.indexOf(cardsAfterUserDecrypted1[2].toString());
  //   const index3_a = publicSignals_a.indexOf(cardsAfterUserDecrypted1[3].toString());

  //   const inputDataDecrypt_a = {
  //     "Y": [
  //       `${publicSignals_a[index0_a - 52]}`,
  //       `${publicSignals_a[index1_a - 52]}`,
  //       `${publicSignals_a[index2_a - 52]}`,
  //       `${cardsAfterUserDecrypted1[0]}`,
  //       `${cardsAfterUserDecrypted1[1]}`,
  //       `${cardsAfterUserDecrypted1[2]}`,
  //     ],
  //     "skP": "2",
  //     "pkP": "16"
  //   };

  //   const resultDecrypt0_2_a = await generateDecrypt3CardInput(inputDataDecrypt_a.Y, inputDataDecrypt_a.skP, inputDataDecrypt_a.pkP);

  //   await blackJack.connect(deployer).deal3(
  //     1,
  //     resultDecrypt0_2_a[0],
  //     resultDecrypt0_2_a[1],
  //     resultDecrypt0_2_a[2],
  //     resultDecrypt0_2_a[3],
  //   );

  //   const inputHit4 = await generateDecrypt1CardInput(
  //     `${publicSignals[index4 - 52]}`,
  //     `${decks[4]}`,
  //     "3",
  //     "64"
  //   )
  //   await blackJack.connect(user1).userHit(
  //     1,
  //     inputHit4[0],
  //     inputHit4[1],
  //     inputHit4[2],
  //     inputHit4[3],
  //   );
  //   const getUserDecrypteds = await blackJack.connect(user1).getUserDecrypteds(1);
  //   const index41 = publicSignals_a.indexOf(getUserDecrypteds[4].toString());
  //   const inputDealHit4 = await generateDecrypt1CardInput(
  //     `${publicSignals_a[index41 - 52]}`,
  //     `${getUserDecrypteds[4]}`,
  //     "2",
  //     "16"
  //   )
  //   await blackJack.connect(deployer).dealHit(
  //     1,
  //     4,
  //     inputDealHit4[0],
  //     inputDealHit4[1],
  //     inputDealHit4[2],
  //     inputDealHit4[3],
  //   );

  //   const inputHit5 = await generateDecrypt1CardInput(
  //     `${publicSignals[index5 - 52]}`,
  //     `${decks[5]}`,
  //     "3",
  //     "64"
  //   )

  //   await blackJack.connect(user1).userHit(
  //     1,
  //     inputHit5[0],
  //     inputHit5[1],
  //     inputHit5[2],
  //     inputHit5[3],
  //   );


  //   const cards3 = await blackJack.connect(user1).getUserDecrypteds(1);
  //   const index51 = publicSignals_a.indexOf(cards3[5].toString());
  //   const inputDealHit5 = await generateDecrypt1CardInput(
  //     `${publicSignals_a[index51 - 52]}`,
  //     `${cards3[5]}`,
  //     "2",
  //     "16"
  //   )

  //   await blackJack.connect(deployer).dealHit(
  //     1,
  //     5,
  //     inputDealHit5[0],
  //     inputDealHit5[1],
  //     inputDealHit5[2],
  //     inputDealHit5[3],
  //   );

  //   const playerCards = await blackJack.connect(deployer).getPlayerCards(1);

  //   console.log("playerCards", playerCards);

  //   const dealerCards = await blackJack.connect(deployer).getDealerCards(1);

  //   console.log("dealerCards", dealerCards);

  //   const board = await blackJack.connect(deployer).getBoard(1);

  //   console.log("board", board);
  // });

  // it("blackjack test", async () => {
  //   const startingDeck = [...Array(52).keys()].map(i => `${i + 1}`); // 1 -> 52
  //   console.log(startingDeck[1]);
  //   console.log(startingDeck[13]);
  //   startingDeck[1] = '14';
  //   startingDeck[13] = '2';
  //   const destinationA = [...Array(52).keys()].map(i => `${i + 1}`); // 1 -> 52
  //   const destinationB = [...Array(52).keys()].map(i => `${i + 1}`); // 1 -> 52
  //   shuffle(destinationA);
  //   shuffle(destinationB);

  //   await blackJack.connect(deployer).startNewGame(startingDeck, { value: '20000000000000000' });

  //   const { result: resultA, publicSignals: publicSignals_a } = await generateShuffleInput(startingDeck, startingDeck, startingDeck.map(i => `${i}`), inputDataShuffleA.R, inputDataShuffleA.pk);

  //   console.log("publicSignals_a", publicSignals_a);

  //   await blackJack.connect(deployer).shuffleDeck(
  //     resultA[0],
  //     resultA[1],
  //     resultA[2],
  //     resultA[3],
  //   );

  //   // User Shuffle
  //   let currentDeck = await blackJack.connect(user1).getDeck(1);
  //   console.log("deck after dealer shuffle", currentDeck);

  //   const { result: resultB, publicSignals: publicSignals } = await generateShuffleInput(startingDeck, startingDeck, currentDeck.map(i => i.toString()), inputDataShuffleB.R, inputDataShuffleB.pk);


  //   await blackJack.connect(user1).joinBoardAndShuffleDeck(
  //     1,
  //     resultB[0],
  //     resultB[1],
  //     resultB[2],
  //     resultB[3],
  //     { value: '2000000000000000000' }
  //   );


  //   // User decrypt
  //   const decks = await blackJack.connect(user1).getDeck(1);
  //   console.log("deck after user shuffle", decks);

  //   // find the index to find C1 (C1 not save in blockchain)
  //   const index0 = publicSignals.indexOf(decks[0].toString());
  //   const index1 = publicSignals.indexOf(decks[1].toString());
  //   const index2 = publicSignals.indexOf(decks[2].toString());
  //   const index3 = publicSignals.indexOf(decks[3].toString());
  //   const index4 = publicSignals.indexOf(decks[4].toString());
  //   const index5 = publicSignals.indexOf(decks[5].toString());
  //   const index6 = publicSignals.indexOf(decks[6].toString());
  //   const index7 = publicSignals.indexOf(decks[7].toString());
  //   const index8 = publicSignals.indexOf(decks[8].toString());
  //   const index9 = publicSignals.indexOf(decks[9].toString());


  //   const inputDataDecrypt0_3 = {
  //     "Y": [
  //       `${publicSignals[index0 - 52]}`,
  //       `${publicSignals[index1 - 52]}`,
  //       `${publicSignals[index2 - 52]}`,
  //       `${publicSignals[index3 - 52]}`,
  //       `${decks[0]}`,
  //       `${decks[1]}`,
  //       `${decks[2]}`,
  //       `${decks[3]}`,
  //     ],
  //     "skP": "3",
  //     "pkP": "64"
  //   };

  //   const resultDecrypt0_3 = await generateDecrypt4CardInput(inputDataDecrypt0_3.Y, inputDataDecrypt0_3.skP, inputDataDecrypt0_3.pkP);

  //   await blackJack.connect(user1).deal4(
  //     1,
  //     resultDecrypt0_3[0],
  //     resultDecrypt0_3[1],
  //     resultDecrypt0_3[2],
  //     resultDecrypt0_3[3],
  //   );

  //   // Dealer decrypt
  //   const cardsAfterUserDecrypted1 = await blackJack.connect(user1).getUserDecrypteds(1);
  //   console.log("deck after user decrypt", cardsAfterUserDecrypted1);

  //   // find the index to find C1 (C1 not save in blockchain)
  //   const index0_a = publicSignals_a.indexOf(cardsAfterUserDecrypted1[0].toString());
  //   const index1_a = publicSignals_a.indexOf(cardsAfterUserDecrypted1[1].toString());
  //   const index2_a = publicSignals_a.indexOf(cardsAfterUserDecrypted1[2].toString());
  //   const index3_a = publicSignals_a.indexOf(cardsAfterUserDecrypted1[3].toString());

  //   const inputDataDecrypt_a = {
  //     "Y": [
  //       `${publicSignals_a[index0_a - 52]}`,
  //       `${publicSignals_a[index1_a - 52]}`,
  //       `${publicSignals_a[index2_a - 52]}`,
  //       `${cardsAfterUserDecrypted1[0]}`,
  //       `${cardsAfterUserDecrypted1[1]}`,
  //       `${cardsAfterUserDecrypted1[2]}`,
  //     ],
  //     "skP": "2",
  //     "pkP": "16"
  //   };

  //   const resultDecrypt0_2_a = await generateDecrypt3CardInput(inputDataDecrypt_a.Y, inputDataDecrypt_a.skP, inputDataDecrypt_a.pkP);

  //   await blackJack.connect(deployer).deal3(
  //     1,
  //     resultDecrypt0_2_a[0],
  //     resultDecrypt0_2_a[1],
  //     resultDecrypt0_2_a[2],
  //     resultDecrypt0_2_a[3],
  //   );

  //   const cardsDealerDecrypted = await blackJack.connect(user1).getDealerDecrypteds(1);
  //   console.log("deck after dealer decrypt", cardsDealerDecrypted);

  //   const inputHit4 = await generateDecrypt1CardInput(
  //     `${publicSignals[index4 - 52]}`,
  //     `${decks[4]}`,
  //     "3",
  //     "64"
  //   )

  //   await blackJack.connect(user1).userHit(
  //     1,
  //     inputHit4[0],
  //     inputHit4[1],
  //     inputHit4[2],
  //     inputHit4[3],
  //   );

  //   const cards2 = await blackJack.connect(user1).getUserDecrypteds(1);
  //   console.log("getUserDecrypteds", cards2);
  //   const index41 = publicSignals_a.indexOf(cards2[4].toString());


  //   const inputDealHit4 = await generateDecrypt1CardInput(
  //     `${publicSignals_a[index41 - 52]}`,
  //     `${cards2[4]}`,
  //     "2",
  //     "16"
  //   )

  //   await blackJack.connect(deployer).dealHit(
  //     1,
  //     4,
  //     inputDealHit4[0],
  //     inputDealHit4[1],
  //     inputDealHit4[2],
  //     inputDealHit4[3],
  //   );
  //   const xxx = await blackJack.connect(user1).getDealerDecrypteds(1);
  //   console.log("getDealerDecrypteds", xxx);

  //   const inputHit5 = await generateDecrypt1CardInput(
  //     `${publicSignals[index5 - 52]}`,
  //     `${decks[5]}`,
  //     "3",
  //     "64"
  //   )

  //   await blackJack.connect(user1).userHit(
  //     1,
  //     inputHit5[0],
  //     inputHit5[1],
  //     inputHit5[2],
  //     inputHit5[3],
  //   );


  //   const cards3 = await blackJack.connect(user1).getUserDecrypteds(1);
  //   const index51 = publicSignals_a.indexOf(cards3[5].toString());
  //   const inputDealHit5 = await generateDecrypt1CardInput(
  //     `${publicSignals_a[index51 - 52]}`,
  //     `${cards3[5]}`,
  //     "2",
  //     "16"
  //   )

  //   await blackJack.connect(deployer).dealHit(
  //     1,
  //     5,
  //     inputDealHit5[0],
  //     inputDealHit5[1],
  //     inputDealHit5[2],
  //     inputDealHit5[3],
  //   );

  //   const inputDataDecrypt6_9 = {
  //     "Y": [
  //       `${publicSignals[index6 - 52]}`,
  //       `${publicSignals[index7 - 52]}`,
  //       `${publicSignals[index8 - 52]}`,
  //       `${publicSignals[index9 - 52]}`,
  //       `${decks[6]}`,
  //       `${decks[7]}`,
  //       `${decks[8]}`,
  //       `${decks[9]}`,
  //     ],
  //     "skP": "3",
  //     "pkP": "64"
  //   };

  //   const resultDecrypt6_9 = await generateDecrypt4CardInput(inputDataDecrypt6_9.Y, inputDataDecrypt6_9.skP, inputDataDecrypt6_9.pkP);

  //   await blackJack.connect(user1).stand(
  //     1,
  //     resultDecrypt6_9[0],
  //     resultDecrypt6_9[1],
  //     resultDecrypt6_9[2],
  //     resultDecrypt6_9[3],
  //   );

  //   const cardsAfterStand = await blackJack.connect(user1).getUserDecrypteds(1);
  //   console.log("deck after user stand", cardsAfterStand);

  //   const cardsAfter = await blackJack.connect(user1).getUserDecrypteds(1);
  //   console.log("deck after user decrypt", cardsAfter);

  //   // find the index to find C1 (C1 not save in blockchain)
  //   const index9_a = publicSignals_a.indexOf(cardsAfterStand[5].toString());
  //   const index6_a = publicSignals_a.indexOf(cardsAfterStand[6].toString());
  //   const index7_a = publicSignals_a.indexOf(cardsAfterStand[7].toString());
  //   const index8_a = publicSignals_a.indexOf(cardsAfterStand[8].toString());

  //   // admin
  //   const inputDealHidden = await generateDecrypt1CardInput(
  //     `${publicSignals_a[index3_a - 52]}`,
  //     `${cardsAfterStand[3]}`,
  //     "2",
  //     "16"
  //   )
  //   await blackJack.connect(deployer).dealHiddenCard(
  //     1,
  //     inputDealHidden[0],
  //     inputDealHidden[1],
  //     inputDealHidden[2],
  //     inputDealHidden[3],
  //   );


  //   const inputDeal6 = await generateDecrypt1CardInput(
  //     `${publicSignals_a[index6_a - 52]}`,
  //     `${cardsAfterStand[6]}`,
  //     "2",
  //     "16"
  //   )


  //   const inputDeal7 = await generateDecrypt1CardInput(
  //     `${publicSignals_a[index7_a - 52]}`,
  //     `${cardsAfterStand[7]}`,
  //     "2",
  //     "16"
  //   )

  //   await blackJack.connect(deployer).hitForDealer(
  //     1,
  //     6,
  //     inputDeal6[0],
  //     inputDeal6[1],
  //     inputDeal6[2],
  //     inputDeal6[3],
  //   );

  //   await blackJack.connect(deployer).hitForDealer(
  //     1,
  //     7,
  //     inputDeal7[0],
  //     inputDeal7[1],
  //     inputDeal7[2],
  //     inputDeal7[3],
  //   );

  //   const cardsAfterStand2 = await blackJack.connect(user1).getUserDecrypteds(1);
  //   console.log("deck after user stand", cardsAfterStand2);

  //   const cardsAfterStand3 = await blackJack.connect(user1).getDealerDecrypteds(1);
  //   console.log("deck after user stand", cardsAfterStand3);


  //   const playerCards = await blackJack.connect(deployer).getPlayerCards(1);

  //   console.log("playerCards", playerCards);

  //   const dealerCards = await blackJack.connect(deployer).getDealerCards(1);

  //   console.log("dealerCards", dealerCards);

  //   const board = await blackJack.connect(deployer).getBoard(1);

  //   console.log("board", board);
  // });
});