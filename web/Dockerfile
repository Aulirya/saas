# Frontend Dockerfile for Development
FROM oven/bun:1

WORKDIR /app

# Layer 1: Install dependencies (cached unless package.json changes)
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

# Layer 2: Copy application source code
COPY . .

# Expose Vite dev server port
EXPOSE 3000

# Run Vite dev server bound to 0.0.0.0 for Docker networking
CMD ["bun", "run", "dev", "--host", "0.0.0.0"]
