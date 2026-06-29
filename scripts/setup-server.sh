#!/bin/sh
set -e

echo "=== Installing Docker ==="
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker ubuntu

echo "=== Installing Caddy ==="
sudo apt-get install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt-get update
sudo apt-get install -y caddy

echo "=== Cloning repo ==="
git clone https://github.com/abhinaverma97/vexa-search.git /opt/vexa

echo "=== Creating .env file ==="
cat > /opt/vexa/.env << 'ENVEOF'
GROQ_API_KEY=
AUTH_SECRET=
AUTH_GITHUB_ID=
AUTH_GITHUB_SECRET=
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
NEXT_PUBLIC_APP_URL=https://vexa.itsabhin.in
ENVEOF

echo "=== Creating Caddyfile ==="
sudo tee /etc/caddy/Caddyfile > /dev/null << 'CADDYEOF'
vexa.itsabhin.in {
    reverse_proxy localhost:3000
}
CADDYEOF

echo ""
echo "=== Next steps ==="
echo "1. Edit /opt/vexa/.env and fill in your secrets"
echo "2. Start services: cd /opt/vexa && docker compose up -d"
echo "3. Start Caddy: sudo systemctl enable --now caddy"
