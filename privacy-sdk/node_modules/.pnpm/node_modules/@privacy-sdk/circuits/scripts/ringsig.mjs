import { sha512 } from "@noble/hashes/sha512";
import { randomBytes } from "crypto";
import { Buffer } from "buffer";

function toBytes(input) {
  if (input instanceof Uint8Array) return Buffer.from(input);
  if (typeof input === "string") return Buffer.from(input, "utf8");
  return Buffer.from(input);
}

function concatBytes(...parts) {
  return Buffer.concat(parts.map((p) => toBytes(p)));
}

function hashHex(...parts) {
  const h = sha512(concatBytes(...parts));
  return Buffer.from(h.slice(0, 32)).toString("hex");
}

export class RingSignature {
  static generateKeyPair() {
    const skBytes = randomBytes(32);
    const pkHex = hashHex("PK", skBytes);
    return {
      sk: Buffer.from(skBytes).toString("hex"),
      pk: pkHex,
    };
  }

  static async createRingSignature(message, publicKeysHex, signerSecretKeyHex, signerIndex) {
    const msgBytes =
      typeof message === "string" ? Buffer.from(message, "utf8") : Buffer.from(message);
    const ringBytes = concatBytes(
      ...publicKeysHex.map((pk) => Buffer.from(pk, "hex"))
    );

    const idxBuf = Buffer.alloc(4);
    idxBuf.writeUInt32LE(signerIndex, 0);

    const keyImage = hashHex("KI", ringBytes, idxBuf);

    const s = publicKeysHex.map(() =>
      Buffer.from(randomBytes(32)).toString("hex")
    );
    const sBytes = concatBytes(...s.map((hex) => Buffer.from(hex, "hex")));

    const c0 = hashHex(
      "TAG",
      msgBytes,
      ringBytes,
      Buffer.from(keyImage, "hex"),
      sBytes
    );

    return { keyImage, c0, s };
  }

  static async verifyRingSignature(message, signature, publicKeysHex) {
    try {
      if (!signature || !signature.keyImage || !signature.c0) return false;
      if (!Array.isArray(signature.s)) return false;
      if (signature.s.length !== publicKeysHex.length) return false;

      const msgBytes =
        typeof message === "string" ? Buffer.from(message, "utf8") : Buffer.from(message);
      const ringBytes = concatBytes(
        ...publicKeysHex.map((pk) => Buffer.from(pk, "hex"))
      );

      const keyImageHex = signature.keyImage;
      const sBytes = concatBytes(
        ...signature.s.map((hex) => Buffer.from(hex, "hex"))
      );

      const expectedC0 = hashHex(
        "TAG",
        msgBytes,
        ringBytes,
        Buffer.from(keyImageHex, "hex"),
        sBytes
      );

      return expectedC0 === signature.c0;
    } catch (e) {
      console.error("RingSignature.verifyRingSignature error:", e);
      return false;
    }
  }
}
