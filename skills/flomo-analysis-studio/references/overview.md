# Overview Lens

Use this when the user says things like:
- “分析一下我最近”
- “我最近在想什么”
- “基于我的 flomo 看看我最近的状态”

## Goal

Give the user a strong first read of what is actually going on.

This is the default entry lens. It should be broad enough to orient the user, but sharp enough that they feel seen rather than summarized.

## When this lens is the right default

Use overview when:

- the user asks a broad question about their recent state
- the user does not know which lens to pick
- you need to map the landscape before a sharper lens

Do not use overview as an excuse to stay shallow. Its job is still to identify the few themes that actually drive the memo stream.

## What to look for

- the 2-4 themes that dominate recent notes
- repeated conflicts or unresolved pulls
- what has real momentum vs what is noise
- what is short-term weather vs identity-level climate

Translate those into:

- what is taking attention
- what is taking emotion
- what is taking action
- what is staying unresolved

## Query pattern

Sample note batches across time windows:
- Recent active window (~30 days)
- Medium habit window (~90 days)
- Long structural baseline (~365 days)

Then only run targeted `query` calls if a theme needs proof.

Good follow-up queries:

- one query for the loudest recent theme
- one query for the clearest contradiction
- one query for a long-term pattern that might still be shaping current notes
- `tags` when tag share or container changes would make the judgment sharper

You rarely need more than 2-3 targeted queries for a strong overview.

## Good questions to answer

- What is this period really about?
- What is taking up disproportionate mindshare?
- What contradiction keeps showing up?
- What seems newly active?
- What seems old and structural?

## Analysis procedure

1. Compare 30 vs 90:
   - what stayed loud
   - what cooled down
   - what just appeared
2. Compare 90 vs 365:
   - what looks structural rather than seasonal
   - what keeps returning across many contexts
3. Pick the top 2-4 themes:
   - not the most nouns
   - the patterns with the most explanatory power
4. Name the main tension:
   - the user usually wants two things at once
   - or keeps repeating an insight without movement
5. Turn the pattern into an implication:
   - what this period is asking of them
   - or what it is blocking

## High-value signals

Overview is strongest when it identifies one of these:

- a shift in where attention is going
- a persistent identity-level concern
- a repeated tradeoff that explains many notes
- a difference between what the user writes about and what they act on
- a concrete tag or keyword spike that proves the stage really changed
- a new project container that suddenly becomes dense

## Preferred output style

Do not default to a seven-section report.

Better shape:

1. one strong opening judgment
2. `新出现的`
3. `一直没变的`
4. `真正的拉扯`
5. optional: 2-3 concrete next directions only when the user wants orientation

For overview, concrete evidence often belongs inside the judgment itself.

Good:

- `过去一年 Proj/* 只占 4.4%，最近 30 天升到 24.6%，说明主舞台换了。`
- `Rudder 在过去一年几乎不存在，最近 30 天突然密集展开，说明这不是旧问题换名，而是一个新容器。`

Bad:

- `## 证据`
- three bullets that just restate what the judgment already should have said

## Common mistakes

- giving a category report instead of an interpretation
- naming too many themes
- skipping the short-term vs long-term comparison
- describing everything as equally important
- ending without a next direction when the user asked for orientation

## Common mistake

Do not turn overview into a long category list.

The point is not “here are 9 topics.” The point is “these 3 themes are actually driving your current mental landscape.”
