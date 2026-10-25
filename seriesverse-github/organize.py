"""Coloca os arquivos soltos nas pastas certas antes de gerar o APK."""
import os, shutil
LIB = {"seed.js", "schedule.js", "quiz.js", "curated.js", "util.js", "reports.js", "ai.js"}
os.makedirs("www/core-lib", exist_ok=True); os.makedirs("scripts", exist_ok=True)
for f in os.listdir("."):
    if not os.path.isfile(f): continue
    if f in LIB: shutil.move(f, f"www/core-lib/{f}")
    elif f == "prepare_android.py": shutil.copy(f, f"scripts/{f}")
    elif f.endswith((".js", ".css", ".html", ".svg", ".png")): shutil.move(f, f"www/{f}")
print("Arquivos organizados:", sorted(os.listdir("www")))
