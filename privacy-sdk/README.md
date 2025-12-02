# Privacy SDK - Nền Tảng Bảo Mật & Giao Dịch Ẩn Danh Cho Blockchain

**Một hệ sinh thái toàn diện mang lại Quyền Riêng Tư (Privacy) cho các ứng dụng phi tập trung (dApps). Tích hợp Zero-Knowledge Proofs, Chữ Ký Vòng (Ring Signatures) và Cơ chế bỏ phiếu ẩn danh.**
 

## 📋 Mục Lục

1.  [Giới Thiệu Chung](#-giới-thiệu-chung)
2.  [Tại Sao Chọn Privacy SDK?](#-tại-sao-chọn-privacy-sdk)
3.  [Kiến Trúc Hệ Thống](#-kiến-trúc-hệ-thống)
4.  [Các Tính Năng Cốt Lõi](#-các-tính-năng-cốt-lõi)
5.  [Cấu Trúc Monorepo](#-cấu-trúc-monorepo)
6.  [Yêu Cầu Tiền Quyết](#-yêu-cầu-tiền-quyết)
7.  [Hướng Dẫn Cài Đặt & Build](#-hướng-dẫn-cài-đặt--build)
8.  [Bắt Đầu Nhanh (Quick Start)](#-bắt-đầu-nhanh)
9.  [Quy Trình Hoạt Động (Workflows)](#-quy-trình-hoạt-động-workflows)
10. [Bảo Mật & Kiểm Toán](#-bảo-mật--kiểm-toán)
11. [Đóng Góp](#-đóng-góp)


## 🎯 Giới Thiệu Chung

Trong thế giới Blockchain công khai (Public Blockchain) như Ethereum, tính minh bạch là một con dao hai lưỡi. Mọi giao dịch, số dư và lịch sử hoạt động đều có thể bị truy vết bởi bất kỳ ai. Điều này tạo ra rào cản lớn cho việc áp dụng Blockchain vào các quy trình doanh nghiệp, tài chính cá nhân hoặc bỏ phiếu điện tử - nơi mà sự riêng tư là bắt buộc.

**Privacy SDK** ra đời để giải quyết vấn đề này. Đây là một bộ công cụ phát triển phần mềm (SDK) dạng Monorepo, cung cấp các lớp bảo mật mật mã học tiên tiến (Cryptography primitives) để che giấu thông tin nhạy cảm nhưng vẫn đảm bảo tính toàn vẹn của dữ liệu trên chuỗi.

-----

## 💡 Tại Sao Chọn Privacy SDK?

Khác với các giải pháp Mixer đơn lẻ, Privacy SDK cung cấp một bộ công cụ **End-to-End** cho lập trình viên:

  * **Tính Ẩn Danh Tuyệt Đối:** Sử dụng **zk-SNARKs** (Zero-Knowledge Succinct Non-Interactive Argument of Knowledge) để chứng minh tính hợp lệ của giao dịch mà không tiết lộ người gửi, người nhận hay số tiền.
  * **Chống Kiểm Duyệt:** Tích hợp cơ chế **Relayer**, giúp người dùng gửi giao dịch mà không cần sở hữu Native Token (ETH/BNB) để trả phí gas, từ đó cắt đứt mối liên kết giữa ví gốc và ví ẩn danh.
  * **Mở Rộng & Linh Hoạt:** Hỗ trợ mọi Blockchain tương thích EVM (Ethereum, BSC, Polygon, Arbitrum...).
  * **Bỏ Phiếu Kín:** Hệ thống Voting không chỉ ẩn danh người bỏ phiếu mà còn cho phép xác minh kết quả bằng toán học (Verifiable Computation).

-----

## 🏗 Kiến Trúc Hệ Thống

Hệ thống được chia thành 3 lớp chính tương tác chặt chẽ với nhau:

1.  **Lớp Client (SDK Core):**
      * Xử lý logic tạo khóa bí mật (Secrets) và Nullifier.
      * Tạo bằng chứng ZK (Proof Generation) ngay trên trình duyệt hoặc server của người dùng (Off-chain computation).
2.  **Lớp Blockchain (Smart Contracts):**
      * Lưu trữ các cam kết (Commitments) dưới dạng Merkle Tree.
      * Xác minh bằng chứng ZK thông qua Verifier Contract.
      * Ngăn chặn chi tiêu hai lần (Double-spending) bằng Nullifier Registry.
3.  **Lớp Dịch Vụ (Relayer & Aggregator):**
      * Tiếp nhận giao dịch kèm Proof từ Client.
      * Đóng gói và gửi lên Blockchain, chịu phí Gas thay cho người dùng để đảm bảo tính ẩn danh hoàn toàn.

-----

## ✨ Các Tính Năng Cốt Lõi

### 🔐 Giao Dịch Riêng Tư (Transactional Privacy)

  * **Deposit:** Gửi tài sản vào Smart Contract và nhận lại một "Note" (bí mật).
  * **Transfer:** Chuyển quyền sở hữu Note cho người khác trong Pool mà không lộ danh tính.
  * **Withdraw:** Rút tài sản về một ví sạch (Fresh Wallet) bằng cách cung cấp bằng chứng ZK hợp lệ.

### 🗳️ Bỏ Phiếu Ẩn Danh (Anonymous Voting)

  * Người dùng chứng minh quyền bỏ phiếu (dựa trên số dư hoặc token sở hữu) mà không lộ họ bầu cho ai.
  * Sử dụng **Homomorphic Encryption** (Mã hóa đồng cấu) để cộng dồn phiếu bầu đã mã hóa.

### 🛡️ Cơ Chế Bảo Vệ

  * **Ring Signatures (Chữ ký vòng):** Làm mờ nguồn gốc người ký trong một nhóm các người dùng khả thi.
  * **Merkle Tree Sparse:** Cấu trúc dữ liệu cây tối ưu giúp xác minh thành viên nhanh chóng và tiết kiệm Gas.

-----

## 📦 Cấu Trúc Monorepo

Dự án sử dụng `pnpm workspace` để quản lý đa gói (multi-package), giúp đồng bộ hóa phiên bản và dễ dàng phát triển.

| Package | Đường dẫn | Mô tả chi tiết |
| :--- | :--- | :--- |
| **@privacy-sdk/core** | `packages/core` | Thư viện chính (Core logic). Quản lý Key, tạo Proof, tương tác RPC. |
| **@privacy-sdk/contracts** | `packages/contracts` | Chứa toàn bộ Smart Contracts (Solidity), scripts deploy và Hardhat config. |
| **@privacy-sdk/circuits** | `packages/circuits` | Mã nguồn mạch điện tử ZK (Circom). Nơi định nghĩa các logic ràng buộc toán học. |
| **@privacy-sdk/relayer** | `packages/relayer` | Backend Service (Node.js/Express) đóng vai trò trung gian gửi giao dịch. |
| **@privacy-sdk/voting** | `packages/voting` | Module chuyên biệt cho tính năng bỏ phiếu ẩn danh. |
| **@privacy-sdk/he-aggregator**| `packages/he-aggregator`| (Experimental) Module xử lý tính toán trên dữ liệu mã hóa đồng cấu. |
| **@privacy-sdk/examples** | `packages/examples` | Các mã mẫu (Boilerplate) giúp bạn tích hợp nhanh chóng. |

-----

## ⚙️ Yêu Cầu Tiền Quyết

Để phát triển và chạy dự án, hệ thống của bạn cần đáp ứng:

  * **Hệ điều hành:** Linux, macOS, hoặc Windows (WSL2).
  * **Runtime:** [Node.js](https://nodejs.org/) phiên bản `v18.0.0` trở lên (Khuyến nghị LTS).
  * **Package Manager:** [pnpm](https://pnpm.io/) `v8+` (Bắt buộc để xử lý workspace).
  * **Compiler:** `circom` (nếu bạn có ý định chỉnh sửa mạch ZK).
  * **Tài nguyên:** RAM tối thiểu 8GB (Quá trình tạo Proof và compile mạch tốn nhiều tài nguyên).

-----

## 🚀 Hướng Dẫn Cài Đặt & Build

### 1\. Khởi tạo dự án

Clone mã nguồn từ GitHub và di chuyển vào thư mục làm việc:

```bash
git clone https://github.com/dtCoong/Privacy-SDK.git
cd Privacy-SDK/privacy-sdk
```

### 2\. Cài đặt Dependencies

Sử dụng pnpm để cài đặt tất cả thư viện cho các packages con:

```bash
# Cài đặt toàn bộ dependencies trong workspace
pnpm install
```

### 3\. Build Hệ Thống

Quá trình build bao gồm: Compile Smart Contracts, Compile Circuits (Circom), và Transpile TypeScript.

```bash
# Build tất cả packages theo thứ tự phụ thuộc
pnpm build

# Hoặc build từng phần nếu muốn tiết kiệm thời gian
pnpm --filter @privacy-sdk/contracts build
pnpm --filter @privacy-sdk/core build
```

### 4\. Kiểm thử (Testing)

Đảm bảo hệ thống hoạt động ổn định trước khi deploy.

```bash
# Chạy toàn bộ Unit Test & Integration Test
pnpm test
```

-----

## ⚡ Bắt Đầu Nhanh

Dưới đây là ví dụ minh họa cách sử dụng `@privacy-sdk/core` để thực hiện một chu trình ẩn danh đầy đủ.

```typescript
import { PrivacyClient } from '@privacy-sdk/core';
import { ethers } from 'ethers';

async function main() {
  // 1. Cấu hình Client
  // Kết nối tới Blockchain (Localhost hoặc Testnet) và Relayer
  const client = new PrivacyClient({
    rpcUrl: 'http://127.0.0.1:8545', // RPC URL
    contractAddress: '0x5FbDB2315678afecb367f032d93F642f64180aa3', // Địa chỉ Contract PrivacyPool
    relayerUrl: 'http://localhost:3001', // (Tùy chọn) Nếu muốn dùng Relayer
  });

  // 2. Tạo hoặc khôi phục ví
  // Đây là ví dùng để ký các thao tác tạo bằng chứng (không nhất thiết phải có ETH)
  const wallet = await client.createWallet();
  console.log(`Đã khởi tạo ví phiên: ${wallet.address}`);

  // 3. DEPOSIT (Nạp tiền)
  // Gửi 1 ETH vào Pool để đổi lấy một "Note" bí mật
  // Lưu ý: Bước này cần một ví có ETH để trả gas ban đầu
  console.log("Đang nạp tiền vào Pool...");
  const depositReceipt = await client.deposit({
    amount: '1.0',
    asset: 'ETH',
    fromPrivateKey: 'YOUR_ETHEREUM_PRIVATE_KEY' 
  });
  console.log(`Deposit thành công! Note: ${depositReceipt.note}`);

  // 4. TRANSFER (Chuyển khoản ẩn danh - Off-chain)
  // Chuyển Note này cho người khác trong Pool mà không ai biết
  const transferReceipt = await client.transfer({
    note: depositReceipt.note, // Note sở hữu
    toPublicKey: '0xRecipientPublicKey...', // Public Key của người nhận trong hệ thống Privacy
    amount: '0.5'
  });
  console.log(`Chuyển khoản ẩn danh hoàn tất. TxHash: ${transferReceipt.txHash}`);

  // 5. WITHDRAW (Rút tiền)
  // Rút tiền về một địa chỉ ví hoàn toàn mới (ví sạch)
  console.log("Đang rút tiền về ví sạch...");
  const withdrawReceipt = await client.withdraw({
    note: depositReceipt.note,
    recipient: '0xFreshWalletAddress...',
    amount: '0.5',
    useRelayer: true // Sử dụng Relayer để ví sạch không tốn gas
  });
  console.log(`Rút tiền thành công! TxHash: ${withdrawReceipt.txHash}`);
}

main().catch(console.error);
```

### Chạy Demo Full-Stack Cục Bộ

Để thấy toàn bộ hệ thống hoạt động cùng nhau (Blockchain Node, Contracts, Relayer, Client):

```bash
# Terminal 1: Khởi chạy Blockchain Local (Hardhat Node)
cd packages/contracts
npx hardhat node

# Terminal 2: Deploy Contracts & Chạy Script Demo
cd privacy-sdk
pnpm build
node full_demo.js
```

-----

## 🔄 Quy Trình Hoạt Động (Workflows)

### 1\. Quy trình Nạp Tiền (Deposit)

1.  Client tạo ra 2 số ngẫu nhiên: `secret` và `nullifier`.
2.  Tính toán `commitment = Hash(secret, nullifier)`.
3.  Gửi `commitment` và tài sản (ETH/Token) lên Smart Contract.
4.  Contract thêm `commitment` vào Merkle Tree.

### 2\. Quy trình Rút Tiền (Withdraw)

1.  Client tạo bằng chứng ZK (Proof) chứng minh rằng: *"Tôi biết `secret` và `nullifier` tương ứng với một `commitment` đang nằm trong Merkle Tree, nhưng tôi không nói đó là commitment nào."*
2.  Proof cũng chứng minh `nullifier` chưa từng được sử dụng (chống double-spending).
3.  Client gửi Proof + `nullifier` + địa chỉ nhận tiền lên Contract (thông qua Relayer).
4.  Contract xác thực Proof. Nếu đúng, chuyển tiền cho người nhận và đánh dấu `nullifier` là đã dùng.

-----

## 🔒 Bảo Mật & Kiểm Toán

⚠️ **Cảnh báo quan trọng:**
Mặc dù SDK này sử dụng các thuật toán mật mã tiêu chuẩn công nghiệp, nhưng đây là phần mềm mã nguồn mở và đang trong quá trình phát triển tích cực.

  * **Trusted Setup:** Các mạch ZK (Circuits) hiện tại đang sử dụng phase 1 của Perpetual Powers of Tau. Đối với môi trường Production, cần thực hiện quy trình Trusted Setup MPC Phase 2 riêng biệt.
  * **Audit:** Các Smart Contracts và Circuits **CHƯA** được audit bởi bên thứ ba. **KHÔNG** sử dụng số tiền lớn trên Mainnet vào lúc này.
  * **Mã hóa:** Đảm bảo Private Key và các Note bí mật được lưu trữ an toàn (ví dụ: trong Environment Variables hoặc Hardware Wallet).

-----

## 🤝 Đóng Góp

Chúng tôi rất hoan nghênh sự đóng góp từ cộng đồng\! Quy trình đóng góp chuẩn:

1.  **Fork** repository về tài khoản GitHub của bạn.
2.  Tạo một branch mới cho tính năng (`git checkout -b feature/tinh-nang-moi`).
3.  Viết code và đảm bảo chạy `pnpm test` thành công.
4.  Commit thay đổi (`git commit -m 'Thêm tính năng X'`).
5.  Push lên branch (`git push origin feature/tinh-nang-moi`).
6.  Tạo **Pull Request** và chờ review.

-----

## 📞 Hỗ Trợ & Liên Hệ

Nếu bạn gặp vấn đề hoặc có câu hỏi kỹ thuật:

  * **GitHub Issues:** [Gửi báo cáo lỗi tại đây](https://github.com/dtCoong/Privacy-SDK/issues)
  * **Thảo luận:** Tham gia thảo luận tại tab Discussions.
  * **Email:** Liên hệ trực tiếp qua email của maintainer (xem trong profile GitHub).

-----

## 📄 Giấy Phép (License)

Dự án này được phân phối dưới giấy phép **MIT**. Xem file [LICENSE](https://www.google.com/search?q=LICENSE) để biết thêm chi tiết. Bạn được tự do sử dụng, sửa đổi và phân phối lại mã nguồn, miễn là giữ lại thông báo bản quyền.

-----

**Phát triển bởi [dtCoong](https://www.google.com/search?q=https://github.com/dtCoong) và Cộng Đồng.**
*Vì một thế giới Blockchain riêng tư và tự do.*
