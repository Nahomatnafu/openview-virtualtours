# Rebuild Prompt — OpenView Virtual Tours

> Paste into Claude Code from the repo root.
> Install the skills listed in **Skill stack** first.
> Sections marked **[TO FILL]** need answers before running.

---

## Mission

Rebuild the OpenView Virtual Tours marketing site as a clean, hand-coded static site that works as a real sales tool. A visitor should be able to (1) interact with a live 360° tour, (2) understand what it costs, and (3) book a call — within about a minute, on a phone.

This is a **rebuild, not a refactor**. The current site is a Webflow export: obfuscated class names, a large mostly-unused `webflow.css`, and `webflow.js` running interactions we don't need. Do not preserve or untangle that markup. Start from clean HTML/CSS and port over only the *content and functionality* specified below.

## The business (context for copy and design)

OpenView Virtual Tours shoots 360° virtual tours for apartment complexes, Airbnbs, rental listings, and individual home sellers across Minnesota. Real work to date: a full apartment complex — exterior tour plus 20 individual unit interiors. The audience is **property managers, landlords, Airbnb hosts, and real estate agents** — practical people who care that listings rent faster and that they field fewer pointless in-person showings. Not a luxury-lifestyle audience. Copy should be plain, concrete, and confident. No "elevate your property's story."

---

## Skill stack

Install and use these. **Each has a defined job — respect the division of labor.**

| Skill | Install | Job on this project |
|---|---|---|
| **frontend-design** (Anthropic) | `/plugin marketplace add anthropics/claude-code` → `frontend-design` | **Owns the aesthetic.** Final authority on palette, typography, layout concept, and the signature element. |
| **ui-ux-pro-max** | `/plugin marketplace add nextlevelbuilder/ui-ux-pro-max-skill`<br>`/plugin install ui-ux-pro-max@ui-ux-pro-max-skill` | **Owns UX rules, not looks.** Use its 99 UX guidelines, accessibility rules, anti-patterns, and pre-delivery checklist. |
| **awesome-design-skills** | `npx typeui.sh pull <slug>` | **Style reference.** Pull **one** slug as a starting direction. |
| **gsap-skills** (GreenSock) | `npx skills add https://github.com/greensock/gsap-skills` | **Owns motion.** Correct GSAP + ScrollTrigger usage. |

### How to resolve conflicts between them

**When ui-ux-pro-max and frontend-design disagree, frontend-design wins on aesthetics; ui-ux-pro-max wins on usability and accessibility.**

This matters. ui-ux-pro-max generates a design system by matching your industry against a lookup table — 161 palettes, 57 font pairings, 67 styles. That's genuinely useful for UX rules and anti-patterns. But a table-matched palette is, by construction, the same answer it gives everyone else in the category, and frontend-design explicitly warns that this produces work indistinguishable from every other AI-generated site.

So:
- **Do run** ui-ux-pro-max's generator — read its output for the UX pattern, the accessibility rules, and especially its anti-patterns list.
- **Do not** adopt its recommended palette or font pairing wholesale. Treat those as a baseline to beat, and derive the actual choices from the brief per frontend-design's process.
- **Do not** blend multiple `awesome-design-skills` styles. Pick one deliberately, or none.

### Specifically banned looks

Regardless of what any generator suggests, do not produce:
- Cream/near-`#F4F1EA` background + high-contrast serif + terracotta accent near `#D97757`
- Near-black + single acid-green or vermilion accent
- Broadsheet layout with hairline rules and zero border-radius
- "AI purple/pink gradients"

(Note: `awesome-design-skills` ships a **`terracotta`** slug. Don't pull it — it is the exact default we're avoiding.)

### If you keep the vanilla static stack (default — see Tech constraints)

**shadcn/ui the React library is not usable here.** It requires React, Tailwind, and a build step, which contradicts the no-build constraint. Do not install it, do not add npm, do not scaffold a framework.

If a shadcn-like aesthetic is wanted, pull the **`shadcn` design skill** from `awesome-design-skills` (`npx typeui.sh pull shadcn`) — that gives the visual language (spacing scale, radii, neutral palette, component feel) as guidance to implement in hand-written CSS, with no React involved.

### GSAP notes

- GSAP is **100% free including all plugins** (SplitText, MorphSVG, etc.) following Webflow's acquisition. No Club membership, no auth token, no `.npmrc`.
- Load from CDN via `<script>` — no npm, no build step.
- Use **gsap-core**, **gsap-timeline**, **gsap-scrolltrigger**, and **gsap-performance**. Skip gsap-react and gsap-frameworks — not applicable.
- Motion budget is **one orchestrated moment**, not scattered scroll effects. The hero tour reveal is the candidate. Per gsap-performance: animate transforms, not layout properties. Call `ScrollTrigger.refresh()` after the portfolio filter changes layout.
- Everything must be wrapped so `prefers-reduced-motion: reduce` disables it. GSAP animating is never a precondition for content being visible or usable.

