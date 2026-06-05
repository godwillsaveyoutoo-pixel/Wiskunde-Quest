window.GameControls = (() => {
  function getActiveInput() {
    return window.activeInput || document.getElementById('mainInput') || null;
  }

  function submitCurrentAnswer() {
    const helpOpen = !document.getElementById('helpOverlay')?.classList.contains('hidden');
    const inp = getActiveInput();
    if (helpOpen && inp && inp.closest?.('#helpOverlay')) return;
    if (typeof window.submitAnswer === 'function') window.submitAnswer();
  }

  function handleKeypadKey(key) {
    const inp = getActiveInput();
    if (!inp) return;

    switch (key) {
      case 'back':
        inp.value = inp.value.slice(0, -1);
        break;
      case 'clear':
        inp.value = '';
        break;
      case 'comma':
        if (!String(inp.value).includes(',')) inp.value += ',';
        break;
      case 'slash':
        inp.value += '/';
        break;
      case 'colon':
        if (!String(inp.value).includes(':')) {
          if (inp.value.length === 0) inp.value = '00';
          if (inp.value.length === 1) inp.value = '0' + inp.value;
          inp.value += ':';
        }
        break;
      case 'minus':
        if (!String(inp.value).startsWith('-')) inp.value = '-' + inp.value;
        break;
      case 'ok':
        submitCurrentAnswer();
        break;
      default:
        inp.value += String(key ?? '');
        break;
    }
  }

  function bindKeypad() {
    const keypad = document.getElementById('keypad');
    if (!keypad || keypad.dataset.boundControls === '1') return;
    keypad.dataset.boundControls = '1';

    keypad.addEventListener('click', (e) => {
      const btn = e.target.closest('.key');
      if (!btn) return;
      const key = btn.dataset.k || btn.textContent || '';
      handleKeypadKey(key);
    });
  }

  function bindResultButtons() {
    const btnBack = document.getElementById('btnResBack');
    const btnAgain = document.getElementById('btnResAgain');

    if (btnBack && btnBack.dataset.boundControls !== '1') {
      btnBack.dataset.boundControls = '1';
      btnBack.addEventListener('click', () => {
        window.renderTopicMap?.();
        window.showScreen?.('scrMap');
      });
    }

    if (btnAgain && btnAgain.dataset.boundControls !== '1') {
      btnAgain.dataset.boundControls = '1';
      btnAgain.addEventListener('click', () => {
        if (window.state?.lastStart) window.startGame?.(window.state.lastStart);
        else {
          window.renderTopicMap?.();
          window.showScreen?.('scrMap');
        }
      });
    }
  }

  function bindGameButtons() {
    const btnStop = document.getElementById('btnStop');
    const btnOkInline = document.getElementById('btnOkInline');
    const btnOkMc = document.getElementById('btnOkMc');

    if (btnStop && btnStop.dataset.boundControls !== '1') {
      btnStop.dataset.boundControls = '1';
      btnStop.addEventListener('click', () => window.stopGame?.());
    }

    if (btnOkInline && btnOkInline.dataset.boundControls !== '1') {
      btnOkInline.dataset.boundControls = '1';
      btnOkInline.addEventListener('click', submitCurrentAnswer);
    }

    if (btnOkMc && btnOkMc.dataset.boundControls !== '1') {
      btnOkMc.dataset.boundControls = '1';
      btnOkMc.addEventListener('click', submitCurrentAnswer);
    }
  }

  function bindPercentCells() {
    if (document.body.dataset.boundPercentCells === '1') return;
    document.body.dataset.boundPercentCells = '1';

    document.addEventListener('click', (e) => {
      const cell = e.target.closest('.percent-cell');
      if (!cell) return;
      cell.classList.toggle('active');
    });
  }

  function bindBeforeUnload() {
    if (window.__gameControlsBeforeUnloadBound) return;
    window.__gameControlsBeforeUnloadBound = true;

    window.addEventListener('beforeunload', (e) => {
      const s = window.state;
      if (s?.mode === 'test' && !s?.proofDone && (s?.attempts < (s?.testCount || Infinity))) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    });
  }

  function setupRightPanelToggle() {
    const rp = document.getElementById('keypadSheet');
    const padT = document.getElementById('btnPadToggle');
    if (!rp || !padT || rp.dataset.boundCollapseControls === '1') return;
    rp.dataset.boundCollapseControls = '1';

    const isMobileSheetMode = () => {
      try {
        return !!window.ActionTray?.isMobileGameViewport?.();
      } catch (_) {
        try {
          return !!window.matchMedia?.('(hover: none), (pointer: coarse), (max-width: 900px)')?.matches;
        } catch (_) {
          return window.innerWidth <= 900;
        }
      }
    };

    const setCollapsed = (on) => {
      rp.classList.toggle('collapsed', !!on);
      if (!isMobileSheetMode()) {
        padT.textContent = on ? '▸' : '▾';
      }
      try { localStorage.setItem('mr_pad_collapsed', on ? '1' : '0'); } catch (_) {}
    };

    const autoCollapseIfNeeded = () => {
      if (isMobileSheetMode()) {
        rp.classList.remove('collapsed');
        return;
      }
      try {
        const pref = localStorage.getItem('mr_pad_collapsed');
        if (pref === '1') return setCollapsed(true);
        if (pref === '0') return setCollapsed(false);
      } catch (_) {}
      setCollapsed(window.innerHeight < 760);
    };

    padT.addEventListener('click', () => {
      if (isMobileSheetMode()) return;
      if (document.body.classList.contains('pad-open')) return;
      setCollapsed(!rp.classList.contains('collapsed'));
    });

    window.addEventListener('resize', () => {
      if (rp && rp.style.display !== 'none') autoCollapseIfNeeded();
    }, { passive: true });

    autoCollapseIfNeeded();
  }

  function init() {
    bindBeforeUnload();
    bindPercentCells();
    bindKeypad();
    bindGameButtons();
    bindResultButtons();
    setupRightPanelToggle();
  }

  return {
    init,
    bindKeypad,
    bindGameButtons,
    bindResultButtons,
    bindBeforeUnload,
    bindPercentCells,
    setupRightPanelToggle,
  };
})();
