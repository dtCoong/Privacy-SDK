import { ed25519 } from "@noble/curves/ed25519";
import { sha512 } from "@noble/hashes/sha512";
import { randomBytes } from 'crypto';
import { Buffer } from 'buffer';

const Point = ed25519.ExtendedPoint || ed25519.Point;
const BASE = Point.BASE;
const ORDER = BigInt('0x1000000000000000000000000000000014def9dea2f79cd65812631a5cf5d3ed');

// --- HELPER FUNCTIONS ---

function mod(a, m = ORDER) {
  const r = a % m;
  return r < 0n ? r + m : r;
}

function bytesToBigIntLE(bytes) {
  const hex = Buffer.from(bytes).toString('hex');
  return BigInt('0x' + hex.match(/../g).reverse().join(''));
}

function concat(...parts) {
  const bufs = parts.map(p => {
    if (p instanceof Uint8Array) return Buffer.from(p);
    if (typeof p === 'string') return Buffer.from(p, 'utf-8');
    return Buffer.from(p);
  });
  return Uint8Array.from(Buffer.concat(bufs));
}

function hashToScalar(...parts) {
  const h = sha512(concat(...parts));
  return mod(bytesToBigIntLE(h));
}

function randomScalar() {
  return mod(bytesToBigIntLE(randomBytes(64)));
}

async function pubkeyToPoint(pub) {
  const hex = typeof pub === 'string' ? pub : Buffer.from(pub).toString('hex');
  return Point.fromHex(hex);
}

// --- DETERMINISTIC HASH TO POINT ---
async function hashToPoint(pkPoint) {
    let nonce = 0;
    const pkBytes = pkPoint.toRawBytes();
    
    while (nonce < 10000) {
        const nonceBuf = Buffer.alloc(4);
        nonceBuf.writeUInt32LE(nonce, 0);
        
        try {
            const h = sha512(concat(pkBytes, nonceBuf));
            return Point.fromHex(Buffer.from(h.slice(0, 32)).toString('hex'));
        } catch (e) {
            nonce++;
        }
    }
    throw new Error("HashToPoint failed");
}

// --- MAIN CLASS ---
export class RingSignature {

  static generateKeyPair() {
    const secretBytes = randomBytes(32);
    const secretScalar = mod(bytesToBigIntLE(secretBytes));
    const pubPoint = BASE.multiply(secretScalar);
    
    return {
      sk: secretScalar.toString(16).padStart(64, '0'),
      pk: pubPoint.toHex()
    };
  }

  static async createRingSignature(message, publicKeysHex, signerSecretKeyHex, signerIndex) {
    const n = publicKeysHex.length;
    // Dùng TextEncoder 
    const msgBytes = typeof message === 'string' ? new TextEncoder().encode(message) : message;
    
    const x = BigInt('0x' + signerSecretKeyHex); 
    const P = await Promise.all(publicKeysHex.map(h => pubkeyToPoint(h)));
    
    // 1. Key Image
    const HpP_signer = await hashToPoint(P[signerIndex]);
    const I = HpP_signer.multiply(x); 

    // 2. Alpha
    const alpha = randomScalar();

    const c = new Array(n).fill(0n);
    const s = new Array(n).fill(0n);

    // 3. Step 1: Signer -> Next
    let L = BASE.multiply(alpha);
    let R = HpP_signer.multiply(alpha);
    
    let idx = (signerIndex + 1) % n;
    c[idx] = hashToScalar(msgBytes, L.toRawBytes(), R.toRawBytes());

    // 4. Step 2: Loop decoys
    while (idx !== signerIndex) {
        s[idx] = randomScalar(); 
        const HpP_i = await hashToPoint(P[idx]);

        // L = s[i]*G + c[i]*P[i]
        L = BASE.multiply(s[idx]).add(P[idx].multiply(c[idx]));
        
        // R = s[i]*Hp(P[i]) + c[i]*I
        R = HpP_i.multiply(s[idx]).add(I.multiply(c[idx]));

        const nextIdx = (idx + 1) % n;
        c[nextIdx] = hashToScalar(msgBytes, L.toRawBytes(), R.toRawBytes());
        
        idx = nextIdx;
    }

    // 5. Close ring
    s[signerIndex] = mod(alpha - c[signerIndex] * x);

    return {
      keyImage: I.toHex(),
      c0: c[0].toString(16).padStart(64, '0'),
      s: s.map(val => val.toString(16).padStart(64, '0'))
    };
  }

  static async verifyRingSignature(message, signature, publicKeysHex) {
    try {
        const n = publicKeysHex.length;
        if (signature.s.length !== n) return false;
        if (!signature.keyImage) return false;

        const msgBytes = typeof message === 'string' ? new TextEncoder().encode(message) : message;
        
        const s = signature.s.map(val => BigInt('0x' + val));
        const c0_input = BigInt('0x' + signature.c0);
        
        const I = await pubkeyToPoint(signature.keyImage);
        const P = await Promise.all(publicKeysHex.map(h => pubkeyToPoint(h)));

        // Bắt đầu từ e[0] (c0)
        let c_i = c0_input;
        
        for (let i = 0; i < n; i++) {
            const HpP_i = await hashToPoint(P[i]);

            // L = s[i]*G + c[i]*P[i]
            const L = BASE.multiply(s[i]).add(P[i].multiply(c_i));
            
            // R = s[i]*Hp(P[i]) + c[i]*I
            const R = HpP_i.multiply(s[i]).add(I.multiply(c_i));

            // Tính c[i+1]
            const c_next = hashToScalar(msgBytes, L.toRawBytes(), R.toRawBytes());
            
            // Nếu đây là bước cuối cùng (i = n-1), c_next chính là c[0] tính lại
            if (i === n - 1) {
                return c_next === c0_input;
            }
            
            c_i = c_next;
        }
        return false;
    } catch (e) {
        return false;
    }
  }
}