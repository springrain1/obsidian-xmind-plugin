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


## v2.6:

### 🔄 Batch XMind & Markdown Conversion

1. **File List Batch Operations**
- Right-click folder in Obsidian file list to batch convert all XMind/Markdown files
- Hold Alt key to multi-select files for batch conversion
- Supports bidirectional conversion: XMind ↔ Markdown

2. **Comprehensive Format Support**
- Text and background colors
- Notes (including ordered/unordered lists)
- Tags
- Summaries
- Boundaries
- Collapse states
- Formulas
- Images
- Floating topics
- Multiple sheets

3. **Outline Note Support**
- New command (Ctrl+P): Convert between "Level 1-3 headings + unordered lists" and "All unordered lists"
- Compatible with obsidian-workflowy-plugin for rendering and editing


## v2.7:

### ⚙️ XMind Conversion Settings

1. **Attachment Path Options**
- Three save path modes for XMind → Markdown attachments (e.g., images):
  - **Use Obsidian default attachment path** (default)
  - **Original file location**: Save to same directory as source file
  - **Custom path**: User-specified directory
- Optional: Preserve XMind filename folder structure

### 🐛 Bug Fixes

1. **Mind Map View Canvas Overview**
- Fixed mouse drag inertia issue in canvas overview (continued sliding after drag release)

2. **AI Service Configuration**
- Added context window token count configuration option

3. **Mind Map View Notes & Separators**
- Fixed notes loss issue in mind map view
- Fixed `---` separator loss issue
- Content layer now automatically converts floating topics and additional sheets to level 2 headings under title

4. **XMind → Markdown Note Formatting**
- Bold and italic in notes now use more stable syntax for consistent visual effect
- Prioritize `<strong>` / `<em>` output to avoid consecutive `*` mismatching in Obsidian


## v2.8:

### 🎨 Mind Map View Enhancements

1. **Table Rendering**
- Mind map view now renders node tables
- Supports child nodes under table nodes

2. **Block Component Rendering**
- Fixed rendering of Callout, table, code block, and quote block components
- Obsidian block-level components under headings now preserved as renderable child nodes

### 🐛 Bug Fixes

1. **Markdown Conversion Issues**
- Fixed blank line removal between Callout, table, code block, and quote block components when writing back to Markdown
- Fixed note blank line loss issue

2. **Node Hierarchy Issues**
- Fixed content hierarchy misalignment after adding new nodes in mind map view and converting to Markdown

3. **List Conversion Issues**
- Fixed blank line issues between same-level unordered lists after converting "Level 3 heading + unordered list" to "All unordered lists"
- Preserved note blank lines

### 🤖 AI Skills Enhancement

4. **New Skill: xmind-mdoutline-generator**
- Extract mind map outline from original text
- Automatically add XMind-specific components (summaries, boundaries, etc.)

## v2.9:

### 🌍 Global Internationalization (i18n)

1. **Comprehensive Language Support**
- Completely eliminated hardcoded Chinese strings in the plugin codebase, supporting seamless switching between Simplified Chinese, Traditional Chinese, and English interfaces.
- Optimized Traditional Chinese translation using `opencc-js` to better suit regional vocabulary habits.
- All error messages, exception handling, settings interfaces, and notification popups are fully internationalized.

2. **AI Menu Prompts Internationalization**
- Implemented full language support for 11 default AI prompts (including "Core Insights", "Content Expansion", "Generate Mermaid", etc.) covering both UI display names and prompt templates.
- Optimized the conditional rendering and function recognition logic for context menu items, dynamically matching AI instructions based on the current user's system language environment.

3. **Intelligent Streaming Component Style Distribution**
- Refactored the Callout rendering rules in the AI result streaming popup (StreamingModal). To handle internal function names passed in different language environments, implemented a multi-dimensional vocabulary fault-tolerant matching scheme to ensure UI aesthetics and style consistency.

## v3.0:

