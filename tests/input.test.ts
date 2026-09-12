import test from 'node:test';
import assert from 'node:assert/strict';
import {keyboardCommand,mouseCommand,stick,padCommands} from '../src/input';
test('combat, shield, wheel and interaction bindings stay distinct across devices',()=>{
 assert.equal(keyboardCommand('Tab'),'KeyQ');assert.equal(keyboardCommand('KeyQ'),'Block');
 assert.equal(mouseCommand(1),'KeyT');assert.equal(mouseCommand(3),'KeyC');
 assert.equal(padCommands[5],'Mouse0');assert.equal(padCommands[7],'Mouse2');
 assert.equal(padCommands[3],'KeyF');assert.equal(padCommands[2],'KeyE');
 assert.equal(padCommands[4],'Block');assert.equal(padCommands[6],'KeyQ');
});
test('radial stick deadzone prevents drift without turning partial input into full speed',()=>{
 assert.deepEqual(stick(.1,.05),{x:0,y:0});const half=stick(.5,0);assert.ok(half.x>0&&half.x<.5);assert.equal(half.y,0);
 const diagonal=stick(1,1);assert.ok(Math.abs(Math.hypot(diagonal.x,diagonal.y)-1)<1e-9);
});
