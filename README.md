# SuperMind - Enhanced Mind Map Plugin for Obsidian

<div align="center">

**A powerful, stable mind mapping plugin for Obsidian**

Interactive Editing • AI Smart Expansion • Multiple Export Formats • Enterprise-Grade Stability

[![Version](https://img.shields.io/badge/version-3.3-blue.svg)](CHANGELOG.md)
[![Platform](https://img.shields.io/badge/platform-Desktop%20%7C%20Mobile-green.svg)](#platform-support)

[中文文档](README_cn.md)

</div>

---

## ✨ Key Highlights

### 🎯 Complete Mind Mapping Experience
- **Native Obsidian Integration**: Seamlessly integrates into your Obsidian workflow
- **Bidirectional Markdown Sync**: Real-time conversion between mind maps and Markdown
- **13 Professional Themes**: Professional themes + dopamine color schemes for various scenarios
- **Rich Text Support**: Tables, Callouts, quotes, code blocks, embedded content

### 🤖 AI-Powered Enhancement
- **Unified AI Engine**: Powered by PiAI, supporting Google Antigravity, OpenAI, Anthropic, Gemini, Deepseek, CodeBuddy, OpenAI-compatible endpoints, and more
- **OAuth / API Key Sign-in**: Auth modal with two authorization modes, credentials stored securely; official Antigravity Loopback + PKCE authorization flow
- **Native Web Access Subsystem**: Zero-dependency `web_search` and `web_fetch` with SSRF protection and Auto routing (DuckDuckGo, Bocha, Tavily, Jina)
- **Multi-Provider AI Image Generation**: Independent `ImagesModels` runtime supporting Google Antigravity, OpenRouter (52+ image models), and OpenAI-compatible / SiliconFlow endpoints
- **WeChat Publishing Skills Suite**: Built-in tech writing, KM articles, typography formatting, and one-click draft box publishing
- **Universal AI Copilot**: Direct assistant invocation without pre-selecting skills, dynamically adapting as tools load skills
- **Skill Task Drawer**: Non-blocking docked drawer with collapsible floating bubble, multi-source context injection (selection feeding, 0-token `@` file mention), and multi-turn refinement
- **Karpathy Wiki Agent (`wiki`)**: Built-in full-vault knowledge compilation, note ingestion, and incremental absorption
- **Multimodal Vision**: Dynamic vision model resolution with automatic image attachment extraction from notes and mind maps
- **Pi Agent Tool Calling**: read / edit / write / find / grep / ls / bash / web_search / web_fetch / generate_image — AI directly reads/writes notes, searches the web, and generates illustrations
- **Native XMind Creator Skill**: Built-in 15 core skills, allowing AI to directly write `.xmind` files with boundaries, summaries, callouts, and relationships
- **Comprehensive Internationalization**: Task drawer, auth modal, settings, and all 15 built-in skills fully localized in English, Simplified Chinese, and Traditional Chinese
- **Smart Expansion**: One-click child node generation, deep analysis, content optimization
- **Insight System**: Flomo-like AI insights with multi-dimensional analysis, directly analyzing `.xmind` files alongside notes
- **Custom Prompts**: Fully customizable AI interactions

### 🏗️ Enterprise-Grade Stability
- **Unified Resource Management**: Centralized resource lifecycle control
- **Zero Memory Leaks**: Complete lifecycle management and automatic cleanup
- **Async Safety**: Prevents race conditions accessing destroyed objects
- **Optimized Performance**: Efficient rendering and memory usage

### 🎨 Rich Export Options
- **Image Export**: PNG, JPEG, SVG with watermarks and author info
- **Document Export**: Selected content export, 12 professional templates
- **XMind Integration**: Bidirectional conversion with XMind files (Desktop)

---

## 🚀 Core Features

### 1. Mind Map Editing

#### Interactive Editing
- ✅ Create and edit mind maps directly in Obsidian
- ✅ Support for drag-and-drop, hotkeys, context menu
- ✅ Real-time preview, WYSIWYG
- ✅ Complete undo/redo history

#### Layouts and Styles
- **4 Layout Directions**: Center, Right, Left, Clockwise
- **13 Themes**: 7 professional + 6 dopamine color schemes
- **Custom Color Groups**: Smart node connection color system
- **Responsive Canvas**: Auto-adapts to content size

#### Rich Text Rendering
| Content Type | Supported Features |
|-------------|-------------------|
| **Markdown Formatting** | Bold, italic, highlight, strikethrough, code |
| **Tables** | Full table rendering and editing |
| **Callouts** | Multiple Callout types, theme-adaptive |
| **Block Quotes** | Block quotes, text block display |
| **Code Blocks** | Syntax highlighting, rendered as child nodes |
| **Embedded Content** | Canvas, PDF++, Eagle, Excalidraw |
| **Internal Links** | Support for internal link navigation |
| **Footnotes** | Superscript rendering, content protection |
| **Task Lists** | Clickable checkboxes |

### 2. View Enhancements

#### Outline View
- Tree structure display
- Real-time search and quick navigation
- Expand/collapse support
- Synchronized scrolling with main view

#### Map Overview
- Thumbnail minimap
- Visual navigation
- Quick jump
- Real-time updates

#### Quick Settings
- One-click theme switching
- Adjust layout direction
- Modify color groups
- Background color picker

### 3. AI Features

#### Node AI Expansion (Plus Feature)
- **Generate Ideas**: AI brainstorming
- **Generate Analysis**: Deep content analysis
- **Detailed Expansion**: Refine node content
- **Practical Applications**: Practical scenario suggestions
- **Custom Prompts**: Fully customizable

#### Context Menu AI
- Popup with streaming output
- Support for editing and insertion
- Smart Callout type selection
- Regenerate and replace functionality

#### File AI Analysis
- Document analysis and summary
- Keyword extraction
- Streaming output to new file
- Custom save path

#### AI Insight System
- Multi-dimensional perspective analysis
- Customizable built-in perspectives
- Backlink expansion depth configuration
- Persistent data storage

#### AI Skills System (Plus Feature)
- Extensible AI workflows defined via SKILL.md, following the Agent Skills open standard
- Multiple output formats: markdown, mermaid, excalidraw, canvas, base, and native `.xmind` mind maps
- Built-in 7 core skills, including the new `xmind-creator` skill
- Auto-scans vault `skills/` folder to discover skills, loading them on demand via progressive disclosure
- ReAct agent tool loop for complex multi-step tasks
- Streaming output, real-time file writing; automatically embeds artifact wikilinks (`![[artifact]]`) into source notes
- Smart content extraction, strips AI explanatory text

#### Skill Task Drawer & Multi-Turn Refinement
- **Non-Blocking Drawer**: Operates smoothly without a blocking modal backdrop, allowing uninterrupted reading and editing
- **Multi-Turn Session Refinement**: `SkillAgentSession` retains context across follow-up prompts for iterative polishing
- **Collapsible Floating Bubble**: Minimize drawer into a bottom-right pill badge with a breathing pulse dot indicator
- **Real-Time Activity Feed**: Live visualization of tool executions (read/edit/write/bash), execution turns, and token usage
- **Artifact Card**: Detects the final deliverable and opens it in an Obsidian leaf with one click

#### Multimodal Vision & Link Resolution
- **Dynamic Vision Resolution**: Automatically verifies model vision capabilities across providers and custom endpoints
- **Rich Content Extraction**: `LinkResolver` parses wikilinks, block refs, and raster images (`![[image.png]]`, `[alt](url)`)
- **Multimodal AI Integration**: Selected text, mind map nodes, and multi-document insights automatically deliver images to vision models
- **Privacy Control**: Enable `blockImages` in settings to disable image uploading at any time

#### Pi Agent Tool Calling
- Built-in `read` / `edit` / `write` / `find` / `grep` / `ls` / `bash` tools
- `edit` performs batched targeted replacements instead of rewriting whole files
- `write` compiles Markdown directly into native binary `.xmind` mind maps
- `grep` / `find` regex search across the vault; multi-document insight retrieves on demand
- Physical truncation protection (`truncateOutput`) protects the context window
- Optional "Require Tool Confirmation" (`requireToolConfirmation`) setting before modifying files or executing bash

#### File & Folder Context Menu AI
- Multi-select files or right-click folders in the file list to launch AI insights directly
- Folder right-click batches both Markdown documents and `.xmind` files
- Direct in-memory extraction of `.xmind` outlines and images for AI analysis

#### Unified Save Path Management
- Three modes: custom path / vault root / source file directory
- Shared across all AI features
- Auto-creates directories when they don't exist

#### AI Stop Button
- Both AI Insight and Skills execution support interruption
- Mobile progress indicator integrates stop button
- Mind map node AI expansion also supports stopping

#### Plus Feature Licensing
- **Trial Period**: 7 days free trial for all Plus features
- **Licensing**: Obtain registration code through sponsorship
- **Scope**: Node AI expansion, context menu AI, file AI analysis
- **Free Features**: All other features remain unrestricted after trial

### 4. Export and Publishing

#### Image Export
```
Supported Formats: PNG, JPEG, SVG
Features:
- Adjustable image width
- Custom author info (avatar, name, extra text)
- Watermark settings (text/image, transparency, rotation)
- 12 professional templates
- Mobile share menu integration
```

#### Document Export
```
Features:
- Selected content export
- Full document export
- Card summary display
- Filename and date control
- Export preview modal
```

#### XMind Integration (Desktop)
- Markdown ↔ XMind conversion
- XMind file preview (thumbnails)
- Folder auto-sync
- Open XMind in tabs

### 5. Collapse State Persistence

- Uses `<!--c-->` comment markers
- Compatible with obsidian-workflowy-plugin
- Markdown view synchronization
- Auto-save state

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
- ✅ Touch operations
- ✅ Image export (share menu)
- ✅ Tab/Enter virtual buttons
- ⚠️ **Not Supported**: XMind conversion, file sync

---

## 📖 User Guide

### Quick Start

#### 1. Create Mind Map
```
Method 1: Ctrl+P → Search "Create new mind map"
Method 2: Right-click folder → "New mind map"
```

#### 2. Open Existing File
```
Method 1: Right-click Markdown file → "Open as mind map"
Method 2: Command palette → "Toggle markdown or mindmap mode"
```

### Keyboard Shortcuts

<details>
<summary><b>Node Operations</b></summary>

| Shortcut | Function |
|----------|----------|
| `Shift+F2` | Edit node |
| `Shift+Insert` | Insert child node |
| `Alt+Shift+Enter` | Add sibling node / End editing |
| `Shift+Delete` | Delete node and children |
| `Escape` | Cancel editing |
| `Alt+Shift+S` | Select node text |
| `Alt+Shift+D` | Move next siblings as children |
| `Alt+Ctrl+Shift+D` | Move all siblings as children |
| `Alt+Shift+J` | Join with node below |
| `Alt+Ctrl+Shift+J` | Join as citation with node below |

</details>

<details>
<summary><b>Node Movement</b></summary>

| Shortcut | Function |
|----------|----------|
| `Alt+Shift+↑` | Move node up |
| `Alt+Shift+↓` | Move node down |
| `Alt+Shift+←` | Move node left |
| `Alt+Shift+→` | Move node right |

</details>

<details>
<summary><b>Expand/Collapse</b></summary>

| Shortcut | Function |
|----------|----------|
| `Alt+↓` | Expand one level |
| `Alt+↑` | Collapse one level |
| `Alt+PageDown` | Expand one level from max displayed |
| `Alt+PageUp` | Collapse one level from max displayed |
| `Ctrl+Shift+Space` | Toggle expand/collapse |

</details>

<details>
<summary><b>Text Formatting</b></summary>

| Shortcut | Function |
|----------|----------|
| `Alt+Shift+B` | Bold |
| `Alt+Shift+I` | Italic |
| `Alt+Shift+H` | Highlight |
| `Alt+Shift+2` | Strikethrough |
| `Alt+Shift+L` | Remove line breaks |

</details>

<details>
<summary><b>Other Operations</b></summary>

| Shortcut | Function |
|----------|----------|
| `Alt+Shift+C` | Copy node |
| `Alt+Shift+V` | Paste node |
| `Alt+Shift+Z` | Undo |
| `Alt+Shift+Y` | Redo |
| `Alt+Ctrl+Shift+Z` | Replace with previous text |
| `Alt+E` | Center current node |
| `Alt+Shift+E` | Center entire map |
| `Ctrl++` / `Ctrl+Scroll↑` | Zoom in |
| `Ctrl+-` / `Ctrl+Scroll↓` | Zoom out |
| `Ctrl+0` | Reset zoom |

</details>

### AI Configuration

1. **Set Up AI Service**
   - Open plugin settings → AI Service Configuration
   - Select a provider (OpenAI, Anthropic, Gemini, Deepseek, CodeBuddy, etc.)
   - Authenticate via API Key or OAuth, then pick a model

2. **Use AI Expansion**
   - Click the 🧠 button on a node
   - Or `Ctrl+Double-click` the node
   - Select expansion method

3. **Custom Prompts**
   - Plugin settings → AI Custom Prompts
   - Use `{{nodeContent}}` placeholder
   - Takes effect immediately after saving

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
