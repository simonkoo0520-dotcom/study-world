/* Authenticated host for the existing Liang board. Academic state is never passed in. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.WQUniverse=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
let current=null;
const channel='liang-online-v1';
const games=new Set(['dodge','merge','pulse']);
const serialize=value=>JSON.stringify(value).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
function bootstrap(config){
  const pending=new Map(),listeners=new Set(),earlyMessages=[];let sequence=0;
  window.LiangOnline={initialRaw:config.raw,deadlineMs:config.deadlineMs,
    request(type,payload={}){return new Promise((resolve,reject)=>{const id=++sequence;pending.set(id,{resolve,reject});parent.postMessage({channel:config.channel,nonce:config.nonce,id,type,payload},'*');});},
    onHostMessage(callback){listeners.add(callback);for(const message of earlyMessages.splice(0))callback(message);return()=>listeners.delete(callback);}
  };
  addEventListener('message',event=>{const data=event.data;if(event.source!==parent||data?.channel!==config.channel||data.nonce!==config.nonce)return;
    if(data.reply){const p=pending.get(data.id);if(!p)return;pending.delete(data.id);data.error?p.reject(Object.assign(Error(data.error),{code:data.code})):p.resolve(data.value);}
    else if(listeners.size){for(const callback of listeners)callback(data.message);}
    else if(data.message?.type==='expire'&&!earlyMessages.length)earlyMessages.push(data.message);
  });
}
async function prepare({accountId,buildURL,isCurrent=()=>true}){
  if(!window.WQUniverseStore)throw Error('棋盘存档组件未载入，请刷新页面。');
  const store=await window.WQUniverseStore.open(accountId);
  try{
    const response=await fetch(buildURL,{cache:'no-cache'});if(!response.ok)throw Error('棋盘文件未能下载，请稍后重试。');
    const html=await response.text();if(html.length>12000000||!html.includes('LiangCore')||!/<head\b[^>]*>/i.test(html))throw Error('棋盘文件不完整。');
    const raw=await store.read();if(!isCurrent())throw Error('登录账号或页面已经改变。');
    return{store,raw,html,accountId};
  }catch(error){store.close();throw error;}
}
function mount(container,options){
  stop();
  const {prepared,remainingMs,sessionLimitMs,isCurrent=()=>true}=options;
  const nonce=crypto.randomUUID(),started=Date.now(),mono=performance.now();
  let elapsed=0;
  const remaining=()=>{elapsed=Math.max(elapsed,Date.now()-started,performance.now()-mono);return Math.max(0,remainingMs-elapsed);};
  let stopped=false,expired=false,acknowledged=false,leavePromise=null,expiryWaiters=[],arcade=null,arcadeReturn=null,arcadeOpening=false,pendingSaves=0;
  const seen=new Set();
  container.innerHTML='<section class="universe-host"><div class="universe-host-bar"><div><strong>梁家大富翁 · 游戏宇宙</strong><p>本账号在这台浏览器保存 · 换设备请先导出存档</p></div><strong class="universe-clock" role="timer"></strong></div><p class="universe-host-status" role="status">棋盘与四个游戏站共用本次游戏时间。完成后回到原来的格子。</p><iframe class="universe-frame" title="梁家大富翁棋盘" sandbox="allow-scripts allow-downloads allow-popups allow-popups-to-escape-sandbox"></iframe><div class="universe-arcade" hidden></div></section>';
  const frame=container.querySelector('iframe'),arcadeRoot=container.querySelector('.universe-arcade'),status=container.querySelector('.universe-host-status'),clock=container.querySelector('.universe-clock');
  const live=()=>!stopped&&container.isConnected&&isCurrent();
  const send=message=>{if(live())frame.contentWindow.postMessage({channel,nonce,message},'*');};
  const reply=(data,value,error)=>{if(live())frame.contentWindow.postMessage({channel,nonce,reply:true,id:data.id,value,error:error?.message,code:error?.code},'*');};
  const expirySaved=discarded=>{expired=true;acknowledged=true;status.textContent=discarded?'本次未写入，原档已保留；请保管导出的备份。可以返回大厅。':'游玩已暂停，棋盘进度已保存。可以查看或导出存档，再回大厅选择下一段时间。';expiryWaiters.splice(0).forEach(resolve=>resolve(true));};
  function expire(){if(expired||!live())return;expired=true;status.textContent='本次时间已到，正在保存棋盘进度…';send({type:'expire'});}
  async function launchArcade(payload){
    if(arcade||arcadeOpening||!games.has(payload.game)||typeof payload.sessionToken!=='string')throw Error('游戏会话无效。');
    // Take the gate before the first asynchronous read: a second message must not mount another game.
    arcadeOpening=true;
    try{
    const recovered=await prepared.store.readReceipt(payload.sessionToken);
    if(!live())throw Error('登录账号或页面已经改变。');
    if(recovered){if(recovered.game!==payload.game)throw Error('回执与原游戏不一致。');return recovered;}
    if(payload.recoverOnly===true)return{cancelled:true};
    if(expired||remaining()<=0)throw Error('本次游戏时间已用完，请回大厅。');
    const capacity=await prepared.store.receiptCapacity();
    if(capacity.available<=0)throw Error('尚未归档的游戏记录已满，请先返回原棋盘保存。');
    if(!live())throw Error('登录账号或页面已经改变。');
    if(expired||remaining()<=0)throw Error('本次游戏时间已用完，请回大厅。');
    frame.hidden=true;arcadeRoot.hidden=false;
    return await new Promise((resolve,reject)=>{
      let returned=false;
      const roundLive=()=>!returned&&live();
      async function roundCall(work,code,message){
        let timer;
        const timeout=new Promise((_resolve,reject)=>{timer=setTimeout(()=>reject(Object.assign(Error(message),{code})),15000);});
        try{
          const result=await Promise.race([Promise.resolve().then(()=>{if(!roundLive())throw Error('WQ_ARCADE_VIEW_CHANGED');return work();}),timeout]);
          if(!roundLive())throw Error('WQ_ARCADE_VIEW_CHANGED');
          return result;
        }finally{clearTimeout(timer);}
      }
      const returnToBoard=result=>{if(returned)return;returned=true;if(arcadeReturn===returnToBoard){window.WQGameBreak.stop();arcade=null;arcadeReturn=null;if(live()){arcadeRoot.hidden=true;frame.hidden=false;}}resolve(result||{cancelled:true});};
      arcadeReturn=returnToBoard;
      try{arcade=window.WQGameBreak.mount(arcadeRoot,{remainingMs:remaining(),sessionLimitMs,initialGame:payload.game,
        beginRound:async game=>{if(!roundLive()||expired||remaining()<=0||game!==payload.game)throw Error('WQ_ARCADE_VIEW_CHANGED');return roundCall(()=>options.beginRound(game),'WQ_ARCADE_START_PENDING','开局暂未收到回复，请稍后重试。');},
        finishRound:async(id,trace)=>{if(!roundLive())throw Error('WQ_ARCADE_VIEW_CHANGED');return roundCall(()=>options.finishRound(id,trace),'WQ_ARCADE_SETTLEMENT_PENDING','结算暂未收到回复，请保留本页并重试保存。');},
        onSettled:async receipt=>{if(!roundLive())throw Error('登录账号或页面已经改变。');if(receipt?.game!==payload.game)throw Error('回执与原游戏不一致。');await prepared.store.saveReceipt(payload.sessionToken,receipt);},
        onReturn:({result})=>{if(roundLive())returnToBoard(result);},onExpire:()=>{if(roundLive())expire();}
      });}catch(error){returned=true;arcade=null;arcadeReturn=null;if(live()){frame.hidden=false;arcadeRoot.hidden=true;}reject(error);}
    });
    }finally{arcadeOpening=false;}
  }
  async function receive(event){
    const data=event.data;
    if(!live()||event.source!==frame.contentWindow||data?.channel!==channel||data.nonce!==nonce||!Number.isSafeInteger(data.id)||seen.has(data.id))return;
    seen.add(data.id);
    try{
      let value;
      if(data.type==='save'){
        const {raw,expectedRaw}=data.payload||{};
        pendingSaves++;try{await prepared.store.write(raw,expectedRaw);}finally{pendingSaves--;}value={saved:true};
      }else if(data.type==='arcade')value=await launchArcade(data.payload||{});
      else if(data.type==='arcade-ack'){
        const receipt=await prepared.store.readReceipt(data.payload?.sessionToken);
        if(receipt&&receipt.roundId!==data.payload?.roundId)throw Error('游戏回执编号不一致。');
        if(receipt){
          const saved=JSON.parse(JSON.parse(await prepared.store.read()).current.payload);
          if(!saved.gameResults?.arcade?.some(r=>r.sessionToken===data.payload.sessionToken&&r.roundId===receipt.roundId&&r.game===receipt.game&&r.score===receipt.score))throw Error('棋盘结果尚未保存，结算回执已保留。');
          await prepared.store.clearReceipt(data.payload.sessionToken);
        }value={cleared:true};
      }
      else if(data.type==='expired-saved'){
        const discarded=data.payload?.saved===false&&data.payload?.discarded===true;
        if((data.payload?.saved===false||data.payload?.discarded===true)&&!discarded)throw Error('未保存离开需要先明确确认并导出备份。');
        if((!discarded&&!expired&&remaining()>0)||arcadeOpening||arcade||pendingSaves)throw Error('棋盘尚未完成暂停与保存。');
        expirySaved(discarded);value={saved:!discarded};
      }
      else throw Error('未支持的棋盘操作。');
      reply(data,value);
    }catch(error){reply(data,null,error);if(live())status.textContent='操作尚未完成：'+error.message;}
  }
  addEventListener('message',receive);
  const config={raw:prepared.raw,deadlineMs:Date.now()+remaining(),channel,nonce};
  const script='<script>('+bootstrap.toString()+')('+serialize(config)+');</script>';
  frame.srcdoc=prepared.html.replace(/<head\b[^>]*>/i,match=>match+script);
  const timer=setInterval(()=>{if(!live()){dispose();return;}const seconds=Math.ceil(remaining()/1000);clock.textContent=Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0');if(!seconds)expire();},200);
  function beforeUnload(event){if(live()&&!acknowledged){event.preventDefault();event.returnValue='';}}
  addEventListener('beforeunload',beforeUnload);
  function dispose(){if(stopped)return;stopped=true;clearInterval(timer);removeEventListener('message',receive);removeEventListener('beforeunload',beforeUnload);if(arcade)window.WQGameBreak.stop();arcadeReturn?.({cancelled:true});prepared.store.close();expiryWaiters.splice(0).forEach(resolve=>resolve(false));if(current===controller)current=null;}
  async function prepareLeave(){
    if(!live()||acknowledged)return true;
    if(leavePromise)return leavePromise;
    leavePromise=(async()=>{
      if(arcade){const result=await arcade.requestReturn();if(result===false)return false;}
      if(acknowledged)return true;
      const saved=new Promise(resolve=>{expiryWaiters.push(resolve);setTimeout(()=>{const index=expiryWaiters.indexOf(resolve);if(index>=0){expiryWaiters.splice(index,1);status.textContent='保存还未完成，请留在本页，使用棋盘的重试保存或导出备份。';resolve(false);}},12000);});
      if(!expired)expire();else send({type:'expire'});
      return saved;
    })();
    try{return await leavePromise;}catch(error){if(live())status.textContent='保存还未完成：'+error.message;return false;}finally{leavePromise=null;}
  }
  const controller={stop:dispose,prepareLeave};current=controller;return controller;
}
function stop(){current?.stop();}
async function prepareLeave(){return current?current.prepareLeave():true;}
return{prepare,mount,stop,prepareLeave};
});
