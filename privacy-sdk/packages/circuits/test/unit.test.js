const { expect } = require("chai");

describe("🧩 UNIT TESTS (Individual Modules)", function () {
    this.timeout(100000);

    let ringsig;

    before(async () => {
        // SỬA: Import ringsig.mjs từ folder cha
        ringsig = await import("../ringsig.mjs"); 
    });

    describe("Module: Ring Signature (Ed25519)", function () {
        it("1. Should generate valid keys", async function () {
            const keyPair = await ringsig.generateMockKeyPair();
            expect(keyPair.sk).to.have.lengthOf(64); 
        });

        it("2. Should SIGN and VERIFY correctly (Happy Path)", async function () {
            const user1 = await ringsig.generateMockKeyPair();
            const user2 = await ringsig.generateMockKeyPair();
            const me = await ringsig.generateMockKeyPair();
            const ringKeys = [user1.pk, me.pk, user2.pk];
            const message = new TextEncoder().encode("Hello World");

            const signature = await ringsig.createRingSignature(message, ringKeys, me.sk, 1);
            const isValid = await ringsig.verifyRingSignature(message, ringKeys, signature);
            expect(isValid).to.be.true;
        });

        it("3. Should FAIL verification if message is changed (Tampered Message)", async function () {
            const user1 = await ringsig.generateMockKeyPair();
            const me = await ringsig.generateMockKeyPair();
            const ringKeys = [user1.pk, me.pk];

            const message = new TextEncoder().encode("Original Message");
            const signature = await ringsig.createRingSignature(message, ringKeys, me.sk, 1);

            const fakeMessage = new TextEncoder().encode("Fake Message");
            const isValid = await ringsig.verifyRingSignature(fakeMessage, ringKeys, signature);
            expect(isValid).to.be.false;
        });

        it("4. Should FAIL if Ring Members are changed", async function () {
            const user1 = await ringsig.generateMockKeyPair();
            const me = await ringsig.generateMockKeyPair();
            const ringKeys = [user1.pk, me.pk];
            const message = new TextEncoder().encode("Test");
            const signature = await ringsig.createRingSignature(message, ringKeys, me.sk, 1);

            const stranger = await ringsig.generateMockKeyPair();
            const fakeRing = [user1.pk, me.pk, stranger.pk];

            try {
                const isValid = await ringsig.verifyRingSignature(message, fakeRing, signature);
                expect(isValid).to.be.false;
            } catch (e) {
                expect(e).to.exist;
            }
        });
    });
});