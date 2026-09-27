/* Liang Universe v0.3: compatible learning saves and verified arcade receipts. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.WQUniverseCore=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const KEY='liang_universe_save',SCHEMA=3,MAX_PAYLOAD=16000000;
const ARCADE=['dodge','merge','pulse'];
const CHARS={fox:'梁弟弟',owl:'梁姐姐',turtle:'梁妹妹'};
const KEYS=['wordquest.local.v3.sjkc','wordquest.local.v2.sjkc','wordquest.local.v1','wordquest.academy.v5'];
const clone=v=>JSON.parse(JSON.stringify(v));
const uid=()=>globalThis.crypto?.randomUUID?.()||'u'+Date.now().toString(36)+Math.random().toString(36).slice(2);
function assert(v,m){if(!v)throw Error(m);}
function integer(n,min,max){return Number.isSafeInteger(n)&&n>=min&&n<=max;}
function obj(x){return !!x&&typeof x==='object'&&!Array.isArray(x);}
function textId(x,max=120){return typeof x==='string'&&x.length>0&&x.length<max&&/^[a-zA-Z0-9:-]+$/.test(x);}
function crc(s){let c=-1;for(const b of new TextEncoder().encode(s)){c^=b;for(let k=0;k<8;k++)c=(c>>>1)^((c&1)?0xedb88320:0);}return((c^-1)>>>0).toString(16).padStart(8,'0');}
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const claimKey=r=>'wq:'+r.slot+':'+r.id;
function blankAdditions(){return{settlements:{runs:{},returns:{}},transactions:[],learning:{wordquest:{outcomes:[]}},gameResults:{board:[],wordquest:[],arcade:[]},arcadeClaims:{},migrations:[],migrationArchive:null};}
function fresh(){return{schemaVersion:SCHEMA,universeId:uid(),revision:0,updatedAt:Date.now(),shared:{snacks:0,battery:100,inventory:{},bonds:{fox:0,owl:0,turtle:0}},games:{wordquest:{storage:{},completedRuns:0}},board:null,activeSession:null,claims:{},journal:[],settings:{name:'梁家共享档案'},...blankAdditions()};}
function validateBoard(b){
 if(b===null)return;
 assert(obj(b)&&typeof b.id==='string'&&b.id.length>0&&b.id.length<100&&Array.isArray(b.players)&&b.players.length>=1&&b.players.length<=3,'棋盘存档不完整。');
 assert(b.players.every(p=>obj(p)&&typeof p.name==='string'&&p.name.length<=18&&Object.hasOwn(CHARS,p.character)&&integer(p.position,0,30)&&integer(p.learnerSlot,0,2)),'棋子资料无效。');
 assert(new Set(b.players.map(p=>p.learnerSlot)).size===b.players.length,'棋子学习档案槽不能重复。');
 assert(integer(b.turn,0,b.players.length-1)&&integer(b.turnNo,1,1e9)&&integer(b.dice,0,6),'回合资料无效。');
 assert(['roll','landed','finished'].includes(b.phase),'回合阶段无效。');
 assert(b.winner===null||integer(b.winner,0,b.players.length-1),'终点结果无效。');
 assert(b.phase==='finished'?(b.winner!==null&&b.players[b.winner].position===30):b.winner===null,'终点结算不完整。');
}
function validateBase(s){
 assert(obj(s),'存档结构无效。');
 if(![1,2,SCHEMA].includes(s.schemaVersion)){const e=Error('存档版本不支持，未覆盖现有资料。');e.code='UNSUPPORTED_SCHEMA';throw e;}
 assert(typeof s.universeId==='string'&&s.universeId.length<100&&s.universeId.length>0,'存档身份不完整。');
 assert(integer(s.revision,0,1e12)&&integer(s.updatedAt,0,1e15),'存档版本或时间损坏。');
 assert(obj(s.shared)&&integer(s.shared.snacks,0,1e9)&&integer(s.shared.battery,0,100),'共享资源数量无效。');
 assert(obj(s.shared.inventory)&&Object.entries(s.shared.inventory).every(([k,v])=>/^[a-z0-9_]{1,50}$/.test(k)&&integer(v,0,1e8)),'物品清单无效。');
 assert(obj(s.shared.bonds)&&Object.keys(CHARS).every(k=>integer(s.shared.bonds[k],0,1e9)),'角色羁绊无效。');
 assert(obj(s.games)&&obj(s.games.wordquest)&&obj(s.games.wordquest.storage)&&integer(s.games.wordquest.completedRuns,0,1e9),'学习游戏存档结构无效。');
 assert(Object.entries(s.games.wordquest.storage).every(([k,v])=>KEYS.includes(k)&&typeof v==='string'&&v.length<=2500000),'旧游戏存档键或大小无效。');
 assert(obj(s.claims)&&Object.entries(s.claims).every(([k,v])=>/^wq:[0-2]:/.test(k)&&k.length<250&&v===true),'结算凭证无效。');
 assert(Array.isArray(s.journal)&&s.journal.length<=80&&s.journal.every(e=>obj(e)&&typeof e.text==='string'&&e.text.length<=300&&integer(e.at,0,1e15)),'记录格式无效。');
 assert(obj(s.settings)&&typeof s.settings.name==='string','档案设置无效。');
 validateBoard(s.board);
 if(s.activeSession){const a=s.activeSession;assert(obj(a)&&(a.gameId==='wordquest'||s.schemaVersion===3&&a.gameId==='arcade'&&ARCADE.includes(a.arcadeGame))&&textId(a.token,100)&&integer(a.learnerSlot,0,2)&&typeof a.boardId==='string'&&integer(a.turnNo,0,1e9),'未结束会话无效。');}
}
function runDescriptor(r){
 assert(obj(r)&&textId(r.id)&&integer(r.slot,0,2),'结算编号或学习档案槽无效。');
 assert(['adventure','review','test'].includes(r.kind)&&Object.hasOwn(CHARS,r.pet),'未支持的结算类型。');
 assert(Array.isArray(r.ids)&&r.ids.length>=1&&r.ids.length<=20&&r.ids.every(x=>typeof x==='string'&&x.length>0&&x.length<100)&&new Set(r.ids).size===r.ids.length,'题目清单无效。');
 return r;
}
function eventValue(e){return{uid:e.uid,qid:e.qid,at:e.at,correct:e.correct,hinted:e.hinted,independent:e.independent,source:e.source,response:e.response,first:e.first};}
function validateEvent(e,r,index){
 assert(obj(e)&&e.uid===r.id+':'+index&&e.qid===r.ids[index]&&e.source===r.kind,'提交记录与开始时的题目不一致。');
 assert(integer(e.at,r.startedAt,1e15)&&typeof e.correct==='boolean'&&typeof e.hinted==='boolean'&&typeof e.independent==='boolean'&&e.independent===(e.correct&&!e.hinted),'提交记录的时间或作答结果无效。');
 assert(typeof e.response==='string'&&e.response.length<=1000&&typeof e.first==='boolean','提交记录的答案无效。');
 assert(r.kind!=='test'||!e.hinted,'无提示小测不能含提示作答。');
}
function validate(s){
 validateBase(s);assert(s.schemaVersion===SCHEMA,'请先迁移旧版存档。');
 assert(obj(s.settlements)&&obj(s.settlements.runs)&&obj(s.settlements.returns),'会话凭证记录缺失。');
 for(const [key,r] of Object.entries(s.settlements.runs)){
  runDescriptor(r);assert(key===claimKey(r)&&integer(r.startedAt,0,1e15)&&textId(r.originSession,100)&&(r.sessionToken===null||textId(r.sessionToken,100)),'开始凭证无效。');
  assert(['started','settled','invalidated','abandoned'].includes(r.status)&&obj(r.accepted),'开始凭证状态无效。');
  for(const [i,e] of Object.entries(r.accepted)){assert(/^(0|[1-9][0-9]*)$/.test(i)&&integer(Number(i),0,r.ids.length-1),'提交顺序无效。');validateEvent(e,r,Number(i));}
  if(r.characterChanges!==undefined){assert(Array.isArray(r.characterChanges)&&r.characterChanges.every((c,i)=>obj(c)&&Object.hasOwn(CHARS,c.from)&&Object.hasOwn(CHARS,c.to)&&integer(c.at,0,1e15)&&(i===0||r.characterChanges[i-1].to===c.from)),'伙伴更换记录无效。');assert(!r.characterChanges.length||r.characterChanges.at(-1).to===r.pet,'当前伙伴与更换记录不一致。');}
  if(r.status==='settled')assert(s.claims[key]===true&&Object.keys(r.accepted).length===r.ids.length,'已结算凭证缺少作答或领取记录。');
 }
 for(const [token,r] of Object.entries(s.settlements.returns)){assert(textId(token,100)&&obj(r)&&integer(r.at,0,1e15)&&typeof r.snapshotHash==='string','返回凭证无效。');}
 assert(Array.isArray(s.transactions)&&s.transactions.every(t=>obj(t)&&typeof t.id==='string'&&t.type==='prototype-learning-reward'&&t.source==='wordquest'&&integer(t.at,0,1e15)&&s.claims[t.claim]===true&&integer(t.learnerSlot,0,2)&&textId(t.sessionToken,100)&&t.resources?.snacks===5&&Object.hasOwn(CHARS,t.bond?.character)&&t.bond.amount===1),'资源交易记录无效。');
 assert(new Set(s.transactions.map(t=>t.id)).size===s.transactions.length&&new Set(s.transactions.map(t=>t.claim)).size===s.transactions.length&&s.transactions.every(t=>t.id===t.claim),'资源交易编号或领取凭证重复。');
 assert(obj(s.learning)&&obj(s.learning.wordquest)&&Array.isArray(s.learning.wordquest.outcomes),'学习结果记录缺失。');
 for(const r of s.learning.wordquest.outcomes){assert(obj(r)&&typeof r.claim==='string'&&s.claims[r.claim]===true&&integer(r.learnerSlot,0,2)&&integer(r.total,1,20)&&integer(r.independent,0,r.total)&&integer(r.correct,0,r.total)&&integer(r.hinted,0,r.total)&&r.independent<=r.correct&&integer(r.at,0,1e15),'学习结果记录无效。');}
 assert(new Set(s.learning.wordquest.outcomes.map(r=>r.claim)).size===s.learning.wordquest.outcomes.length,'学习结果编号重复。');
 assert(obj(s.gameResults)&&Array.isArray(s.gameResults.board)&&Array.isArray(s.gameResults.wordquest)&&Array.isArray(s.migrations),'游戏结果或迁移记录缺失。');
 assert(obj(s.arcadeClaims)&&Array.isArray(s.gameResults.arcade),'街机结果与领取记录缺失。');
 for(const r of s.gameResults.arcade){validateArcadeReceipt(r);assert(integer(r.at,0,1e15)&&textId(r.sessionToken,100)&&integer(r.learnerSlot,0,2)&&typeof r.boardId==='string'&&integer(r.turnNo,0,1e9)&&equal(s.arcadeClaims[r.roundId],r),'街机结果凭证无效。');}
 assert(new Set(s.gameResults.arcade.map(r=>r.roundId)).size===s.gameResults.arcade.length,'街机回执重复。');
 for(const [id,r] of Object.entries(s.arcadeClaims)){validateArcadeReceipt(r);assert(id===r.roundId&&textId(r.sessionToken,100),'街机去重凭证无效。');}
 if(s.migrationArchive!==null){const a=s.migrationArchive;assert(obj(a)&&[1,2].includes(a.schemaVersion)&&typeof a.payload==='string'&&a.payload.length<=MAX_PAYLOAD&&a.checksum===crc(a.payload),'升级前备份校验失败。');const original=JSON.parse(a.payload);assert(original.schemaVersion===a.schemaVersion,'升级前备份版本无效。');validateBase(original);}
 if(s.activeSession){const a=s.activeSession;assert(Object.hasOwn(a,'returnSnapshot')&&typeof a.returnSnapshotHash==='string'&&a.returnSnapshotHash===crc(JSON.stringify(a.returnSnapshot)),'返回位置凭证损坏。');validateBoard(a.returnSnapshot);assert(equal(a.returnSnapshot,s.board),'棋盘位置在小游戏期间发生变化，拒绝写入。');assert(a.boardId===(s.board?.id||'')&&a.turnNo===(s.board?.turnNo||0),'返回回合与会话不一致。');assert(a.runKey===null||typeof a.runKey==='string'&&s.settlements.runs[a.runKey]?.sessionToken===a.token,'当前学习轮次凭证无效。');}
 return clone(s);
}
function migrate(input){
 validateBase(input);if(input.schemaVersion===SCHEMA)return{state:validate(input),migrated:false,fromVersion:SCHEMA,toVersion:SCHEMA};
 const s=clone(input),payload=JSON.stringify(input);if(input.schemaVersion===1)Object.assign(s,blankAdditions());
 else{assert(obj(s.gameResults),'旧版游戏结果缺失。');s.gameResults.arcade=[];s.arcadeClaims={};}
 s.schemaVersion=SCHEMA;s.migrationArchive={schemaVersion:input.schemaVersion,payload,checksum:crc(payload)};
 if(s.activeSession&&input.schemaVersion===1)Object.assign(s.activeSession,{returnSnapshot:clone(s.board),returnSnapshotHash:crc(JSON.stringify(s.board)),runKey:null});
 s.migrations.push({from:input.schemaVersion,to:SCHEMA,at:Date.now(),note:'保留原学习存储、资源及领取记录；历史轮次不补发奖励。'});
 return{state:validate(s),migrated:true,fromVersion:input.schemaVersion,toVersion:SCHEMA};
}
function note(s,text){s.journal.unshift({at:Date.now(),text});s.journal=s.journal.slice(0,80);}
function startBoard(s,n,names=[]){assert(integer(n,1,3),'原型支持1至3人同设备轮流玩。');assert(!s.activeSession,'先返回棋盘再开始新旅程。');s.board={id:uid(),players:Array.from({length:n},(_,i)=>({name:String(names[i]||'孩子'+(i+1)).trim().slice(0,18)||'孩子'+(i+1),character:['fox','owl','turtle'][i],position:0,learnerSlot:i})),turn:0,turnNo:1,dice:0,phase:'roll',winner:null};note(s,'新旅程：'+n+'人，从 Masai 出发。');}
function roll(s,d){const b=s.board;assert(b&&b.phase==='roll'&&!s.activeSession,'当前不能掷骰。');assert(integer(d,1,6),'骰子数值无效。');const p=b.players[b.turn];b.dice=d;p.position=Math.min(30,p.position+d);b.phase=p.position===30?'finished':'landed';if(b.phase==='finished'){b.winner=b.turn;s.gameResults.board.push({boardId:b.id,at:Date.now(),winnerPlayer:b.turn,learnerSlot:p.learnerSlot,turnNo:b.turnNo});}note(s,p.name+' 掷出 '+d+'，到达第 '+p.position+' 格。'+(b.phase==='finished'?'本次旅程抵达 Rawang。':''));}
function nextTurn(s){const b=s.board;assert(b&&b.phase==='landed'&&!s.activeSession,'当前不能切换回合。');b.turn=(b.turn+1)%b.players.length;b.turnNo++;b.phase='roll';b.dice=0;}
function session(s,token){assert(s.activeSession?.token===token,'过期游戏会话。');assert(equal(s.activeSession.returnSnapshot,s.board)&&s.activeSession.returnSnapshotHash===crc(JSON.stringify(s.board)),'棋盘位置或回合已改变，拒绝错位返回。');return s.activeSession;}
function launch(s,slot){assert(!s.activeSession,'已有游戏正在进行。');assert(integer(slot,0,2),'学习档案槽无效。');s.activeSession={gameId:'wordquest',token:uid(),learnerSlot:slot,boardId:s.board?.id||'',turnNo:s.board?.turnNo||0,returnSnapshot:clone(s.board),returnSnapshotHash:crc(JSON.stringify(s.board)),runKey:null};return clone(s.activeSession);}
function storeLegacy(s,token,data){assert(session(s,token).gameId==='wordquest','学习存档不能写入街机会话。');assert(obj(data)&&Object.keys(data).every(k=>KEYS.includes(k)),'拒绝未知的旧存档键。');for(const v of Object.values(data)){assert(typeof v==='string'&&v.length<=2500000,'旧存档超过原型大小限制。');JSON.parse(v);}s.games.wordquest.storage=clone(data);}
function launchArcade(s,game,slot=0){assert(ARCADE.includes(game),'未知的街机游戏。');launch(s,slot);s.activeSession.gameId='arcade';s.activeSession.arcadeGame=game;return clone(s.activeSession);}
function validateArcadeReceipt(r){assert(obj(r)&&textId(r.roundId,120)&&ARCADE.includes(r.game)&&integer(r.score,0,1e9)&&(r.rank==null||integer(r.rank,1,1e9)),'服务器街机回执无效。');return r;}
function recordArcadeResult(s,token,receipt){
 validateArcadeReceipt(receipt);const prior=s.arcadeClaims[receipt.roundId];
 if(prior){assert(prior.sessionToken===token&&prior.game===receipt.game&&prior.score===receipt.score&&(prior.rank??null)===(receipt.rank??null),'重复回执改变了原结果或会话。');return{duplicate:true,result:clone(prior)};}
 const a=session(s,token);assert(a.gameId==='arcade'&&a.arcadeGame===receipt.game,'街机结果与启动的游戏不一致。');
 const r={roundId:receipt.roundId,game:receipt.game,score:receipt.score,rank:receipt.rank??null,sessionToken:token,learnerSlot:a.learnerSlot,boardId:a.boardId,turnNo:a.turnNo,at:Date.now()};
 s.arcadeClaims[r.roundId]=clone(r);s.gameResults.arcade.push(r);note(s,({dodge:'星际穿梭',merge:'合成风暴',pulse:'光速连击'})[r.game]+'完成：'+r.score+'分，成绩已保存。');
 return{duplicate:false,result:clone(r)};
}
function legacyProfile(s,slot){const raw=s.games.wordquest.storage[KEYS[0]];assert(raw,'学习记录尚未存好，拒绝结算。');const legacy=JSON.parse(raw),p=legacy.profiles?.[slot];assert(obj(p)&&Array.isArray(p.events),'学习档案或作答记录不完整。');return p;}
function matchingRun(p,r){return p.pet===r.pet&&p.run?.id===r.id&&p.run.kind===r.kind&&equal(p.run.ids,r.ids)&&p.run.startedAt===r.startedAt;}
function beginRun(s,token,r,options={}){
 const a=session(s,token);runDescriptor(r);assert(a.learnerSlot===r.slot,'请使用当前棋子的学习档案。');assert(integer(r.startedAt,0,1e15),'开始时间无效。');
 const p=legacyProfile(s,r.slot);assert(matchingRun(p,r),'开始记录与已保存的学习轮次不一致。');const key=claimKey(r),existing=s.settlements.runs[key];
 if(options.resume===true){
  if(!existing||existing.status!=='started'||s.claims[key]){a.runKey=null;return{eligible:false,resumed:true,reason:'legacy-or-imported-run'};}
  assert(existing.id===r.id&&existing.slot===r.slot&&existing.pet===r.pet&&existing.kind===r.kind&&existing.startedAt===r.startedAt&&equal(existing.ids,r.ids),'恢复轮次与开始凭证不一致。');
  assert(existing.sessionToken===null||existing.sessionToken===token,'该轮次属于另一个尚未返回的会话。');
  for(const e of Object.values(existing.accepted))assert(p.events.some(v=>equal(eventValue(v),eventValue(e))),'恢复轮次缺少此前已提交的作答。');
  existing.sessionToken=token;a.runKey=key;return{eligible:true,resumed:true};
 }
 assert(!s.claims[key]&&!existing,'历史轮次不能作为新轮次重新领奖。');assert(p.run.index===0&&!p.events.some(e=>typeof e?.uid==='string'&&e.uid.startsWith(r.id+':')),'新轮次必须从未提交作答的起点开始。');
 if(a.runKey&&s.settlements.runs[a.runKey]?.status==='started'){s.settlements.runs[a.runKey].status='abandoned';s.settlements.runs[a.runKey].sessionToken=null;}
 s.settlements.runs[key]={id:r.id,slot:r.slot,kind:r.kind,pet:r.pet,ids:clone(r.ids),startedAt:r.startedAt,originSession:token,sessionToken:token,status:'started',accepted:{}};a.runKey=key;return{eligible:true,resumed:false};
}
function recordSubmission(s,token,message){
 const a=session(s,token);assert(obj(message)&&integer(message.slot,0,2)&&message.slot===a.learnerSlot&&textId(message.runId),'作答所属档案或轮次无效。');const key='wq:'+message.slot+':'+message.runId,r=s.settlements.runs[key];
 if(!r||r.status!=='started'||a.runKey!==key)return{eligible:false};
 assert(r.sessionToken===token,'作答所属会话不一致。');const e=message.event,index=r.ids.indexOf(e?.qid);assert(index>=0,'作答题目不属于当前轮次。');validateEvent(e,r,index);
 const p=legacyProfile(s,message.slot);assert(p.pet===r.pet&&p.events.some(v=>equal(eventValue(v),eventValue(e))),'作答事件尚未保存或内容不一致。');
 const prior=r.accepted[index];if(prior){assert(equal(eventValue(prior),eventValue(e)),'重复提交改变了已记录的答案。');return{eligible:true,duplicate:true};}
 assert(index===Object.keys(r.accepted).length,'作答必须按实际题目顺序提交。');r.accepted[index]=eventValue(e);return{eligible:true,duplicate:false};
}
function changeCharacter(s,token,r){
 const a=session(s,token);runDescriptor(r);assert(r.slot===a.learnerSlot,'伙伴更换属于其他学习档案。');
 const p=legacyProfile(s,r.slot);assert(matchingRun(p,r),'伙伴更换与已保存的学习轮次不一致。');
 const key=claimKey(r),proof=s.settlements.runs[key];
 if(!proof||proof.status!=='started'||a.runKey!==key)return{eligible:false};
 assert(proof.sessionToken===token&&proof.kind===r.kind&&proof.startedAt===r.startedAt&&equal(proof.ids,r.ids),'伙伴更换不能改变已开始的题目或会话。');
 for(const e of Object.values(proof.accepted))assert(p.events.some(v=>equal(eventValue(v),eventValue(e))),'伙伴更换缺少已提交的作答。');
 if(proof.pet===r.pet)return{eligible:true,changed:false};
 proof.characterChanges??=[];proof.characterChanges.push({from:proof.pet,to:r.pet,at:Date.now()});proof.pet=r.pet;
 return{eligible:true,changed:true};
}
function invalidateRun(s,token){const a=session(s,token);for(const r of Object.values(s.settlements.runs))if(r.status==='started'&&r.slot===a.learnerSlot){r.status='invalidated';r.sessionToken=null;}a.runKey=null;return{invalidated:true};}
function reward(s,token,r){
 const a=session(s,token);runDescriptor(r);assert(r.slot===a.learnerSlot,'请使用当前棋子的学习档案，切换档案不会获得本回合奖励。');const key=claimKey(r);
 if(s.claims[key])return{duplicate:true,snacks:0,bond:0};
 const proof=s.settlements.runs[key];
 if(!proof||['invalidated','abandoned'].includes(proof.status))return{eligible:false,snacks:0,bond:0,reason:'legacy-or-imported-run'};
 assert(a.runKey===key&&proof.status==='started'&&proof.sessionToken===token,'真实开始凭证与本会话不一致，拒绝结算。');
 assert(proof.kind===r.kind&&proof.pet===r.pet&&equal(proof.ids,r.ids),'结算内容与开始时不一致。');
 const p=legacyProfile(s,r.slot);assert(p.pet===r.pet&&p.run===null,'学习档案或完成状态不一致。');
 const events=r.ids.map((id,i)=>{const e=proof.accepted[i];assert(e&&p.events.filter(v=>v?.uid===r.id+':'+i).length===1&&p.events.some(v=>equal(eventValue(v),eventValue(e))),'缺少实际提交的作答，拒绝凭打开或导入页面发奖。');return e;});
 assert(integer(s.shared.snacks+5,0,1e9)&&integer(s.shared.bonds[r.pet]+1,0,1e9)&&integer(s.games.wordquest.completedRuns+1,0,1e9),'资源已达到存档上限，本次没有入账。');
 const at=Date.now(),independent=events.filter(e=>e.independent).length,correct=events.filter(e=>e.correct).length,hinted=events.filter(e=>e.hinted).length;
 s.claims[key]=true;proof.status='settled';s.shared.snacks+=5;s.shared.bonds[r.pet]+=1;s.games.wordquest.completedRuns++;
 s.transactions.push({id:key,type:'prototype-learning-reward',source:'wordquest',claim:key,sessionToken:token,originSession:proof.originSession,learnerSlot:r.slot,at,resources:{snacks:5},bond:{character:r.pet,amount:1}});
 s.learning.wordquest.outcomes.push({claim:key,runId:r.id,learnerSlot:r.slot,kind:r.kind,questionIds:clone(r.ids),independent,correct,hinted,total:r.ids.length,at});
 s.gameResults.wordquest.push({claim:key,runId:r.id,learnerSlot:r.slot,kind:r.kind,status:'completed',at});
 note(s,CHARS[r.pet]+' 完成一轮学习：零食 +5，羁绊 +1；独立答对 '+independent+'/'+r.ids.length+'（奖励不是成绩）。');
 return{duplicate:false,snacks:5,bond:1,independent,total:r.ids.length};
}
function closeSession(s,token){
 if(!s.activeSession&&s.settlements.returns[token])return{closed:true,duplicate:true};
 const a=session(s,token),snapshot=clone(a.returnSnapshot);if(a.runKey){const r=s.settlements.runs[a.runKey];if(r?.sessionToken===token)r.sessionToken=null;}
 s.settlements.returns[token]={at:Date.now(),snapshotHash:a.returnSnapshotHash};s.activeSession=null;return{closed:true,duplicate:false,returnSnapshot:snapshot};
}
function prepareImport(current,incoming){
 const s=migrate(incoming).state;validate(current);
 if(current.universeId===s.universeId){Object.assign(s.claims,current.claims);Object.assign(s.arcadeClaims,current.arcadeClaims);for(const r of s.gameResults.arcade){const prior=current.arcadeClaims[r.roundId];if(prior&&!equal(prior,r))throw Error('导入街机回执与本机记录冲突。');}}
 for(const r of Object.values(s.settlements.runs))if(r.status==='started'){r.status='invalidated';r.sessionToken=null;}
 if(s.activeSession)s.activeSession.runKey=null;
 return validate(s);
}
function pack(s){validateBase(s);if(s.schemaVersion===SCHEMA)validate(s);const payload=JSON.stringify(s);assert(payload.length<=MAX_PAYLOAD,'宇宙存档超过大小限制。');return{payload,checksum:crc(payload)};}
function unpack(p){assert(obj(p)&&typeof p.payload==='string'&&p.payload.length<=MAX_PAYLOAD&&p.checksum===crc(p.payload),'存档校验失败；没有用坏档覆盖好档。');const originalState=JSON.parse(p.payload),result=migrate(originalState);return{...result,originalState};}
function wrap(s,old){return JSON.stringify({format:'LIANG_UNIVERSE',current:pack(s),previous:old?pack(old):null});}
function unwrap(raw){assert(typeof raw==='string'&&raw.length<=MAX_PAYLOAD*2+1000,'存档文件过大。');const w=JSON.parse(raw);assert(w?.format==='LIANG_UNIVERSE','这不是梁家宇宙存档。');try{return{...unpack(w.current),recovered:false};}catch(e){if(e.code==='UNSUPPORTED_SCHEMA')throw e;if(w.previous)return{...unpack(w.previous),recovered:true};throw e;}}
function encode(s){const j=JSON.stringify(pack(s)),bytes=new TextEncoder().encode(j);let bin='';for(let i=0;i<bytes.length;i+=8192)bin+=String.fromCharCode(...bytes.subarray(i,i+8192));const b=typeof btoa==='function'?btoa(bin):Buffer.from(bin,'binary').toString('base64');return'LU1.'+b.replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
function decode(code){assert(typeof code==='string'&&code.length<=MAX_PAYLOAD*6&&/^LU1\.[A-Za-z0-9_-]+$/.test(code),'迁移代码格式无效或过大。');let b=code.slice(4).replace(/-/g,'+').replace(/_/g,'/');b+='='.repeat((4-b.length%4)%4);const bin=typeof atob==='function'?atob(b):Buffer.from(b,'base64').toString('binary');const bytes=Uint8Array.from(bin,c=>c.charCodeAt(0));return unpack(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes))).state;}
return{KEY,SCHEMA,MAX_PAYLOAD,CHARS,KEYS,ARCADE,clone,uid,fresh,validate,migrate,crc,note,startBoard,roll,nextTurn,launch,launchArcade,recordArcadeResult,storeLegacy,beginRun,recordSubmission,changeCharacter,invalidateRun,reward,closeSession,prepareImport,wrap,unwrap,encode,decode};
});
