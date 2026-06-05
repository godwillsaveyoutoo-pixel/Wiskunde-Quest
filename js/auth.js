/* =========================
   Wiskunde Quest – auth.js
   Supabase auth + login/signup
========================= */

/* ---------- Supabase setup ---------- */
const SUPABASE_URL = "https://jreitzsnmjrtkeoiuyyd.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpyZWl0enNubWpydGtlb2l1eXlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1OTI5NTEsImV4cCI6MjA4MjE2ODk1MX0.JKvsSmazmOeHxLeMk5dOtOGZKHaPGr66Ki1ZvLLUhHI";

const sb = window.supabase?.createClient
  ? window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      }
    )
  : null;

// expose for other modules (stats/teacher)
window.sb = sb;


/* ---------- Auth state ---------- */
let authUser = null;
let guestMode = false;
window.authUser = authUser;
window.guestMode = guestMode;

function setGuestMode(on) {
  guestMode = !!on;
  window.guestMode = guestMode;
  try {
    if (guestMode) localStorage.setItem("wq_guest_mode", "1");
    else localStorage.removeItem("wq_guest_mode");
  } catch (_) {}
}

function startGuest() {
  authUser = null;
  window.authUser = authUser;
  setGuestMode(true);
  try {
    if (window.profile) {
      profile.username = "gast";
      profile.name = "Gast";
      profile.class = "1B";
      profile.role = "student";
    }
    loadLearnerStores?.();
  } catch (_) {}
  updateUserPill?.();
  renderSettings?.();
  showScreen?.("scrMap");
}

/* ---------- Username helpers ---------- */
function cleanUsername(u) {
  return (u || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ".")
    .replace(/[^a-z0-9._-]/g, "");
}

function usernameToEmail(username) {
  const u = cleanUsername(username);
  return {
    username: u,
    email: u ? `${u}@wiskundequest.example` : "",
  };
}

/* ---------- Public helpers ---------- */
function isAuthed() {
  return !!authUser;
}

function hasIdentity() {
  return !!authUser || !!guestMode;
}

/* ---------- Core auth lifecycle ---------- */
async function initAuth() {
  if (!sb?.auth) {
    await onAuthSignedOut();
    return;
  }

  // 1) bestaande sessie ophalen (refresh / reload)
  const {
    data: { session },
  } = await sb.auth.getSession();

  if (session?.user) {
    authUser = session.user;
    window.authUser = authUser;
    await onAuthReady();
  } else {
    await onAuthSignedOut();
  }

  // 2) luisteren naar latere auth changes
  sb.auth.onAuthStateChange(async (_event, session) => {
    authUser = session?.user || null;
    window.authUser = authUser;

    if (authUser) {
      await onAuthReady();
    } else {
      await onAuthSignedOut();
    }
  });
}

/* ---------- Login ---------- */
async function login(username, password) {
  if (!sb?.auth) throw new Error("Login is niet beschikbaar. Speel als gast of controleer je internetverbinding.");
  const { email } = usernameToEmail(username);

  if (!email || !password) {
    throw new Error("Gebruikersnaam en wachtwoord vereist.");
  }
  if (password.length < 6) {
    throw new Error("Wachtwoord moet minstens 6 tekens zijn.");
  }

  const { error } = await sb.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
}

/* ---------- Signup ---------- */
async function signup({ username, password, name, className }) {
  if (!sb?.auth) throw new Error("Account maken is niet beschikbaar. Speel als gast of controleer je internetverbinding.");
  const { email, username: cleanU } = usernameToEmail(username);

  if (!email || !password) {
    throw new Error("Gebruikersnaam en wachtwoord vereist.");
  }
  if (password.length < 6) {
    throw new Error("Wachtwoord moet minstens 6 tekens zijn.");
  }
  if (!name?.trim()) {
    throw new Error("Naam is verplicht (voor scoreboard).");
  }

  // Klas staat vast (1B) – leerlingen hoeven dit niet in te vullen
  className = (className && String(className).trim()) ? String(className).trim() : '1B';

  const { data, error } = await sb.auth.signUp({
    email,
    password,
  });

  if (error) throw error;

  // Probeer meteen een echte sessie te krijgen (niet enkel een signup user).
  try {
    const { data: sData, error: sErr } = await sb.auth.signInWithPassword({
      email,
      password,
    });
    if (sErr) throw sErr;
    authUser = sData?.user || data.user;
  } catch (e) {
    // Signup kan slagen zonder actieve sessie (bv. storage of policy issues).
    console.warn("Auto-login na signup mislukt:", e?.message || e);
    authUser = data.user;
  }
  window.authUser = authUser;

  // profiel wordt centraal beheerd in profile.js
  if (typeof ensureProfileRow === "function") {
  const row = await ensureProfileRow({
    username: cleanU,
    name: name.trim(),
    class: String(className||'1B').trim(),
  });

  if (typeof applyRemoteProfile === "function") {
    applyRemoteProfile(row);
  }
}
}
/* ---------- Logout ---------- */
async function logout() {
  setGuestMode(false);
  if (sb?.auth) {
    try { await sb.auth.signOut(); } catch (_) {}
  }
  authUser = null;
  window.authUser = authUser;
}

/* ---------- Auth → app hooks ---------- */
async function onAuthReady() {
  // laad lokale stores voor deze user (skills/prog)
  try {
    loadLearnerStores?.();
  } catch (_) {}

  // profiel ophalen / syncen
  if (typeof ensureProfileRow === "function") {
    try {
      const row = await ensureProfileRow();
      if (typeof applyRemoteProfile === "function") {
        applyRemoteProfile(row);
      }
    } catch (e) {
      console.warn("Profile sync failed:", e);
    }
  }

  // UI
  updateUserPill?.();
  renderSettings?.();

  // naar map
  showScreen?.("scrMap");

  // leaderboard verversen (non-blocking)
  try {
    refreshAllLB?.();
  } catch (_) {}
}

async function onAuthSignedOut() {
  authUser = null;
  window.authUser = authUser;

  // laad lokale stores voor anonieme user
  try {
    loadLearnerStores?.();
  } catch (_) {}

  updateUserPill?.();
  renderSettings?.();

  // na logout/loginwissel niet automatisch opnieuw in gastmodus vallen
  showScreen?.("scrStart");
}

/* ---------- Exports ---------- */
window.startGuest = startGuest;
window.setGuestMode = setGuestMode;
window.isAuthed = isAuthed;
window.hasIdentity = hasIdentity;

/* ---------- Auto init ---------- */
document.addEventListener("DOMContentLoaded", initAuth);
