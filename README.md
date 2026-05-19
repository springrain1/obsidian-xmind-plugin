# SuperMind - Enhanced Mind Map Plugin for Obsidian

<div align="center">

**A powerful, stable mind mapping plugin for Obsidian**

Interactive Editing • AI Smart Expansion • Multiple Export Formats • Enterprise-Grade Stability

[![Version](https://img.shields.io/badge/version-2.5-blue.svg)](CHANGELOG.md)
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
- **Multiple AI Services**: OpenAI, Anthropic, Gemini, Deepseek, Ollama
- **Smart Expansion**: One-click child node generation, deep analysis, content optimization
- **Insight System**: Flomo-like AI insights with multi-dimensional analysis
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
- Extensible AI workflows defined via SKILL.md
- Multiple output formats: markdown, mermaid, excalidraw, canvas, base
- Auto-scans vault `skills/` folder to discover skills
- Streaming output, real-time file writing
- Smart content extraction, strips AI explanatory text

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
   - Select provider (OpenAI, Gemini, Deepseek, etc.)
   - Enter API Key and model name

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

### v2.5 - Settings Page Redesign
- ✨ Two-level tab navigation layout for settings (General/AI/License), no more endless scrolling
- ✨ Dopamine purple gradient navigation bar, light/dark theme compatible
- ✨ Lazy-loaded tab content panels with tab state memory
- 🐛 Fixed BASE view AI Insight unable to retrieve filtered documents (adapted to Obsidian's updated DOM structure)
- 🐛 Fixed AI sub-tab spacing inconsistency, missing Plus feature description in license panel

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
