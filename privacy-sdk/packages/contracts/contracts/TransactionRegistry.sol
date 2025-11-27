// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title TransactionRegistry
 * @notice Lưu trữ Merkle roots và quản lý commitments cho privacy transactions
 */
contract TransactionRegistry {
    // Merkle tree depth (ví dụ: 20 levels = 2^20 leaves)
    uint256 public constant TREE_DEPTH = 20;
    uint256 public constant MAX_LEAVES = 2 ** TREE_DEPTH;

    // Merkle root hiện tại
    bytes32 public currentRoot;
    
    // Mapping để track các nullifiers đã được sử dụng (prevent double-spending)
    mapping(bytes32 => bool) public nullifierUsed;
    
    // Mapping để track các commitments
    mapping(bytes32 => bool) public commitments;
    
    // Array lưu trữ history của roots
    bytes32[] public rootHistory;
    
    // Index của leaf tiếp theo
    uint256 public nextLeafIndex;

    // Events
    event Deposit(
        bytes32 indexed commitment,
        uint256 leafIndex,
        uint256 timestamp
    );
    
    event Withdrawal(
        bytes32 indexed nullifier,
        address indexed recipient,
        uint256 amount,
        bytes32 root
    );
    
    event RootUpdated(
        bytes32 indexed oldRoot,
        bytes32 indexed newRoot,
        uint256 timestamp
    );

    constructor() {
        // Khởi tạo root rỗng
        currentRoot = bytes32(0);
        rootHistory.push(currentRoot);
    }

    /**
     * @notice Deposit - Thêm commitment vào Merkle tree
     * @param commitment Hash của (secret, nullifier)
     */
    function deposit(bytes32 commitment) external payable {
        require(msg.value > 0, "Must deposit some ETH");
        require(nextLeafIndex < MAX_LEAVES, "Merkle tree is full");
        require(!commitments[commitment], "Commitment already exists");

        // Lưu commitment
        commitments[commitment] = true;
        
        // Update Merkle root (simplified - trong thực tế cần implement Merkle tree logic)
        bytes32 oldRoot = currentRoot;
        currentRoot = keccak256(abi.encodePacked(currentRoot, commitment));
        rootHistory.push(currentRoot);

        emit Deposit(commitment, nextLeafIndex, block.timestamp);
        emit RootUpdated(oldRoot, currentRoot, block.timestamp);

        nextLeafIndex++;
    }

    /**
     * @notice Withdraw - Rút tiền với nullifier và proof
     * @param nullifier Nullifier để prevent double-spending
     * @param recipient Địa chỉ nhận tiền
     * @param amount Số tiền rút
     * @param root Merkle root được sử dụng để tạo proof
     */
    function withdraw(
        bytes32 nullifier,
        address payable recipient,
        uint256 amount,
        bytes32 root
    ) external {
        require(!nullifierUsed[nullifier], "Nullifier already used");
        require(isKnownRoot(root), "Invalid root");
        require(address(this).balance >= amount, "Insufficient contract balance");

        // Đánh dấu nullifier đã sử dụng
        nullifierUsed[nullifier] = true;

        // Chuyển tiền
        recipient.transfer(amount);

        emit Withdrawal(nullifier, recipient, amount, root);
    }

    /**
     * @notice Kiểm tra root có trong history không
     * @param root Root cần kiểm tra
     */
    function isKnownRoot(bytes32 root) public view returns (bool) {
        if (root == bytes32(0)) return false;
        
        for (uint256 i = 0; i < rootHistory.length; i++) {
            if (rootHistory[i] == root) {
                return true;
            }
        }
        return false;
    }

    /**
     * @notice Lấy số lượng roots trong history
     */
    function getRootHistoryLength() external view returns (uint256) {
        return rootHistory.length;
    }

    /**
     * @notice Lấy contract balance
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @notice Kiểm tra commitment có tồn tại không
     */
    function hasCommitment(bytes32 commitment) external view returns (bool) {
        return commitments[commitment];
    }
}