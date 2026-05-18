from PIL import Image
import os

logo_path = None
possible_paths = [
    'static/images/kamcofarm.png',
    'static/images/kamcofarm1.png',
    'images/kamcofarm.png',
    'images/kamcofarm1.png',
    'icons/icon-144.png',
    'icons/icon-192.png',
    'icons/icon-512.png',
    'icons/icon-384.png',
    'icons/icon-128.png',
    'icons/icon-96.png',
    'icons/icon-72.png',
    'icons/icon-152.png',
]

for path in possible_paths:
    if os.path.exists(path):
        logo_path = path
        break

if not logo_path:
    print("❌ Logo non trouvé. Indiquez le chemin exact de votre logo.")
    logo_path = input("Chemin du logo : ").strip()

output_dir = 'dashboard/icons'
os.makedirs(output_dir, exist_ok=True)

sizes = [72, 96, 128, 144, 152, 192, 384, 512]

try:
    img = Image.open(logo_path)
    if img.mode != 'RGBA':
        img = img.convert('RGBA')

    for size in sizes:
        bg = Image.new('RGBA', (size, size), (255, 255, 255, 255))
        ratio = min(size * 0.75 / img.width, size * 0.75 / img.height)
        new_w = int(img.width * ratio)
        new_h = int(img.height * ratio)
        resized = img.resize((new_w, new_h), Image.LANCZOS)
        x = (size - new_w) // 2
        y = (size - new_h) // 2
        bg.paste(resized, (x, y), resized)
        bg.save(os.path.join(output_dir, f'icon-{size}.png'), 'PNG')
        print(f'✅ icon-{size}.png')

    # Screenshots
    for name, w, h in [('screenshot-wide', 1280, 720), ('screenshot-mobile', 720, 1280)]:
        bg = Image.new('RGBA', (w, h), (24, 135, 1, 255))
        ratio = min(w * 0.4 / img.width, h * 0.4 / img.height)
        new_w = int(img.width * ratio)
        new_h = int(img.height * ratio)
        resized = img.resize((new_w, new_h), Image.LANCZOS)
        x = (w - new_w) // 2
        y = (h - new_h) // 2
        bg.paste(resized, (x, y), resized)
        bg.save(os.path.join(output_dir, f'{name}.png'), 'PNG')
        print(f'✅ {name}.png')

    print('\n✅ Toutes les icônes générées !')
except Exception as e:
    print(f'❌ Erreur : {e}')