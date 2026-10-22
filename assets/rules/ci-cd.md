---
paths:
  - ".github/**"
  - "eas.json"
  - "app.config.*"
  - ".maestro/**"
  - ".env.example"
---

# CI/CD

How code moves from a pull request to the stores. The checks and runners are named in `tech-stack`; what each test layer proves is in `testing`; the human steps after the pipeline are `/mobile-release`'s.

## Principles

- **Every merge to `main` deploys to staging automatically.** Production deploys only by a manual trigger, after sign-off.
- **Production ships the exact commit verified on staging**, never "latest `main`".
- **Each environment is its own build**, because `EXPO_PUBLIC_*` values, the bundle id and the icon are baked in.
- **A JS-only change ships over the air; a native change ships through the stores.** The native fingerprint decides, not a person's guess.
- **The app never deploys ahead of a backend change it depends on.** The backend deploys first and stays compatible; this client follows.
- **A store release cannot be rolled back**, so it is checked on a device before it is promoted, and rolled out gradually.

## Environments

| | Development build | Staging | Production |
| --- | --- | --- | --- |
| **Built by** | EAS Build, by a developer or on demand | Pipeline 2, when the fingerprint changes | Pipeline 3, when the fingerprint changes |
| **Updated by** | `expo start` | Pipeline 2, EAS Update to `staging` | Pipeline 3, EAS Update to `production` |
| **Distributed by** | Internal distribution (a link) | TestFlight internal testers · Play internal track | App Store · Google Play, promoted by `/mobile-release` |
| **Identity** | `{bundle id}.dev` | `{bundle id}.staging` | `{bundle id}` |
| **Env values** | EAS `development` environment | EAS `staging` environment | EAS `production` environment, separate values |
| **Error tracking** | Sentry `development` | Sentry `staging` | Sentry `production` |

Which backend and mode each environment runs against is `tech-stack` → Services' table; it is not repeated here.

`app.config.ts` reads `APP_ENV` and sets the identity, name, icon, scheme, update channel and plugins per environment; `eas.json` has one build profile per environment plus an `e2e` profile — release-mode simulator and emulator builds without the dev client, built with one environment's values at a time, for Maestro — `appVersionSource: remote` and `autoIncrement` on, so EAS owns the build number. The runtime version policy is `fingerprint`. The production-environment `e2e` build follows a `production-smoke` channel, so an update can be smoke-tested before any user receives it.

Where the EAS plan (Production or Enterprise) includes update code signing, `updates.codeSigningCertificate` is set in `app.config.ts`, the private key lives in an EAS secret, and every `eas update` passes it.

## Repo rules

- `main` is protected: no direct pushes, Pipeline 1 required to merge, one approving review where the team has more than one developer.
- Squash merge, so every commit on `main` is one reviewed PR.
- `ios/` and `android/` are not committed; a PR that adds them is rejected, because the fingerprint and prebuild depend on their absence.
- Staging deploys run one at a time, in merge order, so `staging-current` never moves backwards.
- Dependabot or Renovate PRs go through Pipeline 1 like any other; one that touches a native dependency is labelled `e2e`.

## Pipelines

GitHub Actions orchestrates all three (the release-owner check, inputs, tags); EAS does the builds, updates and Maestro runs, through its CLI and Workflows. A GitHub job that needs an EAS result triggers the EAS workflow with `eas workflow:run --wait` and reads its outcome.

| Pipeline | Trigger | What it does | Deploys to |
| --- | --- | --- | --- |
| **1. PR checks** | Pull request opened or updated against `main` | Static checks, unit and integration tests, the bundle; Maestro on an `e2e` label | Nothing |
| **2. Staging deploy** | Push to `main` — every merge | Re-runs the checks, builds or updates staging by fingerprint, moves `staging-current`, runs the full Maestro suite | Staging |
| **3. Production deploy** | Manual — release owners only | Builds or updates production by fingerprint from the verified commit, smoke tests, rolls out gradually, tags the release | Production |

### 1. PR checks

**Required to merge.** Target: under ten minutes.

1. Install from the lockfile, cached.
2. In parallel: type check, lint and format check, unit and integration tests, dependency audit, `expo-doctor`.
3. `expo export` for both platforms, to catch bundling errors without a native build.
4. On a PR labelled `e2e` (native changes, navigation changes, anything risky): a build with the `e2e` profile — reused when one exists for the same fingerprint — and the Maestro suite on it through EAS Workflows.

### 2. Staging deploy

Runs automatically, one at a time in merge order.

1. Re-run Pipeline 1's checks on the merged commit.
2. Compute the native fingerprint and compare it with the current staging build's (no live build counts as changed):
   - **Changed:** EAS Build with the `staging` profile for both platforms, then EAS Submit to TestFlight's internal testers and the Play internal track.
   - **Unchanged:** EAS Update to the `staging` channel, with the commit as the message.
