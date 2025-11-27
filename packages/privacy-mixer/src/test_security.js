import { RingSignature } from './ringsig.js';
import { strict as assert } from 'assert';

console.log("=== BẮT ĐẦU SECURITY TEST SUITE CHO RINGSIG.JS (FINAL ATTEMPT) ===");

async function runTests() {
    console.log("\n[SETUP] Đang khởi tạo Ring và Keys...");
    const ringSize = 5;
    const ringKeys = []; 
    for (let i = 0; i < ringSize; i++) {
        ringKeys.push(RingSignature.generateKeyPair());
    }
    
    const signerIndex = 2;
    const signer = ringKeys[signerIndex];
    const publicKeysHex = ringKeys.map(k => k.pk);
    const message = "Vote for Privacy";
    
    // KHAI BÁO BIẾN TOÀN CỤC
    let signature;

    // --- GROUP 1 ---
    console.log("\n--- GROUP 1: SIGNATURE VERIFICATION ATTACKS ---");
    try {
        // SV-01
        signature = await RingSignature.createRingSignature(message, publicKeysHex, signer.sk, signerIndex);
        const isValid = await RingSignature.verifyRingSignature(message, signature, publicKeysHex);
        assert.equal(isValid, true);
        console.log("✅ SV-01: Valid Signature -> PASS");

        // SV-02
        const isTamperedMsgValid = await RingSignature.verifyRingSignature("Hacker", signature, publicKeysHex);
        assert.equal(isTamperedMsgValid, false);
        console.log("✅ SV-02: Tampered Message -> PASS");

        // SV-03
        const fakeRing = [...publicKeysHex];
        fakeRing[0] = RingSignature.generateKeyPair().pk;
        const isFakeRingValid = await RingSignature.verifyRingSignature(message, signature, fakeRing);
        assert.equal(isFakeRingValid, false);
        console.log("✅ SV-03: Tampered Ring Members -> PASS");

        // SV-04: Malformed Signature
        const fakeSig = { ...signature, s: [...signature.s] };
        // Sửa giá trị s[0]
        const badS = (BigInt('0x' + fakeSig.s[0]) + 1n).toString(16).padStart(64, '0');
        fakeSig.s[0] = badS;
        
        const isMalformedValid = await RingSignature.verifyRingSignature(message, fakeSig, publicKeysHex);
        assert.equal(isMalformedValid, false);
        console.log("✅ SV-04: Malformed Signature -> PASS");

    } catch (e) {
        console.error("❌ LỖI FATAL TRONG GROUP 1:", e);
    }

    // --- GROUP 2 ---
    console.log("\n--- GROUP 2: DOUBLE SPEND ATTEMPTS ---");
    try {
        if (!signature) {
             console.log("⚠️ Skip Group 2 (Do Group 1 thất bại)");
        } else {
            const sig1 = signature;
            const sig2 = await RingSignature.createRingSignature("Transaction 2", publicKeysHex, signer.sk, signerIndex);

            assert.equal(sig1.keyImage, sig2.keyImage);
            console.log("✅ DS-01: Key Image Determinism -> PASS");

            const otherSigner = ringKeys[0];
            const sig3 = await RingSignature.createRingSignature("Tx 3", publicKeysHex, otherSigner.sk, 0);
            assert.notEqual(sig1.keyImage, sig3.keyImage);
            console.log("✅ DS-02: Key Image Uniqueness -> PASS");
        }
    } catch (e) {
        console.error("❌ LỖI GROUP 2:", e);
    }

    // --- GROUP 3 ---
    console.log("\n--- GROUP 3: ANONYMITY CHECKS ---");
    try {
        const sigA = await RingSignature.createRingSignature("Test", publicKeysHex, ringKeys[0].sk, 0);
        const sigB = await RingSignature.createRingSignature("Test", publicKeysHex, ringKeys[1].sk, 1);
        const sizeA = JSON.stringify(sigA).length;
        const sizeB = JSON.stringify(sigB).length;
        assert.equal(sizeA, sizeB);
        console.log("✅ AN-01: Signature Size Uniformity -> PASS");
    } catch (e) {
        console.error("❌ AN-01 FAIL:", e);
    }
}

runTests();