(function(){
  "use strict";

  const MOBILE_QUERY = "(max-width: 900px), (hover: none) and (pointer: coarse)";
  const MOBILE_VIEWBOX = "0 55 540 360";

  function isMobileGeoLayout(){
    return !!(window.matchMedia && window.matchMedia(MOBILE_QUERY).matches);
  }

  function parseViewBox(raw){
    const parts = String(raw || "").trim().split(/[\s,]+/).map(Number);
    if (parts.length !== 4 || parts.some(Number.isNaN)) return null;
    return { x: parts[0], y: parts[1], w: parts[2], h: parts[3] };
  }

  function syncZoomBase(svg, viewBoxString){
    const parsed = parseViewBox(viewBoxString);
    if (!parsed) return;
    svg.__geoZoomBase = { ...parsed };
    svg.__geoZoomViewBox = { ...parsed };
  }

  function looksLikeMeasureSvg(svg){
    if (!svg || !svg.classList || !svg.classList.contains("geoScene")) return false;
    const label = String(svg.getAttribute("aria-label") || "").toLowerCase();
    const raw = String(svg.getAttribute("viewBox") || "");
    return label.includes("meten") || raw.includes("720") || !!svg.querySelector("#geoTriangle, .geoTriangle");
  }

  function patchMeasureSvg(svg, mobile){
    if (!looksLikeMeasureSvg(svg)) return;

    if (!svg.dataset.wqOriginalViewBox) {
      svg.dataset.wqOriginalViewBox = svg.getAttribute("viewBox") || "";
    }
    if (!svg.dataset.wqOriginalPar) {
      svg.dataset.wqOriginalPar = svg.getAttribute("preserveAspectRatio") || "";
    }

    const wantedViewBox = mobile ? MOBILE_VIEWBOX : svg.dataset.wqOriginalViewBox;
    const wantedPar = mobile ? "xMidYMid meet" : svg.dataset.wqOriginalPar;

    if (wantedViewBox && svg.getAttribute("viewBox") !== wantedViewBox) {
      svg.setAttribute("viewBox", wantedViewBox);
      syncZoomBase(svg, wantedViewBox);
    }

    if (wantedPar) svg.setAttribute("preserveAspectRatio", wantedPar);
    else svg.removeAttribute("preserveAspectRatio");

    // Touchscreens krijgen niet altijd een echte pointerenter. Bind de geodriehoek dus meteen.
    try { window.enableGeoTriangle?.(svg); } catch (_) {}
    try { window.WQ_bindGeoZoom?.(svg); } catch (_) {}
  }

  function syncGeoMobileLayout(){
    const grid = document.getElementById("gameGrid");
    const isGeo = !!grid?.classList.contains("geoMeasureMode");
    const mobile = isMobileGeoLayout();

    document.body.classList.toggle("wqGeoMeasureMobile", isGeo && mobile);

    const rp = document.getElementById("rightPanel");
    if (rp) rp.classList.toggle("geoMeasureMode", isGeo);

    document.querySelectorAll("#visualWrap svg.geoScene").forEach(svg => {
      patchMeasureSvg(svg, isGeo && mobile);
    });
  }

  function afterRender(){
    requestAnimationFrame(syncGeoMobileLayout);
    setTimeout(syncGeoMobileLayout, 80);
  }

  for (const name of ["nextQuestion", "startGame", "showScreen"]) {
    const fn = window[name];
    if (typeof fn === "function" && !fn.__wqGeoMobileRatioFix) {
      const wrapped = function(...args){
        const result = fn.apply(this, args);
        afterRender();
        return result;
      };
      wrapped.__wqGeoMobileRatioFix = true;
      window[name] = wrapped;
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    syncGeoMobileLayout();
    const mo = new MutationObserver(afterRender);
    if (document.body) mo.observe(document.body, { childList:true, subtree:true });
  });

  window.addEventListener("resize", afterRender, { passive:true });
  window.visualViewport?.addEventListener("resize", afterRender, { passive:true });
  document.addEventListener("fullscreenchange", afterRender);

  window.WQ_syncGeoMobileLayout = syncGeoMobileLayout;
})();
