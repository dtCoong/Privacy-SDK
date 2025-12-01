import { RingSignature } from "./ringsig.js";
import { createHash } from "crypto";

export enum Denomination {
  SMALL = 10,
  MEDIUM = 100,
  LARGE = 1000
}

interface DepositNote {
  secretKey: string;
  publicKey: string;
  amount: Denomination;
  timestamp: number;
}

interface MixerState {
  publicKeys: string[];
  nullifiers: Set<string>;
}

export class PrivacyMixer {
  private state: MixerState;

  constructor() {
    this.state = {
      publicKeys: [],
      nullifiers: new Set()
    };
  }

  async deposit(amount: Denomination): Promise<string> {
    const keyPair = RingSignature.generateKeyPair();

    this.state.publicKeys.push(keyPair.pk);

    const note: DepositNote = {
      secretKey: keyPair.sk,
      publicKey: keyPair.pk,
      amount,
      timestamp: Date.now()
    };

    const noteString = JSON.stringify(note);
    return Buffer.from(noteString).toString("base64");
  }

  async withdraw(
    noteString: string,
    recipientAddress: string,
    withdrawDelaySeconds: number = 0
  ): Promise<boolean> {
    const noteJson = Buffer.from(noteString, "base64").toString("utf-8");
    const note: DepositNote = JSON.parse(noteJson);

    const currentTime = Date.now();
    const minWithdrawTime = note.timestamp + withdrawDelaySeconds * 1000;
    if (currentTime < minWithdrawTime) {
      const waitTime = Math.ceil((minWithdrawTime - currentTime) / 1000);
      throw new Error(`Withdrawal locked. Please wait ${waitTime}s.`);
    }

    const nullifier = createHash("sha256")
      .update(note.secretKey)
      .digest("hex");

    if (this.state.nullifiers.has(nullifier)) {
      throw new Error("Double spending detected! Note already used.");
    }

    const ringSize = 5;
    const { ring, signerIndex } = this.getAnonymitySet(
      note.publicKey,
      ringSize
    );

    const message = recipientAddress + nullifier;

    console.log("Signing ring signature...");

    const signature = await RingSignature.createRingSignature(
      message,
      ring,
      note.secretKey,
      signerIndex
    );

    const isValid = await RingSignature.verifyRingSignature(
      message,
      signature,
      ring
    );
    if (!isValid) {
      throw new Error("Invalid Ring Signature! Authentication failed.");
    }

    this.state.nullifiers.add(nullifier);
    console.log(`[SUCCESS] Withdrawn ${note.amount} to ${recipientAddress}`);

    return true;
  }

  private getAnonymitySet(
    myPublicKey: string,
    size: number
  ): { ring: string[]; signerIndex: number } {
    const pool = this.state.publicKeys;

    if (pool.length < size) {
      const ring = Array(size).fill(myPublicKey);
      return { ring, signerIndex: 0 };
    }

    const otherKeys = pool.filter((k) => k !== myPublicKey);

    const decoys = otherKeys.sort(() => 0.5 - Math.random()).slice(0, size - 1);

    const signerIndex = Math.floor(Math.random() * size);
    const ring = [...decoys];
    ring.splice(signerIndex, 0, myPublicKey);

    while (ring.length < size) {
      ring.push(otherKeys[0] || myPublicKey);
    }

    return { ring, signerIndex };
  }
}
