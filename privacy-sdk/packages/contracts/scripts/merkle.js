#!/usr/bin/env node
const { keccak256, toUtf8Bytes } = require("ethers").utils;

function hashLeaf(value) {
  return keccak256(toUtf8Bytes(String(value)));
}

function buildTree(leaves) {
  if (leaves.length === 0)
    return { root: keccak256(toUtf8Bytes("")), layers: [] };
  let layer = leaves.map(hashLeaf);
  const layers = [layer];
  while (layer.length > 1) {
    const next = [];
    for (let i = 0; i < layer.length; i += 2) {
      if (i + 1 === layer.length) {
        next.push(
          keccak256(Buffer.from(layer[i].slice(2) + layer[i].slice(2), "hex"))
        );
      } else {
        next.push(
          keccak256(
            Buffer.from(layer[i].slice(2) + layer[i + 1].slice(2), "hex")
          )
        );
      }
    }
    layer = next;
    layers.push(layer);
  }
  return { root: layer[0], layers };
}

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log("Usage: node scripts/merkle.js <leaf1> <leaf2> ...");
    process.exit(1);
  }
  const res = buildTree(args);
  console.log("Leaves:");
  args.forEach((v, i) => console.log(i, v, "->", hashLeaf(v)));
  console.log("\nRoot:", res.root);
}

module.exports = { hashLeaf, buildTree };
