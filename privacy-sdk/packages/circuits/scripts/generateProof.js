const snarkjs = require("snarkjs");
const fs = require("fs");
const path = require("path");
const { buildPoseidon } = require("circomlibjs");

const WASM_PATH = path.join(__dirname, "../artifacts/transfer_js/transfer.wasm");
const ZKEY_PATH = path.join(__dirname, "../artifacts/transfer_final.zkey");

async function generateFullTransactionPayload() {
    console.log("🚀 Bắt đầu quy trình tạo giao dịch ẩn danh (Tuần 3 - Merkle)...");

    try {
        const poseidon = await buildPoseidon();
        const F = poseidon.F;

        function hashLeftRight(left, right) {
            return poseidon([left, right]);
        }

        function toCircomStr(n) {
            return F.toString(n);
        }

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

        console.log("1️⃣  Đang tạo ZK Proof (Merkle Check)...");
        const { proof, publicSignals } = await snarkjs.groth16.fullProve(
            zkInput,
            WASM_PATH,
            ZKEY_PATH
        );

        const solidityCallData = await snarkjs.groth16.exportSolidityCallData(
            proof,
            publicSignals
        );
        console.log("   ✅ ZK Proof hoàn tất.");

        // ===========================
        // GHI TEST VECTOR CHO PERSON 2
        // ===========================
        const testDataDir = path.join(
            __dirname,
            "../../contracts/test/test-data"
        );
        try {
            if (!fs.existsSync(testDataDir)) {
                fs.mkdirSync(testDataDir, { recursive: true });
            }

            // Định dạng đúng như tài liệu: proof.json + public.json
            fs.writeFileSync(
                path.join(testDataDir, "proof.json"),
                JSON.stringify(proof, null, 2),
                "utf8"
            );
            fs.writeFileSync(
                path.join(testDataDir, "public.json"),
                JSON.stringify({ publicSignals }, null, 2),
                "utf8"
            );

            console.log(
                "   ✅ Đã ghi proof.json & public.json vào packages/contracts/test/test-data"
            );
        } catch (e) {
            console.error("   ⚠️ Không ghi được proof.json/public.json:", e);
        }
        // ====== Hết phần thêm cho Person2 ======

        console.log("2️⃣  Đang tạo Ring Signature...");
        const { RingSignature } = await import("./ringsig.mjs");

        const user1 = RingSignature.generateKeyPair();
        const user2 = RingSignature.generateKeyPair();
        const me    = RingSignature.generateKeyPair();
        const ringKeys = [user1.pk, me.pk, user2.pk];

        const message = new TextEncoder().encode(toCircomStr(root));

        const signature = await RingSignature.createRingSignature(
            message,
            ringKeys,
            me.sk,
            1
        );

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
    generateFullTransactionPayload().then((res) => {
        if (res) {
            console.log("\n📦 NEW PAYLOAD (Week 3):", JSON.stringify(res, null, 2));
        }
    });
}

module.exports = { generateFullTransactionPayload };
