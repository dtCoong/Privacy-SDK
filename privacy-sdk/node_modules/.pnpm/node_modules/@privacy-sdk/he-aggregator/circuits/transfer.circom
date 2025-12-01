pragma circom 2.1.6;

include "circomlib/circuits/poseidon.circom";
include "circomlib/circuits/bitify.circom";

template MerkleTreeInclusionProof(levels) {
    signal input leaf;
    signal input pathElements[levels];
    signal input pathIndices[levels];
    signal output root;

    signal cur[levels + 1];
    signal left[levels];
    signal right[levels];

    signal t1[levels];
    signal t2[levels];
    signal t3[levels];
    signal t4[levels];

    component hashers[levels];
    component indexBits[levels];

    var i;

    cur[0] <== leaf;

    for (i = 0; i < levels; i++) {
        indexBits[i] = Num2Bits(1);
        indexBits[i].in <== pathIndices[i];

        hashers[i] = Poseidon(2);

        t1[i] <== pathIndices[i] * cur[i];
        t2[i] <== pathIndices[i] * pathElements[i];
        left[i] <== cur[i] - t1[i] + t2[i];

        t3[i] <== pathIndices[i] * pathElements[i];
        t4[i] <== pathIndices[i] * cur[i];
        right[i] <== pathElements[i] - t3[i] + t4[i];

        hashers[i].inputs[0] <== left[i];
        hashers[i].inputs[1] <== right[i];

        cur[i + 1] <== hashers[i].out;
    }

    root <== cur[levels];
}

template Transfer(levels) {
    signal input root;
    signal input nullifier;
    signal input amount;
    signal input secret;
    signal input pathElements[levels];
    signal input pathIndices[levels];
    signal input outputAmount;
    signal input outputSecret;

    component comHasher = Poseidon(2);
    comHasher.inputs[0] <== amount;
    comHasher.inputs[1] <== secret;
    signal commitment;
    commitment <== comHasher.out;

    component merkle = MerkleTreeInclusionProof(levels);
    merkle.leaf <== commitment;

    var i;
    for (i = 0; i < levels; i++) {
        merkle.pathElements[i] <== pathElements[i];
        merkle.pathIndices[i] <== pathIndices[i];
    }

    signal computedRoot;
    computedRoot <== merkle.root;
    computedRoot === root;

    component nullifierHasher = Poseidon(2);
    nullifierHasher.inputs[0] <== secret;
    nullifierHasher.inputs[1] <== 1;
    signal computedNullifier;
    computedNullifier <== nullifierHasher.out;
    computedNullifier === nullifier;

    component aBits = Num2Bits(252);
    aBits.in <== amount;

    component oBits = Num2Bits(252);
    oBits.in <== outputAmount;

    signal diff;
    diff <== amount - outputAmount;

    component dBits = Num2Bits(252);
    dBits.in <== diff;

    component outComHasher = Poseidon(2);
    outComHasher.inputs[0] <== outputAmount;
    outComHasher.inputs[1] <== outputSecret;
    signal outputCommitment;
    outputCommitment <== outComHasher.out;
}

component main { public [root, nullifier] } = Transfer(2);
