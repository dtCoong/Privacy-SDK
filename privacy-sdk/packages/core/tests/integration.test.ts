import { describe, it, expect, beforeAll } from "vitest"
import { ContractClient, Proof } from "../src/client"

const RPC_URL = "http://127.0.0.1:8545"
const PRIVATE_KEY =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"

const REGISTRY_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
const VERIFIER_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"

const MOCK_NEW_ROOT =
  "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"

function randomNullifier(): string {
  const n = BigInt(Date.now()) ^ BigInt(Math.floor(Math.random() * 1e6))
  return n.toString()
}

describe("ContractClient integration – applyTransactionBytes", () => {
  let client: ContractClient

  beforeAll(() => {
    client = new ContractClient(
      RPC_URL,
      PRIVATE_KEY,
      REGISTRY_ADDRESS,
      VERIFIER_ADDRESS
    )
  })

  it("submitTransaction dùng applyTransactionBytes và cập nhật merkle root", async () => {
    const proof: Proof = {
      pi_a: ["0", "0"],
      pi_b: [
        ["0", "0"],
        ["0", "0"]
      ],
      pi_c: ["0", "0"]
    }

    const nullifier = randomNullifier()
    const pubData = [MOCK_NEW_ROOT, nullifier, "0"]

    const receipt = await client.submitTransaction(proof, pubData)

    expect(receipt).not.toBeNull()
    if (!receipt) return
    expect(receipt.status).toBe(1)

    const count = await client.merkleRootCount()
    expect(count).toBeGreaterThan(0)

    const lastIdx = count - 1
    const lastRoot = await client.merkleRootAt(lastIdx)
    expect(lastRoot?.toLowerCase()).toBe(MOCK_NEW_ROOT.toLowerCase())
  })
})
