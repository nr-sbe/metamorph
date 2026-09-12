import './style.css';
import {shellMarkup} from './uiLayout';
import {formRoles} from './uiIcons';
import {keyboardCommand,mouseCommand,stick,padCommands} from './input';
import {ThreatHud} from './threatHud';
let threatHud:ThreatHud;let gamepadActive=false;
Object.assign(Error,{stackTraceLimit:40});

import {Engine,WebGPUEngine,Scene,Color4,Color3,Vector3,HemisphericLight,DirectionalLight,ShadowGenerator,UniversalCamera,MeshBuilder,StandardMaterial,DefaultRenderingPipeline,ImageProcessingConfiguration,Matrix,HDRCubeTexture,CascadedShadowGenerator,SSAO2RenderingPipeline} from '@babylonjs/core';

import RAPIER from '@dimforge/rapier3d-compat/rapier.es.js';

import {prepareScannedProps} from './scannedProps';
import {prepareCharacters} from './characters';
import {RenderPose,FollowCamera,damping} from './cameraRig';
const renderPose=new RenderPose(),followCamera=new FollowCamera();let cameraFraction=1;let frameSamples:number[]=[];let sampleClock=0;let sampleForm='';let frameReport='';

import {City} from './world';import {Effects} from './fx';import {Game} from './game';import {FORMS,clamp,segmentHit} from './rules';

const el=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T;



const controls=[['Move / look','W A S D / mouse'],['Sprint / wall run','Shift + move'],['Charged jump','Hold Space → release'],['Glide / pull up','Space in air / hold Space'],['Dive / air dash','Ctrl / C in air'],['Strike / auto special','Tap LMB / hold 1 second'],['Secondary / aerial slam','Right click'],['Grab / throw','F / left click'],['Body surf','In air: Shift + F'],['Consume / pickup / hijack','E'],['Undertow','Whipfist + right click (or R)'],['Devastator / Undertow shortcut','R'],['Offensive form / wheel','1–5 / hold Tab'],['Hold shield / armor toggle','Q / X'],['Dodge / target cycle','C or Mouse 4 / middle click'],['Dodge / dive','Ctrl on ground / hold in air'],['Rooftop anchor','V'],['Skyline challenge','B'],['Rotate visual-study view','O'],['Pause / help','Esc / H']];

el('app').innerHTML=shellMarkup();

let renderPipeline:DefaultRenderingPipeline;let aoPipeline:SSAO2RenderingPipeline|null=null;let game:Game;let city:City;let scene:Scene;let camera:UniversalCamera;let fx:Effects;let engine:Engine|WebGPUEngine;let ready=false;let renderer='';let wasLocked=false;let dragging=false;let lastPointer={x:0,y:0};let accumulator=0;let last=performance.now();let menuTime=0;let uiTimer=0;let shakeEnabled=true;let panelPrevious=false;let tutorialIndex=0;

const canvas=el<HTMLCanvasElement>('game');canvas.tabIndex=0;

const settings={gore:true,shake:true,sound:true,quality:'high',music:.32,effects:.7};

try{Object.assign(settings,JSON.parse(localStorage.getItem('morph-settings')||'{}'));}catch{}

function createContactShadows(){const ao=new SSAO2RenderingPipeline('contact shadows',scene,{ssaoRatio:.5,blurRatio:.5},[camera],true);ao.radius=.35;ao.totalStrength=.65;ao.samples=8;ao.expensiveBlur=false;ao.maxZ=120;aoPipeline=ao;}
function saveSettings(){try{localStorage.setItem('morph-settings',JSON.stringify(settings));}catch{}fx.gore=settings.gore;fx.sound.muted=!settings.sound;fx.sound.musicVolume=settings.music;fx.sound.effectsVolume=settings.effects;shakeEnabled=settings.shake;if(city)city.shadow.mapSize=settings.quality==='performance'?1024:2048;if(renderPipeline){renderPipeline.samples=settings.quality==='performance'?1:4;renderPipeline.fxaaEnabled=settings.quality==='performance';if(settings.quality==='performance'&&aoPipeline){aoPipeline.dispose(true);aoPipeline=null;}else if(settings.quality!=='performance'&&!aoPipeline){scene.postProcessRenderPipelineManager.detachCamerasFromRenderPipeline('cinematic',[camera]);createContactShadows();scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline('cinematic',[camera],true);}}engine.setHardwareScalingLevel(settings.quality==='performance'?1.5:1);}

