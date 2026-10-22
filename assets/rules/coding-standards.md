# Coding Standards — Expo · React Native · TypeScript

How code is written in this mobile client. The tools are named in `tech-stack`; security policy is in `security`; what tests must prove is in `testing`. Where a rule here touches those, it gives the mechanism in this stack and leaves the policy to them.

## 1. Architecture

Expo renders and routes. TanStack Query caches. The backend decides everything else.

| Layer | Owns |
| --- | --- |
| **Expo** | Navigation and layouts, native capabilities (camera, push, links, storage), the session's tokens, the build and update pipeline |
| **TanStack Query** | Caching, refetching, mutations, pagination, optimistic updates, online and focus awareness |
| **Backend** | Data, validation, business rules, authentication, authorization, issuing and rotating tokens, entitlements |

Business rules are enforced by the backend. The app repeats a rule only where the user would otherwise wait for a round trip to learn it (a form field's limit, a disabled action), and that repetition is a convenience, never the enforcement.

### Data flow

One path. A screen renders a query hook → the hook calls `apiFetch` → `apiFetch` adds the access token and calls the backend → the cache updates and the screen re-renders. There is no server rendering and no second path.

**Rules:**

1. Default `staleTime` above zero (60 seconds unless an entity says otherwise). Refetch on focus is on, so a screen returned to after a while is fresh without a loading flash.
2. One `QueryClient` for the app's lifetime, created in `lib/query-client.ts`, with `onlineManager` fed by NetInfo and `focusManager` by `AppState`.
3. Query keys are defined once per entity, in the feature's `api/keys.ts`, and used by every hook. Different keys mean duplicate data.
4. Mutations go through TanStack Query to the backend, then invalidate the affected keys.
5. No `useEffect` to fetch. Data comes from a query hook.
6. **Offline is a state, not an error.** A query with cached data shows it with the offline banner; a query with none shows the offline state; a mutation fails fast with a retry toast. An offline queue for mutations is a product decision made in a build plan, never a default.

## 2. Project structure

```
app.config.ts                   native configuration per environment (APP_ENV): identity, icons, plugins, runtime version
eas.json                        build profiles: development, staging, production, e2e — each with its update channel; submit profiles
.maestro/                       E2E flows, one file per journey, and README.md listing them
assets/                         app icon, adaptive icon, splash, fonts
src/
  app/                          routes only: layouts and thin screen files
    _layout.tsx                 root providers: gesture root, safe area, keyboard, query client, theme, Sentry; the route guards
    +not-found.tsx
    (auth)/                     sign-in, sign-up, reset — public
    (app)/                      the product — guarded by the root layout
      (tabs)/                   primary navigation
  features/
    <feature-area>/             one folder per feature area, named after docs/feature-areas.md
      api/
        keys.ts                 query keys
        types.ts                provisional types while the area is mocked; deleted at integration
        queries.ts              useX() hooks
        mutations.ts            useXMutation() hooks
      components/               screens and parts that belong to this area only
      schemas/                  Zod schemas for this area's forms and deep-link params
      mocks/
        fixtures.ts             typed sample data
        handlers.ts             mock handlers: method + path → response
      store.ts                  Zustand store, only if the area has client-only state
      index.ts                  what other code may import from this area
  components/
    ui/                         React Native Reusables components, owned and edited here
    shared/                     product-wide pieces: screen container, header, empty state, error state, offline banner, list skeleton, confirm sheet
  lib/
    http/
      core.ts                   base URL, mock dispatch in mock mode, JSON, ApiError
      api-fetch.ts              apiFetch: bearer header, single-flight refresh-and-retry
    auth/
      session.ts                the access token in memory, the refresh token in SecureStore, sign-in and sign-out
      paths.ts                  the backend's auth paths, corrected at integration
    query-client.ts             QueryClient, defaults, online and focus managers
    storage.ts                  the MMKV instance and the Zustand storage adapter
    notifications.ts            push permission and push-token registration
    env.ts                      validated environment
    utils.ts                    cn() and small pure helpers
  hooks/                        product-wide hooks (useMe, useOnline, useMinVersion, usePermission)
  mocks/
    index.ts                    collects every feature's handlers; core and MSW read it
    msw.ts                      converts handlers to MSW for tests
    auth.ts                     mock sign-in, sign-out, refresh and me, until the auth area's own mocks replace them
  types/
    api.ts                      generated from OpenAPI — never edited
  styles/
    global.css                  Tailwind theme: the DESIGN.md tokens as @theme variables
```

**Dependency direction:** `lib` ← `components` ← `hooks` ← `features` ← `app`. Nothing imports upward — the one exception is `core`'s mock dispatch, which loads `src/mocks` by dynamic import outside production — and a feature never imports another feature's internals: cross-feature use goes through the other feature's `index.ts`, and a component needed by two features moves to `components/shared/`.

**Routes stay thin.** A file in `app/` renders a screen from a feature and nothing else. Screens, hooks and schemas live in `features/`. A screen that belongs to several areas lives in the area whose entity's lifecycle it advances, as the screen specs decide. Folders are always feature areas: a later phase's feature puts each of its screens in the area it belongs to, never in a folder named after the feature.

## 3. HTTP client

`expo/fetch` everywhere, through one thin wrapper.

| Piece | Does |
| --- | --- |
| `core` | Base URL (the real API, or the in-process mock dispatch in mock mode), JSON encoding and parsing, turns every failure into `ApiError` |
| `apiFetch` | Adds `Authorization: Bearer` from the session, refreshes and retries once on 401, maps network failures to the offline state |

**`ApiError`** carries `status`, `code` (the backend's error code), `message` and, for validation failures, `fieldErrors` keyed by field path. Every failure is handled by status, the same way everywhere:

| Status | Handling |
| --- | --- |
| **401** | Refresh once, retry once; if the refresh fails, sign out (Section 5) |
| **403** | Show the no-access state |
| **404** | Show the not-found state |
| **422 / validation** | Map `fieldErrors` onto the form |
| **409, 429, and other client errors** | Show the backend's message in a toast |
| **5xx** | Toast with a retry |
| **Network failure** | Offline: cached data with the banner, or the offline state; a mutation shows a retry toast |

Types have two eras, split at integration. **While a feature is mocked**, no backend exists to generate from, so its types are provisional: hand-written in the feature's `api/types.ts` from the shapes its screens imply, used by its hooks, fixtures and handlers. **At integration** they are deleted and the hooks import from `types/api.ts`, generated from the backend's OpenAPI spec (`pnpm api:types`) and regenerated whenever the backend's api-docs change; from then on, nobody writes a type for a built endpoint by hand. **Unknown enum values are tolerated**: a `switch` on a backend enum always has a default branch that renders something sensible, so the backend can add a value without breaking a released build — which, unlike a web tab, may stay installed for months.

### Mock mode

Before a unit is integrated, its screens run on mock data that goes **through the real data layer**: the same hooks, the same `apiFetch`, the same types. Only where the requests go differs.

- `EXPO_PUBLIC_API_MODE=mock` makes `core` dispatch each request to the handlers collected in `src/mocks/index.ts`, **inside the app process**, with no server. With the mode off (`direct`, the default), `core` calls `EXPO_PUBLIC_API_URL`.
- **Passthrough.** A path with no handler is sent to `EXPO_PUBLIC_API_URL` with the real `Authorization` header, so integrated units reach the real backend while mocked ones stay local. Integration removes a unit's handlers and its traffic falls through; an environment with every unit integrated runs `direct`.
- **The unit that owns sign-in is integrated first.** Until it is, every environment runs on the mock auth and only its handlers answer, because the real backend would reject a mock token; after it, sign-in reaches the real backend and every passthrough call carries a real token. Nothing else is integrated before it.
- Each feature's `mocks/handlers.ts` maps `METHOD /path` to a resolver taking `{ params, query, body, session }` and returning the response, using the typed fixtures in `mocks/fixtures.ts`. `session` is the access token's decoded payload (`sub`, the user id); it is never verified, which is acceptable only because mock mode does not exist in production. A user the fixtures do not know is treated as the default persona. Resolvers keep state in memory for the app's lifetime (a created record appears in the next list) and simulate latency.
- Fixtures are realistic: real-looking names, dates and amounts, every state the screen specs describe, edge cases (long text, empty lists, the maximum count). A mock that always succeeds hides the error states the design asked for, so handlers can be told to fail (`?mock=error`).
- **Mock auth** (`src/mocks/auth.ts`) handles sign-in, sign-out, refresh and `me` until the sign-in unit is integrated: it returns JWT-shaped tokens carrying the same claims the backend's tokens carry, through the same `session` module, so `apiFetch` and the route guards run unchanged. The sign-in unit's own `mocks/` replaces it when that unit is built, and that unit's integration removes it.
- **Real-time channels are not mocked.** In mock mode a screen that would subscribe polls its query against handler state instead; the real SSE or WebSocket channel is wired at integration, as the api-docs specify.
- **Production builds carry no mock mode.** `app.config.ts` refuses a production build with the mode on, `core` imports the mock module only outside production, and a test proves the mode is ignored when `APP_ENV` is `production`.
- **A unit not yet `Integrated` is unreachable in production.** Once the app is in the stores, a later phase's built-but-not-integrated screens land on `main` before their endpoints exist. Each feature's `index.ts` exports its readiness; the shell renders a unit's routes and navigation entries behind its navigator's `.Protected` (`Stack.Protected`, `Tabs.Protected`) with `guard={isIntegrated(area) || !isProduction}`; `/mobile-integrate` flips the readiness when the unit is integrated; and a test proves no un-integrated route is reachable with `APP_ENV=production`.
- The same handlers feed MSW in tests through `src/mocks/msw.ts`. Integration removes the handlers for the unit's endpoints; the fixtures stay for tests.

## 4. Data layer

- **One hook per query, one per mutation**, in the feature's `api/`. Components never call `apiFetch` directly.
- **Keys** are hierarchical and built by functions: `orderKeys.all`, `orderKeys.list(filters)`, `orderKeys.detail(id)`. Invalidate the narrowest key that covers the change.
- **Lists** use `useInfiniteQuery` for cursor pagination, fetching the next page from FlashList's `onEndReached`, and `useQuery` with `placeholderData: keepPreviousData` for page numbers, matching whichever the api-docs give. Pull to refresh calls `refetch`. Filters and sort live in the screen's route params when a screen should be reachable by link, otherwise in local state.
- **Mutations** invalidate on settle, not on success alone. Optimistic updates are for actions where the user expects instant feedback (toggles, likes, reordering) and always roll back from the snapshot on error.
- **No retries on 401, 403, 404 or 422.** Retry other failures twice with backoff, queries only; mutations never retry on their own.
- **Derived data is computed with `select`** or a memo, never copied into state.
- **Real-time** updates (SSE or WebSocket, as the api-docs specify) write into the cache with `setQueryData` or invalidate, so every screen reading that entity updates. The connection opens when the app is active and closes in the background.
- **Persisted cache is off by default.** When the product needs data readable offline, the build plan turns on `persistQueryClient` on MMKV for the entities it names, excluding anything `security` calls sensitive, and sign-out clears it.

## 5. Authentication

The backend issues, rotates and checks tokens. The app carries them and triggers refreshes.

| Token | Lives in | Why |
| --- | --- | --- |
| Access (JWT, minutes) | Memory, in `lib/auth/session.ts` | Dies with the process; read synchronously on every request |
| Refresh (opaque, days) | SecureStore, `WHEN_UNLOCKED_THIS_DEVICE_ONLY` | Survives restarts; encrypted by the OS; never backed up |

- **Launch:** the splash stays up while `session` reads the refresh token, refreshes, and `useMe` resolves. A missing or rejected refresh token means signed out; no screen renders on an unverified session. A network failure is neither: the refresh token stays, the signed-in shell renders in its offline state (from the persisted cache where it is on), and the refresh runs when the connection returns. The splash waits for the refresh no longer than the startup budget.
- **Foreground:** returning from the background refreshes if the access token is within a minute of expiry, reading `exp` without verifying it — the backend verifies.
- **`apiFetch`** refreshes single-flight: when several requests fail together, they wait on one shared refresh. It skips the logic for the refresh route itself. If the refresh fails, it signs out.
- **Sign-out** calls the backend, then clears in this order: the access token, the refresh token in SecureStore, the query cache and any persisted cache, the push token (unregistered with the backend first), and persisted stores that hold the user's data. Then it navigates to sign-in. Sign-in clears the query cache too, so the next user never sees the previous one's data.
- **Route guards** live in the root layout, which declares both groups: `<Stack.Protected guard={isSignedIn}>` around the `(app)` screen and the inverse around `(auth)`, with `redirectTo` where the SDK offers it. A guard inside the protected group itself would leave Expo Router nothing to fall back to. **A guard is a convenience, never authorization**: the backend decides access on every request.
- **Current user:** one `useMe` query. Its roles show or hide UI through `RoleGate`; the backend enforces them.
- **Sign in with Apple and Google** run through their native SDKs (other providers through the system browser with PKCE), never in a WebView, and hand the backend an identity token; the backend creates the session. Biometric unlock, where the product uses it, gates reading the refresh token and nothing else.

## 6. Routing and screens

- **Route groups** separate public and protected trees; the root layout guards both (Section 5); the protected group's layout prefetches `me`; primary navigation is a `(tabs)` group inside it.
- **Every screen has its states**: a skeleton of the real layout while loading, never a spinner alone; the empty, error, offline and no-access states as the design system specifies; and an `ErrorBoundary` export at the layout level where it makes sense. `+not-found.tsx` at the root.
- **Navigation** uses `<Link>` and `router.push`/`replace`; modal and sheet surfaces are routes with `presentation: 'modal'` or `'formSheet'`, so the Android back button and the iOS swipe both dismiss them. The header is the native stack's, configured from `DESIGN.md`.
- **Dynamic segments and search params are validated** at the top of the screen with a Zod schema from the area's `schemas/`; an invalid one renders the not-found state, not a crash. A deep link lands on the same screen the same way.
- **Multi-step flows** keep their step in the route, so back and a killed app behave.
- **Android back** is never swallowed: a screen that intercepts it (an unsaved form) uses `usePreventRemove` and asks.

## 7. Components

- **Reusables components are ours.** Edit them in `components/ui/` to match `DESIGN.md`; never wrap one to restyle it. Add components with the Reusables CLI, then adjust.
- **`Pressable`** for everything tappable, with the pressed state styled from the system; `TouchableOpacity` and its siblings are not used.
- **Variants with `cva`**, styling through Tailwind classes. No inline styles except for values computed at runtime (a measured width, an animated value).
- **One component per file**, named in PascalCase, file in kebab-case (`order-summary.tsx`). A screen is `{screen-name}-screen.tsx`; its parts live beside it in a folder once there are more than two.
- **Props are typed with an interface**, named `{Component}Props`, and destructured. Boolean props read as predicates (`isOpen`, `canEdit`). Callbacks start with `on`.
- **Composition over configuration**: slots and children rather than a dozen boolean props. A component that takes more than seven props is usually two components.
- **Every list has an empty state**, every async component a loading, error and offline state, as the design system specifies. A screen is not done with only its happy state.
- **Accessibility is part of the component**: `accessibilityRole`, `accessibilityLabel` on every control without visible text, `accessibilityState` for selected, disabled and expanded, touch targets at least 44pt, text that scales with the system font size, reduced motion respected (Section 13). A screen is read once with VoiceOver or TalkBack before it is called built.
- **Platform differences are conventions, not features.** `Platform.select` is for behaviour that differs by platform (a date picker's presentation, haptic strength); `ios:` and `android:` class variants for styling. Both platforms get every screen and every state.

## 8. State

In this order; use the first that fits.

1. **Server state** — TanStack Query. Anything the backend owns.
2. **Route state** — params and search params. The current entity, the active tab, a filter a link should reproduce.
3. **Form state** — React Hook Form. Never mirrored into a store.
4. **Local state** — `useState` in the component that owns it.
5. **Global UI state** — Zustand, one store per concern, for what survives navigation and nothing above fits: a wizard's progress, an unsaved draft, UI flags. Stores hold no server data and no derived data.
6. **Persisted state** — a Zustand store with `persist` on MMKV, for what must survive a restart: preferences, onboarding status, drafts the user expects to find again. Never tokens, never server data; `security` says what may be persisted.

No React Context for state that changes often; it re-renders every consumer. Context is for dependency injection (theme, the query client).

## 9. Forms

- **One Zod schema per form**, in the feature's `schemas/`, derived from the unit's business rules and the screen spec's field constraints — same names, same limits. The type is `z.infer`, never written twice.
- **React Hook Form with `zodResolver`**, every input through `Controller` (React Native inputs are not DOM inputs), validating on blur and then on change, submit disabled while submitting, never while merely invalid.
- **The keyboard is handled**: the form scrolls inside `KeyboardAwareScrollView` from `react-native-keyboard-controller`, `returnKeyType` moves focus to the next field and submits from the last, and the submit button stays reachable above the keyboard.
- **Inputs declare what they are**: `keyboardType`, `textContentType` and `autoComplete` set per field, so the OS keyboard fits and password managers and one-time-code autofill work.
- **Server validation wins.** A 422 maps `fieldErrors` onto the fields with `setError`; an error with no field goes to the form's root error.
- **Submission goes through a mutation hook.** The form never calls `apiFetch`.
- **Unsaved changes** are guarded with `usePreventRemove` when the form is long enough that losing it hurts.

## 10. Effects

- `useEffect` is for synchronising with something outside React: a subscription, a native event, `AppState`, a third-party SDK. Not for fetching, not for deriving state, not for responding to a prop change that could be computed during render.
- Every effect with a subscription returns its cleanup. Every async effect guards against the component having unmounted.
- Event handlers do the work that an event causes. If logic runs "after X changes", ask whether it belongs in the handler that changed X.

## 11. Styling

- **Tokens, not values.** Colors, spacing, radii and type sizes come from the `@theme` variables `styles/global.css` defines from `DESIGN.md`, used as Tailwind classes through Uniwind. Arbitrary values (`w-[13px]`, `text-[#333]`) need a comment saying why the scale did not fit.
- **`cn()` merges classes**; conditional classes go through it, never through string concatenation.
- **Dark mode follows the system.** `global.css` maps each `-dark` token onto the same semantic variable under the dark scheme, so a component writes `bg-background` once and it adapts; `dark:` is for the rare deliberate exception, and components never check the color scheme in JavaScript to pick a color. A manual override, where the product offers one, is a persisted preference applied at the root.
- **Safe areas** come from `useSafeAreaInsets` where a screen draws its own chrome; the native header and tab bar handle their own. Padding for a safe area is never hard-coded.
- **Phone first, with an adaptive baseline.** Screens are designed for phones. Every screen also meets the baseline, because tablets and foldables run the phone layout — in landscape and in resizable windows, since Android 16 ignores orientation and resizability limits on large screens, and in iPhone compatibility mode on iPad: layouts flex and never assume a width or an orientation; content keeps a maximum width (`max-w` from `DESIGN.md`) and centres beyond it; everything scrolls; state survives rotation and resizing; nothing clips or becomes unreachable at 200% font scaling. A tablet layout of its own is a product decision recorded in `CLAUDE.md`.
- **Class order** is Prettier's (`prettier-plugin-tailwindcss`), so diffs stay readable.

## 12. Lists

- **FlashList for every list of unknown length**, with stable `keyExtractor` values and `getItemType` where rows differ. `ScrollView` with mapped children only for a few fixed rows.
- **Rows are plain components**, light enough to recycle: no queries of their own, no heavy memoisation by habit (Section 14).
- **Paging, refreshing and empty states** are the list's: `onEndReached` fetches the next page, `refreshing` ties to pull to refresh, the empty state renders inside the list's `ListEmptyComponent` so the pull gesture still works.

## 13. Animation and gestures

- **Reanimated runs animations on the UI thread**: `withSpring` and `withTiming` with the durations and easings from `DESIGN.md` → Motion, `entering`/`exiting`/`layout` props for presence and layout changes. Animated values never pass through React state per frame.
- **Gestures through Gesture Handler**, composed with Reanimated worklets; drag and drop, swipe actions and sheets are gestures, not touch handlers.
- **Screen transitions are the native stack's**, configured per route; a custom transition is a `DESIGN.md` decision, not a screen's whim.
- **Haptics** fire where `DESIGN.md` says and nowhere else, through one `haptic()` helper so the mapping lives in one place.
- **Reduced motion is respected everywhere**: `useReducedMotion` turns presence animations into fades and disables decorative motion; Reanimated's reduced-motion config is set at the root.

## 14. Performance

- **Images through `expo-image`** with explicit sizes, `contentFit`, a placeholder from the design system and caching on. Formats and sizes come from `DESIGN.md` → Imagery; the backend's CDN serves the right size, the app never downsizes a large image itself.
- **Fonts through `expo-font`**, loaded before the splash hides, as `DESIGN.md` names them.
- **Startup is budgeted**: the splash hides when fonts and the session are ready and not before; nothing else blocks it. Time to first interactive screen on a mid-range Android stays under the budget `CLAUDE.md` records (default 2 seconds, measured on a release build).
- **The JS thread stays free during interaction**: no heavy computation in render, no synchronous storage reads in lists, long work deferred with `requestIdleCallback` or moved to a worklet on the UI thread (`InteractionManager` is removed in SDK 58).
- **`memo`, `useMemo` and `useCallback` are applied where a profile shows the cost**, not by habit. React Compiler is on and makes most of them redundant.
- **Lists are virtualised** (Section 12) and paginated as the api-docs allow.
- **The bundle is checked** with Expo Atlas when a dependency is added, and a release's JS bundle stays under the budget `CLAUDE.md` records (default 4 MB). A native dependency is a decision: it forces a store build.

## 15. Platform behaviour

- **Edge to edge** on Android: the app draws under the system bars and uses insets; status and navigation bar styles come from the theme.
- **Permissions are asked at the point of use**, through `usePermission`, after a screen has explained why; never on launch, never all at once. A denial is a designed state that still lets the user do what does not need the permission. Purpose strings in `app.config.ts` say what the feature does with the access.
- **Push notifications** register the Expo push token after sign-in (and after permission, asked where the design system's pattern says), through `lib/notifications.ts`; a tap routes to the screen the payload names, validated like a deep link; foreground notifications render per the design system.
- **Deep links** resolve through Expo Router's file routes; the link's params are validated (Section 6); a link into a protected screen remembers its target through sign-in.
- **The minimum-version check** runs on launch and on foreground through `useMinVersion`: `supported` continues, `soft` shows a dismissible update prompt, `force` shows a blocking screen with the store link. No other screen renders under a `force`.
- **Background and foreground** are handled through `AppState`: refresh on foreground (Section 5), real-time connections closed in the background, sensitive screens hidden by a privacy overlay while the app is in the switcher where `security` asks for it.

## 16. Errors and observability

- **Errors render, they do not vanish.** A failed query shows the error state with retry; a failed mutation shows a toast with the backend's message; an uncaught render error reaches the nearest `ErrorBoundary`.
- **Sentry captures** uncaught errors, boundary errors, native crashes and failed mutations with the request's method and path, never its body. Expected `ApiError`s (401, 403, 404, 422) and offline failures are not reported.
- **No `console.log` in committed code.** Debug logging goes through a `logger` that is silent in production builds.
- **User-facing messages come from the backend's message keys** where the business rules define them, and from `DESIGN.md` → Content and Voice otherwise.

## 17. Code style

- **TypeScript strict**, no `any`, no non-null assertions without a comment, no `as` casts to silence the compiler. Narrow with type guards; model variants as discriminated unions.
- **Imports** in groups, blank line between: React and React Native, Expo and third-party, `@/` aliases, relative, then styles. Type imports with `import type`. No default exports except where Expo Router requires them (route files).
- **Naming:** `camelCase` for values and functions, `PascalCase` for components and types, `SCREAMING_CASE` for true constants, `use` prefix for hooks, `is`/`has`/`can` for booleans. Files `kebab-case`. Folders in `features/` match the slugs in `docs/feature-areas.md`.
- **Functions are small and do one thing**; a file over ~300 lines is a sign to split by responsibility.
- **Comments explain why, not what.** A `TODO` carries the ticket or issue it refers to.
- **Dead code is deleted**, not commented out. Git keeps the history.
- **Formatting and linting pass before commit**, enforced by a pre-commit hook; CI repeats the check.

## 18. Tests in this stack

What tests must prove is in `testing`. In this stack:

- Jest with the `jest-expo` preset, React Native Testing Library and its `user-event`; MSW (`msw/node`; Jest runs in Node) started in `jest.setup.ts` from the shared handlers, with `onUnhandledRequest: 'error'`.
- Test files sit beside the code (`order-summary.test.tsx`); Maestro flows in `.maestro/`.
- Tests render through the real providers via a `renderWithProviders` helper (a fresh `QueryClient` with retries off, safe-area and keyboard providers with fixed metrics, the theme).
- Native modules without a JS implementation in Jest (SecureStore, notifications, haptics) are mocked once in `jest.setup.ts`, never per test, and never our own modules.
