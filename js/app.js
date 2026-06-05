(function(){
  function syncScreen(detailId){
    const id = detailId || document.body?.dataset?.screen || '';

    if (id === 'scrGame') {
      try { window.QuestionRenderers?.syncAfterNextQuestion?.(); } catch (_) {}
    } else {
      try { window.QuestionRenderers?.syncIdle?.(); } catch (_) {}
    }

    try { window.ActionTray?.sync?.(); } catch (_) {}
  }

  function initRefactorUi(){
    try { window.GameState?.cacheDom?.(); } catch (_) {}
    try { window.GameState?.exposeLegacyGlobals?.(); } catch (_) {}
    try { window.ActionTray?.init?.(); } catch (_) {}
    try { window.GameControls?.init?.(); } catch (_) {}
    try { window.MapScreen?.init?.(); } catch (err) { console.warn('MapScreen init failed', err); }
    try { window.TestSetup?.init?.(); } catch (err) { console.warn('TestSetup init failed', err); }

    document.addEventListener('app:screenchange', (e) => {
      syncScreen(e?.detail?.id || '');
    });

    window.addEventListener('resize', () => {
      try { window.ActionTray?.sync?.(); } catch (_) {}
    }, { passive: true });

    setTimeout(() => syncScreen(document.body?.dataset?.screen || ''), 80);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRefactorUi, { once:true });
  } else {
    initRefactorUi();
  }
})();
