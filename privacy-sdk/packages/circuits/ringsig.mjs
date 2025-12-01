/*
  ringsig.mjs (MATHEMATICALLY SAFE VERSION)
  - Fix lỗi "bad number: out of range" bằng cách dùng mod()
  - Cải thiện hàm chuyển đổi bytesToBigIntLE an toàn hơn
*/

import * as ed25519 from "@noble/ed25519";
import { randomBytes, createHash } from 'crypto';

// 1. HÀM HASH & HELPER
function sha512(input) {
  return createHash('sha512').update(input).digest();
}

function concat(...parts) {
  const bufs = parts.map(p => {
    if (typeof p === 'string') return Buffer.from(p, 'utf8');
    if (p instanceof Uint8Array) return Buffer.from(p);
    return Buffer.from(String(p));
  });
  return Uint8Array.from(Buffer.concat(bufs));
}

// 2. CONSTANTS
// Tự động nhận diện class Point
const Point = ed25519.Point || ed25519.ExtendedPoint;
const ORDER = BigInt('0x1000000000000000000000000000000014def9dea2f79cd65812631a5cf5d3ed');

// --- CÁC HÀM TOÁN HỌC CƠ BẢN (Đã tối ưu) ---

// Hàm chuyển đổi Little Endian an toàn (Không dùng Regex)
function bytesToBigIntLE(uint8a) {
    let value = 0n;
    for (let i = uint8a.length - 1; i >= 0; i--) {
        value = (value << 8n) + BigInt(uint8a[i]);
    }
    return value;
}

function mod(a, m = ORDER) {
  let r = a % m;
  return r < 0n ? r + m : r;
}

function hashToScalar(...parts) {
  const h = sha512(concat(...parts));
  return mod(bytesToBigIntLE(h));
}

function randomScalar() {
  return mod(bytesToBigIntLE(randomBytes(64)));
}

function fromHex(hex) {
  return Uint8Array.from(Buffer.from(hex, 'hex'));
}

async function pubkeyToPoint(pub) {
  return Point.fromHex(Buffer.from(pub).toString('hex'));
}

// --- HELPER: Hàm tạo Key Pair hợp lệ (MANUAL & SAFE) ---
export async function generateMockKeyPair() {
    const sk = randomBytes(32); // Seed gốc (32 bytes)

    // Bước 1: Hash seed bằng SHA512
    const hashedSk = sha512(sk);
    
    // Bước 2: Lấy 32 bytes đầu (Private Scalar)
    const s = Uint8Array.from(hashedSk.subarray(0, 32));
    
    // Bước 3: "Clamp" bits theo chuẩn Ed25519
    s[0] &= 248;
    s[31] &= 127;
    s[31] |= 64;
    
    // Bước 4: Chuyển thành số BigInt
    const scalar = bytesToBigIntLE(s);
    
    // Bước 5: Nhân với điểm cơ sở (Base Point)
    // QUAN TRỌNG: Dùng mod(scalar) để tránh lỗi "out of range"
    const pkPoint = Point.BASE.multiply(mod(scalar));
    const pk = pkPoint.toHex();

    return {
        sk: Buffer.from(sk).toString('hex'),
        pk: pk
    };
}

// --- LOGIC RING SIGNATURE ---

export async function createRingSignature(message, pubkeysHex, secretKeyHex, signerIndex) {
  const n = pubkeysHex.length;
  if (signerIndex < 0 || signerIndex >= n) throw new Error('Invalid signer index');

  // Xử lý Private Key
  const skBytes = Buffer.from(secretKeyHex, 'hex');
  const hashedSk = sha512(skBytes);
  const s = Uint8Array.from(hashedSk.subarray(0, 32));
  s[0] &= 248;
  s[31] &= 127;
  s[31] |= 64;
  
  const xRaw = bytesToBigIntLE(s);
  const x = mod(xRaw); // Luôn mod để an toàn toán học

  const P = await Promise.all(pubkeysHex.map(h => pubkeyToPoint(fromHex(h))));

  const u = randomScalar();
  const s_vals = Array(n).fill(0n);
  const e = Array(n).fill(0n);

  // Tính U = u * G
  const U = Point.BASE.multiply(u);
  const Ubytes = fromHex(U.toHex());

  // Bước 1: Tính e cho người kế tiếp
  e[(signerIndex + 1) % n] = hashToScalar(message, Ubytes);

  // Bước 2: Đóng vòng tròn
  let i = (signerIndex + 1) % n;
  while (i !== signerIndex) {
    s_vals[i] = randomScalar();
    
    // R_i = s_i*G + e_i*P_i
    const R = Point.BASE.multiply(s_vals[i]).add(P[i].multiply(e[i]));
    const Rbytes = fromHex(R.toHex());
    
    e[(i + 1) % n] = hashToScalar(message, Rbytes);
    i = (i + 1) % n;
  }

  // Bước 3: Đóng ký
  // s[signer] = u - e[signer] * x
  s_vals[signerIndex] = mod(u - e[signerIndex] * x);

  return {
    e0: e[0].toString(16).padStart(64, '0'),
    s: s_vals.map(v => v.toString(16).padStart(64, '0'))
  };
}

export async function verifyRingSignature(message, pubkeysHex, signature) {
  const n = pubkeysHex.length;
  const s = signature.s.map(h => BigInt('0x' + h));
  const e = Array(n).fill(0n);

  e[0] = BigInt('0x' + signature.e0);

  const P = await Promise.all(pubkeysHex.map(h => pubkeyToPoint(fromHex(h))));

  for (let i = 0; i < n; i++) {
    const R = Point.BASE.multiply(s[i]).add(P[i].multiply(e[i]));
    const Rbytes = fromHex(R.toHex());
    e[(i + 1) % n] = hashToScalar(message, Rbytes);
  }

  return e[0] === BigInt('0x' + signature.e0);
}