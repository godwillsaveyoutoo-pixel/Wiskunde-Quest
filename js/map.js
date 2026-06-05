/* =========================
   Wiskunde Quest – map.js
   Topic deck & game launcher
   SVG's en vraagbanken blijven onaangeroerd.
========================= */

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

function renderTopicMap() {
  const grid = document.getElementById("mapGrid");
  if (!grid || !Array.isArray(window.TOPICS)) return;

  grid.innerHTML = "";

  const dots = document.getElementById("mapDots");
  if (dots) dots.innerHTML = "";

  TOPICS.forEach((topic, index) => {
    const medal = (typeof prog !== "undefined" && prog?.medals) ? (prog.medals[topic.id] || "") : "";
    const medalClass = medal ? `medal-${medal}` : "";
    const medalEmojiSafe = (typeof medalEmoji === "function" && medal) ? medalEmoji(medal) : "";

    const card = document.createElement("button");
    card.type = "button";
    card.className = `tile topicCard deckCard ${medalClass}`.trim();
    card.dataset.index = String(index);
    card.dataset.topic = topic.id;

    card.innerHTML = `
      ${medal ? `<div class="cornerMedal ${medal}" title="Medaille">${medalEmojiSafe}</div>` : ""}
      <div class="tileTop" aria-hidden="true">${topic.icon || ""}</div>
      <div class="tileText">
        <div class="tileTitle">${topic.title}</div>
        <div class="topicMeta"><span>${topicDeckMeta(topic)}</span><span>${topicProgressText(topic)}</span></div>
        <div class="topicTap">Tik om te kiezen</div>
      </div>
    `;

    const open = () => {
      openTopicModal(topic);
      bindTopicStartButtons(topic);
      setTimeout(() => renderTopicModalContent(topic), 0);
    };
    card.addEventListener("click", open);
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        open();
      }
    });

    grid.appendChild(card);

    if (dots) {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "mapDot";
      dot.setAttribute("aria-label", `Ga naar ${topic.title}`);
      dot.dataset.index = String(index);
      dot.addEventListener("click", () => scrollTopicDeckTo(index));
      dots.appendChild(dot);
    }
  });

  requestAnimationFrame(() => initTopicDeck());
}

function getTopicDeckCards() {
  return Array.from(document.querySelectorAll("#mapGrid .deckCard"));
}

function scrollTopicDeckTo(index) {
  const cards = getTopicDeckCards();
  const card = cards[index];
  if (!card) return;
  card.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  setActiveTopicCard(index);
}

function setActiveTopicCard(index) {
  const cards = getTopicDeckCards();
  const dots = Array.from(document.querySelectorAll("#mapDots .mapDot"));
  cards.forEach((c, i) => c.classList.toggle("active", i === index));
  dots.forEach((d, i) => d.classList.toggle("active", i === index));
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
    if (d < bestDist) { bestDist = d; best = i; }
  });
  return best;
}

function initTopicDeck() {
  const grid = document.getElementById("mapGrid");
  if (!grid || grid.dataset.deckReady === "1") {
    setActiveTopicCard(activeTopicIndex());
    return;
  }
  grid.dataset.deckReady = "1";

  let raf = 0;
  grid.addEventListener("scroll", () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => setActiveTopicCard(activeTopicIndex()));
  }, { passive: true });

  const prev = document.getElementById("btnTopicPrev");
  const next = document.getElementById("btnTopicNext");
  if (prev) prev.onclick = () => scrollTopicDeckTo(Math.max(0, activeTopicIndex() - 1));
  if (next) next.onclick = () => scrollTopicDeckTo(Math.min(getTopicDeckCards().length - 1, activeTopicIndex() + 1));

  setActiveTopicCard(0);
}

function bindTopicStartButtons(topic) {
  const practice = document.getElementById("btnTopicPractice");
  const run = document.getElementById("btnTopicRun");
  const test = document.getElementById("btnTopicTest");

  if (practice) {
    practice.onclick = () => {
      closeTopicModal();
      startGame({
        topic: { id: topic.id, title: topic.title },
        mode: "practice",
      });
    };
  }

  if (run) {
    run.onclick = () => {
      if (run.disabled) return;
      closeTopicModal();
      startGame({
        topic: { id: topic.id, title: topic.title },
        mode: "run",
        limit: 5 * 60 * 1000,
      });
    };
  }

  if (test) {
    test.onclick = () => {
      closeTopicModal();
      showScreen("scrTestSetup");
      window.__pendingTestTopic = topic;
    };
  }
}

function renderTopicModalContent(topic) {
  const wrap = document.getElementById("topicModalContent");
  if (!wrap) return;

  const subs = Object.values(topic.subtopics || {}).slice(0, 6);
  wrap.innerHTML = subs.length
    ? `<div class="routeChips">${subs.map(s => `<span>${s.title}</span>`).join("")}</div>`
    : "";
}


document.addEventListener("DOMContentLoaded", () => {
  renderTopicMap();


  // Test setup: seg buttons (aantal vragen + tijdslimiet)
  function wireSeg(segId) {
    const seg = document.getElementById(segId);
    if (!seg) return;
    seg.addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (!btn) return;
      seg.querySelectorAll("button").forEach((b) => b.classList.remove("on"));
      btn.classList.add("on");
    });
  }
  wireSeg("testCountSeg");
  wireSeg("testTimeSeg");

  // Terug vanuit toets-setup
  document.getElementById("btnBackFromTestSetup")?.addEventListener("click", () => {
    showScreen("scrMap");
  });

  /* ---------- Start Toets ---------- */
  document.getElementById("btnStartTest")?.addEventListener("click", async () => {
    if (!window.__pendingTestTopic) return;

    const count =
      document.querySelector("#testCountSeg .on")?.dataset.n ?? 20;

    const time =
      document.querySelector("#testTimeSeg .on")?.dataset.t ?? 0;

    
    // Vraag naam/klas (voor bewijsje), indien beschikbaar
    let identity = null;
    try {
      if (window.MR_SHARED?.askName) {
        identity = await MR_SHARED.askName("toets", {
          fixedClass: '1B',
          hideClass: true,
          extraFlags: [
            { id: "dyscalculie", label: "Ik heb dyscalculie", checked: false }
          ]
        });
      }
    } catch (e) {
      console.warn("askName failed", e);
    }

    startGame({
      topic: {
        id: window.__pendingTestTopic.id,
        title: window.__pendingTestTopic.title,
      },
      mode: "test",
      limit: Number(time) * 1000,
      count: Number(count) || 20,
      identity: identity && typeof identity === "object"
        ? identity
        : { name: identity || "", class: "", flags: {} },
    });
});
});


window.renderTopicMap = renderTopicMap;
window.scrollTopicDeckTo = scrollTopicDeckTo;
