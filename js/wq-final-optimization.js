(function(){
  "use strict";

  function setViewportUnit(){
    const vv = window.visualViewport;
    const h = Math.round(vv?.height || window.innerHeight || document.documentElement.clientHeight || 0);
    if (h > 0) document.documentElement.style.setProperty("--wq-vh", h + "px");
  }

  function activeScreenId(){
    return document.querySelector(".screen.active")?.id || window.APP?.screen || "";
  }

  function syncBodyFlags(){
    const id = activeScreenId();
    document.body.classList.toggle("wqFullscreen", !!document.fullscreenElement);
    document.body.classList.toggle("wqInGame", id === "scrGame");
    document.body.classList.toggle("wqInMap", id === "scrMap");
    document.body.classList.toggle("wqInResult", id === "scrResult");
  }

  function syncActiveScreenFallback(){
    // Extra vangnet voor oudere codepaden: precies één zichtbaar scherm krijgt .active.
    const screens = Array.from(document.querySelectorAll(".screen"));
    let active = screens.find(s => s.id === window.APP?.screen) ||
      screens.find(s => getComputedStyle(s).display !== "none");
    screens.forEach(s => {
      const on = !!active && s === active;
      s.classList.toggle("active", on);
      s.setAttribute("aria-hidden", on ? "false" : "true");
    });
    syncBodyFlags();
  }

  function normalizeDutchTimeText(value){
    return String(value ?? "")
      .replace(/&#\s*0*39\s*;/gi, "'")
      .replace(/&apos;/gi, "'")
      .replace(/&amp;#\s*0*39\s*;/gi, "'")
      .replace(/'\s*s\s+morgens/gi, "in de ochtend")
      .replace(/'\s*s\s+middags/gi, "in de middag")
      .replace(/'\s*s\s+avonds/gi, "in de avond")
      .replace(/'\s*s\s+nachts/gi, "in de nacht");
  }

  function cleanQuestionDom(){
    const roots = [
      document.getElementById("qPrompt"),
      document.getElementById("qSub"),
      document.getElementById("status")
    ].filter(Boolean);

    for (const root of roots) {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      const nodes = [];
      while (walker.nextNode()) nodes.push(walker.currentNode);
      for (const n of nodes) {
        const fixed = normalizeDutchTimeText(n.nodeValue);
        if (fixed !== n.nodeValue) n.nodeValue = fixed;
      }
    }
  }

  function syncGameLayout(){
    const grid = document.getElementById("gameGrid");
    if (!grid) return;

    const rp = document.getElementById("rightPanel");
    const choicesVisible = !!document.querySelector("#choices .choice");
    const inputVisible = !!document.getElementById("inputRow") && getComputedStyle(document.getElementById("inputRow")).display !== "none";
    const padVisible = !!rp && getComputedStyle(rp).display !== "none";

    grid.classList.toggle("mcMode", choicesVisible && !inputVisible);
    grid.classList.toggle("inputMode", inputVisible || padVisible);

    // Oude auto-collapse maakte op kleine telefoons de layout onvoorspelbaar.
    // Op touchscreens houden we de keypad open zodra hij nodig is.
    const touchLike = window.matchMedia?.("(hover:none), (pointer:coarse), (max-width:900px)")?.matches;
    if (touchLike && padVisible && rp) {
      rp.classList.remove("collapsed");
      try { localStorage.setItem("mr_pad_collapsed", "0"); } catch (_) {}
    }

    cleanQuestionDom();
  }

  function afterLayout(){
    setViewportUnit();
    syncActiveScreenFallback();
    syncGameLayout();
  }

  // Versterk showScreen zonder de bestaande navigatielogica te vervangen.
  const originalShowScreen = window.showScreen;
  if (typeof originalShowScreen === "function" && !originalShowScreen.__wqFinalOptimized) {
    const wrapped = function(id, ...rest){
      const result = originalShowScreen.call(this, id, ...rest);
      requestAnimationFrame(afterLayout);
      return result;
    };
    wrapped.__wqFinalOptimized = true;
    window.showScreen = wrapped;
  }

  // Versterk nextQuestion/startGame voor layout na render.
  for (const name of ["nextQuestion", "startGame", "renderTopicMap"]) {
    const fn = window[name];
    if (typeof fn === "function" && !fn.__wqFinalOptimized) {
      const wrapped = function(...args){
        const result = fn.apply(this, args);
        requestAnimationFrame(afterLayout);
        setTimeout(afterLayout, 80);
        return result;
      };
      wrapped.__wqFinalOptimized = true;
      window[name] = wrapped;
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    afterLayout();
    document.addEventListener("click", () => setTimeout(afterLayout, 0), true);
    document.addEventListener("pointerup", () => setTimeout(afterLayout, 0), true);
  });
  window.addEventListener("resize", afterLayout, { passive:true });
  window.visualViewport?.addEventListener("resize", afterLayout, { passive:true });
  document.addEventListener("fullscreenchange", afterLayout);

  window.WQ_finalOptimizeLayout = afterLayout;
})();
