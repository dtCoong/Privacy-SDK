import * as fs from "fs"
import * as path from "path"
import { performance } from "perf_hooks"
import * as snarkjs from "snarkjs"

export type ProofResult = {
  proofGenMs: number
  verifyMs: number
  proofSizeBytes: number
}

export type ProofConfig = {
  wasmPath: string
  zkeyPath: string
  vkeyPath: string
  inputPath: string
}

export async function runProofOnce(config: ProofConfig): Promise<ProofResult> {
  const inputRaw = fs.readFileSync(config.inputPath, "utf8")
  const input = JSON.parse(inputRaw)
  const wasm = path.resolve(config.wasmPath)
  const zkey = path.resolve(config.zkeyPath)
  const vkeyRaw = fs.readFileSync(config.vkeyPath, "utf8")
  const vkey = JSON.parse(vkeyRaw)
  const t0 = performance.now()
  // @ts-ignore
  const { proof, publicSignals } = await (snarkjs as any).groth16.fullProve(input, wasm, zkey)
  const t1 = performance.now()
  // @ts-ignore
  const ok = await (snarkjs as any).groth16.verify(vkey, publicSignals, proof)
  const t2 = performance.now()
  if (!ok) {
    throw new Error("proof verification failed")
  }
  const proofJson = JSON.stringify(proof)
  const proofSizeBytes = Buffer.byteLength(proofJson, "utf8")
  return {
    proofGenMs: t1 - t0,
    verifyMs: t2 - t1,
    proofSizeBytes
  }
}