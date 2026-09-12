import test from 'node:test';
import assert from 'node:assert/strict';
import {Vector3} from '@babylonjs/core';
import {FollowCamera,RenderPose,turnToward} from '../src/cameraRig';

test('direction changes interpolate the render pose without moving the camera aim around the player',()=>{
 const pose=new RenderPose(),rig=new FollowCamera(),p=Vector3.Zero();
 pose.reset(p,0);rig.update(p,1.65,0,.2,6,.9,true,1/60);
 const aim=rig.look.clone();
 pose.beforeStep(p);p.x=.1;
 assert.equal(pose.sample(p,Math.PI,.5,1/120).x,.05);
 assert.equal(p.x,.1,'rendering must not change the simulation position');
 assert.ok(pose.heading>0&&pose.heading<Math.PI,'visual turn should not snap');
 rig.update(Vector3.Zero(),1.65,0,.2,6,.9,true,1/60);
 assert.deepEqual(rig.look.asArray(),aim.asArray(),'actor heading is not a camera input');
});

test('camera settles consistently across 30, 60, and 144 Hz without overshoot',()=>{
 const results=[30,60,144].map(hz=>{
  const rig=new FollowCamera();rig.update(Vector3.Zero(),1.65,0,.2,5.5,0,false,0);
  for(let i=0;i<hz;i++){rig.update(new Vector3(10,0,0),1.65,0,.2,12,0,false,1/hz);assert.ok(rig.anchor.x<=10);}
  return [rig.anchor.x,rig.distance];
 });
 for(const r of results)for(let j=0;j<2;j++)assert.ok(Math.abs(r[j]-results[0][j])<1e-10);
});

test('camera and pose discard history after a teleport or reset',()=>{
 const pose=new RenderPose();pose.reset(Vector3.Zero(),0);pose.beforeStep(Vector3.Zero());
 const destination=new Vector3(100,20,100);
 assert.deepEqual(pose.sample(destination,1,.1,1/60).asArray(),destination.asArray());
 const rig=new FollowCamera();rig.update(Vector3.Zero(),1.65,0,0,6,0,false,.1);rig.reset();
 rig.update(destination,1.65,0,0,6,0,false,1/60);
 assert.deepEqual(rig.anchor.asArray(),[100,21.65,100]);
});

test('rendered turns cross the pi boundary by the shortest route',()=>{
 const heading=turnToward(Math.PI-.05,-Math.PI+.05,1/60);
 assert.ok(heading>Math.PI-.05&&heading<Math.PI+.05);
});
