---
name: mobile-build
description: Design and build the mobile app's screens for one feature area (first phase) or one feature (later phases) — the screen inventory, references, canvas designs for your approval, then the screens built for iOS and Android with realistic mock data through the real data layer, native capabilities, images, tests, and the screen specs handed to the backend. Use when turning a unit's business rules and app flows into designed and built UI, before its backend exists.
---

# Mobile Build

## 0. Project Configuration

Read these from the project's `CLAUDE.md`. If a value isn't recorded there, ask me for it once and offer to add it, rather than guessing or asking again each session.

| Key | What it is |
| --- | --- |
| **Project name** | The product this client serves. |
| **Audience · client** | Which audience and client this repo is. Decides which docs folders apply. |
| **Backend repo path** | For `pnpm docs:pull` and `pnpm docs:push`. |
| **Dev server command** | How to run the app in a development build, in mock mode. |
| **Test commands** · **E2E command** | Unit and integration; Maestro. |
| **Tablet support** · **Sign-in providers** · **Payments** · **Push notifications** | Which native capabilities and layouts the product has. Decides which patterns a unit's screens may use. |
| **Design canvas** | `/design` where available. |
| **Design reference library** | Mobbin, through its MCP. |
| **Image generation** | Gemini through its MCP, or none. |
| **Stock photo providers** | Unsplash, Pexels — which are configured. Their keys live in `.env`, never in `CLAUDE.md`. |
| **Production status** | Not in the stores yet / in the stores. Decides how carefully existing screens are changed, and whether a change forces a store build. |

## 1. How This App Is Built

The unit of work is a **feature area** in the first phase and a **feature** in every later phase, in the order the UI tracker gives. Each unit goes through two stages:

- **Design** — every screen the unit's flows need, designed on the canvas, iterated with me, and approved. Ends with the unit marked `Designed`.
- **Build** — the approved screens built for both platforms with realistic mock data through the real data layer, tested and verified against the designs (`Built`), then specced for the backend (`Specced`).

The two stages can run in one session or in two; the tracker says where a unit is. By default a session takes one unit through whichever stage comes next. A **whole-phase build** takes every `Designed` unit through the build stage in one session (Section 6); design is never batched across units, because every batch needs my eyes.

Three docs define what a unit's screens must do, found through the `CLAUDE.md` documentation map:

- the **app flow** tells you *which screens exist and how the user moves between them*,
- the **business rules** tell you *what each screen must respect*: limits, states, who may do what,
- the **design system** tells you *how everything looks, moves, feels and reads*, on each platform.

In a later phase, the feature's phase files are read together with the canonical files of every area it touches, plus the existing screen specs and the built screens' code, so every screen that already exists is known before a new one is designed.

**Throughout, "the unit" means whichever is being built**: the feature area in the first phase, the feature in a later one. The workflow is one workflow; the clauses that differ say which phase they apply to.

Nothing is designed that isn't traceable to a flow or a rule. If a screen seems needed and no flow calls for it, that is a gap to raise, not a screen to invent. We build **only the unit I name**; never ahead into other units.

---

## 2. Reference — Governing Files

### 2.1 — Inputs: read before designing

