# Security

Security policy for this mobile client. The backend enforces every rule about who may do what; this app's job is to never leak, never trust what it did not verify, and never keep on the device what the device should not hold. An installed app is different from a web page in two ways that shape everything here: it persists on a device the user may lose, and old builds keep running for months after a release. The mechanism in this stack is in `coding-standards`; this file is the policy.

## Tokens and sessions

- **The access token lives in memory only.** It is short-lived, read on every request, and dies with the process. It is never written to SecureStore, MMKV, a file, a log or a URL.
- **The refresh token lives in SecureStore only**, with `WHEN_UNLOCKED_THIS_DEVICE_ONLY`, so the OS encrypts it, it is unreadable while the device is locked, and it never travels in a backup to another device. Nothing else auth-related is stored anywhere.
- **Refresh is single-flight and bounded:** one refresh at a time, one retry per request, never for the refresh route itself. A failed refresh ends the session on this device: tokens cleared, caches cleared, push token unregistered, back to sign-in.
- **Sign-out is server-side first.** The backend revokes; the app then wipes what Section "Device storage" lists. Killing the app signs nobody out; the refresh token is meant to outlive the process.
- **Guards and role checks only hide screens and controls.** A protected route that renders is not proof the user may see its data; the data came through the backend's checks. The cache is cleared on every sign-in and sign-out, so no role ever sees another session's data.
- **Sign-in flows run in the system browser or the native Apple sheet, with PKCE**, through `expo-auth-session` and `expo-apple-authentication`; never in a WebView, which could read the credentials. The identity token goes to the backend once, over HTTPS, and is not stored.
- **Biometric unlock, where offered, protects the refresh token's use**, not the data: a failed or cancelled prompt leaves the user signed out of this launch, with the token untouched.

## Device storage

What may be kept on the device, and where:

| Data | Where | Cleared on sign-out |
| --- | --- | --- |
| Refresh token | SecureStore | Yes |
| Preferences, onboarding status, theme | MMKV, through Zustand `persist` | No, unless they identify the user |
| Drafts the user expects to find again | MMKV, encrypted instance | Yes |
| Server data for offline reading | The persisted query cache on MMKV, only for the entities a build plan names, never for the ones below | Yes |
| Cached images | `expo-image`'s cache | Yes, where the images are private |

- **Never persisted:** tokens, passwords, one-time codes, card data, government identifiers, account numbers, balances, health or location history, private messages, documents the backend serves through signed URLs, and anything the screen spec marks as sensitive. These live only in the query cache, in memory.
- **MMKV instances that hold user data are encrypted** with a key generated on first launch and kept in SecureStore; the default instance holds preferences only.
- **Nothing sensitive in the app switcher:** screens the design system marks as sensitive show a privacy overlay when the app goes inactive.
- **Clipboard and sharing** of sensitive data happen only on an explicit user action; the app never writes to the clipboard on its own.
- **Files the app writes** (exports, downloads) go to the app's own document or cache directory, never a shared location, and are deleted when their purpose is served.

## Transport

- **HTTPS only.** App Transport Security stays at its defaults on iOS and `usesCleartextTraffic` stays off on Android; no exception domains, no development override that could ship. Local development against a device uses the staging API or a tunnel, never plain HTTP.
- **No certificate pinning by default.** It breaks on every certificate rotation and ships a reason to force-update; the backend's TLS and the OS trust store are the protection. A product that handles money or health may pin through the backend's published key set, as a build-plan decision with a rotation plan.
- **Every request carries only what it needs:** the bearer token, the content type, and the platform and version headers the backend's api-docs name (`X-Platform: ios` or `android`, `X-App-Version`), so the backend knows which builds still call an old shape, per platform. Nothing user-specific in a URL.

## Deep links and inbound data

