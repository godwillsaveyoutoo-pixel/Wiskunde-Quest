window.QuestionRenderers = (() => {
  function dom() {
    return window.GameState?.cacheDom?.() || {};
  }

  function has(sel, root = document) {
    try { return !!root.querySelector(sel); } catch (_) { return false; }
  }

  function isGeoQuestion(q, grid) {
    return !!(
      q?.geo === true ||
      q?.type === 'geo' ||
      grid?.classList?.contains('geoMeasureMode')
    );
  }

  function detectQuestionMode(q) {
    const d = dom();
    const grid = d.gameGrid || document.getElementById('gameGrid');

    if (!q) return 'idle';
    if (q.kind === 'mc') return 'mc';

    const hasRatioInputs = has('[data-ratio-input]');
    const hasFracInputs = has('.fraction-overlay input');
    const hasClockSettable = has('[data-clock-settable]');
    const domInline = hasRatioInputs || hasFracInputs || hasClockSettable;
    const inline = !!q.hasInlineInput || domInline;
    const clickOnly =
      typeof q.check === 'function' &&
      q.answer == null &&
      !hasRatioInputs &&
      !hasFracInputs &&
      !hasClockSettable &&
      q.inputKind == null;

    if (isGeoQuestion(q, grid)) return 'geo';
    if (clickOnly) return 'tap';
    if (inline) return 'inline';
    return 'input';
  }

  function ensureControlsBottom() {
    const d = dom();
    if (d.trayControlsSlot && d.gameControls && d.gameControls.parentElement !== d.trayControlsSlot) {
      d.trayControlsSlot.appendChild(d.gameControls);
    }
    if (d.trayControlsSlot) d.trayControlsSlot.classList.remove('hidden');
  }

  function clearChoices() {
    const d = dom();
    if (d.choices) d.choices.innerHTML = '';
  }

  function renderChoices(q) {
    const d = dom();
    if (!d.choices) return;
    clearChoices();
    (q.options || []).forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'choice';
      btn.dataset.key = (typeof window.mcKey === 'function' ? window.mcKey(opt) : String(opt ?? ''));
      btn.innerHTML = opt;
      btn.addEventListener('click', () => {
        d.choices.querySelectorAll('.choice').forEach(x => x.classList.remove('sel'));
        btn.classList.add('sel');
      });
      d.choices.appendChild(btn);
    });
  }

  function renderMc(q) {
    const d = dom();
    renderChoices(q);

    if (d.choices) d.choices.hidden = false;
    if (d.mcRow) {
      d.mcRow.hidden = false;
      d.mcRow.style.display = 'flex';
    }
    if (d.inputRow) {
      d.inputRow.hidden = true;
      d.inputRow.style.display = 'none';
      d.inputRow.classList.remove('clickOnly');
    }
    if (d.mainInput) {
      d.mainInput.hidden = true;
      d.mainInput.style.display = 'none';
    }
    if (d.unitChip) {
      d.unitChip.hidden = true;
      d.unitChip.style.display = 'none';
      d.unitChip.textContent = '';
    }
    if (d.keypadSheet) {
      d.keypadSheet.hidden = true;
      d.keypadSheet.style.display = 'none';
      d.keypadSheet.classList.remove('noKeypad', 'geoMeasureMode', 'collapsed');
    }
    if (d.sheetHint) d.sheetHint.textContent = '';
    window.ActionTray?.sync?.();
  }

  function configureMainInput(q, mode, wantsKeypad) {
    const d = dom();
    const inp = (window.activeInput || d.mainInput);
    if (!inp) return;

    inp.value = '';
    inp.disabled = false;
    inp.style.display = '';
    inp.hidden = false;
    inp.placeholder = 'antwoord';

    if (q.inputKind === 'time') {
      inp.inputMode = 'numeric';
      inp.placeholder = 'HH:MM';
      inp.autocomplete = 'off';
      inp.spellcheck = false;
    } else if (q.inputKind === 'fraction') {
      inp.inputMode = 'text';
      inp.placeholder = 'bv. 3/4';
    } else {
      inp.inputMode = wantsKeypad ? 'none' : 'decimal';
      inp.placeholder = 'antwoord';
    }

    if (mode === 'inline' || mode === 'tap' || mode === 'geo') {
      inp.hidden = true;
      inp.style.display = 'none';
    }
  }

  function renderInputLike(q, mode) {
    const d = dom();
    const hasRatioInputs = has('[data-ratio-input]');
    const hasFracInputs = has('.fraction-overlay input');
    const wantsKeypad = mode !== 'tap' && (
      q.inputKind === 'number' ||
      q.inputKind === 'time' ||
      q.inputKind === 'fraction' ||
      hasRatioInputs ||
      hasFracInputs ||
      mode === 'inline' ||
      mode === 'geo'
    );

    if (d.choices) {
      d.choices.hidden = true;
      d.choices.innerHTML = '';
    }
    if (d.mcRow) {
      d.mcRow.hidden = true;
      d.mcRow.style.display = 'none';
    }
    if (d.inputRow) {
      d.inputRow.hidden = false;
      d.inputRow.style.display = '';
      d.inputRow.classList.toggle('clickOnly', mode === 'tap');
    }

    configureMainInput(q, mode, wantsKeypad);

    if (d.unitChip) {
      const showUnit = !!(q.unit && mode !== 'tap');
      d.unitChip.hidden = !showUnit;
      d.unitChip.style.display = showUnit ? 'inline-flex' : 'none';
      d.unitChip.textContent = showUnit ? String(q.unit || '') : '';
    }

    if (typeof window.prepareGameKeypadInput === 'function' && d.mainInput) {
      window.prepareGameKeypadInput(d.mainInput, wantsKeypad && mode === 'input');
    }
    if (typeof window.prepareAllInlineGameInputs === 'function') {
      window.prepareAllInlineGameInputs(wantsKeypad);
    }

    if (d.keypadSheet) {
      d.keypadSheet.classList.remove('noKeypad');
      d.keypadSheet.classList.toggle('geoMeasureMode', mode === 'geo');
      if (mode === 'geo') d.keypadSheet.classList.remove('collapsed');
      d.keypadSheet.hidden = !wantsKeypad;
      d.keypadSheet.style.display = wantsKeypad ? 'grid' : 'none';
    }

    if (d.sheetHint) {
      d.sheetHint.textContent =
        q.inputKind === 'time' ? 'HH:MM (24u)' :
        q.inputKind === 'fraction' ? 'bv. 3/4' :
        '';
    }
  }

  function renderQuestion(q) {
    const d = dom();
    const mode = detectQuestionMode(q);

    window.GameState?.setCurrentQuestion?.(q || null);
    window.GameState?.setMode?.(mode);
    window.GameState?.setTray?.(mode === 'mc' ? 'expanded' : 'compact');

    if (d.gameGrid) {
      d.gameGrid.classList.toggle('mcMode', mode === 'mc');
      d.gameGrid.classList.toggle('inputMode', mode !== 'mc');
    }

    ensureControlsBottom();

    if (mode === 'mc') renderMc(q);
    else renderInputLike(q, mode);

    window.GameState?.syncFromDom?.();
    window.ActionTray?.sync?.();
    return mode;
  }

  function syncAfterRender(q) {
    if (!q) return syncIdle();
    renderQuestion(q);
  }

  function syncAfterNextQuestion() {
    const q = (typeof window.state !== 'undefined') ? window.state.currentQ : null;
    if (q) renderQuestion(q);
    else syncIdle();
  }

  function syncIdle() {
    const d = dom();
    window.GameState?.setCurrentQuestion?.(null);
    window.GameState?.setMode?.('idle');
    window.GameState?.setTray?.('compact');
    window.GameState?.setKeypadOpen?.(false);
    if (d.sheetHint) d.sheetHint.textContent = '';
    window.ActionTray?.sync?.();
  }

  return {
    detectQuestionMode,
    renderQuestion,
    syncAfterRender,
    syncAfterNextQuestion,
    syncIdle,
  };
})();