function lock(){canvas.focus();try{const result=canvas.requestPointerLock?.();if(result&&'catch' in result)result.catch(()=>game.say('Mouse capture unavailable. Hold left Alt and drag to look.'));}catch{game.say('Hold left Alt and drag to look.');}}

function begin(mode:string){if(!ready)return;game.start(mode);el('menu').classList.add('hidden');el('panel').classList.add('hidden');el('hud').classList.remove('hidden');el('resume-menu').classList.remove('hidden');lock();}

function pause(){if(!game?.running)return;game.paused=true;padSprint=false;fx.sound.pauseMusic(true);game.release('Block');game.keys.clear();game.moveStick=null;game.wheel=false;game.charging=false;game.jumpCharge=0;document.exitPointerLock?.();el('wheel').classList.add('hidden');showPause();}

function resume(){el('panel').classList.add('hidden');el('menu').classList.add('hidden');el('hud').classList.remove('hidden');game.paused=false;fx.sound.pauseMusic(false);game.release('Block');game.keys.clear();game.moveStick=null;last=performance.now();accumulator=0;renderPose.reset(game.pos,game.facing);lock();}

function showPause(){el('panel').classList.remove('hidden');el('panel-title').textContent=game.dead?'ORGANISM LOST':'SESSION PAUSED';el('panel-body').innerHTML=`<div style="padding:25px 0"><div class="pause-title">${game.dead?'RECONSTITUTE.':'TAKE A BREATH.'}</div><p class="pause-desc">${game.kills} hostiles neutralized · ${game.destruction} objects destroyed · ${game.score} evolution</p><div class="panel-actions">${!game.dead?'<button class="cta" id="resume">RESUME ↗</button>':''}<button class="secondary" id="restart">RESET DISTRICT</button><button class="secondary" id="main-menu">MAIN MENU</button></div></div>`;el('resume')?.addEventListener('click',resume);el('restart').onclick=()=>begin(game.mode==='practice'?'practice':'story');el('main-menu').onclick=()=>{el('panel').classList.add('hidden');el('hud').classList.add('hidden');el('menu').classList.remove('hidden');};}

