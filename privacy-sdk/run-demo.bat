@echo off
echo ========================================
echo Privacy SDK - Complete Demo Setup
echo ========================================
echo.

:: Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

:: Check if pnpm is installed
where pnpm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] pnpm is not installed!
    echo Installing pnpm...
    npm install -g pnpm
)

echo [1/5] Installing dependencies...
call pnpm install
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo [2/5] Building packages...
cd packages\core
call pnpm build
cd ..\voting
call pnpm build
cd ..\relayer
call pnpm build
cd ..\..

echo.
echo [3/5] Starting Hardhat node...
start "Hardhat Node" cmd /k "cd packages\contracts && npx hardhat node"
timeout /t 5 /nobreak

echo.
echo [4/5] Deploying contracts...
cd packages\contracts
call npx hardhat run scripts\deploy.js --network localhost > deploy-output.txt
set /p CONTRACT_ADDRESS=<deploy-output.txt
echo Contract deployed at: %CONTRACT_ADDRESS%
cd ..\..

echo.
echo [5/5] Starting Relayer service...
start "Relayer Service" cmd /k "cd packages\relayer && pnpm dev"
timeout /t 3 /nobreak

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Services running:
echo   - Hardhat Node: http://127.0.0.1:8545
echo   - Relayer: http://localhost:3001
echo.
echo To run demos:
echo   cd packages\examples
echo   pnpm voting     (Voting demo)
echo   pnpm demo       (Full demo)
echo.
pause