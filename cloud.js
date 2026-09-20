import { CloudSync } from './sync.js';

const $ = id => document.getElementById(id);
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const root = $('portal-root');
const shell = $('exercise-shell');
const bar = $('account-bar');
const E = window.WQCore;
const config = window.WQ_CONFIG || {};
const GRADES = {P1:'小一',P2:'小二',P3:'小三',P4:'小四',P5:'小五',P6:'小六',F1:'中一',F2:'中二',F3:'中三'};
const SUBJECTS = {bm:'马来文',english:'英文',chinese:'华文',math:'数学',science:'科学',moral:'道德教育',pjpk:'体育与健康',art:'视觉艺术',music:'音乐',history:'历史',geography:'地理',rbt:'设计与工艺',ask:'电脑科学基础'};
let db, user, role, sync, booting = false, bootRequested = false, authGeneration = 0, links = [], selectedChild = '', parentTimer, lastSaved = '', loginEmail = '', lastSend = 0, viewToken = 0, recovering = false;
let loginMethod = 'password', passwordRecovery = false, passwordView = false;
let gameLobbyStatus = null;
const GAME_DURATIONS = [300,600,900,1800,3600];
const recoveryKey = 'wordquest.passwordRecovery';
const redirectURL = () => new URL('./', location.href).href;
function recoveryAccount(value) {
  try {
    if (value === undefined) return sessionStorage.getItem(recoveryKey);
    if (value) sessionStorage.setItem(recoveryKey, value); else sessionStorage.removeItem(recoveryKey);
  } catch { /* The current recovery screen still works without browser storage. */ }
  return null;
}
const stamp = time => time ? new Date(time).toLocaleString('zh-CN', {dateStyle:'short',timeStyle:'short'}) : '尚无记录';
const brand = '<div class="cloud-brand"><span class="logo">学</span>学科冒险</div>';
const key = () => user ? `wordquest.draft.v1.${user.id}` : '';
const blankState = () => ({...E.initial(),profiles:[E.profile('同学','P1','other')],active:0});
function page(html, narrow = false) {
  window.WQGameBreak?.stop();
  shell.hidden = true; root.hidden = false; root.innerHTML = `<main class="cloud-page ${narrow?'cloud-login':''}">${brand}${html}</main>`;
}
function errorMessage(error) {
  if (/WQ_GAME_LEARNING_REQUIRED/.test(error?.message || '')) return '先完成今天的学习计划，再来玩小游戏。';
  if (/WQ_GAME_GRADE_REQUIRED/.test(error?.message || '')) return '请先填写并保存注册年级，再开始累计游戏时间。';
  if (/WQ_GAME_GRADE_LOCKED|WQ_GAME_GRADE_ALREADY/.test(error?.message || '')) return '注册年级已经保存。需要修改时，请由已绑定的家长或管理员处理。';
  if (/WQ_GAME_INVALID_GRADE|WQ_GAME_GRADE_INVALID/.test(error?.message || '')) return '请选择小一至中三的有效注册年级。';
  if (/WQ_GAME_PARENT_LINK_REQUIRED/.test(error?.message || '')) return '请先绑定这个学生账号，再读取或修改注册年级。';
  if (/WQ_GAME_INSUFFICIENT|WQ_GAME_INVALID_DURATION|WQ_GAME_DURATION/.test(error?.message || '')) return '请选择余额足够支付的游戏时长，或重新检查最新余额。';
  if (/WQ_GAME_QUESTIONS_REQUIRED/.test(error?.message || '')) return '各科分别累计 20 道满分或订正全对的新题，才能兑换游戏时间。';
  if (/WQ_GAME_TIME_USED/.test(error?.message || '')) return '本次游戏已经结束。可以查看剩余游戏余额，准备好后再选择下一次时长。';
  if (error?.code === 'invalid_credentials' || /invalid login credentials/i.test(error?.message || '')) return '邮箱或密码不正确。还没设置密码的话，请先用邮箱链接登录，再设置密码。';
  if (error?.code === 'email_not_confirmed') return '请先通过邮箱链接验证邮箱，再使用密码登录。';
  if (error?.code === 'weak_password') return '密码强度不足，请使用更长的密码，并按提示加入大小写字母、数字或符号。';
  if (error?.code === 'same_password') return '新密码不能与当前密码相同，请换一个。';
  if (['reauthentication_needed','reauthentication_not_valid','session_not_found'].includes(error?.code)) return '请退出后重新用邮箱链接登录，再设置密码。';
  if (error?.code === '40001') return '另一台设备已保存更新。请下载这里的未同步备份，再读取最新云端记录。';
  if (/expired|invalid.*token|otp_expired/i.test(error?.message || '')) return '验证链接或邀请码已失效，请申请一个新的。';
  if (/rate|too many/i.test(error?.message || '')) return '发送次数暂时达到限制，请稍后重试。';
  if (/not authorized|email_address_not_authorized/i.test(error?.message || '')) return '网站的邮件发送服务尚未开放，请联系老师完成设置。';
  if (/fetch|network|offline/i.test(error?.message || '')) return '网络暂时无法连接，请检查网络后重试。';
  if (/invite|invitation|token|email.*match/i.test(error?.message || '')) return '邀请码不可用、已过期或不属于当前邮箱，请核对后重试。';
  if (/schema cache|does not exist|PGRST|function.*not found/i.test(error?.message || '')) return '网站的成绩服务尚未完成设置，请联系老师。';
  return '操作未完成，请稍后重试。若持续出现，请联系老师检查网站设置。';
}
function notice(text, ok = false) { const box = $('cloud-message'); if (box) {box.className = ok ? 'cloud-success' : 'cloud-error';box.textContent = text;box.hidden = false;} }
async function rpc(name, args = {}) { const {data,error} = await db.rpc(name,args); if(error) throw error; return data; }
function readDraft() { try {return JSON.parse(sessionStorage.getItem(key()) || 'null');}catch{return null;} }
function writeDraft(value) {
  try {if(value) sessionStorage.setItem(key(),JSON.stringify(value));else sessionStorage.removeItem(key());}
  catch {window.WQApp?.setNotice('当前浏览器不能保存临时备份。请保持网页打开，直到显示“已同步”。');}
}
function download(state, filename = 'WordQuest_未同步备份.json') {
  const url = URL.createObjectURL(new Blob([JSON.stringify(state,null,2)], {type:'application/json'}));
  const a = document.createElement('a'); a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),20000);
}
function reset() {
  window.WQGameBreak?.stop();
  ++authGeneration;++viewToken; clearInterval(parentTimer); sync?.stop();sync=null;user=null;role=null;links=[];selectedChild='';recovering=false;passwordRecovery=false;passwordView=false;gameLobbyStatus=null;
  window.WQApp?.unmount();shell.hidden=true;shell.inert=false;bar.hidden=true;
  $('sync-warning')?.remove();
}
function login(message = '', successful = false) {
  const password = loginMethod === 'password';
  page(`<section class="cloud-card"><h1>登录学科冒险</h1><p>学生做练习，家长查看孩子的学习记录。</p><div class="cloud-login-methods" role="group" aria-label="选择登录方式"><button type="button" data-cloud="login-method" data-method="password" aria-pressed="${password}">密码登录</button><button type="button" data-cloud="login-method" data-method="link" aria-pressed="${!password}">邮箱链接登录</button></div><form id="login-form" class="cloud-form"><label class="cloud-label" for="login-email">邮箱地址</label><input class="cloud-input" id="login-email" type="email" autocomplete="username" required maxlength="254" placeholder="name@example.com" value="${esc(loginEmail)}">${password?'<label class="cloud-label" for="login-password">密码</label><input class="cloud-input" id="login-password" type="password" autocomplete="current-password" required maxlength="256">':''}<button class="btn" type="submit">${password?'用密码登录':'发送登录链接'}</button></form>${password?'<button class="cloud-text-button" type="button" data-cloud="forgot-password">忘记密码？</button>':''}<div id="cloud-message" role="status" aria-live="polite" ${message?'':'hidden'} class="${successful?'cloud-success':'cloud-error'}">${esc(message)}</div><p class="cloud-hint">${password?'还没设置密码？先用“邮箱链接登录”，进入后点击“设置密码”。以后即可直接用密码登录。':'首次使用先验证邮箱，即可完成注册。请打开邮件中的登录链接；之后可选择设置密码。'}</p><p class="cloud-footer">学生和家长分别使用自己的邮箱。<br>免费学习 · 成绩仅本人和已绑定家长可见</p></section>`,true);
}
function resetPasswordRequest() {
  page(`<section class="cloud-card"><h1>重设密码</h1><p>输入你的登录邮箱，我们会发送重设密码链接。</p><form id="reset-request-form" class="cloud-form"><label class="cloud-label" for="login-email">邮箱地址</label><input class="cloud-input" id="login-email" type="email" autocomplete="username" required maxlength="254" value="${esc(loginEmail)}"><button class="btn" type="submit">发送重设密码链接</button></form><div id="cloud-message" role="status" aria-live="polite" hidden></div><button class="cloud-text-button" type="button" data-cloud="back-login">返回登录</button></section>`,true);
}
function passwordSettings() {
  if (!user || recovering || (booting && !passwordRecovery)) return;
  ++viewToken; passwordView = true;
  page(`<section class="cloud-card"><h1>${passwordRecovery?'重设密码':'设置密码'}</h1><p class="cloud-password-account">${esc(user.email)}</p><p>设置后，同一个账号可以选择密码或邮箱链接登录，学习记录和绑定关系保留。</p><form id="password-form" class="cloud-form"><input type="hidden" autocomplete="username" value="${esc(user.email)}"><label class="cloud-label" for="new-password">新密码</label><input class="cloud-input" id="new-password" type="password" autocomplete="new-password" required minlength="10" maxlength="256" aria-describedby="password-hint"><label class="cloud-label" for="confirm-password">再次输入新密码</label><input class="cloud-input" id="confirm-password" type="password" autocomplete="new-password" required minlength="10" maxlength="256"><p class="cloud-hint" id="password-hint">至少 10 个字符。建议使用较长、未在其他网站用过的密码。</p><button class="btn" type="submit">保存密码</button></form><div id="cloud-message" role="status" aria-live="polite" hidden></div><button class="cloud-text-button" type="button" data-cloud="${passwordRecovery?'logout':'password-cancel'}">${passwordRecovery?'退出登录':'暂不设置，返回'}</button></section>`,true);
}
async function leavePasswordSettings() {
  passwordView = false;
  if (passwordRecovery) { passwordRecovery = false; recoveryAccount(null); await boot(); }
  else if (!role) chooseRole();
  else if (role === 'student') { ++viewToken; root.hidden = true; shell.hidden = false; }
  else await parentDashboard();
}
function accountBar() {
  bar.hidden=false;bar.className='cloud-account';
  bar.innerHTML=`<span class="account-email">${role==='student'?'学生':'家长'} · ${esc(user.email)}</span><span id="sync-status" class="cloud-status" role="status"></span>${role==='student'?'<button class="btn small light" data-cloud="student-home">继续练习</button><button class="btn small secondary" data-cloud="manage-links">家长绑定</button><button class="btn small secondary" data-cloud="game-lobby">小游戏</button>':''}<button class="btn small light" data-cloud="password-settings">设置密码</button><button class="btn small light" data-cloud="logout">退出登录</button>`;
}
function status(state, detail) {
  const el=$('sync-status'); if(!el) return;
  const labels={pending:'有进度等待同步',saving:'正在同步…',saved:'已同步',error:'未同步，请重试',conflict:'另一台设备有新记录'};
  el.textContent=labels[state]||'';el.dataset.state=state;
  if(state==='saved'){lastSaved=detail||lastSaved;el.title=stamp(lastSaved);window.WQApp?.setNotice('');$('sync-warning')?.remove();}
  if(state==='error'||state==='conflict'){
    if(state==='conflict') shell.inert=true;
    let warning=$('sync-warning');if(!warning){warning=document.createElement('section');warning.id='sync-warning';warning.className='cloud-sync-warning';bar.after(warning);}
    warning.innerHTML=`<p>${state==='conflict'?errorMessage({code:'40001'}):'进度尚未上传，家长暂时看不到这次更新。请保持网页打开并重试。'}</p><div class="btnrow">${state==='error'?'<button class="btn small" data-cloud="retry-save">重试同步</button>':''}<button class="btn small secondary" data-cloud="draft-download">下载未同步备份</button>${state==='conflict'?'<button class="btn small light" data-cloud="reload-cloud">读取云端记录</button>':''}</div>`;
  }
}
const gameCount = value => Number.isFinite(Number(value)) ? Math.max(0,Math.floor(Number(value))) : 0;
const gameMinutes = value => `${Math.floor(gameCount(value)/60)} 分钟${gameCount(value)%60?` ${gameCount(value)%60} 秒`:''}`;
function gradeOptions(selected = '') {return `<option value="" ${selected?'':'selected'} disabled>请选择真实年级</option>${Object.entries(GRADES).map(([id,name])=>`<option value="${id}" ${selected===id?'selected':''}>${name}</option>`).join('')}`;}
function gameGradeEnrollment(returnToLearning = false) {
  page(`<section class="cloud-card"><span class="eyebrow">先记录你的学习阶段</span><h1>设置注册年级</h1><p>请选择你目前的真实年级。小游戏奖励只计算这个年级或以上的合资格题目。</p><p class="cloud-hint">未登记前完成的练习不会产生游戏奖励，也不会在登记后补发；普通学习仍可继续。</p><form id="game-grade-form" class="cloud-form" data-return="${returnToLearning?'learning':'lobby'}"><label class="cloud-label" for="game-grade">注册年级</label><select class="cloud-input" id="game-grade" required>${gradeOptions()}</select><p class="cloud-hint">你只能自行设置一次。保存后若填错或升年级，请由已绑定的家长或管理员修改。练习页面切换年级不会改变这里的记录。</p><button class="btn" type="submit">保存并锁定注册年级</button></form><div id="cloud-message" role="status" aria-live="polite" hidden></div><button class="cloud-text-button" type="button" data-cloud="student-home">稍后设置，先继续学习</button></section>`,true);
}
async function promptMissingGameGrade(ticket,accountId) {
  if(ticket!==viewToken||accountId!==user?.id||role!=='student'||recovering||sync?.dirty)return;
  try {
    const result=await rpc('get_student_game_grade',{p_student_id:accountId});
    if(ticket!==viewToken||accountId!==user?.id||role!=='student'||recovering||sync?.dirty)return;
    if(result&&typeof result==='object'&&!Array.isArray(result)&&result.registered_grade===null)await gameLobby(true);
  } catch {
    if(ticket===viewToken&&accountId===user?.id&&role==='student'&&!recovering)window.WQApp?.setNotice('暂时无法确认小游戏注册年级。学习可以继续；累计奖励前，请进入“小游戏”完成登记。');
  }
}
function gameExpired() {
  page('<section class="cloud-card"><span class="eyebrow">这一段小休息结束了</span><h1>游戏时间到了</h1><p>放松一下眼睛，离开屏幕走动走动。准备好后，再继续学习。</p><div class="btnrow"><button class="btn" data-cloud="student-home">回到学习</button><button class="btn light" data-cloud="game-lobby">查看游戏余额</button></div></section>',true);
}
async function gameLobby(enrollment = false) {
  if(role!=='student'||recovering||(booting&&!enrollment)||!sync)return;
  const ticket=++viewToken,accountId=user.id;
  passwordView=false;
  if(enrollment){gameGradeEnrollment(true);return;}
  page('<div class="cloud-loading"><p>正在同步学习记录，检查游戏时间…</p></div><div id="cloud-message" role="status" hidden></div>');
  try {
    const saved=await sync.flush();
    if(ticket!==viewToken||accountId!==user?.id)return;
    if(!saved)throw {code:'40001'};
    const result=await rpc('game_break_status');
    if(ticket!==viewToken||accountId!==user?.id)return;
    gameLobbyStatus=result;
    if(result.requires_grade||!GRADES[result.registered_grade]){gameGradeEnrollment();return;}
    const balance=Math.min(3600,gameCount(result.balance_seconds)),active=result.reason==='active',remaining=Math.min(3600,gameCount(result.remaining_seconds));
    const durations=GAME_DURATIONS.filter(seconds=>seconds<=balance),defaultDuration=durations.includes(900)?900:durations.at(-1);
    const bySubject=Array.isArray(result.by_subject)?result.by_subject.filter(item=>Object.hasOwn(SUBJECTS,item.subject)):[];
    const messages={learning_required:'先完成今天的学习计划，并标记完成，再开始游戏。已有余额会保留。',questions_required:'各科分别累计合资格的新题；同一题不会反复换取时间。',ready:'学习记录已经同步。选择一个余额足够的时长，再开始休息。',active:'你已经开始了一次游戏。继续游戏会沿用原来的结束时间。',time_used:'本次游戏时间已经用完；未使用的余额仍会保留。'};
    page(`<div class="cloud-heading"><div><span class="eyebrow">先学习，再休息</span><h1>课后小游戏</h1><p class="cloud-muted">记忆翻翻乐 · 数字小路 · 找找不一样</p></div><button class="btn light" data-cloud="student-home">回到学习</button></div><section class="panel game-break-lobby"><h2>认真完成练习，积存游戏时间</h2><p>注册年级：<strong>${GRADES[result.registered_grade]}</strong>。只计算这个年级或以上、已结束并同步、满分或订正后全对的练习新题。每一科单独累计，每满 20 题，马来文和英文各得 15 分钟，其他科目各得 5 分钟。</p><div class="reportgrid"><div class="metric"><strong>${gameMinutes(balance)}</strong><span>尚未使用的余额</span></div><div class="metric"><strong>${gameMinutes(remaining)}</strong><span>已开始这次的剩余时间</span></div><div class="metric"><strong>60 分钟</strong><span>总储存上限（包括正在玩的时间）</span></div></div><p class="${result.unlocked?'cloud-success':'cloud-hint'}">${messages[result.reason]||'完成学习并同步后，即可查看游戏时间。'}</p>${active?`<p>本次已分配 ${gameMinutes(result.duration_seconds)}，剩余 ${gameMinutes(remaining)}。</p>`:`<label class="cloud-label" for="game-duration">这次想玩多久？</label><select class="cloud-input" id="game-duration" ${durations.length?'':'disabled'}>${durations.length?durations.map(seconds=>`<option value="${seconds}" ${seconds===defaultDuration?'selected':''}>${seconds/60} 分钟</option>`).join(''):'<option value="">先积存至少 5 分钟</option>'}</select>`}<div class="btnrow" style="margin-top:16px"><button class="btn" data-cloud="game-start" ${result.unlocked&&(active||durations.length)?'':'disabled'}>${active?'继续本次游戏':'开始所选时长'}</button><button class="btn light" data-cloud="game-lobby">重新检查</button></div><div id="cloud-message" role="status" aria-live="polite" hidden></div><div class="tablewrap"><table><thead><tr><th>科目</th><th>本轮合资格新题</th><th>每 20 题可得</th></tr></thead><tbody>${Object.entries(SUBJECTS).map(([subject,name])=>{const progress=bySubject.find(item=>item.subject===subject);return `<tr><td>${name}</td><td>${Math.min(19,gameCount(progress?.progress_questions))} / 20</td><td>${subject==='bm'||subject==='english'?15:5} 分钟</td></tr>`;}).join('')}</tbody></table></div><p class="cloud-hint">游戏余额和各科题数跨日保留，上限 60 分钟；达到上限后不会继续囤积时间。旧练习不会追补奖励。点击开始后连续计时，关闭页面、换游戏或换设备都不会暂停或重置；到时自动结束，不会自动扣余额开启下一次。</p><p class="cloud-hint">注册年级需要已绑定家长或管理员修改；练习页面的浏览年级不会改变注册年级。学习计划的完成标记由学生填写，并非老师批改或家长确认。</p></section>`);
  }catch(error){
    if(ticket!==viewToken||accountId!==user?.id)return;
    page(`<section class="cloud-card"><h1>暂时无法打开小游戏</h1><p class="cloud-error">${esc(errorMessage(error))}</p><div class="btnrow"><button class="btn" data-cloud="game-lobby">重试</button><button class="btn light" data-cloud="student-home">回到学习</button></div></section>`,true);
  }
}
async function startGameBreak() {
  if(role!=='student'||recovering||booting||!sync||sync.conflict)return;
  if(!window.WQGameBreak){notice('小游戏未载入，请刷新页面后重试。');return;}
  const active=gameLobbyStatus?.reason==='active',secondsToPlay=Number($('game-duration')?.value);
  if(!active&&(!GAME_DURATIONS.includes(secondsToPlay)||secondsToPlay>gameCount(gameLobbyStatus?.balance_seconds))){notice('请选择余额足够支付的游戏时长。');return;}
  const ticket=++viewToken,accountId=user.id;
  const startedAt=Date.now(),mono=typeof performance==='undefined'?startedAt:performance.now();
  let result;
  try { result=await rpc('start_game_break',active?{}:{p_seconds:secondsToPlay}); }
  catch(error){
    if(ticket!==viewToken||accountId!==user?.id)return;
    throw error;
  }
  if(ticket!==viewToken||accountId!==user?.id)return;
  const elapsed=Math.max(0,Date.now()-startedAt,(typeof performance==='undefined'?Date.now():performance.now())-mono);
  const seconds=Number(result.remaining_seconds);
  const sessionLimitMs=Math.min(3600,gameCount(result.duration_seconds))*1000;
  const remainingMs=Number.isFinite(seconds)?Math.max(0,Math.min(3600,seconds)*1000-elapsed):0;
  if(!result.unlocked||remainingMs<=0){gameExpired();return;}
  page('<div class="cloud-heading"><div><span class="eyebrow">学习后的轻松时刻</span><h1>课后小游戏</h1></div><button class="btn light" data-cloud="student-home">结束游戏，回到学习</button></div><div id="game-break-root"></div>');
  window.WQGameBreak.mount($('game-break-root'),{remainingMs,sessionLimitMs,onExpire:()=>{
    if(ticket===viewToken&&accountId===user?.id&&role==='student')gameExpired();
  }});
}
async function studentBoot() {
  const ticket=viewToken,accountId=user?.id;
  const {data:row,error}=await db.from('family_states').select('state,revision,updated_at').eq('user_id',accountId).maybeSingle();
  if(ticket!==viewToken||accountId!==user?.id)return;
  if(error) throw error;
  const state=row?E.validate(row.state):blankState();
  lastSaved=row?.updated_at||'';
  sync=new CloudSync({revision:row?.revision||0,save:async(state,revision)=>rpc('save_family_state',{p_state:state,p_expected_revision:revision}),onStatus:status,onDraft:writeDraft});
  window.WQApp.mount(state);shell.hidden=false;root.hidden=true;shell.inert=false;
  status(row?'saved':'pending',row?.updated_at);
  const draft=readDraft();
  if(draft?.state){
    recovering=true;
    shell.hidden=true;
    page(`<section class="cloud-card"><h1>发现尚未同步的练习</h1><p>上次关闭页面前，有一些进度没有传到云端。</p><div class="btnrow">${draft.revision===sync.revision?'<button class="btn" data-cloud="restore-draft">继续这份练习</button>':'<p>云端已有其他设备保存的新版本，请先下载备份。</p>'}<button class="btn secondary" data-cloud="draft-download">下载未同步备份</button><button class="btn light" data-cloud="use-cloud">使用云端记录</button></div></section>`,true);
  }else {
    recovering=false;
    if(!row){sync.queue(state);if(!await sync.flush())return;}
    await promptMissingGameGrade(ticket,accountId);
  }
}
async function loadLinks() {links=await rpc('list_family_links');if(!Array.isArray(links))links=[];return links;}
async function studentLinks(message = '') {
  const ticket=++viewToken;
  page('<div class="cloud-loading">读取绑定关系…</div>');
  await loadLinks();if(ticket!==viewToken)return;
  page(`<div class="cloud-heading"><h1>让家长看见你的进步</h1><button class="btn light" data-cloud="student-home">返回练习</button></div><div class="cloud-grid"><section class="panel"><h2>邀请家长</h2><p>填入家长登录时使用的邮箱，再把邀请码交给家长。只有这个邮箱能接受邀请。</p><form id="invite-form"><label class="cloud-label" for="parent-email">家长邮箱</label><input id="parent-email" class="cloud-input" type="email" required maxlength="254" autocomplete="off"><button class="btn" style="margin-top:16px">生成邀请码</button></form><div id="invite-result" aria-live="polite"></div><div id="cloud-message" hidden></div></section><section class="panel"><h2>已绑定的家长</h2>${links.length?`<ul class="cloud-link-list">${links.map((link,i)=>`<li><span>家长 ${i+1}<br><small class="muted">绑定于 ${stamp(link.linked_at)}</small></span><button class="btn small danger" data-cloud="revoke-parent" data-parent="${esc(link.parent_id)}">解除绑定</button></li>`).join('')}</ul>`:'<p class="cloud-empty">还没有家长接受邀请。</p>'}<p class="cloud-hint">家长只能看成绩，不能修改你的练习。解除绑定后，家长将无法继续读取记录。</p>${message?`<p class="cloud-success">${esc(message)}</p>`:''}</section></div>`);
}
function courseName(key) {const course=window.WQManifest?.courses?.find(c=>c.key===key);return course?`${GRADES[course.level]||course.level} · ${SUBJECTS[course.subject]||course.subject}`:key;}
function parentLearning(p) {
  const L=window.WQLearning;if(!L)return '';
  const counts=L.counts(p),day=L.day(p),names={recall:'回忆旧知识',discover:'发现新知识',connect:'换个角度',apply:'离屏应用'};
  return `<section class="panel learning-quality"><h2>学习过程与跨日巩固</h2><p>到期复习：<strong>${counts.due}</strong> 题 · 跨日巩固：<strong>${counts.spaced}</strong> 题</p><p class="small muted">跨日巩固表示到期后、至少隔24小时再答对，不等于长期掌握。旧成绩不会自动认定为已经巩固。</p><p>孩子今天选择约 ${p.learning.goal} 分钟的计划；自报完成：${day.missions.length?day.missions.map(id=>names[id]).join('、'):'还未标记'}。</p>${day.reflection?`<p>今天的发现：${esc(day.reflection)}</p>`:''}<p class="small muted">计划标记不是实际计时成绩。可以问孩子：“今天哪一点最有趣？能举一个自己的例子吗？” 需要时先休息。</p><p class="small muted">自2026-09-19起，提示过于明显的基础讨论题不进入独立小测；此前成绩保留，不重新评分。</p></section>`;
}
function reportHTML(state, updated) {
  const p=E.validate(state).profiles[0],s=E.summary(p),courses=[...new Set(Object.values(p.records).map(r=>r.course))];
  // Extra learning evidence is rendered below by the shared, read-only report helper.
  return `${parentLearning(p)}<section class="cloud-parent-report"><div class="cloud-heading"><div><h2>${esc(p.name)}的学习记录</h2><span class="cloud-status">最近同步：${stamp(updated)}</span></div></div><div class="reportgrid">${[[s.unique,'练过的题目'],[s.attempts?Math.round(s.correct*100/s.attempts)+'%':'—','累计作答正确率'],[s.wrong,'待复习错题'],[p.runs.length,'已保存的挑战']].map(([v,l])=>`<div class="metric"><strong>${v}</strong><span>${l}</span></div>`).join('')}</div><section class="panel"><h2>各科表现</h2>${courses.length?`<div class="tablewrap"><table><thead><tr><th>课程</th><th>练过</th><th>曾答对</th><th>待复习</th></tr></thead><tbody>${courses.map(c=>{const summary=E.summary(p,Object.keys(p.records).filter(id=>p.records[id].course===c));return `<tr><td>${esc(courseName(c))}</td><td>${summary.unique}</td><td>${summary.earned}</td><td>${summary.wrong}</td></tr>`;}).join('')}</tbody></table></div>`:'<p class="cloud-empty">孩子还没有开始答题。完成练习后，记录会显示在这里。</p>'}</section><section class="panel"><h2>最近完成的挑战</h2>${p.runs.length?`<div class="tablewrap"><table><thead><tr><th>完成时间</th><th>课程</th><th>模式</th><th>答对 / 题数</th><th>正确率</th></tr></thead><tbody>${p.runs.slice(-30).reverse().map(r=>`<tr><td>${stamp(r.at)}</td><td>${esc(courseName(r.course))}</td><td>${{test:'独立小测',practice:'探索挑战',review:'巩固复习'}[r.mode]}</td><td>${r.correct} / ${r.total}</td><td>${Math.round(r.correct*100/r.total)}%</td></tr>`).join('')}</tbody></table></div>`:'<p class="muted">孩子完成一轮挑战后，就会出现成绩。</p>'}</section><p class="cloud-report-note">这是自主练习记录，不是官方考试成绩。累计正确率包含重复作答；“曾答对”不代表长期掌握。显示最近 30 轮挑战，最多保留 150 轮。</p></section>`;
}
async function parentDashboard() {
  const ticket=++viewToken;
  page('<div class="cloud-loading">读取孩子的学习记录…</div>');
  await loadLinks();if(ticket!==viewToken)return;
  if(!links.some(l=>l.student_id===selectedChild))selectedChild=links[0]?.student_id||'';
  page(`<div class="cloud-heading"><div><h1>孩子的学习记录</h1><p class="cloud-muted">仅显示已接受邀请的孩子。</p></div><button class="btn secondary" data-cloud="refresh-parent">刷新成绩</button></div><section class="panel"><details ${links.length?'':'open'}><summary>绑定孩子</summary><p>让孩子登录自己的学生账号，在“家长绑定”中填写你的邮箱，并把生成的邀请码交给你。</p><form id="accept-form"><label class="cloud-label" for="invite-code">孩子给你的邀请码</label><input class="cloud-input" id="invite-code" required autocomplete="off" maxlength="128" spellcheck="false"><button class="btn" style="margin-top:14px">接受邀请</button></form><div id="cloud-message" hidden></div></details></section>${links.length?`<div class="cloud-child-tabs">${links.map(l=>`<button class="btn light ${l.student_id===selectedChild?'selected':''}" data-cloud="select-child" data-student="${esc(l.student_id)}">${esc(l.nickname||'孩子')}</button>`).join('')}</div><div id="parent-game-grade">读取注册年级…</div><div id="parent-report" aria-live="polite">读取成绩…</div>`:'<div class="cloud-empty"><h2>先绑定孩子，再查看成绩</h2><p>绑定只需一次。孩子在其他设备做完练习并同步后，你也能在这里看到。</p></div>'}`);
  if(selectedChild)await Promise.all([refreshReport(),refreshParentGameGrade()]);
}
async function refreshParentGameGrade(message = '') {
  if(role!=='parent'||!selectedChild||!$('parent-game-grade'))return;
  const ticket=viewToken,id=selectedChild,container=$('parent-game-grade'),accountId=user?.id;
  try {
    const result=await rpc('get_student_game_grade',{p_student_id:id});
    if(ticket!==viewToken||selectedChild!==id||accountId!==user?.id||!container.isConnected)return;
    const grade=GRADES[result.registered_grade]?result.registered_grade:'';
    container.innerHTML=`<section class="panel"><h2>小游戏注册年级</h2><p>目前记录：<strong>${grade?GRADES[grade]:'尚未设置'}</strong>。只有注册年级或以上的合资格练习，才会累计游戏时间。</p><form id="parent-grade-form" data-student="${esc(id)}"><label class="cloud-label" for="parent-game-grade-select">孩子的真实年级</label><select class="cloud-input" id="parent-game-grade-select" required>${gradeOptions(grade)}</select><button class="btn small secondary" type="submit" style="margin-top:14px">保存注册年级</button></form><p class="cloud-hint">学生只能自行设置一次。年级填错或升年级时，可由已绑定家长或管理员修改；这里不会修改孩子的练习记录。</p><div id="parent-grade-message" role="status" aria-live="polite" ${message?'':'hidden'} class="cloud-success">${esc(message)}</div></section>`;
  } catch(error) {
    if(ticket!==viewToken||selectedChild!==id||accountId!==user?.id||!container.isConnected)return;
    container.innerHTML=`<section class="panel"><h2>小游戏注册年级</h2><p class="cloud-error">${esc(errorMessage(error))}</p><button class="btn small light" data-cloud="refresh-game-grade">重新读取年级</button></section>`;
  }
}
async function refreshReport() {
  if(!selectedChild||!$('parent-report'))return;
  const ticket=viewToken,id=selectedChild,container=$('parent-report');
  const {data,error}=await db.from('family_states').select('state,updated_at').eq('user_id',id).maybeSingle();
  if(ticket!==viewToken||selectedChild!==id||!container.isConnected)return;
  if(error){container.innerHTML='<p class="cloud-error">这次读取失败，当前成绩可能已更新。请点击“刷新成绩”重试。</p>';return;}
  container.innerHTML=data?reportHTML(data.state,data.updated_at):'<p class="cloud-empty">暂时没有可读取的成绩。孩子可能尚未开始，或已解除绑定。</p>';
}
function chooseRole() {
  page(`<section class="cloud-card"><h1>你想怎样使用学科冒险？</h1><p>邮箱已经验证。请选择这个账号的用途。</p><div class="cloud-roles"><button class="cloud-role" data-cloud="register" data-role="student">我是学生<span>做练习、查看自己的进步、邀请家长。</span></button><button class="cloud-role" data-cloud="register" data-role="parent">我是家长<span>接受孩子的邀请，只读查看学习记录。</span></button></div><div id="cloud-message" hidden></div><p class="cloud-hint">学生与家长使用不同的邮箱。用途确定后不能自行切换。</p><button class="btn light" style="margin-top:12px" data-cloud="password-settings">设置密码，方便下次登录</button><button class="btn light" style="margin-top:12px" data-cloud="logout">换一个邮箱</button></section>`,true);
}
async function boot() {
  if(booting){bootRequested=true;return;}booting=true;
  const ticket=++viewToken,generation=authGeneration;
  try{
    clearInterval(parentTimer);sync?.stop();sync=null;role=null;recovering=false;
    window.WQApp?.unmount();bar.hidden=true;
    page('<div class="cloud-loading"><div class="spinner"></div><p>正在验证账号…</p></div>');
    const {data,error}=await db.auth.getUser();
    if(ticket!==viewToken)return;
    if(error||!data.user){reset();login();return;}
    user=data.user;
    if(!user.email_confirmed_at){reset();login('请先通过邮箱里的登录链接验证邮箱。');return;}
    if(passwordRecovery || recoveryAccount() === user.id){passwordRecovery=true;passwordSettings();return;}
    const result=await db.from('accounts').select('role').eq('user_id',user.id).maybeSingle();
    if(ticket!==viewToken)return;
    if(result.error)throw result.error;
    if(!result.data){chooseRole();return;}
    role=result.data.role;accountBar();
    if(role==='student')await studentBoot();else{
      await parentDashboard();if(generation!==authGeneration)return;clearInterval(parentTimer);
      parentTimer=setInterval(()=>{if(!document.hidden&&role==='parent')refreshReport().catch(()=>{});},30000);
    }
  }catch(error){
    if(generation!==authGeneration)return;
    page(`<section class="cloud-card"><h1>暂时无法读取账号</h1><p class="cloud-error">${esc(errorMessage(error))}</p><div class="btnrow"><button class="btn" data-cloud="retry-boot">重试</button><button class="btn light" data-cloud="logout">退出登录</button></div></section>`,true);
  }finally{booting=false;if(bootRequested){bootRequested=false;setTimeout(()=>boot(),0);}}
}
document.addEventListener('submit',async event=>{
  if(!['login-form','reset-request-form','password-form','invite-form','accept-form','game-grade-form','parent-grade-form'].includes(event.target.id))return;
  event.preventDefault();const form=event.target,button=form.querySelector('button');button.disabled=true;
  const generation=authGeneration;
  try{
    if(form.id==='login-form'){
      loginEmail=$('login-email').value.trim();
      if(loginMethod==='password'){
        const {error}=await db.auth.signInWithPassword({email:loginEmail,password:$('login-password').value});
        if(generation!==authGeneration||!form.isConnected)return;
        if(error)throw error;
        await boot();return;
      }
      if(Date.now()-lastSend<60000){notice('请等一分钟后再申请新的登录链接。');return;}
      const {error}=await db.auth.signInWithOtp({email:loginEmail,options:{emailRedirectTo:redirectURL(),shouldCreateUser:true}});
      if(generation!==authGeneration||!form.isConnected)return;
      if(error)throw error;lastSend=Date.now();notice('登录链接已发送。请查看邮箱（也检查垃圾邮件），点击链接即可继续。',true);
    }else if(form.id==='reset-request-form'){
      loginEmail=$('login-email').value.trim();
      if(Date.now()-lastSend<60000){notice('请等一分钟后再申请新的邮件。');return;}
      const {error}=await db.auth.resetPasswordForEmail(loginEmail,{redirectTo:redirectURL()});
      if(generation!==authGeneration||!form.isConnected)return;
      if(error)throw error;lastSend=Date.now();notice('若此邮箱已有账号，你会收到重设密码邮件。请检查收件箱及垃圾邮件；打开链接后设置新密码。',true);
    }else if(form.id==='password-form'){
      if(!user||!passwordView)return;
      const password=$('new-password').value;
      if(password.length<10||password.length>256){notice('密码需要 10 至 256 个字符。');return;}
      if(password!==$('confirm-password').value){notice('两次输入的密码不一致，请重新输入。');return;}
      const {error}=await db.auth.updateUser({password});
      if(generation!==authGeneration||!form.isConnected)return;
      if(error)throw error;
      recoveryAccount(null);
      page('<section class="cloud-card"><h1>密码已设置</h1><p>下次可以直接用邮箱和密码登录，也可以继续使用邮箱链接。</p><button class="btn" data-cloud="password-done">继续使用学科冒险</button></section>',true);
    }else if(form.id==='game-grade-form'){
      if(role!=='student'||recovering||booting)return;
      const grade=$('game-grade').value;
      if(!Object.hasOwn(GRADES,grade)){notice('请选择你的真实年级。');return;}
      await rpc('register_game_grade',{p_grade:grade});
      if(generation!==authGeneration||!form.isConnected)return;
      if(form.dataset.return==='learning'){
        ++viewToken;root.hidden=true;shell.hidden=false;
        window.WQApp?.setNotice(`注册年级已保存为${GRADES[grade]}。从现在开始，合资格练习可以累计游戏时间。`);
      }else await gameLobby();
    }else if(form.id==='parent-grade-form'){
      const childId=form.dataset.student,grade=$('parent-game-grade-select').value;
      if(role!=='parent'||childId!==selectedChild||!Object.hasOwn(GRADES,grade))return;
      await rpc('set_student_game_grade',{p_student_id:childId,p_grade:grade});
      if(generation!==authGeneration||!form.isConnected||selectedChild!==childId)return;
      await refreshParentGameGrade('注册年级已保存。之后的合资格练习按新年级计算。');
    }else if(form.id==='invite-form'){
      if(role!=='student')return;
      const result=await rpc('create_parent_invite',{p_email:$('parent-email').value.trim().toLowerCase()});
      if(generation!==authGeneration||!form.isConnected)return;
      $('invite-result').innerHTML=`<p class="cloud-success">邀请码已生成，请亲自交给家长。</p><code class="cloud-code">${esc(result.token)}</code><p class="cloud-hint">有效期至 ${stamp(result.expires_at)}，只能使用一次。网站不会自动发送这份邀请。</p>`;
    }else{
      if(role!=='parent')return;
      await rpc('accept_parent_invite',{p_token:$('invite-code').value.trim()});
      if(generation!==authGeneration||!form.isConnected)return;
      await parentDashboard();
    }
  }catch(error){if(generation===authGeneration&&form.isConnected){if(form.id==='parent-grade-form'){const box=$('parent-grade-message');if(box){box.className='cloud-error';box.textContent=errorMessage(error);box.hidden=false;}}else notice(errorMessage(error));}}finally{if(button.isConnected)button.disabled=false;}
});
document.addEventListener('click',async event=>{
  const button=event.target.closest('[data-cloud]');if(!button||button.disabled)return;
  const action=button.dataset.cloud;button.disabled=true;
  const generation=authGeneration;
  try{
    if(action==='login-method'||action==='back-login'||action==='forgot-password'){
      if(user)return;
      loginEmail=$('login-email')?.value.trim()||loginEmail;
      if(action==='forgot-password')resetPasswordRequest();
      else {if(action==='login-method')loginMethod=button.dataset.method==='link'?'link':'password';login();}
      return;
    }
    if(action==='password-settings'){passwordSettings();return;}
    if(action==='password-cancel'||action==='password-done'){if(user)await leavePasswordSettings();return;}
    if(['student-home','manage-links','game-lobby','game-start','revoke-parent','retry-save','draft-download','restore-draft','use-cloud','reload-cloud'].includes(action)&&role!=='student')return;
    if(['refresh-parent','select-child','refresh-game-grade'].includes(action)&&role!=='parent')return;
    if(action==='register'){if(!user||role)return;await rpc('register_account',{p_role:button.dataset.role});if(generation!==authGeneration)return;await boot();}
    else if(action==='logout'){
      if(sync?.dirty){try{if(!await sync.flush())return;}catch{if(generation===authGeneration)status(sync?.conflict?'conflict':'error');return;}}
      if(generation!==authGeneration)return;
      const {error}=await db.auth.signOut({scope:'local'});if(generation!==authGeneration)return;if(error)throw error;recoveryAccount(null);reset();login();
    }else if(action==='student-home'){if(recovering)return;window.WQGameBreak?.stop();passwordView=false;++viewToken;root.hidden=true;shell.hidden=false;}
    else if(action==='manage-links'){if(recovering)return;passwordView=false;await studentLinks();}
    else if(action==='game-lobby')await gameLobby();
    else if(action==='game-start')await startGameBreak();
    else if(action==='revoke-parent'){
      if(!confirm('解除这位家长的绑定？解除后，对方不能继续读取你的成绩。'))return;
      await rpc('revoke_parent_access',{p_parent_id:button.dataset.parent});if(generation!==authGeneration)return;await studentLinks('已解除绑定。');
    }else if(action==='refresh-parent')await parentDashboard();
    else if(action==='refresh-game-grade')await refreshParentGameGrade();
    else if(action==='select-child'){selectedChild=button.dataset.student;await parentDashboard();}
    else if(action==='retry-save')await sync?.flush();
    else if(action==='draft-download'){const state=sync?.pending||readDraft()?.state||window.WQApp?.snapshot();if(state)download(state);}
    else if(action==='restore-draft'){
      const draft=readDraft();if(!draft||draft.revision!==sync.revision)throw Error('Draft conflict');
      const ticket=viewToken,accountId=user.id,state=E.validate(draft.state);recovering=false;window.WQApp.mount(state);sync.queue(state);root.hidden=true;shell.hidden=false;
      if(await sync.flush())await promptMissingGameGrade(ticket,accountId);
    }else if(action==='use-cloud'||action==='reload-cloud'){
      if((readDraft()||sync?.dirty)&&!confirm('使用云端版本会放弃本页未同步的改动。请先下载备份。继续？'))return;
      sync?.stop();writeDraft(null);recovering=false;$('sync-warning')?.remove();await boot();
    }else if(action==='retry-boot'){sync?.stop();await boot();}
  }catch(error){if(generation!==authGeneration)return;if($('cloud-message'))notice(errorMessage(error));else window.alert(errorMessage(error));}
  finally{if(button.isConnected)button.disabled=false;}
});
window.addEventListener('wq:save',event=>{if(!recovering&&role==='student'&&user&&sync&&!sync.conflict)sync.queue(event.detail);});
window.addEventListener('online',()=>sync?.flush().catch(()=>{}));
window.addEventListener('beforeunload',event=>{if(sync?.dirty){event.preventDefault();event.returnValue='';}});
document.addEventListener('visibilitychange',()=>{if(document.hidden)sync?.flush().catch(()=>{});else if(role==='parent')refreshReport().catch(()=>{});});

async function initialize(){
  if(!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(config.supabaseUrl||'')||!config.supabasePublishableKey){
    page('<section class="cloud-card"><h1>学科冒险即将开放</h1><p>邮箱登录与成绩服务正在连接。设置完成后，学生和家长就能用各自邮箱注册。</p><p class="cloud-hint">目前还不能注册或开始练习，请等候老师提供正式网址。</p></section>',true);return;
  }
  try{
    const {createClient}=window.supabase;
    db=createClient(config.supabaseUrl,config.supabasePublishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,flowType:'implicit'}});
    db.auth.onAuthStateChange((event,session)=>{
      if(event==='SIGNED_OUT'){recoveryAccount(null);reset();login('已退出登录。',true);}
      else if(event==='PASSWORD_RECOVERY'&&session?.user){reset();passwordRecovery=true;recoveryAccount(session.user.id);setTimeout(()=>boot(),0);}
      else if(event==='SIGNED_IN'&&session?.user?.id!==user?.id){reset();setTimeout(()=>boot(),0);}
    });
    await boot();
  }catch{page('<section class="cloud-card"><h1>暂时无法连接</h1><p>请检查网络，然后刷新页面重试。</p></section>',true);}
}
initialize();
