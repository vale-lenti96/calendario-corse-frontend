import React, { useState, useEffect } from "react";

const fmtDate = (iso) => new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
const weeksBetween = (aISO, bISO) => Math.round((new Date(bISO) - new Date(aISO)) / (1000 * 60 * 60 * 24 * 7));
const clamp = (n, a, b) => Math.max(a, Math.min(n, b));
function computeGoalScore({ inWindow, coursePB, climate, logistics, sourceQuality }) { return Math.round((inWindow * 0.30) + (coursePB * 0.25) + (climate * 0.15) + (logistics * 0.20) + (sourceQuality * 0.10)); }
function computeFitScore({ timing, coursePB, climate, logistics, sourceQuality }) { return Math.round((timing * 0.35) + (coursePB * 0.25) + (climate * 0.15) + (logistics * 0.15) + (sourceQuality * 0.10)); }
function idealOffset(goalKm, testKm) { if (goalKm >= 40 && testKm >= 20 && testKm < 30) return 7; if (goalKm >= 40 && testKm >= 9 && testKm <= 12) return 10; if (goalKm >= 20 && testKm >= 9 && testKm <= 12) return 4; if (goalKm >= 9 && goalKm <= 12 && testKm >= 4 && testKm <= 6) return 3; if (goalKm >= 4 && goalKm <= 6 && testKm >= 3 && testKm <= 5) return 2; return 4; }
function shiftWeeks(dateISO, delta) { const d = new Date(dateISO); d.setDate(d.getDate() + delta * 7); return d.toISOString().slice(0, 10); }

const VerifiedSeed = [
  { race_name: "TCS London Marathon", race_url: "https://www.londonmarathonevents.co.uk/london-marathon", date: "2026-04-26", location: "London, UK", country: "UK", distance_km: 42.195, course: { surface: "road", elevation_gain_m: 50, certified: true, typical_weather: "8–13°C" }, logistics: { nearest_airport: "LHR", registration_status: "ballot/charity" }, sources: ["https://www.londonmarathonevents.co.uk/london-marathon"] },
  { race_name: "Schneider Electric Marathon de Paris", race_url: "https://www.schneiderelectricparismarathon.com/", date: "2026-04-12", location: "Paris, FR", country: "FR", distance_km: 42.195, course: { surface: "road", elevation_gain_m: 80, certified: true, typical_weather: "8–12°C" }, logistics: { nearest_airport: "CDG", registration_status: "open" }, sources: ["https://www.schneiderelectricparismarathon.com/"] },
  { race_name: "NN Marathon Rotterdam", race_url: "https://nnmarathonrotterdam.nl/en/", date: "2026-04-12", location: "Rotterdam, NL", country: "NL", distance_km: 42.195, course: { surface: "road", elevation_gain_m: 40, certified: true, typical_weather: "7–12°C" }, logistics: { nearest_airport: "AMS", registration_status: "tba/open" }, sources: ["https://nnmarathonrotterdam.nl/en/"] },
  { race_name: "Vienna City Marathon", race_url: "https://www.vienna-marathon.com/?lang=en", date: "2026-04-19", location: "Vienna, AT", country: "AT", distance_km: 42.195, course: { surface: "road", elevation_gain_m: 60, certified: true, typical_weather: "7–11°C" }, logistics: { nearest_airport: "VIE", registration_status: "open" }, sources: ["https://www.vienna-marathon.com/?lang=en"] },
];

const countriesByRegion = {
  Europe: ["AT","BE","CH","CZ","DE","DK","ES","FI","FR","GR","HU","IE","IT","LU","NL","NO","PL","PT","SE","UK"]
};

const BACKEND = (typeof window !== "undefined" && window.__BACKEND__) || import.meta.env.VITE_BACKEND_URL || process.env.BACKEND_URL || "";
async function webSearchRaces(prefs) {
  try {
    const res = await fetch(`${BACKEND}/api/search-races`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(prefs) });
    if (res.ok) return await res.json();
  } catch {}
  const from = new Date(prefs.time_window.from); const to = new Date(prefs.time_window.to);
  return VerifiedSeed.filter((r) => {
    const d = new Date(r.date);
    const regionOK = prefs.region ? prefs.region === "Europe" : true;
    const countryOK = prefs.country ? r.country === prefs.country : true;
    const surfaceOK = prefs.surface ? (r.course?.surface ?? "road") === prefs.surface : true;
    return d >= from && d <= to && regionOK && countryOK && surfaceOK;
  });
}

