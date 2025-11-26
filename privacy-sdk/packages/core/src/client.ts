import { ethers } from "ethers";
import fs from "fs";
import path from "path";

// Import ABI từ các file JSON trong thư mục abi
import RegistryABI from "../abi/TransactionRegistry.json";
import VerifierABI from "../abi/Verifier.json"; // ABI của Groth16Verifier

export type Proof = {
  pi_a: [string, string];
  pi_b: [[string, string], [string, string]];
  pi_c: [string, string];
};

export class ContractClient {
  public registryContract!: ethers.Contract;
  public verifierContract!: ethers.Contract;
  public signer!: ethers.Signer;
  public provider!: ethers.providers.JsonRpcProvider;

  constructor(
    providerUrl: string,
    signerOrPrivateKey: string | ethers.Signer,
    registryAddress: string,
    verifierAddress: string,
    options?: {
      registryContract?: ethers.Contract;
      verifierContract?: ethers.Contract;
    }
  ) {
    this.provider = new ethers.providers.JsonRpcProvider(providerUrl);
    if (typeof signerOrPrivateKey === "string") {
      this.signer = new ethers.Wallet(signerOrPrivateKey, this.provider);
    } else {
      this.signer = signerOrPrivateKey;
      try {
        // @ts-ignore
        if (!this.signer.provider) {
          // @ts-ignore
          this.signer = (this.signer as ethers.Signer).connect(this.provider);
        }
      } catch (e) {}
    }

    if (options?.registryContract) {
      this.registryContract = options.registryContract;
    } else {
      // Prefer compiled artifact ABI from packages/contracts if available
      try {
        const repoRoot = path.resolve(__dirname, "..", "..", "..");
        const artifactPath = path.resolve(
          repoRoot,
          "packages",
          "contracts",
          "artifacts",
          "packages",
          "contracts",
          "contracts",
          "TransactionRegistry.sol",
          "TransactionRegistry.json"
        );
        if (fs.existsSync(artifactPath)) {
          const art = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
          this.registryContract = new ethers.Contract(
            registryAddress,
            art.abi,
            this.signer
          );
        } else {
          this.registryContract = new ethers.Contract(
            registryAddress,
            RegistryABI.abi,
            this.signer
          );
        }
      } catch (e) {
        this.registryContract = new ethers.Contract(
          registryAddress,
          RegistryABI.abi,
          this.signer
        );
      }
    }

    if (options?.verifierContract) {
      this.verifierContract = options.verifierContract;
    } else {
      this.verifierContract = new ethers.Contract(
        verifierAddress,
        VerifierABI.abi,
        this.signer
      );
    }

    (async () => {
      try {
        const addr = await this.signer.getAddress();
        console.log(`SDK Client initialized. Signer address: ${addr}`);
      } catch (e) {
        console.log(`SDK Client initialized. Signer configured.`);
      }
      console.log(
        ` - Connected to Registry at: ${this.registryContract.address}`
      );
      console.log(
        ` - Connected to Verifier at: ${this.verifierContract.address}`
      );
    })();
  }

  async verifyProof(
    proof: Proof,
    publicInputs: Array<string | number>
  ): Promise<boolean> {
    console.log("SDK: Calling verifyProof on contract...");
    try {
      const pA: [string, string] = [proof.pi_a[0], proof.pi_a[1]];
      const pB: [[string, string], [string, string]] = [
        [proof.pi_b[0][1], proof.pi_b[0][0]],
        [proof.pi_b[1][1], proof.pi_b[1][0]],
      ];
      const pC: [string, string] = [proof.pi_c[0], proof.pi_c[1]];
      const pSignals = publicInputs as any[];

      const result: boolean = await this.verifierContract.verifyProof(
        pA,
        pB,
        pC,
        pSignals
      );
      console.log("SDK: verifyProof result from contract:", result);
      return result;
    } catch (error) {
      console.error("SDK: Error calling verifyProof:", error);
      return false;
    }
  }

