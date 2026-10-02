# Query & Sampling Strategy for Obsidian

This file explains how `flomo-analysis-studio` should sample and gather evidence from the user's Obsidian notes without turning the analysis into an overwhelming dump.

## Core rule

Start broad, form a hypothesis, then gather just enough evidence to either support or weaken that hypothesis.

The job is not "read everything in the vault." The job is "extract the few note clusters that best explain the user's current pattern."

## Working model

Think in four layers:

1. **Summary layer**: what themes dominate each time window (recent 30d vs 90d vs 365d)
2. **Hypothesis layer**: what pattern might explain those themes
3. **Evidence layer**: which notes actually support or challenge that pattern
4. **Interpretation layer**: what the pattern means for the user now

If you skip layer 2, the rest becomes random querying.

## Default sequence

### Step 1. Broad scan

Identify the user's daily notes, memos, or journal files:
- Check default folders like `Daily/`, `Journal/`, `flomo/`, `Notes/`
- Or search by tags `#flomo`, `#memo`, `#daily`, `#journal`
- Read a representative sample from:
  - Last 30 days (what is active/loud right now)
  - Last 90 days (what has stabilized into a pattern)
  - Last 365 days (what feels structural over the long term)

At this stage, capture only 2-4 candidate themes. More than that usually means the analysis is still too close to the raw notes.

### Step 2. Name the hypothesis before reading more

Convert the candidate themes into one of these hypothesis types:

- **Repeated conflict**: "the user keeps wanting two incompatible things"
- **Repeated pursuit**: "the user keeps returning to the same topic with energy"
- **Repeated emotional hook**: "the same trigger or self-judgment keeps grabbing attention"
- **Repeated avoidance**: "the user keeps understanding something without changing behavior"
- **Repeated identity signal**: "the same values or style show up across domains"

If you cannot name the hypothesis in one sentence, do not start targeted sampling yet.

### Step 3. Targeted evidence pass

Sample 3-6 sharp evidence notes to:
- confirm a pattern
- challenge a pattern
- identify the real friction

Good targeted sampling strategy:
- 1 sample for the main theme
- 1 sample for the likely tension
- 1 sample for a counter-signal or alternative explanation

### Step 4. Tag and folder structure pass

If the user's tag taxonomy itself reveals something (e.g. nested tags `#proj/...`, `#idea/...`, `#review/...`):
- observe which domains dominate their attention
- observe whether they organize around projects, emotions, people, or ideas
- observe whether their tag system is coherent, fragmented, or overgrown

## Lens-specific query recipes

### Overview
Sample notes across 30, 90, and 365 days.
Good targets:
- most repeated project or topic
- most obvious contradiction
- one cluster that feels newly active

### ACT lens
Look for emotional hooks, rumination loops, self-judgment, or "I know this but..." patterns:
- identify the hook
- identify the fused belief
- find at least one note where the user still knows what matters

### Compounding flywheel
Look for topics the user revisits with energy over long windows:
- separate obligation from intrinsic pull
- find overlap between interest, persistence, and usefulness

### Action guide
Look for notes that repeat the same unresolved tradeoff:
- show what needs action rather than more interpretation
- find the smallest live experiment that would reduce uncertainty

### Blind spots
This lens needs the highest evidence bar:
- get evidence from multiple notes or time windows for each blind spot
- avoid building a blind spot on one single spicy line

### MBTI-style reading
Observe attention style, decision style, and structure preference across writing samples:
- support one primary hypothesis and one plausible alternative

## Time comparison logic

- **30 days**: what is alive now
- **90 days**: what has stabilized into a pattern
- **365 days**: what looks structural

When the recent window sharply disagrees with the long window, that contrast is often more useful than the dominant topic list.

## Common mistakes
- reading too many raw notes before forming a hypothesis
- quoting large chunks instead of extracting the pattern
- over-weighting the latest dramatic note
- ignoring counter-evidence that weakens the story
