---
name: design-system
description: Create or extend a product's design system for its mobile app — DESIGN.md at the project root, the source of truth for how every screen looks, moves, feels and reads on iOS and Android, in the DESIGN.md format. Use once per product before the first screens are designed, after reading the product docs and researching the best apps in its niche, and again when a later phase needs a foundation the system does not cover.
---

# Design System

You are a senior product designer and design engineer writing the design system for this product's mobile app. The result is `DESIGN.md` at the project root: one document that makes every screen, built by anyone in any session, look like it belongs to the same product, and makes that product look like itself rather than like every other AI-generated app.

It follows the DESIGN.md format (`github.com/google-labs-code/design.md`): design tokens in YAML front matter, and markdown sections that explain how to apply them. `/mobile-build` reads it before every screen is designed, design tools find it at the root, and its tokens become the Tailwind theme the code uses. So it is precise where precision matters (values, names, states) and plain everywhere else.

## Inputs

Read these first; ask for anything missing.

| Input | What it gives you |
| --- | --- |
| Product brief and PRD, `docs/product-docs/` | Who the product is for, the problem, the positioning, the tone it should carry |
| `docs/feature-areas.md` | The surfaces: how many areas, which are data-dense, which are transactional, which are consumer-facing |
| Business rules and app flows, `docs/business-rules/`, `docs/app-flows/` | The states screens need (pending, failed, expired), the data types that recur (money, dates, statuses), the roles and how different their worlds are |
| `CLAUDE.md` | The audience this repo serves, whether a second audience shares the brand, tablet support, and which native capabilities (push, payments, biometrics) the system must give a pattern to |
| Brand assets, if any | The logo system, where one exists (the Ideas Blueprint produces one), brand colors, a name, a tagline. The logo's color and geometry are inputs to the palette and shape language, not the other way round |
| My screenshots in `docs/design/references/`, if any | Screens I picked from products I admire — the most direct statement of what I want. Optional; never committed |
| Another client's `DESIGN.md` for the same product, if one exists (at the sibling client repo path in `CLAUDE.md`) | The brand decisions — palette, type, voice, shape — are taken from it so the product looks like itself on every client; the mobile components, patterns and motion are this system's own |
| An existing `DESIGN.md` | In a later phase: extend it, never regenerate it |

If a frontend-design skill is installed in this Claude Code, read it as well; it sharpens the aesthetic judgement this skill asks for.

## Step 1 — Understand the product

Before any color is picked, write down, in a few lines each:

- **What kind of app this is in the hand**, because it sets density, pace and tone. Most products are one of these, or a mix by feature area; say which applies where.
  - *A tool used often and quickly* (operations, field work, finance, messaging): users act in seconds between other things, so the system leans direct. Dense lists with clear rows, one-thumb reach for primary actions, strong status color, little decoration.
  - *A transactional product used in short visits* (booking, payments, ordering): users need the confidence to finish. One clear primary action per screen, generous spacing, strong feedback, haptic confirmation, and sheets rather than new screens for small decisions.
  - *A consumer product used for enjoyment* (social, media, lifestyle, fitness): users come back for the experience, so imagery, motion, gesture and personality carry more weight.
- **Who is looking at it, and in what state.** Experts or first-timers; calm or stressed; one-handed on a train, outdoors in sunlight, or on a tablet on a sofa. This decides density, type size, reach, contrast, and how much the interface explains itself.
- **What the brand should feel like**, in three or four plain adjectives taken from the brief, and what it must not feel like.
- **The recurring content**: the data types that appear everywhere (amounts, dates, statuses, names, avatars, long text), because the system has to make those consistent first.
- **The constraints**: accessibility level (WCAG AA is the floor, with VoiceOver and TalkBack), dark mode (yes, following the system, unless the brief says otherwise), font scaling to 200%, right-to-left or a second language, brand colors that are fixed, and **platform conventions**: the system follows Apple's Human Interface Guidelines on iOS and Material on Android where the two differ in chrome (navigation, pickers, sheets, haptics, back behaviour) and is the product's own everywhere else. Say which conventions are kept per platform and which are unified.

## Step 2 — Research the references

The goal is to learn what the best products in this space do well and why, then do it our own way. References are inspiration, never a source of truth and never something to copy.

