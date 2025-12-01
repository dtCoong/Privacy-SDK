// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./IVerifier.sol";

/**
 * @title TransactionRegistry
 * @notice Lưu trữ Merkle roots, quản lý commitments và xác minh ZK proof
 *         Kết hợp yêu cầu của Person 1 (deposit/commitments) và Person 2 (ZK registry)
 */
contract TransactionRegistry is Ownable {
    // =========================
    //  Config Merkle tree (P1)
    // =========================

    // Merkle tree depth (ví dụ: 20 levels = 2^20 leaves)
    uint256 public constant TREE_DEPTH = 20;
    uint256 public constant MAX_LEAVES = 2 ** TREE_DEPTH;

    // =========================
    //  State chính (P2)
    // =========================

    // Merkle root hiện tại (dùng chung cho cả logic P1 & P2)
    bytes32 public currentMerkleRoot;

    // Lịch sử các Merkle root (dùng cho cả P1 & P2)
    bytes32[] public merkleRoots;

    // Nullifier (kiểu uint256) dùng cho ZK pipeline (P2)
    mapping(uint256 => bool) public nullifiersUsed;

    // Verifier contract (Groth16Verifier hoặc tương đương)
    IVerifier public immutable verifier;

    // =========================
    //  State bổ sung từ P1
    // =========================

    // Mapping để track các commitments
    mapping(bytes32 => bool) public commitments;

    // Index của leaf tiếp theo
    uint256 public nextLeafIndex;

    // =========================
    //  Events (P1 + P2)
    // =========================

    // Từ Person 1
    event Deposit(
        bytes32 indexed commitment,
        uint256 leafIndex,
        uint256 timestamp
    );

    event RootUpdated(
        bytes32 indexed oldRoot,
        bytes32 indexed newRoot,
        uint256 timestamp
    );

    // Từ Person 2
    event MerkleRootRegistered(bytes32 indexed root, uint256 timestamp);
    event AggregateResultStored(
        bytes32 indexed resultHash,
        bytes metadata,
        uint256 timestamp
    );
    event TransactionApplied(
        bytes32 indexed newRoot,
        uint256 indexed nullifierHash
    );

    // =========================
    //  Constructor
    // =========================

    constructor(address _verifierAddress) Ownable(_msgSender()) {
        require(_verifierAddress != address(0), "Invalid verifier address");
        verifier = IVerifier(_verifierAddress);

        // Khởi tạo root rỗng, tương thích flow của Person 1
        currentMerkleRoot = bytes32(0);
        merkleRoots.push(currentMerkleRoot);
    }


    // =========================
    //  Logic Deposit (từ P1)
    // =========================

    /**
     * @notice Deposit - Thêm commitment vào Merkle tree
     *         (giữ behavior gốc: phải gửi 1 ít ETH, tree có giới hạn)
     * @param commitment Hash của (secret, nullifier)
     */
    function deposit(bytes32 commitment) external payable {
        require(msg.value > 0, "Must deposit some ETH");
        require(nextLeafIndex < MAX_LEAVES, "Merkle tree is full");
        require(!commitments[commitment], "Commitment already exists");

        // Lưu commitment
        commitments[commitment] = true;

        // Update Merkle root (simple: hash(currentRoot, commitment))
        bytes32 oldRoot = currentMerkleRoot;
        currentMerkleRoot = keccak256(
            abi.encodePacked(currentMerkleRoot, commitment)
        );
        merkleRoots.push(currentMerkleRoot);

        emit Deposit(commitment, nextLeafIndex, block.timestamp);
        emit RootUpdated(oldRoot, currentMerkleRoot, block.timestamp);

        nextLeafIndex++;
    }

    // =========================
    //  Registry API (P2)
    // =========================

    /**
     * @notice Đăng ký root mới (chỉ Owner - ví dụ cho các use case aggregate)
     */
    function registerRoot(bytes32 _root) public onlyOwner {
        currentMerkleRoot = _root;
        merkleRoots.push(_root);
        emit MerkleRootRegistered(_root, block.timestamp);
    }

    /**
     * @notice Lưu kết quả aggregate (HE / voting, v.v.)
     */
    function storeAggregateResult(
        bytes32 resultHash,
        bytes calldata metadata
    ) public onlyOwner {
        emit AggregateResultStored(resultHash, metadata, block.timestamp);
    }

    /**
     * @notice Entry point nhận proof dạng tham số tách (a,b,c,input)
     */
    function applyTransaction(
        uint256[2] calldata a,
        uint256[2][2] calldata b,
        uint256[2] calldata c,
        uint256[3] calldata input
    ) external {
        _applyTransaction(a, b, c, input);
    }

    /**
     * @notice Entry point nhận proof/public inputs dạng bytes (ABI-encoded)
     * @dev `proofBytes` = abi.encode(a,b,c)
     *      `pubData`    = abi.encode(uint256[3]) tương ứng public signals
     */
    function applyTransactionBytes(
        bytes calldata proofBytes,
        bytes calldata pubData
    ) external {
        (uint256[2] memory a, uint256[2][2] memory b, uint256[2] memory c) =
            abi.decode(
                proofBytes,
                (uint256[2], uint256[2][2], uint256[2])
            );
        uint256[3] memory inputDecoded = abi.decode(pubData, (uint256[3]));

        _applyTransaction(a, b, c, inputDecoded);
    }

    /**
     * @dev Core logic áp dụng transaction sau khi verify proof
     */
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

    // =========================
    //  View helpers (P1 + P2)
    // =========================

    /// @notice Số lượng Merkle root đang lưu
    function merkleRootCount() external view returns (uint256) {
        return merkleRoots.length;
    }

    /// @notice Lấy Merkle root theo index (0-based)
    function merkleRootAt(uint256 idx) external view returns (bytes32) {
        require(idx < merkleRoots.length, "Index out of bounds");
        return merkleRoots[idx];
    }

    /**
     * @notice Kiểm tra root có nằm trong history không
     *         (phiên bản dùng merkleRoots thay cho rootHistory của P1)
     */
    function isKnownRoot(bytes32 root) public view returns (bool) {
        if (root == bytes32(0)) return false;
        for (uint256 i = 0; i < merkleRoots.length; i++) {
            if (merkleRoots[i] == root) {
                return true;
            }
        }
        return false;
    }

    /**
     * @notice Số lượng root trong history (tương đương getRootHistoryLength của P1)
     */
    function getRootHistoryLength() external view returns (uint256) {
        return merkleRoots.length;
    }

    /**
     * @notice Lấy contract balance (P1)
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
