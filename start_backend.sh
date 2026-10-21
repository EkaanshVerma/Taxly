#!/bin/bash
# Taxly backend launcher — uses /tmp/taxly_venv to avoid pycache timeout issues
set -e

VENV=/tmp/taxly_venv
BACKEND=/Users/hrtc/Desktop/Taxly/backend
ENV_FILE=$BACKEND/.env

echo "Starting Taxly backend on port 8000..."

# Load .env
if [ -f "$ENV_FILE" ]; then
  export $(grep -v '^#' "$ENV_FILE" | xargs)
  echo "Loaded .env"
fi

cd "$BACKEND"
exec "$VENV/bin/python3" -m uvicorn main:app --host 0.0.0.0 --port 8000
