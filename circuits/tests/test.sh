# cd boolean
# mkdir build
# circom test.circom --r1cs --wasm --sym -o build
# cp input.json ./build/test_js
# cp ../pot16_final.ptau ./build/test_js
# cd ./build/test_js
# snarkjs g16s ../test.r1cs pot16_final.ptau test_0000.zkey
# snarkjs zkev test_0000.zkey verification_key.json
# node generate_witness.js test.wasm input.json witness.wtns
# snarkjs g16p test_0000.zkey witness.wtns proof.json public.json
# snarkjs g16v verification_key.json public.json proof.json
# snarkjs zkesv test_0000.zkey verifier.sol
# cd ../../../

# cd num2Bits
# mkdir build
# circom test.circom --r1cs --wasm --sym -o build
# cp input.json ./build/test_js
# cp ../pot16_final.ptau ./build/test_js
# cd ./build/test_js
# snarkjs g16s ../test.r1cs pot16_final.ptau test_0000.zkey
# snarkjs zkev test_0000.zkey verification_key.json
# node generate_witness.js test.wasm input.json witness.wtns
# snarkjs g16p test_0000.zkey witness.wtns proof.json public.json
# snarkjs g16v verification_key.json public.json proof.json
# snarkjs zkesv test_0000.zkey verifier.sol
# cd ../../../

# cd elgamal
# mkdir build
# circom test.circom --r1cs --wasm --sym -o build
# cp input.json ./build/test_js
# cp ../pot16_final.ptau ./build/test_js
# cd ./build/test_js
# snarkjs g16s ../test.r1cs pot16_final.ptau test_0000.zkey
# snarkjs zkev test_0000.zkey verification_key.json
# node generate_witness.js test.wasm input.json witness.wtns
# snarkjs g16p test_0000.zkey witness.wtns proof.json public.json
# snarkjs g16v verification_key.json public.json proof.json
# snarkjs zkesv test_0000.zkey verifier.sol
# cd ../../../

# cd exponentiation
# mkdir build
# circom test.circom --r1cs --wasm --sym -o build
# cp input.json ./build/test_js
# cp ../pot16_final.ptau ./build/test_js
# cd ./build/test_js
# snarkjs g16s ../test.r1cs pot16_final.ptau test_0000.zkey
# snarkjs zkev test_0000.zkey verification_key.json
# node generate_witness.js test.wasm input.json witness.wtns
# snarkjs g16p test_0000.zkey witness.wtns proof.json public.json
# snarkjs g16v verification_key.json public.json proof.json
# snarkjs zkesv test_0000.zkey verifier.sol
# cd ../../../

# cd linearTransform
# mkdir build
# circom test.circom --r1cs --wasm --sym -o build
# cp input.json ./build/test_js
# cp ../pot16_final.ptau ./build/test_js
# cd ./build/test_js
# snarkjs g16s ../test.r1cs pot16_final.ptau test_0000.zkey
# snarkjs zkev test_0000.zkey verification_key.json
# node generate_witness.js test.wasm input.json witness.wtns
# snarkjs g16p test_0000.zkey witness.wtns proof.json public.json
# snarkjs g16v verification_key.json public.json proof.json
# snarkjs zkesv test_0000.zkey verifier.sol
# cd ../../../

# cd poseidon
# mkdir build
# circom test.circom --r1cs --wasm --sym -o build
# cp input.json ./build/test_js
# cp ../pot16_final.ptau ./build/test_js
# cd ./build/test_js
# snarkjs g16s ../test.r1cs pot16_final.ptau test_0000.zkey
# snarkjs zkev test_0000.zkey verification_key.json
# node generate_witness.js test.wasm input.json witness.wtns
# snarkjs g16p test_0000.zkey witness.wtns proof.json public.json
# snarkjs g16v verification_key.json public.json proof.json
# snarkjs zkesv test_0000.zkey verifier.sol
# cd ../../../