**Choose them:** **three to five direct competitors or neighbours** named in the brief, and **two or three category leaders** whose interface is widely admired, in the product's category or a close one (a dense tool learns from the best dense tools, whatever their domain). For each, look at the actual screens — the images, not the metadata — of the surfaces this product will have: onboarding, the main list, the main detail, a form, the tab bar and navigation, a sheet, an empty state, a permission request, settings. Look at both platforms where the app has both.

**Where to see them** is set by the `Design references` row of `CLAUDE.md` (called `Design reference library` in projects set up before it; rename it when you meet it). If Mobbin isn't connected and the row doesn't say what to use instead, ask me once — web research, my screenshots, or both — and record the answer in the row; if I'm not there to answer, record and use web research plus any screenshots in the folder. A missing library never stops the work. Use what the row allows, in this order:

1. **My screenshots**, if `docs/design/references/` holds any. They are optional: screens I picked from products I admire, so they say most directly what I want. Look at every one. The folder is never committed — confirm `.gitignore` lists `docs/design/references/` and add it if not — because the images are other companies' and may show personal data; the docs record what each one taught and its file name, never the image.
2. **Mobbin**, when connected (through its MCP, `platform: ios` and `platform: android`; follow the Mobbin search skill if it is installed).
3. **Web research**, when Mobbin isn't connected or leaves a gap: the chosen products' App Store and Google Play listings, whose screenshots show the real app on each platform, and their own sites and help-center articles, opened in a browser so you see the screens themselves, not marketing illustrations.
4. **None of these available:** build the direction from the brief and Apple's Human Interface Guidelines and Material Design, and say so in the report.

**Record**, per reference, what makes it work: how it builds hierarchy, how much color it uses and where, its density and spacing rhythm, its type choices, how it handles states and feedback, what its components have in common, what its copy sounds like, and what it does that is distinctive. Also what it does badly, so we avoid it. Where the direction draws on a product documented in the corpus at `github.com/VoltAgent/awesome-design-md`, that product's DESIGN.md shows its exact decisions; learn from it, never copy. Cite everything you looked at — its link, or the screenshot's file name.

**Then extract**: a short list of the principles the strong references share, and the two or three moves that would make this product distinctive rather than generic. That list is what the system is built from.

## Step 3 — Propose the direction → **wait for my approval**

Present one direction, with the reasoning from Steps 1 and 2, and one alternative where the choice is genuinely open. Include:

- **Principles** — four to six, each one sentence, each with a consequence a builder could act on ("Density over decoration: tables default to compact rows, and whitespace is spent on grouping, not on margins").
- **Palette** — the brand color and why, the neutral scale and its temperature, the semantic colors, the accent policy (how much color a screen may carry), with hex values and the contrast ratios of text on surface, light and dark, checked against outdoor-sunlight use where the product has it.
- **Typography** — the families, the scale, the weights in use, and the reasoning. Free fonts only, two families at most: Google Fonts by default, or another open-source font (SIL OFL or similar), or the platform fonts (SF Pro and Roboto) where the product should feel native. Never a font that must be bought, or one licensed for personal use only. The scale is set in points and must survive 200% font scaling.
- **Shape and depth** — the radius scale and the elevation approach (borders, shadows, or surface steps).
- **Density and layout** — the base unit, the screen margins, the maximum content width for large screens, and the navigation model (a tab bar with how many tabs, a stack, a drawer, where modals and sheets are used, and why). The shell itself is designed and built in `/mobile-build`'s Phase 0 from this decision.
- **Motion and feel** — how much, how fast, what never moves, and where haptics fire.
- **Imagery and icon stance** — illustration, photography, neither; the icon set; the tone of imagery.
- **Voice** — how the product talks, with three example sentences.

Show it: a style tile rendered on the `/design` canvas where available, otherwise an HTML page in `docs/design/style-tile.html`, at a phone's width, with the palette, the type scale, three buttons in their states, an input, a card, a list row and a tab bar, light and dark. Judge it with your own eyes before showing it: if it looks like a template, change it before I see it.

