# Relayer Service Deployment Guide

## Prerequisites

- Node.js >= 16.x
- pnpm >= 8.x
- Access to Ethereum node (RPC URL)
- Private key with ETH for gas fees
- Deployed TransactionRegistry contract

## Installation

### 1. Clone and Install
\`\`\`bash
git clone <repository>
cd privacy-sdk
pnpm install
\`\`\`

### 2. Configure Environment
\`\`\`bash
cd packages/relayer
cp .env.example .env
\`\`\`

Edit `.env`:
\`\`\`env
PORT=3001
RPC_URL=https://your-rpc-url
PRIVATE_KEY=0xyour-private-key
CONTRACT_ADDRESS=0xyour-contract-address
GAS_LIMIT=500000
GAS_PRICE_MULTIPLIER=1.1
MAX_GAS_PRICE=100000000000
RATE_LIMIT_POINTS=10
RATE_LIMIT_DURATION=60
\`\`\`

### 3. Build
\`\`\`bash
pnpm build
\`\`\`

### 4. Run
\`\`\`bash
# Development
pnpm dev

# Production
pnpm start
\`\`\`

## Production Deployment

### Using PM2

\`\`\`bash
# Install PM2
npm install -g pm2

# Start service
pm2 start dist/index.js --name relayer

# View logs
pm2 logs relayer

# Restart
pm2 restart relayer

# Stop
pm2 stop relayer
\`\`\`

### Using Docker

\`\`\`dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --prod

COPY dist ./dist
COPY .env ./

EXPOSE 3001

CMD ["node", "dist/index.js"]
\`\`\`

Build and run:
\`\`\`bash
docker build -t privacy-relayer .
docker run -d -p 3001:3001 --name relayer privacy-relayer
\`\`\`

### Using systemd

Create `/etc/systemd/system/relayer.service`:
\`\`\`ini
[Unit]
Description=Privacy SDK Relayer Service
After=network.target

[Service]
Type=simple
User=relayer
WorkingDirectory=/opt/privacy-sdk/packages/relayer
ExecStart=/usr/bin/node dist/index.js
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
\`\`\`

Enable and start:
\`\`\`bash
sudo systemctl enable relayer
sudo systemctl start relayer
sudo systemctl status relayer
\`\`\`

## Configuration

### Gas Settings

- `GAS_PRICE_MULTIPLIER`: Multiplier for gas price (default: 1.1 = 10% higher)
- `MAX_GAS_PRICE`: Maximum gas price in wei (default: 100 gwei)
- `GAS_LIMIT`: Gas limit for transactions (default: 500000)

### Rate Limiting

- `RATE_LIMIT_POINTS`: Max requests per duration (default: 10)
- `RATE_LIMIT_DURATION`: Duration in seconds (default: 60)

### Queue Settings

- `MAX_QUEUE_SIZE`: Maximum transactions in queue (default: 1000)
- `MAX_RETRIES`: Maximum retry attempts (default: 3)
- `TX_EXPIRE_TIME`: Transaction expiry time in ms (default: 3600000 = 1 hour)

## Monitoring

### Health Check
\`\`\`bash
curl http://localhost:3001/health
\`\`\`

### Queue Statistics
\`\`\`bash
curl http://localhost:3001/api/v1/queue/stats
\`\`\`

### Logs
Logs are stored in `logs/` directory:
- `combined.log`: All logs
- `error.log`: Error logs only

## Troubleshooting

### Low Balance Warning
If relayer balance < 0.1 ETH, you'll see warnings. Fund the relayer address.

### Nonce Issues
If transactions fail with nonce errors:
\`\`\`bash
curl -X POST http://localhost:3001/admin/nonce/reset
\`\`\`

### Rate Limit Issues
Adjust `RATE_LIMIT_POINTS` and `RATE_LIMIT_DURATION` in `.env`

### High Gas Prices
Increase `MAX_GAS_PRICE` or adjust `GAS_PRICE_MULTIPLIER`

## Security Best Practices

1. **Private Key Security**
   - Never commit private keys
   - Use environment variables or secrets manager
   - Rotate keys regularly

2. **Rate Limiting**
   - Enable rate limiting in production
   - Adjust limits based on traffic

3. **Monitoring**
   - Set up alerts for low balance
   - Monitor queue size
   - Track transaction failures

4. **Network Security**
   - Use HTTPS in production
   - Implement API key authentication
   - Whitelist IP addresses if possible

5. **Logging**
   - Enable detailed logging
   - Rotate logs regularly
   - Monitor for suspicious patterns

## API Endpoints

### Public Endpoints
- `GET /health` - Health check
- `GET /info` - Relayer information
- `POST /api/v1/submit` - Submit transaction
- `GET /api/v1/status/:txId` - Get transaction status
- `GET /api/v1/anonymity-set` - Get anonymity set
- `GET /api/v1/queue/stats` - Queue statistics

### Admin Endpoints (Secure these!)
- `GET /admin/queue/next` - Get next transaction
- `POST /admin/nonce/reset` - Reset nonce

## Performance Tuning

### For High Traffic
- Increase `MAX_QUEUE_SIZE`
- Decrease `GAS_PRICE_MULTIPLIER` for lower costs
- Implement transaction batching (future improvement)

### For Low Latency
- Use `priority: "instant"` for urgent transactions
- Increase `GAS_PRICE_MULTIPLIER`
- Use faster RPC provider

## Backup and Recovery

### Backup Configuration
\`\`\`bash
# Backup .env
cp .env .env.backup

# Backup logs
tar -czf logs-backup.tar.gz logs/
\`\`\`

### Recovery
If relayer crashes, transactions in "submitted" status may need manual checking:
1. Check transaction status on block explorer
2. Reset nonce if needed
3. Restart relayer

## Maintenance

### Regular Tasks
- Monitor logs daily
- Check balance weekly
- Update dependencies monthly
- Review and clear old transactions

### Upgrades
\`\`\`bash
# Stop service
pm2 stop relayer

# Pull updates
git pull

# Install dependencies
pnpm install

# Build
pnpm build

# Restart
pm2 restart relayer
\`\`\`
\`\`\`

---

## BƯỚC 10: TẠO TESTING SCRIPT

### 10.1 Test script
```bash
cd D:\privacy-sdk\packages\relayer
notepad test-relayer.sh

