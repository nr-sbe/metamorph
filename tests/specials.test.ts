import test from 'node:test';
import assert from 'node:assert/strict';
import {NullEngine,Scene,Vector3,TransformNode} from '@babylonjs/core';
import RAPIER from '@dimforge/rapier3d-compat/rapier.es.js';
import {Game} from '../src/game';
import {Effects} from '../src/fx';
import {groundPath,aftershockPower} from '../src/specialRules';
import {Bounds,Form} from '../src/rules';
import type {City,Prop} from '../src/world';
const box=(x:number,y:number,z:number,w:number,h:number,d:number):Bounds=>({min:{x:x-w/2,y:y-h/2,z:z-d/2},max:{x:x+w/2,y:y+h/2,z:z+d/2},active:true});
async function fixture(){
 await RAPIER.init();const engine=new NullEngine(),scene=new Scene(engine),physics=new RAPIER.World({x:0,y:-28,z:0});physics.timestep=1/60;physics.createCollider(RAPIER.ColliderDesc.cuboid(330,.5,330).setTranslation(0,-.5,0));
 const city={physics,boxes:[],props:[],shadow:{addShadowCaster(){}},reset(){physics.step();},sync(){for(const p of this.props as Prop[])if(p.body){p.pos.copyFromFloats(p.body.translation().x,p.body.translation().y,p.body.translation().z);p.velocity.copyFromFloats(p.body.linvel().x,p.body.linvel().y,p.body.linvel().z);}},destroy(p:Prop){p.alive=false;},detach(){},launch(p:Prop,v:Vector3){p.thrown=true;if(p.body)physics.removeRigidBody(p.body);p.body=physics.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(p.pos.x,p.pos.y,p.pos.z).setLinvel(v.x,v.y,v.z));physics.createCollider(RAPIER.ColliderDesc.cuboid(1,1,2).setMass(500),p.body);}} as unknown as City;
 const fx=new Effects(scene,physics),g=new Game(scene,city,fx);g.reset('study',false);g.mode='free';g.running=true;g.invuln=100;g.benchmarkHold=true;
 const step=(n:number)=>{for(let i=0;i<n;i++)g.step(1/60);};step(10);
 const enemy=(x:number,z:number,kind='grunt')=>{const e=g.spawnEnemy(g.pos.add(new Vector3(x,0,z)),kind)!;e.hp=e.maxHp=1000;return e;};
 return {g,fx,scene,physics,city,step,enemy,dispose(){g.dispose();scene.dispose();engine.dispose();}};
}
test('ground waves stop at walls, roof edges and gaps; airborne power caps',()=>{
 const wall=box(0,2,6,8,4,1);assert.ok(groundPath(new Vector3(),0,16,[wall]).at(-1)!.z<5.5);
 const roof=box(0,4,0,20,2,10),other=box(0,4,15,20,2,10);assert.ok(groundPath(new Vector3(0,5,0),0,16,[roof,other]).at(-1)!.z<5.1);
 assert.deepEqual(aftershockPower(0),{damage:60,range:14});assert.deepEqual(aftershockPower(20),{damage:120,range:18});assert.deepEqual(aftershockPower(200),aftershockPower(20));
});
test('Faultline hits sequentially, launches once, releases control, and survives switching forms',async()=>{
 const f=await fixture();try{const {g,step}=f,near=f.enemy(0,3),far=f.enemy(0,12);g.selectForm('Claws');g.secondary();step(21);assert.equal(near.hp,960);assert.equal(far.hp,1000);assert.ok(near.vel.y>10);assert.equal(g.specials.motion,null);g.selectForm('Blade');assert.equal(g.form,'Blade');step(40);assert.equal(far.hp,960);assert.equal(near.hp,960);assert.equal(g.biomass,1);assert.equal(g.specials.waves.length,0);}finally{f.dispose();}
});
test('Faultline cannot launch resistant brutes or damage enemies beyond a wall',async()=>{
 const f=await fixture();try{const {g,step,city}=f,brute=f.enemy(0,3,'brute'),hidden=f.enemy(0,9);city.boxes.push(box(0,2,g.pos.z+6,20,4,1));g.selectForm('Claws');g.secondary();step(60);assert.equal(brute.hp,960);assert.ok(brute.pos.y<.2);assert.equal(hidden.hp,1000);assert.equal(g.specials.stats.hits,1);}finally{f.dispose();}
});
test('Guillotine rises within a ceiling, allows apex cancellation, and has no phantom landing hit',async()=>{
 const f=await fixture();try{const {g,step,city,physics}=f,target=f.enemy(0,2);city.boxes.push(box(0,4,g.pos.z,20,.5,20));physics.createCollider(RAPIER.ColliderDesc.cuboid(10,.25,10).setTranslation(0,4,g.pos.z));physics.step();g.selectForm('Blade');g.secondary();let apex=0;for(let i=0;i<60&&!g.specials.canCancel;i++){step(1);apex=Math.max(apex,g.pos.y);}assert.ok(g.specials.canCancel);assert.ok(apex<2);assert.equal(target.hp,980);g.selectForm('Claws');assert.equal(g.specials.motion,null);step(90);assert.equal(target.hp,980);}finally{f.dispose();}
});
test('Guillotine completes its cut, aerial activation skips launcher, and damage is bounded',async()=>{
 const f=await fixture();try{const {g,step}=f,target=f.enemy(0,2);g.selectForm('Blade');g.secondary();step(100);assert.equal(g.specials.motion,null);assert.ok(g.pos.y<.2,`landed at ${g.pos.y}`);assert.equal(target.hp,890);assert.equal(g.biomass,1);
 g.pos.y=30;g.body.setTranslation({x:g.pos.x,y:31,z:g.pos.z},true);g.body.setNextKinematicTranslation({x:g.pos.x,y:31,z:g.pos.z});g.grounded=false;f.physics.step();g.cooldown=0;g.specials.readyAt.guillotine=0;g.secondary();assert.equal(g.specials.motion?.phase,'dive');step(90);assert.equal(g.specials.motion,null);assert.ok(g.pos.y<.2,`landed at ${g.pos.y}`);
 }finally{f.dispose();}
});
test('Aftershock overturns cars, leaves armored vehicles anchored and shares collateral hit budget',async()=>{
 const f=await fixture();try{const {g,step,city}=f;g.selectForm('Hammerfists');
 const prop=(id:number,kind:Prop['kind'],x:number):Prop=>({id,kind,root:new TransformNode(kind,f.scene),pos:g.pos.add(new Vector3(x,1,4)),origin:g.pos.clone(),size:new Vector3(2,2,4),hp:100,maxHp:100,alive:true,body:null,collider:null,velocity:Vector3.Zero(),thrown:false,hitIds:new Set()});
 const car=prop(1,'car',0),tank=prop(2,'tank',2);city.props.push(car,tank);g.secondary();step(50);assert.ok(car.thrown);assert.ok(car.body!.angvel().x>0);assert.equal(tank.body,null);assert.equal(g.specials.stats.aftershock,1);assert.equal(g.biomass,1);
 g.specials.projectiles=[];const target=f.enemy(0,8),event=g.specials.identity('Hammerfists'),a=prop(3,'car',0),b=prop(4,'car',0);a.pos.copyFrom(target.pos.add(new Vector3(0,1,-5)));b.pos.copyFrom(a.pos);a.velocity.set(0,0,100);b.velocity.copyFrom(a.velocity);g.specials.track(a,event);g.specials.track(b,event);a.pos.z+=10;b.pos.z+=10;g.specials.tickProjectiles(1/60);assert.equal(target.hp,940);assert.equal(event.collateralHits.size,1);
 }finally{f.dispose();}
});
test('Battering Ram keeps uppercut, requires a grab, sweeps bystanders and can throw early',async()=>{
 const f=await fixture();try{const {g,step}=f,victim=f.enemy(0,2),bystander=f.enemy(0,6);g.selectForm('Unarmed');g.grab();assert.equal(g.holding,victim);g.secondary();step(22);assert.equal(g.specials.motion?.kind,'ram');assert.equal(victim.captured,true);assert.ok(g.pos.z>-26);g.press('Mouse0');assert.equal(g.holding,null);assert.equal(victim.hp,935);assert.equal(g.specials.motion,null);const hp=victim.hp;g.release('Mouse0');assert.equal(victim.hp,hp);step(40);assert.ok(bystander.hp<1000);
 g.cooldown=0;g.specials.readyAt.ram=0;const close=f.enemy(0,2);g.grounded=true;g.secondary();assert.equal(g.actionLabel,'UPPERCUT / AIR COMBO');assert.equal(close.hp,975);
 }finally{f.dispose();}
});
test('Ram wall finish stops both bodies before cover; dodge, boss hit and resets release victims',async()=>{
 const f=await fixture();try{const {g,step,city,physics}=f,victim=f.enemy(0,2);g.selectForm('Unarmed');g.grab();const wallZ=g.pos.z+5;city.boxes.push(box(0,2,wallZ,12,4,.5));physics.createCollider(RAPIER.ColliderDesc.cuboid(6,2,.25).setTranslation(0,2,wallZ));physics.step();g.secondary();step(60);assert.equal(victim.hp,900);assert.equal(victim.captured,false);assert.ok(g.pos.z<wallZ-1.2);assert.ok(victim.pos.z<wallZ);
 city.boxes=[];g.cooldown=0;g.specials.readyAt.ram=0;const next=f.enemy(0,1);g.grab();g.secondary();g.dodge();assert.equal(g.specials.motion,null);assert.equal(next.captured,false);
 g.cooldown=0;g.specials.readyAt.ram=0;next.pos.copyFrom(g.pos.add(new Vector3(0,0,1)));g.grab();g.secondary();g.invuln=0;g.hurt(10,g.pos,'BOSS',true);assert.equal(g.specials.motion,null);assert.ok(g.enemies.every(e=>!e.captured));
 }finally{f.dispose();}
});
test('all signature effects reuse fixed pools, and pause/reset cancels motion and captures',async()=>{
 const f=await fixture();try{const {g,fx,step}=f,meshes=f.scene.meshes.length,materials=f.scene.materials.length,geometries=f.scene.geometries.length;for(let i=0;i<300;i++){fx.signature.wave(i%2?'faultline':'aftershock',g.pos,i,1.5);fx.signature.trail(g.pos,i);fx.signature.step(1/60);}assert.equal(f.scene.meshes.length,meshes);assert.equal(f.scene.materials.length,materials);assert.equal(f.scene.geometries.length,geometries);assert.ok(f.physics.bodies.len()<=98);
 g.selectForm('Blade');g.secondary();step(15);const time=g.specials.motion!.time;g.paused=true;step(60);assert.equal(g.specials.motion!.time,time);g.paused=false;g.reset('study',false);assert.equal(g.specials.motion,null);assert.equal(g.specials.projectiles.length,0);assert.equal(g.specials.waves.length,0);assert.ok(fx.signature.spikes.every(p=>!p.mesh.isEnabled()));
 }finally{f.dispose();}
});


