/* =========================
   Wiskunde Quest – game.js
========================= */
let activeInput = null;
let panelBodyFitRaf = 0;
window.setActiveInput = (el) => {
  activeInput = el || null;
};
/* ---------- Game state ---------- */
let state = {
  mode: "practice",        // practice | run | test
  topic: null,             // { id, title }
  currentQ: null,

  score: 0,
  attempts: 0,
  correct: 0,

  timeLimitMs: 0,
  timeLeftMs: 0,
  timer: null,

  submitLocked: false,
  startedAt: 0,

  // toetsmodus
  testCount: 0,
  testLog: [],
  identity: null,
  proofDone: false,
  seed: 0,
  testId: "",
  _rng: null,

  // anti-herhaling (laatste vragen)
  recentQKeys: [],

  // Sprint 2: badges/hulp tracking
  helpUsedThisQ: false,
  streakQ: 0,

  // oefenmodus progressie (5 niveaus met terugval)
  practiceTier: 1,
  practiceProg: 0,
};

/* ---------- Start game ---------- */
/* moved to js/game-session.js: startGame */


/* ---------- Next question ---------- */
/* moved to js/game-session.js: nextQuestion */


/* ---------- Pick question (MAGIE ZIT HIER) ---------- */
/* moved to js/game-session.js: tierFromCorrect */


/* moved to js/game-session.js: pickQuestion */


/* moved to js/game-session.js: pickNonRepeated */


/* ---------- Render MC ---------- */
/* moved to js/game-session.js: renderMC */


/* ---------- Render input ---------- */
/* moved to js/game-session.js: renderInput */


/* ---------- Stop game ---------- */
/* moved to js/game-session.js: stopGame */


/* moved to js/game-session.js: formatCorrectAnswer */


/* ---------- Mobile: gebruik game-keypad, geen telefoon-keyboard ---------- */
/* moved to js/game-session.js: shouldUseGameKeypadOnly */


/* moved to js/game-session.js: prepareGameKeypadInput */


/* moved to js/game-session.js: prepareAllInlineGameInputs */


/* moved to js/game-session.js: submitAnswer */


/* ---------- Timer ---------- *//* ---------- Timer ---------- */
/* moved to js/game-session.js: startTimer */


/* ---------- End game ---------- */
/* moved to js/game-session.js: endGame */


function makeRng(seed){
  let s = (Number(seed) >>> 0) || 1;
  return function(){
    // LCG (Numerical Recipes)
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function pad2(n){ return String(n).padStart(2, "0"); }
function makeTestId(seed){
  const d = new Date();
  const stamp = `${d.getFullYear()}${pad2(d.getMonth()+1)}${pad2(d.getDate())}-${pad2(d.getHours())}${pad2(d.getMinutes())}${pad2(d.getSeconds())}`;
  const tail = (seed >>> 0).toString(16).toUpperCase().padStart(8,"0").slice(0,6);
  return `T-${stamp}-${tail}`;
}

function stableStringify(value){
  const seen = new WeakSet();
  const norm = (v) => {
    if (v && typeof v === "object"){
      if (seen.has(v)) return "[Circular]";
      seen.add(v);
      if (Array.isArray(v)) return v.map(norm);
      const out = {};
      Object.keys(v).sort().forEach(k => { out[k] = norm(v[k]); });
      return out;
    }
    return v;
  };
  return JSON.stringify(norm(value));
}

async function sha256Hex(str){
  const buf = new TextEncoder().encode(str);
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2,"0")).join("");
}

async function computeProofHash(summary){
  try{
    const hex = await sha256Hex(stableStringify(summary));
    return hex.slice(0, 12).toUpperCase();
  }catch(_){
    return "";
  }
}


// ---------- Progressie helpers (5 niveaus) ----------
/* moved to js/game-session.js: practiceAdvanceOnOk */


/* moved to js/game-session.js: practicePenaltyOnFail */


/* moved to js/game-session.js: updateLvlTop */


/* moved to js/game-session.js: schedulePanelBodyFit */


/* moved to js/game-session.js: fitPanelBody */


window.addEventListener("resize", schedulePanelBodyFit);

/* moved to js/game-session.js: placeGameControls */


// HUD helpers
/* moved to js/game-session.js: setHudVisible */


/* moved to js/game-session.js: updateHud */


