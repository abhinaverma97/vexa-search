# deploy.md

## Server Details
- Provider: Oracle Cloud
- OS: Ubuntu 24.04
- Public IP: 92.4.74.77
- SSH user: ubuntu

## Caddy Configuration
File: /etc/caddy/Caddyfile
Managed by: Manual edits on the server (NOT from CI/CD)

Current configuration:
```
{ email abhinav7verma@gmail.com }
vexa.itsabhi.in {
  reverse_proxy localhost:3001
}
tv.itsabhi.in {
  reverse_proxy localhost:3000
}
```

Commands:
- Check status: `sudo systemctl status caddy`
- Reload after change: `sudo caddy reload --config /etc/caddy/Caddyfile --force`
- View logs: `sudo journalctl -u caddy -f`

TLS: Automatically issued by Let's Encrypt via tls-alpn-01 challenge. No manual cert steps needed once DNS resolves and port 443 is open.

## GitHub Secrets
Set in Settings → Secrets and variables → Actions:

| Secret | Purpose |
|--------|---------|
| HOST | Server IP (92.4.74.77) |
| USER | SSH user (ubuntu) |
| SSH_KEY | Contents of ~/.ssh/oracle |