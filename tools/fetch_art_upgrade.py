"""Import CC0 art and record provenance. Downloads data only, never executes it."""
from pathlib import Path
import urllib.request, json, hashlib, struct

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'public/assets'
manifest=json.loads((OUT/'manifest.json').read_text(encoding='utf-8'))
def get(url):
    return urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'MORPH-NYC-art-upgrade/0.2'}),timeout=90).read()
def save(name,url,author):
    p=OUT/name;p.parent.mkdir(parents=True,exist_ok=True)
    data=get(url);p.write_bytes(data)
    manifest[:]=[a for a in manifest if a['file']!=name]
    manifest.append(dict(file=name,source=url,author=author,license='CC0 1.0',bytes=len(data),sha256=hashlib.sha256(data).hexdigest()))
    (OUT/'manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
    print(name,len(data),flush=True)
    return data
base='https://raw.githubusercontent.com/Seyamalam/blood-league-kickoff/main/public/assets/vendor/quaternius/'
license=save('licenses/quaternius-base-characters.txt',base+'LICENSE-BASE-CHARACTERS.txt','Quaternius; conversion mirror by Seyamalam')
print(license.decode(),flush=True)
save('characters/motion.glb',base+'universal-animation-library.glb','Quaternius; glTF conversion mirror by Seyamalam')
b=save('characters/hero.glb',base+'night-striker.glb','Quaternius Universal Base Characters Standard; glTF conversion mirror by Seyamalam')
data=json.loads(b[20:20+struct.unpack_from('<I',b,12)[0]])
print('Character materials',[(m.get('name'),m.get('pbrMetallicRoughness')) for m in data.get('materials',[])],flush=True)
print('Character meshes',[(m.get('name'),len(m['primitives'])) for m in data.get('meshes',[])],flush=True)
print('Bones',[n.get('name') for n in data['nodes']][:30],flush=True)
for asset in ['brick_wall_001','concrete_wall_008','metal_plate','aerial_asphalt_01']:
    try:
        d=json.loads(get('https://api.polyhaven.com/files/'+asset))
        for suffix,key in [('diff','Diffuse'),('normal','nor_gl'),('rough','Rough')]:
            f=d[key]['2k'];f=f.get('jpg') or f['png'];save(f'textures/{asset}_{suffix}.jpg',f['url'],'Poly Haven contributors')
    except Exception as e:print('Asset skipped',asset,str(e),flush=True)
d=json.loads(get('https://api.polyhaven.com/files/urban_street_02'))
save('lighting/urban_street_02.hdr',d['hdri']['1k']['hdr']['url'],'Poly Haven contributors')
