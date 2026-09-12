import { ASSET_BASE } from './assetPaths';
import {AssetContainer,Scene,LoadAssetContainerAsync,TransformNode,AnimationGroup,PBRMaterial,Color3,InstantiatedEntries,Material,VertexBuffer,Mesh} from '@babylonjs/core';
import '@babylonjs/loaders/glTF';
import {dressCharacter} from './clothing';
import {SignatureRig,type SignaturePose} from './signaturePose';
const templates=new WeakMap<Scene,AssetContainer>();
let serial=0;
const aliases:Record<string,string>={'DEF-hand.L':'hand_l','DEF-hand.R':'hand_r','DEF-forearm.R':'lowerarm_r','DEF-upper_arm.L':'upperarm_l','DEF-upper_arm.R':'upperarm_r'};
export async function prepareCharacters(scene:Scene){
 const [body,motion]=await Promise.all([LoadAssetContainerAsync(ASSET_BASE+'characters/hero.glb',scene),LoadAssetContainerAsync(ASSET_BASE+'characters/motion.glb',scene)]);
 const keep=new Set(['Idle_Loop','Walk_Loop','Sprint_Loop','Jump_Loop','Jump_Land','Punch_Cross','Punch_Jab','Sword_Attack','Sword_Idle','Spell_Simple_Shoot','Hit_Chest','Death01','Roll']);
 const nodes=new Map(body.transformNodes.map(n=>[n.name,n]));
 for(const source of motion.animationGroups){if(!keep.has(source.name))continue;const group=source.clone(source.name,target=>nodes.get(target.name)??null,true);group.stop();body.animationGroups.push(group);scene.removeAnimationGroup(group);}
 motion.dispose();templates.set(scene,body);
}
export class CharacterSkin{
 signatureRig:SignatureRig;posing=false;
 entries:InstantiatedEntries;groups=new Map<string,AnimationGroup>();nodes:TransformNode[];materials:Material[]=[];active='';armCut=false;
 constructor(scene:Scene,parent:TransformNode,enemy:boolean,kind='grunt'){
  const template=templates.get(scene)!;const prefix='organism'+serial+++'/';this.entries=template.instantiateModelsToScene(n=>prefix+n,true,{doNotInstantiate:true});
  for(const root of this.entries.rootNodes){root.parent=parent;(root as TransformNode).scaling.scaleInPlace(1.16);}
  this.nodes=this.entries.rootNodes.flatMap(r=>[r as TransformNode,...(r as TransformNode).getChildTransformNodes()]);
  for(const g of this.entries.animationGroups){g.stop();g.enableBlending=true;g.blendingSpeed=.12;this.groups.set(g.name.replace(prefix,''),g);}
  for(const root of this.entries.rootNodes)for(const mesh of root.getChildMeshes()){
   mesh.receiveShadows=true;mesh.isPickable=false;const m=mesh.material;if(!m)continue;this.materials.push(m);
   if(m instanceof PBRMaterial){m.forceIrradianceInFragment=true;m.environmentIntensity=.8;m.metallic=0;if(m.name.includes('Superhero')){m.albedoColor=Color3.FromHexString(enemy?'#929083':'#b6b8b6');m.roughness=.62;const body=mesh as Mesh;body.makeGeometryUnique();const positions=body.getVerticesData(VertexBuffer.PositionKind);if(positions){const colors:number[]=[];for(let i=0;i<positions.length;i+=3){const y=positions[i+1];const exposed=enemy?Math.max(0,Math.min(1,(y-1.51)*18)):1;const shade=enemy?.22:.095;colors.push(shade+(1-shade)*exposed,shade*1.12+(1-shade*1.12)*exposed,shade*1.28+(1-shade*1.28)*exposed,1);}body.setVerticesData(VertexBuffer.ColorKind,colors);}if(m.bumpTexture)m.bumpTexture.level=.9;this.materials.push(...dressCharacter(body,scene,enemy?kind:'player'));}}
  }
  this.signatureRig=new SignatureRig(this.nodes);this.play('Idle_Loop',true,1);
 }
 static available(scene:Scene){return templates.has(scene);}
 bone(name:string){const key=aliases[name]??name;return this.nodes.find(n=>n.name.endsWith('/'+key));}
 play(name:string,loop=true,speed=1){if(name===this.active)return;const next=this.groups.get(name);if(!next)return;for(const g of this.groups.values())g.stop();next.start(loop,speed,next.from,next.to);this.active=name;}
 animate(speed:number,air:boolean,glide:boolean,attack:number,kind:string,dead=false){
  if(dead){this.play('Death01',false,1.25);return;}
  if(kind==='held'){this.play('Hit_Chest',false,.65);return;}
  if(kind==='hold'){this.play('Spell_Simple_Shoot',false,.9);return;}
  if(attack>0)this.play(kind==='undertow'||kind==='slam'||kind==='consume'?'Spell_Simple_Shoot':kind==='blade'?'Sword_Attack':'Punch_Cross',false,kind==='undertow'?1.1:1.8);
  else this.play(air?'Jump_Loop':speed>11?'Sprint_Loop':speed>1?'Walk_Loop':kind==='blade'?'Sword_Idle':'Idle_Loop',true,speed>11?1.3:1);
 }
 pose(p:SignaturePose){if(!this.posing){for(const g of this.groups.values())g.stop();const idle=this.groups.get('Idle_Loop');if(idle){idle.start(false,1);idle.goToFrame(idle.from);idle.pause();}this.signatureRig.capture();this.posing=true;}this.active=p.kind+' / '+p.phase;this.signatureRig.apply(p);}
 clearPose(){if(!this.posing)return;this.signatureRig.clear();this.posing=false;this.active='';}
 cut(){this.armCut=true;this.bone('lowerarm_r')?.scaling.setAll(.001);}
 dispose(){this.entries.dispose();for(const m of new Set(this.materials))m.dispose(false,false);}
}
