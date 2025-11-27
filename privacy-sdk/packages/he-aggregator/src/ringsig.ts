import { ed25519 } from "@noble/curves/ed25519"
import { sha512 } from "@noble/hashes/sha512"
import { randomBytes } from "crypto"

const Point: any = (ed25519 as any).ExtendedPoint || (ed25519 as any).Point
const ORDER = BigInt("0x1000000000000000000000000000000014def9dea2f79cd65812631a5cf5d3ed")

function mod(a: bigint, m: bigint = ORDER): bigint {
  const r = a % m
  return r < 0n ? r + m : r
}

function bytesToBigIntLE(bytes: Uint8Array): bigint {
  const hex = Buffer.from(bytes).toString("hex")
  const rev = hex.match(/../g)?.reverse().join("") ?? ""
  return BigInt("0x" + rev)
}

function concatBytes(parts: (Uint8Array | string)[]): Uint8Array {
  const bufs = parts.map(p => p instanceof Uint8Array ? Buffer.from(p) : Buffer.from(String(p)))
  return Uint8Array.from(Buffer.concat(bufs))
}

function hashToScalar(...parts: (Uint8Array | string)[]): bigint {
  const h = sha512(concatBytes(parts))
  return mod(bytesToBigIntLE(h))
}

function randomScalar(): bigint {
  return mod(bytesToBigIntLE(randomBytes(64)))
}

function fromHex(hex: string): Uint8Array {
  return Uint8Array.from(Buffer.from(hex, "hex"))
}

async function pubkeyToPoint(pubHex: string): Promise<any> {
  return Point.fromHex(pubHex)
}

export type RingSignatureData = {
  e0: string
  s: string[]
}

export class RingSignature {
  static generateKeyPair(): { sk: string; pk: string } {
    const secretBytes = randomBytes(32)
    const secretScalar = mod(bytesToBigIntLE(secretBytes))
    const pubPoint = Point.BASE.multiply(secretScalar)
    return {
      sk: secretScalar.toString(16).padStart(64, "0"),
      pk: pubPoint.toHex()
    }
  }

  static async createRingSignature(message: string | Uint8Array, publicKeysHex: string[], signerSecretKeyHex: string, signerIndex: number): Promise<RingSignatureData> {
    const n = publicKeysHex.length
    if (signerIndex < 0 || signerIndex >= n) {
      throw new Error("invalid signer index")
    }
    const msgBytes = typeof message === "string" ? new TextEncoder().encode(message) : message
    const x = BigInt("0x" + signerSecretKeyHex)
    const P = await Promise.all(publicKeysHex.map(h => pubkeyToPoint(h)))
    const u = randomScalar()
    const s: bigint[] = new Array(n).fill(0n)
    const e: bigint[] = new Array(n).fill(0n)
    const U = Point.BASE.multiply(u)
    const Ubytes = fromHex(U.toHex())
    e[(signerIndex + 1) % n] = hashToScalar(msgBytes, Ubytes)
    let i = (signerIndex + 1) % n
    while (i !== signerIndex) {
      s[i] = randomScalar()
      const R = Point.BASE.multiply(s[i]).add(P[i].multiply(e[i]))
      const Rbytes = fromHex(R.toHex())
      e[(i + 1) % n] = hashToScalar(msgBytes, Rbytes)
      i = (i + 1) % n
    }
    s[signerIndex] = mod(u - e[signerIndex] * x)
    return {
      e0: e[0].toString(16).padStart(64, "0"),
      s: s.map(v => v.toString(16).padStart(64, "0"))
    }
  }

  static async verifyRingSignature(message: string | Uint8Array, signature: RingSignatureData, publicKeysHex: string[]): Promise<boolean> {
    const n = publicKeysHex.length
    if (signature.s.length !== n) {
      return false
    }
    const msgBytes = typeof message === "string" ? new TextEncoder().encode(message) : message
    const s = signature.s.map(h => BigInt("0x" + h))
    const e: bigint[] = new Array(n).fill(0n)
    e[0] = BigInt("0x" + signature.e0)
    const P = await Promise.all(publicKeysHex.map(h => pubkeyToPoint(h)))
    for (let i = 0; i < n; i++) {
      const R = Point.BASE.multiply(s[i]).add(P[i].multiply(e[i]))
      const Rbytes = fromHex(R.toHex())
      e[(i + 1) % n] = hashToScalar(msgBytes, Rbytes)
    }
    return e[0] === BigInt("0x" + signature.e0)
  }
}