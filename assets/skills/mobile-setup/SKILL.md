---
name: mobile-setup
description: Set up an Expo mobile app's foundation once, before the first screen is designed or built — the project scaffold with development builds, app identity per environment, the HTTP and session layer, the data layer, mock mode, the design tokens, push and deep-link wiring, the test harness, the EAS and GitHub pipelines, and the docs sync with the backend repo. Use at the start of a mobile client project, or to bring an existing one up to the foundation the build skills assume.
---

# Mobile Setup

Builds the foundation every screen stands on. It runs once per project, before the first `/mobile-build`. It needs no product docs and no design system, so it can run while those are being written — only the design tokens step waits for `DESIGN.md`, and it can be run again later for that step alone.

It builds no screens: not even sign-in, which is a feature area designed and built from its own docs. It adds only what every mobile app needs. A library only some features use (camera, maps, bottom sheets, Lottie, 3D, charts) is added by the first build that needs it.

## Read first

- **The rules in `.claude/rules/`:** `tech-stack`, `coding-standards`, `security`, `testing` and `ci-cd` (and `analytics` where installed). They define what this skill builds, and it does not restate them.
- **`CLAUDE.md`:** the audiences and clients, which audience this repo serves, and the project configuration. If the backend repo path, the bundle id or the staging API URL is not recorded, ask once.
- **The backend's `docs/api-docs/`** if any exist yet, for the auth endpoints' exact paths and the platform and version headers. Until they do, the auth paths are configuration (`AUTH_REFRESH_PATH` and friends in `lib/env.ts`), set to the backend's conventional paths and corrected when the auth area is integrated.

If the repository already has code, take stock first. Keep what meets the rules, add only what is missing, and list anything that conflicts with the rules for me to decide. Never rebuild working pieces unasked. A committed `ios/` or `android/` folder is the first thing to raise: the pipelines assume Continuous Native Generation.

## Step 1 — Plan → **wait for my approval**

State what exists, what will be created, and anything the rules leave to this project: the bundle id, the scheme, which sign-in providers, whether push and payments are on, tablet support. Check the current stable version of the Expo SDK and each tool in `tech-stack` rather than relying on memory — Expo's SDK moves three times a year and its pnpm, EAS and Maestro guidance with it — and say which versions the scaffold will use.

## Step 2 — Scaffold the application

- **The project per `tech-stack`:** Expo with TypeScript strict, Expo Router with typed routes, `expo-dev-client`, Tailwind through Uniwind, ESLint and Prettier configured as `coding-standards` says, a pre-commit hook running lint-staged, pnpm with the `.npmrc` Expo requires and the supply-chain settings `security` requires, and a committed lockfile. No `ios/` or `android/` committed.
- **`app.config.ts` keyed by `APP_ENV`:** bundle id and package name with `.dev` and `.staging` suffixes, the display name with its suffix, the icon variants, the scheme, the update channel, `runtimeVersion: { policy: 'fingerprint' }`, the permission purpose strings as placeholders that a build fills in, `experiments.reactCompiler: true`, and the plugins the stack needs. It refuses a production build with mock mode on.
- **`eas.json`:** `development`, `staging`, `production` and `e2e` build profiles — `e2e` being release-mode simulator and emulator builds without the dev client, run with one environment's values at a time, the production one following the `production-smoke` channel — `appVersionSource: remote`, `autoIncrement` on, submit profiles for TestFlight and the Play internal track, and the EAS environments each profile uses.
- **React Native Reusables initialised** with the base components every product needs: button, input, label, text, select, checkbox, radio group, switch, textarea, dialog, dropdown menu, popover, tooltip, toast (`sonner-native`), tabs, card, badge, avatar, skeleton, separator. More are added per build. Sheets are `formSheet` routes by default (`coding-standards` → Routing); `@gorhom/bottom-sheet` is added when a build needs an in-screen sheet.
- **The folder structure from `coding-standards`**, with a placeholder `features/.gitkeep` and the `components/shared/` pieces every product has: screen container (safe areas, keyboard, scroll), header, empty state, error state, offline banner, list skeleton, confirm sheet. The tab bar and shell are only placeholders here: their form is decided by `/design-system` and they are designed and built in `/mobile-build`'s Phase 0.
- **Environment handling:** `lib/env.ts` declaring every `EXPO_PUBLIC_` variable with Zod, and `.env.example` naming each with a comment and no secret values.
- **Route groups** `(auth)` and `(app)` with `(tabs)` inside it, each with a layout and an `ErrorBoundary`, a root `+not-found.tsx`, and the root layout with the providers in `coding-standards`' order and the `Stack.Protected` guards around both groups. The `(app)` layout prefetches `me` and carries the readiness guard for un-integrated units. Screens are placeholders that the builds replace.
- **Fonts through `expo-font`**, the theme provider wired for dark mode following the system, `expo-splash-screen` held until fonts and the session are ready, edge-to-edge on Android, and the status bar from the theme.

