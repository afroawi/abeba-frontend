# Deploy web.abebachat.com on the existing server

This project serves the browser app and the Telegram Mini App. The existing backend stays at `https://dashboard.abebachat.com`, and API requests keep their `/api/v1/` paths. The Mini App URL is `https://web.abebachat.com/telegram/chat`.

## Start this project

From this project directory, copy the template only if `.env` does not already exist. If it exists, update `ABEBA_API_UPSTREAM` in that file instead of overwriting other values.

```sh
cp .env.production.example .env
# ABEBA_API_UPSTREAM=https://dashboard.abebachat.com
docker-compose -f docker-compose.prod.yml config --quiet
docker-compose -f docker-compose.prod.yml up -d --build --wait
curl -f http://127.0.0.1:18150/healthz
```

Use this standalone production file for the existing-server deployment. It starts only this project; the root development stack would start a separate database/backend. Host Nginx connects to `127.0.0.1:18150`; the container port is 8080. The runtime uses a read-only filesystem, temporary Nginx directories, a non-root user and rotating logs. HTTPS connections to the backend verify its certificate and send its hostname as SNI/Host. Browser mutations keep their original `Origin`; Django must trust `https://web.abebachat.com`.

## Host Nginx and HTTPS

Append the contents of `deploy/host-nginx.conf` to `/etc/nginx/sites-available/default`, outside your existing backend `server { ... }` blocks. Point the DNS A record for `web.abebachat.com` to this server. Add an AAAA record only if IPv6 also reaches this server.

```sh
sudo nginx -t && sudo systemctl reload nginx
```

The snippet initially listens on HTTP to support certificate setup. Use your existing certificate tooling to add HTTPS and redirect HTTP. If using Certbot's Nginx plugin, after adding both project snippets and setting DNS:

```sh
sudo certbot --nginx -d web.abebachat.com -d bot.abebachat.com --redirect
sudo nginx -t && sudo systemctl reload nginx
```

Keep the `proxy_set_header` lines when Certbot adds TLS. `$scheme` then passes `https` to the container, which forwards it to Django. The Mini App requires the resulting HTTPS URL. No certificate or server change is performed by these project files.

## Existing backend changes required

Deploy the backend revision containing channel endpoints and migration 0027. Merge these settings into its existing environment; preserve all other existing hosts/origins and the current database/provider configuration:

```dotenv
DJANGO_DEBUG=0
# Append web.abebachat.com to your existing allowed hosts.
DJANGO_ALLOWED_HOSTS=dashboard.abebachat.com,web.abebachat.com,localhost,127.0.0.1
# Append this origin to your existing trusted origins.
CSRF_TRUSTED_ORIGINS=https://dashboard.abebachat.com,https://web.abebachat.com
ABEBA_CHANNELS_ENABLED=1
ABEBA_CHANNEL_COOKIE_SECURE=1
ABEBA_TELEGRAM_BOT_TOKEN=<same TELEGRAM_BOT_TOKEN as the bot project>
ABEBA_TELEGRAM_SERVICE_TOKEN=<same random secret as the bot project>
GUNICORN_TIMEOUT=180
```

Recreate/restart the backend after changing its environment and apply migrations against its existing database. Back up that database before upgrading. When using the repository's backend production Compose file, `docker-compose -f docker-compose.prod.yml up -d --build web` rebuilds/recreates `web`; its entrypoint applies migrations and collects static files. Run that command in the **backend directory**, using your existing deployment project name and environment. A restart alone does not reload Docker environment variables.

In the existing `dashboard.abebachat.com` Nginx proxy location, keep the trusted `proxy_set_header X-Forwarded-Proto $scheme;` (or `https` in its TLS block) and allow `proxy_read_timeout 180s;` for synchronous chat. This project does not replace your existing backend/media Nginx configuration. Retain its existing public media URL; no CORS change is needed for this web app's same-origin API proxy.

## Check and update

After HTTPS and backend settings are active:

```sh
curl -f https://web.abebachat.com/healthz
curl -f https://web.abebachat.com/api/v1/config/app/
curl -f https://web.abebachat.com/api/v1/channels/csrf/
docker-compose -f docker-compose.prod.yml logs --tail=100 frontend
```

Open `/chat` in a browser and test consent and a message. Open the Mini App through Telegram to get signed launch data. Keep the configured AI model/provider key active on the existing backend.

After pulling later changes, run `docker-compose -f docker-compose.prod.yml up -d --build --wait` again. The runtime has no application database or uploaded media volume to migrate. All account/chat data remains in the existing backend. The current application remains the initial feature slice described in README.md.

References: [NGINX proxy headers/TLS](https://nginx.org/en/docs/http/ngx_http_proxy_module.html), [Django proxy SSL settings](https://docs.djangoproject.com/en/6.0/ref/settings/#secure-proxy-ssl-header).
