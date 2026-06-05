/* =========================
   Wiskunde Quest – overlays.js
   Fullscreen, calculator,
   help overlay interactions
========================= */

document.addEventListener("DOMContentLoaded", () => {
  // Fullscreen
  const fsBtn = $("#btnFullscreen");
  const syncFS = () => {
    if (!fsBtn) return;
    const on = !!document.fullscreenElement;
    fsBtn.textContent = on ? "⤢" : "⛶";
    fsBtn.title = on ? "Verlaat volledig scherm" : "Volledig scherm";
  };
  fsBtn?.addEventListener("click", async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen?.();
      } else {
        await document.exitFullscreen?.();
      }
    } catch (e) {
      console.warn("Fullscreen failed", e);
    }
    syncFS();
  });
  document.addEventListener("fullscreenchange", syncFS);
  syncFS();

  // Calculator overlay
  const calcOverlay = $("#calcOverlay");
  const calcLCD = $("#calcLCD");
  let calcExpr = "";

  function calcRender() {
    if (!calcLCD) return;
    const s = (calcExpr || "0").toString();
    calcLCD.textContent = s.length > 22 ? "…" + s.slice(-22) : s;
  }

  function calcSafeEval(expr) {
    const cleaned = String(expr || "")
      .replace(/,/g, ".")
      .replace(/×/g, "*")
      .replace(/÷/g, "/")
      .replace(/[^0-9+\-*/().]/g, "");

    if (!cleaned) return 0;
    if (/[+\-*/.]$/.test(cleaned)) throw new Error("tail");
    return Function("return (" + cleaned + ")")();
  }

  function calcKey(k) {
    if (k === "C") {
      calcExpr = "";
      calcRender();
      return;
    }
    if (k === "⌫") {
      calcExpr = calcExpr.slice(0, -1);
      calcRender();
      return;
    }
    if (k === "=") {
      try {
        const v = calcSafeEval(calcExpr);
        const out = (Math.abs(v) < 1e-12) ? 0 : v;
        calcExpr = String(out);
      } catch (e) {
        calcExpr = "Err";
      }
      calcRender();
      return;
    }

    if (calcExpr === "Err") calcExpr = "";

    if (/[+\-*/]/.test(k)) {
      if (!calcExpr) return;
      if (/[+\-*/]$/.test(calcExpr)) {
        calcExpr = calcExpr.slice(0, -1) + k;
      } else {
        calcExpr += k;
      }
    } else {
      calcExpr += k;
    }
    calcRender();
  }

  $("#btnCalc")?.addEventListener("click", () => {
    if (!calcOverlay) return;
    calcOverlay.classList.remove("hidden");
    calcExpr = "";
    calcRender();
  });
  $("#btnCloseCalc")?.addEventListener("click", () => {
    calcOverlay?.classList.add("hidden");
  });
  calcOverlay?.addEventListener("click", (e) => {
    if (e.target === calcOverlay) calcOverlay.classList.add("hidden");
  });
  $("#calcKeys")?.addEventListener("click", (e) => {
    const b = e.target.closest("[data-k]");
    if (!b) return;
    calcKey(b.dataset.k);
  });
  document.addEventListener("keydown", (e) => {
    if (!calcOverlay || calcOverlay.classList.contains("hidden")) return;
    if (e.key === "Escape") {
      calcOverlay.classList.add("hidden");
      return;
    }
    const map = { Enter: "=", Backspace: "⌫", Delete: "C" };
    const k = map[e.key] || e.key;
    if (/^[0-9]$/.test(k) || ["+", "-", "*", "/", "(", ")", ".", "=", "⌫", "C"].includes(k)) {
      e.preventDefault();
      calcKey(k);
    }
  });

  // Help overlay
  let helpPrevRightPanel = null;
  const helpCard = document.querySelector("#helpOverlay .helpCard");
  const helpHeader = document.querySelector("#helpOverlay .helpHeader");

  if (helpCard && helpHeader) {
    let drag = null;
    const startDrag = (e) => {
      if (e.target && e.target.closest && e.target.closest("#btnCloseHelp")) return;
      if (e.button != null && e.button !== 0) return;
      const rect = helpCard.getBoundingClientRect();
      const sx = Number(helpCard.dataset.dragX || 0);
      const sy = Number(helpCard.dataset.dragY || 0);
      drag = {
        startX: e.clientX,
        startY: e.clientY,
        baseX: sx,
        baseY: sy,
        maxX: window.innerWidth - rect.width - 12,
        maxY: window.innerHeight - rect.height - 12
      };
      helpHeader.setPointerCapture?.(e.pointerId);
    };

    const onMove = (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;
      let nx = drag.baseX + dx;
      let ny = drag.baseY + dy;
      nx = Math.max(-drag.maxX, Math.min(drag.maxX, nx));
      ny = Math.max(-drag.maxY, Math.min(drag.maxY, ny));
      helpCard.style.transform = `translate(${nx}px, ${ny}px)`;
      helpCard.dataset.dragX = String(nx);
      helpCard.dataset.dragY = String(ny);
    };

    const endDrag = (e) => {
      drag = null;
      helpHeader.releasePointerCapture?.(e.pointerId);
    };

    helpHeader.addEventListener("pointerdown", startDrag);
    helpHeader.addEventListener("pointermove", onMove);
    helpHeader.addEventListener("pointerup", endDrag);
    helpHeader.addEventListener("pointercancel", endDrag);
  }

  $("#btnHelp")?.addEventListener("click", () => {
    const topicId = state.topic?.id;
    const help = HELP_CARDS?.[topicId];

    $("#helpTitle").textContent = topicId ? "Hulpkaart – " + state.topic.title : "Hulpkaart";

    $("#helpContent").innerHTML = help
      ? help()
      : "<p>Geen hulpkaart beschikbaar.</p>";

    try { state.helpUsedThisQ = true; } catch (_) {}

    $("#helpOverlay").classList.remove("hidden");

    try {
      window.initHelpOverlay?.(topicId);
    } catch (_) {}

    if (topicId === "inhoud") {
      const rp = $("#keypadSheet");
      if (rp) {
        helpPrevRightPanel = {
          display: rp.style.display,
          noKeypad: rp.classList.contains("noKeypad")
        };
        rp.style.display = "grid";
        rp.classList.remove("noKeypad");
      }
    }
  });

  $("#btnCloseHelp")?.addEventListener("click", () => {
    $("#helpOverlay").classList.add("hidden");
    if (helpPrevRightPanel) {
      const rp = $("#keypadSheet");
      if (rp) {
        rp.style.display = helpPrevRightPanel.display;
        if (helpPrevRightPanel.noKeypad) rp.classList.add("noKeypad");
        else rp.classList.remove("noKeypad");
      }
      helpPrevRightPanel = null;
    }
    const mainInput = document.getElementById("mainInput");
    if (typeof window.setActiveInput === "function") {
      window.setActiveInput(mainInput);
    }
  });
});