| File | What it gives you |
| --- | --- |
| `prd` (or the phase's `frd`) | The product, its roles and their permissions, the features in scope. |
| `feature-areas` | Every feature area, what each owns, the first phase's order. |
| `DESIGN.md` | The design system, at the project root. Read in full before the first screen; every design decision defers to it. |
| `app-flow-{{unit}}` | Every flow in the unit: entry trigger, each user action and system action, branches, error paths, the actor. The screen inventory is derived from this. |
| `business-rules-{{unit}}`, and `business-rules-shared.md` where it exists | Field limits, allowed transitions, role gates, formulas the screen displays, error conditions the screen must show. |
| `screen-specs-*` and the built screens *(later phases, or when the unit touches existing screens)* | What exists, exactly. |
| `docs/phase-{n}/review/` *(later phases)* | The review's actions for the frontend, applied before designing. |
| The UI tracker | Readiness and order. |

**Standards**: `coding-standards`, `security`, `testing` apply to everything built; `analytics` where installed. Follow them as written; this skill does not restate them.

### 2.2 — Artifacts: create or update as you build

| Artifact | What it is | When |
| --- | --- | --- |
| UI tracker | `docs/ui-implementation-order.md` (first phase) or `docs/phase-{n}/ui-implementation-order.md`. One row per unit in build order, status, dates, notes. Created from `feature-areas` or the backend's phase `implementation-order.md` on this skill's first run in a phase. | First run; every status change. |
| Approved designs | `docs/design/screens/{unit}/` — one export per screen and material state, numbered in flow order. | Approval. |
| `docs/design/images.md` | Prompts for images that must be generated outside the session, per the Images step. | When needed. |
| The screens | Routes in `app/`; screens and parts in `features/{area}/components/`, hooks in `features/{area}/api/`, schemas, fixtures and handlers in `features/{area}/mocks/` — where `{area}` is the feature area each screen belongs to, which in a later phase may be several per feature. | Build. |
| Shared components | New `components/shared/` pieces and Reusables additions a screen needs, generalised only when a second screen needs them. | Build. |
| Native wiring | The permission purpose strings, push payload routes, deep-link routes and haptic mappings a unit's screens add, in `app.config.ts` and `lib/`. | Build. |
| Tests | Integration tests per screen state, unit tests for logic, a Maestro flow for the unit's primary journey. | Build. |
| Screen specs | `docs/screen-specs/screen-specs-{{unit}}.md` (or the phase file), written by `/screen-specs` from the built screens. | After the build. |

---

## 3. Global Constraints

**Fidelity to the docs**

- Every screen traces to a flow step; every flow step has a screen or a state on a screen. A flow with a missing screen is incomplete, and the audit in Step 2 is where that is caught.
- Every field a screen captures carries the business rules' constraints (as the form schema) and every state a rule defines (pending, expired, rejected) has a designed and built state.
- Where the docs are silent, ambiguous or contradictory: **stop and ask.** Do not invent product behaviour, fields, or steps. A reference app that does something the docs don't ask for is a question, not a screen.

**Fidelity to the design system**

- `DESIGN.md` wins over taste, references and habit. A screen that needs something the system lacks is extended through `/design-system`'s later-phases rule, never styled ad hoc.
- No generic defaults: no placeholder gray boxes, no lorem ipsum, no template layouts, no spinners where the system specifies skeletons, no decoration the system does not call for.
- Platform conventions are the system's decisions: where `DESIGN.md` says iOS and Android differ, both are designed; where it says they are the same, one design serves both.

**Mock data, not mock logic**

- Mock data goes through the real data layer: hooks, `apiFetch`, the types, as `coding-standards` → Mock mode defines. A screen never imports a fixture.
- Fixtures are realistic and cover every state the screen shows, including empty, maximum and error. Handlers keep session state so a flow can be walked end to end (create, then see it in the list, then edit it).
- No business logic is reimplemented in the client beyond what a form needs for instant feedback. A calculation the backend owns is displayed from the response, not computed.

**Engineering**

- Build only the named unit. Shared components are generalised when a second screen needs them, not before.
- Follow the existing patterns of the codebase. No new dependency outside `tech-stack` without asking; the build plan names what the unit needs and why.
- Accessibility is part of done: VoiceOver and TalkBack labels and order, contrast, touch targets, font scaling, reduced motion, as `coding-standards` and `DESIGN.md` specify.
- Both platforms, every screen. Nothing is called built that was looked at on one platform only.
- Native capabilities are designed states, not afterthoughts: a permission request and its denial, a push's landing screen, a deep link's target, offline — each is in the inventory when a flow needs it, and each has the state `DESIGN.md` → Patterns gives it.
- Changing an existing screen in a later phase is surgical: the change the feature asks for, nothing else. If the app is in the stores, the change keeps the integrated data layer intact, and a change that adds native code is named as one, because it forces a store build.

**Images**

- Every image is looked at before it is used and after it is placed. An image that was never seen is never shipped.

---

## 4. Phase 0 — Information Architecture *(once, before the first unit)*

Screens are built one unit at a time; the navigation they sit in is not. Before the first unit's design, derive from the PRD, `feature-areas` and every area's flows:

- **The navigation model:** which areas are tabs, in what order, for which roles, and which live behind a tab, in the account screen or in settings; what is a full screen, a modal and a sheet; where onboarding, sign-in and the force-update screen sit. Each role's view of the app.
- **The route map:** the route for every area's main screens, with its dynamic segments, its group and its presentation. Routes are also the deep-link and push-notification targets, so they are a product decision; changing them later breaks links.
- **The shell:** the tab bar and headers per `DESIGN.md`, where search, notifications and the account entry live, and how the shell behaves on a tablet running the phone layout.
- **Global patterns the units will share:** the list screen anatomy, the detail screen anatomy, the create/edit pattern (screen, modal or sheet), the confirmation pattern, where errors and toasts appear, pull to refresh, the permission-request pattern, the offline state.

Design the shell and one example of each global pattern on the canvas, and **wait for my approval**. Then build the shell in `components/shared/` and the `(tabs)` layout, replacing the placeholders `/mobile-setup` left, and the route groups' real layouts, before the first unit. Record the navigation model and the route map in `docs/design/navigation.md`. Phase 0 ends like a unit: its tests pass, the tracker (created at the session's opening, Section 8) records it as done in its notes, and it is delivered as a PR per Step 12.

