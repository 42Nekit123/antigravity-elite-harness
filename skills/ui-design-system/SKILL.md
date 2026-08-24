---
name: ui-design-system
description: Visual design standards for anything user-facing — web pages, components, dashboards, SVG diagrams/charts, or interactive HTML widgets. Use whenever a task involves building or restyling UI. Enforces restrained typography, a calibrated (not garish) color system, mandatory dark mode, and a specific build order — and blocks the generic "AI-generated" look (acid gradients, heavy shadows, glow, bold-everything).
---

You produce interfaces that look deliberately designed, not generated. If a
reviewer can tell at a glance that "an AI made this," you've failed — the
usual tells are listed under **Anti-patterns** below. Read this skill in
full before writing any CSS, HTML, or SVG for a UI task.

## When this applies

Any task that produces something a human looks at: a web page, a component,
a dashboard, a form, an SVG diagram or chart, an interactive HTML widget.
Doesn't apply to pure backend/CLI/API work with no visual surface.

## Build order

Follow the foundation-first sequence — don't jump straight to polishing
individual components before the system they draw from exists:

1. **Tokens** — define the palette, type scale, spacing scale, and radii in
   one place (`:root` in `index.css`, or a `tokens.css` imported first).
   Nothing else references raw values; everything references tokens.
2. **Base/reset** — element defaults (body font, base colors, box-sizing).
3. **Primitives** — buttons, inputs, cards, badges — built only from tokens.
4. **Components** — composed from primitives.
5. **Pages/layouts** — composed from components.

If you're editing an existing project, `grep_search` for an existing
token file (`tokens.css`, `variables.css`, a `theme` object, a Tailwind
config) before inventing a new one. Extend what's there; don't create a
second, competing system.

## Typography

- Two weights, maximum: **regular (400)** for body text, **medium (500)**
  for emphasis and headings. Never use 600 or 700 — at UI scale they read as
  heavy and amateurish, not confident. If something needs to stand out, use
  size, color, or spacing — not more boldness.
- A modest type scale beats an ad-hoc one. A reasonable default:
  `h1 1.75rem / h2 1.375rem / h3 1.125rem / body 1rem`, all at `500` for
  headings and `400` for body, with body `line-height` around `1.6`.
- **Sentence case everywhere** — headings, buttons, labels, nav items, SVG
  text. Never Title Case, never ALL CAPS (small caps for eyebrow labels are
  the one exception, and even then keep them rare).
- No bolding mid-sentence in body copy to "add emphasis." If a term needs
  visual distinction because it's a symbol, identifier, or literal value, use
  `code style`, not bold.
- Use a real font stack, not browser defaults: a system stack
  (`-apple-system, "Segoe UI", Roboto, sans-serif`) or one deliberate
  Google Font loaded once, not two or three competing families.

## Color system

Don't hand-pick colors ad hoc as you go — define a small, calibrated system
once, up front, and draw everything from it.

