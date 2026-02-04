/* The Traitors UK S4 Notes — No Spoilers
   - localStorage autosave
   - export/import JSON
   - episodes + contestants + board + alliances
*/

const STORAGE_KEY = "traitors_uk_s4_notes_v1";

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

const uid = () => Math.random().toString(36).slice(2, 10);

const defaultState = () => ({
  meta: { version: 1, updatedAt: new Date().toISOString() },
  selectedEpisodeId: null,
  episodes: [],
  contestants: [],
  board: { traitors: "", faithful: "", behaviours: "" },
  alliances: [],
  series: { favourite: "", suspicious: "", strategist: "", entertaining: "" }
});

let state = load();

function load(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return defaultState();
    const parsed = JSON.parse(raw);
    return { ...defaultState(), ...parsed };
  }catch{
    return defaultState();
  }
}

function save(){
  state.meta.updatedAt = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state, null, 2));
  renderEpisodeList();
}

function setTab(tabName){
  $$(".tab").forEach(t => t.classList.toggle("active", t.dataset.tab === tabName));
  $$(".tab-panel").forEach(p => p.classList.toggle("active", p.id === `tab-${tabName}`));
}

function renderEpisodeList(){
  const q = ($("#episodeSearch").value || "").toLowerCase().trim();
  const list = $("#episodeList");
  list.innerHTML = "";

  const filtered = state.episodes
    .slice()
    .sort((a,b) => (a.number||0) - (b.number||0))
    .filter(ep => {
      const label = `Episode ${ep.number || ""} ${ep.vibe || ""}`.toLowerCase();
      return label.includes(q);
    });

  filtered.forEach(ep => {
    const li = document.createElement("li");
    li.className = (state.selectedEpisodeId === ep.id) ? "active" : "";
    li.innerHTML = `
      <div>
        <strong>Episode ${ep.number || "?"}</strong>
        <div class="meta">${(ep.dateWatched || "No date")} • ${ep.rating ? `${ep.rating}/5 ⭐` : "No rating"}</div>
      </div>
      <span class="badge">${(ep.vibe || "No vibe").slice(0, 18)}${(ep.vibe || "").length > 18 ? "…" : ""}</span>
    `;
    li.addEventListener("click", () => {
      state.selectedEpisodeId = ep.id;
      save();
      fillEpisodeForm(ep);
    });
    list.appendChild(li);
  });

  // If none selected, auto-select first
  if(!state.selectedEpisodeId && state.episodes.length){
    state.selectedEpisodeId = state.episodes[0].id;
    save();
    fillEpisodeForm(state.episodes[0]);
  }
}

function currentEpisode(){
  return state.episodes.find(e => e.id === state.selectedEpisodeId) || null;
}

function fillEpisodeForm(ep){
  $("#epNumber").value = ep.number ?? "";
  $("#epDate").value = ep.dateWatched ?? "";
  $("#epRating").value = ep.rating ?? "";
  $("#epVibe").value = ep.vibe ?? "";
  $("#epChallenges").value = ep.challenges ?? "";
  $("#epStrategy").value = ep.strategy ?? "";
  $("#epSocial").value = ep.social ?? "";
  $("#epFavMoments").value = ep.favMoments ?? "";
  $("#epPredictions").value = ep.predictions ?? "";
}

function clearEpisodeForm(){
  $("#epNumber").value = "";
  $("#epDate").value = "";
  $("#epRating").value = "";
  $("#epVibe").value = "";
  $("#epChallenges").value = "";
  $("#epStrategy").value = "";
  $("#epSocial").value = "";
  $("#epFavMoments").value = "";
  $("#epPredictions").value = "";
}

function newEpisode(){
  const nextNum = (state.episodes.reduce((m,e)=>Math.max(m, Number(e.number||0)), 0) + 1) || 1;
  const ep = {
    id: uid(),
    number: nextNum,
    dateWatched: "",
    rating: "",
    vibe: "",
    challenges: "",
    strategy: "",
    social: "",
    favMoments: "",
    predictions: ""
  };
  state.episodes.push(ep);
  state.selectedEpisodeId = ep.id;
  save();
  fillEpisodeForm(ep);
  setTab("episode");
}

function saveEpisodeFromForm(){
  const ep = currentEpisode();
  if(!ep) return;

  ep.number = $("#epNumber").value.trim();
  ep.dateWatched = $("#epDate").value;
  ep.rating = $("#epRating").value.trim();
  ep.vibe = $("#epVibe").value.trim();
  ep.challenges = $("#epChallenges").value.trim();
  ep.strategy = $("#epStrategy").value.trim();
  ep.social = $("#epSocial").value.trim();
  ep.favMoments = $("#epFavMoments").value.trim();
  ep.predictions = $("#epPredictions").value.trim();

  save();
}

