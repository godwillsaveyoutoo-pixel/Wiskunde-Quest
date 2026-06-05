/* =========================
   Wiskunde Quest – game-session.js
   Extracted session / render / input flow from game.js
========================= */

function syncRefactorUi(q = state?.currentQ || null) {
  try { window.GameState?.cacheDom?.(); } catch (_) {}
  try { window.GameState?.setCurrentQuestion?.(q || null); } catch (_) {}
  try {
    if (q) {
      const mode = window.QuestionRenderers?.detectQuestionMode?.(q) || 'input';
      window.GameState?.setMode?.(mode);
      window.GameState?.setTray?.(mode === 'mc' ? 'expanded' : 'compact');
      window.GameState?.syncFromDom?.();
    } else {
      window.QuestionRenderers?.syncIdle?.();
    }
  } catch (_) {}
  try { window.ActionTray?.sync?.(); } catch (_) {}
}

function startGame({ topic, mode, limit = 0, count = 0, identity = null }) {
  // ---------- Basis state ----------
  state.mode = mode;
  state.topic = topic;

  // 🔁 belangrijk: automatisch gekozen logica resetten
  state.subtopic = null;
  state.level = null;
  state.recentQKeys = [];

  state.currentQ = null;
  state.score = 0;
  state.attempts = 0;
  state.correct = 0;
  state.submitLocked = false;
  state.triesThisQ = 0;
  state.helpUsedThisQ = false;
  state.tier = 1;
  state.usedQScopes = {};

  // oefenmodus: niveaus met terugval (alleen practice)
  state.practiceTier = 1;
  state.practiceProg = 0;

  // badges/session trackers
  state.helpUsedThisQ = false;
  state.streakQ = 0;

  // ---------- Timer ----------
  // ---------- Timer ----------
  state.timeLimitMs = limit;
  state.timeLeftMs = limit;
  state.startedAt = Date.now();

  // ---------- Toetsmodus ----------
  state.testCount = Number(count) || 0;
  state.testLog = [];
  state.identity = identity;
  state.proofDone = false;

  // Seeded RNG + toets-ID (alleen toetsmodus)
  if (mode === "test") {
    state.seed = (Date.now() ^ ((Math.random() * 1e9) | 0)) >>> 0;
    state.testId = makeTestId(state.seed);
    state._rng = makeRng(state.seed);
  } else {
    state.seed = 0;
    state.testId = "";
    state._rng = null;
  }

  // onthoud voor "Nog eens"
  state.lastStart = {
    topic: { id: topic.id, title: topic.title },
    mode,
    limit: limit || 0,
    count: Number(count) || 0,
    identity,
    seed: state.seed,
    testId: state.testId,
  };

  // ---------- UI ----------

  const modeLabel =
    mode === "practice" ? "Oefenen"
    : mode === "run"    ? "Run"
    :                     "Toets";

  const pillMode = document.getElementById('pillMode');
  if (pillMode){
    pillMode.style.display = 'inline-flex';
    pillMode.textContent = modeLabel;
  }

  // ---------- Start ----------
  showScreen("scrGame");
  syncRefactorUi(null);

  // Topbar titel: toon topic tijdens spelen
  try{ window.setBrandTitle?.(topic?.title || "Wiskunde Quest"); }catch(_){}

  if (limit) startTimer();
  updateHud();
  nextQuestion();
}