**What generic looks like, so you can avoid it:** a blue-purple gradient on a dark background; Inter at every size with no tracking decisions; cards inside cards with the same shadow; pastel badges in six colors; the same 8px radius on everything; glassmorphism; a five-tab bar with a floating centre button no flow asked for; a hero illustration style borrowed from a template; icons used as decoration; onboarding carousels that say nothing. Distinctive comes from a few deliberate decisions carried everywhere: one accent used with discipline, a type pairing with a point of view, a radius or border rule that is recognisably the product's, spacing that creates rhythm, motion that has one personality.

## Step 4 — Write `DESIGN.md`

Tokens go in the front matter, using only the format's keys. Values the format has no key for — shadows, motion, haptics, screen sizes — are written as tables in their sections. Color tokens use the React Native Reusables variable names (shadcn's), so `DESIGN.md`, `global.css` and the components share one vocabulary; each color's light value has a `-dark` twin.

```yaml
---
version: alpha
name: "{Product} Design System"
description: One paragraph that captures the whole system in words.
colors:
  background: "#…"
  background-dark: "#…"
  foreground: "#…"
  foreground-dark: "#…"
  # …the same pair for primary, primary-foreground, secondary, secondary-foreground, muted, muted-foreground,
  # accent, accent-foreground, destructive, success, warning, info, border, input, ring, card, card-foreground,
  # popover, popover-foreground, chart-1 to chart-5, and the product's own tokens
typography:
  display: { fontFamily: …, fontSize: …, fontWeight: …, lineHeight: …, letterSpacing: … }
  # …h1, h2, h3, h4, body-lg, body-md, body-sm, caption, label-md, button, mono, numeric (fontFeature: '"tnum"')
rounded: { none: 0px, sm: …, md: …, lg: …, xl: …, full: 9999px }
spacing: { base: 4px, … }            # the scale, matching Tailwind's steps; values are points on the device
components:
  button-primary: { backgroundColor: "{colors.primary}", textColor: "{colors.primary-foreground}", typography: "{typography.button}", rounded: "{rounded.md}", padding: … }
  button-primary-pressed: { backgroundColor: … }
  button-primary-dark: { backgroundColor: "{colors.primary-dark}", textColor: "{colors.primary-foreground-dark}" }
  # …one entry per component and state, with a -dark entry carrying its dark colors
---
```

Component entries use only the format's properties: `backgroundColor`, `textColor`, `typography`, `rounded`, `padding`, `size`, `height`, `width`. Borders, shadows and pressed treatments are described in the component's section. There are no hover states: a phone has no pointer, and the pressed state is what the user sees.

Then the sections, with exactly these `##` headings in this order:

```markdown
## Overview            — the system in a paragraph; the principles from Step 3; then Key Characteristics: the five to eight visual decisions that make it this product; which platform conventions are kept and which are unified
## Colors              — grouped by role (brand and accent, surface, text, semantic, charts), each with its use; the accent policy; pressed and disabled; light and dark; a contrast table
## Typography          — the families, why, and where each loads from; a hierarchy table (token, size in points, weight, line height, tracking, use); measure rules; tabular figures for numbers in data; how the hierarchy holds at 200% font scaling
## Layout              — the base unit and the spacing scale with use; the navigation model (tab bar, stack, drawer; what is a screen, a modal, a sheet); screen margins and the maximum content width for large screens; safe areas; screen anatomy (header, content, primary action and where it sits for the thumb)
## Elevation & Depth   — how hierarchy is shown (shadows, borders or surface steps), as a table of level, treatment, shadow value and use, with the Android elevation equivalent
## Shapes              — the radius scale as a table of token and use; borders; pressed treatments
## Iconography         — the set, sizes, stroke, when an icon stands alone and when it needs a label; the tab bar's icons; the app icon's relationship to the set
## Imagery             — photography or illustration, tone, treatment, aspect ratios, avatars, empty-state and onboarding art, what never appears
## Motion              — the personality; a table of durations and easings by name; screen transitions per platform; what animates and what never does; a haptics table (event → haptic); reduced motion
## Components          — one entry per component in use: anatomy, variants, sizes, every state (default, pressed, focused, disabled, loading, error, selected), and when to use it. Buttons, inputs and fields, pickers and selects, checkboxes and radios, switches, forms, cards, list rows and sections, tabs and segmented controls, the tab bar, headers, sheets and dialogs, menus and action sheets, toasts and inline alerts, badges and status, avatars, skeletons, empty states, pull to refresh, search, date pickers; then the signature components only this product has
## Patterns            — screen patterns (list, detail, create/edit form, settings, onboarding, wizard, paywall where there is one) and state patterns (loading, empty, error, permission denied, permission request, offline, force update)
## Content and Voice   — tone, person and tense, capitalisation, punctuation; formats for numbers, dates and money; button labels; error, empty-state, permission and confirmation copy; push notification copy; words we use and words we never use
## Screen Sizes        — a table of the device classes the system is designed for; how screens adapt to the smallest phone, to large phones, and to tablets running the phone layout in landscape (the adaptive baseline); touch targets; one-handed reach
## Accessibility       — contrast, VoiceOver and TalkBack labels and order, font scaling, motion, touch targets, and the checks every screen passes
## Do's and Don'ts     — the ten rules a builder is most likely to break
## Iteration Guide     — how to apply the system (reference components and tokens by name, one component at a time, the default body style, how scarce the accent is) and how a later phase extends it
```

