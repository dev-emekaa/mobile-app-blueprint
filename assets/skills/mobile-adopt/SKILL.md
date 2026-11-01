---
name: mobile-adopt
description: Bring an existing mobile app under this blueprint — one built before it, or that I have just joined. Inventories the code, decides whether the stack fits, reconstructs the docs the other skills read (the UI tracker, the navigation map, DESIGN.md from the tokens in use, the screen specs from the built screens) with each fact citing its source, checks the backend contract, and lists where the code departs from the rules as issues or a proposed phase. Use once, after the backend has been adopted; changes no application code.
---

# Mobile Adopt

You are a senior engineer taking over the mobile app that nobody documented the way this blueprint expects. The other skills assume a project they started: the backend's docs pulled in, a design system, a tracker, screen specs. This skill gives an existing project those, from its code, so every later skill reads it exactly as it reads a project built here.

Two rules hold throughout. **Nothing is invented:** every reconstructed fact cites the code it was read from, and anything the code can't settle is a question to me. **Nothing in the application code changes:** what the code does wrong becomes an issue or a proposed phase, never a fix made here. The one thing this skill adds is the docs sync, because nothing else works without it.

## Before starting

The backend this client talks to must already be adopted (or built with the Backend Blueprint): its feature areas, business rules, app flows and API docs are what the client's docs are checked against. If the backend repo path in `CLAUDE.md` is blank, or its `docs/feature-areas.md` doesn't exist, stop and say so. Read that registry from the backend repo for Step 1; the pull comes in Step 2.

Read `CLAUDE.md` if it exists, and the rules: `documentation-conventions`, `tech-stack`, `coding-standards`, `security`, `testing`, `ci-cd`.

## Step 1 — Inventory → **wait for my approval**

Read the repository and present, in a few lines each:

- **Stack and shape:** framework and libraries with versions, the package manager, how it runs, tests, builds and ships; whether `ios/` and `android/` are committed; the routes and tab layout; how sign-in and tokens work; how it talks to the backend; push, deep links, payments and the other native capabilities in use; the EAS profiles and store accounts.
- **What exists:** the screens, grouped by the backend's feature areas where the mapping is clear — and, listed on their own, the screens that map to no area; the shared components; the design tokens or theme in use; which screens call real endpoints and which run on mocks or fixtures.
- **What is already written down:** any README, design files, docs, and how far each matches the code.
- **How it is run:** tests present and passing or not, CI, lint and types, error tracking, environment validation.

Then the **stack verdict**, from `tech-stack`:

- **Same stack** — Expo with Expo Router (Uniwind, React Native Reusables and TanStack Query are its libraries): every skill applies. The framework and its router decide this; where a styling, data or component library differs from `tech-stack`, the skills still apply and follow the library the code has, the `Stack / framework` row names the difference, and the gap is a deviation in Step 3.
- **Different stack:** the documentation skills still apply — `/screen-specs`, `/design-system` and the tracker are written for any client — but `/mobile-setup`, `/mobile-build`, `/mobile-integrate`, `/mobile-issue-fix` and `/mobile-release` would write the wrong stack and are **off**. A migration is proposed as a phase through the backend's `/feature-requirements` if I want one. Say which skills are on and off, and why.

I approve the inventory and the verdict, or correct them. Nothing is written before that.

## Step 2 — Reconstruct the docs

Each document is written to the format of the skill or rule that owns it, so nothing downstream can tell it was reconstructed — with one addition: the line `Reverse-engineered from the code on {date} — verify` at the top of the body (after the YAML front matter in `DESIGN.md`), and a `source:` citation (`file:line`) on every screen, token and tracker row — as an HTML comment in the screen specs and a YAML comment beside each token in `DESIGN.md`, so neither format sees it. Marker and citations both come off when I approve the document in Step 4; the report keeps what each document was read from, and the backend never receives either.

1. **The docs sync:** wire `pnpm docs:pull` and `docs:push` as `/mobile-setup` does if they aren't there, pull the backend's docs, and commit what the pull brought before going on.
2. **The UI tracker** — `docs/ui-implementation-order.md` in `documentation-conventions`' form, one row per feature area from the backend's registry, at the status that is true once this step is done: `Integrated` where every screen calls the real endpoints and its API docs exist; `Specced` where screens exist — on mocks, or only partly integrated; the notes name the screens still on mocks — and their specs are written in item 6; `Ready` where no screen exists yet, since its rules and flows do. Dates are today's, marked as the adoption date; the notes say what each row still lacks against its status' definition.
3. **`docs/design/navigation.md`** — the navigation map as `/mobile-build`'s Phase 0 writes it, from the shell and the tab layout as they are; record Phase 0 as done in the tracker's notes, as that phase does, naming the shell's files, so the next `/mobile-build` does not start there.
4. **`DESIGN.md`** — in the format `/design-system` uses, from the tokens, type, spacing, components and motion the code actually has. Where the code has no decision (no token, inline values everywhere), the section says so rather than inventing one; `/design-system` can be run later to decide it. Lint it as that skill does.
5. **Approved designs** — screenshots of each built screen and its material states on the iOS simulator, plus an `-android` export only where the Android screen differs in more than platform chrome, into `docs/design/screens/{area}/`, named per `documentation-conventions`. They record what exists; they are not approvals of how it looks.
6. **Screen specs** — run `/screen-specs` in its From designs mode on those screenshots, per feature area. They are pushed in Step 5, once approved.
7. **Releases** — into `docs/release/` as `/mobile-release` records them: `compliance.md` from `app.config.ts` (permissions and their purpose strings, the SDKs and what they collect) and the code; the version, build numbers and EAS profiles from `app.config.ts` and `eas.json`; the store listing copied from the store consoles, which I supply, never written from memory; and one release record for the version live in the stores today, with the commit a tag or build number ties it to, so the next release has a baseline.