function manual(){if(!ready)return;panelPrevious=game.running&&!game.paused;game.paused=true;padSprint=false;fx.sound.pauseMusic(true);game.release('Block');game.keys.clear();game.moveStick=null;game.charging=false;game.jumpCharge=0;game.wheel=false;el('wheel').classList.add('hidden');document.exitPointerLock?.();el('panel').classList.remove('hidden');el('panel-title').textContent='FIELD MANUAL';el('panel-body').innerHTML=`<div class="manual-heading">KNOW YOUR POWER.</div><div class="controls-grid">${controls.map(c=>`<div class="control-row"><span>${c[0]}</span><strong>${c[1]}</strong></div>`).join('')}</div><p class="panel-note">Tap attack for a strike; hold for one second to automatically unleash the secondary, with no extra click. Release early for a charged strike. Held enemies and objects still throw on release. Secondary changes with your form and movement. Claws: Faultline. Blade: Guillotine (steer at the apex; dash or switch to cancel). Hammerfists: Aftershock (dive from height for more force). Unarmed: grab, then secondary for Battering Ram; primary throws early and dodge releases. These specials recharge in two seconds. Whipfist Undertow requires one Critical Mass charge. Consume at full health to build Critical Mass. Heavy armor restricts gliding. <br>Gamepad: left stick move, right stick look, A jump/glide, B dodge, X consume/interact, Y grab, RB strike (hold 1 second for secondary), RT secondary, LB hold shield, LT mutation wheel, L3 toggle sprint, R3 target lock. D-pad left/right changes forms, up Devastator, down armor. Y + RT = Undertow; LT + A = anchor; LT + B = dive. Start pauses. <br>Yellow rings show blockable attacks. Red rings require evasion. Arrows point toward off-screen attackers; labels show their distance. Critical Mass absorbs damage before vitality.</p><div class="settings"><label><input id="gore-setting" type="checkbox" ${settings.gore?'checked':''}/> Gore</label><label><input id="shake-setting" type="checkbox" ${settings.shake?'checked':''}/> Camera shake</label><label><input id="sound-setting" type="checkbox" ${settings.sound?'checked':''}/> Sound</label><label>Quality <select id="quality-setting"><option value="high">High</option><option value="performance">Performance</option></select></label><label>Music <input id="music-volume" type="range" min="0" max="1" step=".05" value="${settings.music}"/></label><label>Effects <input id="effects-volume" type="range" min="0" max="1" step=".05" value="${settings.effects}"/></label></div><div class="panel-actions"><button id="benchmark" class="cta">20-TARGET PRACTICE ↗</button><button id="rival-practice" class="secondary">RIVAL DUEL</button><button id="traversal" class="secondary">SKYLINE RUN ↗</button></div><div class="signature-practice"><strong>SIGNATURE PRACTICE</strong><p>Static targets, full health. Try the move, then switch forms to combine.</p><div class="panel-actions">${(['Claws','Blade','Hammerfists','Unarmed','Whipfist'] as const).map((form,i)=>`<button class="secondary" data-signature="${form}">${['FAULTLINE','GUILLOTINE','AFTERSHOCK','BATTERING RAM','UNDERTOW'][i]}</button>`).join('')}</div></div><details class="diagnostic-details"><summary>PERFORMANCE DIAGNOSTICS</summary><div id="diagnostics" class="perf"></div></details><p class="panel-note">Quaternius characters · Poly Haven scans · Car Concept: Eric Chadwick / DGG, CC BY 4.0 · Poly Haven surfaces · Kenney effects · Dark Ambience Loop by Iwan Gabovitch qubodup.net (CC BY 3.0) · Raffaele Picca / GitHub VFX (CC0) · ExileGL blood splatter (CC0). Free assets. Original game. No account required.</p>`;

 el<HTMLSelectElement>('quality-setting').value=settings.quality;
 for(const key of ['music','effects'] as const)el<HTMLInputElement>(key+'-volume').oninput=e=>{settings[key]=Number((e.target as HTMLInputElement).value);saveSettings();};

 for(const key of ['gore','shake','sound'] as const)el<HTMLInputElement>(key+'-setting').onchange=e=>{settings[key]=(e.target as HTMLInputElement).checked;saveSettings();};el<HTMLSelectElement>('quality-setting').onchange=e=>{settings.quality=(e.target as HTMLSelectElement).value;saveSettings();};

 document.querySelectorAll<HTMLElement>('[data-signature]').forEach(button=>button.onclick=()=>{if(!game.running)game.start('study');game.signaturePractice(button.dataset.signature as typeof FORMS[number]);frameSamples=[];sampleClock=0;sampleForm=game.form;frameReport='Warming up';resume();});
 el('benchmark').onclick=()=>{if(!game.running)game.start('study');game.benchmark();resume();};el('rival-practice').onclick=()=>{if(!game.running)game.start('study');game.rivalPractice();resume();};el('traversal').onclick=()=>{if(!game.running)game.start('practice');game.beginChallenge();resume();};updateDiagnostics();}

function updateDiagnostics(){if(!ready)return;const text=`${renderer} · ${Math.round(engine.getFps())} fps · ${scene.getActiveMeshes().length} active meshes\nEnemies ${game.enemies.filter(e=>e.alive).length}/20 · physics debris ${fx.debris.filter(d=>d.life>0).length}/96\nUndertow captured ${game.lastUndertow} · total slam hits ${game.totalSlamHits}\nPosition ${game.pos.x.toFixed(1)}, ${game.pos.y.toFixed(1)}, ${game.pos.z.toFixed(1)} · ${game.form} · ${game.defense}\nHealth ${Math.round(game.health)} · Critical Mass ${game.biomass.toFixed(2)} · destroyed ${game.destruction}\nCharacter ${game.enemies[0]?.actor.meshes().filter(m=>m.isEnabled()).length??0} visible meshes / actor\nScene ${scene.meshes.length} meshes / ${scene.materials.length} materials / ${city.physics.bodies.len()} bodies\nMusic ${fx.sound.muted?'muted':fx.sound.musicPaused?'paused':fx.sound.music?'playing':'loading'} / ${fx.sound.musicTime.toFixed(1)}s · shots ${game.shots.length}/24\nAnimation ${game.player.skin?.active||'procedural'} · clips ${game.player.skin?.groups.size||0}\nSpecials ${JSON.stringify(game.specials.stats)} · waves ${game.specials.waves.length} · projectiles ${game.specials.projectiles.length} · audio cues ${fx.signature.events}\nFrame sample ${frameReport}`;if(el('diagnostics'))el('diagnostics').textContent=text;canvas.dataset.diagnostics=text;}

