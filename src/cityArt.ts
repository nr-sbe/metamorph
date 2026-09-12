import {PBRMaterial,Color3,Texture,Vector3,MeshBuilder,Mesh,VertexData,VertexBuffer,TransformNode} from '@babylonjs/core';
import {placeScan} from './scannedProps';
import type {City} from './world';

export function upgradeMaterials(city:City){
 const pbr=(name:string,color:string,rough=.7,metal=0)=>{
  city.materials[name]?.dispose();const m=new PBRMaterial(name,city.scene);m.albedoColor=Color3.FromHexString(color);m.roughness=rough;m.metallic=metal;m.forceIrradianceInFragment=true;m.forceIrradianceInFragment=true;m.environmentIntensity=.85;city.materials[name]=m;return m;
 };
 const scan=(name:string,asset:string,tiling:number,roughness=.8)=>{
  const m=pbr(name,'#ffffff',roughness);const t=(suffix:string)=>{const t=new Texture('/assets/textures/'+asset+'_'+suffix+'.jpg',city.scene);t.uScale=t.vScale=tiling;t.anisotropicFilteringLevel=8;return t;};
  m.albedoTexture=t('diff');m.bumpTexture=t('normal');m.bumpTexture.level=.55;m.metallicTexture=t('rough');m.useRoughnessFromMetallicTextureAlpha=false;m.useRoughnessFromMetallicTextureGreen=true;m.useMetallnessFromMetallicTextureBlue=false;return m;
 };
 const asphalt=scan('road','aerial_asphalt_01',45,.75);asphalt.albedoColor=new Color3(.28,.29,.29);
 const side=scan('sidewalk','concrete_wall_008',22,.9);side.albedoColor=new Color3(.62,.64,.63);
 scan('brick','brick_wall_001',1,.9);scan('concrete','concrete_wall_008',1,.87);
 pbr('metal','#343b3d',.38,.8);pbr('rubber','#121615',.95);pbr('paint','#c2c1b4',.82);
 pbr('windowFrame','#434b4c',.42,.65);pbr('windowReveal','#121b1e',.9);pbr('limestone','#96978c',.84);
 const glass=pbr('glass','#15212b',.13,.45);glass.clearCoat.isEnabled=true;glass.clearCoat.intensity=1;glass.clearCoat.roughness=.08;
 const lit=pbr('litWindow','#95866b',.7);lit.emissiveColor=new Color3(.28,.19,.09);
 for(const [name,color]of [['yellow','#af842c'],['blue','#283c48'],['white','#aeb4b1'],['red','#6b2822']]){const m=pbr(name,color,.26,.35);m.clearCoat.isEnabled=true;m.clearCoat.intensity=.85;m.clearCoat.roughness=.14;}
 pbr('wet','#131d20',.12,.15);pbr('bag','#121717',.45);pbr('paper','#aca28b',.97);
}

