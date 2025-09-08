import React, { useEffect, useMemo, useState } from "react";
import "./App.css";

/* ===================== Config ===================== */
const API_BASE = "https://backend-db-corse-v2.onrender.com";

/* ===================== Utils / Helpers ===================== */

// Data utils
function pad2(n) { return n < 10 ? `0${n}` : `${n}`; }

export function safeDateToDMY(d) {
  if (!d) return "";
  const dt = (d instanceof Date) ? d : new Date(d);
  if (isNaN(dt.getTime())) return "";
  const dd = pad2(dt.getDate());
  const mm = pad2(dt.getMonth() + 1);
  const yyyy = dt.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export function isoToday() {
  const t = new Date();
  return `${t.getFullYear()}-${pad2(t.getMonth()+1)}-${pad2(t.getDate())}`;
}

export function clampDateToISO(value) {
  // accetta 'YYYY-MM-DD' oppure qualsiasi cosa parseabile, ritorna ISO 'YYYY-MM-DD'
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
}

/* ====== Distance filter helpers (categorie con range) ====== */
const DISTANCE_CATEGORIES = [
  { key: "",        label: "Tutte le distanze" },
  { key: "5k",      label: "5K",                min: 4.0,   max: 6.0 },
  { key: "10k",     label: "10K",               min: 8.0,   max: 12.0 },
  { key: "15k",     label: "15K",               min: 13.0,  max: 17.0 },
  { key: "half",    label: "Mezza (21.1K)",     min: 20.0,  max: 22.8 },
  { key: "25k",     label: "25K",               min: 23.0,  max: 27.0 },
  { key: "30k",     label: "30K",               min: 28.0,  max: 32.0 },
  { key: "marathon",label: "Maratona (42.2K)",  min: 41.0,  max: 43.5 },
  { key: "ultra",   label: "Ultra (>43K)",      min: 43.5,  max: 10000.0 },
];

function parseKmList(distanceText) {
  if (!distanceText) return [];
  const txt = Array.isArray(distanceText) ? distanceText.join(", ") : String(distanceText);
  const norm = txt
    .replace(/(\d)\s*[kK]\b/g, "$1 km") // 10k -> 10 km
    .replace(/,/g, ".")
    .replace(/\s+/g, " ");
  const nums = norm.match(/(\d+(?:\.\d+)?)(?=\s*km|\b)/gi) || [];
  const km = nums
    .map(s => parseFloat(s))
    .filter(v => isFinite(v) && v > 0 && v < 10000);
  return Array.from(new Set(km));
}

function getRangeForCategory(catKey) {
  const found = DISTANCE_CATEGORIES.find(c => c.key === catKey);
  if (!found || !found.min) return null;
  return { min: found.min, max: found.max };
}

function matchDistanceCategory(race, catKey) {
  if (!catKey) return true;
  const range = getRangeForCategory(catKey);
  if (!range) return true;
  const distField = race?.distance_km ?? race?.distance ?? "";
  const kms = parseKmList(distField);
  if (kms.length === 0) return false;
  return kms.some(v => v >= range.min && v <= range.max);
}

// deduce categoria principale di una gara (per il builder)
function inferCategoryFromRace(race) {
  const kms = parseKmList(race?.distance_km ?? race?.distance ?? "");
  const m = Math.max(0, ...kms);
  if (m >= 43.5) return "ultra";
  if (m >= 41.0 && m <= 43.5) return "marathon";
  if (m >= 28 && m <= 32) return "30k";
  if (m >= 23 && m <= 27) return "25k";
  if (m >= 20 && m <= 22.8) return "half";
  if (m >= 13 && m <= 17) return "15k";
  if (m >= 8 && m <= 12) return "10k";
  if (m >= 4 && m <= 6) return "5k";
  return ""; // sconosciuta
}

function addDays(baseISO, days) {
  const d = new Date(baseISO);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
}

/* ===================== Local storage plans ===================== */
function usePlansStorage() {
  const KEY = "runshift_plans_v2";
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch { return []; }
  }
  function saveAll(arr) {
    localStorage.setItem(KEY, JSON.stringify(arr));
  }
  function listPlans() {
    return load().sort((a,b)=> new Date(a.targetRace?.date_ts||0) - new Date(b.targetRace?.date_ts||0));
  }
  function getPlan(id) {
    return load().find(p => p.id === id) || null;
  }
  function upsertPlan(plan) {
    const all = load();
    const idx = all.findIndex(p => p.id === plan.id);
    if (idx >= 0) {
      all[idx] = { ...plan, updatedAt: new Date().toISOString() };
    } else {
      all.push({ ...plan, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
    saveAll(all);
    return plan.id;
  }
  function deletePlan(id) {
    const all = load().filter(p => p.id !== id);
    saveAll(all);
  }
  return { listPlans, getPlan, upsertPlan, deletePlan };
}

/* ===================== Simple Router ===================== */
function useSimpleRoute() {
  const [route, setRoute] = useState("home"); // "home" | "search" | "race" | "build" | "plans"
  const [routeState, setRouteState] = useState(null);
  function navigate(to, state=null) {
    setRoute(to);
    setRouteState(state);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  return { route, routeState, navigate };
}

/* ===================== App ===================== */
export default function App() {
  const { route, routeState, navigate } = useSimpleRoute();
  const plansApi = usePlansStorage();

  const [targetRace, setTargetRace] = useState(null);
  const [editingPlanId, setEditingPlanId] = useState(null); // se non null, stai modificando quel piano

  // Se arrivi da "Modifica piano", carica targetRace e slot dal piano
  useEffect(() => {
    if (route === "build" && routeState?.editPlanId) {
      const p = plansApi.getPlan(routeState.editPlanId);
      if (p) {
        setTargetRace(p.targetRace);
        setEditingPlanId(p.id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route, routeState]);

  return (
    <div className="app">
      {/* TopNav: nascosta in home (solo hamburger) */}
      {route !== "home" && (
        <TopBar onLogo={()=>navigate("home")} onSearch={()=>navigate("search")} onPlans={()=>navigate("plans")} />
      )}

      {route === "home" && (
        <HomeHero
          onOpenMenu={()=>navigate("search")}
          onStart={()=>navigate("search")}
          onPlans={()=>navigate("plans")}
        />
      )}

      {route === "search" && (
        <SearchPage
          onBack={()=>navigate("home")}
          onSelectTarget={(race)=>{ setTargetRace(race); setEditingPlanId(null); navigate("build"); }}
          onDetails={(race)=>navigate("race",{ race })}
        />
      )}

      {route === "race" && (
        <RaceDetails
          race={routeState?.race}
          onBack={()=>navigate("search")}
          onSelect={(race)=>{ setTargetRace(race); setEditingPlanId(null); navigate("build"); }}
        />
      )}

      {route === "build" && (
        <BuildPage
          targetRace={targetRace}
          editingPlanId={editingPlanId}
          onBackToSearch={()=>navigate("search")}
          onSaved={(id)=>{ setEditingPlanId(id); navigate("plans"); }}
        />
      )}

      {route === "plans" && (
        <MyPlans
          onBack={()=>navigate("home")}
          onOpenPlan={(planId)=>navigate("build",{ editPlanId: planId })}
          onOpenRace={(race)=>navigate("race",{ race })}
          plansApi={plansApi}
        />
      )}
    </div>
  );
}

/* ===================== UI Components ===================== */

function TopBar({ onLogo, onSearch, onPlans }) {
  return (
    <header className="topbar">
      <button className="logo-btn" onClick={onLogo} aria-label="Runshift Home">
        <img src="public/images/logo-runshift-R-mountain-road.png" alt="Runshift" className="logo-img" />
        <span className="logo-text">Runshift</span>
      </button>
      <nav className="topbar-nav" aria-label="Navigazione">
        <button className="btn btn-ghost" onClick={onSearch}>Cerca gare</button>
        <button className="btn btn-ghost" onClick={onPlans}>My Plans</button>
      </nav>
    </header>
  );
}

function HomeHero({ onOpenMenu, onStart, onPlans }) {
  return (
    <section className="hero">
      <button className="hamburger" onClick={onOpenMenu} aria-label="Apri menu">
        <span/><span/><span/>
      </button>

      <div className="hero-bg" aria-hidden="true">
        {/* Immagine sfocata in App.css via filter */}
        <img src="/images/hero-runner-sunset.jpg" alt="" />
        <div className="hero-overlay"/>
      </div>

      <div className="hero-content">
        <img src="/images/logo-runshift-R-mountain-road.png" alt="Runshift" className="hero-logo" />
        <h1>Corri. Esplora. Scopri.</h1>
        <p>Trova la tua prossima gara nel mondo e costruisci un piano epico verso l’obiettivo.</p>
        <div className="hero-actions">
          <button className="btn btn-primary" onClick={onStart}>Inizia</button>
          <button className="btn btn-outline" onClick={onPlans}>I miei piani</button>
        </div>
      </div>
    </section>
  );
}

/* ===================== Search Page ===================== */

function SearchPage({ onBack, onSelectTarget, onDetails }) {
  const [races, setRaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const [filters, setFilters] = useState({
    q: "",
    country: "",
    distanceCat: "",
    dateFrom: isoToday(),
    dateTo: "",
  });

  useEffect(() => {
    let canceled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/races`);
        const data = await res.json();
        if (!canceled) {
          setRaces(Array.isArray(data) ? data : []);
          setErr(null);
        }
      } catch (e) {
        if (!canceled) setErr(e?.message || "Errore caricamento");
      } finally {
        if (!canceled) setLoading(false);
      }
    }
    load();
    return () => { canceled = true; };
  }, []);

  const countries = useMemo(() => {
    const s = new Set();
    (races || []).forEach(r => {
      if (r.location_country) s.add(r.location_country);
    });
    return Array.from(s).sort((a,b)=>a.localeCompare(b));
  }, [races]);

  const filteredRaces = useMemo(() => {
    let out = races || [];

    // Solo future by default, in base al dateFrom/a
    const df = filters.dateFrom ? new Date(filters.dateFrom) : null;
    const dt = filters.dateTo ? new Date(filters.dateTo) : null;

    out = out.filter(r => {
      const d = r.date_ts ? new Date(r.date_ts) : null;
      if (!d || isNaN(d)) return false;
      if (df && d < df) return false;
      if (dt && d > dt) return false;
      return true;
    });

    if (filters.q) {
      const q = filters.q.toLowerCase();
      out = out.filter(r =>
        (r.race_name || "").toLowerCase().includes(q) ||
        (r.location_city || "").toLowerCase().includes(q)
      );
    }
    if (filters.country) {
      out = out.filter(r => r.location_country === filters.country);
    }
    if (filters.distanceCat) {
      out = out.filter(r => matchDistanceCategory(r, filters.distanceCat));
    }
    // ordina per data crescente
    out.sort((a,b)=> new Date(a.date_ts) - new Date(b.date_ts));
    return out;
  }, [races, filters]);

  return (
    <section className="page search-page">
      <div className="page-header">
        <h2>Cerca gare</h2>
        <button className="btn btn-ghost" onClick={onBack}>← Home</button>
      </div>

      <div className="filters">
        <div className="filter-field">
          <label className="filter-label">Testo</label>
          <input
            className="filter-input"
            placeholder="Nome gara o città…"
            value={filters.q}
            onChange={e=>setFilters(f=>({...f, q:e.target.value}))}
          />
        </div>

        <div className="filter-field">
          <label className="filter-label">Paese</label>
          <select
            className="filter-input"
            value={filters.country}
            onChange={e=>setFilters(f=>({...f, country:e.target.value}))}
          >
            <option value="">Tutti</option>
            {countries.map(c=><option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="filter-field">
          <label className="filter-label">Distanza</label>
          <select
            className="filter-input"
            value={filters.distanceCat}
            onChange={e=>setFilters(f=>({...f, distanceCat:e.target.value}))}
          >
            {DISTANCE_CATEGORIES.map(opt=>(
              <option key={opt.key} value={opt.key}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className="filter-field">
          <label className="filter-label">Da</label>
          <input
            type="date"
            className="filter-input"
            value={filters.dateFrom}
            onChange={e=>setFilters(f=>({...f, dateFrom: clampDateToISO(e.target.value)}))}
          />
        </div>

        <div className="filter-field">
          <label className="filter-label">A</label>
          <input
            type="date"
            className="filter-input"
            value={filters.dateTo}
            onChange={e=>setFilters(f=>({...f, dateTo: clampDateToISO(e.target.value)}))}
          />
        </div>
      </div>

      {loading && <div className="empty">Carico gare…</div>}
      {err && <div className="empty error">Errore: {err}</div>}
      {!loading && !err && filteredRaces.length === 0 && (
        <div className="empty">Nessuna gara trovata con questi filtri.</div>
      )}

      <div className="grid">
        {filteredRaces.map((r)=>(
          <RaceCard
            key={`${r.race_url}-${r.date_ts}`}
            race={r}
            onDetails={()=>onDetails(r)}
            onSelect={()=>onSelectTarget(r)}
          />
        ))}
      </div>
    </section>
  );
}

/* ===================== Race Details ===================== */

function RaceDetails({ race, onBack, onSelect }) {
  if (!race) {
    return (
      <section className="page">
        <div className="page-header">
          <h2>Dettagli gara</h2>
          <button className="btn btn-ghost" onClick={onBack}>← Torna</button>
        </div>
        <div className="empty">Nessuna gara selezionata.</div>
      </section>
    );
  }
  const img = race.image_thumb_url || race.image_url || "";
  const place = [race.location_city, race.location_country].filter(Boolean).join(", ");

  return (
    <section className="page">
      <div className="page-header">
        <h2>Race details</h2>
        <button className="btn btn-ghost" onClick={onBack}>← Torna</button>
      </div>

      <div className="race-details">
        <div className="race-details-media">
          {img ? <img src={img} alt={race.race_name} /> : <div className="noimg" />}
        </div>
        <div className="race-details-body">
          <h3>{race.race_name}</h3>
          <p className="muted">{place}</p>
          <p><strong>Data:</strong> {safeDateToDMY(race.date_ts)}</p>
          {race.distance_km && <p><strong>Distanze:</strong> {Array.isArray(race.distance_km) ? race.distance_km.join(", ") : String(race.distance_km)}</p>}
          {race.race_type && <p><strong>Tipo:</strong> {race.race_type}</p>}
          {race.race_url && <p><strong>Link:</strong> <a href={race.race_url} target="_blank" rel="noreferrer">{race.race_url}</a></p>}

          <div className="actions">
            <button className="btn btn-primary" onClick={()=>onSelect(race)}>Seleziona come obiettivo</button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ===================== Builder ===================== */

function recommendedSlotsConfig(targetCat) {
  // Semplificazione: slot name + categoria suggerita + descr
  switch (targetCat) {
    case "marathon":
      return [
        { key:"slot1", label: "Tune-up 1", category: "half",    desc:"Mezza maratona di prova" },
        { key:"slot2", label: "Tune-up 2", category: "10k",     desc:"Gara di ritmo" },
        { key:"slot3", label: "Lungo",     category: "30k",     desc:"30K preparatoria (o corsa lunga organizzata)" },
      ];
    case "half":
      return [
        { key:"slot1", label: "Tune-up 1", category: "10k", desc:"Rifinitura" },
        { key:"slot2", label: "Tune-up 2", category: "5k",  desc:"Velocità" },
      ];
    case "10k":
      return [
        { key:"slot1", label: "Tune-up", category: "5k", desc:"Lavoro sulla velocità" },
      ];
    case "ultra":
      return [
        { key:"slot1", label: "Lungo 1", category: "marathon", desc:"Maratona - resistenza" },
        { key:"slot2", label: "Lungo 2", category: "half",     desc:"Volume" },
        { key:"slot3", label: "Ritmo",   category: "10k",      desc:"Velocità" },
      ];
    default:
      return [
        { key:"slot1", label: "Tune-up 1", category: "10k", desc:"Gara di ritmo" },
        { key:"slot2", label: "Tune-up 2", category: "5k",  desc:"Velocità" },
      ];
  }
}

function BuildPage({ targetRace, editingPlanId, onBackToSearch, onSaved }) {
  const plansApi = usePlansStorage();

  const [allRaces, setAllRaces] = useState([]);
  const [loading, setLoading] = useState(true);

  // filtri locali per suggerimenti negli slot
  const [slotFilters, setSlotFilters] = useState({
    country: "",
    dateFrom: "",
    dateTo: "",
  });

  // stato slot selezionati: { slotKey: raceObj }
  const [selectedSlots, setSelectedSlots] = useState({});

  // quando entri in build per editing, prova a caricare i precedenti slot dal piano
  useEffect(() => {
    if (!editingPlanId) return;
    const p = plansApi.getPlan(editingPlanId);
    if (p && p.slots) setSelectedSlots(p.slots);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingPlanId]);

  useEffect(() => {
    let canceled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/races`);
        const data = await res.json();
        if (!canceled) setAllRaces(Array.isArray(data) ? data : []);
      } catch {
        if (!canceled) setAllRaces([]);
      } finally {
        if (!canceled) setLoading(false);
      }
    }
    load();
    return () => { canceled = true; };
  }, []);

  if (!targetRace) {
    return (
      <section className="page">
        <div className="page-header">
          <h2>Build your plan</h2>
          <button className="btn btn-ghost" onClick={onBackToSearch}>← Cerca gare</button>
        </div>
        <div className="empty">Seleziona prima una gara obiettivo dalla ricerca.</div>
      </section>
    );
  }

  const targetCat = inferCategoryFromRace(targetRace);
  const slotDefs = recommendedSlotsConfig(targetCat);

  const countries = useMemo(() => {
    const s = new Set();
    (allRaces || []).forEach(r => { if (r.location_country) s.add(r.location_country); });
    return Array.from(s).sort((a,b)=>a.localeCompare(b));
  }, [allRaces]);

  // finestra temporale: suggerisci gare entro 16 settimane prima della target
  const targetDateISO = clampDateToISO(targetRace.date_ts);
  const defaultFrom = addDays(targetDateISO, -7*16);
  const defaultTo = addDays(targetDateISO, -7); // almeno 1 settimana prima della target

  // filtri effettivi con default se vuoti
  const effDateFrom = slotFilters.dateFrom || defaultFrom;
  const effDateTo = slotFilters.dateTo || defaultTo;

  function slotMatchesCategory(race, catKey) {
    if (catKey === "30k") {
      const kms = parseKmList(race?.distance_km ?? race?.distance ?? "");
      return kms.some(v => v >= 28 && v <= 32);
    }
    return matchDistanceCategory(race, catKey);
  }

  function listSuggestionsForSlot(catKey) {
    let out = (allRaces || []).filter(r => {
      // data dentro range
      const d = r.date_ts ? new Date(r.date_ts) : null;
      if (!d || isNaN(d)) return false;
      const df = new Date(effDateFrom);
      const dt = new Date(effDateTo);
      if (d < df || d > dt) return false;

      // paese
      if (slotFilters.country && r.location_country !== slotFilters.country) return false;

      // distanza categoria dello slot
      if (!slotMatchesCategory(r, catKey)) return false;

      // non deve essere la target stessa
      if (r.race_url === targetRace.race_url && r.date_ts === targetRace.date_ts) return false;

      return true;
    });
    // ordina per data crescente
    out.sort((a,b)=> new Date(a.date_ts) - new Date(b.date_ts));
    return out.slice(0, 20); // prime 20 proposte
  }

  function handleSelectForSlot(slotKey, race) {
    setSelectedSlots(prev => ({ ...prev, [slotKey]: race }));
  }
  function handleRemoveFromSlot(slotKey) {
    setSelectedSlots(prev => {
      const n = { ...prev };
      delete n[slotKey];
      return n;
    });
  }

  function savePlan() {
    const id = editingPlanId || `plan_${Date.now()}`;
    const plan = {
      id,
      name: targetRace.race_name,
      targetRace,
      slots: selectedSlots
    };
    const savedId = plansApi.upsertPlan(plan);
    onSaved(savedId);
  }

  return (
    <section className="page build-page">
      <div className="page-header">
        <h2>Build your plan</h2>
        <button className="btn btn-ghost" onClick={onBackToSearch}>← Cerca gare</button>
      </div>

      <div className="target-panel">
        <div className="target-media">
          { (targetRace.image_thumb_url || targetRace.image_url) ? (
            <img src={targetRace.image_thumb_url || targetRace.image_url} alt={targetRace.race_name} />
          ) : <div className="noimg" /> }
        </div>
        <div className="target-body">
          <h3 className="target-title">{targetRace.race_name}</h3>
          <p className="muted">{[targetRace.location_city, targetRace.location_country].filter(Boolean).join(", ")}</p>
          <p><strong>Data:</strong> {safeDateToDMY(targetRace.date_ts)}</p>
          <p><strong>Categoria:</strong> {DISTANCE_CATEGORIES.find(c=>c.key===targetCat)?.label || "—"}</p>
        </div>
      </div>

      <div className="filters">
        <div className="filter-field">
          <label className="filter-label">Paese</label>
          <select
            className="filter-input"
            value={slotFilters.country}
            onChange={e=>setSlotFilters(s=>({...s, country:e.target.value}))}
          >
            <option value="">Tutti</option>
            {countries.map(c=><option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="filter-field">
          <label className="filter-label">Da</label>
          <input
            type="date"
            className="filter-input"
            value={effDateFrom}
            onChange={e=>setSlotFilters(s=>({...s, dateFrom: clampDateToISO(e.target.value)}))}
          />
        </div>
        <div className="filter-field">
          <label className="filter-label">A</label>
          <input
            type="date"
            className="filter-input"
            value={effDateTo}
            onChange={e=>setSlotFilters(s=>({...s, dateTo: clampDateToISO(e.target.value)}))}
          />
        </div>
      </div>

      {loading && <div className="empty">Carico suggerimenti…</div>}

      {!loading && slotDefs.map(slot => {
        const chosen = selectedSlots[slot.key] || null;
        const suggestions = listSuggestionsForSlot(slot.category);
        return (
          <div className="slot-column" key={slot.key}>
            <div className="slot-header">
              <div>
                <h4>{slot.label}</h4>
                <p className="muted">{slot.desc} — <strong>{DISTANCE_CATEGORIES.find(c=>c.key===slot.category)?.label || slot.category}</strong></p>
              </div>
              {chosen ? (
                <button className="btn btn-outline" onClick={()=>handleRemoveFromSlot(slot.key)}>Rimuovi</button>
              ) : null}
            </div>

            {/* Selezionata */}
            {chosen ? (
              <div className="grid one-per-row">
                <RaceCard
                  race={chosen}
                  onDetails={()=>{}}
                  onSelect={()=>handleRemoveFromSlot(slot.key)}
                />
              </div>
            ) : (
              <div className="grid one-per-row">
                {suggestions.length === 0 && (
                  <div className="empty">Nessuna proposta con i filtri attuali.</div>
                )}
                {suggestions.map(r => (
                  <RaceCard
                    key={`${slot.key}-${r.race_url}-${r.date_ts}`}
                    race={r}
                    onDetails={()=>{}}
                    onSelect={()=>handleSelectForSlot(slot.key, r)}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}

      <div className="save-row">
        <button className="btn btn-primary" onClick={savePlan}>
          {editingPlanId ? "Aggiorna piano" : "Conferma e salva piano"}
        </button>
      </div>
    </section>
  );
}

/* ===================== My Plans (calendar view) ===================== */

function MyPlans({ onBack, onOpenPlan, onOpenRace, plansApi }) {
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    setPlans(plansApi.listPlans());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Aggrega tutte le gare di tutti i piani
  const allEvents = useMemo(() => {
    const rows = [];
    for (const p of plans) {
      if (p.targetRace) rows.push({ ...p.targetRace, _planId: p.id, _role: "Target", _planName: p.name });
      if (p.slots) {
        Object.values(p.slots).forEach(r => {
          if (r) rows.push({ ...r, _planId: p.id, _role: "Slot", _planName: p.name });
        });
      }
    }
    // unique by race_url + date_ts
    const map = new Map();
    for (const e of rows) {
      const key = `${e.race_url}|${e.date_ts}`;
      if (!map.has(key)) map.set(key, e);
    }
    return Array.from(map.values()).sort((a,b)=> new Date(a.date_ts) - new Date(b.date_ts));
  }, [plans]);

  // Raggruppa per YYYY-MM
  const grouped = useMemo(() => {
    const g = {};
    for (const e of allEvents) {
      const d = new Date(e.date_ts);
      if (isNaN(d)) continue;
      const key = `${d.getFullYear()}-${pad2(d.getMonth()+1)}`;
      if (!g[key]) g[key] = [];
      g[key].push(e);
    }
    return g;
  }, [allEvents]);

  return (
    <section className="page plans-page">
      <div className="page-header">
        <h2>I miei piani</h2>
        <button className="btn btn-ghost" onClick={onBack}>← Home</button>
      </div>

      {plans.length === 0 && (
        <div className="empty">Non hai ancora piani salvati.</div>
      )}

      {/* elenco piani con azioni */}
      {plans.length > 0 && (
        <div className="plans-list">
          {plans.map(p=>(
            <div className="plan-row" key={p.id}>
              <div>
                <strong>{p.name}</strong>
                <div className="muted small">Target: {p.targetRace?.race_name} — {safeDateToDMY(p.targetRace?.date_ts)}</div>
              </div>
              <div className="actions">
                <button className="btn btn-outline" onClick={()=>onOpenPlan(p.id)}>Modifica</button>
                <button className="btn btn-ghost" onClick={()=>{
                  if (confirm("Eliminare questo piano?")) {
                    plansApi.deletePlan(p.id);
                    setPlans(plansApi.listPlans());
                  }
                }}>Elimina</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* calendario aggregato */}
      {Object.keys(grouped).length > 0 && (
        <div className="calendar">
          {Object.keys(grouped).sort().map(monthKey => {
            const monthName = new Date(`${monthKey}-01T00:00:00`).toLocaleString("it-IT", { month: "long", year: "numeric" });
            return (
              <div className="cal-month" key={monthKey}>
                <h3 className="cal-title">{monthName}</h3>
                <div className="grid one-per-row">
                  {grouped[monthKey].map(ev => (
                    <div className="race-card cal-card" key={`${ev.race_url}-${ev.date_ts}`}>
                      <div className="race-body">
                        <div className="race-header">
                          <h3 className="race-title">{ev.race_name}</h3>
                          <span className="race-chip">{ev._role}</span>
                        </div>
                        <div className="race-meta">
                          <div className="race-meta-row">
                            <span className="race-meta-label">Data</span>
                            <span className="race-meta-value">{safeDateToDMY(ev.date_ts)}</span>
                          </div>
                          <div className="race-meta-row">
                            <span className="race-meta-label">Luogo</span>
                            <span className="race-meta-value">{[ev.location_city, ev.location_country].filter(Boolean).join(", ")}</span>
                          </div>
                          <div className="race-meta-row">
                            <span className="race-meta-label">Piano</span>
                            <span className="race-meta-value">{ev._planName}</span>
                          </div>
                        </div>
                        <div className="race-actions">
                          <button className="btn btn-outline" onClick={()=>onOpenRace(ev)}>Dettagli</button>
                          <button className="btn btn-primary" onClick={()=>onOpenPlan(ev._planId)}>Modifica piano</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

/* ===================== Race Card (no-image friendly) ===================== */

function RaceCard({ race, onSelect, onDetails }) {
  const {
    race_name,
    location_city,
    location_country,
    date_ts,
    image_thumb_url,
    image_url,
    distance_km,
    race_type,
  } = race;

  const imgSrc = image_thumb_url || image_url || "";
  const hasImage = Boolean(imgSrc);

  const monogram = (race_name || "Race")
    .replace(/[^A-Za-z0-9 ]/g, "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() || "")
    .join("");

  const dateFmt = safeDateToDMY(date_ts);
  const place = [location_city, location_country].filter(Boolean).join(", ");

  const kmNums = parseKmList(distance_km);
  const distancePretty = kmNums.length ? kmNums.map(k => {
    const s = Number.isInteger(k) ? `${k}` : k.toFixed(1).replace(/\.0$/, "");
    return `${s} km`;
  }).join(", ") : (Array.isArray(distance_km) ? distance_km.join(", ") : (distance_km || ""));

  return (
    <div className="race-card">
      {hasImage ? (
        <div className="race-media">
          <img
            src={imgSrc}
            alt={race_name}
            loading="lazy"
            onError={(e) => {
              e.currentTarget.style.display = "none";
              e.currentTarget.parentElement?.classList.add("no-image");
            }}
          />
        </div>
      ) : (
        <div className="race-media no-image">
          <div className="race-monogram" aria-hidden="true">{monogram}</div>
          {distancePretty && <div className="race-distance-badge">{distancePretty}</div>}
        </div>
      )}

      <div className="race-body">
        <div className="race-header">
          <h3 className="race-title" title={race_name}>{race_name}</h3>
          {race_type ? <span className="race-chip">{race_type}</span> : null}
        </div>

        <div className="race-meta">
          <div className="race-meta-row">
            <span className="race-meta-label">Data</span>
            <span className="race-meta-value">{dateFmt}</span>
          </div>
          {place && (
            <div className="race-meta-row">
              <span className="race-meta-label">Luogo</span>
              <span className="race-meta-value">{place}</span>
            </div>
          )}
          {distancePretty && (
            <div className="race-meta-row">
              <span className="race-meta-label">Distanze</span>
              <span className="race-meta-value">{distancePretty}</span>
            </div>
          )}
        </div>

        <div className="race-actions">
          <button className="btn btn-outline" onClick={onDetails}>Dettagli</button>
          <button className="btn btn-primary" onClick={onSelect}>Seleziona</button>
        </div>
      </div>
    </div>
  );
}
