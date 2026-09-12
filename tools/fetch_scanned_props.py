from pathlib import Path
import urllib.request,json,hashlib
root=Path(__file__).resolve().parents[1]/'public/assets'
manifest=json.loads((root/'manifest.json').read_text(encoding='utf-8'))
def get(url):
 return urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'MORPH-NYC-art-upgrade/0.2'}),timeout=90).read()
for name,res in [('covered_car','2k'),('metal_trash_can','1k'),('trashbag','1k')]:
 entry=json.loads(get('https://api.polyhaven.com/files/'+name))['gltf'][res]['gltf']
 files={name+'.gltf':entry,**entry['include']}
 for file,meta in files.items():
  rel='props/'+name+'/'+file;p=root/rel;p.parent.mkdir(parents=True,exist_ok=True);data=get(meta['url']);p.write_bytes(data)
  manifest[:]=[x for x in manifest if x['file']!=rel]
  manifest.append(dict(file=rel,source=meta['url'],author='Poly Haven contributors',license='CC0 1.0',bytes=len(data),sha256=hashlib.sha256(data).hexdigest()))
  (root/'manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
  print(rel,len(data),flush=True)
