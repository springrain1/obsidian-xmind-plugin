# SuperMind Changelog

An Obsidian XMind & AI Mind Mapping Plugin

## v1.0:
- Developed XMind and Markdown local conversion, integrated xmind-viewer plugin preview functionality

## v1.1:
- Added XMind AI online conversion website (open after copying file content), plugin settings allow disabling network-required features to protect user privacy

## v1.2:
- Added file sync, vault-wide or folder-specific XMind and Markdown files with the same name are bound, changes in one sync to both

## v1.3:
- Fixed format conversion text loss bug, multiple blank lines issue

## v1.4:
- Automatic extraction of XMind file thumbnails for reading view preview, XMind previewer service region selectable, optimized plugin settings interface

## v1.5:
- Merged obsidian-enhancing-mindmap with improvements:

1. Retained previous mind map foundation, added outline view, map overview, and no-YAML support

2. Added 7 professional themes and 6 dopamine color themes - providing modern visual experience

3. Added background color picker, intelligent node line color group system

## v1.5.1:
- Fixed mind map and markdown switching, export to PNG and other command functions, visual optimization of selected node border colors for 13 mind map themes

## v1.6:

1. Fixed editing level 3 topics causing text content loss under level 1 and 2 topics when opening as mind map (avoid directly editing level 1 and 2 topics)

2. Added AI service configuration, supporting local and online model API calls, online model OpenAI-compatible service with built-in Free Qwen3 platform Qwen3-30B-A3B model free API Key

3. Markdown view context menu integrated mindmap AI option, supporting custom Prompt

4. Mind map view added floating 🧠 button, click to show AI expansion menu. Select expansion method (generate ideas, generate analysis, detailed expansion, practical applications, etc., supports custom Prompt), AI generates child nodes based on node content. (▲Note: Requires instruction model, such as DeepSeek-V3.1)

## v1.6.2:

1. Fixed possible text content loss when editing level 1, 2, 3 topics when opening as mind map

2. Fixed some XMind-like shortcuts becoming invalid in mind map view, such as node deletion

3. Added dynamic character count refresh for Markdown view context menu mindmap AI and mind map view AI expansion popup

4. Optimized Markdown view context menu mindmap AI, added timestamp to regenerated md files to avoid generation failure

## v1.6.4:

1. Context menu mindmap AI functionality refactored (Plus feature)
- Popup display mode with streaming output effect
- Content supports editing and insertion (Callout format optimization), ▲Reasoning models (such as DeepSeek-R1) recommend deleting top `<think>` before inserting
    Smart Callout type selection, automatically selecting appropriate Callout type based on different function characteristics:
    **Analysis functions** (`Core Insights`, `Deep Analysis`):
    - Use `info` type
    **Generation functions** (`Content Expansion`, `Creative Thinking`):
    - Use `tip` type
    **Optimization functions** (`Structured Summary`, `Polish Text`, `Synonym Replacement`):
    - Use `success` type
    **Translation functions** (`Translate to English`, `Translate to Chinese`):
    - Use `quote` type
    **Technical generation functions** (`Generate Mermaid`, `Generate LaTeX`):
    - Use `faq` type
    **Custom functions** (`Custom Analysis`, `Custom Prompt`):
    - Use `note` type
- Content supports regeneration, replacement functionality

2. More options menu mindmap AI functionality optimization (Plus feature)
- Create new file first (add YAML front matter at top), streaming output in new file, achieving typewriter effect
- Save path configurable in plugin settings interface
- Automatic file name conflict handling
- Built-in document analysis, summary generation, keyword extraction, also supports custom Prompt in plugin settings (shared with context menu prompts), internally escapes {{highlight}} to {{content}}

3. Added Plus feature authorization, above two features available for 7-day trial (sponsor to get registration code if you find it useful), other features remain unrestricted after expiration

## v1.7:

