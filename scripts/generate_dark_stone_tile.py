import os
import random
from PIL import Image, ImageDraw

def create_seamless_dark_stone_64():
    # 16x16 logical pixel grid scaled by 4 = 64x64 px
    logical_size = 16
    scale = 4
    width = logical_size * scale
    height = logical_size * scale

    # 16-bit Volcanic Basalt Palette
    C_DEEP   = (26, 28, 36, 255)   # Deep fissure cracks / shadows
    C_DARK   = (42, 45, 56, 255)   # Low rock matrix
    C_MID    = (66, 70, 84, 255)   # Mid cooled basalt rock face
    C_LIGHT  = (96, 102, 120, 255) # Chiseled stone ridge
    C_SPEC   = (134, 140, 162, 255)# Sharp specular rock glint

    # Logical 16x16 grid initialization with base dark basalt
    grid = [[C_MID for _ in range(logical_size)] for _ in range(logical_size)]

    def wrap_set(x, y, color):
        grid[y % logical_size][x % logical_size] = color

    # Seed for deterministic, beautifully balanced rock clusters
    random.seed(108)

    # 1. Base variation with seamless pseudo-cellular rock planes
    for y in range(logical_size):
        for x in range(logical_size):
            # Deterministic noise with torus wrapping
            val = (
                (x * 7 + y * 13) % 19 +
                ((x + 8) % 16 * 11 + (y + 8) % 16 * 5) % 23
            ) % 100
            if val < 28:
                grid[y][x] = C_DARK
            elif val > 75:
                grid[y][x] = C_LIGHT

    # 2. Chunky Volcanic Basalt Plates (Cobblestone/fissure boundaries)
    # Define primary interlocking basalt plate centers that wrap seamlessly
    plates = [
        (3, 3, 5, 4),
        (11, 4, 6, 5),
        (5, 11, 5, 5),
        (13, 12, 5, 4)
    ]

    for px, py, pw, ph in plates:
        for dy in range(-ph // 2, ph // 2 + 1):
            for dx in range(-pw // 2, pw // 2 + 1):
                if abs(dx) + abs(dy) <= max(pw, ph) // 2 + 1:
                    wrap_set(px + dx, py + dy, C_MID)

    # 3. Seamless Fissure Cracks (carved between rock plates with full wrap-around)
    fissures = [
        # Horizontal fissure wrapping seamlessly across edges
        (0, 8), (1, 8), (2, 7), (3, 7), (4, 8), (5, 8), (6, 9), (7, 9),
        (8, 8), (9, 8), (10, 8), (11, 9), (12, 9), (13, 8), (14, 8), (15, 8),

        # Vertical fissure wrapping seamlessly across top & bottom
        (8, 0), (8, 1), (7, 2), (7, 3), (8, 4), (8, 5), (8, 6), (7, 7),
        (8, 8), (8, 9), (9, 10), (9, 11), (8, 12), (8, 13), (8, 14), (8, 15),

        # Diagonal fracture branches
        (3, 4), (4, 5), (5, 6), (12, 10), (13, 11), (14, 12)
    ]

    for fx, fy in fissures:
        wrap_set(fx, fy, C_DEEP)
        # Deep shadow accent adjacent to fissure
        wrap_set(fx, fy + 1, C_DARK)

    # 4. Highlight Ridges on Upper Faces of Rock Plates (Light source from top-left)
    highlights = [
        # Upper edge of top-left plate
        (2, 2), (3, 1), (4, 1), (5, 2),
        # Upper edge of top-right plate
        (10, 2), (11, 1), (12, 1), (13, 2),
        # Upper edge of bottom-left plate
        (2, 10), (3, 9), (4, 9), (5, 10),
        # Upper edge of bottom-right plate
        (10, 10), (11, 9), (12, 9), (13, 10)
    ]
    for hx, hy in highlights:
        wrap_set(hx, hy, C_LIGHT)

    # Specular glint flecks on basalt crests
    speculars = [(3, 1), (12, 1), (4, 9), (11, 9)]
    for sx, sy in speculars:
        wrap_set(sx, sy, C_SPEC)

    # 5. Render full-bleed 64x64 image
    img = Image.new("RGBA", (width, height), (0, 0, 0, 255))
    draw = ImageDraw.Draw(img)

    for y in range(logical_size):
        for x in range(logical_size):
            draw.rectangle(
                [x * scale, y * scale, (x + 1) * scale - 1, (y + 1) * scale - 1],
                fill=grid[y][x]
            )

    # Save primary 64x64 tile
    target_path = "public/assets/blocks/stone.png"
    os.makedirs(os.path.dirname(target_path), exist_ok=True)
    img.save(target_path, "PNG")
    print(f"Saved 64x64 dark stone block tile to {target_path}")

    # Also save as hard_stone.png
    img.save("public/assets/blocks/hard_stone.png", "PNG")
    print("Saved to public/assets/blocks/hard_stone.png")

    # Save to root for inspection
    img.save("dark_stone_tile_64.png", "PNG")
    print("Saved dark_stone_tile_64.png to root.")

    # 6. Generate a 2x2 seamless test proof (128x128) to verify perfect tileability
    test_2x2 = Image.new("RGBA", (width * 2, height * 2))
    test_2x2.paste(img, (0, 0))
    test_2x2.paste(img, (width, 0))
    test_2x2.paste(img, (0, height))
    test_2x2.paste(img, (width, height))
    test_2x2.save("dark_stone_tiled_test_128.png", "PNG")
    print("Saved 2x2 seamless verification proof to dark_stone_tiled_test_128.png.")

if __name__ == "__main__":
    create_seamless_dark_stone_64()

