import { useEffect, useMemo, useState } from "react";
import "./App.css";

/* =========================
   Config
========================= */
const API_URL = "https://backend-db-corse-v2.onrender.com";

/* =========================
   Utils
========================= */
function classNames(...a){ return a.filter(Boolean).join(" "); }

// === Date utils (DB usa date_ts TIMESTAMP; UI mostra gg/mm/aaaa) ===
function safeDateToDMY(dateVal) {
  if (!dateVal) return "";
  const d = new Date(dateVal);
  if (isNaN(d)) return "";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

// "dd/mm/yyyy" -> "yyyy-mm-dd" (per inviare al backend)
function dmyToIso(str){
  if(!/^\d{2}\/\d{2}\/\d{4}$/.test(str)) return "";
  const [dd,mm,yyyy] = str.split("/");
  return `${yyyy}-${mm}-${dd}`;
}

// Validazioni/convertitori per il calendario
function isValidDMY(str){
  if(!/^\d{2}\/\d{2}\/\d{4}$/.test(str)) return false;
  const [dd,mm,yyyy]=str.split("/").map(Number);
  const d=new Date(yyyy,mm-1,dd);
  return d.getFullYear()===yyyy && d.getMonth()===mm-1 && d.getDate()===dd;
}
function toDMY(d){ // Date -> "dd/mm/yyyy"
  const dd=String(d.getDate()).padStart(2,"0");
  const mm=String(d.getMonth()+1).padStart(2,"0");
  const yyyy=d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}
function fromDMY(str){ // "dd/mm/yyyy" -> Date
  if(!isValidDMY(str)) return null;
  const [dd,mm,yyyy]=str.split("/").map(Number);
  return new Date(yyyy, mm-1, dd);
}
function todayISO(){
  const d = new Date();
  const mm = String(d.getMonth()+1).padStart(2,"0");
  const dd = String(d.getDate()).padStart(2,"0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}
/* ===== Plans storage (localStorage) ===== */
function usePlansStorage() {
  const KEY = "runshift_plans_v1";
  const [plans, setPlans] = useState(() => {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; }
  });
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(plans)); } catch {} }, [plans]);

  const savePlan = (plan) => {
    const id = plan.id || (crypto.randomUUID?.() || String(Date.now()));
    const withId = { ...plan, id, updatedAt: new Date().toISOString() };
    setPlans(prev => {
      const i = prev.findIndex(p => p.id === id);
      if (i >= 0) { const c=[...prev]; c[i]=withId; return c; }
      return [{ ...withId, createdAt: new Date().toISOString() }, ...prev];
    });
    return id;
  };
  const deletePlan = (id) => setPlans(prev => prev.filter(p => p.id !== id));
  const getPlan = (id) => plans.find(p => p.id === id) || null;

  return { plans, savePlan, deletePlan, getPlan };
}

/* ===== Slot recommendation: distanza & label in base alla target ===== */
function recommendSlots(targetRace){
  // prendi distanza massima presente
  const nums = parseDistanceSet(targetRace?.distance_km || "");
  const max = nums[nums.length - 1] || 10;

  // mapping semplice
  if (max >= 42) { // Maratona
    return [
      { dist: 10,   label: "10K preparatoria", weeksBefore: 10 },
      { dist: 30,   label: "30K lungo gara",   weeksBefore: 5  },
      { dist: 21.1, label: "Mezza di rifinitura", weeksBefore: 3 },
    ];
  }
  if (max >= 21) { // Mezza
    return [
      { dist: 5,   label: "5K velocità",      weeksBefore: 8 },
      { dist: 10,  label: "10K controllo",    weeksBefore: 4 },
      { dist: 10,  label: "10K rifinitura",   weeksBefore: 2 },
    ];
  }
  if (max >= 10) { // 10K
    return [
      { dist: 5,   label: "5K ritmo",         weeksBefore: 4 },
      { dist: 5,   label: "5K controllo",     weeksBefore: 2 },
      { dist: 3,   label: "3K rifinitura",    weeksBefore: 1 },
    ];
  }
  // 5K o meno
  return [
    { dist: 3, label: "3K ritmo",      weeksBefore: 3 },
    { dist: 3, label: "3K controllo",  weeksBefore: 2 },
    { dist: 2, label: "2K rifinitura", weeksBefore: 1 },
  ];
}



// === Date utils (DB usa date_ts TIMESTAMP; UI mostra gg/mm/aaaa) ===


// "dd/mm/yyyy" -> "yyyy-mm-dd" (per inviare al backend)


