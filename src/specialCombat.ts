import {Vector3} from '@babylonjs/core';
import type {Game,Enemy} from './game';
import type {Prop} from './world';
import {clamp,floorAt,liftHeight,segmentHit,visible,inCone,Form,Bounds} from './rules';
import {SPECIALS,SpecialKind,ImpactIdentity,groundPath,segmentDistance,aftershockPower} from './specialRules';
export type ReactionKind='launch'|'fold'|'recoil'|'land'|'resist'|'carried';
type Motion={kind:SpecialKind;event:ImpactIdentity;phase:'windup'|'rise'|'apex'|'dive'|'rush'|'recover';time:number;age:number;origin:Vector3;yaw:number;startYaw:number;height:number;moved:number;air:boolean;victim?:Enemy;hits:Set<number>};
type Wave={kind:'faultline'|'aftershock';event:ImpactIdentity;paths:Vector3[][];boxes:Bounds[];time:number;travel:number;range:number;damage:number;hits:Set<number>;props:Set<number>;lastStep:number};
type Projectile={source:Enemy|Prop;event:ImpactIdentity;previous:Vector3;life:number;factor:number};
export class SpecialCombat{
 motion:Motion|null=null;waves:Wave[]=[];projectiles:Projectile[]=[];serial=0;
 readyAt:Record<SpecialKind,number>={faultline:0,guillotine:0,aftershock:0,ram:0};
 stats={faultline:0,guillotine:0,aftershock:0,ram:0,hits:0,collateral:0};
 constructor(public game:Game){}
 identity(form:string):ImpactIdentity{return {id:++this.serial,owner:'player',form,collateralHits:new Set()};}
 get currentKind():SpecialKind|null{const g=this.game;return g.form==='Claws'?'faultline':g.form==='Blade'?'guillotine':g.form==='Hammerfists'?'aftershock':g.form==='Unarmed'&&g.holding&&'actor'in g.holding?'ram':null;}
 get cooldown(){return this.currentKind?Math.max(0,this.readyAt[this.currentKind]-this.game.time):0;}
 get title(){return this.currentKind?SPECIALS[this.currentKind].name:this.game.form==='Whipfist'?'UNDERTOW':this.game.holding?'PUMMEL':'UPPERCUT';}
 get canCancel(){return this.motion?.kind==='guillotine'&&this.motion.phase==='apex';}
 get ownsMovement(){return this.motion!==null;}
 reset(){this.cancel();this.game.fx.signature.reset();for(const e of this.game.enemies){e.reaction=undefined;e.actor.signaturePose=null;}this.waves=[];this.projectiles=[];this.readyAt={faultline:0,guillotine:0,aftershock:0,ram:0};this.stats={faultline:0,guillotine:0,aftershock:0,ram:0,hits:0,collateral:0};}
 cancel(){const g=this.game,m=this.motion;if(m?.victim){m.victim.captured=false;m.victim.stagger=.6;m.victim.actor.signaturePose=null;g.holding=null;}this.motion=null;g.player.signaturePose=null;g.slamPending=false;g.cancelCharge();g.cooldown=0;g.attack=0;}
 start(kind:SpecialKind){
  const g=this.game;if(this.motion||g.time<this.readyAt[kind]){g.say(SPECIALS[kind].name+' recharging');return false;}
  if(kind==='ram'&&(!g.grounded||!g.holding||!('actor'in g.holding)||!g.holding.alive))return false;
  const victim=kind==='ram'?g.holding as Enemy:undefined;if(victim&&(victim.kind==='boss'||victim.kind==='brute'&&victim.stagger<=0)){g.say('Stagger armored enemies before rushing.');return false;}
  g.cancelCharge();g.gliding=false;g.slamPending=false;g.facing=g.aim();g.vel.setAll(0);
  this.readyAt[kind]=g.time+SPECIALS[kind].reuse;this.stats[kind]++;
  const air=!g.grounded;this.motion={kind,event:this.identity(g.form),phase:air&&(kind==='guillotine'||kind==='aftershock')?'dive':'windup',time:0,age:0,origin:g.pos.clone(),yaw:g.facing,startYaw:g.facing,height:0,moved:0,air,victim,hits:new Set()};
  g.cooldown=.05;g.attackKind=kind;g.attack=g.attackDuration=1.2;g.label(SPECIALS[kind].name);g.fx.signature.sound(kind,'windup');return true;
 }
 solidBoxes(){const movable=new Set(this.game.city.props.filter(p=>['car','barrier'].includes(p.kind)).map(p=>p.box));return this.game.city.boxes.filter(b=>b.active!==false&&!movable.has(b));}
 spawnWave(kind:'faultline'|'aftershock',event:ImpactIdentity,origin:Vector3,yaw:number,fall=0){
  const g=this.game,boxes=this.solidBoxes().filter(b=>b.min.x<origin.x+20&&b.max.x>origin.x-20&&b.min.z<origin.z+20&&b.max.z>origin.z-20),power=kind==='aftershock'?aftershockPower(fall):{damage:40,range:16};
  const base=origin.clone();base.y=floorAt(base.add(new Vector3(0,.65,0)),boxes);
  const paths:Vector3[][]=[];
  for(let lane=0;lane<(kind==='faultline'?3:9);lane++){
   const a=kind==='aftershock'?yaw+(lane/8-.5)*SPECIALS.aftershock.arc:yaw;
   const p=base.add(kind==='faultline'?new Vector3(Math.cos(yaw)*(lane-1)*1.1,0,-Math.sin(yaw)*(lane-1)*1.1):Vector3.Zero());
   p.y=floorAt(p.add(new Vector3(0,.65,0)),boxes);if(Math.abs(p.y-base.y)>.65)continue;
   paths.push(groundPath(p,a,power.range,boxes));
  }
  this.waves.push({kind,event,paths,boxes,time:0,travel:kind==='faultline'?.65:.7,range:power.range,damage:power.damage,hits:new Set(),props:new Set(),lastStep:-1});
  g.fx.signature.sound(kind,'impact');g.fx.impact(base,kind==='faultline'?1.8:4,kind==='faultline'?1.2:3);
 }
 hit(e:Enemy,damage:number,force:Vector3,kind:ReactionKind,event:ImpactIdentity,cut=false){
  const g=this.game,resist=e.kind==='boss'||e.kind==='brute'&&e.stagger<=0;
  if(resist){force=Vector3.Zero();kind='resist';}
  g.damageEnemy(e,damage,force,cut,event);e.attack=0;e.reaction={kind,time:0,duration:kind==='launch'?1.4:kind==='fold'?1.1:.45};
  if(!resist)e.stagger=Math.max(e.stagger,kind==='launch'?1.3:.8);this.stats.hits++;
 }
 beforeMovement(dt:number){
  const g=this.game;this.tickWaves(dt);const m=this.motion;if(!m)return;
  if(g.dead){this.cancel();return;}m.time+=dt;m.age+=dt;g.facing=m.yaw;g.cooldown=Math.max(g.cooldown,.04);g.attack=Math.max(g.attack,.05);
  const kind=m.kind;g.player.signaturePose={kind,phase:m.phase,time:m.time};
  if(kind==='faultline'||kind==='aftershock'&&m.phase!=='dive'){
   g.vel.set(0,-1,0);const windup=SPECIALS[kind].windup;
   if(m.phase==='windup'&&m.time>=windup){this.spawnWave(kind,m.event,g.pos,m.yaw);m.phase='recover';m.time=0;}
   if(m.age>=SPECIALS[kind].release){this.motion=null;g.cooldown=0;g.attack=0;g.player.signaturePose=null;}return;
  }
  if(kind==='guillotine'){
   if(m.phase==='windup'){
    g.vel.set(0,-1,0);if(m.time>=.18){
     for(const e of g.enemies)if(e.alive&&!e.captured&&inCone(g.pos,m.yaw,e.pos,3,2)&&g.line(e.pos))this.hit(e,20,new Vector3(0,17,0),'launch',m.event,true);
     m.height=liftHeight(g.pos.add(new Vector3(0,2.1,0)),g.city.boxes,5);m.phase='rise';m.time=0;g.grounded=false;g.fx.signature.sound(kind,'rise');
    }
   }else if(m.phase==='rise'){
    const remaining=m.origin.y+m.height-g.pos.y;g.vel.set(0,Math.max(0,Math.min(22,remaining/dt)),0);
    if(remaining<.08||m.time>=.3){m.phase='apex';m.time=0;g.vel.setAll(0);g.label('GUILLOTINE / DASH OR SWITCH TO CANCEL');}
   }else if(m.phase==='apex'){
    const f=g.moveStick?-g.moveStick.y:(g.keys.has('KeyW')?1:0)-(g.keys.has('KeyS')?1:0),s=g.moveStick?g.moveStick.x:(g.keys.has('KeyD')?1:0)-(g.keys.has('KeyA')?1:0);
    const wish=new Vector3(Math.sin(g.cameraYaw)*f+Math.cos(g.cameraYaw)*s,0,Math.cos(g.cameraYaw)*f-Math.sin(g.cameraYaw)*s);
    if(wish.length()>1)wish.normalize();g.vel.copyFrom(wish.scale(Math.min(24,Math.max(0,6-m.moved)/dt)));m.moved+=g.vel.length()*dt;
    if(m.time>=.25){m.phase='dive';m.time=0;m.yaw=g.aim();g.fx.signature.sound(kind,'drop');}
   }else if(m.phase==='dive'){
    const turn=Math.atan2(Math.sin(g.aim()-m.yaw),Math.cos(g.aim()-m.yaw));m.yaw+=clamp(turn,-dt*.9,dt*.9);g.vel.set(Math.sin(m.yaw)*8,-42,Math.cos(m.yaw)*8);g.gliding=false;
    g.fx.signature.trail(g.pos.add(new Vector3(0,1.5,0)),m.yaw);
    // Cut along the swept body path while descending; landing extends the same hit set.
    const blade=g.pos.add(new Vector3(Math.sin(m.yaw)*1.5,1.4,Math.cos(m.yaw)*1.5)),next=blade.add(g.vel.scale(dt));for(const e of g.enemies)if(e.alive&&!e.captured&&!m.hits.has(e.id)&&segmentDistance(e.pos.add(new Vector3(0,1,0)),blade,next)<1.5&&g.line(e.pos)){m.hits.add(e.id);this.hit(e,90,new Vector3(Math.sin(m.yaw)*10,-6,Math.cos(m.yaw)*10),'fold',m.event,true);}
   }else{g.vel.set(0,-1,0);if(m.time>=.2)this.finishRecovery();}
  }else if(kind==='aftershock'){g.vel.set(g.vel.x*.97,-42,g.vel.z*.97);g.gliding=false;}
  else if(kind==='ram'){
   if(!m.victim?.alive){this.cancel();return;}
   if(m.phase==='windup'){g.vel.set(0,-1,0);if(m.time>=.15){m.phase='rush';m.time=0;g.fx.signature.sound('ram','rush');}}
   else if(m.phase==='rush'){
    const target=clamp(Math.atan2(Math.sin(g.aim()-m.startYaw),Math.cos(g.aim()-m.startYaw)),-Math.PI/4,Math.PI/4);
    const wanted=m.startYaw+target; m.yaw+=clamp(Math.atan2(Math.sin(wanted-m.yaw),Math.cos(wanted-m.yaw)),-dt*2,dt*2);g.facing=m.yaw;
    g.vel.set(Math.sin(m.yaw)*18,-1,Math.cos(m.yaw)*18);if(m.time>=.6){this.finishRam(false);return;}
   }
   if(this.motion){m.victim.actor.signaturePose={kind:'carried',phase:m.phase,time:m.time};g.fx.signature.rush(g.pos,m.yaw,m.time);}
  }
 }
 finishRecovery(){this.motion=null;this.game.cooldown=0;this.game.attack=0;this.game.player.signaturePose=null;}
 afterMovement(previous:Vector3,dt:number){
  const g=this.game,m=this.motion;if(!m)return;
  if(m.kind==='guillotine'&&m.phase==='rise'&&m.time>.025&&g.pos.y-previous.y<.01){m.phase='apex';m.time=0;g.vel.y=0;}
  if(m.kind==='ram'){
   const dir=new Vector3(Math.sin(m.yaw),0,Math.cos(m.yaw)),front=g.pos.add(dir.scale(1.15));
   if(m.victim){m.victim.pos.copyFrom(front);m.victim.actor.root.position.copyFrom(front);m.victim.actor.root.rotation.y=m.yaw+Math.PI;}
   if(m.phase==='rush'&&Math.hypot(g.vel.x,g.vel.z)>1){
    for(const e of g.enemies)if(e!==m.victim&&e.alive&&!e.captured&&!m.hits.has(e.id)&&segmentDistance(e.pos,previous,front)<1.4&&g.line(e.pos)){m.hits.add(e.id);this.hit(e,45,dir.scale(12).add(new Vector3(0,4,0)),'recoil',m.event);g.fx.signature.sound('ram','contact');}
    const hit=g.city.boxes.some(b=>b.active!==false&&segmentHit(previous.add(new Vector3(0,1,0)),front.subtract(previous),b,.45)!==null);
    if(hit||Vector3.DistanceSquared(previous,g.pos)<dt*dt*30){this.finishRam(true);return;}
    const ground=floorAt(front.add(new Vector3(0,.6,0)),g.city.boxes);if(g.pos.y-ground>.7)this.finishRam(false);
   }
  }
  if(m.phase==='dive'&&g.grounded){
   if(m.kind==='aftershock'){
    this.spawnWave('aftershock',m.event,g.pos,m.yaw,Math.max(0,m.origin.y-g.pos.y));m.phase='recover';m.time=0;m.age=.3;m.air=false;
   }else if(m.kind==='guillotine'){
    const from=g.pos.clone(),to=from.add(new Vector3(Math.sin(m.yaw)*8,0,Math.cos(m.yaw)*8));
    for(const e of g.enemies)if(e.alive&&!e.captured&&!m.hits.has(e.id)&&segmentDistance(e.pos,from,to)<1.5&&g.line(e.pos)){m.hits.add(e.id);this.hit(e,90,new Vector3(Math.sin(m.yaw)*12,3,Math.cos(m.yaw)*12),'fold',m.event,true);}
    for(let i=0;i<=8;i+=2){const p=Vector3.Lerp(from,to,i/8);if(!visible(from.add(new Vector3(0,.5,0)),p.add(new Vector3(0,.5,0)),g.city.boxes))break;const floor=floorAt(p.add(new Vector3(0,.6,0)),g.city.boxes);if(Math.abs(floor-from.y)>.65)break;p.y=floor;g.fx.signature.incision(p,m.yaw);g.damageProps(p,1.5,90);}
    g.fx.impact(from,2.5,2);g.fx.signature.sound('guillotine','impact');m.phase='recover';m.time=0;
   }
  }
 }
 finishRam(wall:boolean,release=false){
  const g=this.game,m=this.motion;if(!m||m.kind!=='ram')return;const e=m.victim!;e.captured=false;e.actor.signaturePose=null;g.holding=null;
  const dir=new Vector3(Math.sin(m.yaw),0,Math.cos(m.yaw));
  if(!release){this.hit(e,65+(wall?35:0),wall?new Vector3(0,3,0):dir.scale(27).add(new Vector3(0,7,0)),wall?'fold':'launch',m.event);if(!wall)this.track(e,m.event,3);g.fx.signature.sound('ram',wall?'wall':'throw');if(wall)g.fx.impact(e.pos,2,2,false);}
  else{e.vel.copyFrom(dir.scale(2));e.stagger=.7;}
  this.motion=null;g.player.signaturePose=null;g.cancelCharge();g.cooldown=release?0:.2;g.attack=0;g.vel.scaleInPlace(.25);
 }
 tickWaves(dt:number){
  const g=this.game;for(const w of this.waves){
   const before=w.time/w.travel;w.time+=dt;const progress=Math.min(1,w.time/w.travel),distance=progress*w.range,prevDistance=before*w.range;
   for(const path of w.paths){
    for(let i=1;i<path.length;i++){
     const d=i*.8;if(d<=prevDistance||d>distance)continue;const p=path[i];const support=floorAt(p.add(new Vector3(0,.65,0)),w.boxes);if(Math.abs(support-p.y)>.65){path.length=i;break;}
     if(i%2===0)g.fx.signature.wave(w.kind,p,w.event.id+i,w.kind==='faultline'?1.6:1.2);
     if(i%5===0){g.fx.dust(p,1,1.1,1);g.fx.signature.sound(w.kind,'travel');}
     for(const e of g.enemies)if(e.alive&&!e.captured&&!w.hits.has(e.id)&&Math.abs(e.pos.y-p.y)<2.6&&segmentDistance(e.pos,path[i-1],p)<(w.kind==='faultline'?1:1.5)&&visible(p.add(new Vector3(0,.8,0)),e.pos.add(new Vector3(0,1,0)),g.city.boxes)){
      w.hits.add(e.id);const push=e.pos.subtract(w.paths[0][0]);push.y=0;push.normalize().scaleInPlace(w.kind==='faultline'?2:14);push.y=w.kind==='faultline'?17:6;
      this.hit(e,w.damage,push,w.kind==='faultline'?'launch':'fold',w.event,w.kind==='faultline');
     }
     for(const prop of g.city.props)if(prop.alive&&!w.props.has(prop.id)&&prop!==g.holding&&prop!==g.vehicle&&Vector3.Distance(prop.pos,p)<prop.size.length()*.35+1.2){
      if(['tank','aircraft','rifle','launcher'].includes(prop.kind))continue;w.props.add(prop.id);
      if(w.kind==='aftershock'&&['car','barrier'].includes(prop.kind)){
       const dir=prop.pos.subtract(w.paths[0][0]);dir.y=0;dir.normalize().scaleInPlace(12);dir.y=9;g.city.launch(prop,dir);prop.body?.setAngvel({x:3.5,y:1,z:2.5},true);this.track(prop,w.event,3);g.fx.signature.sound('aftershock','metal');
      }else if(!['car','barrier'].includes(prop.kind))g.damageProps(prop.pos,.6,w.damage);
     }
    }
   }
  }
  this.waves=this.waves.filter(w=>w.time<w.travel);
 }
 track(source:Enemy|Prop,event=this.identity(this.game.form),factor=this.game.form==='Hammerfists'?5:3){
  this.projectiles=this.projectiles.filter(p=>p.source!==source);this.projectiles.push({source,event,previous:source.pos.clone(),life:3,factor});
 }
 tickProjectiles(dt:number){
  const g=this.game;
  for(const p of this.projectiles){
   p.life-=dt;const source=p.source,velocity='actor'in source?source.vel:source.velocity;
   if('actor'in source?source.captured||!source.alive&&source.deadTime<=0:!source.alive){p.life=0;continue;}
   const a=p.previous.clone(),b=source.pos.clone();if('actor'in source){a.y+=1;b.y+=1;}
   // Clip against the nearest obstruction, so a fast projectile cannot damage through cover.
   let fraction=1;for(const box of g.city.boxes){if(box.active===false||!('actor'in source)&&box===source.box)continue;const t=segmentHit(a,b.subtract(a),box,.12);if(t!==null)fraction=Math.min(fraction,t);}
   const end=Vector3.Lerp(a,b,fraction),radius='actor'in source?.8:Math.min(2.8,source.size.length()*.35);
   if(velocity.length()>4)for(const e of g.enemies)if(e!==source&&e.alive&&!e.captured&&!p.event.collateralHits.has(e.id)&&segmentDistance(e.pos.add(new Vector3(0,1,0)),a,end)<radius+.6&&visible(a,e.pos.add(new Vector3(0,1,0)),g.city.boxes)){
    p.event.collateralHits.add(e.id);this.hit(e,Math.min(60,velocity.length()*p.factor),velocity.scale(.35),'recoil',p.event);this.stats.collateral++;
   }
   p.previous.copyFrom(source.pos);if(fraction<1)p.life=0;
  }
  this.projectiles=this.projectiles.filter(p=>p.life>0);
 }
 updateReactions(dt:number){for(const e of this.game.enemies){const r=e.reaction;if(!r)continue;r.time+=dt;if(r.kind==='launch'&&r.time>.4&&e.pos.y-floorAt(e.pos.add(new Vector3(0,.4,0)),this.game.city.boxes)<.15){r.kind='land';r.time=0;r.duration=.35;}if(r.time>=r.duration){e.reaction=undefined;e.actor.signaturePose=null;}else if(e.alive&&!e.captured)e.actor.signaturePose={kind:r.kind,phase:'reaction',time:r.time};}}
}
