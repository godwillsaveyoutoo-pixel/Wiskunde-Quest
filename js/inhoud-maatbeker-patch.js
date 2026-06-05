
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
