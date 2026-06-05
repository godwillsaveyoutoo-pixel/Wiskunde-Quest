
(function(){
  "use strict";

  function syncKeypadLayoutClass(){
    const grid = document.getElementById("gameGrid");
    const q = window.state && window.state.currentQ;
    if (!grid || !q) return;

    const isMc = q.kind === "mc";
    grid.classList.toggle("mcMode", isMc);
    grid.classList.toggle("inputMode", !isMc);
  }

  // Gebruik event-momenten, geen continue polling.
  document.addEventListener("DOMContentLoaded", syncKeypadLayoutClass);
  document.addEventListener("click", () => setTimeout(syncKeypadLayoutClass, 0), true);
  document.addEventListener("pointerup", () => setTimeout(syncKeypadLayoutClass, 0), true);

  const oldNext = window.nextQuestion;
  if (typeof oldNext === "function" && !oldNext.__keypadBottomWrapped) {
    const wrapped = function(...args){
      const result = oldNext.apply(this, args);
      setTimeout(syncKeypadLayoutClass, 0);
      return result;
    };
    wrapped.__keypadBottomWrapped = true;
    window.nextQuestion = wrapped;
  }

  window.WQ_syncKeypadBottom = syncKeypadLayoutClass;
})();
