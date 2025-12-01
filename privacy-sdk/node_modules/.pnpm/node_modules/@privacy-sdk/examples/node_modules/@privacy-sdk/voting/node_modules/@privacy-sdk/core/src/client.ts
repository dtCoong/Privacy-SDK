import {
  JsonRpcProvider,
  Wallet,
  Contract,
  AbiCoder,
  TransactionReceipt
} from "ethers"
import fs from "fs"
import path from "path"

export type Proof = {
  pi_a: [string, string]
  pi_b: [[string, string], [string, string]]
  pi_c: [string, string]
}

export class ContractClient {
  provider: JsonRpcProvider
  signer: Wallet
  registryContract: Contract
  verifierContract: Contract

  constructor(
    rpcUrl: string,
    privateKey: string,
    registryAddress: string,
    verifierAddress: string
  ) {
    this.provider = new JsonRpcProvider(rpcUrl)
    this.signer = new Wallet(privateKey, this.provider)

    const artifactsRoot = path.resolve(
      __dirname,
      "..",
      "..",
      "contracts",
      "artifacts",
      "contracts"
    )

    const registryArtifactPath = path.join(
      artifactsRoot,
      "TransactionRegistry.sol",
      "TransactionRegistry.json"
    )
    const registryArtifact = JSON.parse(
      fs.readFileSync(registryArtifactPath, "utf8")
    )

    this.registryContract = new Contract(
      registryAddress,
      registryArtifact.abi,
      this.signer
    )

    const verifierArtifactPath = path.join(
      artifactsRoot,
      "MockVerifier.sol",
      "MockVerifier.json"
    )

    let verifierAbi: any = [
      "function verifyProof(uint256[2],uint256[2][2],uint256[2],uint256[3]) view returns (bool)"
    ]

    if (fs.existsSync(verifierArtifactPath)) {
      const verifierArtifact = JSON.parse(
        fs.readFileSync(verifierArtifactPath, "utf8")
      )
      verifierAbi = verifierArtifact.abi
    }

    this.verifierContract = new Contract(
      verifierAddress,
      verifierAbi,
      this.signer
    )
  }

  async verifyProof(proof: Proof, pubData: string[]): Promise<boolean> {
    const a = proof.pi_a
    const b = proof.pi_b
    const c = proof.pi_c
    const publicInputs = pubData.map((x) => x.toString())
    const ok: boolean = await this.verifierContract.verifyProof(
      a,
      b,
      c,
      publicInputs
    )
    return ok
  }

  async submitTransaction(
    proof: Proof | null,
    pubData: string[]
  ): Promise<TransactionReceipt | null> {
    const hasProof = !!proof
    const hasPub = pubData && pubData.length > 0

    if (hasProof && hasPub) {
      const a = (proof as Proof).pi_a
      const b = (proof as Proof).pi_b
      const c = (proof as Proof).pi_c

      const pA: [string, string] = [a[0], a[1]]
      const pB: [[string, string], [string, string]] = [
        [b[0][0], b[0][1]],
        [b[1][0], b[1][1]]
      ]
      const pC: [string, string] = [c[0], c[1]]

      const coder = AbiCoder.defaultAbiCoder()
      const proofBytes = coder.encode(
        ["uint256[2]", "uint256[2][2]", "uint256[2]"],
        [pA, pB, pC]
      )

      const pubArr = pubData.slice(0, 3)
      while (pubArr.length < 3) pubArr.push("0")

      const pubBytes = coder.encode(["uint256[3]"], [pubArr])

      const txResponse: any = await this.registryContract.applyTransactionBytes(
        proofBytes,
        pubBytes
      )
      const receipt: TransactionReceipt | null = await txResponse.wait(1)
      return receipt
    } else {
      const testRoot =
        "0x1111111111111111111111111111111111111111111111111111111111111111"
      const txResponse: any = await this.registryContract.registerRoot(testRoot)
      const receipt: TransactionReceipt | null = await txResponse.wait(1)
      return receipt
    }
  }

  async merkleRootCount(): Promise<number> {
    const count: bigint = await this.registryContract.merkleRootCount()
    return Number(count)
  }

  async merkleRootAt(idx: number): Promise<string | null> {
    const root: string = await this.registryContract.merkleRootAt(idx)
    return root
  }

  async storeAggregateResult(
    resultHash: string,
    metadata: Uint8Array
  ): Promise<TransactionReceipt | null> {
    const txResponse: any = await this.registryContract.storeAggregateResult(
      resultHash,
      metadata
    )
    const receipt: TransactionReceipt | null = await txResponse.wait(1)
    return receipt
  }
}
