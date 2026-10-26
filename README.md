# mobile-app-blueprint

**Design, build and release a product's iOS and Android app with Claude Code, connected to the real backend.**

Every screen follows one design system. Each part of the app is designed for your approval, built and tested on both platforms with realistic mock data, then connected to the backend's real endpoints as they're ready. Releases go out as over-the-air updates or through the App Store and Google Play. Seven Claude Code skills and the rules behind them, for Expo.

**Works with** the [Backend Blueprint](https://github.com/dev-emekaa/backend-blueprint), which it is a client of: it reads the backend's product docs and API docs, and sends back screen specs and issues.

```bash
npx github:dev-emekaa/mobile-app-blueprint init
```

---

## Install

Run it in your project root. Nothing to install first — `npx` fetches this repo and runs it.

```bash
npx github:dev-emekaa/mobile-app-blueprint init [options]
```

| Option | Effect |
| --- | --- |
| `--analytics` | Also install the analytics rule, for products that track usage with PostHog |
| `--personal` | Install skills to `~/.claude/skills` instead of the project |
| `--force` | Overwrite existing files. Default is to skip them |
| `--dry-run` | Show what would change, write nothing |

There is one stack — Expo, React Native, TypeScript, Tailwind CSS through Uniwind, React Native Reusables, TanStack Query — so there is no `--stack` option. Re-running is safe: existing files are skipped and listed.

### What it writes

```
.claude/
  skills/        7 skills
  rules/         6 rules (plus analytics.md with --analytics)
CLAUDE.md        documentation map · audiences · project configuration
docs/
  product-docs/  business-rules/  app-flows/  api-docs/  api-testing/            arrive from the backend
  screen-specs/  design/screens/  integration-handoff/  infra/  release/         written here
```

`docs/feature-areas.md` isn't created — it arrives from the backend.

### After installing

1. Fill in the **audiences** and **project configuration** in `CLAUDE.md` — above all, the path to the backend repo and the app's bundle id. Anything you leave blank, the skill that needs it asks for once.
2. Run `/mobile-setup`. It builds the foundation and pulls the backend's docs.
3. Run `/design-system` once the PRD and feature areas are in.
4. Run `/mobile-build` for the first feature area.

Commit `.claude/` with your project: cloud sessions and scheduled runs only read project skills. `--personal` is for throwaway work.

### Updating

```bash
npx github:dev-emekaa/mobile-app-blueprint init --force
```

- Skills and rules are overwritten, including any edits you made — run it on a clean working tree and read the diff before committing.
- `CLAUDE.md` is never overwritten: it holds your project's values.
- To pin a version: `npx github:dev-emekaa/mobile-app-blueprint#v1.1.5 init`. If an update doesn't seem to land: `npm cache clean --force`.

---

## How the app gets built

Each step needs the one before it; a skill whose inputs don't exist yet stops and says so.

```
From the backend: feature areas · business rules · app flows · (later) API docs
 │
 ├─ /mobile-setup      the foundation, once; pulls the backend's docs
 ├─ /design-system     DESIGN.md, once
 └─ /mobile-build      per feature area, in order:
      first, once: the navigation and the app's shell
      design   every screen it needs, designed for your approval        → Designed
      build    screens on mock data, on iOS and Android, with tests     → Built
               → /screen-specs, sent to the backend                     → Specced
      ↓ once every area is Specced, the backend designs its database, then
        builds the areas in order, writing each one's API docs
    /mobile-integrate  real endpoints in place of the mocks             → Integrated
    /mobile-release    an over-the-air update, or a store build through review
                       and a gradual rollout

/mobile-issue-fix — any time, for anything already built
```

**Later phases** follow the backend's: the unit becomes a feature, and `/mobile-build` reads the existing screens before designing new ones.

---

## The skills

### `/mobile-setup`
The foundation, once: the Expo project with development builds and a separate identity for development, staging and production; sign-in and the data layer; the mock API that lets screens run before the backend exists; push notifications, deep links and payments wired in; tests, error tracking, the CI/CD pipelines on GitHub Actions and EAS; the docs sync with the backend repo; and a guide to the Expo, Apple, Google and GitHub steps only you can do.
**Writes** the foundation, `docs/infra/infra-setup.md`

### `/design-system`
How everything looks, moves, feels and reads on both platforms: researches the product's category, proposes a direction for your approval, then writes `DESIGN.md` — colours, type, every component and its states on iOS and Android, navigation, layouts, motion and haptics, writing style and accessibility — and applies it to the code.
**Writes** `DESIGN.md`

### `/mobile-build`
Designs and builds one feature area's screens: lists every screen its flows need — including offline and permission states — designs them for your approval, then builds them for iOS and Android on realistic mock data with images and tests, checks every flow on both platforms against the designs, and writes the screen specs the backend builds from.
**Writes** the designs, screens, mocks, tests and screen specs

### `/mobile-integrate`
Replaces the mocks with the real backend once its API docs land: checks the screens against the specs, connects every endpoint, handles every documented error, logs anything the backend must fix, and walks every flow on staging on both platforms.
**Writes** the integration, the backend-issues file

### `/mobile-issue-fix`
Changes what already exists: reproduces the issue on both platforms, writes a failing test, fixes it, updates the docs it touched, says whether the fix can go out as an update or needs a store build, and adopts changes the backend hands over.
**Writes** the fix, its tests, the docs it changes

### `/mobile-release`
Takes a release from "what should ship" to "live for users": decides whether it's an over-the-air update or a store build, prepares the version, release notes, store listings, screenshots and privacy answers, checks the build on real devices, submits it for review, and raises the rollout while the crash rate stays low. Covers the first release too.
**Writes** `docs/release/`

### `/screen-specs`
What each screen sends to the backend and shows from it — the same skill the Backend Blueprint ships, run here on the built screens.
**Writes** `docs/screen-specs/`

---

## The rules

Loaded by Claude Code at the start of every session — except `ci-cd.md`, which loads only when deploy files are touched.

| Rule | Covers |
| --- | --- |
| `documentation-conventions.md` | Which docs come from the backend, which this repo owns, and each screen's progress from Draft to Integrated |
| `tech-stack.md` | The tools — Expo, Expo Router, Uniwind, React Native Reusables, TanStack Query, RevenueCat, Jest, Maestro, Sentry — and the environments on EAS |
| `coding-standards.md` | How the app is structured and written: data, sign-in, mock mode, offline, navigation, native behaviour, performance |
| `security.md` | Tokens and device storage, deep links, permissions, secrets, payments, personal data and store rules — and what the backend must provide |
| `testing.md` | The test layers, environments and data, the devices to check on, and a test for every bug |
| `ci-cd.md` | PR checks, staging and production releases, updates versus store builds, rollback, releasing alongside the backend |
| `analytics.md` *(with `--analytics`)* | Event naming, no personal data, consent, no cross-app tracking |

---

## Working with the backend

- **Sharing docs:** `pnpm docs:pull` brings the backend's docs here; `pnpm docs:push` sends screen specs and backend issues there. `/mobile-setup` installs both, reading the backend repo's path from `CLAUDE.md`.
- **Issues:** `/mobile-integrate` logs what the backend must fix in `backend-issues-mobile.md`; the backend's `/backend-issue-fix` fixes it and hands back a message that `/mobile-issue-fix` adopts.
- **The backend's side:** it must meet `security.md` → Backend contract — tokens, push registration, the minimum-version check, account deletion and the deep-link files. Backend Blueprint v1.2.0 or later does.
- **Before the first store release:** install the Backend Blueprint with `--store-client` and set its `Client release status`. From then on it stops making changes that would break versions already on people's phones.
- **Another client for the same product:** each client repo is separate. `/design-system` takes the brand from the first client's `DESIGN.md`, so the product looks like itself everywhere.

---

## The folder version

A downloadable alternative to the installer, built from the same files:

```bash
npm run package
```

It writes `dist/mobile-app-blueprint/` and `dist/mobile-app-blueprint-v{version}.zip`. Its guide is `folder/README.md`.

### Releasing

```bash
npm version patch        # bumps package.json, commits and tags (patch · minor · major)
git push --follow-tags   # pushes the commit and the tag
```

The zip appears under the release's **Assets** as `mobile-app-blueprint-v{version}.zip` — that is the file to share, not the Source code archives. A tag that doesn't match `package.json` fails the build.

---

## Requires

- Node 22 or later, and Claude Code
- For builds and releases: an Expo account, an Apple Developer Program membership and a Google Play developer account — `/mobile-setup`'s guide walks through them
- Optional, for design research: Mobbin, connected through its MCP. Without it, `/design-system` and `/mobile-build` research on the web, plus any screenshots you put in `docs/design/references/`
- For the `/design` canvas: a recent Claude Code signed in to a claude.ai account — without it, `/mobile-build` designs as HTML prototypes instead

**License** proprietary — all rights reserved.
