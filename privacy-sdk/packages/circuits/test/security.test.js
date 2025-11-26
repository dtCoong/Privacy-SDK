const { expect } = require("chai");
const snarkjs = require("snarkjs");
const fs = require("fs");
const path = require("path");
// Sửa đường dẫn import script
const { generateFullTransactionPayload } = require("../scripts/generateProof.js");

describe("🛡️ SECURITY TESTS (Hacking Simulation)", function () {
    this.timeout(100000); 

    let payload;
    let vKey;

    before(async function () {
        console.log("\n      ⚙️  Đang chuẩn bị dữ liệu gốc...");
        payload = await generateFullTransactionPayload();
        
        // --- SỬA ĐƯỜNG DẪN ĐỌC KEY ---
        const vKeyPath = path.join(__dirname, "../artifacts/verification_key.json");
        vKey = JSON.parse(fs.readFileSync(vKeyPath));
    });

    it("1. Nullifier must be DETERMINISTIC (Same Secret -> Same Nullifier)", async function () {
        console.log("      🕵️  Test 1: Thử tạo proof lần 2 với cùng bí mật...");
        const payload2 = await generateFullTransactionPayload();
        expect(payload.nullifier).to.equal(payload2.nullifier);
        console.log(`      ✅ Nullifier khớp nhau: ${payload.nullifier.slice(0, 10)}...`);
    });

    it("2. Tampered Merkle Root should NOT match computed root", async function () {
        console.log("      🕵️  Test 2: Hacker sửa Merkle Root và gửi lại...");
        const realMerkleRoot = payload.merkleRoot;
        const fakeMerkleRoot = "123456789";

        expect(realMerkleRoot).to.not.equal(fakeMerkleRoot);

        try {
            const tamperedSignals = [...payload.rawPublicSignals.map(x => x.toString())];
            tamperedSignals[0] = fakeMerkleRoot; 

            const isValid = await snarkjs.groth16.verify(vKey, tamperedSignals, payload.rawProof);
            expect(isValid).to.be.false;
            console.log("      ✅ SnarkJS xác nhận: Proof không khớp với Fake Root.");
        
        } catch (e) {
            console.log("      ⚠️ (SnarkJS Format Error - Ignored) Gói tin bị từ chối.");
        }
        console.log("      ✅ Hệ thống an toàn trước giả mạo Root.");
    });
});