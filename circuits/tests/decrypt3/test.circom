pragma circom 2.0.0;

include "../../shuffle.circom";

template Test() {
    var num_bits = 254;
    var g = 4;
    signal input Y[6];
    signal input pkP;
    signal input skP;
    signal output out[3];
    
    component decrypt = Decrypt(g, num_bits, 3);
    decrypt.Y <== Y;
    decrypt.pkP <== pkP;
    decrypt.skP <== skP;
    out <== decrypt.out;
}

component main {public [Y, pkP]}  = Test();
