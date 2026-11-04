import os
from PIL import Image, ImageDraw

def create_remaining_blocks():
    scale = 4
    size = 16 * scale # 64x64 px
    logical_size = 16
    out_dir = "public/assets/blocks"
    os.makedirs(out_dir, exist_ok=True)

    # 1. DIRT (64x64)
    # Earthy volcanic ash dirt with pebble specks and 3D bevels
    dirt = Image.new("RGBA", (size, size), (0, 0, 0, 255))
    d_dirt = ImageDraw.Draw(dirt)
    DIRT_DARK = (72, 44, 22, 255)
    DIRT_MID  = (112, 70, 36, 255)
    DIRT_LIGHT= (148, 96, 52, 255)
    DIRT_ROOT = (86, 52, 26, 255)
    for y in range(logical_size):
        for x in range(logical_size):
            pat = (x * 7 + y * 13) % 17
            c = DIRT_MID if pat < 10 else (DIRT_DARK if pat < 14 else DIRT_LIGHT)
            d_dirt.rectangle([x*scale, y*scale, (x+1)*scale-1, (y+1)*scale-1], fill=c)
    # Bevels
    for x in range(logical_size):
        d_dirt.rectangle([x*scale, 0, (x+1)*scale-1, scale-1], fill=DIRT_LIGHT)
        d_dirt.rectangle([x*scale, (logical_size-1)*scale, (x+1)*scale-1, logical_size*scale-1], fill=DIRT_DARK)
    for y in range(logical_size):
        d_dirt.rectangle([0, y*scale, scale-1, (y+1)*scale-1], fill=DIRT_LIGHT)
        d_dirt.rectangle([(logical_size-1)*scale, y*scale, logical_size*scale-1, (y+1)*scale-1], fill=DIRT_DARK)
    dirt.save(f"{out_dir}/dirt.png", "PNG")
    print("Generated dirt.png")

    # 2. COPPER ORE (64x64)
    # Dark basalt rock with warm orange-bronze metallic copper nuggets
    cop = Image.new("RGBA", (size, size), (0, 0, 0, 255))
    d_cop = ImageDraw.Draw(cop)
    STONE_DARK  = (40, 44, 54, 255)
    STONE_MID   = (62, 66, 80, 255)
    STONE_LIGHT = (90, 96, 114, 255)
    COPPER_DARK = (145, 62, 22, 255)
    COPPER_MID  = (215, 105, 45, 255)
    COPPER_LIGHT= (255, 165, 95, 255)
    COPPER_GLINT= (255, 230, 200, 255)
    for y in range(logical_size):
        for x in range(logical_size):
            pat = (x * 11 + y * 7) % 19
            c = STONE_MID if pat < 11 else (STONE_DARK if pat < 15 else STONE_LIGHT)
            d_cop.rectangle([x*scale, y*scale, (x+1)*scale-1, (y+1)*scale-1], fill=c)
    # Bevels
    for x in range(logical_size):
        d_cop.rectangle([x*scale, 0, (x+1)*scale-1, scale-1], fill=STONE_LIGHT)
        d_cop.rectangle([x*scale, (logical_size-1)*scale, (x+1)*scale-1, logical_size*scale-1], fill=STONE_DARK)
    for y in range(logical_size):
        d_cop.rectangle([0, y*scale, scale-1, (y+1)*scale-1], fill=STONE_LIGHT)
        d_cop.rectangle([(logical_size-1)*scale, y*scale, logical_size*scale-1, (y+1)*scale-1], fill=STONE_DARK)
    # Copper nuggets
    cop_spots = [
        (4, 4, COPPER_LIGHT), (5, 4, COPPER_GLINT), (4, 5, COPPER_MID), (5, 5, COPPER_DARK),
        (10, 4, COPPER_MID), (11, 4, COPPER_LIGHT), (11, 5, COPPER_DARK),
        (3, 11, COPPER_MID), (4, 11, COPPER_LIGHT), (4, 12, COPPER_DARK),
        (9, 10, COPPER_LIGHT), (10, 10, COPPER_GLINT), (11, 10, COPPER_MID), (10, 11, COPPER_DARK)
    ]
    for sx, sy, col in cop_spots:
        d_cop.rectangle([sx*scale, sy*scale, (sx+1)*scale-1, (sy+1)*scale-1], fill=col)
    cop.save(f"{out_dir}/copper_ore.png", "PNG")
    print("Generated copper_ore.png")

    # 3. EMERALD ORE (64x64)
    # Dark basalt rock with radiant glowing emerald facets
    eme = Image.new("RGBA", (size, size), (0, 0, 0, 255))
    d_eme = ImageDraw.Draw(eme)
    EM_DEEP  = (8, 64, 28, 255)
    EM_DARK  = (16, 120, 52, 255)
    EM_MID   = (34, 197, 94, 255)
    EM_LIGHT = (134, 239, 172, 255)
    EM_GLINT = (255, 255, 255, 255)
    for y in range(logical_size):
        for x in range(logical_size):
            pat = (x * 11 + y * 7) % 19
            c = STONE_MID if pat < 11 else (STONE_DARK if pat < 15 else STONE_LIGHT)
            d_eme.rectangle([x*scale, y*scale, (x+1)*scale-1, (y+1)*scale-1], fill=c)
    for x in range(logical_size):
        d_eme.rectangle([x*scale, 0, (x+1)*scale-1, scale-1], fill=STONE_LIGHT)
        d_eme.rectangle([x*scale, (logical_size-1)*scale, (x+1)*scale-1, logical_size*scale-1], fill=STONE_DARK)
    for y in range(logical_size):
        d_eme.rectangle([0, y*scale, scale-1, (y+1)*scale-1], fill=STONE_LIGHT)
        d_eme.rectangle([(logical_size-1)*scale, y*scale, logical_size*scale-1, (y+1)*scale-1], fill=STONE_DARK)
    # Emerald clusters
    em_spots = [
        (4, 5, EM_DEEP), (5, 5, EM_DARK), (5, 4, EM_MID), (4, 4, EM_LIGHT), (4, 4, EM_GLINT),
        (10, 6, EM_DEEP), (11, 6, EM_DARK), (10, 5, EM_MID), (11, 5, EM_LIGHT), (11, 5, EM_GLINT),
        (3, 11, EM_DEEP), (4, 11, EM_MID), (4, 10, EM_LIGHT),
        (10, 11, EM_DEEP), (11, 11, EM_DARK), (10, 10, EM_MID), (11, 10, EM_LIGHT), (10, 10, EM_GLINT)
    ]
    for sx, sy, col in em_spots:
        d_eme.rectangle([sx*scale, sy*scale, (sx+1)*scale-1, (sy+1)*scale-1], fill=col)
    eme.save(f"{out_dir}/emerald_ore.png", "PNG")
    print("Generated emerald_ore.png")

    # 4. REPAIR BLOCK (64x64)
    # Green reinforced anvil / medical tool crate with glowing cross
    rep = Image.new("RGBA", (size, size), (0, 0, 0, 255))
    d_rep = ImageDraw.Draw(rep)
    REP_DARK  = (6, 78, 59, 255)
    REP_MID   = (16, 140, 85, 255)
    REP_LIGHT = (52, 211, 153, 255)
    WHITE     = (255, 255, 255, 255)
    for y in range(logical_size):
        for x in range(logical_size):
            d_rep.rectangle([x*scale, y*scale, (x+1)*scale-1, (y+1)*scale-1], fill=REP_MID)
    for x in range(logical_size):
        d_rep.rectangle([x*scale, 0, (x+1)*scale-1, scale-1], fill=REP_LIGHT)
        d_rep.rectangle([x*scale, (logical_size-1)*scale, (x+1)*scale-1, logical_size*scale-1], fill=REP_DARK)
    for y in range(logical_size):
        d_rep.rectangle([0, y*scale, scale-1, (y+1)*scale-1], fill=REP_LIGHT)
        d_rep.rectangle([(logical_size-1)*scale, y*scale, logical_size*scale-1, (y+1)*scale-1], fill=REP_DARK)
    # Glowing white cross
    for y in range(4, 12):
        for x in range(7, 9):
            d_rep.rectangle([x*scale, y*scale, (x+1)*scale-1, (y+1)*scale-1], fill=WHITE)
    for x in range(4, 12):
        for y in range(7, 9):
            d_rep.rectangle([x*scale, y*scale, (x+1)*scale-1, (y+1)*scale-1], fill=WHITE)
    rep.save(f"{out_dir}/repair.png", "PNG")
    print("Generated repair.png")

    # 5. BOUNCE BLOCK (64x64)
    # Purple/violet kinetic trampoline cushion with yellow spring coil
    bnc = Image.new("RGBA", (size, size), (0, 0, 0, 255))
    d_bnc = ImageDraw.Draw(bnc)
    BNC_DARK  = (88, 28, 135, 255)
    BNC_MID   = (126, 34, 206, 255)
    BNC_LIGHT = (192, 132, 252, 255)
    GOLD_COIL = (250, 204, 21, 255)
    for y in range(logical_size):
        for x in range(logical_size):
            d_bnc.rectangle([x*scale, y*scale, (x+1)*scale-1, (y+1)*scale-1], fill=BNC_MID)
    for x in range(logical_size):
        d_bnc.rectangle([x*scale, 0, (x+1)*scale-1, scale-1], fill=BNC_LIGHT)
        d_bnc.rectangle([x*scale, (logical_size-1)*scale, (x+1)*scale-1, logical_size*scale-1], fill=BNC_DARK)
    for y in range(logical_size):
        d_bnc.rectangle([0, y*scale, scale-1, (y+1)*scale-1], fill=BNC_LIGHT)
        d_bnc.rectangle([(logical_size-1)*scale, y*scale, logical_size*scale-1, (y+1)*scale-1], fill=BNC_DARK)
    # Spring chevron
    spring_pts = [
        (4, 12), (5, 11), (6, 12), (7, 13), (8, 12), (9, 11), (10, 12), (11, 13),
        (4, 9), (5, 8), (6, 9), (7, 10), (8, 9), (9, 8), (10, 9), (11, 10),
        (4, 6), (5, 5), (6, 6), (7, 7), (8, 6), (9, 5), (10, 6), (11, 7)
    ]
    for sx, sy in spring_pts:
        d_bnc.rectangle([sx*scale, sy*scale, (sx+1)*scale-1, (sy+1)*scale-1], fill=GOLD_COIL)
    bnc.save(f"{out_dir}/bounce.png", "PNG")
    print("Generated bounce.png")

    # 6. BEDROCK BLOCK (64x64)
    # Obsidian/void indestructible block with purple fissures and titanium rivets
    bed = Image.new("RGBA", (size, size), (0, 0, 0, 255))
    d_bed = ImageDraw.Draw(bed)
    BED_DEEP  = (12, 10, 18, 255)
    BED_DARK  = (22, 18, 32, 255)
    BED_MID   = (38, 30, 52, 255)
    BED_LIGHT = (72, 54, 96, 255)
    BED_RIVET = (165, 140, 210, 255)
    for y in range(logical_size):
        for x in range(logical_size):
            d_bed.rectangle([x*scale, y*scale, (x+1)*scale-1, (y+1)*scale-1], fill=BED_MID)
    for x in range(logical_size):
        d_bed.rectangle([x*scale, 0, (x+1)*scale-1, scale-1], fill=BED_LIGHT)
        d_bed.rectangle([x*scale, (logical_size-1)*scale, (x+1)*scale-1, logical_size*scale-1], fill=BED_DEEP)
    for y in range(logical_size):
        d_bed.rectangle([0, y*scale, scale-1, (y+1)*scale-1], fill=BED_LIGHT)
        d_bed.rectangle([(logical_size-1)*scale, y*scale, logical_size*scale-1, (y+1)*scale-1], fill=BED_DEEP)
    # Corner rivets
    rivets = [(2, 2), (13, 2), (2, 13), (13, 13)]
    for rx, ry in rivets:
        d_bed.rectangle([rx*scale, ry*scale, (rx+1)*scale-1, (ry+1)*scale-1], fill=BED_RIVET)
    bed.save(f"{out_dir}/bedrock.png", "PNG")
    print("Generated bedrock.png")

if __name__ == "__main__":
    create_remaining_blocks()

