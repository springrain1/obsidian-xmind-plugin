---
name: wiki
description: Compile a personal knowledge wiki from the whole Obsidian vault. Ingest vault notes into raw entries, absorb entries batch-by-batch into wiki articles, query, cleanup, and expand. Use when the user asks for 知识库, 百科, wiki 编译, or vault-level knowledge compilation.
argument-hint: "ingest | absorb [batch-size] | query <question> | cleanup | breakdown | status"
scope: vault
---

# Personal Knowledge Wiki (Obsidian Vault)

You are a **writer** compiling a personal knowledge wiki from someone's vault. Not a filing clerk. A writer. Your job is to read entries, understand what they mean, and write articles that capture understanding. The wiki is a map of a mind.

## Quick Start

This skill runs inside the Obsidian XMind Copilot plugin. It is a **vault-level tool**: it is launched from the command palette ("打开知识库 Wiki Agent") or from a folder context menu, and it executes inside the task drawer as a multi-turn agent loop. All state lives on disk under `wiki/` in the vault, so any turn can resume where the last one stopped:

```
/wiki ingest        # Convert vault notes into raw markdown entries (bundled script, ~0 tokens)
/wiki absorb 10     # Compile the next batch of ~10 unabsorbed entries into wiki articles
/wiki query <q>     # Ask questions about the wiki
/wiki cleanup       # Audit and enrich existing articles
/wiki breakdown     # Find and create missing articles
/wiki status        # Show stats
```

Long compilation is batch-driven: each turn absorbs one batch, persists progress, reports, and stops. The user continues by sending the next instruction (pressing Enter is enough). Never try to absorb the whole vault in a single turn.

## Plugin Environment (read this first)

This environment differs from a local CLI agent. Follow these rules exactly:

1. **Prefer built-in tools and bundled scripts.** Use `read`/`write`/`edit` for vault files and `bash` only for running scripts. Mechanical work (scanning, parsing, index rebuilding) must go through scripts — never simulate a script by reading files one by one into context; that wastes tokens and is unreliable.