# cd permutation
# mkdir build
# circom test.circom --r1cs --wasm --sym -o build
# cp input.json ./build/test_js
# cp ../pot16_final.ptau ./build/test_js
# cd ./build/test_js
# snarkjs g16s ../test.r1cs pot16_final.ptau test_0000.zkey
# snarkjs zkev test_0000.zkey verification_key.json
# node generate_witness.js test.wasm input.json witness.wtns
# snarkjs g16p test_0000.zkey witness.wtns proof.json public.json
# snarkjs g16v verification_key.json public.json proof.json
# snarkjs zkesv test_0000.zkey verifier.sol
# cd ../../../

# cd decrypt1
# mkdir build
# circom test.circom --r1cs --wasm --sym -o build
# cp input.json ./build/test_js
# cp ../pot16_final.ptau ./build/test_js
# cd ./build/test_js
# snarkjs g16s ../test.r1cs pot16_final.ptau test_0000.zkey
# snarkjs zkev test_0000.zkey verification_key.json
# node generate_witness.js test.wasm input.json witness.wtns
# snarkjs g16p test_0000.zkey witness.wtns proof.json public.json
# snarkjs g16v verification_key.json public.json proof.json
# snarkjs zkesv test_0000.zkey verifier.sol
# cd ../../../

# cd decrypt3
# mkdir build
# circom test.circom --r1cs --wasm --sym -o build
# cp input.json ./build/test_js
# cp ../pot16_final.ptau ./build/test_js
# cd ./build/test_js
# snarkjs g16s ../test.r1cs pot16_final.ptau test_0000.zkey
# snarkjs zkev test_0000.zkey verification_key.json
# node generate_witness.js test.wasm input.json witness.wtns
# snarkjs g16p test_0000.zkey witness.wtns proof.json public.json
# snarkjs g16v verification_key.json public.json proof.json
# snarkjs zkesv test_0000.zkey verifier.sol
# cd ../../../

# cd decrypt4
# rm -rf ./build
# mkdir build
# circom test.circom --r1cs --wasm --sym -o build
# cp input.json ./build/test_js
# cp ../pot16_final.ptau ./build/test_js
# cd ./build/test_js
# snarkjs g16s ../test.r1cs pot16_final.ptau test_0000.zkey
# snarkjs zkev test_0000.zkey verification_key.json
# node generate_witness.js test.wasm input.json witness.wtns
# snarkjs g16p test_0000.zkey witness.wtns proof.json public.json
# snarkjs g16v verification_key.json public.json proof.json
# snarkjs zkesv test_0000.zkey verifier.sol
# cd ../../../

cd shuffle
rm -rf ./build
mkdir build
circom test.circom --r1cs --wasm --sym -o build
cp input.json ./build/test_js
cp ../pot18_final.ptau ./build/test_js
cd ./build/test_js
snarkjs g16s ../test.r1cs pot18_final.ptau test_0000.zkey
snarkjs zkev test_0000.zkey verification_key.json
node generate_witness.js test.wasm input.json witness.wtns
snarkjs g16p test_0000.zkey witness.wtns proof.json public.json
snarkjs g16v verification_key.json public.json proof.json
snarkjs zkesv test_0000.zkey verifier.sol
cd ../../../

# cd shuffle
# rm -rf ./build
# mkdir build
# circom test.circom --r1cs --wasm --sym -o build
# cp input.json ./build/test_js
# cp ../pot20_final.ptau ./build/test_js
# cd ./build/test_js
# snarkjs g16s ../test.r1cs pot20_final.ptau test_0000.zkey
# snarkjs zkev test_0000.zkey verification_key.json
# # node generate_witness.js test.wasm input.json witness.wtns
# snarkjs g16p input.json test.wasm test_0000.zkey proof.json public.json
# snarkjs g16v verification_key.json public.json proof.json
# snarkjs zkesv test_0000.zkey verifier.sol
# cd ../../../