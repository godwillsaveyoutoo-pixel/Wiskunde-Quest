/* =========================
   Wiskunde Quest – answer-flow.js
   Central answer collection / evaluation / outcome flow
========================= */

function normalizeAnswerText(raw) {
  return String(raw ?? "").replace(/−/g, "-").trim();
}

function currentQuestionMode(q) {
  try {
    return window.QuestionRenderers?.detectQuestionMode?.(q) || (q?.kind === 'mc' ? 'mc' : 'input');
  } catch (_) {
    return q?.kind === 'mc' ? 'mc' : 'input';
  }
}

function getSelectedChoiceElement() {
  return document.querySelector('.choice.sel');
}

function getPrimaryAnswerInput() {
  if (window.activeInput && typeof window.activeInput?.value !== 'undefined') return window.activeInput;

  const focused = document.activeElement;
  if (focused?.matches?.('#mainInput, [data-ratio-input], .fraction-overlay input')) {
    return focused;
  }

  const inlineRatio = document.querySelector('[data-ratio-input]');
  if (inlineRatio) return inlineRatio;

  const fractionInput = document.querySelector('.fraction-overlay input');
  if (fractionInput) return fractionInput;

  const main = document.getElementById('mainInput');
  if (main) return main;

  return null;
}

function collectAnswerPayload(q, incomingPayload = null) {
  const mode = currentQuestionMode(q);
  const input = getPrimaryAnswerInput();
  const raw = normalizeAnswerText(
    incomingPayload?.raw ??
    incomingPayload?.value ??
    input?.value ??
    ''
  );

  const selectedEl = getSelectedChoiceElement();

  return {
    mode,
    raw,
    input,
    selectedEl,
    selectedKey: selectedEl?.dataset?.key ?? '',
    selectedText: selectedEl ? normalizeAnswerText(selectedEl.textContent) : '',
    incoming: incomingPayload || null,
  };
}

function evaluateMultipleChoice(q, payload) {
  if (!payload.selectedEl) {
    return { checked: false, ok: false };
  }

  const answerKey = q.answerKey ?? (typeof mcKey === 'function' ? mcKey(q.answer) : String(q.answer ?? ''));
  return {
    checked: true,
    ok: String(payload.selectedKey ?? '') === String(answerKey ?? ''),
  };
}

function evaluateCustomCheck(q, payload) {
  try {
    return {
      checked: true,
      ok: !!q.check(payload.raw, payload.incoming, {
        mode: payload.mode,
        question: q,
        input: payload.input,
      })
    };
  } catch (err) {
    console.warn('Custom question check failed', err);
    return { checked: true, ok: false };
  }
}

function evaluateStructuredInput(q, payload) {
  if (q.inputKind === 'time') {
    const a = parseTimeNL(payload.raw);
    const b = parseTimeNL(q.answer);
    return {
      checked: true,
      ok: !!a && !!b && formatTime(a.h, a.m) === formatTime(b.h, b.m),
    };
  }

  if (q.inputKind === 'fraction') {
    const a = parseFractionNL(payload.raw);
    const b = parseFractionNL(q.answer);
    return {
      checked: true,
      ok: fractionEqual(a, b),
    };
  }

  const val = parseNumNL(payload.raw);
  return {
    checked: true,
    ok: !Number.isNaN(val) && Math.abs(val - q.answer) <= (q.tol ?? 0.01),
  };
}

function evaluateAnswer(q, payload) {
  if (q.kind === 'mc') return evaluateMultipleChoice(q, payload);
  if (typeof q.check === 'function') return evaluateCustomCheck(q, payload);
  return evaluateStructuredInput(q, payload);
}

function getGivenAnswerForLog(q, payload) {
  if (q.kind === 'mc') return payload.selectedText || '';
  return payload.raw;
}

function updateTestLogAfterCheck(q, ok, givenStr) {
  if (state.mode !== 'test') return;
  const li = q.__logIndex;
  if (li == null || !state.testLog[li]) return;
  state.testLog[li].given = String(givenStr ?? '');
  state.testLog[li].ok = !!ok;
  state.testLog[li].secs = Math.round((Date.now() - state.startedAt) / 1000);
}

function updateProgressAfterAnswer(q, ok) {
  try {
    if (state.mode !== 'test') {
      updateSkill?.(q.topic, q.skill, ok);
    }
    if (state.mode === 'practice') {
      const t = q.topic;
      if (t && t !== 'global') {
        prog.practice = prog.practice || {};
        const p = prog.practice[t] || { a: 0, c: 0 };
        p.a++;
        if (ok) p.c++;
        prog.practice[t] = p;
        saveProg?.();
      }
    }
  } catch (e) {
    console.warn('Progress update failed', e);
  }
}

