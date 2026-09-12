import test from 'node:test';
import assert from 'node:assert/strict';
import {NullEngine,Scene,Vector3} from '@babylonjs/core';
import RAPIER from '@dimforge/rapier3d-compat/rapier.es.js';
import {inCone,undertowTargets,liftHeight,floorAt,visible,Bounds,FORMS} from '../src/rules';
import {Effects} from '../src/fx';
import {Game} from '../src/game';
import type {City} from '../src/world';
import {advanceShot,type HostileShot} from '../src/projectiles';

const origin={x:0,y:1,z:0};
const box=(x:number,y:number,z:number,w:number,h:number,d:number):Bounds=>({min:{x:x-w/2,y:y-h/2,z:z-d/2},max:{x:x+w/2,y:y+h/2,z:z+d/2},active:true});
const enemy=(id:number,x:number,z:number,kind='grunt',stagger=0)=>({id,pos:{x,y:1,z},kind,stagger,alive:true,captured:false});
test('Undertow acquires twenty targets, rejecting behind and out-of-range targets',()=>{
 const targets=Array.from({length:20},(_,i)=>enemy(i,(i%5-2)*1.2,4+Math.floor(i/5)));
 targets.push(enemy(21,0,-3),enemy(22,0,13));assert.equal(undertowTargets(origin,0,targets,[]).length,20);
 assert.equal(inCone(origin,0,{x:11,y:1,z:0}),false);
});
test('solid architecture occludes acquisition; destroyed panels no longer occlude',()=>{
 const wall=box(0,2,4,4,4,.5);assert.equal(visible(origin,{x:0,y:1,z:8},[wall]),false);
 assert.equal(undertowTargets(origin,0,[enemy(1,0,8)],[wall]).length,0);
 wall.active=false;assert.equal(undertowTargets(origin,0,[enemy(1,0,8)],[wall]).length,1);
});
test('brutes require stagger, bosses and vehicles stay anchored',()=>{
 const targets=[enemy(1,0,4,'brute'),enemy(2,1,4,'brute',1),enemy(3,2,4,'boss'),enemy(4,-1,4,'tank'),enemy(5,-2,4,'aircraft')];
 assert.deepEqual(undertowTargets(origin,0,targets,[]).map(t=>t.id),[2]);
});
test('ceiling shortens lift and platform supplies actual landing height',()=>{
 const ceiling=box(0,6,0,10,.4,10),platform=box(0,2,0,4,1,4);
 const h=liftHeight({x:0,y:3,z:0},[ceiling],5.5);assert.ok(h<2.8&&h>1.8);
 assert.equal(floorAt({x:0,y:4,z:0},[platform]),2.5);
 platform.active=false;assert.equal(floorAt({x:0,y:4,z:0},[platform]),0);
});

async function fixture(){await RAPIER.init();const engine=new NullEngine();const scene=new Scene(engine);const physics=new RAPIER.World({x:0,y:-28,z:0});physics.timestep=1/60;physics.createCollider(RAPIER.ColliderDesc.cuboid(330,.5,330).setTranslation(0,-.5,0));
 const city={physics,boxes:[],props:[],shadow:{addShadowCaster(){}},reset(){physics.step();},sync(){},destroy(){},detach(){},launch(){}} as unknown as City;
 const fx=new Effects(scene,physics);const game=new Game(scene,city,fx);game.reset('practice');game.running=true;
 return {game,fx,scene,physics,engine,dispose(){game.dispose();scene.dispose();engine.dispose();}};
}

test('shield and Critical Mass overflow reaches vitality and records the attacker',async()=>{
 const f=await fixture(),g=f.game;g.invuln=0;g.biomass=.1;g.health=100;
 g.hurt(20,new Vector3(0,1,10),'RIFLE');assert.equal(g.biomass,0);assert.equal(g.health,83.5);assert.equal(g.lastDamage?.label,'RIFLE');
 g.invuln=0;g.health=100;g.shield=5;g.defense='Shield';g.hurt(20,new Vector3(0,1,10),'CANNON');
 assert.equal(g.shield,0);assert.equal(g.health,85);assert.equal(g.lastDamage?.kind,'SHIELD BROKEN');
 g.invuln=0;g.shield=100;g.hurt(20,new Vector3(),'APEX SHOCKWAVE',true);assert.equal(g.shield,100);assert.equal(g.health,65);f.dispose();
});

