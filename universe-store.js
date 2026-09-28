/* Account-isolated local Liang Universe storage. No cloud, automatic import or localStorage writes. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(root);
  else root.WQUniverseStore=factory(root);
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
  'use strict';
  const KEY='liang_universe_save',DB_NAME='liang_universe_accounts',STORE='saves',RECEIPTS='receipts',DB_VERSION=2;
  const MAX_BYTES=32*1024*1024;
  const MAX_RECEIPTS=1000,MAX_RECEIPT_BYTES=64*1024;
  function problem(code,message,cause){
    const error=new Error(message);
    error.code=code;
    if(cause){error.cause=cause;if(typeof cause.name==='string')error.name=cause.name;}
    return error;
  }
  function account(value){
    if(typeof value!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value))
      throw problem('INVALID_ACCOUNT','学生账号无效，不能打开游戏存档。');
    return value.toLowerCase();
  }
  function rawSave(raw){
    if(typeof raw!=='string')throw problem('INVALID_SAVE','游戏存档必须是 JSON 字符串。');
    if(raw.length>MAX_BYTES||new TextEncoder().encode(raw).byteLength>MAX_BYTES)
      throw problem('SAVE_TOO_LARGE','游戏存档超过 32 MiB，请先导出备份再检查存档。');
    let parsed;
    try{parsed=JSON.parse(raw);}catch(cause){throw problem('INVALID_SAVE','游戏存档不是有效的 JSON。',cause);}
    if(!parsed||typeof parsed!=='object'||Array.isArray(parsed)||parsed.format!=='LIANG_UNIVERSE')
      throw problem('INVALID_SAVE','这不是梁家游戏宇宙存档。');
    return raw;
  }
  function storedRaw(record,owner){
    if(record===undefined)return null;
    if(!record||record.accountId!==owner||record.key!==KEY||record.formatVersion!==1)
      throw problem('INVALID_RECORD','这个账号的本机游戏存档资料不完整，原记录已保留。');
    return rawSave(record.raw);
  }
  function storageProblem(cause){
    return problem(cause?.name==='QuotaExceededError'?'QUOTA_EXCEEDED':cause?.name==='AbortError'?'TRANSACTION_ABORTED':'STORAGE_FAILED',
      cause?.name==='QuotaExceededError'?'本机存储空间不足，原游戏存档已保留。':'游戏存档未能保存或读取，原记录已保留，请重试。',cause);
  }
  function session(value){
    if(typeof value!=='string'||value.length<1||value.length>160||!/^[A-Za-z0-9:_-]+$/.test(value))
      throw problem('INVALID_SESSION','游戏回执的会话标记无效。');
    return value;
  }
  function receiptData(value){
    let text,copy;
    try{text=JSON.stringify(value);if(typeof text!=='string')throw Error('Missing receipt');}
    catch(cause){throw problem('INVALID_RECEIPT','游戏回执不是有效的 JSON 资料。',cause);}
    if(text.length>MAX_RECEIPT_BYTES||new TextEncoder().encode(text).byteLength>MAX_RECEIPT_BYTES)
      throw problem('RECEIPT_TOO_LARGE','游戏回执超过 64 KiB，现有回执已保留。');
    copy=JSON.parse(text);
    if(!copy||typeof copy!=='object'||Array.isArray(copy)||typeof copy.roundId!=='string'||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(copy.roundId)||
      !['dodge','merge','pulse'].includes(copy.game)||!Number.isSafeInteger(copy.score)||copy.score<0||copy.score>2147483647)
      throw problem('INVALID_RECEIPT','游戏回执缺少有效的局号、玩法或分数。');
    function canonical(item){
      if(Array.isArray(item))return '['+item.map(canonical).join(',')+']';
      if(item&&typeof item==='object')return '{'+Object.keys(item).sort().map(key=>JSON.stringify(key)+':'+canonical(item[key])).join(',')+'}';
      return JSON.stringify(item);
    }
    try{return {raw:canonical(copy),value:copy};}
    catch(cause){throw problem('INVALID_RECEIPT','游戏回执结构过于复杂，现有回执已保留。',cause);}
  }
  function checksum(text){
    let value=-1;
    for(const byte of new TextEncoder().encode(text)){value^=byte;for(let bit=0;bit<8;bit++)value=(value>>>1)^((value&1)?0xedb88320:0);}
    return ((value^-1)>>>0).toString(16).padStart(8,'0');
  }
  const whole=(value,max)=>Number.isSafeInteger(value)&&value>=0&&value<=max;
  const object=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
  const identity=value=>typeof value==='string'&&value.length>0&&value.length<100;
  function proofState(raw){
    // Do not infer commitment from a damaged current save or its fallback snapshot.
    try{
      const core=root.WQUniverseCore;
      if(core?.KEY!==KEY||typeof core.validate!=='function'||!Number.isSafeInteger(core.MAX_PAYLOAD)||core.MAX_PAYLOAD<1||typeof raw!=='string'||raw.length>core.MAX_PAYLOAD*2+1000)return null;
      const envelope=JSON.parse(raw),packed=envelope?.current;
      if(envelope?.format!=='LIANG_UNIVERSE'||typeof packed?.payload!=='string'||packed.payload.length>core.MAX_PAYLOAD||packed.checksum!==checksum(packed.payload))return null;
      const state=JSON.parse(packed.payload);
      if(state?.schemaVersion!==core.SCHEMA||!identity(state.universeId)||!whole(state.revision,1e12)||!object(state.arcadeClaims)||!Array.isArray(state.gameResults?.arcade))return null;
      if(core.SCHEMA!==state.schemaVersion)return null;
      core.validate(state);
      return state;
    }catch{return null;}
  }
  function captureLineage(state,token,receipt){
    const active=state?.activeSession;
    if(!active||active.gameId!=='arcade'||active.token!==token||active.arcadeGame!==receipt.game||!whole(active.learnerSlot,2)||typeof active.boardId!=='string'||!whole(active.turnNo,1e9)||typeof active.returnSnapshotHash!=='string')return null;
    if(active.returnSnapshotHash!==checksum(JSON.stringify(active.returnSnapshot)))return null;
    return {universeId:state.universeId,learnerSlot:active.learnerSlot,boardId:active.boardId,turnNo:active.turnNo,returnSnapshotHash:active.returnSnapshotHash};
  }
  function committedReceipt(state,token,receipt,lineage){
    if(!state)return false;
    // An imported earlier snapshot can restore this active token while retaining
    // its claim. Resume must still consume the receipt, not start a paid new round.
    if(state.activeSession?.token===token)return false;
    const claim=state.arcadeClaims[receipt.roundId];
    if(!object(claim)||claim.roundId!==receipt.roundId||claim.sessionToken!==token||claim.game!==receipt.game||claim.score!==receipt.score||(claim.rank??null)!==(receipt.rank??null)||!whole(claim.learnerSlot,2)||typeof claim.boardId!=='string'||claim.boardId.length>=100||!whole(claim.turnNo,1e9)||!whole(claim.at,1e15))return false;
    if(claim.rank!=null&&(!whole(claim.rank,1e9)||claim.rank<1))return false;
    const results=state.gameResults.arcade.filter(result=>result?.roundId===receipt.roundId);
    if(results.length>1)return false;
    if(results.length===1){
      const fields=['roundId','sessionToken','game','score','rank','learnerSlot','boardId','turnNo','at'];
      if(fields.some(key=>(results[0][key]??null)!==(claim[key]??null)))return false;
    }
    // Same-universe imports deliberately retain claims while rolling back visible
    // score history. A matching tombstone is durable commitment, not a new award.
    if(lineage!==undefined&&lineage!==null){
      if(!object(lineage)||lineage.universeId!==state.universeId||lineage.learnerSlot!==claim.learnerSlot||lineage.boardId!==claim.boardId||lineage.turnNo!==claim.turnNo||typeof lineage.returnSnapshotHash!=='string')return false;
      const returned=state.settlements?.returns?.[token];
      if(returned&&returned.snapshotHash!==lineage.returnSnapshotHash)return false;
    }
    return true;
  }
  async function open(accountId){
    const owner=account(accountId);
    if(!root.indexedDB||typeof root.indexedDB.open!=='function')throw problem('INDEXEDDB_UNAVAILABLE','此浏览器不能使用本机游戏存档。');
    const db=await new Promise((resolve,reject)=>{
      let request,settled=false;
      const fail=error=>{if(!settled){settled=true;reject(error);}};
      try{request=root.indexedDB.open(DB_NAME,DB_VERSION);}catch(cause){fail(storageProblem(cause));return;}
      request.onupgradeneeded=()=>{
        try{
          if(!request.result.objectStoreNames.contains(STORE))request.result.createObjectStore(STORE,{keyPath:'accountId'});
          const receipts=request.result.objectStoreNames.contains(RECEIPTS)?request.transaction.objectStore(RECEIPTS):request.result.createObjectStore(RECEIPTS,{keyPath:['accountId','sessionToken']});
          if(!receipts.indexNames.contains('byAccount'))receipts.createIndex('byAccount','accountId',{unique:false});
        }
        catch(cause){fail(storageProblem(cause));try{request.transaction.abort();}catch{}}
      };
      request.onblocked=()=>fail(problem('STORAGE_BLOCKED','其他页面正在使用游戏存档，请关闭旧游戏页面后重试。'));
      request.onerror=()=>fail(storageProblem(request.error));
      request.onsuccess=()=>{
        const connection=request.result;
        if(settled){connection.close();return;}
        try{
          if(!connection.objectStoreNames.contains(STORE)||connection.transaction(STORE,'readonly').objectStore(STORE).keyPath!=='accountId')
            throw problem('INVALID_DATABASE','本机游戏存档结构不兼容，原记录已保留。');
          if(!connection.objectStoreNames.contains(RECEIPTS))throw problem('INVALID_DATABASE','本机游戏回执结构不兼容，原记录已保留。');
          const receipts=connection.transaction(RECEIPTS,'readonly').objectStore(RECEIPTS);
          if(JSON.stringify(receipts.keyPath)!=='["accountId","sessionToken"]'||!receipts.indexNames.contains('byAccount')||receipts.index('byAccount').keyPath!=='accountId')
            throw problem('INVALID_DATABASE','本机游戏回执结构不兼容，原记录已保留。');
          settled=true;resolve(connection);
        }catch(error){connection.close();fail(error);}
      };
    });
    let closed=false;
    const close=()=>{if(!closed){closed=true;db.close();}};
    db.onversionchange=close;
    db.onclose=()=>{closed=true;};
    function transact(next,expected,write){
      return new Promise((resolve,reject)=>{
        if(closed){reject(problem('STORE_CLOSED','这个游戏存档连接已关闭，请重新进入游戏。'));return;}
        let transaction,request,result,failure=null;
        const abort=error=>{failure=error;try{transaction.abort();}catch{reject(error);}};
        try{
          transaction=db.transaction(STORE,write?'readwrite':'readonly');
          transaction.oncomplete=()=>resolve(write?undefined:result);
          transaction.onabort=()=>reject(failure||storageProblem(transaction.error||{name:'AbortError'}));
          transaction.onerror=()=>{failure=failure||storageProblem(transaction.error);};
          const objectStore=transaction.objectStore(STORE);
          request=objectStore.get(owner);
          request.onerror=()=>{failure=storageProblem(request.error);};
          request.onsuccess=()=>{
            try{
              result=storedRaw(request.result,owner);
              if(!write)return;
              // Comparison and replacement occur in the SAME readwrite transaction.
              // IndexedDB serializes this scope across tabs, including first writes.
              if(result!==expected){abort(problem('CONFLICT','另一页面已更新这个账号的游戏存档，请重新读取后继续。'));return;}
              const put=objectStore.put({accountId:owner,key:KEY,formatVersion:1,raw:next,updatedAt:Date.now()});
              put.onerror=()=>{failure=storageProblem(put.error);};
            }catch(error){abort(typeof error?.code==='string'?error:storageProblem(error));}
          };
        }catch(error){if(transaction)abort(storageProblem(error));else reject(storageProblem(error));}
      });
    }
    function receiptTransaction(mode,operation,includeSave=false){
      return new Promise((resolve,reject)=>{
        if(closed){reject(problem('STORE_CLOSED','这个游戏存档连接已关闭，请重新进入游戏。'));return;}
        let transaction,result,failure=null;
        const abort=error=>{failure=typeof error?.code==='string'?error:storageProblem(error);try{transaction.abort();}catch{reject(failure);}};
        const watch=(request,handler)=>{
          request.onerror=()=>{failure=storageProblem(request.error);};
          request.onsuccess=()=>{try{handler(request.result);}catch(error){abort(error);}};
        };
        try{
          transaction=db.transaction(includeSave?[STORE,RECEIPTS]:RECEIPTS,mode);
          transaction.oncomplete=()=>resolve(result);
          transaction.onabort=()=>reject(failure||storageProblem(transaction.error||{name:'AbortError'}));
          transaction.onerror=()=>{failure=failure||storageProblem(transaction.error);};
          operation(transaction.objectStore(RECEIPTS),watch,value=>{result=value;},includeSave?transaction.objectStore(STORE):null);
        }catch(error){if(transaction)abort(error);else reject(storageProblem(error));}
      });
    }
    function storedReceipt(record,token){
      if(record===undefined)return null;
      if(!record||record.accountId!==owner||record.sessionToken!==token||record.formatVersion!==1||typeof record.receipt!=='string')
        throw problem('INVALID_RECEIPT_RECORD','本机游戏回执资料不完整，原记录已保留。');
      try{return receiptData(JSON.parse(record.receipt));}
      catch(cause){throw problem('INVALID_RECEIPT_RECORD','本机游戏回执资料不完整，原记录已保留。',cause);}
    }
    return Object.freeze({
      read:()=>transact(undefined,undefined,false),
      write:async(raw,expectedRaw)=>{
        rawSave(raw);
        if(expectedRaw!==null)rawSave(expectedRaw);
        return transact(raw,expectedRaw,true);
      },
      receiptCapacity:()=>receiptTransaction('readonly',(store,watch,done)=>watch(store.index('byAccount').count(owner),count=>done({count,limit:MAX_RECEIPTS,available:Math.max(0,MAX_RECEIPTS-count)}))),
      saveReceipt:async(sessionToken,receipt)=>{
        const token=session(sessionToken),data=receiptData(receipt);
        return receiptTransaction('readwrite',(store,watch,done,saves)=>watch(store.get([owner,token]),record=>{
          const prior=storedReceipt(record,token);
          if(prior){if(prior.raw!==data.raw)throw problem('RECEIPT_CONFLICT','这个游戏会话已有不同的结算回执，原回执已保留。');done();return;}
          watch(store.index('byAccount').count(owner),count=>{
            if(count>=MAX_RECEIPTS)throw problem('RECEIPTS_FULL','未确认的游戏回执已满，请先保存已有游戏结果再开始新一局。');
            watch(saves.get(owner),saved=>{
              const lineage=captureLineage(proofState(storedRaw(saved,owner)),token,data.value);
              watch(store.add({accountId:owner,sessionToken:token,formatVersion:1,receipt:data.raw,lineage,createdAt:Date.now()}),()=>done());
            });
          });
        }),true);
      },
      readReceipt:async sessionToken=>{
        const token=session(sessionToken);
        return receiptTransaction('readonly',(store,watch,done)=>watch(store.get([owner,token]),record=>done(storedReceipt(record,token)?.value??null)));
      },
      clearReceipt:async sessionToken=>{
        const token=session(sessionToken);
        // Only the host should call this, AFTER the matching board result commits.
        return receiptTransaction('readwrite',(store,watch,done)=>watch(store.delete([owner,token]),()=>done()));
      },
      acknowledgeReceipt:async(sessionToken,roundId)=>{
        const token=session(sessionToken);
        return receiptTransaction('readwrite',(store,watch,done,saves)=>watch(store.get([owner,token]),record=>{
          const receipt=storedReceipt(record,token)?.value;
          if(!receipt){done({cleared:false,missing:true});return;}
          if(receipt.roundId!==roundId)throw problem('RECEIPT_MISMATCH','游戏回执编号不一致。');
          watch(saves.get(owner),saved=>{
            if(!committedReceipt(proofState(storedRaw(saved,owner)),token,receipt,record.lineage))throw problem('RECEIPT_NOT_COMMITTED','棋盘结果尚未保存或回执不一致，结算回执已保留。');
            watch(store.delete([owner,token]),()=>done({cleared:true,missing:false}));
          });
        }),true);
      },
      reconcileReceipts:()=>receiptTransaction('readwrite',(store,watch,done,saves)=>watch(saves.get(owner),saved=>{
        const state=proofState(storedRaw(saved,owner));
        watch(store.index('byAccount').getAll(owner),records=>{
          let cleared=0,pending=0;
          for(const record of records){
            let receipt;
            try{receipt=storedReceipt(record,record.sessionToken)?.value;}catch{continue;}
            if(!committedReceipt(state,record.sessionToken,receipt,record.lineage))continue;
            pending++;watch(store.delete([owner,record.sessionToken]),()=>{cleared++;if(!--pending)done({cleared,preserved:records.length-cleared});});
          }
          if(!pending)done({cleared:0,preserved:records.length});
        });
      }),true),
      close
    });
  }
  function readLegacy(){
    try{return root.localStorage?.getItem(KEY)??null;}
    catch(cause){throw problem('LEGACY_UNAVAILABLE','无法读取原来的本机游戏存档；旧档未作任何修改。',cause);}
  }
  return Object.freeze({KEY,DB_NAME,MAX_BYTES,MAX_RECEIPTS,MAX_RECEIPT_BYTES,open,readLegacy});
});
