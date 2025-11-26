pragma circom 2.0.0;

// Nạp thư viện Poseidon từ circomlib
include "node_modules/circomlib/circuits/poseidon.circom";

// Mạch tính Hash của 2 node con (Trái, Phải) -> Cha
template HashLeftRight() {
    signal input left;
    signal input right;
    signal output hash;

    component hasher = Poseidon(2);
    hasher.inputs[0] <== left;
    hasher.inputs[1] <== right;
    hash <== hasher.out;
}

// Mạch chính: Merkle Tree Inclusion Proof
// levels: Độ cao của cây (Ví dụ: 2)
template MerkleTreeInclusionProof(levels) {
    signal input leaf;
    signal input pathElements[levels]; // Các node hàng xóm
    signal input pathIndices[levels];  // 0: là bên trái, 1: là bên phải
    signal output root;

    component hashers[levels];
    component mux[levels];

    signal currentLevelHash[levels + 1];
    currentLevelHash[0] <== leaf;

    for (var i = 0; i < levels; i++) {
        hashers[i] = HashLeftRight();

        // Logic tráo đổi vị trí dựa trên pathIndices
        // Nếu index = 0: Hash(current, pathElement)
        // Nếu index = 1: Hash(pathElement, current)
        
        var c = currentLevelHash[i];
        var p = pathElements[i];
        var s = pathIndices[i];

        // Công thức toán học thay thế cho if-else:
        // Left  = c + s * (p - c)
        // Right = p + s * (c - p)
        hashers[i].left <== c + s * (p - c);
        hashers[i].right <== p + s * (c - p);

        currentLevelHash[i + 1] <== hashers[i].hash;
    }

    root <== currentLevelHash[levels];
}

// Test cây độ cao 2 (4 lá)
component main = MerkleTreeInclusionProof(2);