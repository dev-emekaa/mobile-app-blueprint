# Documentation Conventions

Universal and project-agnostic, for the mobile client's repo. Project specifics live in `CLAUDE.md`. The backend repo follows its own conventions rule; the two share the definitions of audience and client and the folder and file names, while each tracks readiness on its own side with its own values.

## Definitions

- **Audience** — a group of user roles that uses its own separate product, with its own screens, navigation and rules. Exactly one audience is primary.
- **Client** — a separately designed app through which an audience uses the product (mobile, web, desktop). A client is defined by design, not by device or codebase: iOS and Android apps with the same screens are one client, `mobile`. This repo is one client.
- **Unit** — this repo's word for what the work is organised around, the same thing the backend builds by: a **feature area** in the first phase, a **feature** in every later phase. The reason is the backend's: in the first phase nothing exists and each area owns its own screens; later, a feature usually touches several existing areas, so bundling by feature keeps each change contained and shippable on its own. Code is still organised by feature area: a later phase's feature puts its screens in the folders of the areas they belong to.

## Project facts

`CLAUDE.md` holds the documentation map with exact paths, the audiences (marking the primary one), which audience and client this repo is, and the project configuration the skills read. Anything missing, the first skill that needs it asks for once and offers to record it.

## Two kinds of docs

