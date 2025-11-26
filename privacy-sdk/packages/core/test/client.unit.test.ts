import { expect } from "chai";
import { ContractClient } from "../src/client";

describe("ContractClient (unit) - clean", () => {
  it("verifyProof and submitTransaction smoke (constructor injection)", async () => {
    const mockContract: any = {};
    mockContract.verifyProof = async () => true;
    mockContract.registerRoot = async () => ({
      hash: "0xdead",
      wait: async () => ({ status: 1 }),
    });
    mockContract.filters = { MerkleRootRegistered: () => ({}) };
    mockContract.queryFilter = async () => [];

    const client = new ContractClient(
      "http://127.0.0.1:8545",
      null as any,
      "0xreg",
      "0xver",
      {
        registryContract: mockContract,
        verifierContract: mockContract,
      } as any
    );

    const proof = {
      pi_a: ["0", "0"],
      pi_b: [
        ["0", "0"],
        ["0", "0"],
      ],
      pi_c: ["0", "0"],
    } as any;
    const pub = ["0", "0", "0"] as any;

    const ok = await client.verifyProof(proof, pub);
    expect(ok).to.equal(true);

    const receipt = await client.submitTransaction({}, {});
    expect(receipt).to.be.an("object");

    const events = await client.getTransactionEvents(0, "latest");
    expect(events).to.be.an("array");
  }).timeout(30000);
});
