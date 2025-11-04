# Backend Dockerfile for Development
FROM oven/bun:1

WORKDIR /app

# Layer 1: Install dependencies (cached unless package.json changes)
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

# Layer 2: Copy application source code
COPY src ./src
COPY tsconfig.json ./

# Expose backend port
EXPOSE 3001

# Run dev server with watch mode
CMD ["bun", "run", "--watch", "src/index.ts"]
