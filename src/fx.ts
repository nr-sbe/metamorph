import {Scene,MeshBuilder,Mesh,Vector3,Color3,StandardMaterial,PBRMaterial,Quaternion,Texture,DynamicTexture} from '@babylonjs/core';
import RAPIER from '@dimforge/rapier3d-compat/rapier.es.js';
import {DebrisArt,type DebrisKind} from './debrisArt';
import {SignatureFx} from './signatureFx';
export type {DebrisKind} from './debrisArt';
export class Sound{
 ctx:AudioContext|null=null;muted=false;master:GainNode|null=null;buffers=new Map<string,AudioBuffer>();music:AudioBufferSourceNode|null=null;musicGain:GainNode|null=null;musicLoading=false;musicPaused=false;musicStartedAt=0;sampleTime=0;stepTime=0;musicVolume=.32;effectsVolume=.7;duckTime=0;
 start(){if(!this.ctx){this.ctx=new AudioContext();this.master=this.ctx.createGain();this.master.gain.value=.22;this.master.connect(this.ctx.destination);for(const group of ['impactMetal_heavy','impactPunch_heavy','impactWood_heavy','footstep_concrete'])for(let i=0;i<3;i++){const name=group+'_00'+i;fetch('/assets/audio/'+name+'.ogg').then(r=>r.arrayBuffer()).then(b=>this.ctx!.decodeAudioData(b)).then(b=>this.buffers.set(name,b)).catch(()=>{});}}
 this.musicPaused=false;this.ctx.resume();if(!this.music&&!this.musicLoading){this.musicLoading=true;fetch('/assets/audio/dark-ambience.ogg').then(r=>r.arrayBuffer()).then(b=>this.ctx!.decodeAudioData(b)).then(buffer=>{const c=this.ctx!;this.music=c.createBufferSource();this.music.buffer=buffer;this.music.loop=true;this.musicGain=c.createGain();this.musicGain.gain.value=this.muted?0:this.musicVolume;this.music.connect(this.musicGain);this.musicGain.connect(c.destination);this.musicStartedAt=c.currentTime;this.music.start();this.musicLoading=false;}).catch(()=>{this.musicLoading=false;});}}
 get musicTime(){const duration=this.music?.buffer?.duration??1;return this.music&&this.ctx?(this.ctx.currentTime-this.musicStartedAt)%duration:0;}
 tick(dt:number){this.duckTime=Math.max(0,this.duckTime-dt);if(this.musicGain&&this.ctx)this.musicGain.gain.setTargetAtTime(this.muted?0:this.musicVolume*(this.duckTime>0?.4:1),this.ctx.currentTime,.12);if(this.master)this.master.gain.value=this.effectsVolume*.4;}
 undertow(phase:'seize'|'drop'|'slam'){
  if(!this.ctx||this.muted)return;const c=this.ctx;this.duckTime=phase==='slam'?.85:.35;
  if(phase==='slam'){this.sample('impactMetal_heavy',.8);this.sample('impactWood_heavy',1);this.sample('impactPunch_heavy',1);}
  const layers=phase==='slam'?[58,93,145]:phase==='drop'?[270,410]:[65,125,220];
  for(const frequency of layers){const o=c.createOscillator(),g=c.createGain();o.type=phase==='slam'?'sine':'triangle';o.frequency.setValueAtTime(frequency,c.currentTime);o.frequency.exponentialRampToValueAtTime(phase==='seize'?frequency*2.3:phase==='drop'?45:22,c.currentTime+(phase==='slam'?.6:.35));g.gain.setValueAtTime(.001,c.currentTime);g.gain.exponentialRampToValueAtTime(phase==='slam'?.65:.16,c.currentTime+.015);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+(phase==='slam'?.85:.4));o.connect(g);g.connect(this.master!);o.start();o.stop(c.currentTime+.9);o.onended=()=>{o.disconnect();g.disconnect();};}
 }
 incoming(blocked=false){if(!this.ctx||this.muted)return;this.duckTime=.7;const c=this.ctx,o=c.createOscillator(),g=c.createGain();o.type='triangle';o.frequency.setValueAtTime(blocked?720:220,c.currentTime);o.frequency.exponentialRampToValueAtTime(blocked?380:70,c.currentTime+.18);g.gain.setValueAtTime(.5,c.currentTime);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+.22);o.connect(g);g.connect(this.master!);o.start();o.stop(c.currentTime+.23);o.onended=()=>{o.disconnect();g.disconnect();};}
 pauseMusic(paused:boolean){this.musicPaused=paused;if(paused)this.ctx?.suspend();else this.ctx?.resume();}
 sample(group:string,volume=1){if(!this.ctx||this.muted)return;const name=group+'_00'+Math.floor(Math.random()*3),buffer=this.buffers.get(name);if(!buffer)return;const s=this.ctx.createBufferSource(),g=this.ctx.createGain();s.buffer=buffer;s.playbackRate.value=.85+Math.random()*.25;g.gain.value=volume;s.connect(g);g.connect(this.master!);s.start();s.onended=()=>{s.disconnect();g.disconnect();};}
 step(speed:number){if(!this.ctx||speed<2)return;if(this.ctx.currentTime-this.stepTime>(speed>12?.21:.36)){this.stepTime=this.ctx.currentTime;this.sample('footstep_concrete',.4);}}
 hit(weight=1,metal=false){if(!this.ctx||this.muted)return;if(this.ctx.currentTime-this.sampleTime<.035)return;this.sampleTime=this.ctx.currentTime;this.sample(metal?'impactMetal_heavy':'impactPunch_heavy',Math.min(1,weight*.5));const c=this.ctx,g=c.createGain(),o=c.createOscillator();g.connect(this.master!);o.connect(g);o.type='triangle';o.frequency.setValueAtTime(metal?170:85,c.currentTime);o.frequency.exponentialRampToValueAtTime(24,c.currentTime+.22);g.gain.setValueAtTime(Math.min(1,weight*.45),c.currentTime);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+.35);o.start();o.stop(c.currentTime+.36);
 const n=c.createBuffer(1,c.sampleRate*.2,c.sampleRate),d=n.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,3);const s=c.createBufferSource();s.buffer=n;const f=c.createBiquadFilter();f.type='lowpass';f.frequency.value=metal?3500:1400;const ng=c.createGain();ng.gain.value=.3*weight;s.connect(f);f.connect(ng);ng.connect(this.master!);s.start();s.onended=()=>{s.disconnect();f.disconnect();ng.disconnect();};o.onended=()=>{o.disconnect();g.disconnect();};}
 sweep(){if(!this.ctx||this.muted)return;const c=this.ctx,o=c.createOscillator(),g=c.createGain();o.type='sawtooth';o.frequency.setValueAtTime(70,c.currentTime);o.frequency.exponentialRampToValueAtTime(370,c.currentTime+.38);g.gain.setValueAtTime(.03,c.currentTime);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+.5);o.connect(g);g.connect(this.master!);o.start();o.stop(c.currentTime+.5);o.onended=()=>{o.disconnect();g.disconnect();};}
}
type Piece={mesh:Mesh;body:RAPIER.RigidBody|null;life:number;kind:DebrisKind};
type Spark={mesh:Mesh;velocity:Vector3;life:number;max:number;blood?:boolean;floor?:number};
type Dust={mesh:Mesh;velocity:Vector3;life:number;max:number;size:number};
export class Effects{
 signature:SignatureFx;
 bloodClouds:{mesh:Mesh;life:number;max:number}[]=[];bloodStains:Mesh[]=[];tracers:Mesh[]=[];bloodCursor=0;cloudCursor=0;seizeBands:Mesh[]=[];

