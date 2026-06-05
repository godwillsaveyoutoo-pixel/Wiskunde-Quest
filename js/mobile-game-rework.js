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

  function forceKeypadOpenOnMobile(){
    const rp = document.getElementById('rightPanel');
    const padT = document.getElementById('btnPadToggle');
    if (!rp) return;
    if (isMobileGameViewport()) {
      rp.classList.remove('collapsed');
      if (padT) padT.textContent = '▾';
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
      forceKeypadOpenOnMobile();
      return result;
    };

    window.__mobileGameReworkShowScreenPatched = true;
  }

  function observeGameGrid(){
    const grid = document.getElementById('gameGrid');
    if (!grid || grid.__mobileGameReworkObserved) return;
    const mo = new MutationObserver(() => {
      syncGameState();
      forceKeypadOpenOnMobile();
    });
    mo.observe(grid, { attributes:true, attributeFilter:['class'] });
    grid.__mobileGameReworkObserved = true;
  }

  function init(){
    document.body.classList.add('mobile-game-rework');
    document.body.classList.toggle('mobile-device-layout', isMobileGameViewport());
    patchShowScreen();
    syncScreenState();
    syncGameState();
    forceKeypadOpenOnMobile();
    observeGameGrid();

    window.addEventListener('resize', () => {
      document.body.classList.toggle('mobile-device-layout', isMobileGameViewport());
      syncScreenState();
      syncGameState();
      forceKeypadOpenOnMobile();
    }, { passive:true });

    // Sommige bestaande scripts tonen schermen pas net na DOMContentLoaded.
    setTimeout(() => {
      patchShowScreen();
      syncScreenState();
      syncGameState();
      forceKeypadOpenOnMobile();
      observeGameGrid();
    }, 80);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once:true });
  } else {
    init();
  }
})();
