.PHONY: help dev dev-db-reset stop logs logs-backend logs-frontend logs-surrealdb logs-ngrok clean rebuild shell-backend shell-frontend shell-surrealdb urls webhook-url

help: ## Display this help message
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

dev: ## Start all services in development mode (without DB reset)
	docker-compose up -d --remove-orphans
	@echo "\n✅ Services started!"
	@make urls

dev-db-reset: ## Start services and reset database with migrations
	@echo "Stopping all services and removing volumes..."
	docker-compose down -v
	@echo "Starting SurrealDB..."
	docker-compose up -d surrealdb
	@echo "Running migration..."
	docker-compose run --rm surrealdb-migrate
	@echo "Starting remaining services..."
	docker-compose up -d
	@echo "\n✅ Services started with database reset!"
	@make urls

stop: ## Stop all services
	docker-compose down

logs: ## View logs from all services
	docker-compose logs -f

logs-backend: ## View logs from backend service only
	docker-compose logs -f backend

logs-frontend: ## View logs from frontend service only
	docker-compose logs -f frontend

logs-surrealdb: ## View logs from SurrealDB service only
	docker-compose logs -f surrealdb

logs-ngrok: ## View logs from ngrok service only
	docker-compose logs -f ngrok

clean: ## Remove all containers, volumes, and networks
	docker-compose down -v
	@echo "\n✅ Cleaned up containers, volumes, and networks"

rebuild: ## Rebuild and restart all services
	docker-compose down
	docker-compose build --no-cache
	docker-compose up -d --remove-orphans
	@echo "\n✅ Services rebuilt and restarted!"
	@make urls

shell-backend: ## Open a shell in the backend container
	docker-compose exec backend /bin/sh

shell-frontend: ## Open a shell in the frontend container
	docker-compose exec frontend /bin/sh

shell-surrealdb: ## Open a shell in the SurrealDB container
	docker-compose exec surrealdb /bin/sh

urls: ## Display service URLs
	@echo "\n📍 Service URLs:"
	@echo "  Frontend:      http://localhost:3000"
	@echo "  Backend:       http://localhost:3001"
	@echo "  SurrealDB:     http://localhost:8000"
	@echo "  ngrok Web UI:  http://localhost:4040"
	@echo ""
	@echo "⏳ Waiting for ngrok to start..."
	@sleep 3
	@make webhook-url

webhook-url: ## Display the ngrok webhook URL for Clerk
	@echo "\n🔗 Clerk Webhook URL:"
	@NGROK_URL=$$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | grep -o '"public_url":"https://[^"]*' | grep -o 'https://[^"]*' | head -1); \
	if [ -z "$$NGROK_URL" ]; then \
		echo "  ⚠️  ngrok not ready yet. Run 'make webhook-url' again in a few seconds."; \
	else \
		echo "  $$NGROK_URL/webhooks/clerk"; \
		echo ""; \
		echo "📋 Copy this URL to your Clerk Dashboard:"; \
		echo "   https://dashboard.clerk.com -> Webhooks -> Add Endpoint"; \
		echo ""; \
	fi

run-storybook: ## Run storybook in the frontend container
	cd web && bun run storybook