### 🚀 PiAI Engine Full Architecture Refactoring

1. **AI Service Kernel Migration to PiAI**
- Removed legacy self-developed AI services (dispersed provider files including OpenAI, Anthropic, Gemini, DeepSeek, Ollama, SiliconFlow, etc.), unifying them under the `@earendil-works/pi-ai` engine.
- Added unified `PiAIService` service layer, consolidating model registration, credential storage, streaming output, and lifecycle management.
- Transitioned provider integration to declarative registration, natively supporting OpenAI, DeepSeek, Anthropic, Gemini, OpenAI-compatible endpoints, and more.

2. **Credential Security & OAuth Login**
- Added `ObsidianCredentialStore`, migrating API keys from plaintext settings to isolated credential storage with request abort support in `fetchJson`.
- Added AI authentication modal (`AIAuthModal`), supporting both API Key and OAuth authorization workflows adapted for desktop and mobile environments.
- Added full CodeBuddy provider implementation: device code OAuth flow, JWT decoding, authorized requests, streaming responses, and cross-platform network layer adaptation.
- Automatic legacy settings migration (`normalizeAISettings`) requiring no manual reconfiguration by users.

3. **Model Settings Panel Redesign**
- Added a unified model settings panel (`AIModelSettingsPanel`) to manage multi-model profiles in a single interface.
- Supported seamless profile switching, custom endpoints, context window configuration, and more.
- Added settings normalization test suites to ensure backward compatibility across legacy and modern configurations.

### 🛠️ Pi Agent Tool Calling (Agent Skills Standard)

4. **Agent Tool Suite**
- Added `AgentTools`: providing native Obsidian tools including `read`, `edit`, `write`, `ls`, `find`, `grep`, and `bash`.
- `edit` supports `edits[]` batch partial replacements, preventing the AI from rewriting entire files for minor changes, saving tokens, and avoiding truncation.
- `grep` and `find` support cross-vault regex full-text and file name search, enabling on-demand distillation for multi-document insights and significantly reducing context overhead.
- Physical truncation safeguards for tool output (2,000 lines / 50 KB) to prevent context window overflow.

5. **Skill Executor (ReAct Agent Loop)**
- Refactored `SkillExecutor` into a multi-turn ReAct tool-calling loop adhering to the Agent Skills progressive disclosure standard.
- System prompt constructed per Agent Skills specifications, allowing skills to load `SKILL.md`, references, and scripts on demand via tools.
- `SkillManager` generates XML-formatted skill catalogs for injection into system prompts.
- `SkillParser` added name and description validation; `PiAIService` introduced `streamSimple` to streamline streaming invocations.

### 📂 File & Folder Context Menu AI

6. **Multi-Selection & Folder Context Menus**
- File explorer supports multi-file selection and folder right-click actions to initiate AI insights directly.
- Folder right-click allows batch gathering of Markdown documents for aggregated AI analysis.
- AI insights smoothly ingest documents directly from selected files/folders.
- Added bilingual localization strings for file explorer context menus.

### 🔧 Bug Fixes & Optimizations

7. **Stability & Compatibility**
- Introduced lifecycle management in `PiAIService` to cancel all in-flight authentication, discovery, streaming, and refresh tasks upon plugin unload.
- `fetchJson` gracefully handles empty response bodies with text parsing fallback when appropriate.
- Dynamic provider endpoint resolution for specialized services (such as CodeBuddy and OpenAI Codex).
- Adjusted esbuild target to ES2020, adding Node module shims and native module missing warnings to improve build compatibility.
- Redesigned AI authentication modal styles to adapt across various screen sizes.

## v3.1:

### 🎯 Skill Task Drawer & Multi-Turn Follow-Up (Skill Task Drawer)

