# Mobile App Blueprint

Design, build and release a product's iOS and Android app with Claude Code, connected to the real backend. Every screen follows one design system; each part of the app is designed for your approval, built and tested on both platforms with realistic mock data, then connected to the backend's real endpoints. Releases go out as over-the-air updates or through the App Store and Google Play. Seven skills and the rules behind them, for Expo · React Native · TypeScript · Tailwind CSS (Uniwind) · React Native Reusables · TanStack Query, built and shipped through EAS.

It works with the **Backend Blueprint**: it reads the backend's product docs and API docs, and sends back screen specs and issues.

---

## What's inside

```
mobile-app-blueprint/
  skills/                7 skills, one folder each
  rules/                 the rules every project uses, plus one optional
  templates/
    CLAUDE.md            the blocks to add to your project's CLAUDE.md
```

---

## Install

Everything goes into your project's `.claude/` folder, which Claude Code reads. In a terminal, from your project's root — set `BP` to wherever you unzipped this folder:

```bash
BP=~/Downloads/mobile-app-blueprint
mkdir -p .claude/rules docs
cp -R "$BP/skills" .claude/
cp "$BP"/rules/*.md .claude/rules/
```

Then:

1. **Remove the optional rule if you don't need it:** `analytics.md` — keep it only if the product tracks user behaviour with PostHog.
2. **Add the CLAUDE.md blocks.** Paste `templates/CLAUDE.md` into your project's `CLAUDE.md` (create the file if there is none). Fill in the audiences and the project configuration now — the backend repo path and the bundle id above all — or leave them; each skill asks for anything missing, once.
3. **Check it worked.** Start Claude Code and run `/context` — the rules appear under Memory files (`ci-cd.md` only once a deploy file is touched). Type `/` and the seven skills are listed.

> `.claude` is a hidden folder. To see it in Finder, press **Cmd + Shift + .**

**Commit `.claude/` with your project.** Cloud sessions and scheduled runs only read project skills, and the rules should travel with the code.

---

## Which skill when

**Starting a new mobile app**

1. `/mobile-setup` — the foundation, once: the Expo scaffold with development builds, app identity per environment, the HTTP and session layer, the data layer, mock mode, native capabilities, tests, the EAS and GitHub pipelines, and the docs sync that pulls the backend's docs into `docs/`.
2. `/design-system` — the design system, once, after the PRD and feature areas exist. Researches the niche on both platforms, proposes a direction for your approval, writes `DESIGN.md` at the project root.
3. `/mobile-build` — one feature area per session, in the order the backend's feature areas give, or the build stage of a whole phase in one session once every area is designed. First its screens are designed on the canvas and approved; then they are built for iOS and Android on mock data, tested, and specced for the backend.
4. The backend builds the area from your specs and writes its api-docs.
5. `/mobile-integrate` — one feature area per session, or the whole phase: replaces the mocks with the real endpoints and verifies against staging on both platforms.
6. `/mobile-release` — the first store release: listings, screenshots, compliance answers, the device check, submission, review, rollout.

**Adding a new phase**

1. The backend's `/feature-requirements` and `/phase-review` produce the phase's FRD, feature files and frontend actions; `pnpm docs:pull` brings them here.
2. `/mobile-build` — one feature per session; it reads the existing screens before designing new ones.
3. `/mobile-integrate` — one feature per session, or the whole phase.
4. `/mobile-release` — an update over the air, or a store build when native code changed.

**Fixing an issue, or adopting a backend change**

`/mobile-issue-fix` — reproduces on both platforms, classifies, writes the failing test, fixes surgically, updates the docs, verifies, says whether the fix ships over the air or needs a store build, and delivers a PR.

---

## The skills

**`/mobile-setup`** — Builds the foundation every screen stands on: the project per the tech stack, `app.config.ts` and `eas.json` with a development, staging and production identity each, `apiFetch` and the session module, TanStack Query wired to the network and app state, MMKV and SecureStore, generated API types, the in-process mock mode that serves screens before the backend exists, design tokens, push, deep links, sign-in providers and payments, Jest and Maestro, Sentry, the three CI/CD workflows, the docs sync, and an infra guide for the EAS, Apple, Google and GitHub steps only you can do.

