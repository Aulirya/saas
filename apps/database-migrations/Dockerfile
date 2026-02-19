# Simple migration runner for SurrealDB v3
FROM alpine:latest

# Install curl for HTTP requests
RUN apk add --no-cache curl bash grep

# Copy the migration script
COPY scripts/migrate.sh /migrate.sh
RUN chmod +x /migrate.sh

# Set the entrypoint
ENTRYPOINT ["/migrate.sh"]
