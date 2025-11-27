import csv
from collections import defaultdict
from statistics import mean
from pathlib import Path

import matplotlib.pyplot as plt

def load_samples(csv_path):
    rows = []
    with open(csv_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append(row)
    return rows

def group_by_anonymity(rows, field):
    groups = defaultdict(list)
    for r in rows:
        k = int(r["anonymitySet"])
        v = float(r[field])
        groups[k].append(v)
    xs = sorted(groups.keys())
    ys = [mean(groups[k]) for k in xs]
    return xs, ys

def plot_from_csv(csv_path):
    rows = load_samples(csv_path)
    xs, proof_time = group_by_anonymity(rows, "encryptMs")
    _, agg_time = group_by_anonymity(rows, "aggregateMs")
    _, total_time = group_by_anonymity(rows, "totalMs")
    plt.figure()
    plt.plot(xs, proof_time, marker="o")
    plt.xlabel("Anonymity set size")
    plt.ylabel("Average encryptMs")
    plt.title("Encryption time vs anonymity set")
    plt.grid(True)
    out1 = Path(csv_path).with_suffix(".encrypt.png")
    plt.savefig(out1)
    plt.close()
    plt.figure()
    plt.plot(xs, agg_time, marker="o")
    plt.xlabel("Anonymity set size")
    plt.ylabel("Average aggregateMs")
    plt.title("Aggregation time vs anonymity set")
    plt.grid(True)
    out2 = Path(csv_path).with_suffix(".aggregate.png")
    plt.savefig(out2)
    plt.close()
    plt.figure()
    plt.plot(xs, total_time, marker="o")
    plt.xlabel("Anonymity set size")
    plt.ylabel("Average totalMs")
    plt.title("Total time vs anonymity set")
    plt.grid(True)
    out3 = Path(csv_path).with_suffix(".total.png")
    plt.savefig(out3)
    plt.close()
    print("Saved plots:", out1, out2, out3)

if __name__ == "__main__":
    default_csv = Path("benchmarks-output/he_benchmarks.csv")
    if not default_csv.exists():
        raise SystemExit(f"CSV not found at {default_csv}")
    plot_from_csv(default_csv)