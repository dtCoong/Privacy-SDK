import { performance } from "perf_hooks"
import { RingSignature } from "../ringsig"
import { runProofOnce } from "../zk/proof_pipeline"
import { ZkBenchmarkSample, recordZkSample } from "./zk_metrics"
import { writeZkCsv } from "./zk_export_csv"

function nowMs(): number {
  return performance.now()
}

async function runFullPipeline() {
  const wasmPath = process.env.ZK_WASM_PATH || "circuits/transfer.wasm"
  const zkeyPath = process.env.ZK_ZKEY_PATH || "circuits/transfer_final.zkey"
  const vkeyPath = process.env.ZK_VKEY_PATH || "circuits/verification_key.json"
  const inputPath = process.env.ZK_INPUT_PATH || "circuits/input.json"
  const anonymitySets = [8, 16, 32, 64]
  const runsPerSet = 3
  const samples: ZkBenchmarkSample[] = []
  for (const set of anonymitySets) {
    for (let run = 0; run < runsPerSet; run++) {
      const keys = []
      for (let i = 0; i < set; i++) {
        keys.push(RingSignature.generateKeyPair())
      }
      const signerIndex = Math.floor(Math.random() * set)
      const message = `transfer-${set}-${run}`
      const ringSigStart = nowMs()
      const sig = await RingSignature.createRingSignature(message, keys.map(k => k.pk), keys[signerIndex].sk, signerIndex)
      const ringSigEnd = nowMs()
      const ok = await RingSignature.verifyRingSignature(message, sig, keys.map(k => k.pk))
      if (!ok) {
        throw new Error("ring signature verification failed")
      }
      const proofRes = await runProofOnce({
        wasmPath,
        zkeyPath,
        vkeyPath,
        inputPath
      })
      const sample = recordZkSample({
        anonymitySet: set,
        runIndex: run,
        ringSigStart,
        ringSigEnd,
        proofGenMs: proofRes.proofGenMs,
        verifyMs: proofRes.verifyMs,
        proofSizeBytes: proofRes.proofSizeBytes
      })
      samples.push(sample)
      console.log(`set=${set} run=${run} ringSigMs=${sample.ringSigMs.toFixed(3)} proofGenMs=${sample.proofGenMs.toFixed(3)} verifyMs=${sample.verifyMs.toFixed(3)} totalMs=${sample.totalMs.toFixed(3)} size=${sample.proofSizeBytes}`)
    }
  }
  const out = writeZkCsv(samples, "benchmarks-output")
  console.log("zk pipeline CSV written to", out)
}

runFullPipeline().catch(e => {
  console.error(e)
  process.exit(1)
})