const snarkjs = require("snarkjs");
const fs = require("fs");
const path = require("path");
// Import thư viện build cây Merkle & Poseidon
const { buildPoseidon } = require("circomlibjs");

// --- CẤU HÌNH ĐƯỜNG DẪN CHUẨN (Đã sửa cho folder artifacts) ---
const WASM_PATH = path.join(__dirname, "../artifacts/transfer.wasm");
const ZKEY_PATH = path.join(__dirname, "../artifacts/transfer_final.zkey");

async function generateFullTransactionPayload() {
    console.log("🚀 Bắt đầu quy trình tạo giao dịch ẩn danh (Tuần 3 - Merkle)...");

    try {
        // 1. KHỞI TẠO POSEIDON
        const poseidon = await buildPoseidon();
        const F = poseidon.F; 

        function hashLeftRight(left, right) {
            return poseidon([left, right]);
        }
        function toCircomStr(n) {
            return F.toString(n);
        }

        // 2. GIẢ LẬP MERKLE TREE
        console.log("🌳 Đang giả lập Merkle Tree...");
        const secret = 123456n;
        const amount = 10n;
        const myCommitment = poseidon([amount, secret]); 
        
        const leaf1 = F.e(1111n);
        const leaf2 = F.e(2222n);
        const leaf3 = F.e(3333n);
        
        const hash1 = hashLeftRight(myCommitment, leaf1); 
        const hash2 = hashLeftRight(leaf2, leaf3);
        const root = hashLeftRight(hash1, hash2);
        
        const pathElements = [toCircomStr(leaf1), toCircomStr(hash2)];
        const pathIndices = ["0", "0"]; 

        const nullifier = poseidon([secret, 1n]);

        // 3. INPUT
        const zkInput = {
            root: toCircomStr(root),
            nullifier: toCircomStr(nullifier),
            secret: secret.toString(),
            amount: amount.toString(),
            pathElements: pathElements,
            pathIndices: pathIndices,
            outputAmount: amount.toString(),
            outputSecret: "987654"
        };

        // 4. TẠO PROOF
        console.log("1️⃣  Đang tạo ZK Proof (Merkle Check)...");
        const { proof, publicSignals } = await snarkjs.groth16.fullProve(
            zkInput,
            WASM_PATH,
            ZKEY_PATH 
        );
        const solidityCallData = await snarkjs.groth16.exportSolidityCallData(proof, publicSignals);
        console.log("   ✅ ZK Proof hoàn tất.");

        // 5. TẠO RING SIGNATURE
        console.log("2️⃣  Đang tạo Ring Signature...");
        // SỬA QUAN TRỌNG: Import ringsig.mjs từ folder cha
        const { createRingSignature, generateMockKeyPair } = await import("../ringsig.mjs");
        
        const user1 = await generateMockKeyPair();
        const user2 = await generateMockKeyPair();
        const me = await generateMockKeyPair();
        const ringKeys = [user1.pk, me.pk, user2.pk];
        
        const message = new TextEncoder().encode(toCircomStr(root)); 
        
        const signature = await createRingSignature(message, ringKeys, me.sk, 1);
        console.log("   ✅ Ring Signature hoàn tất.");

        return {
            zkProof: solidityCallData,
            rawProof: proof,             
            rawPublicSignals: publicSignals, 
            ringSignature: signature,
            publicSignals: publicSignals,
            merkleRoot: toCircomStr(root),
            nullifier: toCircomStr(nullifier)
        };

    } catch (error) {
        console.error("❌ Lỗi:", error);
        throw error;
    }
}

if (require.main === module) {
    generateFullTransactionPayload().then(res => {
        if(res) console.log("\n📦 NEW PAYLOAD (Week 3):", JSON.stringify(res, null, 2));
    });
}

module.exports = { generateFullTransactionPayload };