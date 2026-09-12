import {Color3,InstancedMesh,Mesh,MeshBuilder,Quaternion,Matrix,StandardMaterial,Vector3,VertexData} from '@babylonjs/core';
import type {Effects} from './fx';
import type {SpecialKind} from './specialRules';
type Pulse={mesh:InstancedMesh;time:number;duration:number;origin:Vector3;size:number;kind:'faultline'|'aftershock'|'trail'};
/** Cosmetic motion uses shared geometry, not additional rigid bodies. */
export class SignatureFx{
 spikes:Pulse[]=[];slabs:Pulse[]=[];trails:Pulse[]=[];private cursor=0;private lastSound=new Map<string,number>();private noise:AudioBuffer|null=null;events=0;
 constructor(public fx:Effects){
  const scene=fx.scene,slab=new Mesh('signature asphalt source',scene);
  const branches:Mesh[]=[];
  const grow=(points:Vector3[],radius:number)=>{const m=MeshBuilder.CreateTube('organic fault barb',{path:points,radiusFunction:i=>radius*Math.pow(1-i/(points.length-1),.7)+.003,tessellation:12,cap:Mesh.CAP_ALL},scene);m.material=fx.tendrilMaterial;branches.push(m);};
  for(let stalk=0;stalk<3;stalk++)grow(Array.from({length:12},(_,i)=>{const t=i/11;return new Vector3((stalk-1)*.13+Math.sin(t*2.5+stalk)*t*t*.32,t*(stalk===1?2.8:2.4),Math.sin(t*5+stalk)*.09);}),stalk===1?.19:.115);
  for(const side of [-1,1])grow(Array.from({length:9},(_,i)=>{const t=i/8;return new Vector3(side*(.04+Math.sin(t*Math.PI*.55)*.62),.65+t*1.4,Math.sin(t*3)*.1);}),.13);
  for(const side of [-1,1])grow(Array.from({length:7},(_,i)=>{const t=i/6;return new Vector3(side*(1-t)*.65,t*.7,Math.sin(t*Math.PI)*.12);}),.11);
  const spike=Mesh.MergeMeshes(branches,true,true)!;spike.name='branching organic fault source';spike.bakeTransformIntoVertices(Matrix.Translation(0,-1.32,0));
  fx.debrisArt.apply(slab,'stone',2);spike.isVisible=slab.isVisible=false;
  const ribbon=new Mesh('signature cutting ribbon source',scene),data=new VertexData(),positions:number[]=[],indices:number[]=[],normals:number[]=[];
  for(let i=0;i<=16;i++){const t=i/16,a=(t-.5)*Math.PI*1.3;for(const r of [1.1,1.1+Math.sin(t*Math.PI)*.16])positions.push(Math.sin(a)*r,Math.cos(a)*r,0);if(i<16){const j=i*2;indices.push(j,j+1,j+2,j+1,j+3,j+2);}}
  VertexData.ComputeNormals(positions,indices,normals);data.positions=positions;data.indices=indices;data.normals=normals;data.applyToMesh(ribbon);
  const material=new StandardMaterial('brief green blade wake',scene);material.diffuseColor=new Color3(.18,.4,.23);material.emissiveColor=new Color3(.06,.2,.07);material.alpha=.6;material.backFaceCulling=false;ribbon.material=material;ribbon.isVisible=false;
  const pool=(source:Mesh,n:number,kind:Pulse['kind'])=>Array.from({length:n},(_,i)=>{const mesh=source.createInstance(kind+' '+i);mesh.isPickable=false;mesh.setEnabled(false);return {mesh,time:10,duration:1,origin:Vector3.Zero(),size:1,kind};});
  this.spikes=pool(spike,36,'faultline');this.slabs=pool(slab,24,'aftershock');this.trails=pool(ribbon,8,'trail');
 }
 wave(kind:'faultline'|'aftershock',p:Vector3,seed:number,size:number){
  const pool=kind==='faultline'?this.spikes:this.slabs,pulse=pool.find(p=>p.time>=p.duration)||pool[this.cursor++%pool.length];
  pulse.origin.copyFrom(p);pulse.time=0;pulse.duration=kind==='faultline'?.72:.6;pulse.size=size*(.85+(seed%5)*.08);pulse.mesh.rotation.set(0,seed*1.72,0);pulse.mesh.setEnabled(true);
  if(kind==='faultline'){this.fx.fragment(p.add(new Vector3(0,.2,0)),new Vector3(Math.sin(seed)*2,4,Math.cos(seed)*2),.22,false,'stone');}
 }
 trail(p:Vector3,yaw:number){const pulse=this.trails[this.cursor++%this.trails.length];pulse.origin.copyFrom(p);pulse.mesh.position.copyFrom(p);pulse.mesh.rotation.set(.35,yaw,.4);pulse.mesh.scaling.set(1.4,2.1,1);pulse.time=0;pulse.duration=.14;pulse.mesh.setEnabled(true);}
 incision(p:Vector3,yaw:number){const scar=this.fx.scars[this.fx.scarCursor++%this.fx.scars.length];scar.position.copyFrom(p);scar.position.y+=.045;scar.rotation.set(Math.PI/2,0,-yaw);scar.scaling.set(.55,2,1);scar.setEnabled(true);this.fx.dust(p,1,.6,.4);}
 rush(p:Vector3,yaw:number,time:number){if(Math.floor(time*30)%6===0)this.fx.dust(p,1,.35,.4);}
 step(dt:number){
  for(const pool of [this.spikes,this.slabs,this.trails])for(const p of pool){if(p.time>=p.duration)continue;p.time+=dt;const t=Math.min(1,p.time/p.duration);p.mesh.setEnabled(t<1);
   if(p.kind==='trail'){p.mesh.scaling.x=1.4*(1-t);continue;}
   const height=t<.18?Math.sin(t/.18*Math.PI/2):t<.55?1:Math.pow((1-t)/.45,1.5);p.mesh.position.copyFrom(p.origin);
   if(p.kind==='faultline'){p.mesh.scaling.set(p.size*.65,p.size*height,p.size*.65);p.mesh.position.y+=p.size*1.32*height-.08;p.mesh.rotation.z=Math.sin(t*9)*.12*height;}
   else{p.mesh.scaling.set(2,1.5,1.8);p.mesh.position.y+=height*.85;p.mesh.rotation.x=height*.45;p.mesh.rotation.z=Math.sin(p.origin.x)*height*.25;}
   if(t>.8)p.mesh.scaling.scaleInPlace(Math.max(.01,(1-t)*5));
  }
 }
 reset(){for(const pool of [this.spikes,this.slabs,this.trails])for(const p of pool){p.time=p.duration;p.mesh.setEnabled(false);}this.lastSound.clear();}
 sound(kind:SpecialKind,phase:string){
  const audio=this.fx.sound,c=audio.ctx;if(!c||audio.muted)return;const key=kind+phase,now=c.currentTime;if(now-(this.lastSound.get(key)??-10)<.09)return;this.lastSound.set(key,now);this.events++;
  const impact=['impact','contact','wall','throw','metal'].includes(phase),pitch={faultline:110,guillotine:260,aftershock:48,ram:85}[kind];
  audio.duckTime=impact?.35:.12;
  if(impact)audio.sample(kind==='aftershock'||phase==='metal'?'impactMetal_heavy':'impactPunch_heavy',phase==='contact'?.4:.9);
  if(kind==='faultline'&&(phase==='travel'||phase==='impact'))audio.sample('impactWood_heavy',.35);
  if(!this.noise){this.noise=c.createBuffer(1,c.sampleRate*.6,c.sampleRate);const d=this.noise.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,2);}
  const noise=c.createBufferSource(),filter=c.createBiquadFilter(),gain=c.createGain();noise.buffer=this.noise;filter.type=kind==='guillotine'?'bandpass':'lowpass';filter.frequency.value=kind==='faultline'?1400:kind==='guillotine'?2600:kind==='ram'?600:350;gain.gain.setValueAtTime(impact?.45:.15,now);gain.gain.exponentialRampToValueAtTime(.001,now+.38);noise.connect(filter);filter.connect(gain);gain.connect(audio.master!);noise.start();noise.onended=()=>{noise.disconnect();filter.disconnect();gain.disconnect();};
  const tone=c.createOscillator(),volume=c.createGain();tone.type=kind==='guillotine'?'triangle':'sine';tone.frequency.setValueAtTime(pitch,now);tone.frequency.exponentialRampToValueAtTime(impact?25:pitch*2.3,now+.25);volume.gain.setValueAtTime(impact?.35:.08,now);volume.gain.exponentialRampToValueAtTime(.001,now+.45);tone.connect(volume);volume.connect(audio.master!);tone.start();tone.stop(now+.46);tone.onended=()=>{tone.disconnect();volume.disconnect();};
 }
}
