import nacl from "tweetnacl";

export type KeyPair = {
  publicKey: string;
  secretKey: string;
};

export type SimpleSignature = {
  signature: string;
  publicKey: string;
};

function toHex(u8: Uint8Array) {
  return Buffer.from(u8).toString("hex");
}

function fromHex(hex: string) {
  return new Uint8Array(Buffer.from(hex, "hex"));
}

export class RingSignatureLib {
  static generateKeyPair(): KeyPair {
    const kp = nacl.sign.keyPair();
    return { publicKey: toHex(kp.publicKey), secretKey: toHex(kp.secretKey) };
  }

  static signMessage(message: string, secretKeyHex: string): string {
    const msgU8 = Buffer.from(message, "utf8");
    const sk = fromHex(secretKeyHex);
    const sig = nacl.sign.detached(msgU8, sk);
    return toHex(sig);
  }

  static verifyMessage(
    message: string,
    signatureHex: string,
    publicKeyHex: string
  ): boolean {
    const msgU8 = Buffer.from(message, "utf8");
    const sig = fromHex(signatureHex);
    const pk = fromHex(publicKeyHex);
    return nacl.sign.detached.verify(msgU8, sig, pk);
  }

  static createRingSignature(
    message: string,
    publicKeys: string[],
    signerIndex: number,
    secretKeyHex: string
  ): SimpleSignature {
    const sig = this.signMessage(message, secretKeyHex);
    const publicKey = publicKeys[signerIndex];
    return { signature: sig, publicKey };
  }

  static verifyRingSignature(
    message: string,
    signature: SimpleSignature,
    publicKeys: string[]
  ): boolean {
    for (const pk of publicKeys) {
      if (this.verifyMessage(message, signature.signature, pk)) return true;
    }
    return false;
  }
}

export default RingSignatureLib;
