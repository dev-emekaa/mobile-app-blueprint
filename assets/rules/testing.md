# Testing

How this mobile client is tested. The tools are named in `tech-stack`; how tests are set up in this stack is in `coding-standards`; which pipeline runs what is in `ci-cd`. What each build, integration or fix must cover is set by those skills.

## Principles

- **Test the way users use the app:** find elements by role, label or text, interact, assert on what is visible. Never on component internals, state or implementation details.
- **Mock only at the network boundary.** MSW, with the shared handlers. Never mock our own modules, hooks or child components; native modules with no Jest implementation are mocked once in the setup file.
- **Most confidence comes from integration tests.** A small E2E suite guards the critical journeys on a real build. Production only ever receives a commit already verified on staging — and a store build is checked by a person on a device before it is released, because it cannot be rolled back.

## Layers

| Layer | Proves | Share | Runs against | When |
| --- | --- | --- | --- | --- |
| **Static** | Types, lint, formatting, bad test patterns, the Expo project's health (`expo-doctor`), the bundle (`expo export`) | Always on | The source | Before commit, and in every pipeline |
| **Unit** | Pure logic: utils, formatters, Zod schemas, query-key builders, store reducers, the link and push payload parsers | ~15–20% | Nothing | Locally, on every PR and merge |
| **Integration** | A whole screen or feature rendered with its real children, providers, router and forms; the network mocked with MSW | ~60–70% | Jest, the `jest-expo` preset | Locally, on every PR and merge |
| **E2E** | 5–20 critical journeys through a real build on a simulator or emulator | ~10–15% | An `e2e` build | On PRs labelled `e2e`; the full suite on the staging `e2e` build; smoke on the production-environment `e2e` build |
| **Manual QA** | The integrated flows a person should walk once, on real devices | — | The staging build | Before every production deploy, from a 10–15 minute checklist and the device matrix |

Coverage is read to find untested logic, never enforced as a percentage.

**Deliberately not used:** snapshot tests of component trees; unit tests of presentational components with no logic; Detox (Maestro covers E2E with less upkeep); mocking our own modules.

## Environments and data

| | Unit | Integration | E2E | Manual QA |
| --- | --- | --- | --- | --- |
| **Backend** | None | MSW, from the shared handlers | PR build: mock mode, passing through to staging · Staging build: the real backend, reseeded | Staging, reseeded |
| **Session** | None | A mocked `me`, through `renderWithProviders` | The mock auth until the sign-in unit is integrated; real sign-in with the seeded test users after | Seeded test users |
| **Data** | Built per test | Fixtures from `features/*/mocks/`, overridden per test with `server.use` | The backend's seed | The backend's seed |
| **Device** | — | Jest's React Native environment | An iOS simulator and an Android emulator in CI | The device matrix below; a store build is checked on real devices by `/mobile-release` |

- **Automated tests never touch production data.** Production smoke tests are read-only, with a dedicated low-privilege account, on the production-environment `e2e` build.
- **E2E tests depend on the backend's seed.** They use the records the seed marks as disposable and clean up what they create; they never reseed staging on their own, because manual QA and the backend's own verification share it. A reseed is asked for, through the backend's reseed dev-tool endpoint, when the seed has drifted.
- **Integration tests start from the shared mock handlers** so a screen is tested against the same shapes it was built on; a test that needs a different response overrides the one handler it needs.

## Unit tests

- **No network, native modules, timers or randomness** unless faked. Schemas, formatters and key builders run for real.
- **Group by the function under test, one behaviour per test**, named for the behaviour: `rejects an amount above the limit`.
- **Assert outcomes**, never the internal sequence of calls.

## Integration tests

- **Render the screen through `renderWithProviders`**, with a fresh `QueryClient` per test, retries off, fixed safe-area metrics, and MSW serving the fixtures.
- **Drive it as a user would**: React Native Testing Library's `user-event`, not `fireEvent`; `findBy*` for what appears after a request; `getByRole` and `getByLabelText` before `getByTestId`, and a test id only where no accessible query exists.
- **Cover the screen's states**, not only the happy one: loading, empty, error, offline, the permission-denied state, and every conditional state the screen spec lists.
- **Forms:** submit valid data and assert the request MSW received; submit invalid data and assert the field errors; return a 422 from MSW and assert it maps onto the fields.
- **Native capabilities are asserted at the boundary:** the permission was requested, the haptic fired, the link was opened — through the setup file's mocks, never by reimplementing them.
- **Each test sets up its own handlers and leaves no shared state.** Tests pass in any order.

## E2E tests

- **Critical journeys only:** sign-in with email (the Apple and Google sheets are not reliably automatable on simulators; they are in `/mobile-release`'s device check), the primary flow of each feature area, purchase or checkout where there is one (with the stores' sandbox testers), a push notification tap, a universal link, and anything that would make the product unusable if broken. The list is kept in `.maestro/README.md` with the reason each journey is there.
- **Against a built app, never the dev server:** the `e2e` profile's simulator and emulator builds — release mode, no dev client, one per environment's values — for every suite. Flows select by accessibility label or visible text; a `testID` only where no label exists.
- **Both platforms:** every flow runs on iOS and Android; a flow that needs a platform step (the Apple sheet, the Android back button) branches on the platform rather than skipping one.
- **Stable by design:** waits on visible elements, no fixed sleeps. A flaky test is fixed, not retried until it passes.

## Smoke tests

- **Three to five read-only flows** on the built app: it launches, sign-in works, the main screens render their data, a deep link opens its screen. Until the sign-in unit is integrated the sign-in is the mock auth's; after, it is the smoke account against the real backend.
- **Run after every deploy** — on the staging `e2e` build after a staging deploy, and on the production-environment `e2e` build before an update or a store build reaches any user — and a failure stops the release as `ci-cd` says.

## Device matrix

The manual checklist runs on, at least:

| Device | Why |
| --- | --- |
| The smallest supported iPhone, and a current one | Layout at the narrowest width; the notch and Dynamic Island |
| A mid-range Android phone, and a current one | Performance on the device most users have; edge-to-edge and the back gesture |
| An iPad in iPhone compatibility mode | Apple expects the app to work wherever it can be downloaded |
| An Android tablet or unfolded foldable, in landscape and a resized window | Android 16 shows the phone layout there regardless of the app's orientation setting |

On each: light and dark, 200% font scaling, airplane mode mid-flow, a cold start from a killed app.

## When something breaks

- **A bug found anywhere gets a test that reproduces it**, at the lowest layer that can (usually integration). The test fails before the fix, passes after, and ships in the same PR.
- **A bug that manual QA catches twice becomes an automated test.**
- **A crash in Sentry gets a test when it can be reproduced**, and a note on the release when it cannot.
- **A failing test is never skipped, deleted or loosened** to turn a pipeline green unless the PR states why.
