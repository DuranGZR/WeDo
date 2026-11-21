<div align="center">

<br />

<img src="docs/images/hero-banner.svg" alt="WeDo — Save. Decide. Together." width="100%" />

<br />
<br />

**Save links and ideas from any app into shared spaces, organize them into lists together, and turn inspiration into real plans.**

<p>
  <a href="https://apps.apple.com/us/app/wedo-save-together/id6823755849"><strong>App Store</strong></a> ·
  <a href="#why-wedo">Why WeDo</a> ·
  <a href="#see-it-in-action">See it in action</a> ·
  <a href="#architecture--tech-stack">Architecture</a> ·
  <a href="#engineering-decisions">Design Choices</a> ·
  <a href="#quickstart">Quickstart</a> ·
  <a href="#api-reference">API</a> ·
  <a href="#security-privacy--scope">Security &amp; Privacy</a> ·
  <a href="README.tr.md">Türkçe</a>
</p>

<p>
  <sub>
    <code>iOS App Store</code> ·
    <code>Expo SDK 57</code> ·
    <code>React Native 0.86</code> ·
    <code>FastAPI</code> ·
    <code>PostgreSQL 17</code> ·
    <code>SQLite Outbox</code> ·
    <code>EN / TR (652 keys)</code> ·
    <code>232 Tests (166 Py + 66 Jest)</code>
  </sub>
</p>

</div>

---

## Why WeDo?

Great ideas shared between partners and friends rarely live in one place—they get buried across messaging threads, browser tabs, and forgotten bookmarks. Saving a reel, restaurant, product, or movie straight from another mobile app takes more than CRUD endpoints behind a list view: share extensions must survive unreliable mobile networks, social preview thumbnails expire within hours, fetching arbitrary user URLs opens SSRF vectors, and shipping a multi-user mobile product on the App Store requires full identity lifecycle, privacy, and moderation engineering.

