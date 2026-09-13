# PickleCoach — MVP Product Spec

## Product promise
**Get better at pickleball between lessons.**

PickleCoach analyzes short, controlled practice clips, identifies the highest-priority technical issue, prescribes one drill, and tracks whether the player improves over time.

## Target user
Primary persona:
- Recreational adult player, roughly 30–55
- Plays multiple times per week
- Self-identifies around 2.5–3.5 level
- Already spends money on paddles, court time, leagues, or lessons
- Wants structured improvement without paying for a coach every practice session

## MVP skills
1. Serve
2. Dink
3. Drive

Each skill uses a prescribed camera position. The app should reject or warn on unusable recordings rather than fabricate analysis.

## Core loop
1. Player chooses a skill.
2. App shows camera-placement instructions.
3. Player records 5 repetitions.
4. Pose/video pipeline extracts objective features.
5. Scoring logic computes technique metrics.
6. AI explanation layer selects one priority and explains it plainly.
7. App prescribes one short drill.
8. Player repeats the session later.
9. Progress is compared against the player's own baseline.

Until measured scoring is validated, the product stops after landmark-quality validation and shows only a clearly separated coaching preview made from demo data.

## Analysis principles
- Measurements first, generative explanation second.
- Never generate a technical claim unsupported by extracted features.
- Prefer one useful correction over a wall of feedback.
- Scores are coaching heuristics, not official ratings or medical/biomechanical diagnoses.
- Store raw video only when necessary and with clear user control.

## MVP screens
- Lightweight onboarding / level + goals
- Coach home
- Skill selection
- Camera setup / recording
- Analysis result
- Drill recommendation
- Progress dashboard
- Profile / privacy controls

## Interaction requirements

- First run asks for one self-described level and one to three improvement goals; both remain editable locally.
- The Today screen should make Serve, Dink, and Drive reachable in one tap without requiring account creation.
- The Today recommendation rotates deterministically among goal-linked skills using current-week count and practice recency; it requires no extra setup and never implies measured technique.
- Camera setup must show distance, angle, orientation, and framing before requesting permissions. Serve and Drive use a portrait, waist-high rear 45° view on the paddle side; Dink uses a portrait, waist-high sideline view.
- Capture is silent and requests camera access only; audio is not an input to pose tracking or coaching.
- Capture uses a bounded 720p/75 MB profile: enough resolution for the landmark proof of concept without defaulting to oversized 4K files.
- A player can review, retake, or discard a clip before analysis.
- Recording starts after a five-second runway so a solo player can return to the marked frame; clips shorter than five seconds are discarded before analysis with immediate retry guidance.
- The display stays awake while the camera is open so a hands-off solo set cannot be interrupted by the device idle timer.
- The display also stays awake only while on-device pose extraction is active, then releases the lock immediately.
- Pose quality failures produce a specific retake instruction and no technique result.
- Pose extraction has a bounded processing deadline; a stalled clip becomes a recoverable retake state rather than an endless loading screen.
- If another player repeatedly enters the frame, tracking requests a one-player retake instead of risking a subject switch.
- Progress may count completed practices before scoring exists, but it must not imply measured technique improvement.
- Demo coaching must be visually and verbally separate from any real landmark output.
- Demo coaching may use skill-specific fixtures for product preview, but it must never describe the player's clip.
- A failed local profile save must remain recoverable on the current screen rather than silently completing onboarding.
- Accessibility text sizes must remain navigable: display type may use a bounded scale, while explanatory and control text remains readable and scrolling is available where content grows.
- Players can inspect the exact recording lifecycle, clear practice history separately, remove abandoned temporary clips, or reset all local data.
- A failed full reset preserves the routing profile until every other local category has cleared, leaving a visible retry state instead of a partially reset navigation shell.

## Prototype privacy behavior

- Profiles and practice-history metadata are stored only on device.
- Raw clips are moved into an app-owned cache directory, are never uploaded, and are deleted after discard or after leaving analysis when possible.
- The app clears its owned recording cache on a fresh launch so a crash or forced termination does not create indefinite raw-video retention.
- Accepted raw-clip URIs pass to analysis in memory and never enter navigation state or persisted local JSON.
- Frame-level landmarks are kept in memory only during the current analysis view.
- Account, cloud retention, and consent behavior must be specified before any backend upload is introduced.

## Monetization hypothesis
Free:
- Baseline assessment
- 3 completed analyses
- Basic progress profile

Pro hypothesis:
- $9.99/month
- $59.99/year
- Unlimited or fairly-capped analyses depending on inference cost
- Full progress history
- Structured 30-day improvement plans

Pricing must be validated; these are starting hypotheses.

## Explicit non-goals for V1
- Full-match tactical analysis
- DUPR/rating prediction
- Social feed
- Coach marketplace
- Club management
- Live opponent analysis
- Wearables
- Android-specific optimization before iOS flow is strong
- Medical/injury diagnosis

## Success gates
Before expanding the feature set:
1. Players can record usable clips without assistance.
2. The same clip produces stable measurements.
3. Feedback is judged useful by real players/coaches.
4. Users repeat a practice session within 7 days.
5. A meaningful share of trial users indicate willingness to pay.
