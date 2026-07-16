'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'captcha_passed';

/**
 * CaptchaGate
 * ----------------------------------------------------------------
 * 拼图验证码拦截层。
 * - sessionStorage 记忆通过状态，刷新同会话内不重复验证
 * - 验证通过前，主页面内容以"不可见 + 不交互"方式被遮罩（pointer-events:none）
 * - 验证通过后：写入 storage + 卸载遮罩 + 释放主页面
 * - 验证逻辑 100% 复用 puzzle-captcha.html 的两阶段实现
 *
 * 使用方式：在 layout.tsx 的 <body> 最顶部插入 <CaptchaGate />
 * 调试重置：sessionStorage.removeItem('captcha_passed')
 * ----------------------------------------------------------------
 */
export default function CaptchaGate() {
  const [passed, setPassed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // 1) 已通过：直接放行，不挂任何 DOM
    if (typeof window !== 'undefined' && sessionStorage.getItem(STORAGE_KEY) === '1') {
      setPassed(true);
      return;
    }

    // 2) 注入验证码 DOM
    const overlay = buildOverlay();
    document.body.appendChild(overlay);

    // 3) 禁用底层页面滚动与交互（防止绕过）
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // 4) 启动验证码逻辑
    const cleanup = initCaptcha(overlay, () => {
      // === onFinalSuccess 回调：放行逻辑 ===
      try {
        sessionStorage.setItem(STORAGE_KEY, '1');
      } catch {
        /* sessionStorage 不可用时静默忽略 */
      }
      setPassed(true);
      // 卸载遮罩 + 恢复 body
      overlay.remove();
      document.body.style.overflow = prevOverflow;
    });

    return () => {
      cleanup?.();
      overlay.remove();
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  // 未挂载（SSR 阶段）时，先把 children 区域隐藏，避免验证期间看到主页面
  // 验证通过后恢复显示
  return (
    <>
      {!passed && mounted && (
        <style>{`body > *:not(.cap-overlay) { pointer-events: none; user-select: none; }`}</style>
      )}
    </>
  );
}

/* ============================================================
   构造遮罩 DOM
   ============================================================ */
function buildOverlay() {
  const overlay = document.createElement('div');
  overlay.className = 'cap-overlay';
  overlay.innerHTML = `
    <div class="cap-bg-layer">
      <div class="cap-bg-hole"></div>
    </div>
    <div class="cap-heading">你正在访问lyjy作业管理系统，请先通过验证</div>
    <div class="cap-small-hole"></div>
    <div class="cap-window">
      <div class="cap-window-header">
        <div class="cap-window-title">
          <span class="cap-dot">✓</span>
          请完成滑块验证
        </div>
      </div>
      <div class="cap-piece-area">
        <div class="cap-piece"></div>
        <div class="cap-fake-hole"></div>
      </div>
      <div class="cap-slider-area">
        <div class="cap-slider-track">
          <div class="cap-slider-fill"></div>
          <div class="cap-slider-thumb">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </div>
        </div>
        <div class="cap-slider-hint">拖动滑块完成拼图</div>
      </div>
      <button class="cap-refresh-btn" type="button">↻ 刷新</button>
      <span class="cap-tagline">双重认证，真假难辨，真正的防人机认证</span>
    </div>
    <div class="cap-particles"></div>
  `;
  return overlay;
}

/* ============================================================
   验证码主逻辑（移植自 puzzle-captcha.html）
   - 完全保留原算法与参数
   - 类名加 cap- 前缀
   - onFinalSuccess 末尾触发外部 onPass
   ============================================================ */
function initCaptcha(root: HTMLElement, onPass: () => void): () => void {
  const bgLayer = root.querySelector<HTMLDivElement>('.cap-bg-layer')!;
  const bgHole = root.querySelector<HTMLDivElement>('.cap-bg-hole')!;
  const captchaWindow = root.querySelector<HTMLDivElement>('.cap-window')!;
  const puzzlePiece = root.querySelector<HTMLDivElement>('.cap-piece')!;
  const sliderTrack = root.querySelector<HTMLDivElement>('.cap-slider-track')!;
  const sliderFill = root.querySelector<HTMLDivElement>('.cap-slider-fill')!;
  const sliderThumb = root.querySelector<HTMLDivElement>('.cap-slider-thumb')!;
  const sliderHint = root.querySelector<HTMLDivElement>('.cap-slider-hint')!;
  const particles = root.querySelector<HTMLDivElement>('.cap-particles')!;
  const refreshBtn = root.querySelector<HTMLButtonElement>('.cap-refresh-btn')!;
  const fakeHole = root.querySelector<HTMLDivElement>('.cap-fake-hole')!;
  const smallHole = root.querySelector<HTMLDivElement>('.cap-small-hole')!;

  const WINDOW_W = 420;
  const WINDOW_H = 250;
  const TOLERANCE = 5;
  const NEAR_ZONE = 28;
  const HOLE_DELAY = 500;

  let phase: 1 | 2 = 1;
  let holeX = 0,
    holeY = 0;
  let windowLeft = 0,
    windowTop = 0;
  let targetWindowLeft = 0;
  let winMinLeft = 0,
    winMaxLeft = 0;
  let sliderMax = 0;
  let sliderValue = 0;
  let dragging = false;
  let verified = false;
  let phaseLocked = false;
  let startMouseX = 0;
  let startSliderValue = 0;
  let dragStartTime = 0;

  let smallHoleX = 0,
    smallHoleY = 0;
  let pieceBaseX = 0;
  let pieceMoveRange = 0;
  let pieceTargetX = 0;
  let pieceCurrentX = 0;

  function getPieceInWindow() {
    const pieceRect = puzzlePiece.getBoundingClientRect();
    const winRect = captchaWindow.getBoundingClientRect();
    return { x: pieceRect.left - winRect.left, y: pieceRect.top - winRect.top };
  }

  function init() {
    verified = false;
    phaseLocked = false;
    dragging = false;
    sliderValue = 0;
    dragStartTime = 0;
    phase = 1;

    const winW = captchaWindow.clientWidth;
    const winH = captchaWindow.clientHeight;
    sliderMax = sliderTrack.clientWidth - sliderThumb.clientWidth;

    const screenMin = 10;
    const screenMax = window.innerWidth - winW - 10;
    const moveRange = sliderMax;

    const targetFrac = 0.55 + Math.random() * 0.3;
    const maxStart = screenMax - moveRange;

    if (maxStart <= screenMin) {
      winMinLeft = screenMin;
      winMaxLeft = screenMax;
    } else {
      winMinLeft = screenMin + Math.random() * (maxStart - screenMin);
      winMaxLeft = winMinLeft + moveRange;
      if (winMaxLeft > screenMax) {
        winMaxLeft = screenMax;
        winMinLeft = screenMax - moveRange;
      }
    }
    targetWindowLeft = winMinLeft + targetFrac * (winMaxLeft - winMinLeft);
    holeX = targetWindowLeft;

    const marginY = 120;
    const maxY = window.innerHeight - marginY - WINDOW_H;
    holeY = marginY + Math.random() * (maxY - marginY);
    windowTop = holeY;
    windowLeft = winMinLeft;

    const pieceAreaW = winW - 36;
    const fakeMinX = 80;
    const fakeMaxX = pieceAreaW - 68;
    const fakeX = fakeMinX + Math.random() * (fakeMaxX - fakeMinX);
    fakeHole.style.left = fakeX + 'px';

    bgHole.style.left = holeX + 'px';
    bgHole.style.top = holeY + 'px';
    captchaWindow.style.left = windowLeft + 'px';
    captchaWindow.style.top = windowTop + 'px';

    pieceBaseX = 0;
    pieceCurrentX = 0;
    puzzlePiece.style.left = '0px';

    updateSliderUI();
    updatePieceBackground();
    updateNearIndicator();
    updateRealHoleVisibility();

    captchaWindow.classList.remove('cap-matched');
    captchaWindow.style.borderColor = '';
    captchaWindow.style.boxShadow = '';
    sliderFill.classList.remove('cap-matched');
    sliderThumb.classList.remove('cap-matched', 'cap-near-target');
    sliderHint.textContent = '拖动滑块完成拼图';
    sliderHint.className = 'cap-slider-hint';
    particles.innerHTML = '';
    bgHole.style.opacity = '0';
    smallHole.style.opacity = '0';
  }

  function updatePieceBackground() {
    const pw = getPieceInWindow();
    let pieceAbsX: number, pieceAbsY: number;
    if (phase === 2) {
      pieceAbsX = windowLeft + pw.x;
      pieceAbsY = windowTop + pw.y;
      const bgPosX = smallHoleX - pieceAbsX;
      const bgPosY = smallHoleY - pieceAbsY;
      puzzlePiece.style.backgroundPosition = bgPosX + 'px ' + bgPosY + 'px';
      puzzlePiece.style.setProperty('--bg-pos-x', bgPosX + 'px');
      puzzlePiece.style.setProperty('--bg-pos-y', bgPosY + 'px');
    } else {
      pieceAbsX = windowLeft + pw.x;
      pieceAbsY = windowTop + pw.y;
      const bgPosX = holeX - pieceAbsX;
      const bgPosY = holeY - pieceAbsY;
      puzzlePiece.style.backgroundPosition = bgPosX + 'px ' + bgPosY + 'px';
      puzzlePiece.style.setProperty('--bg-pos-x', bgPosX + 'px');
      puzzlePiece.style.setProperty('--bg-pos-y', bgPosY + 'px');
    }
  }

  function updatePiecePosition() {
    puzzlePiece.style.left = pieceCurrentX + 'px';
    updatePieceBackground();
  }

  function updateSliderUI() {
    const range = winMaxLeft - winMinLeft;
    const ratio = range === 0 ? 0 : (windowLeft - winMinLeft) / range;
    const clamped = Math.max(0, Math.min(1, ratio));
    sliderValue = clamped * sliderMax;
    sliderThumb.style.left = sliderValue + 'px';
    const fillPct = ((sliderValue + sliderThumb.clientWidth / 2) / sliderTrack.clientWidth) * 100;
    sliderFill.style.width = fillPct + '%';
  }

  function updateNearIndicator() {
    let dist: number;
    if (phase === 2) {
      const pw = getPieceInWindow();
      const pieceAbsX = windowLeft + pw.x;
      dist = Math.abs(pieceAbsX - smallHoleX);
    } else {
      dist = Math.abs(windowLeft - targetWindowLeft);
    }
    if (dist <= NEAR_ZONE) sliderThumb.classList.add('cap-near-target');
    else sliderThumb.classList.remove('cap-near-target');
  }

  function updateRealHoleVisibility() {
    if (phase !== 1) return;
    const elapsed = Date.now() - dragStartTime;
    if (elapsed < HOLE_DELAY) {
      bgHole.style.opacity = '0';
      return;
    }
    const dist = Math.abs(windowLeft - targetWindowLeft);
    const maxDist = winMaxLeft - winMinLeft;
    const opacity = 1 - Math.min(1, dist / (maxDist * 0.6));
    bgHole.style.opacity = String(Math.max(0, opacity));
  }

  function checkAlignment() {
    if (phase === 2) {
      const pw = getPieceInWindow();
      const pieceAbsX = windowLeft + pw.x;
      return Math.abs(pieceAbsX - smallHoleX) <= TOLERANCE;
    }
    return Math.abs(windowLeft - targetWindowLeft) <= TOLERANCE;
  }

  function sliderToWindowLeft(val: number) {
    const range = winMaxLeft - winMinLeft;
    const ratio = sliderMax === 0 ? 0 : val / sliderMax;
    return winMinLeft + ratio * range;
  }

  function sliderToPieceX(val: number) {
    const ratio = sliderMax === 0 ? 0 : val / sliderMax;
    return pieceBaseX + ratio * pieceMoveRange;
  }

  function enterPhase2() {
    phase = 2;
    phaseLocked = false;
    dragging = false;
    windowLeft = targetWindowLeft;
    captchaWindow.style.left = windowLeft + 'px';
    captchaWindow.style.transition = 'left 0.08s linear';
    captchaWindow.classList.add('cap-matched');
    bgHole.style.opacity = '1';

    pieceCurrentX = 0;
    puzzlePiece.style.left = '0px';

    const pw = getPieceInWindow();
    const pieceScreenX = windowLeft + pw.x;
    const pieceScreenY = windowTop + pw.y;
    const naturalX = pw.x;

    pieceMoveRange = captchaWindow.clientWidth - naturalX - puzzlePiece.clientWidth - 10;

    const offsetMin = 40;
    const offsetMax = pieceMoveRange;
    const offset = offsetMin + Math.random() * (offsetMax - offsetMin);

    smallHoleX = pieceScreenX + offset;
    smallHoleY = pieceScreenY;

    smallHole.style.left = smallHoleX + 'px';
    smallHole.style.top = smallHoleY + 'px';
    pieceTargetX = offset;
    smallHole.style.opacity = '1';

    updatePieceBackground();

    sliderValue = 0;
    sliderThumb.style.left = '0px';
    sliderFill.style.width = '0%';
    sliderFill.classList.remove('cap-matched');
    sliderThumb.classList.remove('cap-matched', 'cap-near-target');

    sliderHint.textContent = '请将拼图块移入凹槽';
    sliderHint.className = 'cap-slider-hint';

    captchaWindow.style.borderColor = '#22c55e';
    captchaWindow.style.boxShadow = '0 12px 40px rgba(0,0,0,0.25), 0 0 30px rgba(34,197,94,0.3)';
  }

  function onPhase1Success() {
    dragging = false;
    phaseLocked = true;
    captchaWindow.style.transition = 'left 0.08s linear';
    windowLeft = targetWindowLeft;
    captchaWindow.style.left = windowLeft + 'px';
    bgHole.style.opacity = '1';
    captchaWindow.classList.add('cap-matched');
    captchaWindow.style.borderColor = '#22c55e';
    captchaWindow.style.boxShadow = '0 12px 40px rgba(0,0,0,0.25), 0 0 30px rgba(34,197,94,0.3)';

    sliderFill.classList.add('cap-matched');
    sliderThumb.classList.add('cap-matched');
    sliderThumb.classList.remove('cap-near-target');

    sliderHint.textContent = '✓ 验证成功';
    sliderHint.className = 'cap-slider-hint cap-success';

    setTimeout(() => {
      sliderFill.classList.remove('cap-matched');
      sliderThumb.classList.remove('cap-matched');
      enterPhase2();
    }, 1000);
  }

  function onFinalSuccess() {
    if (verified) return;
    verified = true;

    pieceCurrentX = pieceTargetX;
    puzzlePiece.style.left = pieceCurrentX + 'px';
    updatePieceBackground();

    sliderFill.classList.add('cap-matched');
    sliderThumb.classList.add('cap-matched');
    sliderThumb.classList.remove('cap-near-target');

    sliderHint.textContent = '✓ 验证通过';
    sliderHint.className = 'cap-slider-hint cap-success';
    smallHole.style.opacity = '1';

    spawnParticles();

    // === 放行逻辑：触发外部回调 ===
    onPass();
  }

  function spawnParticles() {
    const colors = ['#667eea', '#764ba2', '#22c55e', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899'];
    const frag = document.createDocumentFragment();
    const cx = holeX + WINDOW_W / 2;
    const cy = holeY + WINDOW_H / 2;
    for (let i = 0; i < 40; i++) {
      const p = document.createElement('div');
      p.className = 'cap-particle';
      const angle = Math.random() * Math.PI * 2;
      const dist = 60 + Math.random() * 120;
      p.style.cssText = `
        left: ${cx}px; top: ${cy}px;
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        --dx: ${Math.cos(angle) * dist}px;
        --dy: ${Math.sin(angle) * dist}px;
        animation-duration: ${0.5 + Math.random() * 0.6}s;
      `;
      frag.appendChild(p);
    }
    particles.appendChild(frag);
    setTimeout(() => {
      particles.innerHTML = '';
    }, 1000);
  }

  function getEventX(e: MouseEvent | TouchEvent) {
    if ((e as TouchEvent).touches && (e as TouchEvent).touches.length > 0) {
      return (e as TouchEvent).touches[0].clientX;
    }
    if ((e as TouchEvent).changedTouches && (e as TouchEvent).changedTouches.length > 0) {
      return (e as TouchEvent).changedTouches[0].clientX;
    }
    return (e as MouseEvent).clientX;
  }

  function onSliderStart(e: MouseEvent | TouchEvent) {
    if (verified || phaseLocked) return;
    e.preventDefault();
    dragging = true;
    startMouseX = getEventX(e);
    startSliderValue = sliderValue;
    dragStartTime = Date.now();
    if (phase === 1) {
      captchaWindow.style.transition = 'left 0.04s linear';
    }
  }

  function onSliderMove(e: MouseEvent | TouchEvent) {
    if (!dragging || verified || phaseLocked) return;
    e.preventDefault();
    const mx = getEventX(e);
    const dx = mx - startMouseX;
    let newVal = startSliderValue + dx;
    newVal = Math.max(0, Math.min(sliderMax, newVal));
    sliderValue = newVal;
    sliderThumb.style.left = sliderValue + 'px';
    sliderFill.style.width =
      ((sliderValue + sliderThumb.clientWidth / 2) / sliderTrack.clientWidth) * 100 + '%';

    if (phase === 2) {
      pieceCurrentX = sliderToPieceX(sliderValue);
      updatePiecePosition();
    } else {
      windowLeft = sliderToWindowLeft(sliderValue);
      captchaWindow.style.left = windowLeft + 'px';
      updatePieceBackground();
      updateRealHoleVisibility();
    }
    updateNearIndicator();
  }

  function onSliderEnd(_e: MouseEvent | TouchEvent) {
    if (!dragging) return;
    dragging = false;

    if (phase === 1) {
      captchaWindow.style.transition = 'left 0.08s linear';
      if (checkAlignment()) {
        onPhase1Success();
      } else {
        captchaWindow.style.transition = 'left 0.4s cubic-bezier(0.34,1.56,0.64,1)';
        sliderValue = 0;
        windowLeft = winMinLeft;
        captchaWindow.style.left = windowLeft + 'px';
        sliderThumb.style.left = '0px';
        sliderFill.style.width = '0%';
        sliderThumb.classList.remove('cap-near-target');
        updatePieceBackground();
        updateRealHoleVisibility();
        setTimeout(() => {
          captchaWindow.style.transition = 'left 0.08s linear';
        }, 450);
      }
    } else {
      if (checkAlignment()) {
        onFinalSuccess();
      } else {
        sliderValue = 0;
        pieceCurrentX = 0;
        sliderThumb.style.left = '0px';
        sliderFill.style.width = '0%';
        sliderThumb.classList.remove('cap-near-target');
        updatePiecePosition();
      }
    }
  }

  const onMouseDown = (e: MouseEvent) => onSliderStart(e);
  const onTouchStart = (e: TouchEvent) => onSliderStart(e);
  const onMouseMove = (e: MouseEvent) => onSliderMove(e);
  const onTouchMove = (e: TouchEvent) => onSliderMove(e);
  const onMouseUp = (e: MouseEvent) => onSliderEnd(e);
  const onTouchEnd = (e: TouchEvent) => onSliderEnd(e);
  const onTouchCancel = (e: TouchEvent) => onSliderEnd(e);
  const onRefresh = () => {
    captchaWindow.style.transition = 'left 0.08s linear';
    init();
  };
  const onResize = () => {
    sliderMax = sliderTrack.clientWidth - sliderThumb.clientWidth;
    init();
  };
  const onTouchPrevent = (e: TouchEvent) => e.preventDefault();

  sliderThumb.addEventListener('mousedown', onMouseDown);
  sliderThumb.addEventListener('touchstart', onTouchStart, { passive: false });
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('touchmove', onTouchMove, { passive: false });
  window.addEventListener('mouseup', onMouseUp);
  window.addEventListener('touchend', onTouchEnd);
  window.addEventListener('touchcancel', onTouchCancel);
  sliderThumb.addEventListener('touchmove', onTouchPrevent, { passive: false });
  refreshBtn.addEventListener('click', onRefresh);
  window.addEventListener('resize', onResize);

  // 启动
  init();

  // 返回清理函数
  return () => {
    sliderThumb.removeEventListener('mousedown', onMouseDown);
    sliderThumb.removeEventListener('touchstart', onTouchStart);
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('touchmove', onTouchMove);
    window.removeEventListener('mouseup', onMouseUp);
    window.removeEventListener('touchend', onTouchEnd);
    window.removeEventListener('touchcancel', onTouchCancel);
    sliderThumb.removeEventListener('touchmove', onTouchPrevent);
    refreshBtn.removeEventListener('click', onRefresh);
    window.removeEventListener('resize', onResize);
  };
}
