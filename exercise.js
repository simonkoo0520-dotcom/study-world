(() => {
  'use strict';
  const E=window.WQCore, M=JSON.parse(document.getElementById('manifest').textContent), ASSETS=JSON.parse(document.getElementById('assets').textContent);
  const $=id=>document.getElementById(id), esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const GRADES={P1:'小学一年级',P2:'小学二年级',P3:'小学三年级',P4:'小学四年级',P5:'小学五年级',P6:'小学六年级',F1:'中一 Form 1',F2:'中二 Form 2',F3:'中三 Form 3'};
  const PETS={owl:'梁姐姐',fox:'梁弟弟',turtle:'梁妹妹'};
  const SUBJECTS={bm:['马来文','Bahasa Melayu','Aa','#f0e2c4'],english:['英文','English','En','#dce9f0'],chinese:['华文','Bahasa Cina','文','#f4ded4'],math:['数学','Matematik','∑','#dcebdc'],science:['科学','Sains','⚗','#dbede7'],moral:['道德教育','Pendidikan Moral','♡','#efe0e9'],pjpk:['体育与健康','PJPK','↗','#e4eacb'],art:['视觉艺术','Pendidikan Seni Visual','◈','#eadff0'],music:['音乐','Pendidikan Muzik','♫','#e2e3f4'],history:['历史','Sejarah','⌛','#eadfce'],geography:['地理','Geografi','◎','#d9e9df'],rbt:['设计与工艺','Reka Bentuk dan Teknologi','⚙','#e5e5d7'],ask:['电脑科学基础','Asas Sains Komputer','⌘','#d8e6ec']};
  let S=null, readOnly=false, note='',page='home',courseKey='', course=null, qs=[], topic='all', difficulty='all',toastTimer,renderToken=0,audioContext=null,audioNodes=[],audioToken=0;
  const cache=new Map();
  window.WQManifest=M;
  const P=()=>S.profiles[S.active];
  const meta=key=>M.courses.find(c=>c.key===key);
  const subName=s=>SUBJECTS[s]?.[0]||s;
  const byCourse=(p,key)=>E.summary(p,Object.keys(p.records).filter(id=>p.records[id].course===key));
  const pct=(a,b)=>b?Math.round(a*100/b):0;
  const date=t=>new Date(t).toLocaleString('zh-CN',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'});
  const title=x=>x>=50?'时空导师':x>=30?'星光队长':x>=20?'知识守护者':x>=12?'学科勇者':x>=6?'学习探险家':x>=3?'认真新手':'启程新手';
  function save(){
    if(!S||readOnly)return;
    S.updated=Date.now();
    window.dispatchEvent(new CustomEvent('wq:save',{detail:structuredClone(S)}));
    storageNote();
  }
  function storageNote(){$('storage-note').textContent=note;}
  function toast(t){$('toast').textContent=t;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,5000);}
  function displayLanguages(){return (course?.level?.startsWith('P')?S.settings.primaryDisplay:S.settings.display).split('+');}
  function diagram(q){return displayLanguages().includes('zh')&&q.svgI18n?.zh?q.svgI18n.zh:q.svg;}
  function tx(obj,explanation=false){
    if(obj==null)return '';if(typeof obj==='string')return `<span class="tx-main">${esc(obj)}</span>`;
    const target={bm:'bm',english:'en',chinese:'zh'}[course?.subject];
    let langs=target&&!explanation?[target]:target?[target,'zh',...displayLanguages()]:displayLanguages();
    langs=[...new Set(langs)].filter(l=>obj[l]);if(!langs.length)langs=Object.keys(obj).filter(l=>['bm','en','zh'].includes(l));
    return langs.slice(0,explanation?3:2).map((l,i)=>`<span class="${i?'tx-alt':'tx-main'}" lang="${{bm:'ms',en:'en',zh:'zh-Hans'}[l]}">${esc(obj[l])}</span>`).join('');
  }
  function bars(value,total=40){return `<div class="progress" role="progressbar" aria-valuenow="${Math.min(value,total)}" aria-valuemin="0" aria-valuemax="${total}"><span style="width:${Math.min(100,pct(value,total))}%"></span></div>`;}
  function character(big=false){const p=P(),lv=E.level(p.xp);return big?`<div class="herofig ${esc(p.outfit)}"><img src="${ASSETS[p.pet]}" alt="${PETS[p.pet]}"><span class="levelchip">Lv.${lv} ${title(lv)}</span></div>`:`<img src="${ASSETS[p.pet]}" alt="${PETS[p.pet]}">`;}
  function header(){document.querySelectorAll('[data-nav]').forEach(b=>b.classList.toggle('active',b.dataset.nav===page));$('profile-switch').innerHTML=S.profiles.map((p,i)=>`<option value="${i}" ${i===S.active?'selected':''}>${esc(p.name)}</option>`).join('');document.body.classList.toggle('nomotion',!S.settings.motion);storageNote();}
  function view(html,focus=true){stopAudio();$('app').innerHTML=html;header();if(focus){window.scrollTo({top:0,behavior:'instant'});const h=$('app').querySelector('h1');if(h){h.tabIndex=-1;h.focus({preventScroll:true});}}}
  const L=window.WQLearning;
  const PLAN_STEPS=[
    ['recall','回忆旧知识','先不看解释，试着回忆上次学过的内容。','先做复习'],
    ['discover','发现新知识','选一个想学的主题；先想理由，再选答案。','探索一科'],
    ['connect','换个角度','换一门学科，或用另一种方法解释同一个问题。','换科探索'],
    ['apply','把知识带走','离开屏幕，写、画、说或动手做，把学过的用出来。','选一个应用任务']
  ];
  function suggestedCourse(step){
    const p=P(),list=M.courses.filter(c=>c.level===p.grade),today=L.day(p);
    if(step==='recall'){
      const c=list.map(c=>({key:c.key,n:reviewCount(c.key)})).sort((a,b)=>b.n-a.n)[0];
      if(c?.n)return c.key;
    }
    const recent=p.runs.at(-1)?.course;
    const preferred=['math','english','science','chinese','bm'];
    const choices=list.filter(c=>preferred.includes(c.subject));
    return (step==='connect'?choices.find(c=>c.key!==recent):choices.find(c=>!p.runs.some(r=>r.course===c.key&&new Date(r.at).toDateString()===new Date().toDateString())))?.key||choices[0]?.key||list[0]?.key;
  }
  function reviewCount(key){const retired=new Set((key?M.courses.filter(c=>c.key===key):M.courses).flatMap(c=>c.retiredIds||[]));return Object.entries(P().records).filter(([id,r])=>!retired.has(id)&&(!key||r.course===key)&&(r.wrong||L.due(r))).length;}
  function dailyPlan(){
    const p=P(),day=L.day(p),goal=p.learning.goal,steps=goal===15?[PLAN_STEPS[1]]:goal===30?PLAN_STEPS.slice(0,2):PLAN_STEPS;
    const done=steps.filter(s=>day.missions.includes(s[0])).length;
    return `<section class="panel learning-plan"><div class="sectionhead"><div><span class="eyebrow">每天一点，学会更多</span><h2>今天的学习旅程</h2><p class="muted">${goal} 分钟参考计划 · ${done} / ${steps.length} 段自报完成</p></div><label>今天想学多久？<select id="daily-goal">${[15,30,60].map(n=>`<option value="${n}" ${goal===n?'selected':''}>约 ${n} 分钟</option>`).join('')}</select></label></div>
      <p class="small muted">每段约 15 分钟，段间可休息 5 分钟。60 分钟计划含 15 分钟离屏应用；休息另计。今天少做一点也没关系，完成后可自由探索。</p>
      <div class="learning-steps">${steps.map(([id,name,desc,action],i)=>`<article class="learning-step ${day.missions.includes(id)?'is-done':''}"><span class="learning-step-number">${i+1}</span><h3>${name}</h3><p>${desc}</p><button class="btn small secondary" data-lesson="${id}">${action}</button><button class="btn small light" data-mission="${id}" aria-pressed="${day.missions.includes(id)}">${day.missions.includes(id)?'✓ 已完成这一段':'标记这一段完成'}</button></article>`).join('')}</div>
      <details class="learning-reflection"><summary>留一句今天的发现</summary><label for="plan-reflection">我学会了什么？我还想问什么？</label><textarea id="plan-reflection" maxlength="240" rows="3" placeholder="例如：分数相加前，要先看分母。不要填写姓名、电话等个人资料。">${esc(day.reflection)}</textarea><button class="btn small secondary" data-act="save-reflection">保存我的发现</button><p class="caption">和练习进度一起保存，已绑定的家长可见。</p></details>
      <p class="caption">完成标记由你填写，不是计时成绩；不会因学习时间长或连续签到多发奖励。</p></section>`;
  }
  function transferTask(subject){
    const tasks={math:'在纸上自编一道同类型但数字不同的题，写出解题步骤，再用另一种方法检查。',english:'选今天的一个词或句型，写三句自己的小故事，再大声读给自己或家人听。',bm:'Pilih satu perkataan atau pola ayat hari ini. Tulis tiga ayat sendiri dan baca dengan kuat.',chinese:'选今天的一个词语或表达，写三句话的小故事，再说说为什么这样用。',science:'选今天的一个概念，画出“我原先以为／现在知道”的对比图，再找一个日常例子。只做无需火、电或化学品的观察。',art:'用纸笔设计一个小图案，说明你用了哪些线条、色彩或重复规律。',music:'用轻拍手掌重现一个节奏，再改变其中一小节，听听有什么不同。',history:'画一条今天主题的时间线，把已经知道的事实和仍想查证的问题分开。',geography:'画一张熟悉地点的简图，加上方向和图例，再说明怎样从起点走到终点。',moral:'编一个生活中的两难小故事，说出两种做法及各自可能带来的影响。',pjpk:'和家人选一个适合你的轻松活动，说明准备、补水和安全空间为什么重要。',rbt:'画一件你想改进的日常用品，标出一个问题、一项改动和理由。',ask:'用纸笔写一份清楚的步骤，让家人照着完成一个简单任务，再找出含糊的步骤。'};
    return `<section class="panel transfer-task"><h2>把知识用出来 · 约 15 分钟</h2><p>${esc(tasks[subject]||'选今天学过的一点，用自己的话、图画或例子解释给自己或家人听。')}</p><p class="small muted">先盖住答案再解释；解释不清的地方，下次再练。作品不用上传。可以先休息，再完成这个任务。</p><button class="btn small secondary" data-nav="home">回到今天的计划</button></section>`;
  }
  function learningSummary(){
    const counts=L.counts(P()),d=L.day(P());
    return `<section class="panel"><h2>记住了，也能说清楚</h2><p><strong>${counts.spaced}</strong> 道题完成过跨日巩固 · <strong>${reviewCount()}</strong> 道错题或到期题可复习。</p><p class="small muted">跨日巩固指在安排的复习时间到达后再答对；仍不等于长期掌握。新答对题约 1 天后复习，之后按 3、7、14 天逐步拉开间隔。</p>${d.reflection?`<p>今天的发现：${esc(d.reflection)}</p>`:''}</section>`;
  }
  async function launchLesson(step){
    if(step==='apply'){page='application';course=null;renderToken++;return view(transferTask(meta(P().runs.at(-1)?.course)?.subject));}
    const key=suggestedCourse(step);if(!key)return;
    await openCourse(key);
    if(courseKey!==key||!course)return;
    if(step==='recall'&&reviewCount(key))return start('review');
    toast('可以先选主题和难度，再开始探索。');
  }

  function home(){page='home';course=null;courseKey='';renderToken++;const p=P(),grade=p.grade, list=M.courses.filter(c=>c.level===grade),st=E.summary(p),lv=E.level(p.xp);
    view(`<section class="hero"><div><div class="eyebrow">WORDQUEST · LEARNING QUEST</div><h1>${esc(p.name)}，今天探索哪一科？</h1><p>和三小瓜完成一轮短挑战。读懂线索、选出答案，人物随你学会的新题一起升级。</p><div class="stats"><div class="stat"><strong>${lv}</strong><span>人物等级</span></div><div class="stat"><strong>${st.earned}</strong><span>已独立答对的新题</span></div><div class="stat"><strong>${st.wrong}</strong><span>等待复习的错题</span></div></div></div>${character(true)}</section>${dailyPlan()}
    ${p.session?`<div class="notice">上次的${p.session.finished?'答题结果':'挑战'}已保存。<button class="btn small secondary" data-act="resume">${p.session.finished?'查看结果':'继续挑战'}</button></div>`:''}
    <div class="sectionhead"><div><h2>一张地图，选择年级与学科</h2><p class="muted small">SJKC 小一至小六 · SMK Form 1–3</p></div><button class="btn small light" data-nav="audit">题量与课纲依据 ↗</button></div>
    <div class="gradebar" role="group" aria-label="选择年级">${E.LEVELS.map(l=>`<button class="${l===grade?'on':''}" data-grade="${l}" aria-pressed="${l===grade}">${l[0]==='P'?'小'+l[1]:'Form '+l[1]}</button>`).join('')}</div>
    <div class="subjectgrid">${list.map(c=>{const d=SUBJECTS[c.subject],s=byCourse(p,c.key);return `<button class="subjectcard" data-course="${c.key}" style="--tint:${d[3]}"><span class="symbol" aria-hidden="true">${d[2]}</span><h3>${d[0]}</h3><div class="subname">${d[1]}</div><div class="count"><span>${c.availableCount.toLocaleString()} 道练习</span><span class="arrow">↗</span></div>${bars(s.earned,Math.max(1,c.count))}<div class="caption">已答对 ${s.earned} · 待复习 ${s.wrong}</div></button>`;}).join('')}</div>
    <p class="footnote">各科为选定主题及有限模型练习，题量不代表全课纲覆盖；来源版本与未核验范围见“题量与课纲依据”。道德教育采用已选定的 Moral 路线；SMK 的 RBT / ASK、华文与艺术课程按学校实际开设选择，不表示每位学生必修全部科目。2027 届暂作现有课程衔接练习，未认证为 KP2027 全新课纲。</p>`);
  }
  async function loadCourse(key){
    if(cache.has(key))return cache.get(key);
    const m=meta(key);if(!m)throw Error('找不到这门课程');
    const response=await fetch(new URL('./data/'+encodeURIComponent(key)+'.json.gz?v='+M.contentRevision,document.baseURI));
    if(!response.ok)throw Error('题库暂时无法下载，请检查网络后重试。');
    const bytes=new Uint8Array(await response.arrayBuffer());
    let text;
    if(bytes[0]===31&&bytes[1]===139){
      if(typeof DecompressionStream==='undefined')throw Error('请使用较新版本的 Chrome、Edge、Safari 或 Firefox 浏览器。');
      text=await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
    }else text=new TextDecoder().decode(bytes);
    const data=JSON.parse(text);
    if(!Array.isArray(data.questions)||data.questions.length!==m.count)throw Error('题库数据不完整，请刷新后重试。');
    data.lookup=new Map(data.questions.map(q=>[q.id,q]));
    cache.set(key,data);
    if(cache.size>4){const old=[...cache.keys()].find(k=>k!==key);cache.delete(old);}
    return data;
  }
  async function openCourse(key){const token=++renderToken;page='course';view('<div class="loading"><div class="spinner"></div><h1>正在载入题库…</h1></div>');try{const c=await loadCourse(key);if(token!==renderToken)return;courseKey=key;course=c;topic='all';difficulty='all';coursePage();}catch(e){if(token===renderToken)errorView(e);}}
  function errorView(e){page='error';view(`<div class="error"><h1>暂时无法打开</h1><p>${esc(e.message)}</p><button class="btn" data-nav="home">回学科地图</button></div>`);}
  function languageControl(primary=course?.level?.startsWith('P'),settingsView=false){
    if(!settingsView&&['bm','english','chinese'].includes(course?.subject))return `<p class="small muted">语文科题目使用${{bm:'马来文',english:'英文',chinese:'华文'}[course.subject]}。</p>`;
    const choices=primary?[['zh','华文'],['zh+en','华文 + English'],['zh+bm','华文 + Bahasa Melayu'],['en','English'],['bm','Bahasa Melayu'],['bm+en','BM + English']]:[['bm+en','BM + English'],['bm','Bahasa Melayu'],['en','English']];
    const value=primary?S.settings.primaryDisplay:S.settings.display;
    return `<label>${settingsView?(primary?'小学非语文科':'中学非语文科'):'题目显示'}<select id="${primary?'primary-display':'display'}">${choices.map(([v,label])=>`<option value="${v}" ${value===v?'selected':''}>${label}</option>`).join('')}</select></label>`;
  }
  function coursePage(){page='course';const m=meta(courseKey),p=P(),st=byCourse(p,courseKey),d=SUBJECTS[m.subject];const topics=m.topics;
    view(`<button class="back" data-nav="home">← 全部年级与学科</button><div class="panel"><div class="coursehead"><div><span class="badge">${GRADES[m.level]}</span><span class="badge">${m.availableCount.toLocaleString()} 道练习 · ${m.curriculum.school}</span><h1>${d[0]}</h1><div class="muted">${d[1]}</div></div><span class="symbol">${d[2]}</span></div>
    <div class="filters"><label>练习主题<select id="topic"><option value="all">全部主题 · 到期复习与新题</option>${topics.map(t=>`<option value="${esc(t.name)}" ${topic===t.name?'selected':''}>${esc(t.name)} (${t.count} 题)</option>`).join('')}</select></label><label>难度<select id="difficulty"><option value="all">自己选择 · 混合难度</option>${[1,2,3].map(n=>`<option value="${n}" ${difficulty===String(n)?'selected':''}>${['','基础巩固','应用练习','挑战提升'][n]}</option>`).join('')}</select></label>${languageControl()}</div>
    <p class="learning-tip">先选一个主题。若觉得吃力，选“基础巩固”；能解释解法后，再试“应用练习”或“挑战提升”。每轮可完成后休息，稍后继续。</p><div class="missions"><div class="mission"><b>探索挑战</b><p>每轮最多 10 题，提交后看解释。新题首次答对 +5 XP。</p><button class="btn" data-start="practice">出发 →</button></div><div class="mission"><b>独立小测</b><p>最多 20 题，交卷后才揭晓答案。不等同官方模拟考卷。</p><button class="btn secondary" data-start="test">开始小测</button></div><div class="mission"><b>巩固复习 · ${reviewCount(courseKey)}</b><p>复习错题和到期题。答对新题后，按 1、3、7、14 天的间隔安排再练。</p><button class="btn secondary" data-start="review" ${reviewCount(courseKey)?'':'disabled'}>重新挑战</button></div></div>
    <p class="small muted">本课有 ${m.coreCount} 道日常精选，其余合格题供分主题加练。题量包含变式，不等于独立考点数。练习、小测、复习和加练都限制同一题型每轮最多两题，同一材料最多一次。当前主题可用题型较少时，会安排较短的一轮。</p>${m.extraCount?`<button class="btn small light" data-start="extra">我想练同类题 · ${m.extraCount} 道变式</button>`:''}<div class="sectionhead"><h3>这门课的探索足迹</h3><span class="small muted">累计已答对 ${st.earned} 题（含加练与旧题）</span></div><div class="journey">${[[10,'启程'],[30,'发现'],[60,'探路'],[100,'突破'],[180,'积累'],[300,'守护']].map(([n,t])=>`<span class="journeystep ${st.earned>=n?'done':''}">${st.earned>=n?'✓':'◇'} ${t} · ${n}</span>`).join('')}</div>
    ${m.guidedCount?`<p class="learning-tip">本课有 ${m.guidedCount} 道基础讨论题，适合带读或讨论，配合解释理解；独立小测不会抽取。请用自己的话说明理由。</p>`:''}<details><summary>本课覆盖、题量和依据</summary><p class="small">${esc(m.coverage)}</p><p class="small muted">${m.models} 类题目模型 · ${m.cases} 个情境／参数实例。题量不等于概念数量；重复换序不增加题量。</p>${sourceList(m.sourceIds)}</details></div>`);
  }
  function sourceList(ids){return `<ul class="list small">${[...new Set(ids||[])].map(id=>{const x=M.sources.find(x=>x.id===id);return x?`<li>${x.url&&/^https?:\/\//.test(x.url)?`<a href="${esc(x.url)}" target="_blank" rel="noopener noreferrer">${esc(x.title)}</a>`:esc(x.title)}${x.year?' · '+esc(x.year):''}<div class="muted">${esc(x.note||'')}</div></li>`:`<li>${esc(id)} · 来源信息未齐</li>`;}).join('')}</ul>`;}
  async function start(mode){const extra=mode==='extra';if(extra)mode='practice';try{if(P().session&&!P().session.finished&&!confirm('旧挑战会暂停在现有存档；开始新挑战将替换未完成的题目进度。已完成的练习记录不受影响。继续？'))return;
    const pool=course.questions.filter(q=>!q.retiredReason&&(mode==='review'||(extra?q.practiceSet!=='duplicate':q.practiceSet==='core'))&&(mode!=='test'||q.assessmentUse!=='guided')&&(topic==='all'||q.topic===topic)&&(difficulty==='all'||String(q.difficulty)===difficulty));const picked=E.selectQuestions(pool,P(),extra?'extra':mode,mode==='test'?20:10);if(!picked.length){toast(mode==='review'?'所选主题／难度下没有待复习错题。':'所选主题／难度下没有题目，请调整筛选。');return;}
    P().session=E.start(courseKey,picked,mode,M.contentRevision);qs=picked;save();quiz();}catch(e){toast(e.message);}}
  async function resume(){const s=P().session;if(!s)return;if(s.catalogRevision!==M.contentRevision)return historicalResult();const token=++renderToken;page='quiz';view('<div class="loading"><div class="spinner"></div><h1>读取保存的挑战…</h1></div>');try{const c=await loadCourse(s.course);if(token!==renderToken)return;course=c;courseKey=s.course;qs=s.ids.map(id=>c.lookup.get(id));if(qs.some(q=>!q))throw Error('旧挑战中的题目已更换。已记录的成长保留，请返回学科重新开始。');const converted=s.mode==='test'&&!s.finished&&qs.some(q=>q.assessmentUse==='guided');if(converted){s.mode='practice';s.checked=s.ids.map(()=>false);save();}s.finished?(s.correctionActive?correctionPage():results()):quiz();if(converted)toast('这份旧小测含基础讨论题，已转为练习。原来的选择已保留，请逐题确认答案。');}catch(e){if(token===renderToken)errorView(e);}}
  function sourceQ(q){const src=M.sources.find(s=>s.id===q.sourceId);return `<details class="source"><summary>题号与来源</summary><p>题号：${esc(q.id)}<br>学习内容：${esc(q.skill||q.topic)}<br>来源：${esc(src?.title||q.sourceId||'原创练习')}</p><p>如果题目说得不清楚，可以记下题号，和老师一起核对。</p></details>`;}
  function questionHTML(q,s,i,reveal){const choice=s.choices[i];return `${q.assessmentUse==='guided'?'<p class="caption">基础讨论题 · 先说理由，再选答案</p>':''}<div class="topic">${esc(q.topic)} · ${['','基础巩固','应用练习','挑战提升'][q.difficulty]||'分层练习'}</div>${q.passage?`<div class="passage">${tx(q.passage)}</div>`:''}${q.retiredReason?'<p class="learning-tip">这是已保存挑战中的旧题，目前不进入新练习。可查看原题和讲解。</p>':''}<div class="stem">${tx(q.stem)}</div>${q.svg?`<div class="diagram" role="img" aria-label="题目图示">${diagram(q)}</div>`:''}${q.audio?'<div class="audio btnrow"><button class="btn small secondary" data-act="audio">♫ 播放题目音频</button><button class="btn small light" data-act="stop-audio">停止</button><span class="small muted">离线合成 · 可重复聆听</span></div>':''}<div class="options">${q.options.map((o,n)=>`<button class="option ${choice===n?'selected':''} ${reveal&&q.answer===n?'correct':''} ${reveal&&choice===n&&choice!==q.answer?'wrong':''}" data-option="${n}" ${reveal?'disabled':''} aria-pressed="${choice===n}"><span class="letter">${n+1}</span><span class="optiontext">${tx(o)}${reveal&&q.answer===n?'<span class="small"> ✓ 正确答案</span>':''}${reveal&&choice===n&&choice!==q.answer?'<span class="small"> ✕ 你的选择</span>':''}</span></button>`).join('')}</div>${reveal?`<div id="answer-explanation" class="feedback ${choice===q.answer?'':'wrong'}" tabindex="-1" role="status"><h3>答案讲解 · ${choice===q.answer?'你答对了':choice===null?'这题没有作答':'一起看解法'}</h3><p class="answer-key"><strong>正确答案：</strong>${tx(q.options[q.answer])}</p>${tx(q.explanation,true)}<p class="learning-tip">盖住解释，用自己的话说说：哪条线索支持答案？其他选项为什么不合适？</p>${sourceQ(q)}</div>`:''}`;}
  function quiz(focus=true){page='quiz';const s=P().session;if(!s)return home();const q=qs[s.index];if(!q)return errorView(Error('题目读取不完整'));const reveal=s.mode!=='test'&&s.checked[s.index],lv=E.level(P().xp),name=SUBJECTS[course.subject][0],mode={test:'独立小测',practice:'探索挑战',review:'巩固复习'}[s.mode];
    view(`<div class="quiztop"><div><span class="small muted">${GRADES[course.level]} · ${name} / ${mode}</span><br><strong>第 ${s.index+1} / ${qs.length} 题</strong></div><button class="btn small light" data-nav="home">保存并离开</button></div><div class="filters quiz-language">${languageControl()}</div>${bars(s.index,qs.length)}
    <div class="quizlayout" style="margin-top:20px"><section class="question">${questionHTML(q,s,s.index,reveal)}<div class="questionfoot">${s.mode==='test'?`<button class="btn light" data-act="prev" ${s.index===0?'disabled':''}>上一题</button><button class="btn ${s.index===qs.length-1?'':'secondary'}" data-act="${s.index===qs.length-1?'finish':'next'}">${s.index===qs.length-1?'交卷并看结果':'下一题 →'}</button>`:reveal?`<span class="small muted">已记录，本题不能重复领取经验。</span><button class="btn" data-act="${s.index===qs.length-1?'finish':'next'}">${s.index===qs.length-1?'完成本轮':'下一题 →'}</button>`:`<span class="small muted">先选择，再提交。</span><button class="btn" data-act="check" ${s.choices[s.index]===null?'disabled':''}>确认答案</button>`}</div>${s.mode==='test'?`<div class="dots" aria-label="题目导航">${s.ids.map((_,i)=>`<button class="dot ${i===s.index?'current':''} ${s.choices[i]!==null?'answered':''}" data-jump="${i}" aria-label="第${i+1}题，${s.choices[i]===null?'未答':'已答'}">${i+1}</button>`).join('')}</div><p class="small muted">已答 ${s.choices.filter(v=>v!==null).length} / ${qs.length}。交卷前不显示答案、分数或奖励。</p>`:''}</section>
    <aside class="sidekick">${character()}<div class="side-title"><b>${PETS[P().pet]} · Lv.${lv}</b></div><blockquote>${s.mode==='test'?'先自己完成，我们交卷后再一起回看。':reveal?'找到理由，比记住选项位置更重要。':'慢慢读。找出线索，再决定你的答案。'}</blockquote><div class="xp"><span class="small">${title(lv)} · ${lv>=150?'满级':P().xp%40+' / 40 XP'}</span>${bars(lv>=150?40:P().xp%40)}</div><p class="aside-tip small muted">${Date.now()-s.started>15*60000?'已经专注了一段时间，可以保存后休息一下。':'每轮有终点。答错不扣经验，也没有连续签到惩罚。'}</p></aside></div>`,focus);
  }
  function submit(){const s=P().session;if(s.mode==='test'&&s.choices.some(v=>v===null)&&!confirm('还有未作答题目。确定交卷？未作答题会记入待复习。'))return;try{E.finish(P(),s,qs);save();results();}catch(e){toast(e.message);}}
function correctionRun() {
  const s=P().session;
  if(!s?.finished||!s.recorded||s.catalogRevision!==M.contentRevision)return null;
  const run=P().runs.find(run=>run.id===s.id&&run.course===s.course);
  if(!run||run.catalogRevision!==s.catalogRevision||!Array.isArray(run.ids)||!Array.isArray(run.choices)||!Array.isArray(run.rewardChoices)||run.ids.length!==qs.length||run.choices.length!==qs.length||run.rewardChoices.length!==qs.length)return null;
  if(qs.some((q,i)=>!q||q.id!==run.ids[i]||s.ids[i]!==run.ids[i]||s.choices[i]!==run.choices[i]))return null;
  return run;
}
function historicalResult() {
  page='results';course=null;courseKey='';qs=[];renderToken++;
  const session=P().session,run=P().runs.find(run=>run.id===session?.id&&run.course===session?.course);
  view(`<section class="panel"><h1>${run?'已保存的原始成绩':'这份挑战需要重新开始'}</h1>${run?`<div class="score">${run.correct}<span> / ${run.total}</span></div><p>完成于 ${date(run.at)}。原始成绩保留。</p>`:''}<p>题库已更新，或这份旧挑战未记录题库版本。为保留当时的评分，这里不使用新版答案重新批改或订正。请开始新一轮练习。</p><div class="btnrow">${session?`<button class="btn" data-course="${esc(session.course)}">打开本学科，开始新一轮</button>`:''}<button class="btn light" data-nav="home">返回学科地图</button></div></section>`);
}
function correctionSummary() {
  const run=correctionRun();
  if(!run)return '<p class="small muted">这份旧成绩暂不支持本轮订正，可从学科页面开始新练习。</p>';
  const remaining=qs.filter((q,i)=>run.rewardChoices[i]!==q.answer).length;
  if(!remaining)return '<p class="learning-tip">'+(run.correctedAt?'本轮已订正至全部正确。':'本轮首次作答已全部正确。')+'原始成绩保留，游戏时间按符合条件的新题核算。</p>';
  return '<div class="panel"><h2>把错题弄懂，再试一次</h2><p>还有 '+remaining+' 题需要订正。全部答对后，这一轮的新题才可计入游戏时间；原始分数保留。</p><button class="btn secondary" data-act="correct-round">订正本轮错题</button></div>';
}
function correctionPage(focus=true) {
  const s=P().session,run=correctionRun();
  if(!s?.correctionActive||!run)return results();
  const wrong=qs.map((q,i)=>run.rewardChoices[i]!==q.answer?i:-1).filter(i=>i>=0);
  if(!wrong.length){s.correctionActive=false;save();return results();}
  if(!wrong.includes(s.correctionIndex)){s.correctionIndex=wrong[0];s.correctionChoice=null;s.correctionFeedback=false;}
  page='correction';const i=s.correctionIndex,q=qs[i],choices=qs.map(()=>null);choices[i]=s.correctionChoice;
  view(`<div class="quiztop"><div><span class="small muted">本轮订正 · 原始成绩 ${run.correct} / ${run.total}</span><h1>还有 ${wrong.length} 题需要订正</h1></div><button class="btn small light" data-act="correction-results">返回原始结果</button></div><p class="learning-tip">盖住讲解，再重新作答。订正不会改写原始分数，也不会重复领取经验。</p><div class="filters quiz-language">${languageControl()}</div><section class="panel question">${questionHTML(q,{choices},i,s.correctionFeedback===true)}<div class="questionfoot">${s.correctionFeedback?'<button class="btn" data-act="correction-retry">盖住讲解，再试一次</button>':`<button class="btn" data-act="correction-submit" ${s.correctionChoice===null?'disabled':''}>确认订正答案</button>`}</div></section>`,focus);
}
function handleCorrectionClick(button) {
  const s=P().session;
  if(button.dataset.act==='correct-round'){
    if(page!=='results'||!correctionRun())return true;
    s.correctionActive=true;s.correctionIndex=0;s.correctionChoice=null;s.correctionFeedback=false;
    save();correctionPage();return true;
  }
  if(page!=='correction')return false;
  if(button.dataset.option!==undefined){
    const choice=Number(button.dataset.option);
    if(!s.correctionFeedback&&Number.isInteger(choice)&&choice>=0&&choice<4){s.correctionChoice=choice;save();correctionPage(false);}
    return true;
  }
  if(button.dataset.act==='correction-results'){s.correctionActive=false;save();results();return true;}
  if(button.dataset.act==='correction-retry'){s.correctionChoice=null;s.correctionFeedback=false;save();correctionPage();return true;}
  if(button.dataset.act==='correction-submit'){
    if(s.correctionFeedback)return true;
    const result=E.correct(P(),s,qs,s.correctionIndex,s.correctionChoice);
    if(!result)return true;
    if(result.correct){s.correctionChoice=null;s.correctionFeedback=false;if(result.complete)s.correctionActive=false;}
    else s.correctionFeedback=true;
    save();
    if(result.complete){results();toast('本轮已全部订正，原始成绩保留。');}
    else {correctionPage(false);if(result.correct)toast('这题已订正。');else $('answer-explanation')?.focus?.({preventScroll:true});}
    return true;
  }
  return false;
}
  function results(){if(P().session?.catalogRevision!==M.contentRevision)return historicalResult();page='results';const s=P().session,res=E.result(s,qs),i=s.reviewIndex||0,q=qs[i];view(`<div class="panel"><div class="resulthead"><div class="eyebrow" style="color:var(--green)">MISSION COMPLETE</div><h1>这一站，完成了！</h1><div class="score">${res.correct}<span> / ${res.total}</span></div><p>${res.percent}% 正确 · 本轮获得 ${res.xp} XP · 人物 Lv.${E.level(P().xp)}</p><div class="btnrow" style="justify-content:center"><button class="btn" data-act="course-return">回本学科</button><button class="btn secondary" data-nav="home">保存，休息一下</button></div><p class="small muted">这是一轮练习，不是官方考试成绩。${res.correct<res.total?'答错及漏答题已加入巩固复习。':'下次可换一个主题再巩固。'}</p></div>${correctionSummary()}<div class="sectionhead"><h2>回看答案与解释</h2><span class="small">${i+1} / ${qs.length}</span></div><div class="dots">${qs.map((q,j)=>`<button class="dot ${j===i?'current':''} ${s.choices[j]===q.answer?'answered':''}" data-review="${j}" aria-label="回看第${j+1}题">${j+1}</button>`).join('')}</div>${questionHTML(q,s,i,true)}</div>${transferTask(course.subject)}`);}
  function report(){page='report';course=null;renderToken++;const p=P(),st=E.summary(p),rows=M.courses.filter(c=>Object.values(p.records).some(r=>r.course===c.key));view(`<h1>${esc(p.name)}的学习记录</h1><p class="muted">关注独立答对和仍需复习的内容，不把人物等级当考试成绩。</p><div class="reportgrid">${[[st.unique,'练过的不同题目'],[st.earned,'曾独立答对'],[st.wrong,'待复习错题'],[st.attempts?pct(st.correct,st.attempts)+'%':'—','累计作答正确率']].map(([v,l])=>`<div class="metric"><strong>${v}</strong><span>${l}</span></div>`).join('')}</div>
    ${learningSummary()}<div class="panel"><h2>各科学习足迹</h2>${rows.length?`<div class="tablewrap"><table><thead><tr><th>年级 / 学科</th><th>练过</th><th>曾答对</th><th>待复习</th><th></th></tr></thead><tbody>${rows.map(c=>{const t=byCourse(p,c.key);return `<tr><td>${GRADES[c.level]}<br>${subName(c.subject)}</td><td>${t.unique}</td><td>${t.earned}</td><td>${t.wrong}</td><td><button class="btn small secondary" data-course="${c.key}">进入</button></td></tr>`;}).join('')}</tbody></table></div>`:'<p class="muted">还没有作答记录。先从学科地图选一科开始。</p>'}<p class="small muted">“曾答对”是累计记录，不等于长期掌握；同一道题后来答错，仍会显示在待复习中。</p></div>
    <div class="panel"><h2>最近完成的挑战</h2>${p.runs.length?`<div class="tablewrap"><table><thead><tr><th>时间</th><th>课程</th><th>模式</th><th>结果</th></tr></thead><tbody>${p.runs.slice(-30).reverse().map(r=>{const c=meta(r.course);return `<tr><td>${date(r.at)}</td><td>${c?GRADES[c.level]+' · '+subName(c.subject):esc(r.course)}</td><td>${{test:'独立小测',practice:'探索挑战',review:'巩固复习'}[r.mode]}</td><td>${r.correct} / ${r.total}</td></tr>`;}).join('')}</tbody></table></div>`:'<p class="muted">完成一轮后会出现在这里。</p>'}</div><div class="btnrow"><button class="btn" data-act="export">下载我的成绩备份</button><button class="btn secondary" data-nav="audit">查看题量与依据</button></div>`);}
  function settings(){
    page='settings';course=null;renderToken++;
    const p=P(),lv=E.level(p.xp);
    view(`<h1>我的角色与设置</h1><p class="muted">这个学生账号保存你的学习记录。昵称不必填写真实姓名。</p>
      <div class="settingsgrid"><section class="panel"><h2>${esc(p.name)} · Lv.${lv}</h2>
      <div class="filters"><label class="field">学生昵称<input id="child-name" value="${esc(p.name)}" maxlength="24"></label>
      <label>目前年级<select id="child-grade">${E.LEVELS.map(l=>`<option value="${l}" ${p.grade===l?'selected':''}>${GRADES[l]}</option>`).join('')}</select></label>
      <label>升中一年份<select id="child-cohort">${[['2026','2026'],['2027','2027'],['other','其他／暂不指定']].map(([k,l])=>`<option value="${k}" ${p.cohort===k?'selected':''}>${l}</option>`).join('')}</select></label></div>
      <button class="btn small" data-act="save-profile">保存档案设置</button>
      <h3 style="margin-top:24px">选择同行角色</h3><div class="personchoices">${Object.entries(PETS).map(([id,n])=>`<button class="person ${id===p.pet?'on':''}" data-pet="${id}" aria-pressed="${id===p.pet}"><img src="${ASSETS[id]}" alt=""><b>${n}</b></button>`).join('')}</div>
      <h3 style="margin-top:24px">成长光环</h3><div class="btnrow">${[['mint','启程绿',1],['sun','阳光金',5],['violet','星光紫',12]].map(([id,n,l])=>`<button class="btn small ${p.outfit===id?'':'secondary'}" data-outfit="${id}" ${lv<l?'disabled':''}>${n}${lv<l?' · Lv.'+l:' ✓'}</button>`).join('')}</div>
      <p class="caption">只改变外观，不影响评分。每道新题首次答对 +5 XP，每 40 XP 升一级。</p></section>
      <section class="panel"><h2>我的云端记录</h2><p>练习进度会同步到这个学生账号。关联的家长可在自己的账号查看成绩。</p>
      <p class="caption">离开前请确认页面上方显示已同步；网络中断时，未同步的记录暂存在当前浏览器。</p>
      <button class="btn secondary" data-act="export">下载我的备份 JSON</button>
      <h3 style="margin-top:24px">显示与音效</h3><div class="filters">${languageControl(true,true)}${languageControl(false,true)}
      <label>答题音效<select id="sound"><option value="off" ${!S.settings.sound?'selected':''}>关闭</option><option value="on" ${S.settings.sound?'selected':''}>开启</option></select></label>
      <label>界面动画<select id="motion"><option value="on" ${S.settings.motion?'selected':''}>正常</option><option value="off" ${!S.settings.motion?'selected':''}>减少动画</option></select></label></div>
      <p class="small muted">语文科保持目标语言。小学非语文科默认华文，中学保留 BM / English。选择题不能代替独立写作、实验、口语或动作技能的评价。</p></section></div>`);
  }
  function audit(){
    page='audit';course=null;renderToken++;
    view(`<button class="back" data-nav="home">← 返回学科地图</button><h1>练习内容与来源</h1><p class="muted">日常练习重视不同考点。需要熟练操作时，再主动选择同类加练。</p>
    <div class="reportgrid">${[[M.courses.length,'年级 × 学科'],[M.availableTotal,'可用练习（含巩固变式）'],[M.practiceTotal,'日常精选'],[M.retiredTotal,'暂不进入新练习的旧题']].map(([n,label])=>`<div class="metric"><strong>${Number(n).toLocaleString()}</strong><span>${label}</span></div>`).join('')}</div>
    <section class="panel"><h2>SJKC 与 SMK 的课程练习</h2><p>小学按 SJKC、中一至中三按 SMK 的课程主题编排。各年级一般科目目标为 900 道，马来文与英文为 1,200 道；可用题量不包括已合并的重复题和暂停使用的旧题。阅读理解与文学保留，题目尽量用短句说明任务和条件。</p><p>这些题用于选定主题的练习与巩固，并非完整课纲测评。不同年级会复习基础技能；听说、作文、实验、创作和动作技能仍须配合课堂与实作。当前课程说明不等于 2027 新课程认证。</p></section>
    <section class="panel"><h2>怎样减少重复？</h2><p>相同题面与答案、只换选项的题合并；确认是同一词义或同一历史事实的正反问法也合并。大量只换数字或图形参数的题保留少量日常练习，其余放进“同类加练”。同一轮优先安排不同考点和材料。</p><p>原来的题号和学习记录保留。继续旧挑战、回看旧成绩或复习旧错题时，仍可看到原题。</p><p>这些分类不是全库语义去重的证明；不同年级仍会复习相同基础内容。<a href="./quality.html" target="_blank" rel="noopener">查看修订记录与检查范围 ↗</a></p></section>
    <section class="panel"><h2>答案讲解</h2><p>练习提交后显示正确答案、理由或计算步骤；小测交卷后可逐题回看，包括未作答的题。看懂后，试着盖住解释，再用自己的话说明。</p></section>
    <div class="tablewrap"><table><thead><tr><th>年级</th><th>学科</th><th>可用／目标</th><th>日常／加练</th><th>学习范围</th></tr></thead><tbody>${M.courses.map(c=>`<tr><td>${GRADES[c.level]}</td><td><button class="btn small light" data-course="${c.key}">${subName(c.subject)}</button></td><td>${c.availableCount} / ${c.targetCount}</td><td>${c.coreCount} / ${c.extraCount}</td><td>${esc(c.coverage)}${c.retiredCount?`<br><small>${c.retiredCount} 道旧题暂不抽取；成绩记录保留。</small>`:''}</td></tr>`).join('')}</tbody></table></div>
    <details class="panel"><summary>来源与核对范围</summary><p>本网站为原创练习，不是官方试卷或全课纲认证。选择题无法替代作文、口语、实验或体育艺术实操。来源与逐项核验范围如下。</p>${sourceList(M.sources.map(s=>s.id))}</details>`);
  }

  function exportSave(){const blob=new Blob([JSON.stringify({...S,exportedAt:new Date().toISOString()},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='WordQuest_Backup_'+new Date().toISOString().slice(0,10)+'.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);toast('备份已生成，请保留下载的 JSON 文件。');}
  function stopAudio(){audioToken++;for(const n of audioNodes){try{n.stop();}catch(e){}try{n.disconnect();}catch(e){}}audioNodes=[];}
  async function playAudio(data){stopAudio();const token=audioToken;try{const AC=window.AudioContext||window.webkitAudioContext;if(!AC){toast('此浏览器无法播放题目音频，请换浏览器。');return;}audioContext=audioContext||new AC();await audioContext.resume();if(token!==audioToken)return;const bpm=Math.min(200,Math.max(40,Number(data.bpm)||80));let at=audioContext.currentTime+.08,total=0;for(const n of (data.notes||[]).slice(0,64)){const duration=Math.min(8,Math.max(.125,Number(n.beats)||1))*60/bpm;if(total+duration>35)break;const hz=Number(n.hz)||0;if(hz>0){const osc=audioContext.createOscillator(),gain=audioContext.createGain();osc.type='sine';osc.frequency.value=Math.max(20,Math.min(2200,hz));gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(.12,at+.02);gain.gain.setValueAtTime(.12,at+Math.max(.025,duration-.05));gain.gain.linearRampToValueAtTime(0,at+duration);osc.connect(gain);gain.connect(audioContext.destination);osc.start(at);osc.stop(at+duration+.01);audioNodes.push(osc);}at+=duration;total+=duration;}}catch(e){toast('音频未能启动，请再次点播放，或检查设备声音设置。');}}
  function navigate(p){save();if(p==='home')home();else if(p==='report')report();else if(p==='settings')settings();else if(p==='audit')audit();}
  document.addEventListener('click',async event=>{if(!S||readOnly||!event.target.closest('#exercise-shell'))return;const b=event.target.closest('button');if(!b||b.disabled)return;try{
    if(b.dataset.lesson)return await launchLesson(b.dataset.lesson);
    if(b.dataset.mission){const day=L.day(P()),id=b.dataset.mission;if(!PLAN_STEPS.some(s=>s[0]===id))return;day.missions=day.missions.includes(id)?day.missions.filter(x=>x!==id):[...day.missions,id];save();return home();}
    if(b.dataset.nav)return navigate(b.dataset.nav);
    if(b.dataset.grade){P().grade=b.dataset.grade;save();return home();}
    if(b.dataset.course)return await openCourse(b.dataset.course);
    if(b.dataset.start)return await start(b.dataset.start);
    if(handleCorrectionClick(b))return;
    if(b.dataset.option!==undefined){const s=P().session;if(!s||page!=='quiz')return;E.choose(s,s.index,Number(b.dataset.option));save();return quiz(false);}
    if(b.dataset.jump!==undefined){P().session.index=Number(b.dataset.jump);save();return quiz();}
    if(b.dataset.review!==undefined){P().session.reviewIndex=Number(b.dataset.review);save();return results();}
    if(b.dataset.pet){P().pet=b.dataset.pet;save();return settings();}
    if(b.dataset.outfit){const need={mint:1,sun:5,violet:12}[b.dataset.outfit];if(E.level(P().xp)>=need){P().outfit=b.dataset.outfit;save();settings();}return;}
    const s=P().session;switch(b.dataset.act){
      case 'save-reflection':L.day(P()).reflection=$('plan-reflection').value.trim().slice(0,240);save();return toast('今天的发现已保存。');
      case 'resume':return await resume();
      case 'check':{const before=E.level(P().xp);if(E.check(P(),s,qs[s.index])){save();quiz(false);const feedback=$('answer-explanation');feedback?.focus?.({preventScroll:true});feedback?.scrollIntoView?.({block:'start',behavior:'instant'});if(E.level(P().xp)>before)toast('升级了！现在是 Lv.'+E.level(P().xp));if(S.settings.sound)playAudio({bpm:160,notes:[{hz:s.choices[s.index]===qs[s.index].answer?660:330,beats:.25}]});}return;}
      case 'next':s.index=Math.min(qs.length-1,s.index+1);save();return quiz();
      case 'prev':s.index=Math.max(0,s.index-1);save();return quiz();
      case 'finish':return submit();
      case 'course-return':return coursePage();
      case 'audio':return playAudio(qs[page==='results'?s.reviewIndex:page==='correction'?s.correctionIndex:s.index].audio);
      case 'stop-audio':return stopAudio();
      case 'export':return exportSave();
      case 'save-profile':P().name=$('child-name').value.trim().slice(0,24)||'孩子';P().grade=$('child-grade').value;P().cohort=$('child-cohort').value;save();settings();return toast('档案设置已保存。');
    }
  }catch(e){toast('操作未完成：'+e.message);}});
  document.addEventListener('input',event=>{if(!S||readOnly||!event.target.closest('#exercise-shell'))return;if(event.target.id==='plan-reflection')L.day(P()).reflection=event.target.value.slice(0,240);});
  document.addEventListener('change',event=>{if(!S||readOnly||!event.target.closest('#exercise-shell'))return;const el=event.target;
    if(el.id==='daily-goal'){P().learning.goal=[15,30,60].includes(Number(el.value))?Number(el.value):60;save();home();}
    else if(el.id==='plan-reflection'){L.day(P()).reflection=el.value.trim().slice(0,240);save();}
    else if(el.id==='topic')topic=el.value;
    else if(el.id==='difficulty')difficulty=el.value;
    else if(el.id==='display'){S.settings.display=el.value;save();if(page==='quiz')quiz(false);else if(page==='correction')correctionPage(false);}
    else if(el.id==='primary-display'){S.settings.primaryDisplay=el.value;save();if(page==='quiz')quiz(false);else if(page==='correction')correctionPage(false);}
    else if(el.id==='sound'){S.settings.sound=el.value==='on';save();}
    else if(el.id==='motion'){S.settings.motion=el.value==='on';save();header();}
  });
  document.addEventListener('keydown',e=>{if(!S||readOnly||!['quiz','correction'].includes(page)||['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName)||e.ctrlKey||e.altKey||e.metaKey)return;if(/^[1-4]$/.test(e.key)){const b=$('app').querySelector(`[data-option="${Number(e.key)-1}"]`);if(b&&!b.disabled){e.preventDefault();b.click();}}});
  document.addEventListener('visibilitychange',()=>{if(!S||readOnly)return;if(document.hidden){stopAudio();save();}});
  window.addEventListener('pagehide',()=>{if(!S||readOnly)return;stopAudio();save();});
  window.addEventListener('error',()=>{if(!S)return;note='页面发生运行错误。请先导出备份；刷新前确认进度已保存。';storageNote();});
  window.WQApp=Object.freeze({
    mount(raw,options={}){
      const next=E.validate(raw);
      if(next.profiles.length!==1)throw Error('线上学生账号需要一份独立学生档案。');
      renderToken++;stopAudio();clearTimeout(toastTimer);
      S=next;S.active=0;readOnly=options.readOnly===true;note='';
      page='home';courseKey='';course=null;qs=[];topic='all';difficulty='all';
      $('toast').hidden=true;$('exercise-shell').hidden=false;
      home();
    },
    snapshot(){return S?structuredClone(S):null;},
    unmount(){
      renderToken++;stopAudio();clearTimeout(toastTimer);
      S=null;course=null;qs=[];note='';readOnly=false;
      $('exercise-shell').hidden=true;$('app').innerHTML='';
      $('toast').hidden=true;$('profile-switch').innerHTML='';
      document.body.classList.remove('nomotion');storageNote();
    },
    setNotice(text){note=String(text??'');storageNote();}
  });
})();
