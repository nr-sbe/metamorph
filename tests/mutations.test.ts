import test from 'node:test';
import assert from 'node:assert/strict';
import {NullEngine,Scene,TransformNode,VertexBuffer} from '@babylonjs/core';
import {MutationArt} from '../src/mutations';
import {FORMS} from '../src/rules';

test('articulated Whipfist has normalized weights and releases its skeleton on form changes',()=>{
 const engine=new NullEngine(),scene=new Scene(engine),art=new MutationArt(scene),arms=[new TransformNode('left',scene),new TransformNode('right',scene)];
 const materials=scene.materials.length;
 for(let cycle=0;cycle<3;cycle++)for(const form of FORMS){
  const meshes=art.create(form,arms,true);
  for(const mesh of meshes){
   for(const kind of [VertexBuffer.PositionKind,VertexBuffer.NormalKind])assert.ok(mesh.getVerticesData(kind)!.every(Number.isFinite),`${form} ${kind}`);
   assert.ok(mesh.getTotalVertices()<65536);
  }
  if(form==='Whipfist'){
   assert.equal(meshes.length,4);assert.equal(scene.skeletons.length,1);
   for(const m of meshes){const w=m.getVerticesData(VertexBuffer.MatricesWeightsKind)!;for(let i=0;i<w.length;i+=4)assert.ok(Math.abs(w[i]+w[i+1]+w[i+2]+w[i+3]-1)<1e-6);}
   art.animate(10,0,0);const first=art.bones[5].getLocalMatrix().clone();art.animate(11,.5,0);assert.notDeepEqual(art.bones[5].getLocalMatrix().asArray(),first.asArray());
  }else assert.equal(scene.skeletons.length,0);
  meshes.forEach(m=>m.dispose());assert.equal(scene.materials.length,materials);
 }
 art.dispose();assert.equal(scene.skeletons.length,0);scene.dispose();engine.dispose();
});