**WeDo** is a mobile-first shared decision and planning platform—live on the **[Apple App Store](https://apps.apple.com/us/app/wedo-save-together/id6823755849)**—designed as a modular monolith backend paired with a native-integrated Expo client and durable offline capture.

### Core Capabilities

* **Native Share-to-Save & Offline Outbox:** Capture links and shared text directly from the iOS Share Extension (`WeDoShare` via App Group) and Android Share Intents into an owner-scoped `expo-sqlite` outbox so saved items are never dropped when connectivity fluctuates.
* **SSRF-Hardened Previews & Permanent Thumbnail Caching:** Extract rich metadata via `Open Graph`, `Twitter Card`, `JSON-LD`, and YouTube/TikTok `oEmbed` through DNS-pinned `curl-cffi` requests, then resize and persist expiring social CDN images (`Instagram`, `Facebook`, `TikTok`) behind short-lived viewer-scoped signed URLs.
* **Shared Spaces, Lists & Governance:** Maintain separate spaces for partners, friends, or trips; onboard members via mobile deep-link invitations (`/invite/{token}`); organize items across custom ordered lists, search/filter, move items between lists, mark done/restore, and transfer ownership cleanly before leaving a space.
* **Multi-Provider Identity & Account Lifecycle:** Supports email/password with Argon2 hashing and Resend verification, native Sign in with Apple (including verified S2S notifications and durable background token revocation), and verified Google Sign-In—plus one-tap in-app and web account deletion.
* **Safety Controls & Bilingual Parity:** Enforces ingest-time policy filtering, durable content/user reporting with Resend alerts, mutual space isolation on user blocking, and full English/Turkish localization verified across `652` translation keys (`802` call sites) in CI.

---

## See it in action

The six-panel walkthrough below traces the full WeDo loop—from spotting an idea in another app and sending it through the native Share Sheet, to organizing shared lists and marking plans complete together:

<div align="center">
  <img src="docs/images/storyboard.png" alt="WeDo — End-to-end shared saving and planning walkthrough" width="100%" />
</div>

1. **Discover (`01`):** An inspiration link arrives in conversation instead of staying buried in chat history.
2. **Share (`02`):** Open the native iOS/Android Share Sheet, pick **WeDo**, choose the target shared space and list, and save in one tap.
3. **Organize (`03`):** Rich previews land in structured shared collections (`Places to Go`, `Shopping`, `Watchlist`, `Weekend`) with clear member attribution.
4. **Decide & Do (`04`):** Filter between pending and completed ideas, follow the original source link, and turn saved inspiration into real plans together.

*(The visual storyboard above captures the Turkish interface; the production app ships with full English and Turkish parity across `652` synchronized localization keys.)*

---

## Architecture & Tech Stack

<div align="center">
  <img src="docs/images/architecture.svg" alt="WeDo System Architecture" width="100%" />
</div>

WeDo cleanly separates mobile capture and metadata enrichment (**Write Path**) from collaborative browsing, durable account lifecycle jobs, and push notifications (**Read & Worker Path**):

* **1. Capture & Enrich (Write Path):**
  `Native Share Sheet` → `Expo App + SQLite Outbox` → `FastAPI Modular Edge` → `Metadata Fetcher` → `Preview Cache + PostgreSQL 17`
  Incoming URLs and text from the iOS Share Extension or Android Intent land in a local owner-partitioned `expo-sqlite` outbox before reaching `POST /api/v1/items`. The backend validates policies, runs SSRF-hardened metadata extraction (`curl-cffi` + `oEmbed` / `Open Graph` / `JSON-LD`), and persists expiring social CDN images as `600×600` Pillow JPEGs in PostgreSQL.

* **2. Collaborate, Lifecycle & Safety (Read & Worker Path):**
  `Shared Spaces & Lists` → `Signed Preview URLs` → `Background Worker (60s)` → `iOS & Android Client`
  Members browse space-scoped lists backed by `TanStack Query` and `Zustand`, load cached thumbnails through 5-minute viewer-scoped JWT URLs, and rely on a 60-second background worker (mirrored inside FastAPI's lifespan for API-only deployments) for durable Apple token revocations and Expo Push delivery.

### Stack Breakdown

| Layer | Choice | Why It Is Here |
| :--- | :--- | :--- |
| **Mobile & Web Client** | Expo SDK 57 · React Native 0.86 · React 19.2 · TypeScript 6 | Typed Expo Router navigation across iOS, Android, and web with `Zustand` and `TanStack Query` |
| **Native Capabilities** | `expo-share-intent` · `expo-sqlite` · `expo-secure-store` · `expo-notifications` | Custom `WeDoShare` iOS Share Extension (App Group), Android intents, secure token storage, and offline outbox |
| **Localization** | `i18next` · `react-i18next` · `expo-localization` · `LanguageMiddleware` | End-to-end TR/EN parity across `652` mobile keys and backend messages verified in CI |
| **API Core** | FastAPI · Pydantic Settings · SQLAlchemy 2 · Alembic (`19` migrations) | Modular monolith separating `auth`, `users`, `spaces`, `invitations`, `members`, `lists`, `items`, `notifications`, and `safety` |
| **Metadata & Imaging** | `curl-cffi` · `BeautifulSoup4` · `Pillow` | Browser TLS impersonation, HTML/oEmbed parsing, and `600×600` JPEG thumbnail optimization |
| **Persistence & Worker** | PostgreSQL 17 · Python Background Worker (`app.worker`) | ACID relational state, cached preview binaries, durable Apple revocation retries, and push dispatch |
| **Auth, Delivery & Ops** | Apple Sign-In · Google Sign-In · Resend · Docker · Railway | Verified social auth, transactional verification/moderation emails, and container deployment |

---

## Engineering Decisions

| Problem | Solution | Practical Impact |
| :--- | :--- | :--- |
| **Social CDN thumbnails expiring after save (`cdninstagram.com`, `tiktokcdn.com`, `fbcdn.net`)** | Detected expiring hosts and query flags (`oe=`, `x-expires=`), resized images via Pillow (`600×600` JPEG q=`82`) into PostgreSQL (`ItemPreviewImage`), and served them through `/api/v1/items/{id}/preview?token=...` with 5-minute viewer-scoped JWTs (`Cache-Control: private, no-store`) | **Zero broken `403`/`410` social previews** over time while keeping cached media strictly private to authorized space members |
| **SSRF, DNS rebinding & bot blocks on untrusted user links** | Enforced HTTP/HTTPS scheme and port allowlists (`80`, `443`, `8080`, `8443`), resolved and verified public IPs across up to `5` redirects, pinned sockets via `CurlOpt.RESOLVE`, capped responses at `2 MiB` / `5s`, and used `curl-cffi` Chrome TLS impersonation + YouTube/TikTok `oEmbed` | Protects internal infrastructure against DNS rebinding and SSRF while maintaining high preview extraction success |
| **Lost captures on unstable mobile networks** | Persisted shared payloads inside an `owner_id`-partitioned `expo-sqlite` outbox (`pending` → `processing` → `failed`) integrated with iOS App Group and Android share intents | Prevents cross-account leakage on shared devices and ensures shared links survive offline transitions |
| **App Store-compliant Apple Sign-In & deletion lifecycle** | Verified Apple tokens against JWKS, encrypted refresh tokens with Fernet, processed Apple S2S events idempotently (`SHA-256(jti)` + row locks + timestamp guards), and queued durable exponential-backoff revocations (`60s` cycle) | Handles delayed/duplicate Apple S2S callbacks safely and revokes Apple grants reliably even if Apple endpoints blip |
| **Abuse prevention & multi-user space governance** | Applied ingest-time text/domain policy checks, durable reports with Resend alerts, ordered row locking (`SELECT ... FOR UPDATE`) on blocking to sever shared-space membership/notifications, and mandatory owner transfer before leaving | Meets multi-user safety expectations cleanly without race conditions between concurrent invites and blocks |
| **Cross-platform TR/EN localization drift** | Enforced exact key parity across mobile translation catalogs via `frontend/scripts/check-locales.cjs` (`652` keys, `802` calls) alongside backend locale negotiation | Eliminates missing translation keys before changes ever reach a release build |

---

## Quickstart

### 1. Clone & Configure `.env`

```bash
git clone https://github.com/DuranGZR/WeDo.git
cd WeDo
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

For local development, default database credentials (`postgresql+psycopg://wedo:wedo@db:5432/wedo` in Docker or `localhost:5432` natively) and development JWT settings work out of the box. External provider credentials (`APPLE_*`, `GOOGLE_*`, `RESEND_API_KEY`) are only needed when testing Apple/Google Sign-In or live verification/moderation email delivery.

### 2. Start Backend & Worker (`Docker Compose`)

[`backend/compose.yml`](backend/compose.yml) launches PostgreSQL 17, runs `alembic upgrade head`, starts the FastAPI server, and boots the background `worker`:

```bash
cd backend
docker compose up --build
```

Available local backend endpoints once healthy:
* **FastAPI Server:** [http://localhost:8000](http://localhost:8000)
* **Interactive OpenAPI / Swagger Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)
* **Liveness & Readiness Probes:** [http://localhost:8000/health](http://localhost:8000/health) · [http://localhost:8000/health/ready](http://localhost:8000/health/ready)

### 3. Run the Expo Client

```bash
cd frontend
pnpm install
pnpm start
```

Set `EXPO_PUBLIC_API_URL` in `frontend/.env` to `http://localhost:8000` for simulators/web, or to your machine's LAN IP (`http://<YOUR_LAN_IP>:8000`) when running on a physical iOS or Android device.

<details>
<summary><strong>Local backend without Docker (<code>uv</code>) &amp; containerized web preview</strong></summary>

#### Run Backend Natively with `uv`

Requires a local PostgreSQL 17 instance matching `DATABASE_URL` in `backend/.env`:

```bash
cd backend
uv sync --dev
uv run alembic upgrade head

# Terminal 1 — FastAPI API
uv run uvicorn app.main:app --reload

# Terminal 2 — Background Worker (Apple revocations + Expo push dispatch)
uv run python -m app.worker
```

#### Containerized Web Preview (`compose.yml`)

The root [`compose.yml`](compose.yml) builds the static Expo web bundle served behind Nginx at `http://127.0.0.1:8081` (configured with `EXPO_PUBLIC_API_URL`):

```bash
docker compose up --build
```

</details>

---

## API Reference

Authenticated endpoints use `Authorization: Bearer <access_token>` (`15`-minute JWT paired with `30`-day rotating refresh tokens). Interactive OpenAPI docs (`/docs`, `/redoc`, `/openapi.json`) are enabled in development and automatically disabled when `ENVIRONMENT=production`.

| Route Group | Rate Limit / Auth | Purpose |
| :--- | :---: | :--- |
| `GET /health`, `/health/ready` | Public | Liveness probe and PostgreSQL readiness check |
| `/api/v1/auth/*` | `10 / min` on mutations | Email sign-up/verification/sign-in, Apple & Google sign-in + linking, Apple S2S webhook, token refresh rotation, sign-out/all, password change |
| `/api/v1/users/me` | Bearer JWT | Authenticated profile read/update and in-app account deletion |
| `/api/v1/spaces/*` & `.../members/*` | Bearer JWT | Shared space CRUD, member list/profiles, role updates/ownership transfer, and leaving a space |
| `/api/v1/invitations/*` & `GET /invite/{token}` | Bearer JWT / Public HTML | Space invitation creation, preview, acceptance, and mobile deep-link landing page (`wedo://invite/{token}`) |
| `/api/v1/lists/*` & `.../spaces/{id}/lists` | Bearer JWT | Shared list CRUD and persisted list ordering (`/api/v1/lists/reorder`) |
| `/api/v1/items/*` & `.../lists/{id}/items` | Bearer JWT / Signed JWT | Link/text item creation, metadata enrichment, move, complete/restore, activity feed, and signed preview serving (`/items/{id}/preview`) |
| `/api/v1/notifications/*` & `/api/v1/devices/*` | Bearer JWT | Notification inbox, unread count, mark-read, and Expo push device registration |
| `/api/v1/safety/*` | Bearer JWT | Content/user reporting (`POST /safety/reports`) and user blocking (`GET/PUT/DELETE /safety/blocks`) |
| `/legal/*`, `/privacy`, `/terms`, `/delete-account` | Public (`10 / min` POST) | Hosted privacy policy, terms of service, and web account-deletion request intake (`202 Accepted`) |

---

## Quality Gates & Project Layout

GitHub Actions ([`backend-quality.yml`](.github/workflows/backend-quality.yml) and [`frontend-quality.yml`](.github/workflows/frontend-quality.yml)) verify linting, static types, localization parity, and all `232` automated tests (`166` backend + `66` frontend) across every pull request and push:

```bash
# Backend lint & test suite (166 pytest tests)
cd backend
uv sync --dev --locked
uv run ruff check .
uv run pytest

# Frontend typecheck, lint, localization parity (652 keys / 802 calls) & Jest suite (15 suites / 66 tests)
cd frontend
pnpm install --frozen-lockfile
pnpm exec tsc --noEmit
pnpm exec eslint .
pnpm run i18n:check
pnpm test
```

<details>
<summary><strong>Repository Directory Tree</strong></summary>

```text
WeDo/
├── .github/workflows/
│   ├── backend-quality.yml       # Ruff + Pytest CI pipeline
│   └── frontend-quality.yml      # TypeScript + ESLint + Jest CI pipeline
├── backend/
│   ├── app/
│   │   ├── api/                  # Shared dependencies & v1 API router registration
│   │   ├── core/                 # Settings, rate limiter, Request-ID, localization & mail
│   │   ├── db/                   # SQLAlchemy 2 session, models & URL validation
│   │   ├── locales/              # Backend EN/TR message catalogs
│   │   ├── modules/              # Auth (Apple/Google/Email), spaces, invitations, lists, items, metadata, notifications, safety, users, legal
│   │   ├── application.py        # FastAPI factory & lifespan revocation loop
│   │   ├── main.py               # ASGI entry point
│   │   └── worker.py             # 60s background worker (Apple revocations + push delivery)
│   ├── migrations/               # 19 Alembic schema migrations
│   ├── tests/                    # 166 isolated pytest tests (auth, SSRF, previews, safety, scope)
│   ├── compose.yml               # Local API + Worker + PostgreSQL 17 stack
│   └── pyproject.toml            # Python 3.13 + Ruff + Pytest configuration
├── frontend/
│   ├── assets/                   # App icons, splash & brand assets
│   ├── locales/                  # Native iOS/Android InfoPlist & Share Extension locales
│   ├── plugins/                  # Expo config plugins for Share Extension & localization
│   ├── scripts/                  # Locale key-parity validator (check-locales.cjs)
│   ├── src/
│   │   ├── app/                  # Expo Router screens ((auth), (onboarding), (share), (tabs), item, list, space, settings, legal)
│   │   ├── database/             # SQLite client & owner-scoped offline sharing outbox
│   │   ├── design-system/        # Palette tokens, typography & UI primitives
│   │   ├── features/             # Domain UI & ShareIntentNavigator
│   │   ├── i18n/                 # Synchronized EN/TR translation resources (652 keys)
│   │   ├── store/                # Zustand auth & selected-space state
│   │   └── __tests__/            # 15 Jest test suites (66 tests)
│   ├── app.config.ts             # Expo SDK 57 app & native plugin manifest
│   └── package.json              # RN 0.86, React 19.2, TS 6 & scripts
├── docs/
│   ├── images/                   # Hero SVG, architecture SVG, storyboard & app screenshots
│   └── legal/                    # Published Privacy Policy, Terms & Account Deletion guides
└── compose.yml                   # Nginx-served Expo web preview container
```

</details>

---

## Security, Privacy & Scope

* **Passwords & Token Lifecycle:** Passwords use Argon2 hashing (`pwdlib[argon2]`); access tokens expire in `15` minutes and `30`-day refresh tokens are stored as SHA-256 hashes and rotated on every refresh. Apple refresh tokens stored for account-deletion revocation are encrypted at rest with Fernet.
* **Bounded Sliding-Window Rate Limiting:** In-memory sliding-window middleware enforces `120 req/min` globally and `10 req/min` per IP+route on authentication and web deletion endpoints, respecting forwarded headers only from configured trusted proxies and bounding memory at `10,000` tracked buckets.
* **SSRF & Content Guards:** Link metadata fetching rejects private/loopback/link-local IPs across redirect chains, pins DNS resolution directly into `libcurl`, limits payload sizes (`2 MiB`) and timeouts (`5s`), and screens user/item inputs against configurable blocked terms and domains.
* **Legal & Account Deletion:** Public policies and deletion flows live in [`PRIVACY_POLICY.md`](docs/legal/PRIVACY_POLICY.md), [`TERMS_OF_SERVICE.md`](docs/legal/TERMS_OF_SERVICE.md), and [`ACCOUNT_DELETION.md`](docs/legal/ACCOUNT_DELETION.md).
* **v1.0 Scope Boundaries:** Link preview quality depends on metadata that source platforms expose publicly without login or anti-bot walls. Future collaboration modules (`comments`, `reactions`, `plans`, `memories`, `uploads`) remain unmounted from the v1.0 router and explicitly guarded by [`test_excluded_features.py`](backend/tests/test_excluded_features.py).
