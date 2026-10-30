# Deploy

Every push to `main` runs [.github/workflows/deploy.yml](../.github/workflows/deploy.yml):

1. **check**: `pnpm lint` and `tsc -b`. A failure stops the deploy.
2. **image**: builds the `Dockerfile` and pushes it to `ghcr.io/diogobif/card_game` (tags `latest` and the commit SHA).
3. **deploy**: copies [compose.yaml](compose.yaml) to the server over SSH, pulls the new image, restarts the container and waits for `/healthz`.

It can also be started by hand from the repo's **Actions** tab (Deploy, then "Run workflow").

Game state lives in memory, so **each deploy ends every match in progress**. Players reconnect automatically but start fresh.

## One-time setup

### 1. Server

A Linux VPS with Docker, the Docker Compose plugin and `curl`. On Ubuntu/Debian:

```sh
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER   # log out and back in afterwards
```

Make a dedicated SSH key for GitHub Actions (on your own machine) and authorize it on the server:

```sh
ssh-keygen -t ed25519 -f deploy_key -N "" -C "github-actions"
ssh-copy-id -i deploy_key.pub youruser@your-server
```

Optional: to serve on a port other than 3001, create `~/cartas-da-discordia/.env` on the server with `PORT=8080` (for example).

### HTTPS with the server's Caddy

The container listens only on `127.0.0.1:3001`; the Caddy already running on the VPS is the public entry point. Point the subdomain's DNS at the VPS (an `A` record, e.g. name `cartas`, value the VPS IP), then add a site block to the Caddyfile and reload Caddy:

```caddy
cartas.example.com {
	reverse_proxy 127.0.0.1:3001
}
```

Caddy gets the certificate itself and proxies the `/ws` WebSocket with no extra config. If Caddy runs in Docker rather than on the host, `127.0.0.1` is Caddy's own container: put both containers on a shared Docker network and use `reverse_proxy card-game:3001` instead.

### 2. GitHub secrets

In the repo: **Settings > Secrets and variables > Actions > New repository secret**.

| Secret           | Value                                                    |
| ---------------- | -------------------------------------------------------- |
| `DEPLOY_HOST`    | server IP or hostname                                    |
| `DEPLOY_USER`    | the SSH user (must be in the `docker` group)             |
| `DEPLOY_SSH_KEY` | the full contents of the private key file `deploy_key`   |
| `DEPLOY_PORT`    | optional, SSH port if it isn't 22                        |

Optional variable (**Variables** tab): `DEPLOY_PATH`, the folder on the server, relative to the user's home. Default: `cartas-da-discordia`.

Delete the local `deploy_key` files once the secret is saved.

## Rolling back

Every image is also tagged with its commit SHA. On the server:

```sh
cd ~/cartas-da-discordia
IMAGE=ghcr.io/diogobif/card_game:<old-commit-sha> docker compose up -d
```

(If the repo is private, run `docker login ghcr.io` first with a GitHub token that has `read:packages`.) Or revert the commit on `main` and push, which redeploys normally.
