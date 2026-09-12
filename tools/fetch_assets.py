"""Fetch explicitly licensed public assets. No executable third-party code is run."""
from pathlib import Path
import urllib.request, json, zipfile, io, hashlib

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public' / 'assets'
OUT.mkdir(parents=True, exist_ok=True)
manifest = json.loads((OUT / 'manifest.json').read_text(encoding='utf-8')) if (OUT / 'manifest.json').exists() else []

def fetch(url):
    request = urllib.request.Request(url, headers={'User-Agent': 'MORPH-NYC-prototype/0.1'})
    with urllib.request.urlopen(request, timeout=45) as response:
        return response.read()

def save(name, data, source, author, license):
    target = OUT / name
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(data)
    manifest[:] = [entry for entry in manifest if entry['file'] != name]
    manifest.append(dict(file=name, source=source, author=author, license=license,
                         bytes=len(data), sha256=hashlib.sha256(data).hexdigest()))
    print(name, len(data), flush=True)

def asset(name, url, author, license):
    try: save(name, fetch(url), url, author, license)
    except Exception as error: print('FAILED', name, str(error), flush=True)

for family, filename in [('barlowcondensed','BarlowCondensed-ExtraBold.ttf'),('barlowcondensed','BarlowCondensed-Medium.ttf'),('barlow','Barlow-Regular.ttf'),('barlow','Barlow-SemiBold.ttf')]:
    asset('fonts/'+filename, 'https://raw.githubusercontent.com/google/fonts/main/ofl/'+family+'/'+filename, 'Jeremy Tribby / Barlow contributors', 'SIL OFL 1.1')
for family in ['barlow','barlowcondensed']:
    asset('licenses/'+family+'-OFL.txt', 'https://raw.githubusercontent.com/google/fonts/main/ofl/'+family+'/OFL.txt', 'Jeremy Tribby / Barlow contributors', 'SIL OFL 1.1')

asset('audio/insurgent.mp3','https://opengameart.org/sites/default/files/The_Insurgent.mp3','Eponasoft','CC0 1.0')
try:
    source='https://kenney.nl/media/pages/assets/impact-sounds/87b4ddecda-1677589768/kenney_impact-sounds.zip'
    archive=zipfile.ZipFile(io.BytesIO(fetch(source)))
    candidates=[n for n in archive.namelist() if n.lower().endswith('.ogg')]
    print('Kenney files:', ', '.join(candidates[:12]), flush=True)
    for group in ['impactMetal_heavy','impactPunch_heavy','impactWood_heavy','impactGeneric_light','footstep_concrete']:
        matches=[n for n in candidates if group.lower() in n.lower()][:3]
        for name in matches:
            save('audio/'+Path(name).name,archive.read(name),source,'Kenney','CC0 1.0')
    for name in archive.namelist():
        if 'license' in name.lower() and name.lower().endswith('.txt'):
            save('licenses/kenney.txt',archive.read(name),source,'Kenney','CC0 1.0'); break
except Exception as error: print('FAILED Kenney', error, flush=True)

for texture in ['asphalt_02','concrete_floor_02']:
    try:
        metadata=json.loads(fetch('https://api.polyhaven.com/files/'+texture))
        for kind, source_kind in [('diff','Diffuse'),('nor_gl','nor_gl'),('rough','Rough')]:
            files=metadata.get(source_kind,{}).get('1k',{})
            data=files.get('jpg') or files.get('png')
            if data:
                extension='jpg' if 'jpg' in files else 'png'
                save('textures/'+texture+'_'+kind+'.'+extension,fetch(data['url']),data['url'],'Poly Haven contributors','CC0 1.0')
    except Exception as error: print('FAILED', texture, error, flush=True)

(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
