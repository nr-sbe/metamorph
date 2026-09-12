import {Vector3} from '@babylonjs/core';
import {Bounds,clamp,floorAt,segmentHit} from './rules';
export type SpecialKind='faultline'|'guillotine'|'aftershock'|'ram';
export const SPECIALS={
 faultline:{name:'FAULTLINE',reuse:2,windup:.2,release:.35,range:16,width:3.5,travel:.65,damage:40},
 guillotine:{name:'GUILLOTINE',reuse:2,windup:.18,rise:5,range:8,width:3,damage:90,launchDamage:20},
 aftershock:{name:'AFTERSHOCK',reuse:2,windup:.3,release:.8,range:14,arc:100*Math.PI/180,travel:.7,damage:60},
 ram:{name:'BATTERING RAM',reuse:2,windup:.15,travel:.6,speed:18,damage:45,victimDamage:65,wallDamage:35}
} as const;
export type ImpactIdentity={id:number;owner:'player';form:string;collateralHits:Set<number>};
export function segmentDistance(p:Vector3,a:Vector3,b:Vector3){const d=b.subtract(a),t=clamp(Vector3.Dot(p.subtract(a),d)/(d.lengthSquared()||1),0,1);return Vector3.Distance(p,a.add(d.scale(t)));}
export function aftershockPower(fall:number){const t=clamp(fall/20,0,1);return {damage:60+60*t,range:14+4*t};}
/** Sample connected surfaces. A rooftop edge is not a ramp down to the street. */
export function groundPath(origin:Vector3,yaw:number,range:number,boxes:Bounds[],step=.8){
 const path=[origin.clone()],dir=new Vector3(Math.sin(yaw),0,Math.cos(yaw));
 for(let distance=step;distance<=range+.001;distance+=step){
  const prev=path[path.length-1],next=origin.add(dir.scale(Math.min(distance,range)));
  next.y=floorAt(new Vector3(next.x,prev.y+.65,next.z),boxes);
  if(Math.abs(next.y-prev.y)>.65||boxes.some(b=>b.active!==false&&segmentHit(prev.add(new Vector3(0,.7,0)),next.subtract(prev),b,.1)!==null))break;
  path.push(next);
 }
 return path;
}
