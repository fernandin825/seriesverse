"""Gera os ícones do app e ajusta o tema do Android. Tolerante: se algo falhar, o APK sai com o ícone padrão."""
import os, re, sys
RES = "android/app/src/main/res"
SIZES = {"mdpi": 48, "hdpi": 72, "xhdpi": 96, "xxhdpi": 144, "xxxhdpi": 192}
def icon(px):
    from PIL import Image, ImageDraw
    S = 1024; im = Image.new("RGB", (S, S), (11, 13, 20)); d = ImageDraw.Draw(im)
    for y in range(S):  # degradê roxo -> azul
        t = y / S; d.line([(0, y), (S, y)], fill=(int(110 - 50 * t), int(60 + 40 * t), int(220 - 20 * t)))
    d.rounded_rectangle([210, 250, 814, 700], 70, outline=(255, 255, 255), width=46)   # TV
    d.polygon([(450, 340), (450, 610), (680, 475)], fill=(255, 255, 255))             # play
    d.line([(400, 800), (624, 800)], fill=(255, 255, 255), width=46)                  # base
    return im.resize((px, px), Image.LANCZOS)
try:
    for dens, px in SIZES.items():
        folder = f"{RES}/mipmap-{dens}"
        if not os.path.isdir(folder): continue
        im = icon(px)
        for name in ("ic_launcher.png", "ic_launcher_round.png", "ic_launcher_foreground.png"):
            im.save(f"{folder}/{name}")
    for f in os.listdir(f"{RES}/mipmap-anydpi-v26") if os.path.isdir(f"{RES}/mipmap-anydpi-v26") else []:
        os.remove(f"{RES}/mipmap-anydpi-v26/{f}")   # usa os PNG acima em vez do ícone adaptativo padrão
    print("Ícones gerados.")
except Exception as e:
    print("Aviso: ícone padrão mantido:", e, file=sys.stderr)
