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

/* Estrae numeri (km) da "42 / 21.1 / 10" */
function parseDistanceSet(distance_km = "") {
  const nums = (distance_km.match(/(\d+(?:\.\d+)?)/g) || []).map(Number);
  return [...new Set(nums)].sort((a,b)=>a-b);
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
async function fetchRaces(paramsObj) {
  const params = new URLSearchParams();
  // passa SOLO i parametri valorizzati
  Object.entries(paramsObj || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v).trim() !== "") {
      params.set(k, v);
    }
  });
  const url = `${API_URL}/api/races?${params.toString()}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error("Errore API");
  return r.json(); // {items,total,page,limit}
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
function FiltersBar({ value, onChange }) {
  const [local, setLocal] = useState(value);

  useEffect(() => { setLocal(value); }, [value]);

  return (
    <div className="filters-toolbar">
      <div className="filters-toolbar__grid">
        <input className="input" placeholder="Paese" value={local.country} onChange={e=>setLocal(s=>({...s, country:e.target.value}))}/>
        <input className="input" placeholder="Tipo gara (es. marathon, trail)" value={local.type} onChange={e=>setLocal(s=>({...s, type:e.target.value}))}/>
        <input className="input" placeholder="Distanza (es. 42)" value={local.distance} onChange={e=>setLocal(s=>({...s, distance:e.target.value}))}/>
        <input className="input" placeholder="Città" value={local.city} onChange={e=>setLocal(s=>({...s, city:e.target.value}))}/>

        <div className="filters-toolbar__dates">
          <label>Dal</label>
          <CalendarDropdown
            value={local.fromDate || ""}
            onChange={(v)=>setLocal(s=>({...s, fromDate:v}))}
            placeholder="gg/mm/aaaa"
          />
        </div>

        <div className="filters-toolbar__dates">
          <label>Al</label>
          <CalendarDropdown
            value={local.toDate || ""}
            onChange={(v)=>setLocal(s=>({...s, toDate:v}))}
            placeholder="gg/mm/aaaa"
          />
        </div>

        <input className="input" placeholder="Cerca (nome/luogo)" value={local.q} onChange={e=>setLocal(s=>({...s, q:e.target.value}))}/>
      </div>

      <div className="filters-toolbar__actions">
        <button
          className="btn btn-outline"
          onClick={()=>{
            const reset={country:"", city:"", distance:"", q:"", type:"", fromDate:"", toDate:""};
            setLocal(reset); onChange(reset);
          }}
        >Reset</button>

        <button
          className="btn btn-primary"
          onClick={()=>{
            // CONVERSIONE per l'API: dd/mm/yyyy -> yyyy-mm-dd (DB filtra su date_ts)
            const payload = { ...local };
            if (local.fromDate) payload.fromDate = dmyToIso(local.fromDate);
            if (local.toDate)   payload.toDate   = dmyToIso(local.toDate);
            onChange(payload);
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
  const [filters, setFilters] = useState(initialFilters || { country: "", city: "", distance: "", q: "", type: "", fromDate:"", toDate:"" });
  const [page, setPage] = useState(1);
  const [limit] = useState(24);
  const [data, setData] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(false);

  const totalPages = useMemo(() => Math.max(1, Math.ceil((data?.total || 0) / limit)), [data, limit]);

  useEffect(() => {
    let ignore=false;
    async function run(){
      setLoading(true);
      try{
        const res = await fetchRaces({ ...filters, page, limit });
        if(!ignore) setData(res);
      }catch(e){ console.error(e); }
      finally{ if(!ignore) setLoading(false); }
    }
    run();
    return ()=>{ ignore=true };
  }, [filters, page, limit]);

  return (
    <div className="section">
      <div className="container">
        <h1 className="section-title" style={{marginTop:6}}>Cerca gare</h1>
        <FiltersBar value={filters} onChange={(v)=>{ setPage(1); setFilters(v); }} />
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
function BuildPage({ targetRace, onBackToSearch }) {
  const [slots, setSlots] = useState([null, null, null]);
  const [suggestions, setSuggestions] = useState([[], [], []]);
  const [loading, setLoading] = useState(false);

  function slotDistanceTargets(target) {
    const ds = parseDistanceSet(target?.distance_km || "");
    const max = ds[ds.length - 1] || 21;
    if (max >= 42) return [21.1, 10, 5];
    if (max >= 21) return [10, 5, 5];
    if (max >= 10) return [5, 5, 3];
    return [5, 3, 3];
  }

  useEffect(() => {
    let ignore=false;
    async function run(){
      if (!targetRace) return;
      setLoading(true);
      try{
        const baseDate = targetRace?.date_ts ? new Date(targetRace.date_ts) : null;
        const slotDistances = slotDistanceTargets(targetRace);
        const out=[[],[],[]];

        const ranges=[ {weeks:10}, {weeks:5}, {weeks:3} ];
        for (let i=0;i<ranges.length;i++){
          const p = new URLSearchParams();
          p.set("limit","12");
          p.set("distance", String(slotDistances[i]));
          if (baseDate && !isNaN(baseDate)) {
            const dt = new Date(baseDate);
            dt.setDate(dt.getDate() - (ranges[i].weeks * 7));
            const fromDate=new Date(dt); fromDate.setDate(fromDate.getDate()-14);
            const toDate=new Date(dt); toDate.setDate(toDate.getDate()+14);
            p.set("fromDate", fromDate.toISOString().slice(0,10));
            p.set("toDate", toDate.toISOString().slice(0,10));
          }
          const r = await fetch(`${API_URL}/api/races?${p.toString()}`);
          const j = await r.json();
          out[i]=j.items||[];
        }
        if(!ignore) setSuggestions(out);
      }catch(e){ console.error(e); }
      finally{ if(!ignore) setLoading(false); }
    }
    run();
    return ()=>{ ignore=true };
  }, [targetRace]);

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
              <button className="btn btn-outline" onClick={onBackToSearch}>Cambia target</button>
            </div>

            <div className="build-grid">
              {[0,1,2].map((idx)=> {
                const slotRace=slots[idx];
                const sug=suggestions[idx]||[];
                return (
                  <div className="build-slot" key={idx}>
                    <div className="slot-head">Slot {idx+1}</div>
                    {!slotRace ? (
                      <>
                        {loading && <p>Caricamento suggerimenti…</p>}
                        <div className="cards-grid">
                          {sug.slice(0,6).map((race)=>(
                            <RaceCard
                              key={`${idx}-${race.race_url}`}
                              race={race}
                              onDetails={()=>window.open(race.race_url,"_blank")}
                              onSelect={(r)=>setSlots(s=>{const c=[...s]; c[idx]=r; return c;})}
                            />
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="selected-slot">
                        <p className="kicker">Scelto</p>
                        <div className="selected-slot__card">
                          <RaceCard race={slotRace} onDetails={()=>window.open(slotRace.race_url,"_blank")} />
                        </div>
                        <div style={{display:"flex",gap:8}}>
                          <button className="btn btn-outline" onClick={()=>setSlots(s=>{const c=[...s]; c[idx]=null; return c;})}>Sostituisci</button>
                          <button className="btn btn-primary">Conferma slot</button>
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
        const res = await fetchRaces({ page:1, limit:6 });
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

/* =========================
   App root
========================= */
export default function App(){
  const [view, setView] = useState("home"); // 'home' | 'search' | 'details' | 'build'
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedRace, setSelectedRace] = useState(null);
  const [targetRace, setTargetRace] = useState(null);

  const navigate = (v)=>{ setView(v); window.scrollTo(0,0); };

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
          initialFilters={{ country:"", city:"", distance:"", q:"", type:"", fromDate:"", toDate:"" }}
        />
      )}

      {view==="details" && (
        <RaceDetails race={selectedRace} onBack={()=>navigate("search")} />
      )}

      {view==="build" && (
        <BuildPage targetRace={targetRace} onBackToSearch={()=>navigate("search")} />
      )}
    </div>
  );
}

