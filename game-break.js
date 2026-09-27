(function (root) {
  'use strict';

  const DURATION = 45000;
  const MIN_ROUND = 1000;
  const GAMES = [
    { id: 'dodge', name: '星际穿梭', tag: '反应 · 闪避', icon: '✦', description: '驾驶星舰穿过陨石雨，抢下星星，冲出你的最高分。', controls: '← → 方向键、左右按钮，或在赛道上左右滑动', rules: ['三条航道，避开红色陨石，收集金色星星。', '安全穿过一波得 10 分，吃到星星额外得 20 分。', '有 3 格护盾；最多 60 波，越稳分越高。'] },
    { id: 'merge', name: '合成风暴', tag: '策略 · 合成', icon: '⚡', description: '让相同数字相撞，连锁合成更大方块。最多 45 秒，脑力全开。', controls: '方向键、方向按钮，或在棋盘上滑动', rules: ['滑动棋盘，相同数字会合成一个更大的数字。', '每次合成获得新方块的分值；一次移动可连出多组。', '本局时间内尽量冲高分，棋盘堵满就会结束。'] },
    { id: 'pulse', name: '光速连击', tag: '手速 · 连击', icon: '◎', description: '追踪跳动的光点，打出十连击，让每一下都更值分。', controls: '点击发光方格；键盘可用 1234 / QWER / ASDF / ZXCV', rules: ['光点每 0.75 秒换一个位置，每拍只能点击一次。', '点对得 100 分，再加连击奖励，最高每次 200 分。', '点错扣 10 分；漏拍或点错都会中断连击。'] }
  ];
  let active = null;

  function createRandom(seed) {
    let value = Number(seed);
    if (!Number.isInteger(value) || value < 1 || value >= 2147483647) throw new TypeError('无效的挑战种子。');
    return () => { value = value * 48271 % 2147483647; return value; };
  }
  function dodgeCourse(seed) {
    const next = createRandom(seed);
    return Array.from({ length: 60 }, () => {
      const hazard = next() % 3;
      return { hazard, star: (hazard + 1 + next() % 2) % 3 };
    });
  }
  function pulseTargets(seed) {
    const next = createRandom(seed);
    const targets = [next() % 16];
    while (targets.length < 60) targets.push((targets[targets.length - 1] + 1 + next() % 15) % 16);
    return targets;
  }
  function spawnTile(board, next) {
    const empty = board.map((value, index) => value ? -1 : index).filter(index => index >= 0);
    if (!empty.length) return;
    board[empty[next() % empty.length]] = next() % 10 === 0 ? 4 : 2;
  }
  function mergeMove(board, direction) {
    const result = board.slice();
    let score = 0;
    for (let line = 0; line < 4; line++) {
      const indices = Array.from({ length: 4 }, (_, step) => direction === 0 ? line * 4 + step : direction === 1 ? step * 4 + line : direction === 2 ? line * 4 + 3 - step : (3 - step) * 4 + line);
      const values = indices.map(index => board[index]).filter(Boolean);
      const merged = [];
      for (let i = 0; i < values.length; i++) {
        if (values[i] === values[i + 1]) { const value = values[i++] * 2; merged.push(value); score += value; }
        else merged.push(values[i]);
      }
      indices.forEach((index, i) => { result[index] = merged[i] || 0; });
    }
    return { board: result, score, changed: result.some((value, i) => value !== board[i]) };
  }
  function hasMoves(board) { return [0, 1, 2, 3].some(direction => mergeMove(board, direction).changed); }

  // The backend replays this same deterministic input protocol. Only input
  // events are uploaded; the browser's provisional score is never authoritative.
  function replay(game, seed, trace) {
    const events = Array.isArray(trace) ? trace : [];
    if (game === 'dodge') {
      const course = dodgeCourse(seed);
      let score = 0, lives = 3, stars = 0, completed = 0;
      for (const event of events) {
        if (lives <= 0 || completed >= 60) break;
        const wave = course[completed];
        if (event.t !== (completed + 1) * 700 || !Number.isInteger(event.v) || event.v < 0 || event.v > 2) throw new TypeError('无效的飞行记录。');
        if (event.v === wave.hazard) lives--;
        else { score += 10; if (event.v === wave.star) { score += 20; stars++; } }
        completed++;
      }
      return { score, lives, stars, completed, course, done: lives <= 0 || completed === 60 };
    }
    if (game === 'merge') {
      const next = createRandom(seed);
      let board = Array(16).fill(0), score = 0, moves = 0, previous = -80;
      spawnTile(board, next); spawnTile(board, next);
      for (const event of events) {
        if (!Number.isInteger(event.t) || event.t < 0 || event.t >= DURATION || event.t - previous < 80 || !Number.isInteger(event.v) || event.v < 0 || event.v > 3) throw new TypeError('无效的合成记录。');
        const moved = mergeMove(board, event.v);
        previous = event.t;
        if (moved.changed) { board = moved.board; score += moved.score; moves++; spawnTile(board, next); }
      }
      return { board, score, moves, highest: Math.max(...board), done: !hasMoves(board) };
    }
    if (game === 'pulse') {
      const targets = pulseTargets(seed);
      let score = 0, combo = 0, bestCombo = 0, hits = 0, lastSlot = -1;
      for (const event of events) {
        const slot = Math.floor(event.t / 750);
        if (!Number.isInteger(event.t) || event.t < 0 || event.t >= DURATION || slot <= lastSlot || !Number.isInteger(event.v) || event.v < 0 || event.v > 15) throw new TypeError('无效的连击记录。');
        if (slot !== lastSlot + 1) combo = 0;
        if (event.v === targets[slot]) { combo++; hits++; score += 100 + Math.min(combo, 10) * 10; bestCombo = Math.max(bestCombo, combo); }
        else { combo = 0; score = Math.max(0, score - 10); }
        lastSlot = slot;
      }
      return { score, combo, bestCombo, hits, lastSlot, targets };
    }
    throw new TypeError('未知的挑战。');
  }

  // Count both clocks and retain the largest elapsed observation. Going back
  // in wall time or suspending the device cannot restore earned game time.
  function allowance(remainingMs, monotonicNow, wallNow) {
    const budget = Number.isFinite(remainingMs) ? Math.max(0, remainingMs) : 0;
    const monotonicStart = monotonicNow(), wallStart = wallNow();
    let elapsed = 0;
    return () => { elapsed = Math.max(elapsed, monotonicNow() - monotonicStart, wallNow() - wallStart, 0); return Math.max(0, budget - elapsed); };
  }
  function formatTime(ms) {
    const seconds = Math.max(0, Math.ceil(ms / 1000));
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  }
  function escapeHtml(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char])); }
  function stop() {
    if (!active) return;
    const session = active;
    active = null;
    session.stopped = true;
    session.cancelReturnRequest?.();
    session.roundVersion++;
    clearTimeout(session.tick);
    session.detach();
    session.round = null;
    session.bests = {};
    session.container.querySelectorAll('button').forEach(button => { button.disabled = true; });
  }

  function mount(container, options = {}) {
    stop();
    if (!container || typeof container.querySelector !== 'function') throw new TypeError('小游戏需要一个页面容器。');
    const document = container.ownerDocument;
    const hosted = typeof options.onReturn === 'function';
    let initialMs = Number(options.remainingMs);
    if (!Number.isFinite(initialMs)) initialMs = 0;
    if (Number.isFinite(options.endsAt)) initialMs = Math.min(initialMs, options.endsAt - Date.now());
    const sessionLimitMs = Number.isFinite(options.sessionLimitMs) ? Math.max(0, Math.min(3600000, options.sessionLimitMs)) : Math.max(0, Math.min(3600000, initialMs));
    initialMs = Math.max(0, Math.min(3600000, initialMs, sessionLimitMs));
    const session = { container, document, stopped: false, expired: false, tick: null, roundVersion: 0, round: null, currentGame: null, pending: false, bests: {}, pointer: null, remaining: allowance(initialMs, () => performance.now(), () => Date.now()) };
    active = session;
    container.classList.add('wq-game-break');
    container.innerHTML = `<header class="wq-break-header"><div><span class="wq-break-eyebrow">AFTER STUDY / 挑战时刻</span><h2>今天，刷新自己的纪录。</h2></div><div class="wq-break-clock"><span>本次休息剩余</span><strong class="wq-break-time" role="timer" aria-live="off">${formatTime(initialMs)}</strong></div><p class="wq-break-rule">本次 ${formatTime(sessionLimitMs)} · 换游戏、看说明也会继续计时 · 到时自动结束</p><div class="wq-break-meter" aria-hidden="true"><span></span></div></header><p class="wq-break-timer-announcement wq-break-sr" role="status" aria-live="polite"></p><div class="wq-break-body"></div>`;
    if (hosted) container.querySelector('.wq-break-body').insertAdjacentHTML('beforebegin', '<section class="wq-break-return-confirm" role="alert" hidden></section>');
    const body = container.querySelector('.wq-break-body'), clock = container.querySelector('.wq-break-time'), meter = container.querySelector('.wq-break-meter span'), announcement = container.querySelector('.wq-break-timer-announcement'), returnConfirm = hosted ? container.querySelector('.wq-break-return-confirm') : null;

    function live() { return active === session && !session.stopped && !session.expired; }
    function focus(selector) { const target = body.querySelector(selector); if (target) target.focus({ preventScroll: true }); }
    function clearRound() { session.roundVersion++; session.round = null; session.pending = false; session.pointer = null; }
    function returnButton(label = '返回棋盘', disabled = false) { return `<button type="button" class="wq-break-back" data-action="return" ${disabled ? 'disabled' : ''}>${label}</button>`; }
    function hideReturnConfirm() { if (returnConfirm) { returnConfirm.hidden = true; returnConfirm.innerHTML = ''; } }
    function settleReturnRequest(value, error) {
      const request = session.returnRequest; session.returnRequest = null; session.returnAfterFinish = false;
      if (request) { if (error) request.reject(error); else request.resolve(value); }
    }
    session.cancelReturnRequest = () => settleReturnRequest(false);
    function requestReturn() {
      if (!hosted || active !== session || session.stopped || session.returned) return Promise.resolve(false);
      if (session.returnRequest) return session.returnRequest.promise;
      const request = {};
      request.promise = new Promise((resolve, reject) => { request.resolve = resolve; request.reject = reject; });
      session.returnRequest = request; returnToHost(); return request.promise;
    }
    function returnToHost(abandon = false) {
      if (!hosted || active !== session || session.stopped || session.returned) return;
      if (live()) check();
      const round = session.round;
      if (round?.finishing) { if (session.returnRequest) session.returnAfterFinish = true; hideReturnConfirm(); status('正在核验本局成绩，请等待结果后返回棋盘。'); return; }
      if (round?.serverResult && !round.settled) { round.finished = false; finishRound(); return; }
      if (round && !round.settled && !abandon) {
        returnConfirm.innerHTML = '<h3>放弃本局并返回棋盘？</h3><p>本局没有已核验的成绩，放弃后不会提交游戏结果。游戏计时仍会继续。</p><div class="wq-break-result-actions"><button type="button" class="wq-break-back" data-action="cancel-return">继续本局</button><button type="button" class="wq-break-primary" data-action="confirm-return">放弃本局并返回棋盘</button></div>';
        returnConfirm.hidden = false; returnConfirm.querySelector('[data-action="cancel-return"]').focus({ preventScroll: true }); return;
      }
      const receipt = session.settledReceipt || null;
      const payload = { reason: receipt ? 'settled' : round ? 'abandoned' : session.expired ? 'expired' : 'cancelled', result: receipt };
      const request = session.returnRequest; session.returnRequest = null;
      session.returned = true; hideReturnConfirm(); stop();
      try { Promise.resolve(options.onReturn(payload)).then(() => request?.resolve(true), error => request?.reject(error)); } catch (error) { request?.reject(error); }
    }
    function expire() {
      if (!live()) return false;
      session.expired = true; clearTimeout(session.tick);
      clock.textContent = '0:00'; meter.style.width = '0%'; announcement.textContent = '本次游戏时间已到。';
      if (session.round) {
        // Stop all play, but let the last real round settle and its receipt remain visible.
        body.querySelectorAll('button').forEach(button => { if (!['retry', 'return'].includes(button.dataset.action)) button.disabled = true; });
        if (!session.round.finished && !session.round.finishing) advanceRound();
        if (!session.round.finished && !session.round.finishing) finishRound();
        return false;
      }
      clearRound(); if (!hosted) session.detach();
      clock.textContent = '0:00'; meter.style.width = '0%'; announcement.textContent = '本次游戏时间已到。';
      body.innerHTML = '<section class="wq-break-finished"><span class="wq-break-rest-icon" aria-hidden="true">✦</span><span class="wq-break-eyebrow">CHALLENGE COMPLETE</span><h3 tabindex="-1">休息时间到，给眼睛放个假。</h3><p>看看远处，伸伸懒腰。下次带着新的学习成果，再来挑战纪录。</p>' + (hosted ? returnButton() : '') + '</section>';
      focus('h3');
      if (typeof options.onExpire === 'function') {
        // Host callbacks must never undo local expiry or leave live controls.
        try { Promise.resolve(options.onExpire()).catch(() => {}); } catch (_) { /* The session is already safely expired. */ }
      }
      return false;
    }
    function check() {
      if (!live()) return false;
      const left = session.remaining(); if (left <= 0) return expire();
      clock.textContent = formatTime(left); meter.style.width = `${sessionLimitMs ? left / sessionLimitMs * 100 : 0}%`;
      container.classList.toggle('wq-break-last-minute', left <= 60000);
      if (left <= 60000 && !session.announcedMinute) { session.announcedMinute = true; announcement.textContent = '本次休息剩余不到一分钟。'; }
      return true;
    }
    function scores(id) {
      const result = session.bests[id];
      return result ? `<span>个人最佳 <b>${Number(result.personal_best) || 0}</b></span><span>本周最佳 <b>${Number(result.week_best) || 0}</b></span>` : '<span>完成挑战，解锁你的个人纪录</span>';
    }
    function menu(shouldFocus) {
      clearRound(); session.currentGame = null;
      body.innerHTML = `<div class="wq-break-menu-intro"><div><span class="wq-break-eyebrow">PICK YOUR CHALLENGE</span><h3 tabindex="-1">选一场，亮出你的实力</h3></div><span class="wq-break-duration-badge">每局最多 45 秒</span></div><div class="wq-break-choices">${GAMES.map(game => `<button class="wq-break-choice wq-break-${game.id}" type="button" data-game="${game.id}"><span class="wq-break-card-art" aria-hidden="true">${game.id === 'dodge' ? '<i class="wq-art-orbit"></i><i class="wq-art-ship">▲</i><i class="wq-art-star">✦</i><i class="wq-art-rock"></i>' : game.id === 'merge' ? '<i class="wq-art-number">8</i><i class="wq-art-number">16</i><i class="wq-art-number">32</i>' : '<i class="wq-art-ring"></i><i class="wq-art-ring"></i><i class="wq-art-ring"></i><b>×10</b>'}</span><span class="wq-break-game-kind">${game.tag}</span><strong>${game.name}</strong><span class="wq-break-card-description">${game.description}</span><span class="wq-break-card-scores">${scores(game.id)}</span><span class="wq-break-choice-link">查看玩法 <span aria-hidden="true">↗</span></span></button>`).join('')}</div><p class="wq-break-bottom-note">每种游戏单独排名 · 每周重新挑战 · 排名以服务器核验成绩为准</p>`;
      if (shouldFocus) focus('h3');
    }
    function instructions(id) {
      const info = GAMES.find(game => game.id === id); if (!info) return;
      clearRound(); session.currentGame = id;
      body.innerHTML = `<section class="wq-break-intro-panel wq-break-${id}">${hosted ? returnButton("← 返回棋盘") : '<button type="button" class="wq-break-back" data-action="menu">← 选择游戏</button>'}<span class="wq-break-intro-symbol" aria-hidden="true">${info.icon}</span><span class="wq-break-eyebrow">${info.tag} / 最多 45 秒挑战</span><h3 tabindex="-1">${info.name}</h3><p>${info.description}</p><ol class="wq-break-rules">${info.rules.map(rule => `<li>${rule}</li>`).join('')}</ol><div class="wq-break-control-help">${info.controls}</div><div class="wq-break-intro-scores">${scores(id)}</div><button type="button" class="wq-break-primary" data-action="start" ${session.remaining() < MIN_ROUND ? 'disabled' : ''}>开始挑战 <span aria-hidden="true">→</span></button><p class="wq-break-status" role="status" aria-live="polite">${session.remaining() < MIN_ROUND ? '本次时间已用完，请回大厅查看余额。' : '准备好再开始；不足 45 秒时会按剩余时间缩短本局，成绩仍由服务器核验。'}</p></section>`;
      focus('h3');
    }
    function status(text) { const element = body.querySelector('.wq-break-status'); if (element) element.textContent = text; }
    async function startRound() {
      if (session.pending || session.round || !check()) return;
      if (session.remaining() < MIN_ROUND) { status('本次时间已用完，请回大厅查看余额。'); return; }
      if (typeof options.beginRound !== 'function' || typeof options.finishRound !== 'function') { status('挑战服务暂未连接，请返回大厅后重试。'); return; }
      const id = session.currentGame, version = session.roundVersion;
      session.pending = true;
      const startButton = body.querySelector('[data-action="start"]'); if (startButton) startButton.disabled = true;
      status('正在准备本局挑战…');
      try {
        const ticket = await options.beginRound(id);
        if (!live() || version !== session.roundVersion || !check()) return;
        if (!ticket || !ticket.round_id || !Number.isInteger(ticket.duration_ms) || ticket.duration_ms < MIN_ROUND || ticket.duration_ms > DURATION) throw new Error('invalid ticket');
        const state = replay(id, Number(ticket.seed), []);
        session.pending = false;
        session.round = { id, ticket, trace: [], state, lane: 1, version, duration: Math.min(ticket.duration_ms, session.remaining()), remaining: allowance(Math.min(ticket.duration_ms, session.remaining()), () => performance.now(), () => Date.now()), elapsed: 0, lastDrawn: -1, renderedSlot: -1, finishing: false, finished: false, settled: false, feedback: '', feedbackUntil: 0 };
        feedback('GO！', 0); gameShell(); drawRound(true); focus('.wq-break-playfield');
      } catch (error) {
        if (!live() || version !== session.roundVersion) return;
        session.pending = false; if (startButton) startButton.disabled = false;
        status('暂时无法开始挑战，请检查网络或返回大厅后重试。');
      }
    }
    function gameShell() {
      const round = session.round, info = GAMES.find(game => game.id === round.id);
      body.innerHTML = `<section class="wq-break-arena wq-break-${round.id}"><div class="wq-break-game-header">${hosted ? returnButton("← 退出本局") : '<button class="wq-break-back" type="button" data-action="menu">← 退出本局</button>'}<span class="wq-break-game-label">${info.name}</span><span class="wq-break-round-clock" role="timer" aria-label="本局剩余时间">${Math.ceil(round.duration / 1000)} 秒</span></div><div class="wq-break-hud"><div><span>本局得分</span><strong class="wq-break-score">0</strong><small>结算前为暂计成绩</small></div><div class="wq-break-secondary-stat"></div></div><div class="wq-break-playfield" tabindex="0" aria-label="${info.name}游戏区域"><div class="wq-break-board"></div><div class="wq-break-feedback" aria-hidden="true"></div></div>${round.id === 'dodge' ? '<div class="wq-break-controls"><button type="button" data-lane-shift="-1" aria-label="向左移动">← <span>向左</span></button><span>躲陨石 · 追星星</span><button type="button" data-lane-shift="1" aria-label="向右移动"><span>向右</span> →</button></div>' : round.id === 'merge' ? '<div class="wq-break-controls wq-break-direction-controls"><button type="button" data-direction="0" aria-label="向左合成">←</button><button type="button" data-direction="1" aria-label="向上合成">↑</button><button type="button" data-direction="3" aria-label="向下合成">↓</button><button type="button" data-direction="2" aria-label="向右合成">→</button></div>' : '<div class="wq-break-beat-meter" aria-hidden="true"><span></span></div>'}<p class="wq-break-status" role="status" aria-live="polite">${info.controls}</p></section>`;
    }
    function feedback(text, elapsed) { const round = session.round; round.feedback = text; round.feedbackUntil = elapsed + 550; }
    function drawRound(force) {
      const round = session.round; if (!round || round.finishing || round.finished) return;
      const state = round.state, board = body.querySelector('.wq-break-board'), elapsed = round.elapsed;
      body.querySelector('.wq-break-score').textContent = state.score.toLocaleString();
      body.querySelector('.wq-break-round-clock').textContent = `${Math.ceil((round.duration - elapsed) / 1000)} 秒`;
      body.querySelector('.wq-break-feedback').textContent = elapsed < round.feedbackUntil ? round.feedback : '';
      const stat = body.querySelector('.wq-break-secondary-stat');
      if (round.id === 'dodge') {
        stat.innerHTML = `<span>星舰护盾</span><strong class="wq-break-shields">${'◆'.repeat(state.lives)}<i>${'◇'.repeat(3 - state.lives)}</i></strong><small>第 ${Math.min(60, state.completed + 1)} / 60 波 · ${state.stars} 颗星</small>`;
        const index = state.completed, progress = (elapsed - index * 700) / 700;
        board.innerHTML = `<div class="wq-break-track"><div class="wq-break-track-lines"></div><div class="wq-break-distance">SECTOR ${String(Math.floor(index / 10) + 1).padStart(2, '0')}</div>${[1, 0].map(offset => {
          const wave = state.course[index + offset]; if (!wave) return '';
          const top = (progress - offset) * 70 + 8;
          return `<div class="wq-break-obstacle" style="--lane:${wave.hazard};top:${top}%" aria-label="第 ${wave.hazard + 1} 道陨石">◆</div><div class="wq-break-star" style="--lane:${wave.star};top:${top}%" aria-label="第 ${wave.star + 1} 道星星">✦</div>`;
        }).join('')}<div class="wq-break-ship" style="--lane:${round.lane}" aria-label="星舰位于第 ${round.lane + 1} 道"><span>▲</span><i></i></div><div class="wq-break-track-glow"></div></div>`;
      } else if (round.id === 'merge') {
        stat.innerHTML = `<span>最高方块</span><strong>${state.highest}</strong><small>${state.moves} 次有效移动</small>`;
        if (force || round.lastDrawn !== round.trace.length) {
          board.innerHTML = `<div class="wq-break-merge-grid">${state.board.map((value, index) => `<div class="wq-break-number-tile ${value ? 'has-value' : ''} ${value && (!round.drawnBoard || value !== round.drawnBoard[index]) ? 'is-new' : ''}" style="--level:${value ? Math.min(11, Math.log2(value)) : 0}" data-value="${value}" aria-label="第 ${index + 1} 格，${value || '空'}">${value || ''}</div>`).join('')}</div>`;
          round.drawnBoard = state.board.slice();
          round.lastDrawn = round.trace.length;
        }
      } else {
        const slot = Math.min(59, Math.floor(elapsed / 750));
        const combo = state.lastSlot >= slot - 1 ? state.combo : 0;
        stat.innerHTML = `<span>当前连击</span><strong class="wq-break-combo">×${combo}</strong><small>命中 ${state.hits} / ${slot + 1} 拍</small>`;
        const accepted = state.lastSlot === slot;
        const hit = accepted && round.trace[round.trace.length - 1].v === state.targets[slot];
        if (force || round.renderedSlot !== slot || round.lastDrawn !== round.trace.length) {
          const keys = '1234qwerasdfzxcv';
          board.innerHTML = `<div class="wq-break-pulse-grid">${Array.from({ length: 16 }, (_, index) => `<button type="button" class="wq-break-pulse-tile ${index === state.targets[slot] ? accepted ? hit ? 'is-hit' : 'is-missed' : 'is-target' : ''}" data-target="${index}" ${accepted ? 'disabled' : ''} aria-label="第 ${index + 1} 格${index === state.targets[slot] ? accepted ? hit ? '，已命中' : '，本拍未命中' : '，发光目标' : ''}"><span aria-hidden="true">${index === state.targets[slot] ? accepted ? hit ? '✓' : '×' : '◎' : '·'}</span><small aria-hidden="true">${keys[index].toUpperCase()}</small></button>`).join('')}</div>`;
          round.renderedSlot = slot; round.lastDrawn = round.trace.length;
        }
        body.querySelector('.wq-break-beat-meter span').style.width = `${100 - elapsed % 750 / 7.5}%`;
      }
    }
    function advanceRound() {
      const round = session.round; if (!round || round.finishing || round.finished) return;
      round.elapsed = Math.min(round.duration, Math.floor(round.duration - round.remaining()));
      if (round.id === 'dodge') {
        while (round.trace.length < Math.min(60, Math.floor(round.elapsed / 700)) && !round.state.done) {
          const old = round.state;
          round.trace.push({ t: (round.trace.length + 1) * 700, v: round.lane });
          round.state = replay(round.id, Number(round.ticket.seed), round.trace);
          feedback(round.state.lives < old.lives ? '护盾 −1' : round.state.stars > old.stars ? '✦ +30' : '+10', round.elapsed);
        }
      }
      if (round.elapsed >= round.duration || round.state.done) { finishRound(); return; }
      drawRound(false);
    }
    function action(value) {
      if (!check()) return;
      advanceRound();
      const round = session.round; if (!round || round.finishing || round.finished) return;
      const elapsed = round.elapsed;
      if (round.id === 'dodge') { round.lane = Math.max(0, Math.min(2, round.lane + value)); drawRound(true); return; }
      if (round.trace.length >= 300) { status('本局已达到操作上限，请等待结算。'); return; }
      if (round.id === 'merge') {
        const previous = round.trace[round.trace.length - 1];
        if (previous && elapsed - previous.t < 80) return;
        const move = mergeMove(round.state.board, value); if (!move.changed) return;
        round.trace.push({ t: elapsed, v: value });
        if (move.score) feedback(`合成 +${move.score}`, elapsed);
      } else {
        const slot = Math.floor(elapsed / 750); if (round.state.lastSlot === slot) return;
        round.trace.push({ t: elapsed, v: value });
        feedback(value === round.state.targets[slot] ? '命中！' : '失误 −10', elapsed);
      }
      round.state = replay(round.id, Number(round.ticket.seed), round.trace);
      if (round.state.done) finishRound(); else drawRound(true);
    }
    async function finishRound() {
      const round = session.round; if (!round || round.finishing || round.finished || round.settled || active !== session || session.stopped) return;
      if (session.returnRequest) session.returnAfterFinish = true;
      hideReturnConfirm();
      round.finishing = true;
      body.innerHTML = `<section class="wq-break-result"><span class="wq-break-eyebrow">CHALLENGE COMPLETE</span><h3 tabindex="-1">挑战结束，正在核验成绩…</h3><strong class="wq-break-result-score">${round.state.score.toLocaleString()}</strong><p class="wq-break-status" role="status">正在同步你的成绩与本周排名</p>${hosted ? returnButton("正在核验成绩…", true) : '<button type="button" class="wq-break-back" data-action="menu">返回游戏选择</button>'}</section>`;
      focus('h3');
      try {
        const result = round.serverResult || await options.finishRound(round.ticket.round_id, round.trace.map(event => ({ t: event.t, v: event.v })));
        if (active !== session || session.stopped || session.round !== round || session.roundVersion !== round.version) return;
        if (!result || !Number.isFinite(Number(result.score))) throw new Error('invalid result');
        round.serverResult = result;
        const score = Number(result.score), personalBest = Number(result.personal_best) || 0, weekBest = Number(result.week_best) || 0;
        const rank = Number(result.rank);
        round.receipt ||= Object.freeze({ roundId: String(round.ticket.round_id), game: round.id, score, rank: Number.isInteger(rank) && rank > 0 ? rank : null, personalBest, weekBest, nickname: String(result.nickname || ''), newBest: !!result.new_best });
        if (typeof options.onSettled === 'function' && !round.hostSaved) {
          status('成绩已核验，正在保存棋盘记录…');
          await options.onSettled(round.receipt);
          if (active !== session || session.stopped || session.round !== round || session.roundVersion !== round.version) return;
          round.hostSaved = true;
        }
        round.finished = true; round.finishing = false; round.settled = true; session.bests[round.id] = result;
        session.settledReceipt = round.receipt;
        body.innerHTML = `<section class="wq-break-result wq-break-${round.id}"><span class="wq-break-result-medal" aria-hidden="true">${score > 0 && score >= personalBest ? '✦' : '◇'}</span><span class="wq-break-eyebrow">${score > 0 && score >= personalBest ? 'PERSONAL BEST / 个人最佳' : 'CHALLENGE COMPLETE / 挑战完成'}</span><h3 tabindex="-1">${GAMES.find(game => game.id === round.id).name}</h3><strong class="wq-break-result-score">${score.toLocaleString()}<small>分</small></strong><p class="wq-break-verified">✓ 成绩已核验并同步</p><div class="wq-break-result-stats"><div><span>个人最佳</span><strong>${personalBest.toLocaleString()}</strong></div><div><span>本周最佳</span><strong>${weekBest.toLocaleString()}</strong></div><div><span>本周排名</span><strong>${Number.isInteger(rank) && rank > 0 ? '#' + rank : '—'}</strong></div></div><p class="wq-break-status">${result.nickname ? escapeHtml(result.nickname) + '，' : ''}${score > 0 && score >= personalBest ? '这一局就是你的最佳表现！' : '每次挑战，都有新的可能。'}${round.id === 'pulse' ? ` 本局最高 ${round.state.bestCombo} 连击。` : round.id === 'dodge' ? ` 收集了 ${round.state.stars} 颗星星。` : ` 最高合成 ${round.state.highest}。`}</p><div class="wq-break-result-actions">${hosted ? returnButton() : `<button type="button" class="wq-break-primary" data-action="again" ${session.remaining() < MIN_ROUND ? 'disabled' : ''}>再挑战一次 ↗</button><button type="button" class="wq-break-back" data-action="menu" ${session.remaining() < MIN_ROUND ? 'disabled' : ''}>换个游戏</button>`}</div>${session.remaining() < MIN_ROUND ? '<p class="wq-break-bottom-note">本次时间已用完，可回大厅查看剩余余额。</p>' : ''}</section>`;
        focus('h3');
        if (session.returnAfterFinish) returnToHost();
      } catch (error) {
        if (active !== session || session.stopped || session.round !== round || session.roundVersion !== round.version) return;
        round.finishing = false;
        body.innerHTML = `<section class="wq-break-result"><h3 tabindex="-1">${round.serverResult ? '成绩已核验，棋盘记录尚未保存' : '成绩暂未同步'}</h3><strong class="wq-break-result-score">${Number(round.serverResult?.score ?? round.state.score).toLocaleString()}</strong><p class="wq-break-status" role="status">${round.serverResult ? '请保持页面打开并重试保存。会沿用本局已核验的成绩，不会重新开局或重复结算。' : '这是本机暂计分数，尚未进入排行榜。请检查网络后重试。'}</p><div class="wq-break-result-actions"><button type="button" class="wq-break-primary" data-action="retry">${round.serverResult ? '重试保存棋盘记录' : '重试同步'}</button>${hosted ? returnButton(round.serverResult ? '请先保存棋盘记录' : '放弃本局并返回棋盘', !!round.serverResult) : '<button type="button" class="wq-break-back" data-action="menu">返回游戏选择</button>'}</div></section>`;
        round.finished = true; // Prevent the clock from silently resubmitting.
        focus('h3');
        settleReturnRequest(false, new Error('WQ_ARCADE_SETTLEMENT_PENDING'));
      }
    }
    session.onClick = event => {
      const button = event.target.closest('button');
      if (!button || !container.contains(button) || button.disabled) return;
      const data = button.dataset;
      if (hosted && data.action === 'return') { returnToHost(); return; }
      if (hosted && data.action === 'confirm-return') { if (!returnConfirm.hidden) returnToHost(true); return; }
      if (hosted && data.action === 'cancel-return') { hideReturnConfirm(); settleReturnRequest(false); focus('.wq-break-playfield'); return; }
      if (session.expired) { if (data.action === 'retry' && session.round?.finished && !session.round.settled) { session.round.finished = false; finishRound(); } return; }
      if (!check()) return;
      if (data.game) instructions(data.game);
      else if (data.action === 'menu') menu(true);
      else if (data.action === 'start') startRound();
      else if (data.action === 'again') instructions(session.currentGame);
      else if (data.action === 'retry' && session.round && !session.round.settled) { session.round.finished = false; finishRound(); }
      else if (data.laneShift != null && session.round && session.round.id === 'dodge') action(Number(data.laneShift));
      else if (data.direction != null && session.round && session.round.id === 'merge') action(Number(data.direction));
      else if (data.target != null && session.round && session.round.id === 'pulse') action(Number(data.target));
    };
    session.onKey = event => {
      const round = session.round; if (!round || round.finishing || round.finished || !live() || event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.target && /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName || '')) return;
      const directions = { ArrowLeft: 0, ArrowUp: 1, ArrowRight: 2, ArrowDown: 3 };
      if (round.id === 'dodge' && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) { event.preventDefault(); action(event.key === 'ArrowLeft' ? -1 : 1); }
      else if (round.id === 'merge' && directions[event.key] != null) { event.preventDefault(); action(directions[event.key]); }
      else if (round.id === 'pulse' && !event.repeat) { const index = '1234qwerasdfzxcv'.indexOf(String(event.key).toLowerCase()); if (String(event.key).length === 1 && index >= 0) { event.preventDefault(); action(index); } }
    };
    session.onPointerDown = event => {
      const round = session.round;
      if (!round || round.finishing || round.finished || round.id === 'pulse' || !event.target.closest('.wq-break-playfield')) return;
      session.pointer = { x: event.clientX, y: event.clientY, id: event.pointerId };
    };
    session.onPointerUp = event => {
      const pointer = session.pointer, round = session.round; session.pointer = null;
      if (!pointer || pointer.id !== event.pointerId || !round) return;
      const dx = event.clientX - pointer.x, dy = event.clientY - pointer.y;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return;
      if (round.id === 'dodge') { if (Math.abs(dx) > Math.abs(dy)) action(dx < 0 ? -1 : 1); }
      else if (round.id === 'merge') action(Math.abs(dx) > Math.abs(dy) ? dx < 0 ? 0 : 2 : dy < 0 ? 1 : 3);
    };
    session.onPointerCancel = () => { session.pointer = null; };
    session.onVisibility = () => { if (check()) advanceRound(); };
    const containerEvents = [['click', session.onClick], ['pointerdown', session.onPointerDown], ['pointerup', session.onPointerUp], ['pointercancel', session.onPointerCancel]];
    const documentEvents = [['keydown', session.onKey], ['visibilitychange', session.onVisibility]];
    session.detach = () => { containerEvents.forEach(([name, handler]) => container.removeEventListener(name, handler)); documentEvents.forEach(([name, handler]) => document.removeEventListener(name, handler)); };
    containerEvents.forEach(([name, handler]) => container.addEventListener(name, handler)); documentEvents.forEach(([name, handler]) => document.addEventListener(name, handler));
    if (GAMES.some(game => game.id === options.initialGame)) instructions(options.initialGame); else menu(false);
    function tick() { if (check()) { advanceRound(); if (live()) session.tick = setTimeout(tick, session.round && !session.round.finished && !session.round.finishing ? 40 : 200); } }
    tick();
    return { requestReturn };
  }

  const api = { mount, stop };
  if (root) root.WQGameBreak = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = { ...api, allowance, formatTime, createRandom, dodgeCourse, pulseTargets, mergeMove, replay, hasMoves };
})(typeof window === 'undefined' ? null : window);
