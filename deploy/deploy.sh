#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/var/www/silkweb"
SERVICE_NAME="silkweb"
REPO_URL="${1:-}"
BRANCH="${2:-main}"

if [[ -z "$REPO_URL" ]]; then
  echo "Usage: deploy.sh <repo-url> [branch]"
  exit 1
fi

sudo mkdir -p "$APP_DIR"
sudo chown -R ubuntu:ubuntu "$APP_DIR"

if [[ ! -d "$APP_DIR/.git" ]]; then
  git clone --branch "$BRANCH" "$REPO_URL" "$APP_DIR"
else
  git -C "$APP_DIR" fetch origin
  git -C "$APP_DIR" checkout "$BRANCH"
  git -C "$APP_DIR" pull origin "$BRANCH"
fi

cd "$APP_DIR"

mkdir -p backend/data uploads
sudo mkdir -p /etc/silkweb
if [[ ! -f /etc/silkweb/silkweb.env ]]; then
  echo "Create /etc/silkweb/silkweb.env with TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID before using the form."
fi

sudo cp deploy/silkweb.service /etc/systemd/system/${SERVICE_NAME}.service
sudo systemctl daemon-reload
sudo systemctl enable "${SERVICE_NAME}.service"
sudo systemctl restart "${SERVICE_NAME}.service"
sudo systemctl status "${SERVICE_NAME}.service" --no-pager