test('20 simulated minutes of signature attacks, reactions and resets keep all pools bounded',async()=>{
 const f=await fixture();try{
  const {g,fx,step}=f;g.signaturePractice('Claws');const baseline={meshes:f.scene.meshes.length,materials:f.scene.materials.length,geometries:f.scene.geometries.length,bodies:f.physics.bodies.len()};let maximum=0;
  for(let cycle=0;cycle<30;cycle++){
   const form:Form=(['Claws','Blade','Hammerfists','Unarmed'] as const)[cycle%4];g.signaturePractice(form);
   for(const e of g.enemies)e.hp=10000;
   for(let frame=0;frame<2400;frame++){
    if(frame%180===0){if(form==='Unarmed'&&!g.holding){const e=g.enemies.find(e=>e.alive)!;e.pos.copyFrom(g.pos.add(new Vector3(0,0,1.5)));g.grab();}g.secondary();}
    step(1);maximum=Math.max(maximum,f.physics.bodies.len());
   }
   g.signaturePractice('Claws');assert.equal(f.scene.meshes.length,baseline.meshes);assert.equal(f.scene.materials.length,baseline.materials);assert.equal(f.scene.geometries.length,baseline.geometries);assert.equal(f.physics.bodies.len(),baseline.bodies);assert.ok(g.enemies.every(e=>!e.captured));assert.equal(g.specials.projectiles.length,0);
  }
  assert.ok(maximum<=baseline.bodies+96);assert.equal(fx.signature.spikes.length,36);assert.equal(fx.signature.slabs.length,24);assert.equal(fx.signature.trails.length,8);
 }finally{f.dispose();}
});


test('reduced gore preserves special damage, reach, cooldown and physical force',async()=>{
 const f=await fixture();try{const results:unknown[]=[];for(const gore of [true,false]){const run:unknown[]=[];for(const form of ['Claws','Blade','Hammerfists','Unarmed'] as const){const {g,fx,step}=f;g.reset('study',false);g.mode='free';g.benchmarkHold=true;g.invuln=100;fx.gore=gore;step(10);g.selectForm(form);const e=f.enemy(0,2);if(form==='Unarmed')g.grab();g.secondary();step(100);run.push([e.hp,Math.round(e.pos.y*100),Math.round(e.pos.z*100),g.biomass,g.specials.stats.hits]);}results.push(run);}assert.deepEqual(results[0],results[1]);}finally{f.dispose();}
});
