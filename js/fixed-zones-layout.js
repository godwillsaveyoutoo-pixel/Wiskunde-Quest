
(function(){
  "use strict";

  function updateFixedZoneClasses(){
    const grid = document.getElementById("gameGrid");
    const q = window.state && window.state.currentQ;
    if (!grid || !q) return;

    grid.classList.toggle("mcMode", q.kind === "mc");
    grid.classList.toggle("inputMode", q.kind !== "mc");
  }

  // Hook voorzichtig in nextQuestion-flow zonder MutationObserver.
  const oldNext = window.nextQuestion;
  if (typeof oldNext === "function" && !oldNext.__fixedZonesWrapped) {
    const wrapped = function(...args){
      const result = oldNext.apply(this, args);
      setTimeout(updateFixedZoneClasses, 0);
      return result;
    };
    wrapped.__fixedZonesWrapped = true;
    window.nextQuestion = wrapped;
  }

  const oldStartGame = window.startGame;
  if (typeof oldStartGame === "function" && !oldStartGame.__fixedZonesWrapped) {
    const wrappedStart = function(...args){
      const result = oldStartGame.apply(this, args);
      setTimeout(updateFixedZoneClasses, 0);
      return result;
    };
    wrappedStart.__fixedZonesWrapped = true;
    window.startGame = wrappedStart;
  }

  document.addEventListener("DOMContentLoaded", () => {
    setInterval(updateFixedZoneClasses, 350);
  });
})();
