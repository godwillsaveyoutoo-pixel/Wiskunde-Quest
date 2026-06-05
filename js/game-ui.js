/* Consolidated mobile/game UI behavior layer */


/* ===== Section 1 ===== */


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


/* ===== Section 2 ===== */


(function(){
  "use strict";

  function fmtNL(n){
    const num = Number(n);
    if (!Number.isFinite(num)) return String(n ?? '');
    const rounded = Math.round(num * 100) / 100;
    if (Math.abs(rounded - Math.round(rounded)) < 1e-9) return String(Math.round(rounded));
    return String(rounded).replace('.', ',');
  }

  function gcd(a,b){ a=Math.abs(a); b=Math.abs(b); while(b){ const t=b; b=a%b; a=t; } return a||1; }

  function toMl(value, unit){
    const m = { ml:1, cl:10, dl:100, l:1000 };
    return Number(value) * (m[unit] || 1);
  }
  function fromMl(valueMl, unit){
    const m = { ml:1, cl:10, dl:100, l:1000 };
    return Number(valueMl) / (m[unit] || 1);
  }
  function ri(a,b){ return Math.floor(Math.random() * (b-a+1)) + a; }
  function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

  function measurePromptHtml(mode, targetUnit, opts={}){
    const prompt = String(mode || 'Lees af');
    const target = String(targetUnit || '').trim();
    const kicker = opts.kicker || (prompt.includes('herleid') ? 'Inhoud' : 'Maatbeker');
    let sub = opts.sub || '';
    if (!sub) {
      if (/herleid/i.test(prompt)) sub = `Antwoord in <span class="mqUnit">${target}</span>`;
      else if (/kies/i.test(prompt)) sub = '';
      else sub = `Vul in: <span class="mqBlank">____</span> <span class="mqUnit">${target}</span>`;
    }
    return `
      <div class="mqPrompt">
        <div class="mqPromptKicker">${kicker}</div>
        <div class="mqPromptMain">${prompt}</div>
        ${sub ? `<div class="mqPromptSubline">${sub}</div>` : ''}
      </div>`;
  }

  function styledQuestion(q, promptHtml){
    q.promptHtml = promptHtml;
    q.promptClass = 'maatbekerPrompt';
    return q;
  }

  function buildBeakerScenario(kind='easy'){
    const pools = {
      easy: [
        { scaleUnit:'ml', answerUnit:'ml', max:500, major:100, minor:50, values:[100,150,200,250,300,350,400] },
        { scaleUnit:'ml', answerUnit:'ml', max:1000, major:100, minor:100, values:[200,300,400,500,600,700,800,900] },
        { scaleUnit:'cl', answerUnit:'cl', max:50, major:10, minor:5, values:[10,15,20,25,30,35,40,45] },
      ],
      normal: [
        { scaleUnit:'ml', answerUnit:'ml', max:500, major:100, minor:50, values:[150,250,350,450] },
        { scaleUnit:'cl', answerUnit:'cl', max:100, major:10, minor:10, values:[20,30,40,50,60,70,80] },
        { scaleUnit:'dl', answerUnit:'ml', max:10, major:1, minor:0.5, values:[2,3,4,5,6,7,8,9] },
        { scaleUnit:'dl', answerUnit:'cl', max:10, major:1, minor:0.5, values:[1.5,2.5,3.5,4.5,5.5,6.5,7.5] },
        { scaleUnit:'cl', answerUnit:'ml', max:50, major:10, minor:5, values:[15,20,25,30,35,40,45] },
      ],
      hard: [
        { scaleUnit:'ml', answerUnit:'cl', max:500, major:100, minor:50, values:[150,250,350,450] },
        { scaleUnit:'ml', answerUnit:'dl', max:1000, major:100, minor:50, values:[250,350,450,550,650,750,850,950] },
        { scaleUnit:'dl', answerUnit:'ml', max:10, major:1, minor:0.5, values:[2.5,3.5,4.5,5.5,6.5,7.5,8.5,9.5] },
        { scaleUnit:'cl', answerUnit:'dl', max:100, major:10, minor:5, values:[15,25,35,45,55,65,75,85] },
        { scaleUnit:'cl', answerUnit:'ml', max:100, major:10, minor:5, values:[35,45,55,65,75,85,95] },
      ]
    };
    const sc = { ...pick(pools[kind] || pools.easy) };
    sc.value = pick(sc.values);
    return sc;
  }

  function buildMaatbekerQuestion(kind='easy'){
    const sc = buildBeakerScenario(kind);
    const answer = fromMl(toMl(sc.value, sc.scaleUnit), sc.answerUnit);
    const same = sc.scaleUnit === sc.answerUnit;
    const promptText = same
      ? `Lees af in ${sc.answerUnit}.`
      : `Lees af en herleid naar ${sc.answerUnit}.`;
    const explain = same
      ? `Kijk naar de schaal in ${sc.scaleUnit}.`
      : `Lees eerst af in ${sc.scaleUnit} en zet daarna om naar ${sc.answerUnit}.`;

    const q = qInput({
      topic:'inhoud',
      skill:'maatbeker',
      prompt: promptText,
      answer,
      inputKind:'number',
      unit: sc.answerUnit,
      visual: window.svgMaatbekerLees({
        value: sc.value,
        max: sc.max,
        unit: sc.scaleUnit,
        majorStep: sc.major,
        minorStep: sc.minor,
        title: 'Maatbeker'
      }),
      tol: sc.answerUnit === 'dl' ? 0.02 : 0.01,
      sub: same ? '' : 'Lees eerst af. Herleid daarna.'
    });
    return styledQuestion(q, measurePromptHtml(
      same ? 'Lees af.' : 'Lees af en herleid.',
      sc.answerUnit,
      { sub: same ? `Vul in: <span class="mqBlank">____</span> <span class="mqUnit">${sc.answerUnit}</span>`
                   : `Antwoord in <span class="mqUnit">${sc.answerUnit}</span>` }
    ));
  }

  function compareCupsQuestion(){
    const opts = [
      { text:'maatbeker tot 500 ml', key:'500ml', visual: window.svgMaatbekerLees({ value:250, max:500, unit:'ml', majorStep:100, minorStep:50, title:'Maatbeker' }) },
      { text:'maatbeker tot 1000 ml', key:'1000ml', visual: window.svgMaatbekerLees({ value:500, max:1000, unit:'ml', majorStep:100, minorStep:100, title:'Maatbeker' }) },
      { text:'maatbeker tot 50 cl', key:'50cl', visual: window.svgMaatbekerLees({ value:25, max:50, unit:'cl', majorStep:10, minorStep:5, title:'Maatbeker' }) },
    ];
    const q = qMc('inhoud','maatbeker_compare','Welke maatbeker is het handigst om 250 ml af te lezen?', opts.map(o=>o.text), 'maatbeker tot 500 ml',
      `<div style="display:grid;grid-template-columns:repeat(3,minmax(90px,1fr));gap:10px;align-items:end;">${opts.map(o=>`<div>${o.visual}<div style="text-align:center;font-size:12px;font-weight:800;color:#6c7f92;padding-top:4px">${o.text}</div></div>`).join('')}</div>`);
    q.promptHtml = measurePromptHtml('Kies de handigste maatbeker.', '', { sub:'' });
    return q;
  }

  function installBeakerVisual(){
    window.svgMaatbekerLees = function svgMaatbekerLeesV2(opts={}){
      const value = Number(opts.value ?? 250);
      const max = Number(opts.max ?? 500);
      const unit = String(opts.unit || 'ml');
      const major = Number(opts.majorStep ?? 100);
      let minor = Number(opts.minorStep ?? (major / 2));
      if (!(minor > 0)) minor = major / 2;
      const title = String(opts.title || 'Maatbeker');

      const W = 360, H = 320;
      const topY = 44, botY = 258;
      const cupTopL = 104, cupTopR = 232;
      const cupBotL = 126, cupBotR = 214;
      const h = botY - topY;
      const frac = Math.max(0, Math.min(1, value / max));
      const waterY = botY - frac * h;
      const cupPath = `M ${cupTopL} ${topY} Q ${cupTopL-6} ${topY+18} ${cupTopL+4} ${botY} L ${cupBotR} ${botY} Q ${cupTopR+8} ${topY+18} ${cupTopR} ${topY} Z`;

      const tickEls = [];
      const n = Math.round(max / minor);
      for (let i=0;i<=n;i++){
        const v = Math.round((i * minor) * 1000) / 1000;
        if (v > max + 1e-9) continue;
        const y = botY - (v / max) * h;
        const isMajor = Math.abs((v / major) - Math.round(v / major)) < 1e-7;
        const len = isMajor ? 24 : 14;
        const x1 = cupTopR + 14;
        const x2 = x1 + len;
        tickEls.push(`<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="rgba(29,54,91,.78)" stroke-width="${isMajor ? 3.2 : 2.1}" stroke-linecap="round" />`);
        if (isMajor && v !== 0) {
          tickEls.push(`<text x="${x2 + 10}" y="${y + 5}" font-size="15" fill="#2b4f76" font-weight="900">${fmtNL(v)}</text>`);
        }
      }

      return `
      <div class="measureScene">
        <div class="measureCard">
          <svg viewBox="0 0 ${W} ${H}" width="100%" style="display:block;height:auto">
            <defs>
              <clipPath id="cupClip_${unit}_${max}"><path d="${cupPath}" /></clipPath>
              <linearGradient id="glassGrad_${unit}_${max}" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="rgba(255,255,255,.86)"/>
                <stop offset="100%" stop-color="rgba(222,236,255,.72)"/>
              </linearGradient>
              <linearGradient id="waterGrad_${unit}_${max}" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#8fe1ff"/>
                <stop offset="55%" stop-color="#4aa7ff"/>
                <stop offset="100%" stop-color="#2d6cff"/>
              </linearGradient>
            </defs>

            <rect x="18" y="14" width="324" height="282" rx="24" fill="rgba(255,255,255,.58)" stroke="rgba(136,170,220,.22)" />
            <g>
              <rect x="28" y="22" width="94" height="28" rx="14" fill="#fff5cf" stroke="rgba(201,162,58,.24)"/>
              <text x="75" y="41" text-anchor="middle" font-size="13" font-weight="900" fill="#8a6800">${title}</text>
              <rect x="244" y="22" width="86" height="28" rx="14" fill="#eaf3ff" stroke="rgba(59,130,246,.16)"/>
              <text x="287" y="41" text-anchor="middle" font-size="13" font-weight="900" fill="#2e77ff">schaal in ${unit}</text>
            </g>

            <g filter="drop-shadow(0 14px 18px rgba(55,99,173,.16))">
              <path d="${cupPath}" fill="url(#glassGrad_${unit}_${max})" stroke="#6e9fe8" stroke-width="5" />
              <path d="M ${cupTopR-2} ${topY+20} Q ${cupTopR+36} ${topY+30} ${cupTopR+20} ${topY+68} Q ${cupTopR+12} ${topY+90} ${cupTopR-2} ${topY+82}" fill="none" stroke="#7ab4ff" stroke-width="7" stroke-linecap="round"/>
              <rect x="0" y="${waterY}" width="${W}" height="${H}" clip-path="url(#cupClip_${unit}_${max})" fill="url(#waterGrad_${unit}_${max})" />
              <path d="M ${cupTopL+7} ${waterY} Q ${(cupTopL+cupTopR)/2} ${waterY-6} ${cupTopR-7} ${waterY}" fill="none" stroke="rgba(255,255,255,.8)" stroke-width="3" clip-path="url(#cupClip_${unit}_${max})"/>
              <path d="M ${cupTopL+18} ${topY+16} Q ${cupTopL+10} ${topY+74} ${cupBotL+10} ${botY-12}" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="9" stroke-linecap="round" />
            </g>

            ${tickEls.join('\n')}
            <line x1="${cupTopL - 12}" y1="${waterY}" x2="${cupTopR + 6}" y2="${waterY}" stroke="rgba(29,54,91,.42)" stroke-width="3.2" stroke-dasharray="7 7" />
          </svg>
          <div class="measureCaption">Kijk goed naar de streepjes.</div>
        </div>
      </div>`;
    };
  }

  function rebuildQuestionBank(){
    if (typeof BANK === 'undefined' || !BANK || !BANK.inhoud) return;
    const easy = [];
    const normal = [];
    const hard = [];

    for (let i=0;i<16;i++) easy.push(() => buildMaatbekerQuestion('easy'));
    easy.push(compareCupsQuestion);
    easy.push(() => buildMaatbekerQuestion('easy'));

    for (let i=0;i<10;i++) normal.push(() => buildMaatbekerQuestion('normal'));
    normal.push(() => buildMaatbekerQuestion('easy'));
    normal.push(() => buildMaatbekerQuestion('normal'));

    for (let i=0;i<10;i++) hard.push(() => buildMaatbekerQuestion('hard'));
    hard.push(() => buildMaatbekerQuestion('normal'));
    hard.push(() => buildMaatbekerQuestion('hard'));

    BANK.inhoud.maatbeker = { easy, normal, hard };
  }


  function escapeHtml(s){
    return String(s ?? '')
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;')
      .replace(/'/g,'&#39;');
  }

  function highlightMeasures(s){
    let out = escapeHtml(s);
    out = out.replace(/____/g, '<span class="mqBlank">____</span>');
    out = out.replace(/(\d+(?:[,.]\d+)?)\s*(ml|cl|dl|l)\b/gi, function(_, n, u){
      return `<span class="mqMeasure"><span class="mqVal">${n}</span><span class="mqUnit">${u}</span></span>`;
    });
    return out;
  }

  function compactContentPrompt(q){
    if (!q || q.topic !== 'inhoud') return null;
    if (q.promptHtml) return q.promptHtml;

    let raw = String(q.prompt || '').replace(/\s+/g, ' ').trim();
    if (!raw) return null;

    // Maak klassieke invulvragen compacter: "Hoeveel ml is dat? ____ ml" -> "Hoeveel ml is dat?"
    raw = raw.replace(/\?\s*____\s*(ml|cl|dl|l)\s*\.?$/i, '?');
    raw = raw.replace(/\s*____\s*(ml|cl|dl|l)\s*\.?$/i, '');

    // "Een mok bevat 20 cl. Hoeveel dl is dat?" -> 2 regels.
    const twoSentence = raw.match(/^(.+?[.!])\s*(Hoeveel\s+(ml|cl|dl|l)\s+is\s+dat\??)$/i);
    if (twoSentence) {
      const context = twoSentence[1].replace(/[.!]\s*$/, '.');
      const question = twoSentence[2].replace(/\?*$/, '?');
      const questionHtml = highlightMeasures(question).replace(/\b(ml|cl|dl|l)\b/gi, '<span class="mqQuestionUnit">$1</span>');
      return `
        <div class="mqPrompt measureQuestion">
          <div class="mqPromptKicker">Inhoud</div>
          <div class="mqPromptLine context">${highlightMeasures(context)}</div>
          <div class="mqPromptLine ask">${questionHtml}</div>
        </div>`;
    }

    // "Herleid: 700 ml = ____ l" of "Zet om: 300 ml = ____ cl"
    const eq = raw.match(/^(Herleid|Zet om):?\s*(.+?)\s*=\s*____\s*(ml|cl|dl|l)\.?$/i);
    if (eq) {
      const action = eq[1].toLowerCase() === 'herleid' ? 'Herleid.' : 'Zet om.';
      const left = eq[2];
      const unit = eq[3];
      return `
        <div class="mqPrompt measureQuestion">
          <div class="mqPromptKicker">Inhoud</div>
          <div class="mqPromptLine context">${action}</div>
          <div class="mqPromptLine ask">
            <span class="mqEquation">${highlightMeasures(left)} <span>=</span> <span class="mqBlank">____</span> <span class="mqQuestionUnit">${escapeHtml(unit)}</span></span>
          </div>
        </div>`;
    }

    // "Lees af..."-vragen die nog geen eigen rich prompt hebben.
    if (/^Lees af/i.test(raw)) {
      const unit = (String(q.unit || '').match(/^(ml|cl|dl|l)$/i) || [,''])[1];
      return `
        <div class="mqPrompt measureQuestion">
          <div class="mqPromptKicker">Maatbeker</div>
          <div class="mqPromptLine ask">${highlightMeasures(raw)}</div>
          ${unit ? `<div class="mqPromptSubline">Vul in: <span class="mqBlank">____</span> <span class="mqQuestionUnit">${escapeHtml(unit)}</span></div>` : ''}
        </div>`;
    }

    return null;
  }

  window.WQ_formatQuestionPrompt = compactContentPrompt;

  installBeakerVisual();
  rebuildQuestionBank();
})();


/* ===== Section 3 ===== */


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


/* ===== Section 4 ===== */


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


/* ===== Section 5 ===== */


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
    updateFixedZoneClasses();
    document.addEventListener("click", () => setTimeout(updateFixedZoneClasses, 0));
    window.addEventListener("resize", updateFixedZoneClasses);
  });
})();


