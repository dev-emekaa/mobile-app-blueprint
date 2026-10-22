---
name: mobile-integrate
description: Integrate a built unit's screens with the backend's real endpoints — one feature area (first phase) or feature (later phases) per session, or a whole phase in order — from the api-docs as the primary source, with an audit first, an orphan-endpoint check after, a backend-issues handoff for anything the backend must fix, tests, and verification against staging. Use once the backend has built the unit and its api-docs exist.
---

# Mobile Integrate

## 0. Project Configuration

Read these from the project's `CLAUDE.md`. If a value isn't recorded there, ask me for it once and offer to add it.

| Key | What it is |
| --- | --- |
| **Project name** · **Audience · client** | Which product and which client this repo is. |
| **Backend repo path** | For `pnpm docs:pull` and `pnpm docs:push`. |
| **Staging API URL** | Where the real endpoints are. Integration verifies against staging. |
| **API types command** | Regenerates `types/api.ts` from the backend's OpenAPI. |
| **Test commands** · **E2E command** | Unit and integration; Maestro. |
| **Sign-in providers** · **Payments** · **Push notifications** | Which native capabilities exist, so their backend endpoints are integrated with the unit that owns them. |
| **Production status** | Decides how carefully already-integrated units are touched, and whether a change forces a store build. |

## 1. How Integration Works

The unit is a **feature area** in the first phase and a **feature** in later phases, integrated in UI-tracker order. A unit is integrated only when the backend's tracker marks it `Built` and its api-docs exist; the UI tracker's row must read `Specced`.

Integration replaces the unit's mock handlers with the real backend. Because every screen already goes through the real data layer, the screens do not change: the hooks' shapes are aligned to the api-docs, the handlers are removed, the types are regenerated, and the data is real. A screen that needs a structural change to integrate is a sign the specs and the backend diverged, and that is raised, not patched around.

**The unit that owns sign-in goes first.** Until it is integrated the mock auth issues every session, and the real backend would reject it; so no other unit is integrated before it, and its integration also removes `src/mocks/auth.ts`, confirms the platform-header and tokens-in-the-body contract, and wires the push-token registration and the minimum-version check against their real endpoints.

**Two ways to run:**

- **One at a time** *(default)* — one unit per session, with my approval of the audit and of the verification.
- **Whole phase** — every unit of the phase whose backend is `Built`, in order, in one session (Section 5).

Build only the unit I name. Endpoints from other units are integrated only where this unit's screens consume them (Section 3).

---

## 2. Reference — Governing Files

### 2.1 — Primary sources

