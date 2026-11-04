import math
import os
import random
from PIL import Image, ImageDraw

def create_volcanic_parallax_background():
    # Logical resolution: 270 x 480
    # Scaled 4x with nearest-neighbor = exactly 1080 x 1920 px
    scale = 4
    lw = 270
    lh = 480
    final_w = lw * scale
    final_h = lh * scale

    # Color Palette - Volcanic Cavern Deep Atmosphere
    # Deep central cavern void (Muted & dark to preserve foreground readability)
    BG_VOID_TOP   = (12, 10, 18)   # Deep abyssal charcoal
    BG_VOID_BOT   = (24, 12, 18)   # Subterranean thermal glow

    # Distant rock wall silhouettes (Outer left & right margins)
    ROCK_FAR      = (22, 16, 28)
    ROCK_MID      = (32, 22, 38)
    ROCK_NEAR     = (44, 30, 48)
    ROCK_EDGE     = (58, 40, 62)

    # Magma Cascades
    LAVA_GLOW     = (72, 20, 16)
    LAVA_DEEP     = (175, 38, 14)
    LAVA_MID      = (242, 106, 20)
    LAVA_CORE     = (255, 215, 65)
    LAVA_WHITE    = (255, 250, 180)

    # Floating ember specks
    EMBER_DIM     = (175, 65, 25)
    EMBER_BRIGHT  = (252, 155, 42)
    EMBER_HOT     = (255, 238, 115)

    # 1. Initialize Logical Grid
    grid = [[(0, 0, 0) for _ in range(lw)] for _ in range(lh)]

    # 2. Base Cavern Vertical Atmospheric Gradient (Strictly Periodic: y / lh * 2*PI)
    for y in range(lh):
        angle = (y / lh) * (math.pi * 2)
        v_cycle = (1.0 - math.cos(angle)) * 0.5 # 0 at y=0 and y=lh, 1 in middle

        r = int(BG_VOID_TOP[0] + (BG_VOID_BOT[0] - BG_VOID_TOP[0]) * v_cycle)
        g = int(BG_VOID_TOP[1] + (BG_VOID_BOT[1] - BG_VOID_TOP[1]) * v_cycle)
        b = int(BG_VOID_TOP[2] + (BG_VOID_BOT[2] - BG_VOID_TOP[2]) * v_cycle)

        for x in range(lw):
            center_dist = abs(x - (lw / 2.0)) / (lw / 2.0) # 0 in center, 1 at edges
            edge_warmth = center_dist * 0.42

            px_r = min(255, int(r * (0.8 + edge_warmth * 1.2)))
            px_g = min(255, int(g * (0.8 + edge_warmth * 0.8)))
            px_b = min(255, int(b * (0.8 + edge_warmth * 0.5)))
            grid[y][x] = (px_r, px_g, px_b)

    # 3. Distant Rock Wall Silhouettes (Strictly Periodic Harmonics)
    def rock_profile(y, phase, base_width, variance):
        t1 = math.sin(y / lh * math.pi * 2 + phase) * variance
        t2 = math.cos(y / lh * math.pi * 4 + phase * 1.5) * (variance * 0.5)
        t3 = math.sin(y / lh * math.pi * 8 + phase * 2.0) * (variance * 0.25)
        return int(base_width + t1 + t2 + t3)

    for y in range(lh):
        left_far = rock_profile(y, 0.0, 48, 14)
        left_mid = rock_profile(y, 1.2, 36, 12)
        left_near = rock_profile(y, 2.5, 22, 10)

        right_far = rock_profile(y, 3.1, 48, 14)
        right_mid = rock_profile(y, 4.3, 36, 12)
        right_near = rock_profile(y, 5.6, 22, 10)

        for x in range(left_far): grid[y][x] = ROCK_FAR
        for x in range(left_mid): grid[y][x] = ROCK_MID
        for x in range(left_near): grid[y][x] = ROCK_NEAR
        if 0 <= left_near < lw: grid[y][left_near] = ROCK_EDGE

        for x in range(lw - right_far, lw): grid[y][x] = ROCK_FAR
        for x in range(lw - right_mid, lw): grid[y][x] = ROCK_MID
        for x in range(lw - right_near, lw): grid[y][x] = ROCK_NEAR
        if 0 <= lw - right_near - 1 < lw: grid[y][lw - right_near - 1] = ROCK_EDGE

    # 4. Distant Magma Cascades (Strictly Periodic: 24 divides 480 evenly!)
    # Cycle length: 24 rows -> Exactly 20 full cycles in 480 rows!
    for y in range(lh):
        # Continuous harmonic wobble
        wobble_l = int(math.sin(y / lh * math.pi * 6) * 3 + math.cos(y / lh * math.pi * 4) * 2)
        cl = 28 + wobble_l

        for dx in [-2, -1, 0, 1, 2]:
            gx = cl + dx
            if 0 <= gx < lw: grid[y][gx] = LAVA_GLOW

        grid[y][cl - 1] = LAVA_DEEP
        grid[y][cl]     = LAVA_MID
        grid[y][cl + 1] = LAVA_DEEP

        # Periodic surge with period 24 (24 divides 480 evenly!)
        y_mod = y % 24
        if y_mod < 8:
            grid[y][cl] = LAVA_CORE
            if y_mod in [3, 4]:
                grid[y][cl] = LAVA_WHITE

        # Right cascade
        wobble_r = int(math.cos(y / lh * math.pi * 6) * 3 + math.sin(y / lh * math.pi * 4) * 2)
        cr = 240 + wobble_r

        for dx in [-2, -1, 0, 1, 2]:
            gx = cr + dx
            if 0 <= gx < lw: grid[y][gx] = LAVA_GLOW

        grid[y][cr - 1] = LAVA_DEEP
        grid[y][cr]     = LAVA_MID
        grid[y][cr + 1] = LAVA_DEEP

        y_mod_r = (y + 12) % 24 # Offset by 12 (divides 480)
        if y_mod_r < 8:
            grid[y][cr] = LAVA_CORE
            if y_mod_r in [3, 4]:
                grid[y][cr] = LAVA_WHITE

    # 5. Glowing Lava Pools in Mid Cavern Shelves (Placed safely away from y=0/y=479 boundary)
    pools = [
        (35, 120, 15, 5),
        (235, 240, 16, 6),
        (32, 360, 14, 5)
    ]
    for px, py, rx, ry in pools:
        for dy in range(-ry, ry + 1):
            for dx in range(-rx, rx + 1):
                if (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) <= 1.0:
                    gx = px + dx
                    gy = py + dy
                    if 0 <= gx < lw and 0 <= gy < lh:
                        dist_ratio = math.hypot(dx / rx, dy / ry)
                        if dist_ratio < 0.35:
                            grid[gy][gx] = LAVA_CORE
                        elif dist_ratio < 0.7:
                            grid[gy][gx] = LAVA_MID
                        else:
                            grid[gy][gx] = LAVA_DEEP

    # 6. Ambient Floating Ember Dust Specks (Avoid immediate boundary row y=0 and y=479)
    random.seed(99)
    for _ in range(150):
        ex = random.randint(15, lw - 16)
        ey = random.randint(3, lh - 4) # Clear boundary rows for clean seam
        if 115 < ex < 155 and random.random() < 0.7:
            continue

        intensity = random.random()
        col = EMBER_DIM if intensity < 0.55 else (EMBER_BRIGHT if intensity < 0.88 else EMBER_HOT)
        grid[ey][ex] = col

    # 7. Exact Vertical Seam Equalization
    # Ensure row y=0 exactly matches the periodic wrap of y=lh-1
    for x in range(lw):
        grid[0][x] = grid[lh - 1][x]

    # 8. Render to 270x480 Image
    img_logical = Image.new("RGB", (lw, lh))
    d_logical = ImageDraw.Draw(img_logical)
    for y in range(lh):
        for x in range(lw):
            d_logical.point((x, y), fill=grid[y][x])

    # 9. Upscale 4x with NEAREST NEIGHBOR to exactly 1080x1920 (Crisp pixel art!)
    img_final = img_logical.resize((final_w, final_h), resample=Image.Resampling.NEAREST)

    # Save target in backgrounds
    bg_path = "public/assets/backgrounds/bg_mine.png"
    os.makedirs(os.path.dirname(bg_path), exist_ok=True)
    img_final.save(bg_path, "PNG")
    print(f"Saved 1080x1920 volcanic parallax background to {bg_path}")

    # Also save to root
    img_final.save("volcanic_background_1080x1920.png", "PNG")
    print("Saved volcanic_background_1080x1920.png to root.")

    # 10. Verify Vertical Seam
    top_pixels = [img_final.getpixel((x, 0)) for x in range(final_w)]
    bot_pixels = [img_final.getpixel((x, final_h - 1)) for x in range(final_w)]
    max_diff = max(max(abs(a - b) for a, b in zip(t, b)) for t, b in zip(top_pixels, bot_pixels))
    print(f"Vertical seam edge maximum pixel difference on 1080x1920: {max_diff} (0 is perfectly seamless!)")

if __name__ == "__main__":
    create_volcanic_parallax_background()