test('grab assists a nearby side target, turns toward it and consumes through the same prompt',async()=>{
 const f=await fixture(),g=f.game;g.reset('study',false);g.cameraYaw=0;g.facing=Math.PI;
 const target=g.spawnEnemy(g.pos.add(new Vector3(1.8,0,0)),'grunt')!;
 assert.equal(g.grabCandidate(),target);g.grab();assert.equal(g.holding,target);assert.ok(Math.abs(g.facing-Math.PI/2)<1e-6);
 g.health=65;g.biomass=0;g.consumeOrUse();assert.equal(g.health,100);assert.ok(g.feeding);assert.equal(g.holding,null);
 for(let i=0;i<40;i++)g.step(1/60);assert.equal(g.feeding,null);assert.equal(target.actor.root.isEnabled(),false);f.dispose();
});

test('grab cannot select a hostile through a wall or an unstaggered brute',async()=>{
 const f=await fixture(),g=f.game;g.reset('study',false);g.cameraYaw=0;
 g.spawnEnemy(g.pos.add(new Vector3(0,0,2)),'brute');assert.equal(g.grabCandidate(),undefined);
 g.enemies[0].stagger=1;assert.ok(g.grabCandidate());g.city.boxes.push(box(g.pos.x,2,g.pos.z+1,4,4,.5));assert.equal(g.grabCandidate(),undefined);f.dispose();
});

test('visible projectiles travel, miss after dodging, stop at cover and obey range',()=>{
 const shot=():HostileShot=>({position:new Vector3(0,1,0),origin:new Vector3(0,1,0),velocity:new Vector3(0,0,30),damage:8,remaining:24,label:'RIFLE',slot:0});
 const target=new Vector3(0,0,10),s=shot();assert.equal(advanceShot(s,.1,target,[]),'flying');assert.equal(s.position.z,3);
 assert.equal(advanceShot(s,.3,target,[]),'player');
 assert.equal(advanceShot(shot(),.5,new Vector3(4,0,10),[]),'flying');
 assert.equal(advanceShot(shot(),.5,target,[box(0,2,5,3,4,.5)]),'wall');
 assert.equal(advanceShot(shot(),1,new Vector3(0,0,30),[]),'expired');
});

test('shield holds restore the prior defense and repeated blood bursts keep fixed pools',async()=>{
 const f=await fixture(),g=f.game;g.defense='Armor';g.press('Block');assert.equal(g.defense,'Shield');g.release('Block');assert.equal(g.defense,'Armor');
 const meshes=f.scene.meshes.length,materials=f.scene.materials.length;
 for(let i=0;i<100;i++)f.fx.bloodHit(new Vector3(0,1,0),new Vector3(0,0,12),true,0);
 assert.equal(f.fx.bloodStains.length,32);assert.equal(f.fx.bloodClouds.length,16);assert.equal(f.scene.meshes.length,meshes);assert.equal(f.scene.materials.length,materials);
 f.fx.reset();assert.ok(f.fx.bloodStains.every(m=>!m.isEnabled()));f.dispose();
});
test('actual Undertow sequence charges once, hits once per target, releases captures',async()=>{
 const f=await fixture();const g=f.game;g.benchmark();g.startUndertow();assert.equal(g.lastUndertow,20);assert.equal(g.biomass,2);
 for(let i=0;i<40;i++)g.step(1/60);assert.equal(g.enemies.filter(e=>e.captured).length,20);assert.ok(g.enemies.every(e=>e.pos.y>4));
 for(let i=0;i<40;i++)g.step(1/60);assert.equal(g.totalSlamHits,20);assert.equal(g.kills,20);assert.equal(g.undertow,null);assert.equal(g.enemies.filter(e=>e.captured).length,0);
 assert.ok(f.fx.debris.filter(d=>d.life>0).length<=96);f.dispose();
});
test('empty acquisition spends no biomass; F + secondary uses the same acquisition',async()=>{
 const f=await fixture();const g=f.game;g.benchmark();g.facing=Math.PI;g.startUndertow();assert.equal(g.biomass,3);assert.equal(g.lastUndertow,0);
 g.facing=0;g.cameraYaw=0;g.press('KeyF');g.press('Mouse2');assert.equal(g.lastUndertow,20);assert.equal(g.biomass,2);f.dispose();
});
test('armor restricts dodge; shield absorbs damage; consumption produces surplus biomass',async()=>{
 const f=await fixture();const g=f.game;g.invuln=0;g.defense='Shield';g.hurt(30,new Vector3());assert.equal(g.health,100);assert.equal(g.shield,70);
 g.defense='Armor';g.vel.setAll(0);g.dodge();assert.equal(g.vel.length(),0);g.defense='None';g.health=90;g.biomass=0;const e=g.enemies[0];g.holding=e;e.captured=true;g.consumeOrUse();assert.equal(g.health,100);assert.ok(Math.abs(g.biomass-25/35)<.0001);f.dispose();
});
test('form changes and repeated district resets do not leak meshes or materials',async()=>{
 const f=await fixture();const g=f.game;const baseline={meshes:f.scene.meshes.length,materials:f.scene.materials.length,bodies:f.physics.bodies.len()};
 for(let cycle=0;cycle<30;cycle++){for(const form of FORMS)g.selectForm(form);g.reset('practice');}
 assert.equal(f.scene.meshes.length,baseline.meshes);assert.equal(f.scene.materials.length,baseline.materials);assert.equal(f.physics.bodies.len(),baseline.bodies);f.dispose();
});

