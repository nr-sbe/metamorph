import {Scene,Vector3,TransformNode,MeshBuilder,StandardMaterial,Color3} from '@babylonjs/core';
import RAPIER from '@dimforge/rapier3d-compat/rapier.es.js';
import {Actor} from './actor';
import {SpecialCombat,type ReactionKind} from './specialCombat';
import type {ImpactIdentity} from './specialRules';
import {advanceShot,type HostileShot} from './projectiles';
import {City,Prop} from './world';
import {Effects,type DebrisKind} from './fx';
import {Form,FORMS,MOVES,clamp,lerp,undertowTargets,visibleUndertowTargets,liftHeight,floorAt,inCone,visible,segmentHit} from './rules';
export interface Enemy {reaction?:{kind:ReactionKind;time:number;duration:number};id:number;actor:Actor;pos:Vector3;vel:Vector3;hp:number;maxHp:number;kind:string;alive:boolean;stagger:number;captured:boolean;cooldown:number;deadTime:number;attack:number;scale:number;phase:number;poise:number;special:{kind:string;time:number;aim:Vector3;fired:boolean}|null}
type Capture={enemy:Enemy;start:Vector3;height:number;ground:number;slammed:boolean};
export class Game{
 specials=new SpecialCombat(this);lastImpact:{attackId:number;owner:string;target:number;damage:number}|null=null;
 targetOnScreen:((p:{x:number;y:number;z:number})=>boolean)|null=null;moveStick:{x:number;y:number}|null=null;defenseBeforeBlock='None';
 shots:HostileShot[]=[];shotSerial=0;
 lastDamage:{source:Vector3;label:string;kind:string;amount:number;time:number}|null=null;
 feeding:{enemy:Enemy;start:Vector3;time:number;scale:number}|null=null;