1. **Non-Blocking Task Drawer with Multi-Turn Refinement**
- Brand new Skill Task Drawer UI replacing modal dialogs; removes modal backdrop overlay so you can freely read and edit notes while skills execute in the background.
- Introduced `SkillAgentSession` session state management, allowing continuous natural-language follow-ups, additions, and layout tweaks on the same artifact without starting from scratch.
- Real-time Activity Feed tracking agent tool calls (read / edit / write / bash), live token consumption, and turn count metrics.
- Artifact Card automatically detects and highlights the final deliverable, opening it in an Obsidian leaf with one click.

2. **Collapsible Floating Bubble**
- The task drawer can be minimized into a sleek floating pill badge at the bottom-right corner, featuring a breathing pulse dot indicating running state.
- Click the bubble anytime to expand the drawer without obstructing note viewing; supports aborting tasks on demand.
- Supports detaching document context with one click for context-free prompts.

### 👁️ Multimodal Vision & Intelligent Link Resolution

3. **Global Vision Model Support**
- `PiAIService` enhanced with dynamic vision capability resolution (`resolveProfileVisionSupport`), seamlessly supporting vision-capable models across OpenAI, Anthropic, Gemini, and OpenAI-compatible endpoints.
- Privacy-aware with `blockImages` configuration to disable image uploading at any time.
- Unified prompt template engine supporting single-pass regex replacement for `{{highlight}}`, `{{content}}`, `{{nodeContent}}`, `{{fullContent}}`, `{{markdownContext}}`, and `${var}` placeholders.

4. **Rich Content & Image Attachment Extraction**
- Refactored `LinkResolver` to parse wiki links, embedded block refs, and raster images (`![[image.png]]`, `[alt](url)`).
- Context menu AI, mind map node AI expansion, and AI Insight now automatically extract and attach referenced images to vision models for deep multimodal understanding.

### 🧠 XMind Deep Interoperability & XMind Creator Skill

5. **Native XMind Generation Skill (`xmind-creator`)**
- Added new built-in skill `xmind-creator` (expanding default templates to 7 skills), enabling AI to generate native `.xmind` mind maps directly from notes, outlines, or dialogue.
- Leverages the converter engine: AI writes standard Markdown and it compiles into `.xmind` files with Boundaries (`[B]`), Summaries (`[G]`), Callouts (`[P]`), Relationships (`[^1]`), Tasks (`[ ]`), Labels (`#tag`), Notes (`> `), and Math (`$..$`).

6. **Direct AI Insight & Analysis on XMind Files**
- File explorer context menu and batch folder analysis fully support `.xmind` files.
- In-memory conversion parses `.xmind` mind maps to structured Markdown outlines and extracts images for AI analysis, summarization, and mind map generation without manual conversion.
- Optimized image extraction and deduplication during XMind ↔ Markdown conversions (`reuseExistingImage`).

### 🛡️ Agent Toolchain Safety & Codebase Streamlining

7. **Tool Confirmation & Sandbox Safety**
- Added "Require Tool Execution Confirmation" setting (`requireToolConfirmation`), allowing optional confirmation popups before writing files, editing notes, or executing bash commands.
- Standalone `truncateOutput` utility prevents context window overflow; bash commands run safely inside temp directories and clean up automatically.
- Automatic artifact embedding: appends `![[artifact]]` wikilinks to source files and refreshes open mind map views automatically.

8. **Codebase Cleanup & Comprehensive Localization**
- Removed deprecated XMind previewer classes, legacy markdown diff modules, and dead CSS rules (-4300+ lines removed), significantly reducing bundle size and memory footprint.
- Complete localization across Simplified Chinese, Traditional Chinese, and English for all new drawer controls, model settings, and confirmation dialogs.

### ⚡ AI Task Drawer Slash Commands & Multi-Skill Pipelines

