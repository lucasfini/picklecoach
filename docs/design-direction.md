# Design Direction

## Product feel

PickleCoach should feel encouraging, calm, and specific: a compact coach in a player's court bag, not a dense sports dashboard. The experience favors one obvious next action, large editorial statements, generous space, warm natural photography, and small evidence-backed status labels.

## Inspiration

The visual study used the publicly visible [Plant Parent App Store listing](https://apps.apple.com/us/app/plant-parent-plant-care-guide/id1612792132) and [Plant Parent screen gallery](https://screensdesign.com/apps/plant-parent-plant-care-guide/) as high-level references for hierarchy, pacing, rounded photo-led modules, and an approachable nature palette.

No Plant Parent artwork, screenshots, copy, icons, or brand assets are included in PickleCoach. The product applies those broad interface qualities to an original pickleball identity.

## Visual language

- Warm off-white canvas rather than clinical white.
- Forest green for trust and primary action.
- Bright mint for verified movement and completion.
- Acid lime for energy and a memorable coaching accent.
- Coral for active practice moments and recoverable problems.
- Oversized, tightly set headings paired with compact uppercase evidence labels.
- Large-radius cards, photo crops, quiet shadows, and pills used sparingly.
- Real people and recognizable pickleball equipment rather than generic fitness imagery.
- Short copy blocks; setup and error screens should answer “what do I do now?” immediately.

Canonical colors and radii live in `src/theme.ts`. Shared controls live under `src/components/ui`.

## Original image assets

The shipped photography and native identity artwork were generated through Codex's built-in image generation tool, inspected at their real display sizes, and saved in `assets/images`.

Editorial photographs:

- `home-hero.jpg`: recreational woman preparing an underhand pickleball serve on a warm outdoor court.
- `practice-serve.jpg`: recreational woman captured in a clear side-profile serve action.
- `practice-dink.jpg`: recreational man in a compact kitchen-line dink stance.
- `practice-drive.jpg`: recreational man extending through a forehand drive.

Final prompt set, normalized for reproducibility:

```text
Use case: photorealistic-natural
Asset type: iOS coaching-app editorial photography, 3:2 landscape
Primary request: create a natural recreational pickleball action photo for [home hero / Serve / Dink / Drive]
Scene: leafy public outdoor pickleball court with correct net and line markings
Subject: one adult recreational player using a realistic pickleball paddle and perforated ball; clear, anatomically plausible action for the named skill
Style: premium candid editorial sports photography with real skin and fabric texture
Composition: full player readable at card crop sizes, useful surrounding court space, no dramatic professional-tournament styling
Lighting: warm soft morning or late-afternoon sunlight
Palette: forest, sage, cream, coral, muted blue, and yellow-ball accents
Constraints: recognizable pickleball equipment and court; inclusive set of adult players across the four images; no text, logo, watermark, crowd, or duplicated limbs
```

These images are mood and navigation assets only. They are not pose-validation fixtures and must never be cited as evidence that the analysis pipeline works.

Native identity:

- `app-icon.png`: 1024 px, opaque, full-bleed iOS icon with a lime perforated ball and cream/coral progress arcs on forest green.
- `splash-mark.png`: matching transparent launch mark used over the canonical forest background.

Final identity prompt, normalized for reproducibility:

```text
Use case: original native app identity
Asset type: full-bleed 1024 px iOS app icon plus a transparent companion launch mark
Primary request: a bold acid-lime perforated pickleball with restrained cream and coral motion arcs suggesting feedback and improvement
Style: calm, editorial, athletic, geometric, premium, lightly tactile, and legible at 60 px
Palette: forest #0F3D2E, acid lime #E1F35B, coral #F37F68, cream #F5F3EC
Constraints: no text, letters, tennis-ball seams, people, paddles, mascot, border, baked corner mask, existing-brand resemblance, or watermark
```

The app icon is opaque and does not bake in Apple's rounded-corner mask. The launch asset preserves transparency and is displayed on the same forest field in light and dark appearance modes.

## UI guardrails

- Do not put more than one dominant call to action on a screen.
- Do not display a technique number without measured provenance.
- Keep instructional copy scannable at arm's length on court.
- Preserve Dynamic Type-friendly layouts and explicit accessibility labels on icon-only actions.
- Treat empty, permission, loading, error, and retake states as designed product surfaces.
