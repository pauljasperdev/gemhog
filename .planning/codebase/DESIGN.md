# Design Philosophy

**Analysis Date:** 2026-02-01

## Core Principles

### Dark-Only, Content-First

The entire UI is dark-only. There is no light mode and no theme toggle. Pure
black (`oklch(0 0 0)`) background with near-white foreground creates maximum
contrast for reading financial content. The dark palette conveys a professional,
terminal-like aesthetic suited to a finance-oriented product.

### Semantic Color Tokens Over Hardcoded Values

All colors are expressed through CSS custom properties following shadcn
convention. Components use semantic Tailwind classes (`bg-background`,
`text-foreground`, `border-muted`) rather than raw color values (`bg-black`,
`text-white`, `border-zinc-800`). This ensures visual consistency and makes
palette changes a single-file edit in `index.css`.

### Restrained Palette, Deliberate Accents

The neutral palette is zinc-based grays. Color is used sparingly and with
intent:

- **Emerald** (`--accent`) — brand identity, CTAs, and positive states
- **Purple** (`--chart-2`) — insight/analysis labels on thesis cards
- **Indigo** (`--chart-3`) — source attribution on thesis cards

When everything is muted, the few colored elements draw the eye exactly where
they should go.

## Color System

### Variable Semantics (shadcn Convention)

| Variable                 | Value       | Role                                  |
| ------------------------ | ----------- | ------------------------------------- |
| `--background`           | black       | Page background                       |
| `--foreground`           | near-white  | Primary text                          |
| `--card`                 | zinc-950    | Card surfaces                         |
| `--primary`              | near-white  | Default button fill (neutral)         |
| `--secondary`            | zinc-900    | Subtle surface backgrounds            |
| `--muted`                | zinc-800    | Borders, subtle dividers              |
| `--muted-foreground`     | zinc-400    | De-emphasized text (subtitles, hints) |
| `--accent`               | emerald-500 | Brand color, CTAs, focus rings        |
| `--destructive`          | red-400     | Errors, validation failures           |
| `--border`               | white/10%   | Standard borders                      |
| `--input`                | white/15%   | Input field borders                   |
| `--chart-1`              | emerald-500 | Charts, emerald data series           |
| `--chart-2`              | purple-400  | Charts, insight labels                |
| `--chart-3`              | indigo-400  | Charts, source labels, gradients      |
| `--chart-4`              | emerald-400 | Badge text, lighter emerald accent    |
| `--chart-5`              | purple-500  | Gradient middle stop                  |
| `--secondary-foreground` | zinc-300    | Card body text                        |

### Rules

- **Never hardcode colors in components.** Use the semantic tokens above.
- **`--primary` is neutral, not brand.** This follows shadcn convention so
  default `<Button>` renders as a clean white button, not a green one.
- **`--accent` is the brand color.** Use it for CTAs, focus rings, and anything
  that should "pop" with the emerald identity.
- **Opacity via slash syntax.** Borders and subtle fills use `border-border`
  (white/10%), `bg-secondary/50`, `bg-accent/10` rather than separate opacity
  variables.

## Typography

### Fonts

| Variable         | Font             | Role                        |
| ---------------- | ---------------- | --------------------------- |
| `--font-sans`    | Inter            | Body text, UI elements      |
| `--font-display` | DM Serif Display | Display headings (reserved) |

Both are loaded via `next/font/google` with `display: "swap"` for performance.

### Hierarchy

- **Hero heading:** `text-4xl sm:text-5xl font-semibold tracking-tight` in
  `text-foreground`
- **Card title:** `text-xl font-semibold` in `text-foreground`
- **Body text:** `text-sm leading-relaxed` in `text-secondary-foreground`
- **Labels:** `text-xs font-bold uppercase tracking-wider` in the relevant
  accent color
- **Muted text:** `text-muted-foreground` for subtitles, metadata, hints
- **Fine print:** `text-xs text-muted-foreground` for footer, legal

## Surface Hierarchy

Depth is communicated through background lightness, not elevation or drop
shadows (except for the hero card carousel which uses `shadow-2xl` with
`backdrop-blur-md` for the glassmorphism effect).

