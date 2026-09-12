import test from 'node:test';
import assert from 'node:assert/strict';
import {Mesh,NullEngine,Scene,Vector3} from '@babylonjs/core';
import RAPIER from '@dimforge/rapier3d-compat/rapier.es.js';
import {DebrisArt,DEBRIS_KINDS,fragmentShape} from '../src/debrisArt';
import {Effects} from '../src/fx';

test('material-specific fracture silhouettes have finite nondegenerate geometry',()=>{
 for(const kind of DEBRIS_KINDS)for(let variant=0;variant<3;variant++){
  const {data,half}=fragmentShape(kind,variant),p=Array.from(data.positions!),indices=Array.from(data.indices!);
  assert.ok(p.length/3<256,kind+' stays inexpensive');assert.ok(p.every(Number.isFinite));assert.ok(Array.from(data.normals!).every(Number.isFinite));assert.ok(half.every(n=>n>0));
  for(let i=0;i<indices.length;i+=3){const a=Vector3.FromArray(p,indices[i]*3),b=Vector3.FromArray(p,indices[i+1]*3),c=Vector3.FromArray(p,indices[i+2]*3);assert.ok(Vector3.Cross(b.subtract(a),c.subtract(a)).lengthSquared()>1e-12,`${kind} triangle ${i/3}`);}
  assert.notDeepEqual(p,Array.from(fragmentShape(kind,(variant+1)%3).data.positions!));
  if(kind==='stone')assert.ok(data.normals![1]>0,'upper fractured face points upward');
  if(kind==='tissue'||kind==='spike'){
   const n=Array.from(data.normals!),start=3*8,center=[0,0,0];for(let i=0;i<8;i++)for(let axis=0;axis<3;axis++)center[axis]+=p[(start+i)*3+axis]/8;
   for(let i=0;i<8;i++){const vertex=(start+i)*3;assert.ok((p[vertex]-center[0])*n[vertex]+(p[vertex+2]-center[2])*n[vertex+2]>0,kind+' normals point outward');}
  }
 }
 const metal=fragmentShape('metal'),glass=fragmentShape('glass'),wood=fragmentShape('wood'),spike=fragmentShape('spike');
 assert.ok(metal.half[1]<metal.half[0]);assert.ok(glass.half[1]<.02);assert.ok(wood.half[1]>wood.half[0]*5);assert.ok(spike.half[1]>spike.half[0]*3);
});

test('shared fracture geometry swaps without allocating and releases its assets',()=>{
 const engine=new NullEngine(),scene=new Scene(engine);scene.defaultMaterial;
 const materials=scene.materials.length,art=new DebrisArt(scene),mesh=new Mesh('fragment',scene),geometries=scene.geometries.length;
 for(let i=0;i<120;i++)art.apply(mesh,DEBRIS_KINDS[i%6],i);
 assert.equal(scene.geometries.length,geometries);assert.equal(scene.meshes.length,1);
 mesh.dispose();art.dispose();assert.equal(scene.geometries.length,0);assert.equal(scene.materials.length,materials);
 assert.equal(scene.textures.filter(t=>t.name.startsWith('/assets/')).length,0,'owned textures released; Babylon retains its shared BRDF lookup');scene.dispose();engine.dispose();
});

test('fragment, dust and physics pools stay bounded; gore-off suppresses tissue but keeps organic spikes',async()=>{
 await RAPIER.init();const engine=new NullEngine(),scene=new Scene(engine),physics=new RAPIER.World({x:0,y:-28,z:0}),fx=new Effects(scene,physics);
 const meshes=scene.meshes.length,geometries=scene.geometries.length,materials=scene.materials.length,p=new Vector3(0,2,0),v=new Vector3(1,4,0);
 fx.gore=false;fx.fragment(p,v,.3,true);fx.fragment(p,v,.3,false,'tissue');assert.equal(physics.bodies.len(),0);
 fx.fragment(p,v,.3,false,'spike');assert.equal(physics.bodies.len(),1);assert.equal(fx.debris.find(d=>d.life>0)?.kind,'spike');fx.reset();
 fx.gore=true;fx.fragment(p,v,.3,true);assert.equal(physics.bodies.len(),1);fx.gore=false;fx.step(1/60);assert.equal(physics.bodies.len(),0);
 fx.gore=true;
 for(let i=0;i<400;i++){fx.fragment(p,v,.3,false,DEBRIS_KINDS[i%6]);fx.dust(p);}
 assert.equal(physics.bodies.len(),96);assert.equal(fx.debris.length,96);assert.equal(fx.dustClouds.length,32);assert.equal(scene.meshes.length,meshes);assert.equal(scene.geometries.length,geometries);assert.equal(scene.materials.length,materials);
 for(const d of fx.debris)d.life=.4;fx.step(.1);assert.ok(fx.debris.every(d=>d.mesh.visibility<.5));
 fx.step(10);assert.equal(physics.bodies.len(),0);assert.ok(fx.debris.every(d=>!d.mesh.isEnabled()));assert.ok(fx.dustClouds.every(d=>!d.mesh.isEnabled()));
 fx.fragment(p,v);fx.dust(p);fx.reset();assert.equal(physics.bodies.len(),0);assert.ok(fx.dustClouds.every(d=>d.life===0&&!d.mesh.isEnabled()));
 scene.dispose();physics.free();engine.dispose();
});
