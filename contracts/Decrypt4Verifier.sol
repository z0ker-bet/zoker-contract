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

contract Decrypt4Verifier {
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
        vk.IC = new Pairing.G1Point[](14);
        
        vk.IC[0] = Pairing.G1Point( 
            2689147210322405901386489970448207936668798271681512512415074179628610452083,
            6731925940909167152311616616090223497144045517396822620509639622301911703365
        );                                      
        
        vk.IC[1] = Pairing.G1Point( 
            14461654940845273826643800368790286605328666401269927233355270683407074238600,
            16699399645951729127474695779435855339321810362027468684744271991617608676663
        );                                      
        
        vk.IC[2] = Pairing.G1Point( 
            16223900368280672881650609524597148629892033588761574258617681173144058609754,
            1927007795138767442506671399178595744570695256736708666196828106071950554213
        );                                      
        
        vk.IC[3] = Pairing.G1Point( 
            18544187261351399959628567251112790476640831159856085804801260877861216976505,
            13170335782880668966923379921131289354376610048548784208339025291506758161341
        );                                      
        
        vk.IC[4] = Pairing.G1Point( 
            3704832175833808558039519499995713077633487072689628288930431539687218802642,
            16096633297183820439737081493312407925581178836827289240975042547959311119035
        );                                      
        
        vk.IC[5] = Pairing.G1Point( 
            21027215241567153806190436611591887155179858980704299627905070255149134920370,
            11090046745354372126280438047571068798959078523678435579405343433102247702916
        );                                      
        
        vk.IC[6] = Pairing.G1Point( 
            14881944027740973304359438402241402666329634257823205174274106007305396321311,
            11379336835650337157949311005592239561904314169248677925830761922158644617522
        );                                      
        
        vk.IC[7] = Pairing.G1Point( 
            19135170998097062154609716386990835377598058165453607055435255629164280397896,
            3036125425496772763357500959272506378893671197166539641189621612068534604862
        );                                      
        
        vk.IC[8] = Pairing.G1Point( 
            2163293263170951573727129504831400230662430302300122402941316834531306283419,
            12884866957091732395713462685481035040296524803236323060114638677922559832222
        );                                      
        
        vk.IC[9] = Pairing.G1Point( 
            4321515998700341153196854468299657996307435067306698176589617569291733937953,
            13590045969387088801544098616900923294527801224594854794905719458921302486878
        );                                      
        
        vk.IC[10] = Pairing.G1Point( 
            4517523150778104884507333902017098866461216009392693581214442163159832127931,
            15367257582125535867495548828343812853082883306509266234822646840982276654075
        );                                      
        
        vk.IC[11] = Pairing.G1Point( 
            9775994136749004323001873925114740520424961080035237231356610629716891195800,
            6183208322983751910783176772397408509128543653377474588505065545779292161452
        );                                      
        
        vk.IC[12] = Pairing.G1Point( 
            5698600656765448828555073795835735860682058552084266725956811485925897753394,
            12991649345705897692851283344969394915434346767200245236989249240382550440256
        );                                      
        
        vk.IC[13] = Pairing.G1Point( 
            20305232842952110925734396901557322002944188463744484367521148814922488673383,
            4619216462630061496745339064378809510494734801825711910165348676941820301664
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
            uint[13] memory input
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
