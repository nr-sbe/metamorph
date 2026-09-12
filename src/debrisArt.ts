import {Color3,Geometry,Mesh,PBRMaterial,Scene,Texture,VertexData} from '@babylonjs/core';

export const DEBRIS_KINDS=['stone','metal','glass','wood','tissue','spike'] as const;
export type DebrisKind=typeof DEBRIS_KINDS[number];
type Point=[number,number,number];
export type FragmentShape={data:VertexData;half:Point};

// Small shared meshes, authored in material-specific silhouettes. No geometry is
// generated during combat; each pool slot swaps one of these eighteen buffers.
export function fragmentShape(kind:DebrisKind,variant=0):FragmentShape{
 let seed=variant*491+DEBRIS_KINDS.indexOf(kind)*977+27;
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const positions:number[]=[],indices:number[]=[],uvs:number[]=[],colors:number[]=[];
 const vertex=(p:Point,c:Point=[1,1,1])=>{const n=positions.length/3;positions.push(...p);uvs.push(p[0]+.5,p[2]+.5);colors.push(...c,1);return n;};
 const triangle=(a:Point,b:Point,c:Point,color:Point=[1,1,1])=>indices.push(vertex(a,color),vertex(c,color),vertex(b,color));
 if(kind==='stone'){
  // Torn pavement flakes: deliberately unrelated, asymmetric outlines and
  // tapered fracture edges, rather than regular-sided rock prisms.
  const outlines:[number,number][][]=[
   [[-.62,-.28],[-.13,-.48],[.47,-.18],[.56,.12],[.17,.4],[-.16,.25],[-.5,.29]],
   [[-.68,-.16],[-.21,-.29],[.56,-.14],[.31,.16],[-.03,.29],[-.47,.1]],
   [[-.45,-.46],[.09,-.28],[.48,-.32],[.37,.17],[.18,.47],[-.19,.24],[-.22,.04],[-.48,-.09]]
  ];
  const outline=outlines[variant%3],top:Point[]=[],bottom:Point[]=[];
  for(const [x,z] of outline){
   const y=.014+random()*.026;
   top.push([x,y,z]);bottom.push([x*(.73+random()*.22),y-(.045+random()*.04),z*(.77+random()*.2)]);
  }
  const center:Point=[-.03,.027,-.02],low:Point=[-.015,-.048,-.012];
  for(let i=0;i<outline.length;i++){
   const j=(i+1)%outline.length,t=.86+random()*.14,edge=.79+random()*.2;
   triangle(center,top[j],top[i],[.32*t,.37*t,.41*t]);
   triangle(low,bottom[i],bottom[j],[.76*edge,.83*edge,.87*edge]);
   triangle(top[i],top[j],bottom[i],[.89*edge,.95*edge,edge]);
   triangle(bottom[i],top[j],bottom[j],[.76*edge,.84*edge,.89*edge]);
  }
 }else if(kind==='metal'||kind==='glass'){
  const count=kind==='glass'?3:6;
  const top:Point[]=[],bottom:Point[]=[];
  for(let i=0;i<count;i++){
   const angle=(i+(random()-.5)*.3)*Math.PI*2/count,r=.38+random()*.2;
   const x=Math.cos(angle)*r,z=Math.sin(angle)*r;
   const y=kind==='metal'?Math.sin(x*6+variant)*.15+(random()-.5)*.06:.009;
   top.push([x,y,z]);bottom.push([x,y-(kind==='metal'?.025:.018),z]);
  }
  const center:Point=[.03,kind==='metal'?.05:.009,.015];
  const low:Point=[0,kind==='metal'?.025:-.009,0];
  for(let i=0;i<count;i++){
   const j=(i+1)%count,shade=.65+random()*.32;
   triangle(center,top[j],top[i],[shade,shade,shade]);
   triangle(low,bottom[i],bottom[j],[shade,shade,shade]);
   triangle(top[i],top[j],bottom[i],[shade,shade*.97,shade*.91]);
   triangle(bottom[i],top[j],bottom[j],[shade,shade*.97,shade*.91]);
  }
 }else{
  const sides=kind==='wood'?5:8,rings=kind==='wood'?4:7;
  for(let j=0;j<rings;j++){
   const t=j/(rings-1),angleOffset=kind==='wood'?0:t*.7;
   const radius=kind==='spike'?Math.pow(1-t,.85)*.3+.003:kind==='wood'?Math.sin(Math.PI*(.05+t*.9))*.1:Math.sin(Math.PI*(.07+t*.87))*(.2+.05*Math.sin(t*15+variant));
   for(let i=0;i<sides;i++){
    const a=i*Math.PI*2/sides+angleOffset,wobble=1+(random()-.5)*(kind==='wood'?.5:.18);
    const x=Math.cos(a)*radius*wobble+(kind==='spike'?t*t*.3:kind==='tissue'?Math.sin(t*4)*.1:0);
    const y=(t-.5)*(kind==='spike'?2.65:kind==='wood'?2.8:1.65);
    const z=Math.sin(a)*radius*wobble+(kind==='tissue'?Math.sin(t*5+variant)*.08:0);
    vertex([x,y,z],kind==='spike'?[.35+t*.42,.68+t*.28,.4+t*.45]:kind==='wood'?[.8+random()*.2,.72+random()*.2,.6+random()*.25]:[.68+random()*.3,.45+random()*.2,.43+random()*.2]);
    uvs[uvs.length-2]=i/sides;uvs[uvs.length-1]=t*3;
   }
  }
  for(let j=0;j<rings-1;j++)for(let i=0;i<sides;i++){const a=j*sides+i,b=j*sides+(i+1)%sides;indices.push(a,b,a+sides,b,b+sides,a+sides);}
  const end=(rings-1)*sides,center=(start:number):Point=>{const p:Point=[0,0,0];for(let i=0;i<sides;i++)for(let axis=0;axis<3;axis++)p[axis]+=positions[(start+i)*3+axis]/sides;return p;};
  const first=vertex(center(0)),last=vertex(center(end));
  for(let i=0;i<sides;i++){indices.push(first,(i+1)%sides,i);indices.push(last,end+i,end+(i+1)%sides);}
 }
 const normals:number[]=[];VertexData.ComputeNormals(positions,indices,normals);
 const data=new VertexData();data.positions=positions;data.indices=indices;data.normals=normals;data.uvs=uvs;data.colors=colors;
 const half:Point=[0,0,0];for(let i=0;i<positions.length;i++)half[i%3]=Math.max(half[i%3],Math.abs(positions[i]));
 return {data,half};
}