el('visual-study').onclick=()=>{if(!ready)return;begin('study');game.visualStudy();};el('play').onclick=()=>begin('story');el('practice').onclick=()=>begin('practice');el('guide').onclick=manual;el('help').onclick=manual;el('pause').onclick=pause;el('resume-menu').onclick=resume;el('close-panel').onclick=()=>{if(game.running&&el('menu').classList.contains('hidden')&&!game.dead)resume();else el('panel').classList.add('hidden');};

el('mutation-toggle').onclick=()=>{if(!ready||game.paused)return;game.wheel=!game.wheel;el('wheel').classList.toggle('hidden',!game.wheel);if(game.wheel)document.exitPointerLock?.();};
document.querySelectorAll<HTMLElement>('[data-form]').forEach(b=>b.onclick=()=>{if(!ready)return;game.selectForm(b.dataset.form as typeof FORMS[number]);if(b.classList.contains('wheel-item')){game.wheel=false;el('wheel').classList.add('hidden');game.release('KeyQ');lock();}});

document.addEventListener('keydown',e=>{if(!ready)return;gamepadActive=false;if(e.code==='Escape'){if(game.wheel){game.wheel=false;el('wheel').classList.add('hidden');game.release('KeyQ');lock();return;}if(el('panel').classList.contains('hidden'))pause();else if(!game.dead&&el('menu').classList.contains('hidden'))resume();return;}if(e.code==='KeyH'){e.preventDefault();manual();return;}if(!game.running||game.paused)return;if(['Space','Tab','AltLeft','ControlLeft'].includes(e.code))e.preventDefault();if(e.code==='ControlLeft'&&game.grounded&&!game.vehicle&&!e.repeat)game.dodge();game.press(keyboardCommand(e.code));if(e.code==='Tab'&&game.wheel){el('wheel').classList.remove('hidden');document.exitPointerLock?.();}});

document.addEventListener('keyup',e=>{if(!ready)return;const closeWheel=e.code==='Tab'&&game.wheel;game.release(keyboardCommand(e.code));if(closeWheel){el('wheel').classList.add('hidden');if(!game.paused)lock();}});

canvas.addEventListener('contextmenu',e=>e.preventDefault());canvas.addEventListener('pointerdown',e=>{e.preventDefault();if(!ready||!game.running||game.paused)return;if(e.altKey){dragging=true;lastPointer={x:e.clientX,y:e.clientY};return;}if(document.pointerLockElement!==canvas)lock();gamepadActive=false;const command=mouseCommand(e.button);if(command)game.press(command);});document.addEventListener('pointerup',e=>{dragging=false;if(ready){const command=mouseCommand(e.button);if(command)game.release(command);}});document.addEventListener('pointermove',e=>{if(!ready||game.paused||game.wheel)return;if(document.pointerLockElement===canvas){game.cameraYaw+=e.movementX*.0025;game.cameraPitch=clamp(game.cameraPitch+e.movementY*.002,-.7,.9);}else if(dragging){game.cameraYaw+=(e.clientX-lastPointer.x)*.004;game.cameraPitch=clamp(game.cameraPitch+(e.clientY-lastPointer.y)*.003,-.7,.9);lastPointer={x:e.clientX,y:e.clientY};}});

document.addEventListener('pointerlockchange',()=>{const locked=document.pointerLockElement===canvas;if(wasLocked&&!locked&&ready&&!game.paused&&!game.wheel&&game.running)pause();wasLocked=locked;});window.addEventListener('blur',()=>{if(ready&&game.running&&!game.paused)pause();});document.addEventListener('visibilitychange',()=>{if(document.hidden&&ready&&game.running)pause();});window.addEventListener('resize',()=>engine?.resize());