/* Estrae numeri (km) da "42 / 21.1 / 10" */
/* ==== Distance helpers ==== */
function parseDistanceSet(str) {
  if (!str) return [];
  // es: "5K, 10k; 21.1 | 42.2" -> [5,10,21.1,42.2]
  const tokens = String(str).split(/[^0-9.,]+/).filter(Boolean);
  const nums = tokens.map(t => parseFloat(t.replace(",", "."))).filter(n => Number.isFinite(n));
  // de-dup con arrotondamento a 1 decimale
  const seen = new Set();
  const out = [];
  for (const n of nums) {
    const key = Math.round(n * 10) / 10;
    if (!seen.has(key)) { seen.add(key); out.push(key); }
  }
  return out.sort((a,b)=>a-b);
}
function hasDistance(race, targetKm) {
  if (!targetKm) return true;
  const set = parseDistanceSet(race?.distance_km || "");
  // tolleranza per 21.1/42.2 ecc.
  const tol = 0.3;
  return set.some(d => Math.abs(d - targetKm) <= tol);
}


/* =========================
   CalendarDropdown (no libs) - dd/mm/yyyy
========================= */
function CalendarDropdown({ value, onChange, placeholder="gg/mm/aaaa" }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState(value || "");
  const [viewDate, setViewDate] = useState(() => {
    const d = fromDMY(value || "");
    return d || new Date();
  });

  useEffect(()=>{ setInput(value || ""); }, [value]);

  const currentY = viewDate.getFullYear();
  const currentM = viewDate.getMonth();

  const start = new Date(currentY, currentM, 1);
  const startDay = start.getDay(); // 0=Sun
  const padStart = (startDay + 6) % 7; // lun->0
  const daysInMonth = new Date(currentY, currentM+1, 0).getDate();

  const cells = [];
  for (let i=0;i<padStart;i++) cells.push(null);
  for (let d=1; d<=daysInMonth; d++) cells.push(new Date(currentY,currentM,d));

  const commitInput = () => {
    if (input.trim()==="") { onChange(""); return; }
    if (isValidDMY(input)) onChange(input);
  };

  return (
    <div className="caldd">
      <div className="caldd__inputwrap">
        <input
          className="input caldd__input"
          value={input}
          onChange={(e)=>setInput(e.target.value)}
          onBlur={commitInput}
          onKeyDown={(e)=>{ if(e.key==="Enter"){ e.currentTarget.blur(); } }}
          placeholder={placeholder}
          aria-label="Seleziona data"
        />
        <button className="caldd__btn" aria-label="Apri calendario" onClick={()=>setOpen(o=>!o)}>📅</button>
      </div>

      {open && (
        <div className="caldd__popover" role="dialog" aria-label="Calendario">
          <div className="caldd__header">
            <button className="btn btn-outline caldd__nav" onClick={()=>setViewDate(new Date(currentY, currentM-1, 1))}>‹</button>
            <div className="caldd__month">
              {viewDate.toLocaleString(undefined, { month: "long", year: "numeric" })}
            </div>
            <button className="btn btn-outline caldd__nav" onClick={()=>setViewDate(new Date(currentY, currentM+1, 1))}>›</button>
          </div>

          <div className="caldd__grid caldd__dow">
            {["Lun","Mar","Mer","Gio","Ven","Sab","Dom"].map(d=><div key={d} className="caldd__dowcell">{d}</div>)}
          </div>

          <div className="caldd__grid">
            {cells.map((d,idx)=>{
              if (!d) return <div key={idx} className="caldd__cell caldd__cell--pad"/>;
              const label = d.getDate();
              const sel = value && isValidDMY(value) && toDMY(d)===value;
              return (
                <button
                  key={idx}
                  className={classNames("caldd__cell", sel && "caldd__cell--sel")}
                  onClick={()=>{
                    const v=toDMY(d);
                    onChange(v);
                    setInput(v);
                    setOpen(false);
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div className="caldd__footer">
            <button className="btn btn-outline" onClick={()=>{ const v=toDMY(new Date()); onChange(v); setInput(v); setOpen(false); }}>Oggi</button>
            <button className="btn" onClick={()=>setOpen(false)}>Chiudi</button>
          </div>
        </div>
      )}
    </div>
  );
}


/* =========================
   API helpers
========================= */
async function fetchRaces(paramsObj = {}) {
  // Costruiamo i parametri per l'API
  const params = new URLSearchParams();

  // Copiamo solo valori valorizzati
  for (const [k, v] of Object.entries(paramsObj)) {
    if (v !== undefined && v !== null && String(v).trim() !== "") {
      params.set(k, v);
    }
  }

  // Forziamo a includere anche il passato lato backend (se supportato)
  if (!params.has("includePast")) params.set("includePast", "true");

  const url = `${API_URL}/api/races?${params.toString()}`;
  // console.debug("[API] GET", url);
  const r = await fetch(url);
  if (!r.ok) throw new Error("Errore API");
  const json = await r.json(); // {items,total,page,limit}

  // ===== Filtro client-side su date_ts come fallback =====
  const fromIso = paramsObj.fromDate ? new Date(paramsObj.fromDate) : null; // yyyy-mm-dd
  const toIso   = paramsObj.toDate   ? new Date(paramsObj.toDate)   : null;
  if (fromIso || toIso) {
    const items = (json.items || []).filter(it => {
      if (!it.date_ts) return false;
      const dt = new Date(it.date_ts);
      if (Number.isNaN(dt)) return false;
      if (fromIso && dt < fromIso) return false;
      if (toIso && dt > toIso) return false;
      return true;
    });
    json.items = items;
    json.total = items.length;
  }

  return json;
}

async function fetchRaceByUrl(raceUrl) {
  const r = await fetch(`${API_URL}/api/race?url=${encodeURIComponent(raceUrl)}`);
  if (!r.ok) throw new Error("Errore API");
  return r.json();
}

/* =========================
   UI Primitives
========================= */
function Burger({ onClick, className }) {
  return (
    <button className={classNames("burger", className)} aria-label="Apri menu" onClick={onClick}>
      <span/><span/><span/>
    </button>
  );
}
function Offcanvas({ open, onClose, onNavigate }) {
  return (
    <div className={classNames("offcanvas", open && "open")} role="dialog" aria-modal="true" aria-label="Menu">
      <div className="offcanvas__header">
        <div className="brand">Runshift</div>
        <button className="btn btn-outline" onClick={onClose}>Chiudi</button>
      </div>
      <nav className="offcanvas__nav">
        <button className="link-like" onClick={() => { onNavigate("home"); onClose(); }}>Home</button>
        <button className="link-like" onClick={() => { onNavigate("search"); onClose(); }}>Cerca gare</button>
        <button className="link-like" onClick={() => { onNavigate("build"); onClose(); }}>Build plan</button>
        <button className="link-like" onClick={() => { onNavigate("plans"); onClose(); }}>My Plans</button>
      </nav>
      <div className="offcanvas__footer">© Runshift</div>
    </div>
  );
}
function TopBar({ onNav, view, setMenuOpen }) {
  return (
    <div className="topbar">
      <div className="container topbar__inner">
        <div className="topbar__left">
          <Burger className="burger--inline" onClick={() => setMenuOpen(true)} />
          <div className="brand" onClick={() => onNav("home")} style={{cursor:"pointer"}}>Runshift</div>
        </div>
        <nav className="topbar__nav">
          <button className={classNames("navlink", view==="home" && "active")} onClick={()=>onNav("home")}>Home</button>
          <button className={classNames("navlink", view==="search" && "active")} onClick={()=>onNav("search")}>Cerca gare</button>
          <button className={classNames("navlink", view==="build" && "active")} onClick={()=>onNav("build")}>Build plan</button>
          <button className={classNames("navlink", view==="plans" && "active")} onClick={()=>onNav("plans")}>My Plans</button>
        </nav>
      </div>
    </div>
  );
}

/* =========================
   Hero (blurred bg)
========================= */
function Hero({ onPrimary, onSecondary }) {
  return (
    <section className="hero" data-blur-bg>
      <div className="hero__bg" style={{ backgroundImage: `url(/images/hero-runner-sunset.jpg)` }} />
      <div className="hero__scrim" />
      <div className="hero__content">
        <h1 className="hero__title">Trova. Corri. Esplora.</h1>
        <p className="hero__subtitle">Dalle 5K alle ultramaratone: scopri gare e luoghi incredibili, costruisci il tuo calendario.</p>
        <div className="hero__actions">
          <button className="btn btn-primary" onClick={onPrimary}>Cerca gare</button>
          <button className="btn btn-outline" onClick={onSecondary}>Inizia il percorso</button>
        </div>
      </div>
    </section>
  );
}

/* =========================
   Components: Card & Details
========================= */
function RaceCard({ race, onDetails, onSelect }) {
  const img = race.image_thumb_url || race.image_url || "/images/placeholder.jpg";
  const dateStr = safeDateToDMY(race.date);

  return (
    <div className="race-card">
      <div className="race-card__image-wrap">
        <img className="race-card__img" src={img} alt={race.race_name} loading="lazy" />
      </div>
      <div className="race-card__body">
        <h3 className="race-card__title">{race.race_name}</h3>
        <p className="race-card__meta">
          {race.location_city}
          {race.location_city && race.location_country ? ", " : ""}
          {race.location_country}
        </p>
        <p className="race-card__meta">{dateStr}</p>
        {race.distance_km && <p className="race-card__badge">Distanze: {race.distance_km}</p>}
        <div className="race-card__actions">
          <button className="btn btn-outline" onClick={() => onDetails(race)}>Dettagli</button>
          {!!onSelect && <button className="btn btn-primary" onClick={() => onSelect(race)}>Seleziona</button>}
        </div>
      </div>
    </div>
  );
}

function RaceDetails({ race, onBack }) {
  if (!race) return <div className="container" style={{ padding: 24 }}><p>Caricamento…</p></div>;
  const img = race.image_thumb_url || race.image_url || "/images/placeholder.jpg";

  return (
    <div className="race-details">
      <div className="race-details__hero">
        <img src={img} alt={race.race_name} className="race-details__img" />
        <div className="race-details__overlay">
          <h1 className="race-details__title">{race.race_name}</h1>
          <p className="race-details__subtitle">
            {race.location_city}{race.location_city && race.location_country ? ", " : ""}{race.location_country}
            {race.date ? " • " + safeDateToDMY(race.date) : ""}
          </p>
        </div>
      </div>

      <div className="container race-details__content">
        <div className="race-details__grid">
          <div className="race-details__left">
            {race.distance_km && <p><strong>Distanze:</strong> {race.distance_km}</p>}
            {race.race_type && <p><strong>Tipo:</strong> {race.race_type}</p>}
            {race.surface && <p><strong>Surface:</strong> {race.surface}</p>}
            {race.fee_range_eur && <p><strong>Quota da:</strong> €{race.fee_range_eur}</p>}
            {race.registration_status && <p><strong>Registrazioni:</strong> {race.registration_status}</p>}
            {race.race_url && (
              <p><a className="link" href={race.race_url} target="_blank" rel="noreferrer">Vai alla pagina ufficiale</a></p>
            )}
            <button className="btn btn-outline mt-16" onClick={onBack}>← Torna ai risultati</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================
   Filters (NO MAP)
========================= */
/* =========================
   Filters (dropdown calendario dd/mm/aaaa)
========================= */
/* =========================
   Filters (dropdown calendario + select)
========================= */
const DISTANCE_OPTIONS = [
  { label: "Tutte le distanze", value: "" },
  { label: "5K", value: "5" },
  { label: "10K", value: "10" },
  { label: "15K", value: "15" },
  { label: "21.1K (Mezza)", value: "21.1" },
  { label: "30K", value: "30" },
  { label: "42.2K (Maratona)", value: "42.2" },
  { label: "50K", value: "50" },
  { label: "100K", value: "100" }
];

function FiltersBar({ value, onChange, countries }) {
  // countries viene sempre passato (array); difendi contro undefined
  const listCountries = Array.isArray(countries) ? countries : [];

  const [local, setLocal] = useState(() => ({
    country: value?.country || "",
    city: value?.city || "",
    distance: value?.distance || "",
    q: value?.q || "",
    type: value?.type || "",
    // UI mantiene dd/mm/yyyy; conversione avviene al click su Applica
    fromDate: value?.fromDate || "",
    toDate: value?.toDate || ""
  }));

  // sincronizza quando value cambia dall’esterno
  useEffect(() => {
    setLocal({
      country: value?.country || "",
      city: value?.city || "",
      distance: value?.distance || "",
      q: value?.q || "",
      type: value?.type || "",
      fromDate: value?.fromDate || "",
      toDate: value?.toDate || ""
    });
  }, [value?.country, value?.city, value?.distance, value?.q, value?.type, value?.fromDate, value?.toDate]);

  return (
    <div className="filters-toolbar">
      <div className="filters-toolbar__grid">
        {/* Paese */}
        <select
          className="input"
          value={local.country}
          onChange={(e)=>setLocal(s=>({...s, country:e.target.value}))}
        >
          <option value="">Tutti i paesi</option>
          {listCountries.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        {/* Tipo gara (libero) */}
        <input
          className="input"
          placeholder="Tipo gara (es. marathon, trail)"
          value={local.type}
          onChange={e=>setLocal(s=>({...s, type:e.target.value}))}
        />

        {/* Distanza */}
        <select
          className="input"
          value={local.distance}
          onChange={(e)=>setLocal(s=>({...s, distance:e.target.value}))}
        >
          {DISTANCE_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        {/* Città */}
        <input
          className="input"
          placeholder="Città"
          value={local.city}
          onChange={e=>setLocal(s=>({...s, city:e.target.value}))}
        />

        {/* Dal */}
        <div className="filters-toolbar__dates">
          <label>Dal</label>
          <CalendarDropdown
            value={local.fromDate || ""}
            onChange={(v)=>setLocal(s=>({...s, fromDate:v}))}
            placeholder="gg/mm/aaaa"
          />
        </div>

        {/* Al */}
        <div className="filters-toolbar__dates">
          <label>Al</label>
          <CalendarDropdown
            value={local.toDate || ""}
            onChange={(v)=>setLocal(s=>({...s, toDate:v}))}
            placeholder="gg/mm/aaaa"
          />
        </div>

        {/* Ricerca libera */}
        <input
          className="input"
          placeholder="Cerca (nome/luogo)"
          value={local.q}
          onChange={e=>setLocal(s=>({...s, q:e.target.value}))}
        />
      </div>

      <div className="filters-toolbar__actions">
        <button
  className="btn btn-outline"
  onClick={()=>{
    const resetUI = {
      country: "",
      city: "",
      distance: "",
      q: "",
      type: "",
      fromDate: safeDateToDMY(new Date()), // oggi in UI gg/mm/aaaa
      toDate: ""
    };
    setLocal(resetUI);
    onChange(resetUI); // il parent convertirà alla fetch
  }}
>Reset</button>


        <button
          className="btn btn-primary"
          onClick={()=>{
            onChange({ ...local });
          }}
        >Applica</button>
      </div>
    </div>
  );
}





/* =========================
   Search Page (senza mappa)
========================= */
function SearchPage({ onDetails, onSelect, initialFilters }) {
  // --- HOOKS: sempre in testa, nessun return prima ---
  const [filters, setFilters] = useState(() => (
    initialFilters || { country:"", city:"", distance:"", q:"", type:"", fromDate:"", toDate:"" }
  ));
  const [page, setPage] = useState(1);
  const [limit] = useState(24);
  const [data, setData] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Paesi (dropdown) – array sempre definito
  const [countries, setCountries] = useState([]);

  // carica paesi una volta
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const r = await fetch(`${API_URL}/api/countries`);
        if (!r.ok) throw new Error("Errore paesi");
        const list = await r.json();
        if (!ignore) setCountries(Array.isArray(list) ? list : []);
      } catch (e) {
        console.error(e);
        if (!ignore) setCountries([]);
      }
    })();
    return () => { ignore = true; };
  }, []);

  // carica gare
  useEffect(() => {
  let ignore=false;
  (async()=>{
    setLoading(true);
    setError?.("");
    try{
      // ✅ Convertiamo QUI (UI -> API) prima della fetch
      const payload = { ...filters, page, limit };
      if (filters.fromDate) payload.fromDate = dmyToIso(filters.fromDate); // "dd/mm/yyyy" -> "yyyy-mm-dd"
      if (filters.toDate)   payload.toDate   = dmyToIso(filters.toDate);

      const res = await fetchRaces(payload);
      if (!ignore) setData(res || { items:[], total:0 });
    }catch(e){
      if (!ignore) setError?.(String(e.message||e));
    }finally{
      if (!ignore) setLoading(false);
    }
  })();
  return ()=>{ ignore=true };
}, [filters, page, limit]);

  const totalPages = Math.max(1, Math.ceil((data?.total || 0) / limit));

  return (
    <div className="section">
      <div className="container">
        <h1 className="section-title" style={{marginTop:6}}>Cerca gare</h1>

        <FiltersBar
          value={filters}
          onChange={(v)=>{ setPage(1); setFilters(v); }}
          countries={countries}
        />

        {error && <div className="alert error">⚠️ {error}</div>}

        <div className="search-results">
          {loading ? <p>Caricamento…</p> : (
            <>
              {data.items.length === 0 && <p>Nessuna gara trovata.</p>}
              <div className="cards-grid">
                {data.items.map((race) => (
                  <RaceCard key={race.race_url} race={race} onDetails={onDetails} onSelect={onSelect} />
                ))}
              </div>
              {totalPages > 1 && (
                <div className="pagination">
                  <button className="btn btn-outline" disabled={page<=1} onClick={()=>setPage(p=>p-1)}>←</button>
                  <div className="pagination__info">{page} / {totalPages}</div>
                  <button className="btn btn-outline" disabled={page>=totalPages} onClick={()=>setPage(p=>p+1)}>→</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}


/* =========================
   Build Page (target + 3 slot suggeriti)
========================= */
function BuildPage({ targetRace, onBackToSearch, onSaved }) {
  const [slots, setSlots] = useState([null, null, null]); // gare scelte
   useEffect(()=>{
  try{
    const raw = sessionStorage.getItem("runshift_current_slots");
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr) && arr.length===3) setSlots(arr);
      sessionStorage.removeItem("runshift_current_slots");
    }
  }catch{}
},[]);

  const [suggestions, setSuggestions] = useState([[], [], []]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Filtri utente per i suggerimenti (tranne tipo/distanza che derivano dallo slot)
  const [userFilters, setUserFilters] = useState({ country:"", city:"", fromDate:"", toDate:"" });
  const [countries, setCountries] = useState([]);

  // Carica paesi (futuro) per dropdown
  useEffect(() => {
    let ignore=false;
    (async ()=>{
      try{
        const r = await fetch(`${API_URL}/api/countries`);
        const list = r.ok ? await r.json() : [];
        if(!ignore) setCountries(Array.isArray(list)?list:[]);
      }catch(e){ if(!ignore) setCountries([]); }
    })();
    return ()=>{ ignore=true };
  }, []);

  const slotPlan = useMemo(()=> recommendSlots(targetRace), [targetRace]);

  // fetch suggerimenti per tutti gli slot
  useEffect(() => {
    if (!targetRace) return;
    let ignore=false;
    (async()=>{
      try{
        setLoading(true); setError("");
        const baseDate = targetRace?.date_ts ? new Date(targetRace.date_ts) : null;
        const out=[[],[],[]];

        for (let i=0;i<slotPlan.length;i++){
          const s = slotPlan[i];
          const p = new URLSearchParams();
          p.set("limit","30");
          p.set("distance", String(s.dist)); // distanza consigliata

          // Filtri utente (converti date UI -> ISO)
          if (userFilters.country) p.set("country", userFilters.country);
          if (userFilters.city)    p.set("city", userFilters.city);
          if (userFilters.fromDate) p.set("fromDate", dmyToIso(userFilters.fromDate));
          if (userFilters.toDate)   p.set("toDate",   dmyToIso(userFilters.toDate));

          // Se c'è baseDate e non hai impostato finestra dal filtro, suggerisci una finestra attorno alla settimana target
          if (baseDate && !userFilters.fromDate && !userFilters.toDate) {
            const dt = new Date(baseDate);
            dt.setDate(dt.getDate() - (s.weeksBefore*7));
            const from = new Date(dt); from.setDate(from.getDate()-10);
            const to   = new Date(dt); to.setDate(to.getDate()+10);
            p.set("fromDate", from.toISOString().slice(0,10));
            p.set("toDate",   to.toISOString().slice(0,10));
          } else {
            // di default: solo futuro
            if (!p.has("fromDate")) p.set("fromDate", todayISO());
          }

          const url = `${API_URL}/api/races?${p.toString()}`;
          const r = await fetch(url);
          const j = r.ok ? await r.json() : { items:[] };
          // filtra client-side per distanza esatta dello slot
           const filtered = (j.items || []).filter(it => hasDistance(it, s.dist));
           out[i] = filtered;
        }
        if(!ignore) setSuggestions(out);
      }catch(e){
        if(!ignore) setError(String(e.message||e));
      }finally{
        if(!ignore) setLoading(false);
      }
    })();
    return ()=>{ ignore=true };
  }, [targetRace, userFilters, slotPlan]);

  // UI per filtri suggerimenti (riusa il tuo CalendarDropdown e stile .input)
  const SuggestionsFilters = (
    <div className="filters-toolbar" style={{marginTop:8}}>
      <div className="filters-toolbar__grid">
        <select className="input" value={userFilters.country} onChange={e=>setUserFilters(s=>({...s,country:e.target.value}))}>
          <option value="">Tutti i paesi</option>
          {countries.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <input className="input" placeholder="Città" value={userFilters.city} onChange={e=>setUserFilters(s=>({...s,city:e.target.value}))}/>
        <div className="filters-toolbar__dates">
          <label>Dal</label>
          <CalendarDropdown value={userFilters.fromDate||""} onChange={(v)=>setUserFilters(s=>({...s,fromDate:v}))}/>
        </div>
        <div className="filters-toolbar__dates">
          <label>Al</label>
          <CalendarDropdown value={userFilters.toDate||""} onChange={(v)=>setUserFilters(s=>({...s,toDate:v}))}/>
        </div>
      </div>
      <div className="filters-toolbar__actions">
        <button className="btn btn-outline" onClick={()=>setUserFilters({country:"",city:"",fromDate:"",toDate:""})}>Reset</button>
      </div>
    </div>
  );

  // Salvataggio piano
  const { savePlan } = usePlansStorage(); // hook definito sopra
  const canSave = targetRace && slots.some(Boolean);
  const handleSave = () => {
    if (!canSave) return;
    const plan = {
      id: undefined,
      name: `${targetRace.race_name} • Build plan`,
      target: targetRace,
      slots,
    };
    const id = savePlan(plan);
    onSaved?.(id);
  };
{view==="build" && (
  <BuildPage
    targetRace={targetRace}
    onBackToSearch={()=>navigate("search")}
    onSaved={(id)=>{ setEditingPlanId(id); navigate("plans"); }}
    savePlan={savePlan}         // <-- aggiunto
  />
)}
  return (
    <div className="section">
      <div className="container">
        <h1 className="section-title" style={{marginTop:6}}>Build your plan</h1>

        {!targetRace ? (
          <>
            <p>Seleziona una gara target nella pagina di ricerca per iniziare il tuo percorso.</p>
            <button className="btn btn-outline" onClick={onBackToSearch}>Vai alla ricerca</button>
          </>
        ) : (
          <>
            <div className="target-panel">
              <div>
                <div className="kicker">Gara target</div>
                <h2 className="target-title">{targetRace.race_name}</h2>
                <div className="target-meta">
                  {targetRace.location_city}{targetRace.location_city && targetRace.location_country ? ", " : ""}{targetRace.location_country}
                  {targetRace.date_ts ? " • " + safeDateToDMY(targetRace.date_ts) : ""}
                </div>
              </div>
              <div style={{display:"flex",gap:8}}>
                <button className="btn btn-outline" onClick={onBackToSearch}>Cambia target</button>
                <button className="btn btn-primary" disabled={!canSave} onClick={handleSave}>Conferma e salva piano</button>
              </div>
            </div>

            <div className="slot-plan-hint">
              {slotPlan.map((s,idx)=>(
                <div key={idx} className="slot-pill">{`Slot ${idx+1}: ${s.label}`}</div>
              ))}
            </div>

            {SuggestionsFilters}

            {error && <div className="alert error">⚠️ {error}</div>}
            {loading && <p>Caricamento suggerimenti…</p>}

            <div className="build-grid">
              {[0,1,2].map((idx)=> {
                const chosen = slots[idx];
                const sug = suggestions[idx]||[];
                const plan = slotPlan[idx];

                return (
                  <div className="build-slot" key={idx}>
                    <div className="slot-head">Slot {idx+1} • <span className="kicker">{plan.label} ({plan.dist}K)</span></div>

                    {!chosen ? (
                      <div className="cards-grid">
                        {sug.slice(0,9).map((race)=>(
                          <RaceCard
                            key={`${idx}-${race.race_url}`}
                            race={race}
                            onDetails={()=>window.open(race.race_url,"_blank")}
                            onSelect={(r)=>setSlots(s=>{const c=[...s]; c[idx]=r; return c;})}
                          />
                        ))}
                        {sug.length===0 && !loading && <p>Nessuna proposta con i filtri attuali.</p>}
                      </div>
                    ) : (
                      <div className="selected-slot">
                        <p className="kicker">Scelto</p>
                        <div className="selected-slot__card">
                          <RaceCard race={chosen} onDetails={()=>window.open(chosen.race_url,"_blank")} />
                        </div>
                        <div style={{display:"flex",gap:8}}>
                          <button className="btn btn-outline" onClick={()=>setSlots(s=>{const c=[...s]; c[idx]=null; return c;})}>Sostituisci</button>
                          <button className="btn btn-primary" onClick={()=>window.open(chosen.race_url,"_blank")}>Apri pagina gara</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}


/* =========================
   Home (hero blur + anteprima)
========================= */
function Home({ onPrimary, onSecondary, onDetails }) {
  const [preview, setPreview] = useState([]);

  useEffect(() => {
    let ignore=false;
    (async()=> {
      try {
        // niente filtri data di default → lasciamo al backend l’ordinamento
        const res = await fetchRaces({ page: 1, limit: 6, fromDate: todayISO() });
        if(!ignore) setPreview(res.items||[]);
      } catch(e){ console.error(e); }
    })();
    return ()=>{ ignore=true };
  }, []);

  return (
    <>
      <Hero onPrimary={onPrimary} onSecondary={onSecondary} />
      <section className="section">
        <div className="container">
          <h2 className="section-title">Prossime in evidenza</h2>
          <div className="cards-grid">
            {preview.map(r => (
              <RaceCard key={r.race_url} race={r} onDetails={onDetails} />
            ))}
          </div>
          <div style={{ display:"flex", justifyContent:"center", marginTop:18 }}>
            <button className="btn btn-primary" onClick={onPrimary}>Vedi tutte</button>
          </div>
        </div>
      </section>
    </>
  );
}

function MyPlans({ onOpen }) {
  const { plans, deletePlan } = usePlansStorage();
   
  {view==="plans" && (
  <MyPlans
    plans={plans}               // <-- aggiunto
    deletePlan={deletePlan}     // <-- aggiunto
    onOpen={(id)=>{
      const plan = getPlan(id);
      if (plan?.target) {
        setTargetRace(plan.target);
        sessionStorage.setItem("runshift_current_slots", JSON.stringify(plan.slots || [null,null,null]));
        navigate("build");
      }
    }}
  />
)}

  return (
    <div className="section">
      <div className="container">
        <h1 className="section-title" style={{marginTop:6}}>My Plans</h1>
        {plans.length === 0 ? (
          <p>Non hai ancora salvato alcun piano.</p>
        ) : (
          <div className="plans-list">
            {plans.map(p => (
              <div key={p.id} className="plan-card">
                <div className="plan-card__hdr">
                  <h3>{p.name || (p.target?.race_name || "Piano senza nome")}</h3>
                  <div className="plan-card__meta">
                    {p.target?.location_country || "—"} • {p.target?.date_ts ? safeDateToDMY(p.target.date_ts) : "—"}
                  </div>
                </div>
                <div className="plan-card__actions">
                  <button className="btn btn-primary" onClick={()=>onOpen(p.id)}>Apri / Modifica</button>
                  <button className="btn btn-outline" onClick={()=>deletePlan(p.id)}>Elimina</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


/* =========================
   App root
========================= */
export default function App(){
  const [view, setView] = useState("home"); // 'home' | 'search' | 'details' | 'build'
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedRace, setSelectedRace] = useState(null);
  const [targetRace, setTargetRace] = useState(null);
  const [editingPlanId, setEditingPlanId] = useState(null);
  const navigate = (v)=>{ setView(v); window.scrollTo(0,0); };
  const plansApi = usePlansStorage();           // ✅ UNICA istanza
  const { plans, savePlan, deletePlan, getPlan } = plansApi;


  const handleDetails = async (race)=>{
    try {
      const full = await fetchRaceByUrl(race.race_url);
      setSelectedRace(full);
      setView("details");
    } catch(e) {
      console.error(e);
      setSelectedRace(race);
      setView("details");
    }
    window.scrollTo(0,0);
  };

  const handleSelect = (race)=>{
    setTargetRace(race);
    setView("build");
    window.scrollTo(0,0);
  };

  return (
    <div>
      <TopBar onNav={navigate} view={view} setMenuOpen={setMenuOpen} />
      <Offcanvas open={menuOpen} onClose={()=>setMenuOpen(false)} onNavigate={navigate} />

      {view==="home" && (
        <Home onPrimary={()=>navigate("search")} onSecondary={()=>navigate("build")} onDetails={handleDetails} />
      )}

      {view==="search" && (
      <SearchPage
         onDetails={handleDetails}
         onSelect={handleSelect}
         initialFilters={{
            country: "",
            city: "",
            distance: "",
            q: "",
            type: "",
            fromDate: safeDateToDMY(new Date()), // oggi in gg/mm/aaaa per la UI
            toDate: ""
         }}
         />

      )}

      {view==="details" && (
        <RaceDetails race={selectedRace} onBack={()=>navigate("search")} />
      )}

     {view==="build" && (
       <BuildPage targetRace={targetRace} onBackToSearch={()=>navigate("search")} onSaved={(id)=>{ setEditingPlanId(id); navigate("plans"); }} />
    )}


{view==="plans" && (
  <MyPlans onOpen={(id)=>{
    const plan = getPlan(id);
    if (plan?.target) {
      setTargetRace(plan.target);
      sessionStorage.setItem("runshift_current_slots", JSON.stringify(plan.slots || [null,null,null]));
      setView("build");
      window.scrollTo(0,0);
    }
  }} />
)}
    </div>
  );
}

