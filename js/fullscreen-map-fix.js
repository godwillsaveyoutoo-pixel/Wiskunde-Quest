
(function(){
  "use strict";

  function activeScreenId(){
    return document.querySelector(".screen.active")?.id || "";
  }

  function syncBodyFlags(){
    document.body.classList.toggle("wqFullscreen", !!document.fullscreenElement);
    document.body.classList.toggle("wqInGame", activeScreenId() === "scrGame");
    document.body.classList.toggle("wqInMap", activeScreenId() === "scrMap");
  }

  async function exitFullscreen(){
    try{
      if (document.fullscreenElement) await document.exitFullscreen?.();
    }catch(e){
      console.warn("Exit fullscreen failed", e);
    }
    syncBodyFlags();
  }

  async function toggleFullscreen(){
    try{
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen?.();
      else await document.exitFullscreen?.();
    }catch(e){
      console.warn("Fullscreen toggle failed", e);
    }
    syncBodyFlags();
  }

  function stopOrLeaveQuestion(){
    const btnStop = document.getElementById("btnStop");
    if (activeScreenId() === "scrGame" && btnStop) {
      btnStop.click();
      return;
    }
    // veilige fallback
    if (typeof window.showScreen === "function") window.showScreen("scrMap");
  }

  function ensureFloatingControls(){
    if (document.getElementById("fsFloatingControls")) return;

    const wrap = document.createElement("div");
    wrap.id = "fsFloatingControls";
    wrap.className = "fsFloatingControls";
    wrap.innerHTML = `
      <button type="button" class="fsExitBtn" id="fsExitBtn" title="Verlaat volledig scherm">⤢</button>
      <button type="button" class="fsStopBtn" id="fsStopBtn" title="Stop deze vraag">Stop</button>
    `;
    document.body.appendChild(wrap);

    document.getElementById("fsExitBtn")?.addEventListener("click", (e)=>{
      e.preventDefault();
      exitFullscreen();
    });

    document.getElementById("fsStopBtn")?.addEventListener("click", (e)=>{
      e.preventDefault();
      stopOrLeaveQuestion();
    });
  }

  document.addEventListener("DOMContentLoaded", ()=>{
    ensureFloatingControls();
    syncBodyFlags();

    // Bestaande fullscreenknop blijft ook werken.
    const fsBtn = document.getElementById("btnFullscreen");
    fsBtn?.addEventListener("dblclick", (e)=>{
      e.preventDefault();
      toggleFullscreen();
    });
  });

  document.addEventListener("fullscreenchange", syncBodyFlags);

  // Geen agressieve observer; alleen lichte check na klikken/touch, zodat body weet welk scherm actief is.
  document.addEventListener("click", ()=> setTimeout(syncBodyFlags, 0), true);
  document.addEventListener("pointerup", ()=> setTimeout(syncBodyFlags, 0), true);

  // Escape op pc: altijd uit fullscreen.
  document.addEventListener("keydown", (e)=>{
    if (e.key === "Escape" && document.fullscreenElement) {
      exitFullscreen();
    }
  });

  window.WQ_exitFullscreen = exitFullscreen;
  window.WQ_syncFullscreenMapFix = syncBodyFlags;
})();
