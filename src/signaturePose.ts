import {Quaternion,TransformNode,Vector3} from '@babylonjs/core';
export type SignaturePose={kind:string;phase:string;time:number};
type Angles=[number,number,number];
export function poseAngles(p:SignaturePose):Record<string,Angles>{
 const t=p.time,wind=p.phase==='windup',out:Record<string,Angles>={};
 const set=(name:string,x=0,y=0,z=0)=>out[name]=[x,y,z];
 if(p.kind==='faultline'){
  const pull=wind?Math.min(1,t/.2):Math.max(0,1-t/.2);set('spine_01',.6*pull);set('thigh_l',-.5*pull);set('thigh_r',-.4*pull);set('calf_l',.8*pull);set('calf_r',.7*pull);set('upperarm_l',.65*pull,0,-.2);set('upperarm_r',.65*pull,0,.2);set('lowerarm_l',.25*pull);set('lowerarm_r',.25*pull);
 }else if(p.kind==='guillotine'){
  const overhead=p.phase==='rise'||p.phase==='apex',dive=p.phase==='dive';set('spine_01',dive?.55:wind?-.18:0,overhead?-.25:0);set('upperarm_r',overhead?-2.7:dive?-1.1:-.6,0,.3);set('lowerarm_r',overhead?-.9:-.2);set('upperarm_l',overhead?-1.1:dive?-.5:0,0,-.5);set('thigh_l',overhead?-.7:dive?.25:0);set('thigh_r',overhead?-.4:dive?.15:0);set('calf_l',overhead?.9:0);set('calf_r',overhead?.6:0);
 }else if(p.kind==='aftershock'){
  const lift=wind?Math.min(1,t/.3):p.phase==='dive'?1:Math.max(0,1-t/.3);set('spine_01',wind?-.25:p.phase==='dive'?.2:.75*lift);set('upperarm_l',wind||p.phase==='dive'?-2.4*lift:-.8*lift,0,-.35);set('upperarm_r',wind||p.phase==='dive'?-2.4*lift:-.8*lift,0,.35);set('lowerarm_l',-.75*lift);set('lowerarm_r',-.75*lift);set('thigh_l',-.55*lift);set('thigh_r',-.5*lift);set('calf_l',.85*lift);set('calf_r',.85*lift);
 }else if(p.kind==='ram'){
  set('spine_01',.4,-.2);set('upperarm_r',-1.1,0,.2);set('lowerarm_r',-.95);set('upperarm_l',-.8,0,-.4);set('lowerarm_l',-1.1);set('thigh_l',Math.sin(t*22)*.65);set('thigh_r',-Math.sin(t*22)*.65);set('calf_l',Math.max(0,Math.sin(t*22))*.9);set('calf_r',Math.max(0,-Math.sin(t*22))*.9);
 }else if(p.kind==='carried'){
  set('spine_01',.4);set('Head',.25);set('upperarm_l',-.6,0,-.4);set('upperarm_r',-.65,0,.4);set('thigh_l',.3+Math.sin(t*17)*.15);set('thigh_r',.55-Math.sin(t*17)*.15);set('calf_l',.6);set('calf_r',.8);
 }else{
  const strength=p.kind==='launch'?Math.min(1,t*10):Math.max(0,1-t/(p.kind==='fold'?1.1:.45));
  set('spine_01',(p.kind==='launch'?-.5:p.kind==='fold'?.9:p.kind==='resist'?.15:.4)*strength);set('Head',-.18*strength);set('upperarm_l',-.5*strength,0,-.65*strength);set('upperarm_r',-.7*strength,0,.65*strength);set('thigh_l',-.45*strength);set('thigh_r',-.25*strength);set('calf_l',.7*strength);set('calf_r',.6*strength);
 }
 return out;
}
export class SignatureRig{
 private bases=new Map<TransformNode,Quaternion>();
 constructor(private nodes:TransformNode[]){this.nodes=nodes.filter(n=>/\/(spine_01|Head|upperarm_[lr]|lowerarm_[lr]|thigh_[lr]|calf_[lr])$/.test(n.name));}
 capture(){this.bases.clear();for(const n of this.nodes)this.bases.set(n,n.rotationQuaternion?.clone()??Quaternion.FromEulerVector(n.rotation));}
 apply(p:SignaturePose){this.restore();for(const [name,angles] of Object.entries(poseAngles(p))){const node=this.nodes.find(n=>n.name.endsWith('/'+name));if(!node)continue;node.rotationQuaternion=this.bases.get(node)!.multiply(Quaternion.FromEulerVector(Vector3.FromArray(angles)));}}
 restore(){for(const [node,rotation] of this.bases)node.rotationQuaternion?.copyFrom(rotation);}
 clear(){this.restore();this.bases.clear();}
}
