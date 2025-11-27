import { RingSignature } from './ringsig.js'; // Import module ringsig.js 


export enum Denomination {
  SMALL = 10,
  MEDIUM = 100,
  LARGE = 1000,
}

interface DepositNote {
  secretKey: string;
  publicKey: string;
  amount: Denomination;
  timestamp: number;
}

interface MixerState {
  publicKeys: string[];
  nullifiers: Set<string>;
}

export class PrivacyMixer {
  private state: MixerState;

  constructor() {
    this.state = {
      publicKeys: [],
      nullifiers: new Set(),
    };
  }

  // --- DEPOSIT ---
  async deposit(amount: Denomination): Promise<string> {
    const keyPair = RingSignature.generateKeyPair();
    this.state.publicKeys.push(keyPair.pk);

    const note: DepositNote = {
      secretKey: keyPair.sk,
      publicKey: keyPair.pk,
      amount,
      timestamp: Date.now(),
    };

    const noteString = JSON.stringify(note);
    return Buffer.from(noteString).toString('base64');
  }

  // --- WITHDRAW ---
  async withdraw(
    noteString: string, 
    recipientAddress: string, 
    withdrawDelaySeconds: number = 0
  ): Promise<boolean> {
    // 1. Parse Note
    const noteJson = Buffer.from(noteString, 'base64').toString('utf-8');
    const note: DepositNote = JSON.parse(noteJson);

    // 2. Kiểm tra Delay
    const currentTime = Date.now();
    const minWithdrawTime = note.timestamp + (withdrawDelaySeconds * 1000);
    if (currentTime < minWithdrawTime) {
      const waitTime = Math.ceil((minWithdrawTime - currentTime) / 1000);
      throw new Error(`Withdrawal locked. Please wait ${waitTime}s.`);
    }

    // 3. Tạo Anonymity Set (Ring)
    const ringSize = 5; 
    const { ring, signerIndex } = this.getAnonymitySet(note.publicKey, ringSize);

    // 4. Ký Ring Signature
    // QUAN TRỌNG: Message chỉ cần là địa chỉ người nhận.
    const message = recipientAddress;
    
    console.log("Signing ring signature...");
    
    // Hàm createRingSignature trả về { keyImage, c0, s }
    // keyImage chính là Nullifier chuẩn toán học
    const signature = await RingSignature.createRingSignature(
      message, 
      ring,           
      note.secretKey, 
      signerIndex     
    );

    // 5. Chống Double Spending (Nullifier Check)
    // Dùng Key Image từ chữ ký làm Nullifier
    const nullifier = signature.keyImage;

    if (this.state.nullifiers.has(nullifier)) {
      throw new Error(`Double spending detected! Key Image ${nullifier.slice(0, 10)}... already used.`);
    }

    // 6. Server Verify
    const isValid = await RingSignature.verifyRingSignature(message, signature, ring);

    if (!isValid) {
      throw new Error("Invalid Ring Signature! Authentication failed.");
    }

    // 7. Thành công -> Đánh dấu Nullifier
    this.state.nullifiers.add(nullifier);
    console.log(`[SUCCESS] Withdrawn ${note.amount} to ${recipientAddress}`);
    console.log(`          (Nullifier: ${nullifier.slice(0, 15)}...)`);
    
    return true;
  }

  // --- HELPER: Chọn Decoys ---
  private getAnonymitySet(myPublicKey: string, size: number): { ring: string[], signerIndex: number } {
    const pool = this.state.publicKeys;
    
    // Fallback nếu pool nhỏ
    if (pool.length < size) {
       const ring = Array(size).fill(myPublicKey); 
       return { ring, signerIndex: 0 }; 
    }

    const otherKeys = pool.filter(k => k !== myPublicKey);
    const decoys = otherKeys.sort(() => 0.5 - Math.random()).slice(0, size - 1);
    
    const signerIndex = Math.floor(Math.random() * size);
    const ring = [...decoys];
    ring.splice(signerIndex, 0, myPublicKey);

    while (ring.length < size) {
        ring.push(myPublicKey);
    }

    return { ring, signerIndex };
  }
}