---

## 5. Workflow

### Stage A — Design

#### Step 1 — Select and scope

- Run `pnpm docs:pull` so the docs are current, and commit what it changed.
- Confirm in the UI tracker that the unit is `Ready` and the one above it is at least `Designed` (or, in whole-phase build mode, that every unit in scope is `Designed`). **Never design from a `Draft` row.** If the tracker does not exist yet, create it now from `feature-areas` (first phase) or the backend's `docs/phase-{n}/implementation-order.md` (later phase), one row per unit, all `Draft` until their docs exist, and commit it. At the start of every session, advance any `Draft` row whose Readiness condition is now met to `Ready` with the date — first phase: its business rules and app flows exist; later phase: the review has settled its rules and flows with no open founder decision (the backend's `implementation-order.md` may still read `Draft` until its screens are reviewed; that is expected, since this repo writes the screens).
- Read everything in Section 2.1 for this unit.
- In a later phase: read the existing screen specs for every area the feature touches, and open the built screens' code, so every change is made to the real current screen. Apply the review's frontend actions.
- Identify **prerequisites**: screens from other units this unit links to (a detail screen a list links into), shared components that must exist, auth states the flows assume. If a prerequisite is unbuilt, say so before starting rather than stubbing around it.

#### Step 2 — Screen inventory → **wait for my approval**

Derive, from the app flow and business rules, every screen the unit needs, and present it as a table:

| Screen | Flow(s) and step(s) | Roles | Route | Kind | States |
| --- | --- | --- | --- | --- | --- |

- **Kind:** screen, modal, sheet, step of a flow, section of another screen.
- **States:** every materially different state the flows or rules produce: loading, empty, error, offline, permission-denied, a permission request and its denial where a native capability is used, and the entity states (draft, pending, approved, expired); form validation and submit states; a platform variant only where `DESIGN.md` says the platforms differ beyond chrome.
- **Modals, sheets and secondary surfaces** are listed under their parent.
- Walk every flow step by step and tick the screen each step lands on. **A step with no screen is a gap**; a screen no step reaches is a question. List both.
- In a later phase: mark each row **new**, **changed** (naming the existing screen and what changes) or **unchanged**.
- Note the **reference plan**: which screen types you will research on Mobbin (one query per screen type, not per screen), on both platforms.

Do not proceed until I approve the inventory and answer the questions.