function nextQuestion() {
  state.submitLocked = false;
  state.triesThisQ = 0;
  state.helpUsedThisQ = false;

  // reset UI
  $("#status").textContent = "";
  $("#choices").innerHTML = "";
  const choicesEl = $("#choices");
  const inputRowEl = $("#inputRow");
  const mcRowEl = $("#mcRow");
  const mainInputEl = $("#mainInput");
  const unitChipEl = $("#unitChip");
  const keypadSheetEl = $("#keypadSheet");
  if (choicesEl) choicesEl.hidden = true;
  if (inputRowEl) {
    inputRowEl.hidden = true;
    inputRowEl.style.display = "none";
  }
  if (mcRowEl) {
    mcRowEl.hidden = true;
    mcRowEl.style.display = "none";
  }
  if (mainInputEl) mainInputEl.hidden = false;
  if (unitChipEl) unitChipEl.hidden = true;
  if (keypadSheetEl) keypadSheetEl.hidden = true;
  $("#visualWrap").style.display = "none";
  $("#visualWrap").innerHTML = "";

  // reset actieve input (voor keypad)
  activeInput = null;

  const q = pickQuestion();
  if (!q) {
    console.warn("Geen vraag gevonden voor topic:", state.topic.id);
    return;
  }

  state.currentQ = q;
  // toetslog: maak alvast een rij (zodat ook 'niet beantwoord' kan bestaan indien tijd op is)
  if (state.mode === "test") {
    const correctStr =
      q.kind === "mc" ? String(q.answer ?? "") :
      q.answer != null ? String(q.answer) : "";

    const idx = state.testLog.length;
    state.testLog.push({
      q: String(q.prompt || ""),
      correct: correctStr,
      given: "",
      ok: null,
      points: 1,
      secs: Math.round((Date.now() - state.startedAt) / 1000),
    });
    q.__logIndex = idx;
  }

  updateHud();

  // prompt (ondersteunt ook rijke HTML voor visueel sterkere vragen)
  const promptEl = $("#qPrompt");
  if (promptEl) {
    const formattedPrompt =
      q.promptHtml ||
      (typeof window.WQ_formatQuestionPrompt === "function"
        ? window.WQ_formatQuestionPrompt(q)
        : null);

    promptEl.classList.toggle("richPrompt", !!formattedPrompt);
    if (formattedPrompt) promptEl.innerHTML = formattedPrompt;
    else promptEl.textContent = q.prompt;
    promptEl.dataset.topic = q.topic || "";
    promptEl.dataset.skill = q.skill || "";
    promptEl.dataset.promptClass = q.promptClass || "";
  }
  $("#qSub").style.display = q.sub ? "block" : "none";
  $("#qSub").textContent = q.sub || "";

  // visual: ondersteunt zowel oud (visualHtml) als nieuw (visual)
  const visual =
    q.visual ??
    q.visualHtml ??
    null;

  if (visual) {
    $("#visualWrap").innerHTML = visual;
    $("#visualWrap").style.display = "grid";
  } else {
    $("#visualWrap").innerHTML = "";
    $("#visualWrap").style.display = "none";
  }
  if (visual) {
    const wraps = $("#visualWrap").querySelectorAll(".svgSafeWrap");
    if (wraps.length > 1) {
      wraps.forEach((w, idx) => {
        if (idx > 0) w.style.display = "none";
      });
    }
  }

  const isGeoMeasure =
    (q.topic === "lijnen" && String(q.skill || "").includes("meten")) ||
    (q.topic === "hoeken" && String(q.skill || "").includes("geo_meet")) ||
    (typeof visual === "string" && visual.includes("geoScene"));

  const gameGrid = document.getElementById("gameGrid");
  const visualWrapEl = document.getElementById("visualWrap");
  const bodyInner = document.getElementById("panelBodyInner");
  if (gameGrid) gameGrid.classList.toggle("geoMeasureMode", !!isGeoMeasure);
  if (visualWrapEl) visualWrapEl.classList.toggle("geoMeasureMode", !!isGeoMeasure);
  if (bodyInner) {
    bodyInner.classList.toggle("noVisual", !visual);
    bodyInner.classList.toggle("geoMeasureMode", !!isGeoMeasure);
  }

  // layout hint: als er een visual is, geef die meer ruimte (compact laptop-friendly)
  const panelEl = document.querySelector('#scrGame .panel');
  if (panelEl) {
    panelEl.classList.toggle('withVisual', !!visual);
    panelEl.classList.toggle('geoMeasureMode', !!isGeoMeasure);
    // panelhead is verwijderd: vraag blijft altijd in body
    panelEl.classList.remove('promptInHead');
    panelEl.dataset.topic = q.topic || '';
    panelEl.dataset.skill = q.skill || '';
  }


  // render vraagtype via centrale renderer
  if (window.QuestionRenderers?.renderQuestion) {
    window.QuestionRenderers.renderQuestion(q);
  } else if (q.kind === "mc") {
    renderMC(q);
  } else {
    renderInput(q);
  }

  // 🔧 activeer interactieve tijd-widgets (sleepklok)
  try {
    window.initInteractiveTimeWidgets?.(document.getElementById("visualWrap"));
  } catch (e) {
    console.warn("initInteractiveTimeWidgets failed", e);
  }


  // 🔑 ratio-inputs registreren voor keypad
  const ratioInputs = document.querySelectorAll("[data-ratio-input]");
  if (ratioInputs.length) {
    ratioInputs.forEach(inp => {
      prepareGameKeypadInput(inp, true);
      inp.addEventListener("focus", () => {
        activeInput = inp;
      });
      inp.addEventListener("pointerdown", () => {
        activeInput = inp;
      });
    });

    // Op smartphone NIET automatisch focussen, want dat kan het telefoontoetsenbord openen.
    activeInput = ratioInputs[0];
    if (!shouldUseGameKeypadOnly()) {
      ratioInputs[0].focus();
    }
  }

  syncRefactorUi(q);

  schedulePanelBodyFit();
  const inner = document.getElementById("panelBodyInner");
  if (inner) {
    inner.querySelectorAll("img").forEach((img) => {
      if (img.complete) return;
      img.addEventListener("load", schedulePanelBodyFit, { once: true });
    });
  }
}

