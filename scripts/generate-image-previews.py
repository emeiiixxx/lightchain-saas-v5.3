"""Regenerate tiny inline previews for bundled demo photos (requires Pillow)."""
import base64
import io
import json
from pathlib import Path
from PIL import Image, ImageOps

root = Path(__file__).resolve().parents[1]
previews = {}
for folder in ('upload', 'prompts'):
    for path in sorted((root / 'public' / 'assets' / folder).glob('*.png')):
        with Image.open(path) as original:
            image = ImageOps.exif_transpose(original).convert('RGBA')
            image.thumbnail((32, 32), Image.Resampling.LANCZOS)
            output = io.BytesIO()
            image.save(output, format='WEBP', quality=35)
            key = folder + '/' + path.name
            previews[key] = 'data:image/webp;base64,' + base64.b64encode(output.getvalue()).decode()
(root / 'src' / 'image-previews.json').write_text(json.dumps(previews, indent=2) + '\n')
print(f'Generated {len(previews)} previews; original images unchanged.')