test('removed sixth form cannot be selected; Hammerfists retains the heavy throw',async()=>{
 const f=await fixture(),g=f.game;g.selectForm('Whipfist');g.press('Digit6');assert.equal(g.form,'Whipfist');
 g.press('Digit4');assert.equal(g.form,'Hammerfists');const e=g.enemies[0];g.holding=e;e.captured=true;g.facing=0;g.throwHeld(0);
 assert.equal(g.holding,null);assert.ok(e.vel.z>=45);f.dispose();
});

test('charged jump reaches a roof-height arc and armor refuses a glide',async()=>{
 const f=await fixture();const g=f.game;g.benchmarkHold=true;g.invuln=100;
 for(let i=0;i<60;i++)g.step(1/60);assert.ok(g.grounded);
 g.press('Space');for(let i=0;i<60;i++)g.step(1/60);g.release('Space');
 let apex=0;for(let i=0;i<80;i++){g.step(1/60);apex=Math.max(apex,g.pos.y);}
 assert.ok(apex>19&&apex<24,`apex ${apex}`);g.defense='Armor';g.press('Space');assert.equal(g.gliding,false);g.release('Space');
 g.defense='None';g.press('Space');assert.equal(g.gliding,true);f.dispose();
});

test('opening rival, escalating phases, crowd encounter and finale lead to free roam',async()=>{
 const f=await fixture();const g=f.game;g.reset('story');assert.equal(g.enemies.length,5);
 const clear=()=>{for(const e of g.enemies)g.damageEnemy(e,10000,Vector3.Zero());g.progress(0);g.progress(3.1);};
 clear();assert.equal(g.stage,1);assert.equal(g.enemies[0].kind,'boss');assert.equal(g.enemies[0].maxHp,520);assert.ok(g.openingRival);
 const boss=g.enemies[0];boss.hp=150;g.tickBoss(boss,1/60);assert.equal(boss.phase,2);
 clear();assert.equal(g.stage,2);assert.equal(g.enemies.length,16);
 clear();assert.equal(g.stage,3);assert.equal(g.enemies[0].maxHp,1400);
 clear();assert.equal(g.mode,'free');g.progress(20);assert.equal(g.stage,4);f.dispose();
});

test('traversal and reset safely cancel a capture sequence',async()=>{
 const f=await fixture();const g=f.game;g.benchmark();g.startUndertow();g.step(.1);g.beginChallenge();
 assert.equal(g.undertow,null);assert.ok(g.enemies.every(e=>!e.captured));assert.ok(f.fx.tendrils.every(t=>!t.isEnabled()));
 g.reset('practice');assert.equal(g.challenge,false);assert.equal(g.jumpCharge,0);assert.equal(g.airDashes,2);f.dispose();
});

