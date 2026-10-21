#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export PATH="/opt/homebrew/bin:$PATH"

cd "$DIR/frontend"
exec node ./node_modules/vite/bin/vite.js --port 5174 --host 0.0.0.0