8. **Drawer Slash (`/`) Skill Autocompletion & Context Handover Protocol**
- **0-Token Local Slash Suggestion (`DrawerSkillSuggest`)**: Aligned with the `@` file mention architecture, typing `/` in the drawer textarea instantly pops up all enabled skills with icons, localized titles, descriptions, and `/slug` commands; supports full keyboard navigation and robust whitespace boundaries.
- **Multi-Turn Context Handover Protocol**: Automatically tracks deliverable assets across turns (Markdown article, cover image, formatted HTML); when a slash command like `/wechat-article-formatter` or `/wechat-draft-publisher` is invoked, previous stage asset pointers are injected automatically, enabling seamless "Draft ➔ Format ➔ Publish" WeChat pipelines in a single drawer session without copy-pasting file paths.
- **Dynamic Skill Badge & BaseDir Switching**: Typing a slash command dynamically updates the drawer title icon and name, and synchronizes the tool execution `baseDir` to the newly active skill directory.
- **Settings Panel Cold-Start Persistence Fix**: Fixed a defensive overwrite bug in the AI settings panel where an unpopulated network catalog on boot would reset configured model profiles to `'auto'` and wipe reasoning levels; existing user configurations are now 100% preserved on restart.

## v3.2:

### 🚀 Universal AI Copilot & Multi-Source Context Injection

1. **Universal AI Copilot Drawer & Dynamic Skill Routing**
- Support invoking the AI Copilot Task Drawer without selecting a pre-designated skill; users can freely ask general questions or specify requests.
- Dynamic skill activation: when the model calls the `read` tool on a skill definition file during execution, the drawer automatically detects and synchronizes the skill's name and icon in real-time.
- Interactive skill switcher: easily toggle between universal copilot mode and specialized skill cards within the drawer form.
- Active drawer guard: prevents creating duplicate or ghost modals, smoothly expanding and focusing the existing active drawer session.

2. **Cross-Document Selection Injection & Unified Attachment Capsules**
- Right-click editor selection feeding: highlight any paragraph or key data in notes and right-click "Send selection to AI Drawer" (`arrow-up-right`) to enqueue it as a referenced context capsule.
- Smart line calculation: captures 1-based line ranges with selection end adjustments (`to.ch === 0`) to prevent trailing newline bleed.
- Progressive disclosure safeguard: selections exceeding 6,000 characters automatically degrade into lightweight read pointers with `offset` and `limit`, preventing token waste and hallucination.
- Unified attachment row: pending image thumbnails and text/file context capsules share the preview row with identical 16×16px close button styling, ellipsis truncation, and anti-overflow protection.

3. **0-Token Local `@` File Mentions (DrawerFileSuggest)**
- Type `@` directly in the follow-up input box to trigger native fuzzy search against readable Vault files (.md, .json, .csv, .xmind, etc.).
- 100% local fuzzy scoring with zero network calls and zero model token overhead.
- Keyboard navigation (Arrow Up/Down/Enter/Tab/Escape) and IME composition protection; selecting an entry removes the `@query` and mounts a `$VAULT_PATH/` file pointer capsule.
- Input placeholder updated to clearly guide users on `@` file mentions, right-click text snippet feeding, and image paste/drag-and-drop.

### 📚 Knowledge Wiki Agent (LLM-Wiki) & Vault-Level Skills

4. **Karpathy-Style LLM-Wiki Agent Built-in**
- Added the `wiki` agent skill (expanding built-in skills to 8), bringing automated personal knowledge base compilation, ingestion, and querying to Obsidian.
- Fast-action suggestion chips in drawer: one-click fill for `/wiki ingest`, `/wiki absorb 10`, `/wiki query <question>`, `/wiki status`, `/wiki cleanup`, and `/wiki breakdown`.
- Auto-syncing bundled script assets (`ingest.py`, `absorb.py`, `cleanup.py`, `breakdown.py`, `wiki_utils.py`) to the user vault with versioned upgrades.

5. **Vault-Level Skill Scope Isolation**
- Introduced `isVaultLevelSkill` classification to distinguish full-vault compilation skills from single-document skills.
- Multi-file explorer context menus automatically compute the common folder scope (`getCommonFolderScope`) and pass scanning pointers rather than dumping raw file contents, eliminating full-vault context bombs.