const SectionTitle = ({ children }) => (
  <h2 className="text-lg md:text-xl font-semibold text-[var(--text)] flex items-center gap-2">
    <span className="w-1.5 h-5 rounded-full bg-gradient-to-b from-[var(--forest)] to-[var(--forest-2)] shadow" />
    {children}
  </h2>
);

const Badge = ({ children, tone = "leaf" }) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--${tone})]/20 text-[var(--text)] border border-[var(--${tone})]/30`}>{children}</span>
);

const Button = ({ children, onClick, variant = "primary", className = "", type = "button", ariaLabel }) => {
  const base = "px-3 py-2 rounded-xl font-medium transition shadow hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50";
  const variants = { primary: "bg-gradient-to-r from-[var(--forest-2)] to-[var(--leaf)] text-white hover:opacity-90", ghost: "bg-transparent text-[var(--text)] hover:bg-[var(--leaf)]/15 border border-[var(--muted)]/20", subtle: "bg-[var(--panel)] text-[var(--text)] hover:bg-[var(--leaf)]/10 border border-[var(--muted)]/20", danger: "bg-[var(--danger)] text-[var(--bg)] hover:opacity-90", icon: "p-2 rounded-full bg-[var(--panel)] border border-[var(--muted)]/25 hover:bg-[var(--leaf)]/15 text-[var(--text)]" };
  return <button aria-label={ariaLabel} type={type} onClick={onClick} className={`${base} ${variants[variant]} ${className}`}>{children}</button>;
};

const Card = ({ children, className = "" }) => (<div className={`rounded-2xl bg-[var(--panel)]/90 border border-[var(--muted)]/15 shadow-md backdrop-blur-sm ${className}`}>{children}</div>);

const Field = ({ label, children }) => (
  <label className="flex flex-col gap-1">
    <span className="text-[var(--text)]/80 text-xs uppercase tracking-wider">{label}</span>
    {children}
  </label>
);

const ProgressBar = ({ value }) => (
  <div className="w-full h-2 bg-[var(--pine)]/30 rounded-full overflow-hidden">
    <div className="h-full bg-gradient-to-r from-[var(--forest-2)] to-[var(--leaf)] transition-all" style={{ width: `${clamp(value, 0, 100)}%` }} />
  </div>
);

const IconChevronUp = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><polyline points="18 15 12 9 6 15" /></svg>);
const IconChevronDown = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><polyline points="6 9 12 15 18 9" /></svg>);
const IconSwap = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><polyline points="16 3 21 3 21 8" /><line x1="4" y1="20" x2="21" y2="3" /><polyline points="8 21 3 21 3 16" /></svg>);
const IconLabelButton = ({ onClick, icon, label }) => (<Button onClick={onClick} variant="icon" className="flex flex-col items-center w-14 h-14 !rounded-xl">{icon}<span className="text-[10px] mt-1 text-[var(--muted)]">{label}</span></Button>);

function IntroPage({ onStart }) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <Card className="p-6 md:p-8">
        <div className="flex items-start gap-3 mb-4"><div className="w-10 h-10 rounded-2xl bg-[var(--leaf)]/25 grid place-items-center border border-[var(--leaf)]/30">🍂</div><div><h1 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-[var(--forest)] to-[var(--forest-2)] bg-clip-text text-transparent">Benvenuto in Calendario Corse</h1><p className="text-[var(--muted)] mt-1">Pianifica le tue gare: scegli una gara obiettivo, genera il build-up ideale, modifica le date e salva il piano.</p></div></div>
        <ol className="grid md:grid-cols-3 gap-4 mt-4">
          <li><Card className="p-4 h-full"><h3 className="font-semibold mb-1">1) Trova la gara obiettivo</h3><p className="text-sm text-[var(--muted)]">Seleziona distanza e finestra, Regione e Paese o usa la tua posizione, quindi Cerca.</p></Card></li>
          <li><Card className="p-4 h-full"><h3 className="font-semibold mb-1">2) Genera il build-up</h3><p className="text-sm text-[var(--muted)]">Dopo la selezione, premi Genera build-up per creare test-race nelle finestre ideali.</p></Card></li>
          <li><Card className="p-4 h-full"><h3 className="font-semibold mb-1">3) Personalizza e salva</h3><p className="text-sm text-[var(--muted)]">Sposta o sostituisci le prove, modifica le date ed esporta quando sei soddisfatto.</p></Card></li>
        </ol>
        <div className="mt-6 flex items-center justify-between"><label className="inline-flex items-center gap-2 text-sm text-[var(--muted)]"><input id="hideIntro" type="checkbox" className="accent-[var(--forest-2)]" onChange={(e)=>localStorage.setItem("cc_hide_intro", e.target.checked ? "1" : "0")} />Non mostrare più questa pagina</label><Button onClick={onStart}>Inizia</Button></div>
      </Card>
    </div>
  );
}

export default function RacePlannerApp() {
  const [dark, setDark] = useState(true);
  const [showIntro, setShowIntro] = useState(() => { if (typeof window === "undefined") return true; return localStorage.getItem("cc_hide_intro") === "1" ? false : true; });
  const [goalPreferences, setGoalPreferences] = useState({ distance_km: 42.195, time_window: { from: "2026-04-01", to: "2026-04-30" }, region: "Europe", country: "", surface: "road", certified_only: true, home_airport: "MXP", use_geolocate: false, city_query: "", radius_km: "" });
  const [homeCoords, setHomeCoords] = useState({ lat: null, lon: null });
  const [goalCandidates, setGoalCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedGoals, setSelectedGoals] = useState([]);
  const [buildUp, setBuildUp] = useState({});

  const runGoalSearch = async () => {
    setLoading(true); setError("");
    try {
      const prefs = { ...goalPreferences };
      if (goalPreferences.use_geolocate && homeCoords.lat && homeCoords.lon) {
        prefs.home_lat = homeCoords.lat; prefs.home_lon = homeCoords.lon;
      }
      const results = await webSearchRaces(prefs);
      const from = new Date(prefs.time_window.from); const to = new Date(prefs.time_window.to);
      const scored = results.map((r) => ({
        ...r,
        goal_score: computeGoalScore({ inWindow: 95, coursePB: clamp(100 - (r.course?.elevation_gain_m ?? 120), 0, 100), climate: 85, logistics: 80, sourceQuality: 90 })
      })).filter((r) => new Date(r.date) >= from && new Date(r.date) <= to && (prefs.country ? r.country === prefs.country : true));
      if (prefs.home_lat && prefs.home_lon && prefs.radius_km) {
        scored.forEach((r) => {
          if (r.geo && r.geo.length === 2) {
            const dist = Math.round(((Math.acos(Math.sin(prefs.home_lat*Math.PI/180)*Math.sin(r.geo[0]*Math.PI/180)+Math.cos(prefs.home_lat*Math.PI/180)*Math.cos(r.geo[0]*Math.PI/180)*Math.cos((r.geo[1]-prefs.home_lon)*Math.PI/180))*6371)));
            r.distance_from_home = dist;
          }
        });
      }
      setGoalCandidates(scored.sort((a, b) => (b.goal_score ?? 0) - (a.goal_score ?? 0)));
    } catch (e) {
      setError("Errore durante la ricerca. Riprova.");
    } finally {
      setLoading(false);
    }
  };

  const selectGoal = (c) => { const g = { name: c.race_name, date: c.date, distance_km: c.distance_km, location: c.location, priority: "A", target_pace_s_per_km: 255, sources: c.sources }; setSelectedGoals((prev) => (prev.find((x) => x.name === g.name) ? prev : [...prev, g])); };
  const removeGoal = (goalName) => { setSelectedGoals((prev) => prev.filter((g) => g.name !== goalName)); setBuildUp((prev) => { const cp = { ...prev }; delete cp[goalName]; return cp; }); };

  const fetchBuildUpSuggestions = async (goal) => {
    const items = [
      { goal_ref: goal.name, race_name: "[MOCK] Mossy Half Marathon", race_url: "https://example.com/mossyhm", date: shiftWeeks(goal.date, -7), distance_km: 21.097, course: { surface: "road", elevation_gain_m: 70, certified: true, typical_weather: "9–13°C" }, logistics: { country: "EU", nearest_airport: "FCO", estimated_fee_eur: 50, registration_status: "open" }, rationale: "Mezza a 7 settimane: ottimo test specifico endurance.", sources: ["https://example.com/mossyhm"] },
      { goal_ref: goal.name, race_name: "[MOCK] Bronze 10K", race_url: "https://example.com/bronze10k", date: shiftWeeks(goal.date, -10), distance_km: 10, course: { surface: "road", elevation_gain_m: 40, certified: true, typical_weather: "10–14°C" }, logistics: { country: "EU", nearest_airport: "MXP", estimated_fee_eur: 25, registration_status: "open" }, rationale: "10K a 8–12 settimane: velocità di soglia.", sources: ["https://example.com/bronze10k"] },
      { goal_ref: goal.name, race_name: "[MOCK] Forest Progression 28K (allenamento cronometrato)", race_url: "https://example.com/forest28k", date: shiftWeeks(goal.date, -5), distance_km: 28, course: { surface: "road", elevation_gain_m: 150, certified: false, typical_weather: "9–12°C" }, logistics: { country: "EU", nearest_airport: "LIN", estimated_fee_eur: 20, registration_status: "club" }, rationale: "28K controllato a 4–6 settimane: specific endurance senza svuotarsi.", sources: ["https://example.com/forest28k"] },
    ].map((r) => ({ ...r, weeks_before_goal: -weeksBetween(r.date, goal.date), fit_score: computeFitScore({ timing: clamp(100 - Math.abs(idealOffset(goal.distance_km, r.distance_km) - (-weeksBetween(r.date, goal.date))) * 12, 0, 100), coursePB: clamp(100 - (r.course.elevation_gain_m ?? 120), 0, 100), climate: 80, logistics: 80, sourceQuality: 80 }) }));
    return items;
  };

  const generateBuildUp = async (goal) => { const items = await fetchBuildUpSuggestions(goal); setBuildUp((prev) => ({ ...prev, [goal.name]: items })); };
  const updateBuildItemDate = (goalName, idx, newDate) => { setBuildUp((prev) => { const arr = [...(prev[goalName] || [])]; const goal = selectedGoals.find((g) => g.name === goalName); arr[idx] = { ...arr[idx], date: newDate, weeks_before_goal: -weeksBetween(newDate, goal.date), fit_score: computeFitScore({ timing: clamp(100 - Math.abs(idealOffset(goal.distance_km, arr[idx].distance_km) - (-weeksBetween(newDate, goal.date))) * 12, 0, 100), coursePB: clamp(100 - (arr[idx].course?.elevation_gain_m ?? 120), 0, 100), climate: 80, logistics: 80, sourceQuality: 80 }) }; return { ...prev, [goalName]: arr }; }); };
  const moveBuildItem = (goalName, idx, dir) => { setBuildUp((prev) => { const arr = [...(prev[goalName] || [])]; const j = idx + dir; if (j < 0 || j >= arr.length) return prev; [arr[idx], arr[j]] = [arr[j], arr[idx]]; return { ...prev, [goalName]: arr }; }); };
  const replaceBuildItem = (goalName, idx) => { setBuildUp((prev) => { const arr = [...(prev[goalName] || [])]; arr[idx] = { ...arr[idx], race_name: arr[idx].race_name.replace("[MOCK]", "[MOCK-ALT]") }; return { ...prev, [goalName]: arr }; }); };

  useEffect(() => { /* auto-run disabled for clarity */ }, []);

  const detectLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      setHomeCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
      setGoalPreferences((p) => ({ ...p, use_geolocate: true }));
    });
  };

  return (
    <div className={`min-h-screen w-full ${dark ? "dark" : "light"}`}>
      <style>{`
        .dark { --bg:#0f1210; --panel:#171b18; --accent:#b07f2e; --accent-2:#8c5a2b; --leaf:#3b6a3f; --pine:#224034; --forest:#2f5d3a; --forest-2:#3f7a4d; --text:#f3f3f2; --muted:#c2b6a6; --danger:#b5483a; background: var(--bg); color: var(--text); }
        .light { --bg:#f2f5f1; --panel:#ffffff; --accent:#b07f2e; --accent-2:#8c5a2b; --leaf:#2f6a3a; --pine:#2a4a3a; --forest:#2f5d3a; --forest-2:#3f7a4d; --text:#1b201b; --muted:#425148; --danger:#9b3f34; background: var(--bg); color: var(--text); }
        input, select, button { color: var(--text); }
        input::placeholder, textarea::placeholder { color: var(--muted); }
      `}</style>

      <header className="sticky top-0 z-10 backdrop-blur supports-[backdrop-filter]:bg-[var(--bg)]/70 border-b border-[var(--muted)]/20">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-xl bg-[var(--leaf)]/30 grid place-items-center border border-[var(--leaf)]/40">🍂</div><div><h1 className="text-xl md:text-2xl font-extrabold bg-gradient-to-r from-[var(--forest)] to-[var(--forest-2)] bg-clip-text text-transparent">Calendario Corse</h1><p className="text-[var(--muted)] text-xs md:text-sm">Goal Finder • Build-Up Planner • Dark Autumn</p></div></div>
          <div className="flex items-center gap-2"><Button variant="ghost" onClick={() => setDark((d) => !d)}>{dark ? "Tema chiaro" : "Tema scuro"}</Button><Button variant="subtle" onClick={() => setShowIntro(true)}>Guida</Button><Button variant="subtle" onClick={() => alert("Esporta JSON disponibile nella versione canvas")}>Esporta JSON</Button></div>
        </div>
      </header>

      {showIntro ? (
        <IntroPage onStart={() => setShowIntro(false)} />
      ) : (
        <main className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          <section className="lg:col-span-4">
            <Card className="p-4 md:p-5">
              <div className="flex items-center justify-between mb-3"><SectionTitle>Goal Finder</SectionTitle><Badge>Selettore gare obiettivo</Badge></div>
              <form className="grid grid-cols-2 gap-3">
                <Field label="Distanza target">
                  <select className="bg-transparent border border-[var(--muted)]/30 rounded-xl px-3 py-2" value={goalPreferences.distance_km} onChange={(e) => setGoalPreferences({ ...goalPreferences, distance_km: parseFloat(e.target.value) })}>
                    <option className="bg-[var(--panel)]" value={5}>5K</option>
                    <option className="bg-[var(--panel)]" value={10}>10K</option>
                    <option className="bg-[var(--panel)]" value={21.097}>Half (21.097K)</option>
                    <option className="bg-[var(--panel)]" value={42.195}>Marathon (42.195K)</option>
                  </select>
                </Field>
                <Field label="Finestra (dal)"><input type="date" className="bg-transparent border border-[var(--muted)]/30 rounded-xl px-3 py-2" value={goalPreferences.time_window.from} onChange={(e) => setGoalPreferences({ ...goalPreferences, time_window: { ...goalPreferences.time_window, from: e.target.value } })} /></Field>
                <Field label="Finestra (al)"><input type="date" className="bg-transparent border border-[var(--muted)]/30 rounded-xl px-3 py-2" value={goalPreferences.time_window.to} onChange={(e) => setGoalPreferences({ ...goalPreferences, time_window: { ...goalPreferences.time_window, to: e.target.value } })} /></Field>
                <Field label="Regione">
                  <select className="bg-transparent border border-[var(--muted)]/30 rounded-xl px-3 py-2" value={goalPreferences.region} onChange={(e) => setGoalPreferences({ ...goalPreferences, region: e.target.value, country: "" })}>
                    <option className="bg-[var(--panel)]" value="Europe">Europe</option>
                  </select>
                </Field>
                <Field label="Paese">
                  <select className="bg-transparent border border-[var(--muted)]/30 rounded-xl px-3 py-2" value={goalPreferences.country} onChange={(e) => setGoalPreferences({ ...goalPreferences, country: e.target.value })}>
                    <option className="bg-[var(--panel)]" value="">— tutti —</option>
                    {["AT","BE","CH","CZ","DE","DK","ES","FI","FR","GR","HU","IE","IT","LU","NL","NO","PL","PT","SE","UK"].map((c) => (<option key={c} className="bg-[var(--panel)]" value={c}>{c}</option>))}
                  </select>
                </Field>
                <Field label="Città (per distanza)"><input type="text" placeholder="Milano, Roma…" className="bg-transparent border border-[var(--muted)]/30 rounded-xl px-3 py-2" value={goalPreferences.city_query} onChange={(e) => setGoalPreferences({ ...goalPreferences, city_query: e.target.value })} /></Field>
                <Field label="Raggio (km)"><input type="number" min={0} className="bg-transparent border border-[var(--muted)]/30 rounded-xl px-3 py-2" value={goalPreferences.radius_km} onChange={(e) => setGoalPreferences({ ...goalPreferences, radius_km: e.target.value })} /></Field>
                <div className="col-span-2 flex flex-wrap gap-2 pt-1">
                  <Button onClick={(e) => { e.preventDefault(); detectLocation(); }}>Usa la mia posizione</Button>
                  <Button onClick={(e) => { e.preventDefault(); runGoalSearch(); }}>Cerca gare obiettivo</Button>
                  {loading && <span className="text-sm text-[var(--muted)]">Caricamento…</span>}
                  {error && <span className="text-sm text-red-500">{error}</span>}
                </div>
              </form>
              <div className="mt-4">
                <SectionTitle>Proposte</SectionTitle>
                <ul className="mt-3 flex flex-col gap-3 max-h-96 overflow-auto pr-1">
                  {goalCandidates.length === 0 && !loading && !error && (<li className="text-sm text-[var(--muted)]">Nessun risultato. Premi "Cerca gare obiettivo".</li>)}
                  {goalCandidates.map((c, idx) => (
                    <li key={idx}>
                      <Card className="p-3">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-base font-semibold">{c.race_name}</h3>
                                {c.course?.certified && <Badge tone="leaf">Certificata</Badge>}
                                <Badge tone="pine">GoalScore: {c.goal_score ?? "?"}</Badge>
                              </div>
                              <div className="text-sm text-[var(--muted)]">{fmtDate(c.date)} • {c.location} {c.country ? `• ${c.country}` : ""} {typeof c.distance_from_home === "number" ? `• ${c.distance_from_home} km da te` : ""}</div>
                            </div>
                            <Button onClick={() => selectGoal(c)}>Seleziona</Button>
                          </div>
                          <ProgressBar value={c.goal_score ?? 0} />
                          <div className="flex items-center gap-2 text-xs text-[var(--muted)] flex-wrap">
                            {(c.sources || []).map((s, i) => (<a key={i} href={s} target="_blank" rel="noreferrer" className="underline hover:text-[var(--text)]">Fonte {i + 1}</a>))}
                          </div>
                        </div>
                      </Card>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          </section>

          <section className="lg:col-span-5">
            <Card className="p-4 md:p-5">
              <div className="flex items-center justify-between mb-3"><SectionTitle>Planner</SectionTitle><Badge>Build-Up Timeline</Badge></div>
              <div className="flex flex-col gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {selectedGoals.length === 0 && (<p className="text-sm text-[var(--muted)]">Seleziona una gara obiettivo dalla colonna a sinistra.</p>)}
                    {selectedGoals.map((g) => (
                      <Card key={g.name} className="px-3 py-2 flex items-center gap-3">
                        <Badge>{g.priority ?? "A"}</Badge>
                        <div>
                          <div className="font-semibold">{g.name}</div>
                          <div className="text-xs text-[var(--muted)]">{fmtDate(g.date)} • {g.location} • {g.distance_km} km</div>
                        </div>
                        <div className="ms-auto flex gap-2"><Button variant="subtle" onClick={() => generateBuildUp(g)}>Genera build-up</Button><Button variant="danger" onClick={() => removeGoal(g.name)}>Rimuovi</Button></div>
                      </Card>
                    ))}
                  </div>
                </div>
                {selectedGoals.map((g) => (
                  <div key={g.name} className="mt-2">
                    <h3 className="text-sm uppercase tracking-wider text-[var(--muted)] mb-2">Timeline — {g.name}</h3>
                    <ul className="flex flex-col gap-3">
                      {(buildUp[g.name] || []).map((item, idx) => (
                        <li key={idx}>
                          <Card className="p-3">
                            <div className="flex items-start gap-3">
                              <div className="pt-1"><div className="w-3 h-3 rounded-full bg-[var(--forest-2)] mt-2" /></div>
                              <div className="flex-1">
                                <div className="flex items-start justify-between gap-3 flex-wrap">
                                  <div className="min-w-[220px]">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <h4 className="font-semibold">{item.race_name}</h4>
                                      {item.course?.certified && <Badge tone="leaf">Certificata</Badge>}
                                      <Badge tone="pine">{item.distance_km} km</Badge>
                                      {Math.abs(item.weeks_before_goal - idealOffset(g.distance_km, item.distance_km)) <= 1 && (<Badge>Ideale timing</Badge>)}
                                    </div>
                                    <div className="text-xs text-[var(--muted)]">{fmtDate(item.date)} • {g.name} tra {item.weeks_before_goal} settimane</div>
                                  </div>
                                  <div className="w-full md:w-56"><div className="text-xs text-[var(--muted)] mb-1">FitScore</div><ProgressBar value={item.fit_score ?? 0} /></div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                                  <Field label="Data"><input type="date" className="bg-transparent border border-[var(--muted)]/30 rounded-xl px-3 py-2" value={item.date} onChange={(e) => updateBuildItemDate(g.name, idx, e.target.value)} /></Field>
                                  <Field label="Azioni">
                                    <div className="flex gap-3 items-end">
                                      <div className="flex flex-col items-center"><IconLabelButton onClick={() => moveBuildItem(g.name, idx, -1)} icon={<IconChevronUp />} label="Su" /></div>
                                      <div className="flex flex-col items-center"><IconLabelButton onClick={() => moveBuildItem(g.name, idx, +1)} icon={<IconChevronDown />} label="Giù" /></div>
                                      <div className="flex flex-col items-center"><IconLabelButton onClick={() => replaceBuildItem(g.name, idx)} icon={<IconSwap />} label="Sost." /></div>
                                    </div>
                                  </Field>
                                  <Field label="Link & Fonti"><div className="flex items-center gap-2 text-xs flex-wrap"><a href={item.race_url} target="_blank" rel="noreferrer" className="underline hover:text-[var(--text)]">Apri fonte</a>{(item.sources || []).slice(0, 3).map((s, i) => (<a key={i} href={s} target="_blank" rel="noreferrer" className="underline hover:text-[var(--text)]">Fonte {i + 1}</a>))}</div></Field>
                                </div>
                                {item.rationale && <p className="text-sm text-[var(--muted)] mt-2">{item.rationale}</p>}
                              </div>
                            </div>
                          </Card>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </Card>
          </section>

          <aside className="lg:col-span-3">
            <Card className="p-4 md:p-5">
              <div className="flex items-center justify-between mb-3"><SectionTitle>Filtri & Insights</SectionTitle><Badge>Opzionale</Badge></div>
              <div className="grid grid-cols-1 gap-3">
                <div className="text-xs text-[var(--muted)] leading-relaxed">Info percorso, clima e logistica saranno popolati con la ricerca reale.</div>
              </div>
            </Card>
          </aside>
        </main>
      )}

      <footer className="max-w-7xl mx-auto px-4 py-6 text-xs text-[var(--muted)]"><div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3"><span>© {new Date().getFullYear()} Calendario Corse — Dark Autumn.</span><span>Le proposte [MOCK] sono segnaposto. Collegare la ricerca web per risultati verificati.</span></div></footer>
    </div>
  );
}