**How to calibrate a palette** (do this, don't skip to guessing hex codes):
1. Pick one accent hue and 1–2 semantic hues (success, danger, warning) as
   needed — no more than 3–4 hues total for most interfaces.
2. Generate each as a ramp of 6–7 lightness steps in HSL or OKLCH (e.g.
   95%, 85%, 65%, 45% [base], 30%, 15% lightness at fixed hue/saturation),
   not by eyeballing individual hex values per use case.
3. Reserve the lightest 1–2 steps for fills/backgrounds, the mid step for
   the accent itself (borders, active states), and the darkest 1–2 steps for
   text-on-light-fill — never plain black or generic `#333` on a tinted
   background.
4. Check contrast: body text against its background must clear WCAG AA
   (4.5:1). Verify the darkest/lightest pairing you picked actually clears
   it, don't assume.

**Tokens, not literals.** Expose the result as CSS custom properties and
reference only the properties in component code:

```css
:root {
  --color-bg: #ffffff;
  --color-surface: #f6f6f4;
  --color-text: #1a1a18;
  --color-text-muted: #6b6a63;
  --color-border: rgba(0,0,0,0.12);
  --color-accent: #3266ad;      /* pick your own calibrated accent */
  --color-accent-fg: #0c2f52;   /* darkest step of the accent ramp, for text-on-fill */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
}
[data-theme="dark"] {
  --color-bg: #16161a;
  --color-surface: #1f1f24;
  --color-text: #f0efe9;
  --color-text-muted: #a3a29b;
  --color-border: rgba(255,255,255,0.14);
  --color-accent: #6f9ad6;
  --color-accent-fg: #dce8f8;
}
```

**Dark mode is mandatory, not optional polish.** Every color reference must
resolve correctly in both themes:
- Never hardcode a color literal inside a component — always the token.
- Wire the toggle either via a `[data-theme]`/`.dark` class switch (for a
  user-controlled toggle) or `@media (prefers-color-scheme: dark)` as a
  baseline default — implement the class-based approach if the app has any
  kind of settings/theme control, since it lets a user override the OS
  setting.
- Mental test before shipping: if you swapped `--color-bg` to near-black,
  is every piece of text and every border still visible? If any text is
  hardcoded instead of tokenized, it will fail this test.
- On a colored badge/pill/tag background, use the darkest step of *that
  same* color ramp for its text — never plain black or a generic gray that
  wasn't calibrated against that background.

## Anti-patterns — the "AI slop" checklist

Refuse to ship any of these unless the user explicitly asked for that exact
effect:

- **Gradients as decoration** — a gradient background on a hero, card, or
  button "because it looks premium." Flat fills read as more confident and
  more current than gradients in UI contexts. (Illustration/art is the one
  legitimate exception — see below.)
- **Drop shadows, glow, or blur on ordinary UI elements** — cards, buttons,
  and inputs should sit on flat surfaces distinguished by a thin border or a
  subtle surface-color shift, not `box-shadow: 0 8px 30px rgba(...)`. A
  single soft shadow on a genuinely elevated element (a modal, a dropdown)
  is fine; shadows on everything is not.
- **Heavy font weights everywhere** — see Typography above.
- **Excessive rounded corners / "bubble" UI** — pick one radius scale (see
  tokens above) and apply it consistently; don't round some things 4px and
  others 24px with no logic.
- **Emoji as icons** — use a proper icon set (inline SVG or an icon
  library) sized explicitly; don't inherit font-size and don't reach for 🚀
  and ✨ as visual filler.
- **Title Case or ALL CAPS headings/buttons** — see Typography above.
- **Purple-to-blue (or pink-to-orange) gradient text/backgrounds as a
  default "tech" aesthetic** — this specific combination is the single
  most recognizable AI-generated-UI tell; avoid it outright.
- **Icon or badge soup** — decorating a card with three unrelated icons and
  two badges because it "fills the space." If it doesn't carry information,
  cut it.
- **Placeholder-only mockups** — build the real content/data flow the task
  needs, don't ship a static shell with no logic to hit an aesthetic
  deadline.

## SVG diagrams and charts

- Keep box/node labels short — detail belongs in adjacent prose or a
  tooltip/click target, not crammed into the box.
- One or two color ramps per diagram, maximum. If color encodes meaning
  (status, tier, category), add a one-line legend; otherwise stay to a
  single neutral ramp plus one accent for emphasis.
- Every `<text>` element needs an explicit `fill` from the token system —
  never omit it or rely on inherited/default fill, or it will break in dark
  mode.
- For charts: pick a formatting convention up front and apply it
  consistently — sign placement on negative numbers (`-$5M`, not `$-5M`),
  consistent decimal precision, axis labels that don't get auto-skipped
  into illegibility (rotate or thin them out explicitly if you have more
  than ~12 categories).
- Build custom legends (small square swatches + label + value) instead of a
  charting library's default legend — the defaults are usually round dots
  with no values, which is harder to scan.

## Illustration / generative art — the one exception

Pure decorative art (an illustration, a generative pattern, a hero graphic
with no informational content) is exempt from the flat-fills and
restrained-color rules above — richness and freeform color are the point
there. Everything else on this page still applies once you're back to
functional UI.

## Before you finish

Run through this once, quickly:
- [ ] Only 400/500 font weights used anywhere
- [ ] Sentence case everywhere (headings, buttons, labels)
- [ ] No gradient/shadow/blur/glow on ordinary elements
- [ ] Every color is a token, not a literal — verified against dark mode
- [ ] One consistent radius scale, one consistent type scale
- [ ] No emoji-as-icon, no decorative icon soup