### 🛠️ Parser Engine Hardening & Defect Fixes

6. **Hardened YAML Block Scalar Parser**
- Fully supports YAML multi-line block scalars (`|`, `>`, `>-`, `|-`, etc.) in skill frontmatter.
- Properly preserves internal paragraph breaks for literal blocks (`|`) while folding single-spaced lines for folded blocks (`>`).
- Strict standalone delimiter matching prevents embedded `---` dividers within description blocks from prematurely cutting off frontmatter parsing.
- Guarantees zero field loss for regular key-value pairs following block scalar definitions.

7. **Safety Bounds & Test Coverage**
- Tightened `detectSkillFromPath` to match strictly against registered `s.filePath` boundaries, avoiding broad wildcard collisions with user notes.
- Added full `try...catch` lifecycle wraps in `startDrawerSession` to prevent `isExecuting` flags from locking the UI upon initial session failures.
- Duplicate file attachments in drawer now trigger friendly user notices (`file_already_added`).
- Expanded automated unit test suite to 375 tests across 26 test suites with 100% pass rate.

## v3.3:

### 🚀 Google Antigravity Provider & OAuth Integration

1. **Official Loopback + PKCE Authorization Flow**
- Deeply integrated official Google Antigravity OAuth architecture: desktop local loopback server (port 51121) + PKCE (S256) authorization code grant with automated browser callback capture.
- Graceful manual paste fallback modal for restricted port environments or systems unable to launch external browsers.
- Full catalog access to Google Antigravity models: `gemini-3-pro`, `gemini-3-flash`, and deep reasoning `claude-3-7-sonnet` models with structured category grouping.
- Shared `platform-fetch` network layer consolidating Electron and Node.js native streaming with mobile platform guards.

### 🌐 Native Web Access Subsystem (web_search & web_fetch)

2. **High-Performance Web Access with Zero New Dependencies**
- Added native `web_search` and `web_fetch` Agent tools for the Task Drawer and Skills with **zero new npm dependencies**, powered strictly by Obsidian native APIs and Node built-in modules.
- Multi-provider architecture with intelligent failover (Auto routing): out-of-the-box keyless DuckDuckGo, authoritative Chinese search via Bocha, professional factual agent search via Tavily, and clean markdown reader formatting via Jina.
- Strict enterprise-grade SSRF defense: blocks loopback addresses, private IP ranges, cloud metadata services (169.254.169.254), unsupported protocols (file/gopher/ftp), and DNS rebinding attacks.
- Intelligent content extractor (`extractor.ts`): leverages native `htmlToMarkdown` with heuristic DOM noise filtering to eliminate scripts, styles, and navigation clutter, saving model context tokens.

### 🎨 Unified Multi-Provider AI Image Generation Runtime

3. **Parallel ImagesModels Engine & Provider Ecosystem**
- Introduced `@earendil-works/pi-ai`'s parallel `ImagesModels` runtime, completely decoupling image generation from chat models with independent configuration and zero silent cross-provider fallbacks.
- Comprehensive support for three major image generation platforms:
  - **Google Antigravity**: high-fidelity image synthesis via `gemini-3-pro-image`, supporting 16:9, 1:1, 9:16 aspect ratios;
  - **OpenRouter Image Catalog**: built-in access to 52+ image models (Flux.2-flex, SDXL, Seedream, etc.) with dynamic catalog discovery and `aspect_ratio` forwarding;
  - **Custom OpenAI-compatible / SiliconFlow Endpoints**: dual protocol handling (`openai-images` and `siliconflow`), supporting both `b64_json` payloads and remote URL streaming download.
- Secure credential isolation: custom image API keys stored in `ObsidianCredentialStore` under `image-generation:custom` namespace, never serialized to plaintext settings.
- Cross-platform binary safety: `AgentTools` utilizes native `base64ToArrayBuffer` instead of Node `Buffer`, ensuring reliable image persistence across iOS, Android, and desktop.
- Inline settings UI: flattened `renderImageServiceSection` directly embedded in AI settings for intuitive provider switching and key management.