function tierFromCorrect(correct) {
  const c = Math.max(0, Number(correct) || 0);
  return Math.min(5, Math.floor(c / 10) + 1);
}

function pickQuestion() {
  const topicBank = BANK[state.topic.id];
  if (!topicBank) {
    console.warn("Geen topic:", state.topic.id);
    return null;
  }

  const subtopicKeys = state.subtopic ? [state.subtopic] : Object.keys(topicBank);
  const candidates = [];

  // ---------- Oefenen + Run: vaste progressie (5 niveaus) ----------
  if (state.mode === "practice" || state.mode === "run") {
    const tier = (state.mode === "practice")
      ? Math.max(1, Math.min(5, Number(state.practiceTier || 1)))
      : tierFromCorrect(state.correct);
    state.tier = tier;

    const chain =
      tier <= 2 ? ["easy"] :
      tier === 3 ? ["normal", "easy"] :
      ["hard", "normal", "easy"]; // tier 4-5

    const wrap = (fn, lv) => {
      const base = (lv === "easy") ? 2 : (lv === "normal") ? 3 : 4;
      const hint = fn?._tier ?? base; // custom factories kunnen _tier zetten (1..5)
      const w = () => {
        const q = fn();
        if (q && q.tier == null) q.tier = hint;
        return q;
      };
      w._tierHint = hint;
      return w;
    };

    for (const subKey of subtopicKeys) {
      const sub = topicBank[subKey];
      if (!sub || typeof sub !== "object") continue;
      for (const lv of chain) {
        if (Array.isArray(sub[lv]) && sub[lv].length) {
          candidates.push(...sub[lv].map((fn) => wrap(fn, lv)));
        }
      }
    }

    if (!candidates.length) {
      console.warn("Geen vragen:", state.topic.id);
      return null;
    }

    // Tier-filter (zodat niveau 1 echt makkelijk blijft)
    const by = (pred) => candidates.filter((f) => pred(f._tierHint ?? 3));
    let filtered = candidates;
    if (tier === 1) {
      filtered = by((t) => t === 1);
      if (!filtered.length) filtered = by((t) => t === 2);
    } else if (tier === 2) {
      filtered = by((t) => t <= 2);
    } else if (tier === 3) {
      filtered = by((t) => t === 3);
      if (!filtered.length) filtered = by((t) => t <= 2);
    } else if (tier === 4) {
      filtered = by((t) => t === 4);
      if (!filtered.length) filtered = by((t) => t === 3);
    } else {
      // tier 5
      filtered = by((t) => t >= 5);
      if (!filtered.length) filtered = by((t) => t === 4);
      if (!filtered.length) filtered = candidates;
    }

    return pickNonRepeated(filtered, { scopeKey: `${state.topic.id}|${state.subtopic || "all"}` });
  }

  // ---------- Toets: accuracy-gestuurd (bestaand gedrag) ----------
  const acc = state.attempts
    ? Math.round((state.correct / state.attempts) * 100)
    : 60;

  const wanted = levelFromAccuracy(acc);
  const chain =
    wanted === "hard" ? ["hard", "normal", "easy"] :
    wanted === "normal" ? ["normal", "easy"] :
    ["easy"];

  for (const subKey of subtopicKeys) {
    const sub = topicBank[subKey];
    if (!sub || typeof sub !== "object") continue;

    let picked = null;
    for (const lv of chain) {
      if (Array.isArray(sub[lv]) && sub[lv].length) {
        picked = lv;
        break;
      }
    }
    // laatste redmiddel: eender welk level dat wél gevuld is
    if (!picked) {
      for (const lv of ["easy", "normal", "hard"]) {
        if (Array.isArray(sub[lv]) && sub[lv].length) {
          picked = lv;
          break;
        }
      }
    }

    if (picked) candidates.push(...sub[picked]);
  }

  if (!candidates.length) {
    console.warn("Geen vragen:", state.topic.id);
    return null;
  }

  return pickNonRepeated(candidates, { scopeKey: `${state.topic.id}|${state.subtopic || "all"}` });
}

