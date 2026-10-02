# Output Shapes

Do not use one fixed template for every question.

The user feedback on this skill was explicit: when every answer used the same sections, the result felt stiff, obvious, and low-value.

The right output is the one that delivers the strongest judgment with the least ceremony.

## Core principles

- lead with the main read fast
- make the useful point, not the complete taxonomy
- integrate evidence into claims by default
- use concrete deltas when they sharpen the point
- only include a “next step” if the user asked for guidance
- only suggest other analyses if the user asked for orientation

Concrete deltas are often more valuable than generic summaries:

- tag share changes
- new keyword spikes
- one container appearing suddenly
- one old theme fading
- a contradiction that exists across 30 and 365 days

## Default evidence rule

Prefer embedded evidence:

- `这不是泛泛的 AI 兴奋。过去一年里 Proj/* 只占 4.4%，最近 30 天升到 24.6%。`
- `Rudder 在过去一年是 0，最近 30 天突然出现 29 次，这说明它不是旧问题换名字，而是新容器。`

Use a separate evidence block only when:

- the user explicitly asks for evidence
- the lens depends on visibly stacked proof, such as blind spots
- the argument would become muddy without a compact proof cluster

## Preferred shapes by lens

### Overview

Use a judgment-led shape.

Recommended pattern:

```markdown
[opening verdict]

**新出现的**
- ...
- ...

**一直没变的**
- ...
- ...

**真正的拉扯**
- ...
- ...

[optional: 2-3 concrete next directions only if the user asked for orientation]
```

For overview, specific shifts often matter more than neat headings. It is good to include tag ratios, keyword bursts, or container changes when they make the thesis sharper.

### Blind spots

Keep it tight.

Recommended pattern:

```markdown
[one-sentence diagnosis]

**盲区 1**
...

**盲区 2**
...

**盲区 3**
...

**最该停止重复的**
...
```

Do not preface blind spots with too much setup. The user asked for the blind spots.

### MBTI-style reading

Make it feel like a direct read, not a report.

Recommended pattern:

```markdown
[main hypothesis + short disclaimer]

为什么更像这个：
- ...
- ...

为什么不是那么确定：
- ...

备选解释：
- ...
```

### Compounding flywheel

Keep it strategic and mechanism-heavy.

Recommended pattern:

```markdown
[opening verdict]

**最可能复利的主线**
...

**为什么它会复利**
- ...
- ...

**卡点**
- ...

**接下来该加码什么**
...
```

### Action guide

Make it operational.

Recommended pattern:

```markdown
[what is actually stuck]

**继续**
...

**停止**
...

**测试**
...
```

### ACT lens

Keep it psychologically sharp but practical.

Recommended pattern:

```markdown
[what keeps hooking them]

**你可能不必立刻反应的**
...

**真正还重要的**
...

**一个值导向动作**
...
```

## Voice rules

- sharp, but not theatrical
- specific, but not overconfident
- reflective, but not vague
- coach-like, not therapist-like

## Failure modes

Bad output:
- “你最近想了很多事情，也有一些困惑”
- “你很重视成长和自我实现”
- giant memo paraphrases
- generic encouragement
- same headings every time
- section titles that say less than the content

Good output:
- identifies one real pattern
- names one real contradiction
- shows why the contradiction matters
- leaves the user with one useful move
- sounds like a judgment, not a form

## Evidence formatting

Evidence should be short and interpretable.

Good evidence bullets:

- a short quoted fragment
- a paraphrased memo cluster
- a note pattern with time-window contrast

Examples:

- `过去 30 天里你多次把“想做更长期的事”和“又怕短期没有反馈”放在同一个问题里。`
- `90 天窗口里，关于产品/写作/方法论的 memo 反复出现，而娱乐型主题很少稳定存在。`
- `这一类纠结在 365 天窗口也存在，说明它不是最近压力造成的，而是结构性偏好冲突。`

Bad evidence bullets:

- large memo body pastes
- vague claims like `你很重视成长`
- unsupported labels like `你是高敏感人格`

## Two important defaults

### Do not force “next analysis”

If the user asked one question, answer that question well.

Only suggest next analysis directions when:

- the user said they do not know what to analyze
- the user explicitly asks what else is worth looking at
- the overview answer naturally reveals 2-3 highly concrete paths

Even then, do not list generic lens names unless the lens name itself adds value.

### Do not force “价值与决策信号”

Sometimes this section is useful. Often it is filler.

If values can be named sharply, include them inside the main analysis. If not, skip them.
