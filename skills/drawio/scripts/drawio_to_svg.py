#!/usr/bin/env python3
"""
Draw.io to Editable SVG Converter

Converts .drawio files (mxGraphModel XML) to editable SVG format.
The resulting SVG can be viewed as an image AND re-opened in Draw.io for editing.

Usage:
    python drawio_to_svg.py input.drawio output.svg
    python drawio_to_svg.py input.drawio  # outputs to input.svg
"""

import sys
import re
import html
import xml.etree.ElementTree as ET
from pathlib import Path
from dataclasses import dataclass
from typing import Optional, Tuple, List
import base64
import zlib


@dataclass
class BoundingBox:
    """Represents the bounding box of all elements."""
    min_x: float = float('inf')
    min_y: float = float('inf')
    max_x: float = float('-inf')
    max_y: float = float('-inf')
    
    def expand(self, x: float, y: float, width: float, height: float):
        self.min_x = min(self.min_x, x)
        self.min_y = min(self.min_y, y)
        self.max_x = max(self.max_x, x + width)
        self.max_y = max(self.max_y, y + height)
    
    @property
    def width(self) -> float:
        return self.max_x - self.min_x if self.max_x > self.min_x else 0
    
    @property
    def height(self) -> float:
        return self.max_y - self.min_y if self.max_y > self.min_y else 0


def parse_style(style_str: str) -> dict:
    """Parse mxCell style string into a dictionary."""
    if not style_str:
        return {}
    
    styles = {}
    for part in style_str.split(';'):
        part = part.strip()
        if not part:
            continue
        if '=' in part:
            key, value = part.split('=', 1)
            styles[key] = value
        else:
            # Style without value (like 'ellipse', 'rhombus')
            styles[part] = True
    return styles


def get_color(style: dict, key: str, default: str = 'rgb(255, 255, 255)') -> str:
    """Extract color from style, converting hex to rgb if needed."""
    color = style.get(key, default)
    if color == 'none':
        return 'none'
    if color and color.startswith('#'):
        # Convert hex to rgb
        hex_color = color.lstrip('#')
        if len(hex_color) == 6:
            r, g, b = int(hex_color[0:2], 16), int(hex_color[2:4], 16), int(hex_color[4:6], 16)
            return f'rgb({r}, {g}, {b})'
    return color if color else default


def decode_diagram_content(encoded: str) -> str:
    """Decode base64+deflate encoded diagram content."""
    try:
        # URL decode, base64 decode, then inflate
        import urllib.parse
        decoded = urllib.parse.unquote(encoded)
        decoded_bytes = base64.b64decode(decoded)
        # Try to decompress (Draw.io uses deflate)
        decompressed = zlib.decompress(decoded_bytes, -zlib.MAX_WBITS)
        return decompressed.decode('utf-8')
    except Exception:
        # If it fails, assume it's already plain XML
        return encoded


def extract_mxgraph_model(drawio_content: str) -> Tuple[str, ET.Element]:
    """Extract the mxGraphModel from drawio content."""
    root = ET.fromstring(drawio_content)
    
    # Handle mxfile wrapper
    if root.tag == 'mxfile':
        diagram = root.find('.//diagram')
        if diagram is not None:
            # Check if content is encoded
            diagram_text = diagram.text
            if diagram_text and diagram_text.strip():
                # Encoded content
                decoded = decode_diagram_content(diagram_text.strip())
                mxgraph = ET.fromstring(decoded)
            else:
                # Direct mxGraphModel child
                mxgraph = diagram.find('mxGraphModel')
        else:
            raise ValueError("No diagram found in mxfile")
    elif root.tag == 'mxGraphModel':
        mxgraph = root
    else:
        raise ValueError(f"Unknown root element: {root.tag}")
    
    # Convert back to string for embedding
    mxgraph_str = ET.tostring(mxgraph, encoding='unicode')
    
    # NEW: Squash the XML to a single line to avoid breaking the SVG 'content' attribute
    mxgraph_str = re.sub(r'>\s+<', '><', mxgraph_str)
    mxgraph_str = mxgraph_str.replace('\n', '').replace('\r', '')
    
    return mxgraph_str, mxgraph

    return mxgraph_str, mxgraph


