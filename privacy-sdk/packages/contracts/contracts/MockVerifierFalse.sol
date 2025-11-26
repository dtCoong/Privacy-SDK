// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MockVerifierFalse {
    function verifyProof(uint[2] calldata, uint[2][2] calldata, uint[2] calldata, uint[3] calldata) public pure returns (bool) {
        return false;
    }
}