const padPrevious=new Set<number>(),padHeld=new Map<number,string>();let padSprint=false;
function pad(dt:number){
 const p=navigator.getGamepads?.()[0];
 if(!p){for(const code of padHeld.values())game.release(code);padHeld.clear();padPrevious.clear();game.moveStick=null;if(padSprint)game.release('ShiftLeft');padSprint=false;return;}
 const movement=stick(p.axes[0]||0,p.axes[1]||0),look=stick(p.axes[2]||0,p.axes[3]||0);
 if(Math.hypot(movement.x,movement.y)+Math.hypot(look.x,look.y)>.01||p.buttons.some(b=>b.pressed))gamepadActive=true;
 if(game.paused){if(p.buttons[9]?.pressed&&!padPrevious.has(9)&&!game.dead){padPrevious.add(9);resume();}else if(!p.buttons[9]?.pressed)padPrevious.delete(9);return;}
 game.moveStick=Math.hypot(movement.x,movement.y)>.001?movement:null;
 game.cameraYaw+=look.x*dt*2.5;game.cameraPitch=clamp(game.cameraPitch+look.y*dt*1.6,-.7,.9);
 p.buttons.forEach((button,i)=>{
  if(button.pressed&&!padPrevious.has(i)){
   padPrevious.add(i);
   if(i===9){pause();return;}
   if(i===10){padSprint=!padSprint;if(padSprint)game.press('ShiftLeft');else game.release('ShiftLeft');return;}
   if(i===14||i===15){const n=FORMS.indexOf(game.form);game.selectForm(FORMS[(n+(i===14?FORMS.length-1:1))%FORMS.length]);return;}
   let code=padCommands[i];if(p.buttons[6]?.pressed&&i===0)code='KeyV';if(p.buttons[6]?.pressed&&i===1)code='ControlLeft';
   if(code){padHeld.set(i,code);game.press(code);}
  }else if(!button.pressed&&padPrevious.has(i)){const code=padHeld.get(i);if(code)game.release(code);padHeld.delete(i);padPrevious.delete(i);}
 });
 if(padSprint&&!game.moveStick){game.release('ShiftLeft');padSprint=false;}
}

const mapContext=el<HTMLCanvasElement>('mini').getContext('2d')!;

function minimap(){const c=mapContext;c.clearRect(0,0,240,240);c.save();c.translate(120,120);c.rotate(-game.cameraYaw);const scale=1.35;for(const b of city.boxes){if(b.active===false)continue;const x=(b.min.x-game.pos.x)*scale,z=-(b.max.z-game.pos.z)*scale;if(Math.abs(x)>230||Math.abs(z)>230)continue;c.fillStyle='#7d8d813a';c.fillRect(x,z,(b.max.x-b.min.x)*scale,(b.max.z-b.min.z)*scale);}for(const e of game.enemies){if(!e.alive)continue;c.fillStyle=e.captured?'#ffdfab':'#f66b51';c.beginPath();c.arc((e.pos.x-game.pos.x)*scale,-(e.pos.z-game.pos.z)*scale,e.kind==='boss'?5:2.5,0,Math.PI*2);c.fill();}if(game.challenge){const p=game.rings[game.ringIndex]?.position;if(p){c.strokeStyle='#a8efcc';c.lineWidth=2;c.beginPath();c.arc((p.x-game.pos.x)*scale,-(p.z-game.pos.z)*scale,5,0,Math.PI*2);c.stroke();}}c.restore();c.fillStyle='#faf0d6';c.beginPath();c.moveTo(120,112);c.lineTo(115,125);c.lineTo(120,122);c.lineTo(125,125);c.fill();c.fillStyle='#acb4a9';c.font='10px monospace';c.fillText('N',116,17);}

