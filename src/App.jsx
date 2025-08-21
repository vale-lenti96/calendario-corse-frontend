import React, { useEffect, useMemo, useRef, useState } from 'react';

/**
 * App Frontend — versione “sezioni orizzontali” + UI avanzata
 * - Layout a pannelli orizzontali con scroll-snap, navbar con indicatori, frecce next/prev
 * - Stile minimal premium: tipografia grande, soft glass, micro-animazioni
 * - Filtri allineati al DB (distanze dinamiche), bug filtri risolto (pagina esplicita)
 * - Flusso target: Seleziona → Dettagli → Imposta target → Crea Build‑Up
 */

const API_BASE = "https://backend-db-corse-v2.onrender.com";

/* ============================ THEME / CSS ============================ */
const CSS = `
:root{
  --bg:#FFFFFF;
  --text:#0A0A0A;
  --muted:#5A5A5A;
  --border:#E6E6E0;
  --surface:#F7F7F5;
  --elevated:#F0F0EB;
  --primary:#0B5D41;
  --primary-600:#094F37;
  --ring:rgba(11,93,65,.25);
}

*{box-sizing:border-box}
html,body,#root{height:100%}
body{
  margin:0;background:var(--bg);color:var(--text);
  font-family:Inter,system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif;
  -webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale
}
a{color:inherit;text-decoration:none}
button{font:inherit;cursor:pointer}

/* Header sticky con blur */
.header{position:sticky;top:0;z-index:20;background:rgba(255,255,255,.8);backdrop-filter:saturate(140%) blur(10px);border-bottom:1px solid var(--border)}
.header-inner{max-width:1280px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;height:68px;padding:0 20px}
.brand{display:flex;align-items:center;gap:12px;font-weight:800;letter-spacing:.2px}
.brand-logo{width:30px;height:30px;border-radius:8px;background:conic-gradient(from 180deg at 50% 50%, #0B5D41, #0F766E, #0B5D41)}
.nav{display:flex;align-items:center;gap:8px}
.nav a{padding:8px 12px;border-radius:10px;color:var(--muted)}
.nav a.active,.nav a:hover{background:var(--surface);color:var(--text)}
.cta{background:var(--primary);color:#fff;border:0;padding:10px 14px;border-radius:12px;box-shadow:0 4px 14px rgba(11,93,65,.2);transition:.2s transform}
.cta:hover{background:var(--primary-600);transform:translateY(-1px)}
/* Barra sezioni (dots) */
.section-dots{display:flex;gap:8px;align-items:center}
.dot{width:8px;height:8px;border-radius:999px;background:#d1d5db;border:0}
.dot.active{background:#111}
.sep{width:1px;height:16px;background:var(--border);margin:0 6px}

/* H-Stack orizzontale */
.hstack-wrap{position:relative}
.hstack{
  display:grid;grid-auto-flow:column;grid-auto-columns:100%;
  overflow-x:auto;scroll-snap-type:x mandatory;scroll-behavior:smooth;
  overscroll-behavior-x:contain;scrollbar-width:none;
}
.hstack::-webkit-scrollbar{display:none}
.panel{
  min-height:calc(100dvh - 68px);
  scroll-snap-align:center;scroll-snap-stop:always;
  display:flex;align-items:stretch;justify-content:center;
  padding:24px 0;
}
.panel-inner{
  width:100%;max-width:1280px;padding:0 20px;display:grid;gap:16px
}

/* Bottoni freccia laterali */
.hnav{
  position:absolute;inset:0;pointer-events:none;display:flex;justify-content:space-between;align-items:center;padding:0 10px
}
.hnav button{
  pointer-events:auto;width:44px;height:44px;border-radius:999px;border:1px solid var(--border);background:#fff;
  display:flex;align-items:center;justify-content:center;box-shadow:0 6px 24px rgba(0,0,0,.08);
  transition:transform .15s
}
.hnav button:hover{transform:scale(1.03)}

/* Section styles */
.hero{
  background:radial-gradient(1000px 600px at 10% -10%, #EDF6F3 0, transparent 60%),
             radial-gradient(800px 500px at 100% 0%, #EEF7F5 0, transparent 60%),
             var(--surface);
  border:1px solid var(--border);border-radius:20px;padding:28px;
}
.hero h1{margin:8px 0 6px 0;font-size:44px;line-height:1.05;letter-spacing:-.3px}
.hero p{margin:0;color:var(--muted);font-size:16px}
.hero-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:10px}

.section{background:#fff;border:1px solid var(--border);border-radius:20px;padding:18px}
.section h2{margin:0 0 8px 0;font-size:22px}

/* Form / Inputs */
.input, select, .date input{
  width:100%;background:#fff;color:var(--text);
  border:1px solid var(--border);border-radius:12px;padding:12px 14px;outline:none;
  transition:border .15s, box-shadow .15s
}
.input:focus, select:focus, .date input:focus{
  border-color:var(--primary);box-shadow:0 0 0 4px var(--ring)
}
.label{font-size:12px;color:var(--muted);margin-bottom:6px}
.group{display:flex;flex-direction:column}
.btn{background:var(--primary);color:#fff;border:0;border-radius:12px;padding:12px 14px;font-weight:700;letter-spacing:.2px}
.btn:hover{background:var(--primary-600)}
.btn.secondary{background:#fff;color:var(--text);border:1px solid var(--border)}
.btn.ghost{background:transparent;color:var(--text);border:1px dashed var(--border)}

/* Search bar */
.search-bar{display:grid;grid-template-columns:1.2fr .7fr .8fr .8fr .7fr auto;gap:10px}

/* Cards */
.list{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.card{
  background:linear-gradient(180deg,#fff, #fbfbf9);
  border:1px solid var(--border);border-radius:16px;padding:14px;
  box-shadow:0 4px 18px rgba(0,0,0,.04);
  transition:transform .12s, box-shadow .12s
}
.card:hover{transform:translateY(-2px);box-shadow:0 8px 26px rgba(0,0,0,.06)}
.card h3{margin:0 0 4px 0;font-size:16px}
.meta{color:var(--muted);font-size:13px}
.badges{display:flex;gap:6px;margin-top:8px;flex-wrap:wrap}
.badge{font-size:11px;padding:4px 8px;border:1px solid var(--border);border-radius:999px;color:#2a2a2a;background:#fff}
.badge.good{background:rgba(19,121,91,.10);border-color:transparent;color:#0b5d41}
.card-actions{display:flex;gap:8px;margin-top:10px}
.card-actions .btn{padding:8px 10px;font-size:13px}

/* Empty */
.empty{text-align:center;padding:26px;border:1px dashed var(--border);border-radius:14px;color:var(--muted)}

/* Modal */
.modal{position:fixed;inset:0;background:rgba(0,0,0,.28);display:flex;align-items:center;justify-content:center;padding:20px;z-index:30}
.sheet{max-width:920px;width:100%;border-radius:18px;background:#fff;border:1px solid var(--border);color:var(--text)}
.sheet-header{display:flex;align-items:center;justify-content:space-between;padding:16px 18px;border-bottom:1px solid var(--border)}
.sheet-body{padding:18px;display:grid;gap:16px}
.sheet h3{margin:0}
.sheet .sub{color:var(--muted);font-size:13px}

/* Build-up */
.build-list{display:grid;gap:10px}
.build-item{display:flex;align-items:center;justify-content:space-between;background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:10px 12px}
.build-item .left{display:flex;flex-direction:column}
.build-item .right{display:flex;gap:8px;align-items:center}
.build-chip{font-size:11px;padding:4px 8px;border-radius:999px;border:1px solid var(--border)}
.build-when{font-size:12px;color:var(--muted)}

/* Responsive */
@media (max-width: 1100px){
  .list{grid-template-columns:repeat(2,1fr)}
}
@media (max-width: 740px){
  .search-bar{grid-template-columns:1fr 1fr}
  .list{grid-template-columns:1fr}
  .nav{display:none}
}
`;

