//
// Copyright 2017 Christian Reitwiessner
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
//
// 2019 OKIMS
//      ported to solidity 0.6
//      fixed linter warnings
//      added requiere error messages
//
//
// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.4;

import "./Paring.sol";

contract Decrypt3Verifier {
    using Pairing for *;

    struct Proof {
        Pairing.G1Point A;
        Pairing.G2Point B;
        Pairing.G1Point C;
    }
    function verifyingKey() internal pure returns (VerifyingKey memory vk) {
        vk.alfa1 = Pairing.G1Point(
            20491192805390485299153009773594534940189261866228447918068658471970481763042,
            9383485363053290200918347156157836566562967994039712273449902621266178545958
        );

        vk.beta2 = Pairing.G2Point(
            [4252822878758300859123897981450591353533073413197771768651442665752259397132,
             6375614351688725206403948262868962793625744043794305715222011528459656738731],
            [21847035105528745403288232691147584728191162732299865338377159692350059136679,
             10505242626370262277552901082094356697409835680220590971873171140371331206856]
        );
        vk.gamma2 = Pairing.G2Point(
            [11559732032986387107991004021392285783925812861821192530917403151452391805634,
             10857046999023057135944570762232829481370756359578518086990519993285655852781],
            [4082367875863433681332203403145435568316851327593401208105741076214120093531,
             8495653923123431417604973247489272438418190587263600148770280649306958101930]
        );
        vk.delta2 = Pairing.G2Point(
            [11559732032986387107991004021392285783925812861821192530917403151452391805634,
             10857046999023057135944570762232829481370756359578518086990519993285655852781],
            [4082367875863433681332203403145435568316851327593401208105741076214120093531,
             8495653923123431417604973247489272438418190587263600148770280649306958101930]
        );
        vk.IC = new Pairing.G1Point[](11);
        
        vk.IC[0] = Pairing.G1Point( 
            14231364276703083690948684973807418038953492896774441024019463118245150534111,
            13077087963955121744946075272231170797079680885328893806348476762844492872454
        );                                      
        
        vk.IC[1] = Pairing.G1Point( 
            5784994266481272018591734118339574642309372462830976493456263056878760005336,
            5351660501706693681512592292834974900609124084962872804324024545394078431831
        );                                      
        
        vk.IC[2] = Pairing.G1Point( 
            9988510587018689913982521245908611202797761876306059620629186677820400563844,
            8981975187365488648470660422596655473480177630301175477172311542744810084574
        );                                      
        
        vk.IC[3] = Pairing.G1Point( 
            13621503533622566385705583462975594983183836455441266035883454235345473738404,
            11276163243765315363118859771439813212599966945809768742564674287529465783865
        );                                      
        
        vk.IC[4] = Pairing.G1Point( 
            11835276218613947208784400907912716920516678856098216137239932748502728171994,
            3918732416980189705829217693207720759737486041975472449574000195556853192972
        );                                      
        
        vk.IC[5] = Pairing.G1Point( 
            5041262516899977626722768323348020445049806636354455301140046861095287183166,
            1218614918108609764664617684726477815633557326472804039883436150756484528446
        );                                      
        
        vk.IC[6] = Pairing.G1Point( 
            4407713137788049067639404160462609217555226691162780061370362107990572556500,
            10771779950357712657438471373765791488711184258952815536166119922962328002260
        );                                      
        
        vk.IC[7] = Pairing.G1Point( 
            19295370250405512184198490034843304245324212128487571295420824620200438429401,
            2146304246879984443603542563831583535834555794185199377587667506172555062696
        );                                      
        
        vk.IC[8] = Pairing.G1Point( 
            2696163834315169497740956899540413619876674372544424968736075145514958736595,
            5928059834338341201612223937289859848026855941778113728724313342007624172049
        );                                      
        
        vk.IC[9] = Pairing.G1Point( 
            12620153604914849391298337591564503085473743907872066280932695072708918402232,
            17905973571226459407756654559481839284966417918091140516838131110110345317894
        );                                      
        
        vk.IC[10] = Pairing.G1Point( 
            6582721468188599926123995985582567671481995557065947256534600955740969597847,
            11206735974298927733116827257743492720524720262717967770705309842866913254588
        );                                      
        
    }
    function verify(uint[] memory input, Proof memory proof) internal view returns (uint) {
        uint256 snark_scalar_field = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
        VerifyingKey memory vk = verifyingKey();
        require(input.length + 1 == vk.IC.length,"verifier-bad-input");
        // Compute the linear combination vk_x
        Pairing.G1Point memory vk_x = Pairing.G1Point(0, 0);
        for (uint i = 0; i < input.length; i++) {
            require(input[i] < snark_scalar_field,"verifier-gte-snark-scalar-field");
            vk_x = Pairing.addition(vk_x, Pairing.scalar_mul(vk.IC[i + 1], input[i]));
        }
        vk_x = Pairing.addition(vk_x, vk.IC[0]);
        if (!Pairing.pairingProd4(
            Pairing.negate(proof.A), proof.B,
            vk.alfa1, vk.beta2,
            vk_x, vk.gamma2,
            proof.C, vk.delta2
        )) return 1;
        return 0;
    }
    /// @return r  bool true if proof is valid
    function verifyProof(
            uint[2] memory a,
            uint[2][2] memory b,
            uint[2] memory c,
            uint[10] memory input
        ) public view returns (bool r) {
        Proof memory proof;
        proof.A = Pairing.G1Point(a[0], a[1]);
        proof.B = Pairing.G2Point([b[0][0], b[0][1]], [b[1][0], b[1][1]]);
        proof.C = Pairing.G1Point(c[0], c[1]);
        uint[] memory inputValues = new uint[](input.length);
        for(uint i = 0; i < input.length; i++){
            inputValues[i] = input[i];
        }
        if (verify(inputValues, proof) == 0) {
            return true;
        } else {
            return false;
        }
    }
}
