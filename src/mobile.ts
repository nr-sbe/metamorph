import {touchVector,TouchCommands} from './touchInput';
import './mobile.css';

export const prefersTouch=matchMedia('(pointer: coarse)').matches||new URLSearchParams(location.search).get('touch')==='1';
type Hooks={active:()=>boolean;press:(code:string)=>void;release:(code:string,cancelled:boolean)=>void;look:(x:number,y:number)=>void;resize:()=>void;wake:()=>void};
export class MobileControls {
 enabled=prefersTouch;
 movement:{x:number;y:number}|null=null;
 private moveId:number|null=null;private lookId:number|null=null;
 private origin={x:0,y:0};private lastLook={x:0,y:0};private active=false;
 private commands:TouchCommands;
 private controls:HTMLElement;private nub:HTMLElement;private sprint:HTMLButtonElement;
 private sprinting=false;
 constructor(private canvas:HTMLCanvasElement,private hooks:Hooks){
  document.documentElement.classList.toggle('touch-mode',this.enabled);
  const host=document.createElement('div');host.id='mobile-ui';
  host.innerHTML=`<div class="display-tools"><button id="touch-toggle" aria-pressed="${this.enabled}">TOUCH ${this.enabled?'ON':'OFF'}</button><button id="fullscreen-toggle">⛶ FULLSCREEN</button></div>
   <div id="mobile-notice" class="hidden" role="status"><span></span><button aria-label="Dismiss fullscreen instructions">×</button></div>
   <div id="touch-controls" class="hidden" aria-label="Touch game controls">
    <div id="move-pad" role="group" aria-label="Movement joystick"><span class="stick-ring"></span><span id="move-nub"></span><b>MOVE</b></div>
    <button id="touch-sprint" aria-pressed="false">SPRINT</button><span class="look-guide">DRAG CITY TO LOOK</span>
    <div class="touch-actions">${[
     ['Mouse0','STRIKE','attack'],['Mouse2','SPECIAL','special'],['Space','JUMP','jump'],
     ['KeyF','GRAB',''],['KeyE','CONSUME',''],['KeyC','DODGE',''],
     ['Block','SHIELD',''],['KeyR','MASS',''],['ControlLeft','DIVE',''],
     ['KeyV','ANCHOR',''],['KeyX','ARMOR',''],['KeyT','TARGET','']
    ].map(([code,label,style])=>`<button data-touch-command="${code}" class="${style}" aria-label="${label}" aria-pressed="false">${label}</button>`).join('')}</div>
   </div>`;
  document.getElementById('app')!.append(host);
  this.controls=host.querySelector('#touch-controls')!;this.nub=host.querySelector('#move-nub')!;this.sprint=host.querySelector('#touch-sprint')!;
  this.commands=new TouchCommands(code=>hooks.press(code),(code,cancelled)=>hooks.release(code,cancelled));
  host.querySelector<HTMLButtonElement>('#touch-toggle')!.onclick=()=>{this.clear();this.enabled=!this.enabled;document.documentElement.classList.toggle('touch-mode',this.enabled);const b=host.querySelector('#touch-toggle')!;b.textContent='TOUCH '+(this.enabled?'ON':'OFF');b.setAttribute('aria-pressed',String(this.enabled));hooks.resize();};
  const fullscreen=host.querySelector<HTMLButtonElement>('#fullscreen-toggle')!;
  fullscreen.onclick=()=>void this.fullscreen();
  document.addEventListener('fullscreenchange',()=>{fullscreen.textContent=document.fullscreenElement?'⛶ EXIT FULLSCREEN':'⛶ FULLSCREEN';hooks.resize();});
  host.querySelector<HTMLButtonElement>('#mobile-notice button')!.onclick=()=>host.querySelector('#mobile-notice')!.classList.add('hidden');
  this.sprint.onclick=()=>{if(!hooks.active())return;this.sprinting=!this.sprinting;this.sprint.setAttribute('aria-pressed',String(this.sprinting));if(this.sprinting)hooks.press('ShiftLeft');else hooks.release('ShiftLeft',false);hooks.wake();};
  for(const button of host.querySelectorAll<HTMLButtonElement>('[data-touch-command]')){
   button.addEventListener('pointerdown',e=>{if(!hooks.active()||!this.enabled)return;e.preventDefault();e.stopPropagation();button.setPointerCapture(e.pointerId);hooks.wake();button.setAttribute('aria-pressed','true');this.commands.start(e.pointerId,button.dataset.touchCommand!);});
   const end=(e:PointerEvent)=>{e.preventDefault();e.stopPropagation();this.commands.end(e.pointerId,e.type!=='pointerup');button.setAttribute('aria-pressed','false');};
   button.addEventListener('pointerup',end);button.addEventListener('pointercancel',end);button.addEventListener('lostpointercapture',end);
  }
  const pad=host.querySelector<HTMLElement>('#move-pad')!;
  pad.addEventListener('pointerdown',e=>{if(!hooks.active()||this.moveId!==null)return;e.preventDefault();pad.setPointerCapture(e.pointerId);hooks.wake();this.moveId=e.pointerId;const box=pad.getBoundingClientRect();this.origin={x:box.left+box.width/2,y:box.top+box.height/2};this.move(e);});
  pad.addEventListener('pointermove',e=>{if(e.pointerId===this.moveId){e.preventDefault();this.move(e);}});
  const stopMove=(e:PointerEvent)=>{if(e.pointerId!==this.moveId)return;this.moveId=null;this.movement=null;this.nub.style.transform='translate(-50%,-50%)';};
  pad.addEventListener('pointerup',stopMove);pad.addEventListener('pointercancel',stopMove);pad.addEventListener('lostpointercapture',stopMove);
  canvas.addEventListener('pointerdown',e=>{if(e.pointerType!=='touch'||!this.enabled||!hooks.active()||this.lookId!==null)return;e.preventDefault();canvas.setPointerCapture(e.pointerId);this.lookId=e.pointerId;this.lastLook={x:e.clientX,y:e.clientY};hooks.wake();});
  canvas.addEventListener('pointermove',e=>{if(e.pointerId!==this.lookId||!hooks.active())return;e.preventDefault();hooks.look((e.clientX-this.lastLook.x)*.004,(e.clientY-this.lastLook.y)*.003);this.lastLook={x:e.clientX,y:e.clientY};});
  const stopLook=(e:PointerEvent)=>{if(e.pointerId===this.lookId)this.lookId=null;};
  canvas.addEventListener('pointerup',stopLook);canvas.addEventListener('pointercancel',stopLook);canvas.addEventListener('lostpointercapture',stopLook);
  this.controls.addEventListener('contextmenu',e=>e.preventDefault());
  window.addEventListener('blur',()=>this.clear());document.addEventListener('visibilitychange',()=>{if(document.hidden)this.clear();});
  window.addEventListener('resize',()=>this.clear());window.visualViewport?.addEventListener('resize',()=>hooks.resize());
 }
 private move(e:PointerEvent){const v=touchVector(e.clientX-this.origin.x,e.clientY-this.origin.y);this.movement=v;this.nub.style.transform=`translate(calc(-50% + ${v.x*40}px),calc(-50% + ${v.y*40}px))`;}
 clear(){this.commands.clear();this.moveId=this.lookId=null;this.movement=null;this.nub.style.transform='translate(-50%,-50%)';if(this.sprinting)this.hooks.release('ShiftLeft',true);this.sprinting=false;this.sprint.setAttribute('aria-pressed','false');for(const b of this.controls.querySelectorAll('[aria-pressed]'))b.setAttribute('aria-pressed','false');}
 update(){document.documentElement.classList.toggle('game-session',!document.getElementById('hud')!.classList.contains('hidden'));const active=this.enabled&&this.hooks.active();if(this.active&&!active)this.clear();this.active=active;this.controls.classList.toggle('hidden',!active);}
 private async fullscreen(){
  this.clear();this.hooks.wake();
  if(document.fullscreenElement){await document.exitFullscreen();return;}
  const installed=matchMedia('(display-mode: standalone)').matches||matchMedia('(display-mode: fullscreen)').matches||(navigator as Navigator&{standalone?:boolean}).standalone;
  if(installed){this.notice('Already running without browser bars. Rotate your phone for the widest view.');return;}
  try{
   if(!document.documentElement.requestFullscreen)throw new Error('unsupported');
   await document.documentElement.requestFullscreen();
   try{await (screen.orientation as ScreenOrientation&{lock?:(value:string)=>Promise<void>}).lock?.('landscape');}catch{}
   this.hooks.resize();
  }catch{this.notice('For a full-screen mobile launch: on iPhone, open in Safari, tap Share → Add to Home Screen, then launch Metamorph from its icon. On Android, use your browser menu → Add to Home screen.');}
 }
 private notice(text:string){const notice=document.getElementById('mobile-notice')!;notice.querySelector('span')!.textContent=text;notice.classList.remove('hidden');}
}
