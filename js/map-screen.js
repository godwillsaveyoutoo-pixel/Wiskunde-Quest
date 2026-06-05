/* =========================
   Wiskunde Quest – map-screen.js
   Topic deck & launcher
========================= */
(function(){
  const deckState = {
    initialized: false,
    scrollRaf: 0,
  };

  function topicDeckMeta(topic) {
    const n = topic?.subtopics ? Object.keys(topic.subtopics).length : 0;
    if (topic?.id === "global") return "mix";
    return n === 1 ? "1 oefenroute" : `${n} oefenroutes`;
  }

  function topicProgressText(topic) {
    const medal = (typeof prog !== "undefined" && prog?.medals) ? (prog.medals[topic.id] || "") : "";
    if (medal && typeof medalEmoji === "function") return `${medalEmoji(medal)} behaald`;

    const p = (typeof prog !== "undefined" && prog?.practice) ? prog.practice[topic.id] : null;
    if (p?.a) {
      const pct = Math.round((Number(p.c || 0) / Number(p.a || 1)) * 100);
      return `${pct}% juist`;
    }
    return "nieuw";
  }

  function getDeckGrid() {
    return document.getElementById('mapGrid');
  }

  function getDeckDots() {
    return document.getElementById('mapDots');
  }

  function getTopicDeckCards() {
    return Array.from(document.querySelectorAll('#mapGrid .deckCard'));
  }

  function setActiveTopicCard(index) {
    const cards = getTopicDeckCards();
    const dots = Array.from(document.querySelectorAll('#mapDots .mapDot'));
    cards.forEach((c, i) => c.classList.toggle('active', i === index));
    dots.forEach((d, i) => d.classList.toggle('active', i === index));
  }

  function activeTopicIndex() {
    const cards = getTopicDeckCards();
    if (!cards.length) return 0;
    const cx = window.innerWidth / 2;
    let best = 0;
    let bestDist = Infinity;
    cards.forEach((card, i) => {
      const r = card.getBoundingClientRect();
      const mid = r.left + r.width / 2;
      const d = Math.abs(mid - cx);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    });
    return best;
  }

  function scrollTopicDeckTo(index) {
    const cards = getTopicDeckCards();
    const card = cards[index];
    if (!card) return;
    card.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    setActiveTopicCard(index);
  }

  function renderTopicModalContent(topic) {
    const wrap = document.getElementById('topicModalContent');
    if (!wrap) return;

    const subs = Object.values(topic?.subtopics || {}).slice(0, 6);
    wrap.innerHTML = subs.length
      ? `<div class="routeChips">${subs.map(s => `<span>${s.title}</span>`).join('')}</div>`
      : '';
  }

  function bindTopicStartButtons(topic) {
    const practice = document.getElementById('btnTopicPractice');
    const run = document.getElementById('btnTopicRun');
    const test = document.getElementById('btnTopicTest');

    if (practice) {
      practice.onclick = () => {
        window.closeTopicModal?.();
        window.startGame?.({
          topic: { id: topic.id, title: topic.title },
          mode: 'practice',
        });
      };
    }

    if (run) {
      run.onclick = () => {
        if (run.disabled) return;
        window.closeTopicModal?.();
        window.startGame?.({
          topic: { id: topic.id, title: topic.title },
          mode: 'run',
          limit: 5 * 60 * 1000,
        });
      };
    }

    if (test) {
      test.onclick = () => {
        window.closeTopicModal?.();
        window.showScreen?.('scrTestSetup');
        window.__pendingTestTopic = topic;
      };
    }
  }

  function buildTopicCard(topic, index) {
    const medal = (typeof prog !== 'undefined' && prog?.medals) ? (prog.medals[topic.id] || '') : '';
    const medalClass = medal ? `medal-${medal}` : '';
    const medalEmojiSafe = (typeof medalEmoji === 'function' && medal) ? medalEmoji(medal) : '';

    const card = document.createElement('button');
    card.type = 'button';
    card.className = `tile topicCard deckCard ${medalClass}`.trim();
    card.dataset.index = String(index);
    card.dataset.topic = topic.id;
    card.innerHTML = `
      ${medal ? `<div class="cornerMedal ${medal}" title="Medaille">${medalEmojiSafe}</div>` : ''}
      <div class="tileTop" aria-hidden="true">${topic.icon || ''}</div>
      <div class="tileText">
        <div class="tileTitle">${topic.title}</div>
        <div class="topicMeta"><span>${topicDeckMeta(topic)}</span><span>${topicProgressText(topic)}</span></div>
        <div class="topicTap">Tik om te kiezen</div>
      </div>
    `;

    const open = () => {
      window.openTopicModal?.(topic);
      bindTopicStartButtons(topic);
      setTimeout(() => renderTopicModalContent(topic), 0);
    };

    card.addEventListener('click', open);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        open();
      }
    });

    return card;
  }

  function buildDot(topic, index) {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'mapDot';
    dot.setAttribute('aria-label', `Ga naar ${topic.title}`);
    dot.dataset.index = String(index);
    dot.addEventListener('click', () => scrollTopicDeckTo(index));
    return dot;
  }

  function initTopicDeck() {
    const grid = getDeckGrid();
    if (!grid) return;

    if (!deckState.initialized) {
      deckState.initialized = true;
      grid.addEventListener('scroll', () => {
        cancelAnimationFrame(deckState.scrollRaf);
        deckState.scrollRaf = requestAnimationFrame(() => setActiveTopicCard(activeTopicIndex()));
      }, { passive: true });

      const prev = document.getElementById('btnTopicPrev');
      const next = document.getElementById('btnTopicNext');
      if (prev) prev.onclick = () => scrollTopicDeckTo(Math.max(0, activeTopicIndex() - 1));
      if (next) next.onclick = () => scrollTopicDeckTo(Math.min(getTopicDeckCards().length - 1, activeTopicIndex() + 1));
    }

    setActiveTopicCard(activeTopicIndex());
  }

  function renderTopicMap() {
    const grid = getDeckGrid();
    if (!grid || !Array.isArray(window.TOPICS)) return;

    grid.innerHTML = '';
    const dots = getDeckDots();
    if (dots) dots.innerHTML = '';

    window.TOPICS.forEach((topic, index) => {
      grid.appendChild(buildTopicCard(topic, index));
      if (dots) dots.appendChild(buildDot(topic, index));
    });

    requestAnimationFrame(initTopicDeck);
  }

  function init() {
    renderTopicMap();
  }

  const api = {
    init,
    renderTopicMap,
    scrollTopicDeckTo,
    topicDeckMeta,
    topicProgressText,
    bindTopicStartButtons,
    renderTopicModalContent,
  };

  window.MapScreen = api;
  window.renderTopicMap = renderTopicMap;
  window.scrollTopicDeckTo = scrollTopicDeckTo;
})();
