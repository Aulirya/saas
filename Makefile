.PHONY: help dev dev-db-reset seed stop logs logs-backend logs-frontend logs-surrealdb clean rebuild shell-backend shell-frontend shell-surrealdb urls webhook-url

help: ## Display this help message
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'


dev: ## Start all services in development mode with migrations
	@echo "🚀 Starting SurrealDB..."
	docker-compose up -d surrealdb

	@echo "📦 Running database migrations..."
	docker-compose --profile tools up --abort-on-container-exit surrealdb-migrate

	@echo "🔥 Starting application services..."
	docker-compose up -d --remove-orphans

	@echo "\n✅ Services started!"
	@make urls



migrate: ## Run database migrations
	docker-compose up -d surrealdb
	@echo "Running migrations..."
	docker-compose run --rm surrealdb-migrate
	@echo "✅ Migrations complete!"

seed: ## Seed the database with test data (WARNING: Deletes all existing data)
	docker-compose up -d surrealdb
	@echo "⚠️  WARNING: This will delete all existing data!"
	@echo "Seeding database..."
	docker-compose run --rm surrealdb-seed
	@echo "✅ Database seeding complete!"

migration-create: ## Create a new migration file (usage: make migration-create NAME=add_users_table)
	@if [ -z "$(NAME)" ]; then \
		echo "❌ Error: NAME is required. Usage: make migration-create NAME=add_users_table"; \
		exit 1; \
	fi
	@TIMESTAMP=$$(date +%Y%m%d_%H%M%S); \
	FILENAME="apps/database-migrations/migrations/$${TIMESTAMP}_$(NAME).surql"; \
	touch $$FILENAME; \
	echo "-- Migration: $(NAME)" > $$FILENAME; \
	echo "-- Created: $$(date)" >> $$FILENAME; \
	echo "" >> $$FILENAME; \
	echo "✅ Created migration: $$FILENAME"

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

run-storybook: ## Run storybook in the frontend container
	cd apps/web && bun run storybook
