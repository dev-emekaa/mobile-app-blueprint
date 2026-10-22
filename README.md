# mobile-app-blueprint

**Design-to-store mobile app workflow for Claude Code — the docs come first, the design system governs every screen, the backend's api-docs drive integration, and releases go through the stores.**

Seven Claude Code skills and the rules they depend on, installed into an Expo project as one pipeline: set up the foundation, write the design system, design and build each feature area's screens on mock data for iOS and Android, spec them for the backend, integrate the real endpoints, fix what breaks, and take each release through TestFlight, the Play tracks and review. It is a frontend half of a pair: the [Backend Blueprint](https://github.com/dev-emekaa/backend-blueprint) writes the product docs this one reads, and reads the screen specs this one writes. The [Web App Blueprint](https://github.com/dev-emekaa/web-app-blueprint) is its sibling for the web client of the same product, and the [Ideas Blueprint](https://github.com/dev-emekaa/ideas-blueprint) produces the brief, PRD and logo both start from.

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
| `--analytics` | Also install the analytics rule. For products that track user behaviour with PostHog |
| `--personal` | Install skills to `~/.claude/skills` instead of the project |
| `--force` | Overwrite existing files. Default is to skip them |
| `--dry-run` | Print what would change, write nothing |

There is one stack — Expo, React Native, TypeScript, Tailwind CSS through Uniwind, React Native Reusables, TanStack Query — so no `--stack` flag. Add `--dry-run` to any command to preview it first. Re-running is safe: existing files are skipped and listed, never clobbered.

### What it writes

```
.claude/
  skills/                          7 skills
  rules/
    documentation-conventions.md   which docs arrive from the backend, which this repo owns, readiness
    tech-stack.md                  the tools, and the environments on EAS
    coding-standards.md            architecture, data layer, session, mock mode, native behaviour, how code is written
    security.md                    security policy for an installed app, and the contract the backend must meet
    testing.md                     test layers, what each proves, environments, the device matrix
    ci-cd.md                       pipelines, EAS, store builds vs updates, tags, rollback — loads only when deploy files are touched
    analytics.md                   --analytics only
CLAUDE.md                          documentation map · audiences · project configuration
docs/
  product-docs/  business-rules/  app-flows/  api-docs/  api-testing/     arrive from the backend
  screen-specs/  design/screens/  integration-handoff/  infra/  release/   written here
```

`docs/feature-areas.md` is deliberately **not** created: it arrives from the backend with `pnpm docs:pull`, which `/mobile-setup` installs. `docs/screen-specs/` is created empty; `/screen-specs` fills it from the built screens.

### After installing

1. Fill in the **audiences** and **project configuration** blocks in `CLAUDE.md`. The backend repo path and the bundle id matter most. Anything you leave blank, the skill that needs it asks for once.
2. Run `/mobile-setup`. It builds the foundation and pulls the backend's docs.
3. Run `/design-system` once the PRD and feature areas are in.
4. Run `/mobile-build` for the first feature area.

### Skills are project-scoped by default

They install to `.claude/skills/` and are meant to be committed: cloud sessions, scheduled runs and Cowork read only project skills, and rules that travel without the skills that execute them are conventions with no tooling. `--personal` exists for throwaway work.

### Updating

In a project that already has it, the installer skips existing files by design, so an update needs `--force`:

```bash
npx github:dev-emekaa/mobile-app-blueprint init --force
```

`--force` overwrites, including local edits to a skill or a rule. Run it on a clean working tree and read the diff before committing. `CLAUDE.md` is never rewritten.

Pin a tag for a fixed version: `npx github:dev-emekaa/mobile-app-blueprint#v1.0.0 init`. If an update doesn't seem to have landed, `npm cache clean --force`.

---

## The pipeline

Each step is gated on the one before it. A skill whose inputs don't exist yet stops and says so.

```
Backend Blueprint writes: feature-areas · business-rules · app-flows · (later) api-docs
 │
 ├─ /mobile-setup     → the foundation, once; pulls the backend's docs
 ├─ /design-system    → DESIGN.md, once
 └─ /mobile-build     → per feature area, in order:
      Phase 0: navigation model, tab bar and shell, once
      Design:  screen inventory → references → canvas designs → your approval   [Designed]
      Build:   screens on mock data through the real data layer, both platforms  [Built]
               → /screen-specs → pushed to the backend                           [Specced]
           ↓   once every phase-1 area is Specced, the backend designs its schema,
               then builds the areas in order, writing api-docs per area
      /mobile-integrate → per area as its api-docs land: real endpoints,
                          orphan audit, backend-issues handoff                    [Integrated]
      /mobile-release   → an update over the air, or a store build through
                          TestFlight, the Play tracks, review and a gradual rollout

/mobile-issue-fix — any time, for anything that already exists
```

