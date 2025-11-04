.PHONY: help dev stop logs logs-backend logs-frontend clean rebuild shell-backend shell-frontend urls

help: ## Display this help message
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

dev: ## Start all services in development mode
	docker-compose up -d --remove-orphans
	@echo "\n✅ Services started!"
	@make urls

stop: ## Stop all services
	docker-compose down

logs: ## View logs from all services
	docker-compose logs -f

logs-backend: ## View logs from backend service only
	docker-compose logs -f backend

logs-frontend: ## View logs from frontend service only
	docker-compose logs -f frontend

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

urls: ## Display service URLs
	@echo "\n📍 Service URLs:"
	@echo "  Backend:  http://localhost:3001"
	@echo "  Frontend: http://localhost:3000"
	@echo ""
