import {Matrix,Vector3,type Scene,type UniversalCamera} from '@babylonjs/core';
import type {Game} from './game';

export class ThreatHud {
 markers:HTMLDivElement[]=[];hit:HTMLDivElement;grab:HTMLDivElement;
 constructor(parent:HTMLElement){
  for(let i=0;i<6;i++){const m=document.createElement('div');m.className='threat-marker hidden';m.innerHTML='<i></i><b></b><span></span>';parent.append(m);this.markers.push(m);}
  this.hit=document.createElement('div');this.hit.className='damage-origin hidden';this.hit.innerHTML='<i>▲</i><b></b><span></span>';parent.append(this.hit);
  this.grab=document.createElement('div');this.grab.className='grab-prompt hidden';parent.append(this.grab);
 }
 place(el:HTMLElement,p:Vector3,game:Game,scene:Scene,camera:UniversalCamera){
  const engine=scene.getEngine(),w=engine.getRenderWidth(),h=engine.getRenderHeight();
  const point=Vector3.Project(p,Matrix.Identity(),scene.getTransformMatrix(),camera.viewport.toGlobal(w,h));
  const delta=p.subtract(game.pos),angle=Math.atan2(delta.x,delta.z)-game.cameraYaw;
  const onScreen=point.z>0&&point.z<1&&point.x>w*.08&&point.x<w*.92&&point.y>h*.19&&point.y<h*.75;
  const x=onScreen?point.x/w*100:50+Math.sin(angle)*41,y=onScreen?point.y/h*100:47-Math.cos(angle)*27;
  el.style.left=x+'%';el.style.top=y+'%';el.classList.toggle('offscreen',!onScreen);
  el.style.setProperty('--direction',angle+'rad');
 }
 update(game:Game,scene:Scene,camera:UniversalCamera,gamepad:boolean){
  const threats=game.incomingThreats();
  this.markers.forEach((m,i)=>{
   const t=threats[i];m.classList.toggle('hidden',!t);if(!t)return;
   this.place(m,t.source.add(new Vector3(0,2.65,0)),game,scene,camera);
   m.classList.toggle('unblockable',t.unblockable);m.classList.toggle('imminent',t.remaining<.22);
   m.style.setProperty('--windup',Math.max(0,Math.min(1,1-t.remaining/t.duration))*360+'deg');
   m.querySelector('b')!.textContent=t.label+' · '+Math.round(Vector3.Distance(t.source,game.pos))+'m';
   m.querySelector('span')!.textContent=t.unblockable?(gamepad?'B EVADE':'C EVADE'):(gamepad?'LB BLOCK / B EVADE':'Q BLOCK / C EVADE');
  });
  const hit=game.lastDamage,active=hit&&game.time-hit.time<1.15;
  this.hit.classList.toggle('hidden',!active);
  if(active){const angle=Math.atan2(hit.source.x-game.pos.x,hit.source.z-game.pos.z)-game.cameraYaw;this.hit.style.setProperty('--direction',angle+'rad');this.hit.classList.toggle('blocked',hit.kind==='BLOCKED');this.hit.querySelector('b')!.textContent=hit.kind==='BLOCKED'?'BLOCKED':hit.kind==='CRITICAL MASS'?'MASS ABSORBED HIT':hit.kind==='SHIELD BROKEN'?'SHIELD BROKEN':'HIT RECEIVED';this.hit.querySelector('span')!.textContent=hit.label+' · '+Math.round(Vector3.Distance(hit.source,game.pos))+'m';}
  const held=game.holding&&'actor' in game.holding?game.holding:null,candidate=held??game.grabCandidate();
  this.grab.classList.toggle('hidden',!candidate||!!game.feeding||game.wheel||game.cooldown>0);
  if(candidate){this.place(this.grab,candidate.pos.add(new Vector3(0,2.2,0)),game,scene,camera);this.grab.textContent=held?(gamepad?'X CONSUME':'E CONSUME'):(gamepad?'Y GRAB':'F GRAB')+' · '+Math.round(Vector3.Distance(candidate.pos,game.pos))+'m';}
 }
}