function pickNonRepeated(fns, opts = {}) {
  if (!Array.isArray(fns) || !fns.length) return null;

  const scopeKey = opts.scopeKey ?? "global";
  state.usedQScopes = state.usedQScopes || {};
  const scope = state.usedQScopes[scopeKey] || (state.usedQScopes[scopeKey] = { used: new Set(), recent: [] });

  const keyOf = (q) => {
    const topic = q?.topic ?? "";
    const skill = q?.skill ?? q?.id ?? "";
    const prompt = (q?.prompt ?? "").trim();
    const answer = q?.answer != null ? String(q.answer) : "";
    return `${topic}|${skill}|${prompt}|${answer}`;
  };

  const maxTries = Math.min(80, fns.length * 6);

  for (let i = 0; i < maxTries; i++) {
    const r = (state._rng ? state._rng() : Math.random());
    const fn = fns[Math.floor(r * fns.length)];
    let q;
    try {
      q = fn();
    } catch (e) {
      console.warn("Question factory crashed:", e);
      continue;
    }
    if (!q) continue;

    const k = keyOf(q);

    if (fns.length === 1) {
      scope.used.add(k);
      scope.recent.push(k);
      if (scope.recent.length > 10) scope.recent.shift();
      return q;
    }

    if (!scope.used.has(k)) {
      scope.used.add(k);
      scope.recent.push(k);
      if (scope.recent.length > 10) scope.recent.shift();
      return q;
    }

    // zachte fallback: niet in de laatste 10
    if (!scope.recent.includes(k)) {
      scope.used.add(k);
      scope.recent.push(k);
      if (scope.recent.length > 10) scope.recent.shift();
      return q;
    }
  }

  // Alles lijkt opgebruikt of heel gelijkaardig: reset alleen deze scope
  scope.used.clear();
  scope.recent.length = 0;

  const fallbackFn = fns[Math.floor(Math.random() * fns.length)];
  const q = fallbackFn ? fallbackFn() : null;
  if (q) {
    const k = keyOf(q);
    scope.used.add(k);
    scope.recent.push(k);
    if (scope.recent.length > 10) scope.recent.shift();
  }
  return q;
}

function renderMC(q) {
  if (window.QuestionRenderers?.renderQuestion) {
    window.QuestionRenderers.renderQuestion(q);
    return;
  }
}

function renderInput(q) {
  if (window.QuestionRenderers?.renderQuestion) {
    window.QuestionRenderers.renderQuestion(q);
    return;
  }
}

function stopGame() {
  clearInterval(state.timer);
  state.timer = null;
  state.submitLocked = true;

  // UI terug naar rusttoestand voor we het scherm verlaten
  syncRefactorUi(null);

  // In toets/run wil "Stop" afronden i.p.v. stil terugkeren
  if (state.mode === "test" || state.mode === "run") {
    endGame();
    return;
  }
  showScreen("scrMap");
}

