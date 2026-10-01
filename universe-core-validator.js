/* Generated from exact v0.9 engines and frozen older cores; schema9 permanent cards and pets ledger and old-save replay. */
(function(){if(typeof module==='object'&&module.exports){module.exports=require('../../../Liang_Universe_Board_v0.9_cards/src/core-v8.js');return;}
(function(root,factory){'use strict';const game=factory();if(typeof module==='object'&&module.exports)module.exports=game;root.LiangGames=root.LiangGames||{};root.LiangGames.fishing=game;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const ITEMS=['fish','slipper','ball','jar'],STAGES=['casting','waiting','bite','reeling','celebrate'];
const NAMES={fish:'河鱼',slipper:'旧拖鞋',ball:'旧皮球',jar:'旧罐子'};
const clone=x=>JSON.parse(JSON.stringify(x));
const int=(x,a,b)=>Number.isInteger(x)&&x>=a&&x<=b;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function assert(ok,msg){if(!ok)throw new Error('钓鱼：'+msg);}
function normalize(config){const c=config||{};assert(typeof c==='object'&&!Array.isArray(c),'配置无效');const seed=c.seed===undefined?1:c.seed,difficulty=c.difficulty===undefined?0:c.difficulty,mode=c.mode===undefined?'practice':c.mode;assert(int(seed,0,4294967295),'种子无效');assert(int(difficulty,0,2),'难度无效');assert(mode==='practice'||mode==='inventory','模式无效');return{seed,difficulty,mode};}
function random(seed,n){let x=(seed+Math.imul(n+1,0x9e3779b9))>>>0;x^=x>>>16;x=Math.imul(x,0x21f0aaad);x^=x>>>15;x=Math.imul(x,0x735a2d97);return (x^(x>>>15))>>>0;}
function spotFor(s){return random(s.config.seed,s.casts+s.catches.length*7)%3;}
function create(config){const c=normalize(config);return{version:1,phase:'playing',config:c,elapsedMs:0,limitMs:60000-c.difficulty*5000,stage:'casting',stageMs:0,selectedSpot:1,targetSpot:random(c.seed,0)%3,casts:0,hooks:0,inputCount:0,mistakes:0,catches:[],reeling:false,tension:0,progress:0,dangerMs:0,slackMs:0,waitMs:0,biteWindowMs:1100-c.difficulty*150,kind:'fish',message:'先找鱼影，再抛竿。浮标往下沉时，马上提竿！',reason:''};}
function validate(s){assert(s&&typeof s==='object'&&!Array.isArray(s),'存档无效');assert(s.version===1,'存档版本无效');const c=normalize(s.config);assert(JSON.stringify(c)===JSON.stringify(s.config),'配置字段无效');assert(['playing','won','lost'].includes(s.phase),'阶段无效');assert(STAGES.includes(s.stage),'钓鱼阶段无效');assert(s.limitMs===60000-c.difficulty*5000&&int(s.elapsedMs,0,s.limitMs),'时间无效');assert(int(s.stageMs,0,s.limitMs),'阶段时间无效');for(const key of ['selectedSpot','targetSpot'])assert(int(s[key],0,2),'钓点无效');for(const key of ['casts','hooks','inputCount'])assert(int(s[key],0,1000000),'操作次数无效');assert(int(s.mistakes,0,3),'失误次数无效');assert(Array.isArray(s.catches)&&s.catches.length<=3,'收获无效');assert(s.hooks<=s.casts&&s.catches.length<=s.hooks,'收获操作不完整');const ids=new Set();s.catches.forEach(x=>{assert(x&&ITEMS.includes(x.kind)&&int(x.elapsedMs,1,s.elapsedMs)&&int(x.castId,1,s.casts),'收获记录无效');assert(!ids.has(x.castId),'重复收获');ids.add(x.castId);});assert(typeof s.reeling==='boolean','收线状态无效');for(const key of ['tension','progress'])assert(Number.isFinite(s[key])&&s[key]>=0&&s[key]<=100,'鱼线数值无效');for(const key of ['dangerMs','slackMs','waitMs'])assert(int(s[key],0,s.limitMs),'计时无效');assert(s.biteWindowMs===1100-c.difficulty*150,'提竿窗口无效');assert(ITEMS.includes(s.kind)&&typeof s.message==='string'&&typeof s.reason==='string','提示无效');assert(s.phase!=='won'||(s.catches.length===3&&s.inputCount>=6),'通关证据不足');assert(s.phase!=='playing'||(s.catches.length<3&&s.mistakes<3&&s.elapsedMs<s.limitMs),'游戏应已结束');assert(s.phase!=='lost'||(s.mistakes===3||s.elapsedMs===s.limitMs),'失败原因无效');return true;}
function finish(s,phase,reason){s.phase=phase;s.reason=reason;s.reeling=false;s.message=reason;}
function miss(s,message){s.mistakes++;s.reeling=false;s.stage='casting';s.stageMs=0;s.progress=0;s.tension=0;s.dangerMs=0;s.slackMs=0;s.targetSpot=spotFor(s);s.message=message+' 再找一处鱼影试试。';if(s.mistakes===3)finish(s,'lost','今天鱼太机灵了！下次看准浮标，收线时记得松一松。');}
function step(state,action){validate(state);assert(action&&typeof action==='object'&&!Array.isArray(action),'操作无效');assert(['tick','select','cast','hook','reel'].includes(action.type),'未知操作');if(action.type==='tick')assert(int(action.dt,1,250),'每次计时须为 1 至 250 毫秒');if(action.type==='select'||(action.type==='cast'&&action.spot!==undefined))assert(int(action.spot,0,2),'钓点须为 0、1 或 2');if(action.type==='reel')assert(typeof action.active==='boolean','收线操作无效');const s=clone(state);if(s.phase!=='playing')return s;
 if(action.type==='select'){if(s.stage==='casting'){s.selectedSpot=action.spot;s.inputCount++;}return s;}
 if(action.type==='cast'){if(s.stage!=='casting')return s;if(action.spot!==undefined)s.selectedSpot=action.spot;s.casts++;s.inputCount++;s.stage='waiting';s.stageMs=0;s.waitMs=950+(random(s.config.seed,s.casts+10)%500)+(s.selectedSpot===s.targetSpot?0:1300);s.kind=s.catches.length<2?'fish':ITEMS[random(s.config.seed,s.casts+30)%ITEMS.length];s.message=s.selectedSpot===s.targetSpot?'抛到鱼影旁边了！看着浮标，等它下沉。':'这里暂时没鱼影。耐心等一等，鱼也可能游过来。';return s;}
 if(action.type==='hook'){if(s.stage==='waiting'){s.inputCount++;miss(s,'提竿太早，鱼儿还没咬钩。');}else if(s.stage==='bite'){s.inputCount++;s.hooks++;s.stage='reeling';s.stageMs=0;s.progress=0;s.tension=30;s.dangerMs=0;s.slackMs=0;s.reeling=false;s.message='咬住了！按住收线；鱼线快到红色时，松开一下。';}return s;}
 if(action.type==='reel'){if(s.stage==='reeling'&&s.reeling!==action.active){s.reeling=action.active;s.inputCount++;}return s;}
 const dt=Math.min(action.dt,s.limitMs-s.elapsedMs);s.elapsedMs+=dt;s.stageMs+=dt;
 if(s.stage==='waiting'&&s.stageMs>=s.waitMs){s.stage='bite';s.stageMs=0;s.message='浮标沉了！现在提竿！';}
 else if(s.stage==='bite'&&s.stageMs>=s.biteWindowMs)miss(s,'鱼儿松口了。浮标下沉时要快一点提竿。');
 else if(s.stage==='reeling'){
  const surge=Math.sin(s.stageMs/600+(random(s.config.seed,s.casts)%628)/100),seconds=dt/1000;
  s.progress=clamp(s.progress+(s.reeling?(25-s.config.difficulty*2-3*Math.max(surge,0)):-3.5)*seconds,0,100);
  s.tension=clamp(s.tension+(s.reeling?(33+s.config.difficulty*3+12*Math.max(surge,0)):-43)*seconds,0,100);
  s.dangerMs=s.tension>=98?s.dangerMs+dt:0;s.slackMs=s.tension<=3?s.slackMs+dt:0;
  if(s.dangerMs>=350)miss(s,'鱼线绷得太紧，鱼儿挣脱了。到橙色就松开一下。');
  else if(s.slackMs>=1800)miss(s,'鱼线松了太久，鱼儿游走了。松开一下后，继续收线。');
  else if(s.progress>=100){s.catches.push({kind:s.kind,elapsedMs:s.elapsedMs,castId:s.casts});s.reeling=false;s.stage='celebrate';s.stageMs=0;s.message='钓到了'+NAMES[s.kind]+'！'+(s.kind==='fish'?'收好这份新鲜收获。':'顺手把旧物带离河流。');if(s.catches.length===3)finish(s,'won','三次收获，满载而归！鱼可以带到厨房，旧物进入收藏。');}
  else s.message=s.tension>=75?'鱼线紧了！松开收线按钮，让它回到绿色。':s.tension<15?'可以收线了，别让鱼线松太久。':surge>.6?'鱼儿正在用力！留意鱼线的松紧。':'稳住！按住收线，鱼线紧了就松开。';
 }else if(s.stage==='celebrate'&&s.stageMs>=1000){s.stage='casting';s.stageMs=0;s.targetSpot=spotFor(s);s.progress=0;s.tension=0;s.message='还有新的鱼影！换个钓点，继续试试。';}
 if(s.phase==='playing'&&s.elapsedMs>=s.limitMs)finish(s,'lost','时间到了。先看浮标，再一收一松，下次会钓得更稳。');
 validate(s);return s;
}
function result(s){validate(s);if(s.phase==='playing')return null;const won=s.phase==='won';return{status:s.phase,score:Math.max(0,s.catches.length*100+(won?Math.ceil((s.limitMs-s.elapsedMs)/1000)*3:0)-s.mistakes*20),fish:won?s.catches.filter(x=>x.kind==='fish').length:0,collectibles:won?s.catches.filter(x=>x.kind!=='fish').map(x=>x.kind):[]};}
const CSS=`
.lg-fishing{--water:#257886;--ink:#163f48;--gold:#f9bf52;color:var(--ink);font:16px/1.5 system-ui,"Microsoft YaHei",sans-serif;max-width:1000px;margin:auto;background:#fffdf4;border:1px solid #c1ddd6;border-radius:24px;overflow:hidden;box-shadow:0 12px 28px #173c3910}.lg-fishing *{box-sizing:border-box}.lf-top{padding:20px 24px 12px;display:flex;align-items:center;justify-content:space-between;gap:12px}.lf-top h2{font-size:25px;letter-spacing:.02em;margin:0}.lf-eyebrow{font-size:12px;color:#557b69;font-weight:800;letter-spacing:.14em}.lf-stats{display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-end}.lf-stat{background:#e9f2e4;border-radius:13px;padding:7px 12px;font-weight:800;font-size:14px}.lf-stat[data-low=true]{background:#ffe1cf;color:#943518}.lf-goal{margin:0;padding:0 24px 14px;color:#53706d;font-size:14px}.lf-river{position:relative;margin:0 16px;border-radius:18px;overflow:hidden;background:#84c6ce;isolation:isolate}.lf-river svg{display:block;width:100%;height:auto;max-height:310px;min-height:180px}.lf-water-line{stroke:#fff;stroke-width:2;opacity:.22;fill:none;stroke-linecap:round}.lf-fish-shadow{opacity:.7;transition:transform .5s}.lf-float{transition:transform .12s}.lf-float[data-bite=true]{animation:lf-dip .28s infinite alternate}.lf-ripple{transform-origin:center;animation:lf-ripple 2s infinite;opacity:.3}.lf-river-label{position:absolute;bottom:12px;left:14px;background:#103e4bd9;color:#fff;padding:5px 12px;border-radius:99px;font-size:13px;font-weight:700}.lf-catch-pop{position:absolute;top:18px;left:50%;transform:translateX(-50%);background:#fffbe8;color:#365634;padding:12px 22px;border-radius:18px;box-shadow:0 5px 18px #123a4240;font-size:24px;font-weight:900;white-space:nowrap}.lf-body{padding:16px 24px 22px}.lf-message{min-height:52px;background:#edf4e8;border-left:4px solid #6fa16f;padding:10px 13px;border-radius:6px 12px 12px 6px;font-weight:700;margin-bottom:14px}.lf-message[data-alert=true]{background:#fff0db;border-color:#eda42e;color:#784c15}.lf-spots{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:14px}.lg-fishing button{font:inherit;min-height:48px;border:1px solid #b5d4cd;background:#fffef8;color:#285c58;border-radius:12px;cursor:pointer;touch-action:manipulation}.lg-fishing button:focus-visible{outline:3px solid #e09824;outline-offset:3px}.lg-fishing button:disabled{cursor:default;opacity:.5}.lf-spots button[aria-pressed=true]{background:#dcefdc;border:2px solid #3b7c65;box-shadow:0 2px 0 #3b7c65}.lf-spot-hint{font-size:12px;display:block;min-height:18px}.lf-controls{display:grid;grid-template-columns:1fr 1fr 1.3fr;gap:10px}.lf-controls button{font-weight:800;transition:transform .1s,background .1s}.lf-controls .lf-primary{color:#fff;background:#277c70;border-color:#23685f;box-shadow:0 3px 0 #18524a}.lf-controls .lf-hook:not(:disabled){background:#ffc656;color:#473613;border-color:#e1a338;animation:lf-ready .7s infinite alternate}.lf-controls .lf-reel{touch-action:none;background:#2a708e;color:#fff;border-color:#1f5770;box-shadow:0 3px 0 #174358}.lf-controls .lf-reel[aria-pressed=true]{background:#153f57;transform:translateY(2px);box-shadow:none}.lf-meter-wrap{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-bottom:14px}.lf-meter-title{display:flex;justify-content:space-between;font-size:13px;font-weight:800;margin-bottom:5px}.lf-meter{height:17px;border-radius:99px;background:#dde8df;overflow:hidden;border:1px solid #c5d8cd}.lf-meter-fill{height:100%;background:#3b987d;transition:width .08s linear;min-width:0}.lf-tension{background:linear-gradient(90deg,#e1ead6 0 8%,#bfdcbc 8% 65%,#f8d982 65% 80%,#ec9687 80% 100%);position:relative;overflow:visible}.lf-needle{position:absolute;top:-4px;bottom:-4px;width:4px;background:#234b53;border:1px solid white;border-radius:3px;transition:left .08s linear}.lf-bag{display:flex;gap:8px;align-items:center;margin-top:15px;flex-wrap:wrap}.lf-catch{min-width:63px;border:1px dashed #b2cbbb;border-radius:10px;padding:5px 9px;font-size:12px;text-align:center;color:#6e8579;background:#f7f8eb}.lf-catch[data-filled=true]{background:#e5f1dd;border-style:solid;color:#2a624b;font-weight:800}.lf-help{margin:12px 0 0;font-size:12px;color:#637f77}.lf-overlay{position:absolute;inset:0;z-index:2;display:grid;place-items:center;background:#163c44a8;color:white;font-size:26px;font-weight:900}.lg-fishing [hidden]{display:none!important}.lf-end{border:1px solid #adcdb6;border-radius:14px;background:#f1f6e8;padding:12px 14px;margin-top:12px}.lf-end strong{display:block;font-size:20px}.lf-end small{display:block;color:#567360;margin-top:4px}@keyframes lf-dip{to{transform:translateY(9px)}}@keyframes lf-ripple{to{opacity:.05;stroke-width:4}}@keyframes lf-ready{to{box-shadow:0 0 0 4px #ffc65644}}@media(max-width:520px){.lf-top{padding:15px 16px 8px;align-items:flex-start}.lf-top h2{font-size:21px}.lf-stats{gap:5px}.lf-stat{font-size:12px;padding:5px 8px}.lf-goal{padding:0 16px 12px}.lf-body{padding:14px 16px 18px}.lf-river{margin:0 10px}.lf-controls{gap:7px;grid-template-columns:1fr 1fr 1.2fr}.lf-controls button{font-size:14px}.lf-meter-wrap{gap:12px}.lf-message{font-size:14px;min-height:64px}.lf-spots{gap:6px}.lf-catch-pop{font-size:19px}.lf-help{font-size:11px}}@media(prefers-reduced-motion:reduce){.lg-fishing *{animation:none!important;transition:none!important}}

.lg-fishing p{color:#53706d}.lg-fishing button:hover:not(:disabled){background:#e2eee3;color:#163f48}.lg-fishing .lf-primary:hover:not(:disabled){background:#185b51;color:white}.lg-fishing .lf-hook:hover:not(:disabled){background:#ffcf70;color:#473613}.lg-fishing .lf-reel:hover:not(:disabled){background:#1d536b;color:white}
@media(max-width:600px) and (max-height:780px){.lg-fishing{border-radius:14px}.lg-fishing .lf-top{padding:6px 10px;min-height:30px}.lg-fishing .lf-top>div:first-child{display:none}.lg-fishing .lf-stats{width:100%;justify-content:space-between}.lg-fishing .lf-stat{font-size:12px;padding:3px 8px}.lg-fishing .lf-goal{padding:0 10px 5px;font-size:12px}.lg-fishing .lf-river{margin:0 8px}.lg-fishing .lf-river svg{height:130px;min-height:130px}.lg-fishing .lf-river-label{font-size:11px;bottom:5px;left:6px;padding:3px 7px}.lg-fishing .lf-body{padding:6px 10px}.lg-fishing .lf-message{font-size:12px;min-height:38px;padding:5px 7px;margin-bottom:5px}.lg-fishing .lf-spots{gap:4px;margin-bottom:5px}.lg-fishing .lf-spots button{min-height:44px;font-size:12px}.lg-fishing .lf-spot-hint{font-size:10px;min-height:14px}.lg-fishing .lf-meter-wrap{gap:10px;margin-bottom:5px}.lg-fishing .lf-meter-title{font-size:11px;margin-bottom:3px}.lg-fishing .lf-meter{height:12px}.lg-fishing .lf-controls button{min-height:44px;font-size:13px}.lg-fishing .lf-bag{gap:4px;margin-top:7px}.lg-fishing .lf-catch{min-width:50px;font-size:10px;padding:3px 6px}.lg-fishing .lf-help{font-size:10px;margin-top:6px}}
@media(orientation:landscape) and (max-height:500px) and (min-width:600px){.lg-fishing{display:grid;grid-template-columns:minmax(0,1fr) minmax(300px,.95fr);grid-template-rows:24px 36px 44px 30px 44px;gap:4px 8px;padding:6px;border-radius:12px}.lg-fishing .lf-top{grid-column:2;grid-row:1;padding:0;margin:0}.lg-fishing .lf-top>div:first-child{display:none}.lg-fishing .lf-stats{width:100%;justify-content:space-between;gap:4px;flex-wrap:nowrap}.lg-fishing .lf-stat{font-size:11px;padding:3px 8px}.lg-fishing .lf-goal{grid-column:1;grid-row:1;margin:0;padding:0;font-size:11px;line-height:1.2;align-self:center}.lg-fishing .lf-river{grid-column:1;grid-row:2/6;margin:0;height:100%;min-height:0}.lg-fishing .lf-river svg{height:100%;min-height:0;max-height:none}.lg-fishing .lf-river-label{font-size:11px;bottom:5px;left:5px;padding:3px 6px}.lg-fishing .lf-body{display:contents}.lg-fishing .lf-message{grid-column:2;grid-row:2;font-size:11px;line-height:1.2;min-height:0;padding:4px 7px;margin:0}.lg-fishing .lf-spots{grid-column:2;grid-row:3;gap:4px;margin:0}.lg-fishing .lf-spots button{min-height:44px;font-size:11px}.lg-fishing .lf-spot-hint{font-size:10px;min-height:12px}.lg-fishing .lf-meter-wrap{grid-column:2;grid-row:4;gap:8px;margin:0}.lg-fishing .lf-meter-title{font-size:10px;margin:0}.lg-fishing .lf-meter{height:10px}.lg-fishing .lf-controls{grid-column:2;grid-row:5;gap:4px}.lg-fishing .lf-controls button{min-height:44px;font-size:12px}.lg-fishing .lf-bag,.lg-fishing .lf-help,.lg-fishing .lf-end{grid-column:1/-1;margin:4px 0 0}.lg-fishing .lf-catch-pop{font-size:16px;padding:6px 10px}.lg-fishing .lf-help{font-size:10px}}
`;
function mount(container,options){assert(container&&typeof container.appendChild==='function','挂载位置无效');assert(options&&typeof options.onAction==='function','操作回调无效');validate(options.state);let state=clone(options.state),paused=false,disposed=false,last=0,raf=0,held=false,lastMessage='';const doc=container.ownerDocument,win=doc.defaultView;const el=doc.createElement('section');el.className='lg-fishing';el.setAttribute('data-testid','fishing-game');el.setAttribute('aria-label','河边钓鱼游戏');el.innerHTML=`<style>${CSS}</style><header class="lf-top"><div><div class="lf-eyebrow">RIVER POCKET · 技巧挑战</div><h2>河边钓鱼</h2></div><div class="lf-stats"><span class="lf-stat" data-testid="fishing-time"></span><span class="lf-stat" data-testid="fishing-lives"></span></div></header><p class="lf-goal">目标：钓起 3 件物品。看浮标、稳住鱼线，满载回家。</p><div class="lf-river" data-testid="fishing-river"><svg viewBox="0 0 880 286" role="img" aria-label="有三个钓点的河流，鱼影提示当前适合抛竿的位置"><defs><linearGradient id="lf-water" x2="0" y2="1"><stop stop-color="#73b7bd"/><stop offset="1" stop-color="#2a7889"/></linearGradient><linearGradient id="lf-bank" x2="0" y2="1"><stop stop-color="#c6dda8"/><stop offset="1" stop-color="#e4dfb4"/></linearGradient></defs><path fill="url(#lf-bank)" d="M0 0H880V94Q695 61 517 93T160 83Q57 108 0 82Z"/><path fill="url(#lf-water)" d="M0 80Q125 108 234 88T492 94T880 90V286H0Z"/><path fill="#86af74" d="M0 58Q134 44 224 64T407 64T608 64T880 57V86Q650 69 513 94T176 83Q78 96 0 82Z"/><g fill="#477b65"><path d="M52 83l-8-31 14 26 3-35 6 37 13-22-6 26Z"/><path d="M768 84l-8-27 15 24 7-40 3 40 16-21-7 26Z"/></g><g class="lf-water-line"><path d="M44 142h55m80 89h57m100-115h50m82 91h82m95-70h58m56 103h67"/><path d="M80 260h76m113-70h65m82 57h43m61-91h65m168 33h53"/></g><g fill="#e1e9bc" stroke="#739c66" stroke-width="2"><ellipse cx="71" cy="125" rx="25" ry="9"/><ellipse cx="777" cy="214" rx="25" ry="10"/><ellipse cx="739" cy="232" rx="18" ry="7"/></g><g data-testid="fishing-shadow" class="lf-fish-shadow" fill="#245865"><path d="M-24 0Q0-18 29 0Q0 18-24 0l-15 10V-10Z"/><path d="M42 18q15-11 30 0-15 11-30 0l-8 6V12Z" opacity=".6"/></g><g data-testid="fishing-spot-rings" fill="none" stroke="#e6f5df" stroke-width="2" opacity=".55"><ellipse cx="235" cy="173" rx="68" ry="24"/><ellipse cx="440" cy="150" rx="68" ry="24"/><ellipse cx="645" cy="181" rx="68" ry="24"/></g><path data-testid="fishing-line" d="M50 274Q135 70 440 150" fill="none" stroke="#f6f2cf" stroke-width="1.8"/><path d="M15 286L91 188" stroke="#dbbd7e" stroke-width="9" stroke-linecap="round"/><path d="M30 267L91 188" stroke="#846541" stroke-width="3"/><g data-testid="fishing-float-position"><g class="lf-float" data-testid="fishing-float"><ellipse class="lf-ripple" cx="0" cy="8" rx="25" ry="8" fill="none" stroke="#e2f7ef" stroke-width="2"/><path d="M0-21V9" stroke="#f9f3c3" stroke-width="3"/><ellipse cy="-1" rx="7" ry="12" fill="#fff5cb"/><path d="M-7-1a7 12 0 0114 0Z" fill="#df6e4f"/></g></g></svg><div class="lf-river-label" data-testid="fishing-stage"></div><div class="lf-catch-pop" data-testid="fishing-catch-pop" hidden></div><div class="lf-overlay" data-testid="fishing-paused" hidden>已暂停</div></div><div class="lf-body"><div class="lf-message" data-testid="fishing-message" role="status" aria-live="polite"></div><div class="lf-spots">${[0,1,2].map((n)=>`<button type="button" data-game-action="select" data-spot="${n}" data-testid="fishing-spot-${n}" aria-pressed="false">${['左边水湾','河流中间','右边芦苇'][n]}<span class="lf-spot-hint"></span></button>`).join('')}</div><div class="lf-meter-wrap"><div><div class="lf-meter-title"><span>收线进度</span><span data-testid="fishing-progress-label">0%</span></div><div class="lf-meter" role="progressbar" aria-label="收线进度" aria-valuemin="0" aria-valuemax="100" data-testid="fishing-progress"><div class="lf-meter-fill"></div></div></div><div><div class="lf-meter-title"><span>鱼线松紧</span><span data-testid="fishing-tension-label">等待抛竿</span></div><div class="lf-meter lf-tension" role="meter" aria-label="鱼线松紧" aria-valuemin="0" aria-valuemax="100" data-testid="fishing-tension"><span class="lf-needle"></span></div></div></div><div class="lf-controls"><button class="lf-primary" type="button" data-game-action="cast" data-testid="fishing-cast">抛竿</button><button class="lf-hook" type="button" data-game-action="hook" data-testid="fishing-hook">提竿</button><button class="lf-reel" type="button" data-game-action="reel" data-testid="fishing-reel" aria-pressed="false">按住收线</button></div><div class="lf-bag"><strong style="font-size:13px">收获篮</strong>${[0,1,2].map(n=>`<span class="lf-catch" data-testid="fishing-catch-${n}">等待收获</span>`).join('')}</div><p class="lf-help">键盘：← → 选钓点，空格抛竿 / 提竿；咬钩后按住空格收线，松开空格放松鱼线。</p><div class="lf-end" data-testid="fishing-result" hidden><strong></strong><span></span><small></small></div></div>`;container.appendChild(el);const q=s=>el.querySelector(s),qa=s=>Array.from(el.querySelectorAll(s));const spots=qa('[data-game-action="select"]'),cast=q('[data-game-action="cast"]'),hook=q('[data-game-action="hook"]'),reel=q('[data-game-action="reel"]');
function emit(action){if(disposed||paused||state.phase!=='playing')return;options.onAction(action);}
function release(){held=false;if(!disposed&&!paused&&state.phase==='playing'&&state.stage==='reeling'&&state.reeling)emit({type:'reel',active:false});}
function press(e){if(e){e.preventDefault();if(e.pointerId!==undefined&&reel.setPointerCapture)try{reel.setPointerCapture(e.pointerId);}catch(_){}}if(paused||disposed||state.stage!=='reeling')return;held=true;emit({type:'reel',active:true});}
const listeners=[];function listen(target,type,fn,opt){target.addEventListener(type,fn,opt);listeners.push(()=>target.removeEventListener(type,fn,opt));}
spots.forEach((b,i)=>listen(b,'click',()=>emit({type:'select',spot:i})));listen(cast,'click',()=>emit({type:'cast'}));listen(hook,'click',()=>emit({type:'hook'}));listen(reel,'pointerdown',press);listen(reel,'pointerup',release);listen(reel,'pointercancel',release);listen(reel,'lostpointercapture',release);listen(win,'pointerup',release);listen(win,'blur',release);listen(doc,'visibilitychange',()=>{if(doc.hidden)release();last=0;});
function nativeKeyTarget(target){return target?.closest?.('button,a[href],input,textarea,select,summary,[contenteditable="true"],[role="button"]');}
function keydown(e){if(disposed||paused||state.phase!=='playing'||e.altKey||e.ctrlKey||e.metaKey)return;const control=nativeKeyTarget(e.target);if(control){if(control===reel&&e.code==='Space'){e.preventDefault();if(!e.repeat)press();}return;}if(!['Space','ArrowLeft','ArrowRight'].includes(e.code))return;e.preventDefault();if(e.repeat)return;if(e.code==='ArrowLeft'||e.code==='ArrowRight'){emit({type:'select',spot:(state.selectedSpot+(e.code==='ArrowLeft'?2:1))%3});return;}if(state.stage==='casting')emit({type:'cast'});else if(state.stage==='waiting'||state.stage==='bite')emit({type:'hook'});else if(state.stage==='reeling')press();}
function keyup(e){if(e.code==='Space'){const control=nativeKeyTarget(e.target);if(!paused&&!disposed&&(!control||control===reel))e.preventDefault();release();}}
listen(win,'keydown',keydown);listen(win,'keyup',keyup);listen(doc,'focusin',e=>{if(held&&nativeKeyTarget(e.target)!==reel)release();});
function render(){const active=!paused&&state.phase==='playing',reeling=state.stage==='reeling';q('[data-testid="fishing-time"]').textContent=Math.ceil((state.limitMs-state.elapsedMs)/1000)+' 秒';q('[data-testid="fishing-time"]').dataset.low=String(state.limitMs-state.elapsedMs<10000);q('[data-testid="fishing-lives"]').textContent='机会 '+(3-state.mistakes)+'/3';const msg=q('[data-testid="fishing-message"]'),message=state.config.mode==='practice'&&state.phase==='won'?'练习完成！本次收获只作练习记录，不加入仓库或收藏。':state.message;if(lastMessage!==message){msg.textContent=message;lastMessage=message;}msg.dataset.alert=String(state.stage==='bite'||(reeling&&state.tension>75));q('[data-testid="fishing-stage"]').textContent={casting:'找鱼影 · 选钓点',waiting:'耐心等浮标下沉',bite:'咬钩了！快提竿',reeling:'一收一松 · 稳住鱼线',celebrate:'收获入篮'}[state.stage];spots.forEach((b,i)=>{b.disabled=!active||state.stage!=='casting';b.setAttribute('aria-pressed',String(state.selectedSpot===i));b.querySelector('span').textContent=i===state.targetSpot?'有鱼影游动':'水波轻轻晃';});cast.disabled=!active||state.stage!=='casting';hook.disabled=!active||!['waiting','bite'].includes(state.stage);reel.disabled=!active||!reeling;reel.setAttribute('aria-pressed',String(active&&state.reeling));reel.textContent=state.reeling?'松开，放松鱼线':'按住收线';q('[data-testid="fishing-progress-label"]').textContent=Math.round(state.progress)+'%';q('[data-testid="fishing-progress"]').setAttribute('aria-valuenow',Math.round(state.progress));q('.lf-meter-fill').style.width=state.progress+'%';q('[data-testid="fishing-tension"]').setAttribute('aria-valuenow',Math.round(state.tension));q('.lf-needle').style.left='calc('+state.tension+'% - 2px)';q('[data-testid="fishing-tension-label"]').textContent=!reeling?'等待抛竿':state.tension>=75?'太紧，松开！':state.tension<15?'较松，继续收线':'松紧刚好';const points=[[235,173],[440,150],[645,181]],p=points[state.selectedSpot],t=points[state.targetSpot];q('[data-testid="fishing-shadow"]').setAttribute('transform',`translate(${t[0]},${t[1]+20})`);q('[data-testid="fishing-float-position"]').setAttribute('transform',`translate(${p[0]},${p[1]})`);q('[data-testid="fishing-float-position"]').style.opacity=state.stage==='casting'?'0':'1';q('[data-testid="fishing-float"]').dataset.bite=String(state.stage==='bite');q('[data-testid="fishing-line"]').setAttribute('d',`M91 188Q${p[0]*.55} ${reeling?80:40} ${p[0]} ${p[1]}`);q('[data-testid="fishing-line"]').style.opacity=state.stage==='casting'?'0':'1';state.catches.forEach((x,i)=>{const node=q('[data-testid="fishing-catch-'+i+'"]');node.textContent=({fish:'🐟 ',slipper:'🩴 ',ball:'⚽ ',jar:'🏺 '}[x.kind])+NAMES[x.kind];node.dataset.filled='true';});const pop=q('[data-testid="fishing-catch-pop"]');pop.hidden=state.stage!=='celebrate';pop.textContent='钓到 '+NAMES[state.kind]+'！';q('[data-testid="fishing-paused"]').hidden=!paused;const end=q('[data-testid="fishing-result"]');end.hidden=state.phase==='playing';if(state.phase!=='playing'){const r=result(state);end.querySelector('strong').textContent=state.phase==='won'?'满载而归！':'再来一次，会更稳';end.querySelector('span').textContent='得分 '+r.score+' · 本局收获 '+state.catches.length+'/3';end.querySelector('small').textContent=state.config.mode==='practice'?'练习成绩会保存，本局不增加仓库物资或收藏。':state.phase==='won'?`完成结算后，可获得 ${r.fish} 条鱼${r.collectibles.length?'和 '+r.collectibles.length+' 件旧物收藏':''}。`:'本局未通关，不领取鱼或收藏。原来的库存不会减少。';}}
function loop(now){if(disposed)return;raf=win.requestAnimationFrame(loop);if(paused||doc.hidden||state.phase!=='playing'){last=0;return;}if(!last){last=now;return;}const dt=Math.min(250,Math.floor(now-last));if(dt<16)return;last=now;emit({type:'tick',dt});}
render();raf=win.requestAnimationFrame(loop);return{update(next){if(disposed)return;validate(next);state=clone(next);if(state.stage!=='reeling')held=false;render();},setPaused(value){if(disposed)return;if(value&&!paused)release();paused=!!value;held=false;last=0;render();},dispose(){if(disposed)return;held=false;disposed=true;win.cancelAnimationFrame(raf);listeners.forEach(fn=>fn());el.remove();}};
}
return{id:'fishing',version:1,title:'河边钓鱼',create,step,validate,result,mount};
});

;
(function (root, factory) {
  'use strict';
  const game = factory();
  if (typeof module === 'object' && module.exports) module.exports = game;
  root.LiangGames = root.LiangGames || {};
  root.LiangGames.kitchen = game;
})(typeof globalThis === 'object' ? globalThis : this, function () {
  'use strict';
  const RECIPES = [
    { id: 'steam', title: '清蒸鱼饭', cuts: 3, min: 90, max: 120, cookMs: 5000, colour: '#42a594', garnish: '葱段' },
    { id: 'tomato', title: '番茄鱼汤', cuts: 4, min: 110, max: 145, cookMs: 5500, colour: '#e58057', garnish: '番茄' },
    { id: 'pan', title: '香煎鱼饭', cuts: 3, min: 130, max: 170, cookMs: 4500, colour: '#cb9e41', garnish: '配菜' }
  ];
  const STATIONS = ['prep', 'stove', 'serve'];
  const STAGES = ['empty', 'raw', 'chopped', 'cooking', 'plated'];
  const HEAT = ['关火', '小火', '中火', '大火'];
  const CUT_GAP = 180;
  const copy = value => JSON.parse(JSON.stringify(value));
  const integer = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;
  const recipeFor = (s, slot) => RECIPES.find(r => r.id === s.orders[slot.order]?.recipeId);
  const cookTarget = (s, r) => r.cookMs + s.config.difficulty * 1200;
  const emptySlot = () => ({ stage: 'empty', order: -1, cuts: 0, heat: 0, temp100: 2500, cookMs: 0, scorchMs: 0, lastCutMs: -CUT_GAP });
  function create(config) {
    config = config || {};
    const c = {
      seed: config.seed == null ? 1731 : config.seed,
      difficulty: config.difficulty == null ? 0 : config.difficulty,
      mode: config.mode == null ? 'practice' : config.mode,
      units: config.units == null ? 3 : config.units
    };
    if (!integer(c.seed, 0, 0xffffffff) || !integer(c.difficulty, 0, 2) || !['practice', 'inventory'].includes(c.mode) || !integer(c.units, 1, 3)) throw new Error('厨房配置无效。');
    let seed = c.seed >>> 0;
    const next = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed; };
    const offset = next() % RECIPES.length;
    const orders = Array.from({ length: c.units }, (_, i) => ({ id: 'order-' + (i + 1), recipeId: RECIPES[(offset + i) % RECIPES.length].id, status: 'waiting' }));
    return {
      phase: 'playing', config: c, elapsedMs: 0, timeLimitMs: 55000 + c.units * 30000 - c.difficulty * 8000,
      station: 'prep', activeSlot: 0, orders, slots: [emptySlot(), emptySlot()], served: 0, mistakes: 0,
      actions: 0, notice: '先选一张订单取料。两口锅可以同时做菜；换操作台时，锅里的菜还会继续加热。', reason: ''
    };
  }
  function validate(s) {
    const fail = () => { throw new Error('厨房存档无效。'); };
    if (!s || !['playing', 'won', 'lost'].includes(s.phase) || !s.config || !integer(s.config.seed, 0, 0xffffffff) || !integer(s.config.difficulty, 0, 2) || !['practice', 'inventory'].includes(s.config.mode) || !integer(s.config.units, 1, 3)) fail();
    if (!integer(s.elapsedMs, 0, 200000) || s.timeLimitMs !== 55000 + s.config.units * 30000 - s.config.difficulty * 8000 || s.elapsedMs > s.timeLimitMs || !STATIONS.includes(s.station) || !integer(s.activeSlot, 0, 1) || !integer(s.served, 0, s.config.units) || !integer(s.mistakes, 0, 1000000) || !integer(s.actions, 0, 1000000) || typeof s.notice !== 'string' || typeof s.reason !== 'string') fail();
    if (!Array.isArray(s.orders) || s.orders.length !== s.config.units || !Array.isArray(s.slots) || s.slots.length !== 2) fail();
    if (s.orders.some((o, i) => !o || o.id !== 'order-' + (i + 1) || !RECIPES.some(r => r.id === o.recipeId) || !['waiting', 'cooking', 'served'].includes(o.status))) fail();
    if (s.served !== s.orders.filter(o => o.status === 'served').length) fail();
    const assigned = new Set();
    for (const slot of s.slots) {
      if (!slot || !STAGES.includes(slot.stage) || !integer(slot.order, -1, s.orders.length - 1) || !integer(slot.cuts, 0, 4) || !integer(slot.heat, 0, 3) || !integer(slot.temp100, 2500, 30000) || !integer(slot.cookMs, 0, 20000) || !integer(slot.scorchMs, 0, 7000) || !integer(slot.lastCutMs, -CUT_GAP, s.elapsedMs)) fail();
      if (slot.stage === 'empty') {
        if (slot.order !== -1 || slot.cuts || slot.heat || slot.cookMs || slot.scorchMs || slot.temp100 !== 2500) fail();
      } else {
        const r = recipeFor(s, slot);
        if (!r || assigned.has(slot.order) || s.orders[slot.order].status !== 'cooking' || slot.cuts > r.cuts || slot.cookMs > cookTarget(s, r)) fail();
        assigned.add(slot.order);
        if (slot.stage === 'raw' && slot.cuts >= r.cuts) fail();
        if (slot.stage !== 'raw' && slot.cuts !== r.cuts) fail();
        if (slot.stage !== 'cooking' && slot.heat !== 0) fail();
        if (slot.stage === 'plated' && slot.cookMs !== cookTarget(s, r)) fail();
      }
    }
    if (s.orders.some((o, i) => o.status === 'cooking' && !assigned.has(i))) fail();
    if (s.phase === 'won' && (s.served !== s.config.units || s.slots.some(x => x.stage !== 'empty') || !s.actions)) fail();
    if (s.phase === 'playing' && (s.elapsedMs >= s.timeLimitMs || s.served === s.config.units)) fail();
    return true;
  }
  function step(state, action) {
    validate(state);
    const s = copy(state);
    if (s.phase !== 'playing' || !action || typeof action !== 'object' || Array.isArray(action)) return s;
    const slot = s.slots[s.activeSlot];
    const r = recipeFor(s, slot);
    const say = message => { s.notice = message; return s; };
    const mistake = message => { s.mistakes += 1; return say(message); };
    if (action.type === 'tick') {
      if (!integer(action.dt, 1, 250)) return s;
      const dt = Math.min(action.dt, s.timeLimitMs - s.elapsedMs);
      s.elapsedMs += dt;
      for (let i = 0; i < s.slots.length; i++) {
        const pot = s.slots[i];
        if (pot.stage !== 'cooking') continue;
        const recipe = recipeFor(s, pot);
        const before = pot.temp100;
        // Integer hundredths of a degree avoid accumulated floating-point state.
        const rate = pot.heat * 1600 - Math.round((before - 2500) * 20 / 100);
        pot.temp100 = Math.max(2500, Math.min(30000, before + Math.round(rate * dt / 1000)));
        const temp = Math.round((before + pot.temp100) / 2);
        const target = cookTarget(s, recipe);
        if (temp >= recipe.min * 100 && temp <= recipe.max * 100) pot.cookMs = Math.min(target, pot.cookMs + dt);
        if (temp > (recipe.max + 12) * 100) pot.scorchMs = Math.min(7000, pot.scorchMs + dt);
        else pot.scorchMs = Math.max(0, pot.scorchMs - Math.round(dt / 2));
        if (pot.scorchMs >= 6500 - s.config.difficulty * 750) {
          s.phase = 'lost';
          s.reason = '锅 ' + (i + 1) + ' 过热太久，菜烧焦了。下次看到红色提醒就先关火降温。';
          s.notice = s.reason;
          break;
        }
      }
      if (s.phase === 'playing' && s.elapsedMs >= s.timeLimitMs) {
        s.phase = 'lost';
        s.reason = '时间到了，还有订单没有上菜。下次可以让两口锅同时工作。';
        s.notice = s.reason;
      }
      return s;
    }
    if (action.type === 'station') {
      if (!STATIONS.includes(action.station)) return s;
      s.station = action.station;
      s.notice = action.station === 'prep' ? '选空锅和订单取料，再把配菜切好。' : action.station === 'stove' ? '选择锅，放入食材并调火。绿色温度区间内，熟度才会增加。' : '选择已装盘的料理，点“上菜”。';
      return s;
    }
    if (action.type === 'slot') {
      if (!integer(action.slot, 0, 1)) return s;
      s.activeSlot = action.slot;
      return s;
    }
    if (action.type === 'take') {
      if (!integer(action.order, 0, s.orders.length - 1)) return s;
      if (s.station !== 'prep') return say('取料要到备料台。');
      if (slot.stage !== 'empty') return say('这口锅正在使用，换一口空锅。');
      if (s.orders[action.order].status !== 'waiting') return say('这张订单已经开始制作，请选另一张。');
      slot.order = action.order;
      slot.stage = 'raw';
      s.orders[action.order].status = 'cooking';
      s.actions += 1;
      return say('食材放好了。点击“切配菜”，每次一刀。');
    }
    if (action.type === 'cut') {
      if (s.station !== 'prep' || slot.stage !== 'raw') return say('先在备料台为这口锅取料。');
      if (s.elapsedMs - slot.lastCutMs < CUT_GAP) return say('慢一点切，等刀落稳再切下一刀。');
      slot.lastCutMs = s.elapsedMs;
      slot.cuts += 1;
      s.actions += 1;
      if (slot.cuts >= r.cuts) { slot.stage = 'chopped'; return say('切好了！到炉灶区，把食材放进锅里。'); }
      return say('还要切 ' + (r.cuts - slot.cuts) + ' 刀。');
    }
    if (action.type === 'load') {
      if (s.station !== 'stove' || slot.stage !== 'chopped') return say('食材切好后，才能在炉灶区下锅。');
      slot.stage = 'cooking';
      slot.heat = 2;
      s.actions += 1;
      return say('已经下锅。目标温度是 ' + r.min + '–' + r.max + '°C；太热就转小火或关火。');
    }
    if (action.type === 'heat') {
      if (!integer(action.level, 0, 3)) return s;
      if (s.station !== 'stove' || slot.stage !== 'cooking') return say('选正在烹调的锅，再调火。');
      slot.heat = action.level;
      s.actions += 1;
      return say(HEAT[slot.heat] + (slot.heat === 0 ? '了，温度会慢慢下降。锅还热，别忘了回来查看。' : '。注意两口锅的温度，随时可以换台备料。'));
    }
    if (action.type === 'plate') {
      if (s.station !== 'stove' || slot.stage !== 'cooking') return say('选正在烹调的锅，熟了再装盘。');
      if (slot.cookMs < cookTarget(s, r)) return mistake('还没有熟。让温度保持在绿色区间，熟度达到 100% 再装盘。');
      slot.stage = 'plated'; slot.heat = 0; s.actions += 1;
      return say('已装盘，自动关火。到出餐台上菜！');
    }
    if (action.type === 'serve') {
      if (s.station !== 'serve' || slot.stage !== 'plated') return say('先把做熟的菜装盘，再到出餐台上菜。');
      s.orders[slot.order].status = 'served';
      s.slots[s.activeSlot] = emptySlot();
      s.served += 1; s.actions += 1;
      if (s.served === s.config.units) {
        s.phase = 'won';
        s.reason = s.config.units + ' 份料理全部上桌！你照顾好了火候，也完成了每张订单。';
        return say(s.reason);
      }
      return say('上菜成功！还差 ' + (s.config.units - s.served) + ' 份。空锅可以回备料台继续做。');
    }
    return s;
  }
  function result(s) {
    validate(s);
    if (s.phase === 'playing') return null;
    if (s.phase === 'lost') return { status: 'lost', score: 0, meals: 0 };
    return { status: 'won', score: Math.max(1, s.served * 100 + Math.floor((s.timeLimitMs - s.elapsedMs) / 1000) - s.mistakes * 15), meals: s.served };
  }
  function mount(container, options) {
    if (!container || typeof container.appendChild !== 'function' || !options || typeof options.onAction !== 'function') throw new Error('厨房需要可用的容器和动作回调。');
    validate(options.state);
    let state = copy(options.state), paused = false, disposed = false, timer = null, lastTime = 0;
    const document = container.ownerDocument;
    const el = document.createElement('section');
    el.className = 'lg-kitchen'; el.tabIndex = 0; el.setAttribute('aria-label', '外婆的厨房游戏'); el.dataset.testid = 'kitchen-game';
    const fishSVG = '<svg viewBox="0 0 180 100" aria-hidden="true"><ellipse cx="85" cy="52" rx="51" ry="29" fill="#bedde3" stroke="#397984" stroke-width="4"/><path d="M130 52l34-26v52z" fill="#86bdc8" stroke="#397984" stroke-width="4"/><path d="M63 31q-16 20 0 42M75 31q-16 20 0 42" fill="none" stroke="#6ca4b0" stroke-width="3"/><circle cx="48" cy="45" r="4" fill="#23515d"/></svg>';
    el.innerHTML = `<style>
      .lg-kitchen{--k-ink:#193e45;--k-soft:#eff6f2;--k-accent:#25766e;color:var(--k-ink);background:#f6f2e8;border-radius:22px;padding:18px;font:16px/1.5 system-ui,-apple-system,"Microsoft YaHei",sans-serif;box-sizing:border-box;outline-offset:4px;max-width:1100px;margin:auto}
      .lg-kitchen *{box-sizing:border-box}.lg-kitchen button{font:inherit;min-height:46px;border:1px solid #a3c1b6;border-radius:12px;background:#fff;color:var(--k-ink);padding:10px 15px;cursor:pointer;touch-action:manipulation}.lg-kitchen button:hover:not(:disabled){background:#e4f4e9;border-color:#25766e}.lg-kitchen button:focus-visible{outline:3px solid #326be0;outline-offset:2px}.lg-kitchen button:disabled{opacity:.5;cursor:default}.lg-kitchen button[aria-pressed="true"]{background:#25766e;color:white;border-color:#17594f}
      .lg-kitchen .k-top{display:flex;gap:12px;align-items:center;justify-content:space-between;flex-wrap:wrap;margin:0}.lg-kitchen h2{font-size:25px;margin:0}.lg-kitchen p{margin:5px 0;color:inherit}.lg-kitchen .k-badge{padding:7px 12px;background:#fff;border:1px solid #d9dacc;border-radius:12px;font-variant-numeric:tabular-nums}.lg-kitchen .k-orders{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:15px 0}.lg-kitchen .k-order{position:relative;background:#fffef9;border-top:6px solid var(--recipe-colour,#42a594);padding:10px 12px;border-radius:7px 7px 13px 13px;box-shadow:0 3px 7px #233e3910}.lg-kitchen .k-order strong{display:block}.lg-kitchen .k-order small{display:block;color:#49616a}.lg-kitchen .k-order[data-status="served"]{background:#def0d9}.lg-kitchen .k-order-status{font-weight:700;margin-top:5px;font-size:14px}
      .lg-kitchen .k-workspace{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(300px,.9fr);gap:14px}.lg-kitchen .k-room{border:2px solid #bdd0c3;border-radius:20px;overflow:hidden;background:repeating-linear-gradient(0deg,transparent 0 54px,#c6dcd12b 54px 56px),repeating-linear-gradient(90deg,#e0ede6 0 54px,#c6dcd18c 54px 56px)}.lg-kitchen .k-rack{height:40px;background:#93b4a6;border-bottom:7px solid #688d7e;display:flex;gap:16px;align-items:center;padding:0 20px;color:#274f43;letter-spacing:10px;font-size:22px}.lg-kitchen .k-pots{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:18px 12px 14px;background:linear-gradient(transparent 72%,#c3a983 72%)}.lg-kitchen .k-pot{padding:12px 8px;min-width:0;background:#fffffff0;text-align:left;position:relative;border:2px solid #9eb9ac}.lg-kitchen .k-pot[aria-pressed="true"]{background:#fff9df;color:var(--k-ink);border:2px solid #af842d;box-shadow:0 0 0 3px #e6c77177}.lg-kitchen .k-pot-title{display:flex;justify-content:space-between;gap:5px;font-size:15px;font-weight:800}.lg-kitchen .k-pot-art{height:90px;position:relative;margin:4px 0}.lg-kitchen .k-pan{position:absolute;border:9px solid #42545d;border-top-width:7px;width:84%;height:58px;left:1%;top:27px;border-radius:14px 14px 40px 40px;background:#bdc3bf;box-shadow:0 5px #1c3541}.lg-kitchen .k-pan:after{content:"";position:absolute;right:-24%;top:6px;width:28%;height:13px;border-radius:0 12px 12px 0;background:#3b4b51}.lg-kitchen .k-pan-food{position:absolute;left:20%;top:9px;width:61%;height:26px;background:var(--recipe-colour,#a7bdb7);border-radius:50%;opacity:0}.lg-kitchen .k-pot[data-stage="raw"] .k-pan-food,.lg-kitchen .k-pot[data-stage="chopped"] .k-pan-food,.lg-kitchen .k-pot[data-stage="cooking"] .k-pan-food,.lg-kitchen .k-pot[data-stage="plated"] .k-pan-food{opacity:1}.lg-kitchen .k-pot[data-stage="plated"] .k-pan{border-color:#f9f8ef;border-width:8px;border-radius:50%;box-shadow:0 3px 0 1px #b4bdaa;background:#fff}.lg-kitchen .k-pot[data-stage="plated"] .k-pan:after{display:none}.lg-kitchen .k-steam{position:absolute;left:25%;top:5px;opacity:0;color:#548477;letter-spacing:7px;font-size:27px}.lg-kitchen .k-pot[data-stage="cooking"] .k-steam{opacity:.65;animation:k-steam 1.8s ease-in-out infinite}.lg-kitchen .k-paused .k-steam,.lg-kitchen.k-paused .k-steam,.lg-kitchen.k-ended .k-steam{animation-play-state:paused}.lg-kitchen .k-pot-detail{font-size:13px;min-height:21px}.lg-kitchen .k-meter{height:10px;background:#dfe7e4;border-radius:6px;margin-top:7px;overflow:hidden}.lg-kitchen .k-meter span{display:block;height:100%;background:#42a594;width:0;transition:width .08s linear}.lg-kitchen .k-pot-alert{min-height:20px;font-size:12px;font-weight:700;color:#a72f21}.lg-kitchen .k-shelf{padding:8px 16px;background:#8baf9e;color:#173f32;font-size:13px;font-weight:700}
      .lg-kitchen .k-controls{min-width:0;background:#fff;border:1px solid #d4dfd6;border-radius:20px;padding:14px}.lg-kitchen .k-tabs{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:0 0 12px;padding:0;border:0}.lg-kitchen .k-tabs button{padding:9px 5px;font-weight:700}.lg-kitchen .k-instruction{min-height:52px;font-size:15px;color:#415b5b}.lg-kitchen .k-pane[hidden]{display:none}.lg-kitchen .k-take-orders{display:flex;gap:7px;flex-wrap:wrap;margin:10px 0}.lg-kitchen .k-take-orders button{flex:1;min-width:100px;font-size:14px}.lg-kitchen .k-prep-art{height:76px;position:relative;background:#ead5a9;border:5px solid #d1b681;border-radius:18px;margin:10px 0}.lg-kitchen .k-prep-art svg{position:absolute;height:70px;width:130px;left:8px;top:-2px}.lg-kitchen .k-chop-count{position:absolute;right:14px;top:18px;font-weight:800;color:#715a31}.lg-kitchen .k-primary{width:100%;background:#25766e;color:#fff;border-color:#17594f;font-weight:800}.lg-kitchen .k-primary:hover:not(:disabled){background:#195e56;color:white}.lg-kitchen .k-heat{display:grid;grid-template-columns:repeat(4,1fr);gap:5px;margin:12px 0}.lg-kitchen .k-heat button{padding:10px 4px}.lg-kitchen .k-thermo{margin:13px 0}.lg-kitchen .k-thermo-track{position:relative;height:16px;border-radius:8px;background:linear-gradient(90deg,#d6e6f2,#fcebc6 60%,#f3bcaa);overflow:visible}.lg-kitchen .k-target-band{position:absolute;top:0;bottom:0;background:#75b798bb}.lg-kitchen .k-temp-marker{position:absolute;width:4px;height:26px;top:-5px;background:#173e49;border-radius:2px;left:0;transform:translateX(-50%)}.lg-kitchen .k-temp-label{display:flex;justify-content:space-between;gap:8px;font-size:14px;margin-top:7px;font-variant-numeric:tabular-nums}.lg-kitchen .k-cooking-progress{font-size:14px;font-weight:700;margin:8px 0}.lg-kitchen .k-serve-art{height:115px;display:grid;place-content:center;border-radius:15px;background:#f2f7ed;font-size:43px;margin:12px 0}.lg-kitchen .k-notice{padding:12px 14px;margin:14px 0 7px;border:1px solid #ccdccc;border-radius:13px;background:#fffdf3;min-height:52px}.lg-kitchen .k-notice[data-kind="won"]{background:#e1f3dc;border-color:#78a967}.lg-kitchen .k-notice[data-kind="lost"]{background:#fff0e5;border-color:#dba98c}.lg-kitchen .k-keys{font-size:12px;color:#536969}.lg-kitchen .k-pause-label{display:none;font-weight:800;color:#835821}.lg-kitchen.k-paused .k-pause-label{display:inline}.lg-kitchen .k-live{font-size:14px;min-height:20px}.lg-kitchen [hidden]{display:none!important}
      @keyframes k-steam{0%,100%{transform:translateY(3px);opacity:.45}50%{transform:translateY(-6px);opacity:.8}}@media(prefers-reduced-motion:reduce){.lg-kitchen .k-steam{animation:none!important}.lg-kitchen .k-meter span{transition:none}}
      @media(max-width:690px){.lg-kitchen{padding:12px;border-radius:16px}.lg-kitchen h2{font-size:21px}.lg-kitchen .k-top{align-items:flex-start;gap:8px}.lg-kitchen .k-top>div:first-child{flex:1;min-width:0}.lg-kitchen .k-top p{font-size:13px}.lg-kitchen .k-badge{font-size:13px;padding:7px 9px}.lg-kitchen .k-orders{gap:6px;margin:10px 0}.lg-kitchen .k-order{padding:8px;font-size:13px}.lg-kitchen .k-order small{font-size:11px}.lg-kitchen .k-workspace{grid-template-columns:1fr;gap:10px}.lg-kitchen .k-room{order:1}.lg-kitchen .k-controls{order:2;padding:11px}.lg-kitchen .k-pot-art{height:56px}.lg-kitchen .k-pan{top:5px;height:48px}.lg-kitchen .k-steam{top:-8px}.lg-kitchen .k-rack{height:23px;font-size:15px}.lg-kitchen .k-pots{padding:8px}.lg-kitchen .k-pot{padding:8px}.lg-kitchen .k-pot-alert{min-height:17px}.lg-kitchen .k-shelf{padding:6px 10px;font-size:11px}.lg-kitchen .k-keys{font-size:11px}.lg-kitchen .k-prep-art{height:64px}.lg-kitchen .k-instruction{font-size:14px;min-height:42px}}

@media(max-width:600px) and (max-height:780px),(orientation:landscape) and (max-height:500px) and (min-width:600px){.lg-kitchen{padding:6px;border-radius:12px}.lg-kitchen .k-top{gap:3px;min-height:24px}.lg-kitchen .k-top>div:first-child{display:none}.lg-kitchen .k-badge{padding:2px 6px;font-size:11px;width:100%;display:flex;justify-content:space-between;gap:8px}.lg-kitchen .k-badge br{display:none}.lg-kitchen .k-orders{gap:4px;margin:4px 0}.lg-kitchen .k-order{padding:4px;border-top-width:3px;font-size:11px}.lg-kitchen .k-order small{font-size:10px;line-height:1.25}.lg-kitchen .k-order-status{font-size:10px;margin-top:2px}.lg-kitchen .k-workspace{gap:5px}.lg-kitchen .k-rack,.lg-kitchen .k-pot-art,.lg-kitchen .k-shelf{display:none}.lg-kitchen .k-pots{gap:4px;padding:4px}.lg-kitchen .k-pot{padding:4px;border-radius:8px}.lg-kitchen .k-pot-title{font-size:11px}.lg-kitchen .k-pot-detail{font-size:11px;min-height:15px;line-height:1.35}.lg-kitchen .k-meter{height:5px;margin-top:3px}.lg-kitchen .k-pot-alert{font-size:10px;min-height:14px;line-height:1.3}.lg-kitchen .k-controls{padding:6px;border-radius:10px}.lg-kitchen .k-tabs{gap:4px;margin:0 0 4px}.lg-kitchen button{min-height:44px;padding:4px 6px;font-size:12px}.lg-kitchen .k-tabs button{padding:4px 2px;font-size:12px}.lg-kitchen .k-instruction{font-size:11px;min-height:0;line-height:1.35;margin:3px 0}.lg-kitchen .k-take-orders{gap:4px;margin:4px 0;flex-wrap:nowrap}.lg-kitchen .k-take-orders button{min-width:0;font-size:11px;padding:3px}.lg-kitchen .k-prep-art{height:34px;border-width:2px;margin:4px 0}.lg-kitchen .k-prep-art svg{height:30px;width:65px}.lg-kitchen .k-chop-count{font-size:12px;top:5px;right:8px}.lg-kitchen .k-thermo{margin:6px 0}.lg-kitchen .k-thermo-track{height:12px}.lg-kitchen .k-temp-marker{height:22px}.lg-kitchen .k-temp-label{font-size:11px;margin-top:4px}.lg-kitchen .k-heat{gap:4px;margin:5px 0}.lg-kitchen .k-heat button{padding:4px}.lg-kitchen .k-cooking-progress{font-size:11px;margin:4px 0}.lg-kitchen .k-serve-art{height:44px;font-size:28px;margin:4px 0}.lg-kitchen .k-live{font-size:12px;min-height:18px}.lg-kitchen .k-notice{font-size:11px;min-height:0;padding:5px 7px;margin:5px 0}.lg-kitchen .k-keys{font-size:10px;margin:4px 0}.lg-kitchen [data-testid=kitchen-load]:disabled{display:none}}
@media(orientation:landscape) and (max-height:500px) and (min-width:600px){.lg-kitchen{display:grid;grid-template-columns:minmax(0,.95fr) minmax(310px,1.05fr);grid-template-rows:24px auto auto;gap:4px 8px;align-items:start}.lg-kitchen .k-top{grid-column:1;grid-row:1}.lg-kitchen .k-orders{grid-column:1;grid-row:2;margin:0}.lg-kitchen .k-workspace{display:contents}.lg-kitchen .k-room{grid-column:1;grid-row:3}.lg-kitchen .k-controls{grid-column:2;grid-row:1/4;padding:4px}.lg-kitchen .k-pane[data-pane=stove]{display:grid;grid-template-columns:1fr 1fr;gap:4px}.lg-kitchen .k-pane[data-pane=stove]>.k-thermo,.lg-kitchen .k-pane[data-pane=stove]>.k-heat{grid-column:1/-1;margin:0}.lg-kitchen .k-pane[data-pane=stove]>.k-cooking-progress{grid-column:1;grid-row:3;align-self:center}.lg-kitchen .k-pane[data-pane=stove]>button{grid-column:2;grid-row:3}.lg-kitchen .k-pane[data-pane=stove]>button:disabled{display:none}.lg-kitchen .k-notice,.lg-kitchen .k-keys{grid-column:1/-1}.lg-kitchen .k-order{font-size:10px}.lg-kitchen .k-order small{font-size:10px}}
    </style>
    <header class="k-top"><div><h2>外婆的厨房</h2><p>看订单、备食材、顾火候，再把菜送上桌。</p></div><div class="k-badge"><strong data-testid="kitchen-progress"></strong><br><span data-testid="kitchen-time"></span> <span class="k-pause-label">已暂停</span></div></header>
    <div class="k-orders" data-testid="kitchen-orders" style="grid-template-columns:repeat(${state.orders.length},minmax(0,1fr))">${state.orders.map((o, i) => `<article class="k-order" data-order-card="${i}"><strong data-order-title="${i}"></strong><small data-order-recipe="${i}"></small><div class="k-order-status" data-order-status="${i}"></div></article>`).join('')}</div>
    <div class="k-workspace"><div class="k-room"><div class="k-rack" aria-hidden="true">♧ ♧ ◇ ♧</div><div class="k-pots">${[0, 1].map(i => `<button class="k-pot" type="button" data-game-action="slot" data-slot="${i}" data-testid="kitchen-slot-${i}" aria-label="选择锅 ${i + 1}"><span class="k-pot-title"><span>锅 ${i + 1}</span><span data-pot-heat="${i}"></span></span><div class="k-pot-art" aria-hidden="true"><span class="k-steam">∿∿</span><div class="k-pan"><span class="k-pan-food"></span></div></div><div class="k-pot-detail" data-pot-name="${i}"></div><div class="k-pot-detail" data-pot-status="${i}"></div><div class="k-meter"><span data-pot-progress="${i}"></span></div><div class="k-pot-alert" data-pot-alert="${i}"></div></button>`).join('')}</div><div class="k-shelf">换台操作不会暂停炉火。两口锅的情况一直显示在这里。</div></div>
    <div class="k-controls"><nav class="k-tabs" aria-label="厨房操作台"><button type="button" data-game-action="station" data-station="prep" data-testid="kitchen-station-prep">① 备料</button><button type="button" data-game-action="station" data-station="stove" data-testid="kitchen-station-stove">② 炉灶</button><button type="button" data-game-action="station" data-station="serve" data-testid="kitchen-station-serve">③ 出餐</button></nav>
    <p class="k-instruction" data-testid="kitchen-instruction"></p>
    <div class="k-pane" data-pane="prep"><div class="k-take-orders">${state.orders.map((o, i) => `<button type="button" data-game-action="take" data-order="${i}" data-testid="kitchen-take-${i}"></button>`).join('')}</div><div class="k-prep-art" aria-hidden="true">${fishSVG}<span class="k-chop-count" data-testid="kitchen-cuts"></span></div><button type="button" class="k-primary" data-game-action="cut" data-testid="kitchen-cut">切配菜</button></div>
    <div class="k-pane" data-pane="stove" hidden><button type="button" class="k-primary" data-game-action="load" data-testid="kitchen-load">食材下锅</button><div class="k-thermo"><div class="k-thermo-track"><span class="k-target-band"></span><span class="k-temp-marker"></span></div><div class="k-temp-label"><strong data-testid="kitchen-temperature"></strong><span data-testid="kitchen-target"></span></div></div><div class="k-heat">${HEAT.map((title, i) => `<button type="button" data-game-action="heat" data-level="${i}" data-testid="kitchen-heat-${i}">${title}</button>`).join('')}</div><p class="k-cooking-progress" data-testid="kitchen-cook-progress"></p><button type="button" class="k-primary" data-game-action="plate" data-testid="kitchen-plate">熟了，装盘</button></div>
    <div class="k-pane" data-pane="serve" hidden><div class="k-serve-art" aria-hidden="true">◉</div><p class="k-live" data-testid="kitchen-serve-name"></p><button type="button" class="k-primary" data-game-action="serve" data-testid="kitchen-serve">上菜</button></div></div></div>
    <div class="k-notice" data-testid="kitchen-notice" role="status" aria-live="polite"></div><p class="k-keys">键盘：1 / 2 / 3 换操作台；A / S 选锅；← / → 调火；空格完成当前步骤。也可以点按钮操作。</p>`;
    container.appendChild(el);
    const $ = selector => el.querySelector(selector);
    const all = selector => Array.from(el.querySelectorAll(selector));
    function emit(action) {
      if (disposed || paused || state.phase !== 'playing') return;
      options.onAction(action);
    }
    function render() {
      const slot = state.slots[state.activeSlot], recipe = recipeFor(state, slot);
      const enabled = !paused && state.phase === 'playing';
      el.classList.toggle('k-paused', paused); el.classList.toggle('k-ended', state.phase !== 'playing'); el.dataset.phase = state.phase;
      $('[data-testid="kitchen-progress"]').textContent = '已上菜 ' + state.served + ' / ' + state.config.units;
      const seconds = Math.ceil((state.timeLimitMs - state.elapsedMs) / 1000);
      $('[data-testid="kitchen-time"]').textContent = '剩余 ' + Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0');
      state.orders.forEach((order, i) => {
        const r = RECIPES.find(x => x.id === order.recipeId), card = $('[data-order-card="' + i + '"]');
        card.dataset.status = order.status; card.style.setProperty('--recipe-colour', r.colour);
        $('[data-order-title="' + i + '"]').textContent = (i + 1) + '. ' + r.title;
        $('[data-order-recipe="' + i + '"]').textContent = '切 ' + r.cuts + ' 刀 · ' + r.min + '–' + r.max + '°C';
        $('[data-order-status="' + i + '"]').textContent = order.status === 'served' ? '✓ 已上菜' : order.status === 'cooking' ? '正在制作' : '等待取料';
        const take = $('[data-testid="kitchen-take-' + i + '"]');
        take.textContent = '订单 ' + (i + 1) + ' 取料'; take.disabled = !enabled || slot.stage !== 'empty' || order.status !== 'waiting';
      });
      state.slots.forEach((pot, i) => {
        const r = recipeFor(state, pot), button = $('[data-testid="kitchen-slot-' + i + '"]');
        button.dataset.stage = pot.stage; button.setAttribute('aria-pressed', String(i === state.activeSlot)); button.disabled = !enabled; button.style.setProperty('--recipe-colour', r?.colour || '#a7bdb7');
        $('[data-pot-name="' + i + '"]').textContent = r ? r.title : '空锅，准备接单';
        $('[data-pot-heat="' + i + '"]').textContent = pot.stage === 'cooking' ? HEAT[pot.heat] : '';
        const ready = r && pot.cookMs >= cookTarget(state, r);
        const status = pot.stage === 'empty' ? '先去备料台' : pot.stage === 'raw' ? '切配 ' + pot.cuts + ' / ' + r.cuts : pot.stage === 'chopped' ? '已切好，等下锅' : pot.stage === 'plated' ? '已装盘，等上菜' : Math.round(pot.temp100 / 100) + '°C · ' + (ready ? '熟了，快装盘' : '熟度 ' + Math.floor(pot.cookMs / cookTarget(state, r) * 100) + '%');
        $('[data-pot-status="' + i + '"]').textContent = status;
        $('[data-pot-progress="' + i + '"]').style.width = (pot.stage === 'raw' ? pot.cuts / r.cuts : pot.stage === 'chopped' || pot.stage === 'plated' ? 1 : pot.stage === 'cooking' ? pot.cookMs / cookTarget(state, r) : 0) * 100 + '%';
        $('[data-pot-alert="' + i + '"]').textContent = state.phase === 'lost' ? (pot.stage === 'cooking' && pot.scorchMs >= 6500 - state.config.difficulty * 750 ? '已烧焦，本局结束' : '本局已结束') : pot.stage === 'cooking' && pot.temp100 > (r.max + 12) * 100 ? '过热！先关火降温' : pot.stage === 'cooking' && pot.scorchMs > 0 ? '正在降温，继续留意' : pot.stage === 'cooking' && ready ? '✓ 可以装盘了' : '';
      });
      all('[data-game-action="station"]').forEach(button => { button.setAttribute('aria-pressed', String(button.dataset.station === state.station)); button.disabled = !enabled; });
      all('[data-pane]').forEach(pane => { pane.hidden = pane.dataset.pane !== state.station; });
      const detail = state.phase === 'lost' ? state.reason + ' 本局已经结束，请点击“结算并返回棋盘”，再开一局重试；原来的仓库材料不会减少。' : state.phase === 'won' ? '料理全部完成！请点击“结算并返回棋盘”保存本局成绩。' : state.station === 'prep' ? (slot.stage === 'empty' ? '已选锅 ' + (state.activeSlot + 1) + '。选一张待做订单取料。' : slot.stage === 'raw' ? '把' + recipe.garnish + '切好：还差 ' + (recipe.cuts - slot.cuts) + ' 刀。每次一刀，不用急。' : '这口锅已备好食材。去炉灶区下锅，或选另一口空锅备料。') : state.station === 'stove' ? (slot.stage === 'cooking' ? '让温度保持在绿色区间。熟度 100% 后马上装盘；离开这里时炉火仍会继续。' : slot.stage === 'chopped' ? '食材已切好，点击下锅。开始用中火，也可随时调火。' : slot.stage === 'plated' ? '料理已装盘。去出餐台完成这张订单。' : '先去备料台取料、切配菜，再回来下锅。') : (slot.stage === 'plated' ? recipe.title + '准备好了，点击上菜。' : '这里接收已经装盘的料理。选一口已装盘的锅再上菜。');
      $('[data-testid="kitchen-instruction"]').textContent = detail;
      $('[data-testid="kitchen-cuts"]').textContent = recipe ? slot.cuts + ' / ' + recipe.cuts + ' 刀' : '等待取料';
      $('[data-testid="kitchen-cut"]').disabled = !enabled || slot.stage !== 'raw';
      $('[data-testid="kitchen-load"]').disabled = !enabled || slot.stage !== 'chopped';
      $('[data-testid="kitchen-temperature"]').textContent = Math.round(slot.temp100 / 100) + '°C';
      $('[data-testid="kitchen-target"]').textContent = recipe ? '目标 ' + recipe.min + '–' + recipe.max + '°C' : '先选择一份料理';
      $('.k-target-band').style.left = (recipe ? (recipe.min - 25) / 275 * 100 : 0) + '%';
      $('.k-target-band').style.width = (recipe ? (recipe.max - recipe.min) / 275 * 100 : 0) + '%';
      $('.k-temp-marker').style.left = (slot.temp100 - 2500) / 27500 * 100 + '%';
      $('[data-testid="kitchen-cook-progress"]').textContent = recipe ? '熟度 ' + Math.floor(slot.cookMs / cookTarget(state, recipe) * 100) + '%' + (slot.scorchMs ? ' · 过热警戒 ' + Math.floor(slot.scorchMs / (6500 - state.config.difficulty * 750) * 100) + '%' : '') : '熟度 0%';
      all('[data-game-action="heat"]').forEach(button => { button.disabled = !enabled || slot.stage !== 'cooking'; button.setAttribute('aria-pressed', String(Number(button.dataset.level) === slot.heat && slot.stage === 'cooking')); });
      $('[data-testid="kitchen-plate"]').disabled = !enabled || slot.stage !== 'cooking' || !recipe || slot.cookMs < cookTarget(state, recipe);
      $('[data-testid="kitchen-serve"]').disabled = !enabled || slot.stage !== 'plated';
      $('[data-testid="kitchen-serve-name"]').textContent = slot.stage === 'plated' ? recipe.title + ' · 一份' : '还没有装盘的料理';
      const notice = $('[data-testid="kitchen-notice"]');
      if (notice.textContent !== state.notice) notice.textContent = state.notice;
      notice.dataset.kind = state.phase;
    }
    function click(event) {
      const button = event.target.closest('[data-game-action]');
      if (!button || !el.contains(button) || button.disabled) return;
      const type = button.dataset.gameAction;
      emit(type === 'station' ? { type, station: button.dataset.station } : type === 'slot' ? { type, slot: Number(button.dataset.slot) } : type === 'take' ? { type, order: Number(button.dataset.order) } : type === 'heat' ? { type, level: Number(button.dataset.level) } : { type });
    }
    function key(event) {
      if (disposed || paused || state.phase !== 'playing' || event.altKey || event.ctrlKey || event.metaKey || event.repeat) return;
      const tag = event.target.tagName?.toLowerCase();
      if (['input', 'textarea', 'select'].includes(tag)) return;
      let action = null;
      if (['1', '2', '3'].includes(event.key)) action = { type: 'station', station: STATIONS[Number(event.key) - 1] };
      else if (['a', 'A', 's', 'S'].includes(event.key)) action = { type: 'slot', slot: event.key.toLowerCase() === 'a' ? 0 : 1 };
      else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') action = { type: 'heat', level: Math.max(0, Math.min(3, state.slots[state.activeSlot].heat + (event.key === 'ArrowLeft' ? -1 : 1))) };
      else if (event.code === 'Space' || event.key === ' ') {
        const pot = state.slots[state.activeSlot];
        if (state.station === 'prep') action = pot.stage === 'empty' ? { type: 'take', order: state.orders.findIndex(o => o.status === 'waiting') } : { type: 'cut' };
        else if (state.station === 'stove') action = { type: pot.stage === 'chopped' ? 'load' : 'plate' };
        else action = { type: 'serve' };
      }
      if (action) { event.preventDefault(); emit(action); }
    }
    function stopTimer() { if (timer != null) { clearInterval(timer); timer = null; } }
    function syncTimer() {
      if (disposed || paused || state.phase !== 'playing') return stopTimer();
      if (timer != null) return;
      lastTime = Date.now();
      timer = setInterval(() => {
        if (disposed || paused || state.phase !== 'playing') return;
        const now = Date.now(), dt = Math.max(1, Math.min(250, now - lastTime));
        lastTime = now;
        emit({ type: 'tick', dt });
      }, 100);
    }
    el.addEventListener('click', click); el.addEventListener('keydown', key);
    render(); syncTimer();
    return {
      update(next) {
        if (disposed) return;
        validate(next);
        if (next.config.units !== state.config.units) throw new Error('同一厨房局不能更换订单数量。');
        state = copy(next); render(); syncTimer();
      },
      setPaused(value) { if (disposed) return; paused = Boolean(value); render(); syncTimer(); },
      dispose() { if (disposed) return; disposed = true; stopTimer(); el.removeEventListener('click', click); el.removeEventListener('keydown', key); el.remove(); }
    };
  }
  return { id: 'kitchen', version: 1, title: '外婆的厨房', create, step, validate, result, mount };
});

;
/* G10: deterministic packing game. Only the universe host transfers inventory. */
(function(root,factory){const game=factory();if(typeof module==='object'&&module.exports)module.exports=game;else(root.LiangGames||(root.LiangGames={})).trunk=game;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const id='trunk',version=1,title='后备箱大师';
const clone=value=>JSON.parse(JSON.stringify(value));
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const assert=(condition,message)=>{if(!condition)throw Error(message);};
const integer=(n,min,max)=>Number.isSafeInteger(n)&&n>=min&&n<=max;
const SHAPES={curry:[[0,0],[1,0],[2,0],[1,1]],durian:[[1,0],[2,0],[0,1],[1,1]],drinks:[[0,0],[1,0],[0,1],[1,1]],vegetables:[[0,0],[0,1],[1,1]],basket:[[0,0],[1,0],[2,0],[0,1],[0,2]],fish:[[0,0],[1,0],[1,1]],meal:[[0,0],[1,0],[0,1],[1,1]]};
const LABELS={curry:'咖喱锅',durian:'榴莲袋',drinks:'饮料箱',vegetables:'青菜袋',basket:'青菜篮',fish:'鱼箱',meal:'料理盒'};
const COLORS={curry:'#f1ad52',durian:'#bace69',drinks:'#72c6e9',vegetables:'#70cf9b',basket:'#c3d78c',fish:'#88c5ea',meal:'#f2b67f'};
function normalized(config={}){
 const seed=config.seed??1,difficulty=config.difficulty??0,mode=config.mode??'practice';
 assert(integer(seed,0,4294967295),'装箱种子无效。');assert(integer(difficulty,0,2),'装箱难度无效。');assert(['practice','inventory'].includes(mode),'装箱模式无效。');
 const out={seed,difficulty,mode};
 if(config.units!==undefined){assert(integer(config.units,1,3),'货物组数无效。');out.units=config.units;}
 if(mode==='inventory'){
  assert(Array.isArray(config.cargo)&&config.cargo.length>=1&&config.cargo.length<=12,'每次请选择 1 至 12 件货物。');
  out.cargo=config.cargo.map(c=>{assert(c&&typeof c.id==='string'&&/^[A-Za-z0-9:_-]{1,100}$/.test(c.id)&&!['__proto__','constructor','prototype'].includes(c.id)&&['fish','meal'].includes(c.itemId)&&c.qty===1,'货物编号或数量无效。');return{id:c.id,itemId:c.itemId,qty:1};});
  assert(new Set(out.cargo.map(c=>c.id)).size===out.cargo.length,'货物编号不能重复。');
 }else assert(config.cargo===undefined||Array.isArray(config.cargo)&&config.cargo.length===0,'练习货物不能混入真实库存。');
 return out;
}
function generator(seed){let x=seed>>>0;return()=>{x=(Math.imul(1664525,x)+1013904223)>>>0;return x;};}
function piecesFor(config){
 let pieces=config.mode==='inventory'?config.cargo.map(c=>({...c,kind:c.itemId})):['curry','durian','drinks','vegetables',...(config.difficulty>=1?['basket']:[]),...(config.difficulty>=2?['drinks']:[])].map((kind,i)=>({id:'practice-'+i,itemId:null,qty:1,kind}));
 const random=generator(config.seed);
 pieces=pieces.map(p=>({...p,rotation:config.difficulty===0?0:random()%4}));
 if(config.difficulty>0)for(let i=pieces.length-1;i>0;i--){const j=random()%(i+1);[pieces[i],pieces[j]]=[pieces[j],pieces[i]];}
 return pieces;
}
function layout(config){const width=6,height=config.difficulty===2?5:4,blocked=config.difficulty===0?[]:config.difficulty===1?[[0,0],[5,0]]:[[0,0],[5,0],[0,4],[5,4]];return{width,height,blocked,limitMs:[180000,150000,120000][config.difficulty]};}
function cells(piece,rotation=piece.rotation){
 let points=SHAPES[piece.kind].map(p=>p.slice());
 for(let i=0;i<rotation;i++){points=points.map(([x,y])=>[-y,x]);const minX=Math.min(...points.map(p=>p[0])),minY=Math.min(...points.map(p=>p[1]));points=points.map(([x,y])=>[x-minX,y-minY]);}
 return points;
}
function occupied(state,except=null){const map=new Map();for(const [key,at]of Object.entries(state.placements)){if(key===except)continue;const piece=state.pieces.find(p=>p.id===key);for(const [dx,dy]of cells(piece))map.set((at.x+dx)+','+(at.y+dy),key);}return map;}
function fits(state,piece,x,y,rotation=piece.rotation){
 const map=occupied(state,piece.id),blocked=new Set(state.grid.blocked.map(p=>p.join(',')));
 for(const [dx,dy]of cells(piece,rotation)){const px=x+dx,py=y+dy,key=px+','+py;if(px<0||py<0||px>=state.grid.width||py>=state.grid.height)return'outside';if(blocked.has(key))return'wheel';if(map.has(key))return'collision';}
 return null;
}
function count(state){return Object.keys(state.placements).length;}
function create(config){
 config=normalized(config);return{version,config,phase:'playing',elapsedMs:0,grid:layout(config),pieces:piecesFor(config),placements:{},selected:null,moves:0,placementsMade:0,mistakes:0,lastEvent:'start',notice:config.mode==='practice'?'把所有练习物品装进车里，再核对清单发车。':'选好位置装货。只有装进车里的货物会运到 Masai。'};
}
function validate(state){
 assert(state&&state.version===version,'装箱存档版本无效。');const config=normalized(state.config),expected=piecesFor(config);
 assert(same(config,state.config)&&same(layout(config),state.grid),'装箱关卡配置被改变。');
 assert(['playing','won','lost'].includes(state.phase)&&integer(state.elapsedMs,0,state.grid.limitMs),'装箱阶段或时间无效。');
 assert(Array.isArray(state.pieces)&&state.pieces.length===expected.length,'装箱物品清单无效。');
 state.pieces.forEach((p,i)=>assert(p&&p.id===expected[i].id&&p.itemId===expected[i].itemId&&p.kind===expected[i].kind&&p.qty===1&&integer(p.rotation,0,3),'装箱物品被改变。'));
 assert(state.placements&&typeof state.placements==='object'&&!Array.isArray(state.placements),'装箱位置无效。');
 for(const [key,at]of Object.entries(state.placements)){const p=state.pieces.find(item=>item.id===key);assert(p&&at&&integer(at.x,0,state.grid.width-1)&&integer(at.y,0,state.grid.height-1),'货物坐标无效。');assert(!fits(state,p,at.x,at.y),'货物重叠或超出后备箱。');}
 assert(state.selected===null||state.pieces.some(p=>p.id===state.selected),'所选货物无效。');
 assert(integer(state.moves,0,1000000)&&integer(state.placementsMade,0,state.moves)&&integer(state.mistakes,0,1000000),'装箱操作记录无效。');
 assert(typeof state.notice==='string'&&state.notice.length<=200&&typeof state.lastEvent==='string'&&state.lastEvent.length<=30,'装箱提示无效。');
 assert(state.phase!=='playing'||state.elapsedMs<state.grid.limitMs,'已经超时的装箱局不能继续。');
 assert(state.phase!=='lost'||state.elapsedMs===state.grid.limitMs,'失败原因无效。');
 if(state.phase==='won')assert(state.elapsedMs<state.grid.limitMs&&state.placementsMade>0&&count(state)>0&&(config.mode==='inventory'||count(state)===state.pieces.length),'没有实际装好的货物，不能结算。');
 return true;
}
function refusal(s,why){s.mistakes++;s.lastEvent=why;s.notice=why==='outside'?'这件货物伸到车外了。换个位置，或转个方向。':why==='wheel'?'灰色位置是轮拱，不能放货。试试旁边的空位。':'这里已有货物。先挪开它，或找另一个位置。';return s;}
function step(state,action){
 validate(state);assert(action&&typeof action.type==='string','装箱操作无效。');const s=clone(state);if(s.phase!=='playing')return s;
 if(action.type==='tick'){assert(integer(action.dt,1,250),'计时步长无效。');s.elapsedMs=Math.min(s.grid.limitMs,s.elapsedMs+action.dt);if(s.elapsedMs===s.grid.limitMs){s.phase='lost';s.lastEvent='timeout';s.notice='这一轮时间到了。货物还在出发地，没有扣除。可以重新挑战。';}return s;}
 if(action.type==='ship'){
  if(!count(s)||!s.placementsMade){s.mistakes++;s.lastEvent='empty';s.notice='先把至少一件货物放进车里，才能发车。';return s;}
  if(s.config.mode==='practice'&&count(s)!==s.pieces.length){s.mistakes++;s.lastEvent='incomplete';s.notice='练习关要装齐所有物品。还没装下的可以换个方向。';return s;}
  s.phase='won';s.lastEvent='shipped';s.notice=s.config.mode==='inventory'?'装车清单已完成。返回棋盘后由仓库保存运输结果。':'全部装好了！练习物品不进入共享仓库。';return s;
 }
 assert(['select','place','rotate','remove'].includes(action.type),'不支持这个装箱操作。');
 const key=action.id??s.selected,p=s.pieces.find(item=>item.id===key);if(!p){assert(action.id===undefined,'这件货物不在本次清单中。');s.notice='先选一件货物。';s.lastEvent='select-needed';return s;}
 s.selected=p.id;
 if(action.type==='select'){s.notice=LABELS[p.kind]+'：点空格放置，或拖进后备箱。R 键可以旋转。';s.lastEvent='selected';return s;}
 if(action.type==='rotate'){
  const direction=action.direction??1;assert(direction===1||direction===-1,'旋转方向无效。');const next=(p.rotation+direction+4)%4,at=s.placements[p.id];
  if(at){const why=fits(s,p,at.x,at.y,next);if(why)return refusal(s,why);s.moves++;}
  p.rotation=next;s.lastEvent='rotated';s.notice='已旋转 '+LABELS[p.kind]+'。';return s;
 }
 if(action.type==='remove'){if(s.placements[p.id]){delete s.placements[p.id];s.moves++;s.lastEvent='removed';s.notice=LABELS[p.kind]+' 已取回，还可以重新摆放。';}else{s.lastEvent='not-packed';s.notice='这件货物还在车外，可以直接放进空位。';}return s;}
 assert(integer(action.x,-20,20)&&integer(action.y,-20,20),'放置坐标无效。');const why=fits(s,p,action.x,action.y);if(why)return refusal(s,why);
 s.placements[p.id]={x:action.x,y:action.y};s.moves++;s.placementsMade++;s.lastEvent='placed';s.notice=count(s)===s.pieces.length?'都装进去了！检查清单，再按“核对并发车”。':LABELS[p.kind]+' 放好了。继续试试其他货物。';return s;
}
function result(state){
 validate(state);if(state.phase==='playing')return null;const won=state.phase==='won',packed=won?count(state):0,area=won?occupied(state).size:0,capacity=state.grid.width*state.grid.height-state.grid.blocked.length;
 return{status:state.phase,score:won?Math.max(1,packed*100+Math.floor(area/capacity*100)+Math.floor((state.grid.limitMs-state.elapsedMs)/1000)*2-state.mistakes*4-Math.max(0,state.moves-packed)):0,shipped:won&&state.config.mode==='inventory'?state.config.cargo.filter(c=>Object.hasOwn(state.placements,c.id)).map(c=>({...c})):[],packed,total:state.pieces.length,usedCells:area,capacity};
}
function esc(value){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function icon(kind){
 if(kind==='fish')return'<path d="M5 15q9-12 20 0Q14 27 5 15l-5-6v12z" fill="#245b78"/><circle cx="21" cy="13" r="1.5" fill="white"/>';
 if(kind==='drinks')return'<rect x="6" y="5" width="12" height="22" rx="4" fill="#267391"/><rect x="8" y="1" width="8" height="6" rx="2" fill="#e9ffff"/><path d="M6 13h12v7H6" fill="#e9ffff"/>';
 if(kind==='vegetables'||kind==='basket')return'<path d="M13 29V12M13 20Q-2 18 3 4q14 0 10 16M13 16Q11 0 25 2q3 14-12 14" fill="#277349" stroke="#155534" stroke-width="2"/>';
 if(kind==='durian')return'<path d="m14 0 4 6 7-2-1 8 6 3-6 5 1 7-8-1-3 5-5-6-7 1 1-8-3-4 5-5 1-7 6 3z" fill="#71812e"/><path d="m10 10 5 12 4-12" stroke="#dae88b" stroke-width="2" fill="none"/>';
 return'<path d="M0 13h28c-1 11-4 15-14 15S1 24 0 13" fill="#914c2a"/><ellipse cx="14" cy="13" rx="14" ry="5" fill="#f7d990"/><path d="M9 7c-5-4 3-4 0-7m10 7c-5-4 3-4 0-7" stroke="#fff5d7" stroke-width="2" fill="none"/>';
}
function miniature(piece){const points=cells(piece),w=Math.max(...points.map(p=>p[0]))+1,h=Math.max(...points.map(p=>p[1]))+1,[x,y]=points[0];return`<svg viewBox="0 0 ${w*32} ${h*32}" aria-hidden="true">${points.map(([x,y])=>`<rect x="${x*32+1}" y="${y*32+1}" width="30" height="30" rx="5" fill="${COLORS[piece.kind]}" stroke="#203f4e" stroke-opacity=".22"/>`).join('')}<g transform="translate(${x*32+6},${y*32+5}) scale(.68)">${icon(piece.kind)}</g></svg>`;}
const CSS=`
.trunk-game{--ink:#123d4c;--mint:#087f72;box-sizing:border-box;color:var(--ink);font:16px/1.5 system-ui,sans-serif;background:linear-gradient(145deg,#f2f8ee,#e0edf1);border:1px solid #c9ddda;border-radius:22px;padding:20px;position:relative;overflow:hidden}.trunk-game *{box-sizing:border-box}.trunk-game button{font:inherit;min-height:44px;border:1px solid #bdd2d1;border-radius:10px;background:#fff;color:var(--ink);cursor:pointer}.trunk-game button:focus-visible{outline:3px solid #ed9b32;outline-offset:3px}.trunk-game button:disabled{cursor:default;opacity:.62}.trunk-game h2,.trunk-game h3,.trunk-game p{margin:0}.trunk-game .tg-kicker{font-weight:750;letter-spacing:.09em;font-size:11px;color:#477174}.trunk-game .tg-header{display:flex;gap:14px;align-items:start;justify-content:space-between;margin-bottom:16px}.trunk-game .tg-header h2{font-size:26px;line-height:1.3}.trunk-game .tg-route{font-size:13px;margin-top:5px;color:#507078}.trunk-game .tg-clock{font:700 22px/1.3 ui-monospace,monospace;background:white;border:1px solid #c9dcda;border-radius:12px;padding:8px 12px;text-align:center;white-space:nowrap}.trunk-game .tg-clock small{display:block;font:11px system-ui;color:#577476}.trunk-game .tg-body{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(245px,.8fr);gap:20px;align-items:start}.trunk-game .tg-car{background:linear-gradient(90deg,#648a8c,#91b1af 12%,#739a99 88%,#496f75);border:2px solid #527879;border-radius:38px 38px 28px 28px;padding:18px 19px 24px;box-shadow:inset 0 0 0 5px #b9d0c633,0 12px 18px #45676b18;position:relative}.trunk-game .tg-car:before{content:'';display:block;width:64%;height:24px;margin:0 auto 12px;border-radius:28px 28px 5px 5px;background:linear-gradient(110deg,#254755,#496970);border:3px solid #c2d3cd}.trunk-game .tg-grid{display:grid;gap:3px;background:#203b48;border:8px solid #304e5a;border-radius:12px;padding:4px;touch-action:none}.trunk-game .tg-cell{aspect-ratio:1;min-height:0;min-width:0;border-radius:4px;border:1px dashed #76928d66;background:#e3e8df;color:#183c46;padding:0;position:relative;display:grid;place-items:center;font-size:14px;font-weight:800}.trunk-game .tg-cell:disabled{opacity:1}.trunk-game .tg-cell.blocked{background:repeating-linear-gradient(45deg,#60737c,#60737c 5px,#4e656e 5px,#4e656e 10px);border:0;color:#c4d6d6}.trunk-game .tg-cell.packed{border:1px solid #25485440}.trunk-game .tg-cell.packed.selected{box-shadow:inset 0 0 0 3px #fff6dc}.trunk-game .tg-cell.preview{box-shadow:inset 0 0 0 3px #038b77;background:#b9f0d2!important}.trunk-game .tg-cell.preview.invalid{box-shadow:inset 0 0 0 3px #bd5851;background:#ffe0d5!important}.trunk-game .tg-cell svg{width:66%;height:66%;max-width:31px;max-height:31px;pointer-events:none}.trunk-game .tg-bumper{display:flex;justify-content:space-between;align-items:center;margin-top:14px;gap:10px}.trunk-game .tg-light{width:38px;height:12px;background:#e59b77;border:2px solid #365e64;border-radius:4px}.trunk-game .tg-plate{border-radius:4px;background:#dce3d5;color:#365759;font:700 10px/1.2 system-ui;letter-spacing:.15em;padding:4px 8px}.trunk-game .tg-progress{display:flex;justify-content:space-between;font-size:13px;margin:12px 0 4px;gap:8px}.trunk-game .tg-meter{height:8px;background:#cadcd4;border-radius:9px;overflow:hidden}.trunk-game .tg-meter span{display:block;height:100%;background:#258c79;transition:width .16s}.trunk-game .tg-palette{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin-top:10px}.trunk-game .tg-piece{padding:8px;min-width:0;position:relative;touch-action:none;text-align:left;display:grid;grid-template-columns:52px minmax(0,1fr);gap:8px;align-items:center}.trunk-game .tg-piece svg{width:52px;height:57px}.trunk-game .tg-piece.selected{border:2px solid #0f8a78;background:#edfaf4;box-shadow:0 0 0 2px #0f8a7814}.trunk-game .tg-piece strong{font-size:13px;line-height:1.3;display:block}.trunk-game .tg-piece small{font-size:11px;display:block;margin-top:4px;color:#678180}.trunk-game .tg-tools{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap}.trunk-game .tg-tools button{padding:7px 14px;flex:1}.trunk-game .tg-hint{font-size:12px;color:#496d74;margin-top:10px}.trunk-game .tg-notice{border-left:4px solid #259888;background:#ffffffbd;border-radius:5px;padding:11px 13px;margin-top:16px;min-height:48px;font-size:14px}.trunk-game .tg-footer{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:14px}.trunk-game .tg-footer p{font-size:12px;color:#517174;max-width:400px}.trunk-game .tg-primary{background:#087f72;color:white;border-color:#087f72;padding:10px 19px;font-weight:750;white-space:nowrap}.trunk-game .tg-modal{position:absolute;inset:0;background:#133740cc;z-index:10;display:grid;place-items:center;padding:20px}.trunk-game .tg-dialog{background:#f7faf3;border:1px solid #afc8bc;border-radius:18px;padding:22px;max-width:440px;width:100%;box-shadow:0 18px 65px #0d2c3a44}.trunk-game .tg-dialog h3{font-size:23px}.trunk-game .tg-manifest{padding:12px 0;max-height:190px;overflow:auto}.trunk-game .tg-manifest div{display:flex;justify-content:space-between;padding:5px;border-bottom:1px solid #dfe8dd;font-size:14px}.trunk-game .tg-dialog .tg-tools{margin-top:16px}.trunk-game .tg-summary{margin-top:16px;background:#fff8dc;border:1px solid #e2d4a2;border-radius:12px;padding:16px}.trunk-game .tg-summary strong{font-size:20px}.trunk-game .tg-ghost{position:fixed;pointer-events:none;width:100px;height:100px;z-index:100000;opacity:.88;filter:drop-shadow(0 6px 8px #102e4055)}.trunk-game .tg-ghost svg{width:100%;height:100%}.trunk-game .tg-paused{background:#213d4e;color:#fff;padding:9px 12px;margin-bottom:12px;border-radius:8px}.trunk-game .tg-small{font-size:13px;color:#597376}@media(max-width:720px){.trunk-game{padding:14px;border-radius:15px}.trunk-game .tg-body{grid-template-columns:1fr;gap:16px}.trunk-game .tg-car{max-width:510px;width:100%;margin:auto;padding:12px 12px 17px}.trunk-game .tg-grid{border-width:5px;gap:2px}.trunk-game .tg-cell{min-height:37px}.trunk-game .tg-header h2{font-size:23px}.trunk-game .tg-palette{grid-template-columns:repeat(2,minmax(0,1fr))}.trunk-game .tg-piece{grid-template-columns:42px minmax(0,1fr)}.trunk-game .tg-piece svg{width:42px;height:48px}.trunk-game .tg-footer{align-items:stretch;flex-direction:column}.trunk-game .tg-footer .tg-primary{width:100%}.trunk-game .tg-grid{touch-action:none}}
`;
const SMALL_CSS='@media(max-width:480px){.trunk-game{padding:8px}.trunk-game .tg-car{padding:4px 4px 12px}.trunk-game .tg-grid{border-width:2px;padding:2px;gap:2px;grid-template-columns:repeat(6,minmax(44px,1fr))!important}.trunk-game .tg-cell{min-width:44px;min-height:44px}.trunk-game .tg-car:before{height:19px;margin-top:7px;margin-bottom:9px}}';
function mount(container,{state,onAction}){
 validate(state);assert(container&&typeof onAction==='function','装箱画面缺少宿主。');let current=clone(state),paused=false,disposed=false,timer=null,review=false,drag=null,ghost=null,suppressUntil=0,lastSignature='',focusAfter=null;
 const root=container.ownerDocument.createElement('section'),doc=container.ownerDocument,win=doc.defaultView;root.className='trunk-game';root.dataset.rows=String(state.grid.height);root.dataset.testid='trunk-game';root.setAttribute('aria-label',title);root.tabIndex=-1;container.replaceChildren(root);
 function live(){return!disposed&&!paused&&current.phase==='playing';}
 function emit(action){if(live())onAction(action);}
 function cleanupDrag(){drag=null;ghost?.remove();ghost=null;root.querySelectorAll('.preview').forEach(c=>c.classList.remove('preview','invalid'));}
 function signature(){return JSON.stringify([current.phase,current.pieces,current.placements,current.selected,current.notice,current.moves,current.mistakes,paused,review]);}
 function clock(){const left=Math.ceil((current.grid.limitMs-current.elapsedMs)/1000),node=root.querySelector('[data-testid=trunk-clock]');if(node)node.textContent=Math.floor(left/60)+':'+String(left%60).padStart(2,'0');}
 function render(){
  const active=doc.activeElement;if(active&&root.contains(active))focusAfter=active.dataset.focusKey||null;
  const packed=occupied(current),selected=current.pieces.find(p=>p.id===current.selected),blocked=new Set(current.grid.blocked.map(p=>p.join(','))),terminal=current.phase!=='playing',disabled=paused||terminal?'disabled':'',capacity=current.grid.width*current.grid.height-current.grid.blocked.length;
  let grid='';for(let y=0;y<current.grid.height;y++)for(let x=0;x<current.grid.width;x++){
   const owner=packed.get(x+','+y),piece=current.pieces.find(p=>p.id===owner),at=piece&&current.placements[owner],first=piece&&cells(piece)[0],marked=first&&x===at.x+first[0]&&y===at.y+first[1],isBlocked=blocked.has(x+','+y);
   grid+=`<button type="button" class="tg-cell${isBlocked?' blocked':''}${piece?' packed':''}${owner===current.selected?' selected':''}" data-game-action="grid" data-focus-key="cell-${x}-${y}" data-testid="trunk-cell-${x}-${y}" data-x="${x}" data-y="${y}" ${owner?`data-piece-id="${esc(owner)}" style="background:${COLORS[piece.kind]}"`:''} aria-label="第 ${y+1} 行第 ${x+1} 格${isBlocked?'：轮拱，不能放货':piece?'：'+LABELS[piece.kind]:'：空位'}" ${disabled}>${isBlocked?'×':marked?`<svg viewBox="0 0 30 32" aria-hidden="true">${icon(piece.kind)}</svg>`:''}</button>`;
  }
  const mode=current.config.mode==='inventory',out=result(current),manifest=current.pieces.filter(p=>current.placements[p.id]);
  root.innerHTML=`<style>${CSS}</style>${paused?'<div class="tg-paused" role="status">已暂停，货物和时间都停在这里。</div>':''}<header class="tg-header"><div><div class="tg-kicker">LIANG · PACK & GO</div><h2>${title}</h2><p class="tg-route">Rawang <span aria-hidden="true">→</span> Masai · ${mode?'真实货物运输':'零库存练习'} · ${['轻松装箱','转个方向','空间高手'][current.config.difficulty]}</p></div><div class="tg-clock"><span data-testid="trunk-clock"></span><small>本关剩余</small></div></header><div class="tg-body"><div><div class="tg-car"><div class="tg-grid" role="group" aria-label="后备箱格子" data-testid="trunk-grid" style="grid-template-columns:repeat(${current.grid.width},minmax(0,1fr))">${grid}</div><div class="tg-bumper"><span class="tg-light"></span><span class="tg-plate">LIANG FAMILY</span><span class="tg-light"></span></div></div><div class="tg-progress"><strong data-testid="trunk-progress">已装 ${count(current)} / ${current.pieces.length} 件</strong><span>空间 ${packed.size} / ${capacity} 格</span></div><div class="tg-meter"><span style="width:${packed.size/capacity*100}%"></span></div></div><section><h3>${mode?'选择要运的货物':'把这些物品都装好'}</h3><p class="tg-small">${mode?'尽量利用空间，没装上的货物留在 Rawang。':'先摆大件，再用小件填空隙。'}</p><div class="tg-palette" data-testid="trunk-palette">${current.pieces.map((p,i)=>`<button type="button" class="tg-piece${p.id===current.selected?' selected':''}" data-game-action="select" data-focus-key="piece-${esc(p.id)}" data-testid="trunk-piece-${esc(p.id)}" data-piece-id="${esc(p.id)}" aria-pressed="${p.id===current.selected}" ${disabled}>${miniature(p)}<span><strong>${LABELS[p.kind]}${mode?' '+(i+1):''}</strong><small>${current.placements[p.id]?'已装好 · 可挪动':cells(p).length+' 格 · 在车外'}</small></span></button>`).join('')}</div><div class="tg-tools"><button type="button" data-game-action="rotate" data-focus-key="rotate" ${disabled||!selected?'disabled':''}>↻ 旋转 <small>R</small></button><button type="button" data-game-action="remove" data-focus-key="remove" ${disabled||!selected||!current.placements[selected.id]?'disabled':''}>取回货物</button></div><p class="tg-hint">点选货物，再点空格；也可拖动。<span class="tg-keyboard">键盘：方向键选格，空格放置，R 旋转，Delete 取回。</span></p></section></div><p class="tg-notice" data-testid="trunk-notice" role="status" aria-live="polite">${esc(current.notice)}</p>${terminal?`<div class="tg-summary" data-testid="trunk-result"><strong>${out.status==='won'?'装箱完成':'再试一次'}</strong><p>${out.status==='won'?`本轮 ${out.score} 分 · 装好 ${out.packed} 件。${mode?'请使用上方返回按钮，保存运输结果。':'练习没有使用共享库存。'}`:'可以返回后重新挑战。未完成装箱，不会转移货物。'}</p></div>`:`<footer class="tg-footer"><p>${mode?'只运清单里实际装好的货物。确认发车后，点击“结算并返回棋盘”保存运输结果，未装货物不扣除。':'练习材料只用于本关。装齐所有物品后才能完成挑战。'}</p><button class="tg-primary" type="button" data-game-action="review" data-focus-key="review" ${disabled}>核对并发车</button></footer>`}${review&&!paused&&!terminal?`<div class="tg-modal"><section class="tg-dialog" role="dialog" aria-modal="true" aria-labelledby="trunk-review-title"><h3 id="trunk-review-title">确认装车清单</h3><p class="tg-small">${mode?'以下货物将运到 Masai。':'这是练习清单，不改变共享库存。'}</p><div class="tg-manifest">${manifest.map(p=>`<div><span>${LABELS[p.kind]}</span><strong>1 件</strong></div>`).join('')}</div><p>已装 ${manifest.length} 件，车外还有 ${current.pieces.length-manifest.length} 件。</p><div class="tg-tools"><button type="button" data-game-action="cancel-review" data-focus-key="cancel-review">继续调整</button><button type="button" class="tg-primary" data-game-action="ship" data-focus-key="ship">确认发车</button></div></section></div>`:''}`;
  root.querySelector('style').textContent+=SMALL_CSS+`
.trunk-game p{color:#496d74}.trunk-game .tg-notice{color:#123d4c}.trunk-game button:hover:not(:disabled){background:#d4ece3;color:#123d4c}.trunk-game .tg-primary:hover:not(:disabled){background:#075f58;color:#fff}
@media(max-width:600px) and (max-height:780px),(orientation:landscape) and (max-height:500px) and (min-width:600px){.trunk-game{padding:6px;border-radius:12px}.trunk-game .tg-header{margin-bottom:4px;gap:4px;align-items:center}.trunk-game .tg-kicker,.trunk-game .tg-header h2,.trunk-game .tg-clock small{display:none}.trunk-game .tg-route{font-size:10px;margin:0}.trunk-game .tg-clock{font-size:14px;padding:3px 7px}.trunk-game .tg-body{gap:4px}.trunk-game .tg-car{padding:2px;max-width:292px;border-radius:8px;margin:auto}.trunk-game .tg-car:before,.trunk-game .tg-bumper{display:none}.trunk-game .tg-grid{grid-template-columns:repeat(6,minmax(44px,1fr))!important;gap:2px;padding:2px;border-width:2px;border-radius:5px}.trunk-game .tg-cell{min-height:44px;min-width:44px}.trunk-game .tg-progress{font-size:11px;margin:3px 0}.trunk-game .tg-meter{display:none}.trunk-game .tg-body>section>h3,.trunk-game .tg-body>section>.tg-small{display:none}.trunk-game .tg-palette{gap:4px;margin-top:4px}.trunk-game .tg-piece{grid-template-columns:24px minmax(0,1fr);min-height:48px;padding:4px;gap:5px}.trunk-game .tg-piece svg{width:24px;height:30px}.trunk-game .tg-piece strong{font-size:11px}.trunk-game .tg-piece small{font-size:10px;margin-top:1px}.trunk-game .tg-tools{gap:4px;margin-top:4px}.trunk-game .tg-tools button{font-size:12px;min-height:44px;padding:4px}.trunk-game .tg-hint{font-size:11px;line-height:1.3;margin-top:4px}.trunk-game .tg-keyboard{display:none}.trunk-game .tg-notice{font-size:11px;min-height:0;padding:4px 7px;margin-top:4px}.trunk-game .tg-footer{gap:4px;margin-top:2px;padding:0;border:0}.trunk-game .tg-footer p{font-size:10px;line-height:1.2}.trunk-game .tg-primary{min-height:44px;font-size:12px;padding:5px 9px}.trunk-game .tg-dialog{padding:10px}.trunk-game .tg-dialog h3{font-size:18px}.trunk-game .tg-modal{padding:8px}.trunk-game .tg-manifest{max-height:120px}}
@media(max-width:600px) and (max-height:780px){.trunk-game .tg-body{grid-template-columns:1fr}.trunk-game .tg-palette{grid-template-columns:repeat(2,minmax(0,1fr))}.trunk-game[data-rows="5"] .tg-palette{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media(orientation:landscape) and (max-height:500px) and (min-width:600px){.trunk-game{display:grid;grid-template-columns:294px minmax(0,1fr);grid-template-rows:24px 16px auto;gap:4px 8px;align-items:start}.trunk-game .tg-header{grid-column:2;grid-row:1;margin:0}.trunk-game .tg-body{display:contents}.trunk-game .tg-body>div:first-child{display:contents}.trunk-game .tg-car{grid-column:1;grid-row:1/4}.trunk-game .tg-progress{grid-column:2;grid-row:2;margin:0}.trunk-game .tg-body>section{grid-column:2;grid-row:3}.trunk-game .tg-palette{grid-template-columns:repeat(3,minmax(0,1fr));margin:0}.trunk-game .tg-notice,.trunk-game .tg-footer,.trunk-game .tg-summary{grid-column:1/-1}.trunk-game .tg-cell{font-size:12px}.trunk-game .tg-dialog{max-height:100%;overflow:auto}.trunk-game[data-rows="5"]{padding:0}.trunk-game[data-rows="5"] .tg-car{width:264px;padding:0;border:0}.trunk-game[data-rows="5"] .tg-grid{padding:0;border:0;gap:0}.trunk-game[data-rows="5"] .tg-cell{height:44px;aspect-ratio:auto}}
`;
  lastSignature=signature();clock();if(focusAfter){const target=Array.from(root.querySelectorAll('[data-focus-key]')).find(el=>el.dataset.focusKey===focusAfter);target?.focus({preventScroll:true});focusAfter=null;}
 }
 function scheduling(){if(timer){win.clearInterval(timer);timer=null;}if(live())timer=win.setInterval(()=>emit({type:'tick',dt:250}),250);}
 function update(next){if(disposed)return;validate(next);const previousPhase=current.phase;current=clone(next);if(current.phase!=='playing'){review=false;cleanupDrag();}if(signature()!==lastSignature)render();else clock();if(previousPhase!==current.phase)scheduling();}
 function showReview(){if(!live())return;if(!count(current)||current.config.mode==='practice'&&count(current)!==current.pieces.length){emit({type:'ship'});return;}review=true;cleanupDrag();render();root.querySelector('[data-game-action=cancel-review]')?.focus();}
 function click(event){if(!live()||event.detail>0&&win.performance.now()<suppressUntil)return;const button=event.target.closest('[data-game-action]');if(!button||!root.contains(button)||button.disabled)return;const act=button.dataset.gameAction;if(review&&!['ship','cancel-review'].includes(act))return;
  if(act==='select')emit({type:'select',id:button.dataset.pieceId});
  else if(act==='grid'){if(button.dataset.pieceId&&(!current.selected||current.selected===button.dataset.pieceId))emit({type:'select',id:button.dataset.pieceId});else emit({type:'place',x:Number(button.dataset.x),y:Number(button.dataset.y)});}
  else if(act==='rotate'||act==='remove')emit({type:act});else if(act==='review')showReview();else if(act==='cancel-review'){review=false;render();root.querySelector('[data-game-action=review]')?.focus();}else if(act==='ship'){review=false;emit({type:'ship'});}
 }
 function keydown(event){if(!live())return;if(review){if(event.key==='Escape'){event.preventDefault();review=false;render();root.querySelector('[data-game-action=review]')?.focus();}else if(event.key==='Tab'){const buttons=Array.from(root.querySelectorAll('.tg-dialog button'));if(buttons.length){event.preventDefault();buttons[doc.activeElement===buttons[0]?1:0].focus();}}return;}
  if(event.key.toLowerCase()==='r'){event.preventDefault();emit({type:'rotate',direction:event.shiftKey?-1:1});return;}
  if(['Delete','Backspace'].includes(event.key)){event.preventDefault();emit({type:'remove'});return;}
  const cell=event.target.closest('[data-game-action=grid]');if(cell&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)){event.preventDefault();const x=Math.max(0,Math.min(current.grid.width-1,Number(cell.dataset.x)+(event.key==='ArrowRight'?1:event.key==='ArrowLeft'?-1:0))),y=Math.max(0,Math.min(current.grid.height-1,Number(cell.dataset.y)+(event.key==='ArrowDown'?1:event.key==='ArrowUp'?-1:0)));root.querySelector(`[data-testid="trunk-cell-${x}-${y}"]`)?.focus();}
 }
 function preview(x,y,key){root.querySelectorAll('.preview').forEach(el=>el.classList.remove('preview','invalid'));const p=current.pieces.find(p=>p.id===key);if(!p)return;const invalid=!!fits(current,p,x,y);for(const[dx,dy]of cells(p)){const el=root.querySelector(`[data-testid="trunk-cell-${x+dx}-${y+dy}"]`);el?.classList.add('preview');if(invalid)el?.classList.add('invalid');}}
 function point(clientX,clientY){const grid=root.querySelector('[data-testid=trunk-grid]');if(!grid)return null;const box=grid.getBoundingClientRect(),style=win.getComputedStyle(grid),left=box.left+parseFloat(style.borderLeftWidth)+parseFloat(style.paddingLeft),top=box.top+parseFloat(style.borderTopWidth)+parseFloat(style.paddingTop),width=box.width-parseFloat(style.borderLeftWidth)-parseFloat(style.borderRightWidth)-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight),height=box.height-parseFloat(style.borderTopWidth)-parseFloat(style.borderBottomWidth)-parseFloat(style.paddingTop)-parseFloat(style.paddingBottom);if(clientX<left||clientY<top||clientX>=left+width||clientY>=top+height)return null;return{x:Math.floor((clientX-left)/width*current.grid.width),y:Math.floor((clientY-top)/height*current.grid.height)};}
 function down(event){if(!live()||review||event.button!==0&&event.pointerType!=='touch')return;const target=event.target.closest('[data-piece-id]');if(!target||!root.contains(target))return;const key=target.dataset.pieceId,at=current.placements[key],onGrid=target.dataset.gameAction==='grid';drag={id:key,pointerId:event.pointerId,startX:event.clientX,startY:event.clientY,moved:false,offsetX:onGrid?Number(target.dataset.x)-at.x:0,offsetY:onGrid?Number(target.dataset.y)-at.y:0};if(!onGrid)emit({type:'select',id:key});}
 function move(event){if(!live()||!drag||event.pointerId!==drag.pointerId)return;if(!drag.moved&&Math.hypot(event.clientX-drag.startX,event.clientY-drag.startY)>6){drag.moved=true;emit({type:'select',id:drag.id});}if(!drag.moved)return;event.preventDefault();if(!ghost){ghost=doc.createElement('div');ghost.className='tg-ghost';ghost.innerHTML=miniature(current.pieces.find(p=>p.id===drag.id));root.append(ghost);}ghost.style.left=(event.clientX-22)+'px';ghost.style.top=(event.clientY-22)+'px';const cell=point(event.clientX,event.clientY);if(cell)preview(cell.x-drag.offsetX,cell.y-drag.offsetY,drag.id);else root.querySelectorAll('.preview').forEach(el=>el.classList.remove('preview','invalid'));}
 function up(event){if(!drag||event.pointerId!==drag.pointerId)return;const item=drag,cell=point(event.clientX,event.clientY);cleanupDrag();if(!live()||!item.moved)return;suppressUntil=win.performance.now()+500;if(cell)emit({type:'place',id:item.id,x:cell.x-item.offsetX,y:cell.y-item.offsetY});}
 const cancel=()=>cleanupDrag();root.addEventListener('click',click);root.addEventListener('keydown',keydown);root.addEventListener('pointerdown',down);doc.addEventListener('pointermove',move,{passive:false});doc.addEventListener('pointerup',up);doc.addEventListener('pointercancel',cancel);
 render();scheduling();return{update,setPaused(value){if(disposed)return;paused=!!value;if(paused){review=false;cleanupDrag();}render();scheduling();},dispose(){if(disposed)return;disposed=true;win.clearInterval(timer);timer=null;cleanupDrag();root.removeEventListener('click',click);root.removeEventListener('keydown',keydown);root.removeEventListener('pointerdown',down);doc.removeEventListener('pointermove',move);doc.removeEventListener('pointerup',up);doc.removeEventListener('pointercancel',cancel);root.remove();}};
}
return{id,version,title,create,step,validate,result,mount};
});

;
(function (root, factory) {
  'use strict';
  const game = factory();
  if (typeof module === 'object' && module.exports) module.exports = game;
  root.LiangGames = root.LiangGames || {};
  root.LiangGames.dungeon = game;
})(typeof globalThis === 'object' ? globalThis : this, function () {
  'use strict';
  const SIZE = 9;
  const DIRS = { up: [0, -1], right: [1, 0], down: [0, 1], left: [-1, 0] };
  const ORDER = ['up', 'right', 'down', 'left'];
  const ENEMIES = {
    dust: { name: '灰尘团', hp: 2, colour: '#9bacc0', glyph: '尘' },
    toy: { name: '旧玩具', hp: 3, colour: '#dba381', glyph: '玩' },
    robot: { name: '扫地机器人', hp: 4, colour: '#82bdc8', glyph: '扫' }
  };
  const ITEMS = [
    { id: 'textbook', name: '今年课本', mark: '书', note: '翻开书页，找到“今年课本”。已记入这次探索的发现清单。' },
    { id: 'homework', name: '去年作业', mark: '页', note: '从纸袋里找到“去年作业”。比上一层的课本更旧一些。' },
    { id: 'lesson-plan', name: '旧教案', mark: '册', note: '在深处找到“旧教案”。这次探索的发现已经记下。' }
  ];
  const copy = x => JSON.parse(JSON.stringify(x));
  const int = (x, lo, hi) => Number.isInteger(x) && x >= lo && x <= hi;
  const same = (a, b) => a.x === b.x && a.y === b.y;
  const key = (x, y) => y * SIZE + x;
  const open = (floor, x, y) => x >= 0 && y >= 0 && x < SIZE && y < SIZE && floor.tiles[y][x] === '.';
  const alive = floor => floor.enemies.filter(e => e.hp > 0);
  function random(seed) {
    let n = seed >>> 0;
    return () => { n = (Math.imul(n, 1664525) + 1013904223) >>> 0; return n; };
  }
  function distances(floor, from) {
    const result = Array(SIZE * SIZE).fill(-1), queue = [{ x: from.x, y: from.y }];
    result[key(from.x, from.y)] = 0;
    for (let i = 0; i < queue.length; i++) for (const direction of ORDER) {
      const [dx, dy] = DIRS[direction], p = { x: queue[i].x + dx, y: queue[i].y + dy };
      if (open(floor, p.x, p.y) && result[key(p.x, p.y)] < 0) { result[key(p.x, p.y)] = result[key(queue[i].x, queue[i].y)] + 1; queue.push(p); }
    }
    return result;
  }
  function visible(s, x, y) { return Math.abs(s.player.x - x) + Math.abs(s.player.y - y) <= 2; }
  function reveal(s) {
    const floor = s.floors[s.floor];
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) if (visible(s, x, y)) floor.seen[key(x, y)] = true;
  }
  function makeFloor(next, index, difficulty) {
    const grid = Array.from({ length: SIZE }, () => Array(SIZE).fill('#'));
    const stack = [{ x: 1, y: 1 }]; grid[1][1] = '.';
    while (stack.length) {
      const at = stack[stack.length - 1];
      const candidates = ORDER.map(d => DIRS[d]).map(([dx, dy]) => ({ x: at.x + dx * 2, y: at.y + dy * 2, dx, dy })).filter(p => p.x > 0 && p.x < SIZE - 1 && p.y > 0 && p.y < SIZE - 1 && grid[p.y][p.x] === '#');
      if (!candidates.length) { stack.pop(); continue; }
      const to = candidates[next() % candidates.length]; grid[at.y + to.dy][at.x + to.dx] = '.'; grid[to.y][to.x] = '.'; stack.push({ x: to.x, y: to.y });
    }
    // A few connected loops permit detours and reduce long blind alleys.
    for (let n = 0; n < 2 + (2 - difficulty); n++) {
      const choices = [];
      for (let y = 1; y < SIZE - 1; y++) for (let x = 1; x < SIZE - 1; x++) if (grid[y][x] === '#' && ((grid[y - 1][x] === '.' && grid[y + 1][x] === '.') || (grid[y][x - 1] === '.' && grid[y][x + 1] === '.'))) choices.push({ x, y });
      if (choices.length) { const p = choices[next() % choices.length]; grid[p.y][p.x] = '.'; }
    }
    const floor = { index, title: ['今年课本区', '去年作业区', '旧教案区'][index], tiles: grid.map(row => row.join('')), exit: null, seen: Array(SIZE * SIZE).fill(false), enemies: [], item: null };
    const reach = distances(floor, { x: 1, y: 1 });
    const cells = [];
    for (let y = 1; y < SIZE - 1; y++) for (let x = 1; x < SIZE - 1; x++) if (open(floor, x, y)) cells.push({ x, y, distance: reach[key(x, y)] });
    cells.sort((a, b) => b.distance - a.distance || a.y - b.y || a.x - b.x);
    floor.exit = { x: cells[0].x, y: cells[0].y };
    const side = cells.filter(c => !same(c, floor.exit) && c.distance >= 5);
    const artifact = side[Math.min(side.length - 1, 2 + next() % Math.max(1, Math.min(7, side.length)))];
    floor.item = { id: ITEMS[index].id, x: artifact.x, y: artifact.y, found: false };
    const count = Math.min(3, 1 + Math.floor((index + difficulty + 1) / 2));
    const choices = side.filter(c => Math.abs(c.x - floor.exit.x) + Math.abs(c.y - floor.exit.y) > 0);
    for (let n = 0; n < count; n++) {
      const candidates = choices.filter(c => !floor.enemies.some(e => Math.abs(e.x - c.x) + Math.abs(e.y - c.y) < 3));
      const p = candidates[next() % candidates.length];
      if (!p) break;
      const kind = n === 0 ? 'dust' : (index === 2 && n === count - 1 ? 'robot' : 'toy');
      floor.enemies.push({ id: 'f' + index + '-e' + n, kind, x: p.x, y: p.y, hp: ENEMIES[kind].hp, stride: difficulty === 2 && kind === 'robot' ? 1 : kind === 'toy' ? 3 : 2, offset: next() % 4 });
    }
    return floor;
  }
  function collect(s) {
    const item = s.floors[s.floor].item;
    if (!item.found && same(item, s.player)) {
      item.found = true; s.discoveries.push(item.id);
      s.notice = ITEMS[s.floor].note;
      s.latestDiscovery = item.id;
    }
  }
  function enemyTurn(s) {
    const floor = s.floors[s.floor], reach = distances(floor, s.player);
    for (const e of alive(floor)) {
      if ((s.turns + e.offset) % e.stride !== 0) continue;
      const d = reach[key(e.x, e.y)];
      if (d === 1) { s.health = Math.max(0, s.health - 1); s.hits += 1; s.notice = ENEMIES[e.kind].name + '挡了你一下，体力 −1。朝它挥拖鞋，或找机会绕开。'; continue; }
      if (d < 2 || d > 4 + s.config.difficulty) continue;
      const choices = ORDER.map(direction => { const [dx, dy] = DIRS[direction]; return { x: e.x + dx, y: e.y + dy, direction }; }).filter(p => open(floor, p.x, p.y) && !same(p, s.player) && !alive(floor).some(other => other !== e && same(other, p)) && reach[key(p.x, p.y)] >= 0 && reach[key(p.x, p.y)] < d);
      if (choices.length) { const p = choices[(e.offset + s.turns) % choices.length]; e.x = p.x; e.y = p.y; }
    }
  }
  function advance(s, { skipEnemies = false } = {}) {
    s.turns += 1; s.satiety = Math.max(0, s.satiety - 1);
    if (s.phase === 'playing' && !skipEnemies) enemyTurn(s);
    if (s.phase === 'playing' && s.health <= 0) { s.phase = 'lost'; s.reason = '体力用完了，先休息一下。下次可以观察敌人的位置，选择绕路或先挥拖鞋。'; s.notice = s.reason; }
    if (s.phase === 'playing' && s.satiety <= 0) { s.phase = 'lost'; s.reason = '这一局的行动值用完了。下次少走回头路；基础路线不需要料理也能完成。'; s.notice = s.reason; }
    reveal(s);
    return s;
  }
  function apply(s, action) {
    if (s.phase !== 'playing' || !action || typeof action !== 'object' || Array.isArray(action)) return s;
    if (action.type === 'tick') { if (int(action.dt, 1, 250)) s.elapsedMs = Math.min(3600000, s.elapsedMs + action.dt); return s; }
    if (action.type === 'use-meal') {
      if (s.mealsUsed >= s.config.mealCharges || s.satiety >= s.satietyMax) return s;
      const gain = Math.min(s.satietyMax - s.satiety, 40);
      if (gain > 0) { s.satiety += gain; s.mealsUsed += 1; s.mealRestored = gain; s.notice = '用了 1 份可选料理，行动值 +' + gain + '。局内行动值与共享零食分开。'; }
      return s;
    }
    const floor = s.floors[s.floor];
    if (action.type === 'wait') { s.notice = '原地等一回合，看看附近的敌人怎样移动。'; return advance(s); }
    if (action.type === 'descend') {
      if (!same(s.player, floor.exit)) { s.notice = '先走到楼梯所在的格子，再继续。楼梯要在探索中找到。'; return s; }
      if (s.floor === 2) { s.phase = 'won'; s.reason = '走完三层，顺利离开杂物房！这次找到 ' + s.discoveries.length + ' 件旧物。'; s.notice = s.reason; return advance(s, { skipEnemies: true }); }
      s.floor += 1; s.player = { x: 1, y: 1, facing: 'right' }; s.notice = '到了第 ' + (s.floor + 1) + ' 层：' + s.floors[s.floor].title + '。先看清附近的路，再走下一步。'; s.latestDiscovery = null;
      return advance(s, { skipEnemies: true });
    }
    if (!['move', 'attack'].includes(action.type) || !ORDER.includes(action.direction)) return s;
    const [dx, dy] = DIRS[action.direction], p = { x: s.player.x + dx, y: s.player.y + dy };
    const enemy = alive(floor).find(e => same(e, p));
    s.player.facing = action.direction;
    if (enemy) {
      enemy.hp = Math.max(0, enemy.hp - 2); s.swings += 1;
      if (!enemy.hp) { s.defeated += 1; s.notice = '把' + ENEMIES[enemy.kind].name + '赶开了，路空出来了。'; }
      else s.notice = ENEMIES[enemy.kind].name + '还挡着路，再挥一次拖鞋就能赶开。';
      return advance(s);
    }
    if (action.type === 'attack') { s.notice = '这个方向没有相邻敌人。靠近后再挥拖鞋，或者换条路走。'; return s; }
    if (!open(floor, p.x, p.y)) { s.notice = '这边是柜子，换个方向试试。碰到柜子不会消耗行动值。'; return s; }
    s.player.x = p.x; s.player.y = p.y; s.moves += 1; s.notice = same(p, floor.exit) ? (s.floor === 2 ? '找到最后的出口了！点“带着发现离开”。' : '找到楼梯了！点“走下楼梯”进入下一层。') : '走了一格。蓝色是已看清的路，暗处还没有探索。';
    collect(s);
    return advance(s);
  }
  function baseline(initial) {
    const s = copy(initial); s.health = s.healthMax = 10000; s.satiety = s.satietyMax = 10000;
    let count = 0;
    while (s.phase === 'playing' && count < 2048) {
      const floor = s.floors[s.floor];
      const near = ORDER.find(direction => { const [dx, dy] = DIRS[direction]; return alive(floor).some(e => e.x === s.player.x + dx && e.y === s.player.y + dy); });
      if (near) apply(s, { type: 'attack', direction: near });
      else if (same(s.player, floor.exit)) apply(s, { type: 'descend' });
      else {
        const d = distances(floor, floor.exit), at = d[key(s.player.x, s.player.y)];
        const direction = ORDER.find(name => { const [dx, dy] = DIRS[name]; return open(floor, s.player.x + dx, s.player.y + dy) && d[key(s.player.x + dx, s.player.y + dy)] === at - 1; });
        if (!direction) throw new Error('迷宫生成后未找到基础通路。');
        apply(s, { type: 'move', direction });
      }
      count += 1;
    }
    if (s.phase !== 'won') throw new Error('基础路线未完成，拒绝使用这张地图。');
    return { actions: s.turns, damage: s.hits };
  }
  function create(config) {
    config = config || {};
    const c = { seed: config.seed == null ? 24601 : config.seed, difficulty: config.difficulty == null ? 0 : config.difficulty, mode: config.mode == null ? 'practice' : config.mode, mealCharges: config.mealCharges == null ? 0 : config.mealCharges };
    if (!int(c.seed, 0, 0xffffffff) || !int(c.difficulty, 0, 2) || !['practice', 'inventory'].includes(c.mode) || !int(c.mealCharges, 0, 1) || c.mode === 'practice' && c.mealCharges !== 0) throw new Error('迷宫配置无效；练习关不携带共享料理。');
    const next = random(c.seed);
    const s = { phase: 'playing', config: c, elapsedMs: 0, floor: 0, floors: [0, 1, 2].map(i => makeFloor(next, i, c.difficulty)), player: { x: 1, y: 1, facing: 'right' }, health: 1, healthMax: 1, satiety: 1, satietyMax: 1, mealsUsed: 0, mealRestored: 0, turns: 0, moves: 0, swings: 0, hits: 0, defeated: 0, discoveries: [], latestDiscovery: null, proof: null, notice: '找出三层楼梯，探索越深越旧的物件。先按方向走一格；你不行动，敌人也不会行动。', reason: '' };
    s.proof = baseline(s);
    s.health = s.healthMax = s.proof.damage + [8, 6, 4][c.difficulty];
    s.satiety = s.satietyMax = s.proof.actions + [60, 35, 18][c.difficulty];
    reveal(s); return s;
  }
  function validate(s) {
    const fail = () => { throw new Error('迷宫进度无效，未替换原进度。'); };
    if (!s || !['playing', 'won', 'lost'].includes(s.phase) || !s.config || !int(s.config.seed, 0, 0xffffffff) || !int(s.config.difficulty, 0, 2) || !['practice', 'inventory'].includes(s.config.mode) || !int(s.config.mealCharges, 0, 1) || s.config.mode === 'practice' && s.config.mealCharges !== 0) fail();
    if (!int(s.elapsedMs, 0, 3600000) || !int(s.floor, 0, 2) || !Array.isArray(s.floors) || s.floors.length !== 3 || !s.player || !ORDER.includes(s.player.facing) || !int(s.mealsUsed, 0, s.config.mealCharges) || !s.proof || !int(s.proof.actions, 1, 2048) || !int(s.proof.damage, 0, 1000)) fail();
    if (s.healthMax !== s.proof.damage + [8, 6, 4][s.config.difficulty] || s.satietyMax !== s.proof.actions + [60, 35, 18][s.config.difficulty] || !int(s.health, 0, s.healthMax) || !int(s.satiety, 0, s.satietyMax) || !int(s.mealRestored, s.mealsUsed ? 1 : 0, s.mealsUsed ? 40 : 0)) fail();
    for (const field of ['turns', 'moves', 'swings', 'hits', 'defeated']) if (!int(s[field], 0, 100000)) fail();
    if (s.moves + s.swings > s.turns || s.defeated > s.swings || s.health !== Math.max(0, s.healthMax - s.hits) || s.satiety !== Math.max(0, s.satietyMax - s.turns + s.mealRestored) || typeof s.notice !== 'string' || typeof s.reason !== 'string') fail();
    if (!Array.isArray(s.discoveries) || new Set(s.discoveries).size !== s.discoveries.length || !s.discoveries.every(id => ITEMS.some(item => item.id === id)) || !(s.latestDiscovery === null || s.discoveries.includes(s.latestDiscovery))) fail();
    let dead = 0;
    s.floors.forEach((floor, index) => {
      if (!floor || floor.index !== index || typeof floor.title !== 'string' || !Array.isArray(floor.tiles) || floor.tiles.length !== SIZE || !floor.tiles.every(row => typeof row === 'string' && row.length === SIZE && /^[#.]+$/.test(row)) || !open(floor, 1, 1) || !floor.exit || !int(floor.exit.x, 0, SIZE - 1) || !int(floor.exit.y, 0, SIZE - 1) || !open(floor, floor.exit.x, floor.exit.y)) fail();
      if (!Array.isArray(floor.seen) || floor.seen.length !== SIZE * SIZE || !floor.seen.every(x => typeof x === 'boolean') || !Array.isArray(floor.enemies) || floor.enemies.length < 1 || floor.enemies.length > 3 || !floor.item || floor.item.id !== ITEMS[index].id || !int(floor.item.x, 0, SIZE - 1) || !int(floor.item.y, 0, SIZE - 1) || !open(floor, floor.item.x, floor.item.y) || typeof floor.item.found !== 'boolean' || floor.item.found !== s.discoveries.includes(floor.item.id)) fail();
      const positions = new Set(), ids = new Set();
      for (const [enemyIndex, e] of floor.enemies.entries()) {
        if (!e || e.id !== 'f' + index + '-e' + enemyIndex || ids.has(e.id) || !ENEMIES[e.kind] || !int(e.hp, 0, ENEMIES[e.kind].hp) || !int(e.x, 0, SIZE - 1) || !int(e.y, 0, SIZE - 1) || !open(floor, e.x, e.y) || !int(e.stride, 1, 3) || !int(e.offset, 0, 3)) fail();
        ids.add(e.id);
        if (!e.hp) dead += 1;
        else { if (positions.has(key(e.x, e.y)) || index === s.floor && same(e, s.player)) fail(); positions.add(key(e.x, e.y)); }
      }
    });
    if (!int(s.player.x, 0, SIZE - 1) || !int(s.player.y, 0, SIZE - 1) || !open(s.floors[s.floor], s.player.x, s.player.y) || s.defeated !== dead) fail();
    if (s.phase === 'playing' && (!s.health || !s.satiety) || s.phase === 'won' && (s.floor !== 2 || !same(s.player, s.floors[2].exit) || s.turns < 3 || !s.moves) || s.phase === 'lost' && s.health > 0 && s.satiety > 0) fail();
    return true;
  }
  function step(s, action) { validate(s); return apply(copy(s), action); }
  function result(s) {
    validate(s); if (s.phase === 'playing') return null;
    return { status: s.phase, score: s.phase === 'won' ? 600 + s.discoveries.length * 80 + s.defeated * 20 + s.health * 5 + s.satiety : 0, mealsUsed: s.mealsUsed, discoveries: copy(s.discoveries) };
  }
  function mount(container, options) {
    if (!container?.appendChild || !options || typeof options.onAction !== 'function') throw new Error('迷宫需要可用的容器和操作回调。');
    validate(options.state);
    const doc = container.ownerDocument, win = doc.defaultView;
    const characterNames = { sister: '梁姐姐', brother: '梁弟弟', little: '梁妹妹' };
    const characterId = typeof options.displayCharacterId === 'string' && Object.hasOwn(characterNames, options.displayCharacterId) ? options.displayCharacterId : null;
    const characterName = characterId ? characterNames[characterId] : '你';
    const characterAsset = characterId ? win.LiangCharacterArt?.characters?.[characterId] : null;
    const assetAvailable = !!characterAsset && characterAsset.name === characterName && typeof characterAsset.src === 'string' && characterAsset.src.startsWith('data:image/png;base64,');
    let characterImage = null, artworkState = characterId ? (assetAvailable ? 'loading' : 'missing') : 'unknown';
    const escapeAttr = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const directionText = { up: '上', right: '右', down: '下', left: '左' };
    const directionArrow = { up: '↑', right: '→', down: '↓', left: '←' };
    let state = copy(options.state), paused = false, disposed = false, recentDamage = null;
    const el = doc.createElement('section'); el.className = 'lg-dungeon'; el.tabIndex = 0; el.dataset.testid = 'dungeon-game'; el.setAttribute('aria-label', '杂物房迷宫');
    el.innerHTML = `<style>
      .lg-dungeon{--d-ink:#eef3ed;--d-soft:#a9c4c8;--d-gold:#f0d295;--d-floor:#244855;box-sizing:border-box;font:16px/1.5 system-ui,-apple-system,"Microsoft YaHei",sans-serif;color:var(--d-ink);background:linear-gradient(135deg,#142f40,#122c35);border:1px solid #426574;border-radius:22px;padding:18px;max-width:1100px;margin:auto;outline-offset:4px;color-scheme:dark}.lg-dungeon *{box-sizing:border-box}.lg-dungeon p{margin:5px 0;color:inherit;font:inherit}.lg-dungeon h2,.lg-dungeon h3{margin:0;color:inherit;line-height:1.35}.lg-dungeon h2{font-size:25px}.lg-dungeon h3{font-size:17px}.lg-dungeon header{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin:0 0 14px}.lg-dungeon .d-subtitle{font-size:13px;color:var(--d-soft)}.lg-dungeon button{font:inherit;font-weight:700;min-height:46px;border:1px solid #638a91;border-radius:12px;background:#244b57;color:#eef6ef;padding:10px 14px;cursor:pointer;touch-action:manipulation}.lg-dungeon button:hover:not(:disabled){background:#376774}.lg-dungeon button:disabled{opacity:.45;cursor:default}.lg-dungeon button:focus-visible{outline:3px solid #ffd986;outline-offset:2px}.lg-dungeon .d-floor-badge{white-space:nowrap;border:1px solid #709190;border-radius:13px;padding:9px 12px;background:#213f48;color:#f5dbac;font-weight:800}.lg-dungeon .d-stats{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-bottom:14px}.lg-dungeon .d-stat{padding:9px 12px;border:1px solid #446773;border-radius:13px;background:#102b38}.lg-dungeon .d-stat-label{display:flex;justify-content:space-between;font-size:13px;gap:8px}.lg-dungeon .d-meter{height:8px;background:#315260;border-radius:8px;overflow:hidden;margin-top:7px}.lg-dungeon .d-meter span{display:block;height:100%;background:#81c8a7;width:100%}.lg-dungeon .d-meter.food span{background:#e8bd72}.lg-dungeon .d-main{display:grid;grid-template-columns:minmax(290px,1.15fr) minmax(260px,.85fr);gap:16px}.lg-dungeon .d-map-wrap{min-width:0;border-radius:17px;overflow:hidden;background:#071923;border:1px solid #4a6673;padding:8px}.lg-dungeon .d-map{display:block;width:100%;max-height:510px;aspect-ratio:1;user-select:none}.lg-dungeon .d-map text{font-family:inherit}.lg-dungeon .d-map-caption{font-size:12px;color:#a8c2c7;padding:6px 5px 2px}.lg-dungeon .d-panel{min-width:0;padding:14px;border:1px solid #496976;border-radius:17px;background:#173541}.lg-dungeon .d-goal{color:#f6daa1;font-size:15px;min-height:45px;margin:7px 0 12px}.lg-dungeon .d-pad{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;max-width:255px;margin:12px auto}.lg-dungeon .d-pad button{min-height:52px;font-size:22px;padding:8px}.lg-dungeon .d-pad .d-up{grid-column:2}.lg-dungeon .d-pad .d-left{grid-column:1}.lg-dungeon .d-pad .d-down{grid-column:2}.lg-dungeon .d-actions{display:grid;grid-template-columns:1fr 1fr;gap:7px}.lg-dungeon .d-leave{grid-column:1/-1;background:#dfc489;color:#193843;border-color:#efdcae}.lg-dungeon .d-leave:hover:not(:disabled){background:#f4ddb0}.lg-dungeon .d-meal{margin-top:10px;width:100%;font-size:14px}.lg-dungeon .d-hint{font-size:12px;color:#b5cace;margin-top:7px}.lg-dungeon .d-sight{margin-top:12px;padding:10px;border-radius:10px;background:#244653;min-height:58px;font-size:13px}.lg-dungeon .d-notice{margin:14px 0 10px;padding:12px 14px;min-height:48px;border:1px solid #65817d;background:#263e41;border-radius:13px;color:#edf4e8;font-size:14px}.lg-dungeon .d-notice[data-kind=won]{background:#245242;border-color:#83b594}.lg-dungeon .d-notice[data-kind=lost]{background:#62443a;border-color:#bb9987}.lg-dungeon .d-found{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}.lg-dungeon .d-found span{padding:7px 11px;border-radius:10px;background:#223f4a;border:1px solid #426371;color:#9bb7bd;font-size:13px}.lg-dungeon .d-found span[data-found=true]{background:#4a4936;border-color:#b4a270;color:#fae4b0}.lg-dungeon .d-pause{display:none;color:#ffe0a0;font-weight:800}.lg-dungeon.d-paused .d-pause{display:block}.lg-dungeon .d-keys{font-size:12px;color:#a8c1c7;margin-top:11px}.lg-dungeon .d-legend{display:flex;gap:10px;flex-wrap:wrap;font-size:12px;color:#bed1d3;margin:7px 0 0}.lg-dungeon .d-discovery-flash{box-shadow:0 0 0 2px #d9bf87}.lg-dungeon [hidden]{display:none!important}
      @media(max-width:690px){.lg-dungeon{padding:11px;border-radius:16px}.lg-dungeon header{gap:8px;margin-bottom:9px}.lg-dungeon h2{font-size:21px}.lg-dungeon .d-subtitle{font-size:12px}.lg-dungeon .d-floor-badge{font-size:13px;padding:7px 8px}.lg-dungeon .d-stats{gap:6px;margin-bottom:9px}.lg-dungeon .d-stat{padding:7px 9px}.lg-dungeon .d-main{grid-template-columns:1fr;gap:10px}.lg-dungeon .d-map-wrap{padding:5px}.lg-dungeon .d-map{max-height:340px}.lg-dungeon .d-panel{padding:11px}.lg-dungeon .d-pad{margin:8px auto;max-width:290px;grid-template-columns:repeat(4,1fr)}.lg-dungeon .d-pad button{min-height:46px}.lg-dungeon .d-pad .d-up{grid-column:2;grid-row:1}.lg-dungeon .d-pad .d-left{grid-column:1;grid-row:1}.lg-dungeon .d-pad .d-down{grid-column:3;grid-row:1}.lg-dungeon .d-pad [data-direction=right]{grid-column:4;grid-row:1}.lg-dungeon .d-pad [data-game-action=wait]{display:none}.lg-dungeon .d-goal{min-height:0;margin:5px 0;font-size:14px}.lg-dungeon .d-legend{font-size:11px}.lg-dungeon .d-map-caption{font-size:11px}.lg-dungeon .d-keys{font-size:11px}.lg-dungeon .d-notice{margin-top:10px}}
      @media(orientation:portrait) and (max-width:600px) and (max-height:740px){.lg-dungeon{padding:6px}.lg-dungeon header{align-items:center;gap:4px;margin:0 0 4px}.lg-dungeon h2{font-size:18px}.lg-dungeon .d-subtitle{display:none}.lg-dungeon .d-floor-badge{font-size:12px;padding:3px 7px}.lg-dungeon .d-stats{gap:5px;margin-bottom:5px}.lg-dungeon .d-stat{padding:3px 7px}.lg-dungeon .d-stat-label{font-size:12px}.lg-dungeon .d-meter{height:4px;margin-top:3px}.lg-dungeon .d-main{gap:5px}.lg-dungeon .d-map-wrap{padding:3px}.lg-dungeon .d-map{width:218px;height:218px;max-height:none;margin:auto}.lg-dungeon .d-map-caption{font-size:11px;margin:2px 0;padding:0;text-align:center}.lg-dungeon .d-legend{justify-content:center;gap:8px;font-size:10px;margin:0}.lg-dungeon .d-panel{padding:5px}.lg-dungeon .d-panel>h3,.lg-dungeon .d-goal{display:none}.lg-dungeon .d-pad{max-width:none;margin:0 0 5px;gap:5px}.lg-dungeon .d-pad button{height:44px;min-height:44px;padding:3px}.lg-dungeon .d-actions{gap:5px}.lg-dungeon .d-actions button{height:44px;min-height:44px;font-size:13px;padding:4px}.lg-dungeon .d-meal{min-height:44px;margin-top:5px}.lg-dungeon .d-map text{font-size:22px}}
      @media(orientation:landscape) and (max-height:500px) and (min-width:600px){.lg-dungeon{display:grid;grid-template-columns:minmax(190px,220px) minmax(145px,1fr) minmax(130px,1fr);grid-template-rows:24px 28px repeat(3,44px);gap:4px 8px;padding:6px;border-radius:12px}.lg-dungeon header{grid-column:2/4;grid-row:1;align-items:center;gap:5px;padding:0;margin:0;border:0;background:none}.lg-dungeon h2{font-size:16px}.lg-dungeon .d-subtitle,.lg-dungeon .d-panel>h3{display:none}.lg-dungeon .d-floor-badge{font-size:11px;padding:2px 6px;border-radius:7px}.lg-dungeon .d-stats{grid-column:2/4;grid-row:2;gap:5px;margin:0}.lg-dungeon .d-stat{padding:2px 6px;border-radius:6px}.lg-dungeon .d-stat-label{font-size:11px;line-height:16px}.lg-dungeon .d-meter{height:3px;margin-top:2px}.lg-dungeon .d-main,.lg-dungeon .d-panel{display:contents}.lg-dungeon .d-map-wrap{grid-column:1;grid-row:1/6;padding:2px;position:relative;min-height:0;border-radius:9px}.lg-dungeon .d-map{width:100%;height:100%;max-height:none;aspect-ratio:auto}.lg-dungeon .d-map text{font-size:22px}.lg-dungeon .d-map-caption,.lg-dungeon .d-legend{display:none}.lg-dungeon .d-pad{grid-column:2;grid-row:3/6;grid-template-columns:repeat(3,minmax(44px,1fr));grid-template-rows:repeat(3,44px);gap:4px;max-width:none;margin:0}.lg-dungeon .d-pad button{min-width:44px;min-height:44px;height:44px;padding:3px;font-size:20px}.lg-dungeon .d-pad .d-up{grid-column:2;grid-row:1}.lg-dungeon .d-pad .d-left{grid-column:1;grid-row:2}.lg-dungeon .d-pad [data-game-action=wait]{display:block;grid-column:2;grid-row:2}.lg-dungeon .d-pad [data-direction=right]{grid-column:3;grid-row:2}.lg-dungeon .d-pad .d-down{grid-column:2;grid-row:3}.lg-dungeon .d-actions{grid-column:3;grid-row:3/6;grid-template-columns:1fr;grid-template-rows:repeat(3,44px);gap:4px}.lg-dungeon .d-actions button{min-width:44px;min-height:44px;height:44px;padding:4px;font-size:12px}.lg-dungeon .d-leave{grid-column:auto}.lg-dungeon .d-goal,.lg-dungeon .d-meal,.lg-dungeon .d-hint,.lg-dungeon .d-sight,.lg-dungeon .d-notice,.lg-dungeon>section,.lg-dungeon .d-keys{grid-column:1/-1;min-height:0;margin:0}.lg-dungeon .d-goal{font-size:12px;padding:3px 0}.lg-dungeon .d-meal{min-height:44px;font-size:13px}.lg-dungeon .d-hint,.lg-dungeon .d-sight,.lg-dungeon .d-notice{font-size:12px}.lg-dungeon .d-pause{font-size:11px}.lg-dungeon.d-paused header{grid-row:auto}}
      /* Keep each action's short feedback beside the controls on small screens. */
      .lg-dungeon .d-feedback{display:none;border:1px solid #789787;border-radius:8px;background:#294a46;color:#f4f6e5;font-size:12px;line-height:16px;padding:5px 8px;min-height:42px}
      @media(orientation:portrait) and (max-width:690px){.lg-dungeon{padding:6px}.lg-dungeon header{align-items:center;gap:4px;margin:0 0 4px}.lg-dungeon h2{font-size:18px}.lg-dungeon .d-subtitle{display:none}.lg-dungeon .d-floor-badge{font-size:12px;padding:3px 7px}.lg-dungeon .d-stats{gap:5px;margin-bottom:5px}.lg-dungeon .d-stat{padding:3px 7px}.lg-dungeon .d-stat-label{font-size:12px}.lg-dungeon .d-meter{height:4px;margin-top:3px}.lg-dungeon .d-feedback{display:block;margin:0 0 5px}.lg-dungeon .d-main{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:5px}.lg-dungeon .d-map-wrap{grid-column:1/-1;grid-row:1;padding:3px}.lg-dungeon .d-map{width:clamp(180px,calc(100dvh - 450px),270px);height:clamp(180px,calc(100dvh - 450px),270px);max-height:none;margin:auto}.lg-dungeon .d-map-caption,.lg-dungeon .d-legend{display:none}.lg-dungeon .d-panel,.lg-dungeon .d-actions{display:contents}.lg-dungeon .d-panel>h3,.lg-dungeon .d-goal{display:none}.lg-dungeon .d-pad{grid-column:1/-1;grid-row:2;grid-template-columns:repeat(4,minmax(0,1fr));gap:5px;margin:0;max-width:none}.lg-dungeon .d-pad button,.lg-dungeon .d-actions button,.lg-dungeon .d-meal{height:44px;min-height:44px;min-width:44px;padding:3px;font-size:13px}.lg-dungeon .d-pad button{font-size:22px}.lg-dungeon [data-testid=dungeon-attack]{grid-column:1;grid-row:3}.lg-dungeon [data-testid=dungeon-observe]{grid-column:2;grid-row:3}.lg-dungeon .d-leave{grid-column:1;grid-row:4}.lg-dungeon .d-meal{grid-column:2;grid-row:4;margin:0}.lg-dungeon .d-hint,.lg-dungeon .d-sight{grid-column:1/-1}.lg-dungeon .d-map text{font-size:22px}}
      @media(orientation:landscape) and (max-height:500px) and (min-width:600px){.lg-dungeon{grid-template-rows:28px repeat(3,44px) 40px}.lg-dungeon header{display:none}.lg-dungeon .d-stats{grid-row:1}.lg-dungeon .d-map-wrap{grid-row:1/6}.lg-dungeon .d-pad{grid-row:2/5}.lg-dungeon .d-actions{display:contents}.lg-dungeon [data-testid=dungeon-attack]{grid-column:3;grid-row:2}.lg-dungeon [data-testid=dungeon-observe]{display:none}.lg-dungeon .d-meal{grid-column:3;grid-row:3;min-height:44px;height:44px;font-size:12px;padding:4px}.lg-dungeon .d-leave{grid-column:3;grid-row:4}.lg-dungeon .d-goal{display:none}.lg-dungeon .d-feedback{display:block;grid-column:2/4;grid-row:5;padding:3px 6px;min-height:40px;margin:0}.lg-dungeon .d-actions button{min-width:44px;min-height:44px;height:44px;font-size:12px;padding:4px}}

      .lg-dungeon .d-identity{display:flex;align-items:center;gap:10px;min-width:0}.lg-dungeon .d-character-portrait{width:42px;height:64px;object-fit:contain;flex:none;filter:drop-shadow(0 2px 3px #07192380)}.lg-dungeon .d-character-name{font-size:13px;font-weight:700;color:#f3d694;margin:2px 0}.lg-dungeon .d-art-note{font-size:12px;line-height:1.4;color:#f3d694;margin:3px 0}.lg-dungeon .d-player-ground{pointer-events:none}.lg-dungeon .d-player-image{pointer-events:none}
      @media(max-width:690px){.lg-dungeon .d-identity{gap:7px}.lg-dungeon .d-character-portrait{width:32px;height:48px}.lg-dungeon .d-character-name{font-size:12px;margin:1px 0}.lg-dungeon .d-art-note{font-size:11px}}
      /* Short portrait frames keep the full map beside identity and meters. */
      @media(orientation:portrait) and (max-width:690px) and (max-height:600px){.lg-dungeon{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:5px}.lg-dungeon header{grid-column:5/7;grid-row:1;display:block;margin:0;align-self:start}.lg-dungeon h2{display:none}.lg-dungeon .d-identity{gap:4px}.lg-dungeon .d-character-name{font-size:11px}.lg-dungeon .d-floor-badge{display:inline-block;font-size:11px;line-height:14px;padding:2px 4px;margin-top:3px}.lg-dungeon .d-stats{grid-column:5/7;grid-row:2;grid-template-columns:1fr;gap:4px;margin:0;align-self:end}.lg-dungeon .d-stat{padding:2px 4px}.lg-dungeon .d-stat-label{display:block;font-size:11px;line-height:14px}.lg-dungeon .d-stat-label strong{display:block}.lg-dungeon .d-meter{height:3px;margin-top:2px}.lg-dungeon .d-feedback{grid-column:1/-1;grid-row:3;margin:0}.lg-dungeon .d-main,.lg-dungeon .d-panel,.lg-dungeon .d-actions{display:contents}.lg-dungeon .d-map-wrap{grid-column:1/5;grid-row:1/3;min-width:0;height:188px;padding:3px;align-self:start}.lg-dungeon .d-map{width:180px;height:180px}.lg-dungeon .d-pad{grid-column:1/-1;grid-row:4;margin:0}.lg-dungeon [data-testid=dungeon-attack]{grid-column:1/4;grid-row:5}.lg-dungeon [data-testid=dungeon-observe]{grid-column:4/7;grid-row:5}.lg-dungeon .d-leave{grid-column:1/4;grid-row:6}.lg-dungeon .d-meal{grid-column:4/7;grid-row:6}.lg-dungeon .d-hint,.lg-dungeon .d-sight,.lg-dungeon .d-notice,.lg-dungeon>section,.lg-dungeon .d-keys{grid-column:1/-1}}
    </style><header><div class="d-identity"><img class="d-character-portrait" data-testid="dungeon-character-portrait" alt="" draggable="false" hidden><div><h2>杂物房迷宫</h2><p class="d-character-name" data-testid="dungeon-character-name"></p><p class="d-art-note" data-testid="dungeon-character-art" role="status" hidden></p><p class="d-subtitle">走一步，看清一片。找楼梯，向更旧的物件出发。</p><p class="d-pause">已暂停，敌人与行动值都停在原处。</p></div></div><div class="d-floor-badge" data-testid="dungeon-floor"></div></header>
    <div class="d-stats"><div class="d-stat"><div class="d-stat-label"><span data-testid="dungeon-character-health-label">体力</span><strong data-testid="dungeon-health"></strong></div><div class="d-meter"><span data-health-meter></span></div></div><div class="d-stat"><div class="d-stat-label"><span>局内行动值</span><strong data-testid="dungeon-satiety"></strong></div><div class="d-meter food"><span data-food-meter></span></div></div></div>
    <p class="d-feedback" data-testid="dungeon-feedback" aria-hidden="true"></p>
    <div class="d-main"><div class="d-map-wrap"><svg class="d-map" data-testid="dungeon-map" viewBox="0 0 450 450" role="img" aria-label="带迷雾的杂物房格子地图"></svg><p class="d-map-caption" data-testid="dungeon-map-caption"></p><div class="d-legend"><span data-testid="dungeon-legend-player">● 你</span><span>▤ 柜子</span><span>▱ 楼梯</span><span>◇ 旧物</span></div></div><section class="d-panel"><h3>这一层怎么走</h3><p class="d-goal" data-testid="dungeon-goal"></p><div class="d-pad" aria-label="移动方向"><button class="d-up" type="button" data-game-action="move" data-direction="up" data-testid="dungeon-up" aria-label="向上走">↑</button><button class="d-left" type="button" data-game-action="move" data-direction="left" data-testid="dungeon-left" aria-label="向左走">←</button><button type="button" data-game-action="wait" data-testid="dungeon-wait" aria-label="等一回合">等</button><button type="button" data-game-action="move" data-direction="right" data-testid="dungeon-right" aria-label="向右走">→</button><button class="d-down" type="button" data-game-action="move" data-direction="down" data-testid="dungeon-down" aria-label="向下走">↓</button></div><div class="d-actions"><button type="button" data-game-action="attack" data-testid="dungeon-attack">挥拖鞋</button><button type="button" data-game-action="wait" data-testid="dungeon-observe">等一回合</button><button class="d-leave" type="button" data-game-action="descend" data-testid="dungeon-descend">走下楼梯</button></div><button class="d-meal" type="button" data-game-action="use-meal" data-testid="dungeon-meal">使用可选料理</button><p class="d-hint" data-testid="dungeon-meal-hint"></p><div class="d-sight" data-testid="dungeon-enemies"></div></section></div>
    <div class="d-notice" role="status" aria-live="polite" data-testid="dungeon-notice"></div><section aria-label="这次探索的发现"><h3>这次找到的旧物</h3><div class="d-found">${ITEMS.map(item => `<span data-discovery="${item.id}" data-testid="dungeon-discovery-${item.id}">${item.mark} · ${item.name}</span>`).join('')}</div><p class="d-hint">只记录本局发现；不会变成鱼、料理或学习成绩。</p></section><p class="d-keys">方向键 / WASD 移动；朝敌人走会挥拖鞋；空格等待；E 下楼梯；F 朝面前挥拖鞋；M 使用可选料理。敌人只在你行动后移动。</p>`;
    const mealFeedback = doc.createElement('p'); mealFeedback.className = 'd-hint'; mealFeedback.dataset.testid = 'dungeon-meal-feedback'; mealFeedback.setAttribute('role', 'status'); mealFeedback.hidden = true;
    el.querySelector('[data-testid="dungeon-meal"]').before(mealFeedback);
    container.appendChild(el);
    const $ = selector => el.querySelector(selector);
    // Decode the selected original PNG once per mount. No artwork data is
    // written into the deterministic game state or its action transcript.
    const portrait = $('[data-testid="dungeon-character-portrait"]');
    function artNote() {
      return artworkState === 'unknown' ? '未确认棋盘人物，暂用“你”标记。' : ['missing', 'error'].includes(artworkState) ? characterName + '的图片未显示，暂用“你”标记。' : '';
    }
    function artStatus() {
      el.dataset.character = characterId || ''; el.dataset.artworkState = artworkState;
      $('[data-testid="dungeon-character-name"]').textContent = characterId ? characterName + ' · 你正在探索' : '你正在探索';
      $('[data-testid="dungeon-character-health-label"]').textContent = characterName + ' · 体力';
      $('[data-testid="dungeon-legend-player"]').textContent = artworkState === 'ready' ? characterName + '（你）' : '● 你';
      const note = $('[data-testid="dungeon-character-art"]'); note.textContent = artNote(); note.hidden = !note.textContent;
      portrait.hidden = artworkState !== 'ready';
    }
    function artworkFailed() { if (disposed) return; artworkState = 'error'; portrait.hidden = true; render(); }
    function loadArtwork() {
      if (!assetAvailable) return;
      characterImage = new win.Image();
      characterImage.onload = () => {
        if (disposed) return;
        if (!characterImage.naturalWidth || !characterImage.naturalHeight) { artworkFailed(); return; }
        artworkState = 'ready'; portrait.alt = characterName; portrait.src = characterAsset.src; render();
      };
      characterImage.onerror = artworkFailed; portrait.onerror = artworkFailed;
      characterImage.src = characterAsset.src;
    }
    function tileSVG(s) {
      const floor = s.floors[s.floor], parts = [];
      const colours = [['#254654', '#49646a'], ['#51463d', '#796754'], ['#3c3b55', '#69607a']][s.floor];
      for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
        const sx = x * 50, sy = y * 50, seen = floor.seen[key(x, y)], lit = visible(s, x, y);
        if (!seen) { parts.push(`<rect x="${sx + 1}" y="${sy + 1}" width="48" height="48" rx="5" fill="#0c202b"/><circle cx="${sx + 25}" cy="${sy + 25}" r="1.5" fill="#273b45"/>`); continue; }
        const wall = floor.tiles[y][x] === '#';
        parts.push(`<g opacity="${lit ? 1 : 0.55}"><rect x="${sx + 1}" y="${sy + 1}" width="48" height="48" rx="5" fill="${wall ? '#40515a' : colours[0]}" stroke="${wall ? '#61757b' : colours[1]}" stroke-width="1"/>${wall ? `<path d="M${sx + 8} ${sy + 15}h34M${sx + 8} ${sy + 33}h34" stroke="#233943" stroke-width="3"/><rect x="${sx + 12}" y="${sy + 6}" width="27" height="35" rx="3" fill="none" stroke="#82918a" opacity=".35"/>` : ''}`);
        if (!wall && same({ x, y }, floor.exit)) parts.push(`<path d="M${sx + 10} ${sy + 35}h10v-8h10v-8h10" fill="none" stroke="#e8d095" stroke-width="5"/><text x="${sx + 25}" y="${sy + 13}" text-anchor="middle" fill="#f6e6bd" font-size="10">${s.floor === 2 ? '出口' : '下层'}</text>`);
        if (!floor.item.found && floor.item.x === x && floor.item.y === y) parts.push(`<path d="M${sx + 25} ${sy + 8}l15 17-15 17-15-17z" fill="#d9b980" stroke="#ffe7b0" stroke-width="2"/><text x="${sx + 25}" y="${sy + 30}" text-anchor="middle" fill="#3a443d" font-weight="800" font-size="16">${ITEMS[s.floor].mark}</text>`);
        parts.push('</g>');
      }
      for (const e of alive(floor)) if (visible(s, e.x, e.y)) {
        const p = ENEMIES[e.kind], cx = e.x * 50 + 25, cy = e.y * 50 + 25;
        parts.push(`<g data-enemy-id="${e.id}">${e.kind === 'dust' ? `<path d="M${cx - 17} ${cy + 8}q-10-13 0-20q1-12 12-8q9-12 17 0q13 0 9 14q9 10-4 16z" fill="${p.colour}"/>` : e.kind === 'robot' ? `<ellipse cx="${cx}" cy="${cy}" rx="20" ry="17" fill="${p.colour}" stroke="#173d4a" stroke-width="3"/><path d="M${cx - 11} ${cy - 5}h22" stroke="#406c78" stroke-width="5"/>` : `<rect x="${cx - 17}" y="${cy - 18}" width="34" height="34" rx="7" fill="${p.colour}"/><circle cx="${cx - 12}" cy="${cy + 16}" r="6" fill="#67514c"/><circle cx="${cx + 12}" cy="${cy + 16}" r="6" fill="#67514c"/>`}<text x="${cx}" y="${cy + 7}" text-anchor="middle" fill="#213840" font-size="17" font-weight="800">${p.glyph}</text></g>`);
      }
      const px = s.player.x * 50 + 25, py = s.player.y * 50 + 25;
      const playerLabel = artworkState === 'ready' ? characterName + '（你）' : characterId ? characterName + '，暂用你标记' : '你，未确认棋盘人物';
      const spriteHeight = 44, spriteWidth = artworkState === 'ready' ? Math.min(44, spriteHeight * characterImage.naturalWidth / characterImage.naturalHeight) : 0;
      // Keep the complete picture inside its 50-unit cell. The ground ring
      // anchors position without hiding adjacent enemies, stairs or items.
      const playerArt = artworkState === 'ready' ? `<ellipse class="d-player-ground" cx="${px}" cy="${py + 19}" rx="18" ry="5" fill="#071923" stroke="#f3d38d" stroke-width="2"/><image class="d-player-image" data-testid="dungeon-player-art" data-character="${characterId}" href="${escapeAttr(characterAsset.src)}" x="${px - spriteWidth / 2}" y="${py - 23}" width="${spriteWidth}" height="${spriteHeight}" preserveAspectRatio="xMidYMax meet"/>` : `<circle cx="${px}" cy="${py}" r="19" fill="#f0d08d" stroke="#fff0ca" stroke-width="3"/><text x="${px}" y="${py + 6}" text-anchor="middle" fill="#173c45" font-size="17" font-weight="800">你</text>`;
      parts.push(`<g data-testid="dungeon-player" data-character="${characterId || ''}" data-artwork-state="${artworkState}" role="img" aria-label="${escapeAttr(playerLabel)}">${playerArt}</g>`);
      return parts.join('');
    }
    function render() {
      const f = state.floors[state.floor], stopped = paused || state.phase !== 'playing';
      artStatus();
      el.dataset.phase = state.phase; el.classList.toggle('d-paused', paused && state.phase === 'playing');
      $('[data-testid="dungeon-floor"]').textContent = '第 ' + (state.floor + 1) + ' / 3 层';
      $('[data-testid="dungeon-health"]').textContent = state.health + ' / ' + state.healthMax;
      $('[data-testid="dungeon-satiety"]').textContent = state.satiety + ' / ' + state.satietyMax;
      $('[data-health-meter]').style.width = state.health / state.healthMax * 100 + '%';
      $('[data-food-meter]').style.width = state.satiety / state.satietyMax * 100 + '%';
      $('[data-testid="dungeon-map"]').innerHTML = tileSVG(state);
      const playerImage = $('[data-testid="dungeon-player-art"]'); if (playerImage) playerImage.onerror = artworkFailed;
      $('[data-testid="dungeon-map-caption"]').textContent = f.title + ' · 已走 ' + state.turns + ' 回合 · 位置 ' + state.player.x + ',' + state.player.y;
      $('[data-testid="dungeon-goal"]').textContent = same(state.player, f.exit) ? (state.floor === 2 ? '就在最后出口！带着你的发现离开。' : '你已到楼梯口，可以走进下一层。') : '探索暗处，找到楼梯。朝相邻敌人走会挥拖鞋；也可以绕开它。';
      for (const b of el.querySelectorAll('button')) b.disabled = stopped;
      const leave = $('[data-testid="dungeon-descend"]'); leave.textContent = state.floor === 2 ? '带着发现离开' : '走下楼梯'; leave.disabled = stopped || !same(state.player, f.exit);
      const meal = $('[data-testid="dungeon-meal"]'); meal.disabled = stopped || state.mealsUsed >= state.config.mealCharges || state.satiety === state.satietyMax;
      meal.textContent = state.mealsUsed ? '料理已使用' : state.config.mealCharges ? '使用 1 份料理 · 行动值 +' + Math.min(40, state.satietyMax - state.satiety) : '本局未携带料理';
      mealFeedback.hidden = state.mealsUsed === 0;
      mealFeedback.textContent = state.mealsUsed ? '料理已恢复 ' + state.mealRestored + ' 点行动值。' : '';
      $('[data-testid="dungeon-meal-hint"]').textContent = state.config.mealCharges ? '自愿使用，最多恢复 40 点，不超过开局上限。仅实际使用才消费。' : '基础路线不用料理也能完成。饱食是这局行动值，不是共享零食。';
      const near = alive(f).filter(e => visible(state, e.x, e.y));
      const adjacentDirection = e => ORDER.find(name => { const [dx, dy] = DIRS[name]; return e.x === state.player.x + dx && e.y === state.player.y + dy; });
      $('[data-testid="dungeon-attack"]').textContent = '向' + directionText[state.player.facing] + '挥拖鞋';
      $('[data-testid="dungeon-enemies"]').textContent = near.length ? '看见：' + near.map(e => { const d = adjacentDirection(e); return ENEMIES[e.kind].name + (d ? '（就在' + directionText[d] + '边，按 ' + directionArrow[d] + ' 可攻击）' : ''); }).join('、') + '。你不行动，它们也会等着。' : '附近暂时没有敌人。可以慢慢观察，不用抢时间。';
      const adjacent = near.find(e => adjacentDirection(e));
      let noticeText = state.notice.startsWith('这个方向没有相邻敌人。') ? '当前朝' + directionText[state.player.facing] + '，这个方向没有相邻敌人。' + (adjacent ? '按 ' + directionArrow[adjacentDirection(adjacent)] + '，就能攻击' + directionText[adjacentDirection(adjacent)] + '边的敌人。' : '可先观察位置，再按敌人所在的方向。') : state.notice;
      if (state.notice.includes('体力 −1。')) noticeText = '受到附近敌人的攻击。' + (recentDamage > 0 ? '本回合体力 −' + recentDamage + '。' : '') + '目前体力 ' + state.health + ' / ' + state.healthMax + '。按相邻敌人的方向键可攻击，也可以找机会绕开。';
      let brief = noticeText;
      if (state.notice.startsWith('找出三层楼梯')) brief = '按方向走一格，找到楼梯。停着不动不会消耗行动值。';
      else if (state.notice.startsWith('这边是柜子')) brief = '前面是柜子，换个方向。没有消耗行动值。';
      else if (state.notice.startsWith('这个方向没有相邻敌人')) brief = '朝' + directionText[state.player.facing] + '没有相邻敌人。' + (adjacent ? '按 ' + directionArrow[adjacentDirection(adjacent)] + ' 攻击' + directionText[adjacentDirection(adjacent)] + '边的敌人。' : '按敌人所在方向可攻击。');
      else if (state.notice.includes('体力 −1。')) brief = (recentDamage > 0 ? '体力 −' + recentDamage + '，' : '') + '剩余 ' + state.health + ' / ' + state.healthMax + '。按相邻敌人的方向攻击，或绕开它。';
      else if (state.notice.startsWith('走了一格')) brief = '走了一格。探索暗处，找到楼梯；朝相邻敌人走可攻击。';
      else if (state.notice.startsWith('用了 1 份可选料理')) brief = '料理已恢复 ' + state.mealRestored + ' 点行动值；本局料理已使用。';
      else if (state.notice.startsWith('原地等一回合')) brief = '等了一回合，行动值 −1。敌人可能移动或攻击。';
      const noteText = artNote(); if (noteText) brief = noteText + ' ' + brief;
      const feedback = $('[data-testid="dungeon-feedback"]'); if (feedback.textContent !== brief) feedback.textContent = brief;
      const notice = $('[data-testid="dungeon-notice"]'); if (notice.textContent !== noticeText) notice.textContent = noticeText; notice.dataset.kind = state.phase;
      for (const item of ITEMS) { const card = $('[data-discovery="' + item.id + '"]'); card.dataset.found = String(state.discoveries.includes(item.id)); card.classList.toggle('d-discovery-flash', state.latestDiscovery === item.id); card.textContent = (state.discoveries.includes(item.id) ? '✓ ' : '◇ ') + item.name; }
    }
    function emit(action) { if (!disposed && !paused && state.phase === 'playing') options.onAction(action); }
    function click(event) {
      const b = event.target.closest('[data-game-action]'); if (!b || !el.contains(b) || b.disabled) return;
      const type = b.dataset.gameAction;
      emit(type === 'move' ? { type, direction: b.dataset.direction } : type === 'attack' ? { type, direction: state.player.facing } : { type });
      // A used stair or meal button becomes disabled; keep keyboard play in the game.
      if (!disposed && !paused && state.phase === 'playing' && b.disabled) el.focus({ preventScroll: true });
    }
    function keydown(event) {
      if (disposed || paused || state.phase !== 'playing' || event.repeat || event.altKey || event.ctrlKey || event.metaKey || ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)) return;
      // Keep native keyboard activation for a focused button. Space only waits
      // when focus is on the game surface, never instead of its labelled action.
      if (event.target.closest('button') && (event.code === 'Space' || event.key === ' ' || event.key === 'Enter')) return;
      const direction = { ArrowUp: 'up', ArrowRight: 'right', ArrowDown: 'down', ArrowLeft: 'left', w: 'up', W: 'up', a: 'left', A: 'left', s: 'down', S: 'down', d: 'right', D: 'right' }[event.key];
      let action = direction ? { type: 'move', direction } : event.code === 'Space' || event.key === ' ' ? { type: 'wait' } : event.key.toLowerCase() === 'e' ? { type: 'descend' } : event.key.toLowerCase() === 'f' ? { type: 'attack', direction: state.player.facing } : event.key.toLowerCase() === 'm' ? { type: 'use-meal' } : null;
      if (action) { event.preventDefault(); emit(action); }
    }
    el.addEventListener('click', click); el.addEventListener('keydown', keydown); render(); loadArtwork();
    return {
      update(next) { if (disposed) return; validate(next); if (next.health < state.health) recentDamage = state.health - next.health; else if (next.notice !== state.notice) recentDamage = null; state = copy(next); render(); },
      setPaused(value) { if (disposed) return; paused = Boolean(value); render(); },
      dispose() { if (disposed) return; disposed = true; if (characterImage) { characterImage.onload = null; characterImage.onerror = null; } portrait.onerror = null; const playerImage = $('[data-testid="dungeon-player-art"]'); if (playerImage) playerImage.onerror = null; el.removeEventListener('click', click); el.removeEventListener('keydown', keydown); el.remove(); }
    };
  }
  return { id: 'dungeon', version: 1, title: '杂物房迷宫', create, step, validate, result, mount };
});

;
/* G02: procedural illustrative tracks, deterministic racing, no inventory writes. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else(root.LiangGames||(root.LiangGames={})).kart=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const id='kart',version=1,title='梁家卡丁车';
const TRACKS={
 'masai-market':{name:'Masai巴刹',length:1600,curves:[0,.48,.25,-.55,-.3,.5,.2,0],sky:'#baded8',grass:'#669f7f',road:'#536369',accent:'#f5bc6b'},
 'north-south':{name:'南北大道',length:1800,curves:[0,.27,.48,.12,-.48,-.3,.2,0],sky:'#aed8ed',grass:'#80aa68',road:'#516375',accent:'#aad6e8'}
};
const clone=value=>JSON.parse(JSON.stringify(value));
const assert=(condition,message)=>{if(!condition)throw Error(message);};
const int=(n,a,b)=>Number.isSafeInteger(n)&&n>=a&&n<=b;
const num=(n,a,b)=>typeof n==='number'&&Number.isFinite(n)&&n>=a&&n<=b;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const round=(n,p=100000)=>Math.round(n*p)/p||0;
function normalize(config={}){
 const seed=config.seed??1,difficulty=config.difficulty??0,mode=config.mode??'practice',mealCharges=config.mealCharges??0;
 assert(int(seed,0,4294967295)&&int(difficulty,0,2)&&int(mealCharges,0,1),'赛车配置无效。');
 assert(['practice','inventory'].includes(mode)&&!(mode==='practice'&&mealCharges),'练习模式不消耗共享料理。');
 const trackId=config.trackId??(seed%2?'north-south':'masai-market');assert(Object.hasOwn(TRACKS,trackId),'这条赛道不在本批清单中。');
 return{seed,difficulty,mode,trackId,mealCharges};
}
function curve(config,distance){const t=TRACKS[config.trackId],at=((distance%t.length)+t.length)%t.length/t.length*8,i=Math.floor(at),u=at-i,smooth=u*u*(3-2*u);return(t.curves[i]+(t.curves[(i+1)%8]-t.curves[i])*smooth)*[.75,.95,1.1][config.difficulty];}
function obstacles(config){let seed=(config.seed^0x62bf0419)>>>0;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed;},length=TRACKS[config.trackId].length;return Array.from({length:6+config.difficulty},(_,i)=>({id:i,z:Math.round(length*(i+1)/(8+config.difficulty)),x:[-.68,0,.68][random()%3],kind:i%2?'crate':'cone'}));}
function aiLane(s,i){return(i===0?-.38:.38)+Math.sin(s.ai[i].distance/130+(s.config.seed%101))*.09;}
function limit(config){return[110000,100000,90000][config.difficulty];}
function create(config){config=normalize(config);return{version,config,phase:'playing',started:false,elapsedMs:0,distance:0,speed:0,x:0,input:{throttle:0,brake:0,steer:0},inputCount:0,checkpoints:0,lapTimes:[],ai:[{distance:0,finishMs:null},{distance:0,finishMs:null}],mealsUsed:0,boostMs:0,collisionMs:0,collisions:0,hitObstacles:[],notice:'完成两圈，领先至少一辆电脑车。基础车辆无需任何道具。',lastEvent:'ready'};}
function rank(s){return 1+s.ai.filter(a=>a.distance>s.distance||a.finishMs!==null&&a.finishMs<s.elapsedMs).length;}
function validate(s){
 assert(s&&s.version===1,'赛车进度版本无效。');const c=normalize(s.config),t=TRACKS[c.trackId],total=t.length*2;
 assert(JSON.stringify(c)===JSON.stringify(s.config),'赛车配置不完整。');assert(['playing','won','lost'].includes(s.phase)&&typeof s.started==='boolean','赛车阶段无效。');
 assert(int(s.elapsedMs,0,limit(c))&&num(s.distance,0,total)&&num(s.speed,0,130)&&num(s.x,-1.8,1.8),'赛车位置或时间无效。');
 assert(s.input&&int(s.input.throttle,0,1)&&int(s.input.brake,0,1)&&int(s.input.steer,-1,1)&&int(s.inputCount,0,100000),'赛车输入无效。');
 assert(int(s.checkpoints,0,8)&&s.checkpoints===Math.floor((s.distance+.000001)/(t.length/4)),'赛车不能跳过检查点。');
 assert(Array.isArray(s.lapTimes)&&s.lapTimes.length===Math.floor(s.checkpoints/4)&&s.lapTimes.every(n=>int(n,1,limit(c)))&&s.lapTimes.reduce((a,b)=>a+b,0)<=s.elapsedMs,'圈速记录无效。');
 assert(Array.isArray(s.ai)&&s.ai.length===2&&s.ai.every(a=>num(a.distance,0,total)&&(a.finishMs===null&&a.distance<total||int(a.finishMs,1,s.elapsedMs)&&a.distance===total)),'电脑车记录无效。');
 assert(int(s.mealsUsed,0,c.mealCharges)&&int(s.boostMs,0,5000)&&int(s.collisionMs,0,1200)&&int(s.collisions,0,10000),'赛车强化或碰撞记录无效。');assert(!s.boostMs||s.mealsUsed===1,'没有使用料理，不能获得料理加速。');
 const validHits=new Set(obstacles(c).flatMap(o=>['0:'+o.id,'1:'+o.id]));assert(Array.isArray(s.hitObstacles)&&new Set(s.hitObstacles).size===s.hitObstacles.length&&s.hitObstacles.every(h=>validHits.has(h)),'障碍碰撞记录无效。');
 assert(typeof s.notice==='string'&&s.notice.length<=200&&typeof s.lastEvent==='string','赛车提示无效。');
 if(!s.started)assert(s.elapsedMs===0&&s.distance===0&&s.speed===0&&s.checkpoints===0&&s.mealsUsed===0&&s.phase==='playing','比赛尚未开始，不能提前完成。');
 if(s.phase==='playing')assert(s.distance<total&&s.elapsedMs<limit(c),'已结束的比赛不能继续。');
 if(s.phase==='won')assert(s.started&&s.inputCount>0&&s.checkpoints===8&&s.distance===total&&rank(s)<=2,'没有完成有效比赛，不能获胜。');
 if(s.phase==='lost')assert(s.started&&(s.elapsedMs===limit(c)||s.distance===total&&rank(s)===3),'比赛失败原因无效。');return true;
}
function step(state,action){
 validate(state);assert(action&&typeof action.type==='string','赛车操作无效。');const s=clone(state);if(s.phase!=='playing')return s;
 if(action.type==='start'){if(!s.started){s.started=true;s.notice='油门起步！弯道可松油门或刹车，回到路面就能继续。';s.lastEvent='started';}return s;}
 if(action.type==='drive'){
  assert(int(action.throttle,0,1)&&int(action.brake,0,1)&&int(action.steer,-1,1),'赛车控制值无效。');if(!s.started)return s;
  s.input={throttle:action.throttle,brake:action.brake,steer:action.steer};s.inputCount++;return s;
 }
 if(action.type==='use-meal'){
  if(!s.started||s.speed<8||s.distance<=0){s.notice='先开动车辆，再使用料理加速。';return s;}
  if(s.mealsUsed>=s.config.mealCharges){s.notice=s.config.mealCharges?'本局料理加速已经用过了。':'本局没有携带料理；基础车辆也能完成比赛。';return s;}
  s.mealsUsed++;s.boostMs=5000;s.notice='料理已启用：5 秒小加速，弯道仍要控制方向。';s.lastEvent='meal';return s;
 }
 assert(action.type==='tick'&&int(action.dt,1,250),'赛车计时或操作无效。');if(!s.started)return s;
 // Bounded 25 ms physics steps make collision/checkpoint checks robust even for a 250 ms tick.
 let remaining=Math.min(action.dt,limit(s.config)-s.elapsedMs);
 while(remaining>0&&s.phase==='playing'){
  const dt=Math.min(25,remaining),seconds=dt/1000,track=TRACKS[s.config.trackId],total=track.length*2,base=86+s.config.difficulty*3;
  remaining-=dt;s.elapsedMs+=dt;s.boostMs=Math.max(0,s.boostMs-dt);s.collisionMs=Math.max(0,s.collisionMs-dt);
  const offroad=Math.abs(s.x)>1.04,max=offroad?24:base+(s.boostMs?18:0);
  const acceleration=s.input.brake?-92:s.input.throttle?38+(s.boostMs?14:0):-24;
  const beforeSpeed=s.speed;let nextSpeed=beforeSpeed+acceleration*seconds;
  // Normal acceleration stops at the limit. A boost ending or grass entry
  // decelerates from the previous speed; throttle cannot add speed above it.
  if(beforeSpeed>max)nextSpeed=Math.min(nextSpeed,Math.max(max,beforeSpeed-(offroad?105:36)*seconds));else nextSpeed=Math.min(nextSpeed,max);
  s.speed=round(clamp(nextSpeed,0,130));
  const steering=(.75+s.speed/base*1.1)*s.input.steer,drift=curve(s.config,s.distance)*(s.speed/base)*.75;
  s.x=round(clamp(s.x+(s.speed>1?steering-drift:0)*seconds,-1.8,1.8));
  const old=s.distance;let next=Math.min(total,round(old+s.speed*seconds));
  const gate=(s.checkpoints+1)*track.length/4;
  if(next>=gate&&Math.abs(s.x)>1.04){next=gate-.001;s.notice='检查点在路面上，请回到赛道中央通过。';s.lastEvent='checkpoint-missed';}
  s.distance=next;
  for(const obstacle of obstacles(s.config))for(let lap=Math.floor(old/track.length);lap<=Math.min(1,Math.floor(next/track.length));lap++){
   const at=lap*track.length+obstacle.z,key=lap+':'+obstacle.id;
   if(old<=at+8&&next>=at-8&&Math.abs(s.x-obstacle.x)<.23&&!s.hitObstacles.includes(key)){
    s.hitObstacles.push(key);s.collisions++;s.speed=round(s.speed*.5);s.collisionMs=1000;s.notice='碰到路障，速度降低了。稳住方向继续跑！';s.lastEvent='collision';
   }
  }
  s.ai.forEach((a,i)=>{
   if(a.finishMs!==null)return;
   const behind=s.distance-a.distance,catchup=behind>170?1.035:behind< -170?.965:1;
   const pace=(i===0?[66,73,80][s.config.difficulty]:[54,61,67][s.config.difficulty])*(.98+(s.config.seed%9)*.003)*catchup*(1-Math.abs(curve(s.config,a.distance))*.085);
   a.distance=round(Math.min(total,a.distance+pace*seconds));if(a.distance===total)a.finishMs=s.elapsedMs;
   if(!s.collisionMs&&Math.abs(a.distance-s.distance)<10&&Math.abs(aiLane(s,i)-s.x)<.22&&s.speed>20){s.speed=round(s.speed*.72);s.collisionMs=1200;s.collisions++;s.notice='擦到电脑车，稍微让开再超车。';s.lastEvent='collision';}
  });
  if(s.distance>=gate&&s.checkpoints<8){s.checkpoints++;s.lastEvent='checkpoint';if(s.checkpoints%4===0){s.lapTimes.push(s.elapsedMs-s.lapTimes.reduce((a,b)=>a+b,0));s.notice=s.checkpoints===4?'第一圈完成！还有一圈，保持节奏。':'两圈完成。';}else if(!s.boostMs)s.notice='检查点 '+s.checkpoints+' / 8 已通过。';}
  if(s.distance===total){s.phase=rank(s)<=2?'won':'lost';s.lastEvent='finished';s.notice=s.phase==='won'?'两圈完成，领先了电脑车！返回棋盘保存本次成绩。':'两圈完成，但电脑车都领先了。下次试试提前刹车、减少碰撞。';s.input={throttle:0,brake:0,steer:0};}
  else if(s.elapsedMs===limit(s.config)){s.phase='lost';s.lastEvent='timeout';s.notice='本轮时间到了。可以再试一次：过弯松油门，回到路面再加速。';s.input={throttle:0,brake:0,steer:0};}
 }
 return s;
}
function result(s){validate(s);if(s.phase==='playing')return null;return{status:s.phase,score:s.phase==='won'?Math.max(1,2500+(3-rank(s))*800+Math.floor((limit(s.config)-s.elapsedMs)/50)-s.collisions*25):Math.floor(s.distance/8),mealsUsed:s.mealsUsed,trackId:s.config.trackId,rank:rank(s),lapsCompleted:Math.floor(s.checkpoints/4),lapTimes:s.lapTimes.slice(),elapsedMs:s.elapsedMs,collisions:s.collisions,finished:s.checkpoints===8};}
const CSS=`.kart-game{position:relative;box-sizing:border-box;background:#eaf3ee;border:1px solid #c1d5ce;border-radius:20px;padding:16px;color:#173e4b;font:15px/1.5 system-ui,sans-serif}.kart-game *{box-sizing:border-box}.kart-game h2,.kart-game p{margin:0}.kart-game .kr-head{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:12px}.kart-game h2{font-size:25px}.kart-game .kr-kicker{font-size:11px;letter-spacing:.12em;color:#658378;font-weight:800}.kart-game .kr-track{font-size:13px;color:#526e70}.kart-game .kr-pill{background:#fff5d7;border:1px solid #ddca94;padding:7px 11px;border-radius:9px;white-space:nowrap;font-weight:750}.kart-game .kr-screen{position:relative;border-radius:14px;overflow:hidden;border:4px solid #314d57;background:#9fcacb;aspect-ratio:16/10}.kart-game canvas{display:block;width:100%;height:100%}.kart-game .kr-hud{position:absolute;left:10px;right:10px;top:10px;display:flex;gap:6px;justify-content:space-between;pointer-events:none}.kart-game .kr-hud span{background:#16323ddd;color:#fff;border:1px solid #ffffff30;border-radius:8px;padding:6px 9px;font-weight:750;font-size:13px;font-variant-numeric:tabular-nums}.kart-game .kr-turn{position:absolute;top:48px;bottom:auto;left:10px;background:#16323ddb;color:#fff;border-radius:8px;padding:5px 10px;font-size:12px}.kart-game .kr-overlay{position:absolute;inset:0;background:#163645c9;display:grid;place-items:center;padding:20px}.kart-game .kr-card{background:#fcfbf0;border:1px solid #d9d6ba;border-radius:15px;padding:18px;width:min(420px,100%);text-align:center;box-shadow:0 12px 38px #071d3155}.kart-game .kr-card strong{font-size:21px}.kart-game .kr-card p{margin:8px 0;font-size:13px}.kart-game button{font:inherit;min-width:48px;min-height:48px;border-radius:10px;padding:9px 12px;border:1px solid #b3ccbf;background:#fff;color:#173e4b;cursor:pointer;touch-action:none;user-select:none;-webkit-user-select:none}.kart-game button:focus-visible{outline:3px solid #d69036;outline-offset:2px}.kart-game button:disabled{opacity:.55;cursor:default}.kart-game .kr-primary{background:#087d70;border-color:#087d70;color:white;font-weight:800}.kart-game .kr-controls{display:grid;grid-template-columns:1fr 1fr 1.5fr 1fr;gap:8px;margin-top:12px}.kart-game .kr-controls button[aria-pressed=true]{background:#d1eadb;border-color:#338a69;box-shadow:inset 0 0 0 2px #72b79d}.kart-game .kr-controls .kr-primary[aria-pressed=true]{background:#087d70;color:#fff}.kart-game .kr-tools{display:flex;gap:10px;align-items:center;margin-top:10px}.kart-game .kr-tools button{font-size:13px;flex:none}.kart-game .kr-tools p{font-size:12px;color:#51726e}.kart-game .kr-notice{padding:10px 12px;margin-top:10px;border-left:4px solid #318d78;background:#fff;border-radius:6px;font-size:13px;min-height:42px}.kart-game .kr-help{font-size:12px;color:#5f7976;margin-top:8px}.kart-game .kr-progress{height:7px;background:#c9ddd0;margin-top:12px;border-radius:8px;overflow:hidden}.kart-game .kr-progress i{display:block;height:100%;background:#1b8772}.kart-game .kr-result{background:#fff7d7;border:1px solid #dfce8f;padding:13px;border-radius:10px;margin-top:12px}.kart-game .kr-result strong{font-size:18px}.kart-game .kr-result p{font-size:13px}.kart-game .kr-card p,.kart-game .kr-notice,.kart-game .kr-result p{color:#173e4b}.kart-game .kr-statusline{display:flex;justify-content:space-between;font-size:12px;color:#52726e;margin-top:5px}.kart-game [hidden]{display:none!important}@media(min-width:601px){.kart-game .kr-screen{width:100%;height:clamp(180px,calc(100dvh - 450px),420px);aspect-ratio:auto}}@media(max-width:600px){.kart-game{padding:9px;border-radius:13px}.kart-game h2{font-size:21px}.kart-game .kr-head{gap:6px}.kart-game .kr-pill{padding:5px 8px;font-size:12px}.kart-game .kr-screen{aspect-ratio:4/3}.kart-game .kr-hud{left:5px;right:5px;top:5px;gap:4px}.kart-game .kr-hud span{font-size:11px;padding:5px}.kart-game .kr-controls{gap:5px;grid-template-columns:1fr 1fr 1.35fr 1fr}.kart-game button{padding:8px 5px;font-size:14px}.kart-game .kr-tools{align-items:start}.kart-game .kr-card{padding:12px}.kart-game .kr-card p{font-size:12px}.kart-game .kr-help{line-height:1.7}}@media(orientation:landscape) and (max-height:500px) and (min-width:601px){.kart-game{display:grid;grid-template-columns:minmax(0,1fr) 214px;gap:6px;align-items:start;padding:8px;border-radius:12px}.kart-game .kr-head{grid-column:1/-1;padding:0;margin:0;border:0;background:none;min-width:0}.kart-game .kr-head>div{display:flex;align-items:center;gap:10px;min-width:0}.kart-game h2{font-size:18px;white-space:nowrap}.kart-game .kr-track{font-size:11px}.kart-game .kr-kicker,.kart-game .kr-pill{display:none}.kart-game .kr-screen{grid-column:1;grid-row:2/4;width:100%;height:170px;aspect-ratio:auto;border-width:3px}.kart-game .kr-controls{grid-column:2;grid-row:2;grid-template-columns:1fr 1fr;gap:6px;margin:0}.kart-game button{min-width:44px;min-height:44px;padding:6px;font-size:13px}.kart-game .kr-controls button{height:44px}.kart-game .kr-tools{grid-column:2;grid-row:3;flex-direction:column;gap:3px;margin:0;align-items:stretch}.kart-game .kr-tools button{height:44px}.kart-game .kr-tools p{font-size:11px;line-height:1.4}.kart-game .kr-hud{top:4px;left:4px;right:4px;gap:3px}.kart-game .kr-hud span{font-size:10px;padding:4px}.kart-game .kr-turn{top:32px;bottom:auto;left:5px;font-size:10px;padding:3px 6px}.kart-game .kr-overlay{padding:8px}.kart-game .kr-card{padding:8px;border-radius:10px}.kart-game .kr-card strong{font-size:16px}.kart-game .kr-card p{font-size:12px;margin:4px 0}.kart-game .kr-progress,.kart-game .kr-statusline,.kart-game .kr-notice,.kart-game .kr-help,.kart-game .kr-result{grid-column:1/-1;margin:0}.kart-game .kr-progress{height:4px}.kart-game .kr-statusline{font-size:11px}}@media(orientation:portrait) and (max-width:600px) and (max-height:600px){.kart-game .kr-kicker,.kart-game .kr-head h2,.kart-game .kr-pill{display:none}.kart-game .kr-head{margin-bottom:6px}.kart-game .kr-controls{margin-top:8px}.kart-game .kr-tools{margin-top:4px}}@media(prefers-reduced-motion:reduce){.kart-game *{scroll-behavior:auto!important;animation:none!important;transition:none!important}}`;
function mount(container,{state,onAction}){
 validate(state);assert(container&&typeof onAction==='function','赛车画面缺少宿主。');const doc=container.ownerDocument,win=doc.defaultView,root=doc.createElement('section');root.className='kart-game';root.dataset.testid='kart-game';root.tabIndex=0;root.setAttribute('aria-label',title);container.replaceChildren(root);
 let current=clone(state),previous=clone(state),visualAt=win.performance.now(),paused=false,disposed=false,neutralizing=false,interval=null,frame=null,gas=false,lastNotice='',keys=new Set(),holds=new Map();const taps=new Map(),lastTouch=new WeakMap(),reduced=win.matchMedia('(prefers-reduced-motion: reduce)');
 root.innerHTML=`<style>${CSS}</style><header class="kr-head"><div><div class="kr-kicker">LIANG · TWO LAP CHALLENGE</div><h2>${title}</h2><p class="kr-track" data-testid="kart-track"></p></div><span class="kr-pill">基础练习车</span></header><div class="kr-screen"><canvas data-testid="kart-canvas" aria-label="程序绘制的赛车示意画面"></canvas><div class="kr-hud"><span data-testid="kart-lap"></span><span data-testid="kart-rank"></span><span data-testid="kart-speed"></span><span data-testid="kart-clock"></span></div><span class="kr-turn" data-testid="kart-position"></span><div class="kr-overlay" data-testid="kart-overlay"><div class="kr-card"><strong data-testid="kart-ready-title">两圈小比赛</strong><p data-testid="kart-ready-copy">按油门起步，过弯调整方向。完成两圈，领先至少一辆电脑车。</p><button class="kr-primary" type="button" data-game-action="start">开始比赛</button></div></div></div><div class="kr-progress"><i data-testid="kart-progress"></i></div><div class="kr-statusline"><span data-testid="kart-checkpoints"></span><span>赛道示意 · 非真实路线</span></div><div class="kr-controls"><button type="button" data-game-action="left" aria-label="向左转">◀ 左转</button><button type="button" data-game-action="right" aria-label="向右转">右转 ▶</button><button type="button" class="kr-primary" data-game-action="throttle" aria-pressed="false">油门：关</button><button type="button" data-game-action="brake" aria-label="按住刹车">刹车</button></div><div class="kr-tools"><button type="button" data-game-action="use-meal">料理加速 · 5秒</button><p data-testid="kart-meal-status"></p></div><p class="kr-notice" data-testid="kart-notice" role="status" aria-live="polite"></p><p class="kr-help">触屏：点油门保持加速，按住左右转向或刹车。键盘：↑/W 油门，←/A、→/D 转向，↓/S 刹车；空格使用料理。</p><section class="kr-result" data-testid="kart-result" hidden></section>`;
 const find=test=>root.querySelector('[data-testid="'+test+'"]'),canvas=find('kart-canvas'),ctx=canvas.getContext('2d');
 const live=()=>!disposed&&!paused&&current.phase==='playing';
 function emit(action){if(live())onAction(action);}
 function controls(){const values=[...holds.values()],left=keys.has('ArrowLeft')||keys.has('KeyA')||values.includes('left'),right=keys.has('ArrowRight')||keys.has('KeyD')||values.includes('right');return{throttle:gas||keys.has('ArrowUp')||keys.has('KeyW')?1:0,brake:keys.has('ArrowDown')||keys.has('KeyS')||values.includes('brake')?1:0,steer:left===right?0:left?-1:1};}
 function syncInput(){if(!live()||!current.started)return;const input=controls();if(JSON.stringify(input)!==JSON.stringify(current.input))emit({type:'drive',...input});}
 // A host may permit this exact release even after its account timer expires.
 // It changes only controls, so a restored race cannot inherit held pedals.
 function notifyNeutral(){if(!neutralizing&&current.phase==='playing'&&current.started&&(current.input.throttle||current.input.brake||current.input.steer)){neutralizing=true;try{onAction({type:'drive',throttle:0,brake:0,steer:0});}finally{neutralizing=false;}}}
 function quad(points,color){ctx.fillStyle=color;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill();}
 function car(x,y,size,color,label){ctx.fillStyle='#16313d';ctx.fillRect(x-size*.47,y-size*.1,size*.22,size*.55);ctx.fillRect(x+size*.25,y-size*.1,size*.22,size*.55);ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x-size*.36,y-size*.48,size*.72,size*.94,size*.12);ctx.fill();ctx.fillStyle='#1e454b';ctx.fillRect(x-size*.24,y-size*.25,size*.48,size*.23);ctx.fillStyle='#e8f5ee';ctx.fillRect(x-size*.27,y+size*.27,size*.16,size*.08);ctx.fillRect(x+size*.11,y+size*.27,size*.16,size*.08);ctx.fillStyle='#fff5d4';ctx.font='bold '+Math.max(9,size*.19)+'px system-ui';ctx.textAlign='center';ctx.fillText(label,x,y+size*.19);}
 function draw(){
  if(disposed||!ctx)return;const width=canvas.clientWidth,height=canvas.clientHeight,dpr=Math.min(2,win.devicePixelRatio||1);if(canvas.width!==Math.round(width*dpr)||canvas.height!==Math.round(height*dpr)){canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);}ctx.setTransform(dpr,0,0,dpr,0,0);
  const mix=reduced.matches?1:clamp((win.performance.now()-visualAt)/100,0,1),distance=previous.distance+(current.distance-previous.distance)*mix,x=previous.x+(current.x-previous.x)*mix,t=TRACKS[current.config.trackId],horizon=height*.28;
  ctx.fillStyle=t.sky;ctx.fillRect(0,0,width,height);ctx.fillStyle=current.config.trackId==='north-south'?'#76a894':'#83b5a1';ctx.beginPath();ctx.moveTo(0,horizon+10);for(let i=0;i<=12;i++)ctx.lineTo(width*i/12,horizon-12-Math.sin(i*1.7)*18);ctx.lineTo(width,horizon+40);ctx.lineTo(0,horizon+40);ctx.fill();ctx.fillStyle=t.grass;ctx.fillRect(0,horizon,width,height-horizon);
  function projection(z){const p=1/(1+z/80),y=horizon+(height-horizon)*p,half=width*.44*p,bend=curve(current.config,distance+z)*width*.28*(1-p)*(1-p);return{y,half,center:width/2+bend,p};}
  for(let i=44;i>=0;i--){const z0=i*13,z1=(i+1)*13,a=projection(z0),b=projection(z1),stripe=Math.floor((distance+z0)/32)%2;quad([[a.center-a.half*1.14,a.y],[a.center+a.half*1.14,a.y],[b.center+b.half*1.14,b.y],[b.center-b.half*1.14,b.y]],stripe?'#eddbb5':'#bf7565');quad([[a.center-a.half,a.y],[a.center+a.half,a.y],[b.center+b.half,b.y],[b.center-b.half,b.y]],stripe?t.road:'#5d6c70');if(stripe)for(const lane of[-.34,.34])quad([[a.center+a.half*lane-1.6*a.p,a.y],[a.center+a.half*lane+1.6*a.p,a.y],[b.center+b.half*lane+1.6*b.p,b.y],[b.center+b.half*lane-1.6*b.p,b.y]],'#dae6d7');}
  const sprites=[];for(let lap=Math.floor(distance/t.length);lap<=Math.min(1,Math.floor(distance/t.length)+1);lap++)for(const item of obstacles(current.config)){const z=lap*t.length+item.z-distance;if(z>5&&z<540)sprites.push({z,kind:item.kind,x:item.x});}current.ai.forEach((a,i)=>{const z=a.distance-distance;if(z>8&&z<550)sprites.push({z,kind:'car',x:aiLane(current,i),i});});sprites.sort((a,b)=>b.z-a.z);
  for(const sprite of sprites){const p=projection(sprite.z),sx=p.center+sprite.x*p.half,sy=p.y,size=Math.max(7,p.p*width*.115);if(sprite.kind==='car')car(sx,sy,size,['#f4bc70','#94c3dc'][sprite.i],'AI '+(sprite.i+1));else if(sprite.kind==='crate'){ctx.fillStyle='#bf9365';ctx.fillRect(sx-size*.35,sy-size*.55,size*.7,size*.6);ctx.strokeStyle='#795f44';ctx.strokeRect(sx-size*.35,sy-size*.55,size*.7,size*.6);}else{quad([[sx,sy-size*.6],[sx-size*.3,sy],[sx+size*.3,sy]],'#ed9860');ctx.fillStyle='#fff1cd';ctx.fillRect(sx-size*.16,sy-size*.25,size*.32,size*.09);}}
  const nextGate=(current.checkpoints+1)*t.length/4,z=nextGate-distance;if(current.checkpoints<8&&z>0&&z<440){const p=projection(z);ctx.strokeStyle='#f8ebae';ctx.lineWidth=Math.max(2,p.p*5);ctx.beginPath();ctx.moveTo(p.center-p.half,p.y);ctx.lineTo(p.center-p.half,p.y-p.p*height*.2);ctx.lineTo(p.center+p.half,p.y-p.p*height*.2);ctx.lineTo(p.center+p.half,p.y);ctx.stroke();}
  if(current.config.trackId==='masai-market')for(let i=0;i<4;i++){const z=((i*160+620-distance%160)%620)+35,p=projection(z),side=i%2?-1:1,sx=p.center+side*p.half*1.52,size=width*.17*p.p;ctx.fillStyle='#d8cdb2';ctx.fillRect(sx-size/2,p.y-size*.65,size,size*.7);quad([[sx-size*.6,p.y-size*.65],[sx+size*.6,p.y-size*.65],[sx+size*.44,p.y-size*.95],[sx-size*.44,p.y-size*.95]],i%2?'#db9c78':'#79b2a4');}
  const playerSize=Math.min(width*.13,height*.32),playerX=clamp(width/2+x*width*.36,playerSize*.55,width-playerSize*.55);car(playerX,height*.82,playerSize,current.collisionMs?'#d2916c':'#46b6ad','YOU');if(current.boostMs){ctx.fillStyle='#f6ca68';ctx.fillRect(playerX-width*.025,height*.92,width*.015,height*.035);ctx.fillRect(playerX+width*.01,height*.92,width*.015,height*.035);}ctx.fillStyle='#17364170';ctx.fillRect(0,height-8,width,8);
 }
 function ui(){
  const t=TRACKS[current.config.trackId],playing=current.phase==='playing',remaining=Math.max(0,Math.ceil((limit(current.config)-current.elapsedMs)/1000));find('kart-track').textContent=t.name+' · 示意赛道 · '+['轻松','标准','挑战'][current.config.difficulty];find('kart-lap').textContent='圈 '+Math.min(2,Math.floor(current.checkpoints/4)+1)+'/2';find('kart-rank').textContent='第 '+rank(current)+' / 3';find('kart-speed').textContent='速度 '+Math.round(current.speed);find('kart-clock').textContent=Math.floor(remaining/60)+':'+String(remaining%60).padStart(2,'0');
  const position=find('kart-position'),bend=curve(current.config,current.distance);position.textContent=current.x< -1.04?'左侧草地 · 按右转回赛道 →':current.x>1.04?'右侧草地 · 按左转回赛道 ←':bend>.13?'右弯 · 提前控制方向':bend<-.13?'左弯 · 提前控制方向':'直道 · 保持路线';position.dataset.x=String(current.x);position.dataset.curve=String(bend);find('kart-progress').style.width=(current.distance/(t.length*2)*100)+'%';find('kart-checkpoints').textContent='检查点 '+current.checkpoints+' / 8';
  if(current.notice!==lastNotice){find('kart-notice').textContent=current.notice;lastNotice=current.notice;}find('kart-meal-status').textContent=current.boostMs?'加速剩余 '+Math.ceil(current.boostMs/1000)+' 秒':current.mealsUsed?'本局已使用 1 份料理':current.config.mealCharges?'可选：开动车辆后使用 1 份 Masai 料理':'未带料理：不影响基础通关';
  for(const button of root.querySelectorAll('[data-game-action]')){const action=button.dataset.gameAction;button.disabled=paused||!playing||action!=='start'&&!current.started||action==='use-meal'&&(current.mealsUsed>=current.config.mealCharges||current.speed<8||current.distance<=0);if(action==='throttle'){button.textContent=current.input.throttle?'油门：开':'油门：关';button.setAttribute('aria-pressed',String(!!current.input.throttle));}if(action==='left'||action==='right'||action==='brake')button.setAttribute('aria-pressed',String(action==='brake'?!!current.input.brake:current.input.steer===(action==='left'?-1:1)));}
  find('kart-overlay').hidden=!(paused||!current.started);find('kart-ready-title').textContent=paused?'比赛已暂停':'两圈小比赛';find('kart-ready-copy').textContent=paused?'时间与输入已停止。恢复后重新踩油门。':'按油门起步，过弯调整方向。完成两圈，领先至少一辆电脑车。';root.querySelector('[data-game-action=start]').hidden=paused;
  const out=result(current),box=find('kart-result');box.hidden=!out;if(out)box.innerHTML='<strong>'+(out.status==='won'?'完赛成功！':'再挑战一次')+'</strong><p>第 '+out.rank+' 名 · '+out.lapsCompleted+' 圈 · '+out.score+' 分。'+(out.mealsUsed?'本局实际使用了 1 份料理。':'本局没有消耗料理。')+'</p><p>点击上方“结算并返回棋盘”，保存本局成绩。</p>';
 }
 function animation(){if(disposed||paused)return;draw();if(!reduced.matches)frame=win.requestAnimationFrame(animation);}
 function scheduling(){win.clearInterval(interval);win.cancelAnimationFrame(frame);interval=null;frame=null;if(live()){interval=win.setInterval(()=>{if(current.started){syncInput();emit({type:'tick',dt:100});}},100);if(!reduced.matches)frame=win.requestAnimationFrame(animation);}draw();}
 function update(next){if(disposed)return;validate(next);const was=current.phase;previous=current;current=clone(next);visualAt=win.performance.now();ui();if(was!==current.phase){keys.clear();holds.clear();taps.clear();gas=false;scheduling();}else if(reduced.matches)draw();}
 function activate(button){if(!live()||!button||button.disabled||!root.contains(button))return;const action=button.dataset.gameAction;if(action==='start'){emit({type:'start'});root.focus({preventScroll:true});}else if(action==='throttle'){gas=!gas;syncInput();}else if(action==='use-meal')emit({type:'use-meal'});}
 // Secondary touch pointers need their own activation; some browsers omit click.
 // Keep release-inside semantics and ignore only the matching compatibility click.
 function inside(button,event){const r=button.getBoundingClientRect();return event.clientX>=r.left&&event.clientX<=r.right&&event.clientY>=r.top&&event.clientY<=r.bottom;}
 function click(event){const button=event.target.closest('[data-game-action]');if(!button)return;if(event.pointerType==='touch'||event.sourceCapabilities?.firesTouchEvents)return;if(event.detail!==0&&!event.pointerType&&!event.sourceCapabilities&&win.performance.now()-(lastTouch.get(button)??-Infinity)<700)return;activate(button);}
 function down(event){if(!live())return;const button=event.target.closest('[data-game-action]');if(!button||button.disabled)return;const action=button.dataset.gameAction;
  if(event.pointerType==='touch'&&['start','throttle','use-meal'].includes(action)){event.preventDefault();taps.set(event.pointerId,{button,cancelled:false});lastTouch.set(button,win.performance.now());try{button.setPointerCapture?.(event.pointerId);}catch{}return;}
  if(!current.started||!['left','right','brake'].includes(action))return;event.preventDefault();holds.set(event.pointerId,action);button.setPointerCapture?.(event.pointerId);syncInput();}
 function move(event){const tap=taps.get(event.pointerId);if(tap&&!inside(tap.button,event))tap.cancelled=true;}
 function up(event){const tap=taps.get(event.pointerId);if(tap){taps.delete(event.pointerId);lastTouch.set(tap.button,win.performance.now());if(event.type==='pointerup'&&!tap.cancelled&&inside(tap.button,event))activate(tap.button);}if(holds.delete(event.pointerId))syncInput();}
 function keydown(event){if(!live())return;if(!current.started){if(event.code==='Enter'){event.preventDefault();emit({type:'start'});}return;}if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyW','KeyS','KeyA','KeyD'].includes(event.code)){event.preventDefault();keys.add(event.code);syncInput();}else if(event.code==='Space'&&event.target===root){event.preventDefault();if(!event.repeat)emit({type:'use-meal'});}}
 function keyup(event){if(keys.delete(event.code)){event.preventDefault();syncInput();}}
 function release(){keys.clear();holds.clear();taps.clear();gas=false;syncInput();}
 const visibility=()=>{if(doc.hidden)release();},resize=()=>draw(),motion=()=>scheduling();root.addEventListener('click',click);root.addEventListener('pointerdown',down);doc.addEventListener('pointermove',move);doc.addEventListener('pointerup',up);doc.addEventListener('pointercancel',up);doc.addEventListener('lostpointercapture',up);root.addEventListener('keydown',keydown);doc.addEventListener('keyup',keyup);win.addEventListener('blur',release);doc.addEventListener('visibilitychange',visibility);win.addEventListener('resize',resize);reduced.addEventListener?.('change',motion);
 ui();scheduling();return{update,setPaused(value){if(disposed)return;paused=!!value;keys.clear();holds.clear();taps.clear();gas=false;try{if(paused)notifyNeutral();else syncInput();}finally{ui();scheduling();}},dispose(){if(disposed)return;disposed=true;try{notifyNeutral();}finally{win.clearInterval(interval);win.cancelAnimationFrame(frame);keys.clear();holds.clear();taps.clear();gas=false;root.removeEventListener('click',click);root.removeEventListener('pointerdown',down);doc.removeEventListener('pointermove',move);doc.removeEventListener('pointerup',up);doc.removeEventListener('pointercancel',up);doc.removeEventListener('lostpointercapture',up);root.removeEventListener('keydown',keydown);doc.removeEventListener('keyup',keyup);win.removeEventListener('blur',release);doc.removeEventListener('visibilitychange',visibility);win.removeEventListener('resize',resize);reduced.removeEventListener?.('change',motion);root.remove();}}};
}
return{id,version,title,create,step,validate,result,mount};
});


;
/* G03 basic chapter: labelled geometric actors; illustrative stages, no inventory writes. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else(root.LiangGames||(root.LiangGames={})).platform=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const id='platform',version=1,title='梁家三小瓜';
const PEOPLE={sister:{name:'梁姐姐',short:'姐姐',height:46,speed:235,jump:640,color:'#277f8c',skill:'高跳到机关'},brother:{name:'梁弟弟',short:'弟弟',height:44,speed:290,jump:500,color:'#c38336',skill:'冲刺撞开障碍'},little:{name:'梁妹妹',short:'妹妹',height:26,speed:220,jump:490,color:'#966099',skill:'钻过低矮通道'}};
const STAGES=[
 {name:'家',goal:'开饭前洗手',width:2060,ground:[[0,750],[870,1330],[1460,2060]],platform:{x:250,y:285,w:180,h:18},lever:{x:355,y:285},gate:{x:530,y:0,w:26,h:400},barrier:{x:1020,y:200,w:42,h:200},tunnel:{x:1580,y:0,w:230,h:368},checks:[60,920,1840],exit:1980,order:['lever','barrier','crawl'],sky:'#dcece8',floor:'#809889'},
 {name:'新廊华小',goal:'赶交作业',width:2250,ground:[[0,650],[760,1560],[1690,2250]],platform:{x:1240,y:282,w:190,h:18},lever:{x:1330,y:282},gate:{x:1470,y:0,w:26,h:400},barrier:{x:920,y:200,w:44,h:200},tunnel:{x:230,y:0,w:200,h:368},checks:[60,520,1800],exit:2160,order:['crawl','barrier','lever'],sky:'#dcebf3',floor:'#8a9eaf'},
 {name:'出门前战争',goal:'赶上车',width:2200,ground:[[0,770],[895,1400],[1520,2200]],platform:{x:260,y:280,w:185,h:18},lever:{x:355,y:280},gate:{x:535,y:0,w:26,h:400},barrier:{x:1080,y:205,w:44,h:195},tunnel:{x:1650,y:0,w:210,h:368},checks:[60,950,1960],exit:2100,order:['lever','barrier','crawl'],sky:'#f2e6cd',floor:'#a19a80'}
];
const clone=x=>JSON.parse(JSON.stringify(x)),check=(ok,message)=>{if(!ok)throw Error(message);},int=(n,a,b)=>Number.isSafeInteger(n)&&n>=a&&n<=b,num=(n,a,b)=>typeof n==='number'&&Number.isFinite(n)&&n>=a&&n<=b,clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),round=n=>Math.round(n*100000)/100000||0;
const maxHealth=config=>[5,4,3][config.difficulty],timeLimit=config=>[45000,36000,30000][config.difficulty];
function config(input={}){const c={seed:input.seed??1,difficulty:input.difficulty??0,mode:input.mode??'practice',mealCharges:input.mealCharges??0};check(int(c.seed,0,4294967295)&&int(c.difficulty,0,2)&&['practice','inventory'].includes(c.mode)&&int(c.mealCharges,0,1)&&!(c.mode==='practice'&&c.mealCharges),'横版配置无效；练习关不带共享料理。');return c;}
function create(input){const c=config(input);return{version,config:c,phase:'playing',started:false,level:0,levelStatus:'active',elapsedMs:0,levelElapsedMs:0,character:'sister',x:60,y:400,vy:0,grounded:true,direction:0,facing:1,dashMs:0,dashCooldownMs:0,idleMs:0,restlessMs:0,health:maxHealth(c),mealsUsed:0,mealRestored:0,checkpoint:0,flags:{lever:false,barrier:false,crawl:false},crawlEntered:false,completed:[],deaths:0,retries:0,jumps:0,switches:0,reading:false,notice:'先试试移动和跳跃。三个人的能力都用得到。',lastEvent:'ready'};}
const solids=s=>{const m=STAGES[s.level];return[...m.ground.map(([a,b])=>({x:a,y:400,w:b-a,h:110})),m.platform,m.tunnel,...(s.flags.lever?[]:[m.gate]),...(s.flags.barrier?[]:[m.barrier])];};
function overlaps(x,y,height,r){return x+12>r.x+.001&&x-12<r.x+r.w-.001&&y>r.y+.001&&y-height<r.y+r.h-.001;}
function validate(s){
 check(s&&s.version===1,'横版进度版本无效。');const c=config(s.config);check(JSON.stringify(c)===JSON.stringify(s.config),'横版配置不完整。');check(['playing','won','lost'].includes(s.phase)&&typeof s.started==='boolean'&&int(s.level,0,2)&&['active','retry'].includes(s.levelStatus),'横版阶段无效。');
 check(int(s.elapsedMs,0,1e9)&&int(s.levelElapsedMs,0,s.elapsedMs)&&Object.hasOwn(PEOPLE,s.character)&&num(s.x,12,STAGES[s.level].width-12)&&num(s.y,-200,600)&&num(s.vy,-700,1500)&&typeof s.grounded==='boolean','横版位置或计时无效。');
 check(int(s.direction,-1,1)&&[-1,1].includes(s.facing)&&int(s.dashMs,0,340)&&int(s.dashCooldownMs,0,1100)&&int(s.idleMs,0,3500)&&int(s.restlessMs,0,600),'横版操控无效。');
 check(int(s.health,0,maxHealth(c))&&int(s.mealsUsed,0,c.mealCharges)&&int(s.mealRestored,0,2)&&((s.mealsUsed===0&&s.mealRestored===0)||(s.mealsUsed===1&&s.mealRestored>=1)),'料理或体力记录无效。');
 check(int(s.checkpoint,0,2)&&s.flags&&['lever','barrier','crawl'].every(k=>typeof s.flags[k]==='boolean')&&typeof s.crawlEntered==='boolean'&&typeof s.reading==='boolean','机关记录无效。');
 check(Array.isArray(s.completed)&&s.completed.length===(s.phase==='won'?3:s.level)&&s.completed.every((r,i)=>r.level===i&&int(r.elapsedMs,1,s.elapsedMs)&&r.flags&&['lever','barrier','crawl'].every(k=>r.flags[k]===true)),'关卡必须依次实际完成。');
 check(['deaths','retries','jumps','switches'].every(k=>int(s[k],0,100000))&&typeof s.notice==='string'&&s.notice.length<=220&&typeof s.lastEvent==='string','横版操作记录无效。');
 if(!s.started)check(s.phase==='playing'&&s.level===0&&s.elapsedMs===0&&s.x===60&&s.health===maxHealth(c)&&s.mealsUsed===0&&!s.flags.lever&&!s.flags.barrier&&!s.flags.crawl,'尚未开始，不能提前完成。');
 if(s.phase==='won')check(s.started&&s.level===2&&s.grounded&&Math.abs(s.x-STAGES[2].exit)<=60&&s.flags.lever&&s.flags.barrier&&s.flags.crawl&&s.jumps>=3&&s.switches>=2&&s.health>0,'没有完成三关路线，不能获胜。');
 if(s.phase==='lost')check(s.started&&s.health===0,'体力尚有剩余，不能直接结束为失败。');
 if(s.phase==='playing')check(s.health>0,'体力耗尽的游戏不能继续。');return true;
}
function hurt(s,reason){s.health--;s.deaths++;s.x=STAGES[s.level].checks[s.checkpoint];s.y=400;s.vy=0;s.grounded=true;s.direction=0;s.dashMs=0;s.restlessMs=0;s.idleMs=0;s.reading=false;s.levelStatus='retry';s.lastEvent=reason;s.notice=reason==='timeout'?'没赶上这次车。可以从检查点再试，机关进度会保留。':'掉下去了。检查点和已完成机关都保留，准备好后再试。';if(!s.health){s.phase='lost';s.notice='本局体力用完了。返回后可以重新挑战，基础通关不需要料理。';}}
function step(state,action){
 validate(state);check(action&&typeof action.type==='string','横版动作无效。');const s=clone(state);if(s.phase!=='playing')return s;
 if(action.type==='move'){check(int(action.direction,-1,1),'方向必须是左、停或右。');if(action.direction===0){s.direction=0;return s;}if(s.started&&!s.reading&&s.levelStatus==='active'){s.direction=action.direction;s.facing=action.direction;s.idleMs=0;s.restlessMs=0;}return s;}
 if(action.type==='start'){if(!s.started){s.started=true;s.notice='姐姐跳到高台上，站稳后按“互动”打开机关。';s.lastEvent='started';}return s;}
 if(action.type==='hint'){check(typeof action.open==='boolean','提示状态无效。');if(s.started&&s.levelStatus==='active'){s.reading=action.open;s.direction=0;s.lastEvent=action.open?'reading':'reading-closed';}return s;}
 if(action.type==='retry'){if(s.levelStatus==='retry'){s.levelStatus='active';s.levelElapsedMs=0;s.retries++;s.notice='从检查点继续。已完成的机关不用重做。';s.lastEvent='retried';}return s;}
 if(!s.started||s.reading||s.levelStatus!=='active'){check(['jump','dash','switch','interact','use-meal','tick'].includes(action.type),'横版动作无效。');if(action.type==='tick')check(int(action.dt,1,250),'横版计时无效。');return s;}
 if(action.type==='switch'){check(Object.hasOwn(PEOPLE,action.character),'未确认的角色。');if(s.character===action.character)return s;const h=PEOPLE[action.character].height;if(solids(s).some(r=>overlaps(s.x,s.y,h,r))){s.notice='这里太矮了，先让妹妹走出通道再换人。';return s;}s.character=action.character;s.switches++;s.dashMs=0;s.idleMs=0;s.restlessMs=0;s.notice=PEOPLE[s.character].name+'：'+PEOPLE[s.character].skill+'。';s.lastEvent='switched';return s;}
 if(action.type==='jump'){if(s.grounded){s.vy=-PEOPLE[s.character].jump;s.grounded=false;s.jumps++;s.idleMs=0;s.restlessMs=0;s.lastEvent='jump';}return s;}
 if(action.type==='dash'){if(s.character==='brother'&&s.grounded&&s.dashCooldownMs===0){s.dashMs=340;s.dashCooldownMs=1100;s.idleMs=0;s.restlessMs=0;s.lastEvent='dash';s.notice='冲刺！碰到标记的障碍就能撞开。';}else s.notice='让弟弟站稳后冲刺；使用后需要短暂恢复。';return s;}
 if(action.type==='use-meal'){if(s.config.mealCharges>s.mealsUsed&&s.health<maxHealth(s.config)){const amount=Math.min(2,maxHealth(s.config)-s.health);s.health+=amount;s.mealsUsed=1;s.mealRestored=amount;s.notice='料理恢复了 '+amount+' 点体力。路线仍要自己完成。';s.lastEvent='meal';}else s.notice=s.health===maxHealth(s.config)?'体力是满的，不需要使用料理。':'本局没有可用料理，基础路线仍可通关。';return s;}
 if(action.type==='interact'){
  const m=STAGES[s.level];if(Math.abs(s.x-m.lever.x)<=55&&Math.abs(s.y-m.lever.y)<=5&&s.grounded){if(s.character==='sister'){s.flags.lever=true;s.notice='机关开了！可以继续前进。';s.lastEvent='lever';}else s.notice='换成姐姐来操作这个高台机关。';return s;}
  if(Math.abs(s.x-m.exit)<=55&&s.grounded){if(!Object.values(s.flags).every(Boolean)){s.notice='还有能力路线没完成。看看下方的三个进度标记。';return s;}s.completed.push({level:s.level,elapsedMs:s.levelElapsedMs,flags:clone(s.flags)});s.direction=0;s.dashMs=0;s.restlessMs=0;s.idleMs=0;if(s.level===2){s.phase='won';s.notice='赶上车了！三关完成，返回棋盘保存本局成绩。';s.lastEvent='won';}else{s.level++;s.levelElapsedMs=0;s.x=60;s.y=400;s.vy=0;s.grounded=true;s.character='sister';s.checkpoint=0;s.flags={lever:false,barrier:false,crawl:false};s.crawlEntered=false;s.dashCooldownMs=0;s.notice=s.level===1?'来到新廊华小。先换妹妹钻过前面的矮通道。':'最后一关：赶上车！注意右上角的本关时间。';s.lastEvent='next-level';}return s;}
  s.notice='站到高台机关或关底目标旁，再按互动。';return s;
 }
 check(action.type==='tick'&&int(action.dt,1,250),'横版计时或动作无效。');
 let remaining=action.dt;while(remaining>0&&s.phase==='playing'&&s.levelStatus==='active'){
  const dt=Math.min(20,remaining),seconds=dt/1000,m=STAGES[s.level],p=PEOPLE[s.character];remaining-=dt;s.elapsedMs+=dt;s.levelElapsedMs+=dt;s.dashCooldownMs=Math.max(0,s.dashCooldownMs-dt);
  if(s.character==='brother'&&!s.direction&&s.grounded&&!s.dashMs&&!s.restlessMs){s.idleMs=Math.min(3500,s.idleMs+dt);if(s.idleMs===3500){s.restlessMs=600;s.idleMs=0;s.notice='弟弟有点坐不住了！按方向或换人就能控制。';}}
  else if(s.direction||s.character!=='brother')s.idleMs=0;
  const moving=s.dashMs?s.facing:s.direction||(s.restlessMs?s.facing:0),speed=s.dashMs?520:p.speed;
  let nextX=clamp(s.x+moving*speed*seconds,12,m.width-12);
  if(s.dashMs&&s.character==='brother'&&!s.flags.barrier&&overlaps(nextX,s.y,p.height,m.barrier)){s.flags.barrier=true;s.notice='障碍撞开了！';s.lastEvent='barrier';}
  for(const r of solids(s))if(overlaps(nextX,s.y,p.height,r)){if(moving>0)nextX=Math.min(nextX,r.x-12);else if(moving<0)nextX=Math.max(nextX,r.x+r.w+12);}
  s.x=round(nextX);const oldY=s.y,oldTop=oldY-p.height;s.vy=round(Math.min(1500,s.vy+1350*seconds));let nextY=round(oldY+s.vy*seconds);s.grounded=false;
  for(const r of solids(s))if(s.x+12>r.x+.001&&s.x-12<r.x+r.w-.001){if(s.vy>=0&&oldY<=r.y+.001&&nextY>=r.y){nextY=Math.min(nextY,r.y);s.vy=0;s.grounded=true;}else if(s.vy<0&&oldTop>=r.y+r.h-.001&&nextY-p.height<r.y+r.h){nextY=r.y+r.h+p.height;s.vy=0;}}
  s.y=nextY;s.dashMs=Math.max(0,s.dashMs-dt);s.restlessMs=Math.max(0,s.restlessMs-dt);
  if(s.character==='little'&&s.grounded&&s.x>m.tunnel.x+20&&s.x<m.tunnel.x+m.tunnel.w)s.crawlEntered=true;
  if(s.character==='little'&&s.crawlEntered&&s.x>m.tunnel.x+m.tunnel.w+12&&s.grounded){s.flags.crawl=true;s.lastEvent='crawl';}
  if(s.grounded)for(let i=s.checkpoint+1;i<m.checks.length;i++)if(s.x>=m.checks[i]){s.checkpoint=i;s.notice='检查点已保存。跌落后可以从这里再试。';s.lastEvent='checkpoint';}
  if(s.y>560)hurt(s,'fall');else if(s.level===2&&s.levelElapsedMs>=timeLimit(s.config))hurt(s,'timeout');
 }
 return s;
}
function result(s){validate(s);if(s.phase==='playing')return null;return{status:s.phase,score:s.phase==='won'?Math.max(1,3000+s.health*200-s.deaths*80-Math.floor(s.elapsedMs/1000)):s.completed.length*600,mealsUsed:s.mealsUsed,mealRestored:s.mealRestored,levelsCompleted:s.completed.length,stageTimes:s.completed.map(r=>r.elapsedMs),deaths:s.deaths,retries:s.retries,elapsedMs:s.elapsedMs};}
function hint(s){const m=STAGES[s.level],next=m.order.find(k=>!s.flags[k]);if(s.levelStatus==='retry')return'准备好后点“从检查点再试”；已完成的机关保留。';if(next==='lever')return'姐姐跳得高：跳上带开关的高台，站稳后按“互动”。';if(next==='barrier')return'换弟弟：走近标记的障碍，朝它冲刺。地板缺口要跳过去。';if(next==='crawl')return'换妹妹：她能钻过低矮通道。离开通道后可再换人。';return'三个能力路线都完成了！前往“'+m.goal+'”标记，按互动。';}
const CSS=`.platform-game{box-sizing:border-box;background:#edf2e8;border:1px solid #bccbbe;border-radius:18px;color:#223e42;font:14px/1.5 system-ui,sans-serif;padding:14px}.platform-game *{box-sizing:border-box}.platform-game h2,.platform-game p{margin:0;color:#223e42}.platform-game button:hover:not(:disabled){background:#e1eddf;color:#223e42}.platform-game .pf-primary:hover:not(:disabled){background:#185e57;color:#fff}.platform-game h2{font-size:24px}.platform-game .pf-head{display:flex;gap:12px;justify-content:space-between;align-items:center;margin-bottom:10px}.platform-game .pf-kicker{font-size:10px;font-weight:800;letter-spacing:.12em;color:#63816b}.platform-game .pf-label{font-size:12px;color:#52706a}.platform-game .pf-hud{display:flex;gap:6px;flex-wrap:wrap;margin:8px 0}.platform-game .pf-hud span{background:#fff;border:1px solid #c8d4c5;border-radius:8px;padding:5px 9px;font-size:12px;font-weight:700}.platform-game .pf-screen{position:relative;overflow:hidden;border:3px solid #395b59;border-radius:12px;width:100%;height:min(408px,calc(100dvh - 462px));aspect-ratio:auto;min-height:180px;background:#dcece8}.platform-game canvas{display:block;width:100%;height:100%}.platform-game .pf-overlay{position:absolute;inset:0;background:#213e49ce;display:grid;place-items:center;padding:14px}.platform-game .pf-card{background:#fffcee;border-radius:14px;border:1px solid #d0d2b7;padding:16px;text-align:center;max-width:420px;max-height:100%;overflow:auto}.platform-game .pf-card strong{font-size:20px}.platform-game .pf-card p{font-size:13px;margin:8px 0}.platform-game button{font:inherit;min-width:48px;min-height:48px;touch-action:none;user-select:none;-webkit-user-select:none;border:1px solid #bac9b8;border-radius:10px;padding:8px 12px;background:#fff;color:#233f40;cursor:pointer}.platform-game button:focus-visible{outline:3px solid #d9994a;outline-offset:2px}.platform-game button:disabled{opacity:.45;cursor:default}.platform-game .pf-primary{background:#21766d;border-color:#21766d;color:white;font-weight:750}.platform-game button[aria-pressed=true]{box-shadow:inset 0 0 0 2px #419785;background:#d5e9d9}.platform-game .pf-controls{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-top:9px}.platform-game .pf-people{display:grid;grid-template-columns:repeat(3,1fr) 1.4fr;gap:7px;margin-top:9px}.platform-game .pf-people button{font-size:13px;padding:7px}.platform-game .pf-tools{display:flex;gap:8px;align-items:center;margin-top:8px}.platform-game .pf-tools button{font-size:12px}.platform-game .pf-meter{font-size:11px;color:#826027;flex:1}.platform-game .pf-progress{display:flex;justify-content:space-between;gap:6px;font-size:12px;margin-top:9px}.platform-game .pf-progress span{background:#dde8d8;border-radius:5px;padding:4px 7px}.platform-game .pf-hint{background:#fff;border-left:4px solid #5c9980;padding:9px 10px;margin-top:8px;font-size:13px;border-radius:5px}.platform-game .pf-notice{font-size:12px;color:#536e65;margin-top:7px;min-height:20px}.platform-game .pf-help{font-size:11px;color:#627c70;margin-top:7px}.platform-game .pf-result{padding:12px;background:#fff2cf;border:1px solid #dcc68b;border-radius:10px;margin-top:10px}.platform-game [hidden]{display:none!important}@media(max-width:600px){.platform-game{padding:8px}.platform-game h2{font-size:20px}.platform-game .pf-screen{height:auto;max-height:none;aspect-ratio:4/3}.platform-game button{padding:6px 5px}.platform-game .pf-people,.platform-game .pf-controls{gap:4px}.platform-game .pf-people{grid-template-columns:repeat(3,1fr) 1.2fr}.platform-game .pf-hud{gap:4px}.platform-game .pf-hud span{padding:4px 6px;font-size:11px}.platform-game .pf-progress{font-size:11px}.platform-game .pf-progress span{padding:4px}.platform-game .pf-card{padding:11px}.platform-game .pf-card strong{font-size:17px}.platform-game .pf-card p{font-size:12px}}@media(orientation:landscape) and (max-height:500px) and (min-width:600px){.platform-game{display:grid;grid-template-columns:minmax(0,1fr) minmax(280px,42%);grid-template-rows:24px 48px 48px 44px 22px;gap:4px 8px;padding:6px}.platform-game .pf-head{display:none}.platform-game .pf-screen{grid-column:1;grid-row:1/6;height:100%;min-height:0;aspect-ratio:auto}.platform-game .pf-hud{grid-column:2;grid-row:1;flex-wrap:nowrap;gap:3px;margin:0;overflow:hidden}.platform-game .pf-hud span{font-size:10px;padding:2px 4px;white-space:nowrap}.platform-game [data-testid=platform-person]{display:none}.platform-game .pf-controls{grid-column:2;grid-row:2}.platform-game .pf-people{grid-column:2;grid-row:3}.platform-game .pf-controls,.platform-game .pf-people{margin:0;gap:4px}.platform-game .pf-controls button,.platform-game .pf-people button{font-size:11px;padding:3px;min-width:44px;min-height:44px}.platform-game .pf-tools{grid-column:2;grid-row:4;margin:0;gap:4px}.platform-game .pf-tools button{font-size:11px;min-height:44px;padding:4px 8px}.platform-game .pf-meter{font-size:10px;line-height:1.2}.platform-game .pf-progress{grid-column:2;grid-row:5;margin:0;font-size:10px;gap:3px}.platform-game .pf-progress span{padding:2px 3px}.platform-game .pf-card{padding:8px}.platform-game .pf-card strong{font-size:16px}.platform-game .pf-card p{font-size:11px;margin:4px 0}.platform-game .pf-card button{min-height:44px;padding:5px 8px}.platform-game .pf-hint,.platform-game .pf-notice,.platform-game .pf-help,.platform-game .pf-result{grid-column:1/-1;margin-top:4px}}.platform-game .pf-person-button{display:flex;align-items:center;justify-content:center;gap:5px}.platform-game .pf-person-button img{width:25px;height:42px;object-fit:contain;flex:none}.platform-game .pf-role-copy{display:block;text-align:left;line-height:1.2;font-weight:750}.platform-game .pf-role-copy small{display:block;font-size:10px;font-weight:500;margin-top:3px}.platform-game .pf-cast{display:flex;align-items:end;justify-content:center;gap:20px;margin:8px 0}.platform-game .pf-cast figure{margin:0;width:70px}.platform-game .pf-cast img{display:block;object-fit:contain;width:100%;height:76px}.platform-game .pf-cast figcaption{font-size:11px;font-weight:750;margin-top:3px}.platform-game .pf-art-status{font-size:11px;color:#79532b;margin-top:6px}.platform-game .pf-person-button[aria-pressed=true]{border-color:#287968;background:#d8ecdd}.platform-game canvas{image-rendering:auto}@media(max-width:600px){.platform-game .pf-person-button{gap:3px}.platform-game .pf-person-button img{width:21px;height:36px}.platform-game .pf-role-copy{font-size:11px}.platform-game .pf-cast{gap:12px;margin:5px 0}.platform-game .pf-cast img{height:61px}.platform-game .pf-cast figcaption{font-size:10px}.platform-game .pf-card p{margin:5px 0}}@media(orientation:landscape) and (max-height:500px) and (min-width:600px){.platform-game .pf-person-button img{width:18px;height:36px}.platform-game .pf-person-button{gap:2px}.platform-game .pf-role-copy{font-size:10px}.platform-game .pf-role-copy small{font-size:9px;margin-top:2px}.platform-game .pf-cast{gap:12px;margin:3px 0}.platform-game .pf-cast img{height:44px}.platform-game .pf-cast figcaption{font-size:10px;margin-top:1px}.platform-game .pf-art-status{grid-column:1/-1}.platform-game .pf-card p{font-size:10px;line-height:1.35}.platform-game .pf-overlay{padding:7px}}@media(orientation:portrait) and (max-width:600px) and (max-height:740px){.platform-game .pf-head{justify-content:flex-end;margin:0 0 3px;min-height:17px}.platform-game .pf-head>div{display:none}.platform-game .pf-head>span{font-size:11px}.platform-game .pf-hud{margin:3px 0 6px}.platform-game .pf-screen{height:clamp(174px,calc(100dvh - 430px),245px);min-height:174px;aspect-ratio:auto}.platform-game .pf-person-button img{height:32px}.platform-game .pf-cast img{height:49px}.platform-game .pf-card{padding:8px}.platform-game .pf-card p{font-size:11px;line-height:1.3;margin:4px 0}.platform-game .pf-card strong{font-size:15px}.platform-game .pf-overlay{padding:7px}}@media(orientation:portrait) and (max-width:600px) and (max-height:600px){.platform-game .pf-controls,.platform-game .pf-people{margin-top:3px}.platform-game .pf-tools{margin-top:3px}.platform-game .pf-controls button,.platform-game .pf-tools button{min-height:44px;height:44px}.platform-game .pf-people button{min-height:44px;padding:5px}.platform-game .pf-cast{display:none}.platform-game .pf-hud span{padding-left:4px;padding-right:4px}}@media(prefers-reduced-motion:reduce){.platform-game *{animation:none!important;transition:none!important}}`;
function mount(container,{state,onAction}){
 validate(state);check(container&&typeof onAction==='function','横版画面缺少宿主。');const doc=container.ownerDocument,win=doc.defaultView,root=doc.createElement('section');root.className='platform-game';root.dataset.testid='platform-game';root.tabIndex=0;root.setAttribute('aria-label',title);container.replaceChildren(root);
 let current=clone(state),previous=clone(state),updatedAt=win.performance.now(),paused=false,disposed=false,neutralizing=false,interval=null,frame=null,lastNotice='',keys=new Set(),holds=new Map(),touchButtons=new Map(),lastTouch=null;const reduced=win.matchMedia('(prefers-reduced-motion: reduce)');
 root.innerHTML=`<style>${CSS}</style><header class="pf-head"><div><div class="pf-kicker">LIANG · THREE LITTLE ADVENTURERS</div><h2>${title}</h2><p class="pf-label">三小瓜合作闯关 · 场景为玩法示意</p></div><span data-testid="platform-level"></span></header><div class="pf-hud"><span data-testid="platform-health"></span><span data-testid="platform-person"></span><span data-testid="platform-checkpoint"></span><span data-testid="platform-clock"></span></div><div class="pf-screen"><canvas data-testid="platform-canvas" aria-label="横版关卡示意画面"></canvas><div class="pf-overlay" data-testid="platform-overlay"><div class="pf-card"><strong data-testid="platform-overlay-title"></strong><div class="pf-cast" data-testid="platform-cast"><figure><img data-character-art="sister" alt="梁姐姐" draggable="false"><figcaption>梁姐姐</figcaption></figure><figure><img data-character-art="brother" alt="梁弟弟" draggable="false"><figcaption>梁弟弟</figcaption></figure><figure><img data-character-art="little" alt="梁妹妹" draggable="false"><figcaption>梁妹妹</figcaption></figure></div><p data-testid="platform-overlay-copy"></p><button class="pf-primary" data-game-action="start">开始冒险</button><button class="pf-primary" data-game-action="retry" hidden>从检查点再试</button><button data-game-action="hint-close" hidden>读好了，继续</button></div></div></div><div class="pf-progress"><span data-testid="platform-lever"></span><span data-testid="platform-barrier"></span><span data-testid="platform-crawl"></span></div><div class="pf-controls"><button data-game-action="left" aria-label="向左移动">◀ 左移</button><button data-game-action="right" aria-label="向右移动">右移 ▶</button><button class="pf-primary" data-game-action="jump">跳跃 ↑</button><button data-game-action="dash">弟弟冲刺</button></div><div class="pf-people"><button class="pf-person-button" data-game-action="sister" aria-label="梁姐姐 · 高跳"><img data-character-art="sister" alt="" draggable="false"><span class="pf-role-copy">姐姐<small>高跳</small></span></button><button class="pf-person-button" data-game-action="brother" aria-label="梁弟弟 · 冲刺"><img data-character-art="brother" alt="" draggable="false"><span class="pf-role-copy">弟弟<small>冲刺</small></span></button><button class="pf-person-button" data-game-action="little" aria-label="梁妹妹 · 钻缝"><img data-character-art="little" alt="" draggable="false"><span class="pf-role-copy">妹妹<small>钻缝</small></span></button><button class="pf-primary" data-game-action="interact">互动 E</button></div><div class="pf-tools"><button data-game-action="use-meal">料理回血</button><button data-game-action="hint">阅读提示</button><span class="pf-meter" data-testid="platform-restless"></span></div><p class="pf-hint" data-testid="platform-hint"></p><p class="pf-notice" data-testid="platform-notice" role="status" aria-live="polite"></p><p class="pf-help">←/→ 或 A/D 移动 · 空格跳跃 · X冲刺 · 1/2/3换人 · E互动 · H提示。触屏按住方向，点其他按钮。</p><p class="pf-art-status" data-testid="platform-character-art" role="status" hidden></p><section class="pf-result" data-testid="platform-result" hidden></section>`;
 const find=test=>root.querySelector('[data-testid="'+test+'"]'),canvas=find('platform-canvas'),ctx=canvas.getContext('2d'),live=()=>!disposed&&!paused&&current.phase==='playing',active=()=>live()&&current.started&&!current.reading&&current.levelStatus==='active';

 // Existing source PNGs are decoded once per mounted view. Game state and
 // collision boxes remain independent from image availability.
 const artwork=new Map(),artSource=win.LiangCharacterArt?.characters||{};
 function artStatus(){
  if(disposed)return;const state=artwork.get(current.character)?.state||'missing';
  canvas.dataset.character=current.character;canvas.dataset.artworkState=state;
  const message=find('platform-character-art');message.hidden=!['error','missing'].includes(state);
  message.textContent=message.hidden?'':'人物图暂时未显示；角色能力仍可使用。';
 }
 for(const key of Object.keys(PEOPLE)){
  const supplied=artSource[key],record={image:null,state:'missing'};artwork.set(key,record);
  if(!supplied||typeof supplied.src!=='string'||!supplied.src.startsWith('data:image/png;base64,'))continue;
  const image=new win.Image();record.image=image;record.state='loading';
  image.onload=()=>{if(disposed)return;record.state=image.naturalWidth>0&&image.naturalHeight>0?'ready':'error';artStatus();draw();};
  image.onerror=()=>{if(disposed)return;record.state='error';for(const node of root.querySelectorAll('[data-character-art="'+key+'"]'))node.hidden=true;artStatus();draw();};
  for(const node of root.querySelectorAll('[data-character-art="'+key+'"]'))node.src=supplied.src;
  image.src=supplied.src;
 }
 function emit(action){if(live())onAction(action);}
 function controls(){const values=[...holds.values()],left=keys.has('ArrowLeft')||keys.has('KeyA')||values.includes(-1),right=keys.has('ArrowRight')||keys.has('KeyD')||values.includes(1);return left===right?0:left?-1:1;}
 function sync(){if(active()){const direction=controls();if(direction!==current.direction)emit({type:'move',direction});}}
 function neutral(){if(!neutralizing&&current.phase==='playing'&&current.direction){neutralizing=true;try{onAction({type:'move',direction:0});}finally{neutralizing=false;}}}
 function clear(){keys.clear();holds.clear();touchButtons.clear();}

 function draw(){
  if(disposed||!ctx)return;
  const w=canvas.clientWidth,h=canvas.clientHeight,dpr=Math.min(2,win.devicePixelRatio||1);
  if(!w||!h)return;
  if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
  const m=STAGES[current.level],p=PEOPLE[current.character],scale=h/360,view=w/scale;
  const mix=reduced.matches||previous.level!==current.level?1:clamp((win.performance.now()-updatedAt)/50,0,1);
  const x=previous.x+(current.x-previous.x)*mix,y=previous.y+(current.y-previous.y)*mix;
  const top=clamp(Math.min(85,y-p.height-38),-160,85),cam=clamp(x-view*.32,0,Math.max(0,m.width-view));
  canvas.dataset.viewTop=String(top);canvas.dataset.viewWidth=String(view);
  const palette=[
   {wall:'#f1e4c9',light:'#fff8e7',trim:'#bc9a71',floor:'#688b7a',tile:'#a7bd9d',accent:'#b2674e'},
   {wall:'#dbe8ec',light:'#f4f3de',trim:'#77969b',floor:'#688897',tile:'#b5c9cf',accent:'#456f8b'},
   {wall:'#eddbc5',light:'#fff1d6',trim:'#b19878',floor:'#8e8d6c',tile:'#c9c99f',accent:'#487b76'}
  ][current.level];
  const sky=ctx.createLinearGradient(0,0,0,h);sky.addColorStop(0,palette.light);sky.addColorStop(1,palette.wall);
  ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);
  ctx.save();ctx.scale(scale,scale);ctx.translate(0,-top);
  // Decorative home, classroom corridor and departure hall. No real floor plan
  // or extra platform geometry is inferred from these illustrative backdrops.
  ctx.fillStyle=palette.trim;ctx.globalAlpha=.2;ctx.fillRect(0,312,view,90);ctx.globalAlpha=1;
  ctx.fillStyle=palette.trim;ctx.fillRect(0,310,view,5);ctx.fillStyle=palette.light;ctx.fillRect(0,305,view,3);
  for(let i=-1;i<Math.ceil(view/245)+2;i++){
   const bx=i*245-(cam*.25%245);
   ctx.fillStyle=palette.trim;ctx.fillRect(bx+25,130,154,130);
   ctx.fillStyle=current.level===1?'#bad4d9':'#c5dbd2';ctx.fillRect(bx+31,136,142,118);
   ctx.fillStyle='#f7f3d6';ctx.fillRect(bx+98,136,5,118);ctx.fillRect(bx+31,190,142,5);
   ctx.fillStyle='#ffffff5c';ctx.beginPath();ctx.moveTo(bx+33,138);ctx.lineTo(bx+87,138);ctx.lineTo(bx+33,185);ctx.fill();
   if(current.level===0){ctx.fillStyle='#c9ad85';ctx.fillRect(bx+12,121,180,10);ctx.fillStyle='#c0816c';ctx.fillRect(bx+17,130,11,125);ctx.fillRect(bx+177,130,11,125);}
   if(current.level===1){ctx.fillStyle='#486963';ctx.fillRect(bx+47,272,110,26);ctx.fillStyle='#f1edca';ctx.font='bold 13px system-ui';ctx.textAlign='center';ctx.fillText('一起学习',bx+102,290);}
   if(current.level===2){ctx.fillStyle='#b79267';ctx.fillRect(bx+199,239,26,65);ctx.fillStyle='#e5c35d';ctx.beginPath();ctx.arc(bx+212,232,18,0,Math.PI*2);ctx.fill();}
  }
  ctx.translate(-cam,0);
  // Ground edges match the authoritative collision intervals exactly.
  for(const[a,b]of m.ground){
   ctx.fillStyle='#314c50';ctx.fillRect(a,400,b-a,100);ctx.fillStyle=palette.floor;ctx.fillRect(a,400,b-a,52);
   ctx.fillStyle=palette.tile;ctx.fillRect(a,400,b-a,9);ctx.strokeStyle='#ffffff26';ctx.lineWidth=1;
   for(let n=a;n<b;n+=45){ctx.beginPath();ctx.moveTo(n,412);ctx.lineTo(Math.min(n+18,b),451);ctx.stroke();}
   for(const edge of [a,b]){ctx.fillStyle='#e0bb69';ctx.fillRect(edge===a?edge:edge-7,400,7,17);}
  }
  // Visible drop zones remain empty; a distant patterned wall is never ground.
  for(let i=0;i<m.ground.length-1;i++){
   const a=m.ground[i][1],b=m.ground[i+1][0];ctx.fillStyle='#3a5960';ctx.fillRect(a,417,b-a,80);
   ctx.fillStyle='#fff1ba';ctx.font='bold 15px system-ui';ctx.textAlign='center';ctx.fillText('跳过去',(a+b)/2,441);
  }
  ctx.fillStyle='#456e65';ctx.fillRect(m.platform.x,m.platform.y,m.platform.w,m.platform.h);
  ctx.fillStyle='#c6ddae';ctx.fillRect(m.platform.x,m.platform.y,m.platform.w,5);
  ctx.fillStyle='#769383';ctx.fillRect(m.platform.x+20,m.platform.y+18,9,400-m.platform.y-18);ctx.fillRect(m.platform.x+m.platform.w-29,m.platform.y+18,9,400-m.platform.y-18);
  if(!current.flags.lever){
   ctx.fillStyle='#74948c';ctx.fillRect(m.gate.x,0,m.gate.w,400);
   ctx.fillStyle='#315850';ctx.fillRect(m.gate.x+3,0,4,400);ctx.fillRect(m.gate.x+m.gate.w-7,0,4,400);
   ctx.fillStyle='#d1d5a8';for(let gy=100;gy<400;gy+=28)ctx.fillRect(m.gate.x+7,gy,m.gate.w-14,5);
  }
  ctx.fillStyle=current.flags.lever?'#488c69':'#d59b41';ctx.beginPath();ctx.roundRect(m.lever.x-15,m.lever.y-28,30,28,5);ctx.fill();
  ctx.strokeStyle='#f8edb5';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(m.lever.x,m.lever.y-7);ctx.lineTo(m.lever.x+(current.flags.lever?8:-8),m.lever.y-22);ctx.stroke();
  ctx.font='bold 16px system-ui';ctx.textAlign='center';
  function sign(text,sx,sy,color='#31574f'){
   const width=ctx.measureText(text).width+18;ctx.fillStyle='#fffbea';ctx.beginPath();ctx.roundRect(sx-width/2,sy-18,width,25,6);ctx.fill();ctx.strokeStyle='#b2bd9e';ctx.lineWidth=1;ctx.stroke();ctx.fillStyle=color;ctx.fillText(text,sx,sy);
  }
  sign(current.flags.lever?'✓ 机关已打开':'姐姐 · 高跳后互动',m.lever.x,m.lever.y-46);
  if(!current.flags.barrier){
   ctx.fillStyle='#b57e48';ctx.fillRect(m.barrier.x,m.barrier.y,m.barrier.w,m.barrier.h);
   ctx.strokeStyle='#e4bc7a';ctx.lineWidth=3;
   for(let by=m.barrier.y+7;by<400;by+=31){ctx.strokeRect(m.barrier.x+3,by,m.barrier.w-6,26);ctx.beginPath();ctx.moveTo(m.barrier.x+5,by+3);ctx.lineTo(m.barrier.x+m.barrier.w-5,Math.min(by+23,399));ctx.stroke();}
   sign('弟弟 · 冲刺',m.barrier.x+m.barrier.w/2,m.barrier.y-15,'#804d27');
  }else{ctx.fillStyle='#c69760';ctx.fillRect(m.barrier.x,394,m.barrier.w,6);}
  // The gap stays exactly 32 world units; do not draw an apparent extra floor.
  ctx.fillStyle='#92a494';ctx.fillRect(m.tunnel.x,0,m.tunnel.w,m.tunnel.h);
  ctx.strokeStyle='#637e70';ctx.lineWidth=3;
  for(let ty=105;ty<330;ty+=70){ctx.strokeRect(m.tunnel.x+9,ty,m.tunnel.w-18,58);ctx.fillStyle='#d5d8b4';ctx.fillRect(m.tunnel.x+m.tunnel.w/2-11,ty+24,22,5);}
  ctx.fillStyle='#c9dcb7';ctx.fillRect(m.tunnel.x,340,m.tunnel.w,28);ctx.fillStyle='#284a47';ctx.fillRect(m.tunnel.x,368,m.tunnel.w,32);
  sign('妹妹 · 钻过矮通道',m.tunnel.x+m.tunnel.w/2,325);
  ctx.strokeStyle='#d8efbb';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(m.tunnel.x+12,384);ctx.lineTo(m.tunnel.x+m.tunnel.w-12,384);ctx.stroke();
  for(let i=1;i<m.checks.length;i++){
   ctx.strokeStyle='#466a5e';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(m.checks[i],400);ctx.lineTo(m.checks[i],325);ctx.stroke();
   ctx.fillStyle=i<=current.checkpoint?'#3b956e':'#d4dfbb';ctx.beginPath();ctx.moveTo(m.checks[i],325);ctx.lineTo(m.checks[i]+31,337);ctx.lineTo(m.checks[i],350);ctx.fill();
   ctx.fillStyle='#284f48';ctx.font='bold 13px system-ui';ctx.fillText(i<=current.checkpoint?'✓':String(i),m.checks[i]+11,341);
  }
  ctx.font='bold 16px system-ui';sign(m.goal+' · 互动',m.exit,316);
  ctx.fillStyle='#f7efd8';ctx.beginPath();ctx.roundRect(m.exit-43,336,86,64,8);ctx.fill();ctx.strokeStyle=palette.trim;ctx.stroke();
  if(current.level===0){ctx.fillStyle='#c2d8d5';ctx.fillRect(m.exit-32,359,64,15);ctx.strokeStyle='#64898a';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(m.exit,359);ctx.lineTo(m.exit,342);ctx.lineTo(m.exit+11,342);ctx.stroke();}
  if(current.level===1){ctx.fillStyle='#b57f53';ctx.fillRect(m.exit-31,366,62,11);ctx.fillRect(m.exit-25,377,6,23);ctx.fillRect(m.exit+19,377,6,23);ctx.fillStyle='#f3f2df';ctx.fillRect(m.exit-17,349,35,17);ctx.strokeStyle='#5b8290';ctx.lineWidth=2;ctx.strokeRect(m.exit-17,349,35,17);}
  if(current.level===2){ctx.fillStyle='#438383';ctx.beginPath();ctx.roundRect(m.exit-48,344,96,44,9);ctx.fill();ctx.fillStyle='#d9eada';ctx.fillRect(m.exit-29,351,50,15);ctx.fillStyle='#2c4549';ctx.beginPath();ctx.arc(m.exit-26,391,10,0,Math.PI*2);ctx.arc(m.exit+29,391,10,0,Math.PI*2);ctx.fill();}
  const portrait=artwork.get(current.character);
  ctx.fillStyle='#243d4433';ctx.beginPath();ctx.ellipse(x,y+1,15,4,0,0,Math.PI*2);ctx.fill();
  if(portrait?.state==='ready'){
   const image=portrait.image,dh=p.height,dw=dh*image.naturalWidth/image.naturalHeight;
   ctx.save();ctx.translate(x,y);if(current.facing<0)ctx.scale(-1,1);ctx.imageSmoothingEnabled=true;ctx.drawImage(image,-dw/2,-dh,dw,dh);ctx.restore();
  }else{
   ctx.fillStyle=p.color;ctx.beginPath();ctx.roundRect(x-12,y-p.height,24,p.height,6);ctx.fill();ctx.fillStyle='#fff';ctx.font='bold 13px system-ui';ctx.fillText(p.short[0],x,y-p.height/2+4);
  }
  if(current.dashMs){ctx.strokeStyle='#d29b40';ctx.lineWidth=3;for(let i=0;i<3;i++){const tx=x-current.facing*(20+i*8);ctx.beginPath();ctx.moveTo(tx,y-p.height+8+i*8);ctx.lineTo(tx-current.facing*12,y-p.height+8+i*8);ctx.stroke();}}
  ctx.font='bold 14px system-ui';sign(p.name,x,y-p.height-10);
  ctx.restore();artStatus();
 }
 function ui(){
  const m=STAGES[current.level],p=PEOPLE[current.character],out=result(current);find('platform-level').textContent=(current.level+1)+'/3 · '+m.name;find('platform-health').textContent='体力 '+current.health+'/'+maxHealth(current.config);find('platform-person').textContent=p.name;find('platform-checkpoint').textContent='检查点 '+current.checkpoint+'/2';find('platform-clock').textContent=current.level===2?'赶上车 '+Math.max(0,Math.ceil((timeLimit(current.config)-current.levelElapsedMs)/1000))+'秒':'探索 · 不限关卡时间';
  for(const k of ['lever','barrier','crawl'])find('platform-'+k).textContent=(current.flags[k]?'✓ ':'○ ')+({lever:'姐姐机关',barrier:'弟弟破障',crawl:'妹妹钻缝'}[k]);find('platform-hint').textContent=out?(out.status==='won'?'通关了！点击“结算并返回棋盘”保存本局成果。':'本局结束。点击“结算并返回棋盘”保存成绩，再来挑战。'):hint(current);find('platform-restless').textContent=current.character==='brother'?'坐不住 '+Math.round(current.idleMs/3500*100)+'%':current.mealsUsed?'本局已用料理':'料理可选，不是必需';
  if(lastNotice!==current.notice){find('platform-notice').textContent=current.notice;lastNotice=current.notice;}const overlay=find('platform-overlay');overlay.hidden=!(paused||!current.started||current.reading||current.levelStatus==='retry'&&current.phase==='playing');find('platform-overlay-title').textContent=paused?'游戏已暂停':!current.started?'三个人，一起过三关':current.reading?'观察一下再出发':'从检查点继续';find('platform-cast').hidden=current.started;find('platform-overlay-copy').textContent=paused?'计时与输入已停止，恢复后重新按方向。':!current.started?'姐姐高跳、弟弟冲刺、妹妹钻缝。合作过关，掉落可从检查点继续。':current.reading?hint(current)+' 阅读时弟弟的坐不住计量和关卡挑战计时暂停。':current.notice;
  for(const button of root.querySelectorAll('[data-game-action]')){const a=button.dataset.gameAction;if(['start','retry','hint-close'].includes(a)){button.hidden=a==='start'?current.started||paused:a==='retry'?current.levelStatus!=='retry'||paused:!current.reading||paused;button.disabled=!live();continue;}button.disabled=!active()||(a==='dash'&&(current.character!=='brother'||!current.grounded||current.dashCooldownMs>0))||(a==='use-meal'&&(current.mealsUsed>=current.config.mealCharges||current.health===maxHealth(current.config)));if(Object.hasOwn(PEOPLE,a))button.setAttribute('aria-pressed',String(a===current.character));if(a==='left'||a==='right')button.setAttribute('aria-pressed',String(current.direction===(a==='left'?-1:1)));}
  const box=find('platform-result');box.hidden=!out;if(out)box.innerHTML='<strong>'+(out.status==='won'?'三关完成！':'本局结束，可以再挑战')+'</strong><p>完成 '+out.levelsCompleted+'/3 关 · '+out.score+' 分 · 跌落或超时 '+out.deaths+' 次。</p><p>'+(out.mealsUsed?'本局实际使用了1份料理。':'本局没有消耗料理。')+' 点击上方“结算并返回棋盘”，保存本局成绩。</p>';
 }
 function animation(){if(disposed||paused)return;draw();if(!reduced.matches)frame=win.requestAnimationFrame(animation);}
 function schedule(){win.clearInterval(interval);win.cancelAnimationFrame(frame);interval=null;frame=null;if(live()){interval=win.setInterval(()=>{if(active()){sync();emit({type:'tick',dt:50});}},50);if(!reduced.matches)frame=win.requestAnimationFrame(animation);}draw();}
 function update(next){if(disposed)return;validate(next);const ended=current.phase!==next.phase,changed=current.level!==next.level||current.reading!==next.reading||current.levelStatus!==next.levelStatus;previous=current;current=clone(next);updatedAt=win.performance.now();if(ended||changed)clear();ui();if(ended)schedule();else if(reduced.matches)draw();}
 function activate(button){if(!live()||!root.contains(button)||button.disabled)return;const a=button.dataset.gameAction;if(Object.hasOwn(PEOPLE,a))emit({type:'switch',character:a});else if(a==='hint'||a==='hint-close'){clear();emit({type:'hint',open:a==='hint'});}else if(['start','jump','dash','interact','retry','use-meal'].includes(a))emit({type:a});if(a==='start'||a==='retry'||a==='hint-close')root.focus({preventScroll:true});}
 function click(event){const button=event.target.closest('[data-game-action]');if(!button)return;if(event.pointerType==='touch'||event.sourceCapabilities?.firesTouchEvents)return;if(!event.pointerType&&event.detail>0&&lastTouch?.button===button&&win.performance.now()-lastTouch.at<800)return;activate(button);}
 function inside(button,event){const r=button.getBoundingClientRect();return event.clientX>=r.left&&event.clientX<=r.right&&event.clientY>=r.top&&event.clientY<=r.bottom;}
 function down(event){if(!live())return;const button=event.target.closest('[data-game-action]'),a=button?.dataset.gameAction;if(!button||button.disabled)return;if(['left','right'].includes(a)){if(!active())return;event.preventDefault();holds.set(event.pointerId,a==='left'?-1:1);button.setPointerCapture?.(event.pointerId);sync();}else if(event.pointerType==='touch'){event.preventDefault();lastTouch={button,at:win.performance.now()};touchButtons.set(event.pointerId,{button,cancelled:false});button.setPointerCapture?.(event.pointerId);}}
 function move(event){const touch=touchButtons.get(event.pointerId);if(touch&&!inside(touch.button,event))touch.cancelled=true;}
 function up(event){if(holds.delete(event.pointerId))sync();const touch=touchButtons.get(event.pointerId);touchButtons.delete(event.pointerId);if(!touch)return;lastTouch={button:touch.button,at:win.performance.now()};if(event.type==='pointerup'&&!touch.cancelled&&inside(touch.button,event))activate(touch.button);}
 function keydown(event){if(!live())return;if((event.code==='Space'||event.code==='Enter')&&event.target.closest('button'))return;if(event.code==='KeyH'&&current.started){event.preventDefault();if(!event.repeat){clear();emit({type:'hint',open:!current.reading});}return;}if(!current.started&&event.code==='Enter'){event.preventDefault();emit({type:'start'});return;}if(!active())return;const code=event.code;if(['ArrowLeft','ArrowRight','KeyA','KeyD'].includes(code)){event.preventDefault();keys.add(code);sync();return;}const actions={Space:{type:'jump'},ArrowUp:{type:'jump'},KeyW:{type:'jump'},KeyX:{type:'dash'},KeyE:{type:'interact'},Digit1:{type:'switch',character:'sister'},Digit2:{type:'switch',character:'brother'},Digit3:{type:'switch',character:'little'},KeyF:{type:'use-meal'}};if(actions[code]){event.preventDefault();if(!event.repeat)emit(actions[code]);}}
 function keyup(event){if(keys.delete(event.code)){event.preventDefault();sync();}}
 function release(){clear();sync();}const visibility=()=>{if(doc.hidden)release();},resize=()=>draw(),motion=()=>schedule();root.addEventListener('click',click);root.addEventListener('pointerdown',down);doc.addEventListener('pointermove',move);doc.addEventListener('pointerup',up);doc.addEventListener('pointercancel',up);root.addEventListener('keydown',keydown);doc.addEventListener('keyup',keyup);win.addEventListener('blur',release);doc.addEventListener('visibilitychange',visibility);win.addEventListener('resize',resize);reduced.addEventListener?.('change',motion);ui();schedule();
 return{update,setPaused(value){if(disposed)return;paused=!!value;clear();try{if(paused)neutral();else sync();}finally{ui();schedule();}},dispose(){if(disposed)return;disposed=true;try{neutral();}finally{win.clearInterval(interval);win.cancelAnimationFrame(frame);for(const record of artwork.values()){if(record.image){record.image.onload=null;record.image.onerror=null;}}artwork.clear();clear();root.removeEventListener('click',click);root.removeEventListener('pointerdown',down);doc.removeEventListener('pointermove',move);doc.removeEventListener('pointerup',up);doc.removeEventListener('pointercancel',up);root.removeEventListener('keydown',keydown);doc.removeEventListener('keyup',keyup);win.removeEventListener('blur',release);doc.removeEventListener('visibilitychange',visibility);win.removeEventListener('resize',resize);reduced.removeEventListener?.('change',motion);root.remove();}}};
}
return{id,version,title,create,step,validate,result,mount};
});

;
/* Liang Universe v0.3: compatible learning saves and verified arcade receipts. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.LiangLegacyCore=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
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

;
/* v0.4 delegates unchanged learning/arcade behavior to the frozen v0.3 core. */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('./legacy-core.js'),{fishing:require('./games/fishing.js'),kitchen:require('./games/kitchen.js'),trunk:require('./games/trunk.js')});
 else root.LiangCore=factory(root.LiangLegacyCore,root.LiangGames);
})(typeof globalThis!=='undefined'?globalThis:this,function(L,G){
'use strict';
const SCHEMA=4,MAX_PAYLOAD=L.MAX_PAYLOAD,KEY=L.KEY,clone=L.clone,crc=L.crc,uid=L.uid;
const IDS=['fishing','kitchen','trunk'],ITEMS=['fish','meal'],REGIONS=['Rawang','Masai'],OLD=['slipper','ball','jar'];
const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b),obj=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
const int=(x,min=0,max=1e9)=>Number.isSafeInteger(x)&&x>=min&&x<=max;
const ident=x=>typeof x==='string'&&/^[A-Za-z0-9:_-]{1,140}$/.test(x);
function check(value,message){if(!value)throw Error(message);}
const stock=()=>({Rawang:{fish:0,meal:0},Masai:{fish:0,meal:0}});
const extra=()=>({modules:{pending:null,claims:{},results:[]},economy:{version:1,inventory:stock(),ledger:[],riverCollection:[],diceChoice:null}});
function engine(id){check(IDS.includes(id)&&G?.[id]?.version===1,'游戏组件未正确载入，请刷新后重试。');return G[id];}
function fresh(){return {...L.fresh(),schemaVersion:SCHEMA,...extra()};}
function legacyProjection(s){const p=clone(s);p.schemaVersion=3;p.migrationArchive=null;if(p.activeSession?.gameId==='module')p.activeSession=null;return p;}
function validateModuleResult(r){
 check(obj(r)&&ident(r.runId)&&ident(r.sessionToken)&&IDS.includes(r.moduleId)&&r.version===1&&['practice','inventory'].includes(r.mode)&&['won','lost','abandoned'].includes(r.status)&&int(r.score)&&int(r.at,0,1e15)&&typeof r.actionHash==='string','游戏结算记录无效。');
 check(obj(r.goods)&&int(r.goods.fish,0,12)&&int(r.goods.meals,0,12)&&Array.isArray(r.goods.shipped)&&r.goods.shipped.length<=12&&r.goods.shipped.every(x=>obj(x)&&ident(x.id)&&ITEMS.includes(x.itemId)&&x.qty===1)&&new Set(r.goods.shipped.map(x=>x.id)).size===r.goods.shipped.length,'游戏物资凭证无效。');
 check(Array.isArray(r.goods.collectibles)&&r.goods.collectibles.length<=3&&r.goods.collectibles.every(x=>OLD.includes(x)),'河里旧物记录无效。');
 if(r.mode==='practice'||r.status!=='won')check(r.goods.fish===0&&r.goods.meals===0&&!r.goods.shipped.length&&!r.goods.collectibles.length,'练习或未通关记录不能增加共享物资。');
 else if(r.moduleId==='fishing')check(r.goods.fish>0&&r.goods.meals===0&&!r.goods.shipped.length,'钓鱼只能产出鱼和确认过的旧物。');
 else if(r.moduleId==='kitchen')check(r.goods.fish===0&&int(r.goods.meals,1,3)&&!r.goods.shipped.length&&!r.goods.collectibles.length,'厨房只能加工料理，不能额外产生鱼或收藏。');
 else check(r.goods.fish===0&&r.goods.meals===0&&r.goods.shipped.length>0&&!r.goods.collectibles.length,'运输只能转移装车清单中的物资。');
}
function checkRunInventory(s,run){
 if(!run||run.config.mode!=='inventory')return;
 const available=s.economy.inventory.Rawang;
 if(run.moduleId==='kitchen')check(int(run.config.units,1,3)&&available.fish>=run.config.units,'这局厨房需要的鱼已被其他进度使用，不能恢复。请保留两个备份，并返回现有进度。');
 if(run.moduleId==='trunk'){
  const counts={fish:0,meal:0};for(const cargo of run.config.cargo)counts[cargo.itemId]+=cargo.qty;
  check(ITEMS.every(item=>available[item]>=counts[item]),'这局运输清单中的物资已被其他进度使用，不能恢复。请保留两个备份，并返回现有进度。');
 }
}
function replay(run){
 check(obj(run)&&ident(run.id)&&IDS.includes(run.moduleId)&&run.version===1&&obj(run.config)&&['practice','inventory'].includes(run.config.mode)&&int(run.config.seed,0,0xffffffff)&&int(run.config.difficulty,0,2)&&int(run.startedAt,0,1e15),'游戏开局资料无效。');
 check(Array.isArray(run.actions)&&run.actions.length<=20000&&JSON.stringify(run.actions).length<=1800000,'本局操作记录过大或损坏，请先导出备份。');
 const E=engine(run.moduleId);let state=E.create(clone(run.config));
 for(const action of run.actions){check(obj(action)&&JSON.stringify(action).length<=2000,'游戏操作记录无效。');state=E.step(state,clone(action));}
 E.validate(state);check(eq(state,run.state),'游戏进度与实际操作记录不一致。');return state;
}
function validate(s){
 check(obj(s),'存档结构无效。');if(s.schemaVersion!==SCHEMA){const e=Error('请先迁移旧版存档，未覆盖现有资料。');e.code='UNSUPPORTED_SCHEMA';throw e;}
 L.validate(legacyProjection(s));
 if(s.migrationArchive!==null){const a=s.migrationArchive;check(obj(a)&&[1,2,3].includes(a.schemaVersion)&&typeof a.payload==='string'&&a.payload.length<=MAX_PAYLOAD&&a.checksum===crc(a.payload),'升级前备份校验失败。');const old=JSON.parse(a.payload);check(old.schemaVersion===a.schemaVersion,'升级前备份版本不一致。');L.migrate(old);}
 check(obj(s.modules)&&obj(s.modules.claims)&&Array.isArray(s.modules.results),'小游戏记录缺失。');
 for(const [id,r] of Object.entries(s.modules.claims)){validateModuleResult(r);check(id===r.runId,'小游戏凭证编号不一致。');}
 check(new Set(Object.values(s.modules.claims).map(r=>r.sessionToken)).size===Object.keys(s.modules.claims).length,'同一个小游戏会话不能有两份结算凭证。');
 check(new Set(s.modules.results.map(r=>r.runId)).size===s.modules.results.length,'小游戏结果重复。');
 for(const r of s.modules.results){validateModuleResult(r);check(eq(r,s.modules.claims[r.runId]),'小游戏结果与凭证不一致。');}
 if(s.modules.pending){const run=s.modules.pending;replay(run);check(!s.modules.claims[run.id],'已结算游戏不能再作为未完成局。');const a=s.activeSession;check(a?.gameId==='module'&&a.moduleId===run.moduleId&&a.runId===run.id&&a.token===run.sessionToken,'未完成游戏与会话不一致。');}
 if(s.activeSession?.gameId==='module'){
  const a=s.activeSession;check(s.modules.pending&&ident(a.token)&&int(a.learnerSlot,0,2)&&a.runKey===null&&a.returnSnapshotHash===crc(JSON.stringify(a.returnSnapshot))&&eq(a.returnSnapshot,s.board)&&a.boardId===(s.board?.id||'')&&a.turnNo===(s.board?.turnNo||0),'小游戏返回位置或回合损坏。');
 }
 const e=s.economy;check(obj(e)&&e.version===1&&obj(e.inventory)&&Array.isArray(e.ledger)&&Array.isArray(e.riverCollection),'物资账本缺失。');
 check(new Set(e.ledger.map(t=>t.id)).size===e.ledger.length,'物资交易重复。');let expected=stock();const collection=new Set();
 for(const t of e.ledger){
  check(obj(t)&&ident(t.id)&&int(t.at,0,1e15)&&['fish-production','fish-cooking','cargo-transfer','meal-consume'].includes(t.type)&&obj(t.delta),'物资交易格式无效。');
  for(const zone of REGIONS)for(const item of ITEMS){check(obj(t.delta[zone])&&int(t.delta[zone][item],-12,12),'物资变化数量无效。');expected[zone][item]+=t.delta[zone][item];check(int(expected[zone][item],0,1e8),'物资不足或账本超出限制。');}
  const r=t.delta.Rawang,m=t.delta.Masai;
  if(t.type==='meal-consume')check(r.fish===0&&r.meal===0&&m.fish===0&&m.meal===-1&&typeof t.boardId==='string'&&int(t.turnNo,1),'料理消费记录无效。');
  else{
   const claim=s.modules.claims[t.runId];check(claim?.mode==='inventory'&&claim.status==='won'&&t.id==='module:'+claim.runId&&t.actionHash===claim.actionHash,'物资没有对应的真实游戏结算。');
   if(t.type==='fish-production'){check(claim.moduleId==='fishing'&&r.fish===claim.goods.fish&&r.fish>0&&r.meal===0&&m.fish===0&&m.meal===0,'钓鱼产出不守恒。');for(const id of claim.goods.collectibles)collection.add(id);}
   if(t.type==='fish-cooking')check(claim.moduleId==='kitchen'&&r.fish===-claim.goods.meals&&r.meal===claim.goods.meals&&r.meal>0&&m.fish===0&&m.meal===0,'料理加工不守恒。');
   if(t.type==='cargo-transfer'){const counts={fish:0,meal:0};for(const cargo of claim.goods.shipped)counts[cargo.itemId]++;check(claim.moduleId==='trunk'&&counts.fish+counts.meal>0&&r.fish===-counts.fish&&r.meal===-counts.meal&&m.fish===counts.fish&&m.meal===counts.meal,'运输必须等量转移真实物资。');}
  }
 }
 for(const zone of REGIONS)for(const item of ITEMS)check(obj(e.inventory[zone])&&e.inventory[zone][item]===expected[zone][item],'库存与物资流水不一致。');
 for(const r of Object.values(s.modules.claims))if(r.mode==='inventory'&&r.status==='won')check(e.ledger.some(t=>t.id==='module:'+r.runId&&t.runId===r.runId),'已发放的物资凭证缺少对应流水，不能覆盖原档。');
 check(e.riverCollection.every(x=>OLD.includes(x))&&new Set(e.riverCollection).size===e.riverCollection.length&&eq([...collection].sort(),e.riverCollection.slice().sort()),'河里旧物收藏与来源不一致。');
 checkRunInventory(s,s.modules.pending);
 if(e.diceChoice){const c=e.diceChoice;check(obj(c)&&ident(c.id)&&e.ledger.some(t=>t.id===c.id&&t.type==='meal-consume')&&s.board?.phase==='roll'&&c.boardId===s.board.id&&c.turnNo===s.board.turnNo&&c.turn===s.board.turn&&Array.isArray(c.rolls)&&c.rolls.length===2&&c.rolls.every(x=>int(x,1,6)),'料理骰子选择记录无效。');}
 return clone(s);
}
// A rejected action must leave the caller's live save untouched. Validate and
// finish all work on a detached draft before publishing any claim or inventory.
function atomic(s,operation){const draft=validate(s),result=operation(draft);validate(draft);Object.assign(s,draft);return result;}
function migrate(input){
 if(input?.schemaVersion===SCHEMA)return{state:validate(input),migrated:false,fromVersion:SCHEMA,toVersion:SCHEMA};
 const old=L.migrate(input).state,payload=JSON.stringify(input);check(payload.length<=MAX_PAYLOAD,'升级前备份超过大小限制，原档保留。');
 const state={...old,schemaVersion:SCHEMA,...extra(),migrationArchive:{schemaVersion:input.schemaVersion,payload,checksum:crc(payload)}};
 state.migrations.push({from:input.schemaVersion,to:SCHEMA,at:Date.now(),note:'保留完整旧档；新物资账本从零开始，不补发历史奖励。'});
 return{state:validate(state),migrated:true,fromVersion:input.schemaVersion,toVersion:SCHEMA};
}
function launchModuleDraft(s,id,options={}){
 check(obj(options),'游戏模式配置无效。');
 check(!s.activeSession&&!s.modules.pending,'请先继续或结束尚未完成的一局。');check(!s.economy.diceChoice,'请先选好本回合的骰子。');const E=engine(id);
 const mode=options.mode??'practice',difficulty=options.difficulty??0;check(['practice','inventory'].includes(mode)&&int(difficulty,0,2),'游戏模式无效。');
 const seed=parseInt(crc(uid()),16)>>>0,config={seed,mode,difficulty};
 if(id==='kitchen'){const units=options.units??3;check(int(units,1,3),'每局请选择一至三份料理。');config.units=mode==='practice'?units:Math.min(units,s.economy.inventory.Rawang.fish);check(config.units>0,'Rawang 还没有鱼。可以先玩练习关，或去河边钓鱼。');}
 if(id==='trunk'&&mode==='inventory'){
  config.cargo=[];const amounts=options.cargo??s.economy.inventory.Rawang;check(obj(amounts),'装箱数量清单无效。');
  for(const item of ['meal','fish']){check(int(amounts[item]??0,0,s.economy.inventory.Rawang[item]),'装箱数量超过 Rawang 库存。');const count=Math.min(amounts[item]??0,12-config.cargo.length);for(let n=0;n<count;n++)config.cargo.push({id:item+'-'+(n+1),itemId:item,qty:1});}
  check(config.cargo.length>0,'Rawang 暂无可运物资。可以先玩装箱练习。');
 }
 const initial=E.create(clone(config));E.validate(initial);
 const token=uid(),runId=uid(),slot=s.board?.players[s.board.turn].learnerSlot??0;
 s.activeSession={gameId:'module',moduleId:id,runId,token,learnerSlot:slot,boardId:s.board?.id||'',turnNo:s.board?.turnNo||0,returnSnapshot:clone(s.board),returnSnapshotHash:crc(JSON.stringify(s.board)),runKey:null};
 s.modules.pending={id:runId,sessionToken:token,moduleId:id,version:E.version,config,startedAt:Date.now(),actions:[],state:initial};
 L.note(s,'进入'+E.title+(mode==='practice'?' · 练习关':' · 联动物资关'));return clone(s.activeSession);
}
function launchModule(s,id,options={}){return atomic(s,draft=>launchModuleDraft(draft,id,options));}
function updateModule(s,token,actions,state){
 const run=s.modules.pending;check(s.activeSession?.token===token&&s.activeSession.gameId==='module'&&run,'游戏会话已改变。');
 check(eq(s.activeSession.returnSnapshot,s.board)&&s.activeSession.returnSnapshotHash===crc(JSON.stringify(s.board)),'棋盘位置或回合已改变，未覆盖本局进度。');
 checkRunInventory(s,run);
 check(Array.isArray(actions)&&actions.length>=run.actions.length&&eq(actions.slice(0,run.actions.length),run.actions),'游戏进度不能倒退或替换已保存操作。');
 const next={...run,actions:clone(actions),state:clone(state)};replay(next);s.modules.pending=next;return{saved:true};
}
function transaction(s,t){
 check(!s.economy.ledger.some(x=>x.id===t.id),'此物资交易已经结算。');
 const nextInventory=clone(s.economy.inventory);
 for(const zone of REGIONS)for(const item of ITEMS){check(obj(t.delta?.[zone])&&int(t.delta[zone][item],-12,12),'物资交易数量无效。');const next=nextInventory[zone][item]+t.delta[zone][item];check(int(next,0,1e8),'物资不足，未扣除也未发放，请保留存档。');nextInventory[zone][item]=next;}
 s.economy.inventory=nextInventory;s.economy.ledger.push(clone(t));
}
function settleModuleDraft(s,token){
 const already=Object.values(s.modules.claims).find(r=>r.sessionToken===token);if(already)return{duplicate:true,result:clone(already)};
 check(s.activeSession?.token===token&&s.activeSession.gameId==='module'&&s.modules.pending,'没有可结算的小游戏。');
 const run=s.modules.pending,state=replay(run),outcome=engine(run.moduleId).result(state);
 check(outcome&&['won','lost'].includes(outcome.status)&&int(outcome.score),'游戏尚未完成，不能结算。');
 const goods={fish:0,meals:0,shipped:[],collectibles:[]};
 if(run.config.mode==='inventory'&&outcome.status==='won'){
  if(run.moduleId==='fishing'){check(int(outcome.fish,1,12)&&Array.isArray(outcome.collectibles)&&outcome.collectibles.every(id=>OLD.includes(id)),'钓鱼结果无效。');goods.fish=outcome.fish;goods.collectibles=clone(outcome.collectibles);}
  if(run.moduleId==='kitchen'){check(int(outcome.meals,1,run.config.units),'料理数量无效。');goods.meals=outcome.meals;}
  if(run.moduleId==='trunk'){check(Array.isArray(outcome.shipped)&&outcome.shipped.length>0&&new Set(outcome.shipped.map(x=>x.id)).size===outcome.shipped.length&&outcome.shipped.every(x=>run.config.cargo.some(c=>eq(c,x))),'运输清单不是开局时的真实物资。');goods.shipped=clone(outcome.shipped);}
 }
 const r={runId:run.id,sessionToken:token,moduleId:run.moduleId,version:1,mode:run.config.mode,status:outcome.status,score:outcome.score,at:Date.now(),actionHash:crc(JSON.stringify({config:run.config,actions:run.actions})),goods};
 validateModuleResult(r);s.modules.claims[r.runId]=clone(r);s.modules.results.push(clone(r));
 if(r.status==='won'&&r.mode==='inventory'){
  const delta=stock(),type=run.moduleId==='fishing'?'fish-production':run.moduleId==='kitchen'?'fish-cooking':'cargo-transfer';
  if(type==='fish-production'){delta.Rawang.fish=goods.fish;for(const id of goods.collectibles)if(!s.economy.riverCollection.includes(id))s.economy.riverCollection.push(id);}
  if(type==='fish-cooking'){delta.Rawang.fish=-goods.meals;delta.Rawang.meal=goods.meals;}
  if(type==='cargo-transfer')for(const c of goods.shipped){delta.Rawang[c.itemId]-=c.qty;delta.Masai[c.itemId]+=c.qty;}
  transaction(s,{id:'module:'+r.runId,type,at:r.at,runId:r.runId,actionHash:r.actionHash,delta});
 }
 L.closeSession(s,token);s.modules.pending=null;L.note(s,engine(run.moduleId).title+'：'+(r.status==='won'?'通关':'本局结束')+'，'+r.score+'分。'+(r.mode==='practice'?'练习成绩已记录，不改变物资。':'物资与游戏结果已分别保存。'));
 return{duplicate:false,result:clone(r)};
}
function settleModule(s,token){return atomic(s,draft=>settleModuleDraft(draft,token));}
function closeSession(s,token){const module=s.activeSession?.gameId==='module';const result=L.closeSession(s,token);if(module)s.modules.pending=null;return result;}
function prepareMealDiceDraft(s,a,b){
 check(s.board?.phase==='roll'&&!s.activeSession&&!s.economy.diceChoice,'当前不能使用料理，请先完成本回合或游戏。');check(int(a,1,6)&&int(b,1,6),'骰子数值无效。');
 const id='dice:'+uid(),delta=stock();delta.Masai.meal=-1;transaction(s,{id,type:'meal-consume',at:Date.now(),boardId:s.board.id,turnNo:s.board.turnNo,delta});
 s.economy.diceChoice={id,boardId:s.board.id,turnNo:s.board.turnNo,turn:s.board.turn,rolls:[a,b]};L.note(s,'使用一份 Masai 料理，本回合可在两个骰子结果中选择一个。');return clone(s.economy.diceChoice);
}
function prepareMealDice(s,a,b){return atomic(s,draft=>prepareMealDiceDraft(draft,a,b));}
function chooseMealDice(s,index){return atomic(s,draft=>{const c=draft.economy.diceChoice;check(c&&int(index,0,1)&&c.boardId===draft.board?.id&&c.turnNo===draft.board.turnNo&&c.turn===draft.board.turn,'骰子选择已失效。');L.roll(draft,c.rolls[index]);draft.economy.diceChoice=null;});}
function roll(s,d){check(!s.economy.diceChoice,'请先选择已掷出的一个骰子。');return L.roll(s,d);}
function startBoard(s,n,names){check(!s.economy.diceChoice,'请先完成料理骰子的选择。');return L.startBoard(s,n,names);}
function prepareImport(current,incoming){
 validate(current);const s=migrate(incoming).state;
 if(current.universeId===s.universeId){
  Object.assign(s.claims,current.claims);Object.assign(s.arcadeClaims,current.arcadeClaims);
  for(const r of s.gameResults.arcade){const old=current.arcadeClaims[r.roundId];check(!old||eq(old,r),'导入街机结果与本机凭证冲突。');}
  for(const [id,r] of Object.entries(current.modules.claims)){check(!s.modules.claims[id]||eq(s.modules.claims[id],r),'导入小游戏结果与本机凭证冲突。');s.modules.claims[id]=clone(r);}
  const left=current.economy.ledger,right=s.economy.ledger,min=Math.min(left.length,right.length);check(eq(left.slice(0,min),right.slice(0,min)),'两台设备的物资账本已经分叉，不能相加或自动覆盖。请先保留两个备份。');
  if(left.length>=right.length)s.economy=clone(current.economy);
  // A pending choice already consumed a meal. Keep it from the selected
  // authoritative ledger branch; dropping it would lose a paid advantage.
  // An already chosen local turn keeps its null choice and cannot use it twice.
  if(s.economy.diceChoice){const choice=s.economy.diceChoice;check(s.board?.phase==='roll'&&choice.boardId===s.board.id&&choice.turnNo===s.board.turnNo&&choice.turn===s.board.turn,'已使用料理的骰子选择还未完成，与备份棋盘回合不一致。请先在当前进度选好骰子，再导入；原存档和料理扣除记录均已保留。');}
  if(s.modules.pending&&s.modules.claims[s.modules.pending.id]){L.closeSession(s,s.activeSession.token);s.modules.pending=null;}
 }
 for(const r of Object.values(s.settlements.runs))if(r.status==='started'){r.status='invalidated';r.sessionToken=null;}
 if(s.activeSession)s.activeSession.runKey=null;return validate(s);
}
function pack(s){validate(s);const payload=JSON.stringify(s);check(payload.length<=MAX_PAYLOAD,'宇宙存档超过大小限制，请保留备份。');return{payload,checksum:crc(payload)};}
function unpack(p){check(obj(p)&&typeof p.payload==='string'&&p.payload.length<=MAX_PAYLOAD&&p.checksum===crc(p.payload),'存档校验失败，原档未覆盖。');const originalState=JSON.parse(p.payload);return{...migrate(originalState),originalState};}
function wrap(s,old){let previous=null;if(old){if(old.schemaVersion===4)previous=pack(old);else{L.migrate(old);const payload=JSON.stringify(old);check(payload.length<=MAX_PAYLOAD,'旧备份过大。');previous={payload,checksum:crc(payload)};}}return JSON.stringify({format:'LIANG_UNIVERSE',current:pack(s),previous});}
function unwrap(raw){check(typeof raw==='string'&&raw.length<=MAX_PAYLOAD*2+1000,'存档文件过大。');const w=JSON.parse(raw);check(w?.format==='LIANG_UNIVERSE','这不是梁家宇宙存档。');try{return{...unpack(w.current),recovered:false};}catch(e){if(e.code==='UNSUPPORTED_SCHEMA')throw e;if(w.previous)return{...unpack(w.previous),recovered:true};throw e;}}
function encode(s){const bytes=new TextEncoder().encode(JSON.stringify(pack(s)));let text='';for(let n=0;n<bytes.length;n+=8192)text+=String.fromCharCode(...bytes.subarray(n,n+8192));return'LU1.'+(typeof btoa==='function'?btoa(text):Buffer.from(text,'binary').toString('base64')).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
function decode(code){check(typeof code==='string'&&code.length<=MAX_PAYLOAD*6&&/^LU1\.[A-Za-z0-9_-]+$/.test(code),'迁移代码格式无效或过大。');let b=code.slice(4).replace(/-/g,'+').replace(/_/g,'/');b+='='.repeat((4-b.length%4)%4);const bin=typeof atob==='function'?atob(b):Buffer.from(b,'base64').toString('binary');return unpack(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(bin,c=>c.charCodeAt(0))))).state;}
return{...L,SCHEMA,KEY,MAX_PAYLOAD,IDS,fresh,validate,migrate,launchModule,updateModule,settleModule,prepareMealDice,chooseMealDice,roll,startBoard,closeSession,prepareImport,pack,wrap,unwrap,encode,decode};
});

;
/* v0.5 extends the verified v0.4 resource rules; frozen v4 verifies migrations. */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('./core-v4.js'),require('./legacy-core.js'),{fishing:require('./games/fishing.js'),kitchen:require('./games/kitchen.js'),trunk:require('./games/trunk.js'),dungeon:require('./games/dungeon.js'),kart:require('./games/kart.js')});
 else root.LiangCore=factory(root.LiangCore,root.LiangLegacyCore,root.LiangGames);
})(typeof globalThis!=='undefined'?globalThis:this,function(V4,L,G){
'use strict';
const SCHEMA=5,MAX_PAYLOAD=L.MAX_PAYLOAD,KEY=L.KEY,clone=L.clone,crc=L.crc,uid=L.uid;
const RESOURCE_IDS=['fishing','kitchen','trunk'],ADVENTURE_IDS=['dungeon','kart'],IDS=[...RESOURCE_IDS,...ADVENTURE_IDS],ITEMS=['fish','meal'],REGIONS=['Rawang','Masai'],OLD=['slipper','ball','jar'];
const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b),obj=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
const int=(x,min=0,max=1e9)=>Number.isSafeInteger(x)&&x>=min&&x<=max;
const ident=x=>typeof x==='string'&&/^[A-Za-z0-9:_-]{1,140}$/.test(x);
function check(value,message){if(!value)throw Error(message);}
const stock=()=>({Rawang:{fish:0,meal:0},Masai:{fish:0,meal:0}});
const extra=()=>({adventureMeals:{}});
function engine(id){check(IDS.includes(id)&&G?.[id]?.version===1,'游戏组件未正确载入，请刷新后重试。');return G[id];}
function fresh(){return {...V4.fresh(),schemaVersion:SCHEMA,...extra()};}
function legacyProjection(s){const p=clone(s);p.schemaVersion=3;p.migrationArchive=null;if(p.activeSession?.gameId==='module')p.activeSession=null;return p;}
function validateModuleResult(r){
 check(obj(r)&&ident(r.runId)&&ident(r.sessionToken)&&IDS.includes(r.moduleId)&&r.version===1&&['practice','inventory'].includes(r.mode)&&['won','lost','abandoned'].includes(r.status)&&int(r.score)&&int(r.at,0,1e15)&&typeof r.actionHash==='string','游戏结算记录无效。');
 check(obj(r.goods)&&int(r.goods.fish,0,12)&&int(r.goods.meals,0,12)&&Array.isArray(r.goods.shipped)&&r.goods.shipped.length<=12&&r.goods.shipped.every(x=>obj(x)&&ident(x.id)&&ITEMS.includes(x.itemId)&&x.qty===1)&&new Set(r.goods.shipped.map(x=>x.id)).size===r.goods.shipped.length,'游戏物资凭证无效。');
 check(Array.isArray(r.goods.collectibles)&&r.goods.collectibles.length<=3&&r.goods.collectibles.every(x=>OLD.includes(x)),'河里旧物记录无效。');
 if(ADVENTURE_IDS.includes(r.moduleId)){
  check(r.goods.fish===0&&r.goods.meals===0&&!r.goods.shipped.length&&!r.goods.collectibles.length,'冒险与赛车只记录本局结果，不自动生产共享物资。');
  check(int(r.mealsUsed,0,1)&&(r.mode!=='practice'||r.mealsUsed===0)&&(r.mealsUsed===0?r.mealProofHash===null:typeof r.mealProofHash==='string'),'料理使用凭证无效。');
  if(r.discoveries!==undefined)check(r.moduleId==='dungeon'&&Array.isArray(r.discoveries)&&r.discoveries.length<=100&&r.discoveries.every(x=>typeof x==='string'&&x.length<=100),'本局发现记录无效。');
 }
 else if(r.mode==='practice'||r.status!=='won')check(r.goods.fish===0&&r.goods.meals===0&&!r.goods.shipped.length&&!r.goods.collectibles.length,'练习或未通关记录不能增加共享物资。');
 else if(r.moduleId==='fishing')check(r.goods.fish>0&&r.goods.meals===0&&!r.goods.shipped.length,'钓鱼只能产出鱼和确认过的旧物。');
 else if(r.moduleId==='kitchen')check(r.goods.fish===0&&int(r.goods.meals,1,3)&&!r.goods.shipped.length&&!r.goods.collectibles.length,'厨房只能加工料理，不能额外产生鱼或收藏。');
 else check(r.goods.fish===0&&r.goods.meals===0&&r.goods.shipped.length>0&&!r.goods.collectibles.length,'运输只能转移装车清单中的物资。');
}
function checkRunInventory(s,run){
 if(!run||run.config.mode!=='inventory')return;
 const available=s.economy.inventory.Rawang;
 if(run.moduleId==='kitchen')check(int(run.config.units,1,3)&&available.fish>=run.config.units,'这局厨房需要的鱼已被其他进度使用，不能恢复。请保留两个备份，并返回现有进度。');
 if(run.moduleId==='trunk'){
  const counts={fish:0,meal:0};for(const cargo of run.config.cargo)counts[cargo.itemId]+=cargo.qty;
  check(ITEMS.every(item=>available[item]>=counts[item]),'这局运输清单中的物资已被其他进度使用，不能恢复。请保留两个备份，并返回现有进度。');
 }
 if(ADVENTURE_IDS.includes(run.moduleId)&&run.config.mealCharges===1&&run.state.mealsUsed===0)check(s.economy.inventory.Masai.meal>=1,'这局尚未使用的可选料理已被其他进度消费，不能恢复旧选择。请保留两个备份，在现有进度选择不带料理的新一局。');
}
function replay(run,{onMealUse}={}){
 check(obj(run)&&ident(run.id)&&IDS.includes(run.moduleId)&&run.version===1&&obj(run.config)&&['practice','inventory'].includes(run.config.mode)&&int(run.config.seed,0,0xffffffff)&&int(run.config.difficulty,0,2)&&int(run.startedAt,0,1e15),'游戏开局资料无效。');
 check(Array.isArray(run.actions)&&run.actions.length<=20000&&JSON.stringify(run.actions).length<=1800000,'本局操作记录过大或损坏，请先导出备份。');
 const E=engine(run.moduleId),adventure=ADVENTURE_IDS.includes(run.moduleId);let state=E.create(clone(run.config));
 if(adventure)check(int(run.config.mealCharges,0,1)&&(run.config.mode!=='practice'||run.config.mealCharges===0)&&state.mealsUsed===0,'新游戏料理配置无效。');
 for(let index=0;index<run.actions.length;index++){const action=run.actions[index];check(obj(action)&&JSON.stringify(action).length<=2000,'游戏操作记录无效。');const before=state.mealsUsed;state=E.step(state,clone(action));if(adventure){check(int(state.mealsUsed,0,run.config.mealCharges)&&state.mealsUsed>=before&&(state.mealsUsed===before||action.type==='use-meal'&&before===0&&state.mealsUsed===1),'料理必须由真实生效的使用操作产生，不能回退或重复使用。');if(state.mealsUsed!==before)onMealUse?.(index,clone(state));}}
 E.validate(state);check(eq(state,run.state),'游戏进度与实际操作记录不一致。');return state;
}
// Old consumption prefixes never change. Retain only exact, fully verified
// serialized prefixes, bounded by one maximum save payload. New/edited bytes
// and changed engine functions must replay again; no balances or claims cache.
const MAX_REPLAY_CACHE_UNITS=MAX_PAYLOAD,mealReplayCache=new Map();let mealReplayUnits=0;
function validateMealPrefix(run){
 const serialized=JSON.stringify(run),E=engine(run.moduleId),prior=mealReplayCache.get(serialized);
 if(prior&&prior.create===E.create&&prior.step===E.step&&prior.validate===E.validate){mealReplayCache.delete(serialized);mealReplayCache.set(serialized,prior);return;}
 let useIndex=-1;const state=replay(run,{onMealUse:index=>{useIndex=index;}});check(state.mealsUsed===1&&useIndex===run.actions.length-1,'料理消费缺少首次真实生效的操作前缀。');
 if(prior){mealReplayCache.delete(serialized);mealReplayUnits-=serialized.length;}
 if(serialized.length>MAX_REPLAY_CACHE_UNITS)return;
 while(mealReplayUnits+serialized.length>MAX_REPLAY_CACHE_UNITS){const oldest=mealReplayCache.keys().next().value;mealReplayCache.delete(oldest);mealReplayUnits-=oldest.length;}
 mealReplayCache.set(serialized,{create:E.create,step:E.step,validate:E.validate});mealReplayUnits+=serialized.length;
}
function validate(s){
 check(obj(s),'存档结构无效。');if(s.schemaVersion!==SCHEMA){const e=Error('请先迁移旧版存档，未覆盖现有资料。');e.code='UNSUPPORTED_SCHEMA';throw e;}
 L.validate(legacyProjection(s));
 if(s.migrationArchive!==null){const a=s.migrationArchive;check(obj(a)&&[1,2,3,4].includes(a.schemaVersion)&&typeof a.payload==='string'&&a.payload.length<=MAX_PAYLOAD&&a.checksum===crc(a.payload),'升级前备份校验失败。');const old=JSON.parse(a.payload);check(old.schemaVersion===a.schemaVersion,'升级前备份版本不一致。');V4.migrate(old);}
 check(obj(s.modules)&&obj(s.modules.claims)&&Array.isArray(s.modules.results),'小游戏记录缺失。');
 for(const [id,r] of Object.entries(s.modules.claims)){validateModuleResult(r);check(id===r.runId,'小游戏凭证编号不一致。');}
 check(new Set(Object.values(s.modules.claims).map(r=>r.sessionToken)).size===Object.keys(s.modules.claims).length,'同一个小游戏会话不能有两份结算凭证。');
 check(new Set(s.modules.results.map(r=>r.runId)).size===s.modules.results.length,'小游戏结果重复。');
 for(const r of s.modules.results){validateModuleResult(r);check(eq(r,s.modules.claims[r.runId]),'小游戏结果与凭证不一致。');}
 if(s.modules.pending){const run=s.modules.pending;replay(run);check(!s.modules.claims[run.id],'已结算游戏不能再作为未完成局。');const a=s.activeSession;check(a?.gameId==='module'&&a.moduleId===run.moduleId&&a.runId===run.id&&a.token===run.sessionToken,'未完成游戏与会话不一致。');}
 if(s.activeSession?.gameId==='module'){
  const a=s.activeSession;check(s.modules.pending&&ident(a.token)&&int(a.learnerSlot,0,2)&&a.runKey===null&&a.returnSnapshotHash===crc(JSON.stringify(a.returnSnapshot))&&eq(a.returnSnapshot,s.board)&&a.boardId===(s.board?.id||'')&&a.turnNo===(s.board?.turnNo||0),'小游戏返回位置或回合损坏。');
 }
 check(obj(s.adventureMeals),'冒险料理消费凭证缺失。');
 for(const [id,proof] of Object.entries(s.adventureMeals)){
  check(obj(proof)&&proof.run?.id===id&&ADVENTURE_IDS.includes(proof.run.moduleId)&&proof.run.config?.mode==='inventory'&&proof.run.config.mealCharges===1&&int(proof.at,0,1e15)&&proof.transactionId==='adventure-meal:'+id&&proof.actionHash===crc(JSON.stringify({config:proof.run.config,actions:proof.run.actions})),'冒险料理消费来源无效。');
  validateMealPrefix(proof.run);
  const pending=s.modules.pending?.id===id?s.modules.pending:null,claim=s.modules.claims[id];
  check(pending||claim,'料理已经扣除，但找不到本局进度或结束凭证。');
  if(pending)check(pending.sessionToken===proof.run.sessionToken&&pending.state.mealsUsed===1&&eq(pending.config,proof.run.config)&&eq(pending.actions.slice(0,proof.run.actions.length),proof.run.actions),'导入的旧进度早于已经使用的料理。请保留原档，使用较新的完整备份继续。');
  if(claim)check(claim.moduleId===proof.run.moduleId&&claim.sessionToken===proof.run.sessionToken&&claim.mealsUsed===1&&claim.mealProofHash===proof.actionHash,'已结束游戏与料理消费来源不一致。');
 }
 for(const r of Object.values(s.modules.claims))if(ADVENTURE_IDS.includes(r.moduleId))check(!!s.adventureMeals[r.runId]===(r.mealsUsed===1),'游戏料理结果与消费凭证不一致。');
 if(s.modules.pending&&ADVENTURE_IDS.includes(s.modules.pending.moduleId))check(!!s.adventureMeals[s.modules.pending.id]===(s.modules.pending.state.mealsUsed===1),'游戏已使用料理，缺少原子消费凭证。');
 const e=s.economy;check(obj(e)&&e.version===1&&obj(e.inventory)&&Array.isArray(e.ledger)&&Array.isArray(e.riverCollection),'物资账本缺失。');
 check(new Set(e.ledger.map(t=>t.id)).size===e.ledger.length,'物资交易重复。');let expected=stock();const collection=new Set();
 for(const t of e.ledger){
  check(obj(t)&&ident(t.id)&&int(t.at,0,1e15)&&['fish-production','fish-cooking','cargo-transfer','meal-consume','adventure-meal-consume'].includes(t.type)&&obj(t.delta),'物资交易格式无效。');
  for(const zone of REGIONS)for(const item of ITEMS){check(obj(t.delta[zone])&&int(t.delta[zone][item],-12,12),'物资变化数量无效。');expected[zone][item]+=t.delta[zone][item];check(int(expected[zone][item],0,1e8),'物资不足或账本超出限制。');}
  const r=t.delta.Rawang,m=t.delta.Masai;
  if(t.type==='adventure-meal-consume'){
   const proof=s.adventureMeals[t.runId];check(proof&&t.id===proof.transactionId&&t.sessionToken===proof.run.sessionToken&&t.moduleId===proof.run.moduleId&&t.actionHash===proof.actionHash&&t.at===proof.at&&r.fish===0&&r.meal===0&&m.fish===0&&m.meal===-1,'冒险料理消费流水与真实操作不一致。');
  }
  else if(t.type==='meal-consume')check(r.fish===0&&r.meal===0&&m.fish===0&&m.meal===-1&&typeof t.boardId==='string'&&int(t.turnNo,1),'料理消费记录无效。');
  else{
   const claim=s.modules.claims[t.runId];check(claim?.mode==='inventory'&&claim.status==='won'&&t.id==='module:'+claim.runId&&t.actionHash===claim.actionHash,'物资没有对应的真实游戏结算。');
   if(t.type==='fish-production'){check(claim.moduleId==='fishing'&&r.fish===claim.goods.fish&&r.fish>0&&r.meal===0&&m.fish===0&&m.meal===0,'钓鱼产出不守恒。');for(const id of claim.goods.collectibles)collection.add(id);}
   if(t.type==='fish-cooking')check(claim.moduleId==='kitchen'&&r.fish===-claim.goods.meals&&r.meal===claim.goods.meals&&r.meal>0&&m.fish===0&&m.meal===0,'料理加工不守恒。');
   if(t.type==='cargo-transfer'){const counts={fish:0,meal:0};for(const cargo of claim.goods.shipped)counts[cargo.itemId]++;check(claim.moduleId==='trunk'&&counts.fish+counts.meal>0&&r.fish===-counts.fish&&r.meal===-counts.meal&&m.fish===counts.fish&&m.meal===counts.meal,'运输必须等量转移真实物资。');}
  }
 }
 for(const zone of REGIONS)for(const item of ITEMS)check(obj(e.inventory[zone])&&e.inventory[zone][item]===expected[zone][item],'库存与物资流水不一致。');
 for(const r of Object.values(s.modules.claims))if(RESOURCE_IDS.includes(r.moduleId)&&r.mode==='inventory'&&r.status==='won')check(e.ledger.some(t=>t.id==='module:'+r.runId&&t.runId===r.runId),'已发放的物资凭证缺少对应流水，不能覆盖原档。');
 for(const proof of Object.values(s.adventureMeals))check(e.ledger.some(t=>t.id===proof.transactionId&&t.type==='adventure-meal-consume'),'已扣除料理的操作凭证缺少消费流水。');
 check(e.riverCollection.every(x=>OLD.includes(x))&&new Set(e.riverCollection).size===e.riverCollection.length&&eq([...collection].sort(),e.riverCollection.slice().sort()),'河里旧物收藏与来源不一致。');
 checkRunInventory(s,s.modules.pending);
 if(e.diceChoice){const c=e.diceChoice;check(obj(c)&&ident(c.id)&&e.ledger.some(t=>t.id===c.id&&t.type==='meal-consume')&&s.board?.phase==='roll'&&c.boardId===s.board.id&&c.turnNo===s.board.turnNo&&c.turn===s.board.turn&&Array.isArray(c.rolls)&&c.rolls.length===2&&c.rolls.every(x=>int(x,1,6)),'料理骰子选择记录无效。');}
 return clone(s);
}
// A rejected action must leave the caller's live save untouched. Validate and
// finish all work on a detached draft before publishing any claim or inventory.
function atomic(s,operation){const draft=validate(s),result=operation(draft);validate(draft);Object.assign(s,draft);return result;}
function migrate(input){
 if(input?.schemaVersion===SCHEMA)return{state:validate(input),migrated:false,fromVersion:SCHEMA,toVersion:SCHEMA};
 const old=V4.migrate(input).state,payload=JSON.stringify(input);check(payload.length<=MAX_PAYLOAD,'升级前备份超过大小限制，原档保留。');
 const state={...old,schemaVersion:SCHEMA,...extra(),migrationArchive:{schemaVersion:input.schemaVersion,payload,checksum:crc(payload)}};
 state.migrations.push({from:input.schemaVersion,to:SCHEMA,at:Date.now(),note:'保留完整旧档、未完成游戏与全部资源流水；新增冒险料理凭证，不补发历史奖励。'});
 return{state:validate(state),migrated:true,fromVersion:input.schemaVersion,toVersion:SCHEMA};
}
function launchModuleDraft(s,id,options={}){
 check(obj(options),'游戏模式配置无效。');
 check(!s.activeSession&&!s.modules.pending,'请先继续或结束尚未完成的一局。');check(!s.economy.diceChoice,'请先选好本回合的骰子。');const E=engine(id);
 const mode=options.mode??'practice',difficulty=options.difficulty??0;check(['practice','inventory'].includes(mode)&&int(difficulty,0,2),'游戏模式无效。');
 const seed=parseInt(crc(uid()),16)>>>0,config={seed,mode,difficulty};
 if(ADVENTURE_IDS.includes(id)){
  const charges=options.mealCharges??0;check(int(charges,0,1)&&(mode!=='practice'||charges===0),'每局最多选择一份料理，练习关不使用仓库物资。');
  check(charges===0||s.economy.inventory.Masai.meal>=1,'Masai 没有料理，可不带料理开始，或先从 Rawang 运一份过来。');config.mealCharges=charges;
  if(id==='kart'&&options.trackId!==undefined){check(['masai-market','north-south'].includes(options.trackId),'赛道尚未接入。');config.trackId=options.trackId;}
 }
 if(id==='kitchen'){const units=options.units??3;check(int(units,1,3),'每局请选择一至三份料理。');config.units=mode==='practice'?units:Math.min(units,s.economy.inventory.Rawang.fish);check(config.units>0,'Rawang 还没有鱼。可以先玩练习关，或去河边钓鱼。');}
 if(id==='trunk'&&mode==='inventory'){
  config.cargo=[];const amounts=options.cargo??s.economy.inventory.Rawang;check(obj(amounts),'装箱数量清单无效。');
  for(const item of ['meal','fish']){check(int(amounts[item]??0,0,s.economy.inventory.Rawang[item]),'装箱数量超过 Rawang 库存。');const count=Math.min(amounts[item]??0,12-config.cargo.length);for(let n=0;n<count;n++)config.cargo.push({id:item+'-'+(n+1),itemId:item,qty:1});}
  check(config.cargo.length>0,'Rawang 暂无可运物资。可以先玩装箱练习。');
 }
 const initial=E.create(clone(config));E.validate(initial);
 const token=uid(),runId=uid(),slot=s.board?.players[s.board.turn].learnerSlot??0;
 s.activeSession={gameId:'module',moduleId:id,runId,token,learnerSlot:slot,boardId:s.board?.id||'',turnNo:s.board?.turnNo||0,returnSnapshot:clone(s.board),returnSnapshotHash:crc(JSON.stringify(s.board)),runKey:null};
 s.modules.pending={id:runId,sessionToken:token,moduleId:id,version:E.version,config,startedAt:Date.now(),actions:[],state:initial};
 L.note(s,'进入'+E.title+(mode==='practice'?' · 练习关':' · 联动物资关'));return clone(s.activeSession);
}
function launchModule(s,id,options={}){return atomic(s,draft=>launchModuleDraft(draft,id,options));}
function updateModuleDraft(s,token,actions,state){
 const run=s.modules.pending;check(s.activeSession?.token===token&&s.activeSession.gameId==='module'&&run,'游戏会话已改变。');
 check(eq(s.activeSession.returnSnapshot,s.board)&&s.activeSession.returnSnapshotHash===crc(JSON.stringify(s.board)),'棋盘位置或回合已改变，未覆盖本局进度。');
 checkRunInventory(s,run);
 check(Array.isArray(actions)&&actions.length>=run.actions.length&&eq(actions.slice(0,run.actions.length),run.actions),'游戏进度不能倒退或替换已保存操作。');
 const next={...run,actions:clone(actions),state:clone(state)};let use=null;replay(next,{onMealUse:(index,usedState)=>{use={index,state:usedState};}});s.modules.pending=next;
 if(ADVENTURE_IDS.includes(run.moduleId)&&next.state.mealsUsed===1&&!s.adventureMeals[run.id]){
  check(run.config.mode==='inventory'&&run.config.mealCharges===1&&use,'没有可用料理，未扣除任何库存。');
  const proofRun={...clone(next),actions:clone(next.actions.slice(0,use.index+1)),state:use.state},at=Date.now(),actionHash=crc(JSON.stringify({config:proofRun.config,actions:proofRun.actions})),transactionId='adventure-meal:'+run.id,delta=stock();delta.Masai.meal=-1;
  transaction(s,{id:transactionId,type:'adventure-meal-consume',at,runId:run.id,sessionToken:token,moduleId:run.moduleId,actionHash,delta});
  s.adventureMeals[run.id]={run:proofRun,at,actionHash,transactionId};
 }
 return{saved:true,mealsUsed:next.state.mealsUsed??0};
}
function updateModule(s,token,actions,state){return atomic(s,draft=>updateModuleDraft(draft,token,actions,state));}
function transaction(s,t){
 check(!s.economy.ledger.some(x=>x.id===t.id),'此物资交易已经结算。');
 const nextInventory=clone(s.economy.inventory);
 for(const zone of REGIONS)for(const item of ITEMS){check(obj(t.delta?.[zone])&&int(t.delta[zone][item],-12,12),'物资交易数量无效。');const next=nextInventory[zone][item]+t.delta[zone][item];check(int(next,0,1e8),'物资不足，未扣除也未发放，请保留存档。');nextInventory[zone][item]=next;}
 s.economy.inventory=nextInventory;s.economy.ledger.push(clone(t));
}
function settleModuleDraft(s,token){
 const already=Object.values(s.modules.claims).find(r=>r.sessionToken===token);if(already)return{duplicate:true,result:clone(already)};
 check(s.activeSession?.token===token&&s.activeSession.gameId==='module'&&s.modules.pending,'没有可结算的小游戏。');
 const run=s.modules.pending,state=replay(run),outcome=engine(run.moduleId).result(state);
 check(outcome&&['won','lost'].includes(outcome.status)&&int(outcome.score),'游戏尚未完成，不能结算。');
 const goods={fish:0,meals:0,shipped:[],collectibles:[]};
 if(run.config.mode==='inventory'&&outcome.status==='won'){
  if(run.moduleId==='fishing'){check(int(outcome.fish,1,12)&&Array.isArray(outcome.collectibles)&&outcome.collectibles.every(id=>OLD.includes(id)),'钓鱼结果无效。');goods.fish=outcome.fish;goods.collectibles=clone(outcome.collectibles);}
  if(run.moduleId==='kitchen'){check(int(outcome.meals,1,run.config.units),'料理数量无效。');goods.meals=outcome.meals;}
  if(run.moduleId==='trunk'){check(Array.isArray(outcome.shipped)&&outcome.shipped.length>0&&new Set(outcome.shipped.map(x=>x.id)).size===outcome.shipped.length&&outcome.shipped.every(x=>run.config.cargo.some(c=>eq(c,x))),'运输清单不是开局时的真实物资。');goods.shipped=clone(outcome.shipped);}
 }
 const r={runId:run.id,sessionToken:token,moduleId:run.moduleId,version:1,mode:run.config.mode,status:outcome.status,score:outcome.score,at:Date.now(),actionHash:crc(JSON.stringify({config:run.config,actions:run.actions})),goods};
 if(ADVENTURE_IDS.includes(run.moduleId)){
  check(int(outcome.mealsUsed,0,1)&&outcome.mealsUsed===state.mealsUsed,'本局料理使用结果无效。');r.mealsUsed=state.mealsUsed;r.mealProofHash=s.adventureMeals[run.id]?.actionHash??null;
  if(run.moduleId==='dungeon'&&outcome.discoveries!==undefined)r.discoveries=clone(outcome.discoveries);
 }
 validateModuleResult(r);s.modules.claims[r.runId]=clone(r);s.modules.results.push(clone(r));
 if(RESOURCE_IDS.includes(run.moduleId)&&r.status==='won'&&r.mode==='inventory'){
  const delta=stock(),type=run.moduleId==='fishing'?'fish-production':run.moduleId==='kitchen'?'fish-cooking':'cargo-transfer';
  if(type==='fish-production'){delta.Rawang.fish=goods.fish;for(const id of goods.collectibles)if(!s.economy.riverCollection.includes(id))s.economy.riverCollection.push(id);}
  if(type==='fish-cooking'){delta.Rawang.fish=-goods.meals;delta.Rawang.meal=goods.meals;}
  if(type==='cargo-transfer')for(const c of goods.shipped){delta.Rawang[c.itemId]-=c.qty;delta.Masai[c.itemId]+=c.qty;}
  transaction(s,{id:'module:'+r.runId,type,at:r.at,runId:r.runId,actionHash:r.actionHash,delta});
 }
 L.closeSession(s,token);s.modules.pending=null;L.note(s,engine(run.moduleId).title+'：'+(r.status==='won'?'通关':'本局结束')+'，'+r.score+'分。'+(r.mode==='practice'?'练习成绩已记录，不改变物资。':'物资与游戏结果已分别保存。'));
 return{duplicate:false,result:clone(r)};
}
function settleModule(s,token){return atomic(s,draft=>settleModuleDraft(draft,token));}
function closeSession(s,token){return atomic(s,draft=>{
 const isModule=draft.activeSession?.gameId==='module',run=isModule?draft.modules.pending:null;
 if(run&&ADVENTURE_IDS.includes(run.moduleId)){
  check(draft.activeSession.token===token,'过期游戏会话。');const state=replay(run),proof=draft.adventureMeals[run.id];
  const r={runId:run.id,sessionToken:token,moduleId:run.moduleId,version:1,mode:run.config.mode,status:'abandoned',score:0,at:Date.now(),actionHash:crc(JSON.stringify({config:run.config,actions:run.actions})),goods:{fish:0,meals:0,shipped:[],collectibles:[]},mealsUsed:state.mealsUsed,mealProofHash:proof?.actionHash??null};
  validateModuleResult(r);draft.modules.claims[run.id]=clone(r);draft.modules.results.push(clone(r));
 }
 const result=L.closeSession(draft,token);if(isModule)draft.modules.pending=null;return result;
});}
function prepareMealDiceDraft(s,a,b){
 check(s.board?.phase==='roll'&&!s.activeSession&&!s.economy.diceChoice,'当前不能使用料理，请先完成本回合或游戏。');check(int(a,1,6)&&int(b,1,6),'骰子数值无效。');
 const id='dice:'+uid(),delta=stock();delta.Masai.meal=-1;transaction(s,{id,type:'meal-consume',at:Date.now(),boardId:s.board.id,turnNo:s.board.turnNo,delta});
 s.economy.diceChoice={id,boardId:s.board.id,turnNo:s.board.turnNo,turn:s.board.turn,rolls:[a,b]};L.note(s,'使用一份 Masai 料理，本回合可在两个骰子结果中选择一个。');return clone(s.economy.diceChoice);
}
function prepareMealDice(s,a,b){return atomic(s,draft=>prepareMealDiceDraft(draft,a,b));}
function chooseMealDice(s,index){return atomic(s,draft=>{const c=draft.economy.diceChoice;check(c&&int(index,0,1)&&c.boardId===draft.board?.id&&c.turnNo===draft.board.turnNo&&c.turn===draft.board.turn,'骰子选择已失效。');L.roll(draft,c.rolls[index]);draft.economy.diceChoice=null;});}
function roll(s,d){return atomic(s,draft=>{check(!draft.economy.diceChoice,'请先选择已掷出的一个骰子。');return L.roll(draft,d);});}
function startBoard(s,n,names){return atomic(s,draft=>{check(!draft.economy.diceChoice,'请先完成料理骰子的选择。');return L.startBoard(draft,n,names);});}
function prepareImport(current,incoming){
 validate(current);const s=migrate(incoming).state;
 if(current.universeId===s.universeId){
  Object.assign(s.claims,current.claims);Object.assign(s.arcadeClaims,current.arcadeClaims);
  for(const r of s.gameResults.arcade){const old=current.arcadeClaims[r.roundId];check(!old||eq(old,r),'导入街机结果与本机凭证冲突。');}
  for(const [id,r] of Object.entries(current.modules.claims)){check(!s.modules.claims[id]||eq(s.modules.claims[id],r),'导入小游戏结果与本机凭证冲突。');s.modules.claims[id]=clone(r);}
  for(const [id,proof] of Object.entries(current.adventureMeals)){check(!s.adventureMeals[id]||eq(s.adventureMeals[id],proof),'导入的料理消费凭证与本机真实使用记录冲突。');s.adventureMeals[id]=clone(proof);}
  const left=current.economy.ledger,right=s.economy.ledger,min=Math.min(left.length,right.length);check(eq(left.slice(0,min),right.slice(0,min)),'两台设备的物资账本已经分叉，不能相加或自动覆盖。请先保留两个备份。');
  if(left.length>=right.length)s.economy=clone(current.economy);
  // A pending choice already consumed a meal. Keep it from the selected
  // authoritative ledger branch; dropping it would lose a paid advantage.
  // An already chosen local turn keeps its null choice and cannot use it twice.
  if(s.economy.diceChoice){const choice=s.economy.diceChoice;check(s.board?.phase==='roll'&&choice.boardId===s.board.id&&choice.turnNo===s.board.turnNo&&choice.turn===s.board.turn,'已使用料理的骰子选择还未完成，与备份棋盘回合不一致。请先在当前进度选好骰子，再导入；原存档和料理扣除记录均已保留。');}
  if(s.modules.pending&&s.modules.claims[s.modules.pending.id]){L.closeSession(s,s.activeSession.token);s.modules.pending=null;}
 }
 for(const r of Object.values(s.settlements.runs))if(r.status==='started'){r.status='invalidated';r.sessionToken=null;}
 if(s.activeSession)s.activeSession.runKey=null;return validate(s);
}
function pack(s){validate(s);const payload=JSON.stringify(s);check(payload.length<=MAX_PAYLOAD,'宇宙存档超过大小限制，请保留备份。');return{payload,checksum:crc(payload)};}
function unpack(p){check(obj(p)&&typeof p.payload==='string'&&p.payload.length<=MAX_PAYLOAD&&p.checksum===crc(p.payload),'存档校验失败，原档未覆盖。');const originalState=JSON.parse(p.payload);return{...migrate(originalState),originalState};}
function wrap(s,old){let previous=null;if(old){if(old.schemaVersion===SCHEMA)previous=pack(old);else{V4.migrate(old);const payload=JSON.stringify(old);check(payload.length<=MAX_PAYLOAD,'旧备份过大。');previous={payload,checksum:crc(payload)};}}return JSON.stringify({format:'LIANG_UNIVERSE',current:pack(s),previous});}
function unwrap(raw){check(typeof raw==='string'&&raw.length<=MAX_PAYLOAD*2+1000,'存档文件过大。');const w=JSON.parse(raw);check(w?.format==='LIANG_UNIVERSE','这不是梁家宇宙存档。');try{return{...unpack(w.current),recovered:false};}catch(e){if(e.code==='UNSUPPORTED_SCHEMA')throw e;if(w.previous)return{...unpack(w.previous),recovered:true};throw e;}}
function encode(s){const bytes=new TextEncoder().encode(JSON.stringify(pack(s)));let text='';for(let n=0;n<bytes.length;n+=8192)text+=String.fromCharCode(...bytes.subarray(n,n+8192));return'LU1.'+(typeof btoa==='function'?btoa(text):Buffer.from(text,'binary').toString('base64')).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
function decode(code){check(typeof code==='string'&&code.length<=MAX_PAYLOAD*6&&/^LU1\.[A-Za-z0-9_-]+$/.test(code),'迁移代码格式无效或过大。');let b=code.slice(4).replace(/-/g,'+').replace(/_/g,'/');b+='='.repeat((4-b.length%4)%4);const bin=typeof atob==='function'?atob(b):Buffer.from(b,'base64').toString('binary');return unpack(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(bin,c=>c.charCodeAt(0))))).state;}
// Preserve the verified legacy rules while preventing a late error in any
// public mutation from leaving half of a learning/arcade/board operation saved.
const legacyMutations=Object.fromEntries(['note','nextTurn','launch','launchArcade','recordArcadeResult','storeLegacy','beginRun','recordSubmission','changeCharacter','invalidateRun','reward'].map(name=>[name,(s,...args)=>atomic(s,draft=>L[name](draft,...args))]));
return{...L,...legacyMutations,SCHEMA,KEY,MAX_PAYLOAD,IDS,RESOURCE_IDS,ADVENTURE_IDS,fresh,validate,migrate,launchModule,updateModule,settleModule,prepareMealDice,chooseMealDice,roll,startBoard,closeSession,prepareImport,pack,wrap,unwrap,encode,decode};
});


;
/* v0.6 extends frozen v0.5 with platform play; v5 verifies all prior migrations. */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('./core-v5.js'),require('./legacy-core.js'),{fishing:require('./games/fishing.js'),kitchen:require('./games/kitchen.js'),trunk:require('./games/trunk.js'),dungeon:require('./games/dungeon.js'),kart:require('./games/kart.js'),platform:require('./games/platform.js')});
 else root.LiangCore=factory(root.LiangCore,root.LiangLegacyCore,root.LiangGames);
})(typeof globalThis!=='undefined'?globalThis:this,function(V5,L,G){
'use strict';
const SCHEMA=6,MAX_PAYLOAD=L.MAX_PAYLOAD,KEY=L.KEY,clone=L.clone,crc=L.crc,uid=L.uid;
const RESOURCE_IDS=['fishing','kitchen','trunk'],ADVENTURE_IDS=['dungeon','kart','platform'],IDS=[...RESOURCE_IDS,...ADVENTURE_IDS],ITEMS=['fish','meal'],REGIONS=['Rawang','Masai'],OLD=['slipper','ball','jar'];
const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b),obj=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
const int=(x,min=0,max=1e9)=>Number.isSafeInteger(x)&&x>=min&&x<=max;
const ident=x=>typeof x==='string'&&/^[A-Za-z0-9:_-]{1,140}$/.test(x);
function check(value,message){if(!value)throw Error(message);}
const stock=()=>({Rawang:{fish:0,meal:0},Masai:{fish:0,meal:0}});
const extra=()=>({adventureMeals:{}});
function engine(id){check(IDS.includes(id)&&G?.[id]?.version===1,'游戏组件未正确载入，请刷新后重试。');return G[id];}
function fresh(){return {...V5.fresh(),schemaVersion:SCHEMA,...extra()};}
function legacyProjection(s){const p=clone(s);p.schemaVersion=3;p.migrationArchive=null;if(p.activeSession?.gameId==='module')p.activeSession=null;return p;}
function validateModuleResult(r){
 check(obj(r)&&ident(r.runId)&&ident(r.sessionToken)&&IDS.includes(r.moduleId)&&r.version===1&&['practice','inventory'].includes(r.mode)&&['won','lost','abandoned'].includes(r.status)&&int(r.score)&&int(r.at,0,1e15)&&typeof r.actionHash==='string','游戏结算记录无效。');
 check(obj(r.goods)&&int(r.goods.fish,0,12)&&int(r.goods.meals,0,12)&&Array.isArray(r.goods.shipped)&&r.goods.shipped.length<=12&&r.goods.shipped.every(x=>obj(x)&&ident(x.id)&&ITEMS.includes(x.itemId)&&x.qty===1)&&new Set(r.goods.shipped.map(x=>x.id)).size===r.goods.shipped.length,'游戏物资凭证无效。');
 check(Array.isArray(r.goods.collectibles)&&r.goods.collectibles.length<=3&&r.goods.collectibles.every(x=>OLD.includes(x)),'河里旧物记录无效。');
 if(ADVENTURE_IDS.includes(r.moduleId)){
  check(r.goods.fish===0&&r.goods.meals===0&&!r.goods.shipped.length&&!r.goods.collectibles.length,'冒险与赛车只记录本局结果，不自动生产共享物资。');
  check(int(r.mealsUsed,0,1)&&(r.mode!=='practice'||r.mealsUsed===0)&&(r.mealsUsed===0?r.mealProofHash===null:typeof r.mealProofHash==='string'),'料理使用凭证无效。');
  if(r.discoveries!==undefined)check(r.moduleId==='dungeon'&&Array.isArray(r.discoveries)&&r.discoveries.length<=100&&r.discoveries.every(x=>typeof x==='string'&&x.length<=100),'本局发现记录无效。');
 }
 else if(r.mode==='practice'||r.status!=='won')check(r.goods.fish===0&&r.goods.meals===0&&!r.goods.shipped.length&&!r.goods.collectibles.length,'练习或未通关记录不能增加共享物资。');
 else if(r.moduleId==='fishing')check(r.goods.fish>0&&r.goods.meals===0&&!r.goods.shipped.length,'钓鱼只能产出鱼和确认过的旧物。');
 else if(r.moduleId==='kitchen')check(r.goods.fish===0&&int(r.goods.meals,1,3)&&!r.goods.shipped.length&&!r.goods.collectibles.length,'厨房只能加工料理，不能额外产生鱼或收藏。');
 else check(r.goods.fish===0&&r.goods.meals===0&&r.goods.shipped.length>0&&!r.goods.collectibles.length,'运输只能转移装车清单中的物资。');
}
function checkRunInventory(s,run){
 if(!run||run.config.mode!=='inventory')return;
 const available=s.economy.inventory.Rawang;
 if(run.moduleId==='kitchen')check(int(run.config.units,1,3)&&available.fish>=run.config.units,'这局厨房需要的鱼已被其他进度使用，不能恢复。请保留两个备份，并返回现有进度。');
 if(run.moduleId==='trunk'){
  const counts={fish:0,meal:0};for(const cargo of run.config.cargo)counts[cargo.itemId]+=cargo.qty;
  check(ITEMS.every(item=>available[item]>=counts[item]),'这局运输清单中的物资已被其他进度使用，不能恢复。请保留两个备份，并返回现有进度。');
 }
 if(ADVENTURE_IDS.includes(run.moduleId)&&run.config.mealCharges===1&&run.state.mealsUsed===0)check(s.economy.inventory.Masai.meal>=1,'这局尚未使用的可选料理已被其他进度消费，不能恢复旧选择。请保留两个备份，在现有进度选择不带料理的新一局。');
}
function replay(run,{onMealUse}={}){
 check(obj(run)&&ident(run.id)&&IDS.includes(run.moduleId)&&run.version===1&&obj(run.config)&&['practice','inventory'].includes(run.config.mode)&&int(run.config.seed,0,0xffffffff)&&int(run.config.difficulty,0,2)&&int(run.startedAt,0,1e15),'游戏开局资料无效。');
 check(Array.isArray(run.actions)&&run.actions.length<=20000&&JSON.stringify(run.actions).length<=1800000,'本局操作记录过大或损坏，请先导出备份。');
 const E=engine(run.moduleId),adventure=ADVENTURE_IDS.includes(run.moduleId);let state=E.create(clone(run.config));
 if(adventure)check(int(run.config.mealCharges,0,1)&&(run.config.mode!=='practice'||run.config.mealCharges===0)&&state.mealsUsed===0,'新游戏料理配置无效。');
 for(let index=0;index<run.actions.length;index++){const action=run.actions[index];check(obj(action)&&JSON.stringify(action).length<=2000,'游戏操作记录无效。');const before=state.mealsUsed;state=E.step(state,clone(action));if(adventure){check(int(state.mealsUsed,0,run.config.mealCharges)&&state.mealsUsed>=before&&(state.mealsUsed===before||action.type==='use-meal'&&before===0&&state.mealsUsed===1),'料理必须由真实生效的使用操作产生，不能回退或重复使用。');if(state.mealsUsed!==before)onMealUse?.(index,clone(state));}}
 E.validate(state);check(eq(state,run.state),'游戏进度与实际操作记录不一致。');return state;
}
// Old consumption prefixes never change. Retain only exact, fully verified
// serialized prefixes, bounded by one maximum save payload. New/edited bytes
// and changed engine functions must replay again; no balances or claims cache.
const MAX_REPLAY_CACHE_UNITS=MAX_PAYLOAD,mealReplayCache=new Map();let mealReplayUnits=0;
function validateMealPrefix(run){
 const serialized=JSON.stringify(run),E=engine(run.moduleId),prior=mealReplayCache.get(serialized);
 if(prior&&prior.create===E.create&&prior.step===E.step&&prior.validate===E.validate){mealReplayCache.delete(serialized);mealReplayCache.set(serialized,prior);return;}
 let useIndex=-1;const state=replay(run,{onMealUse:index=>{useIndex=index;}});check(state.mealsUsed===1&&useIndex===run.actions.length-1,'料理消费缺少首次真实生效的操作前缀。');
 if(prior){mealReplayCache.delete(serialized);mealReplayUnits-=serialized.length;}
 if(serialized.length>MAX_REPLAY_CACHE_UNITS)return;
 while(mealReplayUnits+serialized.length>MAX_REPLAY_CACHE_UNITS){const oldest=mealReplayCache.keys().next().value;mealReplayCache.delete(oldest);mealReplayUnits-=oldest.length;}
 mealReplayCache.set(serialized,{create:E.create,step:E.step,validate:E.validate});mealReplayUnits+=serialized.length;
}
function validate(s){
 check(obj(s),'存档结构无效。');if(s.schemaVersion!==SCHEMA){const e=Error('请先迁移旧版存档，未覆盖现有资料。');e.code='UNSUPPORTED_SCHEMA';throw e;}
 L.validate(legacyProjection(s));
 if(s.migrationArchive!==null){const a=s.migrationArchive;check(obj(a)&&[1,2,3,4,5].includes(a.schemaVersion)&&typeof a.payload==='string'&&a.payload.length<=MAX_PAYLOAD&&a.checksum===crc(a.payload),'升级前备份校验失败。');const old=JSON.parse(a.payload);check(old.schemaVersion===a.schemaVersion,'升级前备份版本不一致。');V5.migrate(old);}
 check(obj(s.modules)&&obj(s.modules.claims)&&Array.isArray(s.modules.results),'小游戏记录缺失。');
 for(const [id,r] of Object.entries(s.modules.claims)){validateModuleResult(r);check(id===r.runId,'小游戏凭证编号不一致。');}
 check(new Set(Object.values(s.modules.claims).map(r=>r.sessionToken)).size===Object.keys(s.modules.claims).length,'同一个小游戏会话不能有两份结算凭证。');
 check(new Set(s.modules.results.map(r=>r.runId)).size===s.modules.results.length,'小游戏结果重复。');
 for(const r of s.modules.results){validateModuleResult(r);check(eq(r,s.modules.claims[r.runId]),'小游戏结果与凭证不一致。');}
 if(s.modules.pending){const run=s.modules.pending;replay(run);check(!s.modules.claims[run.id],'已结算游戏不能再作为未完成局。');const a=s.activeSession;check(a?.gameId==='module'&&a.moduleId===run.moduleId&&a.runId===run.id&&a.token===run.sessionToken,'未完成游戏与会话不一致。');}
 if(s.activeSession?.gameId==='module'){
  const a=s.activeSession;check(s.modules.pending&&ident(a.token)&&int(a.learnerSlot,0,2)&&a.runKey===null&&a.returnSnapshotHash===crc(JSON.stringify(a.returnSnapshot))&&eq(a.returnSnapshot,s.board)&&a.boardId===(s.board?.id||'')&&a.turnNo===(s.board?.turnNo||0),'小游戏返回位置或回合损坏。');
 }
 check(obj(s.adventureMeals),'冒险料理消费凭证缺失。');
 for(const [id,proof] of Object.entries(s.adventureMeals)){
  check(obj(proof)&&proof.run?.id===id&&ADVENTURE_IDS.includes(proof.run.moduleId)&&proof.run.config?.mode==='inventory'&&proof.run.config.mealCharges===1&&int(proof.at,0,1e15)&&proof.transactionId==='adventure-meal:'+id&&proof.actionHash===crc(JSON.stringify({config:proof.run.config,actions:proof.run.actions})),'冒险料理消费来源无效。');
  validateMealPrefix(proof.run);
  const pending=s.modules.pending?.id===id?s.modules.pending:null,claim=s.modules.claims[id];
  check(pending||claim,'料理已经扣除，但找不到本局进度或结束凭证。');
  if(pending)check(pending.sessionToken===proof.run.sessionToken&&pending.state.mealsUsed===1&&eq(pending.config,proof.run.config)&&eq(pending.actions.slice(0,proof.run.actions.length),proof.run.actions),'导入的旧进度早于已经使用的料理。请保留原档，使用较新的完整备份继续。');
  if(claim)check(claim.moduleId===proof.run.moduleId&&claim.sessionToken===proof.run.sessionToken&&claim.mealsUsed===1&&claim.mealProofHash===proof.actionHash,'已结束游戏与料理消费来源不一致。');
 }
 for(const r of Object.values(s.modules.claims))if(ADVENTURE_IDS.includes(r.moduleId))check(!!s.adventureMeals[r.runId]===(r.mealsUsed===1),'游戏料理结果与消费凭证不一致。');
 if(s.modules.pending&&ADVENTURE_IDS.includes(s.modules.pending.moduleId))check(!!s.adventureMeals[s.modules.pending.id]===(s.modules.pending.state.mealsUsed===1),'游戏已使用料理，缺少原子消费凭证。');
 const e=s.economy;check(obj(e)&&e.version===1&&obj(e.inventory)&&Array.isArray(e.ledger)&&Array.isArray(e.riverCollection),'物资账本缺失。');
 check(new Set(e.ledger.map(t=>t.id)).size===e.ledger.length,'物资交易重复。');let expected=stock();const collection=new Set();
 for(const t of e.ledger){
  check(obj(t)&&ident(t.id)&&int(t.at,0,1e15)&&['fish-production','fish-cooking','cargo-transfer','meal-consume','adventure-meal-consume'].includes(t.type)&&obj(t.delta),'物资交易格式无效。');
  for(const zone of REGIONS)for(const item of ITEMS){check(obj(t.delta[zone])&&int(t.delta[zone][item],-12,12),'物资变化数量无效。');expected[zone][item]+=t.delta[zone][item];check(int(expected[zone][item],0,1e8),'物资不足或账本超出限制。');}
  const r=t.delta.Rawang,m=t.delta.Masai;
  if(t.type==='adventure-meal-consume'){
   const proof=s.adventureMeals[t.runId];check(proof&&t.id===proof.transactionId&&t.sessionToken===proof.run.sessionToken&&t.moduleId===proof.run.moduleId&&t.actionHash===proof.actionHash&&t.at===proof.at&&r.fish===0&&r.meal===0&&m.fish===0&&m.meal===-1,'冒险料理消费流水与真实操作不一致。');
  }
  else if(t.type==='meal-consume')check(r.fish===0&&r.meal===0&&m.fish===0&&m.meal===-1&&typeof t.boardId==='string'&&int(t.turnNo,1),'料理消费记录无效。');
  else{
   const claim=s.modules.claims[t.runId];check(claim?.mode==='inventory'&&claim.status==='won'&&t.id==='module:'+claim.runId&&t.actionHash===claim.actionHash,'物资没有对应的真实游戏结算。');
   if(t.type==='fish-production'){check(claim.moduleId==='fishing'&&r.fish===claim.goods.fish&&r.fish>0&&r.meal===0&&m.fish===0&&m.meal===0,'钓鱼产出不守恒。');for(const id of claim.goods.collectibles)collection.add(id);}
   if(t.type==='fish-cooking')check(claim.moduleId==='kitchen'&&r.fish===-claim.goods.meals&&r.meal===claim.goods.meals&&r.meal>0&&m.fish===0&&m.meal===0,'料理加工不守恒。');
   if(t.type==='cargo-transfer'){const counts={fish:0,meal:0};for(const cargo of claim.goods.shipped)counts[cargo.itemId]++;check(claim.moduleId==='trunk'&&counts.fish+counts.meal>0&&r.fish===-counts.fish&&r.meal===-counts.meal&&m.fish===counts.fish&&m.meal===counts.meal,'运输必须等量转移真实物资。');}
  }
 }
 for(const zone of REGIONS)for(const item of ITEMS)check(obj(e.inventory[zone])&&e.inventory[zone][item]===expected[zone][item],'库存与物资流水不一致。');
 for(const r of Object.values(s.modules.claims))if(RESOURCE_IDS.includes(r.moduleId)&&r.mode==='inventory'&&r.status==='won')check(e.ledger.some(t=>t.id==='module:'+r.runId&&t.runId===r.runId),'已发放的物资凭证缺少对应流水，不能覆盖原档。');
 for(const proof of Object.values(s.adventureMeals))check(e.ledger.some(t=>t.id===proof.transactionId&&t.type==='adventure-meal-consume'),'已扣除料理的操作凭证缺少消费流水。');
 check(e.riverCollection.every(x=>OLD.includes(x))&&new Set(e.riverCollection).size===e.riverCollection.length&&eq([...collection].sort(),e.riverCollection.slice().sort()),'河里旧物收藏与来源不一致。');
 checkRunInventory(s,s.modules.pending);
 if(e.diceChoice){const c=e.diceChoice;check(obj(c)&&ident(c.id)&&e.ledger.some(t=>t.id===c.id&&t.type==='meal-consume')&&s.board?.phase==='roll'&&c.boardId===s.board.id&&c.turnNo===s.board.turnNo&&c.turn===s.board.turn&&Array.isArray(c.rolls)&&c.rolls.length===2&&c.rolls.every(x=>int(x,1,6)),'料理骰子选择记录无效。');}
 return clone(s);
}
// A rejected action must leave the caller's live save untouched. Validate and
// finish all work on a detached draft before publishing any claim or inventory.
function atomic(s,operation){const draft=validate(s),result=operation(draft);validate(draft);Object.assign(s,draft);return result;}
function migrate(input){
 if(input?.schemaVersion===SCHEMA)return{state:validate(input),migrated:false,fromVersion:SCHEMA,toVersion:SCHEMA};
 const old=V5.migrate(input).state,payload=JSON.stringify(input);check(payload.length<=MAX_PAYLOAD,'升级前备份超过大小限制，原档保留。');
 const state={...old,schemaVersion:SCHEMA,migrationArchive:{schemaVersion:input.schemaVersion,payload,checksum:crc(payload)}};
 state.migrations.push({from:input.schemaVersion,to:SCHEMA,at:Date.now(),note:'保留完整旧档、未完成游戏与全部资源流水；保留既有料理凭证，接入三小瓜基础篇，不补发历史奖励。'});
 return{state:validate(state),migrated:true,fromVersion:input.schemaVersion,toVersion:SCHEMA};
}
function launchModuleDraft(s,id,options={}){
 check(obj(options),'游戏模式配置无效。');
 check(!s.activeSession&&!s.modules.pending,'请先继续或结束尚未完成的一局。');check(!s.economy.diceChoice,'请先选好本回合的骰子。');const E=engine(id);
 const mode=options.mode??'practice',difficulty=options.difficulty??0;check(['practice','inventory'].includes(mode)&&int(difficulty,0,2),'游戏模式无效。');
 const seed=parseInt(crc(uid()),16)>>>0,config={seed,mode,difficulty};
 if(ADVENTURE_IDS.includes(id)){
  const charges=options.mealCharges??0;check(int(charges,0,1)&&(mode!=='practice'||charges===0),'每局最多选择一份料理，练习关不使用仓库物资。');
  check(charges===0||s.economy.inventory.Masai.meal>=1,'Masai 没有料理，可不带料理开始，或先从 Rawang 运一份过来。');config.mealCharges=charges;
  if(id==='kart'&&options.trackId!==undefined){check(['masai-market','north-south'].includes(options.trackId),'赛道尚未接入。');config.trackId=options.trackId;}
 }
 if(id==='kitchen'){const units=options.units??3;check(int(units,1,3),'每局请选择一至三份料理。');config.units=mode==='practice'?units:Math.min(units,s.economy.inventory.Rawang.fish);check(config.units>0,'Rawang 还没有鱼。可以先玩练习关，或去河边钓鱼。');}
 if(id==='trunk'&&mode==='inventory'){
  config.cargo=[];const amounts=options.cargo??s.economy.inventory.Rawang;check(obj(amounts),'装箱数量清单无效。');
  for(const item of ['meal','fish']){check(int(amounts[item]??0,0,s.economy.inventory.Rawang[item]),'装箱数量超过 Rawang 库存。');const count=Math.min(amounts[item]??0,12-config.cargo.length);for(let n=0;n<count;n++)config.cargo.push({id:item+'-'+(n+1),itemId:item,qty:1});}
  check(config.cargo.length>0,'Rawang 暂无可运物资。可以先玩装箱练习。');
 }
 const initial=E.create(clone(config));E.validate(initial);
 const token=uid(),runId=uid(),slot=s.board?.players[s.board.turn].learnerSlot??0;
 s.activeSession={gameId:'module',moduleId:id,runId,token,learnerSlot:slot,boardId:s.board?.id||'',turnNo:s.board?.turnNo||0,returnSnapshot:clone(s.board),returnSnapshotHash:crc(JSON.stringify(s.board)),runKey:null};
 s.modules.pending={id:runId,sessionToken:token,moduleId:id,version:E.version,config,startedAt:Date.now(),actions:[],state:initial};
 L.note(s,'进入'+E.title+(mode==='practice'?' · 练习关':' · 联动物资关'));return clone(s.activeSession);
}
function launchModule(s,id,options={}){return atomic(s,draft=>launchModuleDraft(draft,id,options));}
function updateModuleDraft(s,token,actions,state){
 const run=s.modules.pending;check(s.activeSession?.token===token&&s.activeSession.gameId==='module'&&run,'游戏会话已改变。');
 check(eq(s.activeSession.returnSnapshot,s.board)&&s.activeSession.returnSnapshotHash===crc(JSON.stringify(s.board)),'棋盘位置或回合已改变，未覆盖本局进度。');
 checkRunInventory(s,run);
 check(Array.isArray(actions)&&actions.length>=run.actions.length&&eq(actions.slice(0,run.actions.length),run.actions),'游戏进度不能倒退或替换已保存操作。');
 const next={...run,actions:clone(actions),state:clone(state)};let use=null;replay(next,{onMealUse:(index,usedState)=>{use={index,state:usedState};}});s.modules.pending=next;
 if(ADVENTURE_IDS.includes(run.moduleId)&&next.state.mealsUsed===1&&!s.adventureMeals[run.id]){
  check(run.config.mode==='inventory'&&run.config.mealCharges===1&&use,'没有可用料理，未扣除任何库存。');
  const proofRun={...clone(next),actions:clone(next.actions.slice(0,use.index+1)),state:use.state},at=Date.now(),actionHash=crc(JSON.stringify({config:proofRun.config,actions:proofRun.actions})),transactionId='adventure-meal:'+run.id,delta=stock();delta.Masai.meal=-1;
  transaction(s,{id:transactionId,type:'adventure-meal-consume',at,runId:run.id,sessionToken:token,moduleId:run.moduleId,actionHash,delta});
  s.adventureMeals[run.id]={run:proofRun,at,actionHash,transactionId};
 }
 return{saved:true,mealsUsed:next.state.mealsUsed??0};
}
function updateModule(s,token,actions,state){return atomic(s,draft=>updateModuleDraft(draft,token,actions,state));}
function transaction(s,t){
 check(!s.economy.ledger.some(x=>x.id===t.id),'此物资交易已经结算。');
 const nextInventory=clone(s.economy.inventory);
 for(const zone of REGIONS)for(const item of ITEMS){check(obj(t.delta?.[zone])&&int(t.delta[zone][item],-12,12),'物资交易数量无效。');const next=nextInventory[zone][item]+t.delta[zone][item];check(int(next,0,1e8),'物资不足，未扣除也未发放，请保留存档。');nextInventory[zone][item]=next;}
 s.economy.inventory=nextInventory;s.economy.ledger.push(clone(t));
}
function settleModuleDraft(s,token){
 const already=Object.values(s.modules.claims).find(r=>r.sessionToken===token);if(already)return{duplicate:true,result:clone(already)};
 check(s.activeSession?.token===token&&s.activeSession.gameId==='module'&&s.modules.pending,'没有可结算的小游戏。');
 const run=s.modules.pending,state=replay(run),outcome=engine(run.moduleId).result(state);
 check(outcome&&['won','lost'].includes(outcome.status)&&int(outcome.score),'游戏尚未完成，不能结算。');
 const goods={fish:0,meals:0,shipped:[],collectibles:[]};
 if(run.config.mode==='inventory'&&outcome.status==='won'){
  if(run.moduleId==='fishing'){check(int(outcome.fish,1,12)&&Array.isArray(outcome.collectibles)&&outcome.collectibles.every(id=>OLD.includes(id)),'钓鱼结果无效。');goods.fish=outcome.fish;goods.collectibles=clone(outcome.collectibles);}
  if(run.moduleId==='kitchen'){check(int(outcome.meals,1,run.config.units),'料理数量无效。');goods.meals=outcome.meals;}
  if(run.moduleId==='trunk'){check(Array.isArray(outcome.shipped)&&outcome.shipped.length>0&&new Set(outcome.shipped.map(x=>x.id)).size===outcome.shipped.length&&outcome.shipped.every(x=>run.config.cargo.some(c=>eq(c,x))),'运输清单不是开局时的真实物资。');goods.shipped=clone(outcome.shipped);}
 }
 const r={runId:run.id,sessionToken:token,moduleId:run.moduleId,version:1,mode:run.config.mode,status:outcome.status,score:outcome.score,at:Date.now(),actionHash:crc(JSON.stringify({config:run.config,actions:run.actions})),goods};
 if(ADVENTURE_IDS.includes(run.moduleId)){
  check(int(outcome.mealsUsed,0,1)&&outcome.mealsUsed===state.mealsUsed,'本局料理使用结果无效。');r.mealsUsed=state.mealsUsed;r.mealProofHash=s.adventureMeals[run.id]?.actionHash??null;
  if(run.moduleId==='dungeon'&&outcome.discoveries!==undefined)r.discoveries=clone(outcome.discoveries);
 }
 validateModuleResult(r);s.modules.claims[r.runId]=clone(r);s.modules.results.push(clone(r));
 if(RESOURCE_IDS.includes(run.moduleId)&&r.status==='won'&&r.mode==='inventory'){
  const delta=stock(),type=run.moduleId==='fishing'?'fish-production':run.moduleId==='kitchen'?'fish-cooking':'cargo-transfer';
  if(type==='fish-production'){delta.Rawang.fish=goods.fish;for(const id of goods.collectibles)if(!s.economy.riverCollection.includes(id))s.economy.riverCollection.push(id);}
  if(type==='fish-cooking'){delta.Rawang.fish=-goods.meals;delta.Rawang.meal=goods.meals;}
  if(type==='cargo-transfer')for(const c of goods.shipped){delta.Rawang[c.itemId]-=c.qty;delta.Masai[c.itemId]+=c.qty;}
  transaction(s,{id:'module:'+r.runId,type,at:r.at,runId:r.runId,actionHash:r.actionHash,delta});
 }
 L.closeSession(s,token);s.modules.pending=null;L.note(s,engine(run.moduleId).title+'：'+(r.status==='won'?'通关':'本局结束')+'，'+r.score+'分。'+(r.mode==='practice'?'练习成绩已记录，不改变物资。':'物资与游戏结果已分别保存。'));
 return{duplicate:false,result:clone(r)};
}
function settleModule(s,token){return atomic(s,draft=>settleModuleDraft(draft,token));}
function closeSession(s,token){return atomic(s,draft=>{
 const isModule=draft.activeSession?.gameId==='module',run=isModule?draft.modules.pending:null;
 if(run&&ADVENTURE_IDS.includes(run.moduleId)){
  check(draft.activeSession.token===token,'过期游戏会话。');const state=replay(run),proof=draft.adventureMeals[run.id];
  const r={runId:run.id,sessionToken:token,moduleId:run.moduleId,version:1,mode:run.config.mode,status:'abandoned',score:0,at:Date.now(),actionHash:crc(JSON.stringify({config:run.config,actions:run.actions})),goods:{fish:0,meals:0,shipped:[],collectibles:[]},mealsUsed:state.mealsUsed,mealProofHash:proof?.actionHash??null};
  validateModuleResult(r);draft.modules.claims[run.id]=clone(r);draft.modules.results.push(clone(r));
 }
 const result=L.closeSession(draft,token);if(isModule)draft.modules.pending=null;return result;
});}
function prepareMealDiceDraft(s,a,b){
 check(s.board?.phase==='roll'&&!s.activeSession&&!s.economy.diceChoice,'当前不能使用料理，请先完成本回合或游戏。');check(int(a,1,6)&&int(b,1,6),'骰子数值无效。');
 const id='dice:'+uid(),delta=stock();delta.Masai.meal=-1;transaction(s,{id,type:'meal-consume',at:Date.now(),boardId:s.board.id,turnNo:s.board.turnNo,delta});
 s.economy.diceChoice={id,boardId:s.board.id,turnNo:s.board.turnNo,turn:s.board.turn,rolls:[a,b]};L.note(s,'使用一份 Masai 料理，本回合可在两个骰子结果中选择一个。');return clone(s.economy.diceChoice);
}
function prepareMealDice(s,a,b){return atomic(s,draft=>prepareMealDiceDraft(draft,a,b));}
function chooseMealDice(s,index){return atomic(s,draft=>{const c=draft.economy.diceChoice;check(c&&int(index,0,1)&&c.boardId===draft.board?.id&&c.turnNo===draft.board.turnNo&&c.turn===draft.board.turn,'骰子选择已失效。');L.roll(draft,c.rolls[index]);draft.economy.diceChoice=null;});}
function roll(s,d){return atomic(s,draft=>{check(!draft.economy.diceChoice,'请先选择已掷出的一个骰子。');return L.roll(draft,d);});}
function startBoard(s,n,names){return atomic(s,draft=>{check(!draft.economy.diceChoice,'请先完成料理骰子的选择。');return L.startBoard(draft,n,names);});}
function prepareImport(current,incoming){
 validate(current);const s=migrate(incoming).state;
 if(current.universeId===s.universeId){
  Object.assign(s.claims,current.claims);Object.assign(s.arcadeClaims,current.arcadeClaims);
  for(const r of s.gameResults.arcade){const old=current.arcadeClaims[r.roundId];check(!old||eq(old,r),'导入街机结果与本机凭证冲突。');}
  for(const [id,r] of Object.entries(current.modules.claims)){check(!s.modules.claims[id]||eq(s.modules.claims[id],r),'导入小游戏结果与本机凭证冲突。');s.modules.claims[id]=clone(r);}
  for(const [id,proof] of Object.entries(current.adventureMeals)){
   const incomingProof=s.adventureMeals[id];
   if(incomingProof&&!eq(incomingProof,proof)){
    // A failed acknowledgement may leave the caller exporting the same real
    // first-use prefix with a newly generated timestamp. Keep the persisted
    // timestamp only when every other proof and ledger byte still agrees.
    // Different actions, sessions, results or resource branches remain errors.
    check(eq({...incomingProof,at:proof.at},proof),'导入的料理消费凭证与本机真实使用记录冲突。');
    const localEntry=current.economy.ledger.find(t=>t.id===proof.transactionId),incomingEntry=s.economy.ledger.find(t=>t.id===proof.transactionId);
    check(localEntry&&incomingEntry&&eq({...incomingEntry,at:localEntry.at},localEntry),'导入的料理消费流水与本机真实使用记录冲突。');
    incomingEntry.at=localEntry.at;
   }
   s.adventureMeals[id]=clone(proof);
  }
  const left=current.economy.ledger,right=s.economy.ledger,min=Math.min(left.length,right.length);check(eq(left.slice(0,min),right.slice(0,min)),'两台设备的物资账本已经分叉，不能相加或自动覆盖。请先保留两个备份。');
  if(left.length>=right.length)s.economy=clone(current.economy);
  // A pending choice already consumed a meal. Keep it from the selected
  // authoritative ledger branch; dropping it would lose a paid advantage.
  // An already chosen local turn keeps its null choice and cannot use it twice.
  if(s.economy.diceChoice){const choice=s.economy.diceChoice;check(s.board?.phase==='roll'&&choice.boardId===s.board.id&&choice.turnNo===s.board.turnNo&&choice.turn===s.board.turn,'已使用料理的骰子选择还未完成，与备份棋盘回合不一致。请先在当前进度选好骰子，再导入；原存档和料理扣除记录均已保留。');}
  if(s.modules.pending&&s.modules.claims[s.modules.pending.id]){L.closeSession(s,s.activeSession.token);s.modules.pending=null;}
 }
 for(const r of Object.values(s.settlements.runs))if(r.status==='started'){r.status='invalidated';r.sessionToken=null;}
 if(s.activeSession)s.activeSession.runKey=null;return validate(s);
}
function pack(s){validate(s);const payload=JSON.stringify(s);check(payload.length<=MAX_PAYLOAD,'宇宙存档超过大小限制，请保留备份。');return{payload,checksum:crc(payload)};}
function unpack(p){check(obj(p)&&typeof p.payload==='string'&&p.payload.length<=MAX_PAYLOAD&&p.checksum===crc(p.payload),'存档校验失败，原档未覆盖。');const originalState=JSON.parse(p.payload);return{...migrate(originalState),originalState};}
function wrap(s,old){let previous=null;if(old){if(old.schemaVersion===SCHEMA)previous=pack(old);else{V5.migrate(old);const payload=JSON.stringify(old);check(payload.length<=MAX_PAYLOAD,'旧备份过大。');previous={payload,checksum:crc(payload)};}}return JSON.stringify({format:'LIANG_UNIVERSE',current:pack(s),previous});}
function unwrap(raw){check(typeof raw==='string'&&raw.length<=MAX_PAYLOAD*2+1000,'存档文件过大。');const w=JSON.parse(raw);check(w?.format==='LIANG_UNIVERSE','这不是梁家宇宙存档。');try{return{...unpack(w.current),recovered:false};}catch(e){if(e.code==='UNSUPPORTED_SCHEMA')throw e;if(w.previous)return{...unpack(w.previous),recovered:true};throw e;}}
function encode(s){const bytes=new TextEncoder().encode(JSON.stringify(pack(s)));let text='';for(let n=0;n<bytes.length;n+=8192)text+=String.fromCharCode(...bytes.subarray(n,n+8192));return'LU1.'+(typeof btoa==='function'?btoa(text):Buffer.from(text,'binary').toString('base64')).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
function decode(code){check(typeof code==='string'&&code.length<=MAX_PAYLOAD*6&&/^LU1\.[A-Za-z0-9_-]+$/.test(code),'迁移代码格式无效或过大。');let b=code.slice(4).replace(/-/g,'+').replace(/_/g,'/');b+='='.repeat((4-b.length%4)%4);const bin=typeof atob==='function'?atob(b):Buffer.from(b,'base64').toString('binary');return unpack(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(bin,c=>c.charCodeAt(0))))).state;}
// Preserve the verified legacy rules while preventing a late error in any
// public mutation from leaving half of a learning/arcade/board operation saved.
const legacyMutations=Object.fromEntries(['note','nextTurn','launch','launchArcade','recordArcadeResult','storeLegacy','beginRun','recordSubmission','changeCharacter','invalidateRun','reward'].map(name=>[name,(s,...args)=>atomic(s,draft=>L[name](draft,...args))]));
return{...L,...legacyMutations,SCHEMA,KEY,MAX_PAYLOAD,IDS,RESOURCE_IDS,ADVENTURE_IDS,fresh,validate,migrate,launchModule,updateModule,settleModule,prepareMealDice,chooseMealDice,roll,startBoard,closeSession,prepareImport,pack,wrap,unwrap,encode,decode};
});



;
/* v0.7: immutable compressed tick records; frozen v6 verifies old save archives. */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('./core-v6.js'),require('./legacy-core.js'),{fishing:require('./games/fishing.js'),kitchen:require('./games/kitchen.js'),trunk:require('./games/trunk.js'),dungeon:require('./games/dungeon.js'),kart:require('./games/kart.js'),platform:require('./games/platform.js')});
 else root.LiangCore=factory(root.LiangCore,root.LiangLegacyCore,root.LiangGames);
})(typeof globalThis!=='undefined'?globalThis:this,function(V6,L,G){
'use strict';
const SCHEMA=7,MAX_PAYLOAD=L.MAX_PAYLOAD,KEY=L.KEY,clone=L.clone,crc=L.crc,uid=L.uid;
const RESOURCE_IDS=['fishing','kitchen','trunk'],ADVENTURE_IDS=['dungeon','kart','platform'],IDS=[...RESOURCE_IDS,...ADVENTURE_IDS],ITEMS=['fish','meal'],REGIONS=['Rawang','Masai'],OLD=['slipper','ball','jar'];
const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b),obj=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
const int=(x,min=0,max=1e9)=>Number.isSafeInteger(x)&&x>=min&&x<=max;
const ident=x=>typeof x==='string'&&/^[A-Za-z0-9:_-]{1,140}$/.test(x);
function check(value,message){if(!value)throw Error(message);}
const stock=()=>({Rawang:{fish:0,meal:0},Masai:{fish:0,meal:0}});
const extra=()=>({adventureMeals:{}});
function engine(id){check(IDS.includes(id)&&G?.[id]?.version===1,'游戏组件未正确载入，请刷新后重试。');return G[id];}
function fresh(){return {...V6.fresh(),schemaVersion:SCHEMA,...extra()};}
function legacyProjection(s){const p=clone(s);p.schemaVersion=3;p.migrationArchive=null;if(p.activeSession?.gameId==='module')p.activeSession=null;return p;}
function validateModuleResult(r){
 check(obj(r)&&ident(r.runId)&&ident(r.sessionToken)&&IDS.includes(r.moduleId)&&r.version===1&&['practice','inventory'].includes(r.mode)&&['won','lost','abandoned'].includes(r.status)&&int(r.score)&&int(r.at,0,1e15)&&typeof r.actionHash==='string','游戏结算记录无效。');
 check(obj(r.goods)&&int(r.goods.fish,0,12)&&int(r.goods.meals,0,12)&&Array.isArray(r.goods.shipped)&&r.goods.shipped.length<=12&&r.goods.shipped.every(x=>obj(x)&&ident(x.id)&&ITEMS.includes(x.itemId)&&x.qty===1)&&new Set(r.goods.shipped.map(x=>x.id)).size===r.goods.shipped.length,'游戏物资凭证无效。');
 check(Array.isArray(r.goods.collectibles)&&r.goods.collectibles.length<=3&&r.goods.collectibles.every(x=>OLD.includes(x)),'河里旧物记录无效。');
 if(ADVENTURE_IDS.includes(r.moduleId)){
  check(r.goods.fish===0&&r.goods.meals===0&&!r.goods.shipped.length&&!r.goods.collectibles.length,'冒险与赛车只记录本局结果，不自动生产共享物资。');
  check(int(r.mealsUsed,0,1)&&(r.mode!=='practice'||r.mealsUsed===0)&&(r.mealsUsed===0?r.mealProofHash===null:typeof r.mealProofHash==='string'),'料理使用凭证无效。');
  if(r.discoveries!==undefined)check(r.moduleId==='dungeon'&&Array.isArray(r.discoveries)&&r.discoveries.length<=100&&r.discoveries.every(x=>typeof x==='string'&&x.length<=100),'本局发现记录无效。');
 }
 else if(r.mode==='practice'||r.status!=='won')check(r.goods.fish===0&&r.goods.meals===0&&!r.goods.shipped.length&&!r.goods.collectibles.length,'练习或未通关记录不能增加共享物资。');
 else if(r.moduleId==='fishing')check(r.goods.fish>0&&r.goods.meals===0&&!r.goods.shipped.length,'钓鱼只能产出鱼和确认过的旧物。');
 else if(r.moduleId==='kitchen')check(r.goods.fish===0&&int(r.goods.meals,1,3)&&!r.goods.shipped.length&&!r.goods.collectibles.length,'厨房只能加工料理，不能额外产生鱼或收藏。');
 else check(r.goods.fish===0&&r.goods.meals===0&&r.goods.shipped.length>0&&!r.goods.collectibles.length,'运输只能转移装车清单中的物资。');
}
function checkRunInventory(s,run){
 if(!run||run.config.mode!=='inventory')return;
 const available=s.economy.inventory.Rawang;
 if(run.moduleId==='kitchen')check(int(run.config.units,1,3)&&available.fish>=run.config.units,'这局厨房需要的鱼已被其他进度使用，不能恢复。请保留两个备份，并返回现有进度。');
 if(run.moduleId==='trunk'){
  const counts={fish:0,meal:0};for(const cargo of run.config.cargo)counts[cargo.itemId]+=cargo.qty;
  check(ITEMS.every(item=>available[item]>=counts[item]),'这局运输清单中的物资已被其他进度使用，不能恢复。请保留两个备份，并返回现有进度。');
 }
 if(ADVENTURE_IDS.includes(run.moduleId)&&run.config.mealCharges===1&&run.state.mealsUsed===0)check(s.economy.inventory.Masai.meal>=1,'这局尚未使用的可选料理已被其他进度消费，不能恢复旧选择。请保留两个备份，在现有进度选择不带料理的新一局。');
}
// Capacity is checked before replay. No expanded transcript is allocated.
const TRANSCRIPT_LIMITS=Object.freeze({maxRecords:20000,maxBytes:1800000,maxSteps:300000,maxTicksPerRun:100});
function logLimit(ok){if(!ok){const e=Error('本局记录已接近容量上限。当前进度仍可保存和导出，请先返回棋盘。');e.code='MODULE_LOG_LIMIT';throw e;}}
function canonicalTick(a){return obj(a)&&a.type==='tick'&&int(a.dt,1,250)&&JSON.stringify(a)===JSON.stringify({type:'tick',dt:a.dt});}
function recordInfo(a){
 check(obj(a)&&typeof a.type==='string'&&JSON.stringify(a).length<=2000,'游戏操作记录无效。');
 if(a.type==='tick-run'){check(Object.keys(a).sort().join(',')==='count,dt,type'&&Object.hasOwn(a,'type')&&int(a.dt,1,250)&&int(a.count,2,TRANSCRIPT_LIMITS.maxTicksPerRun),'连续计时记录无效。');return{steps:a.count,atom:JSON.stringify({type:'tick',dt:a.dt}),tick:true};}
 return{steps:1,atom:JSON.stringify(a),tick:canonicalTick(a)};
}
function actionStats(actions){
 check(Array.isArray(actions),'游戏操作记录无效。');logLimit(actions.length<=TRANSCRIPT_LIMITS.maxRecords);
 let steps=0,bytes=2;for(let i=0;i<actions.length;i++){const info=recordInfo(actions[i]);steps+=info.steps;bytes+=JSON.stringify(actions[i]).length+(i?1:0);logLimit(steps<=TRANSCRIPT_LIMITS.maxSteps&&bytes<=TRANSCRIPT_LIMITS.maxBytes);}
 return{records:actions.length,steps,bytes};
}
function appendAction(actions,action,sealedLength=actions.length){
 const stats=actionStats(actions);check(int(sealedLength,0,actions.length),'已封存的操作边界无效。');recordInfo(action);check(action.type!=='tick-run','输入必须是单步操作，连续计时由记录器生成。');
 const next=actions.slice(),last=actions.at(-1);let replacement=null;
 if(actions.length>sealedLength&&canonicalTick(action)&&last){if(canonicalTick(last)&&last.dt===action.dt)replacement={type:'tick-run',dt:action.dt,count:2};else if(last.type==='tick-run'&&last.dt===action.dt&&last.count<TRANSCRIPT_LIMITS.maxTicksPerRun)replacement={type:'tick-run',dt:action.dt,count:last.count+1};}
 let records=stats.records,bytes=stats.bytes;
 if(replacement){bytes+=JSON.stringify(replacement).length-JSON.stringify(last).length;next[next.length-1]=replacement;}
 else{records++;bytes+=JSON.stringify(action).length+(actions.length?1:0);next.push(clone(action));}
 logLimit(records<=TRANSCRIPT_LIMITS.maxRecords&&stats.steps+1<=TRANSCRIPT_LIMITS.maxSteps&&bytes<=TRANSCRIPT_LIMITS.maxBytes);return next;
}
function sameActionPrefix(prefix,actions){
 actionStats(prefix);actionStats(actions);let i=0,j=0,a=null,b=null;
 while(i<prefix.length){if(!a)a=recordInfo(prefix[i]);if(!b){if(j>=actions.length)return false;b=recordInfo(actions[j]);}if(a.atom!==b.atom)return false;const count=Math.min(a.steps,b.steps);a={...a,steps:a.steps-count};b={...b,steps:b.steps-count};if(!a.steps){i++;a=null;}if(!b.steps){j++;b=null;}}
 return true;
}
function compactActions(actions){
 actionStats(actions);const next=[];for(const a of actions){if(canonicalTick(a)){const last=next.at(-1);if(canonicalTick(last)&&last.dt===a.dt)next[next.length-1]={type:'tick-run',dt:a.dt,count:2};else if(last?.type==='tick-run'&&last.dt===a.dt&&last.count<TRANSCRIPT_LIMITS.maxTicksPerRun)next[next.length-1]={type:'tick-run',dt:a.dt,count:last.count+1};else next.push(clone(a));}else next.push(clone(a));}actionStats(next);return next;
}
// Caches contain only verified replay states. Exact record JSON, full run
// identity/config and current engine function references gate every reuse.
const MAX_CACHE_UNITS=4*1024*1024,MAX_CACHE_ENTRIES=12;
const replayCache=new Map();let replayCacheUnits=0;
function cacheRemove(key){const entry=replayCache.get(key);if(entry){replayCacheUnits-=entry.units;replayCache.delete(key);}}
function rememberReplay(key,entry){cacheRemove(key);if(entry.units>MAX_CACHE_UNITS)return;while(replayCache.size>=MAX_CACHE_ENTRIES||replayCacheUnits+entry.units>MAX_CACHE_UNITS)cacheRemove(replayCache.keys().next().value);replayCache.set(key,entry);replayCacheUnits+=entry.units;}
function replay(run,{onMealUse}={}){
 check(obj(run)&&ident(run.id)&&IDS.includes(run.moduleId)&&run.version===1&&obj(run.config)&&['practice','inventory'].includes(run.config.mode)&&int(run.config.seed,0,0xffffffff)&&int(run.config.difficulty,0,2)&&int(run.startedAt,0,1e15),'游戏开局资料无效。');
 actionStats(run.actions);const E=engine(run.moduleId),adventure=ADVENTURE_IDS.includes(run.moduleId),identity=JSON.stringify({id:run.id,sessionToken:run.sessionToken,moduleId:run.moduleId,version:run.version,config:run.config,startedAt:run.startedAt}),records=run.actions.map(a=>JSON.stringify(a));
 let prior=null;for(const p of replayCache.values())if(p.identity===identity&&p.create===E.create&&p.step===E.step&&p.validate===E.validate&&p.records.length<=records.length&&(!prior||p.records.length>prior.records.length)&&p.records.every((a,i)=>a===records[i]))prior=p;
 let state=prior?clone(prior.state):E.create(clone(run.config)),use=prior?.use?clone(prior.use):null,start=prior?.records.length||0;
 if(adventure)check(int(run.config.mealCharges,0,1)&&(run.config.mode!=='practice'||run.config.mealCharges===0)&&(prior||state.mealsUsed===0),'新游戏料理配置无效。');
 for(let index=start;index<run.actions.length;index++){const record=run.actions[index],info=recordInfo(record),action=record.type==='tick-run'?{type:'tick',dt:record.dt}:record;
  for(let n=0;n<info.steps;n++){const before=state.mealsUsed;state=E.step(state,clone(action));if(adventure){check(int(state.mealsUsed,0,run.config.mealCharges)&&state.mealsUsed>=before&&(state.mealsUsed===before||action.type==='use-meal'&&before===0&&state.mealsUsed===1),'料理必须由真实生效的使用操作产生，不能回退或重复使用。');if(state.mealsUsed!==before)use={index,state:clone(state)};}}
 }
 E.validate(state);check(eq(state,run.state),'游戏进度与实际操作记录不一致。');
 const units=identity.length+records.reduce((n,a)=>n+a.length+16,0)+JSON.stringify(state).length+(use?JSON.stringify(use).length:0);
 rememberReplay(identity+'|'+records.length,{identity,records,state:clone(state),use:use?clone(use):null,create:E.create,step:E.step,validate:E.validate,units});
 if(use)onMealUse?.(use.index,clone(use.state));return state;
}
function validateMealPrefix(run){let useIndex=-1;const state=replay(run,{onMealUse:index=>{useIndex=index;}});check(state.mealsUsed===1&&useIndex===run.actions.length-1,'料理消费缺少首次真实生效的操作前缀。');}
// Exact old payload validation also needs a bounded cache: a migration archive
// can contain a full old transcript. Never treat a checksum alone as identity.
const archiveCache=new Map();let archiveUnits=0;
function oldFunctionIdentity(){return[...Object.values(V6).filter(v=>typeof v==='function'),...Object.values(L).filter(v=>typeof v==='function'),...IDS.flatMap(id=>{const E=engine(id);return[E.create,E.step,E.validate];})];}
function validateOldPayload(payload,checksum,schema){
 check(typeof payload==='string'&&payload.length<=MAX_PAYLOAD&&int(schema,1,6),'升级前备份校验失败。');const refs=oldFunctionIdentity(),prior=archiveCache.get(payload);
 if(prior&&prior.schema===schema&&prior.checksum===checksum&&prior.refs.length===refs.length&&prior.refs.every((f,i)=>f===refs[i]))return;
 check(checksum===crc(payload),'升级前备份校验失败。');const old=JSON.parse(payload);check(old.schemaVersion===schema,'升级前备份版本不一致。');V6.migrate(old);
 if(prior){archiveCache.delete(payload);archiveUnits-=payload.length;}
 if(payload.length>MAX_CACHE_UNITS)return;while(archiveCache.size>=4||archiveUnits+payload.length>MAX_CACHE_UNITS){const key=archiveCache.keys().next().value;archiveCache.delete(key);archiveUnits-=key.length;}archiveCache.set(payload,{schema,checksum,refs});archiveUnits+=payload.length;
}
function validate(s){
 check(obj(s),'存档结构无效。');if(s.schemaVersion!==SCHEMA){const e=Error('请先迁移旧版存档，未覆盖现有资料。');e.code='UNSUPPORTED_SCHEMA';throw e;}
 L.validate(legacyProjection(s));
 if(s.migrationArchive!==null){const a=s.migrationArchive;check(obj(a)&&[1,2,3,4,5,6].includes(a.schemaVersion),'升级前备份校验失败。');validateOldPayload(a.payload,a.checksum,a.schemaVersion);}
 check(obj(s.modules)&&obj(s.modules.claims)&&Array.isArray(s.modules.results),'小游戏记录缺失。');
 for(const [id,r] of Object.entries(s.modules.claims)){validateModuleResult(r);check(id===r.runId,'小游戏凭证编号不一致。');}
 check(new Set(Object.values(s.modules.claims).map(r=>r.sessionToken)).size===Object.keys(s.modules.claims).length,'同一个小游戏会话不能有两份结算凭证。');
 check(new Set(s.modules.results.map(r=>r.runId)).size===s.modules.results.length,'小游戏结果重复。');
 for(const r of s.modules.results){validateModuleResult(r);check(eq(r,s.modules.claims[r.runId]),'小游戏结果与凭证不一致。');}
 if(s.modules.pending){const run=s.modules.pending;replay(run);check(!s.modules.claims[run.id],'已结算游戏不能再作为未完成局。');const a=s.activeSession;check(a?.gameId==='module'&&a.moduleId===run.moduleId&&a.runId===run.id&&a.token===run.sessionToken,'未完成游戏与会话不一致。');}
 if(s.activeSession?.gameId==='module'){
  const a=s.activeSession;check(s.modules.pending&&ident(a.token)&&int(a.learnerSlot,0,2)&&a.runKey===null&&a.returnSnapshotHash===crc(JSON.stringify(a.returnSnapshot))&&eq(a.returnSnapshot,s.board)&&a.boardId===(s.board?.id||'')&&a.turnNo===(s.board?.turnNo||0),'小游戏返回位置或回合损坏。');
 }
 check(obj(s.adventureMeals),'冒险料理消费凭证缺失。');
 for(const [id,proof] of Object.entries(s.adventureMeals)){
  check(obj(proof)&&proof.run?.id===id&&ADVENTURE_IDS.includes(proof.run.moduleId)&&proof.run.config?.mode==='inventory'&&proof.run.config.mealCharges===1&&int(proof.at,0,1e15)&&proof.transactionId==='adventure-meal:'+id&&proof.actionHash===crc(JSON.stringify({config:proof.run.config,actions:proof.run.actions})),'冒险料理消费来源无效。');
  validateMealPrefix(proof.run);
  const pending=s.modules.pending?.id===id?s.modules.pending:null,claim=s.modules.claims[id];
  check(pending||claim,'料理已经扣除，但找不到本局进度或结束凭证。');
  if(pending)check(pending.sessionToken===proof.run.sessionToken&&pending.state.mealsUsed===1&&eq(pending.config,proof.run.config)&&sameActionPrefix(proof.run.actions,pending.actions),'导入的旧进度早于已经使用的料理。请保留原档，使用较新的完整备份继续。');
  if(claim)check(claim.moduleId===proof.run.moduleId&&claim.sessionToken===proof.run.sessionToken&&claim.mealsUsed===1&&claim.mealProofHash===proof.actionHash,'已结束游戏与料理消费来源不一致。');
 }
 for(const r of Object.values(s.modules.claims))if(ADVENTURE_IDS.includes(r.moduleId))check(!!s.adventureMeals[r.runId]===(r.mealsUsed===1),'游戏料理结果与消费凭证不一致。');
 if(s.modules.pending&&ADVENTURE_IDS.includes(s.modules.pending.moduleId))check(!!s.adventureMeals[s.modules.pending.id]===(s.modules.pending.state.mealsUsed===1),'游戏已使用料理，缺少原子消费凭证。');
 const e=s.economy;check(obj(e)&&e.version===1&&obj(e.inventory)&&Array.isArray(e.ledger)&&Array.isArray(e.riverCollection),'物资账本缺失。');
 check(new Set(e.ledger.map(t=>t.id)).size===e.ledger.length,'物资交易重复。');let expected=stock();const collection=new Set();
 for(const t of e.ledger){
  check(obj(t)&&ident(t.id)&&int(t.at,0,1e15)&&['fish-production','fish-cooking','cargo-transfer','meal-consume','adventure-meal-consume'].includes(t.type)&&obj(t.delta),'物资交易格式无效。');
  for(const zone of REGIONS)for(const item of ITEMS){check(obj(t.delta[zone])&&int(t.delta[zone][item],-12,12),'物资变化数量无效。');expected[zone][item]+=t.delta[zone][item];check(int(expected[zone][item],0,1e8),'物资不足或账本超出限制。');}
  const r=t.delta.Rawang,m=t.delta.Masai;
  if(t.type==='adventure-meal-consume'){
   const proof=s.adventureMeals[t.runId];check(proof&&t.id===proof.transactionId&&t.sessionToken===proof.run.sessionToken&&t.moduleId===proof.run.moduleId&&t.actionHash===proof.actionHash&&t.at===proof.at&&r.fish===0&&r.meal===0&&m.fish===0&&m.meal===-1,'冒险料理消费流水与真实操作不一致。');
  }
  else if(t.type==='meal-consume')check(r.fish===0&&r.meal===0&&m.fish===0&&m.meal===-1&&typeof t.boardId==='string'&&int(t.turnNo,1),'料理消费记录无效。');
  else{
   const claim=s.modules.claims[t.runId];check(claim?.mode==='inventory'&&claim.status==='won'&&t.id==='module:'+claim.runId&&t.actionHash===claim.actionHash,'物资没有对应的真实游戏结算。');
   if(t.type==='fish-production'){check(claim.moduleId==='fishing'&&r.fish===claim.goods.fish&&r.fish>0&&r.meal===0&&m.fish===0&&m.meal===0,'钓鱼产出不守恒。');for(const id of claim.goods.collectibles)collection.add(id);}
   if(t.type==='fish-cooking')check(claim.moduleId==='kitchen'&&r.fish===-claim.goods.meals&&r.meal===claim.goods.meals&&r.meal>0&&m.fish===0&&m.meal===0,'料理加工不守恒。');
   if(t.type==='cargo-transfer'){const counts={fish:0,meal:0};for(const cargo of claim.goods.shipped)counts[cargo.itemId]++;check(claim.moduleId==='trunk'&&counts.fish+counts.meal>0&&r.fish===-counts.fish&&r.meal===-counts.meal&&m.fish===counts.fish&&m.meal===counts.meal,'运输必须等量转移真实物资。');}
  }
 }
 for(const zone of REGIONS)for(const item of ITEMS)check(obj(e.inventory[zone])&&e.inventory[zone][item]===expected[zone][item],'库存与物资流水不一致。');
 for(const r of Object.values(s.modules.claims))if(RESOURCE_IDS.includes(r.moduleId)&&r.mode==='inventory'&&r.status==='won')check(e.ledger.some(t=>t.id==='module:'+r.runId&&t.runId===r.runId),'已发放的物资凭证缺少对应流水，不能覆盖原档。');
 for(const proof of Object.values(s.adventureMeals))check(e.ledger.some(t=>t.id===proof.transactionId&&t.type==='adventure-meal-consume'),'已扣除料理的操作凭证缺少消费流水。');
 check(e.riverCollection.every(x=>OLD.includes(x))&&new Set(e.riverCollection).size===e.riverCollection.length&&eq([...collection].sort(),e.riverCollection.slice().sort()),'河里旧物收藏与来源不一致。');
 checkRunInventory(s,s.modules.pending);
 if(e.diceChoice){const c=e.diceChoice;check(obj(c)&&ident(c.id)&&e.ledger.some(t=>t.id===c.id&&t.type==='meal-consume')&&s.board?.phase==='roll'&&c.boardId===s.board.id&&c.turnNo===s.board.turnNo&&c.turn===s.board.turn&&Array.isArray(c.rolls)&&c.rolls.length===2&&c.rolls.every(x=>int(x,1,6)),'料理骰子选择记录无效。');}
 return clone(s);
}
// A rejected action must leave the caller's live save untouched. Validate and
// finish all work on a detached draft before publishing any claim or inventory.
function atomic(s,operation){const draft=validate(s),result=operation(draft);validate(draft);Object.assign(s,draft);return result;}
function migrate(input){
 if(input?.schemaVersion===SCHEMA)return{state:validate(input),migrated:false,fromVersion:SCHEMA,toVersion:SCHEMA};
 if(!int(input?.schemaVersion,1,6)){const e=Error('不支持这个存档版本，原档保留。');e.code='UNSUPPORTED_SCHEMA';throw e;}const old=V6.migrate(input).state,payload=JSON.stringify(input);check(payload.length<=MAX_PAYLOAD,'升级前备份超过大小限制，原档保留。');
 const state={...old,schemaVersion:SCHEMA,migrationArchive:{schemaVersion:input.schemaVersion,payload,checksum:crc(payload)}};
 if(state.modules.pending)state.modules.pending.actions=compactActions(state.modules.pending.actions);
 state.migrations.push({from:input.schemaVersion,to:SCHEMA,at:Date.now(),note:'保留完整旧档与料理凭证；仅压缩未完成局的等价计时记录，不补发奖励。'});
 return{state:validate(state),migrated:true,fromVersion:input.schemaVersion,toVersion:SCHEMA};
}
function launchModuleDraft(s,id,options={}){
 check(obj(options),'游戏模式配置无效。');
 check(!s.activeSession&&!s.modules.pending,'请先继续或结束尚未完成的一局。');check(!s.economy.diceChoice,'请先选好本回合的骰子。');const E=engine(id);
 const mode=options.mode??'practice',difficulty=options.difficulty??0;check(['practice','inventory'].includes(mode)&&int(difficulty,0,2),'游戏模式无效。');
 const seed=parseInt(crc(uid()),16)>>>0,config={seed,mode,difficulty};
 if(ADVENTURE_IDS.includes(id)){
  const charges=options.mealCharges??0;check(int(charges,0,1)&&(mode!=='practice'||charges===0),'每局最多选择一份料理，练习关不使用仓库物资。');
  check(charges===0||s.economy.inventory.Masai.meal>=1,'Masai 没有料理，可不带料理开始，或先从 Rawang 运一份过来。');config.mealCharges=charges;
  if(id==='kart'&&options.trackId!==undefined){check(['masai-market','north-south'].includes(options.trackId),'赛道尚未接入。');config.trackId=options.trackId;}
 }
 if(id==='kitchen'){const units=options.units??3;check(int(units,1,3),'每局请选择一至三份料理。');config.units=mode==='practice'?units:Math.min(units,s.economy.inventory.Rawang.fish);check(config.units>0,'Rawang 还没有鱼。可以先玩练习关，或去河边钓鱼。');}
 if(id==='trunk'&&mode==='inventory'){
  config.cargo=[];const amounts=options.cargo??s.economy.inventory.Rawang;check(obj(amounts),'装箱数量清单无效。');
  for(const item of ['meal','fish']){check(int(amounts[item]??0,0,s.economy.inventory.Rawang[item]),'装箱数量超过 Rawang 库存。');const count=Math.min(amounts[item]??0,12-config.cargo.length);for(let n=0;n<count;n++)config.cargo.push({id:item+'-'+(n+1),itemId:item,qty:1});}
  check(config.cargo.length>0,'Rawang 暂无可运物资。可以先玩装箱练习。');
 }
 const initial=E.create(clone(config));E.validate(initial);
 const token=uid(),runId=uid(),slot=s.board?.players[s.board.turn].learnerSlot??0;
 s.activeSession={gameId:'module',moduleId:id,runId,token,learnerSlot:slot,boardId:s.board?.id||'',turnNo:s.board?.turnNo||0,returnSnapshot:clone(s.board),returnSnapshotHash:crc(JSON.stringify(s.board)),runKey:null};
 s.modules.pending={id:runId,sessionToken:token,moduleId:id,version:E.version,config,startedAt:Date.now(),actions:[],state:initial};
 L.note(s,'进入'+E.title+(mode==='practice'?' · 练习关':' · 联动物资关'));return clone(s.activeSession);
}
function launchModule(s,id,options={}){return atomic(s,draft=>launchModuleDraft(draft,id,options));}
function updateModuleDraft(s,token,actions,state){
 const run=s.modules.pending;check(s.activeSession?.token===token&&s.activeSession.gameId==='module'&&run,'游戏会话已改变。');
 check(eq(s.activeSession.returnSnapshot,s.board)&&s.activeSession.returnSnapshotHash===crc(JSON.stringify(s.board)),'棋盘位置或回合已改变，未覆盖本局进度。');
 checkRunInventory(s,run);
 check(Array.isArray(actions)&&actions.length>=run.actions.length&&eq(actions.slice(0,run.actions.length),run.actions),'游戏进度不能倒退或替换已保存操作。');
 const next={...run,actions:clone(actions),state:clone(state)};let use=null;replay(next,{onMealUse:(index,usedState)=>{use={index,state:usedState};}});s.modules.pending=next;
 if(ADVENTURE_IDS.includes(run.moduleId)&&next.state.mealsUsed===1&&!s.adventureMeals[run.id]){
  check(run.config.mode==='inventory'&&run.config.mealCharges===1&&use,'没有可用料理，未扣除任何库存。');
  const proofRun={...clone(next),actions:clone(next.actions.slice(0,use.index+1)),state:use.state},at=Date.now(),actionHash=crc(JSON.stringify({config:proofRun.config,actions:proofRun.actions})),transactionId='adventure-meal:'+run.id,delta=stock();delta.Masai.meal=-1;
  transaction(s,{id:transactionId,type:'adventure-meal-consume',at,runId:run.id,sessionToken:token,moduleId:run.moduleId,actionHash,delta});
  s.adventureMeals[run.id]={run:proofRun,at,actionHash,transactionId};
 }
 return{saved:true,mealsUsed:next.state.mealsUsed??0};
}
function updateModule(s,token,actions,state){return atomic(s,draft=>updateModuleDraft(draft,token,actions,state));}
function transaction(s,t){
 check(!s.economy.ledger.some(x=>x.id===t.id),'此物资交易已经结算。');
 const nextInventory=clone(s.economy.inventory);
 for(const zone of REGIONS)for(const item of ITEMS){check(obj(t.delta?.[zone])&&int(t.delta[zone][item],-12,12),'物资交易数量无效。');const next=nextInventory[zone][item]+t.delta[zone][item];check(int(next,0,1e8),'物资不足，未扣除也未发放，请保留存档。');nextInventory[zone][item]=next;}
 s.economy.inventory=nextInventory;s.economy.ledger.push(clone(t));
}
function settleModuleDraft(s,token){
 const already=Object.values(s.modules.claims).find(r=>r.sessionToken===token);if(already)return{duplicate:true,result:clone(already)};
 check(s.activeSession?.token===token&&s.activeSession.gameId==='module'&&s.modules.pending,'没有可结算的小游戏。');
 const run=s.modules.pending,state=replay(run),outcome=engine(run.moduleId).result(state);
 check(outcome&&['won','lost'].includes(outcome.status)&&int(outcome.score),'游戏尚未完成，不能结算。');
 const goods={fish:0,meals:0,shipped:[],collectibles:[]};
 if(run.config.mode==='inventory'&&outcome.status==='won'){
  if(run.moduleId==='fishing'){check(int(outcome.fish,1,12)&&Array.isArray(outcome.collectibles)&&outcome.collectibles.every(id=>OLD.includes(id)),'钓鱼结果无效。');goods.fish=outcome.fish;goods.collectibles=clone(outcome.collectibles);}
  if(run.moduleId==='kitchen'){check(int(outcome.meals,1,run.config.units),'料理数量无效。');goods.meals=outcome.meals;}
  if(run.moduleId==='trunk'){check(Array.isArray(outcome.shipped)&&outcome.shipped.length>0&&new Set(outcome.shipped.map(x=>x.id)).size===outcome.shipped.length&&outcome.shipped.every(x=>run.config.cargo.some(c=>eq(c,x))),'运输清单不是开局时的真实物资。');goods.shipped=clone(outcome.shipped);}
 }
 const r={runId:run.id,sessionToken:token,moduleId:run.moduleId,version:1,mode:run.config.mode,status:outcome.status,score:outcome.score,at:Date.now(),actionHash:crc(JSON.stringify({config:run.config,actions:run.actions})),goods};
 if(ADVENTURE_IDS.includes(run.moduleId)){
  check(int(outcome.mealsUsed,0,1)&&outcome.mealsUsed===state.mealsUsed,'本局料理使用结果无效。');r.mealsUsed=state.mealsUsed;r.mealProofHash=s.adventureMeals[run.id]?.actionHash??null;
  if(run.moduleId==='dungeon'&&outcome.discoveries!==undefined)r.discoveries=clone(outcome.discoveries);
 }
 validateModuleResult(r);s.modules.claims[r.runId]=clone(r);s.modules.results.push(clone(r));
 if(RESOURCE_IDS.includes(run.moduleId)&&r.status==='won'&&r.mode==='inventory'){
  const delta=stock(),type=run.moduleId==='fishing'?'fish-production':run.moduleId==='kitchen'?'fish-cooking':'cargo-transfer';
  if(type==='fish-production'){delta.Rawang.fish=goods.fish;for(const id of goods.collectibles)if(!s.economy.riverCollection.includes(id))s.economy.riverCollection.push(id);}
  if(type==='fish-cooking'){delta.Rawang.fish=-goods.meals;delta.Rawang.meal=goods.meals;}
  if(type==='cargo-transfer')for(const c of goods.shipped){delta.Rawang[c.itemId]-=c.qty;delta.Masai[c.itemId]+=c.qty;}
  transaction(s,{id:'module:'+r.runId,type,at:r.at,runId:r.runId,actionHash:r.actionHash,delta});
 }
 L.closeSession(s,token);s.modules.pending=null;L.note(s,engine(run.moduleId).title+'：'+(r.status==='won'?'通关':'本局结束')+'，'+r.score+'分。'+(r.mode==='practice'?'练习成绩已记录，不改变物资。':'物资与游戏结果已分别保存。'));
 return{duplicate:false,result:clone(r)};
}
function settleModule(s,token){return atomic(s,draft=>settleModuleDraft(draft,token));}
function closeSession(s,token){return atomic(s,draft=>{
 const isModule=draft.activeSession?.gameId==='module',run=isModule?draft.modules.pending:null;
 if(run&&ADVENTURE_IDS.includes(run.moduleId)){
  check(draft.activeSession.token===token,'过期游戏会话。');const state=replay(run),proof=draft.adventureMeals[run.id];
  const r={runId:run.id,sessionToken:token,moduleId:run.moduleId,version:1,mode:run.config.mode,status:'abandoned',score:0,at:Date.now(),actionHash:crc(JSON.stringify({config:run.config,actions:run.actions})),goods:{fish:0,meals:0,shipped:[],collectibles:[]},mealsUsed:state.mealsUsed,mealProofHash:proof?.actionHash??null};
  validateModuleResult(r);draft.modules.claims[run.id]=clone(r);draft.modules.results.push(clone(r));
 }
 const result=L.closeSession(draft,token);if(isModule)draft.modules.pending=null;return result;
});}
function prepareMealDiceDraft(s,a,b){
 check(s.board?.phase==='roll'&&!s.activeSession&&!s.economy.diceChoice,'当前不能使用料理，请先完成本回合或游戏。');check(int(a,1,6)&&int(b,1,6),'骰子数值无效。');
 const id='dice:'+uid(),delta=stock();delta.Masai.meal=-1;transaction(s,{id,type:'meal-consume',at:Date.now(),boardId:s.board.id,turnNo:s.board.turnNo,delta});
 s.economy.diceChoice={id,boardId:s.board.id,turnNo:s.board.turnNo,turn:s.board.turn,rolls:[a,b]};L.note(s,'使用一份 Masai 料理，本回合可在两个骰子结果中选择一个。');return clone(s.economy.diceChoice);
}
function prepareMealDice(s,a,b){return atomic(s,draft=>prepareMealDiceDraft(draft,a,b));}
function chooseMealDice(s,index){return atomic(s,draft=>{const c=draft.economy.diceChoice;check(c&&int(index,0,1)&&c.boardId===draft.board?.id&&c.turnNo===draft.board.turnNo&&c.turn===draft.board.turn,'骰子选择已失效。');L.roll(draft,c.rolls[index]);draft.economy.diceChoice=null;});}
function roll(s,d){return atomic(s,draft=>{check(!draft.economy.diceChoice,'请先选择已掷出的一个骰子。');return L.roll(draft,d);});}
function startBoard(s,n,names){return atomic(s,draft=>{check(!draft.economy.diceChoice,'请先完成料理骰子的选择。');return L.startBoard(draft,n,names);});}
function prepareImport(current,incoming){
 validate(current);const s=migrate(incoming).state;
 if(current.universeId===s.universeId){
  Object.assign(s.claims,current.claims);Object.assign(s.arcadeClaims,current.arcadeClaims);
  for(const r of s.gameResults.arcade){const old=current.arcadeClaims[r.roundId];check(!old||eq(old,r),'导入街机结果与本机凭证冲突。');}
  for(const [id,r] of Object.entries(current.modules.claims)){check(!s.modules.claims[id]||eq(s.modules.claims[id],r),'导入小游戏结果与本机凭证冲突。');s.modules.claims[id]=clone(r);}
  for(const [id,proof] of Object.entries(current.adventureMeals)){
   const incomingProof=s.adventureMeals[id];
   if(incomingProof&&!eq(incomingProof,proof)){
    // Canonicalize only an identical first-use proof represented by different
    // tick-run boundaries or acknowledgement timestamps. Retain the persisted
    // proof and ledger hash; additional fields or different states still fail.
    check(sameActionPrefix(incomingProof.run.actions,proof.run.actions)&&sameActionPrefix(proof.run.actions,incomingProof.run.actions)&&eq({...incomingProof,at:proof.at,actionHash:proof.actionHash,run:{...incomingProof.run,actions:proof.run.actions}},proof),'导入的料理消费凭证与本机真实使用记录冲突。');
    const localEntry=current.economy.ledger.find(t=>t.id===proof.transactionId),incomingEntry=s.economy.ledger.find(t=>t.id===proof.transactionId);
    check(localEntry&&incomingEntry&&eq({...incomingEntry,at:localEntry.at,actionHash:localEntry.actionHash},localEntry),'导入的料理消费流水与本机真实使用记录冲突。');
    const claim=s.modules.claims[id];if(claim&&!current.modules.claims[id]){check(claim.mealProofHash===incomingProof.actionHash,'已结束游戏与料理来源不一致。');claim.mealProofHash=proof.actionHash;const row=s.modules.results.find(r=>r.runId===id);if(row){check(row.mealProofHash===incomingProof.actionHash,'已结束游戏与料理来源不一致。');row.mealProofHash=proof.actionHash;}}
    incomingEntry.at=localEntry.at;incomingEntry.actionHash=localEntry.actionHash;
   }
   s.adventureMeals[id]=clone(proof);
  }
  const left=current.economy.ledger,right=s.economy.ledger,min=Math.min(left.length,right.length);check(eq(left.slice(0,min),right.slice(0,min)),'两台设备的物资账本已经分叉，不能相加或自动覆盖。请先保留两个备份。');
  if(left.length>=right.length)s.economy=clone(current.economy);
  // A pending choice already consumed a meal. Keep it from the selected
  // authoritative ledger branch; dropping it would lose a paid advantage.
  // An already chosen local turn keeps its null choice and cannot use it twice.
  if(s.economy.diceChoice){const choice=s.economy.diceChoice;check(s.board?.phase==='roll'&&choice.boardId===s.board.id&&choice.turnNo===s.board.turnNo&&choice.turn===s.board.turn,'已使用料理的骰子选择还未完成，与备份棋盘回合不一致。请先在当前进度选好骰子，再导入；原存档和料理扣除记录均已保留。');}
  if(s.modules.pending&&s.modules.claims[s.modules.pending.id]){L.closeSession(s,s.activeSession.token);s.modules.pending=null;}
 }
 for(const r of Object.values(s.settlements.runs))if(r.status==='started'){r.status='invalidated';r.sessionToken=null;}
 if(s.activeSession)s.activeSession.runKey=null;return validate(s);
}
function pack(s){validate(s);const payload=JSON.stringify(s);check(payload.length<=MAX_PAYLOAD,'宇宙存档超过大小限制，请保留备份。');return{payload,checksum:crc(payload)};}
function unpack(p){check(obj(p)&&typeof p.payload==='string'&&p.payload.length<=MAX_PAYLOAD&&p.checksum===crc(p.payload),'存档校验失败，原档未覆盖。');const originalState=JSON.parse(p.payload);return{...migrate(originalState),originalState};}
function wrap(s,old){let previous=null;if(old){if(old.schemaVersion===SCHEMA)previous=pack(old);else{V6.migrate(old);const payload=JSON.stringify(old);check(payload.length<=MAX_PAYLOAD,'旧备份过大。');previous={payload,checksum:crc(payload)};}}return JSON.stringify({format:'LIANG_UNIVERSE',current:pack(s),previous});}
function unwrap(raw){check(typeof raw==='string'&&raw.length<=MAX_PAYLOAD*2+1000,'存档文件过大。');const w=JSON.parse(raw);check(w?.format==='LIANG_UNIVERSE','这不是梁家宇宙存档。');try{return{...unpack(w.current),recovered:false};}catch(e){if(e.code==='UNSUPPORTED_SCHEMA')throw e;if(w.previous)return{...unpack(w.previous),recovered:true};throw e;}}
function encode(s){const bytes=new TextEncoder().encode(JSON.stringify(pack(s)));let text='';for(let n=0;n<bytes.length;n+=8192)text+=String.fromCharCode(...bytes.subarray(n,n+8192));return'LU1.'+(typeof btoa==='function'?btoa(text):Buffer.from(text,'binary').toString('base64')).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
function decode(code){check(typeof code==='string'&&code.length<=MAX_PAYLOAD*6&&/^LU1\.[A-Za-z0-9_-]+$/.test(code),'迁移代码格式无效或过大。');let b=code.slice(4).replace(/-/g,'+').replace(/_/g,'/');b+='='.repeat((4-b.length%4)%4);const bin=typeof atob==='function'?atob(b):Buffer.from(b,'base64').toString('binary');return unpack(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(bin,c=>c.charCodeAt(0))))).state;}
// Preserve the verified legacy rules while preventing a late error in any
// public mutation from leaving half of a learning/arcade/board operation saved.
const legacyMutations=Object.fromEntries(['note','nextTurn','launch','launchArcade','recordArcadeResult','storeLegacy','beginRun','recordSubmission','changeCharacter','invalidateRun','reward'].map(name=>[name,(s,...args)=>atomic(s,draft=>L[name](draft,...args))]));
return{...L,...legacyMutations,SCHEMA,KEY,MAX_PAYLOAD,TRANSCRIPT_LIMITS,actionStats,appendAction,sameActionPrefix,IDS,RESOURCE_IDS,ADVENTURE_IDS,fresh,validate,migrate,launchModule,updateModule,settleModule,prepareMealDice,chooseMealDice,roll,startBoard,closeSession,prepareImport,pack,wrap,unwrap,encode,decode};
});



;
(function(root,factory){const E=factory();if(typeof module==='object'&&module.exports)module.exports=E;root.LiangGames=root.LiangGames||{};root.LiangGames.pets=E;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const clone=x=>JSON.parse(JSON.stringify(x)),eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const NAMES=['观察猫示意 01','陪狗示意 02练习','伙伴友好对练'];
const CAT=[{cue:'它停在原地，暂时没有靠近。',best:'wait',gain:1,why:'先留出距离，等它放松。'},{cue:'它正好奇地看着观察点。',best:'observe',gain:1,why:'先观察它的反应，不急着靠近。'},{cue:'它主动靠近了一点。',best:'approach',gain:2,why:'现在可以慢慢接近，完成互动。'}];
const DOG=[{cue:'训练提示：需要休息。',best:'rest',gain:1,why:'停下来休息，再进行下一次互动。'},{cue:'训练提示：准备互动。',best:'play',gain:2,why:'先互动，建立信任。'},{cue:'训练提示：可以练习。',best:'train',gain:2,why:'现在可以完成一次简单练习。'}];
const DUEL=[{cue:'对手架起防守。',best:'observe',why:'先观察，积累专注，直接进攻会被挡住。'},{cue:'对手准备冲过来。',best:'defend',why:'守住这一回合，再把握反击机会。'},{cue:'对手正在调整动作，暂时露出空档。',best:'attack',why:'把刚才积累的专注用于进攻。'}];
const table=s=>s.stage===0?CAT:s.stage===1?DOG:DUEL;
function cue(s){return table(s)[(s.config.seed%3+s.turn)%3];}
function reset(s){s.phase='playing';s.turn=0;s.trust=0;s.tolerance=3;s.actionsLeft=[12,10,8][s.config.difficulty];s.health=5;s.energy=4;s.focus=0;s.rival=10;s.message=s.stage===2?'先观察防守，再抵挡冲击，看到空档时进攻。':'看当前提示，选择合适的行动。';}
function create(config={}){const c={seed:config.seed??1,mode:config.mode??'practice',difficulty:config.difficulty??0,partnerKey:config.partnerKey??null};if(!Number.isInteger(c.seed)||c.seed<0||c.seed>0xffffffff||!['practice','inventory'].includes(c.mode)||!Number.isInteger(c.difficulty)||c.difficulty<0||c.difficulty>2||!(c.partnerKey===null||/^[0-2]:(cat|dog)$/.test(c.partnerKey)))throw Error('图鉴配置无效。');const s={version:1,config:c,phase:'playing',stage:0,elapsedMs:0,turn:0,trust:0,tolerance:3,actionsLeft:12,health:5,energy:4,focus:0,rival:10,wins:{cat:false,dog:false},attempts:1,inputCount:0,message:'',history:[]};reset(s);return s;}
function validate(s){const fail=()=>{throw Error('图鉴进度无效，原存档保留。');};if(!s||s.version!==1||!eq(create(s.config).config,s.config)||!['playing','between','won','lost'].includes(s.phase)||!Number.isInteger(s.stage)||s.stage<0||s.stage>2)fail();for(const [k,max]of Object.entries({elapsedMs:3600000,turn:12,trust:20,tolerance:3,actionsLeft:12,health:5,energy:6,focus:2,rival:10,attempts:1000,inputCount:100000}))if(!Number.isInteger(s[k])||s[k]<0||s[k]>max)fail();if(!s.wins||typeof s.wins.cat!=='boolean'||typeof s.wins.dog!=='boolean'||typeof s.message!=='string'||!Array.isArray(s.history)||s.history.length>8||!s.history.every(x=>typeof x==='string'))fail();if(s.phase==='won'&&(!s.wins.cat||!s.wins.dog||s.stage!==2||s.rival!==0))fail();return true;}
function step(state,a){validate(state);if(!a||typeof a.type!=='string')throw Error('图鉴操作无效。');const s=clone(state);if(a.type==='tick'){if(Number.isInteger(a.dt)&&a.dt>=1&&a.dt<=250&&s.phase==='playing')s.elapsedMs=Math.min(3600000,s.elapsedMs+a.dt);return s;}
if(a.type==='retry'&&s.phase==='lost'&&s.attempts<1000){s.attempts++;s.inputCount++;reset(s);return s;}if(a.type==='next'&&s.phase==='between'){s.stage++;s.attempts++;s.inputCount++;reset(s);return s;}if(s.phase!=='playing')return s;
const allowed=s.stage===0?['wait','observe','approach']:s.stage===1?['rest','play','train']:['observe','defend','attack'];if(!allowed.includes(a.type))return s;const hint=cue(s);s.turn++;s.inputCount++;s.actionsLeft--;
if(s.stage<2){if(a.type===hint.best){s.trust+=hint.gain;s.message=hint.why+' 信任 +'+hint.gain+'。';}else{s.tolerance--;s.trust=Math.max(0,s.trust-1);s.message='这次没配合当前提示，信任 −1，容错 −1。'+hint.why;}if(s.trust>=(s.stage===0?6:7)){s.wins[s.stage===0?'cat':'dog']=true;s.phase='between';s.message='这场挑战完成了！继续下一场，或保存后再来。';}}
else {if(a.type==='observe'){s.focus=Math.min(2,s.focus+1);s.energy=Math.min(6,s.energy+1);if(hint.best==='defend')s.health=Math.max(0,s.health-2);s.message='观察让专注 +1、行动力 +1。'+(hint.best==='defend'?'没挡住冲击，体力 −2。':'准备好再进攻。');}if(a.type==='defend'){s.energy=Math.min(6,s.energy+1);if(hint.best==='defend'){s.rival=Math.max(0,s.rival-2);s.message='挡住冲击并反击，对手体力 −2，行动力 +1。';}else{s.message='守住了这一回合，行动力 +1；对手没有冲击，暂时不能反击。';}}if(a.type==='attack'){if(s.energy<2||s.focus===0){s.health=Math.max(0,s.health-1);s.message='专注或行动力不足，进攻未成功，体力 −1。先观察。';}else{s.energy-=2;s.focus--;if(hint.best==='attack'){s.rival=Math.max(0,s.rival-3);s.message='抓住空档，对手体力 −3；行动力 −2、专注 −1。';}else if(hint.best==='observe'){s.health=Math.max(0,s.health-1);s.message='进攻被挡住，体力 −1；下次先观察防守。';}else{s.rival=Math.max(0,s.rival-2);s.health=Math.max(0,s.health-2);s.message='互相碰了一下：对手体力 −2，你的体力 −2。先防守更稳。';}}}if(s.rival===0&&s.health>0){s.phase='won';s.message='三场挑战完成！临时伙伴也能通关。永久结识和料理喂养可回棋盘后自愿选择。';}}
if(s.phase==='playing'&&(s.actionsLeft===0||s.stage<2&&s.tolerance===0||s.stage===2&&s.health===0)){s.phase='lost';s.message='这场挑战暂时没完成。看看刚才的提示，重试时换一种行动。';}s.history.push(s.message);s.history=s.history.slice(-8);validate(s);return s;}
function result(s){validate(s);if(!['won','lost'].includes(s.phase))return null;return{status:s.phase,score:(s.wins.cat?150:0)+(s.wins.dog?150:0)+(s.phase==='won'?400+s.health*20+s.actionsLeft*10:0),petWins:clone(s.wins)};}
function mount(container,options){const doc=container.ownerDocument,win=doc.defaultView;let s=clone(options.state),paused=false,disposed=false;const el=doc.createElement('section');el.tabIndex=0;el.className='lg-pets';el.dataset.testid='pets-game';el.setAttribute('aria-label','梁家猫狗图鉴基础篇');const art=win.LiangCharacterArt?.characters?.sister;
el.innerHTML=`<style>.lg-pets{color:#f1f5e6;font:16px/1.6 system-ui;background:radial-gradient(ellipse at 80% 5%,#566441,#163c43 55%,#122c3d);border:1px solid #719789;border-radius:22px;padding:22px;outline-offset:4px;max-width:1000px;margin:auto}.lg-pets *{box-sizing:border-box}.lg-pets h2,.lg-pets h3,.lg-pets p{margin:0 0 12px;color:inherit}.p-scene{display:grid;grid-template-columns:110px 1fr;gap:20px;align-items:center;padding:20px;background:linear-gradient(145deg,#25554caa,#102937);border:1px solid #739681;border-radius:20px;margin:15px 0}.p-portrait{height:220px;max-width:110px;object-fit:contain;filter:drop-shadow(0 8px 6px #0005)}.p-kicker{color:#e7cf88;font-size:13px;letter-spacing:2px}.p-route{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}.p-route span{padding:5px 12px;border:1px solid #6e8875;border-radius:30px}.p-route .active{background:#e7cc89;color:#163641;font-weight:700}.p-cue{min-height:85px;padding:18px;border-left:4px solid #f1d080;background:#0f2833;border-radius:12px;font-size:19px}.p-stats{display:flex;flex-wrap:wrap;gap:10px;margin:14px 0}.p-stats span{background:#0f2833;border-radius:10px;padding:8px 12px}.p-actions{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.p-actions button,.p-next,.p-retry{min-height:58px;border:1px solid #a0b29b;border-radius:13px;font:700 16px system-ui;padding:12px;color:#eef5e3;background:#365e57;touch-action:manipulation}.lg-pets button:focus-visible{outline:3px solid #ffe09b;outline-offset:3px}.lg-pets button:disabled{opacity:.5}.p-feedback{padding:14px;min-height:80px;margin:14px 0!important;background:#18313d;border-radius:13px}.p-help{font-size:13px;color:#c8dacd}.p-diary{font-size:13px;padding-top:12px;border-top:1px solid #5a796b}@media(max-width:600px){.lg-pets{padding:12px}.p-scene{grid-template-columns:65px 1fr;gap:10px;padding:12px}.p-portrait{max-width:65px;height:150px}.p-cue{font-size:17px}.p-actions{gap:6px}.p-actions button{padding:10px 4px;font-size:14px}.lg-pets h2{font-size:20px;margin-bottom:6px}.p-route{gap:3px;margin:7px 0}.p-route span{font-size:11px;padding:4px 6px;white-space:nowrap}.p-scene{margin:8px 0;padding:8px}.p-portrait{height:100px}.p-scene h3{font-size:15px;margin-bottom:4px}.p-scene p{font-size:12px;margin-bottom:4px}.p-scene .p-help{font-size:10px;line-height:1.4}.p-cue{min-height:52px;padding:10px}.p-stats{font-size:12px;margin:7px 0;gap:5px}.p-stats span{padding:5px 7px}.p-actions button{min-height:48px}.p-feedback{padding:10px;min-height:56px;margin:8px 0!important}}</style><div class="p-kicker">MASAI · 示意住宅观察点</div><h2>梁家猫狗图鉴 · 基础篇</h2><div class="p-route"></div><div class="p-scene">${art?'<img class="p-portrait" alt="梁姐姐 · source原图" src="'+art.src+'">':'<span>梁姐姐</span>'}<div><h3 data-p-title></h3><p>猫示意 01 · 狗示意 02</p><p class="p-help">本篇用编号和文字演示玩法，尚未加入正式猫狗名册与外貌。这些提示是游戏规则。</p></div></div><div class="p-cue" data-testid="pet-cue"></div><div class="p-stats"></div><div class="p-actions"></div><button class="p-next" data-game-action="next" hidden>继续下一场</button><button class="p-retry" data-game-action="retry" hidden>再试这场</button><p class="p-feedback" role="status"></p><p class="p-help" data-p-help></p><details class="p-diary"><summary>这次的行动记录</summary><div data-p-history></div></details>`;container.append(el);
const $=q=>el.querySelector(q);const labels={wait:'等一等',observe:'观察',approach:'慢慢接近',rest:'休息',play:'互动',train:'练习',defend:'防守',attack:'进攻'};const esc=t=>String(t).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
function render(){const hasFocus=el.contains(doc.activeElement),focusType=doc.activeElement?.dataset?.gameAction;$('.p-route').innerHTML=['猫的观察','狗的练习','伙伴对练'].map((n,i)=>'<span class="'+(s.stage===i?'active':'')+'">'+(i+1)+' '+n+'</span>').join('');$('[data-p-title]').textContent=NAMES[s.stage];$('[data-testid="pet-cue"]').textContent=s.phase==='playing'?cue(s).cue:s.phase==='between'?'这场已完成，下一场有不同的行动规律。':s.phase==='won'?'基础篇通关':'挑战结束，可重试';$('.p-stats').innerHTML=s.stage<2?'<span>信任 '+s.trust+' / '+(s.stage===0?6:7)+'</span><span>容错 '+s.tolerance+' / 3</span><span>剩余行动 '+s.actionsLeft+'</span>':'<span>你的体力 '+s.health+' / 5</span><span>对手体力 '+s.rival+' / 10</span><span>行动力 '+s.energy+' / 6</span><span>专注 '+s.focus+' / 2</span><span>剩余行动 '+s.actionsLeft+'</span>';const actions=s.stage===0?['wait','observe','approach']:s.stage===1?['rest','play','train']:['observe','defend','attack'];$('.p-actions').innerHTML=actions.map((a,i)=>'<button data-game-action="'+a+'" '+(paused||s.phase!=='playing'?'disabled':'')+'>'+labels[a]+' <small>['+(i+1)+']</small></button>').join('');$('.p-next').hidden=s.phase!=='between';$('.p-next').disabled=paused;$('.p-retry').hidden=s.phase!=='lost';$('.p-retry').disabled=paused;$('.p-feedback').textContent=paused?'已暂停。保存完成后可继续。':s.message;$('[data-p-help]').textContent=s.stage===0?'停在原地 → 等一等；好奇观察 → 观察；主动靠近 → 慢慢接近。每次行动消耗 1 次，做错会减少容错。':s.stage===1?'需要休息 → 休息；准备互动 → 互动；可以练习 → 练习。':(s.config.partnerKey?'使用已结识的伙伴。':'借用临时伙伴，不登记为永久收藏。')+' 对手防守 → 观察；准备冲击 → 防守；露出空档 → 进攻。进攻要 2 行动力和 1 专注。数字键 1–3 选择，Enter 继续，R 重试。';$('[data-p-history]').innerHTML=s.history.map(t=>'<p>'+esc(t)+'</p>').join('');if(hasFocus){const focus=focusType?el.querySelector('[data-game-action="'+focusType+'"]'):null;if(focus&&!focus.disabled&&!focus.hidden)focus.focus({preventScroll:true});else el.focus({preventScroll:true});}}
function emit(type){if(!paused&&!disposed)options.onAction({type});}function click(e){const b=e.target.closest('[data-game-action]');if(b&&!b.disabled)emit(b.dataset.gameAction);}function key(e){if(paused||disposed||e.repeat||e.ctrlKey||e.metaKey||e.altKey||e.target.closest('input,select,textarea'))return;if(e.target.closest('button')&&(e.key==='Enter'||e.key===' '))return;let type=['1','2','3'].includes(e.key)?(s.stage===0?['wait','observe','approach']:s.stage===1?['rest','play','train']:['observe','defend','attack'])[Number(e.key)-1]:e.key==='Enter'?'next':e.key.toLowerCase()==='r'?'retry':null;if(type){e.preventDefault();emit(type);}}el.addEventListener('click',click);el.addEventListener('keydown',key);render();return{update(next){validate(next);s=clone(next);render();},setPaused(v){paused=!!v;render();},dispose(){disposed=true;el.removeEventListener('click',click);el.removeEventListener('keydown',key);el.remove();}};}
return{id:'pets',version:1,title:'梁家猫狗图鉴',create,step,validate,result,mount,cue};});
;
(function(root,factory){const old=typeof module==='object'&&module.exports?require('./dungeon.js'):root.LiangGames.dungeon;const E=factory(old);if(typeof module==='object'&&module.exports)module.exports=E;else root.LiangGames={...root.LiangGames,oldDungeon:old,dungeon:E};})(typeof globalThis!=='undefined'?globalThis:this,function(B){
'use strict';const clone=x=>JSON.parse(JSON.stringify(x));
function create(config){const s=B.create(config);s.config.scoutPartner=config?.scoutPartner??null;s.scoutUsed=0;s.scoutCells=[];validate(s);return s;}
function validate(s){B.validate(s);if(!(s.config.scoutPartner===null||/^[0-2]:(cat|dog)$/.test(s.config.scoutPartner))||![0,1].includes(s.scoutUsed)||!Array.isArray(s.scoutCells)||s.scoutCells.length>25||s.scoutCells.some(p=>!Number.isInteger(p.floor)||p.floor<0||p.floor>2||!Number.isInteger(p.cell)||p.cell<0||p.cell>=81||!s.floors[p.floor].seen[p.cell])||new Set(s.scoutCells.map(p=>p.floor+':'+p.cell)).size!==s.scoutCells.length||s.scoutUsed!==Number(s.scoutCells.length>0)||s.scoutUsed&&!s.config.scoutPartner)throw Error('伙伴侦查进度无效。');return true;}
function unseen(s){if(s.phase!=='playing'||!s.config.scoutPartner||s.scoutUsed)return[];const f=s.floors[s.floor],out=[];for(let y=Math.max(0,s.player.y-3);y<=Math.min(8,s.player.y+3);y++)for(let x=Math.max(0,s.player.x-3);x<=Math.min(8,s.player.x+3);x++)if(Math.abs(x-s.player.x)+Math.abs(y-s.player.y)<=3&&!f.seen[y*9+x])out.push({floor:s.floor,cell:y*9+x});return out;}
function step(s,a){validate(s);if(a?.type!=='scout'){const next=B.step(s,a);validate(next);return next;}const next=clone(s),cells=unseen(s);if(!cells.length)return next;for(const p of cells)next.floors[p.floor].seen[p.cell]=true;next.scoutUsed=1;next.scoutCells=cells;next.notice='伙伴侦查揭开了 '+cells.length+' 格迷雾（距离 3 格以内）。本局侦查已用，伙伴仍保留。';validate(next);return next;}
function result(s){validate(s);const r=B.result(s);return r?{...r,scoutPartner:s.config.scoutPartner,scoutUsed:s.scoutUsed,scoutRevealed:s.scoutCells.length}:null;}
function mount(container,options){let s=clone(options.state),paused=false;const ui=B.mount(container,options),el=container.querySelector('[data-testid="dungeon-game"]'),doc=container.ownerDocument;const panel=container;const box=doc.createElement('div');box.className='lg-dungeon';box.style.cssText='border:1px solid #8d9873;border-radius:12px;padding:10px;margin-top:12px;background:#243e3f';const b=doc.createElement('button');b.dataset.gameAction='scout';b.dataset.testid='pet-scout';const note=doc.createElement('p');note.style.cssText='font-size:13px;margin-top:8px';box.append(b,note);panel.append(box);b.addEventListener('click',()=>{if(!b.disabled)options.onAction({type:'scout'});});function render(){b.textContent=s.scoutUsed?'本局已侦查':'伙伴侦查 [J]';b.disabled=paused||unseen(s).length===0;note.textContent=s.config.scoutPartner?(s.config.scoutPartner.endsWith(':cat')?'猫示意 01':'狗示意 02')+' · Masai 已结识伙伴。揭开距离 3 格内的迷雾，每局最多一次；没有新格子时不消耗。':'没有选择永久伙伴。照常探索，不影响基础通关。';}function key(e){if(e.key.toLowerCase()==='j'&&!e.repeat&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!e.target.closest('input,select,textarea')){e.preventDefault();if(!b.disabled)options.onAction({type:'scout'});}}el.addEventListener('keydown',key);render();return{update(next){validate(next);s=clone(next);ui.update(next);render();},setPaused(v){paused=!!v;ui.setPaused(v);render();},dispose(){el.removeEventListener('keydown',key);box.remove();ui.dispose();}};}
return{...B,version:2,create,validate,step,result,mount,unseen};});
;
/* v0.8: verified pets, atomic permanent rights/affinity and optional maze scout. Frozen v7 validates old archives. */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('./core-v7.js'),require('./legacy-core.js'),{fishing:require('./games/fishing.js'),kitchen:require('./games/kitchen.js'),trunk:require('./games/trunk.js'),dungeon:require('./games/dungeon-v2.js'),pets:require('./games/pets.js'),oldDungeon:require('./games/dungeon.js'),kart:require('./games/kart.js'),platform:require('./games/platform.js')});
 else root.LiangCore=factory(root.LiangCore,root.LiangLegacyCore,root.LiangGames);
})(typeof globalThis!=='undefined'?globalThis:this,function(V7,L,G){
'use strict';
const SCHEMA=8,MAX_PAYLOAD=L.MAX_PAYLOAD,KEY=L.KEY,clone=L.clone,crc=L.crc,uid=L.uid;
const RESOURCE_IDS=['fishing','kitchen','trunk'],ADVENTURE_IDS=['dungeon','kart','platform'],IDS=[...RESOURCE_IDS,...ADVENTURE_IDS,'pets'],ITEMS=['fish','meal'],REGIONS=['Rawang','Masai'],OLD=['slipper','ball','jar'];
const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b),obj=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
const int=(x,min=0,max=1e9)=>Number.isSafeInteger(x)&&x>=min&&x<=max;
const ident=x=>typeof x==='string'&&/^[A-Za-z0-9:_-]{1,140}$/.test(x);
function check(value,message){if(!value)throw Error(message);}
const stock=()=>({Rawang:{fish:0,meal:0},Masai:{fish:0,meal:0}});
const extra=()=>({pets:{version:1,region:'Masai',anchor:{snacks:0,rewardIds:[]},proofs:{},partners:{},ledger:[]}});
function engine(id,version){const E=id==='dungeon'&&version===1?G.oldDungeon:G[id];check(IDS.includes(id)&&E&&(version===undefined||E.version===version),'游戏组件未正确载入，请刷新后重试。');return E;}
function fresh(){return {...V7.fresh(),schemaVersion:SCHEMA,...extra()};}
function legacyProjection(s){const p=clone(s);p.schemaVersion=3;p.migrationArchive=null;if(p.activeSession?.gameId==='module')p.activeSession=null;return p;}
function validateModuleResult(r){
 check(obj(r)&&ident(r.runId)&&ident(r.sessionToken)&&IDS.includes(r.moduleId)&&r.version===(r.moduleId==='dungeon'&&r.version===2?2:1)&&['practice','inventory'].includes(r.mode)&&['won','lost','abandoned'].includes(r.status)&&int(r.score)&&int(r.at,0,1e15)&&typeof r.actionHash==='string','游戏结算记录无效。');
 check(obj(r.goods)&&int(r.goods.fish,0,12)&&int(r.goods.meals,0,12)&&Array.isArray(r.goods.shipped)&&r.goods.shipped.length<=12&&r.goods.shipped.every(x=>obj(x)&&ident(x.id)&&ITEMS.includes(x.itemId)&&x.qty===1)&&new Set(r.goods.shipped.map(x=>x.id)).size===r.goods.shipped.length,'游戏物资凭证无效。');
 check(Array.isArray(r.goods.collectibles)&&r.goods.collectibles.length<=3&&r.goods.collectibles.every(x=>OLD.includes(x)),'河里旧物记录无效。');
 if(ADVENTURE_IDS.includes(r.moduleId)){
  check(r.goods.fish===0&&r.goods.meals===0&&!r.goods.shipped.length&&!r.goods.collectibles.length,'冒险与赛车只记录本局结果，不自动生产共享物资。');
  check(int(r.mealsUsed,0,1)&&(r.mode!=='practice'||r.mealsUsed===0)&&(r.mealsUsed===0?r.mealProofHash===null:typeof r.mealProofHash==='string'),'料理使用凭证无效。');
  if(r.discoveries!==undefined)check(r.moduleId==='dungeon'&&Array.isArray(r.discoveries)&&r.discoveries.length<=100&&r.discoveries.every(x=>typeof x==='string'&&x.length<=100),'本局发现记录无效。');
 }
 else if(r.moduleId==='pets')check(r.goods.fish===0&&r.goods.meals===0&&!r.goods.shipped.length&&!r.goods.collectibles.length&&obj(r.petWins)&&typeof r.petWins.cat==='boolean'&&typeof r.petWins.dog==='boolean','图鉴只记录真实挑战，不自动发物资。');
 else if(r.mode==='practice'||r.status!=='won')check(r.goods.fish===0&&r.goods.meals===0&&!r.goods.shipped.length&&!r.goods.collectibles.length,'练习或未通关记录不能增加共享物资。');
 else if(r.moduleId==='fishing')check(r.goods.fish>0&&r.goods.meals===0&&!r.goods.shipped.length,'钓鱼只能产出鱼和确认过的旧物。');
 else if(r.moduleId==='kitchen')check(r.goods.fish===0&&int(r.goods.meals,1,3)&&!r.goods.shipped.length&&!r.goods.collectibles.length,'厨房只能加工料理，不能额外产生鱼或收藏。');
 else check(r.goods.fish===0&&r.goods.meals===0&&r.goods.shipped.length>0&&!r.goods.collectibles.length,'运输只能转移装车清单中的物资。');
}
function checkRunInventory(s,run){
 if(!run||run.config.mode!=='inventory')return;
 const available=s.economy.inventory.Rawang;
 if(run.moduleId==='kitchen')check(int(run.config.units,1,3)&&available.fish>=run.config.units,'这局厨房需要的鱼已被其他进度使用，不能恢复。请保留两个备份，并返回现有进度。');
 if(run.moduleId==='trunk'){
  const counts={fish:0,meal:0};for(const cargo of run.config.cargo)counts[cargo.itemId]+=cargo.qty;
  check(ITEMS.every(item=>available[item]>=counts[item]),'这局运输清单中的物资已被其他进度使用，不能恢复。请保留两个备份，并返回现有进度。');
 }
 if(ADVENTURE_IDS.includes(run.moduleId)&&run.config.mealCharges===1&&run.state.mealsUsed===0)check(s.economy.inventory.Masai.meal>=1,'这局尚未使用的可选料理已被其他进度消费，不能恢复旧选择。请保留两个备份，在现有进度选择不带料理的新一局。');
}
// Capacity is checked before replay. No expanded transcript is allocated.
const TRANSCRIPT_LIMITS=Object.freeze({maxRecords:20000,maxBytes:1800000,maxSteps:300000,maxTicksPerRun:100});
function logLimit(ok){if(!ok){const e=Error('本局记录已接近容量上限。当前进度仍可保存和导出，请先返回棋盘。');e.code='MODULE_LOG_LIMIT';throw e;}}
function canonicalTick(a){return obj(a)&&a.type==='tick'&&int(a.dt,1,250)&&JSON.stringify(a)===JSON.stringify({type:'tick',dt:a.dt});}
function recordInfo(a){
 check(obj(a)&&typeof a.type==='string'&&JSON.stringify(a).length<=2000,'游戏操作记录无效。');
 if(a.type==='tick-run'){check(Object.keys(a).sort().join(',')==='count,dt,type'&&Object.hasOwn(a,'type')&&int(a.dt,1,250)&&int(a.count,2,TRANSCRIPT_LIMITS.maxTicksPerRun),'连续计时记录无效。');return{steps:a.count,atom:JSON.stringify({type:'tick',dt:a.dt}),tick:true};}
 return{steps:1,atom:JSON.stringify(a),tick:canonicalTick(a)};
}
function actionStats(actions){
 check(Array.isArray(actions),'游戏操作记录无效。');logLimit(actions.length<=TRANSCRIPT_LIMITS.maxRecords);
 let steps=0,bytes=2;for(let i=0;i<actions.length;i++){const info=recordInfo(actions[i]);steps+=info.steps;bytes+=JSON.stringify(actions[i]).length+(i?1:0);logLimit(steps<=TRANSCRIPT_LIMITS.maxSteps&&bytes<=TRANSCRIPT_LIMITS.maxBytes);}
 return{records:actions.length,steps,bytes};
}
function appendAction(actions,action,sealedLength=actions.length){
 const stats=actionStats(actions);check(int(sealedLength,0,actions.length),'已封存的操作边界无效。');recordInfo(action);check(action.type!=='tick-run','输入必须是单步操作，连续计时由记录器生成。');
 const next=actions.slice(),last=actions.at(-1);let replacement=null;
 if(actions.length>sealedLength&&canonicalTick(action)&&last){if(canonicalTick(last)&&last.dt===action.dt)replacement={type:'tick-run',dt:action.dt,count:2};else if(last.type==='tick-run'&&last.dt===action.dt&&last.count<TRANSCRIPT_LIMITS.maxTicksPerRun)replacement={type:'tick-run',dt:action.dt,count:last.count+1};}
 let records=stats.records,bytes=stats.bytes;
 if(replacement){bytes+=JSON.stringify(replacement).length-JSON.stringify(last).length;next[next.length-1]=replacement;}
 else{records++;bytes+=JSON.stringify(action).length+(actions.length?1:0);next.push(clone(action));}
 logLimit(records<=TRANSCRIPT_LIMITS.maxRecords&&stats.steps+1<=TRANSCRIPT_LIMITS.maxSteps&&bytes<=TRANSCRIPT_LIMITS.maxBytes);return next;
}
function sameActionPrefix(prefix,actions){
 actionStats(prefix);actionStats(actions);let i=0,j=0,a=null,b=null;
 while(i<prefix.length){if(!a)a=recordInfo(prefix[i]);if(!b){if(j>=actions.length)return false;b=recordInfo(actions[j]);}if(a.atom!==b.atom)return false;const count=Math.min(a.steps,b.steps);a={...a,steps:a.steps-count};b={...b,steps:b.steps-count};if(!a.steps){i++;a=null;}if(!b.steps){j++;b=null;}}
 return true;
}
function compactActions(actions){
 actionStats(actions);const next=[];for(const a of actions){if(canonicalTick(a)){const last=next.at(-1);if(canonicalTick(last)&&last.dt===a.dt)next[next.length-1]={type:'tick-run',dt:a.dt,count:2};else if(last?.type==='tick-run'&&last.dt===a.dt&&last.count<TRANSCRIPT_LIMITS.maxTicksPerRun)next[next.length-1]={type:'tick-run',dt:a.dt,count:last.count+1};else next.push(clone(a));}else next.push(clone(a));}actionStats(next);return next;
}
// Caches contain only verified replay states. Exact record JSON, full run
// identity/config and current engine function references gate every reuse.
const MAX_CACHE_UNITS=4*1024*1024,MAX_CACHE_ENTRIES=12;
const replayCache=new Map();let replayCacheUnits=0;
function cacheRemove(key){const entry=replayCache.get(key);if(entry){replayCacheUnits-=entry.units;replayCache.delete(key);}}
function rememberReplay(key,entry){cacheRemove(key);if(entry.units>MAX_CACHE_UNITS)return;while(replayCache.size>=MAX_CACHE_ENTRIES||replayCacheUnits+entry.units>MAX_CACHE_UNITS)cacheRemove(replayCache.keys().next().value);replayCache.set(key,entry);replayCacheUnits+=entry.units;}
function replay(run,{onMealUse}={}){
 check(obj(run)&&ident(run.id)&&IDS.includes(run.moduleId)&&[1,2].includes(run.version)&&obj(run.config)&&['practice','inventory'].includes(run.config.mode)&&int(run.config.seed,0,0xffffffff)&&int(run.config.difficulty,0,2)&&int(run.startedAt,0,1e15),'游戏开局资料无效。');
 actionStats(run.actions);const E=engine(run.moduleId,run.version),adventure=ADVENTURE_IDS.includes(run.moduleId),identity=JSON.stringify({id:run.id,sessionToken:run.sessionToken,moduleId:run.moduleId,version:run.version,config:run.config,startedAt:run.startedAt}),records=run.actions.map(a=>JSON.stringify(a));
 let prior=null;for(const p of replayCache.values())if(p.identity===identity&&p.create===E.create&&p.step===E.step&&p.validate===E.validate&&p.records.length<=records.length&&(!prior||p.records.length>prior.records.length)&&p.records.every((a,i)=>a===records[i]))prior=p;
 let state=prior?clone(prior.state):E.create(clone(run.config)),use=prior?.use?clone(prior.use):null,start=prior?.records.length||0;
 if(adventure)check(int(run.config.mealCharges,0,1)&&(run.config.mode!=='practice'||run.config.mealCharges===0)&&(prior||state.mealsUsed===0),'新游戏料理配置无效。');
 for(let index=start;index<run.actions.length;index++){const record=run.actions[index],info=recordInfo(record),action=record.type==='tick-run'?{type:'tick',dt:record.dt}:record;
  for(let n=0;n<info.steps;n++){const before=state.mealsUsed;state=E.step(state,clone(action));if(adventure){check(int(state.mealsUsed,0,run.config.mealCharges)&&state.mealsUsed>=before&&(state.mealsUsed===before||action.type==='use-meal'&&before===0&&state.mealsUsed===1),'料理必须由真实生效的使用操作产生，不能回退或重复使用。');if(state.mealsUsed!==before)use={index,state:clone(state)};}}
 }
 E.validate(state);check(eq(state,run.state),'游戏进度与实际操作记录不一致。');
 const units=identity.length+records.reduce((n,a)=>n+a.length+16,0)+JSON.stringify(state).length+(use?JSON.stringify(use).length:0);
 rememberReplay(identity+'|'+records.length,{identity,records,state:clone(state),use:use?clone(use):null,create:E.create,step:E.step,validate:E.validate,units});
 if(use)onMealUse?.(use.index,clone(use.state));return state;
}
function validateMealPrefix(run){let useIndex=-1;const state=replay(run,{onMealUse:index=>{useIndex=index;}});check(state.mealsUsed===1&&useIndex===run.actions.length-1,'料理消费缺少首次真实生效的操作前缀。');}
// Exact old payload validation also needs a bounded cache: a migration archive
// can contain a full old transcript. Never treat a checksum alone as identity.
const archiveCache=new Map();let archiveUnits=0;
function oldFunctionIdentity(){return[...Object.values(V7).filter(v=>typeof v==='function'),...Object.values(L).filter(v=>typeof v==='function'),...IDS.flatMap(id=>{const E=engine(id);return[E.create,E.step,E.validate];})];}
function validateOldPayload(payload,checksum,schema){
 check(typeof payload==='string'&&payload.length<=MAX_PAYLOAD&&int(schema,1,7),'升级前备份校验失败。');const refs=oldFunctionIdentity(),prior=archiveCache.get(payload);
 if(prior&&prior.schema===schema&&prior.checksum===checksum&&prior.refs.length===refs.length&&prior.refs.every((f,i)=>f===refs[i]))return;
 check(checksum===crc(payload),'升级前备份校验失败。');const old=JSON.parse(payload);check(old.schemaVersion===schema,'升级前备份版本不一致。');V7.migrate(old);
 if(prior){archiveCache.delete(payload);archiveUnits-=payload.length;}
 if(payload.length>MAX_CACHE_UNITS)return;while(archiveCache.size>=4||archiveUnits+payload.length>MAX_CACHE_UNITS){const key=archiveCache.keys().next().value;archiveCache.delete(key);archiveUnits-=key.length;}archiveCache.set(payload,{schema,checksum,refs});archiveUnits+=payload.length;
}
const PET_RULES=Object.freeze({snackCost:5,affinityGain:20,affinityCap:100,scoutRadius:3});
const petKey=(slot,species)=>slot+':'+species;
function slotFor(s){return s.board?.players[s.board.turn]?.learnerSlot??0;}
function ownedPartner(s,key,slot){const p=s.pets?.partners?.[key];return !!p&&p.owned===true&&p.region==='Masai'&&p.learnerSlot===slot;}
function petEligibility(s,species,slot=slotFor(s)){check(['cat','dog'].includes(species)&&int(slot,0,2),'伙伴编号无效。');return Object.values(s.pets.proofs).find(p=>p.learnerSlot===slot&&p.region==='Masai'&&p.run.state.wins[species])?.run.id??null;}
function validatePets(s){
 const p=s.pets;check(obj(p)&&p.version===1&&p.region==='Masai'&&obj(p.anchor)&&obj(p.proofs)&&obj(p.partners)&&Array.isArray(p.ledger),'伙伴存档缺失。');
 const archived=s.migrationArchive?JSON.parse(s.migrationArchive.payload):null;
 check(eq(p.anchor,{snacks:archived?.shared.snacks??0,rewardIds:archived?.transactions?.map(t=>t.id)??[]}), '零食来源与升级前备份不一致。');
 check(int(p.anchor.snacks)&&Array.isArray(p.anchor.rewardIds)&&s.transactions.length>=p.anchor.rewardIds.length&&eq(s.transactions.slice(0,p.anchor.rewardIds.length).map(t=>t.id),p.anchor.rewardIds),'学习奖励来源不能删改。');
 for(const[id,proof]of Object.entries(p.proofs)){check(obj(proof)&&proof.run?.id===id&&proof.run.moduleId==='pets'&&int(proof.learnerSlot,0,2)&&proof.region==='Masai'&&int(proof.at,0,1e15),'图鉴挑战凭证无效。');const state=replay(proof.run),claim=s.modules.claims[id];check(claim?.moduleId==='pets'&&claim.learnerSlot===proof.learnerSlot&&claim.sessionToken===proof.run.sessionToken&&claim.actionHash===crc(JSON.stringify({config:proof.run.config,actions:proof.run.actions}))&&eq(claim.petWins,state.wins)&&claim.at===proof.at,'图鉴资格与实际挑战不一致。');const outcome=engine('pets').result(state);check(claim.status==='abandoned'||outcome&&outcome.status===claim.status&&outcome.score===claim.score,'没有实际挑战结果。');}
 for(const c of Object.values(s.modules.claims))if(c.moduleId==='pets')check(p.proofs[c.runId],'已结算图鉴缺少真实挑战凭证。');
 let snacks=p.anchor.snacks+(s.transactions.length-p.anchor.rewardIds.length)*5;const partners={},ids=new Set();
 for(const t of p.ledger){check(obj(t)&&ident(t.id)&&!ids.has(t.id)&&ident(t.operationId)&&int(t.at,0,1e15)&&/^[0-2]:(cat|dog)$/.test(t.partnerKey)&&['befriend','affinity'].includes(t.type)&&t.region==='Masai'&&int(t.learnerSlot,0,2)&&t.partnerKey===petKey(t.learnerSlot,t.species),'伙伴消费凭证无效。');ids.add(t.id);
 if(t.type==='befriend'){const proof=p.proofs[t.qualifiedRun];check(!partners[t.partnerKey]&&t.id==='pet-befriend:'+t.partnerKey&&proof?.learnerSlot===t.learnerSlot&&proof.run.state.wins[t.species]===true&&t.snackCost===5&&int(t.beforeSnacks,5)&&t.afterSnacks===t.beforeSnacks-5&&int(t.rewardCount,p.anchor.rewardIds.length,s.transactions.length),'永久结识必须来自对应挑战和真实零食。');const spent=Object.keys(partners).length*5;check(t.beforeSnacks===p.anchor.snacks+(t.rewardCount-p.anchor.rewardIds.length)*5-spent,'结识时零食余额与来源不一致。');snacks-=5;partners[t.partnerKey]={species:t.species,learnerSlot:t.learnerSlot,region:'Masai',owned:true,affinity:0,qualifiedRun:t.qualifiedRun,adoptId:t.id};}
 else {const partner=partners[t.partnerKey],row=s.economy.ledger.find(x=>x.id===t.id);check(partner&&t.id==='pet-feed:'+t.operationId&&t.quantity===1&&t.beforeAffinity===partner.affinity&&t.gain===Math.min(20,100-partner.affinity)&&t.gain>0&&t.afterAffinity===partner.affinity+t.gain&&t.beforeMeal>=1&&t.afterMeal===t.beforeMeal-1&&row?.type==='pet-meal-consume'&&row.partnerKey===t.partnerKey&&row.at===t.at,'料理必须实际提升已结识伙伴的亲密度。');partner.affinity=t.afterAffinity;}}
 check(snacks===s.shared.snacks&&int(snacks)&&eq(partners,p.partners),'伙伴、亲密度或零食余额与消费流水不一致。');
 if(s.modules.pending?.moduleId==='pets'&&s.modules.pending.config.partnerKey!==null)check(ownedPartner(s,s.modules.pending.config.partnerKey,s.activeSession.learnerSlot),'图鉴不能借用其他档案的永久伙伴。');
 if(s.modules.pending?.moduleId==='dungeon'&&s.modules.pending.version===2&&s.modules.pending.config.scoutPartner!==null)check(ownedPartner(s,s.modules.pending.config.scoutPartner,s.activeSession.learnerSlot),'迷宫伙伴未永久结识或不属于当前档案。');
 for(const r of Object.values(s.modules.claims))if(r.moduleId==='dungeon'&&r.version===2){check(int(r.learnerSlot,0,2)&&(r.scoutPartner===null||ownedPartner(s,r.scoutPartner,r.learnerSlot))&&int(r.scoutUsed,0,1)&&int(r.scoutRevealed,0,25)&&r.scoutUsed===Number(r.scoutRevealed>0),'迷宫侦查结果无效。');}
}
function befriendPet(s,species,operationId=uid()){return atomic(s,draft=>{
 check(ident(operationId),'操作标识无效。');check(!draft.activeSession,'请先保存结算或结束当前一局，再结识伙伴。');const slot=slotFor(draft),key=petKey(slot,species);check(['cat','dog'].includes(species),'伙伴编号无效。');if(ownedPartner(draft,key,slot))return{duplicate:true,partner:clone(draft.pets.partners[key])};const qualifiedRun=petEligibility(draft,species,slot);check(qualifiedRun,'请先完成这个编号对应的挑战，再自愿永久结识。');check(draft.shared.snacks>=5,'需要 5 份零食；余额不足仍可借临时伙伴完整通关。');const before=draft.shared.snacks,id='pet-befriend:'+key;draft.shared.snacks-=5;const t={id,operationId,type:'befriend',at:Date.now(),partnerKey:key,species,learnerSlot:slot,region:'Masai',qualifiedRun,snackCost:5,beforeSnacks:before,afterSnacks:draft.shared.snacks,rewardCount:draft.transactions.length};draft.pets.ledger.push(t);draft.pets.partners[key]={species,learnerSlot:slot,region:'Masai',owned:true,affinity:0,qualifiedRun,adoptId:id};L.note(draft,(species==='cat'?'猫示意 01':'狗示意 02')+' 已永久结识，使用 5 零食。');return{duplicate:false,partner:clone(draft.pets.partners[key])};});}
function feedPet(s,key,operationId=uid()){return atomic(s,draft=>{check(ident(operationId),'操作标识无效。');const prior=draft.pets.ledger.find(t=>t.id==='pet-feed:'+operationId);if(prior){check(prior.partnerKey===key,'操作标识已用于另一伙伴。');return{duplicate:true,gain:prior.gain};}check(!draft.activeSession,'请先保存结算或结束当前一局，再喂养伙伴。');const slot=slotFor(draft);check(ownedPartner(draft,key,slot),'只可给当前档案已结识的 Masai 伙伴料理。');const p=draft.pets.partners[key],gain=Math.min(20,100-p.affinity);if(gain===0)return{duplicate:false,gain:0,capped:true};check(draft.economy.inventory.Masai.meal>=1,'Masai 没有料理，可先把 Rawang 的料理运回来。');const id='pet-feed:'+operationId,at=Date.now(),beforeMeal=draft.economy.inventory.Masai.meal,delta=stock();delta.Masai.meal=-1;transaction(draft,{id,type:'pet-meal-consume',at,partnerKey:key,delta});draft.pets.ledger.push({id,operationId,type:'affinity',at,partnerKey:key,species:p.species,learnerSlot:slot,region:'Masai',quantity:1,beforeMeal,afterMeal:beforeMeal-1,beforeAffinity:p.affinity,afterAffinity:p.affinity+gain,gain});p.affinity+=gain;L.note(draft,'给'+(p.species==='cat'?'猫示意 01':'狗示意 02')+' 1 份料理，亲密度 +'+gain+'。');return{duplicate:false,gain,affinity:p.affinity};});}
function validate(s){
 check(obj(s),'存档结构无效。');if(s.schemaVersion!==SCHEMA){const e=Error('请先迁移旧版存档，未覆盖现有资料。');e.code='UNSUPPORTED_SCHEMA';throw e;}
 L.validate(legacyProjection(s));
 if(s.migrationArchive!==null){const a=s.migrationArchive;check(obj(a)&&[1,2,3,4,5,6,7].includes(a.schemaVersion),'升级前备份校验失败。');validateOldPayload(a.payload,a.checksum,a.schemaVersion);}
 check(obj(s.modules)&&obj(s.modules.claims)&&Array.isArray(s.modules.results),'小游戏记录缺失。');
 for(const [id,r] of Object.entries(s.modules.claims)){validateModuleResult(r);check(id===r.runId,'小游戏凭证编号不一致。');}
 check(new Set(Object.values(s.modules.claims).map(r=>r.sessionToken)).size===Object.keys(s.modules.claims).length,'同一个小游戏会话不能有两份结算凭证。');
 check(new Set(s.modules.results.map(r=>r.runId)).size===s.modules.results.length,'小游戏结果重复。');
 for(const r of s.modules.results){validateModuleResult(r);check(eq(r,s.modules.claims[r.runId]),'小游戏结果与凭证不一致。');}
 if(s.modules.pending){const run=s.modules.pending;replay(run);check(!s.modules.claims[run.id],'已结算游戏不能再作为未完成局。');const a=s.activeSession;check(a?.gameId==='module'&&a.moduleId===run.moduleId&&a.runId===run.id&&a.token===run.sessionToken,'未完成游戏与会话不一致。');}
 if(s.activeSession?.gameId==='module'){
  const a=s.activeSession;check(s.modules.pending&&ident(a.token)&&int(a.learnerSlot,0,2)&&a.runKey===null&&a.returnSnapshotHash===crc(JSON.stringify(a.returnSnapshot))&&eq(a.returnSnapshot,s.board)&&a.boardId===(s.board?.id||'')&&a.turnNo===(s.board?.turnNo||0),'小游戏返回位置或回合损坏。');
 }
 check(obj(s.adventureMeals),'冒险料理消费凭证缺失。');
 for(const [id,proof] of Object.entries(s.adventureMeals)){
  check(obj(proof)&&proof.run?.id===id&&ADVENTURE_IDS.includes(proof.run.moduleId)&&proof.run.config?.mode==='inventory'&&proof.run.config.mealCharges===1&&int(proof.at,0,1e15)&&proof.transactionId==='adventure-meal:'+id&&proof.actionHash===crc(JSON.stringify({config:proof.run.config,actions:proof.run.actions})),'冒险料理消费来源无效。');
  validateMealPrefix(proof.run);
  const pending=s.modules.pending?.id===id?s.modules.pending:null,claim=s.modules.claims[id];
  check(pending||claim,'料理已经扣除，但找不到本局进度或结束凭证。');
  if(pending)check(pending.sessionToken===proof.run.sessionToken&&pending.state.mealsUsed===1&&eq(pending.config,proof.run.config)&&sameActionPrefix(proof.run.actions,pending.actions),'导入的旧进度早于已经使用的料理。请保留原档，使用较新的完整备份继续。');
  if(claim)check(claim.moduleId===proof.run.moduleId&&claim.sessionToken===proof.run.sessionToken&&claim.mealsUsed===1&&claim.mealProofHash===proof.actionHash,'已结束游戏与料理消费来源不一致。');
 }
 for(const r of Object.values(s.modules.claims))if(ADVENTURE_IDS.includes(r.moduleId))check(!!s.adventureMeals[r.runId]===(r.mealsUsed===1),'游戏料理结果与消费凭证不一致。');
 if(s.modules.pending&&ADVENTURE_IDS.includes(s.modules.pending.moduleId))check(!!s.adventureMeals[s.modules.pending.id]===(s.modules.pending.state.mealsUsed===1),'游戏已使用料理，缺少原子消费凭证。');
 const e=s.economy;check(obj(e)&&e.version===1&&obj(e.inventory)&&Array.isArray(e.ledger)&&Array.isArray(e.riverCollection),'物资账本缺失。');
 check(new Set(e.ledger.map(t=>t.id)).size===e.ledger.length,'物资交易重复。');let expected=stock();const collection=new Set();
 for(const t of e.ledger){
  check(obj(t)&&ident(t.id)&&int(t.at,0,1e15)&&['fish-production','fish-cooking','cargo-transfer','meal-consume','adventure-meal-consume','pet-meal-consume'].includes(t.type)&&obj(t.delta),'物资交易格式无效。');
  for(const zone of REGIONS)for(const item of ITEMS){check(obj(t.delta[zone])&&int(t.delta[zone][item],-12,12),'物资变化数量无效。');expected[zone][item]+=t.delta[zone][item];check(int(expected[zone][item],0,1e8),'物资不足或账本超出限制。');}
  const r=t.delta.Rawang,m=t.delta.Masai;
  if(t.type==='pet-meal-consume'){const p=s.pets.ledger.find(x=>x.id===t.id);check(p?.type==='affinity'&&p.at===t.at&&p.partnerKey===t.partnerKey&&p.beforeMeal-1===p.afterMeal&&expected.Masai.meal===p.afterMeal&&r.fish===0&&r.meal===0&&m.fish===0&&m.meal===-1,'宠物料理流水与亲密凭证不一致。');}
  else if(t.type==='adventure-meal-consume'){
   const proof=s.adventureMeals[t.runId];check(proof&&t.id===proof.transactionId&&t.sessionToken===proof.run.sessionToken&&t.moduleId===proof.run.moduleId&&t.actionHash===proof.actionHash&&t.at===proof.at&&r.fish===0&&r.meal===0&&m.fish===0&&m.meal===-1,'冒险料理消费流水与真实操作不一致。');
  }
  else if(t.type==='meal-consume')check(r.fish===0&&r.meal===0&&m.fish===0&&m.meal===-1&&typeof t.boardId==='string'&&int(t.turnNo,1),'料理消费记录无效。');
  else{
   const claim=s.modules.claims[t.runId];check(claim?.mode==='inventory'&&claim.status==='won'&&t.id==='module:'+claim.runId&&t.actionHash===claim.actionHash,'物资没有对应的真实游戏结算。');
   if(t.type==='fish-production'){check(claim.moduleId==='fishing'&&r.fish===claim.goods.fish&&r.fish>0&&r.meal===0&&m.fish===0&&m.meal===0,'钓鱼产出不守恒。');for(const id of claim.goods.collectibles)collection.add(id);}
   if(t.type==='fish-cooking')check(claim.moduleId==='kitchen'&&r.fish===-claim.goods.meals&&r.meal===claim.goods.meals&&r.meal>0&&m.fish===0&&m.meal===0,'料理加工不守恒。');
   if(t.type==='cargo-transfer'){const counts={fish:0,meal:0};for(const cargo of claim.goods.shipped)counts[cargo.itemId]++;check(claim.moduleId==='trunk'&&counts.fish+counts.meal>0&&r.fish===-counts.fish&&r.meal===-counts.meal&&m.fish===counts.fish&&m.meal===counts.meal,'运输必须等量转移真实物资。');}
  }
 }
 for(const zone of REGIONS)for(const item of ITEMS)check(obj(e.inventory[zone])&&e.inventory[zone][item]===expected[zone][item],'库存与物资流水不一致。');
 for(const r of Object.values(s.modules.claims))if(RESOURCE_IDS.includes(r.moduleId)&&r.mode==='inventory'&&r.status==='won')check(e.ledger.some(t=>t.id==='module:'+r.runId&&t.runId===r.runId),'已发放的物资凭证缺少对应流水，不能覆盖原档。');
 for(const proof of Object.values(s.adventureMeals))check(e.ledger.some(t=>t.id===proof.transactionId&&t.type==='adventure-meal-consume'),'已扣除料理的操作凭证缺少消费流水。');
 check(e.riverCollection.every(x=>OLD.includes(x))&&new Set(e.riverCollection).size===e.riverCollection.length&&eq([...collection].sort(),e.riverCollection.slice().sort()),'河里旧物收藏与来源不一致。');
 checkRunInventory(s,s.modules.pending);
 if(e.diceChoice){const c=e.diceChoice;check(obj(c)&&ident(c.id)&&e.ledger.some(t=>t.id===c.id&&t.type==='meal-consume')&&s.board?.phase==='roll'&&c.boardId===s.board.id&&c.turnNo===s.board.turnNo&&c.turn===s.board.turn&&Array.isArray(c.rolls)&&c.rolls.length===2&&c.rolls.every(x=>int(x,1,6)),'料理骰子选择记录无效。');}
 validatePets(s);return clone(s);
}
// A rejected action must leave the caller's live save untouched. Validate and
// finish all work on a detached draft before publishing any claim or inventory.
function atomic(s,operation){const draft=validate(s),result=operation(draft);validate(draft);Object.assign(s,draft);return result;}
function migrate(input){
 if(input?.schemaVersion===SCHEMA)return{state:validate(input),migrated:false,fromVersion:SCHEMA,toVersion:SCHEMA};
 if(!int(input?.schemaVersion,1,7)){const e=Error('不支持这个存档版本，原档保留。');e.code='UNSUPPORTED_SCHEMA';throw e;}const old=V7.migrate(input).state,payload=JSON.stringify(input);check(payload.length<=MAX_PAYLOAD,'升级前备份超过大小限制，原档保留。');
 const state={...old,...extra(),schemaVersion:SCHEMA,migrationArchive:{schemaVersion:input.schemaVersion,payload,checksum:crc(payload)}};
 state.pets.anchor={snacks:old.shared.snacks,rewardIds:old.transactions.map(t=>t.id)};
 if(state.modules.pending)state.modules.pending.actions=compactActions(state.modules.pending.actions);
 state.migrations.push({from:input.schemaVersion,to:SCHEMA,at:Date.now(),note:'保留完整旧档、料理凭证与正在进行的一局；伙伴默认为未结识，不补发奖励。'});
 return{state:validate(state),migrated:true,fromVersion:input.schemaVersion,toVersion:SCHEMA};
}
function launchModuleDraft(s,id,options={}){
 check(obj(options),'游戏模式配置无效。');
 check(!s.activeSession&&!s.modules.pending,'请先继续或结束尚未完成的一局。');check(!s.economy.diceChoice,'请先选好本回合的骰子。');const E=engine(id);
 const mode=options.mode??'practice',difficulty=options.difficulty??0;check(['practice','inventory'].includes(mode)&&int(difficulty,0,2),'游戏模式无效。');
 const seed=parseInt(crc(uid()),16)>>>0,config={seed,mode,difficulty};
 if(ADVENTURE_IDS.includes(id)){
  const charges=options.mealCharges??0;check(int(charges,0,1)&&(mode!=='practice'||charges===0),'每局最多选择一份料理，练习关不使用仓库物资。');
  check(charges===0||s.economy.inventory.Masai.meal>=1,'Masai 没有料理，可不带料理开始，或先从 Rawang 运一份过来。');config.mealCharges=charges;
  if(id==='kart'&&options.trackId!==undefined){check(['masai-market','north-south'].includes(options.trackId),'赛道尚未接入。');config.trackId=options.trackId;}
 }
 if(id==='pets'){const key=options.partnerKey??null;check(key===null||ownedPartner(s,key,slotFor(s)),'只能选择本档案已结识的 Masai 伙伴。');config.partnerKey=key;}
 if(id==='dungeon'){const key=options.scoutPartner??null;check(key===null||ownedPartner(s,key,slotFor(s)),'临时或其他档案的伙伴不能用于迷宫。');config.scoutPartner=key;}
 if(id==='kitchen'){const units=options.units??3;check(int(units,1,3),'每局请选择一至三份料理。');config.units=mode==='practice'?units:Math.min(units,s.economy.inventory.Rawang.fish);check(config.units>0,'Rawang 还没有鱼。可以先玩练习关，或去河边钓鱼。');}
 if(id==='trunk'&&mode==='inventory'){
  config.cargo=[];const amounts=options.cargo??s.economy.inventory.Rawang;check(obj(amounts),'装箱数量清单无效。');
  for(const item of ['meal','fish']){check(int(amounts[item]??0,0,s.economy.inventory.Rawang[item]),'装箱数量超过 Rawang 库存。');const count=Math.min(amounts[item]??0,12-config.cargo.length);for(let n=0;n<count;n++)config.cargo.push({id:item+'-'+(n+1),itemId:item,qty:1});}
  check(config.cargo.length>0,'Rawang 暂无可运物资。可以先玩装箱练习。');
 }
 const initial=E.create(clone(config));E.validate(initial);
 const token=uid(),runId=uid(),slot=s.board?.players[s.board.turn].learnerSlot??0;
 s.activeSession={gameId:'module',moduleId:id,runId,token,learnerSlot:slot,boardId:s.board?.id||'',turnNo:s.board?.turnNo||0,returnSnapshot:clone(s.board),returnSnapshotHash:crc(JSON.stringify(s.board)),runKey:null};
 s.modules.pending={id:runId,sessionToken:token,moduleId:id,version:E.version,config,startedAt:Date.now(),actions:[],state:initial};
 L.note(s,'进入'+E.title+(mode==='practice'?' · 练习关':' · 联动物资关'));return clone(s.activeSession);
}
function launchModule(s,id,options={}){return atomic(s,draft=>launchModuleDraft(draft,id,options));}
function updateModuleDraft(s,token,actions,state){
 const run=s.modules.pending;check(s.activeSession?.token===token&&s.activeSession.gameId==='module'&&run,'游戏会话已改变。');
 check(eq(s.activeSession.returnSnapshot,s.board)&&s.activeSession.returnSnapshotHash===crc(JSON.stringify(s.board)),'棋盘位置或回合已改变，未覆盖本局进度。');
 checkRunInventory(s,run);
 check(Array.isArray(actions)&&actions.length>=run.actions.length&&eq(actions.slice(0,run.actions.length),run.actions),'游戏进度不能倒退或替换已保存操作。');
 const next={...run,actions:clone(actions),state:clone(state)};let use=null;replay(next,{onMealUse:(index,usedState)=>{use={index,state:usedState};}});s.modules.pending=next;
 if(ADVENTURE_IDS.includes(run.moduleId)&&next.state.mealsUsed===1&&!s.adventureMeals[run.id]){
  check(run.config.mode==='inventory'&&run.config.mealCharges===1&&use,'没有可用料理，未扣除任何库存。');
  const proofRun={...clone(next),actions:clone(next.actions.slice(0,use.index+1)),state:use.state},at=Date.now(),actionHash=crc(JSON.stringify({config:proofRun.config,actions:proofRun.actions})),transactionId='adventure-meal:'+run.id,delta=stock();delta.Masai.meal=-1;
  transaction(s,{id:transactionId,type:'adventure-meal-consume',at,runId:run.id,sessionToken:token,moduleId:run.moduleId,actionHash,delta});
  s.adventureMeals[run.id]={run:proofRun,at,actionHash,transactionId};
 }
 return{saved:true,mealsUsed:next.state.mealsUsed??0};
}
function updateModule(s,token,actions,state){return atomic(s,draft=>updateModuleDraft(draft,token,actions,state));}
function transaction(s,t){
 check(!s.economy.ledger.some(x=>x.id===t.id),'此物资交易已经结算。');
 const nextInventory=clone(s.economy.inventory);
 for(const zone of REGIONS)for(const item of ITEMS){check(obj(t.delta?.[zone])&&int(t.delta[zone][item],-12,12),'物资交易数量无效。');const next=nextInventory[zone][item]+t.delta[zone][item];check(int(next,0,1e8),'物资不足，未扣除也未发放，请保留存档。');nextInventory[zone][item]=next;}
 s.economy.inventory=nextInventory;s.economy.ledger.push(clone(t));
}
function settleModuleDraft(s,token){
 const already=Object.values(s.modules.claims).find(r=>r.sessionToken===token);if(already)return{duplicate:true,result:clone(already)};
 check(s.activeSession?.token===token&&s.activeSession.gameId==='module'&&s.modules.pending,'没有可结算的小游戏。');
 const run=s.modules.pending,state=replay(run),outcome=engine(run.moduleId,run.version).result(state);
 check(outcome&&['won','lost'].includes(outcome.status)&&int(outcome.score),'游戏尚未完成，不能结算。');
 const goods={fish:0,meals:0,shipped:[],collectibles:[]};
 if(run.config.mode==='inventory'&&outcome.status==='won'){
  if(run.moduleId==='fishing'){check(int(outcome.fish,1,12)&&Array.isArray(outcome.collectibles)&&outcome.collectibles.every(id=>OLD.includes(id)),'钓鱼结果无效。');goods.fish=outcome.fish;goods.collectibles=clone(outcome.collectibles);}
  if(run.moduleId==='kitchen'){check(int(outcome.meals,1,run.config.units),'料理数量无效。');goods.meals=outcome.meals;}
  if(run.moduleId==='trunk'){check(Array.isArray(outcome.shipped)&&outcome.shipped.length>0&&new Set(outcome.shipped.map(x=>x.id)).size===outcome.shipped.length&&outcome.shipped.every(x=>run.config.cargo.some(c=>eq(c,x))),'运输清单不是开局时的真实物资。');goods.shipped=clone(outcome.shipped);}
 }
 const r={runId:run.id,sessionToken:token,moduleId:run.moduleId,version:run.version,mode:run.config.mode,status:outcome.status,score:outcome.score,at:Date.now(),actionHash:crc(JSON.stringify({config:run.config,actions:run.actions})),goods};
 if(ADVENTURE_IDS.includes(run.moduleId)){
  check(int(outcome.mealsUsed,0,1)&&outcome.mealsUsed===state.mealsUsed,'本局料理使用结果无效。');r.mealsUsed=state.mealsUsed;r.mealProofHash=s.adventureMeals[run.id]?.actionHash??null;
  if(run.moduleId==='dungeon'&&outcome.discoveries!==undefined)r.discoveries=clone(outcome.discoveries);
 }
 if(run.moduleId==='pets'){r.learnerSlot=s.activeSession.learnerSlot;r.petWins=clone(outcome.petWins);s.pets.proofs[run.id]={run:clone(run),learnerSlot:s.activeSession.learnerSlot,at:r.at,region:'Masai'};}
 if(run.moduleId==='dungeon'&&run.version===2){r.learnerSlot=s.activeSession.learnerSlot;r.scoutPartner=state.config.scoutPartner;r.scoutUsed=state.scoutUsed;r.scoutRevealed=state.scoutCells.length;}
 validateModuleResult(r);s.modules.claims[r.runId]=clone(r);s.modules.results.push(clone(r));
 if(RESOURCE_IDS.includes(run.moduleId)&&r.status==='won'&&r.mode==='inventory'){
  const delta=stock(),type=run.moduleId==='fishing'?'fish-production':run.moduleId==='kitchen'?'fish-cooking':'cargo-transfer';
  if(type==='fish-production'){delta.Rawang.fish=goods.fish;for(const id of goods.collectibles)if(!s.economy.riverCollection.includes(id))s.economy.riverCollection.push(id);}
  if(type==='fish-cooking'){delta.Rawang.fish=-goods.meals;delta.Rawang.meal=goods.meals;}
  if(type==='cargo-transfer')for(const c of goods.shipped){delta.Rawang[c.itemId]-=c.qty;delta.Masai[c.itemId]+=c.qty;}
  transaction(s,{id:'module:'+r.runId,type,at:r.at,runId:r.runId,actionHash:r.actionHash,delta});
 }
 L.closeSession(s,token);s.modules.pending=null;L.note(s,engine(run.moduleId).title+'：'+(r.status==='won'?'通关':'本局结束')+'，'+r.score+'分。'+(r.mode==='practice'?'练习成绩已记录，不改变物资。':'物资与游戏结果已分别保存。'));
 return{duplicate:false,result:clone(r)};
}
function settleModule(s,token){return atomic(s,draft=>settleModuleDraft(draft,token));}
function closeSession(s,token){return atomic(s,draft=>{
 const isModule=draft.activeSession?.gameId==='module',run=isModule?draft.modules.pending:null;
 if(run&&(ADVENTURE_IDS.includes(run.moduleId)||run.moduleId==='pets')){
  check(draft.activeSession.token===token,'过期游戏会话。');const state=replay(run),proof=draft.adventureMeals[run.id];
  const r={runId:run.id,sessionToken:token,moduleId:run.moduleId,version:run.version,mode:run.config.mode,status:'abandoned',score:0,at:Date.now(),actionHash:crc(JSON.stringify({config:run.config,actions:run.actions})),goods:{fish:0,meals:0,shipped:[],collectibles:[]},mealsUsed:state.mealsUsed,mealProofHash:proof?.actionHash??null};
  if(run.moduleId==='pets'){delete r.mealsUsed;delete r.mealProofHash;r.learnerSlot=draft.activeSession.learnerSlot;r.petWins=clone(state.wins);draft.pets.proofs[run.id]={run:clone(run),learnerSlot:draft.activeSession.learnerSlot,at:r.at,region:'Masai'};}
 if(run.moduleId==='dungeon'&&run.version===2){r.learnerSlot=draft.activeSession.learnerSlot;r.scoutPartner=state.config.scoutPartner;r.scoutUsed=state.scoutUsed;r.scoutRevealed=state.scoutCells.length;}
 validateModuleResult(r);draft.modules.claims[run.id]=clone(r);draft.modules.results.push(clone(r));
 }
 const result=L.closeSession(draft,token);if(isModule)draft.modules.pending=null;return result;
});}
function prepareMealDiceDraft(s,a,b){
 check(s.board?.phase==='roll'&&!s.activeSession&&!s.economy.diceChoice,'当前不能使用料理，请先完成本回合或游戏。');check(int(a,1,6)&&int(b,1,6),'骰子数值无效。');
 const id='dice:'+uid(),delta=stock();delta.Masai.meal=-1;transaction(s,{id,type:'meal-consume',at:Date.now(),boardId:s.board.id,turnNo:s.board.turnNo,delta});
 s.economy.diceChoice={id,boardId:s.board.id,turnNo:s.board.turnNo,turn:s.board.turn,rolls:[a,b]};L.note(s,'使用一份 Masai 料理，本回合可在两个骰子结果中选择一个。');return clone(s.economy.diceChoice);
}
function prepareMealDice(s,a,b){return atomic(s,draft=>prepareMealDiceDraft(draft,a,b));}
function chooseMealDice(s,index){return atomic(s,draft=>{const c=draft.economy.diceChoice;check(c&&int(index,0,1)&&c.boardId===draft.board?.id&&c.turnNo===draft.board.turnNo&&c.turn===draft.board.turn,'骰子选择已失效。');L.roll(draft,c.rolls[index]);draft.economy.diceChoice=null;});}
function roll(s,d){return atomic(s,draft=>{check(!draft.economy.diceChoice,'请先选择已掷出的一个骰子。');return L.roll(draft,d);});}
function startBoard(s,n,names){return atomic(s,draft=>{check(!draft.economy.diceChoice,'请先完成料理骰子的选择。');return L.startBoard(draft,n,names);});}
function prepareImport(current,incoming){
 validate(current);const s=migrate(incoming).state;
 if(current.universeId===s.universeId){
  check(eq(current.pets.anchor,s.pets.anchor),'伙伴账本的来源快照不同，请保留两个备份。');
  const leftPet=current.pets.ledger,rightPet=s.pets.ledger,minPet=Math.min(leftPet.length,rightPet.length);check(eq(leftPet.slice(0,minPet),rightPet.slice(0,minPet)),'伙伴消费账本已经分叉，不能相加。');
  check(s.transactions.length>=current.transactions.length&&eq(s.transactions.slice(0,current.transactions.length),current.transactions),'旧备份早于已保存的学习奖励；不能恢复已消费的零食。');
  if(leftPet.length>rightPet.length){const difference=leftPet.slice(rightPet.length).filter(t=>t.type==='befriend').length*PET_RULES.snackCost;s.shared.snacks-=difference;s.pets=clone(current.pets);}else{for(const [id,p]of Object.entries(current.pets.proofs)){check(!s.pets.proofs[id]||eq(s.pets.proofs[id],p),'图鉴挑战来源冲突。');s.pets.proofs[id]=clone(p);}}
  Object.assign(s.claims,current.claims);Object.assign(s.arcadeClaims,current.arcadeClaims);
  for(const r of s.gameResults.arcade){const old=current.arcadeClaims[r.roundId];check(!old||eq(old,r),'导入街机结果与本机凭证冲突。');}
  for(const [id,r] of Object.entries(current.modules.claims)){check(!s.modules.claims[id]||eq(s.modules.claims[id],r),'导入小游戏结果与本机凭证冲突。');s.modules.claims[id]=clone(r);}
  for(const [id,proof] of Object.entries(current.adventureMeals)){
   const incomingProof=s.adventureMeals[id];
   if(incomingProof&&!eq(incomingProof,proof)){
    // Canonicalize only an identical first-use proof represented by different
    // tick-run boundaries or acknowledgement timestamps. Retain the persisted
    // proof and ledger hash; additional fields or different states still fail.
    check(sameActionPrefix(incomingProof.run.actions,proof.run.actions)&&sameActionPrefix(proof.run.actions,incomingProof.run.actions)&&eq({...incomingProof,at:proof.at,actionHash:proof.actionHash,run:{...incomingProof.run,actions:proof.run.actions}},proof),'导入的料理消费凭证与本机真实使用记录冲突。');
    const localEntry=current.economy.ledger.find(t=>t.id===proof.transactionId),incomingEntry=s.economy.ledger.find(t=>t.id===proof.transactionId);
    check(localEntry&&incomingEntry&&eq({...incomingEntry,at:localEntry.at,actionHash:localEntry.actionHash},localEntry),'导入的料理消费流水与本机真实使用记录冲突。');
    const claim=s.modules.claims[id];if(claim&&!current.modules.claims[id]){check(claim.mealProofHash===incomingProof.actionHash,'已结束游戏与料理来源不一致。');claim.mealProofHash=proof.actionHash;const row=s.modules.results.find(r=>r.runId===id);if(row){check(row.mealProofHash===incomingProof.actionHash,'已结束游戏与料理来源不一致。');row.mealProofHash=proof.actionHash;}}
    incomingEntry.at=localEntry.at;incomingEntry.actionHash=localEntry.actionHash;
   }
   s.adventureMeals[id]=clone(proof);
  }
  const left=current.economy.ledger,right=s.economy.ledger,min=Math.min(left.length,right.length);check(eq(left.slice(0,min),right.slice(0,min)),'两台设备的物资账本已经分叉，不能相加或自动覆盖。请先保留两个备份。');
  if(left.length>=right.length)s.economy=clone(current.economy);
  // A pending choice already consumed a meal. Keep it from the selected
  // authoritative ledger branch; dropping it would lose a paid advantage.
  // An already chosen local turn keeps its null choice and cannot use it twice.
  for(const [id,p]of Object.entries(current.pets.proofs)){check(!s.pets.proofs[id]||eq(s.pets.proofs[id],p),'图鉴挑战来源冲突。');s.pets.proofs[id]=clone(p);}
  if(s.economy.diceChoice){const choice=s.economy.diceChoice;check(s.board?.phase==='roll'&&choice.boardId===s.board.id&&choice.turnNo===s.board.turnNo&&choice.turn===s.board.turn,'已使用料理的骰子选择还未完成，与备份棋盘回合不一致。请先在当前进度选好骰子，再导入；原存档和料理扣除记录均已保留。');}
  if(s.modules.pending&&s.modules.claims[s.modules.pending.id]){L.closeSession(s,s.activeSession.token);s.modules.pending=null;}
 }
 for(const r of Object.values(s.settlements.runs))if(r.status==='started'){r.status='invalidated';r.sessionToken=null;}
 if(s.activeSession)s.activeSession.runKey=null;return validate(s);
}
function pack(s){validate(s);const payload=JSON.stringify(s);check(payload.length<=MAX_PAYLOAD,'宇宙存档超过大小限制，请保留备份。');return{payload,checksum:crc(payload)};}
function unpack(p){check(obj(p)&&typeof p.payload==='string'&&p.payload.length<=MAX_PAYLOAD&&p.checksum===crc(p.payload),'存档校验失败，原档未覆盖。');const originalState=JSON.parse(p.payload);return{...migrate(originalState),originalState};}
function wrap(s,old){let previous=null;if(old){const irreversible=!eq(s.pets.ledger,old.pets?.ledger??[])||s.modules.pending?.moduleId==='dungeon'&&s.modules.pending.version===2&&s.modules.pending.state.scoutUsed===1&&old.modules?.pending?.state?.scoutUsed!==1;if(irreversible)previous=pack(s);else if(old.schemaVersion===SCHEMA)previous=pack(old);else{V7.migrate(old);const payload=JSON.stringify(old);check(payload.length<=MAX_PAYLOAD,'旧备份过大。');previous={payload,checksum:crc(payload)};}}return JSON.stringify({format:'LIANG_UNIVERSE',current:pack(s),previous});}
function unwrap(raw){check(typeof raw==='string'&&raw.length<=MAX_PAYLOAD*2+1000,'存档文件过大。');const w=JSON.parse(raw);check(w?.format==='LIANG_UNIVERSE','这不是梁家宇宙存档。');try{return{...unpack(w.current),recovered:false};}catch(e){if(e.code==='UNSUPPORTED_SCHEMA')throw e;if(w.previous)return{...unpack(w.previous),recovered:true};throw e;}}
function encode(s){const bytes=new TextEncoder().encode(JSON.stringify(pack(s)));let text='';for(let n=0;n<bytes.length;n+=8192)text+=String.fromCharCode(...bytes.subarray(n,n+8192));return'LU1.'+(typeof btoa==='function'?btoa(text):Buffer.from(text,'binary').toString('base64')).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
function decode(code){check(typeof code==='string'&&code.length<=MAX_PAYLOAD*6&&/^LU1\.[A-Za-z0-9_-]+$/.test(code),'迁移代码格式无效或过大。');let b=code.slice(4).replace(/-/g,'+').replace(/_/g,'/');b+='='.repeat((4-b.length%4)%4);const bin=typeof atob==='function'?atob(b):Buffer.from(b,'base64').toString('binary');return unpack(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(bin,c=>c.charCodeAt(0))))).state;}
// Preserve the verified legacy rules while preventing a late error in any
// public mutation from leaving half of a learning/arcade/board operation saved.
const legacyMutations=Object.fromEntries(['note','nextTurn','launch','launchArcade','recordArcadeResult','storeLegacy','beginRun','recordSubmission','changeCharacter','invalidateRun','reward'].map(name=>[name,(s,...args)=>atomic(s,draft=>L[name](draft,...args))]));
return{...L,...legacyMutations,SCHEMA,KEY,MAX_PAYLOAD,TRANSCRIPT_LIMITS,actionStats,appendAction,sameActionPrefix,IDS,RESOURCE_IDS,ADVENTURE_IDS,PET_RULES,gameEngine:engine,slotFor,ownedPartner,petEligibility,befriendPet,feedPet,fresh,validate,migrate,launchModule,updateModule,settleModule,prepareMealDice,chooseMealDice,roll,startBoard,closeSession,prepareImport,pack,wrap,unwrap,encode,decode};
});



;
/* G14 foundation: deterministic card turns; no shared inventory or wallet writes. */
(function(root,factory){const E=factory();if(typeof module==='object'&&module.exports)module.exports=E;else(root.LiangGames||(root.LiangGames={})).cards=E;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';const clone=x=>JSON.parse(JSON.stringify(x)),int=(n,a,b)=>Number.isSafeInteger(n)&&n>=a&&n<=b,check=(v,m)=>{if(!v)throw Error(m);};
const CATALOG={jab:{name:'轻快一击',cost:1,damage:2,icon:'↗',text:'对手体力 −2。'},sprint:{name:'稳准出击',cost:2,damage:4,icon:'»',text:'对手体力 −4。'},heavy:{name:'蓄力一击',cost:3,damage:6,icon:'✦',text:'对手体力 −6。'},guard:{name:'抬手防守',cost:1,shield:3,icon:'◇',text:'获得 3 点护盾。'},brace:{name:'站稳防守',cost:2,shield:5,icon:'▣',text:'获得 5 点护盾。'},recover:{name:'歇一歇',cost:2,heal:3,icon:'+',text:'恢复 3 点体力，上限 12。'},look:{name:'再看看手牌',cost:1,draw:2,icon:'▤',text:'抽 2 张牌，手牌最多 7 张。'},focus:{name:'瞄准时机',cost:1,focus:2,icon:'◎',text:'下一张攻击伤害 +2，专注最多 6 点。'},feint:{name:'绕开防守',cost:2,damage:3,pierce:2,icon:'↝',text:'攻击 3 点，其中 2 点绕过护盾。'},fox:{name:'梁弟弟 · 角色卡',cost:2,damage:3,shield:2,icon:'»',character:'brother',text:'攻击 3 点，获得 2 点护盾。'},owl:{name:'梁姐姐 · 角色卡',cost:2,damage:2,draw:1,icon:'▤',character:'sister',text:'攻击 2 点，抽 1 张牌。'},turtle:{name:'梁妹妹 · 角色卡',cost:2,shield:3,heal:1,icon:'◇',character:'little',text:'获得 3 点护盾，恢复 1 点体力。'},'lesson-plan':{name:'旧教案 · 旧物卡',cost:1,draw:1,focus:1,icon:'册',text:'抽 1 张牌，专注 +1。'},cat01:{name:'猫示意 01 · 伙伴卡',cost:2,shield:2,focus:2,icon:'01',text:'护盾 +2，专注 +2。编号文字玩法示意。'}};
Object.values(CATALOG).forEach(Object.freeze);Object.freeze(CATALOG);const STARTER=Object.freeze(['jab','sprint','heavy','guard','brace','recover','look','focus','feint']);
function normalize(c={}){const n={seed:c.seed??1,mode:c.mode??'practice',difficulty:c.difficulty??0,strategy:c.strategy??'rush',deck:c.deck?clone(c.deck):[...STARTER]};check(int(n.seed,0,0xffffffff)&&int(n.difficulty,0,2)&&['practice','inventory'].includes(n.mode)&&['rush','guard'].includes(n.strategy),'卡牌对战配置无效。');check(Array.isArray(n.deck)&&n.deck.length===9&&new Set(n.deck).size===9&&n.deck.every(id=>Object.hasOwn(CATALOG,id)),'请选择 9 张不同的已拥有卡牌。');return n;}
function random(s){s.rng=(Math.imul(s.rng,1664525)+1013904223)>>>0;return s.rng;}
function shuffle(s,ids){const a=[...ids];for(let i=a.length-1;i>0;i--){const j=random(s)%(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;}
function actor(s,ids){return{hp:12,shield:0,focus:0,hand:[],deck:shuffle(s,ids),discard:[]};}
function draw(s,a,n){let count=0;for(let i=0;i<n&&a.hand.length<7;i++){if(!a.deck.length){if(!a.discard.length)break;a.deck=shuffle(s,a.discard);a.discard=[];}a.hand.push(a.deck.shift());count++;}return count;}
function create(config){const c=normalize(config),s={version:1,config:c,phase:'playing',rng:c.seed,round:1,energy:4,player:null,rival:null,inputCount:0,played:0,attempts:1,history:[],message:'选一张能支付费用的牌。出完这一回合，再让电脑行动。'};s.player=actor(s,c.deck);s.rival=actor(s,STARTER);draw(s,s.player,5);draw(s,s.rival,5);return s;}
function validate(s){check(s?.version===1&&JSON.stringify(normalize(s.config))===JSON.stringify(s.config)&&['playing','won','lost'].includes(s.phase),'卡牌进度版本无效。');check(int(s.rng,0,0xffffffff)&&int(s.round,1,24)&&int(s.energy,0,4)&&int(s.inputCount,0,100000)&&int(s.played,0,10000)&&int(s.attempts,1,1000)&&Array.isArray(s.history)&&s.history.length<=10&&s.history.every(x=>typeof x==='string'&&x.length<=300)&&typeof s.message==='string'&&s.message.length<=400,'卡牌回合记录无效。');for(const[a,ids]of[[s.player,s.config.deck],[s.rival,STARTER]])check(a&&int(a.hp,0,12)&&int(a.shield,0,12)&&int(a.focus,0,6)&&Array.isArray(a.hand)&&a.hand.length<=7&&Array.isArray(a.deck)&&Array.isArray(a.discard)&&JSON.stringify([...a.hand,...a.deck,...a.discard].sort())===JSON.stringify([...ids].sort()),'卡牌体力或牌堆不守恒。');if(s.phase==='won')check(s.rival.hp===0&&s.player.hp>0&&s.played>0,'没有实际出牌，不能获胜。');if(s.phase==='lost')check(s.player.hp===0||s.round===24,'失败原因无效。');if(s.phase==='playing')check(s.player.hp>0&&s.rival.hp>0,'已结束的对战不能继续。');return true;}
function note(s,text){s.message=text;s.history.push(text);s.history=s.history.slice(-10);}
function hit(a,n,pierce=0){const blocked=Math.min(a.shield,n-Math.min(n,pierce));a.shield-=blocked;const loss=Math.min(a.hp,n-blocked);a.hp-=loss;return loss;}
function play(s,side,index){const a=s[side],other=s[side==='player'?'rival':'player'],id=a.hand.splice(index,1)[0],c=CATALOG[id],text=[];a.discard.push(id);if(c.damage){text.push('对方体力 −'+hit(other,c.damage+a.focus,c.pierce||0));a.focus=0;}if(c.shield){const n=Math.min(c.shield,12-a.shield);a.shield+=n;text.push('护盾 +'+n);}if(c.heal){const n=Math.min(c.heal,12-a.hp);a.hp+=n;text.push('体力 +'+n);}if(c.focus){const n=Math.min(c.focus,6-a.focus);a.focus+=n;text.push('专注 +'+n);}if(c.draw)text.push('抽 '+draw(s,a,c.draw)+' 张');return(side==='player'?'你':'电脑')+'打出“'+c.name+'”：'+text.join('，')+'。';}
function aiScore(s,id){const c=CATALOG[id];let n=0;if(c.damage)n+=c.damage+s.rival.focus+(c.pierce||0);if(c.shield)n+=(s.config.strategy==='guard'?1.4:.35)*c.shield;if(c.heal)n+=Math.min(12-s.rival.hp,c.heal)*(s.config.strategy==='guard'?2.1:1);if(c.draw)n+=s.rival.hand.length<3?4:1;if(c.focus)n+=s.rival.hand.some(k=>CATALOG[k].damage)?2.5:.1;return n/c.cost+(s.config.difficulty===2&&c.damage>=s.player.hp+s.player.shield?10:0);}
function step(state,action){validate(state);check(action&&typeof action.type==='string','卡牌操作无效。');let s=clone(state);if(action.type==='retry'&&s.phase==='lost'&&s.attempts<1000){const attempts=s.attempts+1,input=s.inputCount+1;s=create(s.config);s.attempts=attempts;s.inputCount=input;note(s,'重新开局。看清费用、护盾和对手体力，再选择出牌顺序。');return s;}if(s.phase!=='playing')return s;
if(action.type==='play'){check(typeof action.cardId==='string','请选择一张手牌。');const i=s.player.hand.indexOf(action.cardId),c=CATALOG[action.cardId];if(i<0||!c||c.cost>s.energy)return s;s.energy-=c.cost;s.inputCount++;s.played++;note(s,play(s,'player',i));if(s.rival.hp===0){s.phase='won';note(s,'赢了！实际出牌完成对战。卡片仍永久保留，回棋盘结算即可。');}}
else if(action.type==='end'){s.inputCount++;s.rival.shield=0;let energy=4;draw(s,s.rival,2);for(let n=0;n<7&&s.player.hp>0;n++){const choices=s.rival.hand.map((id,i)=>({id,i,score:aiScore(s,id)})).filter(x=>CATALOG[x.id].cost<=energy).sort((a,b)=>b.score-a.score||a.i-b.i);if(!choices.length)break;const p=choices[0];energy-=CATALOG[p.id].cost;note(s,play(s,'rival',p.i));}if(s.player.hp===0||s.round===24){s.phase='lost';note(s,s.player.hp===0?'这局体力用完了。下次试试先防守，再留点数进攻。':'已到第 24 回合。这局未击败对手，看看记录，再试一次。');}else{s.round++;s.energy=4;s.player.shield=0;note(s,'轮到你：行动点恢复为 4，抽 '+draw(s,s.player,2)+' 张牌。上一回合剩余护盾已清空。');}}
validate(s);return s;}
function result(s){validate(s);return['won','lost'].includes(s.phase)?{status:s.phase,score:s.phase==='won'?500+s.player.hp*15+(25-s.round)*10:0,rounds:s.round,strategy:s.config.strategy}:null;}
function mount(container,options){const doc=container.ownerDocument,win=doc.defaultView;let s=clone(options.state),paused=false,disposed=false;const el=doc.createElement('section');el.className='lg-cards';el.tabIndex=0;el.dataset.testid='cards-game';el.setAttribute('aria-label','梁家卡牌基础对战');const esc=t=>String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
el.innerHTML=`<style>.lg-cards{max-width:1050px;margin:auto;color:#f3f2e5;background:radial-gradient(ellipse at 50% 30%,#365b58,#152e3f 70%);border:1px solid #88a58c;border-radius:22px;padding:20px;font:16px/1.5 system-ui;outline-offset:3px}.lg-cards *{box-sizing:border-box}.lg-cards p,.lg-cards h2{color:inherit;margin:0 0 10px}.c-kicker{font-size:12px;letter-spacing:2px;color:#f0ce8b}.c-arena{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:16px 0}.c-side{padding:16px;border:1px solid #73887a;border-radius:16px;background:#102b36b8}.c-side.rival{border-color:#bb8a78;background:#3f303c}.c-stat{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px;font-size:13px}.c-stat span{background:#071c29aa;border-radius:8px;padding:5px 8px}.c-health{height:8px;border-radius:8px;background:#081c2a;overflow:hidden;margin:8px 0}.c-health i{display:block;height:100%;background:#95c294}.c-side.rival .c-health i{background:#e3a988}.c-hand{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.c-card{min-height:165px;position:relative;text-align:left;border:1px solid #c4bd94;border-radius:14px;padding:13px;background:linear-gradient(145deg,#f5ecd3,#d9e3d3);color:#16333d;font:14px/1.45 system-ui;box-shadow:0 5px 8px #0003;cursor:pointer;touch-action:manipulation}.c-card:disabled{opacity:.55;cursor:default}.c-card strong{font-size:16px;display:block;padding-right:28px}.c-card small{display:block;margin-top:9px}.c-cost{position:absolute;right:9px;top:9px;border-radius:50%;width:25px;height:25px;text-align:center;background:#244f56;color:#fff;line-height:25px;font-weight:bold}.c-icon{font-size:27px;height:38px;line-height:38px;color:#36706d}.c-art{height:75px;max-width:60px;object-fit:contain;float:left;margin:7px 10px 0 0}.c-actions{display:flex;gap:12px;margin:16px 0;flex-wrap:wrap}.c-actions button{min-height:48px;padding:10px 18px;border:1px solid #a6b891;border-radius:11px;background:#496d5a;color:#f9f5da;font:700 15px system-ui;touch-action:manipulation}.lg-cards button:focus-visible{outline:3px solid #ffd785;outline-offset:3px}.c-feedback{min-height:48px;background:#0b2231;border-left:3px solid #dec38f;border-radius:10px;padding:12px}.c-help{font-size:13px;color:#d1e0d1!important}.c-log{font-size:13px;margin-top:10px}.c-log p{margin:5px 0}.c-paused{opacity:.7}@media(max-width:600px){.lg-cards{padding:10px;border-radius:15px;font-size:14px}.lg-cards h2{font-size:20px}.c-arena{gap:7px;margin:8px 0}.c-side{padding:9px}.c-stat{font-size:11px;gap:4px}.c-stat span{padding:3px 5px}.c-hand{grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.c-card{min-height:122px;padding:9px;font-size:12px}.c-card strong{font-size:13px;padding-right:25px}.c-card small{margin-top:5px}.c-icon{font-size:23px;height:30px;line-height:30px}.c-art{height:54px;max-width:40px;margin-right:6px}.c-actions{margin:9px 0}.c-feedback{padding:9px;margin-bottom:7px!important}.c-help{font-size:11px}}</style><div class="c-kicker">梁家卡牌 · 基础对战 · 免费牌组</div><h2>出牌有顺序，防守看时机</h2><div class="c-arena"></div><p class="c-help c-hint"></p><p class="c-feedback" data-testid="cards-feedback" role="status"></p><div class="c-hand" data-testid="cards-hand"></div><div class="c-actions"><button data-game-action="end">结束回合 [空格]</button><button data-game-action="retry" hidden>重新开局 [R]</button></div><p class="c-help">卡右上角是费用。每回合有 4 点，费用 1–3；护盾先挡攻击，只保留到对方行动完。下一张攻击消耗专注加成。牌堆空时洗回弃牌，手牌最多 7 张；最多 24 回合。卡的所有权不会消耗。</p><details class="c-log"><summary>看看刚才怎么出牌</summary><div data-c-log></div></details>`;container.append(el);const $=q=>el.querySelector(q);
function render(){const active=el.contains(doc.activeElement),oldCard=doc.activeElement?.dataset?.cardId,oldAction=doc.activeElement?.dataset?.gameAction;el.classList.toggle('c-paused',paused);$('.c-arena').innerHTML=[['player','你'],['rival',s.config.strategy==='rush'?'电脑 · 抢攻策略':'电脑 · 稳守策略']].map(([side,name])=>{const a=s[side];return'<div class="c-side '+side+'"><strong>'+name+' · 体力 '+a.hp+' / 12</strong><div class="c-health"><i style="width:'+a.hp/12*100+'%"></i></div><div class="c-stat"><span>护盾 '+a.shield+'</span><span>专注 '+a.focus+'</span><span>手牌 '+a.hand.length+'</span><span>牌堆 '+a.deck.length+'</span><span>弃牌 '+a.discard.length+'</span></div></div>';}).join('');$('.c-hint').textContent='第 '+s.round+' / 24 回合 · 你的行动点 '+s.energy+' / 4。'+(s.phase==='playing'?(s.config.strategy==='rush'?'电脑更积极进攻，留意自己的护盾。':'电脑更愿意防守和恢复，试试专注或绕开防守。'):'');$('.c-feedback').textContent=paused?'已暂停，等保存完成后继续。':s.message;$('.c-hand').innerHTML=s.player.hand.map((id,i)=>{const c=CATALOG[id],art=c.character?win.LiangCharacterArt?.characters?.[c.character]:null;return'<button class="c-card" data-card-id="'+id+'" data-testid="card-'+id+'" '+(paused||s.phase!=='playing'||c.cost>s.energy?'disabled':'')+'><span class="c-cost">'+c.cost+'</span><strong>'+esc(c.name)+'</strong>'+(art?'<img class="c-art" src="'+art.src+'" alt="'+esc(c.name)+' · source原图">':'<div class="c-icon" aria-hidden="true">'+c.icon+'</div>')+'<span>'+esc(c.text)+'</span><small>手牌 '+(i+1)+' · 数字键 '+(i+1)+'</small></button>';}).join('');$('[data-game-action="end"]').disabled=paused||s.phase!=='playing';$('[data-game-action="retry"]').hidden=s.phase!=='lost';$('[data-game-action="retry"]').disabled=paused;$('[data-c-log]').innerHTML=s.history.map(t=>'<p>'+esc(t)+'</p>').join('');if(active){const n=oldCard?el.querySelector('[data-card-id="'+oldCard+'"]'):oldAction?el.querySelector('[data-game-action="'+oldAction+'"]'):null;if(n&&!n.disabled&&!n.hidden)n.focus({preventScroll:true});else el.focus({preventScroll:true});}}
function emit(a){if(!paused&&!disposed)options.onAction(a);}function click(e){const b=e.target.closest('button');if(!b||b.disabled)return;if(b.dataset.cardId)emit({type:'play',cardId:b.dataset.cardId});else if(b.dataset.gameAction)emit({type:b.dataset.gameAction});}function key(e){if(paused||disposed||e.repeat||e.ctrlKey||e.metaKey||e.altKey||e.target.closest('input,select,textarea'))return;if(e.target.closest('button')&&(e.key==='Enter'||e.key===' '))return;let a=null;if(/^[1-7]$/.test(e.key)){const id=s.player.hand[Number(e.key)-1];if(id)a={type:'play',cardId:id};}else if(e.key===' '&&e.target===el)a={type:'end'};else if(e.key.toLowerCase()==='r')a={type:'retry'};if(a){e.preventDefault();emit(a);}}
el.addEventListener('click',click);el.addEventListener('keydown',key);render();return{update(n){validate(n);s=clone(n);render();},setPaused(v){paused=!!v;render();},dispose(){disposed=true;el.removeEventListener('click',click);el.removeEventListener('keydown',key);el.remove();}};}
return{id:'cards',version:1,title:'梁家卡牌',CATALOG,STARTER,create,validate,step,result,mount};
});

;
/* v0.9: actual card battles and replay-verified permanent card sources. Frozen v8 validates prior saves. */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('./core-v8.js'),require('./legacy-core.js'),{fishing:require('./games/fishing.js'),kitchen:require('./games/kitchen.js'),trunk:require('./games/trunk.js'),dungeon:require('./games/dungeon-v2.js'),pets:require('./games/pets.js'),oldDungeon:require('./games/dungeon.js'),kart:require('./games/kart.js'),platform:require('./games/platform.js'),cards:require('./games/cards.js')});
 else root.WQUniverseCore=factory(root.LiangCore,root.LiangLegacyCore,root.LiangGames);
})(typeof globalThis!=='undefined'?globalThis:this,function(V8,L,G){
'use strict';
const SCHEMA=9,MAX_PAYLOAD=L.MAX_PAYLOAD,KEY=L.KEY,clone=L.clone,crc=L.crc,uid=L.uid;
const RESOURCE_IDS=['fishing','kitchen','trunk'],ADVENTURE_IDS=['dungeon','kart','platform'],IDS=[...RESOURCE_IDS,...ADVENTURE_IDS,'pets','cards'],ITEMS=['fish','meal'],REGIONS=['Rawang','Masai'],OLD=['slipper','ball','jar'];
const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b),obj=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
const int=(x,min=0,max=1e9)=>Number.isSafeInteger(x)&&x>=min&&x<=max;
const ident=x=>typeof x==='string'&&/^[A-Za-z0-9:_-]{1,140}$/.test(x);
function check(value,message){if(!value)throw Error(message);}
const stock=()=>({Rawang:{fish:0,meal:0},Masai:{fish:0,meal:0}});
const extra=()=>({cards:{version:1,proofs:{},unlocks:{},decks:{}}});
function engine(id,version){const E=id==='dungeon'&&version===1?G.oldDungeon:G[id];check(IDS.includes(id)&&E&&(version===undefined||E.version===version),'游戏组件未正确载入，请刷新后重试。');return E;}
function fresh(){return {...V8.fresh(),schemaVersion:SCHEMA,...extra()};}
function legacyProjection(s){const p=clone(s);p.schemaVersion=3;p.migrationArchive=null;if(p.activeSession?.gameId==='module')p.activeSession=null;return p;}
function validateModuleResult(r){
 check(obj(r)&&ident(r.runId)&&ident(r.sessionToken)&&IDS.includes(r.moduleId)&&r.version===(r.moduleId==='dungeon'&&r.version===2?2:1)&&['practice','inventory'].includes(r.mode)&&['won','lost','abandoned'].includes(r.status)&&int(r.score)&&int(r.at,0,1e15)&&typeof r.actionHash==='string','游戏结算记录无效。');
 check(obj(r.goods)&&int(r.goods.fish,0,12)&&int(r.goods.meals,0,12)&&Array.isArray(r.goods.shipped)&&r.goods.shipped.length<=12&&r.goods.shipped.every(x=>obj(x)&&ident(x.id)&&ITEMS.includes(x.itemId)&&x.qty===1)&&new Set(r.goods.shipped.map(x=>x.id)).size===r.goods.shipped.length,'游戏物资凭证无效。');
 check(Array.isArray(r.goods.collectibles)&&r.goods.collectibles.length<=3&&r.goods.collectibles.every(x=>OLD.includes(x)),'河里旧物记录无效。');
 if(ADVENTURE_IDS.includes(r.moduleId)){
  check(r.goods.fish===0&&r.goods.meals===0&&!r.goods.shipped.length&&!r.goods.collectibles.length,'冒险与赛车只记录本局结果，不自动生产共享物资。');
  check(int(r.mealsUsed,0,1)&&(r.mode!=='practice'||r.mealsUsed===0)&&(r.mealsUsed===0?r.mealProofHash===null:typeof r.mealProofHash==='string'),'料理使用凭证无效。');
  if(r.discoveries!==undefined)check(r.moduleId==='dungeon'&&Array.isArray(r.discoveries)&&r.discoveries.length<=100&&r.discoveries.every(x=>typeof x==='string'&&x.length<=100),'本局发现记录无效。');
 }
 else if(r.moduleId==='cards')check(r.goods.fish===0&&r.goods.meals===0&&!r.goods.shipped.length&&!r.goods.collectibles.length&&int(r.rounds,1,24)&&['rush','guard'].includes(r.strategy),'卡牌只记录实际对战，不能生产共享物资。');
 else if(r.moduleId==='pets')check(r.goods.fish===0&&r.goods.meals===0&&!r.goods.shipped.length&&!r.goods.collectibles.length&&obj(r.petWins)&&typeof r.petWins.cat==='boolean'&&typeof r.petWins.dog==='boolean','图鉴只记录真实挑战，不自动发物资。');
 else if(r.mode==='practice'||r.status!=='won')check(r.goods.fish===0&&r.goods.meals===0&&!r.goods.shipped.length&&!r.goods.collectibles.length,'练习或未通关记录不能增加共享物资。');
 else if(r.moduleId==='fishing')check(r.goods.fish>0&&r.goods.meals===0&&!r.goods.shipped.length,'钓鱼只能产出鱼和确认过的旧物。');
 else if(r.moduleId==='kitchen')check(r.goods.fish===0&&int(r.goods.meals,1,3)&&!r.goods.shipped.length&&!r.goods.collectibles.length,'厨房只能加工料理，不能额外产生鱼或收藏。');
 else check(r.goods.fish===0&&r.goods.meals===0&&r.goods.shipped.length>0&&!r.goods.collectibles.length,'运输只能转移装车清单中的物资。');
}
function checkRunInventory(s,run){
 if(!run||run.config.mode!=='inventory')return;
 const available=s.economy.inventory.Rawang;
 if(run.moduleId==='kitchen')check(int(run.config.units,1,3)&&available.fish>=run.config.units,'这局厨房需要的鱼已被其他进度使用，不能恢复。请保留两个备份，并返回现有进度。');
 if(run.moduleId==='trunk'){
  const counts={fish:0,meal:0};for(const cargo of run.config.cargo)counts[cargo.itemId]+=cargo.qty;
  check(ITEMS.every(item=>available[item]>=counts[item]),'这局运输清单中的物资已被其他进度使用，不能恢复。请保留两个备份，并返回现有进度。');
 }
 if(ADVENTURE_IDS.includes(run.moduleId)&&run.config.mealCharges===1&&run.state.mealsUsed===0)check(s.economy.inventory.Masai.meal>=1,'这局尚未使用的可选料理已被其他进度消费，不能恢复旧选择。请保留两个备份，在现有进度选择不带料理的新一局。');
}
// Capacity is checked before replay. No expanded transcript is allocated.
const TRANSCRIPT_LIMITS=Object.freeze({maxRecords:20000,maxBytes:1800000,maxSteps:300000,maxTicksPerRun:100});
function logLimit(ok){if(!ok){const e=Error('本局记录已接近容量上限。当前进度仍可保存和导出，请先返回棋盘。');e.code='MODULE_LOG_LIMIT';throw e;}}
function canonicalTick(a){return obj(a)&&a.type==='tick'&&int(a.dt,1,250)&&JSON.stringify(a)===JSON.stringify({type:'tick',dt:a.dt});}
function recordInfo(a){
 check(obj(a)&&typeof a.type==='string'&&JSON.stringify(a).length<=2000,'游戏操作记录无效。');
 if(a.type==='tick-run'){check(Object.keys(a).sort().join(',')==='count,dt,type'&&Object.hasOwn(a,'type')&&int(a.dt,1,250)&&int(a.count,2,TRANSCRIPT_LIMITS.maxTicksPerRun),'连续计时记录无效。');return{steps:a.count,atom:JSON.stringify({type:'tick',dt:a.dt}),tick:true};}
 return{steps:1,atom:JSON.stringify(a),tick:canonicalTick(a)};
}
function actionStats(actions){
 check(Array.isArray(actions),'游戏操作记录无效。');logLimit(actions.length<=TRANSCRIPT_LIMITS.maxRecords);
 let steps=0,bytes=2;for(let i=0;i<actions.length;i++){const info=recordInfo(actions[i]);steps+=info.steps;bytes+=JSON.stringify(actions[i]).length+(i?1:0);logLimit(steps<=TRANSCRIPT_LIMITS.maxSteps&&bytes<=TRANSCRIPT_LIMITS.maxBytes);}
 return{records:actions.length,steps,bytes};
}
function appendAction(actions,action,sealedLength=actions.length){
 const stats=actionStats(actions);check(int(sealedLength,0,actions.length),'已封存的操作边界无效。');recordInfo(action);check(action.type!=='tick-run','输入必须是单步操作，连续计时由记录器生成。');
 const next=actions.slice(),last=actions.at(-1);let replacement=null;
 if(actions.length>sealedLength&&canonicalTick(action)&&last){if(canonicalTick(last)&&last.dt===action.dt)replacement={type:'tick-run',dt:action.dt,count:2};else if(last.type==='tick-run'&&last.dt===action.dt&&last.count<TRANSCRIPT_LIMITS.maxTicksPerRun)replacement={type:'tick-run',dt:action.dt,count:last.count+1};}
 let records=stats.records,bytes=stats.bytes;
 if(replacement){bytes+=JSON.stringify(replacement).length-JSON.stringify(last).length;next[next.length-1]=replacement;}
 else{records++;bytes+=JSON.stringify(action).length+(actions.length?1:0);next.push(clone(action));}
 logLimit(records<=TRANSCRIPT_LIMITS.maxRecords&&stats.steps+1<=TRANSCRIPT_LIMITS.maxSteps&&bytes<=TRANSCRIPT_LIMITS.maxBytes);return next;
}
function sameActionPrefix(prefix,actions){
 actionStats(prefix);actionStats(actions);let i=0,j=0,a=null,b=null;
 while(i<prefix.length){if(!a)a=recordInfo(prefix[i]);if(!b){if(j>=actions.length)return false;b=recordInfo(actions[j]);}if(a.atom!==b.atom)return false;const count=Math.min(a.steps,b.steps);a={...a,steps:a.steps-count};b={...b,steps:b.steps-count};if(!a.steps){i++;a=null;}if(!b.steps){j++;b=null;}}
 return true;
}
function compactActions(actions){
 actionStats(actions);const next=[];for(const a of actions){if(canonicalTick(a)){const last=next.at(-1);if(canonicalTick(last)&&last.dt===a.dt)next[next.length-1]={type:'tick-run',dt:a.dt,count:2};else if(last?.type==='tick-run'&&last.dt===a.dt&&last.count<TRANSCRIPT_LIMITS.maxTicksPerRun)next[next.length-1]={type:'tick-run',dt:a.dt,count:last.count+1};else next.push(clone(a));}else next.push(clone(a));}actionStats(next);return next;
}
// Caches contain only verified replay states. Exact record JSON, full run
// identity/config and current engine function references gate every reuse.
const MAX_CACHE_UNITS=4*1024*1024,MAX_CACHE_ENTRIES=12;
const replayCache=new Map();let replayCacheUnits=0;
function cacheRemove(key){const entry=replayCache.get(key);if(entry){replayCacheUnits-=entry.units;replayCache.delete(key);}}
function rememberReplay(key,entry){cacheRemove(key);if(entry.units>MAX_CACHE_UNITS)return;while(replayCache.size>=MAX_CACHE_ENTRIES||replayCacheUnits+entry.units>MAX_CACHE_UNITS)cacheRemove(replayCache.keys().next().value);replayCache.set(key,entry);replayCacheUnits+=entry.units;}
function replay(run,{onMealUse}={}){
 check(obj(run)&&ident(run.id)&&IDS.includes(run.moduleId)&&[1,2].includes(run.version)&&obj(run.config)&&['practice','inventory'].includes(run.config.mode)&&int(run.config.seed,0,0xffffffff)&&int(run.config.difficulty,0,2)&&int(run.startedAt,0,1e15),'游戏开局资料无效。');
 actionStats(run.actions);const E=engine(run.moduleId,run.version),adventure=ADVENTURE_IDS.includes(run.moduleId),identity=JSON.stringify({id:run.id,sessionToken:run.sessionToken,moduleId:run.moduleId,version:run.version,config:run.config,startedAt:run.startedAt}),records=run.actions.map(a=>JSON.stringify(a));
 let prior=null;for(const p of replayCache.values())if(p.identity===identity&&p.create===E.create&&p.step===E.step&&p.validate===E.validate&&p.records.length<=records.length&&(!prior||p.records.length>prior.records.length)&&p.records.every((a,i)=>a===records[i]))prior=p;
 let state=prior?clone(prior.state):E.create(clone(run.config)),use=prior?.use?clone(prior.use):null,start=prior?.records.length||0;
 if(adventure)check(int(run.config.mealCharges,0,1)&&(run.config.mode!=='practice'||run.config.mealCharges===0)&&(prior||state.mealsUsed===0),'新游戏料理配置无效。');
 for(let index=start;index<run.actions.length;index++){const record=run.actions[index],info=recordInfo(record),action=record.type==='tick-run'?{type:'tick',dt:record.dt}:record;
  for(let n=0;n<info.steps;n++){const before=state.mealsUsed;state=E.step(state,clone(action));if(adventure){check(int(state.mealsUsed,0,run.config.mealCharges)&&state.mealsUsed>=before&&(state.mealsUsed===before||action.type==='use-meal'&&before===0&&state.mealsUsed===1),'料理必须由真实生效的使用操作产生，不能回退或重复使用。');if(state.mealsUsed!==before)use={index,state:clone(state)};}}
 }
 E.validate(state);check(eq(state,run.state),'游戏进度与实际操作记录不一致。');
 const units=identity.length+records.reduce((n,a)=>n+a.length+16,0)+JSON.stringify(state).length+(use?JSON.stringify(use).length:0);
 rememberReplay(identity+'|'+records.length,{identity,records,state:clone(state),use:use?clone(use):null,create:E.create,step:E.step,validate:E.validate,units});
 if(use)onMealUse?.(use.index,clone(use.state));return state;
}
function validateMealPrefix(run){let useIndex=-1;const state=replay(run,{onMealUse:index=>{useIndex=index;}});check(state.mealsUsed===1&&useIndex===run.actions.length-1,'料理消费缺少首次真实生效的操作前缀。');}
// Exact old payload validation also needs a bounded cache: a migration archive
// can contain a full old transcript. Never treat a checksum alone as identity.
const archiveCache=new Map();let archiveUnits=0;
function oldFunctionIdentity(){return[...Object.values(V8).filter(v=>typeof v==='function'),...Object.values(L).filter(v=>typeof v==='function'),...IDS.flatMap(id=>{const E=engine(id);return[E.create,E.step,E.validate];})];}
function validateOldPayload(payload,checksum,schema){
 check(typeof payload==='string'&&payload.length<=MAX_PAYLOAD&&int(schema,1,8),'升级前备份校验失败。');const refs=oldFunctionIdentity(),prior=archiveCache.get(payload);
 if(prior&&prior.schema===schema&&prior.checksum===checksum&&prior.refs.length===refs.length&&prior.refs.every((f,i)=>f===refs[i]))return;
 check(checksum===crc(payload),'升级前备份校验失败。');const old=JSON.parse(payload);check(old.schemaVersion===schema,'升级前备份版本不一致。');V8.migrate(old);
 if(prior){archiveCache.delete(payload);archiveUnits-=payload.length;}
 if(payload.length>MAX_CACHE_UNITS)return;while(archiveCache.size>=4||archiveUnits+payload.length>MAX_CACHE_UNITS){const key=archiveCache.keys().next().value;archiveCache.delete(key);archiveUnits-=key.length;}archiveCache.set(payload,{schema,checksum,refs});archiveUnits+=payload.length;
}
const PET_RULES=Object.freeze({snackCost:5,affinityGain:20,affinityCap:100,scoutRadius:3});
const petKey=(slot,species)=>slot+':'+species;
function slotFor(s){return s.board?.players[s.board.turn]?.learnerSlot??0;}
function ownedPartner(s,key,slot){const p=s.pets?.partners?.[key];return !!p&&p.owned===true&&p.region==='Masai'&&p.learnerSlot===slot;}
function petEligibility(s,species,slot=slotFor(s)){check(['cat','dog'].includes(species)&&int(slot,0,2),'伙伴编号无效。');return Object.values(s.pets.proofs).find(p=>p.learnerSlot===slot&&p.region==='Masai'&&p.run.state.wins[species])?.run.id??null;}
function validatePets(s){
 const p=s.pets;check(obj(p)&&p.version===1&&p.region==='Masai'&&obj(p.anchor)&&obj(p.proofs)&&obj(p.partners)&&Array.isArray(p.ledger),'伙伴存档缺失。');
 const archived=s.migrationArchive?JSON.parse(s.migrationArchive.payload):null;
 check(eq(p.anchor,archived?.schemaVersion===8?archived.pets.anchor:{snacks:archived?.shared.snacks??0,rewardIds:archived?.transactions?.map(t=>t.id)??[]}), '零食来源与升级前备份不一致。');
 check(int(p.anchor.snacks)&&Array.isArray(p.anchor.rewardIds)&&s.transactions.length>=p.anchor.rewardIds.length&&eq(s.transactions.slice(0,p.anchor.rewardIds.length).map(t=>t.id),p.anchor.rewardIds),'学习奖励来源不能删改。');
 for(const[id,proof]of Object.entries(p.proofs)){check(obj(proof)&&proof.run?.id===id&&proof.run.moduleId==='pets'&&int(proof.learnerSlot,0,2)&&proof.region==='Masai'&&int(proof.at,0,1e15),'图鉴挑战凭证无效。');const state=replay(proof.run),claim=s.modules.claims[id];check(claim?.moduleId==='pets'&&claim.learnerSlot===proof.learnerSlot&&claim.sessionToken===proof.run.sessionToken&&claim.actionHash===crc(JSON.stringify({config:proof.run.config,actions:proof.run.actions}))&&eq(claim.petWins,state.wins)&&claim.at===proof.at,'图鉴资格与实际挑战不一致。');const outcome=engine('pets').result(state);check(claim.status==='abandoned'||outcome&&outcome.status===claim.status&&outcome.score===claim.score,'没有实际挑战结果。');}
 for(const c of Object.values(s.modules.claims))if(c.moduleId==='pets')check(p.proofs[c.runId],'已结算图鉴缺少真实挑战凭证。');
 let snacks=p.anchor.snacks+(s.transactions.length-p.anchor.rewardIds.length)*5;const partners={},ids=new Set();
 for(const t of p.ledger){check(obj(t)&&ident(t.id)&&!ids.has(t.id)&&ident(t.operationId)&&int(t.at,0,1e15)&&/^[0-2]:(cat|dog)$/.test(t.partnerKey)&&['befriend','affinity'].includes(t.type)&&t.region==='Masai'&&int(t.learnerSlot,0,2)&&t.partnerKey===petKey(t.learnerSlot,t.species),'伙伴消费凭证无效。');ids.add(t.id);
 if(t.type==='befriend'){const proof=p.proofs[t.qualifiedRun];check(!partners[t.partnerKey]&&t.id==='pet-befriend:'+t.partnerKey&&proof?.learnerSlot===t.learnerSlot&&proof.run.state.wins[t.species]===true&&t.snackCost===5&&int(t.beforeSnacks,5)&&t.afterSnacks===t.beforeSnacks-5&&int(t.rewardCount,p.anchor.rewardIds.length,s.transactions.length),'永久结识必须来自对应挑战和真实零食。');const spent=Object.keys(partners).length*5;check(t.beforeSnacks===p.anchor.snacks+(t.rewardCount-p.anchor.rewardIds.length)*5-spent,'结识时零食余额与来源不一致。');snacks-=5;partners[t.partnerKey]={species:t.species,learnerSlot:t.learnerSlot,region:'Masai',owned:true,affinity:0,qualifiedRun:t.qualifiedRun,adoptId:t.id};}
 else {const partner=partners[t.partnerKey],row=s.economy.ledger.find(x=>x.id===t.id);check(partner&&t.id==='pet-feed:'+t.operationId&&t.quantity===1&&t.beforeAffinity===partner.affinity&&t.gain===Math.min(20,100-partner.affinity)&&t.gain>0&&t.afterAffinity===partner.affinity+t.gain&&t.beforeMeal>=1&&t.afterMeal===t.beforeMeal-1&&row?.type==='pet-meal-consume'&&row.partnerKey===t.partnerKey&&row.at===t.at,'料理必须实际提升已结识伙伴的亲密度。');partner.affinity=t.afterAffinity;}}
 check(snacks===s.shared.snacks&&int(snacks)&&eq(partners,p.partners),'伙伴、亲密度或零食余额与消费流水不一致。');
 if(s.modules.pending?.moduleId==='pets'&&s.modules.pending.config.partnerKey!==null)check(ownedPartner(s,s.modules.pending.config.partnerKey,s.activeSession.learnerSlot),'图鉴不能借用其他档案的永久伙伴。');
 if(s.modules.pending?.moduleId==='dungeon'&&s.modules.pending.version===2&&s.modules.pending.config.scoutPartner!==null)check(ownedPartner(s,s.modules.pending.config.scoutPartner,s.activeSession.learnerSlot),'迷宫伙伴未永久结识或不属于当前档案。');
 for(const r of Object.values(s.modules.claims))if(r.moduleId==='dungeon'&&r.version===2){check(int(r.learnerSlot,0,2)&&(r.scoutPartner===null||ownedPartner(s,r.scoutPartner,r.learnerSlot))&&int(r.scoutUsed,0,1)&&int(r.scoutRevealed,0,25)&&r.scoutUsed===Number(r.scoutRevealed>0),'迷宫侦查结果无效。');}
}
function befriendPet(s,species,operationId=uid()){return atomic(s,draft=>{
 check(ident(operationId),'操作标识无效。');check(!draft.activeSession,'请先保存结算或结束当前一局，再结识伙伴。');const slot=slotFor(draft),key=petKey(slot,species);check(['cat','dog'].includes(species),'伙伴编号无效。');if(ownedPartner(draft,key,slot))return{duplicate:true,partner:clone(draft.pets.partners[key])};const qualifiedRun=petEligibility(draft,species,slot);check(qualifiedRun,'请先完成这个编号对应的挑战，再自愿永久结识。');check(draft.shared.snacks>=5,'需要 5 份零食；余额不足仍可借临时伙伴完整通关。');const before=draft.shared.snacks,id='pet-befriend:'+key;draft.shared.snacks-=5;const t={id,operationId,type:'befriend',at:Date.now(),partnerKey:key,species,learnerSlot:slot,region:'Masai',qualifiedRun,snackCost:5,beforeSnacks:before,afterSnacks:draft.shared.snacks,rewardCount:draft.transactions.length};draft.pets.ledger.push(t);draft.pets.partners[key]={species,learnerSlot:slot,region:'Masai',owned:true,affinity:0,qualifiedRun,adoptId:id};syncCatCards(draft);L.note(draft,(species==='cat'?'猫示意 01':'狗示意 02')+' 已永久结识，使用 5 零食。');return{duplicate:false,partner:clone(draft.pets.partners[key])};});}
function feedPet(s,key,operationId=uid()){return atomic(s,draft=>{check(ident(operationId),'操作标识无效。');const prior=draft.pets.ledger.find(t=>t.id==='pet-feed:'+operationId);if(prior){check(prior.partnerKey===key,'操作标识已用于另一伙伴。');return{duplicate:true,gain:prior.gain};}check(!draft.activeSession,'请先保存结算或结束当前一局，再喂养伙伴。');const slot=slotFor(draft);check(ownedPartner(draft,key,slot),'只可给当前档案已结识的 Masai 伙伴料理。');const p=draft.pets.partners[key],gain=Math.min(20,100-p.affinity);if(gain===0)return{duplicate:false,gain:0,capped:true};check(draft.economy.inventory.Masai.meal>=1,'Masai 没有料理，可先把 Rawang 的料理运回来。');const id='pet-feed:'+operationId,at=Date.now(),beforeMeal=draft.economy.inventory.Masai.meal,delta=stock();delta.Masai.meal=-1;transaction(draft,{id,type:'pet-meal-consume',at,partnerKey:key,delta});draft.pets.ledger.push({id,operationId,type:'affinity',at,partnerKey:key,species:p.species,learnerSlot:slot,region:'Masai',quantity:1,beforeMeal,afterMeal:beforeMeal-1,beforeAffinity:p.affinity,afterAffinity:p.affinity+gain,gain});p.affinity+=gain;L.note(draft,'给'+(p.species==='cat'?'猫示意 01':'狗示意 02')+' 1 份料理，亲密度 +'+gain+'。');return{duplicate:false,gain,affinity:p.affinity};});}

// Card entitlements are permanent sets; nothing here produces shared resources.
const BONUS_CARDS=['fox','owl','turtle','lesson-plan','cat01'];
function cardKey(slot,id){return slot+':'+id;}
function cardOwned(s,id,slot=slotFor(s)){return G.cards.STARTER.includes(id)||!!s.cards?.unlocks?.[cardKey(slot,id)];}
function selectedDeck(s,slot=slotFor(s)){return clone(s.cards.decks[slot]??G.cards.STARTER);}
function checkDeck(s,deck,slot){check(int(slot,0,2)&&Array.isArray(deck)&&deck.length===9&&new Set(deck).size===9&&deck.every(id=>Object.hasOwn(G.cards.CATALOG,id)&&cardOwned(s,id,slot)),'牌组必须是当前孩子拥有的 9 张不同卡牌。');}
function setCardDeck(s,deck,slot=slotFor(s)){return atomic(s,draft=>{check(!draft.activeSession,'先保存或结束当前一局，再换牌组。');check(slot===slotFor(draft),'只能选择当前孩子的牌组。');checkDeck(draft,deck,slot);draft.cards.decks[slot]=clone(deck);return{saved:true};});}
function addCard(s,proof){const key=cardKey(proof.learnerSlot,proof.cardId);if(s.cards.unlocks[key])return false;const id=proof.kind==='cat'?'cat:'+proof.adoptId:proof.kind+':'+proof.run.id;s.cards.proofs[id]=clone(proof);s.cards.unlocks[key]={cardId:proof.cardId,learnerSlot:proof.learnerSlot,proofId:id};return true;}
function syncCatCards(s){for(const t of s.pets.ledger)if(t.type==='befriend'&&t.species==='cat')addCard(s,{kind:'cat',cardId:'cat01',learnerSlot:t.learnerSlot,adoptId:t.id});}
function registerAchievement(s,run,claim,session){if(!run.origin||claim.mode!=='inventory'||claim.status!=='won')return;const board=run.origin.board,player=board?.players[board.turn];if(!player||player.learnerSlot!==session.learnerSlot)return;let cardId=null;if(run.moduleId==='kart'&&claim.rank===1&&claim.finished===true)cardId=player.character;if(run.moduleId==='dungeon'&&run.state.floor===2&&run.state.floors[2].item.id==='lesson-plan'&&run.state.floors[2].item.found)cardId='lesson-plan';if(cardId)addCard(s,{kind:run.moduleId,cardId,learnerSlot:session.learnerSlot,run:clone(run)});}
function validateOrigin(run,slot){const o=run.origin;check(obj(o)&&o.schema===9&&o.learnerSlot===slot&&obj(o.board),'卡片缺少本局棋盘角色来源。');const b=L.fresh();b.board=clone(o.board);L.validate(b);check(o.board.players[o.board.turn].learnerSlot===slot,'卡片属于另一孩子。');return o.board.players[o.board.turn].character;}
function validateCards(s){const c=s.cards;check(obj(c)&&c.version===1&&obj(c.proofs)&&obj(c.unlocks)&&obj(c.decks),'卡牌收藏缺失。');const used=new Set();for(const[key,u]of Object.entries(c.unlocks)){check(obj(u)&&int(u.learnerSlot,0,2)&&BONUS_CARDS.includes(u.cardId)&&key===cardKey(u.learnerSlot,u.cardId)&&typeof u.proofId==='string'&&!used.has(u.proofId),'卡片所有权重复或无效。');used.add(u.proofId);const p=c.proofs[u.proofId];check(obj(p)&&p.cardId===u.cardId&&p.learnerSlot===u.learnerSlot,'卡片没有对应来源。');if(p.kind==='cat'){const t=s.pets.ledger.find(t=>t.id===p.adoptId);check(u.proofId==='cat:'+p.adoptId&&p.cardId==='cat01'&&t?.type==='befriend'&&t.species==='cat'&&t.learnerSlot===p.learnerSlot&&ownedPartner(s,cardKey(p.learnerSlot,'cat'),p.learnerSlot),'猫卡必须有永久结识和实际扣款凭证。');}else{check(['kart','dungeon'].includes(p.kind)&&u.proofId===p.kind+':'+p.run?.id&&p.run.moduleId===p.kind&&p.run.config.mode==='inventory','卡片游戏来源无效。');const character=validateOrigin(p.run,p.learnerSlot),state=replay(p.run),r=s.modules.claims[p.run.id],outcome=engine(p.kind,p.run.version).result(state);check(r?.status==='won'&&r.mode==='inventory'&&r.sessionToken===p.run.sessionToken&&r.actionHash===crc(JSON.stringify({config:p.run.config,actions:p.run.actions}))&&outcome?.status==='won'&&r.score===outcome.score,'卡片没有真实通关回放。');if(p.kind==='kart')check(outcome.finished===true&&outcome.rank===1&&r.rank===1&&r.finished===true&&r.character===character&&p.cardId===character,'角色卡必须来自新局真实第一名和实际棋子角色。');else check(state.floor===2&&state.floors[2].item.id==='lesson-plan'&&state.floors[2].item.found&&state.discoveries.includes('lesson-plan')&&p.cardId==='lesson-plan','旧物卡必须在第三层实际找到旧教案。');}}check(Object.keys(c.proofs).length===used.size&&Object.keys(c.proofs).every(id=>used.has(id)),'卡片来源有孤立或重复凭证。');for(const[slot,deck]of Object.entries(c.decks)){check(/^[0-2]$/.test(slot),'牌组档案无效。');checkDeck(s,deck,Number(slot));}for(const p of Object.values(s.pets.partners))if(p.species==='cat')check(cardOwned(s,'cat01',p.learnerSlot),'永久猫资格不能被导入或删除。');}
function mergeCardRights(s,current){for(const[key,u]of Object.entries(current.cards.unlocks)){const incoming=s.cards.unlocks[key];if(incoming&&incoming.proofId!==u.proofId)delete s.cards.proofs[incoming.proofId];s.cards.unlocks[key]=clone(u);s.cards.proofs[u.proofId]=clone(current.cards.proofs[u.proofId]);}for(const[slot,deck]of Object.entries(current.cards.decks))if(!s.cards.decks[slot])s.cards.decks[slot]=clone(deck);}

function validate(s){
 check(obj(s),'存档结构无效。');if(s.schemaVersion!==SCHEMA){const e=Error('请先迁移旧版存档，未覆盖现有资料。');e.code='UNSUPPORTED_SCHEMA';throw e;}
 L.validate(legacyProjection(s));
 if(s.migrationArchive!==null){const a=s.migrationArchive;check(obj(a)&&[1,2,3,4,5,6,7,8].includes(a.schemaVersion),'升级前备份校验失败。');validateOldPayload(a.payload,a.checksum,a.schemaVersion);}
 check(obj(s.modules)&&obj(s.modules.claims)&&Array.isArray(s.modules.results),'小游戏记录缺失。');
 for(const [id,r] of Object.entries(s.modules.claims)){validateModuleResult(r);check(id===r.runId,'小游戏凭证编号不一致。');}
 check(new Set(Object.values(s.modules.claims).map(r=>r.sessionToken)).size===Object.keys(s.modules.claims).length,'同一个小游戏会话不能有两份结算凭证。');
 check(new Set(s.modules.results.map(r=>r.runId)).size===s.modules.results.length,'小游戏结果重复。');
 for(const r of s.modules.results){validateModuleResult(r);check(eq(r,s.modules.claims[r.runId]),'小游戏结果与凭证不一致。');}
 if(s.modules.pending){const run=s.modules.pending;replay(run);if(run.origin)check(eq(run.origin,{schema:9,board:s.board,learnerSlot:s.activeSession?.learnerSlot}),'新局角色来源与返回棋盘不一致。');if(run.moduleId==='cards')checkDeck(s,run.config.deck,s.activeSession?.learnerSlot);check(!s.modules.claims[run.id],'已结算游戏不能再作为未完成局。');const a=s.activeSession;check(a?.gameId==='module'&&a.moduleId===run.moduleId&&a.runId===run.id&&a.token===run.sessionToken,'未完成游戏与会话不一致。');}
 if(s.activeSession?.gameId==='module'){
  const a=s.activeSession;check(s.modules.pending&&ident(a.token)&&int(a.learnerSlot,0,2)&&a.runKey===null&&a.returnSnapshotHash===crc(JSON.stringify(a.returnSnapshot))&&eq(a.returnSnapshot,s.board)&&a.boardId===(s.board?.id||'')&&a.turnNo===(s.board?.turnNo||0),'小游戏返回位置或回合损坏。');
 }
 check(obj(s.adventureMeals),'冒险料理消费凭证缺失。');
 for(const [id,proof] of Object.entries(s.adventureMeals)){
  check(obj(proof)&&proof.run?.id===id&&ADVENTURE_IDS.includes(proof.run.moduleId)&&proof.run.config?.mode==='inventory'&&proof.run.config.mealCharges===1&&int(proof.at,0,1e15)&&proof.transactionId==='adventure-meal:'+id&&proof.actionHash===crc(JSON.stringify({config:proof.run.config,actions:proof.run.actions})),'冒险料理消费来源无效。');
  validateMealPrefix(proof.run);
  const pending=s.modules.pending?.id===id?s.modules.pending:null,claim=s.modules.claims[id];
  check(pending||claim,'料理已经扣除，但找不到本局进度或结束凭证。');
  if(pending)check(pending.sessionToken===proof.run.sessionToken&&pending.state.mealsUsed===1&&eq(pending.config,proof.run.config)&&sameActionPrefix(proof.run.actions,pending.actions),'导入的旧进度早于已经使用的料理。请保留原档，使用较新的完整备份继续。');
  if(claim)check(claim.moduleId===proof.run.moduleId&&claim.sessionToken===proof.run.sessionToken&&claim.mealsUsed===1&&claim.mealProofHash===proof.actionHash,'已结束游戏与料理消费来源不一致。');
 }
 for(const r of Object.values(s.modules.claims))if(ADVENTURE_IDS.includes(r.moduleId))check(!!s.adventureMeals[r.runId]===(r.mealsUsed===1),'游戏料理结果与消费凭证不一致。');
 if(s.modules.pending&&ADVENTURE_IDS.includes(s.modules.pending.moduleId))check(!!s.adventureMeals[s.modules.pending.id]===(s.modules.pending.state.mealsUsed===1),'游戏已使用料理，缺少原子消费凭证。');
 const e=s.economy;check(obj(e)&&e.version===1&&obj(e.inventory)&&Array.isArray(e.ledger)&&Array.isArray(e.riverCollection),'物资账本缺失。');
 check(new Set(e.ledger.map(t=>t.id)).size===e.ledger.length,'物资交易重复。');let expected=stock();const collection=new Set();
 for(const t of e.ledger){
  check(obj(t)&&ident(t.id)&&int(t.at,0,1e15)&&['fish-production','fish-cooking','cargo-transfer','meal-consume','adventure-meal-consume','pet-meal-consume'].includes(t.type)&&obj(t.delta),'物资交易格式无效。');
  for(const zone of REGIONS)for(const item of ITEMS){check(obj(t.delta[zone])&&int(t.delta[zone][item],-12,12),'物资变化数量无效。');expected[zone][item]+=t.delta[zone][item];check(int(expected[zone][item],0,1e8),'物资不足或账本超出限制。');}
  const r=t.delta.Rawang,m=t.delta.Masai;
  if(t.type==='pet-meal-consume'){const p=s.pets.ledger.find(x=>x.id===t.id);check(p?.type==='affinity'&&p.at===t.at&&p.partnerKey===t.partnerKey&&p.beforeMeal-1===p.afterMeal&&expected.Masai.meal===p.afterMeal&&r.fish===0&&r.meal===0&&m.fish===0&&m.meal===-1,'宠物料理流水与亲密凭证不一致。');}
  else if(t.type==='adventure-meal-consume'){
   const proof=s.adventureMeals[t.runId];check(proof&&t.id===proof.transactionId&&t.sessionToken===proof.run.sessionToken&&t.moduleId===proof.run.moduleId&&t.actionHash===proof.actionHash&&t.at===proof.at&&r.fish===0&&r.meal===0&&m.fish===0&&m.meal===-1,'冒险料理消费流水与真实操作不一致。');
  }
  else if(t.type==='meal-consume')check(r.fish===0&&r.meal===0&&m.fish===0&&m.meal===-1&&typeof t.boardId==='string'&&int(t.turnNo,1),'料理消费记录无效。');
  else{
   const claim=s.modules.claims[t.runId];check(claim?.mode==='inventory'&&claim.status==='won'&&t.id==='module:'+claim.runId&&t.actionHash===claim.actionHash,'物资没有对应的真实游戏结算。');
   if(t.type==='fish-production'){check(claim.moduleId==='fishing'&&r.fish===claim.goods.fish&&r.fish>0&&r.meal===0&&m.fish===0&&m.meal===0,'钓鱼产出不守恒。');for(const id of claim.goods.collectibles)collection.add(id);}
   if(t.type==='fish-cooking')check(claim.moduleId==='kitchen'&&r.fish===-claim.goods.meals&&r.meal===claim.goods.meals&&r.meal>0&&m.fish===0&&m.meal===0,'料理加工不守恒。');
   if(t.type==='cargo-transfer'){const counts={fish:0,meal:0};for(const cargo of claim.goods.shipped)counts[cargo.itemId]++;check(claim.moduleId==='trunk'&&counts.fish+counts.meal>0&&r.fish===-counts.fish&&r.meal===-counts.meal&&m.fish===counts.fish&&m.meal===counts.meal,'运输必须等量转移真实物资。');}
  }
 }
 for(const zone of REGIONS)for(const item of ITEMS)check(obj(e.inventory[zone])&&e.inventory[zone][item]===expected[zone][item],'库存与物资流水不一致。');
 for(const r of Object.values(s.modules.claims))if(RESOURCE_IDS.includes(r.moduleId)&&r.mode==='inventory'&&r.status==='won')check(e.ledger.some(t=>t.id==='module:'+r.runId&&t.runId===r.runId),'已发放的物资凭证缺少对应流水，不能覆盖原档。');
 for(const proof of Object.values(s.adventureMeals))check(e.ledger.some(t=>t.id===proof.transactionId&&t.type==='adventure-meal-consume'),'已扣除料理的操作凭证缺少消费流水。');
 check(e.riverCollection.every(x=>OLD.includes(x))&&new Set(e.riverCollection).size===e.riverCollection.length&&eq([...collection].sort(),e.riverCollection.slice().sort()),'河里旧物收藏与来源不一致。');
 checkRunInventory(s,s.modules.pending);
 if(e.diceChoice){const c=e.diceChoice;check(obj(c)&&ident(c.id)&&e.ledger.some(t=>t.id===c.id&&t.type==='meal-consume')&&s.board?.phase==='roll'&&c.boardId===s.board.id&&c.turnNo===s.board.turnNo&&c.turn===s.board.turn&&Array.isArray(c.rolls)&&c.rolls.length===2&&c.rolls.every(x=>int(x,1,6)),'料理骰子选择记录无效。');}
 validatePets(s);validateCards(s);return clone(s);
}
// A rejected action must leave the caller's live save untouched. Validate and
// finish all work on a detached draft before publishing any claim or inventory.
function atomic(s,operation){const draft=validate(s),result=operation(draft);validate(draft);Object.assign(s,draft);return result;}
function migrate(input){
 if(input?.schemaVersion===SCHEMA)return{state:validate(input),migrated:false,fromVersion:SCHEMA,toVersion:SCHEMA};
 if(!int(input?.schemaVersion,1,8)){const e=Error('不支持这个存档版本，原档保留。');e.code='UNSUPPORTED_SCHEMA';throw e;}const old=V8.migrate(input).state,payload=JSON.stringify(input);check(payload.length<=MAX_PAYLOAD,'升级前备份超过大小限制，原档保留。');
 const state={...old,...extra(),schemaVersion:SCHEMA,migrationArchive:{schemaVersion:input.schemaVersion,payload,checksum:crc(payload)}};
 syncCatCards(state);
 if(state.modules.pending)state.modules.pending.actions=compactActions(state.modules.pending.actions);
 state.migrations.push({from:input.schemaVersion,to:SCHEMA,at:Date.now(),note:'保留完整旧档、料理凭证与正在进行的一局；保留伙伴、库存和旧回放；卡牌基础组免费，已有永久猫凭证登记一次猫卡，不补发资源。'});
 return{state:validate(state),migrated:true,fromVersion:input.schemaVersion,toVersion:SCHEMA};
}
function launchModuleDraft(s,id,options={}){
 check(obj(options),'游戏模式配置无效。');
 check(!s.activeSession&&!s.modules.pending,'请先继续或结束尚未完成的一局。');check(!s.economy.diceChoice,'请先选好本回合的骰子。');const E=engine(id);
 const mode=options.mode??'practice',difficulty=options.difficulty??0;check(['practice','inventory'].includes(mode)&&int(difficulty,0,2),'游戏模式无效。');
 const seed=parseInt(crc(uid()),16)>>>0,config={seed,mode,difficulty};
 if(ADVENTURE_IDS.includes(id)){
  const charges=options.mealCharges??0;check(int(charges,0,1)&&(mode!=='practice'||charges===0),'每局最多选择一份料理，练习关不使用仓库物资。');
  check(charges===0||s.economy.inventory.Masai.meal>=1,'Masai 没有料理，可不带料理开始，或先从 Rawang 运一份过来。');config.mealCharges=charges;
  if(id==='kart'&&options.trackId!==undefined){check(['masai-market','north-south'].includes(options.trackId),'赛道尚未接入。');config.trackId=options.trackId;}
 }
 if(id==='pets'){const key=options.partnerKey??null;check(key===null||ownedPartner(s,key,slotFor(s)),'只能选择本档案已结识的 Masai 伙伴。');config.partnerKey=key;}
 if(id==='dungeon'){const key=options.scoutPartner??null;check(key===null||ownedPartner(s,key,slotFor(s)),'临时或其他档案的伙伴不能用于迷宫。');config.scoutPartner=key;}
 if(id==='cards'){const slot=slotFor(s);config.strategy=options.strategy??'rush';config.deck=options.deck??selectedDeck(s,slot);checkDeck(s,config.deck,slot);}
 if(id==='kitchen'){const units=options.units??3;check(int(units,1,3),'每局请选择一至三份料理。');config.units=mode==='practice'?units:Math.min(units,s.economy.inventory.Rawang.fish);check(config.units>0,'Rawang 还没有鱼。可以先玩练习关，或去河边钓鱼。');}
 if(id==='trunk'&&mode==='inventory'){
  config.cargo=[];const amounts=options.cargo??s.economy.inventory.Rawang;check(obj(amounts),'装箱数量清单无效。');
  for(const item of ['meal','fish']){check(int(amounts[item]??0,0,s.economy.inventory.Rawang[item]),'装箱数量超过 Rawang 库存。');const count=Math.min(amounts[item]??0,12-config.cargo.length);for(let n=0;n<count;n++)config.cargo.push({id:item+'-'+(n+1),itemId:item,qty:1});}
  check(config.cargo.length>0,'Rawang 暂无可运物资。可以先玩装箱练习。');
 }
 const initial=E.create(clone(config));E.validate(initial);
 const token=uid(),runId=uid(),slot=s.board?.players[s.board.turn].learnerSlot??0;
 s.activeSession={gameId:'module',moduleId:id,runId,token,learnerSlot:slot,boardId:s.board?.id||'',turnNo:s.board?.turnNo||0,returnSnapshot:clone(s.board),returnSnapshotHash:crc(JSON.stringify(s.board)),runKey:null};
 s.modules.pending={id:runId,sessionToken:token,moduleId:id,version:E.version,config,startedAt:Date.now(),actions:[],state:initial,origin:{schema:9,board:clone(s.board),learnerSlot:slot}};
 L.note(s,'进入'+E.title+(mode==='practice'?' · 练习关':' · 联动物资关'));return clone(s.activeSession);
}
function launchModule(s,id,options={}){return atomic(s,draft=>launchModuleDraft(draft,id,options));}
function updateModuleDraft(s,token,actions,state){
 const run=s.modules.pending;check(s.activeSession?.token===token&&s.activeSession.gameId==='module'&&run,'游戏会话已改变。');
 check(eq(s.activeSession.returnSnapshot,s.board)&&s.activeSession.returnSnapshotHash===crc(JSON.stringify(s.board)),'棋盘位置或回合已改变，未覆盖本局进度。');
 checkRunInventory(s,run);
 check(Array.isArray(actions)&&actions.length>=run.actions.length&&eq(actions.slice(0,run.actions.length),run.actions),'游戏进度不能倒退或替换已保存操作。');
 const next={...run,actions:clone(actions),state:clone(state)};let use=null;replay(next,{onMealUse:(index,usedState)=>{use={index,state:usedState};}});s.modules.pending=next;
 if(ADVENTURE_IDS.includes(run.moduleId)&&next.state.mealsUsed===1&&!s.adventureMeals[run.id]){
  check(run.config.mode==='inventory'&&run.config.mealCharges===1&&use,'没有可用料理，未扣除任何库存。');
  const proofRun={...clone(next),actions:clone(next.actions.slice(0,use.index+1)),state:use.state},at=Date.now(),actionHash=crc(JSON.stringify({config:proofRun.config,actions:proofRun.actions})),transactionId='adventure-meal:'+run.id,delta=stock();delta.Masai.meal=-1;
  transaction(s,{id:transactionId,type:'adventure-meal-consume',at,runId:run.id,sessionToken:token,moduleId:run.moduleId,actionHash,delta});
  s.adventureMeals[run.id]={run:proofRun,at,actionHash,transactionId};
 }
 return{saved:true,mealsUsed:next.state.mealsUsed??0};
}
function updateModule(s,token,actions,state){return atomic(s,draft=>updateModuleDraft(draft,token,actions,state));}
function transaction(s,t){
 check(!s.economy.ledger.some(x=>x.id===t.id),'此物资交易已经结算。');
 const nextInventory=clone(s.economy.inventory);
 for(const zone of REGIONS)for(const item of ITEMS){check(obj(t.delta?.[zone])&&int(t.delta[zone][item],-12,12),'物资交易数量无效。');const next=nextInventory[zone][item]+t.delta[zone][item];check(int(next,0,1e8),'物资不足，未扣除也未发放，请保留存档。');nextInventory[zone][item]=next;}
 s.economy.inventory=nextInventory;s.economy.ledger.push(clone(t));
}
function settleModuleDraft(s,token){
 const already=Object.values(s.modules.claims).find(r=>r.sessionToken===token);if(already)return{duplicate:true,result:clone(already)};
 check(s.activeSession?.token===token&&s.activeSession.gameId==='module'&&s.modules.pending,'没有可结算的小游戏。');
 const run=s.modules.pending,state=replay(run),outcome=engine(run.moduleId,run.version).result(state);
 check(outcome&&['won','lost'].includes(outcome.status)&&int(outcome.score),'游戏尚未完成，不能结算。');
 const goods={fish:0,meals:0,shipped:[],collectibles:[]};
 if(run.config.mode==='inventory'&&outcome.status==='won'){
  if(run.moduleId==='fishing'){check(int(outcome.fish,1,12)&&Array.isArray(outcome.collectibles)&&outcome.collectibles.every(id=>OLD.includes(id)),'钓鱼结果无效。');goods.fish=outcome.fish;goods.collectibles=clone(outcome.collectibles);}
  if(run.moduleId==='kitchen'){check(int(outcome.meals,1,run.config.units),'料理数量无效。');goods.meals=outcome.meals;}
  if(run.moduleId==='trunk'){check(Array.isArray(outcome.shipped)&&outcome.shipped.length>0&&new Set(outcome.shipped.map(x=>x.id)).size===outcome.shipped.length&&outcome.shipped.every(x=>run.config.cargo.some(c=>eq(c,x))),'运输清单不是开局时的真实物资。');goods.shipped=clone(outcome.shipped);}
 }
 const r={runId:run.id,sessionToken:token,moduleId:run.moduleId,version:run.version,mode:run.config.mode,status:outcome.status,score:outcome.score,at:Date.now(),actionHash:crc(JSON.stringify({config:run.config,actions:run.actions})),goods};
 if(ADVENTURE_IDS.includes(run.moduleId)){
  check(int(outcome.mealsUsed,0,1)&&outcome.mealsUsed===state.mealsUsed,'本局料理使用结果无效。');r.mealsUsed=state.mealsUsed;r.mealProofHash=s.adventureMeals[run.id]?.actionHash??null;
  if(run.moduleId==='dungeon'&&outcome.discoveries!==undefined)r.discoveries=clone(outcome.discoveries);
 }
 if(run.moduleId==='pets'){r.learnerSlot=s.activeSession.learnerSlot;r.petWins=clone(outcome.petWins);s.pets.proofs[run.id]={run:clone(run),learnerSlot:s.activeSession.learnerSlot,at:r.at,region:'Masai'};}
 if(run.moduleId==='dungeon'&&run.version===2){r.learnerSlot=s.activeSession.learnerSlot;r.scoutPartner=state.config.scoutPartner;r.scoutUsed=state.scoutUsed;r.scoutRevealed=state.scoutCells.length;}
 if(run.moduleId==='cards'){r.learnerSlot=s.activeSession.learnerSlot;r.rounds=outcome.rounds;r.strategy=outcome.strategy;}
 if(run.moduleId==='kart'&&run.origin){r.rank=outcome.rank;r.finished=outcome.finished;r.character=run.origin.board?.players[run.origin.board.turn]?.character??null;}
 validateModuleResult(r);s.modules.claims[r.runId]=clone(r);s.modules.results.push(clone(r));
 registerAchievement(s,run,r,s.activeSession);
 if(RESOURCE_IDS.includes(run.moduleId)&&r.status==='won'&&r.mode==='inventory'){
  const delta=stock(),type=run.moduleId==='fishing'?'fish-production':run.moduleId==='kitchen'?'fish-cooking':'cargo-transfer';
  if(type==='fish-production'){delta.Rawang.fish=goods.fish;for(const id of goods.collectibles)if(!s.economy.riverCollection.includes(id))s.economy.riverCollection.push(id);}
  if(type==='fish-cooking'){delta.Rawang.fish=-goods.meals;delta.Rawang.meal=goods.meals;}
  if(type==='cargo-transfer')for(const c of goods.shipped){delta.Rawang[c.itemId]-=c.qty;delta.Masai[c.itemId]+=c.qty;}
  transaction(s,{id:'module:'+r.runId,type,at:r.at,runId:r.runId,actionHash:r.actionHash,delta});
 }
 L.closeSession(s,token);s.modules.pending=null;L.note(s,engine(run.moduleId).title+'：'+(r.status==='won'?'通关':'本局结束')+'，'+r.score+'分。'+(r.mode==='practice'?'练习成绩已记录，不改变物资。':'物资与游戏结果已分别保存。'));
 return{duplicate:false,result:clone(r)};
}
function settleModule(s,token){return atomic(s,draft=>settleModuleDraft(draft,token));}
function closeSession(s,token){return atomic(s,draft=>{
 const isModule=draft.activeSession?.gameId==='module',run=isModule?draft.modules.pending:null;
 if(run&&(ADVENTURE_IDS.includes(run.moduleId)||run.moduleId==='pets'||run.moduleId==='cards')){
  check(draft.activeSession.token===token,'过期游戏会话。');const state=replay(run),proof=draft.adventureMeals[run.id];
  const r={runId:run.id,sessionToken:token,moduleId:run.moduleId,version:run.version,mode:run.config.mode,status:'abandoned',score:0,at:Date.now(),actionHash:crc(JSON.stringify({config:run.config,actions:run.actions})),goods:{fish:0,meals:0,shipped:[],collectibles:[]},mealsUsed:state.mealsUsed,mealProofHash:proof?.actionHash??null};
  if(run.moduleId==='cards'){delete r.mealsUsed;delete r.mealProofHash;r.learnerSlot=draft.activeSession.learnerSlot;r.rounds=state.round;r.strategy=state.config.strategy;}
  if(run.moduleId==='pets'){delete r.mealsUsed;delete r.mealProofHash;r.learnerSlot=draft.activeSession.learnerSlot;r.petWins=clone(state.wins);draft.pets.proofs[run.id]={run:clone(run),learnerSlot:draft.activeSession.learnerSlot,at:r.at,region:'Masai'};}
 if(run.moduleId==='dungeon'&&run.version===2){r.learnerSlot=draft.activeSession.learnerSlot;r.scoutPartner=state.config.scoutPartner;r.scoutUsed=state.scoutUsed;r.scoutRevealed=state.scoutCells.length;}
 validateModuleResult(r);draft.modules.claims[run.id]=clone(r);draft.modules.results.push(clone(r));
 }
 const result=L.closeSession(draft,token);if(isModule)draft.modules.pending=null;return result;
});}
function prepareMealDiceDraft(s,a,b){
 check(s.board?.phase==='roll'&&!s.activeSession&&!s.economy.diceChoice,'当前不能使用料理，请先完成本回合或游戏。');check(int(a,1,6)&&int(b,1,6),'骰子数值无效。');
 const id='dice:'+uid(),delta=stock();delta.Masai.meal=-1;transaction(s,{id,type:'meal-consume',at:Date.now(),boardId:s.board.id,turnNo:s.board.turnNo,delta});
 s.economy.diceChoice={id,boardId:s.board.id,turnNo:s.board.turnNo,turn:s.board.turn,rolls:[a,b]};L.note(s,'使用一份 Masai 料理，本回合可在两个骰子结果中选择一个。');return clone(s.economy.diceChoice);
}
function prepareMealDice(s,a,b){return atomic(s,draft=>prepareMealDiceDraft(draft,a,b));}
function chooseMealDice(s,index){return atomic(s,draft=>{const c=draft.economy.diceChoice;check(c&&int(index,0,1)&&c.boardId===draft.board?.id&&c.turnNo===draft.board.turnNo&&c.turn===draft.board.turn,'骰子选择已失效。');L.roll(draft,c.rolls[index]);draft.economy.diceChoice=null;});}
function roll(s,d){return atomic(s,draft=>{check(!draft.economy.diceChoice,'请先选择已掷出的一个骰子。');return L.roll(draft,d);});}
function startBoard(s,n,names){return atomic(s,draft=>{check(!draft.economy.diceChoice,'请先完成料理骰子的选择。');return L.startBoard(draft,n,names);});}
function prepareImport(current,incoming){
 validate(current);const s=migrate(incoming).state;
 if(current.universeId===s.universeId){
  check(eq(current.pets.anchor,s.pets.anchor),'伙伴账本的来源快照不同，请保留两个备份。');
  const leftPet=current.pets.ledger,rightPet=s.pets.ledger,minPet=Math.min(leftPet.length,rightPet.length);check(eq(leftPet.slice(0,minPet),rightPet.slice(0,minPet)),'伙伴消费账本已经分叉，不能相加。');
  check(s.transactions.length>=current.transactions.length&&eq(s.transactions.slice(0,current.transactions.length),current.transactions),'旧备份早于已保存的学习奖励；不能恢复已消费的零食。');
  if(leftPet.length>rightPet.length){const difference=leftPet.slice(rightPet.length).filter(t=>t.type==='befriend').length*PET_RULES.snackCost;s.shared.snacks-=difference;s.pets=clone(current.pets);}else{for(const [id,p]of Object.entries(current.pets.proofs)){check(!s.pets.proofs[id]||eq(s.pets.proofs[id],p),'图鉴挑战来源冲突。');s.pets.proofs[id]=clone(p);}}
  mergeCardRights(s,current);
  Object.assign(s.claims,current.claims);Object.assign(s.arcadeClaims,current.arcadeClaims);
  for(const r of s.gameResults.arcade){const old=current.arcadeClaims[r.roundId];check(!old||eq(old,r),'导入街机结果与本机凭证冲突。');}
  for(const [id,r] of Object.entries(current.modules.claims)){check(!s.modules.claims[id]||eq(s.modules.claims[id],r),'导入小游戏结果与本机凭证冲突。');s.modules.claims[id]=clone(r);}
  for(const [id,proof] of Object.entries(current.adventureMeals)){
   const incomingProof=s.adventureMeals[id];
   if(incomingProof&&!eq(incomingProof,proof)){
    // Canonicalize only an identical first-use proof represented by different
    // tick-run boundaries or acknowledgement timestamps. Retain the persisted
    // proof and ledger hash; additional fields or different states still fail.
    check(sameActionPrefix(incomingProof.run.actions,proof.run.actions)&&sameActionPrefix(proof.run.actions,incomingProof.run.actions)&&eq({...incomingProof,at:proof.at,actionHash:proof.actionHash,run:{...incomingProof.run,actions:proof.run.actions}},proof),'导入的料理消费凭证与本机真实使用记录冲突。');
    const localEntry=current.economy.ledger.find(t=>t.id===proof.transactionId),incomingEntry=s.economy.ledger.find(t=>t.id===proof.transactionId);
    check(localEntry&&incomingEntry&&eq({...incomingEntry,at:localEntry.at,actionHash:localEntry.actionHash},localEntry),'导入的料理消费流水与本机真实使用记录冲突。');
    const claim=s.modules.claims[id];if(claim&&!current.modules.claims[id]){check(claim.mealProofHash===incomingProof.actionHash,'已结束游戏与料理来源不一致。');claim.mealProofHash=proof.actionHash;const row=s.modules.results.find(r=>r.runId===id);if(row){check(row.mealProofHash===incomingProof.actionHash,'已结束游戏与料理来源不一致。');row.mealProofHash=proof.actionHash;}}
    incomingEntry.at=localEntry.at;incomingEntry.actionHash=localEntry.actionHash;
   }
   s.adventureMeals[id]=clone(proof);
  }
  const left=current.economy.ledger,right=s.economy.ledger,min=Math.min(left.length,right.length);check(eq(left.slice(0,min),right.slice(0,min)),'两台设备的物资账本已经分叉，不能相加或自动覆盖。请先保留两个备份。');
  if(left.length>=right.length)s.economy=clone(current.economy);
  // A pending choice already consumed a meal. Keep it from the selected
  // authoritative ledger branch; dropping it would lose a paid advantage.
  // An already chosen local turn keeps its null choice and cannot use it twice.
  for(const [id,p]of Object.entries(current.pets.proofs)){check(!s.pets.proofs[id]||eq(s.pets.proofs[id],p),'图鉴挑战来源冲突。');s.pets.proofs[id]=clone(p);}
  if(s.economy.diceChoice){const choice=s.economy.diceChoice;check(s.board?.phase==='roll'&&choice.boardId===s.board.id&&choice.turnNo===s.board.turnNo&&choice.turn===s.board.turn,'已使用料理的骰子选择还未完成，与备份棋盘回合不一致。请先在当前进度选好骰子，再导入；原存档和料理扣除记录均已保留。');}
  if(s.modules.pending&&s.modules.claims[s.modules.pending.id]){L.closeSession(s,s.activeSession.token);s.modules.pending=null;}
 }
 for(const r of Object.values(s.settlements.runs))if(r.status==='started'){r.status='invalidated';r.sessionToken=null;}
 if(s.activeSession)s.activeSession.runKey=null;return validate(s);
}
function pack(s){validate(s);const payload=JSON.stringify(s);check(payload.length<=MAX_PAYLOAD,'宇宙存档超过大小限制，请保留备份。');return{payload,checksum:crc(payload)};}
function unpack(p){check(obj(p)&&typeof p.payload==='string'&&p.payload.length<=MAX_PAYLOAD&&p.checksum===crc(p.payload),'存档校验失败，原档未覆盖。');const originalState=JSON.parse(p.payload);return{...migrate(originalState),originalState};}
function wrap(s,old){let previous=null;if(old){const irreversible=!eq(s.cards.unlocks,old.cards?.unlocks??{})||!eq(s.cards.proofs,old.cards?.proofs??{})||!eq(s.pets.ledger,old.pets?.ledger??[])||s.modules.pending?.moduleId==='dungeon'&&s.modules.pending.version===2&&s.modules.pending.state.scoutUsed===1&&old.modules?.pending?.state?.scoutUsed!==1;if(irreversible)previous=pack(s);else if(old.schemaVersion===SCHEMA)previous=pack(old);else{V8.migrate(old);const payload=JSON.stringify(old);check(payload.length<=MAX_PAYLOAD,'旧备份过大。');previous={payload,checksum:crc(payload)};}}return JSON.stringify({format:'LIANG_UNIVERSE',current:pack(s),previous});}
function unwrap(raw){check(typeof raw==='string'&&raw.length<=MAX_PAYLOAD*2+1000,'存档文件过大。');const w=JSON.parse(raw);check(w?.format==='LIANG_UNIVERSE','这不是梁家宇宙存档。');try{return{...unpack(w.current),recovered:false};}catch(e){if(e.code==='UNSUPPORTED_SCHEMA')throw e;if(w.previous)return{...unpack(w.previous),recovered:true};throw e;}}
function encode(s){const bytes=new TextEncoder().encode(JSON.stringify(pack(s)));let text='';for(let n=0;n<bytes.length;n+=8192)text+=String.fromCharCode(...bytes.subarray(n,n+8192));return'LU1.'+(typeof btoa==='function'?btoa(text):Buffer.from(text,'binary').toString('base64')).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
function decode(code){check(typeof code==='string'&&code.length<=MAX_PAYLOAD*6&&/^LU1\.[A-Za-z0-9_-]+$/.test(code),'迁移代码格式无效或过大。');let b=code.slice(4).replace(/-/g,'+').replace(/_/g,'/');b+='='.repeat((4-b.length%4)%4);const bin=typeof atob==='function'?atob(b):Buffer.from(b,'base64').toString('binary');return unpack(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(bin,c=>c.charCodeAt(0))))).state;}
// Preserve the verified legacy rules while preventing a late error in any
// public mutation from leaving half of a learning/arcade/board operation saved.
const legacyMutations=Object.fromEntries(['note','nextTurn','launch','launchArcade','recordArcadeResult','storeLegacy','beginRun','recordSubmission','changeCharacter','invalidateRun','reward'].map(name=>[name,(s,...args)=>atomic(s,draft=>L[name](draft,...args))]));
return{...L,...legacyMutations,SCHEMA,KEY,MAX_PAYLOAD,TRANSCRIPT_LIMITS,actionStats,appendAction,sameActionPrefix,IDS,RESOURCE_IDS,ADVENTURE_IDS,PET_RULES,cardCatalog:G.cards.CATALOG,starterCards:G.cards.STARTER,cardOwned,selectedDeck,setCardDeck,gameEngine:engine,slotFor,ownedPartner,petEligibility,befriendPet,feedPet,fresh,validate,migrate,launchModule,updateModule,settleModule,prepareMealDice,chooseMealDice,roll,startBoard,closeSession,prepareImport,pack,wrap,unwrap,encode,decode};
});



;
})();