def get_global_position(cell: ET.Element, cells_by_id: dict) -> Tuple[float, float]:
    """Recursively calculate the absolute position of a cell by adding parent offsets."""
    x = 0.0
    y = 0.0
    
    current = cell
    while True:
        geom = current.find('mxGeometry')
        if geom is not None:
             # Add strictly relative coordinates
             # Note: logic can be complex for relative='1', here we assume standard group nesting
             if current != cell: # Don't add width/height of parent, just x/y
                 pass 
             
             x += float(geom.get('x', 0))
             y += float(geom.get('y', 0))
        
        parent_id = current.get('parent')
        if not parent_id or parent_id == '1' or parent_id == '0' or parent_id not in cells_by_id:
            break
            
        current = cells_by_id[parent_id]
        
    return x, y


    return color if color else default


def get_stroke_style(style: dict) -> str:
    """Generate SVG stroke-dasharray for dashed lines."""
    if style.get('dashed') == '1':
        # Draw.io default dash is usually small
        return ' stroke-dasharray="3 3"'
    return ''


ARROW_PATHS = {
    'classic': 'M0,0 L0,6 L9,3 z',
    'block': 'M0,0 L0,6 L9,3 L0,0 z',
    'open': 'M0,0 L9,3 L0,6',
    'oval': 'M0,3 A3,3 0 1,1 0,2.99 z',
    'diamond': 'M0,3 L4.5,6 L9,3 L4.5,0 z',
    'none': ''
}

def render_shape(cell: ET.Element, style: dict, geom: ET.Element, cells_by_id: dict, bbox: BoundingBox, offset_x: float, offset_y: float) -> str:
    """Render a single shape to SVG."""
    # Use global coordinates
    x, y = get_global_position(cell, cells_by_id)
    x -= offset_x
    y -= offset_y
    
    width = float(geom.get('width', 0))
    height = float(geom.get('height', 0))
    
    fill = get_color(style, 'fillColor', 'rgb(255, 255, 255)')
    stroke = get_color(style, 'strokeColor', 'rgb(0, 0, 0)')
    stroke_width = style.get('strokeWidth', '1')
    stroke_style = get_stroke_style(style)
    
    value = cell.get('value', '')
    svg_parts = []
    
    # Determine shape type and render
    if style.get('ellipse'):
        cx = x + width / 2
        cy = y + height / 2
        rx = width / 2
        ry = height / 2
        svg_parts.append(
            f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" '
            f'fill="{fill}" stroke="{stroke}" stroke-width="{stroke_width}"{stroke_style} pointer-events="none"/>'
        )
    elif style.get('rhombus'):
        # Diamond shape
        cx, cy = x + width / 2, y + height / 2
        points = f"{cx},{y} {x + width},{cy} {cx},{y + height} {x},{cy}"
        svg_parts.append(
            f'<polygon points="{points}" fill="{fill}" stroke="{stroke}" '
            f'stroke-width="{stroke_width}"{stroke_style} pointer-events="none"/>'
        )
    elif style.get('triangle'):
        # Triangle pointing right
        points = f"{x},{y} {x + width},{y + height / 2} {x},{y + height}"
        svg_parts.append(
            f'<polygon points="{points}" fill="{fill}" stroke="{stroke}" '
            f'stroke-width="{stroke_width}"{stroke_style} pointer-events="none"/>'
        )
    else:
        # Rectangle (default)
        rounded = style.get('rounded', '0')
        rx = min(width, height) * 0.1 if rounded == '1' else 0
        svg_parts.append(
            f'<rect x="{x}" y="{y}" width="{width}" height="{height}" rx="{rx}" '
            f'fill="{fill}" stroke="{stroke}" stroke-width="{stroke_width}"{stroke_style} pointer-events="none"/>'
        )
    
    # Render text label if present
    if value:
        # Use foreignObject for HTML text rendering
        font_size = style.get('fontSize', '12')
        font_color = get_color(style, 'fontColor', 'rgb(0, 0, 0)')
        font_family = style.get('fontFamily', 'Helvetica')
        font_weight = 'bold' if style.get('fontStyle') == '1' else 'normal'
        
        svg_parts.append(f'''<g><foreignObject pointer-events="none" width="100%" height="100%" style="overflow: visible; text-align: left;">
<div xmlns="http://www.w3.org/1999/xhtml" style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: {width - 2}px; height: 1px; padding-top: {y + height / 2}px; margin-left: {x + 1}px;">
<div data-drawio-colors="color: {font_color}; " style="box-sizing: border-box; font-size: 0px; text-align: center;">
<div style="display: inline-block; font-size: {font_size}px; font-family: {font_family}; color: {font_color}; line-height: 1.2; pointer-events: none; font-weight: {font_weight}; white-space: normal; overflow-wrap: normal;">{html.escape(value)}</div>
</div></div></foreignObject></g>''')
    
    return '\n'.join(svg_parts)