**`/design-system`** — Writes `DESIGN.md`, the source of truth for how every screen looks, moves, feels and reads on each platform: principles, colors and typography with contrast checked, spacing and the navigation model, shape and depth, icons and imagery, motion and haptics, every component with every state, screen and state patterns including permissions and offline, content and voice, screen sizes and accessibility. Researches competitors and category leaders first — on Mobbin when it's connected, otherwise on the web, plus any screenshots you add — and proposes a direction for your approval.

**`/mobile-build`** — Designs and builds one feature area's screens: every screen every flow needs, with its states, inventoried for your approval; designed on the `/design` canvas and iterated with you; then built for iOS and Android with realistic mock data through the real data layer, with the native capabilities wired, images sourced and checked, tests and a Maestro flow written, every flow walked on both platforms against the approved designs, and the screen specs written for the backend.

**`/mobile-integrate`** — Replaces the mocks with the backend's real endpoints from the api-docs: an audit first, then the hooks aligned and handlers removed, every documented error and background behaviour wired, the native endpoints (push, minimum version, deletion, entitlements) integrated with the unit that owns them, an orphan-endpoint check, a handoff file for anything the backend must fix, tests on the real shapes, and a walk of every flow against staging on both platforms.

**`/mobile-issue-fix`** — Resolves anything in what already exists: bugs, crashes, platform defects, design drift, accessibility or performance problems, compliance corrections, change requests, and the changes a backend handoff requires. Failing test first, surgical fix, docs updated, flows verified on both platforms, and a clear answer on whether the fix is an update or a store build.

**`/mobile-release`** — Takes a release from "what should ship" to "live for users": update or store build by fingerprint, version and release notes, listings and Maestro-generated screenshots, compliance answers checked against the code, the production pipeline, a device check against the production backend, submission to both stores, review outcomes, a gradual rollout watched against the crash-free rate, and a record of every release. Covers the first release too.

**`/screen-specs`** — What each screen sends to the backend and shows from it, written from the built screens. The same skill the Backend Blueprint ships.

---

## The rules

Rules load into every Claude Code session and apply to all the code it writes.

| Rule | What it covers |
| --- | --- |
| `documentation-conventions.md` | Which docs arrive from the backend and which this repo owns, how screen specs change hands, the UI tracker, and the six readiness values from `Draft` to `Integrated`. |
| `tech-stack.md` | The tools the app uses and the environments each build runs in. Anything not listed is proposed in a build plan and approved first. |
| `coding-standards.md` | The architecture, folder structure, HTTP client with offline as a state, mock mode, data layer, session and tokens, routing and deep links, components, state, forms, styling with the adaptive baseline, lists, animation, performance, platform behaviour and code style. |
| `security.md` | Tokens and sessions, device storage, transport, deep links, permissions, secrets, third-party SDKs, payments, updates and supply chain, privacy and store compliance — and the contract the backend must meet. |
| `testing.md` | The test layers and what each proves, environments and data, the device matrix, and the rule that every bug gets a test that reproduces it. |
| `ci-cd.md` | PR checks, the automatic staging deploy that builds or updates by fingerprint, the manual production deploy of the verified commit with a gradual rollout, and what rollback means for an update and for a store build. Loads only when deploy files are touched. |
| `analytics.md` *(optional)* | Explicit, named events with no personal data, identify and reset, consent, no cross-app tracking. |

---

**Requires** Claude Code, an Expo project (the setup skill creates it), and for the builds an Expo account with EAS, an Apple Developer Program membership and a Google Play developer account. Mobbin is optional: without it, the design skills research on the web and from any screenshots you put in `docs/design/references/`. The `/design` canvas needs a recent Claude Code signed in to a claude.ai account; the build skill falls back to HTML prototypes without it. Updates replace these files — any edits you made to a skill or rule are overwritten, so keep your own changes in `CLAUDE.md` or new rule files.

© dev-emeka. All rights reserved. Licensed for use in your own projects; not for redistribution.