**Later phases** follow the backend's: `/feature-requirements` and `/phase-review` there produce the FRD, the feature files and the frontend actions; here the unit becomes a **feature**, tracked in `docs/phase-{n}/ui-implementation-order.md`, and `/mobile-build` reads the existing screens before designing new ones.

---

## The skills

### `/mobile-setup`
**The foundation, once.** Expo scaffold with development builds and Continuous Native Generation; `app.config.ts` and `eas.json` with a development, staging and production identity each; the HTTP wrapper with the bearer header and single-flight refresh, the session module (access token in memory, refresh token in SecureStore), TanStack Query wired to the network and app state, MMKV, generated API types; the in-process mock mode that lets screens run on realistic data before the backend exists, with passthrough to the real backend for everything already integrated; design tokens from `DESIGN.md`; push, deep links, sign-in providers and payments wired; Jest, MSW and Maestro; Sentry; the three CI/CD workflows on GitHub Actions and EAS; the docs sync with the backend repo; an infra guide for the EAS, Apple, Google and GitHub steps only you can do.
**Reads** the rules, `CLAUDE.md` · **Writes** the foundation, `docs/infra/infra-setup.md`

### `/design-system`
**The source of truth for how everything looks, moves, feels and reads.** Reads the product docs to understand what kind of app this is and who holds it; researches competitors and category leaders on Mobbin, on both platforms, and reverse-engineers what makes them work; proposes a direction with a style tile for your approval; then writes `DESIGN.md` in the DESIGN.md format, linted with Google's checker — tokens that map onto React Native Reusables' variables, every component with every state on each platform, the navigation model, patterns for list, detail, form, onboarding, permissions and offline, motion and haptics, imagery, content and voice, screen sizes, accessibility — and applies the tokens to the code. Takes the brand from a sibling client's `DESIGN.md` where one exists. Built to avoid the generic.
**Reads** PRD, brief, feature areas, rules, flows, brand assets · **Writes** `DESIGN.md`

### `/mobile-build`
**Design and build one unit's screens.** Derives every screen every flow needs, with its states — including offline, permission requests and their denials — and gets the inventory approved; pulls references per screen type; designs the batch on the `/design` canvas (or as HTML prototypes where the canvas is unavailable) and iterates with you until approved; then builds the screens for iOS and Android with realistic mock data through the real hooks, wires the native capabilities each screen uses, sources images (stock, looked at before use; generated; or a prompt in `images.md`), writes the tests and the Maestro flow, walks every flow on both platforms against the approved designs, and runs `/screen-specs` so the backend can build. Two stages with a checkpoint at approval, or a whole phase's build stage in one session with subagents.
**Reads** flows, rules, DESIGN.md, existing screens · **Writes** designs, screens, mocks, tests, screen specs

### `/mobile-integrate`
**Replace mocks with the real backend.** Audits every screen against the specs and the api-docs first (build gaps, design gaps, missing endpoints, the native endpoints — push, minimum version, deletion, entitlements); aligns the hooks to the api-docs and removes the handlers; wires every documented error and background behaviour; audits for orphan endpoints; logs anything the backend must fix in a handoff file the backend reads; updates the tests to the real shapes; walks every flow against staging on both platforms and names the backend commit verified. One unit per session, or a whole phase in order.
**Reads** api-docs, specs, api-testing, flows, rules · **Writes** the integration, the handoff file

### `/mobile-issue-fix`
**Change what exists.** Reproduces the issue on the platform it was reported on and then the other, classifies it (client bug, platform defect, backend bug to log, doc error to report, change request, backend handoff to adopt), writes the failing test, fixes surgically, updates every doc the fix touched, verifies the flows it affected on both platforms, says whether the fix ships over the air or needs a store build, and delivers a PR. Adopts a backend handoff breaking-items-first.
**Reads** the issue, the code, the docs · **Writes** the fix, tests, doc updates

### `/mobile-release`
**From "what should ship" to "live for users".** Decides from the fingerprint whether the release is an over-the-air update or a store build; prepares the version, release notes, listings, Maestro-generated screenshots and compliance answers that match the code; runs the production pipeline; checks the build on real devices against the production backend; submits to both stores with phased release and staged rollout; handles approvals and rejections; raises the rollout while the crash-free rate holds, halts when it does not; records every release. Covers the first release, with the listings and compliance answers written from scratch.
**Reads** the tracker, the code, `docs/release/`, Sentry, the store consoles · **Writes** `docs/release/`

### `/screen-specs`
**What each screen sends to the backend and shows from it.** The same skill the Backend Blueprint ships, unchanged, run here in its From designs mode on the built screens so the backend has the specs it builds against.
**Reads** the built screens, flows, rules · **Writes** `docs/screen-specs/`

---

## The rules

