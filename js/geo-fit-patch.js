
(function(){
  "use strict";

  function esc(s){
    return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  function geoTriangleMarkup(){
    return (typeof window.svgGeodriehoekSvgOnly === "function")
      ? window.svgGeodriehoekSvgOnly()
      : "";
  }

  // Compactere lijnstuk-scène: de viewBox is verticaal gecropt zodat het meetdeel niet verdrinkt in lege ruimte.
  window.svgLijnenMeten = function(lengteCm, labelA = "A", labelB = "B", angleDeg = 0) {
    const CM = 32;
    const L = lengteCm * CM;
    const rad = (angleDeg * Math.PI) / 180;

    const x0 = 180;
    const y0 = 300;
    const x1 = x0 + L * Math.cos(rad);
    const y1 = y0 - L * Math.sin(rad);

    const lx0 = x0 - 18;
    const ly0 = y0 + 24;
    const lx1 = x1 + 14;
    const ly1 = y1 + 24;

    return `
    <div class="vizCard geoFitCard">
      <svg
        class="geoScene"
        viewBox="0 95 720 300"
        width="100%"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="lijnstuk meten"
        data-geo-x="-200"
        data-geo-y="0"
        data-geo-rot="180"
        data-geo-scale="0.40"
        data-geo-rot-speed="0.28"
        data-geo-pivot="center"
        onpointerenter="enableGeoTriangle(this)"
      >
        <rect x="8" y="96" width="704" height="292" rx="24" fill="#ffffff" stroke="#d9e4f2" stroke-width="3"/>

        <line x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}" stroke="#0f172a" stroke-width="6" stroke-linecap="round"/>
        <circle cx="${x0}" cy="${y0}" r="6" fill="#0f172a"/>
        <circle cx="${x1}" cy="${y1}" r="6" fill="#0f172a"/>

        <text x="${lx0}" y="${ly0}" font-size="22" font-weight="900" fill="#0f172a">${esc(labelA)}</text>
        <text x="${lx1}" y="${ly1}" font-size="22" font-weight="900" fill="#0f172a">${esc(labelB)}</text>

        ${geoTriangleMarkup()}
      </svg>
    </div>`;
  };

  // Compactere hoek-scène: geen extra titel binnen de visual, minder lege bovenruimte.
  window.svgAngleMeten = function(deg = 60, baseRot = 0) {
    const w = 720;
    const vx = 230;
    const vy = 315;
    const rLine = 205;
    const rArc = 92;
    const rad = deg * Math.PI / 180;

    const x2 = vx + rLine * Math.cos(rad);
    const y2 = vy - rLine * Math.sin(rad);
    const ax = vx + rArc * Math.cos(rad);
    const ay = vy - rArc * Math.sin(rad);
    const largeArc = deg > 180 ? 1 : 0;

    return `
    <div class="vizCard geoFitCard">
      <svg
        class="geoScene"
        viewBox="0 90 720 300"
        width="100%"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="hoek meten"
        onpointerenter="enableGeoTriangle(this)"
        data-geo-x="-180"
        data-geo-y="30"
        data-geo-scale="0.40"
        data-geo-rot="180"
        data-geo-rot-speed="0.28"
        data-geo-pivot="center"
      >
        <rect x="8" y="92" width="704" height="294" rx="24" fill="#ffffff" stroke="#d9e4f2" stroke-width="3"/>

        <g transform="rotate(${baseRot} ${vx} ${vy})">
          <line x1="${vx}" y1="${vy}" x2="${vx + rLine}" y2="${vy}"
                stroke="#0f172a" stroke-width="6" stroke-linecap="round"/>
          <line x1="${vx}" y1="${vy}" x2="${x2}" y2="${y2}"
                stroke="#0f172a" stroke-width="6" stroke-linecap="round"/>
          <path d="M ${vx + rArc} ${vy} A ${rArc} ${rArc} 0 ${largeArc} 0 ${ax} ${ay}"
                fill="none" stroke="#0f172a" stroke-width="5" stroke-linecap="round"/>
          <circle cx="${vx}" cy="${vy}" r="6" fill="#0f172a"/>
        </g>

        ${geoTriangleMarkup()}
      </svg>
    </div>`;
  };
})();
