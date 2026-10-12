.PHONY: help install dev test typecheck lint build migrate seed bootstrap bootstrap2

help:
	@echo "Comandos disponibles:"
	@echo "  make install     Instala dependencias"
	@echo "  make dev         Corre servidor y worker"
	@echo "  make test        Corre tests"
	@echo "  make typecheck   Corre TypeScript"
	@echo "  make lint        Corre ESLint"
	@echo "  make build       Compila el proyecto"
	@echo "  make migrate     Corre migraciones"
	@echo "  make seed        Corre seeds"
	@echo "  make bootstrap   Crea estructura fase 1"
	@echo "  make bootstrap2  Crea estructura fase 2"

install:
	npm install

dev:
	npm run dev

test:
	npm run test

typecheck:
	npm run typecheck

lint:
	npm run lint

build:
	npm run build

migrate:
	bash scripts/db-migrate.sh

seed:
	bash scripts/seed-vertical-clinic.sh
	bash scripts/seed-vertical-real-estate.sh

bootstrap:
	bash scripts/bootstrap-hybrid.sh

bootstrap2:
	bash scripts/bootstrap-phase2.sh