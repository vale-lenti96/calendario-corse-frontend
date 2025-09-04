// src/App.jsx
import "./App.css";
import React, { useEffect, useMemo, useState } from "react";

/* ========== Config ========== */
const API_URL = "https://backend-db-corse-v2.onrender.com";

/* ========== Utils ========== */
function classNames(...x){ return x.filter(Boolean).join(" "); }

function todayISO(){
  const d = new Date();
  const mm = String(d.getMonth()+1).padStart(2,"0");
  const dd = String(d.getDate()).padStart(2,"0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

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
function isValidDMY(str){
  if(!/^\d{2}\/\d{2}\/\d{4}$/.test(str)) return false;
  const [dd,mm,yyyy]=str.split("/").map(Number);
  const d=new Date(yyyy,mm-1,dd);
  return d.getFullYear()===yyyy && d.getMonth()===mm-1 && d.getDate()===dd;
}
function toDMY(d){
  const dd=String(d.getDate()).padStart(2,"0");
  const mm=String(d.getMonth()+1).padStart(2,"0");
  const yyyy=d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}
function fromDMY(str){
  if(!isValidDMY(str)) return null;
  const [dd,mm,yyyy]=str.split("/").map(Number);
  return new Date(yyyy, mm-1, dd);
}

/* ==== Distance helpers ==== */
function parseDistanceSet(str) {
  if (!str) return [];
  const tokens = String(str).split(/[^0-9.,]+/).filter(Boolean);
  const nums = tokens.map(t => parseFloat(t.replace(",", "."))).filter(n => Number.isFinite(n));
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
  const tol = 0.3;
  return set.some(d => Math.abs(d - targetKm) <= tol);
}
/* ====== Distance filter helpers (categorie con range) ====== */
const DISTANCE_CATEGORIES = [
  { key: "",        label: "Tutte le distanze" },
  { key: "5k",      label: "5K",            min: 4.0,   max: 6.0 },
  { key: "10k",     label: "10K",           min: 8.0,   max: 12.0 },
  { key: "15k",     label: "15K",           min: 13.0,  max: 17.0 },
  { key: "half",    label: "Mezza (21.1K)", min: 20.0,  max: 22.8 },
  { key: "25k",     label: "25K",           min: 23.0,  max: 27.0 },
  { key: "30k",     label: "30K",           min: 28.0,  max: 32.0 },
  { key: "marathon",label: "Maratona (42.2K)", min: 41.0, max: 43.5 },
  { key: "ultra",   label: "Ultra (>43K)",  min: 43.5,  max: 10000.0 },
];

/** Estrae array di numeri (in km) da stringhe tipo
 *  "5 km", "10,0km", "Marathon 42.195", "21.1K + 10k"… */

function parseKmList(distanceText) {
  if (!distanceText) return [];
  const txt = Array.isArray(distanceText) ? distanceText.join(", ") : String(distanceText);
  // Normalizza K/k in km (10k -> 10 km), virgole decimali in punto, rimuovi spazi extra
  const norm = txt
    .replace(/(\d)\s*[kK]\b/g, "$1 km")    // 10k -> 10 km
    .replace(/,/g, ".")
    .replace(/\s+/g, " ");
  // Prendi tutte le cifre con eventuali decimali
  const nums = norm.match(/(\d+(?:\.\d+)?)(?=\s*km|\b)/gi) || [];
  // Converte e filtra outlier assurdi
  const km = nums
    .map(s => parseFloat(s))
    .filter(v => isFinite(v) && v > 0 && v < 10000);
  return Array.from(new Set(km)); // unici
}

/** Ritorna il range per la categoria selezionata */
function getRangeForCategory(catKey) {
  const found = DISTANCE_CATEGORIES.find(c => c.key === catKey);
  if (!found || !found.min) return null;
  return { min: found.min, max: found.max };
}

/** Verifica se una gara passa il filtro categoria distanza */
function matchDistanceCategory(race, catKey) {
  if (!catKey) return true; // nessun filtro
  const range = getRangeForCategory(catKey);
  if (!range) return true;
  const distField = race?.distance_km ?? race?.distance ?? "";
  const kms = parseKmList(distField);
  if (kms.length === 0) return false;
  return kms.some(v => v >= range.min && v <= range.max);
}

/* ===== Slot recommendation: distanza & label in base alla target ===== */
function recommendSlots(targetRace){
  const nums = parseDistanceSet(targetRace?.distance_km || "");
  const max = nums[nums.length - 1] || 10;

  if (max >= 42) { // Maratona
    return [
      { dist: 10,   label: "10K preparatoria",    weeksBefore: 10 },
      { dist: 30,   label: "30K lungo gara",      weeksBefore: 5  },
      { dist: 21.1, label: "Mezza di rifinitura", weeksBefore: 3  },
    ];
  }
  if (max >= 21) { // Mezza
    return [
      { dist: 5,   label: "5K velocità",    weeksBefore: 8 },
      { dist: 10,  label: "10K controllo",  weeksBefore: 4 },
      { dist: 10,  label: "10K rifinitura", weeksBefore: 2 },
    ];
  }
  if (max >= 10) { // 10K
    return [
      { dist: 5,   label: "5K ritmo",       weeksBefore: 4 },
      { dist: 5,   label: "5K controllo",   weeksBefore: 2 },
      { dist: 3,   label: "3K rifinitura",  weeksBefore: 1 },
    ];
  }
  // 5K o meno
  return [
    { dist: 3, label: "3K ritmo",      weeksBefore: 3 },
    { dist: 3, label: "3K controllo",  weeksBefore: 2 },
    { dist: 2, label: "2K rifinitura", weeksBefore: 1 },
  ];
}

/* ========== API helpers ========== */
async function fetchWithRetry(url, opts = {}, attempts = 2, delayMs = 1200) {
  try {
    const r = await fetch(url, opts);
    if (!r.ok) {
      const text = await r.text().catch(()=> "");
      throw new Error(`HTTP ${r.status} – ${text?.slice(0,180)}`);
    }
    return r;
  } catch (e) {
    if (attempts > 0) {
      await new Promise(res => setTimeout(res, delayMs));
      return fetchWithRetry(url, opts, attempts - 1, delayMs);
    }
    throw e;
  }
}
async function fetchRaces(paramsObj = {}) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(paramsObj)) {
    if (v !== undefined && v !== null && String(v).trim() !== "") {
      params.set(k, v);
    }
  }
  if (!params.has("includePast")) params.set("includePast", "true");

  const url = `${API_URL}/api/races?${params.toString()}`;

  try {
    const r = await fetchWithRetry(url);
    const json = await r.json();

    // Filtro client-side su date_ts come fallback
    const fromIso = paramsObj.fromDate ? new Date(paramsObj.fromDate) : null;
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
  } catch (e) {
    const msg = (e?.message || "").includes("Failed to fetch")
      ? "Impossibile raggiungere l'API (rete/CORS/timeout)."
      : e?.message || "Errore sconosciuto.";
    throw new Error(msg);
  }
}