**Rules for the content:**

- **Every value is a decision, with a use.** A token nobody is told when to use will be used wrongly.
- **Tokens are the source; prose explains them.** A value in prose always matches its token, and names it (`{colors.primary}`).
- **States are not optional.** A component entry without its disabled, loading and error states is incomplete.
- **Plain where it can be, precise where it must be.** The Overview and Content and Voice sections read like a person wrote them; the token and component sections are exact.
- **Contrast is computed, not assumed.** Every text-on-surface pair in the colors table shows its ratio and passes AA (4.5:1 body, 3:1 large text and UI). Fix the palette rather than the rule.
- **Platform differences are stated, not left to habit.** Where iOS and Android differ (a picker, a sheet, a header, the back gesture, a haptic), the component says what each gets; where the product is the same on both, it says so.
- **Nothing that belongs elsewhere.** No code, no component props, no business rules, no screen inventories. The system says how things look, move and read; the screen specs say what they contain.
- **No stub sections.** A section with nothing to say for this product is left out.
- **Length follows the product**: a dense tool with many components runs long; a focused consumer product stays short. Cut anything that repeats.

## Step 5 — Verify and apply

1. **Lint it:** `npx @google/design.md lint DESIGN.md`. No errors. The linter checks every component pair against 4.5:1, so a contrast warning is fixed in the palette unless the pair is large text or a non-text element that the contrast table shows at 3:1 or more. Orphaned-token warnings are expected for colors no component token can reference (borders, rings, charts); any other warning is resolved.
2. **Read it back as a builder.** Pick two screens from the app flows (one list, one form) and describe each using only `DESIGN.md`, on both platforms. Anything you had to invent is a gap; fill it.
3. **Check the tokens** cover every Reusables variable with its `-dark` twin, and every pair in the contrast table passes.
4. **Apply the tokens** if the foundation exists: run `/mobile-setup`'s design tokens step so `global.css` and the Reusables components carry the system, then render the component set on a dev-only route (`design-check`, created here if it does not exist, excluded from production builds) and look at it on an iOS simulator and an Android emulator, light and dark, at the smallest supported phone, at 200% font scaling, and on a tablet in landscape. Fix what looks wrong in the system, not in the screen.
5. **Record** in the `Design system` row of `CLAUDE.md`'s project configuration that `DESIGN.md` exists and the phase it was last extended in, and report: the direction, the references consulted, what makes this product distinctive, and any decision left open.

## Later phases

A later phase extends the system when it introduces something the system does not cover: a new component, a new data visualisation, a new surface. Add the tokens and the section text in place, lint again, and compare with the committed version (`git show HEAD:DESIGN.md > /tmp/DESIGN.prev.md`, then `npx @google/design.md diff /tmp/DESIGN.prev.md DESIGN.md`); the token changes it lists go in the report. Update the `Design system` row in `CLAUDE.md` with the phase. Never change the value of an existing design token (a color, size, radius or other value in the front matter) in a later phase. Every built screen already uses it, so changing it restyles screens nobody asked to change. If an existing value has to change — a new brand color, say — that is a redesign, not part of a phase: raise it with me, and if I approve it, plan it as its own piece of work that checks every screen using that value and updates every client that shares the brand.
