import * as fs from "fs"
import * as path from "path"
import { BenchmarkSample } from "./metrics"

export function writeCsv(samples: BenchmarkSample[], outDir: string, filename = "he_benchmarks.csv"): string {
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true })
  }
  const full = path.join(outDir, filename)
  const header = [
    "anonymitySet",
    "runIndex",
    "encryptMs",
    "aggregateMs",
    "decryptMs",
    "totalMs",
    "voterCount",
    "tally"
  ]
  const lines = [header.join(",")]
  for (const s of samples) {
    lines.push([
      s.anonymitySet,
      s.runIndex,
      s.encryptMs.toFixed(3),
      s.aggregateMs.toFixed(3),
      s.decryptMs.toFixed(3),
      s.totalMs.toFixed(3),
      s.voterCount,
      s.tally
    ].join(","))
  }
  fs.writeFileSync(full, lines.join("\n"), "utf8")
  return full
}