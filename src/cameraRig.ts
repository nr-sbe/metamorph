import {Vector3} from '@babylonjs/core';

export const damping=(rate:number,dt:number)=>1-Math.exp(-rate*Math.max(0,dt));
export const turnToward=(from:number,to:number,dt:number)=>from+Math.atan2(Math.sin(to-from),Math.cos(to-from))*damping(24,dt);

/** Fixed-step interpolation is visual only: combat and collisions use game.pos. */
export class RenderPose {
 previous=Vector3.Zero();current=Vector3.Zero();position=Vector3.Zero();heading=0;
 reset(position:Vector3,heading:number){this.previous.copyFrom(position);this.current.copyFrom(position);this.position.copyFrom(position);this.heading=heading;}
 beforeStep(position:Vector3){this.previous.copyFrom(position);}
 sample(position:Vector3,heading:number,alpha:number,dt:number){
  if(Vector3.DistanceSquared(position,this.current)>64)this.reset(position,heading);
  this.current.copyFrom(position);
  Vector3.LerpToRef(this.previous,position,Math.max(0,Math.min(1,alpha)),this.position);
  this.heading=turnToward(this.heading,heading,dt);
  return this.position;
 }
}

/** Follow a stable anchor; character heading never changes the camera's aim. */
export class FollowCamera {
 anchor=Vector3.Zero();look=Vector3.Zero();distance=5.5;initialized=false;
 reset(){this.initialized=false;}
 update(position:Vector3,height:number,yaw:number,pitch:number,distance:number,shoulder:number,study:boolean,dt:number){
  const desired=position.add(new Vector3(Math.cos(yaw)*shoulder,height,-Math.sin(yaw)*shoulder));
  if(!this.initialized){this.anchor.copyFrom(desired);this.distance=distance;this.initialized=true;}
  // A single anchor drives position and look-at, avoiding competing follow lags.
  Vector3.LerpToRef(this.anchor,desired,damping(22,dt),this.anchor);
  this.distance+=(distance-this.distance)*damping(8,dt);
  this.look.copyFrom(this.anchor);
  if(!study)this.look.addInPlace(new Vector3(Math.sin(yaw)*2,-Math.sin(pitch)*3,Math.cos(yaw)*2));
  return new Vector3(-Math.sin(yaw)*this.distance,1.1+Math.sin(pitch)*this.distance,-Math.cos(yaw)*this.distance);
 }
}