These install into `.claude/rules/`, loaded at the start of every session — except `ci-cd.md`, which loads only when a workflow, `eas.json`, `app.config.ts` or a Maestro file is touched.

- **`documentation-conventions.md`** — which docs arrive from the backend and are read-only here, which this repo owns, how screen specs change hands, the UI tracker and its six readiness values (Draft, Ready, Designed, Built, Specced, Integrated).
- **`tech-stack.md`** — the tools: Expo with development builds, Expo Router, Tailwind through Uniwind, React Native Reusables, FlashList, Reanimated and Gesture Handler, TanStack Query, Zustand on MMKV, SecureStore, React Hook Form and Zod, expo-notifications, expo-updates, RevenueCat, Jest and Maestro, Sentry, optional PostHog; Lottie, 3D and Skia only when a feature needs them. And the environments on EAS.
- **`coding-standards.md`** — the architecture (Expo renders, TanStack caches, the backend decides), the folder structure and dependency direction, the HTTP client and error handling with offline as a state, mock mode, the data layer, the session and token lifecycle, routing and deep links, components, state, forms with the keyboard, effects, styling with the adaptive baseline for large screens, lists, animation and haptics, performance and startup, platform behaviour (permissions, push, minimum version, background), errors, code style, tests in this stack.
- **`security.md`** — tokens and sessions, device storage, transport, deep links and inbound data, permissions, environment and secrets, third-party SDKs, payments, updates and supply chain, errors, personal data and store compliance, and the **backend contract**: tokens in the body for the platform header, the minimum-version endpoint, push registration, account deletion and the link files, status semantics, additive changes, server-side purchase verification.
- **`testing.md`** — static, unit, integration (the bulk, with MSW), E2E with Maestro on real builds, smoke, manual QA on a device matrix that includes an iPad in compatibility mode and a tablet in landscape; environments and data; the regression rule.
- **`ci-cd.md`** — PR checks with `expo export` and Maestro on demand, the automatic staging deploy that builds or updates by fingerprint and moves `staging-current`, the manual production deploy of the verified commit, smoke-tested on this commit's JavaScript before any user receives it, rolled out gradually, with `prod-*` and `v*` tags, the hotfix branch, releasing alongside the backend, what rollback means for an update and for a store build.
- **`analytics.md`** *(with `--analytics`)* — the native SDK batched, explicit events named `object_action`, no personal data, identify and reset, consent, no cross-app tracking.

---

## Working with the Backend Blueprint

The two repos share the docs through `pnpm docs:pull` and `pnpm docs:push`, which `/mobile-setup` installs and which read the backend repo path from `CLAUDE.md`. Pull brings the backend's docs here, including its copy of the screen specs once it owns them; `push --specs` sends one screen-spec file there and `push --handoff` sends this client's two backend-issues files (`backend-issues-mobile.md` and its `-resolved` archive — each client writes only its own). The backend's `/backend-issue-fix` reads its open entries itself, appends each resolution, and writes a client handoff message that `/mobile-issue-fix` adopts.

The backend must meet the contract in `security.md` → Backend contract: its `security.md` and services rule (v1.2.0 and later) state the token, push, deletion and link-file lines from its side, its build skill the minimum-version endpoint; its api-docs document the platform and version headers and the error shapes. Install the Backend Blueprint with `--store-client`, so its deprecations register exists, and have its `Client release status` set before the first store submission: that is the line after which it stops making breaking changes.

Where the product also has a web client built with the Web App Blueprint, the two client repos are independent: each has its own `DESIGN.md` (the second takes the brand from the first), its own handoff file, and its own pipelines. The backend serves both.

---

## The folder version

The downloadable, manual alternative to the installer — the skills, rules and template laid out to copy into a project by hand, with its own README. Build it from this repo:

```bash
npm run package
```

It writes `dist/mobile-app-blueprint/` and `dist/mobile-app-blueprint-v{version}.zip`, from the same assets the installer uses, so the two never drift apart. Its guide lives in `folder/README.md`.

### Releasing

Every release is a version tag. Pushing one builds the zip and publishes it on the repo's **Releases** page:

```bash
npm version minor        # bumps package.json, commits, and tags v1.2.0 (patch · minor · major)
git push --follow-tags   # pushes the commit and the tag
```

The zip appears under the release's **Assets** as `mobile-app-blueprint-v1.2.0.zip` — that is the file to share. The **Source code** archives GitHub adds to every release are the repo itself, not the folder version. A tag that doesn't match the `package.json` version fails the build, so the zip's name always matches its contents.

---

**Requires** Node 22 or later, Claude Code, and for the builds an Expo account with EAS, an Apple Developer Program membership and a Google Play developer account (the setup skill's infra guide walks through them). The `/design` canvas needs a recent Claude Code signed in to a claude.ai account; `/mobile-build` falls back to HTML prototypes without it. **License** proprietary — all rights reserved.
