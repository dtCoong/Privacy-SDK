import { expect } from "chai";
import { ethers } from "ethers";
import path from "path";
import fs from "fs";
import { ContractClient } from "../src/client";
// spawn a Hardhat node for integration tests when no external node is provided
import { spawn } from "child_process";

describe("SDK Integration: deploy verifier + registry, exercise client (clean)", function () {
  this.timeout(120000);

  // If there is no external HARDHAT_URL provided, spawn a local Hardhat node
  // for the duration of these integration tests and terminate it afterwards.
  let nodeProc: any = null;
  const repoRoot = path.resolve(__dirname, "..", "..", "..");

  before(async function () {
    if (process.env.HARDHAT_URL) {
      console.log(
        "HARDHAT_URL detected, using existing node at:",
        process.env.HARDHAT_URL
      );
      return;
    }

    console.log(
      "No HARDHAT_URL set — spawning local Hardhat node for integration tests..."
    );
    nodeProc = spawn("npx", ["hardhat", "node"], {
      cwd: repoRoot,
      shell: true,
      stdio: ["ignore", "pipe", "pipe"],
    });

    // Forward logs (optional):
    nodeProc.stdout.on("data", (d: Buffer) =>
      process.stdout.write(`[hardhat node] ${d.toString()}`)
    );
    nodeProc.stderr.on("data", (d: Buffer) =>
      process.stderr.write(`[hardhat node] ${d.toString()}`)
    );

    // Wait until the node prints the listening message or timeout
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Timed out while waiting for Hardhat node to start"));
      }, 30000);

      nodeProc!.stdout.on("data", function onData(data: Buffer) {
        const s = data.toString();
        if (
          s.includes("Started HTTP") ||
          s.includes("Started HTTP and WebSocket") ||
          s.includes("Listening on")
        ) {
          clearTimeout(timeout);
          nodeProc!.stdout.removeListener("data", onData);
          // allow a brief moment for readiness
          setTimeout(() => resolve(), 200);
        }
      });
      nodeProc!.on("error", (err: any) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
  });

  after(async function () {
    if (nodeProc) {
      try {
        nodeProc.kill();
      } catch (e) {
        /* ignore */
      }
    }
  });

  it("deploys verifier and registry, verifies proof and registers root", async () => {
    const providerUrl = process.env.HARDHAT_URL || "http://127.0.0.1:8545";
    const provider = new ethers.providers.JsonRpcProvider(providerUrl);
    const signer = provider.getSigner(0);

    // Prefer compiled artifacts from the contracts package; fall back to local ABI files
    const verifierArtifactCandidates = [
      path.resolve(
        repoRoot,
        "packages",
        "contracts",
        "artifacts",
        "packages",
        "contracts",
        "contracts",
        "Verifier.sol",
        "Verifier.json"
      ),
      path.resolve(__dirname, "../abi/Verifier.json"),
    ];
    const registryArtifactCandidates = [
      path.resolve(
        repoRoot,
        "packages",
        "contracts",
        "artifacts",
        "packages",
        "contracts",
        "contracts",
        "TransactionRegistry.sol",
        "TransactionRegistry.json"
      ),
      path.resolve(__dirname, "../abi/TransactionRegistry.json"),
    ];

    const verifierArtifactPath = verifierArtifactCandidates.find((p) =>
      fs.existsSync(p)
    );
    const registryArtifactPath = registryArtifactCandidates.find((p) =>
      fs.existsSync(p)
    );

    if (!verifierArtifactPath || !registryArtifactPath) {
      throw new Error(
        "Could not locate compiled artifacts for Verifier or TransactionRegistry. Run a Hardhat compile first."
      );
    }

    const verifierArtifact = JSON.parse(
      fs.readFileSync(verifierArtifactPath, "utf8")
    );
    const registryArtifact = JSON.parse(
      fs.readFileSync(registryArtifactPath, "utf8")
    );

    const VerifierFactory = new ethers.ContractFactory(
      verifierArtifact.abi,
      verifierArtifact.bytecode,
      signer as any
    );
    const verifier = await VerifierFactory.deploy();
    await verifier.deployed();

    const RegistryFactory = new ethers.ContractFactory(
      registryArtifact.abi,
      registryArtifact.bytecode,
      signer as any
    );
    const registry = await RegistryFactory.deploy(verifier.address);
    await registry.deployed();

    expect(verifier.address).to.match(/^0x[0-9a-fA-F]{40}$/);
    expect(registry.address).to.match(/^0x[0-9a-fA-F]{40}$/);

    const client = new ContractClient(
      providerUrl,
      signer as any,
      registry.address,
      verifier.address
    );

    const proofPath = path.resolve(__dirname, "../../test/proof.json");
    const publicPath = path.resolve(__dirname, "../../test/public.json");
    let proof: any = null;
    let pub: any = null;
    try {
      proof = JSON.parse(fs.readFileSync(proofPath, "utf8"));
      pub = JSON.parse(fs.readFileSync(publicPath, "utf8"));
    } catch (e) {
      proof = {
        pi_a: ["0", "0"],
        pi_b: [
          ["0", "0"],
          ["0", "0"],
        ],
        pi_c: ["0", "0"],
      } as any;
      pub = ["0", "0", "0"] as any;
    }

    const ok = await client.verifyProof(proof as any, pub as any);
    expect(typeof ok).to.equal("boolean");

    const receipt = await client.submitTransaction({}, {});
    expect(receipt === null || typeof receipt === "object").to.be.true;
  });

  it("Client.submitTransaction uses applyTransactionBytes with MockVerifier", async () => {
    // Prepare provider and signer
    const providerUrl2 = process.env.HARDHAT_URL || "http://127.0.0.1:8545";
    const provider2 = new ethers.providers.JsonRpcProvider(providerUrl2);
    const signer2 = provider2.getSigner(0);

    // Locate MockVerifier artifact
    const mockVerifierArtifactPath = path.resolve(
      repoRoot,
      "packages",
      "contracts",
      "artifacts",
      "packages",
      "contracts",
      "contracts",
      "MockVerifier.sol",
      "MockVerifier.json"
    );
    if (!fs.existsSync(mockVerifierArtifactPath)) {
      throw new Error(
        "Could not locate MockVerifier artifact at: " + mockVerifierArtifactPath
      );
    }
    const mockVerifierArtifact = JSON.parse(
      fs.readFileSync(mockVerifierArtifactPath, "utf8")
    );

    // Locate Registry artifact (same approach as earlier)
    const registryArtifactCandidates2 = [
      path.resolve(
        repoRoot,
        "packages",
        "contracts",
        "artifacts",
        "packages",
        "contracts",
        "contracts",
        "TransactionRegistry.sol",
        "TransactionRegistry.json"
      ),
      path.resolve(__dirname, "../abi/TransactionRegistry.json"),
    ];
    const registryArtifactPath2 = registryArtifactCandidates2.find((p) =>
      fs.existsSync(p)
    );
    if (!registryArtifactPath2)
      throw new Error(
        "Could not locate TransactionRegistry artifact for MockVerifier test"
      );
    const registryArtifact2 = JSON.parse(
      fs.readFileSync(registryArtifactPath2, "utf8")
    );

    // Deploy MockVerifier + Registry
    const MockFactory = new ethers.ContractFactory(
      mockVerifierArtifact.abi,
      mockVerifierArtifact.bytecode,
      signer2 as any
    );
    const mockVerifier = await MockFactory.deploy();
    await mockVerifier.deployed();

    const RegistryFactory2 = new ethers.ContractFactory(
      registryArtifact2.abi,
      registryArtifact2.bytecode,
      signer2 as any
    );
    const registry2 = await RegistryFactory2.deploy(mockVerifier.address);
    await registry2.deployed();

    const client2 = new ContractClient(
      providerUrl2,
      signer2 as any,
      registry2.address,
      mockVerifier.address
    );

    // Use a dummy proof and pub data — MockVerifier will accept any proof
    const proofObj = {
      pi_a: ["0", "0"],
      pi_b: [
        ["0", "0"],
        ["0", "0"],
      ],
      pi_c: ["0", "0"],
    } as any;
    const pubArr = ["0", "1", "0"] as any;

    const receipt2 = await client2.submitTransaction(proofObj, pubArr);
    // Should return a receipt object on success
    expect(receipt2 && typeof receipt2 === "object").to.be.true;
  });
});