Read the code one feature area at a time, in the registry's order. Never summarise a screen you have not opened. On a large app, give each area its own subagent told to read this skill and the rules, as `/mobile-build`'s whole-phase mode does, or compact between areas. A screen that maps to no area is not specced or tracked here: a static or client-only screen is recorded in the navigation map only (screen-specs rule 6); one that calls the backend is a registry gap raised in Step 3 for the backend — its `/feature-areas` test decides whether it is a new area or extends one — and its spec waits for that answer.

## Step 3 — Gaps and deviations

Two lists, with nothing changed:

- **Foundation gaps** — what `/mobile-setup` gives a new project and this one lacks: the data layer and session handling as `coding-standards` describes, mock mode, the test harness, the pipelines, error tracking, the infra guide.
- **Deviations** — where the code departs from the rules (`security` first — and in it the **backend contract**: does the backend meet it — read its API docs and, where it was adopted, its `docs/adoption-report.md`, and its code only where those leave a question — and does this client honour it; then `coding-standards`, `testing`, `ci-cd`), where screens disagree with the backend's app flows and business rules, and where the reconstructed screens fail the checks the backend's `/phase-review` applies to screen specs (its Stage 2, at `.claude/skills/phase-review/SKILL.md` in the backend repo). Apply those checks by reading that skill; don't restate them. Each finding: file and line, the rule or check it fails, severity, the fix.

Route each item. **Same stack:** a **`/mobile-setup` item** when it is a foundation gap — that skill takes stock of existing code and adds only what is missing; a **`/mobile-issue-fix` item** when it is one change with a failing test; a **backend issue** when the backend is what departs — an entry in `docs/integration-handoff/backend-issues-mobile.md` in `/mobile-integrate`'s format, committed and sent with `pnpm docs:push --handoff`, for `/backend-issue-fix`; a line in a **proposed phase** when it is a body of work, on either side. **Different stack:** `/mobile-setup` and `/mobile-issue-fix` are off, so every client item is a line in the proposed migration phase, or mine to do by hand — the report says which. A proposed phase goes to the backend's `/feature-requirements`, which decides it with me.

## Step 4 — Approve, per area → **wait for my approval**

Present each area's reconstructed docs with their citations — its tracker row, map entry, screenshots and specs — shortest area first; then `DESIGN.md` and the release docs; then the two lists. I confirm an area's docs are true — opening a cited line takes seconds — or correct them; marker and citations come off each approved document, and a correction re-runs Step 3's checks for that area. The lists are findings for the skills named in Step 3 to take from the report.

## Step 5 — Record

1. `CLAUDE.md`: the documentation map with a row for `docs/adoption-report.md`, which audience and client this repo is, and the project configuration from the inventory — the **Stack / framework** row with the verdict after it, `{what it is} — {blueprint's stack: all skills apply | not the blueprint's: documentation skills only; see docs/adoption-report.md}`, and the **Design system** row as `/design-system` fills it.
2. **Push the specs:** commit each approved spec file, then `pnpm docs:push --specs {file}` for it, one push per area, so the backend holds the approved version and not the marked draft; tell me the backend can run its review on them, as `/mobile-build` does. A spec not yet approved is not pushed.
3. **`docs/adoption-report.md`:** the inventory, the stack verdict, what was written and from where (each document's citations), the backend contract check, the foundation gaps, the deviations with their routing, and what I should still verify by hand. Dated.
4. Commit the docs, the sync script and the report.

## Report

A few lines: what the app is, which skills are on, how many areas were documented and at which status, how many issues and whether a phase is proposed, and the next step — `/mobile-setup` for the foundation gaps, before any `/mobile-build`; then `/mobile-issue-fix` on the first issue, `/mobile-integrate` for a `Specced` area whose API docs exist, or `/feature-requirements` for the proposed phase. From here the project is run like any other.

## Rules

- No application code changes, no refactors, no "while I'm here". A deviation is a finding.
- No doc says what the code doesn't do. A design decision the code doesn't carry is left for `/design-system`, not invented.
- Existing docs and design files are inputs, not truth: where they and the code disagree, the code wins and the disagreement is noted.
- The backend first: its docs are what this client's are checked against.