---

## Tech constraints

- **Static HTML/CSS/JS. No framework, no bundler, no build step.** It must stay deployable by uploading files.
- **Zero npm runtime dependencies.** External runtime scripts are limited to: Calendly widget, Kuula embed, GSAP CDN. Nothing else. (npx-based skill tooling is fine — that's dev-time, not shipped.)
- **Vanilla JS** in a real `js/main.js` file — not inline `<script>` blocks buried in markup.
- **Hand-authored CSS** in `css/` with meaningful class names. Delete `webflow.css`, `normalize.css`, and `js/webflow.js` entirely. Use a small modern reset.
- Keep the three-page structure: `index.html`, `demos.html`, `contact.html`.
- Reuse existing `images/` assets. Keep the `.avif` + `.jpg` fallback pattern via `<picture>`.

---

## MUST PRESERVE — referral → Calendly flow

This is live business logic currently inline in `contact.html` (~lines 229–261). **Port it to `js/main.js` with identical behavior. Do not redesign it. Verify it works before finishing.**

1. Read the `?ref=` query param via `URLSearchParams`.
2. If present, write it to `localStorage` under key `refCode`.
3. On page load, read `refCode` back from `localStorage` (survives navigation within the visit).
4. Build the Calendly URL from base `https://calendly.com/nahomg116/30min`:
   - **With ref code:** append as prefilled custom question (`a1=`) *and* into the event `text=` field as `Virtual+Tour+Booking+(Ref:+<code>)`.
   - **Without:** plain base URL.
   - Do **not** reintroduce empty `name=&email=` params — a prior commit deliberately removed those.
5. Dynamically create the `.calendly-inline-widget` div with the built `data-url`, then inject `https://assets.calendly.com/assets/external/widget.js`.

Improvements allowed *only* if behavior is unchanged: move out of inline script, name things clearly, guard against a missing container, add a comment block explaining the flow.

---

## Kuula tours — live embeds

Four collections. **[TO FILL: confirm which is which — labels below are assumed.]**

```html
<!-- A — assumed: apartment complex exterior. Note logo=0&info=0&initload=0 (clean chrome) -->
<script src="https://static.kuula.io/embed.js"
  data-kuula="https://kuula.co/share/collection/7DjMW?logo=0&info=0&fs=1&vr=1&sd=1&initload=0&thumbs=1"
  data-width="100%" data-height="640px"></script>

<!-- B — assumed: unit interior -->
<script src="https://static.kuula.io/embed.js"
  data-kuula="https://kuula.co/share/collection/7TbL3?logo=1&info=1&fs=1&vr=0&sd=1&thumbs=1"
  data-width="100%" data-height="640px"></script>

<!-- C — assumed: unit interior -->
<script src="https://static.kuula.io/embed.js"
  data-kuula="https://kuula.co/share/collection/7TbLb?logo=1&info=1&fs=1&vr=0&sd=1&thumbs=1"
  data-width="100%" data-height="640px"></script>

<!-- D — assumed: unit interior -->
<script src="https://static.kuula.io/embed.js"
  data-kuula="https://kuula.co/share/collection/7TZLY?logo=1&info=1&fs=1&vr=0&sd=1&thumbs=1"
  data-width="100%" data-height="640px"></script>
```

### Critical: use a facade pattern, do not embed all four live

Kuula's `embed.js` is a self-replacing script tag that mounts a heavy iframe. Four live embeds on the portfolio page would wreck the performance budget and fight with client-side filtering (re-ordering the DOM around live iframes causes reloads and lost state).

Therefore:
- **Homepage hero:** exactly **one** live embed (collection A), loaded eagerly. This is the one thing that must be interactive above the fold.
- **Portfolio page:** render static poster thumbnails from `images/`. Mount the Kuula embed **on click** (facade / click-to-load), swapping the thumbnail for the live tour. Filtering then operates on lightweight thumbnails, not iframes.
- Never mount more than one tour at a time on the portfolio page — unmount or leave the previous one when another opens.
- Give each embed container a fixed aspect ratio so mounting causes **zero layout shift**.
- `640px` fixed height is a desktop assumption. Use a responsive aspect-ratio container instead; verify it isn't letterboxed or cropped at 320–430px wide.
- The `?vr=1` on collection A adds a VR button — keep it only if it renders sensibly on mobile.

---

## Page specs

### `index.html` — Homepage

- **Hero:** live, draggable Kuula tour (collection A) above the fold — not a screenshot, not a video. First interaction is the visitor moving the view themselves. Include a drag affordance so it's obviously interactive.
- Headline stating plainly what this is and who it's for.
- Short "why this matters" section — fewer wasted showings, listings rent faster, tours available 24/7. Concrete, not salesy.
- How it works: book → shoot → tour delivered and hosted. Numbered only because it genuinely is a sequence.
- **Pricing/packages** — see [TO FILL].
- **Social proof** — see [TO FILL].
- Clear primary CTA to contact, repeated at the bottom.

### `demos.html` — Portfolio

- Grid of completed tours, **filterable by category**: Apartment Complexes / Airbnbs & Short-Term Rentals / Homes for Sale. Buyers self-sort by category; this filter is the page's core job.
- Client-side vanilla JS filtering, no reload. Must not break with JS disabled (show everything as the no-JS fallback).
- Each item: poster thumbnail, property type, short caption, click-to-load tour (facade pattern above).
- Feature the apartment complex project prominently — exterior plus 20 units is the strongest proof on the site.
- Keep the grid extensible; new tours get added regularly. Adding one should mean adding one markup block, nothing else.

### `contact.html` — Contact & booking

- Calendly inline widget as primary action, referral logic intact.
- Direct contact fallback for people who won't use a scheduler.
- Short note on what happens after booking — set expectations, reduce hesitation.

---

## Design direction

Run frontend-design's two-pass process: **brainstorm a design plan → critique it against the brief → only then build.**

Steers specific to this project:

- **Mobile-first.** Most traffic arrives from Instagram/TikTok links on a phone. Design the phone layout first; desktop is the enhancement.
- **The tours are the visual identity.** The design frames them and gets out of the way. Photography gets the boldness; chrome stays quiet and disciplined.
- **Ground it in the subject** (frontend-design's core instruction). The subject's own vernacular is 360° panoramas, equirectangular projection, the horizon line, the wide format, architectural space, the seam where a panorama wraps. One candidate signature: **the horizon line as the page's structural device** — every equirectangular image is organized around it. Interrogate that idea rather than accepting it; if you find something better rooted in the same world, use that instead. The point is that the signature comes from panoramic photography, not from a style catalog.
- **Spend boldness in one place.** One memorable element; cut decoration that doesn't serve the brief.

---

## Quality floor

- Responsive from ~320px up.
- Visible keyboard focus states; semantic HTML; alt text on every image.
- `prefers-reduced-motion` respected — including all GSAP.
- Lighthouse target: 90+ performance and accessibility, mobile.
- Every image sized, compressed, lazy-loaded below the fold. A slow site selling immersive visuals is self-defeating.
- Run ui-ux-pro-max's pre-delivery checklist before declaring done.

## SEO

- Unique `<title>` and meta description per page, targeting Minnesota locality.
- Open Graph + Twitter card tags — links get shared from social constantly.
- `LocalBusiness` JSON-LD schema.
- Semantic heading hierarchy, one `<h1>` per page.
- Remove the Webflow generator meta tag and "Last Published" export comments.

## Out of scope

- The custom 360° hosting platform. Tours stay on Kuula for now; separate later project.
- Any backend, CMS, or build pipeline.
- Analytics or ad pixels.

---

## Process

1. Read the three existing HTML files first — extract all real copy, image references, links, and the Calendly logic **before deleting anything**.
2. Run ui-ux-pro-max's design system generator for its UX pattern, accessibility rules, and anti-patterns. Note them; do not adopt its palette/fonts.
3. Produce a frontend-design design plan: palette as 4–6 named hex values, type pairing across 2+ roles, layout concept with ASCII wireframes, and the signature element. Critique it against the brief and the banned-looks list, revise, and say what changed and why. **Stop for approval before writing code.**
4. Build `index.html` first, get sign-off, then `demos.html` and `contact.html`.
5. Verify the referral→Calendly flow end to end: load `contact.html?ref=TESTCODE`, confirm `localStorage`, confirm the generated `data-url` contains the code in both `a1=` and `text=`.
6. Verify the Kuula facade: thumbnails render without any iframe, click mounts the tour, no layout shift, filtering stays smooth.
7. Confirm the old Webflow CSS/JS is fully removed and nothing references it.

---

## [TO FILL] — Open questions

1. **Stack decision** — confirm vanilla static (default), or opt into Astro + Tailwind + real shadcn/ui and its build step.
2. **Pricing** — tiers, starting-at price, or "request a quote"? Real numbers convert better than "contact us," even as ranges.
3. **Testimonial** — a quote from the apartment complex client. One sentence is worth a lot right now.
4. **Kuula collections** — confirm which of A/B/C/D is which property, and the caption/category for each.
5. **Logo/brand** — existing logo? Any color that must be kept?
6. **Service area** — which Minnesota cities to name for local SEO?