function formatCorrectAnswer(q) {
  if (!q) return "";
  if (q.kind === "mc") {
    const raw = String(q.answer ?? "");
    if (typeof window.WQ_describeMcAnswer === "function") return window.WQ_describeMcAnswer(raw);
    return raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  }
  const unit = q.unit ? ` ${q.unit}` : "";
  if (q.inputKind === "time") return String(q.answer ?? "");
  if (q.inputKind === "fraction") return String(q.answer ?? "");
  if (typeof q.answer === "number") return formatNL(q.answer) + unit;
  return String(q.answer ?? "") + unit;
}

function shouldUseGameKeypadOnly() {
  try {
    return !!window.matchMedia?.("(hover: none), (pointer: coarse), (max-width: 900px)")?.matches;
  } catch (_) {
    return false;
  }
}

function prepareGameKeypadInput(el, wantsKeypad = true) {
  if (!el) return;
  const lock = !!wantsKeypad && shouldUseGameKeypadOnly();

  if (lock) {
    el.readOnly = true;
    el.setAttribute("readonly", "readonly");
    el.setAttribute("inputmode", "none");
    el.inputMode = "none";
    el.autocomplete = "off";
    el.spellcheck = false;
    el.classList.add("gameNoNativeKeyboard");

    if (el.dataset.noNativeKeyboardBound !== "1") {
      el.dataset.noNativeKeyboardBound = "1";

      el.addEventListener("pointerdown", (e) => {
        // Niet het Android/iOS-keyboard openen; wel dit veld als doel voor de game-keypad gebruiken.
        activeInput = el;
        e.preventDefault();
        try { el.focus({ preventScroll: true }); } catch (_) { try { el.focus(); } catch (_) {} }
      }, { passive: false });

      el.addEventListener("click", (e) => {
        activeInput = el;
        if (shouldUseGameKeypadOnly()) e.preventDefault();
      });

      el.addEventListener("focus", () => {
        activeInput = el;
      });
    }
  } else {
    if (el.classList.contains("gameNoNativeKeyboard")) {
      el.readOnly = false;
      el.removeAttribute("readonly");
      el.classList.remove("gameNoNativeKeyboard");
    }
  }
}

function prepareAllInlineGameInputs(wantsKeypad = true) {
  document
    .querySelectorAll("[data-ratio-input], .fraction-overlay input")
    .forEach((el) => prepareGameKeypadInput(el, wantsKeypad));
}

/* moved to js/answer-flow.js: submitAnswer */


function startTimer() {
  clearInterval(state.timer);
  state.timer = setInterval(() => {
    state.timeLeftMs -= 1000;
        updateHud();
    if (state.timeLeftMs <= 0) endGame();
  }, 1000);
}

