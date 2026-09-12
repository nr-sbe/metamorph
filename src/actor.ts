import {Scene,TransformNode,MeshBuilder,Mesh,StandardMaterial,Color3,Vector3,Quaternion} from '@babylonjs/core';
import {CharacterSkin} from './characters';
import {MutationArt} from './mutations';
import {poseAngles,type SignaturePose} from './signaturePose';
import type {Form} from './rules';
export class Actor{
 signaturePose:SignaturePose|null=null;
 onFormChanged:(meshes:Mesh[])=>void=()=>{};mutationArt:MutationArt;skin:CharacterSkin|null=null;lastAttackProgress=0;
 root:TransformNode;torso:TransformNode;arms:TransformNode[]=[];legs:TransformNode[]=[];hands:Mesh[]=[];head:Mesh;wing:Mesh;shield:Mesh;forms:Mesh[]=[];parts:Mesh[]=[];form:Form='Unarmed';ownedMaterials:StandardMaterial[]=[];plateMaterial:StandardMaterial;edgeMaterial:StandardMaterial;
 constructor(public scene:Scene,public enemy=false,public heavy=false,public kind='grunt'){
 this.mutationArt=new MutationArt(scene);this.root=new TransformNode('actor',scene);this.torso=new TransformNode('torso',scene);this.torso.parent=this.root;
 const skin=new StandardMaterial('obsidian tissue',scene);skin.diffuseColor=Color3.FromHexString(enemy?'#65564c':'#24292b');skin.specularColor=new Color3(.45,.4,.38);skin.specularPower=55;
 const plate=new StandardMaterial('organic armor',scene);plate.diffuseColor=Color3.FromHexString(enemy?'#a28b70':'#455052');plate.specularColor=new Color3(.55,.5,.45);
 const hot=new StandardMaterial('vascular glow',scene);hot.diffuseColor=Color3.FromHexString(enemy?'#e6a066':'#6aaf48');hot.emissiveColor=Color3.FromHexString(enemy?'#5e2614':'#183f0b');
 const bone=new StandardMaterial('cutting edge',scene);bone.diffuseColor=Color3.FromHexString('#b8ac9a');bone.specularColor=new Color3(.8,.7,.6);this.ownedMaterials=[skin,plate,hot,bone];this.plateMaterial=plate;this.edgeMaterial=bone;
 const part=(name:string,size:number[],pos:number[],mat:StandardMaterial,parent:TransformNode=this.torso,sphere=false)=>{const m=sphere?MeshBuilder.CreateSphere(name,{diameter:1,segments:8},scene):MeshBuilder.CreateBox(name,{size:1},scene);m.scaling.set(...size as [number,number,number]);m.position.set(...pos as [number,number,number]);m.material=mat;m.parent=parent;this.parts.push(m);return m;};
 part('rib cage',[.8,.86,.4],[0,1.42,0],skin,undefined,true);
 part('chest armor',[.78,.44,.43],[0,1.61,0],plate,undefined,true);
 part('waist',[.49,.3,.33],[0,.97,0],skin,undefined,true);
 for(let i=0;i<5;i++){const rib=part('vascular rib',[.065,.3,.05],[(i-2)*.125,1.48,.215],hot);rib.rotation.z=(i-2)*.19;}
 this.head=part('head',[.34,.43,.35],[0,2.06,0],skin,undefined,true);
 part('brow',[.32,.12,.3],[0,2.14,.04],plate,undefined,true);
 part('eyes',[.23,.035,.045],[0,2.09,.177],hot);
 for(const s of [-1,1]){
  const arm=new TransformNode('arm',scene);arm.parent=this.torso;arm.position.set(s*.53,1.74,0);this.arms.push(arm);
  part('shoulder',[.4,.4,.43],[0,-.05,0],plate,arm,true);
  part('upperarm',[.27,.53,.29],[0,-.32,0],skin,arm,true);
  part('forearm',[.29,.46,.3],[0,-.7,.04],plate,arm,true);
  this.hands.push(part('hand',[.26,.27,.28],[0,-.99,.07],skin,arm,true));
  const leg=new TransformNode('leg',scene);leg.parent=this.root;leg.position.set(s*.23,.96,0);this.legs.push(leg);
  part('thigh',[.31,.53,.35],[0,-.23,0],skin,leg,true);part('shin',[.25,.45,.29],[0,-.66,0],plate,leg,true);part('foot',[.29,.17,.49],[0,-.87,.1],skin,leg,true);
 }
 this.wing=MeshBuilder.CreateRibbon('glide membrane',{pathArray:[[-1.3,-.7,0,.7,1.3].map(x=>new Vector3(x,1.5,-.2)),[-1.7,-.6,0,.6,1.7].map(x=>new Vector3(x,.5,-.8))],sideOrientation:Mesh.DOUBLESIDE},scene);this.wing.material=skin;this.wing.parent=this.root;this.wing.setEnabled(false);
 this.shield=part('shield',[.85,1.2,.27],[0,-.55,.32],plate,this.arms[0],true);this.shield.setEnabled(false);
 // Merge rigid pieces within each articulated part while keeping hands and head editable.
 const groups=new Map<string,Mesh[]>();for(const m of this.parts){if(m===this.head||m===this.shield||this.hands.includes(m))continue;const key=m.parent!.uniqueId+':'+m.material!.uniqueId;const group=groups.get(key)||[];group.push(m);groups.set(key,group);}
 for(const group of groups.values())if(group.length>1){const parent=group[0].parent;const merged=Mesh.MergeMeshes(group,true,true);if(merged)merged.setParent(parent);}
 if(CharacterSkin.available(scene)){
  const fallbackMeshes=this.root.getChildMeshes();this.skin=new CharacterSkin(scene,this.root,enemy,kind);
  for(const mesh of fallbackMeshes)if(mesh!==this.wing&&mesh!==this.shield)mesh.dispose();
  this.arms.forEach((arm,i)=>{const hand=this.skin!.bone(i?'DEF-hand.R':'DEF-hand.L');if(hand){arm.parent=hand;arm.position.setAll(0);arm.rotation.set(0,Math.PI/2,0);}});
 }
 if(heavy)this.root.scaling.setAll(1.65);
 }
 setForm(form:Form){if(form===this.form&&this.forms.length)return;this.form=form;this.forms.forEach(m=>m.dispose());this.forms=[];this.hands.forEach(h=>h.scaling.set(.26,.27,.28));
 this.forms=this.mutationArt.create(form,this.arms,!!this.skin);this.onFormChanged(this.forms);
 }
 animate(t:number,speed:number,air:boolean,glide:boolean,attack:number,kind:string,defense:string){
 this.mutationArt.animate(t,attack,speed);this.wing.setEnabled(glide);this.shield.setEnabled(defense==='Shield');if(this.skin){this.root.scaling.set(this.heavy?1.65:defense==='Armor'?1.1:1,this.heavy?1.65:1,this.heavy?1.65:defense==='Armor'?1.1:1);if(attack>0&&(this.lastAttackProgress<=0||attack<this.lastAttackProgress))this.skin.active='';this.lastAttackProgress=attack;if(this.signaturePose){this.skin.pose(this.signaturePose);return;}this.skin.clearPose();this.skin.animate(speed,air,glide,attack,this.form==='Blade'&&kind!=='undertow'?'blade':kind);return;}
 this.torso.rotation.set(air?.15:Math.min(.17,speed*.006),Math.sin(attack*Math.PI)*.6,0);
 const stride=Math.sin(t*(speed>10?16:9))*Math.min(.9,speed*.11);
 this.legs.forEach((leg,i)=>{leg.rotation.x=air?.4+(i?.3:0):stride*(i?-1:1);});
 this.arms.forEach((arm,i)=>{arm.rotation.set(-stride*(i?-1:1)*.65,0,(i?1:-1)*.12);if(glide)arm.rotation.z=(i?1:-1)*1.5;
 if(attack>0){const a=Math.sin(attack*Math.PI);arm.rotation.x=kind==='slam'?-2.8*a:-1.8*a;arm.rotation.z=(i?1:-1)*(kind==='undertow'?1.2*a:.35);}
 });
 if(this.signaturePose){const a=poseAngles(this.signaturePose);if(a.spine_01)this.torso.rotation.set(...a.spine_01);this.arms.forEach((arm,i)=>{const r=a[i?'upperarm_r':'upperarm_l'];if(r)arm.rotation.set(...r);});}
 this.root.scaling.setAll(this.heavy?1.65:1);if(defense==='Armor')this.torso.scaling.set(1.17,1.03,1.17);else this.torso.scaling.setAll(1);
 }
 die(){this.signaturePose=null;this.skin?.clearPose();this.skin?.animate(0,false,false,0,'',true);}
 cutArm(){if(this.skin)this.skin.cut();else this.arms[1].setEnabled(false);}
 meshes(){return this.root.getChildMeshes();}
 dispose(){this.mutationArt.dispose();this.skin?.dispose();this.root.dispose();this.ownedMaterials.forEach(m=>m.dispose());}
}
