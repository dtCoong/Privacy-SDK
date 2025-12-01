"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContractClient = void 0;
const ethers_1 = require("ethers");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class ContractClient {
    constructor(rpcUrl, privateKey, registryAddress, verifierAddress) {
        this.provider = new ethers_1.JsonRpcProvider(rpcUrl);
        this.signer = new ethers_1.Wallet(privateKey, this.provider);
        const artifactsRoot = path_1.default.resolve(__dirname, "..", "..", "contracts", "artifacts", "contracts");
        const registryArtifactPath = path_1.default.join(artifactsRoot, "TransactionRegistry.sol", "TransactionRegistry.json");
        const registryArtifact = JSON.parse(fs_1.default.readFileSync(registryArtifactPath, "utf8"));
        this.registryContract = new ethers_1.Contract(registryAddress, registryArtifact.abi, this.signer);
        const verifierArtifactPath = path_1.default.join(artifactsRoot, "MockVerifier.sol", "MockVerifier.json");
        let verifierAbi = [
            "function verifyProof(uint256[2],uint256[2][2],uint256[2],uint256[3]) view returns (bool)"
        ];
        if (fs_1.default.existsSync(verifierArtifactPath)) {
            const verifierArtifact = JSON.parse(fs_1.default.readFileSync(verifierArtifactPath, "utf8"));
            verifierAbi = verifierArtifact.abi;
        }
        this.verifierContract = new ethers_1.Contract(verifierAddress, verifierAbi, this.signer);
    }
    async verifyProof(proof, pubData) {
        const a = proof.pi_a;
        const b = proof.pi_b;
        const c = proof.pi_c;
        const publicInputs = pubData.map((x) => x.toString());
        const ok = await this.verifierContract.verifyProof(a, b, c, publicInputs);
        return ok;
    }
    async submitTransaction(proof, pubData) {
        const hasProof = !!proof;
        const hasPub = pubData && pubData.length > 0;
        if (hasProof && hasPub) {
            const a = proof.pi_a;
            const b = proof.pi_b;
            const c = proof.pi_c;
            const pA = [a[0], a[1]];
            const pB = [
                [b[0][0], b[0][1]],
                [b[1][0], b[1][1]]
            ];
            const pC = [c[0], c[1]];
            const coder = ethers_1.AbiCoder.defaultAbiCoder();
            const proofBytes = coder.encode(["uint256[2]", "uint256[2][2]", "uint256[2]"], [pA, pB, pC]);
            const pubArr = pubData.slice(0, 3);
            while (pubArr.length < 3)
                pubArr.push("0");
            const pubBytes = coder.encode(["uint256[3]"], [pubArr]);
            const txResponse = await this.registryContract.applyTransactionBytes(proofBytes, pubBytes);
            const receipt = await txResponse.wait(1);
            return receipt;
        }
        else {
            const testRoot = "0x1111111111111111111111111111111111111111111111111111111111111111";
            const txResponse = await this.registryContract.registerRoot(testRoot);
            const receipt = await txResponse.wait(1);
            return receipt;
        }
    }
    async merkleRootCount() {
        const count = await this.registryContract.merkleRootCount();
        return Number(count);
    }
    async merkleRootAt(idx) {
        const root = await this.registryContract.merkleRootAt(idx);
        return root;
    }
    async storeAggregateResult(resultHash, metadata) {
        const txResponse = await this.registryContract.storeAggregateResult(resultHash, metadata);
        const receipt = await txResponse.wait(1);
        return receipt;
    }
}
exports.ContractClient = ContractClient;