| File | Role |
| --- | --- |
| `api-docs-{{unit}}` *(and the api-docs of any area whose endpoints this unit's screens use)* | **The integration reference.** Every endpoint's method, path, access, request and response shapes, errors the client must handle, side effects, state transitions, and background behaviour (state that changes without the client calling anything). |
| `screen-specs-{{unit}}` | Every screen's inputs, display data and actions, each action now reading `METHOD /path` instead of `pending`. Where a spec and the api-docs disagree, the api-docs describe what the backend does; the disagreement is reported. |
| `types/api.ts` | Regenerated from the backend's OpenAPI before integrating. The hooks are typed from it. |
| `docs/phase-{n}/integration/integration-{{feature}}.md` *(later phases)* | The feature's endpoint index, sectioned by feature area, linking to the canonical api-docs. Each endpoint belongs to the `features/{area}/` folder of its section. |

### 2.2 — Supporting sources

| File | Use |
| --- | --- |
| `api-testing-{{unit}}` | The testing order, variables, and a curl per endpoint, for spot checks and for E2E setup. |
| `app-flow-{{unit}}` | The sequence each screen's calls must follow, and the system actions whose results the UI shows. |
| `business-rules-{{unit}}`, `business-rules-shared.md` | The rejections the UI must present, the transitions it must reflect. |
| The backend's **client handoff** messages | What changed since the specs, when a backend fix landed before this integration. |
| `docs/integration-handoff/backend-issues-mobile.md` | This client's handoff file: the open issues this unit may be waiting on. |

**Standards**: `coding-standards` (sections 3 to 5 above all), `security`, `testing`; `analytics` where installed. Follow them as written.

---

## 3. Constraints

- **The api-docs win.** Shapes, status codes, error codes, pagination style and ordering come from the api-docs, not from the fixtures the screens were built on and not from assumptions. If something looks wrong or ambiguous, spot-check it with one curl against staging using the api-testing guide. Never run a blanket curl pass; the docs are the source.
- **No redesign during integration.** Wiring data, loading, empty, error and offline states into existing screens is integration. Creating or restyling a screen is not; if a spec, a design or a flow needs a screen that does not exist, that is a gap reported in the audit, for `/mobile-build` or the backend to resolve.
- **Cross-unit endpoints.** Where this unit's screens consume endpoints owned by another area, integrate those endpoints now from that area's api-docs, without building that area's flows. Where those api-docs do not exist yet, keep the handler for that call only and list it in the report; with passthrough, every other call already reaches the real backend.
- **Mocks that stay** are only those with no built endpoint behind them. Everything else goes.
- **No refactoring of previously integrated units** beyond what this unit needs. Extending an existing hook with a parameter, fixing a bug surfaced here, or adopting a deployed backend fix are allowed; reworking is not.
- **Backend issues are logged, never worked around.** A missing field is not invented on the client; a wrong status code is not special-cased. It goes in the handoff file and the integration marks that screen as pending.
- **Security as written:** the access token in memory and the refresh token in SecureStore only, the platform and version headers on every request, no user data in links, unknown enum values tolerated — a released build cannot be refreshed like a tab.
- **No native code is added during integration.** Wiring an endpoint never needs it; if a channel or a capability does, that is raised, because it forces a store build.

---

## 4. Workflow

### Step 1 — Select and scope

- Confirm the unit reads `Specced` in the UI tracker, `Built` in the backend's tracker, and that `api-docs-{{unit}}` exists. If a prerequisite unit is not yet `Integrated`, say so before starting.
- `pnpm docs:pull`, commit what it changed, then regenerate `types/api.ts`. A generation error is a backend issue to log before anything else.
- Read every file in Section 2 for this unit, and the api-docs of every area its screens use.
- Read `docs/integration-handoff/backend-issues-mobile.md` for open issues touching this unit.

### Step 2 — Audit → **wait for my approval**

Before writing code, present:

1. **Screen map.** Every screen and secondary surface of this unit in the codebase, with its file, route and the flow it serves, cross-referenced against the screen specs and the app flow.
2. **Gaps, in two kinds:**
   - **Gap A — build gap:** a screen in the specs that does not exist in the code. Escalated to `/mobile-build`.
   - **Gap B — design gap:** a flow step that needs a screen that exists in neither the specs nor the code. Describe what that screen would need from the flow step. Escalated to design, through `/mobile-build`'s inventory.
   Do not create missing screens here.
3. **Endpoint coverage.** For every action and every piece of display data on every screen, and for every native capability the unit owns (push registration, the minimum-version check, account deletion, purchase entitlements): the endpoint from the api-docs that serves it, or **missing** (no endpoint documented) or **unclear** (documented but the shape does not fit the screen). Missing and unclear items are backend issues to log unless the audit shows the spec was wrong.
4. **Handoff changes.** Anything the backend's client handoff messages changed since the specs were written.
5. **The plan:** per screen, the hooks to align, the handlers to remove, the fixtures to update to real shapes for tests, the mocks that stay and why.

Do not proceed until I approve the audit.

### Step 3 — Integrate

Per screen, in flow order:

- **Align the hooks** in `features/{area}/api/` (the area each screen belongs to) to the api-docs: paths, parameters, request and response types imported from `types/api.ts` — the area's provisional `api/types.ts` is deleted — pagination style, the query keys' shape. Keep the hook names the screens use.
- **Remove the handlers** for every integrated endpoint from that area's `mocks/handlers.ts`, so its traffic falls through to the real backend. Update the fixtures to the real shapes, because the tests keep using them.
- **Wire the states** the api-docs define: every client-actionable error in the error table is presented as `coding-standards` → section 3 says, business-rule rejections show the backend's message, and state that changes in the background (the api-docs' Background behaviour section) is reflected by refetching on focus, polling, or the real-time channel the api-docs specify.
- **Forms** map the backend's validation errors onto fields; the client schema is adjusted only where the api-docs show a constraint the rules did not.
- **The auth area**, when it is the unit: set the real auth paths in `lib/auth/paths.ts` and the platform and version headers in `api-fetch.ts`, confirm the token shapes, the refresh behaviour and the sign-out call against the api-docs, wire the real sign-in providers' token exchange, and test the refresh path explicitly: an expired access token on launch, on foreground, and during a request, and a killed app mid-refresh recovering through the grace window.
- **Native capabilities** the unit owns: push registration against the real endpoint after sign-in and unregistration on sign-out; the minimum-version check against the real endpoint with its `soft` and `force` states; entitlements read from the backend after a sandbox purchase; account deletion through the backend's re-authenticated endpoint.
- **Analytics** events, where installed, now fire on real success.

