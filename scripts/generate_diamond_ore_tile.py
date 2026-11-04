import os
from PIL import Image, ImageDraw

def create_diamond_ore_tile_64():
    logical_size = 16
    scale = 4
    width = logical_size * scale
    height = logical_size * scale

    # 16-Bit Basalt Stone & Luminous Saturated Cyan Diamond Palette
    # Dark basalt rock matrix
    STONE_SHADOW = (22, 24, 32, 255)   # Deep rock crevice
    STONE_DARK   = (38, 42, 52, 255)   # Dark basalt body
    STONE_MID    = (62, 66, 80, 255)   # Cooled basalt face
    STONE_LIGHT  = (90, 96, 114, 255)  # Beveled rock border highlight
    STONE_CRACK  = (16, 17, 24, 255)   # Deep rock fissure

    # Glowing Saturated Cyan Diamond Crystals (High contrast for scale readability)
    DIAMOND_DEEP = (8, 48, 66, 255)    # Refraction shadow plane
    DIAMOND_DARK = (14, 98, 126, 255)  # Deep cyan crystal body
    DIAMOND_BASE = (18, 156, 192, 255) # Saturated pure cyan
    DIAMOND_MID  = (34, 211, 238, 255) # Luminous electric cyan
    DIAMOND_LIGHT= (165, 243, 252, 255)# Pale cyan crystal facet highlight
    DIAMOND_GLINT= (255, 255, 255, 255)# Crisp pure white specular glint

    grid = [[STONE_MID for _ in range(logical_size)] for _ in range(logical_size)]

    def px(x, y, color):
        if 0 <= x < logical_size and 0 <= y < logical_size:
            grid[y][x] = color

    # 1. Dark Basalt Rock Matrix with 3D Beveled Framing
    for y in range(logical_size):
        for x in range(logical_size):
            pattern = (x * 11 + y * 7) % 19
            if pattern < 6:
                grid[y][x] = STONE_DARK
            elif pattern > 14:
                grid[y][x] = STONE_LIGHT

    # Outer 3D stone bevels
    for x in range(logical_size):
        grid[0][x] = STONE_LIGHT
        grid[logical_size - 1][x] = STONE_SHADOW
    for y in range(logical_size):
        grid[y][0] = STONE_LIGHT
        grid[y][logical_size - 1] = STONE_SHADOW

    # Natural fractures wrapping around crystal deposits
    fissures = [
        (4, 3), (5, 4), (6, 4), (7, 5), (8, 5),
        (10, 4), (11, 4), (12, 5), (13, 6),
        (3, 10), (4, 11), (5, 11), (6, 12),
        (8, 11), (9, 12), (10, 12), (11, 13)
    ]
    for fx, fy in fissures:
        px(fx, fy, STONE_CRACK)
        px(fx, fy + 1, STONE_SHADOW)

    # 2. GLOWING SATURATED CYAN CRYSTAL DEPOSITS
    # Cluster 1: Prominent Central-Left Diamond Shard (Cols 3-7, Rows 4-8)
    crystal1 = [
        # Crystal base shadow socket
        (3, 7, DIAMOND_DEEP), (4, 8, DIAMOND_DEEP), (5, 8, DIAMOND_DEEP), (6, 7, DIAMOND_DEEP), (7, 6, DIAMOND_DEEP),
        # Dark facet refraction
        (3, 6, DIAMOND_DARK), (4, 7, DIAMOND_DARK), (5, 7, DIAMOND_DARK), (6, 6, DIAMOND_DARK),
        # Luminous cyan crystal core
        (4, 5, DIAMOND_BASE), (5, 5, DIAMOND_MID),  (5, 6, DIAMOND_MID),  (6, 5, DIAMOND_BASE),
        # Sharp beveled facet highlights
        (4, 4, DIAMOND_LIGHT),(5, 4, DIAMOND_LIGHT),(6, 4, DIAMOND_LIGHT),
        # Specular diamond glints
        (4, 4, DIAMOND_GLINT),(5, 5, DIAMOND_GLINT)
    ]
    for cx, cy, ccol in crystal1:
        px(cx, cy, ccol)

    # Cluster 2: Large Right Faceted Diamond Crystal (Cols 9-13, Rows 5-9)
    crystal2 = [
        (9, 8, DIAMOND_DEEP), (10, 9, DIAMOND_DEEP), (11, 9, DIAMOND_DEEP), (12, 8, DIAMOND_DEEP), (13, 7, DIAMOND_DEEP),
        (9, 7, DIAMOND_DARK), (10, 8, DIAMOND_DARK), (11, 8, DIAMOND_DARK), (12, 7, DIAMOND_DARK),
        (10, 6, DIAMOND_BASE),(11, 6, DIAMOND_MID),  (11, 7, DIAMOND_MID),  (12, 6, DIAMOND_BASE),
        (10, 5, DIAMOND_LIGHT),(11, 5, DIAMOND_LIGHT),(12, 5, DIAMOND_LIGHT),
        (10, 5, DIAMOND_GLINT),(11, 6, DIAMOND_GLINT)
    ]
    for cx, cy, ccol in crystal2:
        px(cx, cy, ccol)

    # Cluster 3: Lower-Left Crystalline Outcropping (Cols 2-6, Rows 10-13)
    crystal3 = [
        (2, 12, DIAMOND_DEEP), (3, 13, DIAMOND_DEEP), (4, 13, DIAMOND_DEEP), (5, 12, DIAMOND_DEEP),
        (2, 11, DIAMOND_DARK), (3, 12, DIAMOND_DARK), (4, 12, DIAMOND_DARK), (5, 11, DIAMOND_DARK),
        (3, 11, DIAMOND_BASE), (4, 11, DIAMOND_MID),
        (3, 10, DIAMOND_LIGHT),(4, 10, DIAMOND_LIGHT),
        (3, 10, DIAMOND_GLINT)
    ]
    for cx, cy, ccol in crystal3:
        px(cx, cy, ccol)

    # Cluster 4: Upper-Right Crystal Spire (Cols 11-14, Rows 2-4)
    crystal4 = [
        (11, 3, DIAMOND_DARK), (12, 4, DIAMOND_DEEP), (13, 3, DIAMOND_DEEP),
        (12, 3, DIAMOND_MID),  (13, 2, DIAMOND_BASE),
        (12, 2, DIAMOND_LIGHT),(13, 2, DIAMOND_LIGHT),
        (12, 2, DIAMOND_GLINT)
    ]
    for cx, cy, ccol in crystal4:
        px(cx, cy, ccol)

    # Subtle glowing ambient cyan flecks along basalt veins
    flecks = [
        (7, 2, DIAMOND_MID), (8, 2, DIAMOND_GLINT),
        (8, 12, DIAMOND_MID), (9, 13, DIAMOND_LIGHT),
        (14, 10, DIAMOND_BASE), (14, 11, DIAMOND_MID)
    ]
    for fx, fy, fcol in flecks:
        px(fx, fy, fcol)

    # 3. Render Crisp Full 64x64 Tile
    img = Image.new("RGBA", (width, height), (0, 0, 0, 255))
    draw = ImageDraw.Draw(img)

    for y in range(logical_size):
        for x in range(logical_size):
            draw.rectangle(
                [x * scale, y * scale, (x + 1) * scale - 1, (y + 1) * scale - 1],
                fill=grid[y][x]
            )

    # Save target in blocks
    target_path = "public/assets/blocks/diamond_ore.png"
    os.makedirs(os.path.dirname(target_path), exist_ok=True)
    img.save(target_path, "PNG")
    print(f"Saved 64x64 diamond ore block tile to {target_path}")

    # Also save to root
    img.save("diamond_ore_tile_64.png", "PNG")
    print("Saved diamond_ore_tile_64.png to root.")

if __name__ == "__main__":
    create_diamond_ore_tile_64()

