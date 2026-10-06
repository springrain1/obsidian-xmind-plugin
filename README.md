# SuperMind - Enhanced Mind Map Plugin for Obsidian

<div align="center">

**A powerful, stable mind mapping plugin for Obsidian**

Interactive Editing • AI Smart Expansion • Multiple Export Formats • Enterprise-Grade Stability

[![Version](https://img.shields.io/badge/version-3.7-blue.svg)](CHANGELOG.md)
[![Platform](https://img.shields.io/badge/platform-Desktop%20%7C%20Mobile-green.svg)](#platform-support)

[中文文档](README_cn.md)

</div>

---

## ✨ Key Highlights

### 🌟 Dual-Engine Synergy: Lightweight Markdown Meets Professional XMind
Bridges the gap between raw text notes and professional visual mapping. Enjoy seamless in-note mind map editing with rich media embeds inside Obsidian, while unlocking XMind's 42 architectural skeletons (mind maps, timelines, fishbones, 2D matrices) and 53 designer color palettes. High-fidelity bidirectional round-trip ensures your ideas flow freely between text and visuals.

### 🤖 Autonomous Execution: Beyond Chatbots, An Agent That Delivers
Powered by a unified Pi-AI runtime with adaptive reasoning intelligence. Docked non-blocking task drawer is always one click away, with selection quick-feeding and zero-token `@` note mentions. Equipped with 10 core specialized skills and modular extension packages, your AI copilot compiles native `.xmind` files, synthesizes personal vault wikis, and formats publication-ready articles.

### 🔌 Official Cloud Ecosystem: First-Class Xmind MCP Integration
Pioneers deep integration with official Xmind MCP server protocols. Your AI autonomously creates, searches, and edits cloud mind maps, while programmatic links render natively inside Obsidian tabs without window switching. Enhanced with a singleton OAuth manager for months of uninterrupted session persistence.

### 🧠 Cognitive Elevation & Flawless Presentation: 24 Master Lenses & Boundaryless Export
Elevate your thinking with 24 high-order mental models (including Charlie Munger's Mental Models, Dalio's Principles, and the Feynman Technique) across four cognitive quadrants. Export ultra-large canvases with thousands of nodes in high definition without truncations or crashes, fully isolated from host dark themes for crisp contrast.

---

## 🚀 Core Features

### 1. Mind Map Editing & View Enhancements

#### Interactive Editing & Layout Architectures
- ✅ **Visual Canvas Editing**: Create and edit mind maps directly in Obsidian with fluid drag-and-drop, rich keyboard shortcuts, live WYSIWYG preview, and full undo/redo (`Ctrl+Z` / `Ctrl+Y`) history
- **4 Global Layout Directions**: Center, Right, Left, and Clockwise distribution
- **13 Built-in Themes & Styling**: 7 professional + 6 dopamine color palettes, smart branch connection color system, and canvas background picker
- **Responsive Canvas**: Smooth zooming, panning, and auto-adapting canvas boundaries

#### Comprehensive Rich Text & Embedded Rendering
| Content Type | Supported Features & Behaviors |
|-------------|--------------------------------|
| **Markdown Syntax** | Bold, italic, highlight, strikethrough, inline code, multi-level headings |
| **Tables** | Full visual table rendering and in-node editing, convertible to 2D matrices |
| **Callout Boxes** | Multiple Callout types (NOTE, TIP, WARNING, etc.), theme-adaptive styling |
| **Block Quotes** | Native blockquote rendering and long text block display |
| **Code Blocks** | Syntax highlighting with dedicated child node rendering |
| **Embedded Content** | Seamlessly embed Canvas, PDF++, Eagle, and Excalidraw whiteboards/media |
| **Wikilinks** | Native Obsidian `[[Wikilink]]` navigation and backlink resolution |
| **Math & Footnotes** | LaTeX math formula rendering and superscript footnote protection |
| **Task Lists** | Interactive clickable checkboxes synced with task states |

#### View Enhancements & Quick Settings
- **Quick Settings Bar**: Floating toolbar on the canvas top-right to instantly switch among 13 themes, toggle 4 layout structures, tune color palettes, and select background fills
- **Outline View**: Tree structure display with real-time synchronized search and bidirectional scrolling
- **Map Overview (Minimap)**: Thumbnail minimap, viewport indicator, smooth panning, and rapid jump navigation
- **Fold State Persistence**: Uses `<!--c-->` comment markers, fully compatible with obsidian-workflowy-plugin

### 2. Native XMind Engine & Format Interoperability

#### Multi-Skeleton Routing & Layout Mixing
- **42 Layout Skeletons**: Full support for 42 skeletons across 11 families (Mind Map, Timeline, Fishbone, Org Chart, Logic Chart, Brace Map, Matrices, and Spreadsheets) via Frontmatter `skeleton:`
- **Subtree Layout Mixing**: Append `#layout/xxx` to a branch heading to mix structures on a single canvas without altering parent or sibling nodes
- **Verbatim Icon Passthrough**: `#marker/<id>` icons pass through to XMind verbatim with lossless round-trip and fault tolerance
- **Markdown Tables to 2D Matrices**: Native Markdown comparison tables compile directly into structured XMind 2D comparison matrices (Spreadsheets) with auto-injected dimensions

#### 53 Master Themes & Granular Formatting
- **53 Curated Designer Color Themes**: Built-in 53 offline color themes (Rainbow, Energy, Space, etc.) with customizable primary-color variants via Frontmatter `color:` or `theme:`
- **Global Visual Frontmatter**: Control canvas background, typography, line width, and line tapering directly from note frontmatter
- **Dynamic Multi-Level Numbering**: Automatic numbering (`numbering: arabic` or `#numbering/roman`) preserves continuous sequences through drag-and-drop
- **Manual Node Width & Visual Emphasis**: `#width/<px>` pins topic card width; inline HTML tags enable per-node font size and border emphasis
- **Task Project Metadata**: Obsidian Tasks due dates (`📅`) and Dataview progress syntax (`[progress:: 50%]`) map to XMind's native octant progress markers
- **Deep High-Fidelity Sync**: Pure offline TypeScript engine with automatic contrast compensation and HTML entity preservation for reliable structure preservation

### 3. All-in-One AI Copilot & Agent Ecosystem

#### Unified Multi-Model Engine & Adaptive Thinking
- **Unified AI Architecture**: Powered by Pi-AI, seamlessly connecting Google Antigravity, Claude, OpenAI, Gemini, DeepSeek, CodeBuddy, and custom endpoints under one roof
- **Adaptive Thinking Intelligence**: Intelligently tunes reasoning depth based on complexity — handling deep architectural design with ease while delivering instant responses for casual prompts; locks strict reasoning models to undefined temperature
- **Multimodal Visual Comprehension**: `LinkResolver` automatically extracts note attachments and mind map visual elements for deep vision analysis; toggle `blockImages` privacy protection at any time

#### Non-Blocking Task Drawer & Context Feeding
- **Non-Blocking Drawer UI**: Runs smoothly in the background without modal backdrops, allowing uninterrupted reading and editing
- **Selection Quick-Feeding**: Highlight text across notes and right-click "Send selection to AI Drawer" with precise line ranges; falls back to reading pointers for long notes
- **0-Token Local Note Mentions**: Type `@` for instant fuzzy matching of vault note pointers without wasting initial prompt tokens
- **`/` Slash Skill Autocompletion**: Type `/` to search and autocomplete from enabled skills, with multi-turn session refinement (`SkillAgentSession`)
- **Collapsible Floating Bubble & Telemetry**: Minimize drawer into a bottom-right breathing pill badge; live visualization of tool executions, duration, token metrics, and artifact cards
- **Node & Context Menu AI**: Click the 🧠 icon or double-click nodes for instant brainstorming and analysis; right-click files or folders for batch AI insights

#### Built-in Core Skills & Modular Extension Matrix
> 💡 **Notice**: The plugin natively includes **10 core built-in skills** (automatically unpacked to your vault's `skills/` directory on first install), along with **6 modular extension skills** bundled in the repository for on-demand use.

| Category | Slash Command | Skill Name | Delivery | Output Artifact | Core Capability & Scenarios |
|---|---|---|---|---|---|
| **Mind & Outline** | `/xmind-creator` | **XMind Creator** | Core Built-in | `.xmind` (Native binary) | Compiles notes or outlines directly into native `.xmind` files with boundaries, summaries, and formulas |
| | `/xmind-mdoutline-generator` | **XMind Markdown Outline** | Extension | `.md` (Outline note) | Generates hierarchical outline lists with XMind control markers (`[B]`, `[G]`, `[P]`) for seamless conversion |
| | `/outliner-note` | **Outliner Note** | Core Built-in | `.md` (Structured note) | Synthesizes long articles, speeches, or papers into clear, high-signal hierarchical reading outlines |
| **Knowledge Vault** | `/wiki` | **Vault Wiki Agent** | Core Built-in | `.md` / Wiki Index | Pre-scans vault notes, extracts core concepts, and progressively compiles an interconnected personal wiki |
| | `/flomo-analysis-studio` | **Flomo Reflection Studio** | Core Built-in | `.md` (Deep report) | Analyzes fragmented thoughts, memos, and journals using compounding flywheels and cognitive mental lenses |
| | `/obsidian-markdown` | **Obsidian Markdown** | Core Built-in | `.md` (Flavored note) | Generates Obsidian-native Markdown with wikilinks, embeds, callouts, and frontmatter properties |
| | `/obsidian-bases` | **Obsidian Bases** | Core Built-in | `.base` (Database view) | Creates database views with customizable card/table layouts, filters, formulas, and aggregations |
| **Canvas & Diagrams** | `/obsidian-canvas-creator` | **Obsidian Canvas Creator** | Extension | `.canvas` (Visual map) | Builds structured Obsidian Canvas files with tree hierarchies or multi-topic spatial clusters |
| | `/json-canvas` | **JSON Canvas** | Core Built-in | `.canvas` (Open spec) | Precisely coordinates canvas nodes, dimensions, colors, and directed edges |
| | `/mermaid-visualizer` | **Mermaid Visualizer** | Core Built-in | Mermaid codeblock | Transforms logic into clean Mermaid flowcharts, sequence diagrams, and architecture graphs |
| | `/excalidraw-diagram` | **Excalidraw Diagram** | Core Built-in | `.excalidraw.md` | Creates sketch-style Excalidraw whiteboards, supporting embedded notes and animated diagrams |
| | `/drawio` | **Draw.io Diagram** | Core Built-in | `.drawio` / SVG | Generates standard Draw.io / Diagrams.net vector technical flows and system architectures |
| **Publishing Suite** | `/wechat-tech-writer` | **WeChat Tech Writer** | Extension | `.md` (Draft article) | Researches technical topics with live search and drafts engaging, well-structured tech explainer articles |
| | `/wechat-km-writer` | **WeChat KM Writer** | Extension | `.md` (Draft article) | Drafts insightful knowledge management articles covering tools, cognition, and productivity methodologies |
| | `/wechat-article-formatter` | **WeChat Article Formatter** | Extension | Inlined HTML | Injects elegant inline typography into Markdown, rendering clean HTML ready for WeChat editors |
| | `/wechat-draft-publisher` | **WeChat Draft Publisher** | Extension | Draft box / Report | Securely uploads formatted articles and covers to WeChat Official Account drafts with delivery reports |

#### Pi Agent 10 Native Toolchains & Safety Controls
- **10 Native Tools Matrix**:
  1. `read`: Inspect note contents and mind map hierarchical trees;
  2. `edit`: Perform targeted incremental replacements;
  3. `write`: Create notes or directly compile binary `.xmind` files;
  4. `find`: Vault-wide file path and regex matching;
  5. `grep`: Cross-document text pattern searching;
  6. `ls`: List directory structures and vault files;
  7. `bash`: Execute desktop system commands safely;
  8. `generate_image`: Native multi-provider AI illustration generation;
  9. `web_search`: Live multi-engine search across DuckDuckGo, Bocha, Tavily, and Jina;
  10. `web_fetch`: In-depth clean article fetching and noise filtering (*Desktop only*).
- **Tool Confirmation Safety**: Enable `requireToolConfirmation` to require explicit approval before modifying files or executing bash
- **Physical Truncation Protection (`truncateOutput`)**: Shields the model context window against gigantic file overflow
- **Unified Save Paths & Immediate Cancellation**: Save to custom paths, vault root, or source directory; full support for one-click stop buttons across mobile and desktop
- **Plus Feature Licensing**: Includes a 7-day full free trial; core capabilities stay completely free forever, with optional sponsorship activation codes for advanced AI extensions

### 4. Official Xmind Cloud Connector & Live Web Access
- **Direct Xmind Cloud Integration**: Powered by official Xmind MCP services, enabling AI to create, search, and edit cloud mind maps while keeping topics, rich notes, and tags in sync
- **In-App Mind Map Navigation**: Open and interact with cloud mind map links directly in native Obsidian `webviewer` tabs without constantly jumping between windows
- **Seamless One-Time Sign-In**: Global singleton callback server provides smooth authorization with proactive token renewal and reactive 401 retry loops for months of uninterrupted connection
- **Live Web Search & Deep Article Reading**: AI conducts real-time web research with built-in SSRF guards and noise-free article parsing across DuckDuckGo, Bocha, Tavily, and Jina

### 5. 24 Master Cognitive Lenses & Deep Synthesis
- **24 Curated Mental Lattices**: Draws from high-order thinking models including Charlie Munger's Mental Models, Dalio's Principles, the Feynman Technique, Drucker's Effectiveness, and Musk's First Principles
- **Four Cognitive Quadrants**: Systematically covers Review (reflection), Awareness (blindspot removal), Decision (direction setting), and Mastery (mental clarity) to transcend conventional thinking patterns
- **Dedicated Insight Studio**: Filter perspective pills, run instant keyword searches, and inspect master badges for multidimensional note examination
- **Batch Document & Folder Insights**: Multi-select files or right-click folders to batch-collect notes and `.xmind` files for synthesized analysis
- **Semantic Idea Clustering (Flomo Studio)**: Batch-analyze fragmented thoughts with 10 embedded templates to uncover latent connections and cluster raw ideas into structured outlines

### 6. Flawless High-Res Export & Cross-Device Sync
- **Limitless Ultra-Large Canvas Export**: Bypasses Chromium 2MB limits with default 16,000px safety downscaling (configurable among 10,000 / 12,000 / 16,000px); exports mind maps with dozens to thousands of nodes in high definition without canvas blanking
- **Pure Canvas Isolation**: Automatically renders clean, readable background colors and crisp text contrast regardless of your active Obsidian dark theme
- **Rich Image Export Controls**:
  * **Supported Formats**: High-res PNG, compressed JPEG, and lossless SVG vector graphics
  * **Customization**: Adjustable image width, custom author avatars/names/signatures, and anti-theft watermarks
- **12 Professional Document Templates**: Export mind map node outlines into beautifully formatted publication-ready documents with one click
- **Seamless Cross-Device Sync**: Unified performance across Windows, macOS, iOS, and Android; integrates with Obsidian Sync with strictly local, private vault data storage

---

## 📱 Platform Support

### Desktop (Full Support)
- ✅ Windows, macOS, Linux
- ✅ All features available
- ✅ XMind integration
- ✅ File system operations

### Mobile (Basic Support)
- ✅ iOS, Android
- ✅ Mind map viewing and editing
- ✅ Touch operations and fluid pinch-to-zoom
- ✅ Mobile-specific AI progress bar with stop button
- ✅ Image export (system share menu)
- ✅ Tab/Enter virtual buttons
- ⚠️ **Platform Differences**: Due to mobile OS sandbox limitations, native binary `.xmind` file direct parsing is only available on desktop (cloud MCP collaboration works across devices); `web_fetch` is desktop only (mobile supports live `web_search`)

---

## 📖 User Guide

### 1. Quick Start: Create & Edit Mind Maps
- **Create New Mind Map**: Press `Ctrl+P` to open the command palette and search `Create new mind map`, or right-click any folder in the file tree and choose `New mind map`.
- **Open Existing Note as Map**: Right-click any existing Markdown note and select `Open as mind map`, or click the mind map toggle icon at the top-right of the editor.
- **Fluid WYSIWYG Editing**: Drag and drop nodes to reorder, drag to box-select multiple nodes, and use complete undo/redo (`Ctrl+Z` / `Ctrl+Y`) history.

<details>
<summary><b>⌨️ Key Shortcuts Cheat Sheet (Click to expand)</b></summary>

| Category | Shortcut | Description |
|---|---|---|
| **Node Editing** | `Shift+F2` | Edit current node text |
| | `Shift+Insert` | Insert child node |
| | `Alt+Shift+Enter` | Add sibling node / Finish editing |
| | `Shift+Delete` | Delete current node and its children |
| | `Escape` | Cancel current editing |
| **Node Movement** | `Alt+Shift+↑` / `↓` | Move node up / down among siblings |
| | `Alt+Shift+←` / `→` | Adjust node hierarchy level / indent |
| | `Alt+Shift+D` | Fold subsequent siblings into child nodes |
| **Folding** | `Ctrl+Shift+Space` | Toggle expand / collapse current branch |
| | `Alt+↓` / `Alt+↑` | Expand one level / Collapse one level |
| **Typography** | `Alt+Shift+B` | **Bold text** |
| | `Alt+Shift+I` | *Italic text* |
| | `Alt+Shift+H` | ==Highlight text== |
| | `Alt+Shift+2` | ~~Strikethrough~~ |
| **Canvas** | `Ctrl+ScrollWheel` | Zoom canvas (`Ctrl+0` resets to 100%) |
| | `Alt+E` / `Alt+Shift+E` | Center active node / Center entire mind map |

</details>

### 2. Advanced Typography: 42 Skeletons, 53 Themes & Project Tasks
- **42 Layout Skeletons**: Declare `skeleton:` directly in your note's Frontmatter (case-insensitive aliases supported):
  ```yaml
  ---
  skeleton: timeline  # Options: mindmap, timeline, fishbone, org-chart, logic, brace, matrix, spreadsheet, etc.
  ---
  ```
- **53 Curated Color Themes**: Specify `color:` or `theme:`, with support for primary-color variants (e.g. `color: Energy/2`):
  ```yaml
  ---
  color: Rainbow      # Options: Rainbow, Energy, Space, Freshness, Dawn, Classic, etc.
  ---
  ```
- **Mix Multiple Structures on One Canvas**: Append a layout tag to any branch heading to isolate its structure without altering parent or sibling nodes:
  * `## Root Cause Analysis #layout/fishbone` ➔ Renders this branch as a fishbone diagram while keeping the rest as a standard mind map.
- **Dynamic Multi-Level Numbering**: Add `numbering: arabic` to Frontmatter or `#numbering/roman` to branch tags; drag-and-drop reordering updates numbering sequences automatically.
- **Task & Project Status Sync**: Tasks due dates and Dataview progress syntax map automatically to XMind's native octant progress markers:
  ```markdown
  - [ ] Architecture Design 📅 2026-10-01 [progress:: 50%] @assignee
  ```
- **Markdown Tables to 2D Comparison Matrices**: Native Markdown comparison tables compile directly into structured XMind 2D matrices (Spreadsheets) with auto-balanced columns.

### 3. AI Copilot Task Drawer & Specialized Skills
- **Always-Accessible Non-Blocking Drawer**: Click the `brain-circuit` icon in the left ribbon or right-click to invoke the task drawer; operates in the background without interrupting editing.
- **Selection Quick-Feeding & Zero-Token Note Mentions**:
  * Highlight any text snippet and right-click `Send selection to AI Drawer` to feed exact context.
  * Type `@` inside the input bar for instant fuzzy matching of vault note pointers without initial prompt token cost.
- **`/` Slash Commands for Instant Skills**: Type `/` in the input bar to autocomplete from built-in core skills (such as `/xmind-creator`, `/wiki`, and WeChat drafting).
- **Multi-Turn Refinement & Collapsible Bubble**: Follow up with natural language revisions directly; click the minimize button to dock the session into a pulsating bottom-right bubble.

### 4. Official Xmind Cloud Connector & MCP Workflows
- **One-Click Authorization**: Navigate to `Settings → AI Configuration → MCP Servers` and click `Sign in to Xmind` (supports CN and Global regions); authorization stays active for months.
- **Autonomous Cloud Collaboration**: Prompt the AI in your drawer to create and edit cloud mind maps, syncing topics, rich notes, and tag relationships automatically.
- **In-App Obsidian Tab Navigation**: Generated cloud mind map links open directly in native Obsidian `webviewer` tabs, eliminating window switching.

### 5. 24 Master Cognitive Lenses & Deep Synthesis
- **Multidimensional Perspective Examination**: Right-click any note or mind map and select `AI Cognitive Insight` to launch an interactive thinking studio.
- **Four Cognitive Quadrants**: Filter across Review (reflection), Awareness (blindspot removal), Decision (direction setting), and Mastery (mental clarity); apply 24 high-order mental models including Munger, Dalio, Feynman, and Drucker.
- **Semantic Idea Clustering (Flomo Studio)**: Batch-analyze fragmented thoughts to uncover latent connections, map conceptual topologies, and compile structured outlines.

### 6. Flawless High-Res Export & Publication
- **Limitless Ultra-Large Canvas Export**: Click Export in the mind map toolbar, choose PNG, JPEG, or SVG; built-in light-mode isolation and downscaling ensure zero crashes and crisp contrast.
- **Personalized Signatures & Watermarks**: Configure author avatars, names, custom badges, and rotated anti-theft watermarks.
- **12 Professional Document Templates**: Export mind map node outlines into beautifully formatted publication-ready documents with one click.

---

## 🛠️ Installation

### Using BRAT (Recommended)

[BRAT](https://github.com/TfTHacker/obsidian42-brat) (Beta Reviewers Auto-update Tester) allows you to install and automatically update plugins directly from GitHub.

1. Install the BRAT plugin from Obsidian Community Plugins
2. Enable BRAT in Settings → Community plugins
3. Open BRAT settings and click "Add Beta plugin"
4. Enter the repository URL: `https://github.com/springrain1/obsidian-xmind-plugin`
5. Click "Add Plugin" and BRAT will install SuperMind automatically
6. Enable SuperMind in Settings → Community plugins

> **Tip**: BRAT will automatically check for updates and notify you when a new version is available.

### Manual Installation

1. Download the latest release from [Releases](https://github.com/springrain1/obsidian-xmind-plugin/releases)
2. Extract to: `<vault>/.obsidian/plugins/obsidian-xmind-plugin/`
3. Restart Obsidian
4. Enable plugin in Settings → Community plugins

---

## 🔄 Latest Version

### v3.7 - Upgrade to Pi-AI 1.0.2, Official Xmind MCP Connector & Workspace Hardening
- 🔌 **Official Xmind MCP Connector**: Native integration with official Xmind MCP services, enabling AI to create, search, and edit cloud mind maps while synchronizing topics, notes, and tags
- 🌐 **Obsidian Native Webviewer Routing**: Programmatic cloud mind map links open directly in Obsidian's native core `webviewer` tab with intelligent system browser fallbacks
- 🛡️ **Singleton OAuth Server Manager**: Global singleton loopback server on port 3000 dynamically handles OAuth callbacks, eliminating port collisions and CSRF false-positives
- 🔑 **Dual Token Refresh Defenses**: Proactive token renewal 5 minutes prior to expiry paired with automated reactive 401 retry loops for uninterrupted multi-month authorization
- 🧠 **Adaptive Thinking Intelligence**: Intelligently tunes reasoning depth based on complexity — handling deep architectural design while disabling thinking for casual greetings; locks strict reasoning models to undefined temperature
- 📝 **Selectable Activity Feed**: Overrides parent modal styles to restore full text selection across AI drawer activity feeds for fluid link and text copying

### v3.6 - AI Cognitive Insight 2.0 & Zero-Limit Export
- 🧠 **24 Cognitive Perspective Matrix**: 24 curated mental lenses across Review, Awareness, Decision, and Master categories (integrating Munger, Dalio, Feynman, Drucker, Naval, Musk), with pill filtering, instant search, and author badges
- ⚡ **Ribbon Quick Entry**: Dedicated `brain-circuit` icon in the left ribbon to trigger the AI Copilot task drawer with active note context
- 🖼️ **Image Export 2.0**: Native binary download pipeline bypassing browser 2MB limits; adaptive downscale caps canvas height under 16,000px to prevent GPU crashes
- 🎨 **Dark Mode CSS Variable Isolation**: Cloned export DOM injects clean light variables, eliminating host dark-theme variable pollution
- 📝 **Flomo Deep Analysis Studio**: Embedded skill templates for semantic clustering and tag topology analysis of fragmented thoughts
- 🔄 **Lossless Round-trip Hardening**: Automatic contrast compensation for 38 light palettes; spreadsheet matrix column protection; HTML comparison symbols and generics preserved with zero data loss

### v3.5 - XMind Advanced Visual & Task Extensions
- 🎨 **Global Canvas Visuals**: Declare `background` (canvas fill), `font` / `font-family`, `grid-columns` (2–12), `line-width` (5 tiers) and `line-tapered` directly in Frontmatter
- 🔢 **Dynamic Multi-Level Numbering**: `numbering:` (Frontmatter, whole map) or `#numbering/<pattern>` (per branch) drives XMind's native numbering engine so numbers never break when nodes are reordered
- 📏 **Manual Node Width & Visual Emphasis**: `#width/<px>` pins topic card width; inline HTML tags enable per-node emphasis
- ✅ **Task Project Metadata**: Checkbox items with Tasks-spec due dates, Dataview-spec progress, and `@assignee` are written into XMind task extensions, auto-linking native octant markers

### v3.4 - XMind Mind Map Engine Upgrade: 42 Skeletons & 53 Color Themes
- 🧭 **42 Multi-Skeleton Routing**: Declare 42 skeletons across 11 families via Frontmatter `skeleton:`, with case-insensitive aliases
- 🎨 **53 Official Color Themes**: Apply 53 official offline palettes (Rainbow, Energy, Space, etc.) directly via Frontmatter `color:` / `theme:` with primary color variants
- 🌿 **Subtree Layout Mixing**: Append `#layout/xxx` to a branch heading to render different structures per branch
- 🏷️ **Icon Marker Passthrough**: `#marker/<id>` passes XMind icons through verbatim with lossless round-trip
- 📊 **Markdown Table to Matrix**: Native Markdown tables compile seamlessly into XMind 2D comparison matrices (Spreadsheet) with auto-injected dimensions

### v3.3 - Google Antigravity, Native Web Access, Unified Image Generation & Skill Pipelines
- 🌐 **Google Antigravity Provider & OAuth**: Desktop local loopback (port 51121) + PKCE authorization code grant with support for `gemini-3-pro`, `gemini-3-flash`, `claude-4-6-sonnet`, and more
- 🔍 **Zero-Dependency Native Web Access**: Built-in `web_search` and `web_fetch` with enterprise SSRF defense and Auto routing (DuckDuckGo, Bocha, Tavily, Jina)
- 🎨 **Unified Multi-Provider AI Image Generation**: Independent `ImagesModels` runtime supporting Google Antigravity, OpenRouter (52+ image models), and OpenAI-compatible / SiliconFlow endpoints
- ⚡ **0-Token Drawer Slash (`/`) Skill Autocompletion**: Type `/` in the drawer input to instantly search and autocomplete all 15 enabled skills with keyboard navigation
- 🔗 **Multi-Skill Sequential Pipelines**: Multi-turn context handover protocol seamlessly carrying assets across stages (e.g. WeChat "Draft ➔ Format ➔ Publish") in a single session
- 🧠 **CodeBuddy Deep Reasoning & Multimodal Vision Hardening**: Dynamic `reasoning_effort` binding, contract-compliant thinking level mapping, unrestricted multimodal vision, and settings persistence fixes
- 📱 **Modernized WeChat Publishing Skills Suite**: 4 core WeChat publishing skills aligned with `$VAULT_PATH` conventions and secure credential isolation
- 🌍 **Comprehensive Internationalization**: Full elimination of hardcoded strings across drawers, modals, and settings; native localization for all 15 skills across EN, ZH-CN, and ZH-TW

### v3.2 - Universal Copilot, Context Injection & Wiki Agent
- ⚡ **Universal AI Copilot Drawer**: Launch task drawer without a designated skill; dynamically auto-detects and binds skill titles/icons when tools read skill definitions
- 📝 **Selection Snippet Injection**: Highlight text across notes and right-click "Send selection to AI Drawer" with precise 1-based line bounds and >6000-char read pointer fallback
- 🔍 **0-Token Local `@` File Mentions**: Type `@` in the input bar to search and attach Vault files (.md, .json, .csv, .xmind) via native fuzzy match with zero Token overhead
- 📚 **Knowledge Wiki Agent (`wiki`)**: Built-in 8th skill based on Karpathy LLM-Wiki specifications with automated asset syncing and quick action suggestions
- 🛡️ **Unified Attachment Row**: Unified 16×16px remove buttons and layout overflow protection across image thumbnails and context capsules
- ⚙️ **Hardened Parser Engine**: Fully supports YAML block scalars (`|`, `>`, `>-`), preserving internal line breaks and fixing delimiter edge cases

### v3.1 - Skill Task Drawer, Multimodal Vision & XMind Interoperability
- 🎯 New Skill Task Drawer: Non-blocking drawer UI, multi-turn follow-up refinement, live activity feed, and deliverable artifact card
- 🫧 Collapsible Floating Bubble: Dock drawer into a sleek bottom-right pill badge with a running pulse indicator
- 👁️ Global Multimodal Vision: Dynamic model vision resolution and intelligent image extraction via `LinkResolver`
- 🧠 New native `xmind-creator` skill (expanding default skills to 7) generating full `.xmind` files from Markdown with advanced components
- 📁 Seamless `.xmind` document support in right-click menus and multi-document AI insights
- 🛡️ New tool confirmation safety setting, standalone `truncateOutput` protection, and automatic artifact wikilink embedding
- 🧹 Removed deprecated XMind previewer and legacy diff code (-4300+ lines), full localization across EN, ZH-CN, and ZH-TW

### v3.0 - PiAI Engine & Pi Agent Toolchain
- 🤖 AI core fully migrated to the PiAI engine; unified providers with OAuth / API Key auth and secure credential storage
- 🔑 New AI auth modal and CodeBuddy provider (device-code OAuth, JWT, streaming responses)
- 🛠️ New Pi Agent toolset: read / edit / write / find / grep / ls / bash
- 🔁 Skill executor refactored into a ReAct agent loop; XML skill list injected into the system prompt
- 📂 Multi-select files and right-click folders launch AI insights directly
- 🐛 Lifecycle management prevents memory leaks, legacy settings auto-migrate, build compatibility improved

### v2.8 - Mind Map View Enhancements & Format Improvements
- ✨ Mind map view now renders node tables with support for child nodes under table nodes
- ✨ Fixed rendering of Callout, table, code block, and quote block components; block-level components preserved as renderable child nodes
- 🐛 Fixed blank line removal between components when writing back to Markdown, fixed note blank line loss
- 🐛 Fixed content hierarchy misalignment after adding new nodes and converting to Markdown
- 🐛 Fixed blank line issues between same-level unordered lists after list conversion
- 🤖 New skill: xmind-mdoutline-generator - Extract mind map outline from original text, automatically add XMind-specific components

### v2.7 - XMind Conversion Settings & Bug Fixes
- ⚙️ Three save path modes for XMind → Markdown attachments: Obsidian default/original file location/custom path
- 🐛 Fixed mouse drag inertia issue in canvas overview
- 🐛 Added context window token count configuration option in AI service settings
- 🐛 Fixed notes and `---` separator loss issues
- 🐛 XMind→Markdown note formatting optimization using more stable `<strong>` / `<em>` syntax

### v2.6 - Batch Conversion & Comprehensive Format Support
- 🔄 File list supports folder right-click or Alt multi-select for batch XMind ↔ Markdown conversion
- ✨ Comprehensive format support: colors, notes, tags, summaries, boundaries, collapse states, formulas, images, floating topics, multiple sheets
- ✨ New command to convert between "Level 1-3 headings + unordered lists" and "All unordered lists"

### v2.5 - Settings Page Redesign
- ✨ Two-level tab navigation layout for settings (General/AI/License), no more endless scrolling
- ✨ Dopamine purple gradient navigation bar, light/dark theme compatible
- ✨ Lazy-loaded tab content panels with tab state memory
- 🐛 Fixed BASE view AI Insight unable to retrieve filtered documents (adapted to Obsidian's updated DOM structure)

📖 See [Full Changelog](CHANGELOG.md)

---

## 💬 Feedback & Support

If you encounter any issues or have suggestions:
- Submit an [Issue](https://github.com/springrain1/obsidian-xmind-plugin/issues) on GitHub
- Describe the problem in detail with steps to reproduce

---

## 🙏 Acknowledgments

- Obsidian Community
- XMind Team
- All users and supporters

---

<div align="center">

**Made with ❤️ for Obsidian**

</div>