function endGame() {
  clearInterval(state.timer);

  const acc = state.attempts
    ? Math.round((state.correct / state.attempts) * 100)
    : 0;

  const duration_ms = Math.max(0, Date.now() - (state.startedAt || Date.now()));

  // 🏆 Run: medaille + best run + leaderboard post
  if (state.mode === "run") {
    try {
      const topicId = state.topic?.id || "";
      const medal = typeof medalForScore === "function"
        ? medalForScore(state.score)
        : "";

      const medalRank = (m) =>
        m === "gold" ? 3 : m === "silver" ? 2 : m === "bronze" ? 1 : 0;

      // 🎖️ badges: run + medaille
      try {
        window.ensureBadgeStores?.(topicId);
        const bstats = window.badgeStatsFor?.(topicId) || {};
        bstats.runs = Number(bstats.runs || 0) + 1;
        if (bstats.runs === 1) window.awardBadge?.("runner_1", topicId);
        if (medal === "bronze" || medal === "silver" || medal === "gold") {
          bstats.medals = bstats.medals || { bronze: 0, silver: 0, gold: 0 };
          bstats.medals[medal] = Number(bstats.medals[medal] || 0) + 1;
          window.awardBadge?.("medal_" + medal, topicId);
        }
      } catch (_) {}

      // bestRun update
      prog.bestRun = prog.bestRun || {};
      const prev = prog.bestRun[topicId];
      const isBetter = !prev
        || state.score > (prev.score ?? -1)
        || (state.score === (prev.score ?? -1) && acc > (prev.acc ?? -1))
        || (state.score === (prev.score ?? -1) && acc === (prev.acc ?? -1) && duration_ms < (prev.duration_ms ?? 9e15));

      if (isBetter) {
        prog.bestRun[topicId] = {
          score: state.score,
          acc,
          duration_ms,
          at: Date.now(),
          medal,
        };
      }

      // medaille only upgrade
      if (topicId && topicId !== "global") {
        prog.medals = prog.medals || {};
        const prevMedal = prog.medals[topicId] || "";
        if (medalRank(medal) > medalRank(prevMedal)) {
          prog.medals[topicId] = medal;
        }
      }

      saveProg?.();

      // leaderboard
      const mode = topicId === "global" ? "global" : "topic";
      const topic = topicId === "global" ? "global" : topicId;
      window.postScore?.({ mode, topic, score: state.score, acc, duration_ms });
      window.refreshBoards?.();

      // toon status op resultaatregel (eenmalig, met vertraging)
      setTimeout(() => {
        const line = document.getElementById("resLine");
        if (!line || line.dataset.scoreStatus) return;
        if (!window.lastScoreAttempted) return;
        const st = window.lastScoreStatus || "";
        const err = window.lastScoreError || "";
        let tail = "";
        if (st === "ok") tail = " | scoreboard: ok";
        else if (st === "blocked" || st === "fout") {
          const msg = err ? String(err).slice(0, 80) : "onbekend";
          tail = ` | scoreboard: fout (${msg})`;
        } else if (st) {
          tail = ` | scoreboard: ${st}`;
        }
        if (tail) {
          line.textContent += tail;
          line.dataset.scoreStatus = "1";
        }
      }, 800);
    } catch (e) {
      console.warn("Run finalize failed", e);
    }
  }

  $("#resTitle").textContent =
    state.mode === "test" ? "Toetsresultaat" : "Resultaat";

  // resultaatregel (met medaille waar relevant)
  let extra = "";
  if (state.mode === "run") {
    try {
      const topicId = state.topic?.id || "";
      const medal = prog?.medals?.[topicId] || (typeof medalForScore === "function" ? medalForScore(state.score) : "");
      const em = medalEmoji?.(medal) || "";
      if (em) extra = ` • Medaille: ${em}`;
    } catch (_) {}
  }
  $("#resLine").textContent = `Score: ${state.score} • ${acc}% juist${extra}`;

  // Supabase: log run-sessie (samenvatting)
  if (state.mode === "run") {
    try {
      const elapsedSec = Math.round((Date.now() - state.startedAt) / 1000);
      const nm = state.identity?.name || window.profile?.name || window.profile?.username || "";
      const cls = state.identity?.class || window.profile?.class || "1B";
      const summaryRun = {
        name: nm,
        class: cls,
        mode: "run",
        topicId: state.topic?.id || "",
        seconds: elapsedSec,
        timeLimitSec: Math.round((state.timeLimitMs || 0) / 1000),
        score: state.score,
        total: state.attempts,
        correct: state.correct,
        pct: state.attempts ? Math.round((state.correct / state.attempts) * 100) : 0,
      };
      if (typeof window.logTestRun === "function") {
        window.logTestRun(summaryRun);
      }
    } catch (_) {}
  }


  // Bewijsje (toetsmodus): automatisch downloaden na afloop
  if (state.mode === "test" && !state.proofDone) {
    state.proofDone = true;

    try {
      // vul onbeantwoorde rijen aan
      state.testLog.forEach(r => {
        if (r && r.ok == null) { r.ok = false; r.given = r.given || "—"; }
      });

      const metaId = document.querySelector('meta[name="x-game-id"]')?.content || document.title || "Wiskunde Quest";
      const elapsedSec = Math.round((Date.now() - state.startedAt) / 1000);

      const nm =
        state.identity?.name ||
        window.profile?.name ||
        window.profile?.username ||
        "";

      const cls =
        state.identity?.class ||
        window.profile?.class ||
        "";

      const flags = (state.identity && typeof state.identity === "object" && state.identity.flags) ? state.identity.flags : {};

      const goals = [
        `Topic: ${state.topic?.title || "—"}`,
        `Aantal vragen: ${state.testCount || state.testLog.length}`,
        `Tijdslimiet: ${state.timeLimitMs ? msToClock(state.timeLimitMs) : "geen"}`
      ];

      const summary = {
        name: nm,
        class: cls,
        gameId: metaId,
        mode: "toets",
        seconds: elapsedSec,
        timeLimitSec: Math.round((state.timeLimitMs || 0) / 1000),
        score: state.score,
        total: state.testCount || state.testLog.length,
        testId: state.testId || "",
        seed: state.seed || 0,
        goals,
        flags,
        accommodations: flags?.dyscalculie ? ["dyscalculie"] : [],
        questions: state.testLog.map(r => ({
          q: r.q,
          correct: r.correct,
          given: r.given,
          ok: r.ok,
          points: r.points,
          secs: r.secs
        }))
      };

      // Hash + JSON export (anti-discussie + voor jouw administratie)
      (async () => {
        try{
          summary.hash = await computeProofHash(summary);
        }catch(_){}
        try{
          window.MR_SHARED?.trySharedProof?.(summary);
        }catch(_){}
        // Supabase: log toetsresultaat (handig voor dashboards)
        try{
          if (typeof window.logTestRun === 'function') {
            await window.logTestRun(summary);
            const line = document.getElementById("resLine");
            if (line && !line.dataset.logStatus && window.lastTestRunStatus) {
              line.textContent += ` | log: ${window.lastTestRunStatus}`;
              line.dataset.logStatus = "1";
            }
          }
        }catch(_){}
        try{
          const base = String(nm||"leerling").trim().replace(/[^\w\s-]+/g,"").replace(/\s+/g,"_").slice(0,80) || "leerling";
          const fn = `bewijs_${base}_${(cls||"").toString().replace(/\s+/g,"_")}_${(summary.testId||"toets")}.json`;
          const blob = new Blob([JSON.stringify(summary, null, 2)], { type: "application/json" });
          const a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = fn.replace(/_+/g,"_");
          document.body.appendChild(a);
          a.click();
          setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 1500);
        }catch(_){}
      })();
;
    } catch (e) {
      console.warn("Proof generation failed", e);
    }
  }

  syncRefactorUi(null);
  showScreen("scrResult");
}

