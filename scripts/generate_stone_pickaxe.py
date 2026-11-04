import os
from PIL import Image, ImageDraw

def create_stone_pickaxe_128():
    width, height = 128, 128
    img = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # 32x32 logical pixel grid scaled by 4 = 128x128 px
    scale = 4

    def px(x, y, color):
        draw.rectangle([x * scale, y * scale, (x + 1) * scale - 1, (y + 1) * scale - 1], fill=color)

    # 16-Bit Chunky Dark Timber & Chipped Cobblestone Palette
    # Dark wooden shaft
    SHAFT_DARK   = (42, 24, 12, 255)   # Deep bark shadow
    SHAFT_BASE   = (78, 46, 24, 255)   # Dark timber
    SHAFT_MID    = (108, 66, 36, 255)  # Aged dark oak body
    SHAFT_LIGHT  = (142, 90, 50, 255)  # Top edge rim light
    SHAFT_GRAIN  = (60, 34, 18, 255)   # Timber notch

    # Chipped Cobblestone Head (Slightly larger, chunkier silhouette than wood)
    STONE_DARK   = (44, 46, 54, 255)   # Deep fissure / shadow outline
    STONE_BASE   = (78, 81, 94, 255)   # Shadowed cobblestone
    STONE_MID    = (118, 122, 136, 255)# Main slate rock body
    STONE_LIGHT  = (164, 168, 182, 255)# Beveled rock highlight
    STONE_TIP_HI = (208, 214, 228, 255)# Sharp chiseled tip glint
    STONE_CRACK  = (32, 33, 40, 255)   # Fracture lines

    # Heavy iron collar & leather binding
    COLLAR_DARK  = (36, 38, 46, 255)
    COLLAR_MID   = (84, 88, 102, 255)
    COLLAR_LIGHT = (145, 150, 168, 255)
    BIND_STRAP   = (58, 38, 22, 255)

    # -------------------------------------------------------------
    # 1. DARK WOODEN SHAFT (Diagonal 45 degrees, robust sturdy timber)
    # Line from (6, 25) to (19, 12)
    # -------------------------------------------------------------
    for i in range(15):
        hx = 6 + i
        hy = 25 - i

        # Shadow side
        px(hx + 1, hy, SHAFT_DARK)
        px(hx, hy + 1, SHAFT_DARK)

        # Core timber
        px(hx, hy, SHAFT_MID)
        px(hx - 1, hy, SHAFT_BASE)

        # Highlight edge
        px(hx - 1, hy - 1, SHAFT_LIGHT)

        # Weathered dark timber grain
        if i in [4, 8, 11]:
            px(hx, hy, SHAFT_GRAIN)

    # Sturdy squared butt pommel
    px(5, 26, SHAFT_DARK)
    px(6, 26, SHAFT_BASE)
    px(5, 25, SHAFT_MID)
    px(4, 25, SHAFT_DARK)
    px(4, 26, SHAFT_DARK)

    # -------------------------------------------------------------
    # 2. CHIPPED GREY COBBLESTONE HEAD (Heavier, bulkier arched silhouette)
    # Center socket at (20, 11)
    # Sweeps from left pick tip (11, 4) down to right chisel pick tip (28, 19)
    # -------------------------------------------------------------

    # Left Pick Blade (Upper heavy horn)
    # Tip (11, 4)
    px(10, 4, STONE_DARK)
    px(11, 4, STONE_TIP_HI)
    px(11, 5, STONE_DARK)

    left_blade = [
        # Sub-tip chisel bevel
        (12, 4, STONE_LIGHT), (12, 5, STONE_MID), (12, 6, STONE_DARK),
        (13, 5, STONE_LIGHT), (13, 6, STONE_MID), (13, 7, STONE_DARK),
        # Body widening
        (14, 5, STONE_LIGHT), (14, 6, STONE_MID), (14, 7, STONE_BASE), (14, 8, STONE_DARK),
        (15, 6, STONE_LIGHT), (15, 7, STONE_MID), (15, 8, STONE_BASE), (15, 9, STONE_DARK),
        (16, 6, STONE_LIGHT), (16, 7, STONE_LIGHT), (16, 8, STONE_MID), (16, 9, STONE_BASE), (16, 10, STONE_DARK),
        (17, 7, STONE_LIGHT), (17, 8, STONE_MID), (17, 9, STONE_BASE), (17, 10, STONE_DARK),
        (18, 7, STONE_LIGHT), (18, 8, STONE_MID), (18, 9, STONE_BASE), (18, 10, STONE_BASE),
        (19, 8, STONE_LIGHT), (19, 9, STONE_MID), (19, 10, STONE_BASE)
    ]
    for bx, by, col in left_blade:
        px(bx, by, col)

    # Heavy Central Cobblestone Hub / Collar Socket
    socket_block = [
        (19, 7, STONE_LIGHT), (20, 7, STONE_LIGHT), (21, 8, STONE_LIGHT),
        (20, 8, STONE_MID),   (20, 9, STONE_MID),   (20, 10, STONE_BASE), (20, 11, STONE_DARK), (20, 12, STONE_DARK),
        (21, 9, STONE_MID),   (21, 10, STONE_MID),  (21, 11, STONE_BASE), (21, 12, STONE_DARK),
        (22, 9, STONE_LIGHT), (22, 10, STONE_MID),  (22, 11, STONE_BASE), (22, 12, STONE_DARK)
    ]
    for bx, by, col in socket_block:
        px(bx, by, col)

    # Right Pick Blade (Lower thick horn)
    right_blade = [
        (23, 10, STONE_LIGHT), (23, 11, STONE_MID), (23, 12, STONE_BASE), (23, 13, STONE_DARK),
        (24, 11, STONE_LIGHT), (24, 12, STONE_MID), (24, 13, STONE_BASE), (24, 14, STONE_DARK),
        (25, 12, STONE_LIGHT), (25, 13, STONE_MID), (25, 14, STONE_BASE), (25, 15, STONE_DARK),
        (26, 13, STONE_LIGHT), (26, 14, STONE_MID), (26, 15, STONE_BASE), (26, 16, STONE_DARK),
        (27, 15, STONE_LIGHT), (27, 16, STONE_MID), (27, 17, STONE_BASE), (27, 18, STONE_DARK)
    ]
    for bx, by, col in right_blade:
        px(bx, by, col)

    # Right Tip (28, 18)
    px(28, 17, STONE_LIGHT)
    px(28, 18, STONE_TIP_HI)
    px(29, 18, STONE_DARK)
    px(28, 19, STONE_DARK)

    # -------------------------------------------------------------
    # 3. CHIPPED CRACKS, FRACTURES & STONE TEXTURE
    # Natural cobblestone weathering and chisel notches
    # -------------------------------------------------------------
    cracks = [
        (15, 7, STONE_CRACK), (15, 8, STONE_DARK),  # Left horn fissure
        (18, 9, STONE_CRACK),                       # Hub stress fracture
        (22, 11, STONE_CRACK), (23, 11, STONE_DARK),# Right horn fracture
        (25, 13, STONE_CRACK),                      # Chipped facet notch
        (17, 8, STONE_LIGHT)                        # Raised stone ridge highlight
    ]
    for cx, cy, col in cracks:
        px(cx, cy, col)

    # -------------------------------------------------------------
    # 4. REINFORCED METAL / LEATHER SOCKET WEDGES
    # Securing the heavy stone head onto the dark timber shaft
    # -------------------------------------------------------------
    iron_fittings = [
        # Upper metal bracket
        (20, 9, COLLAR_LIGHT), (21, 9, COLLAR_MID), (21, 10, COLLAR_DARK),
        # Lower leather binding strap
        (19, 11, BIND_STRAP), (20, 11, COLLAR_MID), (21, 11, COLLAR_LIGHT), (22, 12, BIND_STRAP),
        (19, 12, BIND_STRAP), (20, 12, COLLAR_DARK),
        # Rivet stud
        (20, 10, COLLAR_LIGHT)
    ]
    for fx, fy, col in iron_fittings:
        px(fx, fy, col)

    # -------------------------------------------------------------
    # 5. SAVE OUTPUTS
    # -------------------------------------------------------------
    target_path = "public/assets/pickaxes/pickaxe_stone.png"
    os.makedirs(os.path.dirname(target_path), exist_ok=True)
    img.save(target_path, "PNG")
    print(f"Generated 128x128 stone pickaxe at {target_path}")

    # Also save to root
    img.save("pickaxe_stone_128.png", "PNG")
    print("Generated pickaxe_stone_128.png in root.")

if __name__ == "__main__":
    create_stone_pickaxe_128()

