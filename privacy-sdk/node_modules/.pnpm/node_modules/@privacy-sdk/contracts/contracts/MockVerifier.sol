// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./IVerifier.sol";

/// @title MockVerifier
/// @notice Verifier giả dùng trong unit test: luôn chấp nhận proof
contract MockVerifier is IVerifier {
    function verifyProof(
        uint256[2] memory /*a*/,
        uint256[2][2] memory /*b*/,
        uint256[2] memory /*c*/,
        uint256[3] memory /*input*/
    ) external pure override returns (bool) {
        return true;
    }
}

/// @title MockVerifierFalse
/// @notice Verifier giả dùng trong unit test: luôn từ chối proof
contract MockVerifierFalse is IVerifier {
    function verifyProof(
        uint256[2] memory /*a*/,
        uint256[2][2] memory /*b*/,
        uint256[2] memory /*c*/,
        uint256[3] memory /*input*/
    ) external pure override returns (bool) {
        return false;
    }
}