## Step 3 — HTTP, session and data layer

Exactly as `coding-standards` → sections 3 to 5 describe:

- `lib/http/core.ts` with `ApiError`, the status table, and the base URL that mock mode points at the in-process dispatch.
- `lib/http/api-fetch.ts` with the bearer header, the platform and version headers `security` names, single-flight refresh-and-retry, and the offline mapping.
- `lib/auth/session.ts`: the access token in memory, the refresh token in SecureStore with `WHEN_UNLOCKED_THIS_DEVICE_ONLY`, launch and foreground refresh, sign-in and sign-out with the clearing order `coding-standards` gives.
- `lib/query-client.ts` with the defaults (`staleTime`, retry rules), `onlineManager` from NetInfo and `focusManager` from `AppState`.
- `lib/storage.ts`: the MMKV instances (default, and an encrypted one keyed from SecureStore) and the Zustand storage adapter.
- `hooks/use-me.ts`, `hooks/use-online.ts`, `hooks/use-min-version.ts` with its `supported` / `soft` / `force` states and the placeholder screens for the last two, and `hooks/use-permission.ts`.
- `pnpm api:types`, generating `types/api.ts` from the backend's OpenAPI spec recorded in `CLAUDE.md`. The backend exposes one only once it is built, so the script is wired here and first run at the first integration; until then every feature's types are provisional, per `coding-standards` → HTTP client.
- **Local dev against a deployed backend:** a `pnpm dev:staging` script that starts the dev server with `EXPO_PUBLIC_API_URL` pointed at staging in direct mode. Unlike the web client, no hosts entry is needed: bearer tokens work from any origin.

## Step 4 — Mock mode

The semantics — the mode switch, in-process dispatch, passthrough, sessions, the sign-in-first rule, the production exclusion — live in `coding-standards` → Mock mode and are not restated here. This step creates the pieces:

- The dispatch in `core` behind `EXPO_PUBLIC_API_MODE`, importing the mock module only outside production.
- The handler helper: `defineHandlers({ 'GET /orders': ({ query, session }) => ... })`, with path parameters, latency simulation, in-memory state for the app's lifetime, and the `?mock=error` switch.
- `src/mocks/msw.ts`, converting the same handlers to MSW for Jest.
- `src/mocks/auth.ts`, the mock auth for the conventional auth paths (`/auth/sign-in`, `/auth/sign-out`, `/auth/refresh`, `/auth/me` — corrected at integration), returning JWT-shaped tokens through `session`.
- One example feature folder, `features/_example/`, showing provisional types, a query hook, an infinite query with FlashList, a mutation hook, fixtures, handlers, a screen with every state, and a form, deleted by the first real build.

## Step 5 — Design tokens *(when `DESIGN.md` exists; otherwise placeholders, and re-run this step later)*

