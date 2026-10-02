---
name: flomo-analysis-studio
description: Analyze the user through their notes, memos, or flomo records using guided cognitive lenses (overview, ACT, compounding flywheel, action guide, blind spots, and MBTI-style pattern reading). Use when user asks for 自我分析, 个人复盘, 盲区分析, 复利飞轮, 行动破局, or self-reflection from note history.
scope: vault
---

# Flomo / Memo Analysis Studio

## Overview

Use this skill to help a user understand themselves through their memos, daily notes, and flomo reflections.

This is not a raw search skill. It is a higher-level interpretation skill that synthesizes fragmented thoughts into structured self-reflection and actionable insight.

## Platform & Data Access in Obsidian

- **Cross-platform**: Works natively inside Obsidian across all desktop and mobile platforms (macOS, Windows, Linux, iOS, Android).
- **Data sources**:
  1. **Direct Context**: Text, memos, or daily notes provided directly in the prompt, active note, or selected files;
  2. **Obsidian Vault Notes**: Local daily notes (`Daily/`, `Journal/`), flomo export Markdown files, or card notes in the vault (read via agent tools `read`, `find`, `grep`).

## Use This Skill When

- The user wants self-analysis rather than simple note lookup
- The user does not know what to analyze and wants guided directions
- The user wants short-term, long-term, or comparative reflection from their notes
- The user wants pattern, tension, values, behavior, or personality-style interpretation
- The user wants their confusion turned into concrete action directions

## Do Not Use This Skill When

- The user only wants to find or edit one specific note
- The user only wants raw Markdown export
- The user wants medical, legal, or formal psychological diagnosis

## Core Relationship

The data layer gets the notes.

This skill decides what is worth analyzing, structures the analysis, compares time windows, and turns note evidence into higher-level insight.

## How To Work

This skill behaves like an analysis director, not a raw note reader.

The right sequence is:

1. pick or infer the most useful lens
2. gather just enough note evidence from the context or vault
3. synthesize patterns across time windows
4. produce a sharp, evidence-based analysis in pure Markdown
5. only suggest next directions when that actually helps the user

Before going deep, consult:

- `references/query-strategy.md` for how to gather evidence without note dump
- `references/output-template.md` for output shapes and formatting guidance
- the specific lens reference file for the chosen mode

Do not skip the lens reference. Each lens file contains:

- what evidence is strong enough for that lens
- how to move from note material to a useful interpretation
- which failure modes to avoid

## Analysis Modes

This skill supports 6 default lenses:

### 1. Overview (宏观鸟瞰)

Use when the user asks broad questions like “分析一下我最近” or “我最近在想什么”.

Focus:
- current core themes
- repeated tensions
- value and preference signals
- short-term vs long-term changes

Reference: `references/overview.md`

### 2. ACT Lens (接纳承诺透镜)

Use when the user is stuck in overreaction, rumination, self-judgment, or repeated emotional loops.

Focus:
- what keeps triggering unnecessary reaction
- what the user may be fusing with too tightly
- what can be noticed without immediate response
- what values-based action still makes sense

*Do not present this as therapy or treatment. This is a reflection lens inspired by ACT ideas, not clinical care.*

Reference: `references/act-lens.md`

### 3. Compounding Flywheel (复利飞轮)

Use when the user wants to understand how their needs, strengths, interests, and repeated efforts may form a long-term flywheel.

Focus:
- repeated intrinsic interests
- areas of unusual energy or persistence
- emerging capability loops
- where small repeated effort could compound

Reference: `references/compounding-flywheel.md`

### 4. Action Guide (破局行动)

Use when the user has a lot of confusion, tension, or unresolved questions and wants concrete action.

Focus:
- turn recurring confusion into next actions
- separate what needs thought from what needs movement
- identify one thing to continue, one to stop, one to test

Reference: `references/action-guide.md`

### 5. Blind Spot Exploration (认知盲区)

Use when the user wants a sharper mirror.

Focus:
- patterns the user may not be seeing
- recurring avoidance, drift, contradiction, or self-deception signals
- three blind spots that could change outcomes if addressed

*Be evidence-based and sharp, but do not overclaim.*

Reference: `references/blind-spots.md`

### 6. MBTI-Style Pattern Reading (认知风格推测)

Use when the user explicitly wants personality interpretation from note history.

Focus:
- likely cognitive style signals
- preference tendencies in decision-making and attention
- possible MBTI-style hypotheses grounded in writing patterns

*Always include a clear disclaimer: this is an informal pattern reading, not a formal assessment.*

Reference: `references/mbti-reading.md`

## Default Behavior

If the user already asks for a specific lens, use that lens directly.

If the user asks a broad question:
1. Run a broad overview analysis now; do not stop to ask for a lens first.
2. Only offer 2-3 next directions if the user is clearly asking for orientation.
3. Make next directions concrete and specific to the note pattern, not generic lens names.

If the user says they do not know what to analyze:
1. Run a short overview pass first
2. Identify the 2-3 most promising lenses
3. Tell the user why those lenses fit their note pattern
4. Continue with the best default lens now

## Time Windows

Use these defaults unless the user asks otherwise:
- short term: last 30 days
- medium term: last 90 days
- long term: last 365 days
- comparison: last 30 days vs last 180 or 365 days, whichever gives clearer contrast

Broad overview should usually combine:
- 30-day signal (what is alive now)
- 90-day stabilizer (what has settled into a habit/pattern)
- 365-day background trend (structural values and identity)

## Data Gathering Workflow in Obsidian

1. If notes or text are already passed in the context (from selection, active file, or BASE view), use that content directly;
2. If scanning the vault:
   - Use `find` or `grep` to locate notes under `Daily/`, `Journal/`, `flomo/` or notes tagged `#flomo`, `#memo`, `#reflection`;
   - Read a curated subset across time windows;
3. Do not drown the user in raw note dumps. Pull only enough evidence to support the interpretation.

Detailed query guidance: `references/query-strategy.md`

## Evidence Discipline

The value of this skill is making sharp claims with proportional evidence.

Use this calibration:
- **Strong claim**: repeated evidence across time windows, note clusters, or tag patterns (`你反复在...`)
- **Medium claim**: repeated evidence inside one time window (`你最近明显在...`)
- **Weak claim**: one or two notes or only suggestive wording (`有一些迹象表明...`)

If evidence is thin, say so and downgrade the ambition of the analysis.

## Output Shape

Pure Markdown output. Do not force every answer into the same skeleton.

Default rule:
- pick the output shape that best fits the lens and the question (see `references/output-template.md`)
- keep only the sections that materially help
- prefer density and specificity over symmetry
- weave evidence into the judgment by default
- write directly to chat/drawer, or save as a Markdown report `{topic}_analysis.md` if the user requests a saved note

Good output usually feels like:
- a strong opening judgment
- a few high-signal points
- concrete tag, keyword, or time-window differences where useful
- one sharp ending move if the user asked for guidance

## Tone

Be a sharp, evidence-based reflection coach:
- not soft and vague
- not clinical or diagnostic
- not mystical
- not rigidly templated
- anchored in real note evidence

## Safety Rules

- Do not present this as therapy, diagnosis, or medical treatment
- Do not claim certainty where the notes only suggest a weak pattern
- For MBTI-style analysis, always frame the result as a hypothesis, not a verdict
- If note evidence is too thin, say that plainly