export class DebrisArt{
 readonly shapes=new Map<DebrisKind,{geometry:Geometry;half:Point}[]>();
 readonly materials=new Map<DebrisKind,PBRMaterial>();
 private textures:Texture[]=[];
 constructor(scene:Scene){
  const texture=(path:string,scale=1)=>{const t=new Texture('/assets/'+path,scene);t.uScale=t.vScale=scale;this.textures.push(t);return t;};
  for(const kind of DEBRIS_KINDS){
   this.shapes.set(kind,Array.from({length:3},(_,i)=>{const shape=fragmentShape(kind,i),geometry=new Geometry(kind+' fracture '+i,scene,shape.data);scene.pushGeometry(geometry);return {geometry,half:shape.half};}));
   const m=new PBRMaterial('fractured '+kind,scene);m.forceIrradianceInFragment=true;m.metallic=0;m.roughness=.85;m.environmentIntensity=.8;
   if(kind==='stone'){
    m.albedoTexture=texture('textures/asphalt_02_diff.jpg',.7);m.albedoColor=new Color3(.72,.77,.8);m.bumpTexture=texture('textures/asphalt_02_nor_gl.jpg',.7);m.bumpTexture.level=.7;m.roughness=.95;
   }else if(kind==='metal'){
    m.albedoTexture=texture('textures/metal_plate_diff.jpg');m.bumpTexture=texture('textures/metal_plate_normal.jpg');m.metallic=.86;m.roughness=.35;
   }else if(kind==='glass'){
    m.albedoColor=Color3.FromHexString('#a3d2cc');m.alpha=.58;m.roughness=.08;m.metallic=.25;m.backFaceCulling=false;m.clearCoat.isEnabled=true;m.clearCoat.intensity=1;
   }else if(kind==='wood'){
    m.albedoColor=Color3.FromHexString('#89704c');m.bumpTexture=texture('mutations/pine_bark_normal.jpg');m.bumpTexture.level=.65;
   }else{
    m.albedoColor=Color3.FromHexString(kind==='tissue'?'#76141b':'#153b25');m.bumpTexture=texture('mutations/brown_leather_normal.jpg');m.bumpTexture.level=.6;m.roughness=kind==='tissue'?.2:.29;m.clearCoat.isEnabled=true;m.clearCoat.intensity=.6;
    if(kind==='spike')m.emissiveColor=new Color3(.004,.022,.006);
   }
   this.materials.set(kind,m);
  }
 }
 apply(mesh:Mesh,kind:DebrisKind,variant:number){const shape=this.shapes.get(kind)![variant%3];mesh.material=this.materials.get(kind)!;shape.geometry.applyToMesh(mesh);return shape.half;}
 dispose(){for(const list of this.shapes.values())for(const shape of list)shape.geometry.dispose();for(const material of this.materials.values())material.dispose(false,false);this.textures.forEach(t=>t.dispose());}
}