- `styles/global.css` defining `DESIGN.md`'s colors, radii, spacing and type scale as `@theme` variables under the Reusables names — each color with its `-dark` twin — and the maximum content width from its Layout section, all exposed as Tailwind classes through Uniwind.
- The Reusables components adjusted to the design system's radii, borders, pressed states and type.
- The fonts `DESIGN.md` names, loaded with `expo-font`.
- The durations and easings from its Motion table in `lib/motion.ts` for Reanimated, and the haptic mapping in `lib/haptics.ts`.

## Step 6 — Native capabilities

Wired once, used by the builds:

- **Push:** `lib/notifications.ts` with the permission request, the Expo push token's registration and unregistration against the backend's endpoint (a configured path until the api-docs name it), foreground presentation, and the tap handler that validates the payload's route like a deep link. The `expo-notifications` plugin and the push credentials are infra-guide steps.
- **Deep links:** the scheme in `app.config.ts`, the associated domains and intent filters for the web domain `CLAUDE.md` records, the sign-in redirect that remembers a validated route, and a note in the infra guide on the `.well-known` files the web domain must serve.
- **Sign-in providers** the plan chose: `expo-apple-authentication` and `expo-auth-session` with their config, exchanging the identity token with the backend's configured paths.
- **Payments**, where on: the RevenueCat SDK initialised with its public key per environment and the entitlement hook that reads the backend; or Stripe's provider.
- The `usePermission` hook and the permission purpose strings as placeholders.

## Step 7 — Test harness

- Jest with the `jest-expo` preset, `jest.setup.ts` starting MSW from the shared handlers with `onUnhandledRequest: 'error'`, the once-only mocks for native modules, and `renderWithProviders`.
- Maestro: `.maestro/` with a config, the smoke flows (3–5, tagged) and a `README.md` listing the journeys and why each is there; the smoke suite starts with "the app launches and sign-in renders".
- One working test of each kind against the foundation: a unit test of a formatter, an integration test of the example screen, and the smoke flow run on an `e2e` build in a simulator.

## Step 8 — Observability and analytics

- Sentry per `security`: the Expo plugin, scrubbing, source maps upload in EAS Build and EAS Update, environment per build, the error boundaries reporting, expected `ApiError`s and offline failures filtered, native crash reporting on.
- Where `analytics` is installed: the PostHog provider, screen tracking from the root layout, identify and reset wired to sign-in and sign-out, and `docs/analytics-events.md` started.

## Step 9 — Pipelines

- **The three GitHub Actions workflows `ci-cd` defines:** PR checks (with the `e2e` label path), the staging deploy with the fingerprint comparison, EAS Build and Submit or EAS Update, the `staging-current` tag and the Maestro run through EAS Workflows, and the production deploy with its release-owner check, SHA-only `commit` input, `version` validation, the smoke test on the `production-smoke` channel before anything reaches users, the 10% rollout and release tags.
- **The EAS Workflows file** for the Maestro job and anything `ci-cd` runs on EAS rather than on GitHub. Check EAS's current documentation for the CLI flags, the fingerprint comparison and the Maestro job; they change.
- **Dependabot or Renovate** configuration, and the security policies `security` → Updates and supply chain requires.

## Step 10 — Docs sync with the backend