  async submitTransaction(
    proof: any,
    pubData: any
  ): Promise<ethers.providers.TransactionReceipt | null> {
    console.log(
      "SDK: Calling submitTransaction (currently calls registerRoot)..."
    );
    try {
      // If a proof and public inputs are provided, ABI-encode and call the bytes wrapper
      const hasProof = proof && proof.pi_a && proof.pi_b && proof.pi_c;
      const hasPub = Array.isArray(pubData) && pubData.length >= 1;

      if (hasProof && hasPub) {
        console.log(
          "SDK: Encoding proof + public inputs and calling applyTransactionBytes..."
        );

        // Prepare a,b,c in the same orientation used by verifyProof
        const pA: [string, string] = [proof.pi_a[0], proof.pi_a[1]];
        const pB: [[string, string], [string, string]] = [
          [proof.pi_b[0][1], proof.pi_b[0][0]],
          [proof.pi_b[1][1], proof.pi_b[1][0]],
        ];
        const pC: [string, string] = [proof.pi_c[0], proof.pi_c[1]];

        // Encode as expected by `applyTransactionBytes` wrapper: abi.encode(a,b,c) and abi.encode(uint256[3])
        const proofBytes = ethers.utils.defaultAbiCoder.encode(
          ["uint256[2]", "uint256[2][2]", "uint256[2]"],
          [pA, pB, pC]
        );

        // Ensure pubData is length 3; if not, pad with zeros
        const pubArr = pubData.slice(0, 3);
        while (pubArr.length < 3) pubArr.push("0");
        const pubBytes = ethers.utils.defaultAbiCoder.encode(
          ["uint256[3]"],
          [pubArr]
        );

        const txResponse: ethers.providers.TransactionResponse =
          await this.registryContract.applyTransactionBytes(
            proofBytes,
            pubBytes
          );
        console.log(
          `SDK: Transaction sent, hash: ${txResponse.hash}. Waiting for confirmation...`
        );
        const receipt: ethers.providers.TransactionReceipt =
          await txResponse.wait(1);
        console.log(
          `SDK: Transaction confirmed in block ${
            receipt.blockNumber
          }. Status: ${receipt.status === 1 ? "Success" : "Failed"}`
        );
        return receipt;
      }

      // Fallback behavior (existing): register a random test root
      const testRoot = ethers.utils.id(
        "testRoot_" + Math.random().toString(36).substring(7)
      );
      console.log(
        `SDK: Calling registryContract.registerRoot with root: ${testRoot}`
      );
      const txResponse: ethers.providers.TransactionResponse =
        await this.registryContract.registerRoot(testRoot);
      console.log(
        `SDK: Transaction sent, hash: ${txResponse.hash}. Waiting for confirmation...`
      );
      const receipt: ethers.providers.TransactionReceipt =
        await txResponse.wait(1);
      console.log(
        `SDK: Transaction confirmed in block ${receipt.blockNumber}. Status: ${
          receipt.status === 1 ? "Success" : "Failed"
        }`
      );
      return receipt;
    } catch (error) {
      console.error(
        "SDK: Error calling submitTransaction (registerRoot):",
        error
      );
      return null;
    }
  }

  async getTransactionEvents(
    fromBlock: number | string = 0,
    toBlock: number | string = "latest"
  ): Promise<any[]> {
    console.log(
      `SDK: Querying MerkleRootRegistered events from block ${fromBlock} to ${toBlock}...`
    );
    try {
      const filter = this.registryContract.filters.MerkleRootRegistered();
      const events: ethers.Event[] = await this.registryContract.queryFilter(
        filter,
        fromBlock,
        toBlock
      );

      console.log(`SDK: Found ${events.length} MerkleRootRegistered event(s).`);
      return events.map((event) => ({
        root: event.args?.root,
        blockNumber: event.blockNumber,
        timestamp: event.args?.timestamp
          ? new Date(event.args.timestamp.toNumber() * 1000).toLocaleString(
              "vi-VN"
            )
          : undefined,
        txHash: event.transactionHash,
      }));
    } catch (error) {
      console.error("SDK: Error querying events:", error);
      return [];
    }
  }

  async storeAggregateResult(
    resultHash: string,
    metadata: string | Uint8Array
  ): Promise<ethers.providers.TransactionReceipt | null> {
    try {
      const data =
        typeof metadata === "string"
          ? ethers.utils.toUtf8Bytes(metadata)
          : metadata;
      const tx: ethers.providers.TransactionResponse =
        await this.registryContract.storeAggregateResult(resultHash, data);
      const receipt = await tx.wait(1);
      return receipt;
    } catch (error) {
      console.error("SDK: Error calling storeAggregateResult:", error);
      return null;
    }
  }

  async merkleRootCount(): Promise<number> {
    try {
      const n: ethers.BigNumber = await this.registryContract.merkleRootCount();
      return n.toNumber();
    } catch (error) {
      console.error("SDK: Error calling merkleRootCount:", error);
      return 0;
    }
  }

  async merkleRootAt(idx: number): Promise<string | null> {
    try {
      const r: string = await this.registryContract.merkleRootAt(idx);
      return r;
    } catch (error) {
      console.error("SDK: Error calling merkleRootAt:", error);
      return null;
    }
  }
}