def get_connection_position(cell: ET.Element, geom: ET.Element, ref_x: float, ref_y: float, is_source: bool, style: dict, cells_by_id: dict) -> Tuple[float, float]:
    """
    Calculate connection point on a node using global coordinates.
    Prioritizes explicit entry/exit points, then closest boundary point, falling back to center.
    """
    # Cell geometry with global coordinates
    x, y = get_global_position(cell, cells_by_id)
    w = float(geom.get('width', 0))
    h = float(geom.get('height', 0))
    
    # Try to get explicit anchor from style
    # entryX/Y, exitX/Y usually range 0..1
    prefix = 'exit' if is_source else 'entry'
    if f'{prefix}X' in style and f'{prefix}Y' in style:
        try:
            px = float(style[f'{prefix}X'])
            py = float(style[f'{prefix}Y'])
            return x + px * w, y + py * h
        except ValueError:
            pass
            
    # Simple logic: Center point
    cx = x + w / 2
    cy = y + h / 2
    
    # If we have a reference point (the other end of the line), assume standard NSEW anchors
    # This is a simplification. A full implementation needs proper intersection logic.
    dx = ref_x - cx
    dy = ref_y - cy
    
    if abs(dx) > abs(dy):
        # Left or Right
        return (x + w if dx > 0 else x), cy
    else:
        # Top or Bottom
        return cx, (y + h if dy > 0 else y)


