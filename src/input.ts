/** Public bindings map to stable simulation commands. */
export function keyboardCommand(code:string){
 return ({Tab:'KeyQ',KeyQ:'Block',ShiftRight:'ShiftLeft',ControlRight:'ControlLeft'} as Record<string,string>)[code]??code;
}
export function mouseCommand(button:number){return ({0:'Mouse0',1:'KeyT',2:'Mouse2',3:'KeyC',4:'KeyF'} as Record<number,string>)[button];}
export function stick(x:number,y:number,deadzone=.17){
 const length=Math.hypot(x,y);if(length<=deadzone)return {x:0,y:0};
 const scale=Math.min(1,(length-deadzone)/(1-deadzone))/length;
 return {x:x*scale,y:y*scale};
}
export const padCommands:Record<number,string>={0:'Space',1:'KeyC',2:'KeyE',3:'KeyF',4:'Block',5:'Mouse0',6:'KeyQ',7:'Mouse2',11:'KeyT',12:'KeyR',13:'KeyX'};
