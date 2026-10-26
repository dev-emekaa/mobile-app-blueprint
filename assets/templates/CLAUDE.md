## Documentation map

| Type | Location |
| --- | --- |
| Feature-areas registry *(from the backend)* | `docs/feature-areas.md` |
| PRD and product brief *(from the backend)* | `docs/product-docs/` |
| Business rules *(from the backend)* | `docs/business-rules/` |
| App flows *(from the backend)* | `docs/app-flows/` |
| API docs *(from the backend)* | `docs/api-docs/` |
| API testing *(from the backend)* | `docs/api-testing/` |
| Phase folders *(from the backend, plus this repo's UI tracker and the phase's screen specs)* | `docs/phase-{n}/` |
| UI tracker, first phase | `docs/ui-implementation-order.md` |
| Design system | `DESIGN.md` (project root) |
| Style tile *(only without the canvas)* | `docs/design/style-tile.html` |
| Navigation map | `docs/design/navigation.md` |
| Approved designs | `docs/design/screens/` |
| Image prompts | `docs/design/images.md` |
| Screen specs | `docs/screen-specs/` |
| Backend issues handoff | `docs/integration-handoff/` |
| Analytics events *(with the analytics rule)* | `docs/analytics-events.md` |
| Infra setup | `docs/infra/` |
| Release records | `docs/release/` |

## Audiences and clients

<!-- Copy the table from the backend's CLAUDE.md, then mark which audience this repo serves.
     An audience is a group of roles using its own separate product; a client is a separately designed app.
     iOS and Android are one client, mobile. -->

| Audience | Primary | Clients |
| --- | --- | --- |

| This repo is | Value |
| --- | --- |
| Audience | |
| Client | mobile |

## Project configuration

<!-- The mobile skills read these. Anything missing, they ask for once; /mobile-setup fills in the commands and identifiers.
     Builds and updates go through EAS. The backend repo path is used by the docs sync scripts. -->

| Key | Value |
| --- | --- |
| Project name | |
| Stack / framework | {{STACK}} |
| Backend repo path | |
| Sibling client repo path | the web, desktop or extension client's repo, where one exists — whichever client's `DESIGN.md` came first is the brand's source |
| Backend stack | |
| Backend OpenAPI spec | URL, once the backend is built — blank until then |
| Staging API URL | |
| Production API URL | |
| Web domains for links | per environment: the domains that serve the `.well-known` link files and the deletion-request page, and who owns them |
| Bundle id · package name | `com.{company}.{product}` — `.dev` and `.staging` are derived |
| App scheme | |
| EAS project | the project slug and owner |
| Update channels | `development` · `staging` · `production` |
| Dev server command | |
| Test commands | |
| E2E command | |
| API types command | |
| Docs sync commands | |
| Design system | not written yet — `/design-system` updates this |
| Design canvas | /design (Claude Design in Claude Code) |
| Design references | Mobbin, through its MCP, when connected. Without it: — *(web research, your screenshots, or both; asked once if blank)*. Your own screenshots, if any, go in `docs/design/references/` (optional, never committed) |
| Image generation | Gemini, through its MCP |
| Stock photo providers | Unsplash / Pexels — which are configured; their keys live in `.env` |
| Analytics | off |
| Tablet support | phone only, with the adaptive baseline — or the tablet layouts the PRD asks for |
| Sign-in providers | email and password · Apple · Google — which the PRD asks for |
| Payments | none · RevenueCat · Stripe |
| Push notifications | off · on |
| Production status | not in the stores yet |
| Production deploy trigger | Deploy Production workflow, run manually on the verified commit |
| Store accounts | App Store Connect team · Google Play developer account |
| Release owners | GitHub usernames allowed to run the production deploy |
| Startup budget | 2 seconds to the first interactive screen, mid-range Android, release build |
| Bundle budget | 4 MB of JS |
| Crash-free floor | 99.5% of sessions, below which a rollout halts |
| Store URLs | App Store · Google Play — opened by the force-update screen, once published |
