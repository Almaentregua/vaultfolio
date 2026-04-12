.PHONY: install dev-backend dev-frontend dev install-backend install-frontend

install-backend:
	cd backend && python3 -m venv .venv && .venv/bin/pip install -e ".[dev]"

install-frontend:
	cd frontend && npm install

install: install-backend install-frontend

dev-backend:
	cd backend && .venv/bin/uvicorn app.main:app --reload --port 8000

dev-frontend:
	cd frontend && npm run dev

# Run both in parallel (requires two terminals, or use: make dev-backend & make dev-frontend)
dev:
	@echo "Start backend: make dev-backend"
	@echo "Start frontend: make dev-frontend"
