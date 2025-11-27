import { HEAggregator } from "../aggregator"
import { generateMockVotes } from "./generate_mock_data"
import { recordSample, BenchmarkSample } from "./metrics"
import { writeCsv } from "./export_csv"

function nowMs(): number {
  return performance.now()
}

async function runBenchmarks() {
  const aggregator = HEAggregator.createDemo()
  const anonymitySets = [8, 16, 32, 64]
  const runsPerSet = 5
  const samples: BenchmarkSample[] = []
  for (const set of anonymitySets) {
    for (let run = 0; run < runsPerSet; run++) {
      const trueVoters = Math.floor(set / 2)
      const batch = generateMockVotes(set, trueVoters)
      const encryptStart = nowMs()
      const encrypted = batch.votes.map(v => aggregator.encryptVote(v))
      const encryptEnd = nowMs()
      const aggregateStart = nowMs()
      const encTally = aggregator.aggregateVotes(encrypted)
      const aggregateEnd = nowMs()
      const decryptStart = nowMs()
      const tally = aggregator.decryptTally(encTally)
      const decryptEnd = nowMs()
      const sample = recordSample({
        anonymitySet: set,
        runIndex: run,
        encryptStart,
        encryptEnd,
        aggregateStart,
        aggregateEnd,
        decryptStart,
        decryptEnd,
        voterCount: batch.votes.length,
        tally
      })
      samples.push(sample)
      console.log(`set=${set} run=${run} tally=${tally} totalMs=${sample.totalMs.toFixed(3)}`)
    }
  }
  const outPath = writeCsv(samples, "benchmarks-output")
  console.log("CSV written to", outPath)
}

runBenchmarks().catch(e => {
  console.error(e)
  process.exit(1)
})