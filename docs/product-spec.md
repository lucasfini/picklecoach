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
- Profile / subscription

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
