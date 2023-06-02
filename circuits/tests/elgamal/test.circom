pragma circom 2.0.0;

include "../../elgamal.circom";

template Test() {
    signal input m;
    signal input r;
    signal input sk;
    signal input pk;
    signal output out;
    signal c1;
    signal c2;
    var g = 4;
    out <== m*r;

    component encrypt = ElGamalEncrypt(10, g);
    encrypt.m <== m;
    encrypt.r <== r;
    encrypt.pk <== pk;
    c1 <== encrypt.c1;
    c2 <== encrypt.c2;

    out <== c1;

    component decrypt = ElGamalDecrypt(g);
    decrypt.c1 <== c1;
    decrypt.c2 <== c2;
    decrypt.sk <== sk;
    decrypt.m === m;
}

component main{public [m]} = Test();