3. Move the `staging-current` tag to this commit, only if the deploy succeeded.
4. Run the full Maestro suite on the staging fingerprint's `e2e` build, both platforms, through EAS Workflows.
5. Post the result to the team channel, if there is one: commit, store build or update, pass or fail, and the changes since the last production release.

**After the workflow:** manual QA runs the staging checklist on the device matrix. A red Maestro run or a failed checklist means no production deploy until fixed. When the release relies on backend changes, tell the backend which backend commit was verified; that is the backend's production sign-off.

### 3. Production deploy

**Trigger:** GitHub → Actions → Deploy Production → Run workflow. Only release owners can run it; running it is the approval. Inputs: `commit`, optional, defaulting to `staging-current` — a commit SHA releases exactly that commit, and branch names are rejected so `main` can never be deployed by mistake; `version`, required only when the fingerprint has changed (a store build), as `vX.Y.Z` higher than the last `v*` tag.

1. Check the actor is a release owner; stop if not. Show on the run page what is shipping: the commit, its message, the changes since the last release, and whether it is a store build or an update.
2. Check out the commit. Tests are not re-run: this commit already passed Pipelines 1 and 2.
3. Compute the fingerprint and compare it with the live production build's (no live build counts as changed):
   - **Changed — store build:** stop if `version` is missing or not higher than the last `v*` tag. EAS Build with the `production` profile and that version, then EAS Submit to App Store Connect and the Play internal track. Nothing is public yet. Build (or reuse, by fingerprint) the production-environment `e2e` build of the same fingerprint.
   - **Unchanged — update:** EAS Update to the `production-smoke` channel at 100%, with the commit as the message. Only the `e2e` build follows that channel; no user has it.
4. Run the Maestro smoke suite on the production-environment `e2e` build — the store build's twin, or the live build with the update applied — read-only, with the smoke account.
5. If it fails, stop: nothing reached users. For a store build, `/mobile-release` does not promote it.
6. If it passes: for an update, publish the same commit to the `production` channel at a 10% rollout; for a store build, `/mobile-release` takes it from here after a check on real devices. Add a permanent release tag — `prod-<date>-<time>` for an update, the `version` for a store build. The rollout stays at 10% until `/mobile-release` Step 7 raises it while the crash-free rate holds.

## Releasing alongside the backend

- A release that needs new endpoints waits for the backend's production deploy, then ships. Order: backend, then the app, always.
- A breaking backend change is coordinated through the backend's deprecation machinery: the backend tolerates both shapes across the window, the app ships a build that reads the new one, and the backend raises the minimum supported version per platform only when that build is live in that platform's store and old builds have stopped calling. Installed builds run for months, so the window is never short.
- The release notes name the backend commit the release was verified against.

## Tags

| Tag | Moves? | Set by | Purpose |
| --- | --- | --- | --- |
| `staging-current` | Yes, on every successful staging deploy | Pipeline 2 | The commit live on staging |
| `prod-<date>-<time>` | Never | Pipeline 3 | A permanent record of each production update |
| `vX.Y.Z` | Never | Pipeline 3, from the `version` input | A permanent record of each store build, matching the store version |

There is no staging branch; the tag is the record. Comparing two release tags shows exactly what changed between releases. In a monorepo the tags carry the client: `staging-current-mobile`, `prod-mobile-…`.

**Version numbers** are semver and belong to store builds only: patch for fixes, minor for features, major for a restructure. `version` in `app.config.ts` comes from the input; the build number is EAS's.

## Rollback

| Release type | What rollback means | How | Time |
| --- | --- | --- | --- |
| **Update, rollout in progress** | Stop the rollout and send its users back | `eas update:revert-update-rollout` on the `production` channel; apps pick it up on next launch | Minutes |
| **Update, fully rolled out** | Send users back to the previous bundle | `eas update:republish` the previous update to `production` | Minutes |
| **Store build, not yet promoted** | Nothing to roll back | Do not promote; fix forward with a new build | — |
| **Store build, released** | Not possible: installed users keep it | Halt the phased release and staged rollout; ship a fix — an update if JS-only, otherwise a new build with a higher version through store review; raise the minimum version only if the bad build must be forced out | Hours to days |

A rollback is followed by a fix-forward PR; no release is re-pointed by hand twice.

## Infrastructure

The EAS project and environments, the Apple Developer Program and App Store Connect records, the Google Play Console apps, signing credentials in EAS, push credentials, GitHub secrets and branch protection are the steps only a person can do; `/mobile-setup` writes them into `docs/infra/infra-setup.md` so each environment can be set up start to finish from that doc.