**Docs that arrive from the backend repo.** The backend pipeline writes them and they are copied here as-is. They are never edited in this repo, with one exception named below (a phase feature's screen specs, which this repo writes): an error in one is reported to the backend, not fixed here.

| Doc | Path | What it gives the frontend |
| --- | --- | --- |
| Feature-areas registry | `docs/feature-areas.md` | Every feature area, what each owns, its backend status, the first phase's order |
| PRD, product brief | `docs/product-docs/` | What the product is, its roles and features |
| Business rules | `docs/business-rules/` | What every screen must respect and every form must validate |
| App flows | `docs/app-flows/` | Every journey, step by step: the screens each flow needs |
| API docs | `docs/api-docs/` | The integration reference, per feature area |
| API testing | `docs/api-testing/` | How to exercise each endpoint against any environment |
| Phase inputs and review | `docs/phase-{n}/product-docs/`, `docs/phase-{n}/review/` | The FRD, and the review's actions for the frontend |
| Phase build order | `docs/phase-{n}/implementation-order.md` | The backend's order and readiness per feature, which the UI tracker follows |
| Phase features | `docs/phase-{n}/features/{feature}/` | The feature's rules and flows until promotion — and its screen specs, which this repo writes (see below) |
| Integration index | `docs/phase-{n}/integration/` | Per feature, the endpoints it added, linking to canonical api-docs |

**Docs this repo owns.** Written by this repo's skills; the backend reads some of them.

| Doc | Path | Written by |
| --- | --- | --- |
| UI tracker | `docs/ui-implementation-order.md` (first phase) · `docs/phase-{n}/ui-implementation-order.md` (later) | `/mobile-build` on its first run in a phase |
| Design system | `DESIGN.md`, at the project root | `/design-system` |
| Style tile | `docs/design/style-tile.html` | `/design-system`, only when the canvas is unavailable |
| Navigation map | `docs/design/navigation.md` | `/mobile-build`, in Phase 0: the navigation model and the route map |
| Approved designs | `docs/design/screens/{unit}/` | `/mobile-build`: exports of the approved screens, one folder per unit |
| Image prompts | `docs/design/images.md` | `/mobile-build`, only when an image has to be generated outside the session |
| Screen specs | `docs/screen-specs/` (first phase) · `docs/phase-{n}/features/{feature}/screen-specs-{feature}.md` (later) | `/screen-specs`, from the built UI. See ownership below |
| Backend issues | `docs/integration-handoff/backend-issues-{client}.md` · its `-resolved` archive — one file per client, this repo's being `backend-issues-mobile.md` | `/mobile-integrate` and `/mobile-issue-fix`; the backend appends resolutions |
| Analytics events | `docs/analytics-events.md` | `/mobile-setup`, `/mobile-build` and `/mobile-issue-fix`, where the `analytics` rule is installed |
| Infra setup | `docs/infra/infra-setup.md` | `/mobile-setup`: EAS, the store accounts, credentials, secrets, the steps only a person can do |
| Release records | `docs/release/` | `/mobile-release`: the store listing copy, the submission checklist, and one record per store release |

**Screen specs change hands.** This repo drafts a unit's specs from its built UI and pushes them; until then they are canonical here. Once pushed they are canonical in the backend repo: the backend reviews them, applies frontend actions, and replaces each `pending` with `METHOD /path` as it builds. From then on this repo's copy is refreshed by `docs:pull`, and edited here only when a screen changes in `/mobile-issue-fix`, which pushes the changed file back. A push always names the file it carries — a canonical area file, or a phase feature's file before promotion — so it never overwrites anything else. At promotion the backend deletes the feature's phase folder; the next `docs:pull` mirrors that deletion here, and the canonical files are from then on the only specs.

This repo has no `api-rbac` register. When `/screen-specs` runs here, an endpoint is written as `METHOD /path` only when it appears in the api-docs that arrived from the backend; everything else is `pending`.

**The backend-issues file is shared, and per client.** Each client repo writes only its own file — this one writes `backend-issues-mobile.md` — so two clients never contend over one file. This repo pushes it; the backend's `/backend-issue-fix` reads its open entries and appends each resolution, and the next `docs:pull` brings the file back. A push of it first checks that the backend's copy is the version this repo last pulled, so an appended resolution is never overwritten. The list of doc files the backend's issue-fix skill asks to be copied to the client repo is exactly what `docs:pull` brings, so nothing is copied by hand.

## Folder and file names

The same as the backend's: `{type}-{audience?}-{client?}-{feature-area}.md`, narrowing left to right, with a segment only where that split exists. The primary audience sits at the root of each folder; other audiences get `{audience}/` subfolders. Because this repo is one client, its own screen specs carry the client segment only when the backend's layout has one for this audience.

Design exports are named per screen: `docs/design/screens/{unit}/{nn}-{screen-name}.png`, numbered in flow order, with `-{state}` suffixes for states that differ materially (`04-orders-empty.png`) and a `-android` suffix only where the Android screen differs from the iOS one in more than platform chrome.

## Phases

The first phase is organised by feature area, in the order `docs/feature-areas.md` gives, and tracked in `docs/ui-implementation-order.md`. Every later phase is organised by feature, tracked in `docs/phase-{n}/ui-implementation-order.md`, in the order of the backend's `docs/phase-{n}/implementation-order.md` unless this repo records a reason to differ.

The tracker has one row per unit, with its status, the date each status was reached, and a notes column. It never holds content: content lives in the docs.

## Readiness

Six values, in order. A unit moves forward only through them, and the tracker says which it is in.

| Value | Meaning |
| --- | --- |
| `Draft` | Its business rules or app flows do not exist yet, or the backend's review has issues open against them. Never design from it. |
| `Ready` | Its business rules and app flows exist. In a later phase, the backend's review has cleared the feature. Safe to design. |
| `Designed` | Every screen every flow needs has been designed, reviewed and approved, and the exports are in `docs/design/screens/{unit}/`. |
| `Built` | Every approved screen is built with mock data through the real data layer, on both platforms, with tests passing. |
| `Specced` | Screen specs written from the built UI and handed to the backend. |
| `Integrated` | Every mock replaced by the real endpoint, tests passing, verified against staging on both platforms. |

The gate for `Integrated` work is the backend's: a unit is integrated only once the backend tracker marks it `Built` and its api-docs exist.

## Session rules

- Before working on a unit, read its business rules, app flows and, where they exist, its screen specs and api-docs — plus `business-rules-shared.md` where it exists.
- Before designing or building any screen, read `DESIGN.md`. Before designing a later phase's screens, also read the existing screen specs and the built screens' code, so every existing screen is known.
- Existing drafts are unvalidated: take stock of what exists first, and fix files rather than regenerating them.
- Docs never mention issues, resolutions, decisions or the review process.
- Docs move between the repos only with the sync scripts `/mobile-setup` installs. `pnpm docs:pull` brings the backend's docs here, including the backend's copy of the screen specs and the backend-issues file. `pnpm docs:push --specs {file}` sends one screen-spec file; `pnpm docs:push --handoff` sends this client's two backend-issues files. Nothing is copied by hand, and a doc is never edited by hand to match what the code does.
- A sync is committed on its own: commit before pushing, and commit what a pull changed before working on it.