1. New features:
- Mind map view displays tables, callouts, quotes, text blocks (reference Mubu's "notes" feature, displaying text blocks in mind map nodes)
- Each mind map view has independent buttons and panels, no interference when split screen
- Mind map view embedded backlink content link navigation, optimized theme matching, added open icon
- Quick settings buttons added on mind map view: mind map, theme layout, direction color group, and background color

2. Fixes:
- Device serial number generated based on real hardware information, not IP address or other variable factors, to ensure serial number is unique and stable, avoiding authorization information invalidation
- XMind file opening methods now unified to open in tabs, such as right-click "Open in Previewer", clicking embedded rendered XMind file thumbnail in reading view
- All documents starting with `- `, showing `Sub title`, modified so pure list Markdown opens with filename as root node, after editing and exporting, root node converts to `# ` filename (automatically added if no `# ` heading), level 1 list items convert to `## Level1-1`
- View issue, cannot switch to workflowy view after switching to mind map view (when used with obsidian-workflowy-plugin)
- All shortcuts built into view, cleared default shortcut configuration in plugin settings interface to avoid conflicts with Obsidian native shortcuts
- Same document left-right split, right side opens mind map, so when editing left Markdown, right mind map view maintains original scroll position and zoom ratio, won't automatically move to center node position; also fixed focus automatically transferring to right mind map view when editing left Markdown
- `Show canvas overview` and `Show outline view` buttons and corresponding components were added to global DOM level, detached from mind map view hierarchy
- Resolved duplicate rendering of embedded content
- Resolved text duplication when switching to Markdown view
- After editing nodes with text blocks, connection lines correctly connect to node center position
- Table content would become HTML format, using API to convert HTML back to Markdown string
- Resolved table, callout, quote order issues with unordered lists, and callout block second line and after losing `>` issue

## v1.8:

1. New features:
- Mind map view collapse state persistence: reference obsidian-workflowy-plugin project solution, added corresponding UI controls in settings interface, using `<!--c-->` comment markers, achieving synchronized collapse between both
- Context menu, more options, and node AI functionality support AI retrieval of backlinks, block embeds, block reference link resolution, not just passing link syntax itself, can be enabled in settings interface
- Mind map view support for code blocks starting with node `- ` (line break)

2. Fixes:
- Data sync issue: When switching between Markdown view and mind map view, block reference ID (^blockid) was lost, adopted not filtering ^blockid (original collapse used ^nodeId), directly keeping in node text
- Fixed left-right split screen same md file, when editing left Markdown, right mind map syncs update, bottom right corner buttons (settings, map overview, outline view) lost or unresponsive to clicks

## v1.9:

1. New features:
- Implemented Flomo-like AI insights in Obsidian base, completed `AI Insight Main Window`, `Discover Insight Perspectives`, `Create Insight Perspective`, and `Edit Insight Perspective` pages
- AI insight backlink expansion depth configuration
- AI insight data persistence: All perspective configurations (including modifications to built-in perspectives) stored in plugin's data.json for next loading

2. Fixes:
- After entering mind map view and editing node content, switching back to Markdown view, partial content duplication issue
- `# ` level 1 heading and `## ` level 2 heading text blocks, callout display issues in mind map, reasonably matched by theme, separately optimized Tech theme and Business theme Callout
- File naming rule modified, target format: date-AI insight-XXX; content format modified, merged analysis info and document list into one [!info] callout

## v2.0:

1. New features:
- Image export functionality, document body select content right-click "Export selected content", document page top right more options "Export as image"
- "Settings" button in export preview modal
    - Image settings: Image width, card summary, show filename, show date
    - Author info: Display toggle, author name, extra text, avatar upload, alignment, display position
    - Watermark settings: Enable toggle, watermark type (text/image), text content, color, font size, transparency, rotation angle, width/height, etc.
- Settings auto-save to plugin's data.json
- Optimized mobile adaptation, mobile mind map interface added Tab and Enter virtual buttons similar to XMind mobile, usable even when editing nodes
- Mobile-specific AI character count progress indicator
- Author info reasonably matched with 12 major theme styles
- Changed plugin name from `XMind Integration` to `SuperMind`, replaced all internal related names

2. Fixes:
- Export preview modal rendering, right spacing and color matching, rounded corner issues, optimized dark professional template code block background color, etc.
- Optimized copy/paste in export preview modal
- Mobile unable to load issue, removed unsupported features like Markdown and XMind file conversion
- Mobile export preview modal settings button not on same line as cancel and 3 other buttons, download button directly calls navigator.share() to share image file
- Mobile export preview modal unable to scroll content by touch swipe
- Mobile AI character count popup position adjusted, displayed below document title area
- Dark professional template table header and callout not displaying, modern gradient template table header font changed from black to white
- Avatar preview not fully displayed in export settings panel (x was cropped)
- Green nature template and modern gradient template right margin changed to 0, no need to leave space for decorations

## v2.1:

1. Optimizations:
- Added more specific CSS selector prefixes for xmind plugin settings interface to avoid conflicts with Hinote and other plugin settings interfaces

2. Fixes:
- Zoom command palette and shortcut settings missing commands (Zoom: Zoom in and Zoom: Zoom out the entire document)
- Documents with yaml, after restarting Obsidian, occasionally appear rendered as mind map in right sidebar
- Fixed type errors in `src/MindMapView.ts`, `main.ts` and other files

## v2.2:

1. New features:
- Code blocks in body rendered as child nodes of their heading, added theme style adaptation
- Heading nodes (level < headLevel): Preserve `<br>` for visual line breaks within single-line headings;
  List item nodes (level >= headLevel): Convert `<br>` to `\n` for multi-line continuation format (compatible with obsidian-workflowy-plugin)
- Mind map view tag click triggers global search
- Added rendering for canvas, base, pdf++, Eagle and other embedded file rendering
- Footnote content protection, mind map view changes footnotes to superscript rendering, `[^xxx]` converts to `<sup class="footnote-sup">[xxx]</sup>`
- Added task list rendering functionality, implementing similar functionality to obsidian-workflowy-plugin, checkbox clickable, content grayed out

2. Optimizations:
- Only tables and text blocks are read-only, others can be edited and modified

3. Fixes:
- Fixed when heading directly followed by Callout (no plain text), entering mind map view then editing node content, switching back to Markdown view, heading lost issue
- Level 3 heading following callout being replaced display issue
- When embedded content loads and node size increases, if node position exceeds canvas boundary, content would be cropped issue
- Excalidraw embedded images (blob URL) not landing on node lines during initial rendering issue
- Required double-click node or manually check checkbox to render strikethrough style, resolved mm-todo-completed class being cleared issue

## v2.3:

### 🚀 Core Architecture Optimization

1. **Memory Management System Refactoring**
- Implemented unified `ResourceManager` resource manager, centralized management of event listeners, timers, and observers
- All components (INode, MindMap, MindMapView) support complete lifecycle management
- Added `dispose()` method to ensure proper release of all resources when components are destroyed
- **[Breaking Change]** Completely removed `INode.mindmap` property and backward compatibility layer, unified to use `getMindMap()` method (fixed 50+ potential null pointer exceptions caused by this)

2. **Async Safety Enhancement**
- Added `isDestroyed` check in all async callbacks to prevent accessing destroyed objects
- Refactored `_delay()` method, all async resources managed through ResourceManager
- Optimized MarkdownRenderer render callback lifecycle control
- Fixed NullPointerExceptions in `appFocusIn/appFocusOut` event handlers

3. **Development Mode Diagnostic Tools** (Development mode only)
- New `DiagnosticStats` class: Track resource usage, detect memory leaks
- New `PerformanceMarker` class: Measure key operation performance, identify performance bottlenecks
- Integrated into ResourceManager, automatic statistics of resource allocation and release

4. **Project Structure Optimization**
- Migrated plugin entry point `main.ts` to the project root
- Fixed import paths for all relevant modules in the `src/` directory
- Removed redundant `src/zoom-manager.ts` file

### 🐛 Bug Fixes

1. **Memory Leak Fixes**
- Fixed resource leaks caused by missing `mindmap.dispose()` calls in `onunload()`
- Fixed memory leaks caused by event listeners not being properly removed
- Fixed ResizeObserver and timer cleanup issues
- Fixed DOM element references not being released

2. **Stability Improvements**
- All cleanup operations added idempotency guarantee, safe to call multiple times
- Added complete error handling to ensure other resources are still cleaned up when partial cleanup fails
- Optimized resource cleanup order during view switching
- Fixed NullPointerExceptions in `MapOverview.destroy()`

3. **Type Compatibility Fixes**
- Fixed `this.app` property type error in `settingTab.ts`
- Corrected `debugMode` property name to `globalDebugMode` in `SettingsService.ts`
- Fixed `Buffer` type incompatibility in `xmind-to-md.ts` and `md-to-xmind.ts`
- Fixed `MarkdownPostProcessorContext` type error in `xmind-markdown-processor.ts`
- Fixed import path error in `debug-logger.ts`


## v2.4:

### 🤖 AI Skills System (Plus Feature)

1. **SKILL.md Skill Definition**
- Markdown-based skill definition format with YAML metadata (name, description, output type, variables, etc.) + Prompt template
- Multiple output types: markdown, mermaid, excalidraw (Obsidian mode / standard mode / animated mode), canvas (Obsidian Canvas / JSON Canvas), base
- Built-in default skill templates, users can customize skills in the vault's `skills/` folder

2. **Skill Manager**
- Auto-scans vault's `skills/` folder to discover and load SKILL.md skill files
- Skills management panel in settings interface, supports viewing, enabling/disabling skills
- Skill registry with output type filtering

3. **Skill Executor**
- Streaming output: AI-generated content written to files in real-time via `StreamingFileWriter`, achieving typewriter effect
- Smart content extraction: Automatically strips AI explanatory text, keeping only renderable content
- Supports Excalidraw content extraction (preserves complete content after `%%` markers), Mermaid code block extraction, Canvas JSON extraction, etc.
- Filename generation rule: `{YYYYMMDD}-{skillName}{-sourceFilename}.{extension}`
- Automatic filename conflict resolution (appends numeric suffix)

### 📁 Unified Save Path Management

- Three save path modes:
  - **Custom path** (custom): User-specified fixed path
  - **Vault root** (root): Save to vault root directory
  - **Source file directory** (source): Save to the same directory as the current file
- Unified across all AI features: context menu AI, more options AI, AI Insight, AI Skills
- Settings interface with dropdown mode selection + conditional custom path input
- Auto-creates directories when they don't exist (using Obsidian API `vault.createFolder()`)

### ⚙️ AI Settings Enhancement

1. **Configurable maxTokens**
- Added max output token count configuration in AI service settings
- Range: 256 ~ 100000, default 8192
- Unified across all AI providers (OpenAI, Anthropic, Gemini, Deepseek, Ollama, SiliconFlow)

2. **AI Stop Button**
- Both AI Insight generation and Skills execution support interruption
- Mobile progress indicator integrates stop button, click to cancel ongoing AI requests
- Mind map view node AI expansion also supports stopping
- Implemented with AbortController for proper resource cleanup

### 🐛 Bug Fixes

- Fixed maxTokens setting font color invisible in dark themes
- Fixed AI progress popup not centered
- Fixed Excalidraw content extraction being truncated at `%%` markers
- Fixed AI file generation failing when directory doesn't exist (`AIInsightSystem`, `StreamingFileWriter`, `OutputHandler` all now auto-create directories)
- Fixed improper Obsidian API usage (removed `@ts-ignore` and `as any` casts, using official API `vault.createFolder()`)
- Fixed filename deduplication not working correctly


## v2.5:

### 🎨 Settings Page Redesign

1. **Two-Level Tab Navigation Layout**
- Settings page restructured from a single long page into three primary tabs (General, AI, License 🔑) with secondary tab navigation
- General tab contains "Mind Map", "XMind", and "Other" sub-tabs
- AI tab contains "Service Config", "Common Config", "Prompt", and "Skills" sub-tabs
- License tab has no sub-tabs, directly displays Plus licensing content
- Lazy-loaded tab content panels, rendered only on first activation
- Tab state memory, restores last viewed tab when reopening settings

2. **Dopamine Purple Gradient Navigation Bar**
- Primary tab navigation with purple gradient background, active/hover button states
- Secondary tab navigation with smaller padding and background color highlighting
- Auto-adapts to light/dark themes (gradient brightness/saturation adjustments)
- All new CSS classes use `mm-settings-` prefix to avoid style conflicts

3. **Code Architecture Optimization**
- New `SettingsTabLayout` unified settings page class, replacing the old `XMindSettingTab`
- Rendering functions extracted to `src/settings/renderers/` directory (GeneralRenderers, AIRenderers, LicenseRenderer)
- Removed hardcoded inline styles from AI settings (e.g., `background-color: #978bd0`), replaced with CSS classes
- PromptSettingsTab and SkillsSettingsTab directly reused with new containers

### 🐛 Bug Fixes

- Fixed AI sub-tabs (Common Config, Prompt, Skills) missing spacing between content and navigation bar
- Fixed Prompt and Skills sub-tab title text alignment inconsistency
- Fixed license panel step 4 missing Plus feature description in parentheses

### 🔧 BASE View Compatibility Fix

- Fixed BASE view AI Insight showing "0 notes" and "No documents found for analysis"
- Adapted to Obsidian's updated BASE view DOM structure (internal links changed from `<a class="internal-link" href="...">` to `<span class="internal-link" data-href="...">`)
- `BaseDocumentResolver` selector changed from `a.internal-link` to `.internal-link`, compatible with both old and new versions
- Attribute reading prioritizes `data-href` with fallback to `href` for backward compatibility