export function dressFacade(city:City,x:number,z:number,w:number,d:number,h:number){
 if(Math.abs(x)>65||Math.abs(z)>165)return;
 const side=-Math.sign(x),face=x+side*(w/2+.06),height=Math.min(h,50);
 const box=(name:string,xx:number,y:number,zz:number,sx:number,sy:number,sz:number,mat:string)=>city.box(name,new Vector3(xx,y,zz),new Vector3(sx,sy,sz),mat);
 box('limestone art deco facade',face,height/2,z,.08,height,d,'concrete');
 for(let y=6.8;y<height-1;y+=3.4){
  if(Math.round(y)%3===0)box('projecting stone stringcourse',face+side*.15,y-1.35,z,.3,.16,d+.3,'limestone');
  for(let zz=z-d/2+2.3;zz<z+d/2-1;zz+=3.65){
   box('recessed window opening',face+side*.055,y,zz,.13,2.46,1.95,'windowReveal');
   box('reflective window pane',face+side*.135,y,zz,.07,2.21,1.68,city.random()>.86?'litWindow':'glass');
   for(const dz of [-.91,.91])box('window jamb',face+side*.17,y,zz+dz,.15,2.5,.085,'windowFrame');
   box('window mullion',face+side*.22,y,zz,.15,2.3,.055,'windowFrame');
   box('window transom',face+side*.22,y-.12,zz,.16,.06,1.88,'windowFrame');
   box('stone window sill',face+side*.27,y-1.23,zz,.46,.14,2.14,'limestone');
   if(city.random()>.86)box('window air conditioner',face+side*.43,y-.9,zz,.85,.5,.8,'metal');
  }
 }
 for(let zz=z-d/2;zz<=z+d/2;zz+=5.2){
  box('storefront stone pier',face+side*.14,2.5,zz,.44,5,.4,'limestone');
  if(zz+4<z+d/2){box('storefront glazing',face+side*.18,2.15,zz+2.6,.12,3.4,4.55,'glass');box('storefront kick plate',face+side*.24,.48,zz+2.6,.24,.5,4.7,'metal');box('storefront door stile',face+side*.3,2,zz+2.7,.15,3.5,.07,'windowFrame');}
 }
 box('storefront fascia',face+side*.2,4.55,z,.45,.68,d,'metal');
 for(let i=0;i<3;i++)box('layered cornice',face+side*(.15+i*.12),height-.25+i*.18,z,.3+i*.2,.2,d+.4+i*.3,'limestone');
 // Fire escapes are silhouettes made from real geometry, not painted onto windows.
 for(let y=7;y<Math.min(height,14);y+=3.4){const zz=z+3;box('fire escape platform',face+side*.8,y-1.25,zz,1.7,.1,3.3,'metal');for(const dz of [-1.55,1.55])box('fire escape rail',face+side*1.6,y-.66,zz+dz,.06,1.1,.06,'metal');box('fire escape handrail',face+side*1.6,y-.1,zz,.065,.065,3.2,'metal');for(let dz=-1.4;dz<=1.5;dz+=.32)box('fire escape baluster',face+side*1.6,y-.7,zz+dz,.03,1.1,.03,'metal');for(let j=0;j<10;j++)box('escape ladder rung',face+side*.65,y-1.2+j*.34,zz+1.2,.62,.035,.045,'metal');}
}

export function dressStreet(city:City){
 const add=(m:Mesh,mat:string)=>{m.material=city.materials[mat];m.receiveShadows=true;city.staticMeshes.push(m);return m;};
 for(const side of [-1,1]){
  for(let z=-132;z<140;z+=3)city.box('individual curb stone',new Vector3(side*14.86,.16,z),new Vector3(.36,.32,2.95),'concrete');
  for(let z=-110;z<130;z+=26){
   city.box('storm drain frame',new Vector3(side*14.5,.022,z),new Vector3(.55,.025,1.25),'metal');
   for(let i=0;i<10;i++)city.box('drain slots',new Vector3(side*14.5,.04,z-.5+i*.11),new Vector3(.48,.01,.045),'rubber');
   const hydrant=MeshBuilder.CreateCylinder('cast fire hydrant',{diameter:.29,height:.78,tessellation:24},city.scene);hydrant.position.set(side*16.2,.59,z+6);add(hydrant,'red');
   const cap=MeshBuilder.CreateSphere('hydrant cap',{diameter:.34,segments:16},city.scene);cap.position.set(side*16.2,.98,z+6);cap.scaling.y=.48;add(cap,'metal');
   for(let i=0;i<2;i++){const root=new TransformNode('refuse arrangement',city.scene);root.position.set(side*(16.3+i*.55),.1,z+9+i*.3);const model=placeScan(city.scene,i===0?'metal_trash_can':'trashbag',root,i===0?.7:.6,i===0?1:.65,.7);model?.getChildMeshes().forEach(m=>city.shadow.addShadowCaster(m));}
   for(let i=0;i<3;i++){const puddle=MeshBuilder.CreateDisc('shallow street wetness',{radius:1,tessellation:48},city.scene);puddle.rotation.x=Math.PI/2;puddle.position.set(side*(11.8+city.random()*2),.012,z+city.random()*7);puddle.scaling.set(.3+city.random()*.6,1+city.random()*2,1);add(puddle,'wet');}
  }
 }
 for(let z=-90;z<200;z+=38){const cover=MeshBuilder.CreateCylinder('cast iron manhole',{diameter:1.05,height:.018,tessellation:48},city.scene);cover.position.set(3,.024,z);add(cover,'metal');for(let i=0;i<6;i++)city.box('manhole ridges',new Vector3(3,.042,z-.36+i*.145),new Vector3(.68,.012,.035),'rubber');}
}