function practiceAdvanceOnOk(){
  if (state.mode !== 'practice') return;
  const tier = Math.max(1, Math.min(5, Number(state.practiceTier || 1)));
  let prog = Math.max(0, Number(state.practiceProg || 0));

  if (tier < 5) {
    prog += 1;
    if (prog >= 10) {
      state.practiceTier = tier + 1;
      state.practiceProg = 0;
    } else {
      state.practiceTier = tier;
      state.practiceProg = prog;
    }
  } else {
    state.practiceTier = 5;
    state.practiceProg = Math.min(10, prog + 1);
  }
}

function practicePenaltyOnFail(){
  if (state.mode !== 'practice') return;
  const tier = Math.max(1, Math.min(5, Number(state.practiceTier || 1)));
  const prev = Math.max(0, Number(state.practiceProg || 0));
  if (prev <= 0) return;

  const next = prev - 1;
  state.practiceProg = next;

  // terugval enkel wanneer je van 1 -> 0 gaat (dus na minstens 1 juiste binnen dit niveau)
  if (tier > 1 && prev === 1) {
    state.practiceTier = tier - 1;
    state.practiceProg = 0;
  }
}

function updateLvlTop(){
  const el = document.getElementById('lvlTop');
  if (!el) return;

  const show = (state.mode === 'practice' || state.mode === 'run');
  el.style.display = show ? '' : 'none';
  if (!show) return;

  let tier = 1;
  let within = 0;

  if (state.mode === 'run') {
    tier = tierFromCorrect(state.correct);
    within = Math.max(0, state.correct - (tier - 1) * 10);
    if (tier >= 5) within = Math.max(0, state.correct - 40);
    within = Math.min(10, within);
  } else {
    tier = Math.max(1, Math.min(5, Number(state.practiceTier || 1)));
    within = Math.min(10, Math.max(0, Number(state.practiceProg || 0)));
  }

  const pct = Math.round((within / 10) * 100);
  try { el.title = `Niveau ${tier}/5 • ${within}/10`; } catch (_) {}

  const badge = document.getElementById('lvlBadge');
  if (badge) badge.textContent = String(tier);

  const palette = [
    { accent: "#60a5fa", fill: "#3b82f6", fill2: "#60a5fa" },
    { accent: "#34d399", fill: "#10b981", fill2: "#34d399" },
    { accent: "#fbbf24", fill: "#f59e0b", fill2: "#fbbf24" },
    { accent: "#fb7185", fill: "#f43f5e", fill2: "#fb7185" },
    { accent: "#a78bfa", fill: "#8b5cf6", fill2: "#a78bfa" }
  ];
  const pal = palette[Math.max(0, Math.min(palette.length - 1, tier - 1))] || palette[0];
  el.style.setProperty('--lvl-accent', pal.accent);
  el.style.setProperty('--lvl-fill', pal.fill);
  el.style.setProperty('--lvl-fill-2', pal.fill2);

  const f = document.getElementById('lvlFill');
  if (f) f.style.width = pct + '%';
}

