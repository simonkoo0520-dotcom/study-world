/* Pure learning/save engine. No browser or network dependency. */
(function (root) {
  'use strict';
  const VERSION = 9;
  const LEVELS = ['P1','P2','P3','P4','P5','P6','F1','F2','F3'];
  const PETS = ['owl','fox','turtle'];
  const own = (o,k) => Object.prototype.hasOwnProperty.call(o || {}, k);
  const num = (x,lo,hi,fallback=lo) => Number.isFinite(Number(x)) ? Math.max(lo,Math.min(hi,Math.floor(Number(x)))) : fallback;
  const str = (x,n=100) => typeof x === 'string' ? x.slice(0,n) : '';
  const id = () => 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2,8);
  function profile(name='孩子', grade='P1', cohort='2026') {
    return {id:id(),name,grade,cohort,pet:'owl',outfit:'mint',xp:0,records:{},runs:[],session:null};
  }
  function initial() {
    return {format:'WordQuest9',version:VERSION,active:0,profiles:[profile('孩子一','F1','2026'),profile('孩子二','P6','2027')],settings:{display:'bm+en',primaryDisplay:'zh',sound:false,motion:true},updated:Date.now()};
  }
  function safeKey(k) { return typeof k === 'string' && k.length < 160 && !['__proto__','constructor','prototype'].includes(k); }
function rewardQuestionId(value) {
  return safeKey(value)&&value.trim().length>0&&!/[\u0000-\u001f\u007f]/.test(value);
}
function rewardRevision(value) {
  return typeof value==='string'&&/^[a-f0-9]{16,64}$/.test(value)?value:'';
}
function cleanRewardReceipt(run) {
  const total=run?.total,validChoice=value=>value===null||(Number.isInteger(value)&&value>=0&&value<4);
  if(!rewardRevision(run?.catalogRevision))return {};
  if(!Number.isInteger(total)||total<1||total>40||!Array.isArray(run.ids)||run.ids.length!==total||!run.ids.every(rewardQuestionId)||new Set(run.ids).size!==total)return {};
  if(!Array.isArray(run.choices)||!Array.isArray(run.rewardChoices)||run.choices.length!==total||run.rewardChoices.length!==total||!run.choices.every(validChoice)||!run.rewardChoices.every(validChoice))return {};
  if(!Number.isInteger(run.at)||run.at<0||run.at>9999999999999||!Number.isInteger(run.correctedAt)||run.correctedAt<0||run.correctedAt>9999999999999||(run.correctedAt>0&&run.correctedAt<run.at))return {};
  return {ids:run.ids.slice(),choices:run.choices.slice(),rewardChoices:run.rewardChoices.slice(),correctedAt:run.correctedAt,catalogRevision:run.catalogRevision};
}
  function cleanSession(x) {
    if(!x || !safeKey(x.course) || !Array.isArray(x.ids) || x.ids.length<1 || x.ids.length>40 || !['practice','test','review'].includes(x.mode)) return null;
    const ids=x.ids.filter(rewardQuestionId); if(ids.length!==x.ids.length || new Set(ids).size!==ids.length) return null;
    return {id:str(x.id,100)||id(),course:x.course,mode:x.mode,catalogRevision:rewardRevision(x.catalogRevision),ids,index:num(x.index,0,ids.length-1),choices:ids.map((_,i)=>Number.isInteger(x.choices?.[i])&&x.choices[i]>=0&&x.choices[i]<4?x.choices[i]:null),checked:ids.map((_,i)=>x.mode!=='test'&&x.checked?.[i]===true),started:num(x.started,0,9999999999999,Date.now()),finished:x.finished===true,reviewIndex:num(x.reviewIndex,0,ids.length-1),xpGain:num(x.xpGain,0,1000),recorded:x.recorded===true,correctionActive:x.correctionActive===true,correctionIndex:num(x.correctionIndex,0,ids.length-1),correctionChoice:Number.isInteger(x.correctionChoice)&&x.correctionChoice>=0&&x.correctionChoice<4?x.correctionChoice:null,correctionFeedback:x.correctionFeedback===true};
  }
  function validate(raw) {
    if(!raw || raw.format!=='WordQuest9' || raw.version!==VERSION || !Array.isArray(raw.profiles) || raw.profiles.length<1 || raw.profiles.length>12) throw new Error('不是本版有效备份。旧版备份请用“导入旧版角色”。');
    const s=initial(); const used=new Set();
    s.profiles=raw.profiles.map((p,i)=>{
      if(!p || typeof p!=='object') throw new Error('孩子档案格式损坏');
      const q=profile(str(p.name,24).trim()||'孩子 '+(i+1),LEVELS.includes(p.grade)?p.grade:'P1',['2026','2027','other'].includes(p.cohort)?p.cohort:'other');
      q.id=safeKey(p.id)&&!used.has(p.id)?p.id:id();used.add(q.id);
      q.pet=PETS.includes(p.pet)?p.pet:'owl';q.outfit=['mint','sun','violet'].includes(p.outfit)?p.outfit:'mint';q.xp=num(p.xp,0,1000000);
      q.records=Object.create(null);
      if(p.records && typeof p.records==='object') {
        const entries=Object.entries(p.records);if(entries.length>100000)throw new Error('单份档案记录过大');
        for(const [k,r] of entries) if(safeKey(k)&&r&&typeof r==='object') q.records[k]={course:safeKey(r.course)?r.course:'',seen:num(r.seen,0,100000),right:num(r.right,0,100000),wrong:r.wrong===true,earned:r.earned===true,recovered:r.recovered===true,lastRun:str(r.lastRun,100),lastAt:num(r.lastAt,0,9999999999999)};
      }
      q.runs=(Array.isArray(p.runs)?p.runs:[]).slice(-150).filter(r=>r&&safeKey(r.course)).map(r=>({id:str(r.id),course:r.course,mode:['practice','test','review'].includes(r.mode)?r.mode:'practice',total:num(r.total,1,40),answered:Number.isInteger(r.answered)?num(r.answered,0,num(r.total,1,40)):['practice','review'].includes(r.mode)?num(r.total,1,40):0,correct:num(r.correct,0,40),at:num(r.at,0,9999999999999),...cleanRewardReceipt(r)}));
      q.session=cleanSession(p.session);q.legacyNote=str(p.legacyNote,400);return q;
    });
    s.active=num(raw.active,0,s.profiles.length-1);s.settings={display:['bm+en','bm','en'].includes(raw.settings?.display)?raw.settings.display:'bm+en',primaryDisplay:['zh','zh+en','zh+bm','en','bm','bm+en'].includes(raw.settings?.primaryDisplay)?raw.settings.primaryDisplay:'zh',sound:raw.settings?.sound===true,motion:raw.settings?.motion!==false};s.updated=Date.now();return root.WQLearning?root.WQLearning.validateExtras(raw,s):s;
  }
  function legacyProfiles(raw) {
    const source=raw?.data || raw?.state || raw?.save || raw;
    const rows=Array.isArray(source?.profiles)?source.profiles:Array.isArray(source?.children)?source.children:[];
    const out=rows.filter(p=>p&&typeof p==='object').slice(0,12).map(p=>{
      const grade=LEVELS.includes(p.level)?p.level:LEVELS.includes(p.grade)?p.grade:Number.isInteger(p.grade)&&p.grade>=1&&p.grade<=6?'P'+p.grade:'P1';
      const q=profile(str(p.name,24)||'旧版角色',grade,'other');q.pet=PETS.includes(p.pet)?p.pet:'owl';q.xp=num(p.xp,0,1000000);
      q.legacyNote='保留旧版姓名、角色、年级与经验；新版题目编号和内容不同，旧答题成绩未套用。原备份请继续保留。';return q;
    });
    if(!out.length)throw new Error('未找到可识别的旧版 profiles / children 档案。原文件未改变。'); return out;
  }
  function shuffle(xs, random=Math.random) { const a=xs.slice(); for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a; }
  function selectQuestions(pool,p,mode,count,random=Math.random) {
    let a=shuffle(pool,random);
    if(mode==='review')a=a.filter(q=>p.records[q.id]?.wrong||root.WQLearning?.due(p.records[q.id]));
    a.sort((q,r)=>priority(q)-priority(r));
    function priority(q){const r=p.records[q.id];return mode==='review'?(r?.wrong?0:1):root.WQLearning?.due(r)?0:!r?1:r.wrong?2:3;}
    const chosen=[],keys=new Set(),materials=new Set(),families=new Map();
    function take(q,cap){
      const key=q.learningKey||q.id,material=q.materialGroup||q.caseId||q.id,family=q.learningFamily||q.learningGroup||q.model||q.id;
      if(keys.has(key)||materials.has(material)||(families.get(family)||0)>=cap)return;
      chosen.push(q);keys.add(key);materials.add(material);families.set(family,(families.get(family)||0)+1);
    }
    // Prefer a different learning target and reading passage for every question.
    for(const cap of [1,2]){
      for(const q of a){if(chosen.length>=count)break;take(q,cap);}
      if(chosen.length>=count)break;
    }
    return chosen;
  }

  function start(course,questions,mode,catalogRevision=root.WQManifest?.contentRevision||'') { if(!questions.length)throw new Error('所选条件下没有题目');return {id:'r'+Date.now().toString(36)+Math.random().toString(36).slice(2,7),course,mode,catalogRevision:rewardRevision(catalogRevision),ids:questions.map(q=>q.id),index:0,choices:questions.map(()=>null),checked:questions.map(()=>false),started:Date.now(),finished:false,reviewIndex:0,xpGain:0,recorded:false}; }
  function choose(s,index,option){if(s.finished||s.checked[index]||!Number.isInteger(option)||option<0||option>3||index<0||index>=s.ids.length)return false;s.choices[index]=option;return true;}
  function apply(p,q,choice,runId,course='') {
    const r=own(p.records,q.id)?p.records[q.id]:{seen:0,right:0,wrong:false,earned:false,recovered:false,lastRun:'',lastAt:0};
    if(r.lastRun===runId)return 0;
    const previous={...r};const right=choice===q.answer;let gain=0;
    if(right){if(!r.earned){gain+=5;r.earned=true;}if(r.wrong&&!r.recovered){gain+=2;r.recovered=true;}r.right++;r.wrong=false;}else r.wrong=true;
    r.course=course||q.course||'';r.seen++;r.lastRun=runId;r.lastAt=Date.now();p.records[q.id]=r;root.WQLearning?.record(p,q,right,r.lastAt,previous);p.xp+=gain;return gain;
  }
  function check(p,s,q) {
    const i=s.index;if(s.mode==='test'||s.finished||s.checked[i]||s.choices[i]===null||q.id!==s.ids[i])return false;
    s.xpGain+=apply(p,q,s.choices[i],s.id,s.course);s.checked[i]=true;return true;
  }
  function finish(p,s,questions){
    if(s.finished)return result(s,questions);
    if(questions.length!==s.ids.length||questions.some((q,i)=>q.id!==s.ids[i]))throw new Error('题目版本不匹配');
    if(s.mode!=='test'&&s.checked.some(x=>!x))throw new Error('请先完成本轮练习');
    for(let i=0;i<questions.length;i++)s.xpGain+=apply(p,questions[i],s.choices[i],s.id,s.course);
    s.finished=true;const res=result(s,questions);
    if(!s.recorded){p.runs.push({id:s.id,course:s.course,mode:s.mode,total:res.total,answered:s.choices.filter(choice=>Number.isInteger(choice)&&choice>=0&&choice<4).length,correct:res.correct,at:Date.now(),catalogRevision:s.catalogRevision,ids:s.ids.slice(),choices:s.choices.slice(),rewardChoices:s.choices.slice(),correctedAt:0});p.runs=p.runs.slice(-150);s.recorded=true;}return res;
  }
function correct(p,s,questions,index,choice) {
  if(!s||s!==p.session||!s.finished||!s.recorded||!Array.isArray(questions)||!Number.isInteger(index)||index<0||index>=questions.length||!Number.isInteger(choice)||choice<0||choice>3)return false;
  const run=p.runs.find(run=>run.id===s.id&&run.course===s.course),receipt=cleanRewardReceipt(run);
  if(!receipt.ids||s.catalogRevision!==receipt.catalogRevision||questions.length!==receipt.ids.length||s.ids.length!==receipt.ids.length)return false;
  if(questions.some((question,i)=>!question||question.id!==receipt.ids[i]||s.ids[i]!==receipt.ids[i]||s.choices[i]!==receipt.choices[i]||!Number.isInteger(question.answer)||question.answer<0||question.answer>3))return false;
  if(run.rewardChoices[index]===questions[index].answer)return false;
  const changed=run.rewardChoices[index]!==choice;
  run.rewardChoices[index]=choice;
  const complete=questions.every((question,i)=>run.rewardChoices[i]===question.answer);
  if(complete&&!run.correctedAt)run.correctedAt=Math.max(run.at,Date.now());
  // Corrections have their own receipt. Original score, choices, XP and attempt statistics stay intact.
  return {correct:choice===questions[index].answer,complete,changed};
}
  function result(s,questions){const correct=questions.reduce((n,q,i)=>n+(s.choices[i]===q.answer?1:0),0);return {correct,total:questions.length,percent:questions.length?Math.round(correct*100/questions.length):0,xp:s.xpGain};}
  function level(xp){return Math.min(150,1+Math.floor(Math.max(0,xp)/40));}
  function summary(p,ids){const rows=(ids||Object.keys(p.records)).map(id=>p.records[id]).filter(Boolean);return {attempts:rows.reduce((n,r)=>n+r.seen,0),correct:rows.reduce((n,r)=>n+r.right,0),unique:rows.length,earned:rows.filter(r=>r.earned).length,wrong:rows.filter(r=>r.wrong).length};}
  const api={VERSION,LEVELS,PETS,profile,initial,validate,legacyProfiles,shuffle,selectQuestions,start,choose,apply,check,finish,correct,result,level,summary};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.WQCore=api;
})(typeof window!=='undefined'?window:globalThis);
