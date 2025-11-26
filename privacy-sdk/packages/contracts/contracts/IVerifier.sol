// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IVerifier {
    function verifyProof(uint[2] calldata, uint[2][2] calldata, uint[2] calldata, uint[3] calldata) external view returns (bool);
}
