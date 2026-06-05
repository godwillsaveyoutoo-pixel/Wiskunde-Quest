
(function(){
  "use strict";

  const priorFormatter = window.WQ_formatQuestionPrompt;

  function esc(s){
    return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }
  function topicKicker(q){
    const map = {
      breuken:'Breuken', procent:'Procent', inhoud:'Inhoud', massa:'Massa', lijnen:'Lijnen', hoeken:'Hoeken', tijd:'Tijd', tabellen:'Tabellen'
    };
    return map[q?.topic] || 'Vraag';
  }
  function mathify(html){
    let s = esc(html);
    s = s.replace(/____/g, '<span class="wqBlank">____</span>');
    s = s.replace(/([0-9]+(?:[,.][0-9]+)?%)\b/g, '<span class="wqPct">$1</span>');
    s = s.replace(/([0-9]+(?:[,.][0-9]+)?)°/g, '<span class="wqDeg">$1°</span>');
    s = s.replace(/\b([0-9]+(?:[,.][0-9]+)?\/[0-9]+(?:[,.][0-9]+)?)\b/g, '<span class="wqFrac">$1</span>');
    s = s.replace(/([0-9]+(?:[,.][0-9]+)?)\s*(ml|cl|dl|kg|g|t|cm|mm|m|km|l|u|min|s)\b/gi,
      '<span class="wqNum">$1</span> <span class="wqUnit">$2</span>');
    s = s.replace(/\b(ml|cl|dl|kg|g|t|cm|mm|m|km|l|u|min|s|%)\b/gi, '<span class="wqUnit">$1</span>');
    s = s.replace(/\b([0-9]+(?:[,.][0-9]+)?)\b/g, '<span class="wqNum">$1</span>');
    // cleanup nested highlights caused by previous passes
    s = s.replace(/<span class="wqNum">(<span class="wqNum">.*?<\/span>)<\/span>/g, '$1');
    s = s.replace(/<span class="wqUnit">(<span class="wqUnit">.*?<\/span>)<\/span>/g, '$1');
    return s;
  }
  function makeLines(prompt){
    return String(prompt || '').split(/\n+/).map(x => x.trim()).filter(Boolean);
  }
  function makePrompt(q){
    if (q?.promptHtml) return q.promptHtml;
    if (typeof priorFormatter === 'function') {
      const prior = priorFormatter(q);
      if (prior) return prior;
    }
    const lines = makeLines(q?.prompt);
    if (!lines.length) return null;

    // Equation style like "Bereken: 1/2 van 10 = ____"
    if (lines.length === 1 && /(Bereken|Vul aan|Herleid|Zet om|Hoeveel)/i.test(lines[0]) && /____|=/.test(lines[0])) {
      const m = lines[0].match(/^([^:]+):\s*(.+)$/);
      const head = m ? m[1] + '.' : '';
      const body = m ? m[2] : lines[0];
      return `<div class="wqPrompt"><div class="wqPromptKicker">${topicKicker(q)}</div>${head ? `<div class="wqPromptLine sub">${esc(head)}</div>` : ''}<div class="wqPromptLine eq"><span class="wqEquation">${mathify(body)}</span></div></div>`;
    }

    if (lines.length === 2) {
      return `<div class="wqPrompt"><div class="wqPromptKicker">${topicKicker(q)}</div><div class="wqPromptLine sub">${mathify(lines[0])}</div><div class="wqPromptLine main">${mathify(lines[1])}</div></div>`;
    }

    return `<div class="wqPrompt"><div class="wqPromptKicker">${topicKicker(q)}</div>${lines.map((ln,i)=>`<div class="wqPromptLine ${i===lines.length-1?'main':'sub'}">${mathify(ln)}</div>`).join('')}</div>`;
  }
  window.WQ_formatQuestionPrompt = makePrompt;

  // Friendly labels for SVG-only multiple choice answers
  window.WQ_describeMcAnswer = function(ans){
    const s = String(ans || '');
    if (!s.includes('<svg')) return String(ans || '');
    if (s.includes('x1="14"') && s.includes('x2="14"') && s.includes('x1="26"')) return 'evenwijdig';
    if (s.includes('x1="20"') && s.includes('y2="16"') && s.includes('x1="10"')) return 'loodrecht';
    if (s.includes('line x1="3"') || s.includes('line x1="8"') || s.includes('line x1="10"') || s.includes('line x1="6"')) return 'snijdend';
    return 'dit symbool';
  };

  // Nicer percent bar
  window.svgPercentBar = function(total, percent, opts = {}) {
    const width = opts.width || 420, height = opts.height || 114;
    const label = opts.label || `${percent}% van ${total}`;
    const p = Math.max(0, Math.min(100, Number(percent) || 0));
    const barX = 28, barY = 46, barW = width - 56, barH = 34;
    const fillW = barW * p / 100;
    const segments = opts.segments || 10;
    const segW = barW / segments;
    return `
    <div class="vizCard" style="max-width:${width}px;margin-inline:auto;">
      <svg viewBox="0 0 ${width} ${height}" width="100%" xmlns="http://www.w3.org/2000/svg" aria-label="${esc(label)}">
        <defs>
          <linearGradient id="pg1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#5cc2ff"/><stop offset="100%" stop-color="#2e77ff"/></linearGradient>
        </defs>
        <text x="${width/2}" y="24" text-anchor="middle" font-size="16" font-weight="900" fill="#16324a">${esc(label)}</text>
        <rect x="${barX}" y="${barY}" width="${barW}" height="${barH}" rx="17" fill="#ebf3ff" stroke="#6f95d4" stroke-width="2.4"/>
        <rect x="${barX}" y="${barY}" width="${fillW}" height="${barH}" rx="17" fill="url(#pg1)"/>
        ${Array.from({length:segments-1}).map((_,i)=>{const x=barX+(i+1)*segW; return `<line x1="${x}" y1="${barY+4}" x2="${x}" y2="${barY+barH-4}" stroke="rgba(78,117,173,.35)" stroke-width="1.2"/>`;}).join('')}
        <text x="${barX+12}" y="${barY+22}" font-size="13" font-weight="800" fill="#486683">0%</text>
        <text x="${barX+barW-18}" y="${barY+22}" text-anchor="end" font-size="13" font-weight="800" fill="#486683">100%</text>
        <g transform="translate(${barX+fillW} ${barY-6})">
          <path d="M 0 0 l 10 -12 l 54 0 q 14 0 14 14 q 0 14 -14 14 l -56 0 z" fill="#103b72" opacity="0.96"/>
          <text x="39" y="6" text-anchor="middle" font-size="16" font-weight="900" fill="#fff">${String(percent).replace('.',',')}%</text>
        </g>
      </svg>
      <div class="vizCaption">Denk in stukjes van 10%.</div>
    </div>`;
  };

  window.svgLijnenMeten = function(lengteCm, labelA='A', labelB='B', angleDeg=0){
    const CM = 32;
    const L = lengteCm * CM;
    const rad = angleDeg * Math.PI / 180;
    const x0 = 180, y0 = 300;
    const x1 = x0 + L * Math.cos(rad);
    const y1 = y0 - L * Math.sin(rad);
    const lx0 = x0 - 18, ly0 = y0 + 24, lx1 = x1 + 14, ly1 = y1 + 24;
    return `
    <div class="vizCard" style="max-width:680px;margin-inline:auto;">
      <svg class="geoScene" viewBox="0 0 720 420" width="100%" xmlns="http://www.w3.org/2000/svg"
          data-geo-x="-200" data-geo-y="0" data-geo-rot="180" data-geo-scale="0.40" data-geo-rot-speed="0.32" data-geo-pivot="center"
          onpointerenter="enableGeoTriangle(this)">
        <rect x="10" y="10" width="700" height="400" rx="24" fill="#ffffff" stroke="#d9e4f2" stroke-width="3"/>
        <text x="30" y="38" font-size="16" font-weight="900" fill="#17324a">Meet het lijnstuk</text>
        <text x="30" y="60" font-size="13" font-weight="800" fill="#64809a">Sleep de geodriehoek. Dubbel tik = draai-modus.</text>
        <line x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}" stroke="#0f172a" stroke-width="6" stroke-linecap="round"/>
        <circle cx="${x0}" cy="${y0}" r="6" fill="#0f172a"/>
        <circle cx="${x1}" cy="${y1}" r="6" fill="#0f172a"/>
        <text x="${lx0}" y="${ly0}" font-size="22" font-weight="900" fill="#0f172a">${esc(labelA)}</text>
        <text x="${lx1}" y="${ly1}" font-size="22" font-weight="900" fill="#0f172a">${esc(labelB)}</text>
        ${window.svgGeodriehoekSvgOnly ? window.svgGeodriehoekSvgOnly() : ''}
      </svg>
      <div class="vizCaption">Leg de nul van de geodriehoek bij het beginpunt.</div>
    </div>`;
  };

  window.svgAngleMeten = function(deg = 60, baseRot = 0) {
    const w=720,h=420,vx=230,vy=315,rLine=205,rArc=92; const rad=deg*Math.PI/180;
    const x2=vx+rLine*Math.cos(rad), y2=vy-rLine*Math.sin(rad), ax=vx+rArc*Math.cos(rad), ay=vy-rArc*Math.sin(rad);
    const largeArc=deg>180?1:0;
    return `
    <div class="vizCard" style="max-width:680px;margin-inline:auto;">
      <svg class="geoScene" viewBox="0 0 ${w} ${h}" width="100%" xmlns="http://www.w3.org/2000/svg" aria-label="hoek meten"
          onpointerenter="enableGeoTriangle(this)"
          data-geo-x="-180" data-geo-y="30" data-geo-scale="0.40" data-geo-rot="180" data-geo-rot-speed="0.32" data-geo-pivot="center">
        <rect x="8" y="8" width="${w-16}" height="${h-16}" rx="22" fill="#ffffff" stroke="#d9e4f2" stroke-width="3"/>
        <text x="24" y="40" font-size="16" font-weight="900" fill="#17324a">Meet de hoek</text>
        <text x="24" y="62" font-size="13" font-weight="800" fill="#64809a">Sleep de geodriehoek. Dubbel tik = draai-modus.</text>
        <g transform="rotate(${baseRot} ${vx} ${vy})">
          <line x1="${vx}" y1="${vy}" x2="${vx+rLine}" y2="${vy}" stroke="#0f172a" stroke-width="6" stroke-linecap="round"/>
          <line x1="${vx}" y1="${vy}" x2="${x2}" y2="${y2}" stroke="#0f172a" stroke-width="6" stroke-linecap="round"/>
          <path d="M ${vx+rArc} ${vy} A ${rArc} ${rArc} 0 ${largeArc} 0 ${ax} ${ay}" fill="none" stroke="#0f172a" stroke-width="5" stroke-linecap="round"/>
          <circle cx="${vx}" cy="${vy}" r="6" fill="#0f172a"/>
        </g>
        ${window.svgGeodriehoekSvgOnly ? window.svgGeodriehoekSvgOnly() : ''}
      </svg>
      <div class="vizCaption">Tik 2 keer op de geodriehoek om te wisselen tussen slepen en draaien.</div>
    </div>`;
  };

  // Touch-friendly geodriehoek: double tap toggles drag/rotate on mobile.
  window.enableGeoTriangle = function(svg){
    const tri = svg.querySelector('#geoTriangle');
    if (!tri || tri.dataset.bound === '1') return;
    tri.dataset.bound = '1';
    const NS = 'http://www.w3.org/2000/svg';
    const pt = svg.createSVGPoint();
    let wrap = svg.querySelector('#geoWrap');
    if (!wrap) { wrap = document.createElementNS(NS,'g'); wrap.setAttribute('id','geoWrap'); tri.parentNode.insertBefore(wrap, tri); wrap.appendChild(tri); }
    else if (tri.parentNode !== wrap) wrap.appendChild(tri);
    let pos = { x: parseFloat(svg.dataset.geoX ?? 200), y: parseFloat(svg.dataset.geoY ?? 80) };
    let angle = parseFloat(svg.dataset.geoRot ?? 0);
    const mobile = window.matchMedia('(max-width: 700px)').matches;
    const SCALE = parseFloat(svg.dataset.geoScale ?? (mobile ? 0.52 : 0.44)) * (mobile ? 1.08 : 1);
    const ROT_SPEED = parseFloat(svg.dataset.geoRotSpeed ?? 0.32);
    function parseVB(vb){ if(!vb) return null; const a=vb.trim().split(/\s+|,/).map(Number); if(a.length!==4||a.some(Number.isNaN)) return null; return {x:a[0],y:a[1],w:a[2],h:a[3]}; }
    const innerSvg = tri.querySelector('svg');
    const vb = innerSvg ? parseVB(innerSvg.getAttribute('viewBox')) : null;
    let pivot = vb ? { x: vb.x + vb.w/2, y: vb.y + vb.h/2 } : (function(){ const bb = tri.getBBox(); return {x: bb.x+bb.width/2, y: bb.y+bb.height/2}; })();
    function getSVGCoords(evt){ pt.x=evt.clientX; pt.y=evt.clientY; return pt.matrixTransform(svg.getScreenCTM().inverse()); }
    function pointerAngle(p,c){ return Math.atan2(p.y-c.y, p.x-c.x); }
    function rad2deg(r){ return r*180/Math.PI; }
    function update(){ wrap.setAttribute('transform', `translate(${pos.x} ${pos.y})`); tri.setAttribute('transform', `translate(${pivot.x} ${pivot.y}) rotate(${angle}) scale(${SCALE}) translate(${-pivot.x} ${-pivot.y})`); tri.dataset.mode = tri.dataset.mode || 'drag'; }
    let mode=null, startPointer={x:0,y:0}, startPos={x:0,y:0}, baseAngle=0, startAngle=0, lastTap=0;
    tri.style.cursor='grab';
    tri.addEventListener('pointerdown', e=>{
      e.preventDefault();
      const now = Date.now();
      if ((e.pointerType === 'touch' || mobile) && now - lastTap < 320) {
        tri.dataset.mode = (tri.dataset.mode === 'rot') ? 'drag' : 'rot';
      }
      lastTap = now;
      const p = getSVGCoords(e); startPointer = {x:p.x,y:p.y};
      const wantsRot = e.shiftKey || ((e.pointerType === 'touch' || mobile) && tri.dataset.mode === 'rot');
      if (wantsRot) {
        mode='rot'; baseAngle=angle; const rotCenter={x:pos.x+pivot.x, y:pos.y+pivot.y}; startAngle=pointerAngle(p,rotCenter);
      } else {
        mode='drag'; startPos={x:pos.x,y:pos.y}; tri.style.cursor='grabbing';
      }
      tri.setPointerCapture(e.pointerId);
    });
    tri.addEventListener('pointermove', e=>{
      if(!mode) return; const p=getSVGCoords(e);
      if(mode==='drag'){ pos.x = startPos.x + (p.x-startPointer.x); pos.y = startPos.y + (p.y-startPointer.y); update(); return; }
      const rotCenter={x:pos.x+pivot.x, y:pos.y+pivot.y}; let d=pointerAngle(p,rotCenter)-startAngle; if(d>Math.PI)d-=2*Math.PI; if(d<-Math.PI)d+=2*Math.PI; angle = baseAngle + rad2deg(d) * ROT_SPEED; update();
    });
    function end(){ mode=null; tri.style.cursor='grab'; }
    tri.addEventListener('pointerup', end); tri.addEventListener('pointercancel', end); tri.addEventListener('lostpointercapture', end);
    update();
  };
})();
