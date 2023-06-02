pragma circom 2.0.0;

include "../../permutation.circom";

template Test() {
    signal input a[9];
    signal output out;
    out <== 10;
    
    component conversion = Permutation(3);
    for (var i = 0; i<9; i++) {
        conversion.in[i] <== a[i];
    }
}

component main = Test();