### 📝 Modernized WeChat Publishing Skills Suite

4. **Aligned 4 Core WeChat Skills to Native Tool Contracts**
- **Technology Writing (`wechat-tech-writer`)**: guarantees 16:9 cover image creation before drafting articles, streamlining the agent tool chain.
- **Knowledge Management Writing (`wechat-km-writer`)**: generates deep scenario-driven articles with automated dual-image generation (cover + architecture diagram).
- **Article Formatter (`wechat-article-formatter`)**: native Mode A conversion pipeline injecting elegant inline typography CSS, converting `![[...]]` embeds to responsive WeChat image containers, and formatting code blocks into Mac terminal styling.
- **Draft Publisher (`wechat-draft-publisher`)**: adheres to `$VAULT_PATH` path conventions, enforces zero AppSecret persistence in the vault, and publishes formatted articles directly to WeChat draft box with lightweight summary reports.

### 🌍 Comprehensive UI Internationalization & Presentation Decoupling

5. **Eliminated Hardcoded Strings & Mixed Languages**
- Purged all hardcoded Chinese UI text in the Copilot drawer, `AIAuthModal`, settings panels, and mindmap error handlers into `skills.drawer.*` and `ai.auth.*` locale keys.
- Decoupled human-facing UI presentation from agent routing prompts (`skill-i18n.ts`): all 15 built-in skills now feature refined, native titles and descriptions across English, Simplified Chinese, and Traditional Chinese, eliminating awkward frontmatter trigger keywords from user view.

### 🛡️ Agent Architecture Hardening & Memory Safety

6. **Metadata Scope Decoupling & Re-entrance Protection**
- Added frontmatter `scope: 'vault' | 'content'` specification, allowing `isVaultLevelSkill` to detect vault-level skills dynamically from metadata rather than hardcoded identifiers.
- Drawer re-entrance cleanup: explicitly destroys previous `DrawerFileSuggest` instances before re-rendering drawer layout, eliminating event listener leaks.
- Unit test suite expanded with all test files passing cleanly at 100%.

### 🧠 CodeBuddy Deep Reasoning & Multimodal Vision Hardening

7. **CodeBuddy Reasoning Effort Forwarding & Vision Capability Overhaul**
- **Dynamic Reasoning Compatibility Binding**: dynamically binds `compat.supportsReasoningEffort` to the model's upstream reasoning capability (`supportsReasoning`), fixing the critical bug where hardcoded `false` caused `@earendil-works/pi-ai` to strip `reasoning_effort` and restoring deep reasoning control for DeepSeek-R1, Hunyuan Reasoning, etc.
- **Strict Contract-Compliant Thinking Level Mapping**: adopts the native `ThinkingLevelMap` contract, traversing all standard Pi thinking levels (`PI_THINKING_LEVELS`) and explicitly marking unadvertised levels as `null`; sets `off: null` when `canDisableThinking === false` to eliminate invalid UI options that trigger upstream 400 errors.
- **Intelligent Reasoning Level Preselection**: derives the preferred default thinking effort directly from supported model capabilities (`thinkingLevelMap`, prioritizing `high`), eliminating invalid `thinkingLevelMap.default` assignments or data-plane leakage.
- **Unrestricted Multimodal Vision Input**: eliminated fragile regex ID whitelist matching, trusting upstream structured capabilities (`!m.disabledMultimodal && m.supportsImages !== false`) to ensure image attachments in mindmap insights and agent drawers pass through reliably on all compatible models.
- **Defensive Data Validation & Direct Network Payload Tests**: added strict `Array.isArray` array guards and payload sanitization for remote `supportedEfforts`; updated unit test suite with direct assertions on HTTP request payloads, all test suites passing cleanly.