function ui(){el('health-fill').style.width=game.health+'%';el('health-number').textContent=String(Math.ceil(game.health));el('mass-number').textContent=game.biomass.toFixed(1)+' / 3';document.querySelectorAll<HTMLElement>('.mass-segment i').forEach((m,i)=>m.style.width=clamp(game.biomass-i,0,1)*100+'%');el('score').textContent=String(game.score);el('defense').textContent=game.defense==='None'?'DEFENSE OFF':game.defense==='Shield'?'SHIELD / '+Math.ceil(game.shield):'ARMORED';el('motion').textContent=game.vehicle?game.vehicle.kind.toUpperCase():game.gliding?'GLIDING':game.grounded?'GROUNDED':'AIRBORNE';el('form-name').textContent=game.weapon?game.weapon.toUpperCase():game.form.toUpperCase();document.querySelectorAll<HTMLElement>('[data-form]').forEach(e=>{const active=e.dataset.form===game.form;e.classList.toggle('active',active);e.setAttribute('aria-pressed',String(active));});el('form-role').textContent=formRoles[game.form];el('mass-state').textContent=game.biomass>=1?'DEVASTATOR READY':'CONSUME TO RECHARGE';el('hint').classList.toggle('ready',game.biomass>=1);el('hud').classList.toggle('low-health',game.health<30);el('hud').classList.toggle('studying',game.artStudy);el('combat-inputs').textContent=gamepadActive?(game.form==='Whipfist'?'RB STRIKE / RT UNDERTOW':'RB STRIKE / RT SPECIAL'):(game.form==='Whipfist'?'LMB STRIKE / RMB UNDERTOW':'LMB STRIKE / RMB SPECIAL');el('special-status').textContent=game.specials.title+' / '+(game.specials.cooldown>0?game.specials.cooldown.toFixed(1)+'s':game.form==='Whipfist'&&game.biomass<1?'NEED MASS':'READY');el('mutation-toggle').querySelector('kbd')!.textContent=gamepadActive?'LT':'TAB';el('hint').querySelectorAll('kbd').forEach((k,i)=>k.textContent=(gamepadActive?['D↑','Y','X']:['R','F','E'])[i]);el('wheel').classList.toggle('hidden',!game.wheel||game.paused);el('action').textContent=game.actionLabel;el('action').classList.toggle('hidden',game.actionTime<=0);el('toast').textContent=game.message;el('toast').classList.toggle('hidden',game.messageTime<=0);el('charge').classList.toggle('hidden',!game.charging&&game.jumpCharge<=0);el('charge').firstElementChild!.setAttribute('style',`width:${clamp(game.charging?game.charge:game.jumpCharge,0,1)*100}%`);el('charge-caption').textContent=!game.charging?'RELEASE TO JUMP':game.holding?'RELEASE TO THROW':game.weapon||game.vehicle?'RELEASE TO FIRE':'CHARGE → '+game.specials.title;

 const boss=game.enemies.find(e=>e.alive&&e.kind==='boss');el('boss-health').classList.toggle('hidden',!boss);if(boss){el('boss-title').textContent=game.openingRival?'THE OTHER':'APEX ORGANISM';el('boss-fill').style.width=(boss.hp/boss.maxHp*100)+'%';el('boss-phase').textContent='PHASE '+(boss.phase+1)+' / 3';}

 el('danger').classList.add('hidden');

 const n=game.enemies.filter(e=>e.alive).length;el('objective-label').textContent=game.artStudy?'VISUAL STUDY':game.challenge?'TRAVERSAL / SKYLINE RUN':game.mode==='practice'?'COMBAT SANDBOX':`${String(Math.min(game.stage+1,4)).padStart(2,'0')} / ${game.stage===3?'APEX SIGNATURE':'BREAK CONTAINMENT'}`;el('objective-title').textContent=game.artStudy?'Inspect the organism':game.challenge?`${game.ringIndex} / ${game.rings.length} gates · ${game.challengeTime.toFixed(1)}s`:game.openingRival?'Defeat the rival':game.mode==='free'?'District liberated':game.stage===3?'Eliminate the Apex':game.stage===1?'Defeat the rival':game.stage===0&&game.mode!=='practice'?'Learn your strength':'Reclaim the street';el('objective-detail').textContent=game.artStudy?'1-5 mutations / O rotate view / WASD explore':game.challenge?'Dive to gain speed. Pull up to gain height.':`${n} hostiles remaining · ${game.destruction} objects destroyed${game.mode==='practice'?' · automatic reinforcements':''}`;el('fps').textContent=`${Math.round(engine.getFps())} FPS / ${renderer}`;el('sector').textContent=game.mode==='free'?'MIDTOWN / FREE ROAM':'MIDTOWN / CONTAINMENT ACTIVE';minimap();updateDiagnostics();

 if(game.locked?.alive){const p=Vector3.Project(game.locked.pos.add(new Vector3(0,2.6,0)),Matrix.Identity(),scene.getTransformMatrix(),camera.viewport.toGlobal(engine.getRenderWidth(),engine.getRenderHeight()));const target=el('lock-target');target.classList.toggle('hidden',p.z<0||p.z>1);target.style.left=p.x/engine.getRenderWidth()*100+'%';target.style.top=p.y/engine.getRenderHeight()*100+'%';}else el('lock-target').classList.add('hidden');}