- **Universal links (iOS) and app links (Android) for anything that matters:** password reset, email verification, invitations, payment returns. They are verified against the `.well-known` files on the product's web domain, so another app cannot claim them. The custom scheme exists for development and for links the OS cannot verify, and never carries auth.
- **Every link parameter is input.** It is parsed with a schema before use; an unexpected shape renders not-found. A link never decides what the user may see: it names a screen, and the backend decides the data.
- **A link into a protected screen remembers the target through sign-in**, as a validated route path only — never a full URL, never a scheme.
- **Push payloads are untrusted too.** The payload names a route and ids; the screen fetches its data through the normal hooks. Nothing displayed comes from the payload alone.
- **WebViews are avoided.** Where a flow needs one (a provider's hosted page), it is `expo-web-browser`'s system view, which shares nothing with the app. An embedded `WebView` is a build-plan decision, loads only allowlisted origins, and has no JavaScript bridge to the session.
- **User-supplied URLs** (profile links, images) open only with `http:` or `https:` schemes, through the system browser.

## Permissions and native capabilities

- **Least privilege, asked at the point of use**, after the screen has shown why, one at a time. Purpose strings in `app.config.ts` state the specific use; a vague string is a store rejection and a user's reason to decline.
- **A denial is a state, not a dead end.** The feature degrades, the rest of the app works, and the settings link is offered once.
- **Location** is foreground and coarse unless the business rules need more; background location is a product decision with a written justification for the stores.
- **Photos and files** use the picker APIs that grant access to the chosen items, not the whole library.
- **Contacts, calendar and health data** are read only for the action in front of the user and never uploaded wholesale.

## Environment and secrets

- **`EXPO_PUBLIC_` ships in the bundle.** Anyone can read it from the app binary, so only values that are public by design carry the prefix: the API URL, the Sentry DSN, the analytics key, RevenueCat's public SDK key, the OAuth client ids. Every variable the code reads is declared in `lib/env.ts` with its schema and referenced statically, so a missing or malformed value fails startup and nothing is read ad hoc.
- **The app holds no secrets.** No keys to the backend's providers, no storage credentials, no signing keys, no webhook secrets. Anything that needs a secret is a backend endpoint.
- **Secrets never enter the repository**: not in `.env` files that are committed, not in `app.config.ts`, not in test fixtures, not in CI logs. Build-time values live in EAS environments (development, staging, production, separate) and in GitHub secrets for the workflows; signing credentials live in EAS, never in the repo.
- **Source maps** are uploaded to Sentry by EAS Build and EAS Update and never shipped in the bundle.

## Third-party SDKs

- **Every SDK is a decision**, listed in `tech-stack` or a build plan with what it is for and what it collects, because it ships inside the binary with the app's permissions and must be declared in the iOS privacy manifest and the Play Data safety form. An SDK that wants more than the feature needs is rejected.
- **Analytics carries no personal data:** no emails, names or free text in events or properties; the user is identified by the backend's id only after sign-in and reset on sign-out. Consent is asked where the product's users require it, and nothing is sent before it. The app does not track users across other companies' apps, so it never shows the iOS tracking prompt; adding an SDK that would need it is a product decision. The `analytics` rule has the detail.
- **Sentry scrubs before sending:** authorization headers, tokens, request and response bodies, form values, device identifiers beyond what crash grouping needs, and every field the privacy section names. Session replay, if enabled, masks all text and inputs by default.

## Payments

- **Digital goods and subscriptions go through the stores' billing**, as the stores require, through RevenueCat's SDK. The app starts the purchase and restores purchases on request; **entitlements come from the backend**, which takes them from RevenueCat's webhooks, never from the SDK's response alone. A screen unlocks when the backend says so.
- **Physical goods and services go through Stripe's native payment sheet.** Card data never touches this app; the app receives a payment intent's client secret from the backend and the sheet does the rest.
- **Amounts shown come from the store or the backend**; the app never computes a price the user will pay. It formats.
- **Payment confirmation comes from the backend's state**, polled or pushed after the provider returns, never from the SDK's or the redirect's parameters.

## Updates and supply chain

- **An over-the-air update is a production deploy** and goes through the production pipeline, with its gradual rollout, like a store build. No developer publishes to the `production` channel by hand.
- **Updates are code-signed** where the EAS plan includes it, so a tampered bundle is rejected by the app; `ci-cd` says how. Where the plan does not, the runtime-version policy still stops an update reaching a build it was not made for.
- **The lockfile is committed and CI installs with `--frozen-lockfile`.**
- **New dependencies wait:** pnpm's `minimumReleaseAge` is set (seven days), so a package version published an hour ago cannot be installed, which blocks most hijacked releases. A native dependency is reviewed with more care: it runs with the app's permissions.
- **Install scripts are off by default** (pnpm's `onlyBuiltDependencies` allowlist) and enabled per package with a reason.
- **`pnpm audit` runs in CI**; a high or critical finding blocks the merge unless the PR records why it does not apply.
- **GitHub Actions are pinned to a commit SHA**, not a tag; EAS credentials and the Expo token are exposed only to the jobs that need them, never to pull requests from forks.
- **Dependabot or Renovate** opens update PRs that go through the same checks as any other.
- **Old builds keep running.** A released build may call the backend for months, so a change that would break one is coordinated through the backend's deprecation and minimum-version machinery (`ci-cd` → Releasing alongside the backend), never shipped and hoped for.

## Errors and logging

- **Users see a message, never a stack trace, a path or an internal id.** The error boundary renders the designed error state; the detail goes to Sentry.
- **Release builds log nothing**: no request bodies, no user data, no tokens. The `logger` is silent outside development.
- **Error states fail closed**: a screen that cannot verify what it may show shows nothing from the cache for that entity.

## Personal data

- **Collect only what the screen spec asks for**, and show only what the user's role needs for the action in front of them.
- **No personal data in links, analytics, logs, Sentry, push payloads or error messages.**
- **Account deletion is in the app**, where the stores require it: the flow renders what the backend provides, with the backend's re-authentication step, and sign-out follows. Play also requires a deletion-request page on the product's web domain, served by the web client or the backend (recorded in `CLAUDE.md` with the link files) and entered in the Data safety form. **Data export** renders the backend's signed link.
- **The privacy manifest (iOS) and the Data safety form (Play) are truthful and kept current**: every data type collected, every SDK's declared reasons, every tracking answer. `/mobile-release` checks them against the code before each store submission.

## Backend contract

What this client assumes the backend provides. Items 1, 3, 4 and 7 are lines in the Backend Blueprint's security and services rules (v1.2.0 and later); 2 and 6 are in its build skill; 5 is what its api-docs document per endpoint. A backend that differs is a conflict to raise before the first integration, never a workaround on this side.

1. **Tokens in the body:** for a request carrying the platform header (`X-Platform: ios` or `android`), sign-in and refresh return the access and refresh tokens in the JSON response, not as cookies; sign-out revokes the session. The access token is a short-lived JWT, the refresh token is opaque and rotated on every refresh, with the grace window of about ten seconds for the token just rotated, so an app killed mid-refresh does not trip reuse detection.
2. **Minimum supported version:** an endpoint the app calls on launch with its platform and version, returning `supported`, `soft` or `force`, held per platform. The store URLs the force-update screen opens are this app's, in `CLAUDE.md`.
3. **Push:** an endpoint to register and unregister the device's push token against the session, and the backend sends through the push provider its services rule names.
4. **Account deletion:** an endpoint, behind re-authentication, that the app's deletion flow calls, and the deletion-request page Play requires. **Universal and app links:** the `.well-known/apple-app-site-association` and `assetlinks.json` files are served on the product's web domain by whichever repo owns it, with this app's identifiers for every build variant.
5. **Errors as documented:** 401 means no valid session (refresh or sign in), 403 means a valid session without permission (never refresh), and validation failures and every client-actionable error carry the shape and stable code the api-docs document for that endpoint.
6. **Additive changes only** once this client is in the stores, or a coordinated deploy with a deprecation window for a breaking one, as the backend's build rules say; the backend reads the platform and version headers to know which builds still call an old shape.
7. **Purchases are verified server-side** through RevenueCat's webhooks (or the stores' APIs directly), and entitlements are the backend's records.
