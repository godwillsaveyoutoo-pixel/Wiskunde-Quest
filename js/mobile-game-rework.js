(function(){
  function isMobileGameViewport(){
    try {
      return !!window.matchMedia('(max-width: 900px), (hover: none) and (pointer: coarse)').matches;
    } catch(_){
      return window.innerWidth <= 900;
    }
  }

  function currentVisibleScreenId(){
    const active = document.querySelector('.screen.active');
    if (active) return active.id;
    const all = Array.from(document.querySelectorAll('.screen'));
    const shown = all.find(el => getComputedStyle(el).display !== 'none');
    return shown?.id || '';
  }

  function syncScreenState(explicitId){
    const id = explicitId || window.APP?.screen || currentVisibleScreenId();
    document.querySelectorAll('.screen').forEach(el => {
      el.classList.toggle('active', el.id === id);
    });
    if (id) document.body.dataset.screen = id;
  }

  function syncGameState(){
    const grid = document.getElementById('gameGrid');
    if (!grid) return;
    const mode = grid.classList.contains('mcMode') ? 'mc' : (grid.classList.contains('inputMode') ? 'input' : 'none');
    document.body.dataset.gameMode = mode;
    document.body.dataset.geoMeasure = grid.classList.contains('geoMeasureMode') ? '1' : '0';
  }

  function useMobilePadSheet(){
    const rp = document.getElementById('rightPanel');
    if (!rp) return false;
    if (!isMobileGameViewport()) return false;
    if ((document.body.dataset.screen || '') !== 'scrGame') return false;
    if ((document.body.dataset.gameMode || '') !== 'input') return false;
    if (getComputedStyle(rp).display === 'none') return false;
    return true;
  }

  function setPadOpen(on){
    const allowed = useMobilePadSheet();
    const next = !!on && allowed;
    document.body.classList.toggle('pad-open', next);
    const btn = document.getElementById('btnPadToggle');
    if (btn) btn.textContent = next ? '▾' : '▴';
    const rp = document.getElementById('rightPanel');
    if (rp) rp.dataset.open = next ? '1' : '0';
  }

  let lastGameSignature = '';
  function syncPadPresentation(){
    const signature = [
      document.body.dataset.screen || '',
      document.body.dataset.gameMode || '',
      document.body.dataset.geoMeasure || '',
      document.getElementById('qPrompt')?.textContent?.trim() || '',
      document.getElementById('rightPanel')?.style.display || ''
    ].join('|');

    if (!useMobilePadSheet()) {
      lastGameSignature = signature;
      setPadOpen(false);
      return;
    }

    if (signature !== lastGameSignature) {
      lastGameSignature = signature;
      setPadOpen(false);
      const mainInput = document.getElementById('mainInput');
      if (mainInput && getComputedStyle(mainInput).display !== 'none') {
        mainInput.setAttribute('placeholder', 'tik om keypad te openen');
      }
    }
  }

  function patchShowScreen(){
    if (window.__mobileGameReworkShowScreenPatched) return;
    const original = window.showScreen;
    if (typeof original !== 'function') return;

    window.showScreen = function patchedShowScreen(id){
      const result = original.apply(this, arguments);
      syncScreenState(id);
      syncGameState();
      syncPadPresentation();
      return result;
    };

    window.__mobileGameReworkShowScreenPatched = true;
  }

  function observeGameGrid(){
    const grid = document.getElementById('gameGrid');
    if (!grid || grid.__mobileGameReworkObserved) return;
    const mo = new MutationObserver(() => {
      syncGameState();
      syncPadPresentation();
    });
    mo.observe(grid, { attributes:true, attributeFilter:['class', 'style'], subtree:false });
    grid.__mobileGameReworkObserved = true;

    const prompt = document.getElementById('qPrompt');
    if (prompt && !prompt.__mobileGameReworkObserved) {
      const mo2 = new MutationObserver(syncPadPresentation);
      mo2.observe(prompt, { childList:true, subtree:true, characterData:true });
      prompt.__mobileGameReworkObserved = true;
    }
  }

  function patchGameControlsPlacement(){
    if (window.__mobilePlaceGameControlsPatched) return;
    const original = window.placeGameControls;
    if (typeof original !== 'function') return;

    window.placeGameControls = function patchedPlaceGameControls(wantsKeypad){
      return original.call(this, isMobileGameViewport() ? false : wantsKeypad);
    };

    window.__mobilePlaceGameControlsPatched = true;
  }

  function bindPadSheetInteractions(){
    const rpHead = document.querySelector('#rightPanel .rpHead');
    const padBtn = document.getElementById('btnPadToggle');

    const toggleHandler = (e) => {
      if (!isMobileGameViewport()) return;
      if (!useMobilePadSheet()) return;
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation?.();
      setPadOpen(!document.body.classList.contains('pad-open'));
    };

    if (rpHead && rpHead.dataset.sheetBound !== '1') {
      rpHead.dataset.sheetBound = '1';
      rpHead.addEventListener('click', toggleHandler, true);
    }

    if (padBtn && padBtn.dataset.sheetBound !== '1') {
      padBtn.dataset.sheetBound = '1';
      padBtn.addEventListener('click', toggleHandler, true);
    }

    if (!document.body.dataset.mobileSheetDocBound) {
      document.body.dataset.mobileSheetDocBound = '1';

      document.addEventListener('pointerdown', (e) => {
        const target = e.target;
        const input = target?.closest?.('#mainInput, [data-ratio-input], .fraction-overlay input');
        if (input && useMobilePadSheet()) {
          setPadOpen(true);
          return;
        }

        if (!document.body.classList.contains('pad-open')) return;
        const insideSheet = target?.closest?.('#rightPanel');
        if (!insideSheet && useMobilePadSheet()) {
          setPadOpen(false);
        }
      }, { passive:false });
    }
  }

  function init(){
    document.body.classList.add('mobile-game-rework');
    document.body.classList.toggle('mobile-device-layout', isMobileGameViewport());
    patchShowScreen();
    patchGameControlsPlacement();
    syncScreenState();
    syncGameState();
    syncPadPresentation();
    observeGameGrid();
    bindPadSheetInteractions();

    window.addEventListener('resize', () => {
      document.body.classList.toggle('mobile-device-layout', isMobileGameViewport());
      syncScreenState();
      syncGameState();
      syncPadPresentation();
      observeGameGrid();
      bindPadSheetInteractions();
    }, { passive:true });

    setTimeout(() => {
      patchShowScreen();
      patchGameControlsPlacement();
      syncScreenState();
      syncGameState();
      syncPadPresentation();
      observeGameGrid();
      bindPadSheetInteractions();
    }, 80);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once:true });
  } else {
    init();
  }
})();
