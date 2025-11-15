@echo off
echo ========================================
echo Privacy SDK - Quick Demo
echo ========================================
echo.
echo Make sure services are running:
echo   1. Hardhat node
echo   2. Relayer service
echo.
pause

cd packages\examples
echo Running Full Demo...
echo.
call pnpm demo

echo.
echo ========================================
echo Demo completed!
echo ========================================
pause

