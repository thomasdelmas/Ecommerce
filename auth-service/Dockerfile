# 1. Base image
FROM node:20-alpine

# 2. Set working directory
WORKDIR /app

# 3. Copy package.json and install deps
COPY package*.json ./
RUN npm install

# 4. Copy source code
COPY . .

# 5. Build TypeScript
RUN npm run build

# 6. Command to run
CMD ["node", "dist/index.js"]