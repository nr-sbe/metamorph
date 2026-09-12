import test from 'node:test';
import assert from 'node:assert/strict';
import {touchVector,TouchCommands} from '../src/touchInput';

test('thumbstick has a neutral deadzone, analog range and bounded diagonals',()=>{
 assert.deepEqual(touchVector(2,-2),{x:0,y:0});
 const half=touchVector(0,-28);assert.ok(half.y<-.4&&half.y>-.6);
 const diagonal=touchVector(1000,-1000);assert.ok(Math.abs(Math.hypot(diagonal.x,diagonal.y)-1)<1e-9);assert.ok(diagonal.x>0&&diagonal.y<0);
});
test('multiple fingers can charge, jump and defend independently',()=>{
 const events:string[]=[];const c=new TouchCommands(k=>events.push('down '+k),(k,cancel)=>events.push((cancel?'cancel ':'up ')+k));
 c.start(1,'Mouse0');c.start(2,'Space');c.start(3,'Block');c.end(2);c.end(1);c.end(3);
 assert.deepEqual(events,['down Mouse0','down Space','down Block','up Space','up Mouse0','up Block']);assert.equal(c.size,0);
});
test('second finger on the same attack cannot release or trigger it twice',()=>{
 const events:string[]=[];const c=new TouchCommands(k=>events.push('down '+k),(k)=>events.push('up '+k));
 c.start(1,'Mouse0');c.start(1,'Mouse2');c.start(2,'Mouse0');c.end(1);assert.deepEqual(events,['down Mouse0']);c.end(2);c.end(2);assert.deepEqual(events,['down Mouse0','up Mouse0']);
});
test('cancel, pause and orientation reset discard holds without normal release attacks',()=>{
 const events:string[]=[];const c=new TouchCommands(()=>{},(k,cancel)=>events.push(k+':'+cancel));
 c.start(10,'Mouse0');c.start(11,'Space');c.start(12,'Block');c.end(10,true);c.clear();c.clear();c.end(11);assert.equal(c.size,0);assert.deepEqual(events,['Mouse0:true','Space:true','Block:true']);
});