async function boot(){try{

 await RAPIER.init();el('load-text').textContent='Building Midtown. Forming organic weapons.';

 let gpu=false;try{gpu=await WebGPUEngine.IsSupportedAsync;}catch{}

 if(gpu){try{const web=new WebGPUEngine(canvas,{antialias:true,adaptToDeviceRatio:false,powerPreference:'high-performance',setMaximumLimits:true});await web.initAsync();engine=web;renderer='WEBGPU';}catch{engine=new Engine(canvas,true,{preserveDrawingBuffer:true,stencil:true},false);renderer='WEBGL 2';}}else{engine=new Engine(canvas,true,{preserveDrawingBuffer:true,stencil:true},false);renderer='WEBGL 2';}

 scene=new Scene(engine);scene.clearColor=new Color4(.55,.61,.61,1);scene.fogMode=Scene.FOGMODE_EXP2;scene.fogDensity=.0015;scene.fogColor=new Color3(.57,.63,.63);scene.collisionsEnabled=false;

 camera=new UniversalCamera('player camera',new Vector3(-8,5,-41),scene);camera.minZ=.15;camera.maxZ=1100;camera.fov=.95;camera.inputs.clear();camera.setTarget(new Vector3(0,1.5,-28));scene.activeCamera=camera;

 const ambient=new HemisphericLight('sky fill',new Vector3(0,1,0),scene);ambient.intensity=.25;ambient.diffuse=new Color3(.74,.83,.91);ambient.groundColor=new Color3(.3,.26,.22);

 const sun=new DirectionalLight('late afternoon sun',new Vector3(-.5,-.65,.4),scene);sun.position.set(140,220,-150);sun.intensity=2.8;sun.diffuse=new Color3(1,.92,.8);sun.shadowMinZ=1;sun.shadowMaxZ=650;sun.autoCalcShadowZBounds=true;

 const shadows=new CascadedShadowGenerator(2048,sun);shadows.numCascades=2;shadows.stabilizeCascades=true;shadows.shadowMaxZ=170;shadows.lambda=.8;shadows.cascadeBlendPercentage=.1;shadows.usePercentageCloserFiltering=true;shadows.filteringQuality=ShadowGenerator.QUALITY_MEDIUM;shadows.bias=.0005;shadows.normalBias=.035;
 const environment=new HDRCubeTexture('/assets/lighting/urban_street_02.hdr',scene,128,false,true,false,true);scene.environmentTexture=environment;scene.environmentIntensity=.8;

 scene.createDefaultSkybox(environment,true,1800,.18,false);

 el('load-text').textContent='Loading scanned street objects.';await prepareScannedProps(scene);city=new City(scene,shadows);fx=new Effects(scene,city.physics);el('load-text').textContent='Loading the organism and motion library.';await prepareCharacters(scene);game=new Game(scene,city,fx);game.targetOnScreen=p=>{const screen=Vector3.Project(new Vector3(p.x,p.y,p.z),Matrix.Identity(),scene.getTransformMatrix(),camera.viewport.toGlobal(engine.getRenderWidth(),engine.getRenderHeight()));return screen.z>0&&screen.z<1&&screen.x>=0&&screen.x<=engine.getRenderWidth()&&screen.y>=0&&screen.y<=engine.getRenderHeight();};threatHud=new ThreatHud(el('hud'));

 if(settings.quality!=='performance')createContactShadows();
 const pipeline=new DefaultRenderingPipeline('cinematic',true,scene,[camera]);pipeline.fxaaEnabled=false;pipeline.bloomEnabled=true;pipeline.bloomThreshold=.85;pipeline.bloomWeight=.05;pipeline.bloomKernel=48;pipeline.samples=4;renderPipeline=pipeline;

 scene.imageProcessingConfiguration.toneMappingEnabled=true;scene.imageProcessingConfiguration.toneMappingType=ImageProcessingConfiguration.TONEMAPPING_ACES;scene.imageProcessingConfiguration.exposure=1.05;scene.imageProcessingConfiguration.contrast=1.07;

 engine.onContextLostObservable.add(()=>{game.paused=true;el('load').classList.remove('hidden');el('load-text').textContent='Graphics device interrupted. Waiting for recovery…';});engine.onContextRestoredObservable.add(()=>{el('load').classList.add('hidden');pause();});

 renderPose.reset(game.pos,game.facing);
 game.onEvent=name=>{if(name==='reset'){accumulator=0;renderPose.reset(game.pos,game.facing);followCamera.reset();cameraFraction=1;}if(name==='death')pause();if(name==='damage'){el('damage').style.opacity='.55';setTimeout(()=>el('damage').style.opacity='0',180);}};

 await scene.whenReadyAsync();ready=true;saveSettings();engine.resize();el('load').classList.add('hidden');last=performance.now();engine.runRenderLoop(()=>{

 const now=performance.now(),rawFrame=now-last,dt=Math.min(.05,rawFrame/1000);last=now;menuTime+=dt;
 if(sampleForm&&game.running&&!game.paused&&frameSamples.length<900){sampleClock+=rawFrame/1000;if(sampleClock>5&&rawFrame<1000){frameSamples.push(rawFrame);const sorted=[...frameSamples].sort((a,b)=>a-b);frameReport=sampleForm+' n='+sorted.length+' median '+sorted[Math.floor(sorted.length*.5)].toFixed(1)+'ms p95 '+sorted[Math.min(sorted.length-1,Math.floor(sorted.length*.95))].toFixed(1)+'ms';}}

 if(game.running)pad(dt);if(game.running&&!game.paused){let sim=dt*(game.wheel?.12:1);if(fx.hitPause>0){fx.hitPause-=dt;sim*=.13;}accumulator=Math.min(accumulator+sim,.12);while(accumulator>=1/60){renderPose.beforeStep(game.pos);game.step(1/60);accumulator-=1/60;}}

 const menuVisible=!el('menu').classList.contains('hidden');
 const renderPosition=renderPose.sample(game.pos,game.facing,game.paused?1:accumulator*60,dt);
 game.player.root.position.copyFrom(renderPosition);game.player.root.rotation.y=renderPose.heading;
 if(menuVisible){
  const orbit=Math.sin(menuTime*.08)*.3;
  camera.position.set(game.pos.x-8+orbit,game.pos.y+4.4,game.pos.z-12);
  camera.setTarget(game.pos.add(new Vector3(0,1.45,0)));followCamera.reset();
  game.player.animate(menuTime,0,false,false,0,'','');
 }else{
  const dist=game.undertow?12:game.benchmarkHold?10:game.specials.motion?.kind==='guillotine'?8:game.specials.motion?6.5:game.vehicle?13:game.gliding?12:game.artStudy?(game.form==='Whipfist'?6:game.form==='Blade'?5.6:4.3):game.attack>0?4.6:5.5;
  const offset=followCamera.update(renderPosition,game.undertow?1.65+Math.sin(Math.min(1,game.undertow.time/1.15)*Math.PI)*5:game.vehicle?2.5:1.65,game.cameraYaw,game.cameraPitch,dist,game.artStudy&&game.form==='Whipfist'?.9:0,game.artStudy,dt);
  const target=followCamera.anchor;let fraction=1;
  for(const b of city.boxes)if(b.active!==false){const hit=segmentHit(target,offset,b,.2);if(hit!==null)fraction=Math.min(fraction,Math.max(.08,hit-.03));}
  // Retract immediately at obstacles; ease out after clearing a wall.
  cameraFraction=fraction<cameraFraction?fraction:cameraFraction+(fraction-cameraFraction)*damping(12,dt);
  camera.position.copyFrom(target.add(offset.scale(cameraFraction)));
  const shake=shakeEnabled?fx.shake:0;
  const impactOffset=new Vector3((Math.random()-.5)*shake,(Math.random()-.5)*shake,0);
  camera.position.addInPlace(impactOffset);camera.setTarget(followCamera.look.add(impactOffset));
  camera.fov+=( (game.gliding?1.08:.87)-camera.fov)*damping(3,dt);
 }

 scene.animationsEnabled=!game.running||!game.paused;scene.animationTimeScale=game.wheel?.12:fx.hitPause>0?.13:1;scene.render();if(!menuVisible)threatHud.update(game,scene,camera,gamepadActive);uiTimer+=dt;if(uiTimer>.1){uiTimer=0;ui();}

 });

 }catch(error){console.error(error);el('load-text').textContent='Unable to initialize graphics. '+(error instanceof Error?error.message:String(error));}}


void boot();

