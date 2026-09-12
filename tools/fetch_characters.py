from pathlib import Path
import urllib.request,json,hashlib
root=Path(__file__).resolve().parents[1]/'public'/'assets'
base='https://raw.githubusercontent.com/J-Ponzo/gltf-universal-animation-library/main/'
files=[('glTF/AnimationLibrary_Godot_Standard.gltf','characters/organism.gltf'),('glTF/AnimationLibrary_Godot_Standard.bin','characters/AnimationLibrary_Godot_Standard.bin'),('LICENSE','licenses/quaternius-CC0.txt')]
manifest=json.loads((root/'manifest.json').read_text())
for source,target in files:
    request=urllib.request.Request(base+source,headers={'User-Agent':'MORPH-NYC/0.1'})
    data=urllib.request.urlopen(request,timeout=60).read()
    path=root/target;path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(data)
    manifest.append(dict(file=target,source=base+source,author='Quaternius; unmodified distribution mirrored by J-Ponzo',license='CC0 1.0',bytes=len(data),sha256=hashlib.sha256(data).hexdigest()))
    print(target,len(data),flush=True)
(root/'manifest.json').write_text(json.dumps(manifest,indent=2))