test('real character controller stops at a wall and sprint converts impact to wall run',async()=>{
 const f=await fixture();const g=f.game;g.benchmarkHold=true;g.invuln=100;
 f.physics.createCollider(RAPIER.ColliderDesc.cuboid(10,20,1).setTranslation(0,20,-18));f.physics.step();
 g.keys.add('KeyW');for(let i=0;i<150;i++)g.step(1/60);assert.ok(g.pos.z< -19.3);
 g.keys.add('ShiftLeft');for(let i=0;i<60;i++)g.step(1/60);assert.ok(g.pos.y>10,`wall height ${g.pos.y}`);f.dispose();
});

test('gore setting leaves crowd damage and Critical Mass unchanged',async()=>{
 const f=await fixture();const g=f.game;f.fx.gore=false;g.benchmark();g.startUndertow();for(let i=0;i<80;i++)g.step(1/60);
 assert.equal(g.kills,20);assert.equal(g.totalSlamHits,20);assert.equal(g.biomass,2);f.dispose();
});

test('20 simulated minutes of crowd slams and resets keep physics and render pools bounded',async()=>{
 const f=await fixture();const g=f.game;g.benchmark();
 const baseline={meshes:f.scene.meshes.length,materials:f.scene.materials.length,bodies:f.physics.bodies.len()};
 let maxBodies=0;
 for(let cycle=0;cycle<60;cycle++){
   g.benchmark();g.startUndertow();g.mode='free';
   for(let frame=0;frame<1200;frame++){g.step(1/60);maxBodies=Math.max(maxBodies,f.physics.bodies.len());}
   assert.equal(g.totalSlamHits,20);assert.equal(f.physics.bodies.len(),baseline.bodies);
   assert.equal(f.scene.meshes.length,baseline.meshes);assert.equal(f.scene.materials.length,baseline.materials);
 }
 assert.ok(maxBodies<=baseline.bodies+96);assert.ok(g.time>=1199);f.dispose();
});


test('Whipfist secondary directly lifts all eligible on-screen targets with one strand each',async()=>{
 const f=await fixture(),g=f.game;g.benchmark();g.targetOnScreen=()=>true;g.secondary();
 assert.equal(g.lastUndertow,20);assert.equal(g.biomass,2);
 const starts=g.undertow!.victims.map(v=>v.start.clone());
 for(let i=0;i<38;i++)g.step(1/60);
 assert.equal(f.fx.tendrils.filter(t=>t.isEnabled()).length,20);
 assert.equal(f.fx.seizeBands.filter(t=>t.isEnabled()).length,20);
 g.undertow!.victims.forEach((v,i)=>{assert.ok(v.enemy.pos.y>9);assert.equal(v.enemy.pos.x,starts[i].x);assert.equal(v.enemy.pos.z,starts[i].z);});
 for(let i=0;i<40;i++)g.step(1/60);
 assert.equal(g.totalSlamHits,20);assert.equal(g.undertow,null);assert.equal(f.fx.seizeBands.filter(t=>t.isEnabled()).length,0);f.dispose();
});

test('on-screen Undertow excludes unseen targets and caps lifts beneath a low ceiling',async()=>{
 const f=await fixture(),g=f.game;g.benchmark();g.targetOnScreen=p=>p.x>=0;
 const expected=g.enemies.filter(e=>e.pos.x>=0).length;
 g.city.boxes.push(box(0,6,g.pos.z+6,30,.4,20));g.secondary();assert.equal(g.lastUndertow,expected);
 assert.ok(g.undertow!.victims.every(v=>v.height<4));f.dispose();
});