#!/bin/bash

# Colors
GREEN='\033[0[32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

RELAYER_URL="http://localhost:3001"

echo "Testing Privacy SDK Relayer Service"
echo "===================================="
echo ""

# Test 1: Health Check
echo -n "Test 1: Health Check... "
response=$(curl -s ${RELAYER_URL}/health)
if echo $response | grep -q "\"status\":\"ok\""; then
    echo -e "${GREEN}PASS${NC}"
else
    echo -e "${RED}FAIL${NC}"
    echo "Response: $response"
fi

# Test 2: Info Endpoint
echo -n "Test 2: Info Endpoint... "
response=$(curl -s ${RELAYER_URL}/info)
if echo $response | grep -q "\"success\":true"; then
    echo -e "${GREEN}PASS${NC}"
else
    echo -e "${RED}FAIL${NC}"
    echo "Response: $response"
fi

# Test 3: Submit Transaction
echo -n "Test 3: Submit Transaction... "
response=$(curl -s -X POST ${RELAYER_URL}/api/v1/submit \
  -H "Content-Type: application/json" \
  -d '{"type":"transfer","from":"0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266","to":"0x70997970C51812dc3A010C7d01b50e0d17dc79C8","amount":"0.1"}')
if echo $response | grep -q "\"success\":true"; then
    echo -e "${GREEN}PASS${NC}"
    txId=$(echo $response | grep -o '"transactionId":"[^"]*"' | cut -d'"' -f4)
    echo "  Transaction ID: $txId"
else
    echo -e "${RED}FAIL${NC}"
    echo "Response: $response"
fi

# Test 4: Get Status
if [ ! -z "$txId" ]; then
    echo -n "Test 4: Get Transaction Status... "
    response=$(curl -s ${RELAYER_URL}/api/v1/status/${txId})
    if echo $response | grep -q "\"success\":true"; then
        echo -e "${GREEN}PASS${NC}"
    else
        echo -e "${RED}FAIL${NC}"
        echo "Response: $response"
    fi
fi

# Test 5: Queue Stats
echo -n "Test 5: Queue Statistics... "
response=$(curl -s ${RELAYER_URL}/api/v1/queue/stats)
if echo $response | grep -q "\"success\":true"; then
    echo -e "${GREEN}PASS${NC}"
else
    echo -e "${RED}FAIL${NC}"
    echo "Response: $response"
fi

# Test 6: Rate Limiting
echo -n "Test 6: Rate Limiting... "
count=0
for i in {1..12}; do
    response=$(curl -s -X POST ${RELAYER_URL}/api/v1/submit \
      -H "Content-Type: application/json" \
      -d '{"type":"transfer","from":"0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266","to":"0x70997970C51812dc3A010C7d01b50e0d17dc79C8","amount":"0.01"}')
    if echo $response | grep -q "429"; then
        count=$((count+1))
    fi
done
if [ $count -gt 0 ]; then
    echo -e "${GREEN}PASS${NC} (Blocked $count requests)"
else
    echo -e "${RED}FAIL${NC} (No rate limiting detected)"
fi

# Test 7: Invalid Amount
echo -n "Test 7: Reject Invalid Amount... "
response=$(curl -s -X POST ${RELAYER_URL}/api/v1/submit \
  -H "Content-Type: application/json" \
  -d '{"type":"transfer","from":"0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266","to":"0x70997970C51812dc3A010C7d01b50e0d17dc79C8","amount":"15"}')
if echo $response | grep -q "\"success\":false"; then
    echo -e "${GREEN}PASS${NC}"
else
    echo -e "${RED}FAIL${NC}"
    echo "Response: $response"
fi

echo ""
echo "===================================="
echo "Testing Complete"
