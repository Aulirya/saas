FROM oven/bun:1.1

# Bun runs as non-root by default in this image (good for DX)
WORKDIR /app

# ---- Dependencies layer (cached) ----
# Copy only what affects dependency resolution
COPY bun.lockb package.json ./

# Copy workspace manifests so Bun can resolve workspaces
COPY apps ./apps
COPY packages ./packages

# Install once for the whole monorepo
RUN bun install

# ---- Runtime (dev) ----
# Source code will be bind-mounted in docker-compose,
# so we don't need to copy it again here.

# Default command is intentionally dumb.
# Each service will override it via docker-compose.
CMD ["bun"]