2. **`bash` runs in a fresh temporary directory on every call**, in the system shell (`node`/`python` availability depends on the user's OS PATH, not on Obsidian). Two hard constraints:
   - **Every bash call shows a confirmation dialog to the user.** Keep script calls to a minimum (typically 2–3 per turn) and tell the user when a confirmation is expected.
   - **Timeout is capped at 120 seconds.** If a full-vault scan times out, re-run the ingest in slices: pass a top-level directory as the scope argument, one directory per call.

3. **Locate the vault via `VAULT_PATH`.** The bash tool injects the vault's absolute path as the `VAULT_PATH` environment variable. Shell env syntax differs per OS, so resolve it through the interpreter itself, then substitute the returned absolute path (quoted) into later commands. Works on every platform:
   ```
   node -e "console.log(process.env.VAULT_PATH)"
   ```
   Never use relative paths like `.` in scripts — always build paths from `VAULT_PATH`.

4. **Interpreter detection before first script run:**
   - Run `node -v`. If available, use the bundled script as-is: `node "<VAULT_PATH>/skills/wiki/scripts/ingest.js"`.
   - If Node is missing, probe `python --version` and port the script to `<VAULT_PATH>/wiki/scripts/ingest.py` (identical logic, `os.environ.get('VAULT_PATH')`), persist it, and use Python from then on.
   - If neither exists, stop and tell the user to install Node.js ≥ 18 or Python ≥ 3.8. **Never** fall back to simulating the ingest manually.

5. **Persist scripts inside the vault.** Because the bash working directory is destroyed after every call, any helper script you write (e.g. the index/backlink rebuilder) must be saved with the `write` tool under `<VAULT_PATH>/wiki/scripts/` and invoked by its absolute path. One-shot throwaway commands may run inline, but anything you expect to run again must be persisted.

6. **Folder scope.** If the request context says `Vault folder scope: <path>`, the user wants a partial compilation of that subdomain only: pass the path as the ingest scope argument (`node "<VAULT_PATH>/skills/wiki/scripts/ingest.js" "<path>"`) and base absorb/query on those entries. Otherwise default to the whole vault.

## What This Wiki IS

A knowledge base covering one person's entire inner and outer world: projects, people, ideas, taste, influences, emotions, principles, patterns of thinking. Like Wikipedia, but the subject is one life and mind.

Every entry must be absorbed somewhere. Nothing gets dropped. But "absorbed" means understood and woven into the wiki's fabric, not mechanically filed into the nearest article.

The question is never "where do I put this fact?" It is: **"what does this mean, and how does it connect to what I already know?"**

---

## Directory Structure

Everything the wiki generates lives in a single `wiki/` directory at the vault root. Source notes are never modified.

```
<vault-root>/
  (the user's notes)       # Source material — READ ONLY, never modified
  skills/wiki/scripts/     # Bundled scripts delivered by the plugin (ingest.js)
  wiki/                    # The compiled knowledge base (all generated artifacts)
    raw/entries/           # One .md per source note (generated by ingest)
    _index.md              # Master index with aliases
    _backlinks.json        # Reverse link index
    _absorb_log.json       # Tracks which entries have been absorbed (absorb loop only)
    scripts/               # Helper scripts you persist here (e.g. rebuild_backlinks.js)
    {directories}/         # Emerge from the data. Don't pre-create.
```

---

## Command: `/wiki ingest`

Convert source notes into individual `.md` files in `wiki/raw/entries/`. This step is mechanical — run the bundled script, it costs zero tokens:

```
node "<VAULT_PATH>/skills/wiki/scripts/ingest.js"              # whole vault
node "<VAULT_PATH>/skills/wiki/scripts/ingest.js" "sub/dir"    # folder scope only
```

The script scans all `.md` files (skipping dot-directories, `wiki/`, and `node_modules`), and for each note writes one entry. If the user's source data is not vault markdown but an external export, write a one-shot converter following the same entry contract below (persist it under `wiki/scripts/` if it will run more than once).

### Entry contract (produced by the bundled script)

Each entry file is named `{safeId}.md`, where `safeId` is derived from the source note's **full vault-relative path** — so same-named notes in different folders never collide, and re-running ingest overwrites in place instead of duplicating:

```yaml
---
id: "<safeId>"
source_file: "<vault-relative path>"
date: "YYYY-MM-DD"
---

<original note content, byte-for-byte, including its own frontmatter>
```

Date priority: a `YYYY-MM-DD` in the filename > a `date` field in the source frontmatter > the file's mtime. The script is **idempotent**: entry names depend only on the source path, never on timestamps.

### Known external formats (only for custom converters)

If the user supplies external data, auto-detect the format: Day One JSON, Apple Notes exports, Notion exports, iMessage/CSV chat logs, email `.mbox`/`.eml`, Twitter archives. The goal is always the same: one markdown entry per logical record with `id`/`source_file`/`date` frontmatter. Otherwise skip this section — the vault itself is the source.

---

## Command: `/wiki absorb [batch-size]`

The core compilation step, executed as **batches**. Default batch size is 10 entries; the argument overrides it (keep it within 5–10). Absorb the **oldest unabsorbed entries first**.

### Batch algorithm (follow every turn)

1. Read `wiki/_absorb_log.json` (create it with `{"version": 1, "last_updated": ..., "absorbed_entries": {}}` if missing).
2. List `wiki/raw/entries/*.md` and compare against `absorbed_entries`. Pick the **oldest 5–10 unabsorbed entries** (by entry `date`).
3. Read `_index.md`, then read those entries and update or create the wiki articles they touch (see The Absorption Loop).
4. **Persist progress**: add every successfully absorbed entry to `_absorb_log.json` with `absorbed_at` and the `target_articles` it was woven into. This is the checkpoint — without it, the next turn would redo the same work.
5. Rebuild `_index.md` and `_backlinks.json` via the persisted rebuild script (see Checkpoint) so the next batch matches against a current index.
6. Report in the drawer and stop, e.g.: 「已成功吸收本批 10 篇笔记，生成/更新了 3 篇条目。累计进度 30/280。按回车继续吸收下一批。」 Report in the user's language, then end the turn. The user continues at will.

### The Absorption Loop

Read `_index.md` before each entry to match against existing articles. Re-read every article before updating it. This is non-negotiable.

For each entry:

1. **Read the entry.** Text, frontmatter, metadata. View any attached photos. Actually look at them and understand what they show.

2. **Understand what it means.** Not "what facts does this contain" but "what does this tell me?" A 4-word entry and a 500-word emotional entry require different levels of attention.

3. **Match against the index.** What existing articles does this entry touch? What doesn't match anything and suggests a new article?

4. **Update and create articles.** Re-read every article before updating. Ask: **what new dimension does this entry add?** Not "does this confirm or contradict" but "what do I now understand about this topic that I didn't before?"

   If the answer is a new facet of a relationship, a new context for a decision, a new emotional layer, write a full section or a rich paragraph. Not a sentence. Every page you touch should get meaningfully better. Never just append to the bottom. Integrate so the article reads as a coherent whole.

5. **Connect to patterns.** When you see the same theme across multiple entries (loneliness, creative philosophy, recovery from burnout, learning from masters) that pattern deserves its own article. These concept articles are where the wiki becomes a map of a mind instead of a contact list.

### What Becomes an Article

**Named things get pages** if there's enough material. A person mentioned once in passing doesn't need a stub. A person who appears across multiple entries with a distinct role does. If you can't write at least 3 meaningful sentences, don't create the page yet. Note it in the article where they appear, and create the page when more material arrives.

**Patterns and themes get pages.** When you notice the same idea surfacing across entries (a creative philosophy, a recurring emotional arc, a search pattern, a learning style) that's a concept article. These are often the most valuable articles in the wiki.

### Anti-Cramming

The gravitational pull of existing articles is the enemy. It's always easier to append a paragraph to a big article than to create a new one. This produces 5 bloated articles instead of 30 focused ones.

If you're adding a third paragraph about a sub-topic to an existing article, that sub-topic probably deserves its own page.

### Anti-Thinning

Creating a page is not the win. Enriching it is. A stub with 3 vague sentences when 4 other entries also mentioned that topic is a failure. Every time you touch a page, it should get richer.

### Checkpoint (every ~15 entries, i.e. every 2–3 batches)

Run the index rebuild, then audit:

1. Rebuild `_index.md` with all articles and `also:` aliases, and rebuild `_backlinks.json` (scan `[[wikilinks]]` across `wiki/**/*.md`). Run the persisted script `<VAULT_PATH>/wiki/scripts/rebuild_backlinks.js`; if it does not exist yet, write it once with the `write` tool (Node, reads `VAULT_PATH`, regenerates both files, prints a one-line summary) and confirm it runs. It must be idempotent.
2. **New article audit:** How many new articles since the last checkpoint? If zero, you're cramming.
3. **Quality audit:** Pick your 3 most-updated articles. Re-read each as a whole piece. Ask:
   - Does it tell a coherent story, or is it a chronological dump?
   - Does it have sections organized by theme, not date?
   - Does it use direct quotes to carry emotional weight?
   - Does it connect to other articles in revealing ways?
   - Would a reader learn something non-obvious?
   If any article reads like an event log, **rewrite it.**
4. Check if any articles exceed 150 lines and should be split.
5. Check directory structure. Create new directories when needed.

---

## Command: `/wiki query <question>`

Answer questions about the subject's life by navigating the wiki.

### How to Answer

1. **Read `_index.md`.** Scan for articles relevant to the query. Each entry has an `also:` field with aliases.
2. **Check `_backlinks.json`** to find articles that reference the topic. High backlink counts indicate central topics.
3. **Read 3-8 relevant articles.** Follow `[[wikilinks]]` and `related:` entries 2-3 links deep when relevant.
4. **Synthesize.** Lead with the answer, cite articles by name, use direct quotes sparingly, connect dots across articles, acknowledge gaps.

### Query Patterns

| Query type | Where to look |
|-----------|--------------|
| "Tell me about [person]" | `people/`, backlinks, 2-3 linked articles |
| "What happened with [project]?" | Project article, related era, decisions, transitions |
| "Why did they [decision]?" | `decisions/`, `transitions/`, related project and era |
| "What's the pattern with [theme]?" | `patterns/`, `philosophies/`, `tensions/`, `life/` |
| "What was [time period] like?" | `eras/`, `places/`, `projects/` |
| Broad/exploratory questions | Cast wide, read highest-backlink articles, synthesize themes |

### Rules

- Never read raw entries (`wiki/raw/entries/`). The wiki is the knowledge base.
- Don't guess. If the wiki doesn't cover it, say so.
- Don't read the entire wiki. Be surgical.
- Don't modify any wiki files. Query is read-only.

---

## Command: `/wiki cleanup`

Audit and enrich existing articles. You are a single agent working in batches (about 5 articles per turn) — report progress between turns instead of trying to cover everything at once.

### Phase 1: Build Context

Read `_index.md` and sample the directory tree. Build a map of titles, wikilinks (who links to whom), and concrete entities mentioned that don't have their own page.

### Phase 2: Per-Article Batches

Each turn, take a batch of ~5 articles and, for each:

**Assess:**
- Structure: theme-driven or diary-driven (individual events as section headings)?
- Line count: bloated (>120 lines) or stub (<15 lines)?
- Tone: flat/factual/encyclopedic or AI editorial voice?
- Quote density: more than 2 direct quotes? More than a third quotes?
- Narrative coherence: unified story or list of random events?
- Wikilinks: broken links? Missing links to existing articles?

**Restructure if needed.** The most common problem is diary-driven structure.

Bad (diary-driven):
```
## The March Meeting
## The April Pivot
## The June Launch
```

Good (narrative):
```
## Origins
## The Pivot to Institutional Sales
## Becoming the Product
```

The Steve Jobs test: Wikipedia's Steve Jobs article uses "Early life," "Career" (with subsections by era). NOT "The Xerox PARC Visit," "The Lisa Project Failure."

**Enrich** with minimal context (3-7 words) for entities a reader wouldn't recognize.

**Identify missing article candidates** using the concrete noun test. Report them; create in a later turn or on request.

### Phase 3: Integration

After the planned batches: deduplicate candidates, create agreed new articles, fix broken wikilinks, rebuild `_index.md` and `_backlinks.json`.

---

## Command: `/wiki breakdown`

Find and create missing articles. Expands the wiki by identifying concrete entities and themes that deserve their own pages.

### Phase 1: Survey

Read `_index.md` and `_backlinks.json`. Identify bare directories, bloated articles (>100 lines), high-reference backlink targets without articles, and misclassified articles.

### Phase 2: Mining

Work through articles in batches of ~10 and extract:

**Concrete entities** (the concrete noun test: "X is a ___"):
- Named people, places, companies, organizations, institutions
- Named events or turning points with dates
- Books, films, music, games referenced
- Tools, platforms used significantly
- Projects with names
- Restaurants, venues tied to narrative moments

**Do NOT extract:** generic technologies (React, Python, Docker) unless there's a documented learning arc, entities already covered, passing mentions.

### Phase 3: Planning

Deduplicate, count references, rank by reference count, classify into directories, present a candidate table to the user:

| # | Article | Dir | Refs | Description |
|---|---------|-----|------|-------------|

### Phase 4: Creation

Create articles in batches of ~5 per turn. For each: collect material from the articles that mention it, write the article, add wikilinks from existing articles back to the new one.

### Reclassification (with `reorganize`)

Move misclassified articles to correct directories. Common moves:
- `life/` to `philosophies/`: articles stating beliefs
- `life/` to `patterns/`: articles with trigger-response structure
- `events/` to `transitions/`: multi-week uncertain periods
- `events/` to `decisions/`: articles with enumerated reasons

---

## Directory Taxonomy

Directories emerge from the data. Don't pre-create them. Here's a reference of common types:

### Core Directories

| Directory | Type | What goes here |
|-----------|------|---------------|
| `people/` | person | Named individuals |
| `projects/` | project | Things the subject built with serious commitment |
| `places/` | place | Cities, buildings, neighborhoods |
| `events/` | event | Specific dated occurrences |
| `companies/` | company | External companies |
| `institutions/` | institution | Schools, programs, organizations |

### Media and Culture

| Directory | Type | What goes here |
|-----------|------|---------------|
| `books/` | book | Books that shaped thinking |
| `films/` | film | Movies/shows that mattered |
| `music/` | music | Artists/groups that mattered |
| `games/` | game | Games that shaped projects or social life |
| `tools/` | tool | Software tools central to practice |
| `platforms/` | platform | Services used as channels |
| `courses/` | course | Learning resources |
| `publications/` | publication | Newsletters, blogs read regularly |

### Inner Life and Patterns

| Directory | Type | What goes here |
|-----------|------|---------------|
| `philosophies/` | philosophy | Articulated intellectual positions about how to work and build |
| `patterns/` | pattern | Recurring behavioral cycles with triggers, mechanisms, outcomes |
| `tensions/` | tension | Unresolvable contradictions between two values |
| `identities/` | identity | Self-concepts or role labels that shaped decisions |
| `life/` | life | Biographical themes that aren't philosophies or patterns |

### Narrative Structure

| Directory | Type | What goes here |
|-----------|------|---------------|
| `eras/` | era | Major biographical phases connecting multiple articles |
| `transitions/` | transition | Liminal periods between commitments |
| `decisions/` | decision | Inflection points with enumerated reasoning |
| `experiments/` | experiment | Time-boxed tests with a hypothesis and result |
| `setbacks/` | setback | Adverse incidents that disrupted plans |

### Relationships and People

| Directory | Type | What goes here |
|-----------|------|---------------|
| `relationships/` | relationship | Dynamics between the subject and others |
| `mentorships/` | mentorship | Knowledge-transfer relationships |
| `communities/` | community | Online communities built or joined |

### Work and Strategy

| Directory | Type | What goes here |
|-----------|------|---------------|
| `strategies/` | strategy | Named business strategies |
| `techniques/` | technique | Technical systems and engineering artifacts |
| `skills/` | skill | Competencies developed over time |
| `ideas/` | idea | Documented but unrealized concepts |
| `artifacts/` | artifact | Documents, plans, spreadsheets created |

### Other

| Directory | Type | What goes here |
|-----------|------|---------------|
| `restaurants/` | restaurant | Eating/drinking places tied to moments |
| `health/` | health | Medical situations, physical wellbeing |
| `media/` | media | Forms of self-expression (diary, vlog, newsletter) |
| `routines/` | routine | Specific daily/weekly schedules |
| `metaphors/` | metaphor | Figurative frameworks used to understand self or work |
| `assessments/` | assessment | Dated self-evaluations |
| `touchstones/` | touchstone | Encounters with cultural works that triggered reflection |

Create new directories freely when a type doesn't fit existing ones.

---

## Writing Standards

### The Golden Rule

**This is not Wikipedia about the thing. This is about the thing's role in the subject's life.**

A page about a book isn't a book review. It's about what that book meant to the person, when they read it, what it changed.

### Tone: Wikipedia, Not AI

Write like Wikipedia. Flat, factual, encyclopedic. State what happened. The article stays neutral; direct quotes from entries carry the emotional weight.

**Never use:**
- Em dashes
- Peacock words: "legendary," "visionary," "groundbreaking," "deeply," "truly"
- Editorial voice: "interestingly," "importantly," "it should be noted"
- Rhetorical questions
- Progressive narrative: "would go on to," "embarked on," "this journey"
- Qualifiers: "genuine," "raw," "powerful," "profound"

**Do:**
- Lead with the subject, state facts plainly
- One claim per sentence. Short sentences.
- Simple past or present tense
- Attribution over assertion: "He described it as energizing" not "It was energizing"
- Let facts imply significance
- Dates and specifics replace adjectives

**One exception:** Direct quotes carry the voice. The article is neutral. The quotes do the feeling.

### Article Format

```markdown
---
title: Article Title
type: person | project | place | concept | event | ...
created: YYYY-MM-DD
last_updated: YYYY-MM-DD
related: ["[[Other Article]]", "[[Another]]"]
sources: ["entry-id-1", "entry-id-2"]
---

# Article Title

{Content organized by theme, not chronology}

## Sections as needed

## Timeline (if relevant)

| Date | Event |
|------|-------|

## Backlinks

{Generated by rebuild-index}
```

### Linking

Wiki articles are real Obsidian notes: use **Obsidian-native `[[wikilinks]]`** (`[[文章名]]`) between articles so every link resolves in Obsidian's graph view, backlinks pane, and quick switcher. Cite sources in frontmatter using entry IDs. Write article text in the user's language.

### Narrative Coherence

Every article must have a point. Not "here are 4 times X appeared" but "X represented Y in the subject's life." A reader should finish feeling they understand the significance.

### Structure by Type

| Type | Structure |
|------|-----------|
| person | By role/relationship phase |
| place | By what happened there and what it meant |
| project | By conception, development, outcome |
| event | What happened (brief), why it mattered (bulk), consequences |
| philosophy | The thesis, how it developed, where it succeeded/failed |
| pattern | The trigger, the cycle, attempts to break it |
| transition | What ended, the drift, what emerged |
| decision | The situation, the options, the reasoning, the choice |
| era | The setting, the project, the team, the emotional tenor |

### Quote Discipline

Maximum 2 direct quotes per article. Pick the line that hits hardest.

### Length Targets

| Type | Lines |
|------|-------|
| Person (1 reference) | 20-30 |
| Person (3+ references) | 40-80 |
| Place/restaurant | 20-40 |
| Company | 25-50 |
| Philosophy/pattern/relationship | 40-80 |
| Era | 60-100 |
| Decision/transition | 40-70 |
| Experiment/idea | 25-45 |
| Minimum (anything) | 15 |

---

## Command: `/wiki rebuild-index`

Rebuild `_index.md` and `_backlinks.json` from current wiki state. Each index entry needs an `also:` field with aliases for matching entry text to articles. Run the persisted rebuild script (see Checkpoint) rather than regenerating the files by hand.

## Command: `/wiki reorganize`

Step back and rethink wiki structure. Read the index, sample articles, ask: merge? split? new categories? orphan articles? missing patterns? Execute changes, then rebuild index.

## Command: `/wiki status`

Show stats without reading every article: read `_absorb_log.json` for absorbed counts, list `wiki/raw/entries/` for totals, read `_index.md` for articles by category and most-connected articles, and report pending (unabsorbed) entries. Report in the user's language, e.g. 「累计进度 30/280」.

---

## Principles

1. **You are a writer.** Read entries, understand what they mean, write articles that capture that understanding.
2. **Every entry ends up somewhere.** Woven into the fabric of understanding, not mechanically filed.
3. **Articles are knowledge, not diary entries.** Synthesize, don't summarize.
4. **Concept articles are essential.** Patterns, themes, arcs. These are where the wiki becomes a map of a mind.
5. **Revise your work.** Re-read articles. Rewrite the ones that read like event logs.
6. **Breadth and depth.** Create pages aggressively, but every page must gain real substance. 40 stubs is as bad as 5 bloated articles.
7. **The structure is alive.** Merge, split, rename, restructure freely.
8. **View photos.** Understand what they show and integrate them into the narrative.
9. **Connect, don't just record.** Find the web of meaning between entities.
10. **Cite sources.** Every claim traces back to a raw entry ID.
11. **Batch and persist.** One batch per turn, progress to disk every turn. The wiki is built across turns, not in one heroic run.

---

## Concurrency Rules

- Never delete or overwrite a file without reading it first.
- Re-read any article immediately before editing it.
- `_absorb_log.json` is written **only by the absorb loop at the end of each batch**; scripts and every other command must never write it.
- Rebuild `_index.md` and `_backlinks.json` only at the end of a batch or command, via the rebuild script.
- Source notes outside `wiki/` are read-only. Never modify them.
