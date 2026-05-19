# JSON Canvas Specification for Obsidian

Version 1.0 — 2024-03-11

## Overview

JSON Canvas is a format for representing infinite canvas documents. This specification defines the structure for creating canvas files compatible with Obsidian.

## Top Level Structure

The root JSON object contains two optional arrays:

```json
{
  "nodes": [...],
  "edges": [...]
}
```

- `nodes` (optional, array): All canvas objects (text, files, links, groups)
- `edges` (optional, array): All connections between nodes

## Node Types

### Common Attributes

All nodes share these required attributes:

- `id` (required, string): Unique identifier for the node
- `type` (required, string): Node type (`text`, `file`, `link`, `group`)
- `x` (required, integer): X position in pixels
- `y` (required, integer): Y position in pixels
- `width` (required, integer): Width in pixels
- `height` (required, integer): Height in pixels
- `color` (optional, string/number): Color (hex `"#FF0000"` or preset `"1"`)

### Text Nodes

Store plain text with Markdown formatting.

**Required Attributes:**
- `text` (string): Content in Markdown syntax

**Example:**
```json
{
  "id": "abc123",
  "type": "text",
  "x": 0,
  "y": 0,
  "width": 250,
  "height": 100,
  "text": "# Main Topic\n\nKey point here",
  "color": "4"
}
```

### File Nodes

Reference other files or attachments (images, PDFs, etc.).

**Required Attributes:**
- `file` (string): Path to file in the vault

**Optional Attributes:**
- `subpath` (string): Link to specific heading/block (starts with `#`)

**Example:**
```json
{
  "id": "def456",
  "type": "file",
  "x": 300,
  "y": 0,
  "width": 400,
  "height": 300,
  "file": "Images/diagram.png"
}
```

**With Subpath:**
```json
{
  "id": "ghi789",
  "type": "file",
  "x": 0,
  "y": 200,
  "width": 250,
  "height": 100,
  "file": "Notes/Meeting Notes.md",
  "subpath": "#Action Items"
}
```

### Link Nodes

Reference external URLs.

**Required Attributes:**
- `url` (string): Full URL including protocol

**Example:**
```json
{
  "id": "jkl012",
  "type": "link",
  "x": 0,
  "y": -200,
  "width": 250,
  "height": 100,
  "url": "https://obsidian.md",
  "color": "5"
}
```

### Group Nodes

Visual containers for organizing related nodes.

**Optional Attributes:**
- `label` (string): Text label for the group (recommended)
- `background` (string): Path to background image
- `backgroundStyle` (string): Image rendering style
  - `cover`: Fill entire node
  - `ratio`: Maintain aspect ratio
  - `repeat`: Tile as pattern

**Example:**
```json
{
  "id": "group1",
  "type": "group",
  "x": -50,
  "y": -50,
  "width": 600,
  "height": 400,
  "label": "Main Concepts",
  "color": "4"
}
```

**With Background:**
```json
{
  "id": "group2",
  "type": "group",
  "x": 700,
  "y": 0,
  "width": 500,
  "height": 600,
  "label": "Reference Materials",
  "background": "Images/texture.png",
  "backgroundStyle": "repeat"
}
```

## Z-Index and Layering

Nodes are displayed in array order:
- **First node**: Bottom layer (rendered below others)
- **Last node**: Top layer (rendered above others)

**Best Practice Order:**
1. Group nodes (backgrounds)
2. Sub-groups
3. Regular nodes (text, file, link)

This ensures groups appear behind content.

## Edges (Connections)

Edges connect nodes with lines.

**Required Attributes:**
- `id` (required, string): Unique identifier
- `fromNode` (required, string): Starting node ID
- `toNode` (required, string): Ending node ID

**Optional Attributes:**
- `fromSide` (string): Starting edge side
  - Values: `top`, `right`, `bottom`, `left`
- `fromEnd` (string): Start endpoint shape
  - Values: `none` (default), `arrow`
- `toSide` (string): Ending edge side
  - Values: `top`, `right`, `bottom`, `left`
- `toEnd` (string): End endpoint shape
  - Values: `arrow` (default), `none`
- `color` (string/number): Edge color
- `label` (string): Text label on edge

**Example - Simple Connection:**
```json
{
  "id": "edge1",
  "fromNode": "abc123",
  "toNode": "def456"
}
```

**Example - Fully Specified:**
```json
{
  "id": "edge2",
  "fromNode": "def456",
  "fromSide": "bottom",
  "fromEnd": "none",
  "toNode": "ghi789",
  "toSide": "top",
  "toEnd": "arrow",
  "color": "3",
  "label": "leads to"
}
```

