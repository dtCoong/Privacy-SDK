export type BenchmarkSample = {
  anonymitySet: number
  runIndex: number
  encryptMs: number
  aggregateMs: number
  decryptMs: number
  totalMs: number
  voterCount: number
  tally: number
}

export function recordSample(params: {
  anonymitySet: number
  runIndex: number
  encryptStart: number
  encryptEnd: number
  aggregateStart: number
  aggregateEnd: number
  decryptStart: number
  decryptEnd: number
  voterCount: number
  tally: number
}): BenchmarkSample {
  const encryptMs = params.encryptEnd - params.encryptStart
  const aggregateMs = params.aggregateEnd - params.aggregateStart
  const decryptMs = params.decryptEnd - params.decryptStart
  const totalMs = params.decryptEnd - params.encryptStart
  return {
    anonymitySet: params.anonymitySet,
    runIndex: params.runIndex,
    encryptMs,
    aggregateMs,
    decryptMs,
    totalMs,
    voterCount: params.voterCount,
    tally: params.tally
  }
}