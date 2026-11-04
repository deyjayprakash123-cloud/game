import os
from PIL import Image, ImageDraw

def create_wheel_icons():
    scale = 4
    size = 32 * scale # 128x128 px
    logical_size = 32

    # Output directory
    ui_dir = "public/assets/ui"
    os.makedirs(ui_dir, exist_ok=True)

    # -----------------------------------------------------------------
    # ICON 1: GOLDEN PICKAXE ICON
    # -----------------------------------------------------------------
    img1 = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d1 = ImageDraw.Draw(img1)

    GOLD_DARK    = (148, 92, 16, 255)
    GOLD_BASE    = (198, 140, 22, 255)
    GOLD_MID     = (245, 190, 30, 255)
    GOLD_LIGHT   = (255, 232, 90, 255)
    GOLD_GLINT   = (255, 255, 255, 255)

    WOOD_DARK    = (48, 28, 18, 255)
    WOOD_MID     = (112, 68, 40, 255)
    WOOD_LIGHT   = (162, 102, 62, 255)

    def px1(x, y, col):
        d1.rectangle([x * scale, y * scale, (x + 1) * scale - 1, (y + 1) * scale - 1], fill=col)

    # Handle (diagonal 45 deg) from (8, 24) to (19, 13)
    for i in range(13):
        hx = 8 + i
        hy = 24 - i
        px1(hx + 1, hy, WOOD_DARK)
        px1(hx, hy + 1, WOOD_DARK)
        px1(hx, hy, WOOD_MID)
        px1(hx - 1, hy, WOOD_LIGHT)
        # Gold ring collars
        if i in [2, 6, 10]:
            px1(hx, hy, GOLD_MID)
            px1(hx - 1, hy, GOLD_LIGHT)

    # Golden pommel
    px1(7, 25, GOLD_BASE)
    px1(8, 25, GOLD_MID)
    px1(7, 24, GOLD_LIGHT)
    px1(6, 24, GOLD_DARK)

    # Curved Golden Pickaxe Head
    # Left tip (10, 6)
    px1(9, 6, GOLD_DARK); px1(10, 6, GOLD_GLINT); px1(10, 7, GOLD_DARK)
    left_blade = [
        (11, 6, GOLD_LIGHT), (11, 7, GOLD_MID), (11, 8, GOLD_DARK),
        (12, 7, GOLD_LIGHT), (12, 8, GOLD_MID), (12, 9, GOLD_DARK),
        (13, 7, GOLD_GLINT), (13, 8, GOLD_LIGHT), (13, 9, GOLD_MID), (13, 10, GOLD_DARK),
        (14, 8, GOLD_LIGHT), (14, 9, GOLD_MID), (14, 10, GOLD_BASE),
        (15, 8, GOLD_LIGHT), (15, 9, GOLD_MID), (15, 10, GOLD_BASE),
        (16, 9, GOLD_LIGHT), (16, 10, GOLD_MID), (16, 11, GOLD_BASE),
        (17, 9, GOLD_LIGHT), (17, 10, GOLD_MID), (17, 11, GOLD_BASE),
        (18, 10, GOLD_LIGHT), (18, 11, GOLD_MID), (18, 12, GOLD_BASE)
    ]
    for bx, by, c in left_blade: px1(bx, by, c)

    # Center socket & golden crown
    socket = [
        (18, 9, GOLD_LIGHT), (19, 9, GOLD_GLINT), (20, 10, GOLD_LIGHT),
        (19, 10, GOLD_LIGHT), (19, 11, GOLD_MID), (19, 12, GOLD_BASE), (19, 13, GOLD_DARK),
        (20, 11, GOLD_LIGHT), (20, 12, GOLD_MID), (20, 13, GOLD_BASE),
        (21, 11, GOLD_LIGHT), (21, 12, GOLD_MID), (21, 13, GOLD_DARK)
    ]
    for bx, by, c in socket: px1(bx, by, c)

    # Right blade
    right_blade = [
        (22, 12, GOLD_LIGHT), (22, 13, GOLD_MID), (22, 14, GOLD_BASE),
        (23, 13, GOLD_LIGHT), (23, 14, GOLD_MID), (23, 15, GOLD_DARK),
        (24, 14, GOLD_GLINT), (24, 15, GOLD_LIGHT), (24, 16, GOLD_DARK),
        (25, 16, GOLD_LIGHT), (25, 17, GOLD_MID), (25, 18, GOLD_DARK)
    ]
    for bx, by, c in right_blade: px1(bx, by, c)

    # Right tip (26, 19)
    px1(26, 18, GOLD_LIGHT); px1(26, 19, GOLD_GLINT); px1(27, 19, GOLD_DARK); px1(26, 20, GOLD_DARK)

    # Extra glint sparkles
    px1(12, 7, GOLD_GLINT); px1(19, 9, GOLD_GLINT); px1(23, 13, GOLD_GLINT)

    img1.save(f"{ui_dir}/icon_golden_pickaxe.png", "PNG")
    img1.save("icon_golden_pickaxe_128.png", "PNG")
    print("Generated icon_golden_pickaxe.png")

    # -----------------------------------------------------------------
    # ICON 2: DANGER SKULL
    # -----------------------------------------------------------------
    img2 = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d2 = ImageDraw.Draw(img2)

    BONE_DARK   = (40, 36, 48, 255)   # Outline shadow
    BONE_SHADOW = (130, 124, 142, 255)# Shaded bone
    BONE_MID    = (198, 192, 210, 255)# Ivory skull
    BONE_LIGHT  = (240, 236, 248, 255)# Highlight
    BONE_HI     = (255, 255, 255, 255)# Specular peak
    EYE_BLACK   = (20, 16, 26, 255)   # Void
    EYE_EMBER   = (255, 60, 40, 255)  # Sinister red eye glint

    def px2(x, y, col):
        d2.rectangle([x * scale, y * scale, (x + 1) * scale - 1, (y + 1) * scale - 1], fill=col)

    # Crossed Bones Behind Skull
    bone_coords = [
        # Top-left bone
        (6, 6), (7, 6), (6, 7), (8, 7), (9, 8), (10, 9), (11, 10),
        # Top-right bone
        (25, 6), (24, 6), (25, 7), (23, 7), (22, 8), (21, 9), (20, 10),
        # Bottom-left bone
        (6, 25), (7, 25), (6, 24), (8, 24), (9, 23), (10, 22), (11, 21),
        # Bottom-right bone
        (25, 25), (24, 25), (25, 24), (23, 24), (22, 23), (21, 22), (20, 21)
    ]
    for bx, by in bone_coords:
        px2(bx, by, BONE_MID)
        px2(bx - 1, by, BONE_LIGHT)
        px2(bx + 1, by + 1, BONE_DARK)

    # Cranium (Rows 7 to 17, Cols 9 to 22)
    for y in range(8, 18):
        for x in range(10, 22):
            px2(x, y, BONE_MID)

    # Cranium rounded contours & highlight
    for x in range(12, 20): px2(x, 7, BONE_LIGHT)
    for x in range(13, 19): px2(x, 7, BONE_HI)
    px2(10, 8, BONE_LIGHT); px2(11, 8, BONE_HI)
    px2(21, 8, BONE_SHADOW); px2(22, 9, BONE_DARK)

    # Left cheek / temple
    for y in range(9, 16): px2(9, y, BONE_LIGHT)
    # Right cheek / temple
    for y in range(9, 16): px2(22, y, BONE_SHADOW)

    # Skull Eye Sockets (Dark hollow voids)
    # Left eye (11..14, 12..15)
    for y in range(12, 16):
        for x in range(11, 15):
            px2(x, y, EYE_BLACK)
    px2(13, 13, EYE_EMBER) # Sinister glowing eye ember

    # Right eye (17..20, 12..15)
    for y in range(12, 16):
        for x in range(17, 21):
            px2(x, y, EYE_BLACK)
    px2(18, 13, EYE_EMBER)

    # Nasal Cavity (Inverted triangle at 15..16, 16..17)
    px2(15, 16, EYE_BLACK); px2(16, 16, EYE_BLACK)
    px2(15, 17, EYE_BLACK); px2(16, 17, EYE_BLACK)
    px2(15, 18, BONE_DARK); px2(16, 18, BONE_DARK)

    # Maxilla & Teeth (Rows 18 to 23, Cols 12 to 19)
    for y in range(19, 23):
        for x in range(12, 20):
            px2(x, y, BONE_MID)

    # Tooth dividers
    for y in range(19, 23):
        px2(14, y, BONE_DARK)
        px2(17, y, BONE_DARK)
    for x in range(12, 20):
        px2(x, 21, BONE_DARK) # Horizontal bite line

    # Tooth highlights
    px2(12, 19, BONE_HI); px2(13, 19, BONE_LIGHT)
    px2(15, 19, BONE_HI); px2(16, 19, BONE_LIGHT)
    px2(18, 19, BONE_HI); px2(19, 19, BONE_LIGHT)

    # Outer border shadow
    for x in range(12, 20): px2(x, 23, BONE_DARK)

    img2.save(f"{ui_dir}/icon_danger_skull.png", "PNG")
    img2.save("icon_danger_skull_128.png", "PNG")
    print("Generated icon_danger_skull.png")

    # -----------------------------------------------------------------
    # ICON 3: TREASURE CHEST
    # -----------------------------------------------------------------
    img3 = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d3 = ImageDraw.Draw(img3)

    WOOD_DARK   = (62, 34, 18, 255)
    WOOD_MID    = (124, 68, 32, 255)
    WOOD_LIGHT  = (175, 102, 50, 255)

    GOLD_BORDER = (145, 95, 15, 255)
    GOLD_MAIN   = (240, 185, 25, 255)
    GOLD_HI     = (255, 235, 110, 255)

    LOCK_STEEL  = (220, 235, 255, 255)
    GEM_CYAN    = (34, 211, 238, 255)
    GEM_RUBY    = (239, 68, 68, 255)

    def px3(x, y, col):
        d3.rectangle([x * scale, y * scale, (x + 1) * scale - 1, (y + 1) * scale - 1], fill=col)

    # Chest Box Base (Rows 16 to 25, Cols 6 to 25)
    for y in range(16, 25):
        for x in range(6, 26):
            px3(x, y, WOOD_MID)
    # Base bevels
    for y in range(16, 25):
        px3(6, y, WOOD_LIGHT)
        px3(25, y, WOOD_DARK)
    for x in range(6, 26):
        px3(x, 24, WOOD_DARK)

    # Domed Chest Lid (Rows 9 to 15, Cols 5 to 26)
    for y in range(10, 16):
        for x in range(6, 26):
            px3(x, y, WOOD_MID)
    for x in range(7, 25):
        px3(x, 9, WOOD_LIGHT)
        px3(x, 10, WOOD_LIGHT)
    for y in range(10, 16):
        px3(5, y, WOOD_LIGHT)
        px3(26, y, WOOD_DARK)

    # Gold Reinforcement Trim & Straps (Bands at cols 6, 15..16, 25)
    gold_bands = [
        # Left band
        [(6, y) for y in range(9, 25)] + [(7, y) for y in range(9, 25)],
        # Right band
        [(24, y) for y in range(9, 25)] + [(25, y) for y in range(9, 25)],
        # Center band
        [(15, y) for y in range(9, 25)] + [(16, y) for y in range(9, 25)]
    ]
    for band in gold_bands:
        for bx, by in band:
            px3(bx, by, GOLD_MAIN)
            px3(bx, by, GOLD_HI if by in [9, 10, 16] else GOLD_MAIN)

    # Horizontal gold rim between lid and base (Row 15)
    for x in range(5, 27):
        px3(x, 15, GOLD_MAIN)
        px3(x, 16, GOLD_BORDER)

    # Brass Keyhole Latch Lock (Cols 14 to 17, Rows 15 to 19)
    for y in range(16, 20):
        for x in range(14, 18):
            px3(x, y, GOLD_MAIN)
    px3(14, 16, GOLD_HI); px3(15, 16, GOLD_HI); px3(16, 16, GOLD_HI)
    px3(15, 18, LOCK_STEEL); px3(16, 18, WOOD_DARK) # Keyhole

    # Glowing Jewels & Gold Coins spilling from lid seam
    px3(10, 14, GOLD_HI); px3(11, 14, GEM_RUBY); px3(12, 14, GOLD_HI)
    px3(19, 14, GEM_CYAN); px3(20, 14, GOLD_HI); px3(21, 14, GEM_RUBY)
    px3(11, 13, GOLD_HI); px3(20, 13, GEM_CYAN) # Sparkles

    # Specular glint on gold latch
    px3(15, 16, (255, 255, 255, 255))

    img3.save(f"{ui_dir}/icon_treasure_chest.png", "PNG")
    img3.save("icon_treasure_chest_128.png", "PNG")
    print("Generated icon_treasure_chest.png")

    # -----------------------------------------------------------------
    # ICON 4: "2X" ARCADE BONUS EMBLEM
    # -----------------------------------------------------------------
    img4 = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d4 = ImageDraw.Draw(img4)

    SHIELD_DARK = (24, 16, 42, 255)
    SHIELD_MID  = (68, 36, 108, 255)
    SHIELD_RIM  = (135, 75, 195, 255)

    TEXT_3D_DARK= (155, 30, 20, 255)  # 3D bevel shadow
    TEXT_MAIN   = (250, 195, 20, 255) # Radiant arcade yellow
    TEXT_LIGHT  = (255, 235, 100, 255)# Bevel face
    TEXT_GLINT  = (255, 255, 255, 255)# Pure white glint

    def px4(x, y, col):
        d4.rectangle([x * scale, y * scale, (x + 1) * scale - 1, (y + 1) * scale - 1], fill=col)

    # Circular / Diamond Arcade Shield Backdrop (Center (16, 16), radius 12)
    for y in range(4, 28):
        for x in range(4, 28):
            dx = x - 15.5
            dy = y - 15.5
            dist = (dx * dx + dy * dy) ** 0.5
            if dist <= 12.0:
                if dist >= 10.5:
                    px4(x, y, SHIELD_RIM)
                elif dist >= 9.5:
                    px4(x, y, SHIELD_DARK)
                else:
                    px4(x, y, SHIELD_MID)

    # 3D Extrusion Shadow for "2"
    shadow_2 = [
        # Top arc
        (8, 10), (9, 9), (10, 9), (11, 9), (12, 10), (13, 11), (13, 12),
        (12, 13), (11, 14), (10, 15), (9, 16), (8, 17), (8, 18), (8, 19),
        (8, 20), (9, 20), (10, 20), (11, 20), (12, 20), (13, 20)
    ]
    for sx, sy in shadow_2:
        px4(sx + 1, sy + 1, TEXT_3D_DARK)
        px4(sx + 2, sy + 2, TEXT_3D_DARK)

    # Front Face for "2" (Cols 7 to 13, Rows 9 to 20)
    # Top curve
    for x in range(8, 13): px4(x, 9, TEXT_MAIN)
    px4(7, 10, TEXT_MAIN); px4(13, 10, TEXT_MAIN)
    px4(13, 11, TEXT_MAIN); px4(12, 12, TEXT_MAIN)
    # Diagonal slope
    px4(11, 13, TEXT_MAIN); px4(10, 14, TEXT_MAIN); px4(9, 15, TEXT_MAIN); px4(8, 16, TEXT_MAIN); px4(7, 17, TEXT_MAIN)
    # Base
    for x in range(7, 14): px4(x, 18, TEXT_MAIN); px4(x, 19, TEXT_MAIN)
    # Highlights on "2"
    for x in range(8, 12): px4(x, 9, TEXT_LIGHT)
    px4(8, 9, TEXT_GLINT); px4(7, 18, TEXT_LIGHT); px4(7, 18, TEXT_GLINT)

    # 3D Extrusion Shadow for "X"
    shadow_x = [
        (17, 11), (18, 12), (19, 13), (20, 14), (21, 15), (22, 16), (23, 17), (24, 18),
        (24, 11), (23, 12), (22, 13), (21, 14), (20, 15), (19, 16), (18, 17), (17, 18)
    ]
    for sx, sy in shadow_x:
        px4(sx + 1, sy + 1, TEXT_3D_DARK)
        px4(sx + 2, sy + 2, TEXT_3D_DARK)

    # Front Face for "X" (Cols 16 to 24, Rows 11 to 19)
    # Top-left to bottom-right arm
    for i in range(8):
        px4(16 + i, 11 + i, TEXT_MAIN)
        px4(17 + i, 11 + i, TEXT_LIGHT)
    # Top-right to bottom-left arm
    for i in range(8):
        px4(23 - i, 11 + i, TEXT_MAIN)
        px4(24 - i, 11 + i, TEXT_LIGHT)

    # Center intersection glint
    px4(20, 14, TEXT_GLINT); px4(20, 15, TEXT_GLINT)
    # Tips glints
    px4(16, 11, TEXT_GLINT); px4(24, 11, TEXT_GLINT)

    # Arcade Sparkle Stars
    sparkle = [(5, 7), (26, 8), (6, 23), (25, 24)]
    for spx, spy in sparkle:
        px4(spx, spy, TEXT_GLINT)
        px4(spx + 1, spy, TEXT_LIGHT)
        px4(spx - 1, spy, TEXT_LIGHT)
        px4(spx, spy + 1, TEXT_LIGHT)
        px4(spx, spy - 1, TEXT_LIGHT)

    img4.save(f"{ui_dir}/icon_bonus_2x.png", "PNG")
    img4.save("icon_bonus_2x_128.png", "PNG")
    print("Generated icon_bonus_2x.png")

    # -----------------------------------------------------------------
    # 5. COMBINED SPRITE SHEET (512x128 Grid - 4 Frames of 128x128)
    # -----------------------------------------------------------------
    spritesheet = Image.new("RGBA", (size * 4, size), (0, 0, 0, 0))
    spritesheet.paste(img1, (0, 0))
    spritesheet.paste(img2, (size, 0))
    spritesheet.paste(img3, (size * 2, 0))
    spritesheet.paste(img4, (size * 3, 0))

    spritesheet.save(f"{ui_dir}/wheel_icons_spritesheet.png", "PNG")
    spritesheet.save("wheel_icons_spritesheet_512x128.png", "PNG")
    print("Generated wheel_icons_spritesheet.png (512x128)")

if __name__ == "__main__":
    create_wheel_icons()

