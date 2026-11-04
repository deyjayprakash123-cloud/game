import os
from PIL import Image, ImageDraw

def create_iron_pickaxe_128():
    width, height = 128, 128
    img = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # 32x32 logical pixel grid scaled by 4 = 128x128 px
    scale = 4

    def px(x, y, color):
        draw.rectangle([x * scale, y * scale, (x + 1) * scale - 1, (y + 1) * scale - 1], fill=color)

    # 16-Bit Metallic Steel & Polished Reinforced Handle Palette
    # Polished dark wood handle
    WOOD_DARK    = (36, 20, 14, 255)   # Deep mahogany shadow
    WOOD_BASE    = (72, 40, 24, 255)   # Polished dark timber
    WOOD_MID     = (110, 64, 38, 255)  # Warm wood core
    WOOD_LIGHT   = (150, 92, 54, 255)  # Smooth lacquer highlight

    # Steel / Iron fittings along handle
    BAND_DARK    = (48, 54, 68, 255)   # Steel shadow
    BAND_MID     = (112, 124, 146, 255)# Brushed iron band
    BAND_LIGHT   = (190, 204, 226, 255)# Steel specular highlight

    # Forged Silver-Metallic Steel Pickaxe Head
    STEEL_DARK   = (44, 50, 66, 255)   # Tempered steel shadow outline
    STEEL_BASE   = (86, 98, 124, 255)  # Shadowed steel face
    STEEL_MID    = (142, 158, 188, 255)# Cold forged silver-steel
    STEEL_LIGHT  = (202, 218, 242, 255)# Polished metallic bevel
    STEEL_GLINT  = (255, 255, 255, 255)# Pure white glint / specular reflection

    # -------------------------------------------------------------
    # 1. POLISHED HANDLE WITH STEEL REINFORCEMENT BANDS
    # Line from (6, 25) to (19, 12)
    # -------------------------------------------------------------
    for i in range(15):
        hx = 6 + i
        hy = 25 - i

        # Check for iron reinforcement ring bands at i=3, i=7, i=11
        if i in [3, 7, 11]:
            px(hx + 1, hy, BAND_DARK)
            px(hx, hy + 1, BAND_DARK)
            px(hx, hy, BAND_MID)
            px(hx - 1, hy, BAND_LIGHT)
            px(hx - 1, hy - 1, STEEL_GLINT)
        else:
            # Polished dark timber
            px(hx + 1, hy, WOOD_DARK)
            px(hx, hy + 1, WOOD_DARK)
            px(hx, hy, WOOD_MID)
            px(hx - 1, hy, WOOD_BASE)
            px(hx - 1, hy - 1, WOOD_LIGHT)

    # Steel counter-weight pommel butt
    px(5, 26, BAND_DARK)
    px(6, 26, BAND_MID)
    px(5, 25, BAND_LIGHT)
    px(4, 25, BAND_DARK)
    px(4, 26, STEEL_GLINT)

    # -------------------------------------------------------------
    # 2. FORGED SILVER-METALLIC STEEL HEAD
    # Center socket at (20, 11)
    # Sweeping from upper-left pick tip (11, 4) down to lower-right chisel tip (28, 19)
    # Sleek, sharp, tapered blade geometry with clean metallic bevels
    # -------------------------------------------------------------

    # Left Pick Blade (Upper curved blade)
    # Sharp piercing tip (11, 4)
    px(10, 4, STEEL_DARK)
    px(11, 4, STEEL_GLINT) # Specular glint
    px(11, 5, STEEL_DARK)

    left_blade = [
        # Tip bevel
        (12, 4, STEEL_LIGHT), (12, 5, STEEL_MID), (12, 6, STEEL_DARK),
        (13, 5, STEEL_LIGHT), (13, 6, STEEL_MID), (13, 7, STEEL_DARK),
        # Polished blade body with chamfered ridge
        (14, 5, STEEL_GLINT), (14, 6, STEEL_LIGHT), (14, 7, STEEL_MID), (14, 8, STEEL_DARK),
        (15, 6, STEEL_LIGHT), (15, 7, STEEL_LIGHT), (15, 8, STEEL_BASE), (15, 9, STEEL_DARK),
        (16, 6, STEEL_GLINT), (16, 7, STEEL_LIGHT), (16, 8, STEEL_MID), (16, 9, STEEL_BASE), (16, 10, STEEL_DARK),
        (17, 7, STEEL_LIGHT), (17, 8, STEEL_LIGHT), (17, 9, STEEL_MID), (17, 10, STEEL_BASE),
        (18, 7, STEEL_LIGHT), (18, 8, STEEL_MID), (18, 9, STEEL_MID), (18, 10, STEEL_BASE),
        (19, 8, STEEL_LIGHT), (19, 9, STEEL_MID), (19, 10, STEEL_BASE)
    ]
    for bx, by, col in left_blade:
        px(bx, by, col)

    # Solid Steel Center Socket / Socket Head
    socket_block = [
        (19, 7, STEEL_LIGHT), (20, 7, STEEL_GLINT), (21, 8, STEEL_LIGHT),
        (20, 8, STEEL_LIGHT), (20, 9, STEEL_MID),   (20, 10, STEEL_BASE), (20, 11, STEEL_DARK), (20, 12, STEEL_DARK),
        (21, 9, STEEL_LIGHT), (21, 10, STEEL_MID),  (21, 11, STEEL_BASE), (21, 12, STEEL_DARK),
        (22, 9, STEEL_LIGHT), (22, 10, STEEL_MID),  (22, 11, STEEL_BASE), (22, 12, STEEL_DARK)
    ]
    for bx, by, col in socket_block:
        px(bx, by, col)

    # Right Pick Blade (Lower curved blade)
    right_blade = [
        (23, 10, STEEL_LIGHT), (23, 11, STEEL_MID),  (23, 12, STEEL_BASE), (23, 13, STEEL_DARK),
        (24, 11, STEEL_LIGHT), (24, 12, STEEL_LIGHT),(24, 13, STEEL_MID),  (24, 14, STEEL_DARK),
        (25, 12, STEEL_GLINT), (25, 13, STEEL_LIGHT),(25, 14, STEEL_MID),  (25, 15, STEEL_DARK),
        (26, 13, STEEL_LIGHT), (26, 14, STEEL_MID),  (26, 15, STEEL_BASE), (26, 16, STEEL_DARK),
        (27, 15, STEEL_LIGHT), (27, 16, STEEL_MID),  (27, 17, STEEL_BASE), (27, 18, STEEL_DARK)
    ]
    for bx, by, col in right_blade:
        px(bx, by, col)

    # Right Chisel Tip (28, 18)
    px(28, 17, STEEL_LIGHT)
    px(28, 18, STEEL_GLINT) # Specular glint
    px(29, 18, STEEL_DARK)
    px(28, 19, STEEL_DARK)

    # -------------------------------------------------------------
    # 3. METALLIC SPECULAR ACCENTS & STEEL RIVETS
    # Bright diagonal glint running across the forged upper ridge
    # -------------------------------------------------------------
    glints = [
        (13, 5, STEEL_GLINT),
        (14, 5, STEEL_GLINT),
        (17, 7, STEEL_GLINT),
        (20, 7, STEEL_GLINT), # Central crown glint
        (21, 8, STEEL_GLINT),
        (24, 11, STEEL_GLINT),
        (25, 12, STEEL_GLINT)
    ]
    for gx, gy, col in glints:
        px(gx, gy, col)

    # Socket heavy steel bolt rivet
    px(20, 9, STEEL_GLINT)
    px(21, 9, BAND_MID)
    px(20, 10, BAND_DARK)

    # Steel collar bracket wrap
    px(19, 11, BAND_MID)
    px(20, 11, BAND_LIGHT)
    px(21, 11, BAND_MID)
    px(22, 12, BAND_DARK)

    # -------------------------------------------------------------
    # 4. SAVE OUTPUTS
    # -------------------------------------------------------------
    target_path = "public/assets/pickaxes/pickaxe_iron.png"
    os.makedirs(os.path.dirname(target_path), exist_ok=True)
    img.save(target_path, "PNG")
    print(f"Generated 128x128 iron pickaxe at {target_path}")

    # Also save to root
    img.save("pickaxe_iron_128.png", "PNG")
    print("Generated pickaxe_iron_128.png in root.")

if __name__ == "__main__":
    create_iron_pickaxe_128()

