import React, { useState } from 'react';
import type { EventCommand, ProjectBundle } from '../../core/types.js';
import { commandName, commandPreview, createCommand } from './eventCommands.js';
import { MoveRouteModal } from '../modals/MoveRouteModal.js';

export function CommandFields({
  command,
  bundle,
  onChange
}: {
  command: EventCommand;
  bundle: ProjectBundle;
  onChange: (command: EventCommand) => void;
}) {
  const [editingRoute, setEditingRoute] = useState(false);

  const renderFields = () => {
    if(command.type==='text')return <label>Dialogue<textarea value={command.text} onChange={event=>onChange({...command,text:event.target.value})}/></label>;
    if(command.type==='choice')return <><label>Prompt<input value={command.prompt} onChange={event=>onChange({...command,prompt:event.target.value})}/></label><label>Choices, one per line<textarea value={command.choices.map(choice=>choice.text).join('\n')} onChange={event=>{const labels=event.target.value.split('\n');onChange({...command,choices:labels.map((text,index)=>({text,commands:command.choices[index]?.commands??[]}))});}}/></label></>;
    if(command.type==='setSwitch')return <><label>Switch ID<input value={command.id} onChange={event=>onChange({...command,id:event.target.value})}/></label><label>Value<select value={String(command.value)} onChange={event=>onChange({...command,value:event.target.value==='true'})}><option value="true">ON</option><option value="false">OFF</option></select></label></>;
    if(command.type==='setVariable')return <><label>Variable ID<input value={command.id} onChange={event=>onChange({...command,id:event.target.value})}/></label><label>Value<input type="number" value={command.value} onChange={event=>onChange({...command,value:Number(event.target.value)})}/></label></>;
    if(command.type==='giveItem')return <><label>Item<select value={command.itemId} onChange={event=>onChange({...command,itemId:event.target.value})}>{bundle.game.items.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label>Amount<input type="number" min="1" value={command.amount} onChange={event=>onChange({...command,amount:Number(event.target.value)})}/></label></>;
    if(command.type==='transfer')return <><label>Map<select value={command.mapId} onChange={event=>onChange({...command,mapId:event.target.value})}>{bundle.project.maps.map(id=><option key={id} value={id}>{bundle.maps[id].name}</option>)}</select></label><label>X<input type="number" min="0" value={command.x} onChange={event=>onChange({...command,x:Number(event.target.value)})}/></label><label>Y<input type="number" min="0" value={command.y} onChange={event=>onChange({...command,y:Number(event.target.value)})}/></label></>;
    if(command.type==='battle')return <><label>Troop<select value={command.troopId} onChange={event=>onChange({...command,troopId:event.target.value})}>{bundle.game.troops.map(troop=><option key={troop.id} value={troop.id}>{troop.name}</option>)}</select></label><label>Victory switch<input value={command.victorySwitchId??''} placeholder="Optional" onChange={event=>onChange({...command,victorySwitchId:event.target.value||undefined})}/></label></>;
    if(command.type==='questStart'||command.type==='questComplete')return <label>Quest<select value={command.questId} onChange={event=>onChange({...command,questId:event.target.value})}>{(bundle.game.quests??[]).map(quest=><option key={quest.id} value={quest.id}>{quest.name}</option>)}</select></label>;
    if(command.type==='questAdvance')return <><label>Quest<select value={command.questId} onChange={event=>{const quest=bundle.game.quests?.find(item=>item.id===event.target.value);onChange({...command,questId:event.target.value,objectiveId:quest?.objectives[0]?.id??command.objectiveId});}}>{(bundle.game.quests??[]).map(quest=><option key={quest.id} value={quest.id}>{quest.name}</option>)}</select></label><label>Objective<select value={command.objectiveId} onChange={event=>onChange({...command,objectiveId:event.target.value})}>{(bundle.game.quests?.find(quest=>quest.id===command.questId)?.objectives??[]).map(objective=><option key={objective.id} value={objective.id}>{objective.text}</option>)}</select></label><label>Amount<input type="number" min="1" value={command.amount} onChange={event=>onChange({...command,amount:Number(event.target.value)})}/></label></>;
    if(command.type==='shop')return <label>Shop<select value={command.shopId} onChange={event=>onChange({...command,shopId:event.target.value})}>{(bundle.game.shops??[]).map(shop=><option key={shop.id} value={shop.id}>{shop.name}</option>)}</select></label>;
    if(command.type==='inn')return <label>Price<input type="number" min="0" value={command.price} onChange={event=>onChange({...command,price:Number(event.target.value)})}/></label>;
    if(command.type==='setSelfSwitch')return <><label>Self Switch Key<select value={command.key} onChange={e=>onChange({...command,key:e.target.value as 'A'|'B'|'C'|'D'})}><option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option></select></label><label>Value<select value={String(command.value)} onChange={e=>onChange({...command,value:e.target.value==='true'})}><option value="true">ON</option><option value="false">OFF</option></select></label></>;
    if(command.type==='changeGold')return <><label>Operation<select value={command.operation??'add'} onChange={e=>onChange({...command,operation:e.target.value as 'add'|'sub'})}><option value="add">Add (+)</option><option value="sub">Subtract (-)</option></select></label><label>Amount<input type="number" min="0" value={command.amount} onChange={e=>onChange({...command,amount:Number(e.target.value)})}/></label></>;
    if(command.type==='wait')return <label>Frames (60 = 1s)<input type="number" min="1" value={command.frames} onChange={e=>onChange({...command,frames:Number(e.target.value)})}/></label>;
    if(command.type==='label'||command.type==='jumpToLabel')return <label>Label Name<input type="text" value={command.name} onChange={e=>onChange({...command,name:e.target.value})}/></label>;
    if(command.type==='breakLoop'||command.type==='exitEvent')return <p style={{fontSize:'12px',color:'#475569'}}>Perintah ini tidak memerlukan parameter tambahan.</p>;
    if(command.type==='branch')return <>
      <label>Condition Kind<select value={command.condition.kind} onChange={e=>{const kind=e.target.value as typeof command.condition.kind;if(kind==='switch')onChange({...command,condition:{kind,id:'story.flag',value:true}});else if(kind==='variable')onChange({...command,condition:{kind,id:'story.step',op:'>=',value:1}});else if(kind==='selfSwitch')onChange({...command,condition:{kind,key:'A',value:true}});else if(kind==='gold')onChange({...command,condition:{kind,op:'>=',amount:100}});else if(kind==='item')onChange({...command,condition:{kind,itemId:bundle.game.items[0]?.id??'item.missing'}});else if(kind==='actor')onChange({...command,condition:{kind,actorId:bundle.project.party[0]??'actor.missing'}});else onChange({...command,condition:{kind:'script',code:'true'}});}}><option value="switch">Switch</option><option value="variable">Variable</option><option value="selfSwitch">Self Switch</option><option value="item">Item</option><option value="gold">Gold</option><option value="actor">Actor</option><option value="script">Script</option></select></label>
      {command.condition.kind==='switch'&&<><label>Switch ID<input value={command.condition.id} onChange={e=>onChange({...command,condition:{kind:'switch',id:e.target.value,value:(command.condition as {value:boolean}).value}})}/></label><label>Value<select value={String(command.condition.value)} onChange={e=>onChange({...command,condition:{kind:'switch',id:(command.condition as {id:string}).id,value:e.target.value==='true'}})}><option value="true">ON</option><option value="false">OFF</option></select></label></>}
      {command.condition.kind==='variable'&&<><label>Variable ID<input value={command.condition.id} onChange={e=>onChange({...command,condition:{kind:'variable',id:e.target.value,op:(command.condition as {op:any}).op,value:(command.condition as {value:number}).value}})}/></label><label>Operator<select value={command.condition.op} onChange={e=>onChange({...command,condition:{kind:'variable',id:(command.condition as {id:string}).id,op:e.target.value as any,value:(command.condition as {value:number}).value}})}><option value="==">==</option><option value=">=">&gt;=</option><option value="<=">&lt;=</option><option value=">">&gt;</option><option value="<">&lt;</option><option value="!=">!=</option></select></label><label>Value<input type="number" value={command.condition.value} onChange={e=>onChange({...command,condition:{kind:'variable',id:(command.condition as {id:string}).id,op:(command.condition as {op:any}).op,value:Number(e.target.value)}})}/></label></>}
      {command.condition.kind==='selfSwitch'&&<><label>Key<select value={command.condition.key} onChange={e=>onChange({...command,condition:{kind:'selfSwitch',key:e.target.value as 'A'|'B'|'C'|'D',value:true}})}><option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option></select></label><label>Value<select value={String(command.condition.value)} onChange={e=>onChange({...command,condition:{kind:'selfSwitch',key:(command.condition as {key:'A'|'B'|'C'|'D'}).key,value:e.target.value==='true'}})}><option value="true">ON</option><option value="false">OFF</option></select></label></>}
      {command.condition.kind==='gold'&&<><label>Operator<select value={command.condition.op} onChange={e=>onChange({...command,condition:{kind:'gold',op:e.target.value as any,amount:(command.condition as {amount:number}).amount}})}><option value=">=">&gt;=</option><option value="<=">&lt;=</option></select></label><label>Amount<input type="number" min="0" value={command.condition.amount} onChange={e=>onChange({...command,condition:{kind:'gold',op:(command.condition as {op:any}).op,amount:Number(e.target.value)}})}/></label></>}
      {command.condition.kind==='item'&&<label>Item<select value={command.condition.itemId} onChange={e=>onChange({...command,condition:{kind:'item',itemId:e.target.value}})}>{bundle.game.items.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label>}
      {command.condition.kind==='actor'&&<label>Actor<select value={command.condition.actorId} onChange={e=>onChange({...command,condition:{kind:'actor',actorId:e.target.value}})}>{bundle.game.actors.map(actor=><option key={actor.id} value={actor.id}>{actor.name}</option>)}</select></label>}
      {command.condition.kind==='script'&&<label>Script<input value={command.condition.code} onChange={e=>onChange({...command,condition:{kind:'script',code:e.target.value}})}/></label>}
      <div className="mv-subcommands-box">
        <div className="mv-subcommands-header">
          <span>Perintah [THEN] ({command.thenCommands.length})</span>
          <button type="button" className="mv-tab-action" onClick={()=>onChange({...command,thenCommands:[...command.thenCommands,createCommand('text',bundle)]})}>+ Teks</button>
        </div>
        {command.thenCommands.map((tc,idx)=>(
          <div key={idx} style={{display:'flex',gap:'4px',alignItems:'center',marginBottom:'3px'}}>
            <span style={{fontSize:'10px',color:'#64748b',width:'65px'}}>{commandName[tc.type]}</span>
            <span style={{fontSize:'11px',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{commandPreview(tc)}</span>
            <button type="button" className="mv-icon-button mv-delete" onClick={()=>{const n=[...command.thenCommands];n.splice(idx,1);onChange({...command,thenCommands:n});}}>×</button>
          </div>
        ))}
      </div>
      <div className="mv-subcommands-box">
        <div className="mv-subcommands-header">
          <label style={{margin:0,display:'flex',alignItems:'center',gap:'4px'}}>
            <input type="checkbox" checked={command.elseCommands!==undefined} onChange={e=>onChange({...command,elseCommands:e.target.checked?[]:undefined})}/>
            <span>Sediakan Blok [ELSE]</span>
          </label>
          {command.elseCommands!==undefined&&<button type="button" className="mv-tab-action" onClick={()=>onChange({...command,elseCommands:[...(command.elseCommands??[]),createCommand('text',bundle)]})}>+ Teks</button>}
        </div>
        {command.elseCommands?.map((ec,idx)=>(
          <div key={idx} style={{display:'flex',gap:'4px',alignItems:'center',marginBottom:'3px'}}>
            <span style={{fontSize:'10px',color:'#64748b',width:'65px'}}>{commandName[ec.type]}</span>
            <span style={{fontSize:'11px',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{commandPreview(ec)}</span>
            <button type="button" className="mv-icon-button mv-delete" onClick={()=>{const n=[...(command.elseCommands??[])];n.splice(idx,1);onChange({...command,elseCommands:n});}}>×</button>
          </div>
        ))}
      </div>
    </>;
    if(command.type==='loop')return <div className="mv-subcommands-box">
      <div className="mv-subcommands-header">
        <span>Perintah Loop ({command.commands.length})</span>
        <button type="button" className="mv-tab-action" onClick={()=>onChange({...command,commands:[...command.commands,createCommand('wait',bundle)]})}>+ Wait</button>
      </div>
      {command.commands.map((lc,idx)=>(
        <div key={idx} style={{display:'flex',gap:'4px',alignItems:'center',marginBottom:'3px'}}>
          <span style={{fontSize:'10px',color:'#64748b',width:'65px'}}>{commandName[lc.type]}</span>
          <span style={{fontSize:'11px',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{commandPreview(lc)}</span>
          <button type="button" className="mv-icon-button mv-delete" onClick={()=>{const n=[...command.commands];n.splice(idx,1);onChange({...command,commands:n});}}>×</button>
        </div>
      ))}
    </div>;
    if(command.type==='tintScreen')return <><label>Duration (frames)<input type="number" min="0" value={command.duration} onChange={e=>onChange({...command,duration:Number(e.target.value)})}/></label><label>Tone [R,G,B,Gray]<input type="text" value={command.tone.join(',')} onChange={e=>onChange({...command,tone:e.target.value.split(',').map(Number) as [number,number,number,number]})}/></label></>;
    if(command.type==='flashScreen')return <><label>Duration (frames)<input type="number" min="0" value={command.duration} onChange={e=>onChange({...command,duration:Number(e.target.value)})}/></label><label>Color [R,G,B,A]<input type="text" value={command.color.join(',')} onChange={e=>onChange({...command,color:e.target.value.split(',').map(Number) as [number,number,number,number]})}/></label></>;
    if(command.type==='shakeScreen')return <><label>Power (1-9)<input type="number" min="1" max="9" value={command.power} onChange={e=>onChange({...command,power:Number(e.target.value)})}/></label><label>Speed (1-9)<input type="number" min="1" max="9" value={command.speed} onChange={e=>onChange({...command,speed:Number(e.target.value)})}/></label><label>Duration (frames)<input type="number" min="1" value={command.duration} onChange={e=>onChange({...command,duration:Number(e.target.value)})}/></label></>;
    if(command.type==='fadeoutScreen'||command.type==='fadeinScreen')return <label>Duration (frames)<input type="number" min="1" value={command.duration??24} onChange={e=>onChange({...command,duration:Number(e.target.value)})}/></label>;
    if(command.type==='weather')return <><label>Weather<select value={command.weatherType} onChange={e=>onChange({...command,weatherType:e.target.value as typeof command.weatherType})}><option value="none">None</option><option value="rain">Rain</option><option value="storm">Storm</option><option value="snow">Snow</option></select></label><label>Power (1-9)<input type="number" min="1" max="9" value={command.power} onChange={e=>onChange({...command,power:Number(e.target.value)})}/></label><label>Duration (frames)<input type="number" min="1" value={command.duration} onChange={e=>onChange({...command,duration:Number(e.target.value)})}/></label></>;
    if(command.type==='showPicture')return <><label>Picture ID (1-100)<input type="number" min="1" max="100" value={command.picture.id} onChange={e=>onChange({...command,picture:{...command.picture,id:Number(e.target.value)}})}/></label><label>Image Path<input type="text" value={command.picture.path} onChange={e=>onChange({...command,picture:{...command.picture,path:e.target.value}})}/></label><label>X<input type="number" value={command.picture.x} onChange={e=>onChange({...command,picture:{...command.picture,x:Number(e.target.value)}})}/></label><label>Y<input type="number" value={command.picture.y} onChange={e=>onChange({...command,picture:{...command.picture,y:Number(e.target.value)}})}/></label></>;
    if(command.type==='movePicture')return <><label>Picture ID (1-100)<input type="number" min="1" max="100" value={command.id} onChange={e=>onChange({...command,id:Number(e.target.value)})}/></label><label>Duration (frames)<input type="number" min="1" value={command.duration} onChange={e=>onChange({...command,duration:Number(e.target.value)})}/></label><label>X<input type="number" value={command.x} onChange={e=>onChange({...command,x:Number(e.target.value)})}/></label><label>Y<input type="number" value={command.y} onChange={e=>onChange({...command,y:Number(e.target.value)})}/></label></>;
    if(command.type==='erasePicture')return <label>Picture ID (1-100)<input type="number" min="1" max="100" value={command.id} onChange={e=>onChange({...command,id:Number(e.target.value)})}/></label>;
    if(command.type==='showBalloon')return <><label>Target<input type="text" value={command.target} onChange={e=>onChange({...command,target:e.target.value})}/></label><label>Balloon<select value={command.balloon} onChange={e=>onChange({...command,balloon:e.target.value as typeof command.balloon})}><option value="exclamation">!</option><option value="question">?</option><option value="music">Music</option><option value="heart">Heart</option><option value="anger">Anger</option><option value="sweat">Sweat</option><option value="silence">Silence</option><option value="lightbulb">Idea</option><option value="zzz">Zzz</option></select></label></>;
    if(command.type==='showAnimation')return <><label>Target<input type="text" value={command.target} onChange={e=>onChange({...command,target:e.target.value})}/></label><label>Animation ID<input type="text" value={command.animationId} onChange={e=>onChange({...command,animationId:e.target.value})}/></label></>;
    if(command.type==='transparency')return <label>Transparent<select value={String(command.value)} onChange={e=>onChange({...command,value:e.target.value==='true'})}><option value="true">ON (Invisible)</option><option value="false">OFF (Visible)</option></select></label>;
    if(command.type==='playSe'||command.type==='playMe'||command.type==='playBgs')return <><label>Audio Path<input type="text" value={command.path} onChange={e=>onChange({...command,path:e.target.value})}/></label><label>Volume (0-1)<input type="number" min="0" max="1" step="0.1" value={command.volume??1} onChange={e=>onChange({...command,volume:Number(e.target.value)})}/></label></>;
    if(command.type==='stopSe')return <p style={{fontSize:'12px',color:'#475569'}}>Stop all sound effects.</p>;
    if(command.type==='fadeoutBgs')return <label>Duration (seconds)<input type="number" min="0" value={command.seconds} onChange={e=>onChange({...command,seconds:Number(e.target.value)})}/></label>;
    if(command.type==='cutscene')return <><label>Lines, one per line<textarea value={command.lines.join('\n')} onChange={event=>onChange({...command,lines:event.target.value.split('\n')})}/></label><label>VFX<select value={command.vfx??''} onChange={event=>onChange({...command,vfx:(event.target.value||undefined) as 'flash'|'shake'|undefined})}><option value="">None</option><option value="flash">Flash</option><option value="shake">Shake</option></select></label></>;

    // New RPG Maker MZ Commands
    if(command.type==='setMovementRoute')return <>
      <label>Target
        <select value={command.target} onChange={e=>onChange({...command,target:e.target.value})}>
          <option value="player">Player</option>
          <option value="this">This Event</option>
          {bundle.maps[bundle.project.maps[0]]?.events.map(ev=><option key={ev.id} value={ev.id}>{ev.name} ({ev.id})</option>)}
        </select>
      </label>
      <div style={{display:'flex',gap:'8px',alignItems:'center',marginTop:'6px'}}>
        <button type="button" className="mz-btn mz-btn-primary" onClick={()=>setEditingRoute(true)}>
          Edit Route ({command.route.list.length} steps)...
        </button>
        <label style={{display:'flex',flexDirection:'row',alignItems:'center',gap:'4px',margin:0}}>
          <input type="checkbox" checked={command.wait??true} onChange={e=>onChange({...command,wait:e.target.checked})}/>
          <span>Wait for Completion</span>
        </label>
      </div>
      {editingRoute && (
        <MoveRouteModal
          initialRoute={command.route}
          targetName={command.target === 'player' ? 'Player' : 'Event'}
          showWaitOption={true}
          onApply={route=>onChange({...command,route,wait:route.wait})}
          onClose={()=>setEditingRoute(false)}
        />
      )}
    </>;
    if(command.type==='changeHp')return <>
      <label>Target Actor
        <select value={command.actorId??''} onChange={e=>onChange({...command,actorId:e.target.value||undefined})}>
          <option value="">Entire Party</option>
          {bundle.game.actors.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </label>
      <label>Operation
        <select value={command.operation} onChange={e=>onChange({...command,operation:e.target.value as 'add'|'sub'})}>
          <option value="add">Increase (+)</option>
          <option value="sub">Decrease (-)</option>
        </select>
      </label>
      <label>Amount
        <input type="number" min="1" value={command.amount} onChange={e=>onChange({...command,amount:Number(e.target.value)})}/>
      </label>
      <label style={{display:'flex',flexDirection:'row',alignItems:'center',gap:'4px'}}>
        <input type="checkbox" checked={command.allowKnockout??false} onChange={e=>onChange({...command,allowKnockout:e.target.checked})}/>
        <span>Allow Knockout (HP can reach 0)</span>
      </label>
    </>;
    if(command.type==='changeMp')return <>
      <label>Target Actor
        <select value={command.actorId??''} onChange={e=>onChange({...command,actorId:e.target.value||undefined})}>
          <option value="">Entire Party</option>
          {bundle.game.actors.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </label>
      <label>Operation
        <select value={command.operation} onChange={e=>onChange({...command,operation:e.target.value as 'add'|'sub'})}>
          <option value="add">Increase (+)</option>
          <option value="sub">Decrease (-)</option>
        </select>
      </label>
      <label>Amount
        <input type="number" min="1" value={command.amount} onChange={e=>onChange({...command,amount:Number(e.target.value)})}/>
      </label>
    </>;
    if(command.type==='recoverAll')return <>
      <label>Target Actor
        <select value={command.actorId??''} onChange={e=>onChange({...command,actorId:e.target.value||undefined})}>
          <option value="">Entire Party</option>
          {bundle.game.actors.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </label>
      <p style={{fontSize:'12px',color:'#475569'}}>Memulihkan HP dan MP seluruhnya untuk karakter yang dipilih.</p>
    </>;
    if(command.type==='changeLevel')return <>
      <label>Actor
        <select value={command.actorId} onChange={e=>onChange({...command,actorId:e.target.value})}>
          {bundle.game.actors.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </label>
      <label>Operation
        <select value={command.operation} onChange={e=>onChange({...command,operation:e.target.value as 'add'|'sub'})}>
          <option value="add">Increase Level (+)</option>
          <option value="sub">Decrease Level (-)</option>
        </select>
      </label>
      <label>Amount
        <input type="number" min="1" max="98" value={command.amount} onChange={e=>onChange({...command,amount:Number(e.target.value)})}/>
      </label>
    </>;
    if(command.type==='changeExp')return <>
      <label>Actor
        <select value={command.actorId} onChange={e=>onChange({...command,actorId:e.target.value})}>
          {bundle.game.actors.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </label>
      <label>Operation
        <select value={command.operation} onChange={e=>onChange({...command,operation:e.target.value as 'add'|'sub'})}>
          <option value="add">Increase EXP (+)</option>
          <option value="sub">Decrease EXP (-)</option>
        </select>
      </label>
      <label>Amount
        <input type="number" min="1" value={command.amount} onChange={e=>onChange({...command,amount:Number(e.target.value)})}/>
      </label>
    </>;
    if(command.type==='changePartyMember')return <>
      <label>Actor
        <select value={command.actorId} onChange={e=>onChange({...command,actorId:e.target.value})}>
          {bundle.game.actors.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </label>
      <label>Operation
        <select value={command.operation} onChange={e=>onChange({...command,operation:e.target.value as 'add'|'remove'})}>
          <option value="add">Add to Party</option>
          <option value="remove">Remove from Party</option>
        </select>
      </label>
    </>;
    if(command.type==='changeSkill')return <>
      <label>Actor
        <select value={command.actorId} onChange={e=>onChange({...command,actorId:e.target.value})}>
          {bundle.game.actors.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </label>
      <label>Operation
        <select value={command.operation} onChange={e=>onChange({...command,operation:e.target.value as 'learn'|'forget'})}>
          <option value="learn">Learn Skill</option>
          <option value="forget">Forget Skill</option>
        </select>
      </label>
      <label>Skill
        <select value={command.skillId} onChange={e=>onChange({...command,skillId:e.target.value})}>
          {bundle.game.skills.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </label>
    </>;
    if(command.type==='setEventLocation')return <>
      <label>Event ID
        <input type="text" value={command.eventId} onChange={e=>onChange({...command,eventId:e.target.value})}/>
      </label>
      <label>Target X
        <input type="number" min="0" value={command.x} onChange={e=>onChange({...command,x:Number(e.target.value)})}/>
      </label>
      <label>Target Y
        <input type="number" min="0" value={command.y} onChange={e=>onChange({...command,y:Number(e.target.value)})}/>
      </label>
    </>;
    if(command.type==='scrollMap')return <>
      <label>Direction
        <select value={command.direction} onChange={e=>onChange({...command,direction:e.target.value as 'down'|'left'|'right'|'up'})}>
          <option value="down">Down</option>
          <option value="left">Left</option>
          <option value="right">Right</option>
          <option value="up">Up</option>
        </select>
      </label>
      <label>Distance (Tiles)
        <input type="number" min="1" value={command.distance} onChange={e=>onChange({...command,distance:Number(e.target.value)})}/>
      </label>
      <label>Speed (1-6)
        <input type="number" min="1" max="6" value={command.speed} onChange={e=>onChange({...command,speed:Number(e.target.value)})}/>
      </label>
    </>;
    if(command.type==='eraseEvent')return <p style={{fontSize:'12px',color:'#475569'}}>Menghapus sementara event ini dari peta sampai pemain berpindah peta.</p>;
    if(command.type==='gameOver')return <p style={{fontSize:'12px',color:'#475569'}}>Memicu transisi langsung ke layar Game Over.</p>;
    if(command.type==='script')return <label>JavaScript Script<textarea rows={6} value={command.code} onChange={e=>onChange({...command,code:e.target.value})}/></label>;

    return <label>Music mood<select value={command.mood} onChange={event=>onChange({...command,mood:event.target.value as typeof command.mood})}><option value="calm">Calm</option><option value="danger">Danger</option><option value="boss">Boss</option><option value="silence">Silence</option></select></label>;
  };

  return <div className="mz-command-fields">{renderFields()}</div>;
}
