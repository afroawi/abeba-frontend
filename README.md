# Abeba frontend — initial implementation

Responsive React/TypeScript/Vite app using the existing Django API. This first slice implements Home, public Learn search/pagination/article reading, browser chat, the Telegram chat Mini App, recent history, new conversations, AI consent, English/Amharic chat preferences and light/dark appearance. Brand assets come from the existing mobile repository.

## Run locally

Requires Node 22.12+ (tested with Node 24) and the backend channel changes in the sibling repository.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Open `http://127.0.0.1:5173`. Vite forwards `/api` and `/media` to `ABEBA_API_TARGET`, defaulting to `http://127.0.0.1:8000`. See `../abeba-backend/CHANNELS.md` to enable/migrate the API. The frontend never creates/retrieves a mobile device token. New browser accounts use an HttpOnly cookie; credentials and chat history are not stored in localStorage.

```sh
npm run typecheck
npm test
npm run build
```

Only `.env.example` belongs in version control. Frontend configuration contains no bot token, service secret or AI key.

## Telegram chat

Deploy the frontend to HTTPS with a same-origin `/api/v1/` reverse proxy. Set the bot's `ABEBA_MINI_APP_URL` to `https://your-real-domain/telegram/chat`. This route loads the Telegram SDK, exchanges signed `initData` with Django, and displays the same chat UI. The backend validates identity and launch freshness; `initDataUnsafe` is not used.

The bot and Mini App share an account and active chat pointer. `?session=123` selects an existing owned conversation after authentication; it grants no access by itself. Bot replies appear in Telegram and Mini App replies appear in the web interface. Both are persisted in the common history. History polling runs every five seconds while idle.

## Initial scope and limitations

- Content pages use the real public API, with explicit loading/errors and no fabricated fallback records. Chat uses the new `/channels/` endpoints and the existing configured AI provider.
- Chat is synchronous for this pilot. The same request key can retrieve a completed result after a network failure; failed/pending requests are not automatically regenerated. Inspect history before explicitly sending a new request.
- The initial history window is 20 recent conversations and 100 messages per selected conversation. Structured answer fields are preserved for newly generated channel messages.
- Learn articles render Markdown with raw HTML disabled. Voice, bookmarks/Explore, quiz, calendar, map, notifications, full UI translation, profile onboarding, account linking/recovery/deletion and production job recovery are later milestones.
- Ending an unlinked browser session loses access to that account. Telegram identity reconnects through a fresh verified launch. Do not advertise anonymous recovery or cross-channel mobile linking yet.
- Private responses must bypass any proxy/CDN caches. Serve SPA deep links through `index.html` but keep `/api` and `/media` routed correctly. Restrict production Django hosts/origins, set secure cookies and enforce HTTPS.
- The development server runs only on loopback. A public Telegram Mini App needs a separately configured HTTPS origin; no tunnel/deployment is created by this scaffold.

Dependencies are pinned in `package.json` and `package-lock.json`. No service worker, persistent private cache or background analytics is installed.

## Docker

Use this project's `docker-compose.yml` with an already running backend:

```sh
cp .env.example .env
# Set ABEBA_API_UPSTREAM to the API origin reachable from Docker.
docker-compose up -d --build --wait
```

Open `http://127.0.0.1:18150`. `FRONTEND_PORT` changes the host port; Nginx keeps port 8080 inside the container. The standalone default upstream is `http://host.docker.internal:8000`; use port 8015 if your API uses the older backend Compose template's default. Use the shared stack or this standalone service, since they use the same frontend host port.

To build/run directly:

```sh
docker build -t abeba-frontend .
docker run --rm -p 127.0.0.1:18150:8080 \
  --add-host host.docker.internal:host-gateway \
  -e ABEBA_API_UPSTREAM=http://host.docker.internal:8000 abeba-frontend
docker build --target test .
```

`ABEBA_API_UPSTREAM` is a runtime setting for Nginx; the API must be reachable from inside the container. On Linux the host API must listen on an address reachable from Docker's bridge. API requests and cookies stay on the frontend origin. Standalone media requests go to the upstream; the shared stack mounts public media read-only. `/healthz` provides an HTTP liveness check. The build context excludes `.env` files and installed dependencies.

See [`../DOCKER.md`](../DOCKER.md) for the shared Compose stack and optional Telegram service when working in the complete Abeba checkout.
