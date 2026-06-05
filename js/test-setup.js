/* =========================
   Wiskunde Quest – test-setup.js
   Toets setup & launch
========================= */
(function(){
  function wireSeg(segId) {
    const seg = document.getElementById(segId);
    if (!seg || seg.dataset.wired === '1') return;
    seg.dataset.wired = '1';
    seg.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      seg.querySelectorAll('button').forEach((b) => b.classList.remove('on'));
      btn.classList.add('on');
    });
  }

  async function startPendingTest() {
    if (!window.__pendingTestTopic) return;

    const count = document.querySelector('#testCountSeg .on')?.dataset.n ?? 20;
    const time = document.querySelector('#testTimeSeg .on')?.dataset.t ?? 0;

    let identity = null;
    try {
      if (window.MR_SHARED?.askName) {
        identity = await window.MR_SHARED.askName('toets', {
          fixedClass: '1B',
          hideClass: true,
          extraFlags: [
            { id: 'dyscalculie', label: 'Ik heb dyscalculie', checked: false }
          ]
        });
      }
    } catch (e) {
      console.warn('askName failed', e);
    }

    window.startGame?.({
      topic: {
        id: window.__pendingTestTopic.id,
        title: window.__pendingTestTopic.title,
      },
      mode: 'test',
      limit: Number(time) * 1000,
      count: Number(count) || 20,
      identity: identity && typeof identity === 'object'
        ? identity
        : { name: identity || '', class: '', flags: {} },
    });
  }

  function init() {
    wireSeg('testCountSeg');
    wireSeg('testTimeSeg');

    const backBtn = document.getElementById('btnBackFromTestSetup');
    if (backBtn && backBtn.dataset.wired !== '1') {
      backBtn.dataset.wired = '1';
      backBtn.addEventListener('click', () => {
        window.showScreen?.('scrMap');
      });
    }

    const startBtn = document.getElementById('btnStartTest');
    if (startBtn && startBtn.dataset.wired !== '1') {
      startBtn.dataset.wired = '1';
      startBtn.addEventListener('click', startPendingTest);
    }
  }

  window.TestSetup = { init, startPendingTest };
})();