/* ===== Plans storage (localStorage) – da usare UNA VOLTA in App ===== */
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
      const next = (i >= 0)
        ? (()=>{ const c=[...prev]; c[i]=withId; return c; })()
        : [{ ...withId, createdAt: new Date().toISOString() }, ...prev];
      try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
      return next;
    });
    return id;
  };
  const deletePlan = (id) => setPlans(prev => {
    const next = prev.filter(p => p.id !== id);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
    return next;
  });
  const getPlan = (id) => plans.find(p => p.id === id) || null;

  return { plans, savePlan, deletePlan, getPlan };
}

/* ========== UI Components ========== */

/* Calendar dropdown (no libs) */
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

/* Card gara */
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

  // Monogram per fallback (prime 2 lettere significative del nome)
  const monogram = (race_name || "Race")
    .replace(/[^A-Za-z0-9 ]/g, "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() || "")
    .join("");

  // Formattazioni comode
  const dateFmt = safeDateToDMY(date_ts);
  const place = [location_city, location_country].filter(Boolean).join(", ");
  const distanceShort = Array.isArray(distance_km)
    ? distance_km.join(", ")
    : (distance_km || "").toString();
  const kmNums = parseKmList(distance_km);
  const distancePretty = kmNums.length ? kmNums.map(k => {
  // format minimal: 42.2 -> "42.2 km", 5 -> "5 km"
  const s = Number.isInteger(k) ? `${k}` : k.toFixed(1).replace(/\.0$/, "");
  return `${s} km`;
}).join(", ") : (distance_km || "");


  return (
    <div className="race-card">
      {/* MEDIA */}
      {hasImage ? (
        <div className="race-media">
          <img
            src={imgSrc}
            alt={race_name}
            loading="lazy"
            onError={(e) => {
              // se l’immagine fallisce, nasconde l’img così scatta il fallback CSS sotto
              e.currentTarget.style.display = "none";
              e.currentTarget.parentElement?.classList.add("no-image");
            }}
          />
        </div>
      ) : (
        <div className="race-media no-image">
          {/* Badge monogramma */}
          <div className="race-monogram" aria-hidden="true">{monogram}</div>
          {/* Badge distanza (se presente) */}
          {distanceShort && (
            <div className="race-distance-badge">{distanceShort}</div>
          )}
          {/* Logo Runshift se ti va (commenta se non lo vuoi) */}
          {/* <img className="race-logo-watermark" src="/images/logo-runshift-R-mountain-road.png" alt="" aria-hidden="true" /> */}
        </div>
      )}

      {/* BODY */}
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
          {distanceShort && (
            <div className="race-meta-row">
              <span className="race-meta-label">Distanze</span>
              <span className="race-meta-value">{distanceShort}</span>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="race-actions">
          <button className="btn btn-outline" onClick={onDetails}>Dettagli</button>
          <button className="btn btn-primary" onClick={onSelect}>Seleziona</button>
        </div>
      </div>
    </div>
  );
}


/* Hero + Home */
function Home({ onStartSearch, onOpenTool, onDetails, onSelect }) {
  const [preview, setPreview] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    let ignore=false;
    (async()=>{
      setLoading(true);
      try{
        const res = await fetchRaces({ page:1, limit:6, fromDate: todayISO() });
        if (!ignore) setPreview(res || {items:[], total:0});
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return ()=>{ ignore=true };
  },[]);

  const heroImg = `${import.meta.env.BASE_URL}images/vecteezy_runner-running-on-road-at-sunset-trees-and-city-background_68852330.jpeg`;

  return (
    <>
      <section className="hero" data-blur-bg>
        <img
          src={heroImg}
          alt=""
          aria-hidden="true"
          className="hero__bg-img"
          loading="eager"
        />
        <div className="hero__scrim" />
        <div className="hero__content">
          <h1 className="hero__title">Trova. Corri. Esplora.</h1>
          <p className="hero__subtitle">Dalle 5K alle ultramaratone: scopri gare e luoghi incredibili e costruisci il tuo calendario.</p>
          <div className="hero__actions">
            <button className="btn btn-primary" onClick={onStartSearch}>Cerca gare</button>
            <button className="btn btn-outline" onClick={onOpenTool}>Trova gara target</button>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 className="section-title">In evidenza</h2>
          {loading ? <p>Caricamento…</p> : (
            <div className="cards-grid">
              {preview.items.map(r => (
                <RaceCard key={r.race_url} race={r} onDetails={onDetails} onSelect={onSelect} />
              ))}
              {preview.items.length===0 && <p>Nessuna gara futura al momento.</p>}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

/* Filters (dropdown calendario + select) */
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
  const listCountries = Array.isArray(countries) ? countries : [];

  const [local, setLocal] = useState(() => ({
    country: value?.country || "",
    city: value?.city || "",
    distance: value?.distance || "",
    q: value?.q || "",
    type: value?.type || "",
    fromDate: value?.fromDate || "",
    toDate: value?.toDate || ""
  }));

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
    <div className="filters-toolbar filters-toolbar--balanced">
      <div className="filters-toolbar__grid">
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

        {/* Distanza (categoria) */}
<div className="filter-field">
  <label className="filter-label">Distanza</label>
  <select
    className="filter-input"
    value={filters.distanceCat || ""}
    onChange={(e) => setFilters(f => ({ ...f, distanceCat: e.target.value }))}
  >
    {DISTANCE_CATEGORIES.map(opt => (
      <option key={opt.key} value={opt.key}>{opt.label}</option>
    ))}
  </select>
</div>


        <input
          className="input"
          placeholder="Città"
          value={local.city}
          onChange={e=>setLocal(s=>({...s, city:e.target.value}))}
        />

        <div className="filters-toolbar__dates">
          <label>Dal</label>
          <CalendarDropdown
            value={local.fromDate || ""}
            onChange={(v)=>setLocal(s=>({...s, fromDate:v}))}
            placeholder="Dal (gg/mm/aaaa)"
            />
        </div>

        <div className="filters-toolbar__dates">
          <label>Al</label>
          <CalendarDropdown
            value={local.toDate || ""}
            onChange={(v)=>setLocal(s=>({...s, toDate:v}))}
            placeholder="Al (gg/mm/aaaa)"
            />
        </div>

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
              fromDate: safeDateToDMY(new Date()), // oggi in UI
              toDate: ""
            };
            setLocal(resetUI);
            onChange(resetUI); // App convertirà prima della fetch
          }}
        >Reset</button>

        <button
          className="btn btn-primary"
          onClick={()=>{
            onChange({ ...local }); // App convertirà prima della fetch
          }}
        >Applica</button>
      </div>
    </div>
  );
}

/* Pagina Ricerca */
function SearchPage({ onDetails, onSelect, initialFilters }) {
  const [filters, setFilters] = useState(() => (
    initialFilters || { country:"", city:"", distance:"", q:"", type:"", fromDate:"", toDate:"" }
  ));
  const [page, setPage] = useState(1);
  const [limit] = useState(24);
  const [data, setData] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [countries, setCountries] = useState([]);

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

  useEffect(() => {
    let ignore=false;
    (async()=>{
      setLoading(true);
      setError("");
      try{
        // Convertiamo QUI (UI -> API) prima della fetch
        const payload = { ...filters, page, limit };
        if (filters.fromDate) payload.fromDate = dmyToIso(filters.fromDate);
        if (filters.toDate)   payload.toDate   = dmyToIso(filters.toDate);

        const res = await fetchRaces(payload);
        if (!ignore) setData(res || { items:[], total:0 });
      }catch(e){
        if (!ignore) setError(String(e.message||e));
      }finally{
        if (!ignore) setLoading(false);
      }
    })();
    return ()=>{ ignore=true };
  }, [filters, page, limit]);

  const filteredRaces = useMemo(() => {
  let out = races || [];
  // ...altri filtri (testo, paese, data, tipo)...
  if (filters.distanceCat && filters.distanceCat !== "") {
    out = out.filter(r => matchDistanceCategory(r, filters.distanceCat));
  }
  return out;
}, [races, filters]);


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

/* Dettaglio gara */
function RaceDetails({ race, onBack }) {
  if (!race) return <div className="container" style={{ padding: 24 }}><p>Caricamento…</p></div>;
  const img = race.image_thumb_url || race.image_url || `${import.meta.env.BASE_URL}images/placeholder.jpg`;

  return (
    <div className="race-details">
      <div className="race-details__hero">
        <img src={img} alt={race.race_name} className="race-details__img" />
        <div className="race-details__overlay">
          <h1 className="race-details__title">{race.race_name}</h1>
          <p className="race-details__subtitle">
            {race.location_city}{race.location_city && race.location_country ? ", " : ""}{race.location_country}
            {race.date_ts ? " • " + safeDateToDMY(race.date_ts) : ""}
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

/* Build Page (slots + suggerimenti + salvataggio) */
function BuildPage({ targetRace, onBackToSearch, onSaved, savePlan }) {
  const [slots, setSlots] = useState([null, null, null]); // gare scelte
  const [suggestions, setSuggestions] = useState([[], [], []]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [userFilters, setUserFilters] = useState({ country:"", city:"", fromDate:"", toDate:"" });
  const [countries, setCountries] = useState([]);

  // ripristina slot da sessionStorage (da MyPlans → Build)
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

  useEffect(() => {
    let ignore=false;
    (async ()=>{
      try {
        const r = await fetch(`${API_URL}/api/countries`);
        const list = r.ok ? await r.json() : [];
        if(!ignore) setCountries(Array.isArray(list)?list:[]);
      } catch (e) {
        if(!ignore) setCountries([]);
      }
    })();
    return ()=>{ ignore=true };
  }, []);

  const slotPlan = useMemo(()=> recommendSlots(targetRace), [targetRace]);

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

          if (userFilters.country) p.set("country", userFilters.country);
          if (userFilters.city)    p.set("city", userFilters.city);
          if (userFilters.fromDate) p.set("fromDate", dmyToIso(userFilters.fromDate));
          if (userFilters.toDate)   p.set("toDate",   dmyToIso(userFilters.toDate));

          if (baseDate && !userFilters.fromDate && !userFilters.toDate) {
            const dt = new Date(baseDate);
            dt.setDate(dt.getDate() - (s.weeksBefore*7));
            const from = new Date(dt); from.setDate(from.getDate()-10);
            const to   = new Date(dt); to.setDate(to.getDate()+10);
            p.set("fromDate", from.toISOString().slice(0,10));
            p.set("toDate",   to.toISOString().slice(0,10));
          } else {
            if (!p.has("fromDate")) p.set("fromDate", todayISO());
          }

          const url = `${API_URL}/api/races?${p.toString()}`;
          const r = await fetch(url);
          const j = r.ok ? await r.json() : { items:[] };

          // Filtra client-side per distanza esatta dello slot
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

  const SuggestionsFilters = (
    <div className="filters-toolbar filters-toolbar--balanced" style={{marginTop:8}}>
      <div className="filters-toolbar__grid">
        <select className="input" value={userFilters.country} onChange={e=>setUserFilters(s=>({...s,country:e.target.value}))}>
          <option value="">Tutti i paesi</option>
          {countries.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <input className="input" placeholder="Città" value={userFilters.city} onChange={e=>setUserFilters(s=>({...s,city:e.target.value}))}/>
        <div className="filters-toolbar__dates">
          <label>Dal</label>
          <CalendarDropdown
  value={userFilters.fromDate||""}
  onChange={(v)=>setUserFilters(s=>({...s,fromDate:v}))}
  placeholder="Dal (gg/mm/aaaa)"
/>
        </div>
        <div className="filters-toolbar__dates">
          <label>Al</label>
          <CalendarDropdown
  value={userFilters.toDate||""}
  onChange={(v)=>setUserFilters(s=>({...s,toDate:v}))}
  placeholder="Al (gg/mm/aaaa)"
/>
        </div>
      </div>
      <div className="filters-toolbar__actions">
        <button className="btn btn-outline" onClick={()=>setUserFilters({country:"",city:"",fromDate:"",toDate:""})}>Reset</button>
      </div>
    </div>
  );

  const canSave = targetRace && slots.some(Boolean);
  const handleSave = () => {
    if (!canSave) return;
    const plan = {
      id: undefined,
      name: `${targetRace.race_name} • Build plan`,
      target: targetRace,
      slots,
    };
    const id = typeof savePlan === "function" ? savePlan(plan) : null;
    if (id) onSaved?.(id);
  };

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

/* My Plans */
function MyPlans({ plans = [], deletePlan, onOpen }) {
  return (
    <div className="section">
      <div className="container">
        <h1 className="section-title" style={{marginTop:6}}>My Plans</h1>
        {(!plans || plans.length === 0) ? (
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
                  <button className="btn btn-primary" onClick={()=>onOpen?.(p.id)}>Apri / Modifica</button>
                  <button className="btn btn-outline" onClick={()=>deletePlan?.(p.id)}>Elimina</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* Topbar semplice + menu hamburger */
function TopBar({ view, onNav }) {
  const [open, setOpen] = useState(false);
  const logo = `${import.meta.env.BASE_URL}images/logo-runshift-R-mountain-road.png`;

  return (
    <>
      <header className="topbar">
        <div className="container topbar__inner">
          <div className="topbar__brand" onClick={()=>onNav("home")}>
            <img src={logo} alt="" aria-hidden="true" className="brand__logo"/>
            <span className="brand__name">Runshift</span>
          </div>
          <nav className="topbar__nav hide-on-mobile">
            <button className={classNames("navlink", view==="home" && "active")} onClick={()=>onNav("home")}>Home</button>
            <button className={classNames("navlink", view==="search" && "active")} onClick={()=>onNav("search")}>Cerca</button>
            <button className={classNames("navlink", view==="build" && "active")} onClick={()=>onNav("build")}>Build</button>
            <button className={classNames("navlink", view==="plans" && "active")} onClick={()=>onNav("plans")}>My Plans</button>
          </nav>
          <button className="hamburger show-on-mobile" onClick={()=>setOpen(true)} aria-label="Apri menu">☰</button>
        </div>
      </header>
      {open && (
        <div className="offcanvas">
          <div className="offcanvas__panel">
            <button className="offcanvas__close" onClick={()=>setOpen(false)} aria-label="Chiudi">✕</button>
            <nav className="offcanvas__nav">
              <button className="link-like" onClick={()=>{ onNav("home"); setOpen(false); }}>Home</button>
              <button className="link-like" onClick={()=>{ onNav("search"); setOpen(false); }}>Cerca</button>
              <button className="link-like" onClick={()=>{ onNav("build"); setOpen(false); }}>Build</button>
              <button className="link-like" onClick={()=>{ onNav("plans"); setOpen(false); }}>My Plans</button>
            </nav>
          </div>
          <div className="offcanvas__backdrop" onClick={()=>setOpen(false)} />
        </div>
      )}
    </>
  );
}

/* ========== App Root ========== */
export default function App(){
  const [view, setView] = useState("home");
  const [targetRace, setTargetRace] = useState(null);

  // Storage piani centralizzato
  const plansApi = usePlansStorage();
  const { plans, savePlan, deletePlan, getPlan } = plansApi;

  const navigate = (v) => { setView(v); window.scrollTo(0,0); };

  const handleDetails = (race) => {
    setTargetRace(race);
    navigate("details");
  };
  const handleSelect = (race) => {
    setTargetRace(race);
    navigate("build");
  };

  return (
    <>
      <TopBar view={view} onNav={navigate} />

      {view==="home" && (
        <Home
          onStartSearch={()=>navigate("search")}
          onOpenTool={()=>navigate("search")}
          onDetails={handleDetails}
          onSelect={handleSelect}
        />
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
            fromDate: safeDateToDMY(new Date()), // default: solo futuro
            toDate: ""
          }}
        />
      )}

      {view==="details" && targetRace && (
        <RaceDetails
          race={targetRace}
          onBack={()=>navigate("search")}
        />
      )}

      {view==="build" && (
        <BuildPage
          targetRace={targetRace}
          onBackToSearch={()=>navigate("search")}
          onSaved={(id)=>{ navigate("plans"); }}
          savePlan={savePlan}
        />
      )}

      {view==="plans" && (
        <MyPlans
          plans={plans}
          deletePlan={deletePlan}
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
    </>
  );
}
