window.ActionTray = (() => {
  let lastSignature = '';

  function isMobileGameViewport() {
    try {
      return !!window.GameState?.isMobileLike?.();
    } catch (_) {
      try {
        return !!window.matchMedia?.('(max-width: 900px), (hover: none) and (pointer: coarse)').matches;
      } catch (_) {
        return window.innerWidth <= 900;
      }
    }
  }

  function currentVisibleScreenId() {
    const active = document.querySelector('.screen.active');
    if (active) return active.id;
    const all = Array.from(document.querySelectorAll('.screen'));
    const shown = all.find(el => getComputedStyle(el).display !== 'none');
    return shown?.id || '';
  }

  function syncBodyMarkers() {
    const screenId = document.body?.dataset?.screen || currentVisibleScreenId() || '';
    if (screenId) document.body.dataset.screen = screenId;

    const grid = document.getElementById('gameGrid');
    const mode =
      grid?.classList.contains('mode-mc') || grid?.classList.contains('mcMode') ? 'mc' :
      grid?.classList.contains('mode-inline') ? 'inline' :
      grid?.classList.contains('mode-tap') ? 'tap' :
      grid?.classList.contains('mode-geo') || grid?.classList.contains('geoMeasureMode') ? 'geo' :
      grid?.classList.contains('mode-input') || grid?.classList.contains('inputMode') ? 'input' :
      (window.GameState?.uiState?.mode || 'idle');

    document.body.dataset.gameMode = mode;
    document.body.dataset.geoMeasure = (mode === 'geo' || grid?.classList.contains('geoMeasureMode')) ? '1' : '0';
    return { screenId, mode };
  }

  function canUseMobileSheet() {
    const rp = document.getElementById('keypadSheet');
    const { screenId, mode } = syncBodyMarkers();
    if (!rp) return false;
    if (!isMobileGameViewport()) return false;
    if (screenId !== 'scrGame') return false;
    if (!['input', 'inline', 'geo'].includes(mode || '')) return false;
    if (rp.hidden || getComputedStyle(rp).display === 'none') return false;
    return true;
  }

  function setPadOpen(forceOpen) {
    const next = !!forceOpen && canUseMobileSheet();
    document.body.classList.toggle('pad-open', next);

    const btn = document.getElementById('btnPadToggle');
    if (btn) btn.textContent = next ? '▾' : '▴';

    const rp = document.getElementById('keypadSheet');
    if (rp) rp.dataset.open = next ? '1' : '0';

    try { window.GameState?.setKeypadOpen?.(next); } catch (_) {}
    try { window.GameState?.syncFromDom?.(); } catch (_) {}
    return next;
  }

  function syncPresentation() {
    const rp = document.getElementById('keypadSheet');
    const prompt = document.getElementById('qPrompt');
    const mainInput = document.getElementById('mainInput');
    const { screenId, mode } = syncBodyMarkers();

    const signature = [
      screenId,
      mode,
      document.body.dataset.geoMeasure || '0',
      prompt?.textContent?.trim() || '',
      rp?.hidden ? 'hidden' : (rp ? getComputedStyle(rp).display : 'none')
    ].join('|');

    if (!canUseMobileSheet()) {
      lastSignature = signature;
      setPadOpen(false);
      return;
    }

    if (signature !== lastSignature) {
      lastSignature = signature;
      setPadOpen(false);
      if (mainInput && getComputedStyle(mainInput).display !== 'none') {
        mainInput.setAttribute('placeholder', 'tik om keypad te openen');
      }
    }
  }

  function toggleKeypadSheet(forceOpen) {
    const rp = document.getElementById('keypadSheet');
    if (!rp) return false;
    if (!isMobileGameViewport()) {
      syncPresentation();
      return false;
    }
    const next = typeof forceOpen === 'boolean' ? forceOpen : !document.body.classList.contains('pad-open');
    return setPadOpen(next);
  }

  function bindPadToggle() {
    const btn = document.getElementById('btnPadToggle');
    if (!btn || btn.dataset.refactorBound === '1') return;
    btn.dataset.refactorBound = '1';
    btn.addEventListener('click', (e) => {
      if (document.body.classList.contains('pad-open')) {
        e.preventDefault();
        e.stopPropagation();
      }
      toggleKeypadSheet();
    }, true);
  }

  function bindDocumentInteractions() {
    if (document.body.dataset.refactorPadDocBound === '1') return;
    document.body.dataset.refactorPadDocBound = '1';

    document.addEventListener('pointerdown', (e) => {
      const target = e.target;
      const input = target?.closest?.('#mainInput, [data-ratio-input], .fraction-overlay input');
      if (input) {
        try {
          window.activeInput = input;
          window.GameState?.setActiveInput?.(input);
        } catch (_) {}
        toggleKeypadSheet(true);
        return;
      }

      if (!document.body.classList.contains('pad-open')) return;
      const insideSheet = target?.closest?.('#keypadSheet');
      if (!insideSheet) toggleKeypadSheet(false);
    }, { passive: false });
  }

  function bindScreenChange() {
    if (document.body.dataset.refactorPadScreenBound === '1') return;
    document.body.dataset.refactorPadScreenBound = '1';
    document.addEventListener('app:screenchange', () => {
      sync();
    });
  }

  function sync() {
    syncBodyMarkers();
    syncPresentation();
  }

  function init() {
    bindPadToggle();
    bindDocumentInteractions();
    bindScreenChange();
    sync();
  }

  return {
    init,
    sync,
    syncBodyMarkers,
    syncPresentation,
    toggleKeypadSheet,
    setPadOpen,
    canUseMobileSheet,
    isMobileGameViewport,
  };
})();