#### Step 3 — Reference research

On Mobbin (`platform: ios` and `platform: android`; follow the Mobbin search skill where installed), one search per screen type in the inventory, within the product's category where the category matters and across admired products where the pattern is universal. Look at the actual screens. For each screen type, record in two or three lines what the strong references do: layout, hierarchy, how they handle the states and the density, what their actions look like. Keep it to what this unit needs; the design system already settled the global decisions. Cite each reference by its Mobbin link.

References are never a source: coverage comes from the flows, constraints from the rules, appearance from `DESIGN.md`.

#### Step 4 — Design the screens on the canvas

Design in **batches of one flow** (or one screen type across flows where that reads better), in flow order, each batch presented for review before the next.

- **Invoke the `/design` skill** with a brief per batch: the product in one line, the design system's direction (pointing at `DESIGN.md`, which it reads), the screens with their purpose, content, actions and states from the inventory, the route and presentation each has, the shell it sits in, the platform (a phone frame, iOS by default, with an Android artboard only where the inventory marks a variant), and the references' lessons. Ask for every state the inventory lists, as separate artboards where the difference is material.
- **Where `/design` is not available** in this session (it needs a recent Claude Code with a claude.ai login), design each screen as a static HTML prototype in `docs/design/screens/{unit}/prototypes/`, built from the real design tokens, and open them for review the same way. The approval and export rules below are the same.
- **Judge every artboard before showing it:** does it respect `DESIGN.md` token for token; does it carry every element the flow step needs and nothing the docs don't ask for; does it have its states; is the primary action within thumb reach; would it survive the smallest phone and 200% text; would a user know what to do next; does it look like this product or like a template. Fix before presenting.
- **Present the batch** with one line per screen on what it does and any decision I should look at. I will edit on the canvas or ask for changes; apply them, re-check against the rules and the system, and present again. A change that contradicts the business rules or the design system is raised, not silently applied.
- **Content is real.** Labels, empty-state copy, error messages and confirmations are written now, in the voice `DESIGN.md` defines, from the business rules' messages where they exist. They become the built screen's copy.

#### Step 5 — Approval and checkpoint

When I approve the unit's designs:

1. Export every screen and material state to `docs/design/screens/{unit}/`, named per `documentation-conventions`.
2. Record under the tracker row anything the designs decided that the specs must carry: fields shown on a screen that the flow implied but did not list, actions that moved between screens, states added.
3. Mark the unit `Designed` with the date.
4. Commit. If the session continues into the build stage, go to Step 6. Otherwise report — the screens designed with their states, the references used, the decisions recorded under the tracker row, and any question still open — and stop. The build stage starts in a fresh session from this checkpoint.

### Stage B — Build

#### Step 6 — Build plan → **wait for my approval**

From the approved designs and the docs, list before writing code:

- **Routes** to add or change, with their group, presentation (screen, modal, sheet) and header options.
- **Screens and parts**: each component with its file.
- **Shared and Reusables components** to add or generalise, with the reason.
- **Native capabilities**: each permission, push payload, deep link, haptic or platform API the screens use, with its purpose string, its denial state, and whether it adds native code (which forces a store build once the app is in the stores).
- **Data**: each query and mutation hook, its key, the endpoint shape the screen implies (method, path and fields, as the best reading of the flow; the backend will settle it), the provisional types in the area's `api/types.ts`, the fixtures, and the handlers with the state they keep.
- **Forms**: each schema, its fields and the business rules each constraint comes from.
- **Images**: every image the designs use, with its source decided per Step 8.
- **Tests**: the states each screen's integration tests cover, the Maestro flow for the unit's primary journey.
- **New dependencies**, each with the reason, or none.
- **Gaps and conflicts**: anything the designs and docs disagree on, anything underspecified. List these as questions.

#### Step 7 — Build the screens