/* ============================ MINI-ROUTER ============================ */
function parseHashRoute() {
  const raw = window.location.hash || '#/home';
  const [pathPart, queryPart] = raw.replace(/^#/, '').split('?');
  const path = pathPart || '/home';
  const query = new URLSearchParams(queryPart || '');
  return { path, query };
}
function navigate(path, params) {
  const qs = params ? `?${new URLSearchParams(params).toString()}` : '';
  window.location.hash = `${path}${qs}`;
}

/* ============================ HELPERS ============================ */
const fmtDate = (iso) => { try { return new Date(iso).toLocaleDateString(undefined, { day:'2-digit', month:'short', year:'numeric' }); } catch { return iso; } };
const addDays = (iso, days) => { const d = new Date(iso); d.setDate(d.getDate()+days); return d.toISOString().slice(0,10); };
const weeksBetween = (a,b) => Math.round((new Date(b)-new Date(a))/(7*24*3600*1000));
const withinDate = (iso, from, to) => {
  if (!iso) return false;
  const d = new Date(iso).setHours(0,0,0,0);
  if (from && d < new Date(from).setHours(0,0,0,0)) return false;
  if (to && d > new Date(to).setHours(0,0,0,0)) return false;
  return true;
};

/* ============================ DATA PROVIDER ============================ */
const RaceDataProvider = {
  async search(params) {
    const ctrl = new AbortController();
    const url = `${API_BASE}/api/races?` + new URLSearchParams(params || {}).toString();
    const res = await fetch(url, { headers:{ 'Accept':'application/json' }, signal: ctrl.signal }).catch(() => null);
    if (!res || !res.ok) return { races: [], total: 0 };
    const data = await res.json().catch(()=>({ races:[], total:0 }));
    return { races: data.races || [], total: data.total || 0 };
  },
  async getById(id) {
    const res = await fetch(`${API_BASE}/api/races/${encodeURIComponent(id)}`, { headers:{ 'Accept':'application/json' } }).catch(()=>null);
    if (!res || !res.ok) return null;
    return await res.json().catch(()=>null);
  }
};

/* ============================ HEADER ============================ */
function Header({ route, sectionIndex, totalSections, onDotClick }) {
  const tab = route.path.replace(/^\//,'');
  const link = (href, label) => (
    <a href={`#${href}`} className={tab===href.replace(/^\//,'') ? 'active' : ''}>{label}</a>
  );
  return (
    <header className="header">
      <div className="header-inner">
        <div className="brand">
          <div className="brand-logo" aria-hidden />
          <div>Runshift</div>
        </div>
        <nav className="nav" aria-label="Primary">
          {link('/home','Home')}
          {link('/gare','Gare')}
          {link('/strumenti','Strumenti')}
          {link('/about','About')}
        </nav>
        <div style={{display:'flex', alignItems:'center', gap:10}}>
          {/* Dots delle sezioni orizzontali solo in Home */}
          {route.path === '/home' && (
            <div className="section-dots" aria-hidden>
              {[...Array(totalSections)].map((_,i)=>(
                <button key={i} className={'dot'+(i===sectionIndex?' active':'')} onClick={()=>onDotClick(i)} />
              ))}
              <span className="sep" />
            </div>
          )}
          <button className="cta" onClick={() => navigate('/gare')}>Trova una gara</button>
        </div>
      </div>
    </header>
  );
}

/* ============================ CARDS / MODALS ============================ */
function RaceCard({ r, onOpen, onSelect }) {
  return (
    <div className="card">
      <h3>{r.name}</h3>
      <div className="meta">{r.city} • {r.country} • {fmtDate(r.dateStart)}</div>
      <div className="badges">
        {Array.isArray(r.distances) && r.distances.length>0 && <span className="badge">{r.distances.join(' / ')}</span>}
        {r.surface && <span className="badge">{r.surface}</span>}
        {r.elevationProfile && <span className="badge">{r.elevationProfile}</span>}
        {r.pbFriendly && <span className="badge good">PB-friendly</span>}
        {typeof r.priceFrom === 'number' && <span className="badge">€{r.priceFrom}+</span>}
      </div>
      <div className="card-actions">
        <button className="btn secondary" onClick={() => onOpen(r)}>Dettagli</button>
        <button className="btn" onClick={() => onSelect(r)}>Seleziona</button>
      </div>
    </div>
  );
}

const ROLE_ORDER = ['Tune-up 10K','Tune-up 21K','Test 5K','Dress rehearsal'];
function recommendBuildUp(target, candidates) {
  const tDate = target.dateStart;
  const base = candidates
    .filter(r => r.id !== target.id)
    .filter(r => withinDate(r.dateStart, addDays(tDate, -16*7), addDays(tDate, -7)))
    .map(r => ({ ...r, weeks: weeksBetween(r.dateStart, tDate), sameSurface: r.surface === target.surface }))
    .sort((a,b)=> new Date(a.dateStart)-new Date(b.dateStart));

  const picks = [];
  const has = (race, km) => (race.distances||[]).some(d => String(d).includes(km));
  const isMarathon = has(target,'42'), isHalf = has(target,'21');

  const pick = (fn)=>{ const f = base.filter(fn).sort((a,b)=>(a.sameSurface===b.sameSurface?0:(a.sameSurface?-1:1))||(b.weeks-a.weeks)); if(f[0] && !picks.find(p=>p.id===f[0].id)) picks.push(f[0]); };

  if (isMarathon){ pick(r=>has(r,'21')&&r.weeks>=5&&r.weeks<=8); pick(r=>has(r,'10')&&r.weeks>=10&&r.weeks<=12); pick(r=>has(r,'5')&&r.weeks>=2&&r.weeks<=4); }
  else if (isHalf){ pick(r=>has(r,'10')&&r.weeks>=4&&r.weeks<=6); pick(r=>has(r,'5')&&r.weeks>=2&&r.weeks<=4); }
  else { pick(r=>has(r,'5')&&r.weeks>=2&&r.weeks<=4); pick(r=>has(r,'10')&&r.weeks>=3&&r.weeks<=8); }

  if (picks.length<2) picks.push(...base.filter(r=>!picks.find(p=>p.id===r.id)).slice(0,2-picks.length));
  return picks.map(r=>{
    let role='Tune-up';
    if(isMarathon){ if(has(r,'21')) role='Tune-up 21K'; else if(has(r,'10')) role='Tune-up 10K'; else if(has(r,'5')) role='Test 5K'; }
    else if(isHalf){ if(has(r,'10')) role='Tune-up 10K'; else if(has(r,'5')) role='Test 5K'; }
    else { if(has(r,'5')) role='Test 5K'; else if(has(r,'10')) role='Tune-up 10K'; }
    return {...r, role};
  }).sort((a,b)=>ROLE_ORDER.indexOf(a.role)-ROLE_ORDER.indexOf(b.role));
}

function RaceDetailModal({ race, onClose, onSetTarget }) {
  const [loading, setLoading] = useState(false);
  const [build, setBuild] = useState(null);

  const generateBuild = async () => {
    setLoading(true);
    const data = await RaceDataProvider.search({
      surface: race.surface || '',
      dateFrom: addDays(race.dateStart, -16*7),
      dateTo: addDays(race.dateStart, -7),
      limit: 200, orderBy: 'date_start', orderDir: 'asc'
    });
    const recs = recommendBuildUp(race, data.races || []);
    setBuild(recs); setLoading(false);
  };

  return (
    <div className="modal" role="dialog" aria-modal="true">
      <div className="sheet">
        <div className="sheet-header">
          <div>
            <h3 style={{margin:0}}>{race.name}</h3>
            <div className="sub">{race.city} • {race.country} — {fmtDate(race.dateStart)} — {(race.distances||[]).join(' / ')}</div>
          </div>
          <div style={{display:'flex',gap:8}}>
            <button className="btn secondary" onClick={onClose}>Chiudi</button>
            <button className="btn" onClick={() => onSetTarget(race)}>Imposta come gara target</button>
          </div>
        </div>
        <div className="sheet-body">
          <div className="section" style={{margin:0}}>
            <h2>Overview</h2>
            <div className="badges" style={{marginTop:8}}>
              {race.surface && <span className="badge">{race.surface}</span>}
              {race.elevationProfile && <span className="badge">{race.elevationProfile}</span>}
              {race.pbFriendly && <span className="badge good">PB-friendly</span>}
              {typeof race.priceFrom === 'number' && <span className="badge">€{race.priceFrom}+</span>}
            </div>
            {race.website && <div style={{marginTop:10}}><a className="btn secondary" href={race.website} target="_blank" rel="noreferrer">Sito ufficiale</a></div>}
          </div>

          <div className="section" style={{margin:0}}>
            <h2>Build‑Up Races</h2>
            <p className="sub">Finestra <strong>-16 → -1 settimane</strong> dalla target.</p>
            <div style={{display:'flex',gap:10,flexWrap:'wrap',marginTop:8}}>
              <button className="btn" onClick={generateBuild} disabled={loading}>{loading?'Calcolo…':'Crea Build‑Up'}</button>
            </div>

            {build && (build.length===0
              ? <div className="empty" style={{marginTop:12}}>Nessuna gara di avvicinamento trovata.</div>
              : <div className="build-list" style={{marginTop:12}}>
                  {build.map(b=>(
                    <div className="build-item" key={b.id}>
                      <div className="left">
                        <strong>{b.name}</strong>
                        <span className="build-when">{b.city} • {b.country} — {fmtDate(b.dateStart)} • {weeksBetween(b.dateStart, race.dateStart)} sett. prima</span>
                      </div>
                      <div className="right">
                        <span className="build-chip">{(b.distances||[]).join(' / ')}</span>
                        <a className="btn secondary" href={`#${'/gare?id='+encodeURIComponent(b.id)}`} onClick={(e)=>e.preventDefault()}>Dettagli</a>
                      </div>
                    </div>
                  ))}
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================ HOME: SEZIONI ORIZZONTALI ============================ */
function HomeHorizontal({ onQuickSearch }) {
  const wrapRef = useRef(null);
  const trackRef = useRef(null);
  const [idx, setIdx] = useState(0);

  // Sezioni: 1) Hero 2) Ricerca Smart 3) In evidenza 4) Strumenti 5) About
  const sections = 5;

  // Scroll handler per dot attivo
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const onScroll = () => {
      const w = el.clientWidth;
      const i = Math.round(el.scrollLeft / (w || 1));
      setIdx(Math.max(0, Math.min(sections-1, i)));
    };
    el.addEventListener('scroll', onScroll, { passive:true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  // Frecce tastiera
  useEffect(() => {
    const el = trackRef.current;
    const onKey = (e) => {
      if (!el) return;
      if (e.key === 'ArrowRight') el.scrollBy({ left: el.clientWidth, behavior:'smooth' });
      if (e.key === 'ArrowLeft') el.scrollBy({ left: -el.clientWidth, behavior:'smooth' });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const goTo = (i) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior:'smooth' });
  };

  // Featured (6)
  const [featured, setFeatured] = useState([]);
  useEffect(() => { (async () => {
    const data = await RaceDataProvider.search({ limit:6, orderBy:'date_start', orderDir:'asc' });
    setFeatured(data.races || []);
  })(); }, []);

  return (
    <div className="hstack-wrap" ref={wrapRef}>
      <div className="hstack" ref={trackRef}>

        {/* Pannello 1 — Hero */}
        <section className="panel" aria-roledescription="slide">
          <div className="panel-inner">
            <div className="hero">
              <h1>Trova, pianifica, corri.<br/>Il tuo hub per le gare.</h1>
              <p>Design minimale e rapido: filtra per distanza, data, paese e superficie. Crea anche il tuo build‑up verso la gara target.</p>
              <div className="hero-actions">
                <button className="cta" onClick={() => onQuickSearch({})}>Cerca gare</button>
                <button className="btn secondary" onClick={() => onQuickSearch({ surface:'road' })}>Maratone su strada</button>
              </div>
            </div>
            <div className="section">
              <h2>Perché Runshift</h2>
              <div className="list" style={{gridTemplateColumns:'repeat(3,1fr)'}}>
                {[
                  {t:'Ricerca veloce',d:'Filtri sincronizzati ai dati reali del DB.'},
                  {t:'Build‑Up smart',d:'Suggerisce test e tune‑up nella finestra ideale.'},
                  {t:'UI moderna',d:'Sezioni orizzontali, micro-animazioni, snap.'}
                ].map((k,i)=>(
                  <div key={i} className="card"><h3>{k.t}</h3><p className="meta">{k.d}</p></div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Pannello 2 — Shortcut ricerca */}
        <section className="panel" aria-roledescription="slide">
          <div className="panel-inner">
            <div className="hero">
              <h1>Pronto a scegliere?</h1>
              <p>Lancia subito una ricerca con i preset più comuni.</p>
              <div className="hero-actions">
                <button className="btn" onClick={()=>onQuickSearch({ distance:'42' })}>42K</button>
                <button className="btn" onClick={()=>onQuickSearch({ distance:'21' })}>21K</button>
                <button className="btn" onClick={()=>onQuickSearch({ surface:'trail' })}>Trail</button>
                <button className="btn" onClick={()=>onQuickSearch({ elevation:'flat', surface:'road' })}>PB friendly</button>
              </div>
            </div>
            <div className="section">
              <h2>Consigli rapidi</h2>
              <div className="empty">Arriveranno suggerimenti personalizzati in base alla tua cronologia.</div>
            </div>
          </div>
        </section>

        {/* Pannello 3 — In evidenza */}
        <section className="panel" aria-roledescription="slide">
          <div className="panel-inner">
            <div className="section">
              <h2>Prossimi eventi in evidenza</h2>
              {featured.length===0
                ? <div className="empty">Nessun evento da mostrare al momento.</div>
                : <div className="list">
                    {featured.map(r=>(
                      <div className="card" key={r.id}>
                        <h3>{r.name}</h3>
                        <div className="meta">{r.city} • {r.country} • {fmtDate(r.dateStart)}</div>
                        <div className="badges">
                          {Array.isArray(r.distances)&&r.distances.length>0 && <span className="badge">{r.distances.join(' / ')}</span>}
                          {r.pbFriendly && <span className="badge good">PB-friendly</span>}
                        </div>
                        <div className="card-actions">
                          <a className="btn" href="#/gare">Cerca gare</a>
                          <button className="btn secondary" onClick={()=>onQuickSearch({ country:r.country })}>Vedi in {r.country}</button>
                        </div>
                      </div>
                    ))}
                  </div>
              }
            </div>
          </div>
        </section>

        {/* Pannello 4 — Strumenti */}
        <section className="panel" aria-roledescription="slide">
          <div className="panel-inner">
            <ToolsInline />
          </div>
        </section>

        {/* Pannello 5 — About */}
        <section className="panel" aria-roledescription="slide">
          <div className="panel-inner">
            <div className="hero">
              <h1>Costruito per i runner</h1>
              <p>Obiettivo: semplificare la scelta e la preparazione della gara, con dati reali e suggerimenti utili.</p>
              <div className="hero-actions">
                <button className="cta" onClick={() => onQuickSearch({})}>Inizia ora</button>
                <a className="btn secondary" href="#/about">Scopri di più</a>
              </div>
            </div>
            <div className="section">
              <h2>Roadmap</h2>
              <ul>
                <li>🔌 DB reale collegato — fatto</li>
                <li>🗺️ Scheda gara estesa (Percorso, Meteo, Logistica)</li>
                <li>🌱 Percorsi personalizzati con allenamenti</li>
                <li>🌍 Localizzazioni (IT/EN/FR/DE/ES)</li>
              </ul>
            </div>
          </div>
        </section>

      </div>

      {/* Frecce laterali */}
      <div className="hnav" aria-hidden>
        <button onClick={()=>goTo(Math.max(0, idx-1))}>‹</button>
        <button onClick={()=>goTo(Math.min(sections-1, idx+1))}>›</button>
      </div>
    </div>
  );
}

/* ============================ SEARCH (PAGINA) ============================ */
function SearchHero({ initial, onSearch, facets }) {
  const [q, setQ] = useState(initial.q || '');
  const [distance, setDistance] = useState(initial.distance || '');
  const [country, setCountry] = useState(initial.country || '');
  const [surface, setSurface] = useState(initial.surface || '');
  const [elevation, setElevation] = useState(initial.elevation || '');
  const [dateFrom, setDateFrom] = useState(initial.dateFrom || '');
  const [dateTo, setDateTo] = useState(initial.dateTo || '');

  const submit = (e) => {
    e.preventDefault();
    const params = { q, distance, country, surface, elevation, dateFrom, dateTo };
    Object.keys(params).forEach(k => { if (!params[k]) delete params[k]; });
    onSearch(params, 1);
  };

  return (
    <div className="hero">
      <h1>Trova la tua prossima gara</h1>
      <p>Filtri sincronizzati con i dati reali del DB.</p>
      <form className="search-bar" onSubmit={submit}>
        <div className="group">
          <label className="label">Parola chiave</label>
          <input className="input" placeholder="Nome, città, paese…" value={q} onChange={e=>setQ(e.target.value)} />
        </div>
        <div className="group">
          <label className="label">Distanza</label>
          <select value={distance} onChange={e=>setDistance(e.target.value)}>
            <option value="">Tutte</option>
            {(facets.distances||[]).map(d => <option key={d} value={d}>{d} km</option>)}
          </select>
        </div>
        <div className="group">
          <label className="label">Paese</label>
          <input className="input" placeholder="Italy, Spain…" value={country} onChange={e=>setCountry(e.target.value)} />
        </div>
        <div className="group">
          <label className="label">Superficie</label>
          <select value={surface} onChange={e=>setSurface(e.target.value)}>
            <option value="">Tutte</option>
            {(facets.surfaces||[]).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="group">
          <label className="label">Altimetria</label>
          <select value={elevation} onChange={e=>setElevation(e.target.value)}>
            <option value="">Tutte</option>
            {(facets.elevations||[]).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="group">
          <label className="label">Data</label>
          <div className="date" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:6}}>
            <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} />
            <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} min={dateFrom || undefined} />
          </div>
        </div>
        <button className="btn" type="submit">Cerca</button>
      </form>
    </div>
  );
}

function RacesView({ route, onTarget }) {
  const q = route.query.get('q') || '';
  const distance = route.query.get('distance') || '';
  const country = route.query.get('country') || '';
  const surface = route.query.get('surface') || '';
  const elevation = route.query.get('elevation') || '';
  const dateFrom = route.query.get('dateFrom') || '';
  const dateTo = route.query.get('dateTo') || '';
  const pageParam = parseInt(route.query.get('page') || '1', 10);
  const limitParam = parseInt(route.query.get('limit') || '60', 10);

  const initial = useMemo(()=>({ q, distance, country, surface, elevation, dateFrom, dateTo }), [q,distance,country,surface,elevation,dateFrom,dateTo]);

  const [loading, setLoading] = useState(false);
  const [races, setRaces] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(pageParam);
  const [limit] = useState(limitParam);
  const [open, setOpen] = useState(null);
  const [facets, setFacets] = useState({ distances: [], surfaces: [], elevations: [] });

  // Facets dinamiche
  useEffect(() => {
    (async () => {
      const data = await RaceDataProvider.search({ limit: 500, orderBy: 'date_start', orderDir: 'asc' });
      const all = data.races || [];
      const uniq = (arr) => Array.from(new Set(arr.filter(Boolean)));
      const distances = uniq(all.map(r => (r.distances && r.distances[0]) ? String(r.distances[0]).replace(/[^0-9.,]/g,'').replace(',', '.') : '').filter(Boolean))
        .sort((a,b)=>parseFloat(a)-parseFloat(b));
      const surfaces = uniq(all.map(r => r.surface)).sort();
      const elevations = uniq(all.map(r => r.elevationProfile)).sort();
      setFacets({ distances, surfaces, elevations });
    })();
  }, []);

  // Ricerca con pagina esplicita (fix bug)
  const runSearch = async (params, pageToLoad, append=false) => {
    setLoading(true);
    const data = await RaceDataProvider.search({
      ...params, page: pageToLoad, limit, orderBy: 'date_start', orderDir: 'asc'
    });
    setRaces(prev => append ? [...prev, ...(data.races||[])] : (data.races||[]));
    setTotal(data.total || 0);
    setLoading(false);
  };

  // On filters change
  useEffect(() => {
    const params = {};
    for (const [k,v] of route.query.entries()) params[k] = v;
    setPage(pageParam);
    runSearch(params, pageParam, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.path, route.query.toString()]);

  const onSearch = (params, forcedPage=1) => navigate('/gare', { ...params, page: forcedPage, limit });
  const onOpen = (r) => setOpen(r);
  const onSelect = (r) => setOpen(r);
  const loadMore = async () => {
    const params = {}; for (const [k,v] of route.query.entries()) params[k]=v;
    const next = page + 1; setPage(next);
    await runSearch(params, next, true);
  };

  return (
    <>
      <SearchHero initial={initial} onSearch={onSearch} facets={facets} />
      <div className="section">
        <h2>Risultati {loading ? '…' : `(${total})`}</h2>
        {loading && races.length===0
          ? <div className="empty">Carico le gare…</div>
          : <>
              {races.length===0
                ? <div className="empty">
                    Nessuna gara trovata.
                    <div style={{marginTop:8,fontSize:12,color:'#6B6B6B'}}>Prova senza keyword o scegli una distanza dalla tendina (è sincronizzata col DB).</div>
                  </div>
                : <div className="list">
                    {races.map(r => <RaceCard key={r.id} r={r} onOpen={onOpen} onSelect={onSelect} />)}
                  </div>
              }
              {races.length < total && (
                <div style={{display:'flex',justifyContent:'center',marginTop:12}}>
                  <button className="btn" onClick={loadMore} disabled={loading}>{loading?'Carico…':'Carica altri'}</button>
                </div>
              )}
            </>
        }
      </div>
      {open && <RaceDetailModal race={open} onClose={()=>setOpen(null)} onSetTarget={onTarget} />}
    </>
  );
}

/* ============================ TOOLS INLINE (Pannello) ============================ */
function ToolsInline(){
  const [distKm, setDistKm] = useState('21.097');
  const [time, setTime] = useState('1:45:00');
  const pace = useMemo(() => {
    const [h,m,s] = time.split(':').map(x=>parseInt(x||0,10));
    const total = (h*3600)+(m*60)+(s||0);
    if (!total || !parseFloat(distKm)) return '';
    const perKm = total / parseFloat(distKm);
    const mm = Math.floor(perKm/60);
    const ss = Math.round(perKm%60).toString().padStart(2,'0');
    return `${mm}:${ss} min/km`;
  }, [distKm,time]);

  return (
    <>
      <div className="hero">
        <h1>Strumenti veloci</h1>
        <p>Calcola il ritmo e pianifica a colpo d'occhio.</p>
      </div>
      <div className="section">
        <h2>Calcolatore ritmo</h2>
        <div className="search-bar" style={{gridTemplateColumns:'1fr 1fr 1fr'}}>
          <div className="group">
            <label className="label">Distanza (km)</label>
            <input className="input" value={distKm} onChange={e=>setDistKm(e.target.value)} />
          </div>
          <div className="group">
            <label className="label">Tempo (hh:mm:ss)</label>
            <input className="input" value={time} onChange={e=>setTime(e.target.value)} />
          </div>
          <div className="group">
            <label className="label">Ritmo</label>
            <input className="input" value={pace} readOnly />
          </div>
        </div>
      </div>
    </>
  );
}

/* ============================ ABOUT (pagina semplice) ============================ */
function AboutView(){
  return (
    <>
      <div className="hero">
        <h1>About</h1>
        <p>Runshift ti aiuta a scoprire gare e a costruire un percorso di avvicinamento intelligente.</p>
      </div>
      <div className="section">
        <h2>Roadmap</h2>
        <ul>
          <li>🔌 DB reale collegato</li>
          <li>🗺️ Scheda gara estesa (Percorso, Meteo, Logistica)</li>
          <li>🌱 Percorsi personalizzati con allenamenti</li>
          <li>🌍 Localizzazioni (IT/EN/FR/DE/ES)</li>
        </ul>
      </div>
    </>
  );
}

/* ============================ APP ROOT ============================ */
export default function App() {
  const [route, setRoute] = useState(parseHashRoute());
  const [target, setTarget] = useState(null);
  const [sectionIdx, setSectionIdx] = useState(0);

  useEffect(() => {
    const onHash = () => setRoute(parseHashRoute());
    window.addEventListener('hashchange', onHash);
    if (!window.location.hash) navigate('/home');
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  // Click su dot (home)
  const onDotClick = (i) => {
    const track = document.querySelector('.hstack');
    if (!track) return;
    track.scrollTo({ left: i * track.clientWidth, behavior:'smooth' });
  };

  // Vista corrente
  let view;
  const base = route.path.split('/')[1] || 'home';
  switch (base) {
    case 'home':
      view = <HomeHorizontal onQuickSearch={(p)=>navigate('/gare', p)} />;
      break;
    case 'gare':
      view = <RacesView route={route} onTarget={(r)=>setTarget(r)} />;
      break;
    case 'strumenti':
      view = (
        <>
          <div className="hero"><h1>Strumenti</h1><p>Calcolatori utili per ritmo e stima tempi.</p></div>
          <div className="section"><ToolsInline/></div>
        </>
      );
      break;
    case 'about':
      view = <AboutView />;
      break;
    default:
      view = (
        <div className="hero">
          <h1>Pagina non trovata</h1>
          <p>Il percorso <code>{route.path}</code> non esiste.</p>
          <div style={{marginTop:10}}><a className="btn" href="#/home">Torna alla Home</a></div>
        </div>
      );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <Header route={route} sectionIndex={sectionIdx} totalSections={5} onDotClick={onDotClick} />
      <main style={{padding:'16px 0 60px'}}>
        <div style={{maxWidth:1280, margin:'0 auto', padding:'0 20px'}}>
          {target && (
            <div className="section" style={{borderColor:'#B7E4C7'}}>
              <h2>Gara target impostata</h2>
              <div className="meta">{target.name} — {target.city}, {target.country} — {fmtDate(target.dateStart)} — {(target.distances||[]).join(' / ')}</div>
              <div style={{marginTop:8, display:'flex', gap:8, flexWrap:'wrap'}}>
                <a className="btn" href="#/gare">Crea Build‑Up dalla target</a>
                <button className="btn secondary" onClick={()=>setTarget(null)}>Rimuovi target</button>
              </div>
            </div>
          )}
        </div>

        {/* Home: full width orizzontale (senza padding container) */}
        {base === 'home'
          ? view
          : <div style={{maxWidth:1280, margin:'0 auto', padding:'0 20px'}}>{view}</div>
        }
      </main>
      <footer style={{borderTop:'1px solid var(--border)', color:'var(--muted)', padding:'22px 0', background:'#fff'}}>
        <div style={{maxWidth:1280, margin:'0 auto', padding:'0 20px', display:'flex', justifyContent:'space-between', gap:14, flexWrap:'wrap'}}>
          <div>© {new Date().getFullYear()} Runshift</div>
          <div style={{display:'flex', gap:12}}>
            <a href="#/privacy">Privacy</a>
            <a href="#/cookies">Cookie</a>
            <a href="#/contatti">Contatti</a>
          </div>
        </div>
      </footer>
    </>
  );
}
