// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./IVerifier.sol";

contract TransactionRegistry is Ownable {
    bytes32 public currentMerkleRoot;
    bytes32[] public merkleRoots;
    mapping(uint256 => bool) public nullifiersUsed;
    IVerifier public immutable verifier;

    event MerkleRootRegistered(bytes32 indexed root, uint256 timestamp);
    event AggregateResultStored(bytes32 indexed resultHash, bytes metadata, uint256 timestamp);
    event TransactionApplied(bytes32 indexed newRoot, uint256 indexed nullifierHash);

    constructor(address _verifierAddress) {
        require(_verifierAddress != address(0), "Invalid verifier address");
        verifier = IVerifier(_verifierAddress);
    }

    function registerRoot(bytes32 _root) public onlyOwner {
        currentMerkleRoot = _root;
        merkleRoots.push(_root);
        emit MerkleRootRegistered(_root, block.timestamp);
    }

    function storeAggregateResult(bytes32 resultHash, bytes calldata metadata) public onlyOwner {
        emit AggregateResultStored(resultHash, metadata, block.timestamp);
    }

    function applyTransaction(
        uint256[2] calldata a,
        uint256[2][2] calldata b,
        uint256[2] calldata c,
        uint256[3] calldata input
    ) external {
        _applyTransaction(a, b, c, input);
    }

    /// @notice Compatibility wrapper: accepts ABI-encoded proof and public inputs as bytes
    /// @dev `proofBytes` must be `abi.encode(a, b, c)` where a: uint256[2], b: uint256[2][2], c: uint256[2]
    ///      `pubData` must be `abi.encode(uint256[3])` matching the verifier public signals
    function applyTransactionBytes(bytes calldata proofBytes, bytes calldata pubData) external {
        (uint256[2] memory a, uint256[2][2] memory b, uint256[2] memory c) = abi.decode(
            proofBytes,
            (uint256[2], uint256[2][2], uint256[2])
        );

        uint256[3] memory inputDecoded = abi.decode(pubData, (uint256[3]));

        _applyTransaction(a, b, c, inputDecoded);
    }

    function _applyTransaction(
        uint256[2] memory a,
        uint256[2][2] memory b,
        uint256[2] memory c,
        uint256[3] memory input
    ) internal {
        bytes32 newRoot = bytes32(input[0]);
        uint256 nullifier = input[1];

        require(!nullifiersUsed[nullifier], "Nullifier already spent");

        bool ok = verifier.verifyProof(a, b, c, input);
        require(ok, "Invalid ZK proof");

        nullifiersUsed[nullifier] = true;
        currentMerkleRoot = newRoot;
        merkleRoots.push(newRoot);

        emit TransactionApplied(newRoot, nullifier);
    }

    /// @notice Return number of stored merkle roots
    function merkleRootCount() external view returns (uint256) {
        return merkleRoots.length;
    }

    /// @notice Return merkle root at index (0-based)
    function merkleRootAt(uint256 idx) external view returns (bytes32) {
        require(idx < merkleRoots.length, "Index out of bounds");
        return merkleRoots[idx];
    }
}