test('full charge launches each form secondary once, without a primary on release',async()=>{
 const f=await fixture(),g=f.game;
 try{
  for(const form of FORMS){
   g.reset('study',false);g.mode='free';g.benchmarkHold=true;g.invuln=100;g.selectForm(form);g.biomass=3;
   const target=g.spawnEnemy(g.pos.add(new Vector3(0,0,3)),'grunt')!;target.hp=target.maxHp=1000;
   g.press('Mouse0');for(let i=0;i<59;i++)g.step(1/60);
   assert.equal(target.hp,1000,form+' must not strike during charge');
   g.step(1/60);assert.equal(g.charging,false);assert.ok(g.keys.has('Mouse0'));
   if(form==='Whipfist'){assert.equal(g.lastUndertow,1);assert.equal(g.biomass,2);}
   else if(form==='Unarmed'){assert.equal(g.attackKind,'slam');assert.equal(target.hp,975);}else{assert.equal(g.specials.stats[form==='Claws'?'faultline':form==='Blade'?'guillotine':'aftershock'],1);assert.equal(target.hp,1000);}
   for(let i=0;i<150;i++)g.step(1/60);
   const hp=target.hp,mass=g.biomass;
   g.press('Mouse0');g.step(1/60);assert.equal(g.charging,false,'held button must not rearm');
   g.release('Mouse0');g.step(1/60);assert.equal(target.hp,hp);assert.equal(g.biomass,mass);
   if(form==='Whipfist')assert.equal(g.totalSlamHits,1);
  }
 }finally{f.dispose();}
});

test('early charge release strikes; explicit secondary and form changes cancel pending charge',async()=>{
 const f=await fixture(),g=f.game;
 try{
  g.reset('study',false);g.mode='free';g.benchmarkHold=true;g.invuln=100;g.selectForm('Hammerfists');
  const target=g.spawnEnemy(g.pos.add(new Vector3(0,0,2)),'grunt')!;target.hp=target.maxHp=1000;
  g.press('Mouse0');for(let i=0;i<25;i++)g.step(1/60);assert.equal(target.hp,1000);
  g.release('Mouse0');assert.ok(target.hp<1000);assert.equal(g.attackKind,'strike');assert.equal(g.actionLabel,'CHARGED HAMMERFISTS');
  g.cooldown=0;g.press('Mouse0');g.press('Mouse2');assert.equal(g.charging,false);assert.equal(g.attackKind,'aftershock');
  const hp=target.hp;g.cooldown=0;g.release('Mouse0');assert.equal(target.hp,hp);
  g.release('Mouse2');g.press('Mouse0');g.selectForm('Blade');g.release('Mouse0');assert.equal(target.hp,hp);
 }finally{f.dispose();}
});

test('full Whipfist charge with no Mass fails once and never falls back to a strike',async()=>{
 const f=await fixture(),g=f.game;
 try{
  g.benchmark();g.biomass=0;g.press('Mouse0');for(let i=0;i<150;i++)g.step(1/60);
  assert.equal(g.lastUndertow,0);assert.equal(g.biomass,0);assert.equal(g.charging,false);assert.match(g.message,/Critical Mass depleted/);
  const health=g.enemies.map(e=>e.hp);g.release('Mouse0');assert.deepEqual(g.enemies.map(e=>e.hp),health);
 }finally{f.dispose();}
});

test('holding a victim keeps full-charge throws on release',async()=>{
 const f=await fixture(),g=f.game;
 try{
  g.reset('study',false);g.mode='free';g.benchmarkHold=true;g.selectForm('Hammerfists');
  const target=g.spawnEnemy(g.pos.add(new Vector3(0,0,2)),'grunt')!;target.hp=1000;g.grab();assert.equal(g.holding,target);
  g.press('Mouse0');for(let i=0;i<90;i++)g.step(1/60);assert.equal(g.holding,target);assert.equal(target.hp,1000);
  g.release('Mouse0');assert.equal(g.holding,null);assert.equal(g.actionLabel,'BODY THROW');assert.ok(target.vel.z>=90);
 }finally{f.dispose();}
});

test('full charge in air enters the form aerial secondary',async()=>{
 const f=await fixture(),g=f.game;
 try{
  g.reset('study',false);g.mode='free';g.selectForm('Blade');g.pos.y=60;g.grounded=false;
  g.body.setTranslation({x:g.pos.x,y:61,z:g.pos.z},true);g.body.setNextKinematicTranslation({x:g.pos.x,y:61,z:g.pos.z});
  g.press('Mouse0');for(let i=0;i<60;i++)g.step(1/60);
  assert.equal(g.actionLabel,'GUILLOTINE');assert.equal(g.specials.motion?.phase,'dive');assert.equal(g.charging,false);assert.ok(g.vel.y<=-42);
  g.release('Mouse0');assert.equal(g.attackKind,'guillotine');
 }finally{f.dispose();}
});