Keep diffs surgical: hooks, handlers, fixtures, and the error and state wiring. A screen file changes only where a real shape differs from the mocked one.

### Step 4 — Orphan-endpoint audit

Scan `api-docs-{{unit}}` and confirm every endpoint listed for this unit is now called by at least one screen. For each that is not, decide from the app flow, the business rules and the specs:

- it serves a screen in the specs that does not exist in the code → **Gap A**, listed;
- it serves a flow step with no screen in specs or code → **Gap B**, listed with what the screen would need;
- it serves a system action or another client (the api-docs say so) → fine, noted;
- nothing references it → flagged for the backend to review, in the handoff file.

### Step 5 — Backend issues handoff

Anything that originates on the backend — a missing endpoint, a missing or wrong field, a wrong status, behaviour that contradicts the docs, a token or header problem — is logged in `docs/integration-handoff/backend-issues-mobile.md` — this client's handoff file; each client repo writes only its own — one entry per issue:

```markdown
### {ISSUE-ID} · {screen or flow} · `METHOD /path`
- **Phase · unit:** …
- **Expected:** what the api-docs or the flow says, in one or two lines
- **Observed:** what the endpoint actually does, with the request that shows it (tokens shortened)
- **Blocks:** which screen or flow cannot complete until this is fixed
- **Status:** open
```

The backend reads this file, fixes through `/backend-issue-fix`, deploys to staging, and appends a resolution line setting the status to `deployed`. When that lands, return to the screen, finish the wiring, and set the status to `verified`. When every entry of a phase is `verified`, move them to `backend-issues-mobile-resolved.md`, grouped by phase, so the active file stays short.

If an issue blocks a screen, integrate everything else, log it, and say clearly in the report which screens wait on it.

The sequence matters: `pnpm docs:pull` and commit **before** writing the entries (the backend may have appended resolutions since Step 1), then write them, commit, and `pnpm docs:push --handoff` at once. If the push is refused because the backend's copy moved in between, pull again — the handoff file merges, nothing is lost — and push.

### Step 6 — Tests

Follow `testing`.

- **Integration tests** run on MSW handlers now written from the api-docs' shapes (the updated fixtures), covering each screen's states including the error responses the api-docs define.
- **Unit tests** for any schema or formatter that changed.
- **E2E**: the unit's primary Maestro flow now runs on the staging build against the real backend with the seeded users; the api-testing guide's variables tell you which users and records exist.
- Run every suite, including earlier units'. All green before Step 7.

### Step 7 — Verify against staging

Do not make me test manually.

