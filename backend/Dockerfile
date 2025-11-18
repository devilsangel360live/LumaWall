# Backend Dockerfile for LumaWall
FROM node:18-alpine

# Install bash and build tools required for native modules (better-sqlite3)
RUN apk add --no-cache bash python3 make g++ sqlite-dev

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Expose backend port
EXPOSE 3001

# Start the application
CMD ["npm", "start"]
