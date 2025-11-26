# Sử dụng Node.js bản ổn định
FROM node:18-slim

# Cài đặt công cụ hệ thống
RUN apt-get update && apt-get install -y python3 make g++ git && rm -rf /var/lib/apt/lists/*

# Thiết lập thư mục làm việc
WORKDIR /app

# 1. Chỉ copy package.json (vì ta đã xóa lock file)
COPY package.json ./

# 2. Dùng 'npm install' thay vì 'npm ci' để tự tạo lock file mới tương thích
RUN npm install

# Copy toàn bộ code vào container
COPY . .

# Compile Smart Contracts
RUN npx hardhat compile

# Mở port
EXPOSE 8545

# Lệnh mặc định
CMD ["npm", "run", "test"]