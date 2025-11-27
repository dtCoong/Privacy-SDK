export type ZkBenchmarkSample = {
  anonymitySet: number
  runIndex: number
  ringSigMs: number
  proofGenMs: number
  verifyMs: number
  totalMs: number
  proofSizeBytes: number
}

export function recordZkSample(params: {
  anonymitySet: number
  runIndex: number
  ringSigStart: number
  ringSigEnd: number
  proofGenMs: number
  verifyMs: number
  proofSizeBytes: number
}): ZkBenchmarkSample {
  const ringSigMs = params.ringSigEnd - params.ringSigStart
  const totalMs = ringSigMs + params.proofGenMs + params.verifyMs
  return {
    anonymitySet: params.anonymitySet,
    runIndex: params.runIndex,
    ringSigMs,
    proofGenMs: params.proofGenMs,
    verifyMs: params.verifyMs,
    totalMs,
    proofSizeBytes: params.proofSizeBytes
  }
}