- Build in flow order, one screen at a time, each with every state from the inventory, matching the approved export. Run the development build in mock mode and look at each screen as you finish it, on the iOS simulator and the Android emulator, on the smallest supported phone, light and dark.
- Routes stay thin; screens live in the feature folder; data comes through hooks; forms through React Hook Form and the unit's schemas with the keyboard handled; copy from the designs; tokens from the system; haptics and motion from the system's tables. Exactly as `coding-standards` says.
- Mock handlers simulate the backend as the flow describes it, including the error responses the rules define (a 422 with field errors, a 409 on an invalid transition), so error states can be walked.
- Wire `analytics` events for the unit's intents where the rule is installed.
- Wire the native capabilities the plan listed: the purpose strings, the push payload's route, the deep link's route, the permission request through `usePermission` with its denial state.
- Keep every flow walkable end to end in mock mode: the handlers' state makes a created record show up where the flow says it will.

#### Step 8 — Images

For each image the designs call for, choose the source that fits:

- **Stock photography** where the image is a real-world subject: search Unsplash or Pexels through their APIs with the keys in `.env` (`CLAUDE.md` lists which providers are configured). If no key is configured, ask me for one and walk me through getting it (both offer free developer keys in minutes). Fetch the candidates, **look at them**, pick the one that matches the design's imagery rules, and record its attribution in `assets/images/ATTRIBUTION.md`.
- **Generated imagery** where the image is illustrative, abstract, or has to match the system's illustration style: generate it through the Gemini MCP when connected, with a prompt that states subject, style from `DESIGN.md` → Imagery, palette, composition, aspect ratio and size. **Look at the result**; regenerate until it fits.
- **Neither available**: write the prompt into `docs/design/images.md` — one entry per image with its screen, purpose, exact size and aspect ratio, style, palette, composition, what must and must not be in it, and the file name and path it should be saved to — and build the screen with a tokenised placeholder of the right size. Tell me in the report; when I add the files and say so, place them.

After placing any image: optimise it (the right format and sizes for the densities the app ships, through `expo-image`; bundled in `assets/images/` only when it is part of the product's chrome, otherwise served from the backend's CDN), and look at the screen again.

#### Step 9 — Tests

Follow `testing` for structure and approach.

- **Integration tests** per screen: it renders with the fixtures, each listed state renders, the primary actions fire the expected request (asserted through MSW), forms validate and map a 422.
- **Unit tests** for schemas with non-trivial rules, formatters, and the link and payload parsers.
- **E2E**: the unit's primary journey as a Maestro flow in `.maestro/`, listed in its README and in the staging suite; in the smoke suite only if the journey is critical to the product.
- Run the whole suite, including earlier units'. Shared components change; if this unit broke an earlier one, fix it before continuing.

#### Step 10 — Verify against the designs

Walk every flow on the iOS simulator and the Android emulator in mock mode — driving the app with Maestro and capturing screenshots, or with the simulator and emulator tools where available — screen by screen, state by state, and compare each with its approved export. Check the smallest phone, dark mode, 200% font scaling, the keyboard through each form, the Android back button on every screen, a tablet in landscape for the adaptive baseline, and the accessibility labels (the simulator's Accessibility Inspector, or the labels the test queries find). **Present the walk in the chat, flow by flow:** each screen, each platform, what was checked, and whether it matched. End with everything that did not match, and fix it before Step 11.

If a design cannot be built as approved (a layout that does not survive real content lengths, a state the design missed), say what and propose the change; a change to an approved design is raised, not made quietly.

When the walk passes, mark the unit `Built` with the date and commit.

#### Step 11 — Screen specs and handoff

1. Run `/screen-specs` in its **From designs** mode — its designs input is the unit's exports in `docs/design/screens/{unit}/`, checked against the built screens — into the canonical file in the first phase or the phase file in a later one. Review the specs against the flows and rules as that skill says. Every action's endpoint is `pending` unless it already appears in the api-docs that arrived from the backend, as `documentation-conventions` says.
2. Commit the specs, then run `pnpm docs:push --specs {file}` for the unit's file (the canonical area file, or the phase feature's file) so the backend repo receives it, and tell me the backend can run its review for this unit.
3. Mark the unit `Specced` with the date.

