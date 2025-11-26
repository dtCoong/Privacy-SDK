import { expect } from "chai";
import RingSignatureLib from "../libs/ringsig/index";

describe("RingSignatureLib (unit)", () => {
  it("generate keys, sign and verify message", () => {
    const kp = RingSignatureLib.generateKeyPair();
    expect(kp.publicKey).to.be.a("string");
    expect(kp.secretKey).to.be.a("string");

    const msg = "hello ring";
    const sigHex = RingSignatureLib.signMessage(msg, kp.secretKey);
    expect(sigHex).to.be.a("string");

    const ok = RingSignatureLib.verifyMessage(msg, sigHex, kp.publicKey);
    expect(ok).to.equal(true);
  });

  it("createRingSignature & verifyRingSignature with a set", () => {
    const keys = Array.from({ length: 4 }, () =>
      RingSignatureLib.generateKeyPair()
    );
    const publicKeys = keys.map((k) => k.publicKey);
    const signerIndex = 2;
    const message = "transfer:alice->bob:100";

    const sig = RingSignatureLib.createRingSignature(
      message,
      publicKeys,
      signerIndex,
      keys[signerIndex].secretKey
    );
    expect(sig).to.have.property("signature");
    expect(sig).to.have.property("publicKey");

    const ok = RingSignatureLib.verifyRingSignature(message, sig, publicKeys);
    expect(ok).to.equal(true);

    // Tampered message should not verify
    const bad = RingSignatureLib.verifyRingSignature(
      "transfer:alice->bob:101",
      sig,
      publicKeys
    );
    expect(bad).to.equal(false);
  });
});
