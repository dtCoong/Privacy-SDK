const { expect } = require("chai");

describe("RingSignature unit tests", function () {
  let RingSignature;

  before(async function () {
    ({ RingSignature } = await import("../scripts/ringsig.mjs"));
  });

  it("creates and verifies a valid ring signature", async function () {
    const user1 = RingSignature.generateKeyPair();
    const user2 = RingSignature.generateKeyPair();
    const user3 = RingSignature.generateKeyPair();

    const ring = [user1.pk, user2.pk, user3.pk];
    const message = "unit-test-message";

    const signature = await RingSignature.createRingSignature(
      message,
      ring,
      user2.sk,
      1
    );

    const ok = await RingSignature.verifyRingSignature(
      message,
      signature,
      ring
    );

    expect(ok).to.equal(true);
  });

  it("rejects fake ring member", async function () {
    const user1 = RingSignature.generateKeyPair();
    const user2 = RingSignature.generateKeyPair();
    const user3 = RingSignature.generateKeyPair();
    const fake = RingSignature.generateKeyPair();

    const ring = [user1.pk, user2.pk, user3.pk];
    const message = "unit-test-message-fake";

    const signature = await RingSignature.createRingSignature(
      message,
      ring,
      user2.sk,
      1
    );

    const fakeRing = [user1.pk, fake.pk, user3.pk];

    const ok = await RingSignature.verifyRingSignature(
      message,
      signature,
      fakeRing
    );

    expect(ok).to.equal(false);
  });
});
