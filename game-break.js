(function (root) {
  'use strict';

  const SYMBOLS = [
    { icon: '✿', name: '花朵' }, { icon: '★', name: '星星' },
    { icon: '☀', name: '太阳' }, { icon: '♬', name: '音符' }
  ];
  const DIFFERENCES = [
    { common: '▲', odd: '▼', commonName: '向上三角形', oddName: '向下三角形' },
    { common: '↗', odd: '↖', commonName: '右上方箭头', oddName: '左上方箭头' },
    { common: '◒', odd: '◓', commonName: '下半圆涂色', oddName: '上半圆涂色' }
  ];
  const GAMES = [
    { id: 'memory', icon: '✿', name: '记忆翻翻乐', description: '翻开卡片，找出 4 对相同图案。', label: '记忆小挑战' },
    { id: 'numbers', icon: '123', name: '数字小路', description: '按顺序点出 1 到 9，慢慢来。', label: '专注小挑战' },
    { id: 'spot', icon: '↗', name: '找找不一样', description: '找出方向不同的那一个图案。', label: '观察小挑战' }
  ];
  let active = null;

  function shuffle(values, random = Math.random) {
    const result = values.slice();
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  function memoryDeck(random) {
    return shuffle(SYMBOLS.flatMap((_, index) => [index, index]), random);
  }

  function spotPuzzle(random = Math.random) {
    const pattern = DIFFERENCES[Math.floor(random() * DIFFERENCES.length)];
    const oddIndex = Math.floor(random() * 12);
    return { pattern, oddIndex, tiles: Array.from({ length: 12 }, (_, i) => i === oddIndex ? pattern.odd : pattern.common) };
  }

  // Keep the largest observed elapsed time: neither a wall-clock rollback nor
  // a monotonic clock that pauses during device sleep may restore play time.
  function allowance(remainingMs, monotonicNow, wallNow) {
    const budget = Number.isFinite(remainingMs) ? Math.max(0, remainingMs) : 0;
    const monotonicStart = monotonicNow();
    const wallStart = wallNow();
    let elapsed = 0;
    return function remaining() {
      elapsed = Math.max(elapsed, monotonicNow() - monotonicStart, wallNow() - wallStart, 0);
      return Math.max(0, budget - elapsed);
    };
  }

  function formatTime(ms) {
    const seconds = Math.max(0, Math.ceil(ms / 1000));
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  }

  function stop() {
    if (!active) return;
    const session = active;
    active = null;
    session.stopped = true;
    clearTimeout(session.tick);
    session.roundTimers.forEach(clearTimeout);
    session.roundTimers.clear();
    session.container.removeEventListener('click', session.onClick);
    session.document.removeEventListener('visibilitychange', session.onVisibility);
    session.container.querySelectorAll('button').forEach(button => { button.disabled = true; });
  }

  function mount(container, options = {}) {
    stop();
    if (!container || typeof container.querySelector !== 'function') throw new TypeError('小游戏需要一个页面容器。');
    const document = container.ownerDocument;
    let initialMs = Number(options.remainingMs);
    if (!Number.isFinite(initialMs)) initialMs = 0;
    if (Number.isFinite(options.endsAt)) initialMs = Math.min(initialMs, options.endsAt - Date.now());
    initialMs = Math.max(0, Math.min(3600000, initialMs));
    const sessionLimitMs = Number.isFinite(options.sessionLimitMs) ? Math.max(0, Math.min(3600000, options.sessionLimitMs)) : initialMs;
    initialMs = Math.min(initialMs, sessionLimitMs);
    const session = {
      container, document, stopped: false, expired: false, tick: null,
      roundTimers: new Set(), roundVersion: 0, currentGame: null, game: null, announcedMinute: false,
      remaining: allowance(initialMs, () => performance.now(), () => Date.now())
    };
    active = session;
    container.classList.add('wq-game-break');
    container.innerHTML = `<header class="wq-break-header">
      <div><span class="wq-break-eyebrow">课后的小小休息</span><h2>玩一小局，换换心情</h2></div>
      <div class="wq-break-clock"><span>本次剩余时间</span><strong class="wq-break-time" role="timer" aria-live="off">${formatTime(initialMs)}</strong></div>
      <p class="wq-break-rule">本次 ${Math.ceil(sessionLimitMs / 60000)} 分钟，到时自动结束，刷新页面不会重新计时。</p>
      <div class="wq-break-meter" aria-hidden="true"><span></span></div>
    </header><p class="wq-break-timer-announcement wq-break-sr" role="status" aria-live="polite"></p><div class="wq-break-body"></div>`;
    const body = container.querySelector('.wq-break-body');
    const clock = container.querySelector('.wq-break-time');
    const meter = container.querySelector('.wq-break-meter span');
    const announcement = container.querySelector('.wq-break-timer-announcement');

    function live() { return active === session && !session.stopped && !session.expired; }
    function clearRound() {
      session.roundVersion++;
      session.roundTimers.forEach(clearTimeout);
      session.roundTimers.clear();
    }
    function focus(selector) {
      const target = body.querySelector(selector);
      if (target) target.focus({ preventScroll: true });
    }
    function expire() {
      if (!live()) return false;
      session.expired = true;
      clearTimeout(session.tick);
      clearRound();
      container.removeEventListener('click', session.onClick);
      document.removeEventListener('visibilitychange', session.onVisibility);
      clock.textContent = '0:00';
      meter.style.width = '0%';
      announcement.textContent = '本次游戏时间已到。';
      body.innerHTML = `<section class="wq-break-finished"><div class="wq-break-rest-icon" aria-hidden="true">☀</div><h3 tabindex="-1">休息时间到啦</h3><p>放下屏幕，看看远处、伸伸懒腰。<br>今天的努力已经很棒了。</p><p class="small muted">可以关闭这个窗口，回到学习主页。</p></section>`;
      focus('h3');
      if (typeof options.onExpire === 'function') options.onExpire();
      return false;
    }
    function check() {
      if (!live()) return false;
      const left = session.remaining();
      if (left <= 0) return expire();
      clock.textContent = formatTime(left);
      meter.style.width = `${sessionLimitMs ? left / sessionLimitMs * 100 : 0}%`;
      container.classList.toggle('wq-break-last-minute', left <= 60000);
      if (left <= 60000 && !session.announcedMinute) {
        session.announcedMinute = true;
        announcement.textContent = '本次游戏时间剩下不到一分钟。';
      }
      return true;
    }
    function scheduleRound(callback, delay) {
      const roundVersion = session.roundVersion;
      const id = setTimeout(() => {
        session.roundTimers.delete(id);
        if (roundVersion === session.roundVersion && check()) callback();
      }, delay);
      session.roundTimers.add(id);
    }
    function menu(focusHeading = false) {
      clearRound();
      session.currentGame = null;
      session.game = null;
      body.innerHTML = `<div class="wq-break-menu-intro"><h3 tabindex="-1">想玩哪一个？</h3><p class="muted">随时都可以结束；换游戏也会继续计时。</p></div>
        <div class="wq-break-choices">${GAMES.map(game => `<button class="wq-break-choice" type="button" data-game="${game.id}"><span class="wq-break-choice-icon" aria-hidden="true">${game.icon}</span><span class="wq-break-game-kind">${game.label}</span><strong>${game.name}</strong><span>${game.description}</span><span class="wq-break-choice-link">开始玩 <span aria-hidden="true">→</span></span></button>`).join('')}</div>
        <p class="wq-break-bottom-note">小游戏没有积分排名。玩得开心，也记得给眼睛放个假。</p>`;
      if (focusHeading) focus('h3');
    }
    function boardShell(name, instructions) {
      body.innerHTML = `<div class="wq-break-game-header"><button class="btn small light" type="button" data-action="menu">← 选择游戏</button><span class="wq-break-game-label">${name}</span></div>
        <h3 class="wq-break-game-heading" tabindex="-1">${name}</h3><p class="wq-break-instructions">${instructions}</p>
        <div class="wq-break-board"></div><p class="wq-break-status" role="status" aria-live="polite"></p><div class="wq-break-round-end"></div>`;
    }
    function message(text) { body.querySelector('.wq-break-status').textContent = text; }
    function finishRound(text) {
      session.game.done = true;
      body.querySelectorAll('.wq-break-tile').forEach(button => { button.disabled = true; });
      message(text);
      body.querySelector('.wq-break-round-end').innerHTML = `<div class="wq-break-round-card"><h4 tabindex="-1">这一局完成了！</h4><p>可以再玩一局，也可以现在去休息。</p><div class="btnrow"><button class="btn small" type="button" data-action="again">再玩一局</button><button class="btn small secondary" type="button" data-action="menu">换个小游戏</button></div></div>`;
      focus('.wq-break-round-end h4');
    }
    function drawMemory(focusIndex) {
      const game = session.game;
      body.querySelector('.wq-break-board').innerHTML = `<div class="wq-break-grid wq-break-memory">${game.deck.map((symbol, index) => {
        const shown = game.open.includes(index) || game.matched.has(index);
        const matched = game.matched.has(index);
        const label = `第 ${index + 1} 张，${shown ? SYMBOLS[symbol].name + (matched ? '，已配对' : '') : '尚未翻开'}`;
        return `<button type="button" class="wq-break-tile ${shown ? 'is-open' : ''} ${matched ? 'is-matched' : ''}" data-tile="${index}" aria-label="${label}" aria-pressed="${shown}" ${matched ? 'disabled' : ''}><span aria-hidden="true">${shown ? SYMBOLS[symbol].icon : '?'}</span>${matched ? '<small aria-hidden="true">已配对</small>' : ''}</button>`;
      }).join('')}</div>`;
      if (focusIndex != null) focus(`button[data-tile="${focusIndex}"]:not(:disabled)`);
    }
    function startGame(id) {
      const info = GAMES.find(game => game.id === id);
      if (!info) return;
      clearRound();
      session.currentGame = id;
      if (id === 'memory') {
        session.game = { deck: memoryDeck(), open: [], matched: new Set(), done: false, busy: false };
        boardShell(info.name, '一次翻开两张卡片，找出 4 对相同图案。');
        drawMemory();
        message('先选一张卡片。');
      } else if (id === 'numbers') {
        session.game = { numbers: shuffle(Array.from({ length: 9 }, (_, i) => i + 1)), next: 1, done: false };
        boardShell(info.name, '从 1 开始，按从小到大的顺序点到 9。');
        body.querySelector('.wq-break-board').innerHTML = `<div class="wq-break-grid wq-break-numbers">${session.game.numbers.map(number => `<button type="button" class="wq-break-tile" data-tile="${number}" aria-label="数字 ${number}">${number}</button>`).join('')}</div>`;
        message('下一步：找到数字 1。');
      } else {
        session.game = { ...spotPuzzle(), done: false };
        boardShell(info.name, '仔细看，哪一个图案的方向和其他的不一样？');
        body.querySelector('.wq-break-board').innerHTML = `<div class="wq-break-grid wq-break-spot">${session.game.tiles.map((symbol, index) => `<button type="button" class="wq-break-tile" data-tile="${index}" aria-label="第 ${index + 1} 格，${index === session.game.oddIndex ? session.game.pattern.oddName : session.game.pattern.commonName}"><span aria-hidden="true">${symbol}</span></button>`).join('')}</div>`;
        message('找到后，点一下那个图案。');
      }
      focus('h3');
    }
    function playTile(button) {
      const game = session.game;
      const index = Number(button.dataset.tile);
      if (!game || game.done || !Number.isInteger(index)) return;
      if (session.currentGame === 'memory') {
        if (game.busy || index < 0 || index >= game.deck.length || game.matched.has(index) || game.open.includes(index)) return;
        game.open.push(index);
        if (game.open.length === 1) {
          drawMemory(index);
          message('再选一张，看看是不是一对。');
        } else {
          const [first, second] = game.open;
          if (game.deck[first] === game.deck[second]) {
            game.matched.add(first); game.matched.add(second); game.open = [];
            drawMemory();
            if (game.matched.size === game.deck.length) return finishRound('4 对图案都找到了。');
            message(`找到一对！已经完成 ${game.matched.size / 2} / 4 对。`);
            focus('button[data-tile]:not(:disabled)');
          } else {
            game.busy = true;
            drawMemory(index);
            message('记住这两个图案的位置，再试一次。');
            scheduleRound(() => {
              game.open = []; game.busy = false;
              drawMemory(index);
            }, 900);
          }
        }
      } else if (session.currentGame === 'numbers') {
        if (index !== game.next) { message(`慢慢来，下一步是数字 ${game.next}。`); return; }
        button.disabled = true;
        button.classList.add('is-matched');
        button.setAttribute('aria-label', `数字 ${index}，已完成`);
        game.next++;
        if (game.next === 10) return finishRound('从 1 到 9，数字小路走完了。');
        message(`下一步：找到数字 ${game.next}。`);
        focus('button[data-tile]:not(:disabled)');
      } else if (session.currentGame === 'spot') {
        if (index !== game.oddIndex) { message('再看一次，找方向不一样的那个。'); return; }
        button.classList.add('is-matched');
        finishRound('找到了，这一个的方向不一样。');
      }
    }
    session.onClick = event => {
      const button = event.target.closest('button');
      if (!button || !container.contains(button) || button.disabled || !check()) return;
      if (button.dataset.game) startGame(button.dataset.game);
      else if (button.dataset.action === 'menu') menu(true);
      else if (button.dataset.action === 'again') startGame(session.currentGame);
      else if (button.dataset.tile != null) playTile(button);
    };
    session.onVisibility = () => { check(); };
    container.addEventListener('click', session.onClick);
    document.addEventListener('visibilitychange', session.onVisibility);
    menu();
    function tick() {
      if (check()) session.tick = setTimeout(tick, 200);
    }
    tick();
  }

  const api = { mount, stop };
  if (root) root.WQGameBreak = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ...api, allowance, formatTime, shuffle, memoryDeck, spotPuzzle };
  }
})(typeof window === 'undefined' ? null : window);