def render_edge(cell: ET.Element, style: dict, geom: ET.Element, cells_by_id: dict, offset_x: float, offset_y: float) -> str:
    """Render an edge with support for waypoints (polylines)."""
    source_id = cell.get('source')
    target_id = cell.get('target')
    
    points = []
    
    # Pre-fetch geometry for routing
    source_cell = cells_by_id.get(source_id)
    target_cell = cells_by_id.get(target_id)
    source_geom = source_cell.find('mxGeometry') if source_cell is not None else None
    target_geom = target_cell.find('mxGeometry') if target_cell is not None else None

    # Check for intermediate waypoints
    array_points = geom.find(".//Array[@as='points']")
    if array_points is not None:
        for pt in array_points.findall('mxPoint'):
            points.append((float(pt.get('x', 0)), float(pt.get('y', 0))))
            
    # If no waypoints and orthogonal style, try to auto-route
    # BUT explicitly skip if it's a curved line (curved=1), as straight-line fallback looks better than wrong orthogonal
    is_curved = style.get('curved') == '1'
    if len(points) == 0 and 'orthogonalEdgeStyle' in style.get('edgeStyle', '') and not is_curved:
        # We need geometry of source and target to decide routing
        if source_geom is not None and target_geom is not None:
            # Re-calculate simple centers for routing logic using GLOBAL coordinates
            sx_abs, sy_abs = get_global_position(source_cell, cells_by_id)
            tx_abs, ty_abs = get_global_position(target_cell, cells_by_id)
            
            w_src, h_src = float(source_geom.get('width', 0)), float(source_geom.get('height', 0))
            w_tgt, h_tgt = float(target_geom.get('width', 0)), float(target_geom.get('height', 0))
            
            sx_c = sx_abs + w_src/2
            sy_c = sy_abs + h_src/2
            tx_c = tx_abs + w_tgt/2
            ty_c = ty_abs + h_tgt/2
            
            # Simple heuristic: vertical flow is dominant
            # If target is below source
            if ty_c > sy_c + h_src/2 + h_tgt/2:
                # Vertical Gap
                mid_y = (sy_abs + h_src + ty_abs) / 2
                points.append((sx_c, mid_y))
                points.append((tx_c, mid_y))
            # If target is right of source
            elif tx_c > sx_c + w_src/2 + w_tgt/2:
                 # Horizontal Gap
                 mid_x = (sx_abs + w_src + tx_abs) / 2
                 points.append((mid_x, sy_c))
                 points.append((mid_x, ty_c))

    # Resolve Source Point
    sx, sy = 0, 0
    if source_id and source_id in cells_by_id:
        src = cells_by_id[source_id]
        src_geom = src.find('mxGeometry')
        if src_geom is not None:
            # Determine reference point for calculation (first waypoint or target center)
            ref_x, ref_y = 0, 0
            if points:
                ref_x, ref_y = points[0]
            elif target_id and target_id in cells_by_id:
                tgt = cells_by_id[target_id]
                tgt_geom = tgt.find('mxGeometry')
                if tgt_geom is not None:
                     # Use global pos for target ref
                    tx_ref, ty_ref = get_global_position(tgt, cells_by_id)
                    ref_x = tx_ref + float(tgt_geom.get('width', 0))/2
                    ref_y = ty_ref + float(tgt_geom.get('height', 0))/2
            
            sx, sy = get_connection_position(src, src_geom, ref_x, ref_y, True, style, cells_by_id)
            points.insert(0, (sx, sy))
            
    elif geom.find('mxPoint[@as="sourcePoint"]'):
        # Floating source
        pt = geom.find('mxPoint[@as="sourcePoint"]')
        sx, sy = float(pt.get('x', 0)), float(pt.get('y', 0))
        points.insert(0, (sx, sy))

    # Resolve Target Point
    tx, ty = 0, 0
    if target_id and target_id in cells_by_id:
        tgt = cells_by_id[target_id]
        tgt_geom = tgt.find('mxGeometry')
        if tgt_geom is not None:
             # Reference is last waypoint or source
            ref_x, ref_y = 0, 0
            if len(points) > 1: # Has waypoints or source added
                ref_x, ref_y = points[-2]
            
            tx, ty = get_connection_position(tgt, tgt_geom, ref_x, ref_y, False, style, cells_by_id)
            points.append((tx, ty))
            
    elif geom.find('mxPoint[@as="targetPoint"]'):
        # Floating target
        pt = geom.find('mxPoint[@as="targetPoint"]')
        tx, ty = float(pt.get('x', 0)), float(pt.get('y', 0))
        points.append((tx, ty))

    if len(points) < 2:
        return ''

    # Filter out duplicate points (happens if waypoints align perfectly with anchors)
    unique_points = []
    if points:
        unique_points.append(points[0])
        for i in range(1, len(points)):
            if abs(points[i][0] - points[i-1][0]) > 0.1 or abs(points[i][1] - points[i-1][1]) > 0.1:
                unique_points.append(points[i])
    points = unique_points
    
    # Apply Offset to all points
    svg_points = " ".join([f"{x - offset_x},{y - offset_y}" for x, y in points])
    
    stroke = get_color(style, 'strokeColor', 'rgb(0, 0, 0)')
    stroke_width = style.get('strokeWidth', '1')
    stroke_style = get_stroke_style(style)
    
    # Markers
    markers_def = ''
    marker_start_ref = ''
    marker_end_ref = ''
    
    # Start Arrow
    start_arrow = style.get('startArrow', 'none')
    if start_arrow != 'none' and start_arrow in ARROW_PATHS:
        marker_id = f"start_{cell.get('id', 'edge')}"
        # Start marker needs to point LEFT (backwards along the line) or be rotated
        # Simplest approach for 'auto' orient at start is a shape pointing LEFT with refX at the tip
        # Standard paths in ARROW_PATHS align to RIGHT.
        # We'll stick to a simple mapping for classic/block for now, defaulting others to a simple block
        
        path_d = 'M9,0 L9,6 L0,3 z' # Default left-pointing triangle
        if start_arrow == 'classic': path_d = 'M9,0 L9,6 L0,3 z' 
        elif start_arrow == 'block': path_d = 'M9,0 L9,6 L0,3 L9,0 z'
        elif start_arrow == 'open': path_d = 'M9,0 L0,3 L9,6'
        elif start_arrow == 'oval': path_d = 'M6,3 A3,3 0 1,1 6,2.99 z' # Circle centered at 3,3? No width is 6. Center at 3,3.
        elif start_arrow == 'diamond': path_d = 'M9,3 L4.5,6 L0,3 L4.5,0 z'
        
        markers_def += f'''<defs><marker id="{marker_id}" markerWidth="10" markerHeight="10" refX="0" refY="3" orient="auto" markerUnits="strokeWidth">
<path d="{path_d}" fill="{stroke}" stroke="{stroke}"/></marker></defs>'''
        marker_start_ref = f' marker-start="url(#{marker_id})"'

    # End Arrow
    # Draw.io often defaults to 'classic' arrow for edges even if not strictly specified in style string
    # So we change default from 'none' to 'classic', unless explicitly set to 'none'
    end_arrow = style.get('endArrow', 'classic')
    
    if end_arrow != 'none':
        marker_id = f"end_{cell.get('id', 'edge')}"
        # Use definitions from ARROW_PATHS (pointing RIGHT)
        path_d = ARROW_PATHS.get(end_arrow, ARROW_PATHS['classic'])
        
        # RefX should be at the tip (right side) for end markers
        ref_x = '9'
        if end_arrow == 'oval': ref_x = '0' # Oval connects at left edge
        if end_arrow == 'diamond': ref_x = '0' # Diamond connects at left edge? No, standard diamond is centered.
        # Actually Draw.io SVG output is complex. For this script, refX=9 (tip) works for classic/block.
        
        markers_def += f'''<defs><marker id="{marker_id}" markerWidth="10" markerHeight="10" refX="{ref_x}" refY="3" orient="auto" markerUnits="strokeWidth">
<path d="{path_d}" fill="{stroke}" stroke="{stroke}"/></marker></defs>'''
        marker_end_ref = f' marker-end="url(#{marker_id})"'
    
    return f'{markers_def}<polyline points="{svg_points}" fill="none" stroke="{stroke}" stroke-width="{stroke_width}"{stroke_style}{marker_start_ref}{marker_end_ref} pointer-events="none"/>'


