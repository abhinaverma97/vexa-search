#!/bin/sh
set -e

command -v docker >/dev/null 2>&1 || {
  echo "=== Installing Docker ==="
  curl -fsSL https://get.docker.com | sh
  sudo usermod -aG docker ubuntu
}

command -v caddy >/dev/null 2>&1 || {
  echo "=== Installing Caddy ==="
  sudo apt-get install -y debian-keyring debian-archive-keyring apt-transport-https
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
  sudo apt-get update
  sudo apt-get install -y caddy
}

if ! grep -q "vexa.itsabhi.in" /etc/caddy/Caddyfile 2>/dev/null; then
  echo "=== Adding vexa to Caddyfile ==="
  sudo tee -a /etc/caddy/Caddyfile > /dev/null << 'CADDYEOF'

vexa.itsabhi.in {
    reverse_proxy localhost:3001
}
CADDYEOF
fi

echo "=== Done ==="
echo "1. Create /opt/vexa/.env with your secrets"
echo "2. cd /opt/vexa && docker compose up -d"
echo "3. sudo systemctl enable --now caddy"