 player:Actor;pos=new Vector3(0,.25,-28);vel=Vector3.Zero();facing=0;cameraYaw=0;cameraPitch=.2;keys=new Set<string>();just=new Set<string>();form:Form='Claws';defense='None';health=100;biomass=1;shield=100;shieldDelay=0;cooldown=0;attack=0;attackKind='';attackDuration=.4;charge=0;charging=false;grounded=true;gliding=false;airDashes=2;invuln=0;time=0;damageDelay=0;slamPending=false;slamStart=0;holding:Enemy|Prop|null=null;holdCharge=0;undertow:{time:number;victims:Capture[]}|null=null;lastUndertow=0;totalSlamHits=0;locked:Enemy|null=null;
 enemies:Enemy[]=[];serial=1;kills=0;destruction=0;score=0;stage=0;mode='story';running=false;paused=false;wheel=false;dead=false;weapon='';vehicle:Prop|null=null;stageWait=0;stagePending=false;message='';messageTime=0;actionLabel='';actionTime=0;nextCenter=new Vector3(0,0,-8);challenge=false;ringIndex=0;challengeTime=0;rings:TransformNode[]=[];best=0;lastHit='';fixedSteps=0;controller:RAPIER.KinematicCharacterController;body:RAPIER.RigidBody;collider:RAPIER.Collider;lockedMemory='';benchmarkHold=false;artStudy=false;openingRival=false;machineTimers=new Map<number,number>();surf:{enemy:Enemy;time:number}|null=null;onEvent:(name:string)=>void=()=>{};
 constructor(public scene:Scene,public city:City,public fx:Effects){
 this.player=new Actor(scene);this.player.onFormChanged=meshes=>meshes.forEach(m=>city.shadow.addShadowCaster(m));this.player.setForm(this.form);this.player.root.position.copyFrom(this.pos);this.player.meshes().forEach(m=>city.shadow.addShadowCaster(m));
 this.body=city.physics.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(this.pos.x,this.pos.y+1,this.pos.z));
 this.collider=city.physics.createCollider(RAPIER.ColliderDesc.capsule(.65,.36),this.body);this.controller=city.physics.createCharacterController(.025);this.controller.enableAutostep(.6,.3,true);this.controller.enableSnapToGround(.25);this.controller.setApplyImpulsesToDynamicBodies(true);
 try{this.best=Number(localStorage.getItem('morph-best')||0);}catch{}
 this.makeRings();
 }
 say(s:string){this.message=s;this.messageTime=4;}
 label(s:string){this.actionLabel=s;this.actionTime=1.7;}
 start(mode='story'){this.reset(mode);this.running=true;this.paused=false;this.fx.sound.start();this.say(mode==='practice'?'All mutations online. Consume enemies to rebuild Critical Mass.':'You are the weapon. Break the containment line.');}
 reset(mode=this.mode,spawn=true){this.specials.reset();this.shots=[];this.lastDamage=null;this.feeding=null;this.moveStick=null;this.defenseBeforeBlock='None';this.mode=mode;this.artStudy=false;this.openingRival=false;this.machineTimers.clear();this.benchmarkHold=false;this.surf=null;this.enemies.forEach(e=>e.actor.dispose());this.enemies=[];this.fx.reset();this.city.reset();this.pos.set(0,.25,-28);this.vel.setAll(0);this.facing=0;this.cameraYaw=0;this.health=100;this.biomass=mode==='practice'?3:1;this.shield=100;this.shieldDelay=0;this.jumpCharge=0;this.airDashes=2;this.wheel=false;this.player.root.rotation.setAll(0);this.defense='None';this.form='Claws';this.player.setForm(this.form);this.player.root.setEnabled(true);this.dead=false;this.kills=0;this.destruction=0;this.score=0;this.stage=0;this.stageWait=0;this.stagePending=false;this.grounded=true;this.gliding=false;this.holding=null;this.undertow=null;this.locked=null;this.weapon='';this.vehicle=null;this.challenge=false;this.rings.forEach(r=>r.setEnabled(false));this.cooldown=0;this.attack=0;this.invuln=1;this.damageDelay=0;this.slamPending=false;this.charging=false;this.charge=0;this.keys.clear();this.just.clear();this.lastUndertow=0;this.totalSlamHits=0;this.body.setTranslation({x:this.pos.x,y:this.pos.y+1,z:this.pos.z},true);this.body.setNextKinematicTranslation({x:this.pos.x,y:this.pos.y+1,z:this.pos.z});this.nextCenter.set(0,0,-8);if(spawn&&mode!=='study')this.spawnWave(mode==='practice'?20:5,this.nextCenter);this.city.physics.step();this.onEvent('reset');}
 press(code:string){if(this.keys.has(code))return;this.keys.add(code);this.just.add(code);if(!this.running||this.paused)return;
 if(/^Digit[1-5]$/.test(code))this.selectForm(FORMS[Number(code.slice(-1))-1]);
 if(code==='KeyQ')this.wheel=true;
 if(code==='Block'){this.defenseBeforeBlock=this.defense;this.defense='Shield';}
 if(code==='KeyZ'){this.defense=this.defense==='Shield'?'None':'Shield';this.label(this.defense==='None'?'Shield retracted':'Shield deployed');}
 if(code==='KeyX'){this.defense=this.defense==='Armor'?'None':'Armor';this.gliding=false;this.label(this.defense==='None'?'Armor retracted':'Armor deployed · glide restricted');}
 if(code==='KeyT')this.targetNext();if(code==='KeyO'&&this.artStudy)this.cameraYaw+=Math.PI/4;
 if(code==='Space'&&!this.specials.motion){if(!this.grounded&&this.defense!=='Armor'){this.gliding=!this.gliding;this.label(this.gliding?'Membrane deployed':'Membrane retracted');}}
 if(code==='KeyF')this.grab();
 if(code==='KeyE')this.consumeOrUse();
 if(code==='KeyC')this.dodge();
 if(code==='KeyR')this.devastator();
 if(code==='KeyV')this.anchorBoost();
 if(code==='Mouse0'&&!this.dead&&!this.undertow){if(this.specials.motion?.kind==='ram'){this.specials.finishRam(false);return;}if(!this.specials.motion){this.charging=true;this.charge=0;}}
 if(code==='Mouse2')this.secondary();
 if(code==='KeyB')this.beginChallenge();
 if(code==='KeyG')this.weapon=this.weapon?'':this.weapon;
 }
 release(code:string){this.keys.delete(code);if(code==='Block'&&this.defense==='Shield')this.defense=this.defenseBeforeBlock;if(code==='KeyQ')this.wheel=false;if(!this.running||this.paused)return;
 if(code==='Space'&&this.grounded&&!this.vehicle&&!this.specials.motion){this.vel.y=15+Math.min(this.jumpCharge,1)*20;this.grounded=false;this.jumpCharge=0;this.label('Charged launch');}
 if(code==='Mouse0'&&this.charging){const charge=this.charge,automatic=this.chargeUsesSecondary()&&charge>=1;this.cancelCharge();if(automatic)this.secondary();else this.primary(charge);}
 }
 jumpCharge=0;
 cancelCharge(){this.charging=false;this.charge=0;}
 chargeUsesSecondary(){return !this.holding&&!this.weapon&&!this.vehicle;}
 tickAttackCharge(dt:number){
  if(!this.charging)return;
  if(this.dead||this.undertow){this.cancelCharge();return;}
  this.charge=Math.min(1,this.charge+dt);
  // The held input remains latched until release, so a completed charge fires once.
  if(this.charge>=1&&this.chargeUsesSecondary()&&this.cooldown<=0)this.secondary();
 }
 selectForm(form:Form){if(this.undertow||!FORMS.includes(form))return;if(this.specials.motion){if(!this.specials.canCancel)return;this.specials.cancel();}this.cancelCharge();this.form=form;this.player.setForm(form);this.weapon='';this.label(form.toUpperCase());this.fx.burst(this.pos.add(new Vector3(0,1.5,0)),10,false,3,this.fx.tendrilMaterial);this.fx.sound.sweep();}
 aim(){if(this.locked?.alive){const d=this.locked.pos.subtract(this.pos);return Math.atan2(d.x,d.z);}return this.cameraYaw;}
 forward(){return new Vector3(Math.sin(this.facing),0,Math.cos(this.facing));}
 targetNext(){const candidates=this.enemies.filter(e=>e.alive&&Vector3.Distance(e.pos,this.pos)<50).sort((a,b)=>Vector3.DistanceSquared(a.pos,this.pos)-Vector3.DistanceSquared(b.pos,this.pos));if(!candidates.length){this.locked=null;return;}const index=candidates.indexOf(this.locked!);this.locked=candidates[(index+1)%candidates.length];this.label('Target locked');}
 spawnWave(n:number,center:Vector3){for(let i=0;i<n;i++){const angle=(i/n-.5)*Math.PI*1.2,r=3+(i%4)*1.8;const p=center.add(new Vector3(Math.sin(angle)*r,0,Math.cos(angle)*r-3));p.y=floorAt(p.add(new Vector3(0,1,0)),this.city.boxes);const kind=this.stage===3?'boss':this.stage>0&&i%8===0?'brute':i%5===0?'ranged':i%4===0?'hunter':'grunt';this.spawnEnemy(p,kind);} }
 spawnEnemy(p:Vector3,kind:string){if(this.enemies.filter(e=>e.alive).length>=20)return;const heavy=kind==='brute'||kind==='boss';const actor=new Actor(this.scene,true,heavy,kind);const hp=kind==='boss'?1400:kind==='brute'?240:kind==='hunter'?95:65;actor.root.position.copyFrom(p);actor.meshes().forEach(m=>{if(m.isEnabled())this.city.shadow.addShadowCaster(m);});const e:Enemy={id:this.serial++,actor,pos:p.clone(),vel:Vector3.Zero(),hp,maxHp:hp,kind,alive:true,stagger:0,captured:false,cooldown:1+Math.random()*2,deadTime:0,attack:0,scale:heavy?1.65:1,phase:0,poise:0,special:null};this.enemies.push(e);return e;}
 primary(charge=0){if(this.cooldown>0||this.undertow||this.dead)return;if(this.vehicle){this.fireWeapon(true);return;}if(this.weapon){this.fireWeapon(false);return;}if(this.holding){this.throwHeld(charge);return;}
 this.facing=this.aim();const m=MOVES[this.form];const powered=charge>.33;this.cooldown=m.recovery*(powered?1.35:1);this.attackDuration=this.cooldown;this.attack=this.cooldown;this.attackKind='strike';
 if(!this.grounded&&this.form==='Unarmed'&&!this.keys.has('ShiftLeft')){const target=this.enemies.find(e=>e.alive&&inCone(this.pos,this.facing,e.pos,12,1.4)&&this.line(e.pos));if(target){this.vel.copyFrom(target.pos.subtract(this.pos).normalize().scale(22));this.vel.y+=3;this.damageEnemy(target,32,this.forward().scale(15));this.label('FLYING KICK');}}
 if(!this.grounded&&this.form==='Unarmed'&&this.keys.has('ShiftLeft')){this.vel.copyFrom(this.forward().scale(24));this.vel.y=-4;this.label('CANNONBALL');}
 else if(powered)this.label('CHARGED '+this.form.toUpperCase());
 let hits=0;for(const e of this.enemies){if(!e.alive||e.captured)continue;if(inCone(this.pos,this.facing,e.pos,m.range,m.arc)&&this.line(e.pos)){const force=this.forward().scale(m.impulse*(powered?1.6:1));force.y=powered?8:2;this.damageEnemy(e,m.damage*(powered?1.8:1),force,this.form==='Blade'||this.form==='Claws');hits++;}}
 this.damageProps(this.pos.add(this.forward().scale(m.range*.55)),m.range*.65,m.damage*(powered?1.8:1));
 if(this.form==='Whipfist'){const target=this.enemies.find(e=>e.alive&&inCone(this.pos,this.facing,e.pos,12,.7));this.fx.tendril(0,this.pos.add(new Vector3(.3,1.3,0)),target?target.pos.add(new Vector3(0,1,0)):this.pos.add(this.forward().scale(10)).add(new Vector3(0,1,0)));}
 this.fx.sound.sweep();if(hits)this.onEvent('hit');
 }
 secondary(){this.cancelCharge();if(this.cooldown>0||this.undertow||this.dead||this.specials.motion)return;this.facing=this.aim();
 if(this.form==='Whipfist'&&(!this.holding||this.keys.has('KeyF'))){this.startUndertow();return;}
 if(this.holding){if('actor' in this.holding&&this.form==='Unarmed'&&this.grounded){this.specials.start('ram');return;}if('actor' in this.holding){this.damageEnemy(this.holding,18,new Vector3(0,0,0));this.fx.sound.hit(1);this.label('GRAPPLE / PUMMEL');}else this.throwHeld(.6);this.cooldown=.35;return;}
 if(this.form==='Blade'){this.specials.start('guillotine');return;}if(this.form==='Hammerfists'){this.specials.start('aftershock');return;}if(this.form==='Claws'&&this.grounded){this.specials.start('faultline');return;}
 if(!this.grounded){this.slamPending=true;this.slamStart=this.pos.y;this.gliding=false;this.vel.y=-42;this.vel.x*=.5;this.vel.z*=.5;this.attackKind='slam';this.attack=this.attackDuration=.7;this.cooldown=.5;this.label('BULLETDIVE');return;}
 const m=MOVES[this.form];this.cooldown=m.recovery*1.3;this.attack=this.attackDuration=this.cooldown;this.attackKind='slam';
 if(this.form==='Unarmed'){
 const e=this.enemies.find(e=>e.alive&&inCone(this.pos,this.facing,e.pos,4,1.8)&&this.line(e.pos));if(e){this.damageEnemy(e,25,new Vector3(0,15,0));this.vel.y=13;this.grounded=false;this.label('UPPERCUT / AIR COMBO');}}

 }
 line(p:Vector3){return visible(this.pos.add(new Vector3(0,1.4,0)),p.add(new Vector3(0,1,0)),this.city.boxes);}
 grabCandidate(){
  const range=this.form==='Whipfist'?12:3.5,aim=this.aim();
  return this.enemies.filter(e=>e.alive&&!e.captured&&e.kind!=='boss'&&(e.kind!=='brute'||e.stagger>0)&&Math.abs(e.pos.y-this.pos.y)<3&&this.line(e.pos)&&(Vector3.Distance(e.pos,this.pos)<2.2||inCone(this.pos,aim,e.pos,range,2.6)))
   .sort((a,b)=>{const score=(e:Enemy)=>Vector3.Distance(e.pos,this.pos)+(1-Math.cos(Math.atan2(e.pos.x-this.pos.x,e.pos.z-this.pos.z)-aim))*2-(e===this.locked?2:0);return score(a)-score(b);})[0];
 }
 grab(){if(this.undertow||this.cooldown>0||this.specials.motion)return;
 if(!this.grounded&&this.keys.has('ShiftLeft')&&!this.surf){this.facing=this.aim();const target=this.enemies.find(e=>e.alive&&!e.captured&&['grunt','ranged'].includes(e.kind)&&inCone(this.pos,this.facing,e.pos,10,1.8)&&this.line(e.pos));if(target){this.surf={enemy:target,time:1.2};target.captured=true;this.pos.copyFrom(target.pos);this.vel.copyFrom(this.forward().scale(22));this.vel.y=1;this.body.setTranslation({x:this.pos.x,y:this.pos.y+1,z:this.pos.z},true);this.label('BODY SURF');return;}}
 if(this.holding)return;this.facing=this.aim();const range=this.form==='Whipfist'?12:3.5;const e=this.grabCandidate();
 if(e){this.facing=Math.atan2(e.pos.x-this.pos.x,e.pos.z-this.pos.z);this.holding=e;e.captured=true;e.attack=0;this.holdCharge=0;this.label('GRABBED / E consume · attack throw');return;}

 const p=this.city.props.filter(p=>p.alive&&!['tank','aircraft','rifle','launcher','wall','scaffold','sign'].includes(p.kind)&&inCone(this.pos,this.facing,p.pos,range,2)&&this.line(p.pos)).sort((a,b)=>Vector3.DistanceSquared(a.pos,this.pos)-Vector3.DistanceSquared(b.pos,this.pos))[0];if(p){this.city.detach(p);if(p.body){this.city.physics.removeRigidBody(p.body);p.body=null;}this.holding=p;this.label('OBJECT SEIZED / hold attack to charge throw');}else this.say('Move closer to an enemy or parked car.');
 }
 throwHeld(charge:number){if(!this.holding)return;const power=(this.form==='Hammerfists'?45:26)*(1+clamp(charge,0,1));const v=this.forward().scale(power);v.y=8+charge*5;
 if('actor' in this.holding){const e=this.holding;e.captured=false;this.damageEnemy(e,25,v);e.stagger=2;this.specials.track(e);this.label('BODY THROW');}else{this.city.launch(this.holding,v);this.specials.track(this.holding);this.label('WEAPONIZED / '+this.holding.kind.toUpperCase());}
 this.holding=null;this.cooldown=.35;this.attack=this.attackDuration=.35;this.attackKind='strike';this.fx.sound.sweep();}
 consumeOrUse(){if(this.specials.motion)return;if(this.vehicle){const v=this.vehicle;this.pos.copyFrom(v.pos.add(new Vector3(4,2,0)));this.vehicle=null;this.player.root.setEnabled(true);this.body.setTranslation({x:this.pos.x,y:this.pos.y+1,z:this.pos.z},true);this.body.setNextKinematicTranslation({x:this.pos.x,y:this.pos.y+1,z:this.pos.z});this.vel.set(0,10,0);this.label('VEHICLE EXIT');return;}
 if(this.holding&&'actor' in this.holding){const e=this.holding;e.captured=false;this.feeding={enemy:e,start:e.pos.clone(),time:0,scale:e.scale};this.damageEnemy(e,10000,Vector3.Zero());this.attack=this.attackDuration=.55;this.attackKind='consume';const gained=35;const excess=Math.max(0,this.health+gained-100);this.health=Math.min(100,this.health+gained);this.biomass=clamp(this.biomass+excess/35,0,3);this.holding=null;this.fx.burst(this.pos.add(new Vector3(0,1,0)),16,false,2,this.fx.tendrilMaterial);this.label('CONSUMED / BIOMASS RESTORED');this.cooldown=.5;return;}
 const p=this.city.props.filter(p=>p.alive&&['tank','aircraft','rifle','launcher'].includes(p.kind)&&Vector3.Distance(p.pos,this.pos)<(p.kind==='aircraft'?14:5)).sort((a,b)=>Vector3.DistanceSquared(a.pos,this.pos)-Vector3.DistanceSquared(b.pos,this.pos))[0];if(!p){this.say('Grab a biological enemy first, or approach a marked weapon / vehicle.');return;}
 if(p.kind==='rifle'||p.kind==='launcher'){this.weapon=p.kind;p.root.setEnabled(false);p.alive=false;this.label(p.kind.toUpperCase()+' ACQUIRED');}else{this.vehicle=p;this.city.detach(p);this.player.root.setEnabled(false);this.label(p.kind==='tank'?'ARMORED VEHICLE / click to fire':'AIRCRAFT / Space ascend · Ctrl descend');}}
 dodge(){if(this.defense==='Armor'){this.say('Armor restricts dodge and glide. Press X to retract.');return;}if(this.undertow)return;if(this.specials.motion){if(this.specials.motion.kind==='ram')this.specials.finishRam(false,true);else if(this.specials.canCancel)this.specials.cancel();else return;}this.facing=this.aim();let d=this.forward();if(this.keys.has('KeyA'))d=new Vector3(-Math.cos(this.cameraYaw),0,Math.sin(this.cameraYaw));if(this.keys.has('KeyD'))d=new Vector3(Math.cos(this.cameraYaw),0,-Math.sin(this.cameraYaw));if(this.keys.has('KeyS'))d.scaleInPlace(-1);if(!this.grounded){if(this.airDashes<=0)return;this.airDashes--;this.vel.copyFrom(d.scale(30));this.vel.y=2;this.label('AIR DASH');}else{this.vel.copyFrom(d.scale(23));this.vel.y=2;this.label('DIVEROLL');}this.invuln=.35;}
 anchorBoost(){if(this.defense==='Armor'||this.undertow||this.specials.motion)return;const d=new Vector3(Math.sin(this.cameraYaw),.7,Math.cos(this.cameraYaw));const hits=this.city.boxes.filter(b=>b.active!==false&&segmentHit(this.pos.add(new Vector3(0,2,0)),d.scale(90),b)!==null);if(!hits.length){this.say('Face a nearby building to anchor.');return;}hits.sort((a,b)=>Math.hypot(a.min.x-this.pos.x,a.min.z-this.pos.z)-Math.hypot(b.min.x-this.pos.x,b.min.z-this.pos.z));const b=hits[0];const target=new Vector3(clamp(this.pos.x,b.min.x,b.max.x),b.max.y+2,clamp(this.pos.z,b.min.z,b.max.z));const delta=target.subtract(this.pos).normalize();this.vel.copyFrom(delta.scale(43));this.vel.y=Math.max(this.vel.y,23);this.grounded=false;this.gliding=false;this.fx.tendril(0,this.pos.add(new Vector3(0,1,0)),target);this.cooldown=.3;this.label('ROOFTOP ANCHOR');}
 startUndertow(){if(this.biomass<1){this.say('Critical Mass depleted. Grab + consume enemies to replenish.');return;}
 // A held target is released into the same acquisition query, preserving the chord.
 if(this.holding){if('actor' in this.holding)this.holding.captured=false;else this.city.launch(this.holding,Vector3.Zero());this.holding=null;}
 const origin=this.pos.add(new Vector3(0,1,0));const candidates=this.enemies.map(e=>({...e,pos:e.pos.add(new Vector3(0,1,0))}));const ids=new Set((this.targetOnScreen?visibleUndertowTargets(origin,candidates,this.city.boxes,this.targetOnScreen):undertowTargets(origin,this.facing,candidates,this.city.boxes)).map(e=>e.id));
 for(const e of this.enemies)if(e.alive&&e.kind==='brute'&&e.stagger<=0&&inCone(origin,this.facing,e.pos,12)&&this.line(e.pos)){this.label('ARMORED / RESISTED');this.fx.burst(e.pos.add(new Vector3(0,1.5,0)),5);}
 const targets=this.enemies.filter(e=>ids.has(e.id));if(!targets.length){this.say('No eligible targets. Face the crowd; stagger armored enemies first.');return;}
 this.benchmarkHold=false;this.biomass-=1;this.lastUndertow=targets.length;this.undertow={time:0,victims:targets.map(e=>{e.captured=true;e.vel.setAll(0);return {enemy:e,start:e.pos.clone(),height:liftHeight(e.pos.add(new Vector3(0,2,0)),this.city.boxes,9.5+(e.id%3)*.5),ground:floorAt(e.pos.add(new Vector3(0,.2,0)),this.city.boxes),slammed:false};})};this.cooldown=1.2;this.attack=this.attackDuration=1.2;this.attackKind='undertow';this.label('UNDERTOW / '+targets.length+' CAPTURED');this.fx.sound.undertow('seize');this.onEvent('undertow');}
 tickUndertow(dt:number){
 const u=this.undertow;if(!u)return;const before=u.time;u.time+=dt;this.invuln=Math.max(this.invuln,.05);
 const source=this.player.skin?this.player.arms[1].getAbsolutePosition().clone():this.pos.add(new Vector3(.45,1.5,0));
 if(before<.74&&u.time>=.74)this.fx.sound.undertow('drop');
 if(before<1.04&&u.time>=1.04)this.fx.sound.undertow('slam');
 for(let i=0;i<u.victims.length;i++){
  const v=u.victims[i],t=u.time,e=v.enemy;
  // Keep horizontal coordinates fixed; ceiling tests bound the vertical lift.
  e.pos.x=v.start.x;e.pos.z=v.start.z;
  if(t<.12)e.pos.y=v.start.y;
  else if(t<.52)e.pos.y=v.start.y+v.height*(1-Math.pow(1-(t-.12)/.4,3));
  else if(t<.74)e.pos.y=v.start.y+v.height;
  else if(t<1.04)e.pos.y=lerp(v.start.y+v.height,v.ground,Math.pow((t-.74)/.3,2));
  else if(!v.slammed){v.slammed=true;this.totalSlamHits++;e.pos.y=v.ground;e.captured=false;this.damageEnemy(e,130,new Vector3(0,3,0));this.fx.impact(new Vector3(e.pos.x,v.ground,e.pos.z),2.4,1.6);this.damageProps(e.pos,2.1,80);}
  if(t<1.04){const torso=e.pos.add(new Vector3(0,1.05,0)),tip=Vector3.Lerp(source,torso,clamp(t/.12,0,1));this.fx.tendril(i,source,tip,t/1.2);this.fx.seizeBand(i,torso,t>=.12);}
 }
 if(u.time>=1.04)this.fx.hideSeizeBands();
 if(u.time>=1.2){this.undertow=null;this.fx.hideTendrils();this.label('UNDERTOW / IMPACT');}
 }
 devastator(){this.cancelCharge();if(this.cooldown>0||this.undertow||this.dead||this.specials.motion)return;if(this.form==='Whipfist'){this.facing=this.aim();this.startUndertow();return;}if(this.biomass<1){this.say('Consume enemies at full health to enter Critical Mass.');return;}this.biomass-=1;this.cooldown=1;this.attack=this.attackDuration=1;this.attackKind='slam';this.facing=this.aim();if(this.form==='Claws'){this.area(this.pos,13,190,20);this.spikes(this.pos,12);this.label('GROUNDSPIKE GRAVEYARD');}else if(this.form==='Blade'){this.area(this.pos.add(this.forward().scale(10)),8,240,30);this.label('CRITICAL PAIN');}else{this.area(this.pos,14,160,24);let i=0;for(const e of this.enemies)if(e.alive&&Vector3.Distance(e.pos,this.pos)<15)this.fx.tendril(i++,this.pos.add(new Vector3(0,1.5,0)),e.pos.add(new Vector3(0,1,0)));this.label('TENDRIL BARRAGE');}}
 spikes(p:Vector3,radius:number){for(let i=0;i<10;i++){const a=i*Math.PI*.2;this.fx.fragment(p.add(new Vector3(Math.sin(a)*radius*.6,1.1,Math.cos(a)*radius*.6)),new Vector3(0,10,0),.5,false,'spike');}}
 area(p:Vector3,radius:number,damage:number,force:number){for(const e of this.enemies)if(e.alive&&!e.captured&&Vector3.Distance(e.pos,p)<radius&&visible(p.add(new Vector3(0,1,0)),e.pos.add(new Vector3(0,1,0)),this.city.boxes)){const v=e.pos.subtract(p);v.y=0;if(v.length()<.1)v.z=1;v.normalize().scaleInPlace(force);v.y=force*.5;this.damageEnemy(e,damage,v);}
 this.damageProps(p,radius,damage);const ground=floorAt(p.add(new Vector3(0,2,0)),this.city.boxes);this.fx.impact(new Vector3(p.x,ground,p.z),radius,Math.min(5,damage/30));}
 damageEnemy(e:Enemy,damage:number,force:Vector3,cut=false,event?:ImpactIdentity){if(!e.alive)return;if(event)this.lastImpact={attackId:event.id,owner:event.owner,target:e.id,damage};e.hp-=damage;e.vel.addInPlace(force);e.poise+=damage;e.stagger=e.kind==='boss'?(e.poise>220?1.5:.12):e.kind==='brute'?(e.poise>90?1.8:.15):1;if(e.stagger>1)e.poise=0;this.fx.bloodHit(e.pos.add(new Vector3(0,1.25,0)),force,cut||e.hp<=0,floorAt(e.pos.add(new Vector3(0,1,0)),this.city.boxes));this.fx.shake=Math.max(this.fx.shake,.12);this.fx.hitPause=Math.max(this.fx.hitPause,.035);this.fx.sound.hit(Math.min(2,damage/35));this.lastHit=e.kind;
 if(e.hp<=0){e.alive=false;e.captured=false;e.deadTime=3;e.actor.die();this.kills++;this.score+=e.kind==='boss'?2000:e.kind==='brute'?300:100;if(this.locked===e)this.locked=null;if(cut&&this.fx.gore){e.actor.cutArm();this.fx.fragment(e.pos.add(new Vector3(.5,1.4,0)),force.add(new Vector3(0,5,0)),.25,true);}this.onEvent('kill');}}
 damageProps(p:Vector3,radius:number,damage:number){
  for(const prop of this.city.props){
   if(!prop.alive||['rifle','launcher'].includes(prop.kind)||prop===this.holding||prop===this.vehicle||Vector3.Distance(prop.pos,p)>=radius+prop.size.length()*.25)continue;
   prop.hp-=damage;if(prop.hp>0)continue;
   this.city.destroy(prop);this.destruction++;this.score+=50;
   const vehicle=['car','tank','aircraft'].includes(prop.kind),metal=vehicle||prop.kind==='sign'||prop.kind==='scaffold';
   const kind:DebrisKind=metal?'metal':'stone';
   this.fx.impact(prop.pos.clone(),Math.min(5,prop.size.length()),vehicle?3:1.5,false,kind);
   for(let j=0;j<8;j++){
    const fragment:DebrisKind=vehicle&&j%3===0?'glass':prop.kind==='scaffold'&&j%2===0?'wood':kind;
    this.fx.fragment(prop.pos.add(new Vector3((Math.random()-.5)*prop.size.x*.6,.6+Math.random()*prop.size.y*.5,(Math.random()-.5)*prop.size.z*.6)),new Vector3((Math.random()-.5)*12,5+Math.random()*7,(Math.random()-.5)*12),fragment==='glass'?.18+Math.random()*.2:.25+Math.random()*.4,false,fragment);
   }
  }
 }
 tickBoss(e:Enemy,dt:number){
 const phase=clamp(Math.floor((1-e.hp/e.maxHp)*3),0,2);
 if(phase>e.phase){e.phase=phase;this.fx.impact(e.pos,10,4);this.damageProps(e.pos,13,160);this.say(phase===1?'The rival adapts. Watch for the rush.':'Final phase. Jump the shockwave and punish the landing.');e.stagger=1;e.cooldown=2;}
 const delta=this.pos.subtract(e.pos),distance=delta.length(),forward=new Vector3(delta.x,0,delta.z).normalize();e.actor.root.rotation.y=Math.atan2(forward.x,forward.z);
 if(e.special){const a=e.special;a.time+=dt;e.attack=clamp(1-a.time/1.5,0,1);const telegraph=a.kind==='rush'?.85:1.05;
 if(a.time<telegraph){e.vel.x*=.8;e.vel.z*=.8;if(Math.floor(a.time*20)%3===0)this.fx.burst(e.pos.add(new Vector3(0,2.6,0)),2,false,1);this.labelQuiet(a.kind==='rush'?'DANGER / SIDESTEP':'DANGER / EVADE OR JUMP');}
 else if(!a.fired){a.fired=true;if(a.kind==='rush'){const dash=a.aim.subtract(e.pos);dash.y=0;dash.normalize().scaleInPlace(32);e.vel.copyFrom(dash);}else{this.fx.impact(e.pos,8,4);this.damageProps(e.pos,8,95);if(distance<8&&this.pos.y-e.pos.y<2.5)this.hurt(phase===2?30:22,e.pos,'APEX SHOCKWAVE',true);}}
 if(a.kind==='rush'&&a.fired&&a.time<1.4){if(distance<3.2){this.hurt(25,e.pos,'APEX RUSH',true);if(this.invuln<=.26){this.vel.copyFrom(forward.scale(18));this.vel.y=9;}}this.damageProps(e.pos,3,12);}
 if(a.time>1.7){e.special=null;e.cooldown=1.2;e.stagger=.55;e.vel.scaleInPlace(.1);}
 }else if(e.stagger<=0&&!this.challenge){if(distance>6){e.vel.x=forward.x*(phase?7:4);e.vel.z=forward.z*(phase?7:4);}else{e.vel.x*=.8;e.vel.z*=.8;}if(e.cooldown<=0&&distance<25){e.special={kind:phase>0&&Math.floor(this.time)%2===0?'rush':'slam',time:0,aim:this.pos.clone(),fired:false};}}
 else{e.vel.x*=.85;e.vel.z*=.85;}
 e.vel.y-=28*dt;this.moveEnemy(e,e.vel.scale(dt));const g=floorAt(e.pos.add(new Vector3(0,1.5,0)),this.city.boxes);if(e.pos.y<g){e.pos.y=g;e.vel.y=0;}e.actor.root.position.copyFrom(e.pos);e.actor.animate(this.time,Math.hypot(e.vel.x,e.vel.z),false,false,e.special?clamp(e.special.time/1.5,0,1):0,'slam','Armor');
 }
 hurt(damage:number,source:Vector3,label='HOSTILE',unblockable=false){
  if(this.invuln>0||this.dead||this.challenge||damage<=0)return;
  let remaining=damage*(this.defense==='Armor'?.4:1),kind='VITALITY';
  if(this.vehicle){this.vehicle.hp-=remaining;kind='VEHICLE';if(this.vehicle.hp<=0){const p=this.vehicle;this.consumeOrUse();this.city.destroy(p);}}
  else {
   if(this.defense==='Shield'&&this.shield>0&&!unblockable){const absorbed=Math.min(this.shield,remaining);this.shield-=absorbed;remaining-=absorbed;this.shieldDelay=3;kind=remaining>0?'SHIELD BROKEN':'BLOCKED';this.fx.burst(this.pos.add(new Vector3(0,1,0)),6,false);}
   if(remaining>0){const absorbed=Math.min(this.biomass*35,remaining);this.biomass=Math.max(0,this.biomass-absorbed/35);remaining-=absorbed;kind=kind==='SHIELD BROKEN'?kind:remaining>0?'VITALITY':'CRITICAL MASS';this.health=Math.max(0,this.health-remaining);this.damageDelay=5;}
  }
  this.lastDamage={source:source.clone(),label,kind,amount:damage,time:this.time};
  this.invuln=.35;this.fx.shake=kind==='BLOCKED'?.055:.15;this.fx.sound.incoming(kind==='BLOCKED');this.onEvent('damage');
  if(unblockable&&this.specials.motion)this.specials.cancel();
  if(this.health<=0){this.specials.reset();this.dead=true;this.label('BIOMASS LOST');this.paused=true;this.onEvent('death');}
 }
 fireHostile(source:Vector3,label:string,damage:number,speed:number,range:number){
  if(this.shots.length>=24)return;
  const direction=this.pos.add(new Vector3(0,1.1,0)).subtract(source).normalize();
  this.shots.push({position:source.clone(),origin:source.clone(),velocity:direction.scale(speed),damage,remaining:range,label,slot:Array.from({length:24},(_,i)=>i).find(i=>!this.shots.some(s=>s.slot===i))!});
 }
 tickShots(dt:number){
  for(const shot of this.shots){const state=advanceShot(shot,dt,this.pos,this.city.boxes);this.fx.projectile(shot.slot,shot.position,shot.velocity,state==='flying');if(state==='player')this.hurt(shot.damage,shot.origin,shot.label);if(state!=='flying')shot.remaining=0;}
  this.shots=this.shots.filter(s=>s.remaining>0);
 }
 incomingThreats(){
  const threats:{source:Vector3;label:string;remaining:number;duration:number;unblockable:boolean;range:number}[]=[];
  for(const e of this.enemies){if(!e.alive||e.captured||e.stagger>0||!this.line(e.pos))continue;
   if(e.special&&!e.special.fired)threats.push({source:e.pos,label:e.special.kind==='rush'?'APEX RUSH':'SHOCKWAVE',remaining:(e.special.kind==='rush'?.85:1.05)-e.special.time,duration:e.special.kind==='rush'?.85:1.05,unblockable:true,range:e.special.kind==='rush'?25:8});
   else if(e.attack>.15)threats.push({source:e.pos,label:e.kind==='ranged'?'RIFLE':e.kind==='hunter'?'HUNTER':e.kind==='brute'?'BRUTE':'MELEE',remaining:e.attack-.15,duration:e.kind==='ranged'?.85:.55,unblockable:false,range:e.kind==='ranged'?24:3.1});
  }
  for(const p of this.city.props){const timer=this.machineTimers.get(p.id);if(!p.alive||p===this.vehicle||timer===undefined||timer>.95||!['tank','aircraft'].includes(p.kind)||!visible(p.pos,this.pos,this.city.boxes))continue;threats.push({source:p.pos,label:p.kind==='tank'?'CANNON':'AIRCRAFT',remaining:timer,duration:.95,unblockable:false,range:55});}
  return threats.filter(t=>Vector3.Distance(t.source,this.pos)<=t.range+2).sort((a,b)=>a.remaining-b.remaining).slice(0,6);
 }
 fireWeapon(vehicle:boolean){this.facing=this.aim();const launcher=this.weapon==='launcher'||vehicle;this.cooldown=launcher?.7:.12;const target=this.enemies.filter(e=>e.alive&&inCone(this.pos,this.facing,e.pos,120,.22)&&this.line(e.pos)).sort((a,b)=>Vector3.DistanceSquared(a.pos,this.pos)-Vector3.DistanceSquared(b.pos,this.pos))[0];const p=target?target.pos.clone():this.pos.add(this.forward().scale(35));if(launcher)this.area(p,6,160,22);else if(target)this.damageEnemy(target,28,this.forward().scale(4));this.fx.tendril(0,this.pos.add(new Vector3(0,1.5,0)),p.add(new Vector3(0,1,0)));this.fx.sound.hit(launcher?3:.6,true);this.label(vehicle?'VEHICLE FIRE':this.weapon.toUpperCase());}
 moveEnemy(e:Enemy,delta:Vector3){const from=e.pos.add(new Vector3(0,1,0));for(const b of this.city.boxes){if(b.active===false)continue;const t=segmentHit(from,delta,b,.38);if(t!==null){delta.scaleInPlace(Math.max(0,t-.02));break;}}e.pos.addInPlace(delta);}
 tickEnemies(dt:number){for(const e of this.enemies){if(!e.alive){e.deadTime-=dt;if(e.deadTime<=0){e.actor.root.setEnabled(false);continue;}e.vel.y-=28*dt;this.moveEnemy(e,e.vel.scale(dt));const g=floorAt(e.pos.add(new Vector3(0,1,0)),this.city.boxes);if(e.pos.y<=g){e.pos.y=g;e.vel.y=0;e.vel.x*=.85;e.vel.z*=.85;}e.actor.root.position.copyFrom(e.pos);if(!e.actor.skin)e.actor.root.rotation.z=lerp(e.actor.root.rotation.z,1.5,dt*8);continue;}
 e.stagger=Math.max(0,e.stagger-dt);e.cooldown-=dt;e.attack=Math.max(0,e.attack-dt);if(e.captured){e.actor.root.position.copyFrom(e.pos);e.actor.animate(this.time,0,true,false,0,this.holding===e?'held':'','');continue;}
 if(e.kind==='boss'){this.tickBoss(e,dt);continue;}const to=this.pos.subtract(e.pos),dist=to.length(),flat=new Vector3(to.x,0,to.z);if(flat.length()>.01)flat.normalize();e.actor.root.rotation.y=Math.atan2(flat.x,flat.z);
 if(e.stagger<=0&&!this.challenge&&!this.benchmarkHold&&dist<55){const stop=e.kind==='ranged'?14:2.2;const speed=e.kind==='hunter'?6.5:e.kind==='boss'?4:3.2;if(dist>stop){e.vel.x=flat.x*speed;e.vel.z=flat.z*speed;}else{e.vel.x*=.8;e.vel.z*=.8;if(e.cooldown<=0){const attackers=this.enemies.filter(x=>x.attack>0).length;if(attackers<3){e.attack=e.kind==='ranged'?1:.7;e.cooldown=2.1+Math.random();this.fx.burst(e.pos.add(new Vector3(0,2.2,0)),5,false,2);}}}
 if(e.attack>.15&&e.attack-dt<=.15&&dist<(e.kind==='ranged'?24:3.1)&&this.line(e.pos)){if(e.kind==='ranged')this.fireHostile(e.pos.add(new Vector3(0,1.5,0)),'RIFLE',8,32,24);else this.hurt(e.kind==='brute'?17:9,e.pos,e.kind==='hunter'?'HUNTER':e.kind==='brute'?'BRUTE':'MELEE');}
 }else{e.vel.x*=Math.pow(.12,dt);e.vel.z*=Math.pow(.12,dt);}
 e.vel.y-=28*dt;this.moveEnemy(e,e.vel.scale(dt));const g=floorAt(e.pos.add(new Vector3(0,1.5,0)),this.city.boxes);if(e.pos.y<g){e.pos.y=g;e.vel.y=0;}
 e.actor.root.position.copyFrom(e.pos);e.actor.animate(this.time,Math.hypot(e.vel.x,e.vel.z),e.pos.y>g+.3,false,e.attack>0?1-e.attack/.65:0,'strike','');
 }

 }
 tickMachines(dt:number){
 if(this.challenge||this.benchmarkHold)return;
 for(const p of this.city.props){if(!p.alive||p===this.vehicle||!['tank','aircraft'].includes(p.kind))continue;const distance=Vector3.Distance(p.pos,this.pos);if(distance>55)continue;
 let timer=(this.machineTimers.get(p.id)??2.5)-dt;
 if(p.kind==='aircraft'){const target=p.origin.add(new Vector3(Math.sin(this.time*.25)*7,Math.sin(this.time)*.7,Math.cos(this.time*.25)*4));const move=target.subtract(p.pos).scale(Math.min(1,dt));if(visible(p.pos,target,this.city.boxes))p.pos.addInPlace(move);}
 if(timer<.7&&timer>0)this.labelQuiet(p.kind==='aircraft'?'AIRBORNE THREAT / EVADE':'VEHICLE CANNON / EVADE');
 if(timer<=0){timer=p.kind==='aircraft'?2.8:4;if(visible(p.pos.add(new Vector3(0,1.5,0)),this.pos.add(new Vector3(0,1,0)),this.city.boxes)){this.fireHostile(p.pos.add(new Vector3(0,1.5,0)),p.kind==='aircraft'?'AIRCRAFT':'CANNON',p.kind==='aircraft'?8:20,p.kind==='aircraft'?35:42,55);this.fx.sound.hit(1.5,true);}}
 this.machineTimers.set(p.id,timer);
 }
 }
 visualStudy(){this.reset('study',false);this.artStudy=true;this.enemies.forEach(e=>e.actor.dispose());this.enemies=[];this.mode='free';this.cameraYaw=-.55;this.facing=0;this.selectForm('Whipfist');this.say('VISUAL STUDY / explore the street, use 1-5 to inspect mutations.');}
 rivalPractice(){this.reset('practice',false);this.enemies.forEach(e=>e.actor.dispose());this.enemies=[];this.mode='free';this.openingRival=true;this.stage=1;const rival=this.spawnEnemy(this.pos.add(new Vector3(0,0,12)),'boss');if(rival)rival.hp=rival.maxHp=520;this.say('THE OTHER / evade the wind-up, punish the recovery.');}
 tickMovement(dt:number){
 if(this.specials.ownsMovement){this.moveSpecial(dt);return;}
 if(this.vehicle){const p=this.vehicle;let f=this.moveStick?-this.moveStick.y:(this.keys.has('KeyW')?1:0)-(this.keys.has('KeyS')?1:0),s=this.moveStick?this.moveStick.x:(this.keys.has('KeyD')?1:0)-(this.keys.has('KeyA')?1:0);const speed=p.kind==='aircraft'?35:15;const d=new Vector3(Math.sin(this.cameraYaw)*f+Math.cos(this.cameraYaw)*s,0,Math.cos(this.cameraYaw)*f-Math.sin(this.cameraYaw)*s).scale(speed*dt);if(p.kind==='aircraft')d.y=((this.keys.has('Space')?1:0)-(this.keys.has('ControlLeft')?1:0))*15*dt;const from=p.pos.clone();for(const b of this.city.boxes){if(b.active===false)continue;const hit=segmentHit(from,d,b,1.8);if(hit!==null)d.scaleInPlace(Math.max(0,hit-.02));}p.pos.addInPlace(d);p.pos.y=Math.max(p.kind==='aircraft'?3:1,p.pos.y);p.root.rotation.y=this.cameraYaw;this.pos.copyFrom(p.pos);this.vel.setAll(0);return;}
 let f=this.moveStick?-this.moveStick.y:(this.keys.has('KeyW')?1:0)-(this.keys.has('KeyS')?1:0),s=this.moveStick?this.moveStick.x:(this.keys.has('KeyD')?1:0)-(this.keys.has('KeyA')?1:0);const sprint=this.keys.has('ShiftLeft');const wish=new Vector3(Math.sin(this.cameraYaw)*f+Math.cos(this.cameraYaw)*s,0,Math.cos(this.cameraYaw)*f-Math.sin(this.cameraYaw)*s);if(wish.length()>1)wish.normalize();
 if(this.grounded&&this.keys.has('Space'))this.jumpCharge=Math.min(1,this.jumpCharge+dt);
 if(this.undertow){wish.setAll(0);this.vel.x*=.8;this.vel.z*=.8;}
 const speed=this.defense==='Armor'?(sprint?14:7):sprint?27:8;
 if(wish.length()>.01){if(!this.holding&&!this.feeding)this.facing=Math.atan2(wish.x,wish.z);const accel=this.grounded?12:2;this.vel.x=lerp(this.vel.x,wish.x*speed,Math.min(1,dt*accel));this.vel.z=lerp(this.vel.z,wish.z*speed,Math.min(1,dt*accel));}else if(this.grounded){this.vel.x*=Math.pow(.002,dt);this.vel.z*=Math.pow(.002,dt);}
 if(this.gliding&&this.defense!=='Armor'){
 const horizontal=Math.hypot(this.vel.x,this.vel.z);const dive=this.keys.has('ControlLeft');if(dive){this.vel.y=Math.max(-35,this.vel.y-35*dt);const sp=Math.min(48,horizontal+17*dt);this.vel.x=lerp(this.vel.x,Math.sin(this.cameraYaw)*sp,dt*3);this.vel.z=lerp(this.vel.z,Math.cos(this.cameraYaw)*sp,dt*3);}else{const pull=this.keys.has('Space');const drag=pull?12:1.2;const sp=Math.max(12,horizontal-drag*dt);this.vel.x=lerp(this.vel.x,Math.sin(this.cameraYaw)*sp,dt*2);this.vel.z=lerp(this.vel.z,Math.cos(this.cameraYaw)*sp,dt*2);this.vel.y=lerp(this.vel.y,pull&&horizontal>19?8:-3.5,dt*3);}
 }else this.vel.y-=28*dt;
 const delta=this.vel.scale(dt);this.controller.computeColliderMovement(this.collider,delta,undefined,0x00010001);const movement=this.controller.computedMovement();const wallBlocked=Math.hypot(movement.x-delta.x,movement.z-delta.z)>.02;
 if(wallBlocked&&sprint&&wish.length()>.1&&this.defense!=='Armor'){this.vel.y=23;this.gliding=false;this.labelQuiet('WALL RUN');}
 const wasGrounded=this.grounded;this.grounded=this.controller.computedGrounded();this.pos.addInPlace(new Vector3(movement.x,movement.y,movement.z));if(this.grounded){if(this.vel.y<0)this.vel.y=0;this.airDashes=2;this.gliding=false;if(!wasGrounded&&this.slamPending){const force=clamp((this.slamStart-this.pos.y)*1.2+45,45,220);this.area(this.pos.clone(),this.form==='Hammerfists'?8:5,force,this.form==='Hammerfists'?25:17);this.slamPending=false;this.label('IMPACT / '+Math.round(force));}}
 this.pos.x=clamp(this.pos.x,-298,298);this.pos.z=clamp(this.pos.z,-298,298);if(this.pos.y< -5){this.pos.y=1;this.vel.y=0;}this.body.setNextKinematicTranslation({x:this.pos.x,y:this.pos.y+1,z:this.pos.z});
 }
 moveSpecial(dt:number){
 const previous=this.pos.clone(),delta=this.vel.scale(dt);
 // Extend the sweep to the carried victim's torso before moving the player.
 if(this.specials.motion?.kind==='ram'&&this.specials.motion.phase==='rush'){
  const forward=this.forward().scale(1.2),from=this.pos.add(new Vector3(0,1,0));let fraction=1;
  for(const b of this.city.boxes){if(b.active===false)continue;const t=segmentHit(from,delta.add(forward),b,.45);if(t!==null)fraction=Math.min(fraction,Math.max(0,(t*(delta.length()+1.2)-1.2)/Math.max(.001,delta.length())));}
  delta.scaleInPlace(fraction);
 }
 this.controller.computeColliderMovement(this.collider,delta,undefined,0x00010001);const movement=this.controller.computedMovement();this.pos.addInPlace(new Vector3(movement.x,movement.y,movement.z));this.grounded=this.controller.computedGrounded();if(this.grounded&&this.vel.y<0)this.vel.y=0;
 this.body.setNextKinematicTranslation({x:this.pos.x,y:this.pos.y+1,z:this.pos.z});this.specials.afterMovement(previous,dt);
 }
 labelQuiet(s:string){if(this.actionTime<.1){this.actionLabel=s;this.actionTime=.15;}}
 step(dt:number){if(!this.running||this.paused)return;this.fixedSteps++;this.time+=dt;this.cooldown=Math.max(0,this.cooldown-dt);this.attack=Math.max(0,this.attack-dt);this.invuln=Math.max(0,this.invuln-dt);this.messageTime-=dt;this.actionTime-=dt;this.shieldDelay-=dt;this.damageDelay-=dt;if(this.shieldDelay<=0)this.shield=Math.min(100,this.shield+20*dt);if(this.damageDelay<=0)this.health=Math.min(100,this.health+2*dt);this.tickAttackCharge(dt);this.holdCharge+=dt;
 if(this.surf){this.surf.time-=dt;this.vel.x=this.forward().x*22;this.vel.z=this.forward().z*22;this.surf.enemy.pos.copyFrom(this.pos.add(new Vector3(0,.1,.5)));this.surf.enemy.actor.root.rotation.x=Math.PI/2;if(this.surf.time<=0){const e=this.surf.enemy;e.captured=false;e.actor.root.rotation.x=0;this.damageEnemy(e,90,this.forward().scale(12));this.surf=null;}}
 this.specials.beforeMovement(dt);this.tickMovement(dt);if(this.grounded)this.fx.sound.step(Math.hypot(this.vel.x,this.vel.z));this.tickUndertow(dt);
 if(this.holding&&this.specials.motion?.kind!=='ram'){const p=this.pos.add(this.forward().scale(1.15)).add(new Vector3(0,.25,0));if('actor' in this.holding){if(!this.holding.alive)this.holding=null;else {Vector3.LerpToRef(this.holding.pos,p,Math.min(1,dt*18),this.holding.pos);this.holding.actor.root.rotation.y=this.facing+Math.PI;}}else{p.y+=1;this.holding.pos.copyFrom(p);}}
 this.tickEnemies(dt);this.tickMachines(dt);this.tickShots(dt);this.city.physics.step();this.city.sync();this.specials.tickProjectiles(dt);this.specials.updateReactions(dt);this.fx.step(dt);if(!this.undertow&&this.cooldown<=0)this.fx.hideTendrils();this.player.root.position.copyFrom(this.pos);this.player.root.rotation.y=this.facing;this.player.animate(this.time,Math.hypot(this.vel.x,this.vel.z),!this.grounded,this.gliding,this.attack>0?1-this.attack/this.attackDuration:0,this.holding?'hold':this.attackKind,this.defense);
 if(this.feeding){const feed=this.feeding;feed.time+=dt;const t=clamp(feed.time/.55,0,1),end=this.pos.add(new Vector3(0,1.25,0));feed.enemy.actor.root.position.copyFrom(Vector3.Lerp(feed.start,end,t));feed.enemy.actor.root.scaling.setAll(Math.max(.01,1-t)*feed.scale);for(let i=0;i<3;i++)this.fx.tendril(15+i,end.add(new Vector3((i-1)*.22,0,0)),feed.enemy.actor.root.position);if(t>=1){feed.enemy.actor.root.setEnabled(false);this.feeding=null;}}
 if(this.challenge){this.challengeTime+=dt;const r=this.rings[this.ringIndex];if(r&&Vector3.Distance(this.pos.add(new Vector3(0,1,0)),r.position)<5){r.setEnabled(false);this.ringIndex++;this.fx.sound.hit(.7);if(this.ringIndex===this.rings.length){this.challenge=false;this.say('Traversal complete / '+this.challengeTime.toFixed(1)+' seconds');this.score+=1000;try{localStorage.setItem('morph-traversal',String(this.challengeTime));}catch{}}}}
 else this.progress(dt);this.best=Math.max(this.best,this.score);this.just.clear();
 }
 progress(dt:number){if(this.mode==='free')return;const living=this.enemies.filter(e=>e.alive).length;if(living===0&&!this.stagePending){this.stagePending=true;this.stageWait=3;this.label(this.stage===3?'APEX NEUTRALIZED':'SECTOR CLEARED');try{localStorage.setItem('morph-best',String(this.best));}catch{}}
 if(this.stagePending){this.stageWait-=dt;if(this.stageWait<=0){this.enemies.forEach(e=>e.actor.dispose());this.enemies=[];if(this.mode==='practice'){this.spawnWave(20,this.pos.add(this.forward().scale(9)));this.stagePending=false;return;}this.stage++;if(this.stage>3){this.mode='free';this.stagePending=false;this.say('District liberated. Free roam unlocked. B starts the skyline run.');return;}this.nextCenter.set(0,0,[-8,12,95,180][this.stage]);this.say(this.stage===3?'APEX signature detected. Head north.':'Next containment line / head north.');if(this.stage===1){const rival=this.spawnEnemy(this.nextCenter.clone(),'boss');if(rival){rival.hp=rival.maxHp=520;this.openingRival=true;this.fx.impact(this.nextCenter,7,3);this.say('THE OTHER / dodge the red wind-up. Punish the recovery.');}}else{this.openingRival=false;this.spawnWave(this.stage===3?1:16,this.nextCenter);}this.stagePending=false;}}
 if(this.mode==='free'&&this.stage>3)this.stagePending=false;
 }
 makeRings(){const mat=new StandardMaterial('traversal route',this.scene);mat.diffuseColor=Color3.FromHexString('#b8efd6');mat.emissiveColor=new Color3(.3,.8,.55);for(const p of [[0,8,-5],[0,20,30],[0,32,80],[0,20,130],[0,12,180],[0,6,240]]){const m=MeshBuilder.CreateTorus('route ring',{diameter:8,thickness:.14,tessellation:48},this.scene);m.position.set(...p as [number,number,number]);m.rotation.x=Math.PI/2;m.material=mat;m.setEnabled(false);this.rings.push(m);}}
 beginChallenge(){if(this.challenge)return;this.specials.reset();if(this.undertow){for(const v of this.undertow.victims){v.enemy.captured=false;v.enemy.pos.y=v.ground;}this.undertow=null;this.fx.hideTendrils();}if(this.holding){if('actor' in this.holding)this.holding.captured=false;else this.city.launch(this.holding,Vector3.Zero());this.holding=null;}if(this.surf){this.surf.enemy.captured=false;this.surf.enemy.actor.root.rotation.x=0;this.surf=null;}this.vehicle=null;this.player.root.setEnabled(true);this.gliding=false;this.slamPending=false;this.charging=false;this.jumpCharge=0;this.cooldown=0;this.attack=0;this.challenge=true;this.ringIndex=0;this.challengeTime=0;this.rings.forEach(r=>r.setEnabled(true));this.pos.set(0,1,-28);this.body.setTranslation({x:0,y:2,z:-28},true);this.body.setNextKinematicTranslation({x:0,y:2,z:-28});this.vel.setAll(0);this.defense='None';this.say('SKYLINE RUN / follow the rings. Charge jump, glide, dive and pull up.');}
 signaturePractice(form:Form){
 this.reset('practice',false);this.mode='free';this.benchmarkHold=true;this.invuln=3600;this.selectForm(form);this.cameraYaw=0;this.facing=0;
 for(let i=0;i<20;i++){const e=this.spawnEnemy(this.pos.add(new Vector3((i%4-1.5)*1.25,0,2.4+Math.floor(i/4)*2.1)),'grunt');if(e)e.hp=e.maxHp=250;}
 const car=this.city.props.find(p=>p.kind==='car');if(car){this.city.detach(car);car.pos.copyFrom(this.pos.add(new Vector3(3,1,8)));this.city.launch(car,Vector3.Zero());}
 if(form==='Unarmed'){const victim=this.enemies[0];victim.pos.copyFrom(this.pos.add(new Vector3(0,0,1.7)));this.grab();}
 this.say(form==='Unarmed'?'BATTERING RAM / Right click to rush. Left click throws early. C releases.':'Hold left click for one second, or right click. Switch forms to combine attacks.');
 }
 benchmark(){this.reset('practice',false);this.enemies.forEach(e=>e.actor.dispose());this.enemies=[];for(let i=0;i<20;i++){const a=(i/19-.5)*1.7,r=5+(i%3)*1.6;this.spawnEnemy(this.pos.add(new Vector3(Math.sin(a)*r,0,Math.cos(a)*r)),'grunt');}this.selectForm('Whipfist');this.biomass=3;this.invuln=60;this.benchmarkHold=true;this.cameraYaw=0;this.facing=0;this.say('20-target test ready. Hold left click to full charge, right click, or R for Undertow.');}
 dispose(){this.controller.free();this.enemies.forEach(e=>e.actor.dispose());this.player.dispose();this.fx.reset();this.city.physics.free();}
}
