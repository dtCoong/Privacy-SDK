const { expect } = require("chai");
// SỬA: Thêm folder "scripts" vào đường dẫn
const { generateFullTransactionPayload } = require("../scripts/generateProof.js"); 

describe("Privacy SDK Full Flow Test", function () {
    
    it("Should generate a valid transaction payload", async function () {
        console.log("      ⏳ Đang chạy test tạo proof...");
        
        const payload = await generateFullTransactionPayload();

        // 1. Kiểm tra có đủ các trường dữ liệu không
        expect(payload).to.be.an("object");
        expect(payload).to.have.property("zkProof");
        expect(payload).to.have.property("merkleRoot");
        expect(payload).to.have.property("nullifier");
        expect(payload).to.have.property("ringSignature");
        expect(payload).to.have.property("publicSignals");

        // 2. Kiểm tra định dạng dữ liệu
        expect(payload.publicSignals).to.be.an("array");
        expect(payload.publicSignals.length).to.be.greaterThan(0);
        
        // 3. Kiểm tra Ring Signature
        expect(payload.ringSignature).to.have.property("e0");
        expect(payload.ringSignature).to.have.property("s");

        console.log("      ✅ Payload hợp lệ!");
    });
});