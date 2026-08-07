FROM node:20-slim

WORKDIR /app

# Install build tools for native C++ modules (better-sqlite3)
RUN apt-get update && apt-get install -y python3 make g++ sqlite3 && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY server/package*.json ./server/

RUN npm install --prefix server --production

# Rebuild native modules for Linux x64
RUN npm rebuild better-sqlite3 --prefix server

COPY . .

EXPOSE 3001
ENV PORT=3001

CMD ["npm", "run", "start", "--prefix", "server"]
