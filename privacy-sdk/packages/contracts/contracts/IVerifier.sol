// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// @notice Interface cho Verifier contract (Groth16)
interface IVerifier {
    /**
     * @dev Xác minh proof Groth16 với 3 public inputs:
     *  - input[0]: newRoot (bytes32 cast sang uint256)
     *  - input[1]: nullifier (uint256)
     *  - input[2]: dữ liệu phụ (ví dụ: amount, index, v.v.)
     */
    function verifyProof(
        uint256[2] memory a,
        uint256[2][2] memory b,
        uint256[2] memory c,
        uint256[3] memory input
    ) external view returns (bool);
}
