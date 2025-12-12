#!/usr/bin/env python3
"""
Generate PWA icons for the Sticky Notes app
Creates various sized icons from a base design
"""

from PIL import Image, ImageDraw, ImageFont
import os

def create_app_icon(size, output_path):
    """Create a sticky notes app icon"""
    # Create a new image with transparent background
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Color scheme
    primary_color = (99, 102, 241)  # --primary-color
    secondary_color = (16, 185, 129)  # --secondary-color
    accent_color = (251, 191, 36)  # Golden accent
    
    # Background gradient effect (simplified)
    for y in range(size):
        alpha = int(255 * (1 - (y / size) * 0.3))
        color = (102, 126, 234, alpha)  # Background gradient
        draw.rectangle([0, y, size, y+1], fill=color)
    
    # Main sticky note shape (rounded rectangle)
    margin = size // 8
    note_width = size - 2 * margin
    note_height = int(note_width * 1.2)
    
    # Note background with gradient effect
    for i in range(note_height):
        alpha = int(255 * (0.95 - (i / note_height) * 0.1))
        color = (254, 243, 199, alpha)  # Light yellow
        draw.rectangle([margin, margin + i, margin + note_width, margin + i + 1], fill=color)
    
    # Note border
    border_color = (245, 158, 11)  # Orange border
    draw.rectangle([margin, margin, margin + note_width, margin + note_height], 
                   outline=border_color, width=max(1, size // 64))
    
    # Top colored bar
    bar_height = max(3, size // 16)
    draw.rectangle([margin, margin, margin + note_width, margin + bar_height], 
                   fill=border_color)
    
    # Add some "text lines" on the note
    if size >= 128:  # Only add details for larger icons
        line_start_y = margin + bar_height + size // 16
        line_spacing = size // 12
        
        for i in range(3):
            line_y = line_start_y + i * line_spacing
            line_width = note_width - 2 * margin
            draw.rectangle([margin + size // 8, line_y, 
                          margin + size // 8 + line_width, line_y + max(1, size // 64)], 
                         fill=(156, 163, 175, 200))  # Gray text
    
    # Add a small checkmark or star for visual interest
    if size >= 72:
        # Star in top-right corner
        star_size = size // 8
        star_x = margin + note_width - star_size - size // 32
        star_y = margin + size // 32
        
        # Simple star-like shape using a polygon
        star_points = []
        center_x = star_x + star_size // 2
        center_y = star_y + star_size // 2
        
        for i in range(5):
            import math
            angle = i * math.pi / 2.5
            x = center_x + star_size // 2 * 0.4 * math.cos(angle)
            y = center_y + star_size // 2 * 0.4 * math.sin(angle)
            star_points.append((x, y))
        
        draw.polygon(star_points, fill=secondary_color)
    
    # Save the image
    img.save(output_path, 'PNG')
    print(f"Created icon: {output_path} ({size}x{size})")

def generate_icons():
    """Generate all required PWA icons"""
    output_dir = '/Users/sreenath/Documents/GitHub/Sticky Notes/icons'
    os.makedirs(output_dir, exist_ok=True)
    
    # Standard PWA icon sizes
    sizes = [72, 96, 128, 144, 152, 192, 384, 512]
    
    for size in sizes:
        output_path = os.path.join(output_dir, f'icon-{size}x{size}.png')
        create_app_icon(size, output_path)
    
    print(f"\nAll icons generated in: {output_dir}")
    print("Icons created:", [f"icon-{size}x{size}.png" for size in sizes])

if __name__ == '__main__':
    generate_icons()