 debris:Piece[]=[];sparks:Spark[]=[];rings:{mesh:Mesh;life:number;size:number}[]=[];tendrils:Mesh[]=[];scars:Mesh[]=[];cursor=0;scarCursor=0;gore=true;shake=0;hitPause=0;sound=new Sound();
 tendrilMaterial:PBRMaterial;stone:StandardMaterial;blood:StandardMaterial;glow:StandardMaterial;dark:StandardMaterial;
 debrisArt:DebrisArt;dustClouds:Dust[]=[];private fragmentSerial=0;private dustCursor=0;
 constructor(public scene:Scene,public physics:RAPIER.World){
 this.debrisArt=new DebrisArt(scene);
 const mat=(n:string,c:string,e=0)=>{const m=new StandardMaterial(n,scene);m.diffuseColor=Color3.FromHexString(c);m.emissiveColor=m.diffuseColor.scale(e);return m;};
 this.stone=mat('debris concrete','#686965');this.blood=mat('blood tissue','#6c1718');this.glow=mat('impact ember','#ff7955',1);this.dark=mat('scorch mark','#1e2323');this.dark.alpha=.8;this.tendrilMaterial=new PBRMaterial('striated living cable',scene);this.tendrilMaterial.albedoColor=new Color3(.012,.035,.017);this.tendrilMaterial.roughness=.29;this.tendrilMaterial.metallic=0;this.tendrilMaterial.emissiveColor=new Color3(.001,.007,.002);this.tendrilMaterial.bumpTexture=new Texture('/assets/mutations/brown_leather_normal.jpg',scene);this.tendrilMaterial.bumpTexture.level=.65;(this.tendrilMaterial.bumpTexture as Texture).vScale=8;this.tendrilMaterial.clearCoat.isEnabled=true;this.tendrilMaterial.clearCoat.intensity=.45;this.tendrilMaterial.forceIrradianceInFragment=true;
 if(typeof document!=='undefined'){
 const crack=new DynamicTexture('authored pavement fracture',{width:512,height:512},scene,false),c=crack.getContext();c.clearRect(0,0,512,512);
 const shade=c.createRadialGradient(256,256,0,256,256,225);shade.addColorStop(0,'rgba(20,22,20,.35)');shade.addColorStop(1,'rgba(20,22,20,0)');c.fillStyle=shade;c.fillRect(0,0,512,512);
 c.strokeStyle='rgba(12,14,12,.95)';(c as CanvasRenderingContext2D).lineCap='round';
 for(let ray=0;ray<11;ray++){const a=ray*Math.PI*2/11;let x=256,y=256;for(let step=0;step<5;step++){const length=25+Math.random()*20,angle=a+(Math.random()-.5)*.6,xx=x+Math.cos(angle)*length,yy=y+Math.sin(angle)*length;c.lineWidth=4-step*.65;c.beginPath();c.moveTo(x,y);c.lineTo(xx,yy);c.stroke();if(step>1){c.lineWidth=1;c.beginPath();c.moveTo(xx,yy);c.lineTo(xx+Math.cos(angle+.8)*22,yy+Math.sin(angle+.8)*22);c.stroke();}x=xx;y=yy;}}
 crack.hasAlpha=true;crack.update();this.dark.diffuseTexture=crack;this.dark.useAlphaFromDiffuseTexture=true;this.dark.diffuseColor=new Color3(.7,.7,.7);
 }
 const stain=new PBRMaterial('wet blood splatter',scene);stain.albedoTexture=new Texture('/assets/vfx/blood-splatter.png',scene);stain.albedoTexture.hasAlpha=true;stain.useAlphaFromAlbedoTexture=true;stain.albedoColor=new Color3(.6,.36,.3);stain.roughness=.32;stain.metallic=0;stain.forceIrradianceInFragment=true;stain.backFaceCulling=false;stain.zOffset=-2;
 const mist=new StandardMaterial('fine directional blood spray',scene);mist.diffuseTexture=new Texture('/assets/vfx/particle-mist.png',scene);mist.diffuseTexture.hasAlpha=true;mist.useAlphaFromDiffuseTexture=true;mist.diffuseColor=new Color3(.26,.005,.003);mist.emissiveColor=new Color3(.06,0,0);mist.specularColor=Color3.Black();mist.backFaceCulling=false;
 const dust=new StandardMaterial('suspended concrete dust',scene);dust.diffuseTexture=mist.diffuseTexture;dust.useAlphaFromDiffuseTexture=true;dust.diffuseColor=new Color3(.49,.45,.38);dust.emissiveColor=new Color3(.1,.085,.065);dust.specularColor=Color3.Black();dust.backFaceCulling=false;dust.disableDepthWrite=true;
 const pressure=mat('ground pressure dust','#999180',.18);pressure.specularColor=Color3.Black();pressure.alpha=.45;pressure.backFaceCulling=false;pressure.disableDepthWrite=true;
 if(typeof document!=='undefined'){
 const texture=new DynamicTexture('soft ground dust ring',{width:256,height:256},scene,false),c=texture.getContext();c.clearRect(0,0,256,256);const g=c.createRadialGradient(128,128,0,128,128,125);g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(.52,'rgba(255,255,255,0)');g.addColorStop(.76,'rgba(255,255,255,.6)');g.addColorStop(.88,'rgba(255,255,255,.17)');g.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=g;c.fillRect(0,0,256,256);texture.hasAlpha=true;texture.update();pressure.diffuseTexture=texture;pressure.useAlphaFromDiffuseTexture=true;
 }
 const tracer=mat('hostile projectile tracer','#ffd693',1.5);
 for(let i=0;i<32;i++){const m=MeshBuilder.CreateDisc('blood ground splatter',{radius:1,tessellation:32,sideOrientation:Mesh.DOUBLESIDE},scene);m.material=stain;m.rotation.x=Math.PI/2;m.setEnabled(false);this.bloodStains.push(m);}
 for(let i=0;i<16;i++){const m=MeshBuilder.CreatePlane('blood mist',{size:1},scene);m.billboardMode=Mesh.BILLBOARDMODE_ALL;m.material=mist;m.setEnabled(false);this.bloodClouds.push({mesh:m,life:0,max:1});}
 for(let i=0;i<24;i++){const m=MeshBuilder.CreateBox('hostile round',{width:.065,height:.065,depth:.9},scene);m.material=tracer;m.setEnabled(false);this.tracers.push(m);}
 for(let i=0;i<96;i++){const mesh=new Mesh('physical fracture fragment',scene);this.debrisArt.apply(mesh,'stone',i);mesh.isPickable=false;mesh.receiveShadows=true;mesh.rotationQuaternion=Quaternion.Identity();mesh.setEnabled(false);this.debris.push({mesh,body:null,life:0,kind:'stone'});}
 for(let i=0;i<32;i++){const mesh=MeshBuilder.CreatePlane('impact dust plume',{size:1},scene);mesh.material=dust;mesh.billboardMode=Mesh.BILLBOARDMODE_ALL;mesh.isPickable=false;mesh.setEnabled(false);this.dustClouds.push({mesh,velocity:Vector3.Zero(),life:0,max:1,size:1});}
 for(let i=0;i<120;i++){const mesh=MeshBuilder.CreateSphere('impact particle',{diameter:1,segments:3},scene);mesh.material=this.glow;mesh.setEnabled(false);this.sparks.push({mesh,velocity:Vector3.Zero(),life:0,max:1});}
 for(let i=0;i<12;i++){const mesh=MeshBuilder.CreateDisc('ground dust pressure wave',{radius:1,tessellation:32,sideOrientation:Mesh.DOUBLESIDE},scene);mesh.material=pressure;mesh.rotation.x=Math.PI/2;mesh.isPickable=false;mesh.setEnabled(false);this.rings.push({mesh,life:0,size:1});}
 for(let i=0;i<48;i++){const mesh=MeshBuilder.CreateDisc('impact scar',{radius:1,tessellation:9,sideOrientation:Mesh.DOUBLESIDE},scene);mesh.rotation.x=Math.PI/2;mesh.material=this.dark;mesh.setEnabled(false);this.scars.push(mesh);}
 for(let i=0;i<20;i++){const band=MeshBuilder.CreateTorus('tendril restraint',{diameter:.75,thickness:.075,tessellation:24},scene);band.material=this.tendrilMaterial;band.scaling.z=.65;band.rotation.z=.3;band.setEnabled(false);this.seizeBands.push(band);const mesh=MeshBuilder.CreateTube('organic tendril',{path:Array.from({length:25},(_,j)=>new Vector3(0,j/8,0)),radius:.085,radiusFunction:j=>.085*(1-j/32)*(1+.16*Math.cos(j*Math.PI)),tessellation:10,updatable:true},scene);mesh.material=this.tendrilMaterial;mesh.setEnabled(false);this.tendrils.push(mesh);}
 this.signature=new SignatureFx(this);
 }
 burst(p:Vector3,count=14,blood=false,power=5,material?:StandardMaterial|PBRMaterial){if(blood&&!this.gore)return;for(let n=0;n<count;n++){const s=this.sparks[this.cursor++%this.sparks.length];s.mesh.position.copyFrom(p);s.blood=blood;s.floor=0;s.mesh.scaling.setAll(blood?.055:.055+Math.random()*.12);s.mesh.material=material??(blood?this.blood:this.glow);s.velocity.set((Math.random()-.5)*power,Math.random()*power,(Math.random()-.5)*power);s.life=s.max=.35+Math.random()*.5;s.mesh.setEnabled(true);}}
 bloodHit(p:Vector3,direction:Vector3,heavy=false,ground=0){
  if(!this.gore)return;const first=this.cursor;this.burst(p,heavy?22:12,true,heavy?6:4);
  for(let i=first;i<this.cursor;i++){const s=this.sparks[i%this.sparks.length];s.velocity.addInPlace(direction.scale(.12));s.floor=ground;s.mesh.scaling.set(.035,.035,.15);}
  const cloud=this.bloodClouds[this.cloudCursor++%this.bloodClouds.length];cloud.mesh.position.copyFrom(p);cloud.mesh.scaling.setAll(heavy?1.4:.8);cloud.life=cloud.max=.3;cloud.mesh.visibility=.6;cloud.mesh.setEnabled(true);
  if(heavy&&p.y-ground<2.4)this.bloodStain(p,ground,1.1);
 }
 bloodStain(p:Vector3,ground:number,size:number){const m=this.bloodStains[this.bloodCursor++%this.bloodStains.length];m.position.set(p.x,ground+.03,p.z);m.scaling.set(size,size*(.6+Math.random()*.6),1);m.rotation.z=Math.random()*Math.PI*2;m.setEnabled(this.gore);}
 projectile(slot:number,p:Vector3,direction:Vector3,enabled:boolean){const m=this.tracers[slot];m.position.copyFrom(p);m.lookAt(p.add(direction));m.setEnabled(enabled);}
 fragment(p:Vector3,v:Vector3,size=.3,blood=false,kind:DebrisKind=blood?'tissue':'stone'){
 if(kind==='tissue'&&!this.gore)return;
 const d=this.debris.find(x=>x.life<=0)||this.debris.reduce((a,b)=>a.life<b.life?a:b);
 if(d.body)this.physics.removeRigidBody(d.body);
 const half=this.debrisArt.apply(d.mesh,kind,this.fragmentSerial++),scale=Math.max(.02,size);
 d.kind=kind;d.mesh.position.copyFrom(p);d.mesh.scaling.set(scale*(.8+Math.random()*.4),scale*(.8+Math.random()*.4),scale*(.8+Math.random()*.4));
 const rotation=kind==='spike'?Quaternion.Identity():Quaternion.FromEulerAngles(Math.random()*3,Math.random()*6,Math.random()*3);
 d.mesh.rotationQuaternion!.copyFrom(rotation);d.mesh.visibility=1;d.mesh.setEnabled(true);d.life=kind==='tissue'?4:kind==='spike'?2:5+Math.random()*2;
 d.body=this.physics.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(p.x,p.y,p.z).setRotation(rotation).setLinvel(v.x,v.y,v.z).setAngvel(kind==='spike'?{x:0,y:0,z:0}:{x:(Math.random()-.5)*9,y:(Math.random()-.5)*9,z:(Math.random()-.5)*9}).setLinearDamping(kind==='glass'?.2:.08).setAngularDamping(.3).setCcdEnabled(true));
 const s=d.mesh.scaling;this.physics.createCollider(RAPIER.ColliderDesc.cuboid(Math.max(.015,half[0]*s.x),Math.max(.015,half[1]*s.y),Math.max(.015,half[2]*s.z)).setDensity(kind==='metal'?3:kind==='tissue'?.7:1.5).setRestitution(kind==='metal'?.28:kind==='tissue'?.05:.12).setFriction(.8).setCollisionGroups(0x00020001),d.body);
 }
 dust(p:Vector3,count=6,size=1.2,power=2){for(let i=0;i<Math.min(12,count);i++){
 const cloud=this.dustClouds[this.dustCursor++%this.dustClouds.length],angle=Math.random()*Math.PI*2,radius=Math.random()*size*.55;
 cloud.mesh.position.set(p.x+Math.cos(angle)*radius,p.y+.2+Math.random()*.2,p.z+Math.sin(angle)*radius);cloud.velocity.set(Math.cos(angle)*power,.6+Math.random(),Math.sin(angle)*power);
 cloud.size=size*(.7+Math.random()*.6);cloud.life=cloud.max=.65+Math.random()*.45;cloud.mesh.rotation.z=Math.random()*Math.PI;cloud.mesh.visibility=0;cloud.mesh.scaling.setAll(cloud.size*.6);cloud.mesh.setEnabled(true);
 }}
 impact(p:Vector3,radius:number,weight=1,scar=true,kind:DebrisKind='stone'){this.burst(p,Math.min(18,5+weight*3),false,6+weight,kind==='metal'?this.glow:this.stone);this.dust(p,Math.min(9,3+Math.floor(weight)),Math.min(2.6,.65+radius*.2),Math.min(3,.6+weight*.35));this.shake=Math.max(this.shake,.1+weight*.055);this.hitPause=Math.max(this.hitPause,.025+Math.min(weight,3)*.012);this.sound.hit(weight,kind==='metal');
 const r=this.rings.find(x=>x.life<=0)||this.rings[0];r.mesh.position.copyFrom(p);r.mesh.position.y+=.08;r.life=.4;r.size=radius;r.mesh.setEnabled(true);
 if(scar){const m=this.scars[this.scarCursor++%this.scars.length];m.position.copyFrom(p);m.position.y+=.035;m.scaling.setAll(radius*.45);m.rotation.z=Math.random()*6;m.setEnabled(true);}
 for(let i=0;i<Math.min(12,weight*3);i++)this.fragment(p.add(new Vector3((Math.random()-.5)*radius,.25,(Math.random()-.5)*radius)),new Vector3((Math.random()-.5)*8,4+Math.random()*7,(Math.random()-.5)*8),.15+Math.random()*.35,false,kind);
 }
 tendril(index:number,a:Vector3,b:Vector3,tension=0){if(index>=this.tendrils.length)return;const d=b.subtract(a),bend=Math.sin(tension*Math.PI)*1.5;const mesh=this.tendrils[index];MeshBuilder.CreateTube('organic tendril',{path:Array.from({length:25},(_,j)=>{const t=j/24,s=Math.sin(t*Math.PI);return a.add(d.scale(t)).add(new Vector3(Math.sin(t*Math.PI*2)*.25*s,bend*s,Math.sin(t*Math.PI*3)*.08*s));}),instance:mesh});mesh.setEnabled(true);}
 seizeBand(index:number,p:Vector3,enabled:boolean){const band=this.seizeBands[index];if(!band)return;band.position.copyFrom(p);band.setEnabled(enabled);}
 hideSeizeBands(){this.seizeBands.forEach(b=>b.setEnabled(false));}
 hideTendrils(){this.tendrils.forEach(t=>t.setEnabled(false));this.hideSeizeBands();}
 step(dt:number){this.signature.step(dt);this.sound.tick(dt);this.shake=Math.max(0,this.shake-dt*1.6);for(const d of this.debris){if(d.life<=0)continue;d.life-=dt;if(d.kind==='tissue'&&!this.gore)d.life=0;if(d.life<=0){if(d.body)this.physics.removeRigidBody(d.body);d.body=null;d.mesh.setEnabled(false);}else if(d.body){const t=d.body.translation();d.mesh.position.set(t.x,t.y,t.z);const q=d.body.rotation();d.mesh.rotationQuaternion!.set(q.x,q.y,q.z,q.w);d.mesh.visibility=Math.min(1,d.life/.85);}}
 for(const cloud of this.dustClouds){if(cloud.life<=0)continue;cloud.life=Math.max(0,cloud.life-dt);const age=1-cloud.life/cloud.max;cloud.mesh.position.addInPlace(cloud.velocity.scale(dt));cloud.velocity.scaleInPlace(Math.exp(-dt*1.4));cloud.mesh.scaling.setAll(cloud.size*(.6+age*1.8));cloud.mesh.visibility=Math.min(1,age*9)*Math.pow(1-age,1.5)*.35;cloud.mesh.setEnabled(cloud.life>0);}
 for(const s of this.sparks){if(s.life<=0)continue;s.life-=dt;s.velocity.y-=20*dt;s.mesh.position.addInPlace(s.velocity.scale(dt));s.mesh.visibility=Math.max(0,s.life/s.max);if(s.blood){s.mesh.lookAt(s.mesh.position.add(s.velocity));if(!this.gore)s.life=0;else if(s.mesh.position.y<=(s.floor??0)+.05){if(this.cursor%3===0)this.bloodStain(s.mesh.position,s.floor??0,.25+Math.random()*.35);s.life=0;}}if(s.life<=0)s.mesh.setEnabled(false);}
 for(const cloud of this.bloodClouds){if(cloud.life<=0)continue;cloud.life-=dt;cloud.mesh.visibility=Math.max(0,cloud.life/cloud.max)*.6;cloud.mesh.scaling.scaleInPlace(1+dt*1.3);cloud.mesh.setEnabled(this.gore&&cloud.life>0);}if(!this.gore)this.bloodStains.forEach(m=>m.setEnabled(false));
 for(const r of this.rings){if(r.life<=0)continue;r.life-=dt;r.mesh.scaling.setAll((1-r.life/.4)*r.size);r.mesh.visibility=Math.max(0,r.life/.4);if(r.life<=0)r.mesh.setEnabled(false);}}
 reset(){this.signature.reset();this.tracers.forEach(m=>m.setEnabled(false));this.bloodStains.forEach(m=>m.setEnabled(false));this.bloodClouds.forEach(c=>{c.life=0;c.mesh.setEnabled(false);});this.dustClouds.forEach(c=>{c.life=0;c.mesh.setEnabled(false);});for(const d of this.debris){if(d.body)this.physics.removeRigidBody(d.body);d.body=null;d.life=0;d.mesh.visibility=1;d.mesh.setEnabled(false);}this.sparks.forEach(s=>{s.life=0;s.mesh.setEnabled(false);});this.rings.forEach(r=>{r.life=0;r.mesh.setEnabled(false);});this.scars.forEach(s=>s.setEnabled(false));this.hideTendrils();this.shake=0;this.hitPause=0;}
}

