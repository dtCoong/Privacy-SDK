import { ed25519 } from '@noble/curves/ed25519';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils';

export class Ed25519Wrapper {
  static generateKeypair() {
    const privateKey = ed25519.utils.randomPrivateKey();
    const publicKey = ed25519.getPublicKey(privateKey);
    return {
      privateKey: bytesToHex(privateKey),
      publicKey: bytesToHex(publicKey)
    };
  }

  static async sign(message: string, privateKeyHex: string): Promise<string> {
    const msgBytes = new TextEncoder().encode(message);
    const signature = await ed25519.sign(msgBytes, hexToBytes(privateKeyHex));
    return bytesToHex(signature);
  }

  static async verify(
    signatureHex: string,
    message: string,
    publicKeyHex: string
  ): Promise<boolean> {
    const msgBytes = new TextEncoder().encode(message);
    return await ed25519.verify(
      hexToBytes(signatureHex),
      msgBytes,
      hexToBytes(publicKeyHex)
    );
  }
}
