import { useEffect, useMemo, useState } from "react";
import "./App.css";

// === Config API ===
const API_URL = "https://backend-db-corse-v2.onrender.com";

// === API helpers ===
async function fetchRaces({ country, city, distance, q, page = 1, limit = 24, fromDate, toDate }) {
  const params = new URLSearchParams();
  if (country) params.set("country", country);
  if (city) params.set("city", city);
  if (q) params.set("q", q);
  if (distance) params.set("distance", String(distance)); // "contiene" lato backend (ILIKE %x%)
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

// === UI primitives ===
function Burger({ onClick }) {
  return (
    <button className="burger" aria-label="Menu" onClick={onClick}>
      <span />
      <span />
      <span />
    </button>
  );
}

function Offcanvas({ open, onClose, onNavigate }) {
  return (
    <div className={`offcanvas ${open ? "open" : ""}`}>
      <div className="offcanvas__header">
        <div className="brand">Runshift</div>
        <button className="btn btn-outline" onClick={onClose}>Chiudi</button>
      </div>
      <nav className="offcanvas__nav">
        <button className="link-like" onClick={() => { onNavigate("home"); onClose(); }}>Home</button>
        <button className="link-like" onClick={() => { onNavigate("search"); onClose(); }}>Cerca gare</button>
        <button className="link-like" onClick={() => { onNavigate("build"); onClose(); }}>Build your plan</button>
      </nav>
      <div className="offcanvas__footer">© Runshift</div>
    </div>
  );
}

// === HERO Home ===
function Hero({ onPrimary, onSecondary }) {
  return (
    <section
      className="hero"
      style={{
        // puoi sostituire l'immagine sotto con la tua in public/images/hero-runner-sunset.jpg
        backgroundImage: `url(/public/runner-sunset.jpg)`,
      }}
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

// === CARD GARA ===
function RaceCard({ race, onDetails, onSelect }) {
  const img = race.image_thumb_url || race.image_url || "/images/placeholder.jpg";
  const dateStr = race.date ? new Date(race.date).toLocaleDateString() : "";

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
    return (
      <div className="container" style={{ padding: 24 }}>
        <p>Caricamento…</p>
      </div>
    );
  }
  const img = race.image_url || race.image_thumb_url || "/images/placeholder.jpg";
  const dateStr = race.date ? new Date(race.date).toLocaleDateString() : "";
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

// === PAGINA RICERCA ===
function SearchPage({ onDetails, onSelect, initialFilters }) {
  const [filters, setFilters] = useState(initialFilters || { country: "", city: "", distance: "", q: "" });
  const [page, setPage] = useState(1);
  const [limit] = useState(24);
  const [data, setData] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(false);

  const totalPages = useMemo(() => Math.max(1, Math.ceil((data?.total || 0) / limit)), [data, limit]);

  useEffect(() => {
    let ignore = false;
    async function run() {
      setLoading(true);
      try {
        const res = await fetchRaces({ ...filters, page, limit });
        if (!ignore) setData(res);
      } catch (e) {
        console.error(e);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    run();
    return () => { ignore = true; };
  }, [filters, page, limit]);

  return (
    <>
      {/* su pagine non-home mostriamo una topbar semplice */}
      <div className="topbar">
        <div className="container topbar__inner">
          <div className="brand">Runshift</div>
          <div className="topbar__right" />
        </div>
      </div>

      <div className="container">
        <h1 style={{ marginTop: 16 }}>Cerca gare</h1>
        <div className="filters-grid">
          <input className="input" placeholder="Paese" value={filters.country} onChange={e => { setPage(1); setFilters(f => ({ ...f, country: e.target.value })); }} />
          <input className="input" placeholder="Città" value={filters.city} onChange={e => { setPage(1); setFilters(f => ({ ...f, city: e.target.value })); }} />
          <input className="input" placeholder="Distanza (es. 42)" value={filters.distance} onChange={e => { setPage(1); setFilters(f => ({ ...f, distance: e.target.value })); }} />
          <input className="input" placeholder="Cerca (nome/luogo)" value={filters.q} onChange={e => { setPage(1); setFilters(f => ({ ...f, q: e.target.value })); }} />
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
  const [slots, setSlots] = useState([null, null, null]); // 3 slot di build-up
  const [suggestions, setSuggestions] = useState([[], [], []]); // suggerimenti per slot
  const [loading, setLoading] = useState(false);

  // genera suggerimenti base quando cambia target
  useEffect(() => {
    let ignore = false;
    async function run() {
      if (!targetRace) return;
      setLoading(true);
      try {
        const baseDate = targetRace.date ? new Date(targetRace.date) : null;
        const distForSuggest = (targetRace.distance_km || "").split("/")[0]?.trim() || ""; // prendi la prima distanza
        const out = [[], [], []];

        // euristica semplice sulle date (se la data manca, facciamo solo per distanza)
        const ranges = [
          { label: "8-12 settimane prima", weeks: 10 },
          { label: "4-6 settimane prima", weeks: 5 },
          { label: "2-3 settimane prima", weeks: 3 },
        ];

        for (let i = 0; i < ranges.length; i++) {
          const params = new URLSearchParams();
          if (distForSuggest) params.set("distance", distForSuggest);
          params.set("limit", "12");
          // Non imponiamo data se non abbiamo la data target
          if (baseDate) {
            const dt = new Date(baseDate);
            dt.setDate(dt.getDate() - (ranges[i].weeks * 7));
            // finestra +/- 14 giorni
            const fromDate = new Date(dt); fromDate.setDate(fromDate.getDate() - 14);
            const toDate = new Date(dt); toDate.setDate(toDate.getDate() + 14);
            params.set("fromDate", fromDate.toISOString().slice(0, 10));
            params.set("toDate", toDate.toISOString().slice(0, 10));
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
      <div className="topbar">
        <div className="container topbar__inner">
          <div className="brand">Runshift</div>
          <div className="topbar__right" />
        </div>
      </div>

      <div className="container" style={{ marginTop: 16 }}>
        <h1>Build your plan</h1>
        {!targetRace ? (
          <>
            <p>Seleziona prima una gara target nella pagina di ricerca per iniziare il tuo percorso.</p>
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
                  {targetRace.date ? " • " + new Date(targetRace.date).toLocaleDateString() : ""}
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
    </>
  );
}

// === APP ROOT ===
export default function App() {
  const [view, setView] = useState("home"); // 'home' | 'search' | 'details' | 'build'
  const [menuOpen, setMenuOpen] = useState(false);

  const [selectedRace, setSelectedRace] = useState(null); // per dettagli
  const [targetRace, setTargetRace] = useState(null);     // per build plan

  // Navigazione centrale
  const navigate = (v) => { setView(v); window.scrollTo(0, 0); };

  const handleDetails = async (race) => {
    try {
      // prendi i dettagli completi dalla nostra API (per coerenza)
      const full = await fetchRaceByUrl(race.race_url);
      setSelectedRace(full);
      setView("details");
      window.scrollTo(0, 0);
    } catch (e) {
      console.error(e);
      // fallback: usa race già in card
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
      {/* Home senza topbar: solo burger */}
      {view === "home" && (
        <>
          <div className="hero-top">
            <Burger onClick={() => setMenuOpen(true)} />
          </div>
          <Offcanvas open={menuOpen} onClose={() => setMenuOpen(false)} onNavigate={navigate} />
          <Hero onPrimary={() => navigate("search")} onSecondary={() => navigate("build")} />
          <section className="container" style={{ margin: "32px auto 48px" }}>
            <h2 className="section-title">Perché Runshift?</h2>
            <div className="features">
              <div className="feature">
                <div className="feature__title">Motivazione</div>
                <div className="feature__body">Trova eventi iconici e lasciati ispirare da luoghi epici.</div>
              </div>
              <div className="feature">
                <div className="feature__title">Pianificazione</div>
                <div className="feature__body">Costruisci un calendario con gare di avvicinamento smart.</div>
              </div>
              <div className="feature">
                <div className="feature__title">Semplicità</div>
                <div className="feature__body">Filtri chiari, card con immagini e dettagli essenziali.</div>
              </div>
            </div>
          </section>
        </>
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

