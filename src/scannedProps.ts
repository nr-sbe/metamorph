import { ASSET_BASE } from './assetPaths';
import {AssetContainer,Scene,LoadAssetContainerAsync,TransformNode,InstancedMesh,Vector3,PBRMaterial,Color3} from '@babylonjs/core';
import '@babylonjs/loaders/glTF';
const scans=new WeakMap<Scene,Map<string,AssetContainer>>();

export async function prepareScannedProps(scene:Scene){
 const map=new Map<string,AssetContainer>();
 for(const name of ['covered_car','metal_trash_can','trashbag','concept_car']){
  const asset=await LoadAssetContainerAsync(ASSET_BASE+'props/'+name+'/'+name+(name==='concept_car'?'.glb':'.gltf'),scene);
  for(const m of asset.materials)if(m instanceof PBRMaterial){m.forceIrradianceInFragment=true;if(name==='concept_car'){m.clearCoat.bumpTexture=null;m.clearCoat.texture=null;m.clearCoat.textureRoughness=null;m.iridescence.isEnabled=false;if(m.subSurface.isRefractionEnabled){m.subSurface.isRefractionEnabled=false;m.alpha=.5;m.transparencyMode=PBRMaterial.PBRMATERIAL_ALPHABLEND;}if(m.name==='License'){m.albedoTexture=null;m.emissiveTexture=null;m.albedoColor=new Color3(.03,.035,.04);}}m.environmentIntensity=.85;if(m.bumpTexture)m.bumpTexture.level=.7;}
  map.set(name,asset);
 }
 scans.set(scene,map);
}

export function placeScan(scene:Scene,name:string,parent:TransformNode,width:number,height:number,depth:number,bottom=0){
 const template=scans.get(scene)?.get(name);if(!template)return null;
 const anchor=new TransformNode('scan / '+name,scene);
 const entries=template.instantiateModelsToScene(n=>'scan/'+n,false,{doNotInstantiate:false});
 for(const root of entries.rootNodes)root.parent=anchor;
 const bounds=()=>{const min=new Vector3(Infinity,Infinity,Infinity),max=new Vector3(-Infinity,-Infinity,-Infinity);for(const mesh of anchor.getChildMeshes()){if(mesh.getTotalVertices()===0)continue;mesh.computeWorldMatrix(true);const box=mesh.getBoundingInfo().boundingBox;min.minimizeInPlace(box.minimumWorld);max.maximizeInPlace(box.maximumWorld);}return {min,max};};
 let b=bounds();if((name==='covered_car'||name==='concept_car')&&b.max.x-b.min.x>b.max.z-b.min.z){anchor.rotation.y=Math.PI/2;b=bounds();}
 const extent=b.max.subtract(b.min),scale=Math.min(width/extent.x,height/extent.y,depth/extent.z);
 anchor.scaling.setAll(scale);anchor.position.set(-(b.min.x+b.max.x)*.5*scale,bottom-b.min.y*scale,-(b.min.z+b.max.z)*.5*scale);anchor.parent=parent;
 for(const mesh of anchor.getChildMeshes()){if(mesh instanceof InstancedMesh)mesh.sourceMesh.receiveShadows=true;else mesh.receiveShadows=true;mesh.isPickable=false;}
 return anchor;
}
