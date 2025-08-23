import { useEffect, useMemo, useState } from "react";
import "./App.css";

// === Config API ===
const API_URL = "https://backend-db-corse-v2.onrender.com";

// === Utils ===
function todayISO() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function safeDateToLocale(dateStr) {
  if (!dateStr) return "";
  // accetta 'YYYY-MM-DD' oppure ISO 'YYYY-MM-DDTHH:mm:ss'
  const d = dateStr.length === 10 ? new Date(`${dateStr}T00:00:00`) : new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString();
}

function classNames(...a){ return a.filter(Boolean).join(" "); }

// === API helpers ===
async function fetchRaces({ country, city, distance, q, page = 1, limit = 24, fromDate, toDate }) {
  const params = new URLSearchParams();
  if (country) params.set("country", country);
  if (city) params.set("city", city);
  if (q) params.set("q", q);
  if (distance) params.set("distance", String(distance)); // "contiene" lato backend
  if (fromDate) params.set("fromDate", fromDate);
  if (toDate) params.set("toDate", toDate);
  params.set("page", page);
  params.set("limit", limit);

  const r = await fetch(`${API_URL}/api/races?${params.toString()}`);
  if (!r.ok) throw new Error("Errore API");
  return r.json(); // {items,total,page,limit}
}

async function fetchRaceByUrl(raceUrl) {
  const r = await fetch(`${API_URL}/api/race?url=${encodeURIComponent(raceUrl)}`);
  if (!r.ok) throw new Error("Errore API");
  return r.json();
}

// === Nav / Layout ===
function TopBar({ onNav, view, setMenuOpen }) {
  return (
    <div className="topbar">
      <div className="container topbar__inner">
        <button className="burger burger--inline" onClick={() => setMenuOpen(true)} aria-label="Menu">
          <span/><span/><span/>
        </button>
        <div className="brand" onClick={() => onNav("home")} style={{cursor:"pointer"}}>Runshift</div>
        <nav className="topbar__nav">
          <button className={classNames("navlink", view==="home" && "active")} onClick={()=>onNav("home")}>Home</button>
          <button className={classNames("navlink", view==="search" && "active")} onClick={()=>onNav("search")}>Cerca gare</button>
          <button className={classNames("navlink", view==="build" && "active")} onClick={()=>onNav("build")}>Build plan</button>
        </nav>
      </div>
    </div>
  );
}

