import math
import os
from PIL import Image, ImageDraw

def create_selector_wheel_512():
    logical_size = 128
    scale = 4
    width = logical_size * scale
    height = logical_size * scale
    cx, cy = logical_size / 2.0, logical_size / 2.0

    # 16-Bit Dwarven Black Iron & Molten Lava Rune Palette
    # Black Iron metal
    IRON_BLACK    = (14, 16, 24, 255)   # Deepest metal shadow / silhouette outline
    IRON_DARK     = (28, 32, 44, 255)   # Forged black iron body
    IRON_MID      = (48, 54, 72, 255)   # Chiseled gunmetal face
    IRON_LIGHT    = (82, 92, 118, 255)  # Beveled mechanical rim highlight
    IRON_HI       = (130, 144, 178, 255)# Specular edge glint
    RIVET_STEEL   = (195, 210, 238, 255)# Specular steel rivet ping

    # Glowing Molten Lava Runes
    LAVA_DARK     = (140, 32, 12, 255)  # Sub-surface crust ember
    LAVA_RED      = (205, 52, 16, 255)  # Deep glowing magma
    LAVA_ORANGE   = (255, 125, 20, 255) # Radiant molten orange
    LAVA_YELLOW   = (255, 215, 60, 255) # Blinding incandescent rune core
    LAVA_WHITE    = (255, 255, 200, 255)# Specular heat glint

    # Recessed runic channel
    CHANNEL_DARK  = (18, 16, 22, 255)

    # Initialize transparent canvas
    grid = [[(0, 0, 0, 0) for _ in range(logical_size)] for _ in range(logical_size)]

    # Radii in logical pixels (scale 4x -> 144px hollow center to 240px outer cogs)
    R_INNER_HOLLOW = 35.5  # Completely transparent inside this radius
    R_INNER_RIM    = 38.0
    R_CHANNEL_IN   = 39.5
    R_CHANNEL_OUT  = 47.5
    R_OUTER_RIM    = 51.5
    R_GEAR_OUT     = 58.5  # Cogs outer tip

    # Number of symmetrical dwarven gear cogs
    NUM_COGS = 12

    for y in range(logical_size):
        for x in range(logical_size):
            dx = (x + 0.5) - cx
            dy = (y + 0.5) - cy
            dist = math.hypot(dx, dy)
            angle = (math.atan2(dy, dx) + math.pi * 2) % (math.pi * 2)

            # 1. 100% HOLLOW TRANSPARENT CENTER
            if dist < R_INNER_HOLLOW:
                continue

            # 2. INNER RIM BEVEL (r: 35.5 to 39.5)
            if dist < R_INNER_RIM:
                # Highlight top-left, shadow bottom-right
                is_hi = (dx < 0 or dy < 0) and not (dx > 0 and dy > 0)
                grid[y][x] = IRON_LIGHT if is_hi else IRON_BLACK
                continue

            # 3. GEAR COGS & OUTER BOUNDARY
            # Check if within gear cog sector
            cog_period = (math.pi * 2) / NUM_COGS
            cog_phase = (angle % cog_period) / cog_period # 0 to 1
            is_cog_tooth = 0.22 <= cog_phase <= 0.78

            # Past outer rim: only render if on a gear tooth
            if dist >= R_OUTER_RIM:
                if dist <= R_GEAR_OUT and is_cog_tooth:
                    # Gear tooth shading
                    tooth_hi = (dy < 0 or dx < 0)
                    if dist >= R_GEAR_OUT - 1.5:
                        grid[y][x] = IRON_LIGHT if tooth_hi else IRON_BLACK
                    else:
                        grid[y][x] = IRON_MID if tooth_hi else IRON_DARK
                continue

            # 4. OUTER RIM BEVEL (r: 47.5 to 51.5)
            if dist >= R_CHANNEL_OUT:
                is_hi = (dy < 0 or (dx < 0 and dy < 15))
                if dist >= R_OUTER_RIM - 1.2:
                    grid[y][x] = IRON_HI if is_hi else IRON_BLACK
                else:
                    grid[y][x] = IRON_MID if is_hi else IRON_DARK
                continue

            # 5. RECESSED RUNIC CHANNEL (r: 39.5 to 47.5)
            # Default dark channel backdrop
            grid[y][x] = CHANNEL_DARK

    # -------------------------------------------------------------
    # 6. SYMMETRICAL DWARVEN LAVA RUNES (Carved around the channel)
    # 12 rune stations around the wheel (at 0, 30, 60, ... degrees)
    # -------------------------------------------------------------
    for i in range(12):
        theta = i * (math.pi / 6) # Every 30 degrees

        # Center of each rune station at r=43.5
        rx = cx + math.cos(theta) * 43.5
        ry = cy + math.sin(theta) * 43.5

        # Runic geometric glyphs: alternating diamond runes and angled brackets
        is_cardinal = (i % 3 == 0) # 0, 90, 180, 270 degrees

        if is_cardinal:
            # Major Runic Diamond Node with molten incandescent core
            offsets = [
                (0, 0, LAVA_WHITE),
                (1, 0, LAVA_YELLOW), (-1, 0, LAVA_YELLOW),
                (0, 1, LAVA_YELLOW), (0, -1, LAVA_YELLOW),
                (2, 0, LAVA_ORANGE), (-2, 0, LAVA_ORANGE),
                (0, 2, LAVA_ORANGE), (0, -2, LAVA_ORANGE),
                (1, 1, LAVA_ORANGE), (-1, -1, LAVA_ORANGE),
                (1, -1, LAVA_ORANGE), (-1, 1, LAVA_ORANGE),
                (2, 1, LAVA_RED), (-2, -1, LAVA_RED),
                (1, 2, LAVA_RED), (-1, -2, LAVA_RED)
            ]
            for ox, oy, col in offsets:
                gx, gy = int(round(rx + ox)), int(round(ry + oy))
                if 0 <= gx < logical_size and 0 <= gy < logical_size:
                    grid[gy][gx] = col
        else:
            # Minor Runic Chevron / Lava Channel
            offsets = [
                (0, 0, LAVA_YELLOW),
                (1, 0, LAVA_ORANGE), (-1, 0, LAVA_ORANGE),
                (0, 1, LAVA_ORANGE), (0, -1, LAVA_ORANGE),
                (1, 1, LAVA_RED), (-1, -1, LAVA_RED)
            ]
            for ox, oy, col in offsets:
                gx, gy = int(round(rx + ox)), int(round(ry + oy))
                if 0 <= gx < logical_size and 0 <= gy < logical_size:
                    grid[gy][gx] = col

    # Continuous molten lava circular conduit line connecting the runes (at r=43.5)
    for step in range(360):
        rad = step * (math.pi / 180)
        # Pulse intensity between orange and red
        col = LAVA_RED if (step % 15 < 6) else LAVA_DARK
        lx = int(round(cx + math.cos(rad) * 43.5))
        ly = int(round(cy + math.sin(rad) * 43.5))
        if 0 <= lx < logical_size and 0 <= ly < logical_size:
            # Don't overwrite brighter core runes
            if grid[ly][lx] in [CHANNEL_DARK, IRON_DARK]:
                grid[ly][lx] = col

    # -------------------------------------------------------------
    # 7. FOUR HEAVY DWARVEN IRON RIVET BRACKETS
    # Cardinal axes (Top, Bottom, Left, Right) securing the gear frame
    # -------------------------------------------------------------
    brackets = [
        (cx, cy - 49.5), # Top
        (cx, cy + 49.5), # Bottom
        (cx - 49.5, cy), # Left
        (cx + 49.5, cy)  # Right
    ]
    for bx, by in brackets:
        # 3x3 Iron Rivet Plate with bright specular center
        for dy in [-1, 0, 1]:
            for dx in [-1, 0, 1]:
                gx, gy = int(round(bx + dx)), int(round(by + dy))
                if 0 <= gx < logical_size and 0 <= gy < logical_size:
                    if dx == 0 and dy == 0:
                        grid[gy][gx] = RIVET_STEEL
                    elif dx < 0 or dy < 0:
                        grid[gy][gx] = IRON_LIGHT
                    else:
                        grid[gy][gx] = IRON_BLACK

    # -------------------------------------------------------------
    # 8. RENDER 512x512 CRISP PIXEL-ART IMAGE
    # -------------------------------------------------------------
    img = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    for y in range(logical_size):
        for x in range(logical_size):
            col = grid[y][x]
            if col[3] > 0:
                draw.rectangle(
                    [x * scale, y * scale, (x + 1) * scale - 1, (y + 1) * scale - 1],
                    fill=col
                )

    # Save to UI assets
    target_path = "public/assets/ui/selector_wheel_frame.png"
    os.makedirs(os.path.dirname(target_path), exist_ok=True)
    img.save(target_path, "PNG")
    print(f"Saved 512x512 selector wheel frame to {target_path}")

    # Also save to root
    img.save("selector_wheel_frame_512.png", "PNG")
    print("Saved selector_wheel_frame_512.png to root.")

if __name__ == "__main__":
    create_selector_wheel_512()

