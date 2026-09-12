import { ASSET_BASE } from './assetPaths';
import {Color3, DynamicTexture, Mesh, PBRMaterial, Scene, Texture, VertexBuffer, VertexData} from '@babylonjs/core';

type Garment = 'shirt' | 'trousers' | 'boots' | 'pockets' | 'belt' | 'vest' | 'helmet' | 'hood' | 'mask' | 'pads';

// Garments inherit the body's bind pose and weights, so the existing animation
// library and mutation sockets continue to work without a second skeleton.
export function dressCharacter(body:Mesh, scene:Scene,style='player'):PBRMaterial[] {
 const enemy=style!=='player',heavy=style==='brute'||style==='boss',hunter=style==='hunter';
 const palette=style==='player'?{shirt:'#92988d',pants:'#535b3e',vest:'#535b3e',head:'#333d34'}:hunter?{shirt:'#543448',pants:'#282b36',vest:'#382a39',head:'#392b40'}:heavy?{shirt:'#263a3c',pants:'#273136',vest:'#7c8170',head:'#899385'}:style==='ranged'?{shirt:'#304758',pants:'#293d4e',vest:'#1c303b',head:'#465a62'}:{shirt:'#655440',pants:'#333c41',vest:'#b08232',head:'#b49752'};
 const source=body.getVerticesData(VertexBuffer.PositionKind)!;
 const normals=body.getVerticesData(VertexBuffer.NormalKind)!;
 const joints=body.getVerticesData(VertexBuffer.MatricesIndicesKind)!;
 const weights=body.getVerticesData(VertexBuffer.MatricesWeightsKind)!;
 const triangles=Array.from(body.getIndices()!);
 const adjacency=Array.from({length:source.length/3},()=>new Set<number>());
 for(let i=0;i<triangles.length;i+=3)for(let j=0;j<3;j++) {
  const v=triangles[i+j];adjacency[v].add(triangles[i+(j+1)%3]);adjacency[v].add(triangles[i+(j+2)%3]);
 }
 // Relax the muscle contours before adding ease and folds to the fabric shell.
 let relaxed=Array.from(source);
 for(let pass=0;pass<5;pass++) {
  const next=relaxed.slice();
  adjacency.forEach((neighbors,v)=>{if(!neighbors.size)return;for(let k=0;k<3;k++){let sum=0;for(const n of neighbors)sum+=relaxed[n*3+k];next[v*3+k]=relaxed[v*3+k]*.55+sum/neighbors.size*.45;}});
  relaxed=next;
 }
 const fabric=new DynamicTexture('original cotton twill', {width:256,height:256},scene,false);
 const ctx=fabric.getContext(),pixels=ctx.getImageData(0,0,256,256);
 for(let y=0;y<256;y++)for(let x=0;x<256;x++) {
  const grain=((x*73+y*157+x*y*13)%19)-9;
  const thread=((x+y)%8<3?10:-5)+(x%3===0?5:0);
  const c=224+grain+thread,i=(y*256+x)*4;
  pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=c;pixels.data[i+3]=255;
 }
 ctx.putImageData(pixels,0,0);fabric.update(false);fabric.wrapU=fabric.wrapV=Texture.WRAP_ADDRESSMODE;
 const cloth=new PBRMaterial('washed cotton and olive canvas',scene);
 cloth.albedoTexture=fabric;cloth.roughness=.96;cloth.metallic=0;cloth.environmentIntensity=.65;
 cloth.forceIrradianceInFragment=true;cloth.backFaceCulling=false;
 const leather=new PBRMaterial('worn leather boots and belt',scene);
 leather.albedoColor=Color3.FromHexString('#333831');leather.roughness=.76;leather.metallic=0;
 leather.bumpTexture=new Texture(ASSET_BASE+'mutations/brown_leather_normal.jpg',scene);
 leather.bumpTexture.level=.24;leather.forceIrradianceInFragment=true;leather.backFaceCulling=false;
 const accepts=(kind:Garment,x:number,y:number,z:number)=> {
  if(kind==='shirt')return y>.946&&y<1.558&&Math.abs(x)<(hunter?.35:enemy?.72:.455)&&!(y>1.53&&Math.abs(x)<.1);
  if(kind==='trousers')return y>.135&&y<.965;
  if(kind==='boots')return y<.225;
  if(kind==='pockets')return y>.63&&y<.82&&Math.abs(x)>.135;
  if(kind==='belt')return y>.928&&y<.978&&Math.abs(x)<.22;
  if(kind==='vest')return y>1.015&&y<1.5&&Math.abs(x)<.205;
  if(kind==='helmet')return y>(heavy?1.68:style==='ranged'?1.705:1.735);
  if(kind==='hood')return y>1.505&&(z<.025||Math.abs(x)>.08);
  if(kind==='mask')return y>1.584&&y<1.687&&z>.033;
  return y>1.29&&y<1.55&&Math.abs(x)>.195&&Math.abs(x)<.39;
 };
 const kinds:Garment[]=['shirt','trousers','boots','pockets','belt'];if(enemy)kinds.push('vest','mask',hunter?'hood':'helmet');if(heavy)kinds.push('pads');
 const meshes:Mesh[]=[];
 for(const kind of kinds) {
  const indices:number[]=[],used=new Map<number,number>();
  const p:number[]=[],n:number[]=[],uv:number[]=[],c:number[]=[],ji:number[]=[],w:number[]=[];
  for(let i=0;i<triangles.length;i+=3) {
   const ids=triangles.slice(i,i+3);
   const x=ids.reduce((s,v)=>s+source[v*3],0)/3,y=ids.reduce((s,v)=>s+source[v*3+1],0)/3,z=ids.reduce((s,v)=>s+source[v*3+2],0)/3;
   if(!accepts(kind,x,y,z))continue;
   for(const v of ids) {
    if(!used.has(v)) {
     used.set(v,p.length/3);
     const x=source[v*3],y=source[v*3+1],z=source[v*3+2];
     const nx=normals[v*3],ny=normals[v*3+1],nz=normals[v*3+2];
     const isShirt=kind==='shirt',isPants=kind==='trousers';
     const knee=Math.exp(-Math.pow((y-.52)/.095,2));
     const fold=isShirt?.004*Math.sin(y*95+x*18):isPants?.009*Math.sin(y*110+x*28)*(knee+.3):0;
     const ease=isShirt?.021+fold:isPants?.027+fold:kind==='pockets'?.057:kind==='belt'?.033:kind==='hood'?.065:kind==='helmet'?.045:kind==='mask'?.027:kind==='vest'?(heavy?.07:.045):kind==='pads'?.09:.016;
     const smooth=isShirt||isPants?.7:0;
     p.push(x+(relaxed[v*3]-x)*smooth+nx*ease,y+ny*ease*.35,z+(relaxed[v*3+2]-z)*smooth+nz*ease);
     // Meter-based UVs keep the woven texture consistent across garment parts.
     uv.push((x+z)*12,y*12);
     const stripe=enemy&&!hunter&&kind==='vest'&&(Math.abs(y-1.16)<.014||Math.abs(y-1.37)<.014);
     const color=isShirt?palette.shirt:isPants||kind==='pockets'?palette.pants:kind==='vest'?palette.vest:kind==='hood'?palette.shirt:kind==='helmet'||kind==='pads'?palette.head:kind==='mask'?(hunter?'#ada891':'#4c5b59'):enemy?'#272f2f':'#777b72';
     const base=Color3.FromHexString(stripe?'#d5d9a1':color);
     const seam=isShirt&&(y<.97||Math.abs(x)>.432||y>1.51&&Math.abs(x)<.105);
     const flap=kind==='pockets'&&y>.785;
     const crease=1+(isShirt?fold*10:fold*5)-(seam?.28:0)-(flap?.2:0);
     c.push(base.r*crease,base.g*crease,base.b*crease,1);
     for(let k=0;k<4;k++){ji.push(joints[v*4+k]);w.push(weights[v*4+k]);}
    }
    indices.push(used.get(v)!);
   }
  }
  VertexData.ComputeNormals(p,indices,n);
  const data=new VertexData();Object.assign(data,{positions:p,normals:n,uvs:uv,colors:c,matricesIndices:ji,matricesWeights:w,indices});
  const mesh=new Mesh('streetwear / '+kind,scene);data.applyToMesh(mesh);
  mesh.parent=body.parent;mesh.position.copyFrom(body.position);mesh.scaling.copyFrom(body.scaling);
  mesh.rotationQuaternion=body.rotationQuaternion?.clone()??null;mesh.rotation.copyFrom(body.rotation);
  mesh.skeleton=body.skeleton;mesh.material=['boots','belt','helmet','mask','pads'].includes(kind)?leather:cloth;
  mesh.receiveShadows=true;mesh.isPickable=false;meshes.push(mesh);
 }
 // Remove skin beneath the outfit. Independent animation weights can otherwise
 // expose the underlying thigh/chest at extreme bends, despite adequate ease.
 const exposed:number[]=[];
 for(let i=0;i<triangles.length;i+=3){
  const ids=triangles.slice(i,i+3);
  const x=ids.reduce((s,v)=>s+source[v*3],0)/3,y=ids.reduce((s,v)=>s+source[v*3+1],0)/3,z=ids.reduce((s,v)=>s+source[v*3+2],0)/3;
  if(!kinds.filter(k=>k!=='vest'&&k!=='pockets'&&k!=='belt'&&k!=='pads').some(kind=>accepts(kind,x,y,z)))exposed.push(...ids);
 }
 body.setIndices(exposed);
 if(enemy)leather.albedoColor=new Color3(.8,.85,.8);
 // One skinned mesh per material keeps the extra outfits inexpensive in crowds.
 for(const material of [cloth,leather]){
  const group=meshes.filter(m=>m.material===material);if(group.length<2)continue;
  const geometry=VertexData.ExtractFromMesh(group[0]);geometry.merge(group.slice(1).map(m=>VertexData.ExtractFromMesh(m)),true);
  geometry.applyToMesh(group[0]);group[0].name='outfit / '+style+' / '+(material===cloth?'fabric':'equipment');
  for(const mesh of group.slice(1))mesh.dispose();
 }

 // These resources belong to this outfit, not the shared character template.
 cloth.onDisposeObservable.add(()=>fabric.dispose());
 leather.onDisposeObservable.add(()=>leather.bumpTexture?.dispose());
 return [cloth,leather];
}
