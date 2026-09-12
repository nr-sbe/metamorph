import {Vector3} from '@babylonjs/core';
import {segmentHit,type Bounds} from './rules';

export type HostileShot={position:Vector3;velocity:Vector3;origin:Vector3;damage:number;remaining:number;label:string;slot:number};
/** Earliest collision wins: a wall before the player blocks the shot. */
export function advanceShot(shot:HostileShot,dt:number,player:Vector3,boxes:Bounds[]){
 const distance=Math.min(shot.remaining,shot.velocity.length()*dt);
 const delta=shot.velocity.normalizeToNew().scale(distance);
 let wall=Infinity;for(const b of boxes){if(b.active===false)continue;const t=segmentHit(shot.position,delta,b,.05);if(t!==null)wall=Math.min(wall,t);}
 const playerBounds={min:{x:player.x-.42,y:player.y+.15,z:player.z-.42},max:{x:player.x+.42,y:player.y+2.05,z:player.z+.42},active:true};
 const hit=segmentHit(shot.position,delta,playerBounds,.08);
 const fraction=hit!==null&&hit<wall?hit:Math.min(1,wall);
 shot.position.addInPlace(delta.scale(fraction));shot.remaining-=distance;
 return hit!==null&&hit<wall?'player':wall<=1?'wall':shot.remaining<=0?'expired':'flying';
}
