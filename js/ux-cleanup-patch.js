
(function(){
  "use strict";

  const previousFormatter = window.WQ_formatQuestionPrompt;

  function escapeHtml(s){
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
      // apostrof bewust NIET escapen: vermijdt &#39; / vreemde entiteiten in tijdvragen
  }

  function cleanupRawPrompt(s){
    return String(s ?? "")
      .replace(/&#\s*39\s*;/g, "'")
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/'s morgens/g, "in de ochtend")
      .replace(/'s middags/g, "in de middag")
      .replace(/'s avonds/g, "in de avond")
      .replace(/'s nachts/g, "in de nacht")
      .replace(/\s+/g, " ")
      .trim();
  }

  function chipMath(s){
    let out = escapeHtml(s);
    out = out.replace(/____/g, '<span class="wqBlank">____</span>');
    out = out.replace(/\(([^()]{1,45})\)/g, '<span class="wqHint">$1</span>');
    out = out.replace(/([0-9]+(?:[,.][0-9]+)?%)\b/g, '<span class="wqPct">$1</span>');
    out = out.replace(/([0-9]+(?:[,.][0-9]+)?)°/g, '<span class="wqDeg">$1°</span>');
    out = out.replace(/\b([0-9]+(?:[,.][0-9]+)?\/[0-9]+(?:[,.][0-9]+)?)\b/g, '<span class="wqFrac">$1</span>');
    out = out.replace(/([0-9]+(?:[,.][0-9]+)?)\s*(ml|cl|dl|kg|g|t|cm|mm|m|km|l|u|min|s)\b/gi,
      '<span class="wqNum">$1</span> <span class="wqUnit">$2</span>');
    out = out.replace(/\b(ml|cl|dl|kg|g|t|cm|mm|m|km|l|u|min|s|%)\b/gi, '<span class="wqUnit">$1</span>');
    out = out.replace(/\b([0-9]+(?:[,.][0-9]+)?)\b/g, '<span class="wqNum">$1</span>');
    return out;
  }

  function kicker(q){
    const map = {
      inhoud:"Inhoud", massa:"Massa", procent:"Procent", breuken:"Breuken",
      tijd:"Tijd", lijnen:"Lijnen", hoeken:"Hoeken", tabellen:"Tabellen"
    };
    return map[q?.topic] || "Vraag";
  }

  function cleanerPrompt(q){
    if (!q || q.promptHtml) return q?.promptHtml || null;

    let raw = cleanupRawPrompt(q.prompt);
    if (!raw) return null;

    // Minder rommel in meetvragen
    raw = raw
      .replace(/Rond af op 1 decimaal:\s*/i, "Rond af op 1 decimaal. ")
      .replace(/Meet deze hoek met de geodriehoek:\s*____/i, "Meet deze hoek met de geodriehoek.")
      .replace(/Meet het lijnstuk \[([A-Z]{2})\] met de geodriehoek\.\s*/i, "Meet het lijnstuk [$1]. ");

    // Als er een duidelijke dubbele zin is, toon als twee regels.
    const sentences = raw
      .split(/(?<=[.!?])\s+/)
      .map(x => x.trim())
      .filter(Boolean);

    if (sentences.length >= 2 && raw.length < 120) {
      return `<div class="wqPrompt">
        <div class="wqPromptKicker">${kicker(q)}</div>
        <div class="wqPromptLine sub">${chipMath(sentences.slice(0, -1).join(" "))}</div>
        <div class="wqPromptLine main">${chipMath(sentences.at(-1))}</div>
      </div>`;
    }

    // Rekenvraag of vergelijking in het midden.
    if (/____|=/.test(raw) || /^(Bereken|Herleid|Zet om|Vul aan)/i.test(raw)) {
      const m = raw.match(/^([^:]+):\s*(.+)$/);
      const head = m ? m[1] + "." : "";
      const body = m ? m[2] : raw;
      return `<div class="wqPrompt">
        <div class="wqPromptKicker">${kicker(q)}</div>
        ${head ? `<div class="wqPromptLine sub">${chipMath(head)}</div>` : ""}
        <div class="wqPromptLine eq"><span class="wqEquation">${chipMath(body)}</span></div>
      </div>`;
    }

    // Valt terug op vorige formatter, maar met opgeschoonde prompt.
    if (typeof previousFormatter === "function") {
      const q2 = Object.assign({}, q, { prompt: raw });
      const html = previousFormatter(q2);
      if (html) return html;
    }

    return `<div class="wqPrompt">
      <div class="wqPromptKicker">${kicker(q)}</div>
      <div class="wqPromptLine main">${chipMath(raw)}</div>
    </div>`;
  }

  window.WQ_formatQuestionPrompt = cleanerPrompt;

  async function toggleFullscreen(){
    try{
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen?.();
      } else {
        await document.exitFullscreen?.();
      }
    } catch(e) {
      console.warn("Fullscreen failed", e);
    }
  }

  function syncFullscreenClass(){
    document.body.classList.toggle("wqFullscreen", !!document.fullscreenElement);
  }

  document.addEventListener("fullscreenchange", syncFullscreenClass);
  document.addEventListener("DOMContentLoaded", syncFullscreenClass);

  // Dubbel tik / dubbel klik op het spelgebied = fullscreen aan/uit.
  let lastTap = 0;
  document.addEventListener("pointerup", (e) => {
    const game = document.getElementById("scrGame");
    if (!game || !game.classList.contains("active")) return;
    if (!e.target.closest("#scrGame")) return;

    // Niet triggeren op toetsen/inputs/keuzes/geodriehoek.
    if (e.target.closest("button,input,.key,.choice,#geoTriangle,.rightPanel,.answer")) return;

    const now = Date.now();
    if (now - lastTap < 330) {
      e.preventDefault();
      toggleFullscreen();
      lastTap = 0;
    } else {
      lastTap = now;
    }
  }, { passive:false });
})();
