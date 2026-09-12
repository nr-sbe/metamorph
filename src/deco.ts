import {Color3,PBRMaterial,Vector3} from '@babylonjs/core';
import type {City} from './world';

export function decoMaterials(city:City){
 for(const [name,color,roughness,metallic] of [
  ['decoStone','#a4a495',.84,0],['decoBronze','#877044',.36,.8],
  ['decoDark','#253634',.3,.6],['decoGold','#c9a870',.28,.78],
 ] as const){const m=new PBRMaterial(name,city.scene);m.albedoColor=Color3.FromHexString(color);m.roughness=roughness;m.metallic=metallic;m.forceIrradianceInFragment=true;city.materials[name]=m;}
}

export function decoTower(city:City,x:number,z:number,w:number,d:number,h:number){
 const b=(name:string,xx:number,y:number,zz:number,sx:number,sy:number,sz:number,mat:string)=>city.box(name,new Vector3(xx,y,zz),new Vector3(sx,sy,sz),mat);
 // Real stepped roof volumes are also traversal surfaces.
 let roof=h+.8;
 for(let tier=0;tier<3;tier++){
  const width=w*(.65-tier*.16),depth=d*(.65-tier*.16),height=5-tier;
  const p=new Vector3(x,roof+height/2,z),size=new Vector3(width,height,depth);
  city.box('setback crown',p,size,'tower2');city.fixed(p,size);
  b('bronze crown coping',x,roof+height,z,width+.4,.32,depth+.4,'decoBronze');
  roof+=height;
 }
 b('crown lantern',x,roof+2,z,2.2,4,2.2,'decoDark');
 b('crown beacon',x,roof+4.5,z,.32,2,.32,'decoGold');
 for(const side of [-1,1]){
  const face=x+side*(w/2+.18);
  for(let zz=z-d/2+1;zz<z+d/2;zz+=7.3){
   b('continuous limestone pier',face,h/2,zz,.55,h,.68,'decoStone');
   b('bronze pier inlay',face+side*.3,h/2,zz,.08,h-.8,.12,'decoBronze');
   b('stepped pier capital',face,h+.7,zz,.9,1.4,1.2,'decoStone');
  }
 }
 if(Math.abs(x)>65||Math.abs(z)>165)return;
 const side=-Math.sign(x),face=x+side*(w/2+.4);
 b('recessed monumental doorway',face,3.8,z,.4,7.6,5.6,'decoDark');
 for(const dz of [-3.3,3.3])for(let step=0;step<3;step++)
  b('layered entrance jamb',face+side*step*.17,4.1,z+dz+Math.sign(dz)*step*.32,.28,8.2-step*.3,.24,'decoBronze');
 for(let i=-5;i<=5;i++){
  const a=i*Math.PI/15,length=2.65;
  const ray=b('sunburst entrance relief',face+side*.35,7.3+Math.cos(a)*length/2,z+Math.sin(a)*length/2,.12,length,.07,'decoGold');
  ray.rotation.x=a;
 }
 for(let tier=0;tier<3;tier++)b('stepped canopy',face+side*(1.2-tier*.2),4.4+tier*.22,z,2.8-tier*.35,.19,7-tier*.6,tier===1?'decoGold':'decoDark');
 for(const dz of [-3.65,3.65]){
  b('entry lantern housing',face+side*.55,3.3,z+dz,.5,1.6,.42,'decoBronze');
  b('warm entry lantern',face+side*.83,3.3,z+dz,.05,1.2,.21,'light');
 }
 city.textSign(z<0?'ATLAS EXCHANGE':'VIGIL / NEW YORK',new Vector3(face+side*.5,6.2,z),4.4,.65,Math.PI/2);
}
