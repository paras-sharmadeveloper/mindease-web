#!/usr/bin/env bash
# Pull the latest panel code on the server, build it and publish it (run as root).
#
#   PANEL_DIR=/var/www/<panel docroot> bash /opt/mindease-web/deploy/update.sh
#
# One-time setup on the server:
#   apt install -y nodejs npm            # Node 20+ (or use NodeSource)
#   git clone https://github.com/paras-sharmadeveloper/mindease-web.git /opt/mindease-web
#
# The repo lives in SRC_DIR; only the built files are copied to PANEL_DIR (Apache's DocumentRoot).
set -euo pipefail

SRC_DIR="${SRC_DIR:-/opt/mindease-web}"
PANEL_DIR="${PANEL_DIR:?Set PANEL_DIR to the panel's Apache DocumentRoot}"
API_URL="${VITE_API_URL:-https://api.mindease.me/v1}"

cd "$SRC_DIR"
git pull --ff-only
npm ci --no-audit --no-fund

# Leave VITE_PREVIEW_PASSWORD_SHA256 unset to keep the "Coming soon" gate off; export it to turn the gate on.
VITE_API_URL="$API_URL" npm run build

# --delete removes old build files; .htaccess (client-side routing) is kept.
rsync -a --delete --exclude='.htaccess' dist/ "$PANEL_DIR/"

echo "Panel deployed $(git rev-parse --short HEAD) to $PANEL_DIR (API: $API_URL)"