function updateBadgesAfterAnswer(q, ok) {
  try {
    if (state.mode !== 'test') {
      const topicId = state.topic?.id || 'global';
      window.ensureBadgeStores?.(topicId);
      const bstats = window.badgeStatsFor?.(topicId) || {};

      if (ok) {
        const prevTotal = Number(bstats.totalOk || 0);
        if (prevTotal === 0) window.awardBadge?.('first_ok', topicId);
        bstats.totalOk = prevTotal + 1;

        state.streakQ = Number(state.streakQ || 0) + 1;
        bstats.streakBest = Math.max(Number(bstats.streakBest || 0), state.streakQ);

        if (state.streakQ === 5) window.awardBadge?.('streak_5', topicId);
        if (state.streakQ === 10) window.awardBadge?.('streak_10', topicId);

        if (state.mode === 'practice' && state.triesThisQ === 1) {
          bstats.comeback = Number(bstats.comeback || 0) + 1;
          if (bstats.comeback >= 3) window.awardBadge?.('comeback_3', topicId);
        }

        if (state.helpUsedThisQ) {
          bstats.helpOk = Number(bstats.helpOk || 0) + 1;
          if (bstats.helpOk >= 5) window.awardBadge?.('help_5', topicId);
        }

        if (state.correct === 10) window.awardBadge?.('lvl_2', topicId);
        if (state.correct === 20) window.awardBadge?.('lvl_3', topicId);
        if (state.correct === 30) window.awardBadge?.('lvl_4', topicId);
        if (state.correct === 40) window.awardBadge?.('lvl_5', topicId);

        saveProg?.();
        window.updateBadgePill?.();
      }
    }
  } catch (_) {}
}

function applyCorrectAnswerOutcome(q) {
  state.correct++;
  state.score++;
  $('#status').textContent = '✓ Juist';
  $('#status').className = 'status ok';

  if (state.mode === 'practice') {
    try { practiceAdvanceOnOk(); } catch (_) {}
  }
}

function applyIncorrectAnswerOutcome(q) {
  $('#status').textContent = q.sub || '✗ Fout';
  $('#status').className = 'status err';
}

function handlePracticeFailure(q) {
  state.triesThisQ++;

  if (state.triesThisQ < 2) {
    $('#status').textContent = '✗ Fout. Probeer opnieuw (poging ' + (state.triesThisQ + 1) + '/2)';
    $('#status').className = 'status err';
    state.submitLocked = false;
    try {
      if (!shouldUseGameKeypadOnly()) {
        $('#mainInput')?.focus();
        $('#mainInput')?.select();
      }
    } catch (_) {}
    return true;
  }

  state.streakQ = 0;
  try { practicePenaltyOnFail(); } catch (_) {}
  updateHud();
  const sol = formatCorrectAnswer(q);
  $('#status').textContent = sol ? `✗ Fout. Juiste antwoord: ${sol}` : '✗ Fout.';
  $('#status').className = 'status err';
  setTimeout(() => {
    nextQuestion();
    updateHud();
  }, 1600);
  return true;
}

function finalizeAnswerFlow(q, ok) {
  if (ok) {
    applyCorrectAnswerOutcome(q);
  } else {
    applyIncorrectAnswerOutcome(q);
  }

  updateProgressAfterAnswer(q, ok);
  updateBadgesAfterAnswer(q, ok);

  if (state.mode === 'test' && state.testCount && state.attempts >= state.testCount) {
    setTimeout(endGame, 350);
    return;
  }

  if (!ok && state.mode === 'practice') {
    if (handlePracticeFailure(q)) return;
  }

  if (!ok && state.mode === 'run') {
    state.streakQ = 0;
  }

  updateHud();
  setTimeout(nextQuestion, 650);
}

function submitAnswer(incomingPayload = null) {
  if (state.submitLocked || !state.currentQ) return;
  state.submitLocked = true;

  const q = state.currentQ;
  const payload = collectAnswerPayload(q, incomingPayload);
  const result = evaluateAnswer(q, payload);

  if (!result.checked) {
    state.submitLocked = false;
    return;
  }

  state.attempts++;

  const givenStr = getGivenAnswerForLog(q, payload);
  updateTestLogAfterCheck(q, result.ok, givenStr);
  finalizeAnswerFlow(q, result.ok);
}

window.GameSession = Object.assign(window.GameSession || {}, {
  submitAnswer,
});
window.AnswerFlow = Object.assign(window.AnswerFlow || {}, {
  normalizeAnswerText,
  collectAnswerPayload,
  evaluateAnswer,
  submitAnswer,
});
window.submitAnswer = submitAnswer;