```
background  (black)           — page
  card      (zinc-950)        — primary containers
    secondary (zinc-900)      — nested panels, right panes
      secondary/50            — inset content blocks within cards
        muted (zinc-800)      — borders, dividers
```

## Visual Treatments

### Glassmorphism (Thesis Cards)

The thesis cards in the hero carousel combine:

- `bg-card/80` — semi-transparent card surface
- `backdrop-blur-md` — frosted glass effect
- `border-border` — subtle white/10% border
- `shadow-2xl` — depth cue

This works because the cards sit over a multi-stop gradient background.

### Gradient Background (Hero Right Pane)

Three-color gradient using the accent palette, layered for depth:

1. Linear gradient: `from-chart-3/20 via-chart-5/20 to-chart-1/20`
   (indigo/purple/emerald at 20% opacity)
2. Radial gradient: `from-accent/40` (emerald glow, top-right)
3. SVG noise texture at 20% opacity with `mix-blend-overlay`

### Glow Effect (CTA Button)

The primary CTA uses an emerald box-shadow glow:

```
shadow-[0_0_20px_-5px_rgba(16,185,129,0.4)]
hover:shadow-[0_0_25px_-5px_rgba(16,185,129,0.5)]
```

These raw shadow values stay hardcoded — they are not expressible through CSS
custom properties and are specific to the CTA treatment.

### Reveal-on-Hover (Carousel Arrows)

Navigation arrows are invisible by default (`opacity-0`) and fade in when the
carousel container is hovered (`group-hover:opacity-100`). Text color
transitions from `text-foreground/50` to `text-foreground` on arrow hover.

## Spacing and Layout

### Landing Page Structure

Single-column centered layout with a max-width hero card:

```
<div min-h-svh>           — full viewport height
  <main centered>         — vertically + horizontally centered
    <card max-w-6xl>      — hero card, 2-col on desktop
      <left>  copy + CTA
      <right> carousel
    </card>
  </main>
  <footer>                — pinned to bottom via mt-auto
</div>
```

### Border Radius

Base radius is `0.625rem` (10px), scaled via `calc()` for shadcn components:

- `radius-sm`: 6px — small elements
- `radius-md`: 8px — inputs, badges
- `radius-lg`: 10px — cards, buttons
- `radius-xl` through `radius-4xl`: 14px–26px — large containers

The hero card uses `rounded-3xl` and thesis cards use `rounded-2xl` for a
softer, modern feel. CTA button and input use `rounded-full` for pill shapes.

## Interaction States

| State       | Treatment                                    |
| ----------- | -------------------------------------------- |
| Default     | Semantic background + foreground             |
| Hover       | Lighten via opacity (`hover:bg-accent/85`)   |
| Focus       | `focus-visible:ring-accent/50` (emerald)     |
| Error focus | `focus-visible:ring-destructive/50` (red)    |
| Disabled    | `opacity-50`, `pointer-events-none`          |
| Success     | `bg-accent/10 border-accent/20 text-chart-4` |
| Error text  | `text-destructive`                           |
| Selection   | `selection:bg-accent/30`                     |

## Animation

Minimal and functional:

- `fade-in-up` keyframe: 8px translateY + opacity (cookie consent entrance)
- `transition-all` / `transition-colors` on interactive elements
- Carousel uses embla-carousel's built-in slide transitions

No decorative animations. Motion serves to communicate state changes, not to
embellish.

## Component Architecture

### shadcn Layer

UI primitives (`button.tsx`, `input.tsx`, `card.tsx`, etc.) live in
`components/ui/`. These use `dark:` prefixed Tailwind utilities that activate
via `className="dark"` on `<html>`. Do not modify their internal styling —
override via `className` prop at the call site.

### Application Layer

Application components (`signup-form.tsx`, `landing-footer.tsx`) compose shadcn
primitives and apply semantic color tokens. These should never contain raw color
values like `text-zinc-400` or `bg-emerald-500` — only semantic tokens.

### Exception: Cookie Consent

`cookie-consent.tsx` uses its own `dark:` prefixed overrides with raw gray
values. This is intentional — the banner is a standalone overlay that must
render correctly regardless of the page theme context.

---

_Design analysis: 2026-02-01_ _Update when visual language changes_
