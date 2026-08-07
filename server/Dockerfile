FROM node:20-slim

WORKDIR /app/server

# Install build tools for native C++ modules (better-sqlite3)
RUN apt-get update && apt-get install -y python3 make g++ sqlite3 && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

RUN npm install --production

# Rebuild native modules for Linux x64
RUN npm rebuild better-sqlite3

COPY . .

EXPOSE 3001

CMD ["npm", "start"]
