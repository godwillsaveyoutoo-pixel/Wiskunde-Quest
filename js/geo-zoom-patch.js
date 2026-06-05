
(function(){
  "use strict";

  const MIN_ZOOM = 1;      // 1 = originele viewBox
  const MAX_ZOOM = 4.5;    // ruim genoeg voor nauwkeurig meten

  function parseViewBox(svg){
    const raw = svg.getAttribute("viewBox") || "";
    const a = raw.trim().split(/\s+|,/).map(Number);
    if (a.length !== 4 || a.some(n => Number.isNaN(n))) return null;
    return { x:a[0], y:a[1], w:a[2], h:a[3] };
  }

  function setViewBox(svg, vb){
    svg.setAttribute("viewBox", `${vb.x} ${vb.y} ${vb.w} ${vb.h}`);
  }

  function svgPoint(svg, clientX, clientY){
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  }

  function clampViewBox(vb, base){
    // Hou minstens een beetje marge, maar laat vrij genoeg bewegen.
    const minW = base.w / MAX_ZOOM;
    const minH = base.h / MAX_ZOOM;
    vb.w = Math.max(minW, Math.min(base.w / MIN_ZOOM, vb.w));
    vb.h = Math.max(minH, Math.min(base.h / MIN_ZOOM, vb.h));

    const marginX = base.w * 0.30;
    const marginY = base.h * 0.30;
    const minX = base.x - marginX;
    const maxX = base.x + base.w - vb.w + marginX;
    const minY = base.y - marginY;
    const maxY = base.y + base.h - vb.h + marginY;

    vb.x = Math.max(minX, Math.min(maxX, vb.x));
    vb.y = Math.max(minY, Math.min(maxY, vb.y));
    return vb;
  }

  function zoomAt(svg, factor, clientX, clientY){
    const base = svg.__geoZoomBase;
    let vb = {...svg.__geoZoomViewBox};
    const before = svgPoint(svg, clientX, clientY);

    const newW = vb.w / factor;
    const newH = vb.h / factor;

    vb.x = before.x - (before.x - vb.x) * (newW / vb.w);
    vb.y = before.y - (before.y - vb.y) * (newH / vb.h);
    vb.w = newW;
    vb.h = newH;

    vb = clampViewBox(vb, base);
    svg.__geoZoomViewBox = vb;
    setViewBox(svg, vb);
  }

  function resetZoom(svg){
    if (!svg.__geoZoomBase) return;
    svg.__geoZoomViewBox = {...svg.__geoZoomBase};
    setViewBox(svg, svg.__geoZoomViewBox);
  }

  function addHint(svg){
    const wrap = svg.closest(".visualWrap");
    if (!wrap || wrap.querySelector(".geoZoomHint")) return;
    const hint = document.createElement("div");
    hint.className = "geoZoomHint";
    hint.textContent = window.matchMedia("(pointer:coarse)").matches
      ? "2 vingers = zoom"
      : "scroll = zoom";
    wrap.appendChild(hint);
  }

  function bindGeoZoom(svg){
    if (!svg || svg.dataset.geoZoomBound === "1") return;
    const base = parseViewBox(svg);
    if (!base) return;

    svg.dataset.geoZoomBound = "1";
    svg.__geoZoomBase = {...base};
    svg.__geoZoomViewBox = {...base};

    addHint(svg);

    // PC: muiswiel/trackpad zoomt rond de muispositie.
    svg.addEventListener("wheel", (e) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.13 : 1 / 1.13;
      zoomAt(svg, factor, e.clientX, e.clientY);
    }, { passive:false });

    // Dubbelklik/dubbeltik op achtergrond = reset zoom.
    let lastTap = 0;
    svg.addEventListener("dblclick", (e) => {
      if (e.target.closest && e.target.closest("#geoTriangle")) return;
      e.preventDefault();
      resetZoom(svg);
    });

    const pointers = new Map();
    let pinchStart = null;

    function dist(a,b){
      return Math.hypot(a.x - b.x, a.y - b.y);
    }
    function mid(a,b){
      return { x:(a.x+b.x)/2, y:(a.y+b.y)/2 };
    }

    svg.addEventListener("pointerdown", (e) => {
      pointers.set(e.pointerId, { x:e.clientX, y:e.clientY });

      // Dubbel tik op lege geo-scène = reset.
      const now = Date.now();
      if (e.pointerType === "touch" && pointers.size === 1 && !(e.target.closest && e.target.closest("#geoTriangle"))) {
        if (now - lastTap < 280) {
          resetZoom(svg);
          e.preventDefault();
        }
        lastTap = now;
      }

      if (pointers.size === 2) {
        const pts = Array.from(pointers.values());
        pinchStart = {
          p1: {...pts[0]},
          p2: {...pts[1]},
          mid: mid(pts[0], pts[1]),
          dist: Math.max(1, dist(pts[0], pts[1])),
          vb: {...svg.__geoZoomViewBox}
        };
        svg.classList.add("isPinching");
        e.preventDefault();
      }
    }, { capture:true, passive:false });

    svg.addEventListener("pointermove", (e) => {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, { x:e.clientX, y:e.clientY });

      if (pointers.size === 2 && pinchStart) {
        const pts = Array.from(pointers.values());
        const d = Math.max(1, dist(pts[0], pts[1]));
        const m = mid(pts[0], pts[1]);

        const zoom = d / pinchStart.dist;
        const base = svg.__geoZoomBase;
        let vb = {...pinchStart.vb};

        // Zoom rond het start-middenpunt.
        const startPt = svgPoint(svg, pinchStart.mid.x, pinchStart.mid.y);
        const newW = pinchStart.vb.w / zoom;
        const newH = pinchStart.vb.h / zoom;

        vb.x = startPt.x - (startPt.x - pinchStart.vb.x) * (newW / pinchStart.vb.w);
        vb.y = startPt.y - (startPt.y - pinchStart.vb.y) * (newH / pinchStart.vb.h);
        vb.w = newW;
        vb.h = newH;

        // Pan door beweging van het middenpunt.
        const nowPt = svgPoint(svg, m.x, m.y);
        const startNow = svgPoint(svg, pinchStart.mid.x, pinchStart.mid.y);
        vb.x -= (nowPt.x - startNow.x);
        vb.y -= (nowPt.y - startNow.y);

        vb = clampViewBox(vb, base);
        svg.__geoZoomViewBox = vb;
        setViewBox(svg, vb);
        e.preventDefault();
      }
    }, { capture:true, passive:false });

    function clearPointer(e){
      pointers.delete(e.pointerId);
      if (pointers.size < 2) {
        pinchStart = null;
        svg.classList.remove("isPinching");
      }
    }

    svg.addEventListener("pointerup", clearPointer, { capture:true });
    svg.addEventListener("pointercancel", clearPointer, { capture:true });
    svg.addEventListener("lostpointercapture", clearPointer, { capture:true });

    // API voor eventueel debugging vanuit console:
    svg.geoZoomReset = () => resetZoom(svg);
  }

  function scan(){
    document.querySelectorAll("svg.geoScene").forEach(bindGeoZoom);
  }

  document.addEventListener("DOMContentLoaded", scan);
  const mo = new MutationObserver(scan);
  document.addEventListener("DOMContentLoaded", () => {
    if (document.body) mo.observe(document.body, { childList:true, subtree:true });
  });

  window.WQ_bindGeoZoom = bindGeoZoom;
})();
