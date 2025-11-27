import { PrivacyMixer, Denomination } from '../src';

async function testAnonymitySets() {
  console.log("=== TEST: DIFFERENT ANONYMITY SETS ===");
  const mixer = new PrivacyMixer();

  // --- KỊCH BẢN 1: POOL RỖNG (Extreme Case) ---
  console.log("\n[Case 1] Pool Rỗng (Chỉ có 1 mình mình)");
  // Khi nạp vào, pool size = 1. 
  // Hệ thống phải tự handle việc không đủ người để trộn (padding với chính mình).
  const note1 = await mixer.deposit(Denomination.SMALL);
  
  try {
    await mixer.withdraw(note1, "UserA", 0);
    console.log("✅ Case 1 Passed: Rút thành công dù không có ai khác (Low Privacy Warning).");
  } catch (e) {
    console.error("❌ Case 1 Failed:", e);
  }

  // --- KỊCH BẢN 2: POOL LỚN (Normal Case) ---
  console.log("\n[Case 2] Pool Đông Đúc (High Privacy)");
  
  // Giả lập 10 người dùng khác nạp tiền
  const promises = [];
  for(let i=0; i<10; i++) {
    promises.push(mixer.deposit(Denomination.SMALL));
  }
  await Promise.all(promises);
  console.log("-> Đã nạp thêm 10 users vào pool.");

  const note2 = await mixer.deposit(Denomination.SMALL);
  try {
    await mixer.withdraw(note2, "UserB", 0);
    console.log("✅ Case 2 Passed: Rút thành công trong pool lớn.");
  } catch (e) {
    console.error("❌ Case 2 Failed:", e);
  }
}

testAnonymitySets();