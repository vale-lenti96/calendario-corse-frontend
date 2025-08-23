import { useEffect, useMemo, useState } from "react";
import "./App.css";

/** =========================
 * Config
 * ========================= */
const API_URL = "https://backend-db-corse-v2.onrender.com";

/** =========================
 * Utils
 * ========================= */
function todayISO() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}
function safeDateToLocale(s) {
  if (!s) return "";
  const isShort = /^\d{4}-\d{2}-\d{2}$/.test(s);
  const d = new Date(isShort ? `${s}T00:00:00` : s);
  return isNaN(d.getTime()) ? "" : d.toLocaleDateString();
}
function classNames(...a) { return a.filter(Boolean).join(" "); }

// Estrae numeri (km) da stringhe tipo "42 / 21.1 / 10"
function parseDistanceSet(distance_km = "") {
  const nums = (distance_km.match(/(\d+(?:\.\d+)?)/g) || []).map(Number);
  return [...new Set(nums)].sort((a,b)=>a-b);
}

function buildStaticMapURL(items, opts = {}) {
  // Static map OSM (senza chiavi) — mostriamo max 10 marker per performance
  const size = opts.size || "640x360";
  const zoom = opts.zoom || 4;

  const withCoords = items
    .filter(r => r.geo_lat && r.geo_lon)
    .slice(0, 10);

  if (withCoords.length === 0) {
    // fallback Europa
    return `https://staticmap.openstreetmap.de/staticmap.php?center=48.5,12&zoom=${zoom}&size=${size}`;
  }

  // centro = media
  const avgLat = withCoords.reduce((s, r) => s + Number(r.geo_lat), 0) / withCoords.length;
  const avgLon = withCoords.reduce((s, r) => s + Number(r.geo_lon), 0) / withCoords.length;

  // markers=lat,lon,ol-marker
  const markers = withCoords
    .map(r => `${r.geo_lat},${r.geo_lon},ol-marker`)
    .join("|");

  return `https://staticmap.openstreetmap.de/staticmap.php?center=${avgLat.toFixed(4)},${avgLon.toFixed(4)}&zoom=${zoom}&size=${size}&markers=${encodeURIComponent(markers)}`;
}

function buildStaticMapForRace(race, opts = {}) {
  const size = opts.size || "800x360";
  const zoom = opts.zoom || 8;
  if (!race?.geo_lat || !race?.geo_lon) {
    return `https://staticmap.openstreetmap.de/staticmap.php?center=48.5,12&zoom=4&size=${size}`;
  }
  return `https://staticmap.openstreetmap.de/staticmap.php?center=${race.geo_lat},${race.geo_lon}&zoom=${zoom}&size=${size}&markers=${race.geo_lat},${race.geo_lon},ol-marker`;
}

/** =========================
 * API helpers
 * ========================= */
async function fetchRaces({ country, city, distance, q, page = 1, limit = 24, fromDate, toDate, type }) {
  const params = new URLSearchParams();
  if (country) params.set("country", country);
  if (city) params.set("city", city);
  if (q) params.set("q", q);
  if (distance) params.set("distance", String(distance));
  if (fromDate) params.set("fromDate", fromDate);
  if (toDate) params.set("toDate", toDate);
  if (type) params.set("type", type); // se il backend la ignora, filtriamo client-side
  params.set("page", page);
  params.set("limit", limit);

  const r = await fetch(`${API_URL}/api/races?${params.toString()}`);
  if (!r.ok) throw new Error("Errore API");
  const json = await r.json(); // {items,total,page,limit}
  // fallback: filtro client-side su type, se fornito
  if (type) {
    const t = type.toLowerCase();
    json.items = (json.items || []).filter(it =>
      (it.race_type || "").toLowerCase().includes(t)
      || (it.race_name || "").toLowerCase().includes(t)
    );
    json.total = json.items.length;
  }
  return json;
}

async function fetchRaceByUrl(raceUrl) {
  const r = await fetch(`${API_URL}/api/race?url=${encodeURIComponent(raceUrl)}`);
  if (!r.ok) throw new Error("Errore API");
  return r.json();
}

/** =========================
 * UI Primitives
 * ========================= */