function schedulePanelBodyFit(){
  if (panelBodyFitRaf) cancelAnimationFrame(panelBodyFitRaf);
  panelBodyFitRaf = requestAnimationFrame(fitPanelBody);
}

function fitPanelBody(){
  const body = document.querySelector("#scrGame .panelBody");
  const inner = document.getElementById("panelBodyInner");
  if (!body || !inner) return;

  inner.style.transform = "scale(1)";

  const availableH = body.clientHeight;
  const availableW = body.clientWidth;
  const contentH = inner.scrollHeight;
  const contentW = inner.scrollWidth;
  if (!availableH || !contentH) return;

  const scaleH = availableH / contentH;
  const scaleW = contentW ? (availableW / contentW) : 1;
  const scale = Math.min(1, scaleH, scaleW);
  inner.style.transform = `scale(${scale})`;
}

function placeGameControls(_wantsKeypad){
  const gc = document.getElementById('gameControls');
  const slotBottom = document.getElementById('trayControlsSlot');
  if (!gc || !slotBottom) return;

  if (gc.parentElement !== slotBottom) slotBottom.appendChild(gc);
  slotBottom.classList.remove('hidden');
}

function setHudVisible(on){
  const el = $("#hudLine");
  if (!el) return;
  el.style.display = on ? "" : "none";
}

function updateHud(){
  // HUD compact houden: toon in topbar (pill), en verberg de oude HUD-lijn
  const line = $("#hudLine");
  if (line) line.style.display = "none";

  const pill = $("#pillHud");
  if (!pill) {
    updateLvlTop();
    return;
  }

  if (state.mode !== "test" && state.mode !== "run"){
    pill.style.display = "none";
    pill.textContent = "";
    updateLvlTop();
    return;
  }

  pill.style.display = "inline-flex";
  const total = state.mode === "test" ? (state.testCount || state.testLog.length || 0) : 0;
  const cur = state.mode === "test" ? (state.testLog.length || 0) : 0;

  const left = state.mode === "test"
    ? `Vraag ${Math.max(1, cur)}/${total || "?"}`
    : `Run: ${state.score} p`;

  const right = (state.timeLimitMs > 0)
    ? "⏱ " + msToClock(state.timeLeftMs)
    : "⏱ ∞";

  pill.textContent = `${left} • ${right}`;
  updateLvlTop();
}

window.GameSession = Object.assign(window.GameSession || {}, {
  startGame,
  nextQuestion,
  tierFromCorrect,
  pickQuestion,
  pickNonRepeated,
  renderMC,
  renderInput,
  stopGame,
  formatCorrectAnswer,
  shouldUseGameKeypadOnly,
  prepareGameKeypadInput,
  prepareAllInlineGameInputs,
  startTimer,
  endGame,
  practiceAdvanceOnOk,
  practicePenaltyOnFail,
  updateLvlTop,
  schedulePanelBodyFit,
  fitPanelBody,
  placeGameControls,
  setHudVisible,
  updateHud
});
