# awesome_project

A clean, modern Python project starter with tests, linting, formatting, and CI.

## Quickstart

```bash
# 1) Create & activate a virtual environment
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# 2) Install the project in editable mode (plus dev tools)
pip install --upgrade pip
pip install -e .[dev]

# 3) Run the app
python -m rmit_one

# 4) Run tests
pytest

# 5) Lint & format
ruff check .
ruff format .  # or: black .
```

## What's inside

- `pyproject.toml` for build config, deps, Black, Ruff, Pytest setup
- `src/awesome_project/` with a sample CLI entry (`__main__.py`) and module
- `tests/` with Pytest example
- `.pre-commit-config.yaml` with useful hooks
- `Makefile` for common tasks
- GitHub Actions workflow for CI (`.github/workflows/ci.yml`)
- `.editorconfig` and `.gitignore`

## Rename the package

Replace `awesome_project` everywhere with your package name:

- Rename folder `src/awesome_project` → `src/<your_name>`
- In `pyproject.toml`: `name = "awesome_project"` → `"your_name"`
- Update README examples accordingly
