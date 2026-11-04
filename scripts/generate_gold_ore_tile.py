import os
from PIL import Image, ImageDraw

def create_gold_ore_tile_64():
    logical_size = 16
    scale = 4
    width = logical_size * scale
    height = logical_size * scale

    # 16-Bit Volcanic Dark Stone & High-Contrast Radiant Gold Palette
    # Dark underground rock matrix
    STONE_SHADOW = (24, 26, 34, 255)   # Deep rock crevice
    STONE_DARK   = (42, 45, 56, 255)   # Dark basalt body
    STONE_MID    = (64, 68, 82, 255)   # Cooled stone face
    STONE_LIGHT  = (92, 98, 116, 255)  # Beveled rock border highlight
    STONE_CRACK  = (18, 19, 26, 255)   # Deep fracture

    # Radiant Yellow-Gold Metallic Nuggets (High contrast for small screens)
    GOLD_DEEP    = (138, 84, 10, 255)  # Deep golden shadow
    GOLD_DARK    = (186, 128, 16, 255) # Rich amber gold
    GOLD_MID     = (238, 180, 24, 255) # Radiant yellow gold
    GOLD_LIGHT   = (254, 224, 76, 255) # Bright lemon gold facet
    GOLD_HI      = (255, 248, 168, 255)# Pale gold rim highlight
    GOLD_GLINT   = (255, 255, 255, 255)# Crisp pure white specular glint

    grid = [[STONE_MID for _ in range(logical_size)] for _ in range(logical_size)]

    def px(x, y, color):
        if 0 <= x < logical_size and 0 <= y < logical_size:
            grid[y][x] = color

    # 1. Base Dark Rock Foundation with Stone Bevel Borders
    for y in range(logical_size):
        for x in range(logical_size):
            # Subtle rock texture pattern
            pattern = (x * 7 + y * 13) % 17
            if pattern < 5:
                grid[y][x] = STONE_DARK
            elif pattern > 13:
                grid[y][x] = STONE_LIGHT

    # Outer 3D beveled stone framing for readable block boundaries
    for x in range(logical_size):
        grid[0][x] = STONE_LIGHT
        grid[logical_size - 1][x] = STONE_SHADOW
    for y in range(logical_size):
        grid[y][0] = STONE_LIGHT
        grid[y][logical_size - 1] = STONE_SHADOW

    # Natural fissures in rock matrix
    fissures = [
        (3, 4), (4, 4), (5, 5), (6, 5), (7, 6),
        (10, 3), (11, 4), (12, 4), (13, 5),
        (3, 11), (4, 11), (5, 12), (6, 12),
        (9, 10), (10, 11), (11, 11), (12, 12)
    ]
    for fx, fy in fissures:
        px(fx, fy, STONE_CRACK)
        px(fx, fy + 1, STONE_SHADOW)

    # 2. EMBEDDED GOLD NUGGET CLUSTERS (High-contrast metallic gems)
    # Cluster 1: Large Central-Right Nugget (Cols 9-13, Rows 5-9)
    nugget1 = [
        # Gold shadow rim
        (9, 7, GOLD_DEEP), (10, 8, GOLD_DEEP), (11, 9, GOLD_DEEP), (12, 9, GOLD_DEEP), (13, 8, GOLD_DEEP),
        # Dark gold base
        (9, 6, GOLD_DARK), (10, 7, GOLD_DARK), (11, 8, GOLD_DARK), (12, 8, GOLD_DARK), (13, 7, GOLD_DARK),
        # Radiant mid-tone gold
        (10, 5, GOLD_MID), (11, 6, GOLD_MID), (12, 6, GOLD_MID), (11, 7, GOLD_MID), (12, 7, GOLD_MID),
        # Bright top highlights
        (9, 5, GOLD_LIGHT), (10, 4, GOLD_LIGHT), (11, 5, GOLD_LIGHT), (12, 5, GOLD_LIGHT),
        # Specular glints
        (10, 5, GOLD_HI), (11, 5, GOLD_GLINT), (12, 5, GOLD_HI)
    ]
    for gx, gy, gcol in nugget1:
        px(gx, gy, gcol)

    # Cluster 2: Upper-Left Nugget (Cols 3-6, Rows 2-5)
    nugget2 = [
        (3, 4, GOLD_DEEP), (4, 5, GOLD_DEEP), (5, 5, GOLD_DEEP), (6, 4, GOLD_DEEP),
        (3, 3, GOLD_DARK), (4, 4, GOLD_DARK), (5, 4, GOLD_DARK), (6, 3, GOLD_DARK),
        (4, 3, GOLD_MID), (5, 3, GOLD_MID),
        (4, 2, GOLD_LIGHT), (5, 2, GOLD_HI),
        (4, 3, GOLD_GLINT) # Specular white ping
    ]
    for gx, gy, gcol in nugget2:
        px(gx, gy, gcol)

    # Cluster 3: Lower-Left Nugget (Cols 2-5, Rows 9-12)
    nugget3 = [
        (2, 11, GOLD_DEEP), (3, 12, GOLD_DEEP), (4, 12, GOLD_DEEP), (5, 11, GOLD_DEEP),
        (2, 10, GOLD_DARK), (3, 11, GOLD_DARK), (4, 11, GOLD_DARK), (5, 10, GOLD_DARK),
        (3, 10, GOLD_MID), (4, 10, GOLD_MID),
        (3, 9, GOLD_LIGHT), (4, 9, GOLD_HI),
        (3, 10, GOLD_GLINT)
    ]
    for gx, gy, gcol in nugget3:
        px(gx, gy, gcol)

    # Cluster 4: Tiny Embedded Gold Flecks (Scattered raw ore specks)
    flecks = [
        (7, 2, GOLD_LIGHT), (8, 2, GOLD_GLINT), (8, 3, GOLD_DARK),
        (8, 12, GOLD_LIGHT), (9, 12, GOLD_MID), (9, 13, GOLD_DEEP),
        (13, 2, GOLD_LIGHT), (14, 2, GOLD_MID),
        (6, 8, GOLD_GLINT), (7, 8, GOLD_MID)
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
    target_path = "public/assets/blocks/gold_ore.png"
    os.makedirs(os.path.dirname(target_path), exist_ok=True)
    img.save(target_path, "PNG")
    print(f"Saved 64x64 gold ore block tile to {target_path}")

    # Also save to root
    img.save("gold_ore_tile_64.png", "PNG")
    print("Saved gold_ore_tile_64.png to root.")

if __name__ == "__main__":
    create_gold_ore_tile_64()