function Burger({ onClick, className }) {
  return (
    <button className={classNames("burger", className)} aria-label="Menu" onClick={onClick}>
      <span /><span /><span />
    </button>
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

function TopBar({ onNav, view, setMenuOpen }) {
  return (
    <div className="topbar">
      <div className="container topbar__inner">
        <div className="topbar__left">
          <Burger className="burger--inline" onClick={() => setMenuOpen(true)} />
          <div className="brand" onClick={() => onNav("home")} style={{ cursor: "pointer" }}>Runshift</div>
        </div>
        <nav className="topbar__nav">
          <button className={classNames("navlink", view === "home" && "active")} onClick={() => onNav("home")}>Home</button>
          <button className={classNames("navlink", view === "search" && "active")} onClick={() => onNav("search")}>Cerca gare</button>
          <button className={classNames("navlink", view === "build" && "active")} onClick={() => onNav("build")}>Build plan</button>
        </nav>
      </div>
    </div>
  );
}

/** =========================
 * HERO (blur bg)
 * ========================= */
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

/** =========================
 * Components: Card / Details
 * ========================= */
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
            {race.date ? " • " + safeDateToLocale(race.date) : ""}
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
          <div className="race-details__map">
            <img
              src={buildStaticMapForRace(race, { size: "720x360", zoom: 8 })}
              alt="Mappa gara"
              className="map-img"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/** =========================
 * Filters (coerenti + mappa)
 * ========================= */
function FiltersBar({ value, onChange, showPast, setShowPast, onApply }) {
  const [local, setLocal] = useState(value);
  useEffect(() => { setLocal(value); }, [value]);

  return (
    <div className="filters-toolbar">
      <div className="filters-toolbar__grid">
        <input className="input" placeholder="Paese" value={local.country} onChange={e => setLocal(s => ({ ...s, country: e.target.value }))} />
        <input className="input" placeholder="Tipo gara (es. marathon, trail)" value={local.type} onChange={e => setLocal(s => ({ ...s, type: e.target.value }))} />
        <input className="input" placeholder="Distanza (es. 42)" value={local.distance} onChange={e => setLocal(s => ({ ...s, distance: e.target.value }))} />
        <input className="input" placeholder="Città" value={local.city} onChange={e => setLocal(s => ({ ...s, city: e.target.value }))} />
        <div className="filters-toolbar__dates">
          <label>Dal</label>
          <input type="date" className="input" value={local.fromDate || ""} onChange={e => setLocal(s => ({ ...s, fromDate: e.target.value }))} />
        </div>
        <div className="filters-toolbar__dates">
          <label>Al</label>
          <input type="date" className="input" value={local.toDate || ""} onChange={e => setLocal(s => ({ ...s, toDate: e.target.value }))} />
        </div>
        <input className="input" placeholder="Cerca (nome/luogo)" value={local.q} onChange={e => setLocal(s => ({ ...s, q: e.target.value }))} />
        <div className="filters-toolbar__switch">
          <label className="switch">
            <input type="checkbox" checked={showPast} onChange={e => setShowPast(e.target.checked)} />
            <span className="slider" />
          </label>
          <span className="switch__label">Includi gare passate</span>
        </div>
      </div>
      <div className="filters-toolbar__actions">
        <button
          className="btn btn-outline"
          onClick={() => {
            const reset = { country: "", city: "", distance: "", q: "", type: "", fromDate: "", toDate: "" };
            setLocal(reset);
            onChange(reset);
          }}
        >
          Reset
        </button>
        <button className="btn btn-primary" onClick={() => onChange(local)}>Applica</button>
      </div>
    </div>
  );
}

/** =========================
 * Search Page (con mappa)
 * ========================= */
function SearchPage({ onDetails, onSelect, initialFilters }) {
  const [showPast, setShowPast] = useState(false);
  const [filters, setFilters] = useState(initialFilters || { country: "", city: "", distance: "", q: "", type: "", fromDate: "", toDate: "" });
  const [page, setPage] = useState(1);
  const [limit] = useState(24);
  const [data, setData] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(false);
  const [showMap, setShowMap] = useState(true);

  const totalPages = useMemo(() => Math.max(1, Math.ceil((data?.total || 0) / limit)), [data, limit]);
  const effectiveFrom = showPast ? (filters.fromDate || "") : (filters.fromDate || todayISO());

  useEffect(() => {
    let ignore = false;
    async function run() {
      setLoading(true);
      try {
        const res = await fetchRaces({
          ...filters,
          fromDate: effectiveFrom || undefined,
          page, limit
        });
        if (!ignore) setData(res);
      } catch (e) {
        console.error(e);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    run();
    return () => { ignore = true; };
  }, [filters, page, limit, showPast]);

  const mapUrl = useMemo(() => buildStaticMapURL(data.items || [], { size: "720x420", zoom: 4 }), [data.items]);

  return (
    <div className="section">
      <div className="container">
        <h1 className="section-title" style={{ marginTop: 6 }}>Cerca gare</h1>
        <FiltersBar
          value={filters}
          onChange={(v) => { setPage(1); setFilters(v); }}
          showPast={showPast}
          setShowPast={setShowPast}
        />

        <div className="search-layout">
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
                    <button className="btn btn-outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>←</button>
                    <div className="pagination__info">{page} / {totalPages}</div>
                    <button className="btn btn-outline" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>→</button>
                  </div>
                )}
              </>
            )}
          </div>

          <aside className="search-map">
            <div className="search-map__head">
              <div className="kicker">Mappa</div>
              <label className="switch small">
                <input type="checkbox" checked={showMap} onChange={e => setShowMap(e.target.checked)} />
                <span className="slider" />
              </label>
            </div>
            {showMap && (
              <img src={mapUrl} alt="Mappa risultati" className="map-img" />
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

/** =========================
 * Build Page (target + 3 slot suggeriti)
 * ========================= */
function BuildPage({ targetRace, onBackToSearch }) {
  const [slots, setSlots] = useState([null, null, null]);
  const [suggestions, setSuggestions] = useState([[], [], []]);
  const [loading, setLoading] = useState(false);

  // euristica simple: in base alla distanza target suggeriamo 3 build-up
  function slotDistanceTargets(target) {
    const ds = parseDistanceSet(target?.distance_km || "");
    const max = ds[ds.length - 1] || 21; // default half
    if (max >= 42) return [21.1, 10, 5];
    if (max >= 21) return [10, 5, 5];
    if (max >= 10) return [5, 5, 3];
    return [5, 3, 3];
  }

  useEffect(() => {
    let ignore = false;
    async function run() {
      if (!targetRace) return;
      setLoading(true);
      try {
        const baseDate = targetRace.date ? new Date(targetRace.date) : null;
        const slotDistances = slotDistanceTargets(targetRace);
        const out = [[], [], []];

        const ranges = [
          { weeks: 10 },
          { weeks: 5 },
          { weeks: 3 },
        ];

        for (let i = 0; i < ranges.length; i++) {
          const params = new URLSearchParams();
          params.set("limit", "12");
          params.set("distance", String(slotDistances[i]));
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
    <div className="section">
      <div className="container">
        <h1 className="section-title" style={{ marginTop: 6 }}>Build your plan</h1>
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
              {[0,1,2].map((idx) => {
                const slotRace = slots[idx];
                const sug = suggestions[idx] || [];
                return (
                  <div className="build-slot" key={idx}>
                    <div className="slot-head">Slot {idx+1}</div>
                    {!slotRace ? (
                      <>
                        {loading && <p>Caricamento suggerimenti…</p>}
                        <div className="cards-grid">
                          {sug.slice(0, 6).map((race) => (
                            <RaceCard
                              key={`${idx}-${race.race_url}`}
                              race={race}
                              onDetails={() => window.open(race.race_url, "_blank")}
                              onSelect={(r) => setSlots(s => { const c=[...s]; c[idx]=r; return c; })}
                            />
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="selected-slot">
                        <p className="kicker">Scelto</p>
                        <div className="selected-slot__card">
                          <RaceCard race={slotRace} onDetails={() => window.open(slotRace.race_url, "_blank")} onSelect={() => {}} />
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button className="btn btn-outline" onClick={() => setSlots(s => { const c=[...s]; c[idx]=null; return c; })}>Sostituisci</button>
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

/** =========================
 * Home (hero blur + anteprima gare)
 * ========================= */
function Home({ onPrimary, onSecondary, onDetails }) {
  const [preview, setPreview] = useState([]);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const res = await fetchRaces({ page: 1, limit: 6, fromDate: todayISO() });
        if (!ignore) setPreview(res.items || []);
      } catch (e) { console.error(e); }
    })();
    return () => { ignore = true; };
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
          <div style={{ display: "flex", justifyContent: "center", marginTop: 18 }}>
            <button className="btn btn-primary" onClick={onPrimary}>Vedi tutte</button>
          </div>
        </div>
      </section>
    </>
  );
}

/** =========================
 * App root
 * ========================= */
export default function App() {
  const [view, setView] = useState("home"); // 'home' | 'search' | 'details' | 'build'
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedRace, setSelectedRace] = useState(null);
  const [targetRace, setTargetRace] = useState(null);

  const navigate = (v) => { setView(v); window.scrollTo(0, 0); };

  const handleDetails = async (race) => {
    try {
      const full = await fetchRaceByUrl(race.race_url);
      setSelectedRace(full);
      setView("details");
    } catch (e) {
      console.error(e);
      setSelectedRace(race);
      setView("details");
    }
    window.scrollTo(0, 0);
  };

  const handleSelect = (race) => {
    setTargetRace(race);
    setView("build");
    window.scrollTo(0, 0);
  };

  return (
    <div>
      <TopBar onNav={navigate} view={view} setMenuOpen={setMenuOpen} />
      <Offcanvas open={menuOpen} onClose={() => setMenuOpen(false)} onNavigate={navigate} />

      {view === "home" && (
        <Home onPrimary={() => navigate("search")} onSecondary={() => navigate("build")} onDetails={handleDetails} />
      )}

      {view === "search" && (
        <SearchPage onDetails={handleDetails} onSelect={handleSelect} initialFilters={{ country: "", city: "", distance: "", q: "", type: "" }} />
      )}

      {view === "details" && (
        <RaceDetails race={selectedRace} onBack={() => navigate("search")} />
      )}

      {view === "build" && (
        <BuildPage targetRace={targetRace} onBackToSearch={() => navigate("search")} />
      )}
    </div>
  );
}