def convert_drawio_to_svg(drawio_content: str) -> str:
    """Convert Draw.io XML content to editable SVG."""
    mxgraph_str, mxgraph = extract_mxgraph_model(drawio_content)
    
    root_elem = mxgraph.find('.//root')
    if root_elem is None:
        raise ValueError("No root element found in mxGraphModel")
    
    cells = root_elem.findall('mxCell')
    
    # Build a map of cells by ID
    cells_by_id = {cell.get('id'): cell for cell in cells}
    
    # Calculate bounding box
    bbox = BoundingBox()
    for cell in cells:
        geom = cell.find('mxGeometry')
        if geom is not None and cell.get('vertex') == '1':
            x, y = get_global_position(cell, cells_by_id)
            width = float(geom.get('width', 0))
            height = float(geom.get('height', 0))
            bbox.expand(x, y, width, height)
    
    # Add padding
    padding = 10
    offset_x = bbox.min_x - padding
    offset_y = bbox.min_y - padding
    svg_width = bbox.width + padding * 2
    svg_height = bbox.height + padding * 2
    
    # Render shapes and edges
    svg_elements = []
    
    # First pass: render shapes (vertices)
    for cell in cells:
        if cell.get('vertex') != '1':
            continue
        geom = cell.find('mxGeometry')
        if geom is None:
            continue
        
        style = parse_style(cell.get('style', ''))
        svg_elements.append(render_shape(cell, style, geom, cells_by_id, bbox, offset_x, offset_y))
    
    # Second pass: render edges
    for cell in cells:
        if cell.get('edge') != '1':
            continue
        
        style = parse_style(cell.get('style', ''))
        geom = cell.find('mxGeometry')
        svg_elements.append(render_edge(cell, style, geom, cells_by_id, offset_x, offset_y))
    
    # Escape mxGraphModel for embedding in content attribute
    content_escaped = html.escape(mxgraph_str, quote=True)
    
    # Build final SVG with standard XML header and DocType for Obsidian plugin compatibility
    svg = f'''<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="{svg_width:.0f}px" height="{svg_height:.0f}px" viewBox="-{padding} -{padding} {svg_width:.0f} {svg_height:.0f}" content="{content_escaped}">
<style type="text/css"></style>
{chr(10).join(svg_elements)}
</svg>'''
    
    return svg


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    
    input_path = Path(sys.argv[1])
    
    if len(sys.argv) >= 3:
        output_path = Path(sys.argv[2])
    else:
        output_path = input_path.with_suffix('.svg')
    
    if not input_path.exists():
        print(f"Error: Input file not found: {input_path}")
        sys.exit(1)
    
    drawio_content = input_path.read_text(encoding='utf-8')
    
    try:
        svg_content = convert_drawio_to_svg(drawio_content)
        output_path.write_text(svg_content, encoding='utf-8')
        print(f"Successfully converted: {input_path} -> {output_path}")
    except Exception as e:
        print(f"Error converting file: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()
