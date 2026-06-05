/* =========================
   Wiskunde Quest – ui-shell.js
   Shell UI wiring: user pill,
   drawer, topic modal,
   settings, auth/start UI
========================= */

/* ---------- Subtopics config ---------- */
/* (tijdelijk hier, later evt. naar topics.js) */
const SUBTOPICS = {
  massa: [
    { id: "convert", label: "Omrekenen" },
    { id: "context", label: "Context" },
    { id: "unit_choice", label: "Eenheid kiezen" },
    { id: "error", label: "Fouten herkennen" }
  ],
  gemmid: [
    { id: "median", label: "Mediaan" },
    { id: "mean", label: "Gemiddelde" }
  ],
  tijd: [
    { id: "clock_read", label: "Klok lezen" },
    { id: "convert", label: "Omrekenen" },
    { id: "time_add", label: "Tijd optellen" },
    { id: "time_sub", label: "Tijd aftrekken" }
  ],
  lijnen: [
    { id: "relations", label: "Relaties tussen lijnen" }
  ],
  hoeken: [
    { id: "angle_type", label: "Soorten hoeken" },
    { id: "measure", label: "Hoeken meten" }
  ],
  breuken: [
    { id: "simplify", label: "Vereenvoudigen" },
    { id: "fraction_of", label: "Breuk van een getal" },
    { id: "read_fraction", label: "Aflezen" },
    { id: "complement", label: "Aanvullen" },
    { id: "compare", label: "Vergelijken" }
  ],
  procent: [
    { id: "percent_of", label: "Percentage van" },
    { id: "discount", label: "Korting" },
    { id: "increase", label: "Verhoging" },
    { id: "complement", label: "Aanvullen tot 100%" },
    { id: "compare", label: "Vergelijken" },
    { id: "error", label: "Fouten" }
  ]
};

/* ---------- User pill ---------- */
function updateUserPill() {
  const pill = document.getElementById("pillUser");
  if (!pill) return;

  if (!authUser) {
    if (window.guestMode) {
      pill.textContent = "Gast • 1B";
      pill.classList.add("guestPill");
    } else {
      pill.textContent = "Niet ingelogd";
      pill.classList.remove("guestPill");
    }
    updateNavVisibility();
    return;
  }
  pill.classList.remove("guestPill");

  if (profile.name) {
    const tag = profile.class ? ` • ${profile.class}` : "";
    const t = profile.role === "teacher" ? " 👩‍🏫" : "";
    pill.textContent = `${profile.name}${tag}${t}`;
  } else {
    pill.textContent = "Ingelogd";
  }
  updateNavVisibility();
}

function updateNavVisibility(){
  const teach = document.getElementById('navTeacher');
  const badges = document.getElementById('navBadges');
  const isTeach = !!(profile && profile.role === 'teacher');
  if (teach) teach.style.display = isTeach ? '' : 'none';
  if (badges) badges.style.display = authUser ? '' : 'none';
  try { window.updateBadgePill?.(); } catch (_) {}
}

/* ---------- Drawer ---------- */
async function openDrawer() {
  try {
    await window.refreshRemoteProfile?.();
  } catch (_) {}
  $("#drawer")?.classList.add("open");
}

function closeDrawer() {
  $("#drawer")?.classList.remove("open");
}

/* ---------- Topic modal ---------- */
function openTopicModal(topic) {
  $("#topicModalTitle").textContent = topic.title;

  const badge = $("#topicModalBadges");
  const runBtn = document.getElementById("btnTopicRun");

  let lockInfo = "";
  if (runBtn) {
    runBtn.disabled = false;
    runBtn.classList.remove("disabled");
  }

  if (badge) {
    const medal = prog?.medals?.[topic.id]
      ? `Behaald: ${medalEmoji(prog.medals[topic.id])}`
      : "Nog geen medaille";

    const bc = (typeof window.badgeCount === "function") ? window.badgeCount(topic.id) : 0;
    const badgesTxt = `Badges: ${bc}`;
    const extra = lockInfo ? `${lockInfo} • ${badgesTxt}` : badgesTxt;
    badge.textContent = `${medal} • ${extra}`;
  }

  $("#topicModalBack")?.classList.add("open");
}

function closeTopicModal() {
  $("#topicModalBack")?.classList.remove("open");
}

/* ---------- Settings ---------- */
function renderSettings() {
  $("#settingsUser").textContent = authUser
    ? `${profile.name || "—"} • ${(profile.class || "1B")} ${profile.role === "teacher" ? "(teacher)" : ""}`
    : (window.guestMode ? "Gast • 1B (lokaal op dit toestel)" : "Niet ingelogd");

  $("#autoOkState").textContent = profile.settings.autoOk ? "on" : "off";
  $("#soundState").textContent = profile.settings.sound ? "on" : "off";
  const gateBtn = document.getElementById("togGateRun");
  if (gateBtn) gateBtn.style.display = "none";
  const g = document.getElementById("gateRunState");
  if (g) g.textContent = "off";
}