function deleteEpisode(){
  const ep = currentEpisode();
  if(!ep) return;
  state.episodes = state.episodes.filter(e => e.id !== ep.id);
  state.selectedEpisodeId = state.episodes[0]?.id ?? null;
  save();
  const next = currentEpisode();
  if(next) fillEpisodeForm(next);
  else clearEpisodeForm();
}

function renderContestants(){
  const q = ($("#contestantSearch").value || "").toLowerCase().trim();
  const filter = $("#contestantFilter").value;
  const grid = $("#contestantGrid");
  grid.innerHTML = "";

  const items = state.contestants
    .slice()
    .sort((a,b)=> (a.name||"").localeCompare(b.name||""))
    .filter(c => (c.name||"").toLowerCase().includes(q))
    .filter(c => filter === "all" ? true : c.group === filter);

  items.forEach(c => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="card-head">
        <div>
          <h3>${escapeHtml(c.name || "Unnamed")}</h3>
          <div class="meta">${c.group === "watch" ? "Players to Watch 👀" : "Quiet / Background 🌫️"}</div>
        </div>
        <div class="mini-actions">
          <button class="btn" data-action="toggle">${c.group === "watch" ? "🌫️ Mark Quiet" : "👀 Mark Watch"}</button>
          <button class="btn btn-danger" data-action="delete">🗑️ Delete</button>
        </div>
      </div>

      <div class="field">
        <label>Role suspicion</label>
        <input class="input" data-field="role" value="${escapeAttr(c.role || "")}" placeholder="Your suspicion…" />
      </div>
      <div class="field">
        <label>Behaviour notes</label>
        <textarea class="textarea" rows="2" data-field="behaviour" placeholder="Short notes…">${escapeHtml(c.behaviour || "")}</textarea>
      </div>
      <div class="two-col">
        <div class="field">
          <label>Trust level (1–5)</label>
          <input class="input" type="number" min="1" max="5" step="1" data-field="trust" value="${escapeAttr(c.trust || "")}" placeholder="1–5" />
        </div>
        <div class="field">
          <label>Changes this episode</label>
          <input class="input" data-field="changes" value="${escapeAttr(c.changes || "")}" placeholder="What changed…" />
        </div>
      </div>
    `;

    card.querySelectorAll("[data-field]").forEach(el => {
      el.addEventListener("input", () => {
        const field = el.dataset.field;
        c[field] = el.value;
        save();
      });
    });

    card.querySelector('[data-action="toggle"]').addEventListener("click", () => {
      c.group = (c.group === "watch") ? "quiet" : "watch";
      save();
      renderContestants();
    });

    card.querySelector('[data-action="delete"]').addEventListener("click", () => {
      state.contestants = state.contestants.filter(x => x.id !== c.id);
      save();
      renderContestants();
    });

    grid.appendChild(card);
  });
}

function addContestant(){
  const name = prompt("Contestant name?");
  if(!name) return;
  state.contestants.push({
    id: uid(),
    name: name.trim(),
    group: "watch",
    role: "",
    behaviour: "",
    trust: "",
    changes: ""
  });
  save();
  renderContestants();
}

function renderAlliances(){
  const wrap = $("#allianceList");
  wrap.innerHTML = "";
  state.alliances.forEach(a => {
    const div = document.createElement("div");
    div.className = "alliance";
    div.innerHTML = `
      <div class="row space">
        <strong>${escapeHtml(a.title || "Alliance")}</strong>
        <button class="btn btn-danger" data-action="delete">🗑️</button>
      </div>
      <div class="field">
        <label>Names involved</label>
        <input class="input" data-field="names" value="${escapeAttr(a.names || "")}" placeholder="A, B, C…" />
      </div>
      <div class="field">
        <label>Notes</label>
        <textarea class="textarea" rows="2" data-field="notes" placeholder="Dynamics, tension, influence…">${escapeHtml(a.notes || "")}</textarea>
      </div>
    `;
    div.querySelectorAll("[data-field]").forEach(el => {
      el.addEventListener("input", () => {
        a[el.dataset.field] = el.value;
        save();
      });
    });
    div.querySelector('[data-action="delete"]').addEventListener("click", () => {
      state.alliances = state.alliances.filter(x => x.id !== a.id);
      save();
      renderAlliances();
    });
    wrap.appendChild(div);
  });
}

function addAlliance(){
  state.alliances.push({ id: uid(), title: "Alliance", names: "", notes: "" });
  save();
  renderAlliances();
}

function saveBoardFromForm(){
  state.board.traitors = $("#boardTraitors").value.trim();
  state.board.faithful = $("#boardFaithful").value.trim();
  state.board.behaviours = $("#boardBehaviours").value.trim();
  save();
}

function fillBoardForm(){
  $("#boardTraitors").value = state.board.traitors || "";
  $("#boardFaithful").value = state.board.faithful || "";
  $("#boardBehaviours").value = state.board.behaviours || "";
}

function fillSeriesForm(){
  $("#seriesFavourite").value = state.series.favourite || "";
  $("#seriesSuspicious").value = state.series.suspicious || "";
  $("#seriesStrategist").value = state.series.strategist || "";
  $("#seriesEntertaining").value = state.series.entertaining || "";
}

function hookSeriesAutosave(){
  $("#seriesFavourite").addEventListener("input", e => { state.series.favourite = e.target.value; save(); });
  $("#seriesSuspicious").addEventListener("input", e => { state.series.suspicious = e.target.value; save(); });
  $("#seriesStrategist").addEventListener("input", e => { state.series.strategist = e.target.value; save(); });
  $("#seriesEntertaining").addEventListener("input", e => { state.series.entertaining = e.target.value; save(); });
}

function exportJSON(){
  const blob = new Blob([JSON.stringify(state, null, 2)], {type:"application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `traitors-uk-s4-notes-${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function importJSON(file){
  const reader = new FileReader();
  reader.onload = () => {
    try{
      const parsed = JSON.parse(reader.result);
      // Light validation / merge
      state = { ...defaultState(), ...parsed };
      save();
      // Re-render all
      renderEpisodeList();
      const ep = currentEpisode();
      if(ep) fillEpisodeForm(ep); else clearEpisodeForm();
      fillBoardForm();
      fillSeriesForm();
      renderContestants();
      renderAlliances();
      alert("Imported ✅");
    }catch{
      alert("Import failed — not valid JSON ❌");
    }
  };
  reader.readAsText(file);
}

function resetAll(){
  const ok = confirm("Reset everything? This will delete all notes in this browser.");
  if(!ok) return;
  state = defaultState();
  save();
  clearEpisodeForm();
  fillBoardForm();
  fillSeriesForm();
  renderContestants();
  renderAlliances();
}

function escapeHtml(str){
  return String(str)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}
function escapeAttr(str){
  return escapeHtml(str).replaceAll("\n"," ");
}

/* ---------- Wiring ---------- */
function init(){
  // Tabs
  $$(".tab").forEach(btn => btn.addEventListener("click", () => setTab(btn.dataset.tab)));

  // Episodes
  $("#btnNewEpisode").addEventListener("click", newEpisode);
  $("#btnSaveEpisode").addEventListener("click", saveEpisodeFromForm);
  $("#btnDeleteEpisode").addEventListener("click", deleteEpisode);
  $("#episodeSearch").addEventListener("input", renderEpisodeList);

  // Contestants
  $("#btnAddContestant").addEventListener("click", addContestant);
  $("#contestantSearch").addEventListener("input", renderContestants);
  $("#contestantFilter").addEventListener("change", renderContestants);

  // Board
  $("#btnSaveBoard").addEventListener("click", saveBoardFromForm);

  // Alliances
  $("#btnAddAlliance").addEventListener("click", addAlliance);
  $("#btnSaveAlliances").addEventListener("click", () => save());

  // Series
  hookSeriesAutosave();

  // Export/Import/Reset
  $("#btnExport").addEventListener("click", exportJSON);
  $("#importFile").addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if(file) importJSON(file);
    e.target.value = "";
  });
  $("#btnReset").addEventListener("click", resetAll);

  // Fill forms
  fillSeriesForm();
  fillBoardForm();
  renderEpisodeList();
  renderContestants();
  renderAlliances();

  // If episode selected exists, fill it
  const ep = currentEpisode();
  if(ep) fillEpisodeForm(ep);

  // Autosave on episode inputs (gentle)
  ["#epNumber","#epDate","#epRating","#epVibe","#epChallenges","#epStrategy","#epSocial","#epFavMoments","#epPredictions"]
    .forEach(sel => $(sel).addEventListener("input", () => {
      const ep = currentEpisode();
      if(!ep) return;
      // Keep it light — update in memory then save
      saveEpisodeFromForm();
    }));
}

init();