// Continuous sedan body panels with a curved roof, not stacked primitive boxes.
export function makeSedan(city:City,parent:TransformNode,color:string){
 const parts:Mesh[]=[];
 const panel=(name:string,stations:number[][],mat:string)=>{
  const pathArray=stations.map(([z,y,w])=>[new Vector3(-w,y-.16,z),new Vector3(-w*.98,y,z),new Vector3(-w*.8,y+.085,z),new Vector3(w*.8,y+.085,z),new Vector3(w*.98,y,z),new Vector3(w,y-.16,z)]);
  const m=MeshBuilder.CreateRibbon(name,{pathArray,sideOrientation:Mesh.DOUBLESIDE},city.scene);m.parent=parent;m.material=city.materials[mat];parts.push(m);return m;
 };
 panel('sculpted sedan body',[[-2.33,.02,.75],[-2.12,.32,.99],[-1.55,.42,1],[1.25,.4,1],[2.04,.25,.96],[2.32,.04,.74]],color);
 panel('curved safety glass',[[-1.35,.42,.86],[-.83,.95,.73],[-.45,1.02,.72],[.45,1.01,.72],[.92,.47,.85]],'glass');
 panel('formed roof',[[-.89,.97,.74],[-.65,1.025,.75],[.3,1.035,.75],[.5,1.005,.74]],color);
 const b=(name:string,p:Vector3,s:Vector3,mat:string)=>{const m=city.box(name,p,s,mat,parent,false);parts.push(m);return m;};
 b('undercarriage',new Vector3(0,-.15,0),new Vector3(1.86,.25,4.25),'rubber');
 for(const side of [-1,1]){
  b('beltline chrome',new Vector3(side*.94,.44,-.25),new Vector3(.045,.035,3.1),'windowFrame');
  b('center door pillar',new Vector3(side*.78,.73,-.25),new Vector3(.09,.57,.1),'metal');
  b('door seam',new Vector3(side*1.001,.16,-.25),new Vector3(.008,.43,.017),'rubber');
  for(const z of [-.67,.62])b('recessed door handle',new Vector3(side*.99,.33,z),new Vector3(.035,.045,.19),'windowFrame');
  const mirror=MeshBuilder.CreateSphere('aerodynamic mirror',{diameter:1,segments:16},city.scene);mirror.position.set(side*1.08,.53,.7);mirror.scaling.set(.27,.13,.23);mirror.parent=parent;mirror.material=city.materials[color];parts.push(mirror);
  for(const z of [-1.48,1.43]){
   const tire=MeshBuilder.CreateTorus('rounded radial tire',{diameter:.69,thickness:.21,tessellation:32},city.scene);tire.rotation.z=Math.PI/2;tire.position.set(side*.96,-.12,z);tire.parent=parent;tire.material=city.materials.rubber;parts.push(tire);
   const rim=MeshBuilder.CreateCylinder('alloy wheel',{diameter:.52,height:.04,tessellation:32},city.scene);rim.rotation.z=Math.PI/2;rim.position.set(side*1.065,-.12,z);rim.parent=parent;rim.material=city.materials.windowFrame;parts.push(rim);
   for(let i=0;i<5;i++){const a=i*Math.PI*.4;const spoke=b('wheel spoke',new Vector3(side*1.09,-.12+Math.cos(a)*.14,z+Math.sin(a)*.14),new Vector3(.02,.28,.05),'metal');spoke.rotation.x=a;}
  }
 }
 for(const z of [-2.18,2.18]){b('bumper',new Vector3(0,-.025,z),new Vector3(1.76,.14,.19),color);b('number plate',new Vector3(0,.12,z+Math.sign(z)*.09),new Vector3(.38,.15,.012),'yellow');}
 b('radiator grille',new Vector3(0,.2,2.23),new Vector3(.75,.15,.05),'rubber');
 for(const side of [-1,1]){b('LED headlamp',new Vector3(side*.72,.27,2.12),new Vector3(.35,.12,.1),'light');b('rear light',new Vector3(side*.68,.29,-2.16),new Vector3(.38,.11,.055),'red');}
 return parts;
}
