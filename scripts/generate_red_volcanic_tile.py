import os
import random
from PIL import Image, ImageDraw

def create_seamless_red_volcanic_64():
    logical_size = 16
    scale = 4
    width = logical_size * scale
    height = logical_size * scale

    # 16-Bit Volcanic Crimson & Molten Magma Palette
    # Deep charcoal fissure crust
    CHARCOAL_BLACK = (18, 12, 16, 255)  # Pitch black charred fracture
    CHARCOAL_DARK  = (32, 18, 22, 255)  # Cooled charred soot

    # Dark crimson volcanic stone
    CRIMSON_DEEP   = (58, 20, 26, 255)  # Deep shadow face
    CRIMSON_BASE   = (94, 28, 34, 255)  # Weathered crimson rock
    CRIMSON_MID    = (138, 40, 46, 255) # Rich volcanic red stone
    CRIMSON_LIGHT  = (182, 60, 66, 255) # Beveled ridge highlight
    CRIMSON_HI     = (222, 92, 96, 255) # Sharp stone crest glint

    # Glowing magma veins (heat peeking through cracks)
    MAGMA_CORE     = (255, 235, 120, 255)# Glowing incandescent yellow core
    MAGMA_ORANGE   = (255, 125, 24, 255) # Molten lava mid
    MAGMA_RED      = (192, 48, 18, 255)  # Semi-cooled crust edge

    grid = [[CRIMSON_MID for _ in range(logical_size)] for _ in range(logical_size)]

    def wrap_set(x, y, color):
        grid[y % logical_size][x % logical_size] = color

    random.seed(314)

    # 1. Base variation of dark crimson basalt plates
    for y in range(logical_size):
        for x in range(logical_size):
            noise = (
                (x * 11 + y * 7) % 17 +
                ((x + 6) % 16 * 13 + (y + 10) % 16 * 5) % 19
            ) % 100
            if noise < 30:
                grid[y][x] = CRIMSON_BASE
            elif noise > 75:
                grid[y][x] = CRIMSON_LIGHT

    # 2. Seamless Interlocking Volcanic Plates
    plates = [
        (3, 4, 6, 5),
        (12, 3, 5, 5),
        (4, 12, 5, 5),
        (11, 11, 6, 4)
    ]
    for px, py, pw, ph in plates:
        for dy in range(-ph // 2, ph // 2 + 1):
            for dx in range(-pw // 2, pw // 2 + 1):
                if abs(dx) + abs(dy) <= max(pw, ph) // 2 + 1:
                    wrap_set(px + dx, py + dy, CRIMSON_MID)

    # 3. Deep Charcoal Cracks (Seamless Torus Wrapping)
    fissures = [
        # Horizontal fissure connecting x=0 to x=15
        (0, 7), (1, 7), (2, 8), (3, 8), (4, 7), (5, 7), (6, 6), (7, 6),
        (8, 7), (9, 7), (10, 8), (11, 8), (12, 7), (13, 7), (14, 7), (15, 7),

        # Vertical fissure connecting y=0 to y=15
        (7, 0), (7, 1), (8, 2), (8, 3), (7, 4), (7, 5), (6, 6),
        (7, 7), (8, 8), (8, 9), (7, 10), (7, 11), (8, 12), (8, 13), (7, 14), (7, 15),

        # Diagonal fracture branches
        (2, 3), (3, 4), (4, 5), (12, 9), (13, 10), (14, 11)
    ]

    for fx, fy in fissures:
        wrap_set(fx, fy, CHARCOAL_BLACK)
        wrap_set(fx, fy + 1, CHARCOAL_DARK)
        wrap_set(fx + 1, fy, CRIMSON_DEEP)

    # 4. Subtle Glowing Magma Veins (Molten lava inside fractures)
    # Magma points nested inside the charcoal fissures
    magma_veins = [
        # Horizontal flow
        (2, 8, MAGMA_ORANGE), (3, 8, MAGMA_CORE), (4, 7, MAGMA_ORANGE),
        (9, 7, MAGMA_RED), (10, 8, MAGMA_ORANGE), (11, 8, MAGMA_CORE), (12, 7, MAGMA_ORANGE),
        # Vertical flow
        (8, 2, MAGMA_RED), (8, 3, MAGMA_ORANGE),
        (8, 9, MAGMA_ORANGE), (7, 10, MAGMA_CORE), (7, 11, MAGMA_ORANGE),
        # Diagonal glowing ember
        (3, 4, MAGMA_ORANGE), (13, 10, MAGMA_RED)
    ]

    for mx, my, mcol in magma_veins:
        wrap_set(mx, my, mcol)

    # 5. Beveled Crimson Highlights on Upper Plate Edges
    highlights = [
        (2, 2), (3, 2), (4, 3), (5, 3),
        (10, 2), (11, 1), (12, 1), (13, 2),
        (2, 10), (3, 10), (4, 11),
        (10, 9), (11, 9), (12, 10)
    ]
    for hx, hy in highlights:
        wrap_set(hx, hy, CRIMSON_LIGHT)

    # Sharp crimson/orange specular glints on crests
    glints = [(3, 2), (11, 1), (3, 10), (11, 9)]
    for gx, gy in glints:
        wrap_set(gx, gy, CRIMSON_HI)

    # 6. Render Full-Bleed 64x64 Image
    img = Image.new("RGBA", (width, height), (0, 0, 0, 255))
    draw = ImageDraw.Draw(img)

    for y in range(logical_size):
        for x in range(logical_size):
            draw.rectangle(
                [x * scale, y * scale, (x + 1) * scale - 1, (y + 1) * scale - 1],
                fill=grid[y][x]
            )

    # Save target in blocks
    target_path = "public/assets/blocks/red_volcanic_rock.png"
    os.makedirs(os.path.dirname(target_path), exist_ok=True)
    img.save(target_path, "PNG")
    print(f"Saved 64x64 red volcanic rock tile to {target_path}")

    # Also save to root
    img.save("red_volcanic_tile_64.png", "PNG")
    print("Saved red_volcanic_tile_64.png to root.")

    # 7. Generate a 2x2 seamless test proof (128x128)
    test_2x2 = Image.new("RGBA", (width * 2, height * 2))
    test_2x2.paste(img, (0, 0))
    test_2x2.paste(img, (width, 0))
    test_2x2.paste(img, (0, height))
    test_2x2.paste(img, (width, height))
    test_2x2.save("red_volcanic_tiled_test_128.png", "PNG")
    print("Saved 2x2 seamless verification proof to red_volcanic_tiled_test_128.png.")

if __name__ == "__main__":
    create_seamless_red_volcanic_64()

