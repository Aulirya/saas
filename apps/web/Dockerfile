# Frontend Dockerfile for Development (Monorepo)
FROM oven/bun:1.3.1

WORKDIR /app

# Layer 1: Copy root workspace files for dependency resolution
COPY package.json bun.lock* ./

# Layer 2: Copy workspace package.json files for resolution
COPY apps/backend/package.json ./apps/backend/
COPY packages/shared ./packages/shared

# Layer 3: Copy web workspace
COPY apps/web ./apps/web

# Layer 4: Install all workspace dependencies from root
RUN bun install --frozen-lockfile

# Set working directory to web
WORKDIR /app/apps/web

# Expose Vite dev server port
EXPOSE 3000

# Run Vite dev server bound to 0.0.0.0 for Docker networking
CMD ["bun", "run", "dev", "--host", "0.0.0.0"]
