/* Traitors UK S4 Notes (spoiler-free)
   - Stores everything locally (localStorage)
   - Preloads Episode 1 starting cast + headshots from RTS cast page (credited BBC/Studio Lambert)
   - No roles/outcomes included
*/ 

const LS_KEY = "traitors_uk_s4_notes_v3"; // bump to reset data if needed

const $ = (sel) => document.querySelector(sel);

const state = {
  data: loadData(),
  selectedContestantId: null,
};

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function loadData() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return { contestants: [], notes: [] };
    const parsed = JSON.parse(raw);
    if (!parsed.contestants || !parsed.notes) return { contestants: [], notes: [] };
    return parsed;
  } catch {
    return { contestants: [], notes: [] };
  }
}

function saveData() {
  localStorage.setItem(LS_KEY, JSON.stringify(state.data));
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve(null);
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function normaliseTags(tagStr) {
  return (tagStr || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 10);
}

function placeholderSvg() {
  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80">
    <rect width="100%" height="100%" rx="14" fill="#1c244a"/>
    <circle cx="40" cy="33" r="14" fill="#2a3160"/>
    <rect x="18" y="50" width="44" height="22" rx="11" fill="#2a3160"/>
  </svg>`;
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* -------------------------
   Preload cast (no spoilers)
   Photos hosted on rts.org.uk (cast headshots)
-------------------------- */

const PRELOAD_CONTESTANTS = [
  { name: "Netty Österberg", age: 42, from: "Glasgow", job: "Nursery school teacher", photoUrl: "https://rts.org.uk/sites/default/files/inline-images/netty.jpg" },
  { name: "Judy Wilson", age: 60, from: "Doncaster", job: "Child liaison officer", photoUrl: "https://rts.org.uk/sites/default/files/inline-images/judy.jpg" },
  { name: "Ben", age: 66, from: "Hampshire", job: "Royal Navy veteran", photoUrl: "https://rts.org.uk/sites/default/files/inline-images/ben.jpg" },
  { name: "Hugo Lodge", age: 51, from: "London", job: "Barrister", photoUrl: "https://rts.org.uk/sites/default/files/inline-images/hugo.jpg" },
  { name: "Ross Garshong", age: 37, from: "London", job: "Sales executive & personal trainer", photoUrl: "https://rts.org.uk/sites/default/files/inline-images/ross.jpg" },
  { name: "Marzook “Maz” Bana", age: 59, from: "Preston", job: "Civil servant", photoUrl: "https://rts.org.uk/sites/default/files/inline-images/maz.jpg" },
  { name: "Amanda Collier", age: 57, from: "Brighton", job: "Retired police detective", photoUrl: "https://rts.org.uk/sites/default/files/inline-images/amanda.jpg" },
  { name: "Reece Ward", age: 27, from: "Sheffield", job: "Sweet shop assistant", photoUrl: "https://rts.org.uk/sites/default/files/inline-images/reece.jpg" },
  { name: "Fiona Hughes", age: 62, from: "Swansea", job: "Local government officer", photoUrl: "https://rts.org.uk/sites/default/files/inline-images/fiona.jpg" },
  { name: "Harriet Tyce", age: 52, from: "London", job: "Crime writer & former barrister", photoUrl: "https://rts.org.uk/sites/default/files/inline-images/harriet.jpg" },
  { name: "Adam Waughman", age: 34, from: "Romford", job: "Builder", photoUrl: "https://rts.org.uk/sites/default/files/inline-images/adam.jpg" },
  { name: "Sam Little", age: 34, from: "North Yorkshire", job: "Account manager", photoUrl: "https://rts.org.uk/sites/default/files/inline-images/sam.jpg" },
  { name: "Jessie Stride", age: 28, from: "Hull", job: "Hairstylist", photoUrl: "https://rts.org.uk/sites/default/files/inline-images/jessie.jpg" },
  { name: "Ellie Buckley", age: 33, from: "London", job: "Psychologist", photoUrl: "https://rts.org.uk/sites/default/files/inline-images/ellie.jpg" },
  { name: "Matthew Hyndman", age: 35, from: "Edinburgh", job: "Creative director", photoUrl: "https://rts.org.uk/sites/default/files/inline-images/matthew.jpg" },
  { name: "Roxy Wilson", age: 32, from: "Amsterdam", job: "Recruiter", photoUrl: "https://rts.org.uk/sites/default/files/inline-images/roxy.jpg" },
  { name: "James Baker", age: 38, from: "Weymouth", job: "Gardener", photoUrl: "https://rts.org.uk/sites/default/files/inline-images/james.jpg" },
  { name: "Jade Scott", age: 25, from: "Warwick", job: "PhD student", photoUrl: "https://rts.org.uk/sites/default/files/inline-images/jade.jpg" },
  { name: "Faraaz Noor", age: 22, from: "Middlesbrough", job: "Internal auditor", photoUrl: "https://rts.org.uk/sites/default/files/inline-images/faraaz.jpg" },
  { name: "Jack Butler", age: 29, from: "Hatfield Heath", job: "Personal trainer", photoUrl: "https://rts.org.uk/sites/default/files/inline-images/jack.jpg" },
  // RTS uses a different filename for Rachel on their page:
  { name: "Rachel Duffy", age: 42, from: "County Down", job: "Head of communications", photoUrl: "https://rts.org.uk/sites/default/files/inline-images/p0mrgbv4.jpg" },
  { name: "Stephen Libby", age: 32, from: "London", job: "Cyber security consultant", photoUrl: "https://rts.org.uk/sites/default/files/inline-images/stephen.jpg" },
];

function ensurePreloadOnce() {
  if (state.data.contestants.length > 0) return;

  state.data.contestants = PRELOAD_CONTESTANTS.map((c) => ({
    id: uid(),
    name: c.name,
    age: c.age ?? null,
    from: c.from ?? "",
    job: c.job ?? "",
    photoUrl: c.photoUrl ?? null,   // remote URL
    photoDataUrl: null,             // optional user upload override
  }));

  saveData();
}

/* -------------------------
   Contestants
-------------------------- */

function renderContestants() {
  const list = $("#contestantList");
  const q = ($("#contestantSearch").value || "").toLowerCase();

  const items = state.data.contestants
    .filter((c) => {
      const hay = `${c.name} ${c.from || ""} ${c.job || ""} ${c.age || ""}`.toLowerCase();
      return hay.includes(q);
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  list.innerHTML = "";

  if (items.length === 0) {
    list.innerHTML = `<div class="muted">No contestants yet. Add one above ✨</div>`;
    return;
  }

  for (const c of items) {
    const div = document.createElement("div");
    div.className = "contestant" + (c.id === state.selectedContestantId ? " active" : "");
    div.setAttribute("role", "button");
    div.tabIndex = 0;

    const img = document.createElement("img");
    img.className = "avatar";
    img.alt = `${c.name} photo`;
    img.src =
      c.photoDataUrl ||
      c.photoUrl ||
      "data:image/svg+xml;charset=utf-8," + encodeURIComponent(placeholderSvg());

    const meta = document.createElement("div");
    meta.className = "cMeta";

    const details = [
      c.age ? `Age: ${c.age}` : null,
      c.from ? `From: ${c.from}` : null,
      c.job ? `Job: ${c.job}` : null,
    ].filter(Boolean);

    meta.innerHTML = `
      <p class="cName">${escapeHtml(c.name)}</p>
      <div class="cDetails">
        ${details.map((d) => `<div>${escapeHtml(d)}</div>`).join("")}
      </div>
    `;

    const actions = document.createElement("div");
    actions.className = "cActions";

    const del = document.createElement("button");
    del.className = "iconBtn danger";
    del.type = "button";
    del.title = "Delete contestant";
    del.textContent = "🗑️";
    del.addEventListener("click", (e) => {
      e.stopPropagation();
      deleteContestant(c.id);
    });

    actions.appendChild(del);

    div.appendChild(img);
    div.appendChild(meta);
    div.appendChild(actions);

    div.addEventListener("click", () => selectContestant(c.id));
    div.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") selectContestant(c.id);
    });

    list.appendChild(div);
  }
}

function selectContestant(id) {
  state.selectedContestantId = id;
  const c = state.data.contestants.find((x) => x.id === id);
  $("#selectedBar").textContent = c ? `Selected: ${c.name}` : "Select a contestant to start writing notes.";
  $("#addNoteBtn").disabled = !c;
  renderContestants();
  renderNotes();
}

function addContestant(name, photoDataUrl) {
  state.data.contestants.push({
    id: uid(),
    name,
    age: null,
    from: "",
    job: "",
    photoUrl: null,
    photoDataUrl: photoDataUrl || null,
  });
  saveData();
  renderContestants();
}

function deleteContestant(id) {
  state.data.contestants = state.data.contestants.filter((x) => x.id !== id);
  state.data.notes = state.data.notes.filter((n) => n.contestantId !== id);

  if (state.selectedContestantId === id) state.selectedContestantId = null;

  saveData();
  $("#selectedBar").textContent = "Select a contestant to start writing notes.";
  $("#addNoteBtn").disabled = true;
  renderContestants();
  renderNotes();
}

/* -------------------------
   Notes
-------------------------- */

function addNote(contestantId, episode, text, tags) {
  state.data.notes.push({
    id: uid(),
    contestantId,
    episode: Number(episode),
    text,
    tags,
    createdAt: new Date().toISOString(),
  });
  saveData();
  renderNotes();
}

function deleteNote(id) {
  state.data.notes = state.data.notes.filter((n) => n.id !== id);
  saveData();
  renderNotes();
}

function renderNotes() {
  const list = $("#notesList");
  const q = ($("#noteSearch").value || "").toLowerCase();
  const cid = state.selectedContestantId;

  list.innerHTML = "";

  if (!cid) {
    list.innerHTML = `<div class="muted">Pick a contestant to see their notes 🗒️</div>`;
    return;
  }

  const notes = state.data.notes
    .filter((n) => n.contestantId === cid)
    .filter((n) => {
      const tagText = (n.tags || []).join(", ").toLowerCase();
      return (
        n.text.toLowerCase().includes(q) ||
        String(n.episode).includes(q) ||
        tagText.includes(q)
      );
    })
    .sort((a, b) => (a.episode - b.episode) || b.createdAt.localeCompare(a.createdAt));

  if (notes.length === 0) {
    list.innerHTML = `<div class="muted">No notes yet. Add your first one above ✍️</div>`;
    return;
  }

  for (const n of notes) {
    const div = document.createElement("div");
    div.className = "note";

    const top = document.createElement("div");
    top.className = "noteTop";

    const badges = document.createElement("div");
    badges.className = "badges";

    const ep = document.createElement("span");
    ep.className = "badge";
    ep.textContent = `Episode ${n.episode}`;
    badges.appendChild(ep);

    for (const t of n.tags || []) {
      const b = document.createElement("span");
      b.className = "badge";
      b.textContent = t;
      badges.appendChild(b);
    }

    const del = document.createElement("button");
    del.type = "button";
    del.className = "iconBtn danger";
    del.title = "Delete note";
    del.textContent = "🗑️";
    del.addEventListener("click", () => deleteNote(n.id));

    top.appendChild(badges);
    top.appendChild(del);

    const p = document.createElement("p");
    p.className = "noteText";
    p.textContent = n.text;

    div.appendChild(top);
    div.appendChild(p);
    list.appendChild(div);
  }
}

/* -------------------------
   Export / Import / Clear
-------------------------- */

function exportData() {
  const blob = new Blob([JSON.stringify(state.data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "traitors-uk-s4-notes.json";
  a.click();
  URL.revokeObjectURL(url);
}

async function importData(file) {
  const text = await file.text();
  const parsed = JSON.parse(text);

  if (!parsed || !Array.isArray(parsed.contestants) || !Array.isArray(parsed.notes)) {
    alert("That file doesn't look like a valid export.");
    return;
  }

  state.data = parsed;
  state.selectedContestantId = null;
  saveData();
  $("#selectedBar").textContent = "Select a contestant to start writing notes.";
  $("#addNoteBtn").disabled = true;
  renderContestants();
  renderNotes();
}

function clearAll() {
  if (!confirm("Clear all contestants and notes? This cannot be undone.")) return;
  state.data = { contestants: [], notes: [] };
  state.selectedContestantId = null;
  saveData();
  $("#selectedBar").textContent = "Select a contestant to start writing notes.";
  $("#addNoteBtn").disabled = true;
  renderContestants();
  renderNotes();
}

/* -------------------------
   Wire up UI
-------------------------- */

$("#addContestantForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = $("#cName").value.trim();
  const file = $("#cPhoto").files[0] || null;
  if (!name) return;

  const photoDataUrl = await fileToDataUrl(file);
  addContestant(name, photoDataUrl);

  $("#cName").value = "";
  $("#cPhoto").value = "";
});

$("#contestantSearch").addEventListener("input", renderContestants);
$("#noteSearch").addEventListener("input", renderNotes);

$("#addNoteForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const cid = state.selectedContestantId;
  if (!cid) return;

  const episode = $("#nEpisode").value;
  const tags = normaliseTags($("#nTags").value);
  const text = $("#nText").value.trim();
  if (!episode || !text) return;

  addNote(cid, episode, text, tags);

  $("#nText").value = "";
  $("#nTags").value = "";
});

$("#exportBtn").addEventListener("click", exportData);

$("#importInput").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  await importData(file);
  e.target.value = "";
});

$("#clearAll").addEventListener("click", clearAll);

/* -------------------------
   Initialise
-------------------------- */

ensurePreloadOnce();
renderContestants();
renderNotes();