1. Ask the backend to reseed staging (or fire the reseed endpoint from the api-testing guide if I say so), and run the development build in **direct** mode against the staging API (`pnpm dev:staging`). The mode is one global switch, so walk this unit's flows in direct mode and stop where a flow crosses into an un-integrated unit's screens or a retained cross-unit mock; walk those crossings in a second pass in mock mode, whose passthrough still sends this unit's calls to the real backend.
2. Walk every flow of the unit on the iOS simulator and the Android emulator (driving the app with Maestro and capturing screenshots, or with the simulator and emulator tools where available), signed in as each role the flows name, happy paths and the error paths the rules define, plus the background behaviours the api-docs describe (what the UI shows after a job runs, what a push notification opens), and airplane mode mid-flow for the offline states.
3. **Present the walk in the chat, flow by flow:** each screen, each platform, the calls it made (method and path, tokens shortened), what the UI showed, and whether it matched the flow and the design. End with everything that failed.
4. For each failure: client-side → state the fix and **wait for my approval** before implementing; backend-side → Step 5.

### Step 8 — Update the tracker and report

- Mark the unit `Integrated` with the date once every screen is wired, and flip the unit's readiness in its `index.ts` so its routes are reachable in production builds (`coding-standards` → Mock mode). While a backend issue leaves a screen pending, the row stays `Specced` and its notes name the open issue ids and the screens that wait; it becomes `Integrated` when the last one is `verified`.
- Report:
  - **Unit** and what now works end to end.
  - **Endpoints integrated**, grouped by screen; cross-unit endpoints marked.
  - **Mocks remaining**, each with the reason.
  - **Gaps A and B**, and orphan endpoints flagged.
  - **Backend issues logged**, with their status.
  - **Tests** — counts per layer, and that earlier units' suites pass.
  - **Verification** — the staging walk passed, with what it caught; **the backend commit verified** (from the backend's health endpoint), which is the backend's production sign-off for this unit.
- **Deliver it as a PR.** Branch off `origin/main`, push, give me the link. Never create the PR yourself. Merging deploys to staging as an update, where the unit now runs against the real backend.

---

## 5. Whole-Phase Mode

Integrates every unit of the phase whose backend is `Built`, in tracker order, in one session.

1. **One audit for the phase → wait for my approval.** Steps 1 and 2 for every unit in one document, gaps and questions collected in one place. The run covers the units in order and ends before the first whose backend is not `Built`.
2. **Integrate each unit in order — Steps 3 to 6 — in a fresh context**, each with a subagent given its approved audit and told to read this skill and `.claude/rules/` first. If subagents are unavailable, integrate in this session and compact between units. Never in parallel: units share the data layer, the fixtures and the handoff file.
3. **Tests gate each unit**; one commit per unit on one branch; a failing unit stops the run with a report.
4. **One staging walk** (Step 7) of every flow in the phase, one report, one PR.

---

## 6. Definition of Done

- [ ] Every action and every piece of display data on every screen of the unit is served by its documented endpoint, or is logged as a backend issue with the screen marked pending.
- [ ] Every mock for a built endpoint is removed; every remaining mock is listed with its reason.
- [ ] `types/api.ts` regenerated; every integrated hook typed from it; no provisional type remains for this unit's endpoints.
- [ ] Every client-actionable error in the api-docs is presented; background behaviour is reflected.
- [ ] The orphan audit found nothing unexplained, or everything it found is logged.
- [ ] Tests updated to the real shapes and passing, this unit's and earlier units'.
- [ ] The staging walk was presented; every failure is fixed or logged.
- [ ] The tracker reads `Integrated`, or `Specced` with the open issue ids in its notes; the backend commit verified is named in the report, and the PR link was given.

---

## 7. Opening the session

In a few lines: the phase, the unit and the mode; the project values from `CLAUDE.md` that matter (staging API URL, native capabilities on, production status); and whether the backend's tracker and api-docs are in place for the unit. Then go to Step 1. Do not summarise the workflow back to me — start it.
