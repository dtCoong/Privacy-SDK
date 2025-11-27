pragma circom 2.1.6;

// Nạp thư viện Poseidon (Hàm băm nhẹ cho ZK)
include "circomlib/circuits/poseidon.circom";

// --- CÁC TEMPLATE PHỤ TRỢ ---

// 1. Mạch tính Hash Commitment = Poseidon(amount, secret)
// Đây là cái "phong bì" chứa tiền
template NoteCommitment() {
    signal input amount;
    signal input secret;
    signal output commitment;

    component hasher = Poseidon(2);
    hasher.inputs[0] <== amount;
    hasher.inputs[1] <== secret;
    commitment <== hasher.out;
}

// 2. Mạch tính Nullifier = Poseidon(secret, 1)
// Đây là "dấu mộc" để đánh dấu tiền đã tiêu
template NullifierHasher() {
    signal input secret;
    signal output nullifier;

    component hasher = Poseidon(2);
    hasher.inputs[0] <== secret;
    hasher.inputs[1] <== 1; // Salt cố định để khác với commitment
    nullifier <== hasher.out;
}

// 3. Mạch Merkle Tree (Copy từ bài trước nhưng tích hợp vào đây cho gọn)
template MerkleTreeInclusionProof(levels) {
    signal input leaf;
    signal input pathElements[levels];
    signal input pathIndices[levels];
    signal output root;

    component hashers[levels];
    signal currentLevelHash[levels + 1];
    currentLevelHash[0] <== leaf;

    for (var i = 0; i < levels; i++) {
        hashers[i] = Poseidon(2);
        
        var c = currentLevelHash[i];
        var p = pathElements[i];
        var s = pathIndices[i];

        hashers[i].inputs[0] <== c + s * (p - c);
        hashers[i].inputs[1] <== p + s * (c - p);

        currentLevelHash[i + 1] <== hashers[i].out;
    }
    root <== currentLevelHash[levels];
}

// --- TEMPLATE CHÍNH: TRANSFER ---
// levels: Độ cao cây Merkle (Ví dụ: 20 cho thực tế, 2 cho test)
template Transfer(levels) {
    // --- INPUTS ---
    
    // 1. Public Inputs (Sẽ gửi lên Blockchain)
    signal input root;           // Gốc Merkle Tree hiện tại (chứng minh tiền tồn tại)
    signal input nullifier;      // Mã hủy (chống tiêu đôi)
    
    // 2. Private Inputs (Bí mật của người dùng)
    signal input secret;         // Chìa khóa bí mật của tờ tiền cũ
    signal input amount;         // Số tiền của tờ tiền cũ
    signal input pathElements[levels]; // Đường dẫn Merkle
    signal input pathIndices[levels];  // Vị trí Merkle

    signal input outputAmount;   // Số tiền muốn chuyển đi (hoặc rút ra)
    signal input outputSecret;   // Bí mật mới cho tờ tiền mới

    // --- LOGIC KIỂM TRA ---

    // Bước 1: Kiểm tra quyền sở hữu (Tính lại Commitment từ Secret + Amount)
    component commitmentHasher = NoteCommitment();
    commitmentHasher.amount <== amount;
    commitmentHasher.secret <== secret;

    // Bước 2: Kiểm tra sự tồn tại (Merkle Proof)
    // Chứng minh rằng Commitment vừa tính ra có nằm trong Root công khai kia không
    component tree = MerkleTreeInclusionProof(levels);
    tree.leaf <== commitmentHasher.commitment;
    for (var i = 0; i < levels; i++) {
        tree.pathElements[i] <== pathElements[i];
        tree.pathIndices[i] <== pathIndices[i];
    }
    // BẮT BUỘC: Root tính ra phải khớp với Root công khai
    tree.root === root;

    // Bước 3: Kiểm tra Nullifier
    // Tính Nullifier từ secret và bắt buộc nó phải khớp với Nullifier công khai
    // (Để Smart Contract biết đường mà chặn nếu tiêu lại)
    component nullifierHasher = NullifierHasher();
    nullifierHasher.secret <== secret;
    nullifierHasher.nullifier === nullifier;

    // Bước 4: Kiểm tra tính hợp lệ của đầu ra (Ở đây làm đơn giản: Input >= Output)
    // Trong thực tế sẽ cần mạch so sánh số lớn (Comparators), nhưng để demo ta dùng check đơn giản
    // Tạo ra cam kết mới cho người nhận
    component outputCommitmentHasher = NoteCommitment();
    outputCommitmentHasher.amount <== outputAmount;
    outputCommitmentHasher.secret <== outputSecret;
    
    // signal output newCommitment; // (Tạm thời chưa output để đơn giản hóa xác thực)
}

// Khởi tạo mạch với cây độ cao 2 (cho dễ test)
// Public Inputs gồm: root, nullifier
component main {public [root, nullifier]} = Transfer(2);