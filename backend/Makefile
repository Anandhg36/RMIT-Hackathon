.PHONY: install dev test lint format run clean

install:
	pip install -e .

dev:
	pip install -e .[dev]
	pre-commit install

test:
	pytest -q

lint:
	ruff check .

format:
	ruff format . || black .

run:
	python -m awesome_project

clean:
	rm -rf dist build *.egg-info .pytest_cache .ruff_cache
