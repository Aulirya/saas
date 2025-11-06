# Backend Dockerfile for Development (Monorepo)
FROM oven/bun:1

WORKDIR /app

# Layer 1: Copy root workspace files for dependency resolution
COPY package.json bun.lock* ./

# Layer 2: Copy workspace package.json files for resolution
COPY web/package.json ./web/
COPY shared ./shared

# Layer 3: Copy backend workspace
COPY backend ./backend

# Layer 4: Install all workspace dependencies from root
RUN bun install --frozen-lockfile

# Set working directory to backend
WORKDIR /app/backend

# Expose backend port
EXPOSE 3001

# Run dev server with watch mode from backend directory
CMD ["bun", "run", "--watch", "src/index.ts"]