#### Step 12 — Update the tracker and report

- The tracker row carries its new status and date.
- Report completion:
  - **Unit** and a one-line summary of what it now lets the user do.
  - **Screens built**, with routes and the states each covers.
  - **Components added** to shared or Reusables, and why.
  - **Endpoints implied** by the hooks, as the backend will read them in the specs.
  - **Images** placed, and any waiting in `images.md`.
  - **Tests** — counts per layer, and confirmation that earlier units' suites pass.
  - **Verification** — the Step 10 walk passed, with what it caught.
  - **Open questions or deferred items**, if any.
  - **Native code added**, if any, because it forces a store build.
- **Deliver it as a PR.** Create a branch off `origin/main`, push to it, and give me the link. Never create the PR yourself. Merging deploys to staging per `ci-cd` — an update, or a store build to TestFlight and the internal track when native code changed — where the unit runs in mock mode until it is integrated.

---

## 6. Whole-Phase Build Mode

Builds every `Designed` unit of the phase through Stage B in one session, in tracker order. My input moves to the start and the end.

1. **One plan for the phase → wait for my approval.** Step 6 for every unit, in one document, every question and new dependency collected in one place. The run covers `Designed` units in order and ends before the first that is not.
2. **Build each unit in order — Steps 7 to 9 — in a fresh context.** Give each unit a subagent with its approved plan, told to read this skill, `.claude/rules/` and `DESIGN.md` first. If subagents are unavailable, build in this session and compact between units. Never build units in parallel: they share the shell, the shared components, `app.config.ts` and the mock state.
3. **Tests gate each unit.** A unit is complete when its suites and every earlier unit's pass; it is then committed, one commit per unit on one branch. A unit that fails, or meets anything its plan did not settle, stops the run with a report.
4. **One verification walk** (Step 10) of every flow in the phase, marking each unit `Built`; then **screen specs for every unit** (Step 11), one push per unit, each marked `Specced`; one report, one PR.

---

## 7. Definition of Done

A unit is not done until all of the following are true:

- [ ] Every flow in the unit's app flow has a screen or screen state for every step, with branches and error paths.
- [ ] Every screen in the approved inventory is designed, approved, exported, and built as approved on both platforms, with every listed state, meeting the adaptive baseline.
- [ ] Every field respects the business rules' constraints; every rule-defined state is designed and built.
- [ ] Every screen defers to `DESIGN.md`; nothing is styled outside the tokens.
- [ ] Mock data goes through the real data layer; every flow walks end to end in mock mode; no fixture is imported by a screen.
- [ ] Every image was seen before use and after placement, or its prompt is in `images.md` with a correctly sized placeholder in its spot.
- [ ] Every native capability the unit uses has its purpose string, its request state and its denial state.
- [ ] Integration tests cover every screen state, the primary journey is a Maestro flow, and every suite passes, this unit's and earlier units'.
- [ ] The Step 10 walk was presented and everything it caught is fixed.
- [ ] Screen specs written from the built screens, reviewed against flows and rules, and pushed to the backend.
- [ ] The tracker row moved through `Built` to `Specced` with its dates, and the report and PR link were given.

If any box cannot be ticked, say which and why rather than reporting the unit complete.

---

## 8. Opening the session

Before Step 1, in a few lines:

1. **State the phase, the unit and the stage** — design, build, or both; or whole-phase build. If I haven't said, take the next unit in the tracker through its next stage.
2. **State the project values** from `CLAUDE.md` that change what you do: production status, tablet support, which native capabilities are on, whether the canvas, Mobbin and image generation are available, which stock photo providers are configured. Ask for any that are missing.
3. **Say whether Phase 0 is done.** If the information architecture and shell are not approved and built, we start there — after creating the UI tracker if it does not exist yet, as Step 1 describes.

Then go to Step 1. Do not summarise the workflow back to me — start it.