function Offcanvas({ open, onClose, onNavigate }) {
  return (
    <div className={classNames("offcanvas", open && "open")}>
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

// === HERO Home ===
function Hero({ onPrimary, onSecondary }) {
  return (
    <section
      className="hero hero--tight"
      style={{ backgroundImage: `url(/images/hero-runner-sunset.jpg)` }}
    >
      <div className="hero__scrim" />
      <div className="hero__content">
        <h1 className="hero__title">Trova. Corri. Esplora.</h1>
        <p className="hero__subtitle">Dalle 5K alle ultramaratone, costruisci il tuo calendario perfetto.</p>
        <div className="hero__actions">
          <button className="btn btn-primary" onClick={onPrimary}>Cerca gare</button>
          <button className="btn btn-outline" onClick={onSecondary}>Inizia il percorso</button>
        </div>
      </div>
    </section>
  );
}

// === CARD GARA (immagine: preferisci sempre thumb, poi full, poi placeholder) ===
function RaceCard({ race, onDetails, onSelect }) {
  const img = race.image_thumb_url || race.image_url || "/images/placeholder.jpg";
  const dateStr = safeDateToLocale(race.date);

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
          {onSelect && <button className="btn btn-primary" onClick={() => onSelect(race)}>Seleziona</button>}
        </div>
      </div>
    </div>
  );
}

// === DETTAGLI GARA ===
function RaceDetails({ race, onBack }) {
  if (!race) {
    return <div className="container" style={{ padding: 24 }}><p>Caricamento…</p></div>;
  }
  const img = race.image_thumb_url || race.image_url || "/images/placeholder.jpg";
  const dateStr = safeDateToLocale(race.date);

  return (
    <div className="race-details">
      <div className="race-details__hero">
        <img src={img} alt={race.race_name} className="race-details__img" />
        <div className="race-details__overlay">
          <h1 className="race-details__title">{race.race_name}</h1>
          <p className="race-details__subtitle">
            {race.location_city}{race.location_city && race.location_country ? ", " : ""}{race.location_country}
            {dateStr ? " • " + dateStr : ""}
          </p>
        </div>
      </div>

      <div className="container race-details__content">
        {race.distance_km && <p><strong>Distanze:</strong> {race.distance_km}</p>}
        {race.race_type && <p><strong>Tipo:</strong> {race.race_type}</p>}
        {race.surface && <p><strong>Surface:</strong> {race.surface}</p>}
        {race.fee_range_eur && <p><strong>Quota da:</strong> €{race.fee_range_eur}</p>}
        {race.race_url && (
          <p><a className="link" href={race.race_url} target="_blank" rel="noreferrer">Vai alla pagina ufficiale</a></p>
        )}
        <div className="mt-16">
          <button className="btn btn-outline" onClick={onBack}>← Torna ai risultati</button>
        </div>
      </div>
    </div>
  );
}

// === TOOLBAR FILTRI (coerente e minimal) ===
function FiltersBar({ value, onChange, showPast, setShowPast, onApply }) {
  const [local, setLocal] = useState(value);
  useEffect(()=>{ setLocal(value) }, [value]);

  return (
    <div className="filters-toolbar">
      <div className="filters-toolbar__grid">
        <input className="input" placeholder="Paese" value={local.country} onChange={e=>setLocal(s=>({...s, country:e.target.value}))}/>
        <input className="input" placeholder="Città" value={local.city} onChange={e=>setLocal(s=>({...s, city:e.target.value}))}/>
        <input className="input" placeholder="Distanza (es. 42)" value={local.distance} onChange={e=>setLocal(s=>({...s, distance:e.target.value}))}/>
        <input className="input" placeholder="Cerca (nome/luogo)" value={local.q} onChange={e=>setLocal(s=>({...s, q:e.target.value}))}/>
        <div className="filters-toolbar__switch">
          <label className="switch">
            <input type="checkbox" checked={showPast} onChange={e=>setShowPast(e.target.checked)} />
            <span className="slider" />
          </label>
          <span className="switch__label">Includi gare passate</span>
        </div>
      </div>
      <div className="filters-toolbar__actions">
        <button className="btn btn-outline" onClick={()=>{ setLocal({country:"",city:"",distance:"",q:""}); onChange({country:"",city:"",distance:"",q:""}); }}>Reset</button>
        <button className="btn btn-primary" onClick={()=> onChange(local)}>Applica</button>
      </div>
    </div>
  );
}

// === PAGINA RICERCA ===
function SearchPage({ onDetails, onSelect, initialFilters }) {
  // di default mostriamo SOLO futuro → fromDate = oggi
  const [showPast, setShowPast] = useState(false);
  const [filters, setFilters] = useState(initialFilters || { country: "", city: "", distance: "", q: "" });
  const [page, setPage] = useState(1);
  const [limit] = useState(24);
  const [data, setData] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(false);

  const totalPages = useMemo(() => Math.max(1, Math.ceil((data?.total || 0) / limit)), [data, limit]);
  const fromDate = showPast ? undefined : todayISO();

  useEffect(() => {
    let ignore = false;
    async function run() {
      setLoading(true);
      try {
        const res = await fetchRaces({ ...filters, page, limit, fromDate });
        if (!ignore) setData(res);
      } catch (e) {
        console.error(e);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    run();
    return () => { ignore = true; };
  }, [filters, page, limit, fromDate]);

  return (
    <>
      <div className="section">
        <div className="container">
          <h1 className="section-title" style={{marginTop: 6}}>Cerca gare</h1>
          <FiltersBar
            value={filters}
            onChange={(v)=>{ setPage(1); setFilters(v); }}
            showPast={showPast}
            setShowPast={setShowPast}
          />
        </div>
      </div>

      <div className="container" style={{ minHeight: 200 }}>
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
                <button className="btn btn-outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>←</button>
                <div className="pagination__info">{page} / {totalPages}</div>
                <button className="btn btn-outline" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>→</button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

// === BUILD PAGE (seleziona target + 3 slot suggerimenti) ===
function BuildPage({ targetRace, onPickTarget, onBackToSearch }) {
  const [slots, setSlots] = useState([null, null, null]);
  const [suggestions, setSuggestions] = useState([[], [], []]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let ignore = false;
    async function run() {
      if (!targetRace) return;
      setLoading(true);
      try {
        const baseDate = targetRace.date ? new Date(targetRace.date) : null;
        const distForSuggest = (targetRace.distance_km || "").split("/")[0]?.trim() || "";
        const out = [[], [], []];

        const ranges = [
          { weeks: 10 }, // ~8-12
          { weeks: 5 },  // ~4-6
          { weeks: 3 },  // ~2-3
        ];

        for (let i = 0; i < ranges.length; i++) {
          const params = new URLSearchParams();
          if (distForSuggest) params.set("distance", distForSuggest);
          params.set("limit", "12");
          if (baseDate) {
            const dt = new Date(baseDate);
            dt.setDate(dt.getDate() - (ranges[i].weeks * 7));
            const fromDate = new Date(dt); fromDate.setDate(fromDate.getDate() - 14);
            const toDate = new Date(dt); toDate.setDate(toDate.getDate() + 14);
            params.set("fromDate", fromDate.toISOString().slice(0, 10));
            params.set("toDate", toDate.toISOString().slice(0, 10));
          } else {
            params.set("fromDate", todayISO());
          }
          const r = await fetch(`${API_URL}/api/races?${params.toString()}`);
          const json = await r.json();
          out[i] = json.items || [];
        }
        if (!ignore) setSuggestions(out);
      } catch (e) {
        console.error(e);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    run();
    return () => { ignore = true; };
  }, [targetRace]);

  return (
    <>
      <div className="section">
        <div className="container">
          <h1 className="section-title" style={{marginTop: 6}}>Build your plan</h1>
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
                    {targetRace.date ? " • " + safeDateToLocale(targetRace.date) : ""}
                  </div>
                </div>
                <button className="btn btn-outline" onClick={onBackToSearch}>Cambia target</button>
              </div>

              <div className="build-grid">
                {[0, 1, 2].map((idx) => {
                  const slotRace = slots[idx];
                  const sug = suggestions[idx] || [];
                  return (
                    <div className="build-slot" key={idx}>
                      <div className="slot-head">Slot {idx + 1}</div>
                      {!slotRace ? (
                        <>
                          {loading && <p>Caricamento suggerimenti…</p>}
                          <div className="cards-grid">
                            {sug.slice(0, 6).map((race) => (
                              <RaceCard
                                key={`${idx}-${race.race_url}`}
                                race={race}
                                onDetails={() => window.open(race.race_url, "_blank")}
                                onSelect={(r) => setSlots(s => { const c = [...s]; c[idx] = r; return c; })}
                              />
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="selected-slot">
                          <p className="kicker">Scelto</p>
                          <div className="selected-slot__card">
                            <RaceCard
                              race={slotRace}
                              onDetails={() => window.open(slotRace.race_url, "_blank")}
                              onSelect={() => {}}
                            />
                          </div>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button className="btn btn-outline" onClick={() => setSlots(s => { const c = [...s]; c[idx] = null; return c; })}>Sostituisci</button>
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
    </>
  );
}

// === HOME SECTION (coerente con resto) ===
function Home({ onPrimary, onSecondary }) {
  return (
    <>
      <Hero onPrimary={onPrimary} onSecondary={onSecondary} />
      <section className="section">
        <div className="container">
          <h2 className="section-title">Perché Runshift?</h2>
          <div className="features">
            <div className="feature">
              <div className="feature__title">Motivazione</div>
              <div className="feature__body">Eventi iconici, luoghi epici, storie da raccontare.</div>
            </div>
            <div className="feature">
              <div className="feature__title">Pianificazione</div>
              <div className="feature__body">Costruisci un calendario intelligente con build‑up mirati.</div>
            </div>
            <div className="feature">
              <div className="feature__title">Semplicità</div>
              <div className="feature__body">Filtri chiari, card visive e dettagli essenziali.</div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

// === APP ROOT ===
export default function App() {
  const [view, setView] = useState("home"); // 'home' | 'search' | 'details' | 'build'
  const [menuOpen, setMenuOpen] = useState(false);

  const [selectedRace, setSelectedRace] = useState(null); // per dettagli
  const [targetRace, setTargetRace] = useState(null);     // per build plan

  const navigate = (v) => { setView(v); window.scrollTo(0, 0); };

  const handleDetails = async (race) => {
    try {
      const full = await fetchRaceByUrl(race.race_url);
      setSelectedRace(full);
      setView("details");
      window.scrollTo(0, 0);
    } catch (e) {
      console.error(e);
      setSelectedRace(race);
      setView("details");
    }
  };

  const handleSelectTarget = (race) => {
    setTargetRace(race);
    setView("build");
    window.scrollTo(0, 0);
  };

  return (
    <div>
      <TopBar onNav={navigate} view={view} setMenuOpen={setMenuOpen} />
      <Offcanvas open={menuOpen} onClose={()=>setMenuOpen(false)} onNavigate={navigate} />

      {view === "home" && (
        <Home onPrimary={() => navigate("search")} onSecondary={() => navigate("build")} />
      )}

      {view === "search" && (
        <SearchPage
          onDetails={handleDetails}
          onSelect={handleSelectTarget}
          initialFilters={{ country: "", city: "", distance: "", q: "" }}
        />
      )}

      {view === "details" && (
        <RaceDetails race={selectedRace} onBack={() => navigate("search")} />
      )}

      {view === "build" && (
        <BuildPage
          targetRace={targetRace}
          onPickTarget={handleSelectTarget}
          onBackToSearch={() => navigate("search")}
        />
      )}
    </div>
  );
}
