"""Gera os ícones do app Android a partir de www/app-icon.png (símbolo oficial da marca). Tolerante a falhas."""
import os, sys
RES = "android/app/src/main/res"
SIZES = {"mdpi": 48, "hdpi": 72, "xhdpi": 96, "xxhdpi": 144, "xxxhdpi": 192}
try:
    from PIL import Image
    src = Image.open("www/app-icon.png").convert("RGBA")
    for dens, px in SIZES.items():
        folder = f"{RES}/mipmap-{dens}"
        if not os.path.isdir(folder): continue
        im = src.resize((px, px), Image.LANCZOS)
        for name in ("ic_launcher.png", "ic_launcher_round.png", "ic_launcher_foreground.png"):
            im.save(f"{folder}/{name}")
    anydpi = f"{RES}/mipmap-anydpi-v26"
    if os.path.isdir(anydpi):
        for f in os.listdir(anydpi): os.remove(f"{anydpi}/{f}")  # usa os PNG acima em vez do ícone adaptativo padrão
    print("Ícones gerados.")
except Exception as e:
    print("Aviso: ícone padrão mantido:", e, file=sys.stderr)
