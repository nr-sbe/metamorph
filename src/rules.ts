export type Point = {x:number;y:number;z:number};
export type Bounds = {min:Point;max:Point;id?:number;active?:boolean};
export const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
export const lerp=(a:number,b:number,t:number)=>a+(b-a)*t;
export const FORMS=['Unarmed','Claws','Blade','Hammerfists','Whipfist'] as const;
export type Form=typeof FORMS[number];
export const MOVES:Record<Form,{damage:number;range:number;arc:number;recovery:number;impulse:number;color:string}>={
 Unarmed:{damage:23,range:3.1,arc:1.7,recovery:.32,impulse:8,color:'#f3c2aa'},
 Claws:{damage:19,range:3.7,arc:2.4,recovery:.23,impulse:6,color:'#ff674b'},
 Blade:{damage:58,range:4.8,arc:1.9,recovery:.62,impulse:14,color:'#ffc5aa'},
 Hammerfists:{damage:66,range:4.7,arc:2.8,recovery:.85,impulse:24,color:'#ffa159'},
 Whipfist:{damage:30,range:12,arc:.7,recovery:.5,impulse:10,color:'#ff544c'},
};
export function segmentHit(origin:Point,delta:Point,b:Bounds,pad=0):number|null{
 let lo=0,hi=1;
 for(const axis of ['x','y','z'] as const){const d=delta[axis],o=origin[axis],min=b.min[axis]-pad,max=b.max[axis]+pad;
  if(Math.abs(d)<1e-8){if(o<min||o>max)return null;continue;}
  let a=(min-o)/d,c=(max-o)/d;if(a>c)[a,c]=[c,a];lo=Math.max(lo,a);hi=Math.min(hi,c);if(lo>hi)return null;
 } return lo;
}
export function visible(a:Point,b:Point,boxes:Bounds[]){const d={x:b.x-a.x,y:b.y-a.y,z:b.z-a.z};return !boxes.some(box=>box.active!==false&&segmentHit(a,d,box)!==null);}
export function inCone(origin:Point,facing:number,target:Point,range=12,angle=Math.PI*2/3){
 const dx=target.x-origin.x,dz=target.z-origin.z,dy=target.y-origin.y,dist=Math.hypot(dx,dz);
 return Math.hypot(dist,dy)<=range && (dist<.01||(dx*Math.sin(facing)+dz*Math.cos(facing))/dist>=Math.cos(angle/2));
}
export interface Seizable {id:number;pos:Point;alive:boolean;kind:string;stagger:number;captured?:boolean}
export function undertowTargets<T extends Seizable>(origin:Point,facing:number,enemies:T[],boxes:Bounds[]){
 return enemies.filter(e=>e.alive&&!e.captured&&!['tank','aircraft','boss'].includes(e.kind)&&(e.kind!=='brute'||e.stagger>0)&&inCone(origin,facing,e.pos)&&visible(origin,e.pos,boxes));
}
/** On-screen acquisition is supplied by the rendering adapter; no target cap. */
export function visibleUndertowTargets<T extends Seizable>(origin:Point,enemies:T[],boxes:Bounds[],onScreen:(p:Point)=>boolean){
 return enemies.filter(e=>e.alive&&!e.captured&&!['tank','aircraft','boss'].includes(e.kind)&&(e.kind!=='brute'||e.stagger>0)&&Math.hypot(e.pos.x-origin.x,e.pos.y-origin.y,e.pos.z-origin.z)<=18&&onScreen(e.pos)&&visible(origin,e.pos,boxes));
}
export function liftHeight(p:Point,boxes:Bounds[],height=5.5){let h=height;for(const b of boxes){if(b.active===false)continue;const t=segmentHit(p,{x:0,y:height,z:0},b,.45);if(t!==null)h=Math.min(h,Math.max(0,height*t-.15));}return h;}
export function floorAt(p:Point,boxes:Bounds[]){let y=0;for(const b of boxes)if(b.active!==false&&p.x>b.min.x-.05&&p.x<b.max.x+.05&&p.z>b.min.z-.05&&p.z<b.max.z+.05&&b.max.y<=p.y+.1)y=Math.max(y,b.max.y);return y;}
export function seeded(seed:number){return ()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
