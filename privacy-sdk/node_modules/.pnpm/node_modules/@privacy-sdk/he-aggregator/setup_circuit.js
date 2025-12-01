const fs = require("fs");
const path = require("path");

function copyFile(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  console.log(`Copied ${src} -> ${dest}`);
}

function main() {
  const srcCircuitsPkg = path.join(__dirname, "..", "circuits");
  const srcCircomDir = path.join(srcCircuitsPkg, "circuits");
  const srcArtifactsDir = path.join(srcCircuitsPkg, "artifacts");

  const dstCircuitsDir = path.join(__dirname, "circuits");

  copyFile(
    path.join(srcCircomDir, "transfer.circom"),
    path.join(dstCircuitsDir, "transfer.circom")
  );
  copyFile(
    path.join(srcArtifactsDir, "transfer.r1cs"),
    path.join(dstCircuitsDir, "transfer.r1cs")
  );
  copyFile(
    path.join(srcArtifactsDir, "transfer_final.zkey"),
    path.join(dstCircuitsDir, "transfer_final.zkey")
  );
  copyFile(
    path.join(srcArtifactsDir, "verification_key.json"),
    path.join(dstCircuitsDir, "verification_key.json")
  );
  copyFile(
    path.join(srcArtifactsDir, "transfer_js", "transfer.wasm"),
    path.join(dstCircuitsDir, "transfer_js", "transfer.wasm")
  );
}

main();
