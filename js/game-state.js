window.GameState = (() => {
  const uiState = {
    mode: 'idle',
    tray: 'compact',
    keypadOpen: false,
    currentQuestion: null,
    activeInput: null,
  };

  const dom = {};

  function cacheDom() {
    dom.gameGrid = document.getElementById('gameGrid');
    dom.actionTray = document.getElementById('actionTray');
    dom.choices = document.getElementById('choices');
    dom.inputRow = document.getElementById('inputRow');
    dom.mcRow = document.getElementById('mcRow');
    dom.mainInput = document.getElementById('mainInput');
    dom.unitChip = document.getElementById('unitChip');
    dom.keypadSheet = document.getElementById('keypadSheet');
    dom.qSub = document.getElementById('qSub');
    dom.visualWrap = document.getElementById('visualWrap');
    dom.gameControls = document.getElementById('gameControls');
    dom.trayControlsSlot = document.getElementById('trayControlsSlot');
    dom.sheetHint = document.getElementById('sheetHint');
    dom.btnPadToggle = document.getElementById('btnPadToggle');
    return dom;
  }

  function setMode(mode) {
    uiState.mode = mode || 'idle';
    if (!dom.gameGrid) return;
    dom.gameGrid.classList.remove('mode-idle', 'mode-mc', 'mode-input', 'mode-inline', 'mode-tap', 'mode-geo');
    dom.gameGrid.classList.add(`mode-${uiState.mode}`);
    document.body.dataset.gameModeBridge = uiState.mode;
  }

  function setTray(mode) {
    uiState.tray = mode || 'compact';
    if (!dom.gameGrid || !dom.actionTray) return;
    dom.gameGrid.classList.remove('tray-compact', 'tray-expanded', 'tray-hidden');
    dom.actionTray.classList.remove('compact', 'expanded', 'hiddenTray');
    dom.gameGrid.classList.add(`tray-${uiState.tray}`);
    if (uiState.tray === 'compact') dom.actionTray.classList.add('compact');
    if (uiState.tray === 'expanded') dom.actionTray.classList.add('expanded');
    if (uiState.tray === 'hidden') dom.actionTray.classList.add('hiddenTray');
  }

  function setKeypadOpen(isOpen) {
    uiState.keypadOpen = !!isOpen;
    if (!dom.gameGrid) return;
    dom.gameGrid.classList.toggle('keypad-open', uiState.keypadOpen);
  }

  function setCurrentQuestion(q) {
    uiState.currentQuestion = q || null;
  }

  function setActiveInput(el) {
    uiState.activeInput = el || null;
  }

  function syncFromDom() {
    if (!dom.gameGrid) cacheDom();
    const rp = dom.keypadSheet;
    const rpVisible = !!(rp && !rp.hidden && getComputedStyle(rp).display !== 'none');
    const openBySheet = document.body.classList.contains('pad-open');
    setKeypadOpen(rpVisible && (openBySheet || !isMobileLike()));
  }

  function isMobileLike() {
    try {
      return !!window.matchMedia?.('(max-width: 900px), (hover: none) and (pointer: coarse)').matches;
    } catch (_) {
      return window.innerWidth <= 900;
    }
  }

  function exposeLegacyGlobals() {
    try { if (typeof state !== 'undefined') window.state = state; } catch (_) {}
    try {
      if (typeof activeInput !== 'undefined') {
        Object.defineProperty(window, 'activeInput', {
          configurable: true,
          get() { return activeInput; },
          set(v) { activeInput = v; uiState.activeInput = v || null; }
        });
      }
    } catch (_) {}
  }

  return {
    uiState,
    cacheDom,
    setMode,
    setTray,
    setKeypadOpen,
    setCurrentQuestion,
    setActiveInput,
    syncFromDom,
    exposeLegacyGlobals,
    getDom: () => dom,
    isMobileLike,
  };
})();