/* ---------- Event bindings ---------- */
document.addEventListener("DOMContentLoaded", () => {
  /* Drawer */
  $("#btnMenu")?.addEventListener("click", () => { openDrawer(); });
  $("#btnCloseDrawer")?.addEventListener("click", closeDrawer);

  $("#pillBadges")?.addEventListener("click", () => {
    window.renderBadges?.();
    showScreen("scrBadges");
  });

  $("#btnBackFromBadges")?.addEventListener("click", () => {
    showScreen((authUser || window.guestMode) ? "scrMap" : "scrStart");
  });

  $$(".drawer .item").forEach((item) => {
    item.addEventListener("click", () => {
      closeDrawer();
      const nav = item.dataset.nav;
      if (nav === "map") showScreen("scrMap");
      if (nav === "board") showScreen("scrBoard");
      if (nav === "settings") {
        renderSettings();
        showScreen("scrSettings");
      }
      if (nav === "stats") {
        window.renderMyStats?.();
        showScreen("scrStats");
      }
      if (nav === "badges") {
        window.renderBadges?.();
        showScreen("scrBadges");
      }
      if (nav === "teacher") {
        Promise.resolve(window.refreshRemoteProfile?.())
          .finally(() => {
            window.renderTeacherDashboard?.();
            showScreen("scrTeacher");
          });
      }
    });
  });

  /* Settings toggles */
  $("#togAutoOk")?.addEventListener("click", () => {
    profile.settings.autoOk = !profile.settings.autoOk;
    saveProfile();
    renderSettings();
  });

  $("#togSound")?.addEventListener("click", () => {
    profile.settings.sound = !profile.settings.sound;
    saveProfile();
    renderSettings();
  });

  $("#btnSessionTest")?.addEventListener("click", async () => {
    const out = $("#sessionStatus");
    if (out) out.textContent = "Sessietest bezig...";
    try {
      const { data, error } = await window.sb?.auth?.getSession?.();
      if (error) throw error;
      const ok = !!data?.session;
      if (out) out.textContent = ok
        ? "Sessietest: OK (ingelogd)"
        : "Sessietest: geen actieve sessie";
    } catch (e) {
      if (out) out.textContent = "Sessietest fout: " + (e?.message || e);
    }
  });

  $("#btnCloseSettings")?.addEventListener("click", () => {
    showScreen((authUser || window.guestMode) ? "scrMap" : "scrStart");
  });

  $("#btnLogout")?.addEventListener("click", async () => {
    await logout();
    showScreen("scrStart");
  });

  /* Topic modal */
  $("#btnCloseTopic")?.addEventListener("click", closeTopicModal);

  $("#topicModalBack")?.addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closeTopicModal();
  });

  /* Start screen buttons */
  $("#btnGuest")?.addEventListener("click", () => {
    try { window.startGuest?.(); }
    catch (e) { console.warn("Guest start failed", e); }
  });

  $("#btnStartLeader")?.addEventListener("click", () => {
    showScreen("scrBoard");
  });

  $("#btnStartSettings")?.addEventListener("click", () => {
    renderSettings();
    showScreen("scrSettings");
  });

  /* Auth tabs */
  $("#tabLogin")?.addEventListener("click", () => {
    $("#tabLogin").classList.add("on");
    $("#tabSignup").classList.remove("on");
    $("#paneLogin").hidden = false;
    $("#paneSignup").hidden = true;
  });

  $("#tabSignup")?.addEventListener("click", () => {
    $("#tabSignup").classList.add("on");
    $("#tabLogin").classList.remove("on");
    $("#paneSignup").hidden = false;
    $("#paneLogin").hidden = true;
  });

  /* Login */
  $("#btnLogin")?.addEventListener("click", async () => {
    try {
      $("#authMsg").textContent = "";
      await login(
        $("#loginUser").value,
        $("#loginPass").value
      );
    } catch (e) {
      $("#authMsg").textContent = e.message || "Login mislukt";
    }
  });

  /* Signup */
  $("#btnSignup")?.addEventListener("click", async () => {
    try {
      $("#authMsg").textContent = "";
      await signup({
        username: $("#signupUser").value,
        password: $("#signupPass").value,
        name: $("#signupName").value,
        className: $("#signupClass")?.value || "1B",
      });
    } catch (e) {
      $("#authMsg").textContent = e.message || "Account maken mislukt";
    }
  });
});

window.SUBTOPICS = SUBTOPICS;
window.updateUserPill = updateUserPill;
window.renderSettings = renderSettings;
window.openTopicModal = openTopicModal;
window.closeTopicModal = closeTopicModal;
window.openDrawer = openDrawer;
window.closeDrawer = closeDrawer;
