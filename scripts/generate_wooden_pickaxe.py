import os
from PIL import Image, ImageDraw

def create_wooden_pickaxe_128():
    width, height = 128, 128
    img = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Scale: 32x32 logical pixel grid scaled by 4 = 128x128 px
    scale = 4

    def px(x, y, color):
        draw.rectangle([x * scale, y * scale, (x + 1) * scale - 1, (y + 1) * scale - 1], fill=color)

    # 16-Bit Chunky Wood & Twine Color Palette
    # Timber handle colors
    HANDLE_DARK   = (65, 38, 18, 255)   # Deep bark outline / shadow
    HANDLE_BASE   = (118, 70, 36, 255)  # Medium weathered timber
    HANDLE_MID    = (148, 92, 48, 255)  # Warm wood core
    HANDLE_LIGHT  = (182, 118, 64, 255) # Top edge light
    HANDLE_GRAIN  = (92, 54, 26, 255)   # Natural wood rings/grain

    # Carved wood head colors
    HEAD_DARK     = (78, 44, 20, 255)   # Dark bottom silhouette
    HEAD_BASE     = (135, 78, 38, 255)  # Hewn log base
    HEAD_MID      = (164, 102, 52, 255) # Carved face
    HEAD_LIGHT    = (202, 134, 76, 255) # Top beveled highlight
    HEAD_TIP_HI   = (226, 160, 98, 255) # Sharp chiseled tip glint

    # Primitive binding twine / rope colors
    TWINE_DARK    = (140, 105, 55, 255) # Shadow under rope
    TWINE_BASE    = (192, 150, 85, 255) # Natural jute twine
    TWINE_LIGHT   = (230, 195, 125, 255)# Twine highlight knot

    # -------------------------------------------------------------
    # 1. HANDLE (Diagonal 45 degrees, from bottom-left to center-top)
    # Logical line from (7, 24) to (20, 11)
    # Width of 2-3 logical pixels with beveled lighting and bark shadow
    # -------------------------------------------------------------
    for i in range(16):
        hx = 6 + i
        hy = 25 - i

        # Bark shadow on bottom-right side
        px(hx + 1, hy, HANDLE_DARK)
        px(hx, hy + 1, HANDLE_DARK)

        # Core timber body
        px(hx, hy, HANDLE_MID)
        px(hx - 1, hy, HANDLE_BASE)

        # Light edge on top-left
        px(hx - 1, hy - 1, HANDLE_LIGHT)

        # Occasional wood grain notches
        if i in [3, 7, 12]:
            px(hx, hy, HANDLE_GRAIN)

    # Rounded timber butt-end (pommel)
    px(5, 26, HANDLE_DARK)
    px(6, 26, HANDLE_BASE)
    px(5, 25, HANDLE_MID)
    px(4, 25, HANDLE_DARK)

    # -------------------------------------------------------------
    # 2. CARVED WOODEN PICKAXE HEAD
    # Arched hewn log blade centered around (21, 10)
    # Sweeping from upper-left tip (13, 5) down to lower-right tip (26, 18)
    # -------------------------------------------------------------
    
    # Left Pick Blade (Upper curve)
    # Tip (13, 5)
    px(12, 5, HEAD_DARK)
    px(13, 5, HEAD_TIP_HI)
    px(13, 6, HEAD_DARK)

    # Curve leading to socket
    left_blade = [
        (14, 5, HEAD_LIGHT), (14, 6, HEAD_MID), (14, 7, HEAD_DARK),
        (15, 6, HEAD_LIGHT), (15, 7, HEAD_MID), (15, 8, HEAD_DARK),
        (16, 6, HEAD_LIGHT), (16, 7, HEAD_MID), (16, 8, HEAD_BASE), (16, 9, HEAD_DARK),
        (17, 7, HEAD_LIGHT), (17, 8, HEAD_MID), (17, 9, HEAD_BASE), (17, 10, HEAD_DARK),
        (18, 7, HEAD_LIGHT), (18, 8, HEAD_MID), (18, 9, HEAD_BASE),
        (19, 8, HEAD_LIGHT), (19, 9, HEAD_MID), (19, 10, HEAD_BASE)
    ]
    for bx, by, col in left_blade:
        px(bx, by, col)

    # Central Socket / Collar (where handle meets head)
    socket = [
        (20, 8, HEAD_LIGHT), (20, 9, HEAD_MID), (20, 10, HEAD_BASE), (20, 11, HEAD_DARK),
        (21, 9, HEAD_LIGHT), (21, 10, HEAD_MID), (21, 11, HEAD_BASE), (21, 12, HEAD_DARK),
        (22, 10, HEAD_LIGHT), (22, 11, HEAD_MID), (22, 12, HEAD_BASE)
    ]
    for bx, by, col in socket:
        px(bx, by, col)

    # Right Pick Blade (Lower curve)
    right_blade = [
        (22, 11, HEAD_LIGHT), (22, 12, HEAD_MID), (22, 13, HEAD_BASE),
        (23, 12, HEAD_LIGHT), (23, 13, HEAD_MID), (23, 14, HEAD_BASE), (23, 15, HEAD_DARK),
        (24, 13, HEAD_LIGHT), (24, 14, HEAD_MID), (24, 15, HEAD_DARK),
        (25, 14, HEAD_LIGHT), (25, 15, HEAD_MID), (25, 16, HEAD_DARK),
        (26, 16, HEAD_LIGHT), (26, 17, HEAD_MID), (26, 18, HEAD_DARK)
    ]
    for bx, by, col in right_blade:
        px(bx, by, col)

    # Right Tip (27, 18)
    px(27, 17, HEAD_LIGHT)
    px(27, 18, HEAD_TIP_HI)
    px(28, 18, HEAD_DARK)
    px(27, 19, HEAD_DARK)

    # Chiseled wood chips & notches in head
    px(16, 7, HEAD_DARK) # Notch on left blade
    px(24, 14, HEAD_DARK)# Notch on right blade

    # -------------------------------------------------------------
    # 3. PRIMITIVE TWINE / ROPE BINDING WRAPS
    # Criss-cross lashings binding the wooden head to the shaft at (20, 10)
    # -------------------------------------------------------------
    twine_pixels = [
        # First diagonal wrap (top-left to bottom-right across collar)
        (19, 9, TWINE_LIGHT),
        (20, 9, TWINE_BASE),
        (20, 10, TWINE_LIGHT),
        (21, 10, TWINE_BASE),
        (21, 11, TWINE_LIGHT),
        (22, 11, TWINE_BASE),

        # Counter diagonal wrap (cross lashing)
        (21, 9, TWINE_LIGHT),
        (20, 10, TWINE_LIGHT), # Overlap knot
        (20, 11, TWINE_BASE),
        (19, 11, TWINE_DARK),
        (21, 12, TWINE_DARK),

        # Tight rope loop beneath collar
        (19, 10, TWINE_BASE),
        (18, 11, TWINE_DARK),
        (22, 10, TWINE_BASE),

        # Twine knot detail / hanging thread tip
        (19, 12, TWINE_BASE),
        (18, 13, TWINE_LIGHT)
    ]
    for tx, ty, tcol in twine_pixels:
        px(tx, ty, tcol)

    # -------------------------------------------------------------
    # 4. SAVE OUTPUTS
    # -------------------------------------------------------------
    target_path = "public/assets/pickaxes/pickaxe_wood.png"
    os.makedirs(os.path.dirname(target_path), exist_ok=True)
    img.save(target_path, "PNG")
    print(f"Generated 128x128 wooden pickaxe at {target_path}")

    # Also save to current directory for user review
    img.save("pickaxe_wood_128.png", "PNG")
    print("Generated pickaxe_wood_128.png in root.")

if __name__ == "__main__":
    create_wooden_pickaxe_128()

