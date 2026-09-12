/** Normalize a thumbstick without making diagonal movement faster. */
export function touchVector(x:number,y:number,radius=54){
 const length=Math.hypot(x,y), dead=radius*.12;
 if(length<=dead)return {x:0,y:0};
 const scale=Math.min(1,(length-dead)/(radius-dead))/length;
 return {x:x*scale,y:y*scale};
}
/** Each finger owns its command until release/cancel, even outside the button. */
export class TouchCommands {
 private pointers=new Map<number,string>();
 constructor(private down:(code:string)=>void,private up:(code:string,cancelled:boolean)=>void){}
 start(id:number,code:string){if(this.pointers.has(id))return;const held=[...this.pointers.values()].includes(code);this.pointers.set(id,code);if(!held)this.down(code);}
 end(id:number,cancelled=false){const code=this.pointers.get(id);if(!code)return;this.pointers.delete(id);if(![...this.pointers.values()].includes(code))this.up(code,cancelled);}
 clear(){for(const id of [...this.pointers.keys()])this.end(id,true);}
 get size(){return this.pointers.size;}
}
