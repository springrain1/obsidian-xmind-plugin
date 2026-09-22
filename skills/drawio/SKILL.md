---
name: drawio
description: |
  Create and edit draw.io diagrams with real-time browser preview using @next-ai-drawio/mcp-server.

  Trigger when user asks to:
  - Create flowcharts, process diagrams, or workflow visualizations
  - Generate system architecture diagrams or component diagrams
  - Visualize code structure, microservices, or deployment architecture
  - Edit or modify existing draw.io diagrams
  - Export diagrams to .drawio files AND .svg previews (Obsidian compatible)

  Keywords: diagram, flowchart, architecture, draw.io, drawio, visualization, UML, sequence diagram, component diagram
---

# Draw.io Diagram Skill

Create and edit professional diagrams with real-time browser preview.

## MCP Server

This skill uses `@next-ai-drawio/mcp-server`. The `.mcp.json` in this skill directory configures it automatically.

**Manual installation (if needed):**
```bash
claude mcp add drawio -- npx @next-ai-drawio/mcp-server@latest
```

## Quick Start

```
1. start_session           → Open browser preview
2. display_diagram(xml)    → Create new diagram
3. get_diagram + edit      → Modify existing
4. export_diagram(path)    → Save to file
```

## MCP Tools Reference

| Tool | Parameters | Purpose |
|------|------------|---------|
| `start_session` | none | Open browser for real-time preview |
| `display_diagram` | `xml: string` | Create new diagram (replaces existing) |
| `get_diagram` | none | Get current diagram XML |
| `edit_diagram` | `operations: array` | Modify diagram by cell ID |
| `export_diagram` | `path: string` | Save as .drawio file |

## Workflow

### Creating New Diagram

```
1. Call start_session
2. Build mxfile XML with shapes and connections
3. Call display_diagram with XML
4. Iterate based on user feedback
5. Call export_diagram (e.g., "docs/arch.drawio")
6. MUST Run: python "<skill_path>/scripts/drawio_to_svg.py" "<diagram_path>"
   (IMPORTANT: Use quotes and forward slashes '/' for paths)
```

### Editing Existing Diagram

```
1. Call get_diagram (required within 30s before edit)
2. Parse XML to find cell IDs
3. Call edit_diagram with operations array
4. Call export_diagram to save changes
5. MUST Run: python "<skill_path>/scripts/drawio_to_svg.py" "<diagram_path>"
```

**edit_diagram operations format:**
```json
{
  "operations": [
    {"operation": "add", "cell_id": "new-id", "new_xml": "<mxCell .../>"},
    {"operation": "update", "cell_id": "existing-id", "new_xml": "<mxCell .../>"},
    {"operation": "delete", "cell_id": "remove-id"}
  ]
}
```

## XML Structure

Basic template:
```xml
<mxfile host="app.diagrams.net">
  <diagram name="Diagram" id="diagram-1">
    <mxGraphModel dx="1422" dy="794" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="827" pageHeight="1169">
      <root>
        <mxCell id="0"/>
        <mxCell id="1" parent="0"/>
        <!-- Add shapes and edges here, starting from id="2" -->
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
```

**Critical Rules:**
- IDs 0 and 1 are reserved (root cells)
- Visual elements start from ID 2+
- All shapes need `vertex="1"` and `<mxGeometry>`
- All edges need `edge="1"` with `source` and `target`

## Common Patterns

### Rectangle Shape
```xml
<mxCell id="2" value="Label" style="rounded=0;whiteSpace=wrap;html=1;" vertex="1" parent="1">
  <mxGeometry x="100" y="100" width="120" height="60" as="geometry"/>
</mxCell>
```

### Rounded Rectangle
```xml
<mxCell id="3" value="Label" style="rounded=1;whiteSpace=wrap;html=1;" vertex="1" parent="1">
  <mxGeometry x="100" y="200" width="120" height="60" as="geometry"/>
</mxCell>
```

### Arrow Connection
```xml
<mxCell id="4" style="edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;endArrow=classic;" edge="1" parent="1" source="2" target="3">
  <mxGeometry relative="1" as="geometry"/>
</mxCell>
```

### Decision Diamond
```xml
<mxCell id="5" value="Condition?" style="rhombus;whiteSpace=wrap;html=1;" vertex="1" parent="1">
  <mxGeometry x="100" y="300" width="80" height="80" as="geometry"/>
</mxCell>
```

## SVG Export

The MCP server only exports `.drawio` files. To get an **editable SVG** (viewable as image AND re-editable in Draw.io), use the included Python converter:

### Usage

> **Platform Note**: Use **forward slashes** `/` and **double quotes** `"` for paths on ALL platforms (including Windows) to ensure command stability.

```bash
# Convert .drawio to .svg (Use QUOTES + FORWARD SLASHES)
python "<path_to_skill>/scripts/drawio_to_svg.py" "<path_to_diagram>/diagram.drawio"

# Example:
python "/Users/me/skills/drawio/scripts/drawio_to_svg.py" "/Users/me/docs/arch.drawio"
```

### How It Works

The converter:
1. Parses `mxGraphModel` XML from the `.drawio` file
2. Renders shapes (rectangles, ellipses, diamonds, etc.) to SVG elements
3. Renders text labels using `<foreignObject>`
4. Embeds the original `mxGraphModel` in the SVG's `content` attribute (HTML-escaped)

This produces an SVG that:
- ✅ Can be viewed in browsers, Markdown, etc.
- ✅ Can be re-opened and edited in Draw.io

### Supported Shapes

| Shape | Style Key | SVG Element |
|-------|-----------|-------------|
| Rectangle | (default) | `<rect>` |
| Rounded Rectangle | `rounded=1` | `<rect rx="...">` |
| Ellipse/Circle | `ellipse` | `<ellipse>` |
| Diamond | `rhombus` | `<polygon>` |
| Triangle | `triangle` | `<polygon>` |
| Connections | `edge=1` | `<line>` with arrow markers |

### Workflow Integration

After exporting with `export_diagram`:
```
1. export_diagram("path/to/diagram.drawio")
2. Run: python scripts/drawio_to_svg.py path/to/diagram.drawio
3. Result: path/to/diagram.svg (editable SVG)
```

## References

- **XML Format Details**: See [references/xml-format.md](references/xml-format.md) for complete style reference
- **Diagram Patterns**: See [references/diagram-patterns.md](references/diagram-patterns.md) for flowchart and architecture templates
