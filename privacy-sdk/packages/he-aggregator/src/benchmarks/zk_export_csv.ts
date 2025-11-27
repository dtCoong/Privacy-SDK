import * as fs from "fs"
import * as path from "path"
import { ZkBenchmarkSample } from "./zk_metrics"

export function writeZkCsv(samples: ZkBenchmarkSample[], outDir: string, filename = "zk_pipeline_benchmarks.csv"): string {
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true })
  }
  const full = path.join(outDir, filename)
  const header = [
    "anonymitySet",
    "runIndex",
    "ringSigMs",
    "proofGenMs",
    "verifyMs",
    "totalMs",
    "proofSizeBytes"
  ]
  const lines = [header.join(",")]
  for (const s of samples) {
    lines.push([
      s.anonymitySet,
      s.runIndex,
      s.ringSigMs.toFixed(3),
      s.proofGenMs.toFixed(3),
      s.verifyMs.toFixed(3),
      s.totalMs.toFixed(3),
      s.proofSizeBytes
    ].join(","))
  }
  fs.writeFileSync(full, lines.join("\n"), "utf8")
  return full
}