- `scripts/docs-sync.mjs` with `pnpm docs:pull` and `pnpm docs:push`, reading the backend repo path from `CLAUDE.md` and keeping, per synced file, the hash of the version last pulled:
  - **pull** copies from the backend every doc `documentation-conventions` lists as arriving from it, plus the backend's `docs/screen-specs/` and phase screen-spec files where they exist, and `docs/integration-handoff/` where it exists, replacing this repo's copies, and reports what changed. A file an earlier pull brought that no longer exists in the backend is deleted here and reported — the backend's promotion deletes a feature's phase folder, and the canonical files are then the specs. It refuses to overwrite or delete a file with uncommitted local changes. **This client's handoff files are the one exception to replacing:** they are three-way merged against the last-pulled version, so entries committed here and resolutions appended there both survive — both sides only append, so the merge never conflicts, and a real conflict stops with a message.
  - **push `--specs {file}`** copies one screen-spec file (a canonical area file, or a phase feature's file) to the same path in the backend's `docs/`; **push `--handoff`** copies `backend-issues-mobile.md` and `backend-issues-mobile-resolved.md` and nothing else. Both first check that the backend's copy is the version this repo last pulled, and stop with a message to pull first if it is not, so a stale copy never overwrites the backend's edits. Push copies nothing else, and refuses to copy a file with uncommitted changes, so what the backend receives is always a committed version.
- The `docs/` folders from the documentation map, with `.gitkeep` files where nothing exists yet. `docs/feature-areas.md` is never created here; it arrives from the backend.

## Step 11 — Infra guide

Write `docs/infra/infra-setup.md`: every step only I can do, numbered, so staging and production can be set up start to finish by following it.

- **On EAS:** the project, the three environments with their values (from `.env.example`, production separate), the Expo token for the workflows, iOS and Android credentials generated and stored in EAS, the push credentials (the APNs key and the FCM service account) in this project's EAS credentials — the backend sends through Expo's push service with the push tokens alone, and needs an Expo access token only if enhanced push security is turned on — the `production-smoke` channel, and code signing for updates where the plan includes it.
- **On Apple:** the Developer Program, the App Store Connect app records for the staging and production bundle ids, the Sign in with Apple capability where used, TestFlight's internal group, and the associated domains.
- **On Google:** the Play Console apps for the staging and production package names, the internal testing track, Play App Signing, the Data safety form started with the deletion-request page's URL, and, where Google sign-in is used, one iOS client id and one Android client id per package name and signing key (development, staging, production).
- **On GitHub:** branch protection with PR checks required, squash merges, the release owners (whose usernames go into the production workflow), the `staging` and `production` environments holding the Expo token, secret scanning with push protection.
- **Elsewhere:** the Sentry project per environment, the RevenueCat project and its store connections where payments are on, the stock photo API keys and the image generation account if `/mobile-build` will use them, the analytics projects where installed, and the `.well-known` files the web domain's owner must serve — carrying the development, staging and production identifiers, with each Android package's SHA-256 from Play App Signing and the Apple Team ID, so staging links verify too — plus the deletion-request page Play requires.
- **With the backend:** confirm the backend contract from `security` with the backend developer, item by item, before the first integration — the platform header and tokens in the body, the minimum-version endpoint, the push endpoint and provider, account deletion and the deletion-request page, the link files.

Then **offer to walk me through it live.** Once the EAS project exists, record the identifiers, the dev and test commands, the E2E command and the sync commands in `CLAUDE.md`.

## Step 12 — Verify and report

1. **Verify from a clean clone:** install; a development build for the iOS simulator and the Android emulator; `pnpm dev` in mock mode renders the example screen with mock data on both; the guard sends a signed-out launch to sign-in; the mock sign-in stores the refresh token and `useMe` resolves; a killed-and-relaunched app restores the session through the refresh path; lint, type check, unit and integration pass; `expo export` succeeds under the bundle budget; the smoke suite passes on the `e2e` build.
2. **Verify mock mode's edges:** a path with no handler is forwarded to the configured API URL with the `Authorization` header; a build with `APP_ENV=production` ignores the mode and the test proves it.
3. **Report:** what was created, the commands, what remains for me (the infra guide), and any open decisions.
4. **Deliver it as a PR.** Create a branch off `origin/main`, push to it, and give me the link to create the PR. Never create the PR yourself. The PR checks workflow added here runs on that PR. Say plainly that the PR is merged only after the infra guide's EAS and GitHub sections are done: until then the staging workflow fails at its first EAS call.
