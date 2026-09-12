import { ASSET_BASE } from './assetPaths';
import {Scene,Mesh,VertexData,VertexBuffer,Vector3,PBRMaterial,Color3,TransformNode,Texture,Skeleton,Bone,Matrix,BoundingInfo} from '@babylonjs/core';
import type {Form} from './rules';

// Sculpted cross sections with capped tips, seam-smoothed normals and surface relief.
function loft(scene:Scene,name:string,path:Vector3[],width:number[],depth:number[],ridge=.1){
 const sides=24,positions:number[]=[],indices:number[]=[],uvs:number[]=[],normals:number[]=[],colors:number[]=[];
 for(let i=0;i<path.length;i++){
  const t=i/(path.length-1),tangent=path[Math.min(i+1,path.length-1)].subtract(path[Math.max(0,i-1)]).normalize();
  const side=Vector3.Cross(tangent,Math.abs(tangent.z)>.95?Vector3.Right():Vector3.Forward()).normalize(),binormal=Vector3.Cross(side,tangent).normalize();
  for(let j=0;j<=sides;j++){
   const a=j/sides*Math.PI*2,relief=1+ridge*Math.cos(a*4)*Math.sin(t*Math.PI)+.018*Math.sin(t*57+a*7)*Math.sin(t*Math.PI);
   const p=path[i].add(side.scale(Math.cos(a)*width[i]*relief)).add(binormal.scale(Math.sin(a)*depth[i]*relief));
   positions.push(p.x,p.y,p.z);uvs.push(j/sides,t*2);
   const tone=.65+.3*Math.pow(Math.abs(Math.sin(a)),3)+.05*Math.sin(t*29);colors.push(tone,tone,tone,1);
   if(i<path.length-1&&j<sides){const k=i*(sides+1)+j;indices.push(k,k+sides+1,k+1,k+1,k+sides+1,k+sides+2);}
  }
 }
 for(const end of [0,path.length-1]){const k=positions.length/3,p=path[end];positions.push(p.x,p.y,p.z);uvs.push(.5,end?1:0);colors.push(.7,.7,.7,1);for(let j=0;j<sides;j++){const a=end*(sides+1)+j;indices.push(k,end?a+1:a,end?a:a+1);}}
 VertexData.ComputeNormals(positions,indices,normals);
 for(let i=0;i<path.length;i++){const a=i*(sides+1)*3,b=a+sides*3;const n=new Vector3(normals[a]+normals[b],normals[a+1]+normals[b+1],normals[a+2]+normals[b+2]).normalize();for(const k of [a,b]){normals[k]=n.x;normals[k+1]=n.y;normals[k+2]=n.z;}}
 const data=new VertexData();Object.assign(data,{positions,indices,normals,uvs,colors});const mesh=new Mesh(name,scene);data.applyToMesh(mesh);return mesh;
}
const range=(n:number,f:(t:number,i:number)=>Vector3)=>Array.from({length:n},(_,i)=>f(i/(n-1),i));
const surfaces=new WeakMap<Scene,{shellNormal:Texture;shellRough:Texture;tissueNormal:Texture;tissueRough:Texture}>();
function maps(scene:Scene){
 if(typeof document==='undefined')return null;
 let value=surfaces.get(scene);if(value)return value;
 const load=(name:string,u:number,v:number)=>{const t=new Texture(ASSET_BASE+'mutations/'+name+'.jpg',scene);t.uScale=u;t.vScale=v;t.gammaSpace=false;t.anisotropicFilteringLevel=8;return t;};
 value={shellNormal:load('pine_bark_normal',1.5,2),shellRough:load('pine_bark_rough',1.5,2),tissueNormal:load('brown_leather_normal',2,3),tissueRough:load('brown_leather_rough',2,3)};
 value.shellNormal.level=.34;value.tissueNormal.level=.7;surfaces.set(scene,value);return value;
}
export class MutationArt{
 shell:PBRMaterial;edge:PBRMaterial;tissue:PBRMaterial;vein:PBRMaterial;
 skeleton:Skeleton|null=null;bones:Bone[]=[];form:Form='Unarmed';age=0;lastTime=0;
 constructor(public scene:Scene){
  const material=(name:string,color:string,roughness:number,metallic:number)=>{const m=new PBRMaterial(name,scene);m.albedoColor=Color3.FromHexString(color).toLinearSpace();m.roughness=roughness;m.metallic=metallic;m.forceIrradianceInFragment=true;m.environmentIntensity=1.05;return m;};
  this.shell=material('fractured obsidian carapace','#424449',.48,.12);this.edge=material('exposed ivory keratin','#b7ac91',.3,.12);
  this.tissue=material('wet recessed connective tissue','#102d20',.3,0);this.vein=material('living fissures','#6aaf48',.34,0);this.vein.emissiveColor=new Color3(.018,.09,.006);
  this.shell.clearCoat.isEnabled=true;this.shell.clearCoat.intensity=.23;this.shell.clearCoat.roughness=.33;
  this.tissue.clearCoat.isEnabled=true;this.tissue.clearCoat.intensity=.65;this.tissue.clearCoat.roughness=.18;
  const scan=maps(scene);if(scan){this.shell.bumpTexture=scan.shellNormal;this.shell.metallicTexture=scan.shellRough;this.tissue.bumpTexture=scan.tissueNormal;this.tissue.metallicTexture=scan.tissueRough;for(const m of [this.shell,this.tissue]){m.useRoughnessFromMetallicTextureAlpha=false;m.useRoughnessFromMetallicTextureGreen=true;m.useMetallnessFromMetallicTextureBlue=false;}}
 }
 create(form:Form,arms:TransformNode[],skinned:boolean){
  this.skeleton?.dispose();this.skeleton=null;this.bones=[];this.form=form;this.age=0;
  const meshes:Mesh[]=[];
  const shape=(name:string,p:Vector3[],w:number[],d:number[],arm:number,mat=this.shell,ridge=.1)=>{const m=loft(this.scene,name,p,w,d,ridge);m.parent=arms[arm];m.material=mat;m.receiveShadows=true;if(!skinned){m.position.y=-.96;m.rotation.z=Math.PI;}meshes.push(m);return m;};
  const tendon=(name:string,p:Vector3[],r:number,arm:number,mat=this.tissue)=>{const w=p.map((_,i)=>r*(.45+.55*Math.sin(Math.PI*i/(p.length-1))));return shape(name,p,w,w,arm,mat,.07);};
  const horn=(base:Vector3,tip:Vector3,r:number,arm:number,mat=this.edge)=>{const p=range(15,t=>Vector3.Lerp(base,tip,t).add(new Vector3(.065*Math.sin(t*Math.PI),0,0)));shape('recurved keratin spur',p,p.map((_,i)=>r*Math.pow(1-i/14,1.2)+.0005),p.map((_,i)=>r*.65*(1-i/14)+.0005),arm,mat,.16);};
  const graft=(arm:number,scale=1)=>{
   const p=range(25,t=>new Vector3(0,-.43+t*.68,0)),w=p.map((_,i)=>scale*(.065+.065*Math.sin(Math.PI*i/24)));
   shape('muscle woven wrist',p,w,w.map(x=>x*.85),arm,this.tissue);
   for(let j=0;j<6;j++){const a=j*Math.PI/3;const p=range(19,t=>new Vector3(Math.cos(a+t*.5)*(.11+Math.sin(t*Math.PI)*.03)*scale,-.39+t*.62,Math.sin(a+t*.5)*.1*scale));shape('overlapping forearm scute',p,p.map((_,i)=>scale*.067*Math.pow(Math.max(0,Math.sin(Math.PI*i/18)),.6)+.001),p.map((_,i)=>scale*.025*Math.sin(Math.PI*i/18)+.001),arm);}
   for(let i=0;i<3;i++){const a=i*2.1;const p=range(24,t=>new Vector3(Math.cos(a+t*1.2)*.129*scale,-.34+t*.55,Math.sin(a+t*1.2)*.106*scale));tendon('buried capillary',p,.006,arm,this.vein);}
  };
  if(form==='Unarmed')return meshes;
  for(const arm of form==='Blade'||form==='Whipfist'?[1]:[0,1])graft(arm,form==='Hammerfists'?1.7:1);
  if(form==='Claws')for(const arm of [0,1]){
   for(let finger=0;finger<4;finger++){
    const x=(finger-1.5)*.089,length=.73+(finger===1||finger===2?.17:0),p=range(37,t=>new Vector3(x*(1+t*.8),.04+t*length,.035+t*t*.3));
    const w=p.map((_,i)=>.059*Math.pow(1-i/36,.85)+.0007);shape('hooked raptor talon',p,w,w.map(x=>x*.63),arm,this.shell,.28);
    shape('talon honed ridge',p.map((v,i)=>v.add(new Vector3(0,0,w[i]*.58))),w.map(x=>x*.25),w.map(x=>x*.15),arm,this.edge,0);
    for(let j=0;j<3;j++){const t=j*.17;horn(new Vector3(x*(1+t),.09+j*.14,-.024),new Vector3(x*(1+t),.14+j*.14,-.105),.03,arm,this.shell);}
   }
   horn(new Vector3(-.15,.02,0),new Vector3(-.31,.39,.23),.085,arm,this.shell);
  }
  if(form==='Blade'){
   const p=range(65,t=>new Vector3(.035+.42*t*t,-.16+t*2.03,.015)),w=p.map((_,i)=>{const t=i/64;return (.08+.24*Math.sin(Math.PI*Math.pow(t,.65)))*Math.pow(1-t,.5)+.001;});
   shape('asymmetric execution blade',p,w,w.map(x=>x*.24),1,this.shell,.38);
   shape('razor bevel',p.map((v,i)=>v.add(new Vector3(-w[i]*.97,0,.005))),w.map(x=>x*.17),w.map(x=>x*.048),1,this.edge,0);
   for(let j=0;j<7;j++){const k=8+j*6,v=p[k].add(new Vector3(w[k]*.8,0,0));horn(v,v.add(new Vector3(.13,-.18,0)),.065*(1-j*.085),1,this.shell);}
   for(const sign of [-1,1]){const rib=range(42,t=>new Vector3(.04+.38*t*t,-.12+t*1.7,sign*(.015+.065*Math.sin(Math.PI*t))));shape('raised blade central rib',rib,rib.map((_,i)=>.038*Math.sin(Math.PI*i/41)+.002),rib.map((_,i)=>.018*Math.sin(Math.PI*i/41)+.001),1,this.shell,.4);tendon('blade fissure',rib.slice(0,30).map(v=>v.add(new Vector3(.052,0,-sign*.009))),.007,1,this.vein);}
  }
  if(form==='Hammerfists')for(const arm of [0,1]){
   const p=range(35,t=>new Vector3(.025*Math.sin(t*4),-.22+t*.97,0)),w=p.map((_,i)=>.09+.27*Math.pow(Math.max(0,Math.sin(Math.PI*i/34)),.6));shape('compressed impact core',p,w,w.map(x=>x*.88),arm,this.tissue,.16);
   for(let j=0;j<7;j++){
    const a=j*Math.PI*2/7,p=range(27,t=>{const r=.16+.21*Math.sin(t*Math.PI);return new Vector3(Math.cos(a)*r,-.27+t*1.01,Math.sin(a)*r*.92);}),w=p.map((_,i)=>.15*Math.pow(Math.max(0,Math.sin(Math.PI*i/26)),.38)+.001);
    shape('interlocking impact carapace',p,w,w.map(x=>x*.42),arm,this.shell,.35);
    if(j%2===0)tendon('fracture heat seam',p.slice(5,20).map(v=>v.add(new Vector3(.017,0,.015))),.009,arm,this.vein);
   }
   for(let j=0;j<4;j++){const x=(j-1.5)*.17,p=range(23,t=>new Vector3(x,.36+t*.35,.11+Math.sin(t*Math.PI)*.16));shape('dense knuckle keel',p,p.map((_,i)=>.097*Math.sin(Math.PI*i/22)+.002),p.map((_,i)=>.1*Math.sin(Math.PI*i/22)+.002),arm,this.shell,.45);}
   for(let j=0;j<3;j++)horn(new Vector3((j-1)*.2,.01,-.29),new Vector3((j-1)*.28,-.19,-.44),.085,arm,this.shell);
  }
  if(form==='Whipfist'){
   const p=range(109,t=>new Vector3(0,.12+t*3.08,0)),r=p.map((_,i)=>.115*(1-i/108*.75));shape('continuous flexor spine',p,r,r.map(x=>x*.85),1,this.tissue,.14);
   for(let strand=0;strand<3;strand++){const p=range(109,t=>{const a=t*13+strand*Math.PI*2/3,r=.078*(1-t*.55);return new Vector3(Math.cos(a)*r,.12+t*3.08,Math.sin(a)*r);});tendon('helical nerve bundle',p,.012,1,strand===0?this.vein:this.tissue);}
   for(let segment=0;segment<17;segment++){
    const y=.15+segment*.168,r=.126*(1-segment/22);
    for(const side of [-1,1]){
     const p=range(19,t=>new Vector3(side*r*.36,y+t*.25,r*(.22+.6*Math.sin(t*Math.PI))));shape('overlapping spinal armor',p,p.map((_,i)=>r*.93*Math.pow(Math.max(0,Math.sin(Math.PI*i/18)),.55)+.001),p.map((_,i)=>r*.48*Math.sin(Math.PI*i/18)+.001),1,this.shell,.35);
     if(segment%2===0)horn(new Vector3(side*r*.55,y+.07,0),new Vector3(side*(r+.11),y-.055,-.025),r*.47,1,segment>10?this.edge:this.shell);
    }
   }
   const head=range(25,t=>new Vector3(0,2.94+t*.42,0));shape('harpoon cranium',head,head.map((_,i)=>.17*Math.sin(Math.PI*i/24)+.018),head.map((_,i)=>.11*Math.sin(Math.PI*i/24)+.009),1,this.shell,.3);
   for(const sign of [-1,1]){const p=range(33,t=>new Vector3(sign*(.035+.25*Math.sin(t*Math.PI*.87)),3.06+t*.66,.06*Math.sin(t*Math.PI))),w=p.map((_,i)=>.092*Math.pow(1-i/32,.78)+.0005);shape('split harpoon sickle',p,w,w.map(x=>x*.42),1,this.edge,.2);horn(new Vector3(sign*.12,3.1,0),new Vector3(sign*.32,2.94,0),.072,1,this.shell);}
  }
  // Batch by material and parent; the skinned Whipfist uses four render meshes.
  const groups=new Map<string,Mesh[]>();for(const m of meshes){const key=m.parent!.uniqueId+':'+m.material!.uniqueId;const a=groups.get(key)||[];a.push(m);groups.set(key,a);}
  const result:Mesh[]=[];for(const group of groups.values()){const parent=group[0].parent;for(const m of group){m.parent=null;m.computeWorldMatrix(true);}const merged=group.length===1?group[0]:Mesh.MergeMeshes(group,true,true)!;merged.parent=parent;result.push(merged);}
  if(form==='Whipfist'&&skinned){
   this.skeleton=new Skeleton('whipfist living spine','whip-spine',this.scene);for(let i=0;i<21;i++)this.bones.push(new Bone('vertebra '+i,this.skeleton,i?this.bones[i-1]:null,Matrix.Translation(0,i===0?0:i===1?.12:.18,0)));
   for(const m of result){const p=m.getVerticesData(VertexBuffer.PositionKind)!,indices:number[]=[],weights:number[]=[];for(let i=0;i<p.length;i+=3){const f=Math.max(0,Math.min(20,p[i+1]<.12?0:1+(p[i+1]-.12)/.18)),a=Math.floor(f),b=Math.min(20,a+1),w=f-a;indices.push(a,b,0,0);weights.push(1-w,w,0,0);}m.setVerticesData(VertexBuffer.MatricesIndicesKind,indices);m.setVerticesData(VertexBuffer.MatricesWeightsKind,weights);m.skeleton=this.skeleton;m.numBoneInfluencers=2;m.setBoundingInfo(new BoundingInfo(new Vector3(-4,-4,-4),new Vector3(4,4,4)));}
  }
  return result;
 }
 animate(time:number,attack:number,speed:number){
  const dt=Math.min(.1,Math.max(0,time-this.lastTime));this.lastTime=time;this.age+=dt;this.vein.emissiveColor.set(.012,.065+.025*Math.sin(time*2.5),.004);
  const strike=Math.sin(Math.PI*Math.max(0,Math.min(1,attack))),awake=Math.min(1,this.age*3);
  for(let i=1;i<this.bones.length;i++){const wave=Math.sin(time*2.1-i*.42)*.033,coil=(i===1?.55:.148)*(1-strike*.9);this.bones[i].setRotation(new Vector3((coil+wave)*awake,.015*Math.sin(time*1.7-i*.34),(.02*Math.sin(time-i*.3)+strike*.045*Math.sin(i*.5))*awake));}
 }
 dispose(){this.skeleton?.dispose();this.shell.dispose();this.edge.dispose();this.tissue.dispose();this.vein.dispose();}
}
