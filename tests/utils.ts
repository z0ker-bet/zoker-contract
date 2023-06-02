import * as fs from 'fs-extra';
const snarkjs = require('snarkjs');
const wtns_calculate = require('./witness_calculator');

export const generatePermutationMatrix = (source: string[], destination: string[]) => {
  if (source.length !== destination.length) {
    return false;
  }

  let result: number[] = [];

  for (let i = 0; i < destination.length; i += 1) {
    const index = source.indexOf(destination[i])
    if (index === -1) {
      return false;
    }

    let array = new Array(destination.length).fill("0");
    array[index] = "1";

    result = [...result, ...array];
  }
  return result;
}

export const reservePermutationMatrix = (source: string[], A: string[]) => {
  if (source.length * source.length !== A.length) {
    return false;
  }

  let result: string[] = [];

  for (let i = 0; i < source.length; i += 1) {
    let arr = A.slice(i * source.length, (i + 1) * source.length,);
    const index = arr.indexOf('1')
    if (index === -1) {
      return false;
    }

    result[i] = source[index];
  }
  return result;
}

export const generateInput = (source: string[], destination: string[], X: string[], R: string[], pk: string) => {
  const permutationMatrix = generatePermutationMatrix(source, destination);

  let array = new Array(destination.length).fill("1");
  let X_real = [...array, ...X];
  return {
    A: permutationMatrix,
    X: X_real,
    R,
    pk
  }
};

export const generateShuffleInput = async (
  startingDeck: string[],
  destination: string[],
  X: string[],
  R: string[],
  pk: string,
) => {
  const wasm = await fs.readFileSync('circuits/tests/shuffle/build/test_js/test.wasm');
  const zkey = await fs.readFileSync('circuits/tests/shuffle/build/test_js/test_0000.zkey');
  const calculator = await wtns_calculate(wasm);

  const inputA = await generateInput(startingDeck, destination, X, R, pk);
  const witnessA = await calculator.calculateWTNSBin(inputA, 0);
  const { proof, publicSignals } = await snarkjs.groth16.prove(
    zkey,
    witnessA
  );
  const dataStringA = await snarkjs.groth16.exportSolidityCallData(proof, publicSignals);
  const result = JSON.parse(`[${dataStringA}]`);
  return { result, publicSignals } ;
};

export const generateDecrypt1CardInput = async (
  Y1: string,
  Y2: string,
  skP: string,
  pkP: string
) => {
  const wasmD = await fs.readFileSync('circuits/tests/decrypt1/build/test_js/test.wasm');
  const zkeyD = await fs.readFileSync('circuits/tests/decrypt1/build/test_js/test_0000.zkey');
  const calculatorD = await wtns_calculate(wasmD);
  const inputDataDecrypt = {
    Y: [
      Y1, Y2
    ],
    skP,
    pkP
  };
  const witnessD = await calculatorD.calculateWTNSBin(inputDataDecrypt, 0);
  const { proof: proofD, publicSignals: publicSignalsD } = await snarkjs.groth16.prove(
    zkeyD,
    witnessD
  );

  const dataStringD = await snarkjs.groth16.exportSolidityCallData(proofD, publicSignalsD);
  const resultD = JSON.parse(`[${dataStringD}]`);
  return resultD;
};

export const generateDecrypt4CardInput = async (
  Y: string[],
  skP: string,
  pkP: string
) => {
  
  
  const wasmD = await fs.readFileSync('circuits/tests/decrypt4/build/test_js/test.wasm');
  const zkeyD = await fs.readFileSync('circuits/tests/decrypt4/build/test_js/test_0000.zkey');
  const calculatorD = await wtns_calculate(wasmD);
  const inputDataDecrypt = {
    Y,
    skP,
    pkP
  };
  const witnessD = await calculatorD.calculateWTNSBin(inputDataDecrypt, 0);
  const { proof: proofD, publicSignals: publicSignalsD } = await snarkjs.groth16.prove(
    zkeyD,
    witnessD
  );
  
  const dataStringD = await snarkjs.groth16.exportSolidityCallData(proofD, publicSignalsD);
  const result = JSON.parse(`[${dataStringD}]`);

  return result;
};

export const generateDecrypt3CardInput = async (
  Y: string[],
  skP: string,
  pkP: string
) => {
  
  
  const wasmD = await fs.readFileSync('circuits/tests/decrypt3/build/test_js/test.wasm');
  const zkeyD = await fs.readFileSync('circuits/tests/decrypt3/build/test_js/test_0000.zkey');
  const calculatorD = await wtns_calculate(wasmD);
  const inputDataDecrypt = {
    Y,
    skP,
    pkP
  };
  const witnessD = await calculatorD.calculateWTNSBin(inputDataDecrypt, 0);
  const { proof: proofD, publicSignals: publicSignalsD } = await snarkjs.groth16.prove(
    zkeyD,
    witnessD
  );
  
  const dataStringD = await snarkjs.groth16.exportSolidityCallData(proofD, publicSignalsD);
  const result = JSON.parse(`[${dataStringD}]`);

  return result;
};

export const shuffle = (array: string[]) => {
  let currentUserDecryptedIndex = array.length,  randomIndex;

  // While there remain elements to shuffle.
  while (currentUserDecryptedIndex != 0) {

    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentUserDecryptedIndex);
    currentUserDecryptedIndex--;

    // And swap it with the current element.
    [array[currentUserDecryptedIndex], array[randomIndex]] = [
      array[randomIndex], array[currentUserDecryptedIndex]];
  }

  return array;
}
