export type PaillierPublicKey = {
  n: bigint
  g: bigint
  n2: bigint
}

export type PaillierPrivateKey = {
  lambda: bigint
  mu: bigint
  pub: PaillierPublicKey
}

function gcd(a: bigint, b: bigint): bigint {
  while (b !== 0n) {
    const t = b
    b = a % b
    a = t
  }
  return a
}

function lcm(a: bigint, b: bigint): bigint {
  return (a * b) / gcd(a, b)
}

function egcd(a: bigint, b: bigint): { g: bigint; x: bigint; y: bigint } {
  let x0 = 1n
  let y0 = 0n
  let x1 = 0n
  let y1 = 1n
  while (b !== 0n) {
    const q = a / b
    const r = a % b
    a = b
    b = r
    const nx = x0 - q * x1
    const ny = y0 - q * y1
    x0 = x1
    y0 = y1
    x1 = nx
    y1 = ny
  }
  return { g: a, x: x0, y: y0 }
}

function modInv(a: bigint, n: bigint): bigint {
  const { g, x } = egcd(a, n)
  if (g !== 1n && g !== -1n) {
    throw new Error("modular inverse does not exist")
  }
  return ((x % n) + n) % n
}

function modPow(base: bigint, exp: bigint, mod: bigint): bigint {
  let result = 1n
  let b = base % mod
  let e = exp
  while (e > 0n) {
    if (e & 1n) {
      result = (result * b) % mod
    }
    b = (b * b) % mod
    e >>= 1n
  }
  return result
}

function randomBetween(min: bigint, max: bigint): bigint {
  const range = max - min
  const bytes = 16
  let num = 0n
  const buf = new Uint8Array(bytes)
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
    crypto.getRandomValues(buf)
  } else {
    for (let i = 0; i < bytes; i++) {
      buf[i] = Math.floor(Math.random() * 256)
    }
  }
  for (let i = 0; i < bytes; i++) {
    num = (num << 8n) + BigInt(buf[i])
  }
  return min + (num % range)
}

export function createDemoKeypair(): { pub: PaillierPublicKey; priv: PaillierPrivateKey } {
  const p = 10663n
  const q = 10687n
  const n = p * q
  const lambda = lcm(p - 1n, q - 1n)
  const g = n + 1n
  const n2 = n * n
  const x = modPow(g, lambda, n2)
  const l = (x - 1n) / n
  const mu = modInv(l, n)
  const pub: PaillierPublicKey = { n, g, n2 }
  const priv: PaillierPrivateKey = { lambda, mu, pub }
  return { pub, priv }
}

export function encrypt(m: bigint, pub: PaillierPublicKey, r?: bigint): bigint {
  const n = pub.n
  const n2 = pub.n2
  const msg = ((m % n) + n) % n
  const rnd = r ?? randomBetween(1n, n)
  if (gcd(rnd, n) !== 1n) {
    throw new Error("r must be coprime with n")
  }
  const gm = modPow(pub.g, msg, n2)
  const rn = modPow(rnd, n, n2)
  return (gm * rn) % n2
}

export function decrypt(c: bigint, priv: PaillierPrivateKey): bigint {
  const n = priv.pub.n
  const n2 = priv.pub.n2
  const x = modPow(c, priv.lambda, n2)
  const l = (x - 1n) / n
  const m = (l * priv.mu) % n
  return ((m % n) + n) % n
}

export function addCiphertexts(ciphertexts: bigint[], pub: PaillierPublicKey): bigint {
  const n2 = pub.n2
  return ciphertexts.reduce((acc, c) => (acc * (c % n2)) % n2, 1n)
}