/* ===== Section 6 ===== */


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


/* ===== Section 7 ===== */


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
    if (e.target.closest("button,input,.key,.choice,#geoTriangle,.keypadSheet,.answer")) return;

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


/* ===== Section 8 ===== */


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


/* ===== Section 9 ===== */

(function(){
  function isMobileGameViewport(){
    try {
      return !!window.matchMedia('(max-width: 900px), (hover: none) and (pointer: coarse)').matches;
    } catch(_){
      return window.innerWidth <= 900;
    }
  }

  function currentVisibleScreenId(){
    const active = document.querySelector('.screen.active');
    if (active) return active.id;
    const all = Array.from(document.querySelectorAll('.screen'));
    const shown = all.find(el => getComputedStyle(el).display !== 'none');
    return shown?.id || '';
  }

  function syncScreenState(explicitId){
    const id = explicitId || window.APP?.screen || currentVisibleScreenId();
    document.querySelectorAll('.screen').forEach(el => {
      el.classList.toggle('active', el.id === id);
    });
    if (id) document.body.dataset.screen = id;
  }

  function syncGameState(){
    const grid = document.getElementById('gameGrid');
    if (!grid) return;
    const mode =
      grid.classList.contains('mode-mc') || grid.classList.contains('mcMode') ? 'mc' :
      grid.classList.contains('mode-inline') ? 'inline' :
      grid.classList.contains('mode-tap') ? 'tap' :
      grid.classList.contains('mode-geo') || grid.classList.contains('geoMeasureMode') ? 'geo' :
      grid.classList.contains('mode-input') || grid.classList.contains('inputMode') ? 'input' :
      (window.GameState?.uiState?.mode || 'none');
    document.body.dataset.gameMode = mode;
    document.body.dataset.geoMeasure = (mode === 'geo' || grid.classList.contains('geoMeasureMode')) ? '1' : '0';
  }

  function observeGameGrid(){
    const grid = document.getElementById('gameGrid');
    if (!grid || grid.__mobileGameUiObserved) return;
    const mo = new MutationObserver(() => {
      syncGameState();
      window.ActionTray?.sync?.();
    });
    mo.observe(grid, { attributes:true, attributeFilter:['class', 'style'], subtree:false });
    grid.__mobileGameUiObserved = true;
  }

  function init(){
    document.body.classList.add('mobile-game-mobile-ui');
    document.body.classList.toggle('mobile-device-layout', isMobileGameViewport());

    document.addEventListener('app:screenchange', (e) => {
      syncScreenState(e?.detail?.id || '');
      syncGameState();
      window.ActionTray?.sync?.();
    });

    syncScreenState();
    syncGameState();
    observeGameGrid();
    window.ActionTray?.sync?.();

    window.addEventListener('resize', () => {
      document.body.classList.toggle('mobile-device-layout', isMobileGameViewport());
      syncScreenState();
      syncGameState();
      observeGameGrid();
      window.ActionTray?.sync?.();
    }, { passive:true });

    setTimeout(() => {
      syncScreenState();
      syncGameState();
      observeGameGrid();
      window.ActionTray?.sync?.();
    }, 80);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once:true });
  } else {
    init();
  }
})();
