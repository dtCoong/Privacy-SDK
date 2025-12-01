@echo off

echo ======================================
echo Person3 - Circuits + ZK Proof + RingSig
echo ======================================
cd /d D:\Privacy-SDK\privacy-sdk\packages\circuits\scripts
node generateProof.js

echo.
echo [DONE PERSON3]
echo.

echo ======================================
echo Person5 - HE Aggregator (logic + ZK proof)
echo ======================================
cd /d D:\Privacy-SDK\privacy-sdk\packages\he-aggregator
node run_all.js

echo.
echo [DONE PERSON5]
echo.

echo ======================================
echo Person4 - Privacy Mixer Security Tests
echo ======================================
cd /d D:\Privacy-SDK\privacy-sdk\packages\privacy-mixer
node src\test_security.js

echo.
echo [DONE PERSON4]
echo.

echo ======================================
echo Person2 - Contracts (TransactionRegistry)
echo ======================================
cd /d D:\Privacy-SDK\privacy-sdk\packages\contracts
npx hardhat test

echo.
echo [DONE PERSON2]
echo.

echo ✅ FULL DEMO HOAN TAT - TAT CA PERSON DA CHAY XONG.
echo.
pause
