"""CC0 source normal/roughness maps for original mutation meshes."""
from pathlib import Path
import urllib.request, json, hashlib

root = Path(__file__).resolve().parents[1] / 'public/assets'
manifest = json.loads((root / 'manifest.json').read_text(encoding='utf-8'))
def get(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent':'MORPH-NYC/0.3'}), timeout=90).read()
for name in ['brown_leather', 'pine_bark']:
    data = json.loads(get('https://api.polyhaven.com/files/' + name))
    for suffix, key in [('normal', 'nor_gl'), ('rough', 'Rough')]:
        choices = data[key]['1k']
        item = choices.get('jpg') or choices['png']
        ext = item['url'].rsplit('.', 1)[-1]
        file = f'mutations/{name}_{suffix}.{ext}'
        blob = get(item['url'])
        path = root / file
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(blob)
        manifest[:] = [m for m in manifest if m['file'] != file]
        manifest.append(dict(file=file, source=item['url'], author='Poly Haven contributors', license='CC0 1.0', bytes=len(blob), sha256=hashlib.sha256(blob).hexdigest()))
        print(file, len(blob), flush=True)
    (root / 'manifest.json').write_text(json.dumps(manifest, indent=2), encoding='utf-8')
