import os
from PIL import Image, ImageDraw

def create_explosive_crate_64():
    logical_size = 16
    scale = 4
    width = logical_size * scale
    height = logical_size * scale

    # 16-Bit Stylized Demolition Palette
    # Red demolition box body
    RED_SHADOW   = (110, 16, 20, 255)  # Deep crimson panel shadow
    RED_DARK     = (160, 22, 28, 255)  # Dark red plate
    RED_MID      = (215, 34, 40, 255)  # Vibrant primary red
    RED_LIGHT    = (245, 75, 80, 255)  # Top edge bevel highlight

    # Metallic steel corner reinforcements & rivets
    STEEL_DARK   = (38, 42, 54, 255)   # Tempered iron shadow
    STEEL_MID    = (88, 96, 118, 255)  # Cold steel bracket
    STEEL_LIGHT  = (168, 180, 206, 255)# Steel highlight edge
    STEEL_RIVET  = (230, 240, 255, 255)# Specular rivet bolt

    # Yellow Hazard Danger Stripes
    HAZARD_DARK  = (22, 20, 28, 255)   # Deep charcoal stripe
    HAZARD_MID   = (245, 195, 20, 255) # Saturated warning yellow
    HAZARD_LIGHT = (254, 235, 110, 255)# Bright yellow stripe crest

    # Top-mounted Fuse & Ignition Spark
    FUSE_CORD    = (165, 120, 65, 255) # Twisted hemp twine cord
    FUSE_GROMMET = (195, 145, 35, 255) # Brass/iron socket cap
    SPARK_ORANGE = (255, 110, 15, 255) # Burning ember
    SPARK_YELLOW = (255, 225, 40, 255) # Incandescent core
    SPARK_WHITE  = (255, 255, 255, 255)# Blinding ignition ping

    # Start with isolated transparent canvas
    grid = [[(0, 0, 0, 0) for _ in range(logical_size)] for _ in range(logical_size)]

    def px(x, y, color):
        if 0 <= x < logical_size and 0 <= y < logical_size:
            grid[y][x] = color

    # -------------------------------------------------------------
    # 1. MAIN CRATE BOX BODY (Cols 1 to 14, Rows 3 to 15)
    # Leaves transparent border margin and headroom for top fuse
    # -------------------------------------------------------------
    for y in range(3, 16):
        for x in range(1, 15):
            grid[y][x] = RED_MID

    # Bottom shadow & top highlight for 3D box depth
    for x in range(1, 15):
        grid[3][x] = RED_LIGHT
        grid[15][x] = RED_SHADOW
    for y in range(3, 16):
        grid[y][1] = RED_LIGHT
        grid[y][14] = RED_SHADOW

    # Horizontal panel dividing seams
    for x in range(2, 14):
        grid[6][x] = RED_DARK
        grid[12][x] = RED_DARK

    # -------------------------------------------------------------
    # 2. DIAGONAL YELLOW DANGER STRIPES (Rows 7 to 11)
    # High-contrast alternating 45-degree yellow/charcoal hazard bands
    # -------------------------------------------------------------
    for y in range(7, 12):
        for x in range(2, 14):
            # Alternating diagonal bands: (x + y) % 4
            band = (x + y) % 4
            if band < 2:
                # Yellow hazard stripe with top highlight
                grid[y][x] = HAZARD_LIGHT if band == 0 else HAZARD_MID
            else:
                # Charcoal hazard stripe
                grid[y][x] = HAZARD_DARK

    # Hazard band top and bottom steel rail borders
    for x in range(1, 15):
        grid[6][x] = STEEL_DARK
        grid[12][x] = STEEL_DARK

    # -------------------------------------------------------------
    # 3. METALLIC STEEL REINFORCEMENT CORNER BRACKETS & RIVETS
    # Heavy L-shaped steel angle irons protecting all 4 corners
    # -------------------------------------------------------------
    # Top-Left Bracket
    px(1, 3, STEEL_LIGHT); px(2, 3, STEEL_LIGHT); px(3, 3, STEEL_MID); px(4, 3, STEEL_MID)
    px(1, 4, STEEL_LIGHT); px(2, 4, STEEL_RIVET); px(1, 5, STEEL_MID); px(1, 6, STEEL_MID)

    # Top-Right Bracket
    px(11, 3, STEEL_MID); px(12, 3, STEEL_MID); px(13, 3, STEEL_LIGHT); px(14, 3, STEEL_DARK)
    px(13, 4, STEEL_RIVET); px(14, 4, STEEL_DARK); px(14, 5, STEEL_MID); px(14, 6, STEEL_DARK)

    # Bottom-Left Bracket
    px(1, 12, STEEL_MID); px(1, 13, STEEL_LIGHT); px(1, 14, STEEL_LIGHT); px(1, 15, STEEL_DARK)
    px(2, 14, STEEL_RIVET); px(2, 15, STEEL_DARK); px(3, 15, STEEL_MID); px(4, 15, STEEL_DARK)

    # Bottom-Right Bracket
    px(14, 12, STEEL_DARK); px(14, 13, STEEL_MID); px(14, 14, STEEL_DARK); px(14, 15, STEEL_DARK)
    px(13, 14, STEEL_RIVET); px(13, 15, STEEL_DARK); px(12, 15, STEEL_DARK); px(11, 15, STEEL_MID)

    # Center-side reinforcement brackets & rivets
    px(1, 9, STEEL_MID);  px(2, 9, STEEL_RIVET)
    px(14, 9, STEEL_MID); px(13, 9, STEEL_RIVET)

    # -------------------------------------------------------------
    # 4. TOP-MOUNTED FUSE & IGNITION SPARK
    # Brass grommet at crate top center, twisting fuse cord, burning spark
    # -------------------------------------------------------------
    # Brass cap on crate top
    px(7, 3, FUSE_GROMMET); px(8, 3, FUSE_GROMMET)

    # S-curved twisting fuse cord (Rows 1-2)
    px(7, 2, FUSE_CORD)
    px(8, 2, FUSE_CORD)
    px(8, 1, FUSE_CORD)
    px(9, 1, FUSE_CORD)

    # Burning ignition spark at fuse tip (Row 0)
    px(9, 0, SPARK_WHITE)  # Blinding white ignition center
    px(10, 0, SPARK_YELLOW)
    px(8, 0, SPARK_ORANGE)
    px(10, 1, SPARK_ORANGE) # Flying spark fleck
    px(7, 0, SPARK_ORANGE)  # Spark fleck

    # -------------------------------------------------------------
    # 5. RENDER 64x64 SPRITE
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

    # Save target in blocks
    target_path = "public/assets/blocks/tnt.png"
    os.makedirs(os.path.dirname(target_path), exist_ok=True)
    img.save(target_path, "PNG")
    print(f"Saved 64x64 explosive crate sprite to {target_path}")

    # Also save to root
    img.save("explosive_crate_64.png", "PNG")
    print("Saved explosive_crate_64.png to root.")

if __name__ == "__main__":
    create_explosive_crate_64()

