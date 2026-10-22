# Analytics

Rules for product analytics in this mobile client, installed only when the product tracks user behaviour. The tool is PostHog, named in `tech-stack`; what may never be sent is in `security` → Third-party SDKs.

## Setup

- **The native SDK, batched.** Events queue on the device and flush in batches, on an interval and when the app goes to the background, so a flaky connection loses nothing and the radio is not kept awake.
- **One client, initialised once**, in a provider at the root layout, with autocapture and session replay off. Every event is explicit.
- **Identify after sign-in, reset on sign-out.** The distinct id is the backend's user id; the person properties are the role, plan and account age, never a name or email.
- **Environments are separate projects.** Development builds send nothing; staging and production each have their own key, baked in per build.

## Events

- **Named `object_action`** in snake case, past tense for things that happened: `order_created`, `invite_sent`, `filter_applied`. No screen names in event names; the screen is a property.
- **Properties are enums, numbers and ids**, never free text and never personal data. An amount is a number; a status is the backend's enum value.
- **One event per user intent**, fired from the handler that completed it (after the mutation succeeds), not on render and not on click.
- **Screen views** are tracked once per route change from the root layout, with the route pattern (`/orders/[id]`), not the concrete path.
- **Every event is listed in `docs/analytics-events.md`** with its properties and the question it answers. An event nobody can say the purpose of is removed.

## Feature flags

Where the product uses them: flags are read through the PostHog client with a default, loaded once per launch and cached so a cold start offline still has an answer, and never gate a security decision. A flag that has been fully rolled out for a release is removed from the code.

## Consent

Where the product's users require it, nothing is sent before consent, the choice is a persisted preference, and the provider respects it on initialisation. The app never tracks users across other companies' apps, so it never shows the iOS tracking prompt. Consent UI follows the design system's content rules: plain words, equal buttons.
