import {Scene,Mesh,InstancedMesh,MeshBuilder,StandardMaterial,Color3,Vector3,DynamicTexture,TransformNode,ShadowGenerator,Quaternion,Texture,Material,Vector4} from '@babylonjs/core';
import RAPIER from '@dimforge/rapier3d-compat/rapier.es.js';
import {Bounds,seeded,clamp} from './rules';
import {placeScan} from './scannedProps';
import {decoMaterials,decoTower} from './deco';
import {upgradeMaterials,dressFacade,dressStreet,makeSedan} from './cityArt';
export type PropKind='car'|'barrier'|'scaffold'|'wall'|'sign'|'tank'|'aircraft'|'rifle'|'launcher';
export interface Prop {id:number;kind:PropKind;root:TransformNode;pos:Vector3;size:Vector3;hp:number;maxHp:number;alive:boolean;body:RAPIER.RigidBody|null;collider:RAPIER.Collider|null;box?:Bounds;origin:Vector3;velocity:Vector3;thrown:boolean;hitIds:Set<number>}
export class City{
 boxes:Bounds[]=[];props:Prop[]=[];staticMeshes:Mesh[]=[];physics:RAPIER.World;random=seeded(714);serial=1;merged:Mesh[]=[];shadow:ShadowGenerator;
 materials:Record<string,Material>={};
 constructor(public scene:Scene,shadow:ShadowGenerator){this.shadow=shadow;this.physics=new RAPIER.World({x:0,y:-28,z:0});this.physics.timestep=1/60;this.makeMaterials();this.build();}
 mat(name:string,hex:string,emit=0){const m=new StandardMaterial(name,this.scene);m.diffuseColor=Color3.FromHexString(hex);m.specularColor=new Color3(.1,.1,.1);m.emissiveColor=m.diffuseColor.scale(emit);this.materials[name]=m;return m;}
 makeMaterials(){
 this.mat('road','#252e33');this.mat('sidewalk','#747572');this.mat('paint','#bab6a5');this.mat('yellow','#d8ad58');this.mat('metal','#303a3c');this.mat('glass','#364e55');this.mat('brick','#705b4d');this.mat('concrete','#7e807c');this.mat('wood','#977451');this.mat('leaf','#495650');this.mat('rubber','#111617');this.mat('light','#ffd4a4',1.2);this.mat('red','#8c3f36');this.mat('blue','#456571');this.mat('white','#a9b0ad');this.mat('tissue','#592e2a');
 const tex=new DynamicTexture('asphalt texture',{width:512,height:512},this.scene,false);const ctx=tex.getContext();ctx.fillStyle='#354046';ctx.fillRect(0,0,512,512);for(let i=0;i<26000;i++){const v=Math.floor(this.random()*35+40);ctx.fillStyle=`rgba(${v},${v+7},${v+9},.35)`;ctx.fillRect(this.random()*512,this.random()*512,1.5,1.5);}tex.update();tex.uScale=tex.vScale=40;(this.materials.road as StandardMaterial).diffuseTexture=tex;
 const asphalt = new Texture('/assets/textures/asphalt_02_diff.jpg',this.scene);asphalt.uScale=asphalt.vScale=110;(this.materials.road as StandardMaterial).diffuseTexture=asphalt;(this.materials.road as StandardMaterial).diffuseColor=new Color3(.72,.72,.72);
 const roadNormal = new Texture('/assets/textures/asphalt_02_nor_gl.jpg',this.scene);roadNormal.uScale=roadNormal.vScale=110;roadNormal.level=.45;(this.materials.road as StandardMaterial).bumpTexture=roadNormal;
 const concrete = new Texture('/assets/textures/concrete_floor_02_diff.jpg',this.scene);concrete.uScale=12;concrete.vScale=11;(this.materials.sidewalk as StandardMaterial).diffuseTexture=concrete;(this.materials.sidewalk as StandardMaterial).diffuseColor=new Color3(.95,.95,.95);
 for(let k=0;k<5;k++){
 const m=this.mat('tower'+k,['#8b8b80','#667477','#a3917c','#657377','#796c60'][k]);const t=new DynamicTexture('facade grid '+k,{width:512,height:1024},this.scene,true);const c=t.getContext();c.fillStyle=['#969b8e','#647b76','#aaa89a','#485f61','#817f6d'][k];c.fillRect(0,0,512,1024);
 for(let y=4;y<1024;y+=40)for(let x=4;x<512;x+=32){const lit=this.random()>.77;c.fillStyle=lit?'#b9a083':this.random()>.4?'#2e424d':'#405661';c.fillRect(x,y,23,29);c.fillStyle=lit?'#ccb596':'#60757b';c.fillRect(x,y,23,2);c.fillStyle='#26343b';c.fillRect(x+11,y,1,29);if(x%64===4){c.fillStyle='#bab8a4';c.fillRect(x-4,y,4,40);c.fillStyle='#655d43';c.fillRect(x-1,y,1,40);}}
 t.update();t.wrapU=t.wrapV=Texture.WRAP_ADDRESSMODE;m.diffuseTexture=t;m.specularColor=new Color3(.22,.24,.25);m.specularPower=40;
 }
 upgradeMaterials(this);decoMaterials(this);
 }
 box(name:string,pos:Vector3,size:Vector3,material:string,parent?:TransformNode,collect=true){const m=MeshBuilder.CreateBox(name,{width:size.x,height:size.y,depth:size.z,faceUV:['brick','concrete'].includes(material)?[new Vector4(0,0,size.x/3,size.y/3),new Vector4(0,0,size.x/3,size.y/3),new Vector4(0,0,size.z/3,size.y/3),new Vector4(0,0,size.z/3,size.y/3),new Vector4(0,0,size.x/3,size.z/3),new Vector4(0,0,size.x/3,size.z/3)]:undefined},this.scene);m.position.copyFrom(pos);m.material=this.materials[material];if(parent)m.parent=parent;else if(collect)this.staticMeshes.push(m);m.receiveShadows=true;return m;}
 fixed(pos:Vector3,size:Vector3,id?:number){const collider=this.physics.createCollider(RAPIER.ColliderDesc.cuboid(size.x/2,size.y/2,size.z/2).setTranslation(pos.x,pos.y,pos.z));const box:Bounds={min:{x:pos.x-size.x/2,y:pos.y-size.y/2,z:pos.z-size.z/2},max:{x:pos.x+size.x/2,y:pos.y+size.y/2,z:pos.z+size.z/2},id,active:true};this.boxes.push(box);return {collider,box};}
 textSign(text:string,pos:Vector3,w:number,h:number,angle=0){const t=new DynamicTexture('sign '+text,{width:512,height:128},this.scene,true);const c=t.getContext();c.fillStyle='#23353a';c.fillRect(0,0,512,128);c.fillStyle='#e5dac2';c.font='bold 45px Arial';(c as CanvasRenderingContext2D).textAlign='center';c.fillText(text,256,79);t.update();const m=new StandardMaterial('sign '+text,this.scene);m.diffuseTexture=t;m.emissiveColor=new Color3(.15,.15,.13);const mesh=MeshBuilder.CreatePlane('sign',{width:w,height:h,sideOrientation:Mesh.DOUBLESIDE},this.scene);mesh.position.copyFrom(pos);mesh.rotation.y=angle;mesh.material=m;this.staticMeshes.push(mesh);}
 build(){
 this.box('Manhattan street grid',new Vector3(0,-.3,0),new Vector3(660,.6,660),'road');this.physics.createCollider(RAPIER.ColliderDesc.cuboid(330,.5,330).setTranslation(0,-.5,0));
 for(const x of [-150,0,150])for(let z=-295;z<300;z+=10){this.box('lane divider',new Vector3(x-.16,.012,z),new Vector3(.12,.02,5),'yellow');this.box('lane divider',new Vector3(x+.16,.012,z),new Vector3(.12,.02,5),'yellow');}
 for(const z of [-280,-140,0,140,280])for(let x=-280;x<285;x+=14)this.box('cross street lane',new Vector3(x,.015,z),new Vector3(6,.02,.13),'paint');
 for(const x of [-150,0,150])for(const z of [-280,-140,0,140,280])for(let i=-4;i<=4;i++){this.box('crosswalk',new Vector3(x+i*2,.025,z+13),new Vector3(1.1,.025,4),'paint');this.box('crosswalk',new Vector3(x+i*2,.025,z-13),new Vector3(1.1,.025,4),'paint');}
 for(const bx of [-75,75])for(const bz of [-210,-70,70,210]){
 this.box('city block',new Vector3(bx,.1,bz),new Vector3(120,.2,110),'sidewalk');
 for(const dx of [-29,29])for(const dz of [-26,26]){
  if(bx===75&&bz===-70&&dx===-29&&dz===26)continue;
  const x=bx+dx,z=bz+dz,w=42+this.random()*8,d=38+this.random()*7,h=25+this.random()*85;
  this.box('tower core',new Vector3(x,h/2+.2,z),new Vector3(w,h,d),'tower'+Math.floor(this.random()*5));this.fixed(new Vector3(x,h/2+.2,z),new Vector3(w,h,d));dressFacade(this,x,z,w,d,h);decoTower(this,x,z,w,d,h);
  this.box('roof coping',new Vector3(x,h+.5,z),new Vector3(w+1,.8,d+1),'concrete');
  this.box('rooftop machinery',new Vector3(x+5,h+2,z+4),new Vector3(7,3,6),'metal');
  this.box('roof railing',new Vector3(x,h+1,z-d/2),new Vector3(w,.8,.16),'metal');
  if(this.random()>.4){const tank=MeshBuilder.CreateCylinder('water tower',{diameter:4,height:5,tessellation:10},this.scene);tank.position.set(x-8,h+6,z-4);tank.material=this.materials.wood;this.staticMeshes.push(tank);for(const a of [-1,1])for(const b of [-1,1])this.box('water tower leg',new Vector3(x-8+a*1.5,h+1.8,z-4+b*1.5),new Vector3(.18,4,.18),'metal');}
  const streetSide=x>0?-1:1;this.box('storefront',new Vector3(x+streetSide*(w/2+.05),2.3,z),new Vector3(.15,3.8,d-4),'glass');
  this.box('awning',new Vector3(x+streetSide*(w/2+.8),4.5,z),new Vector3(2,.2,d-3),'metal');
 }
 }
 this.textSign('MIDTOWN  /  WEST',new Vector3(18,5,-19),10,2,Math.PI/2);
 this.textSign('HUDSON MARKET',new Vector3(-18,5,-40),11,1.4,Math.PI/2);
 this.textSign('WEST 38 ST',new Vector3(-11,6,13),6,1,0);
 this.textSign('METAMORPH  //  NYC',new Vector3(24,16,38),18,5,Math.PI);
 // Distant skyline is cheap merged geometry; close structures retain physical cores.
 for(let i=0;i<55;i++){const a=this.random()*Math.PI*2,r=350+this.random()*180,h=30+this.random()*140;this.box('skyline',new Vector3(Math.sin(a)*r,h/2,Math.cos(a)*r),new Vector3(18+this.random()*25,h,18+this.random()*25),'tower'+(i%5));}
 for(const x of [-12,12])for(let z=-270;z<280;z+=34){this.box('lamp post',new Vector3(x,3.4,z),new Vector3(.15,6.8,.15),'metal');this.box('lamp arm',new Vector3(x-Math.sign(x),6.8,z),new Vector3(2,.15,.15),'metal');this.box('lamp',new Vector3(x-Math.sign(x)*1.8,6.72,z),new Vector3(.8,.12,.4),'light');}
 for(let i=0;i<26;i++)this.addProp('car',new Vector3(i%2?9:-9,.6,-253+i*20));
 for(let i=0;i<18;i++)this.addProp('barrier',new Vector3((i%2?1:-1)*(7+(i%3)),.6,18+Math.floor(i/2)*5));
 for(let i=0;i<8;i++){this.addProp('scaffold',new Vector3(17,.2,-50+i*5));this.addProp('sign',new Vector3(-13,.2,-105+i*27));}
 for(let i=0;i<8;i++)this.addProp('wall',new Vector3(24+i*3,1.8,-30));
 this.addProp('tank',new Vector3(0,1,85));this.addProp('aircraft',new Vector3(-6,9,110));
 this.addProp('rifle',new Vector3(-5,.7,-19));this.addProp('launcher',new Vector3(5,.7,-19));
 dressStreet(this);this.merge();this.physics.step();
 }
 addProp(kind:PropKind,pos:Vector3){
 const root=new TransformNode(kind,this.scene);root.position.copyFrom(pos);const size=kind==='car'?new Vector3(2,1.4,4.7):kind==='tank'?new Vector3(3.4,2.3,5.6):kind==='aircraft'?new Vector3(4,2,6):kind==='wall'?new Vector3(2.8,3.5,.5):kind==='scaffold'?new Vector3(3,5,4.8):kind==='barrier'?new Vector3(2,.9,.7):new Vector3(.7,1.4,.5);
 const b=(p:Vector3,s:Vector3,m:string)=>this.box(kind,p,s,m,root,false);
 if(kind==='car'){placeScan(this.scene,Math.abs(pos.z)<65&&this.props.length%2===1?'concept_car':'covered_car',root,2.1,1.7,4.7,-.6);}
 else if(['tank','aircraft'].includes(kind)){
 const color='metal';b(new Vector3(0,.05,0),new Vector3(size.x,.65,size.z),color);b(new Vector3(0,.64,-.3),new Vector3(size.x*.84,.72,size.z*.48),'glass');
 if(kind==='tank'){b(new Vector3(0,1.1,0),new Vector3(2,1.1,2.1),'metal');b(new Vector3(0,1.2,2.5),new Vector3(.25,.25,4),'metal');for(const x of [-1.5,1.5])b(new Vector3(x,-.3,0),new Vector3(.6,.8,5.8),'rubber');}
 if(kind==='aircraft'){b(new Vector3(0,0,-4),new Vector3(.4,.4,5),'metal');b(new Vector3(0,1.5,0),new Vector3(10,.1,.25),'metal');b(new Vector3(0,1.5,0),new Vector3(.25,.1,10),'metal');}
 }else if(kind==='scaffold'){
 for(const x of [-1.4,1.4])for(const z of [-2.3,2.3])b(new Vector3(x,2.5,z),new Vector3(.13,5,.13),'metal');b(new Vector3(0,4.6,0),new Vector3(3,.18,4.8),'wood');b(new Vector3(0,3.4,2.3),new Vector3(3,.12,.12),'metal');
 }else if(kind==='sign'){b(new Vector3(0,1.5,0),new Vector3(.1,3,.1),'metal');b(new Vector3(0,2.8,0),new Vector3(1.3,.7,.1),'yellow');}
 else if(kind==='rifle'||kind==='launcher'){b(new Vector3(0,0,0),new Vector3(.25,.24,1.4),'metal');if(kind==='launcher')b(new Vector3(0,0,.1),new Vector3(.45,.45,1.6),'red');}
 else b(Vector3.Zero(),size,kind==='wall'?'brick':'concrete');
 const hp=kind==='tank'?400:kind==='aircraft'?210:kind==='car'?110:kind==='wall'?65:35;
 const p:Prop={id:this.serial++,kind,root,pos:root.position,size,hp,maxHp:hp,alive:true,body:null,collider:null,origin:pos.clone(),velocity:Vector3.Zero(),thrown:false,hitIds:new Set()};
 if(!['aircraft','sign','rifle','launcher'].includes(kind)){if(kind==='scaffold'){const r=this.fixed(pos.add(new Vector3(0,4.6,0)),new Vector3(3,.18,4.8),p.id);p.collider=r.collider;p.box=r.box;}else{const r=this.fixed(pos,size,p.id);p.collider=r.collider;p.box=r.box;}}
 // Batch the rigid parts of each independently movable prop by material.
 const groups=new Map<unknown,Mesh[]>();for(const m of root.getChildMeshes()){if(m.name.startsWith('scan/')||!(m instanceof Mesh)||!m.getVerticesData('position')||m.getTotalVertices()===0)continue;const key=String(m.material?.uniqueId)+':'+(m as Mesh).getVerticesDataKinds().sort().join(',');const list=groups.get(key)||[];list.push(m as Mesh);groups.set(key,list);}for(const list of groups.values())if(list.length>1){const merged=Mesh.MergeMeshes(list,true,true);if(merged)merged.setParent(root);}
 root.getChildMeshes().forEach(m=>{if(m instanceof InstancedMesh)m.sourceMesh.receiveShadows=true;else m.receiveShadows=true;this.shadow.addShadowCaster(m);});this.props.push(p);return p;
 }
 merge(){const groups=new Map<unknown,Mesh[]>();for(const m of this.staticMeshes){const list=groups.get(m.material)||[];list.push(m);groups.set(m.material,list);}for(const meshes of groups.values()){const m=Mesh.MergeMeshes(meshes,true,true,undefined,false,false);if(m){m.freezeWorldMatrix();m.receiveShadows=true;this.shadow.addShadowCaster(m);this.merged.push(m);}}this.staticMeshes=[];}
 detach(p:Prop){if(p.collider){this.physics.removeCollider(p.collider,true);p.collider=null;}if(p.box)p.box.active=false;}
 launch(p:Prop,velocity:Vector3){this.detach(p);if(p.body)this.physics.removeRigidBody(p.body);p.body=this.physics.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(p.pos.x,p.pos.y,p.pos.z).setLinvel(velocity.x,velocity.y,velocity.z).setCcdEnabled(true).setAngularDamping(.6));this.physics.createCollider(RAPIER.ColliderDesc.cuboid(p.size.x/2,p.size.y/2,p.size.z/2).setMass(p.kind==='car'?500:30).setRestitution(.15),p.body);p.thrown=true;p.hitIds.clear();}
 sync(){for(const p of this.props)if(p.body&&p.alive){const t=p.body.translation();p.pos.set(t.x,t.y,t.z);const q=p.body.rotation();p.root.rotationQuaternion=new Quaternion(q.x,q.y,q.z,q.w);const v=p.body.linvel();p.velocity.set(v.x,v.y,v.z);if(p.pos.y< -30){this.destroy(p);}}}
 destroy(p:Prop){p.alive=false;p.root.setEnabled(false);this.detach(p);if(p.body){this.physics.removeRigidBody(p.body);p.body=null;}}
 reset(){for(const p of this.props){this.detach(p);if(p.body){this.physics.removeRigidBody(p.body);p.body=null;}p.root.position.copyFrom(p.origin);p.root.rotationQuaternion=null;p.root.rotation.setAll(0);p.alive=true;p.hp=p.maxHp;p.thrown=false;p.root.setEnabled(true);if(p.box){p.box.active=true;const size=p.kind==='scaffold'?new Vector3(3,.18,4.8):p.size;const pos=p.kind==='scaffold'?p.origin.add(new Vector3(0,4.6,0)):p.origin;p.collider=this.physics.createCollider(RAPIER.ColliderDesc.cuboid(size.x/2,size.y/2,size.z/2).setTranslation(pos.x,pos.y,pos.z));}}this.physics.step();}
}