## Color System

### Preset Colors

Use string numbers `"1"` through `"6"`:

- `"1"` - Red
- `"2"` - Orange
- `"3"` - Yellow
- `"4"` - Green
- `"5"` - Cyan
- `"6"` - Purple

**Note:** Exact colors adapt to Obsidian's theme. These provide semantic meaning across light/dark modes.

### Custom Hex Colors

Use hex format: `"#RRGGBB"`

**Examples:**
- `"#4A90E2"` (blue)
- `"#50E3C2"` (teal)
- `"#F5A623"` (orange)

**Best Practice:** Use consistent format within a canvas (all hex OR all presets).

## Complete Example

```json
{
  "nodes": [
    {
      "id": "group001",
      "type": "group",
      "x": -50,
      "y": -50,
      "width": 700,
      "height": 500,
      "label": "Core Concepts",
      "color": "4"
    },
    {
      "id": "center01",
      "type": "text",
      "x": 0,
      "y": 0,
      "width": 300,
      "height": 120,
      "text": "# Central Topic\n\nMain idea here",
      "color": "4"
    },
    {
      "id": "branch01",
      "type": "text",
      "x": 400,
      "y": -100,
      "width": 220,
      "height": 100,
      "text": "Subtopic A",
      "color": "5"
    },
    {
      "id": "branch02",
      "type": "text",
      "x": 400,
      "y": 100,
      "width": 220,
      "height": 100,
      "text": "Subtopic B",
      "color": "5"
    },
    {
      "id": "detail01",
      "type": "text",
      "x": 700,
      "y": -100,
      "width": 200,
      "height": 80,
      "text": "Detail 1",
      "color": "6"
    }
  ],
  "edges": [
    {
      "id": "e1",
      "fromNode": "center01",
      "fromSide": "right",
      "toNode": "branch01",
      "toSide": "left",
      "toEnd": "arrow"
    },
    {
      "id": "e2",
      "fromNode": "center01",
      "fromSide": "right",
      "toNode": "branch02",
      "toSide": "left",
      "toEnd": "arrow"
    },
    {
      "id": "e3",
      "fromNode": "branch01",
      "fromSide": "right",
      "toNode": "detail01",
      "toSide": "left",
      "toEnd": "arrow",
      "color": "3"
    }
  ]
}
```

## Validation Requirements

When creating canvas files, ensure:

1. **Unique IDs**: All `id` values must be unique across nodes and edges
2. **Valid References**: All edge `fromNode` and `toNode` must reference existing node IDs
3. **Required Fields**: All required attributes are present for each type
4. **Valid Coordinates**: All position/dimension values are integers
5. **Color Format**: Colors use either hex (`"#RRGGBB"`) or preset strings (`"1"` to `"6"`)
6. **Quote Escaping**: Special characters properly escaped in JSON strings

## Common Issues and Solutions

### Issue: Canvas won't open in Obsidian
**Solutions:**
- Validate JSON syntax (use JSON validator)
- Check all IDs are unique
- Verify all edge references exist
- Ensure required fields present

### Issue: Nodes appear overlapped
**Solutions:**
- Increase spacing between coordinates
- Account for node dimensions in positioning
- Use minimum spacing: 320px horizontal, 200px vertical

### Issue: Groups don't show properly
**Solutions:**
- Ensure groups appear before content nodes in array
- Add explicit `label` to all groups
- Check group dimensions encompass child nodes

### Issue: Colors don't match expectations
**Solutions:**
- Use consistent color format (all hex OR all presets)
- Remember presets adapt to theme
- Test in both light and dark mode if using custom colors

### Issue: Text appears truncated
**Solutions:**
- Increase node dimensions
- Break long text into multiple nodes
- Use file nodes for lengthy content

## Character Encoding for Chinese Content

When canvas contains Chinese text, apply these transformations:

- Chinese double quotes `"` → `『』`
- Chinese single quotes `'` → `「」`
- English double quotes must be escaped: `\"`

**Example:**
```json
{
  "text": "『核心概念』包含:「子概念A」和「子概念B」"
}
```

This prevents JSON parsing errors with mixed-language content.

## Performance Considerations

- **Large Canvases**: Keep node count reasonable (<500 for smooth performance)
- **Image Files**: Use compressed images for backgrounds
- **Text Length**: Keep node text concise; use file nodes for long content
- **Edge Complexity**: Minimize crossing edges for clarity

## Future Extensions

This specification may be extended with:
- Additional node types
- More edge styling options
- Animation properties
- Interactive behaviors

Always check Obsidian documentation for latest Canvas features.
