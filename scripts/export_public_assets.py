import os
import random
from PIL import Image, ImageDraw

def draw_pixel(draw, x, y, color, scale):
    draw.rectangle([x * scale, y * scale, (x + 1) * scale - 1, (y + 1) * scale - 1], fill=color)

def generate_pickaxes():
    tiers = [
        ("wood", (143, 86, 43), (198, 138, 76), (90, 52, 24), (154, 99, 50), (92, 57, 25)),
        ("stone", (138, 139, 148), (194, 195, 204), (82, 83, 90), (140, 89, 48), (83, 52, 27)),
        ("iron", (209, 218, 232), (255, 255, 255), (127, 136, 153), (130, 82, 44), (74, 45, 22)),
        ("diamond", (31, 212, 235), (214, 251, 255), (14, 124, 138), (43, 51, 69), (20, 24, 36))
    ]
    size = 24
    scale = 3
    for name, head_main, head_hi, head_dark, handle_main, handle_dark in tiers:
        img = Image.new("RGBA", (size * scale, size * scale), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        for i in range(14):
            hx = 5 + i
            hy = 19 - i
            draw_pixel(draw, hx, hy, handle_main, scale)
            draw_pixel(draw, hx - 1, hy, handle_dark, scale)
            draw_pixel(draw, hx, hy + 1, handle_dark, scale)
        head_coords = [
            (11, 4, head_dark), (12, 4, head_main), (13, 5, head_main), (14, 5, head_hi),
            (15, 6, head_main), (16, 6, head_hi), (17, 7, head_hi),
            (18, 8, head_main), (19, 8, head_dark), (20, 9, head_main), (21, 10, head_main),
            (21, 11, head_dark), (20, 12, head_dark),
            (16, 7, head_main), (17, 6, head_main), (18, 7, head_dark), (17, 8, head_dark),
            (15, 5, head_hi), (18, 9, head_main), (19, 10, head_dark),
            (10, 3, head_hi), (9, 3, head_dark), (22, 12, head_hi), (22, 13, head_dark)
        ]
        for hx, hy, col in head_coords:
            draw_pixel(draw, hx, hy, col, scale)
        img.save(f"public/assets/pickaxes/pickaxe_{name}.png", "PNG")

def generate_blocks():
    size = 16
    scale = 4
    blocks_def = {
        "dirt": ((120, 77, 40), (158, 103, 55), (79, 48, 22)),
        "stone": ((118, 120, 130), (159, 161, 173), (78, 80, 87)),
        "hard_stone": ((58, 60, 72), (84, 87, 104), (34, 35, 43)),
        "bedrock": ((23, 22, 34), (51, 47, 74), (9, 8, 14))
    }
    for name, (bg, hi, dark) in blocks_def.items():
        img = Image.new("RGBA", (size * scale, size * scale), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        for y in range(size):
            for x in range(size):
                draw_pixel(draw, x, y, bg, scale)
        for x in range(size):
            draw_pixel(draw, x, 0, hi, scale)
            draw_pixel(draw, x, size - 1, dark, scale)
        for y in range(size):
            draw_pixel(draw, 0, y, hi, scale)
            draw_pixel(draw, size - 1, y, dark, scale)
        img.save(f"public/assets/blocks/{name}.png", "PNG")

    ores = {
        "copper_ore": ((214, 103, 41), (255, 156, 96)),
        "gold_ore": ((234, 179, 8), (254, 240, 138)),
        "diamond_ore": ((6, 182, 212), (165, 243, 252)),
        "emerald_ore": ((16, 185, 129), (167, 243, 208))
    }
    stone_bg, stone_hi, stone_dark = blocks_def["stone"]
    for ore_name, (ore_main, ore_hi) in ores.items():
        img = Image.new("RGBA", (size * scale, size * scale), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        for y in range(size):
            for x in range(size):
                draw_pixel(draw, x, y, stone_bg, scale)
        for x in range(size):
            draw_pixel(draw, x, 0, stone_hi, scale)
            draw_pixel(draw, x, size - 1, stone_dark, scale)
        for y in range(size):
            draw_pixel(draw, 0, y, stone_hi, scale)
            draw_pixel(draw, size - 1, y, dark, scale)
        for ox, oy in [(4, 4), (5, 4), (10, 3), (11, 4), (3, 10), (4, 11), (9, 9), (10, 10), (12, 11)]:
            draw_pixel(draw, ox, oy, ore_main, scale)
            draw_pixel(draw, ox + 1, oy, ore_hi, scale)
        img.save(f"public/assets/blocks/{ore_name}.png", "PNG")

    # TNT
    tnt = Image.new("RGBA", (64, 64), (220, 38, 38, 255))
    dtnt = ImageDraw.Draw(tnt)
    dtnt.rectangle([4, 20, 60, 44], fill=(255, 255, 255, 255))
    dtnt.text((18, 24), "TNT", fill=(15, 23, 42, 255))
    tnt.save("public/assets/blocks/tnt.png", "PNG")

    # Repair
    rep = Image.new("RGBA", (64, 64), (4, 120, 87, 255))
    drep = ImageDraw.Draw(rep)
    drep.rectangle([26, 12, 38, 52], fill=(255, 255, 255, 255))
    drep.rectangle([12, 26, 52, 38], fill=(255, 255, 255, 255))
    rep.save("public/assets/blocks/repair.png", "PNG")

    # Upgrade
    upg = Image.new("RGBA", (64, 64), (217, 119, 6, 255))
    dupg = ImageDraw.Draw(upg)
    dupg.polygon([(32, 12), (48, 28), (38, 28), (38, 50), (26, 50), (26, 28), (16, 28)], fill=(255, 255, 255, 255))
    upg.save("public/assets/blocks/upgrade.png", "PNG")

    # Bounce
    bnc = Image.new("RGBA", (64, 64), (126, 34, 206, 255))
    dbnc = ImageDraw.Draw(bnc)
    dbnc.line([(14, 48), (26, 38), (38, 48), (50, 38), (32, 14)], fill=(250, 204, 21), width=4)
    bnc.save("public/assets/blocks/bounce.png", "PNG")

def generate_effects():
    spark = Image.new("RGBA", (16, 16), (0, 0, 0, 0))
    d = ImageDraw.Draw(spark)
    d.rectangle([6, 0, 10, 16], fill=(253, 224, 71, 255))
    d.rectangle([0, 6, 16, 10], fill=(253, 224, 71, 255))
    d.rectangle([6, 6, 10, 10], fill=(255, 255, 255, 255))
    spark.save("public/assets/effects/spark.png", "PNG")

    smoke = Image.new("RGBA", (24, 24), (0, 0, 0, 0))
    ds = ImageDraw.Draw(smoke)
    ds.ellipse([2, 2, 22, 22], fill=(249, 115, 22, 200))
    ds.ellipse([6, 6, 18, 18], fill=(254, 240, 138, 255))
    smoke.save("public/assets/effects/smoke.png", "PNG")

def generate_backgrounds():
    w, h = 540, 960
    bg = Image.new("RGBA", (w, h), (17, 14, 27, 255))
    d = ImageDraw.Draw(bg)
    for y in range(h):
        r = int(17 - (y / h) * 10)
        g = int(14 - (y / h) * 9)
        b = int(27 - (y / h) * 14)
        d.line([(0, y), (w, y)], fill=(r, g, b, 255))
    bg.save("public/assets/backgrounds/bg_mine.png", "PNG")

if __name__ == "__main__":
    generate_pickaxes()
    generate_blocks()
    generate_effects()
    generate_backgrounds()
    print("Exported all public assets.")

