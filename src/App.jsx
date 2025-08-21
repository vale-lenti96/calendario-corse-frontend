import React, { useEffect, useMemo, useRef, useState } from 'react';

/**
 * FRONTEND — Light Minimal (uguale al precedente) + Carousel + Build-Up Races
 * - Sfondo bianco, testo nero, pulsanti verde scuro.
 * - Carousel minimalista in Home.
 * - Ricerca gare collegata al backend Render (nessun mock).
 * - Scheda gara con "Genera Build‑Up" (finestra -16 → -1 settimane).
 */

const API_BASE = "https://backend-db-corse-v2.onrender.com";

// ---------- THEME (Light Minimal: identico al precedente) ----------
const CSS = `
:root{
  --bg:#FFFFFF;
  --surface:#F7F7F5;
  --elevated:#EFEFEA;
  --text:#0A0A0A;
  --text-soft:#333333;
  --muted:#6B6B6B;
  --border:#E3E3DE;

  --primary:#0B5D41;        /* verde scuro */
  --primary-600:#094F37;
  --accent:#115E59;         /* petrolio */
  --good:#13795B;
  --warn:#B45309;
  --error:#B91C1C;
}

*{box-sizing:border-box}
html,body,#root{height:100%}
body{
  margin:0; background:var(--bg); color:var(--text);
  font-family:Inter,system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif;
  -webkit-font-smoothing:antialiased; -moz-osx-font-smoothing:grayscale;
}
a{color:inherit; text-decoration:none}
button{font:inherit; cursor:pointer}

.container{max-width:1200px; margin:0 auto; padding:0 20px}

.header{
  position:sticky; top:0; z-index:10;
  background:#fff; backdrop-filter:saturate(150%) blur(6px);
  border-bottom:1px solid var(--border);
}
.header-inner{display:flex; align-items:center; justify-content:space-between; height:64px}
.brand{display:flex; align-items:center; gap:10px; font-weight:700}
.brand-logo{width:28px; height:28px; border-radius:6px; background:linear-gradient(135deg,var(--primary),var(--accent))}

.nav{display:flex; gap:10px; align-items:center}
.nav a{
  padding:8px 12px; border-radius:10px; color:var(--muted);
}
.nav a.active, .nav a:hover{ background:var(--surface); color:var(--text) }

.cta{ background:var(--primary); color:#fff; border:0; padding:10px 14px; border-radius:10px }
.cta:hover{ background:var(--primary-600) }

.main{padding:28px 0 60px}

.hero{
  background:var(--surface);
  border:1px solid var(--border); border-radius:16px; padding:20px; margin-bottom:20px;
}
.hero h1{margin:0 0 6px 0; font-size:28px}
.hero p{margin:0; color:var(--muted)}

.section{background:#fff; border:1px solid var(--border); border-radius:16px; padding:18px; margin:14px 0}
.section h2{margin:0 0 10px 0; font-size:20px}

.input, select, .date input{
  width:100%; background:#fff; color:var(--text);
  border:1px solid var(--border); border-radius:10px; padding:10px 12px;
}
.label{font-size:12px; color:var(--muted); margin-bottom:6px}
.group{display:flex; flex-direction:column}

.btn{
  background:var(--primary); color:#fff; border:0; border-radius:10px; padding:10px 14px; font-weight:600;
}
.btn:hover{ background:var(--primary-600) }
.btn.secondary{ background:#fff; color:var(--text); border:1px solid var(--border) }

.search-bar{display:grid; grid-template-columns:1.2fr .8fr .8fr .9fr .7fr auto; gap:10px; margin-top:14px}

.filters-inline{display:flex; flex-wrap:wrap; gap:8px; margin:10px 0 0}
.chip{
  font-size:12px; color:var(--muted); background:#fff; border:1px solid var(--border);
  border-radius:999px; padding:6px 10px;
}
.chip.active{ color:var(--text); background:var(--surface) }

.list{display:grid; grid-template-columns:repeat(3,1fr); gap:14px; margin-top:14px}
.card{
  background:#fff; border:1px solid var(--border); border-radius:14px; padding:14px;
}
.card h3{margin:0 0 2px 0; font-size:16px}
.meta{color:var(--muted); font-size:13px}
.badges{display:flex; gap:6px; margin-top:8px; flex-wrap:wrap}
.badge{font-size:11px; padding:4px 8px; border:1px solid var(--border); border-radius:999px; color:var(--text-soft)}
.badge.good{border-color:transparent; background:rgba(19,121,91,.10); color:var(--good)}
.card-actions{display:flex; gap:8px; margin-top:10px}
.card-actions .btn{padding:8px 10px; font-size:13px}

.empty{
  text-align:center; padding:26px; border:1px dashed var(--border); border-radius:14px; color:var(--muted);
}

.footer{
  border-top:1px solid var(--border); color:var(--muted); padding:22px 0; background:#fff;
}

/* Carousel minimal */
.carousel{ position:relative; overflow:hidden; border-radius:16px; border:1px solid var(--border); background:#fff }
.carousel-track{ display:flex; transition:transform .5s ease }
.carousel-slide{ flex:0 0 100%; min-height:220px; display:flex; align-items:center; justify-content:space-between; gap:20px; padding:20px }
.carousel-slide .txt h3{ margin:0 0 6px 0; font-size:22px }
.carousel-slide .txt p{ margin:0; color:var(--muted) }
.carousel-ctrl{ position:absolute; top:50%; transform:translateY(-50%); background:#fff; border:1px solid var(--border); width:38px; height:38px; border-radius:999px; display:flex; align-items:center; justify-content:center }
.carousel-ctrl:hover{ background:var(--surface) }
.carousel-ctrl.prev{ left:10px }
.carousel-ctrl.next{ right:10px }
.carousel-dots{ position:absolute; bottom:10px; left:0; right:0; display:flex; gap:6px; justify-content:center }
.carousel-dots button{ width:8px; height:8px; border-radius:999px; border:0; background:#D1D5DB }
.carousel-dots button.active{ background:#111 }

.modal{
  position:fixed; inset:0; background:rgba(0,0,0,.3); display:flex; align-items:center; justify-content:center; padding:20px;
}
.sheet{
  max-width:900px; width:100%; border-radius:16px; background:#fff; border:1px solid var(--border); color:var(--text);
}
.sheet-header{ display:flex; align-items:center; justify-content:space-between; padding:14px 16px; border-bottom:1px solid var(--border) }
.sheet-body{ padding:16px; display:grid; gap:16px }
.sheet h3{ margin:0 }
.sheet .sub{ color:var(--muted); font-size:13px }

.build-list{ display:grid; gap:10px }
.build-item{ display:flex; align-items:center; justify-content:space-between; background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:10px 12px }
.build-item .left{ display:flex; flex-direction:column }
.build-item .right{ display:flex; gap:8px; align-items:center }
.build-chip{ font-size:11px; padding:4px 8px; border-radius:999px; border:1px solid var(--border) }
.build-when{ font-size:12px; color:var(--muted) }

@media (max-width: 980px){
  .search-bar{ grid-template-columns:1fr 1fr; }
  .list{ grid-template-columns:1fr 1fr; }
  .carousel-slide{ min-height:180px; flex-direction:column; align-items:flex-start }
}
@media (max-width: 640px){
  .list{ grid-template-columns:1fr; }
  .nav{ display:none; }
}
`;

// ---------- Router minimale ----------
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

// ---------- Helpers ----------
const fmtDate = (iso) => {
  try { return new Date(iso).toLocaleDateString(undefined, { day:'2-digit', month:'short', year:'numeric' }); }
  catch { return iso; }
};
const withinDate = (iso, from, to) => {
  if (!iso) return false;
  const d = new Date(iso).setHours(0,0,0,0);
  if (from && d < new Date(from).setHours(0,0,0,0)) return false;
  if (to && d > new Date(to).setHours(0,0,0,0)) return false;
  return true;
};
const addDays = (iso, days) => {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0,10);
};
const weeksBetween = (fromIso, toIso) => {
  const ms = new Date(toIso) - new Date(fromIso);
  return Math.round(ms / (7*24*3600*1000));
};

// ---------- Provider REST (solo backend) ----------
const RaceDataProvider = {
  async search(params) {
    const url = `${API_BASE}/api/races?` + new URLSearchParams(params || {}).toString();
    const res = await fetch(url, { headers:{ 'Accept':'application/json' } });
    if (!res.ok) return { races: [], total: 0 };
    const data = await res.json();
    return { races: data.races || [], total: data.total || 0 };
  },
  async getById(id) {
    const res = await fetch(`${API_BASE}/api/races/${encodeURIComponent(id)}`, { headers:{ 'Accept':'application/json' } });
    if (!res.ok) return null;
    return await res.json();
  }
};

// ---------- Wishlist (localStorage, invariata) ----------
const wlKey = 'run_wishlist';
const readWishlist = () => { try { return JSON.parse(localStorage.getItem(wlKey) || '[]'); } catch { return []; } };
const writeWishlist = (arr) => localStorage.setItem(wlKey, JSON.stringify(arr));
const useWishlist = () => {
  const [ids, setIds] = useState(readWishlist());
  const toggle = (id) => {
    setIds(prev => {
      const has = prev.includes(id);
      const next = has ? prev.filter(x=>x!==id) : [...prev, id];
      writeWishlist(next);
      return next;
    });
  };
  return { ids, toggle };
};

// ---------- UI ----------
function Header({ route }) {
  const tab = route.path.replace(/^\//,'');
  const link = (href, label) => (
    <a href={`#${href}`} className={tab===href.replace(/^\//,'') ? 'active' : ''}>{label}</a>
  );
  return (
    <header className="header">
      <div className="container header-inner">
        <div className="brand">
          <div className="brand-logo" aria-hidden />
          <div>Runshift</div>
        </div>
        <nav className="nav" aria-label="Primary">
          {link('/home','Home')}
          {link('/gare','Gare')}
          {link('/destinazioni','Destinazioni')}
          {link('/strumenti','Strumenti')}
          {link('/blog','Blog')}
          {link('/about','About')}
        </nav>
        <button className="cta" onClick={() => navigate('/gare')}>Trova una gara</button>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="container" style={{display:'flex', justifyContent:'space-between', gap:14, flexWrap:'wrap'}}>
        <div>© {new Date().getFullYear()} Runshift</div>
        <div style={{display:'flex', gap:12}}>
          <a href="#/privacy">Privacy</a>
          <a href="#/cookies">Cookie</a>
          <a href="#/contatti">Contatti</a>
        </div>
      </div>
    </footer>
  );
}

// ---- Carousel minimalista (identico stile) ----
function Carousel({ slides = [], autoMs = 4500 }) {
  const [idx, setIdx] = useState(0);
  const trackRef = useRef(null);
  useEffect(() => {
    if (!slides.length) return;
    const t = setInterval(() => setIdx(i => (i+1)%slides.length), autoMs);
    return () => clearInterval(t);
  }, [slides.length, autoMs]);
  useEffect(() => {
    if (trackRef.current) trackRef.current.style.transform = `translateX(-${idx*100}%)`;
  }, [idx]);
  if (!slides.length) return null;
  return (
    <div className="carousel" aria-roledescription="carousel">
      <div className="carousel-track" ref={trackRef}>
        {slides.map((s, i) => (
          <div className="carousel-slide" key={i} role="group" aria-label={`${i+1} di ${slides.length}`}>
            <div className="txt">
              <h3>{s.title}</h3>
              <p>{s.subtitle}</p>
              {s.cta && <div style={{marginTop:10}}><button className="btn" onClick={s.cta.onClick}>{s.cta.label}</button></div>}
            </div>
            <div style={{flex:'0 0 46%', minHeight:140, border:'1px solid var(--border)', borderRadius:12, background:'linear-gradient(135deg,#F3F4F6,#FAFAFA)'}} />
          </div>
        ))}
      </div>
      <button className="carousel-ctrl prev" aria-label="Slide precedente" onClick={()=>setIdx(i => (i-1+slides.length)%slides.length)}>‹</button>
      <button className="carousel-ctrl next" aria-label="Slide successiva" onClick={()=>setIdx(i => (i+1)%slides.length)}>›</button>
      <div className="carousel-dots" aria-hidden>
        {slides.map((_,i)=>(
          <button key={i} className={i===idx ? 'active' : ''} onClick={()=>setIdx(i)} />
        ))}
      </div>
    </div>
  );
}

function SearchHero({ initial, onSearch }) {
  const [q, setQ] = useState(initial.q || '');
  const [distance, setDistance] = useState(initial.distance || '');
  const [country, setCountry] = useState(initial.country || '');
  const [surface, setSurface] = useState(initial.surface || '');
  const [elevation, setElevation] = useState(initial.elevation || '');
  const [dateFrom, setDateFrom] = useState(initial.dateFrom || '');
  const [dateTo, setDateTo] = useState(initial.dateTo || '');

  const submit = (e) => {
    e.preventDefault();
    const params = { q, distance, country, surface, elevation, dateFrom, dateTo, page: 1, limit: 60 };
    Object.keys(params).forEach(k => { if (!params[k]) delete params[k]; });
    onSearch(params);
  };

  return (
    <div className="hero">
      <h1>Trova la tua prossima gara</h1>
      <p>Ricerca per distanza, data, paese e terreno. Stile minimal, pulsanti verde scuro.</p>
      <form className="search-bar" onSubmit={submit}>
        <div className="group">
          <label className="label">Parola chiave</label>
          <input className="input" placeholder="Nome, città, paese…" value={q} onChange={e=>setQ(e.target.value)} />
        </div>
        <div className="group">
          <label className="label">Distanza</label>
          <select value={distance} onChange={e=>setDistance(e.target.value)}>
            <option value="">Tutte</option>
            <option value="5K">5K</option>
            <option value="10K">10K</option>
            <option value="21K">21K</option>
            <option value="42K">42K</option>
          </select>
        </div>
        <div className="group">
          <label className="label">Paese</label>
          <input className="input" placeholder="Italy, Spain, France…" value={country} onChange={e=>setCountry(e.target.value)} />
        </div>
        <div className="group">
          <label className="label">Superficie</label>
          <select value={surface} onChange={e=>setSurface(e.target.value)}>
            <option value="">Tutte</option>
            <option value="road">Strada</option>
            <option value="trail">Trail</option>
            <option value="mixed">Misto</option>
          </select>
        </div>
        <div className="group">
          <label className="label">Altimetria</label>
          <select value={elevation} onChange={e=>setElevation(e.target.value)}>
            <option value="">Tutte</option>
            <option value="flat">Piatta</option>
            <option value="rolling">Ondulata</option>
            <option value="hilly">Impegnativa</option>
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
      <div className="filters-inline" aria-hidden>
        <span className={'chip' + (distance ? ' active':'')}>Distanza</span>
        <span className={'chip' + (country ? ' active':'')}>Paese</span>
        <span className={'chip' + (surface ? ' active':'')}>Superficie</span>
        <span className={'chip' + (elevation ? ' active':'')}>Altimetria</span>
        <span className={'chip' + ((dateFrom||dateTo) ? ' active':'')}>Data</span>
      </div>
    </div>
  );
}

function RaceCard({ r, wished, onWish, onOpen }) {
  return (
    <div className="card">
      <h3>{r.name}</h3>
      <div className="meta">{r.city} • {r.country} • {fmtDate(r.dateStart)}</div>
      <div className="badges">
        {Array.isArray(r.distances) && r.distances.length > 0 && <span className="badge">{r.distances.join(' / ')}</span>}
        {r.surface && <span className="badge">{r.surface}</span>}
        {r.elevationProfile && <span className="badge">{r.elevationProfile}</span>}
        {r.pbFriendly && <span className="badge good">PB-friendly</span>}
        {typeof r.priceFrom === 'number' && <span className="badge">€{r.priceFrom}+</span>}
      </div>
      <div className="card-actions">
        <button className="btn secondary" onClick={() => onOpen(r)}>Dettagli</button>
        <button className="btn" onClick={() => onWish(r.id)}>{wished ? 'Rimuovi wishlist' : 'Aggiungi wishlist'}</button>
      </div>
    </div>
  );
}

// ---- Build-Up logic (come prima) ----
const ROLE_ORDER = ['Tune-up 10K', 'Tune-up 21K', 'Test 5K', 'Dress rehearsal'];
function recommendBuildUp(target, candidates) {
  const tDate = target.dateStart;
  const from = addDays(tDate, -16*7);
  const to = addDays(tDate, -7);
  const sameSurface = target.surface;

  const base = candidates
    .filter(r => r.id !== target.id)
    .filter(r => withinDate(r.dateStart, from, to))
    .map(r => ({
      ...r,
      weeks: weeksBetween(r.dateStart, tDate),
      sameSurface: r.surface === sameSurface
    }))
    .sort((a,b) => new Date(a.dateStart) - new Date(b.dateStart));

  const picks = [];
  const isMarathon = target.distances?.includes('42K');
  const isHalf = target.distances?.includes('21K');

  const pickOne = (filterFn) => {
    const found = base
      .filter(filterFn)
      .sort((a,b) => (a.sameSurface===b.sameSurface?0:(a.sameSurface? -1:1)) || (b.weeks - a.weeks));
    if (found.length) {
      const chosen = found[0];
      if (!picks.find(x => x.id === chosen.id)) picks.push(chosen);
    }
  };

  if (isMarathon) {
    pickOne(r => r.distances?.includes('21K') && r.weeks>=5 && r.weeks<=8);
    pickOne(r => r.distances?.includes('10K') && r.weeks>=10 && r.weeks<=12);
    pickOne(r => r.distances?.includes('5K') && r.weeks>=2 && r.weeks<=4);
  } else if (isHalf) {
    pickOne(r => r.distances?.includes('10K') && r.weeks>=4 && r.weeks<=6);
    pickOne(r => r.distances?.includes('5K') && r.weeks>=2 && r.weeks<=4);
  } else {
    pickOne(r => r.distances?.includes('5K') && r.weeks>=2 && r.weeks<=4);
    pickOne(r => r.distances?.includes('10K') && r.weeks>=3 && r.weeks<=8);
  }

  if (picks.length < 2) {
    const filler = base.filter(r => !picks.find(p=>p.id===r.id)).slice(0, 2 - picks.length);
    picks.push(...filler);
  }

  return picks.map(r => {
    let role = 'Tune-up';
    if (isMarathon) {
      if (r.distances?.includes('21K')) role = 'Tune-up 21K';
      else if (r.distances?.includes('10K')) role = 'Tune-up 10K';
      else if (r.distances?.includes('5K')) role = 'Test 5K';
    } else if (isHalf) {
      if (r.distances?.includes('10K')) role = 'Tune-up 10K';
      else if (r.distances?.includes('5K')) role = 'Test 5K';
    } else {
      if (r.distances?.includes('5K')) role = 'Test 5K';
      else if (r.distances?.includes('10K')) role = 'Tune-up 10K';
    }
    return { ...r, role };
  }).sort((a,b) => ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role));
}

function RaceDetailModal({ race, onClose }) {
  const [loading, setLoading] = useState(false);
  const [build, setBuild] = useState(null);

  const generateBuild = async () => {
    setLoading(true);
    const windowFrom = addDays(race.dateStart, -16*7);
    const windowTo = addDays(race.dateStart, -7);
    const data = await RaceDataProvider.search({
      surface: race.surface || '',
      dateFrom: windowFrom,
      dateTo: windowTo,
      limit: 200,
      orderBy: 'date_start',
      orderDir: 'asc'
    });
    const recs = recommendBuildUp(race, data.races || []);
    setBuild(recs);
    setLoading(false);
  };

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label={`Dettagli ${race.name}`}>
      <div className="sheet">
        <div className="sheet-header">
          <div>
            <h3 style={{margin:0}}>{race.name}</h3>
            <div className="sub">{race.city} • {race.country} — {fmtDate(race.dateStart)} — {(race.distances||[]).join(' / ')}</div>
          </div>
          <button className="btn secondary" onClick={onClose}>Chiudi</button>
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
          </div>

          <div className="section" style={{margin:0}}>
            <h2>Build‑Up Races</h2>
            <p className="sub">Genera le gare di avvicinamento nella finestra <strong>-16 → -1 settimane</strong> dalla gara target.</p>
            <div style={{display:'flex', gap:10, flexWrap:'wrap', marginTop:8}}>
              <button className="btn" onClick={generateBuild} disabled={loading}>{loading ? 'Calcolo…' : 'Genera Build‑Up'}</button>
              {race.website && <a className="btn secondary" href={race.website} target="_blank" rel="noreferrer">Sito ufficiale</a>}
            </div>

            {build && (
              <>
                {build.length === 0 ? (
                  <div className="empty" style={{marginTop:12}}>Nessuna gara di avvicinamento trovata. Allarga i filtri o scegli un’altra target.</div>
                ) : (
                  <div className="build-list" style={{marginTop:12}}>
                    {build.map(b => (
                      <div className="build-item" key={b.id}>
                        <div className="left">
                          <strong>{b.name}</strong>
                          <span className="build-when">{b.city} • {b.country} — {fmtDate(b.dateStart)} • {weeksBetween(b.dateStart, race.dateStart)} sett. prima</span>
                        </div>
                        <div className="right">
                          <span className="build-chip">{b.role}</span>
                          <span className="build-chip">{(b.distances||[]).join(' / ')}</span>
                          <a className="btn secondary" href={`#${'/gare?id='+encodeURIComponent(b.id)}`} onClick={(e)=>{e.preventDefault(); /* apertura scheda dal listing */}}>Dettagli</a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function RacesView({ route, wishlist }) {
  // Params da URL
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

  const runSearch = async (params, append=false) => {
    setLoading(true);
    const data = await RaceDataProvider.search({
      ...params,
      page,
      limit,
      orderBy: 'date_start',
      orderDir: 'asc'
    });
    setRaces(prev => append ? [...prev, ...(data.races||[])] : (data.races||[]));
    setTotal(data.total || 0);
    setLoading(false);
  };

  useEffect(() => {
    const params = {};
    for (const [k,v] of route.query.entries()) params[k] = v;
    setPage(pageParam);
    runSearch(params, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.path, route.query.toString()]);

  const onSearch = (params) => navigate('/gare', params);
  const onOpen = (r) => setOpen(r);

  const loadMore = async () => {
    const params = {};
    for (const [k,v] of route.query.entries()) params[k] = v;
    const next = page + 1;
    setPage(next);
    const data = await RaceDataProvider.search({
      ...params, page: next, limit, orderBy: 'date_start', orderDir: 'asc'
    });
    setRaces(prev => [...prev, ...(data.races||[])]);
    setTotal(data.total || 0);
  };

  return (
    <>
      <SearchHero initial={initial} onSearch={onSearch} />
      <div className="section">
        <h2>Risultati {loading ? '…' : `(${total})`}</h2>
        {loading && races.length === 0 ? (
          <div className="empty">Carico le gare…</div>
        ) : (
          <>
            {races.length === 0 ? (
              <div className="empty">Nessuna gara trovata. Modifica i filtri o la data.</div>
            ) : (
              <div className="list">
                {races.map(r => (
                  <RaceCard
                    key={r.id}
                    r={r}
                    wished={wishlist.ids.includes(r.id)}
                    onWish={wishlist.toggle}
                    onOpen={onOpen}
                  />
                ))}
              </div>
            )}
            {races.length < total && (
              <div style={{display:'flex', justifyContent:'center', marginTop:12}}>
                <button className="btn" onClick={loadMore} disabled={loading}>
                  {loading ? 'Carico…' : 'Carica altri'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
      {open && <RaceDetailModal race={open} onClose={()=>setOpen(null)} />}
    </>
  );
}

function HomeView({ onQuickSearch }) {
  const slides = [
    { title:'Trova la tua prossima gara', subtitle:'Cerca per distanza, data, paese. Minimal, veloce.', cta:{ label:'Cerca gare', onClick:()=>onQuickSearch({}) } },
    { title:'Maratone PB-friendly', subtitle:'Filtra per percorsi piatti e veloci.', cta:{ label:'Vedi maratone', onClick:()=>onQuickSearch({ distance:'42K', elevation:'flat', surface:'road' }) } },
    { title:'Trail in Europa', subtitle:'Scopri percorsi spettacolari su sterrato.', cta:{ label:'Esplora trail', onClick:()=>onQuickSearch({ surface:'trail' }) } },
  ];

  // “In evidenza” dal backend (prime 6 per la home)
  const [featured, setFeatured] = useState([]);
  useEffect(() => {
    (async () => {
      const data = await RaceDataProvider.search({ limit: 6, orderBy: 'date_start', orderDir: 'asc' });
      setFeatured(data.races || []);
    })();
  }, []);

  return (
    <>
      <div className="hero">
        <h1>Hub per correre, semplice e pulito</h1>
        <p>Ricerca gare, destinazioni e strumenti. Design minimalista, pulsanti verde scuro.</p>
      </div>

      <Carousel slides={slides} />

      <div className="section">
        <h2>Prossimi eventi in evidenza</h2>
        {featured.length === 0 ? (
          <div className="empty">Nessun evento da mostrare al momento.</div>
        ) : (
          <div className="list">
            {featured.map(r => (
              <div className="card" key={r.id}>
                <h3>{r.name}</h3>
                <div className="meta">{r.city} • {r.country} • {fmtDate(r.dateStart)}</div>
                <div className="badges">
                  {Array.isArray(r.distances) && r.distances.length > 0 && <span className="badge">{r.distances.join(' / ')}</span>}
                  {r.pbFriendly && <span className="badge good">PB-friendly</span>}
                </div>
                <div className="card-actions">
                  <a className="btn" href="#/gare">Cerca gare</a>
                  <button className="btn secondary" onClick={()=>onQuickSearch({ country:r.country })}>Vedi in {r.country}</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="section">
        <h2>Guide essenziali</h2>
        <div className="empty">Template pronto. Potrai collegare il CMS in seguito.</div>
      </div>
    </>
  );
}

function DestinationsView() {
  return (
    <>
      <div className="hero">
        <h1>Destinazioni</h1>
        <p>Esplora paesi e città con clima, percorsi e gare vicine.</p>
      </div>
      <div className="empty">MVP: griglia destinazioni. Integrazione futura con DB.</div>
    </>
  );
}

function ToolsView() {
  const [distKm, setDistKm] = useState('21.097');
  const [time, setTime] = useState('1:45:00');
  const pace = useMemo(() => {
    const [h,m,s] = time.split(':').map(n=>parseInt(n||0,10));
    const secs = (h*3600)+(m*60)+(s||0);
    if (!secs || !parseFloat(distKm)) return '';
    const perKm = secs / parseFloat(distKm);
    const mm = Math.floor(perKm/60);
    const ss = Math.round(perKm%60).toString().padStart(2,'0');
    return `${mm}:${ss} min/km`;
  }, [distKm,time]);

  return (
    <>
      <div className="hero">
        <h1>Strumenti</h1>
        <p>Calcolatori utili per ritmo e stima tempi.</p>
        <div className="search-bar" style={{gridTemplateColumns:'1fr 1fr auto'}}>
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
      <div className="section">
        <h2>Clima storico (placeholder)</h2>
        <div className="empty">Grafico pronto per integrazione dati. Per ora mock.</div>
      </div>
    </>
  );
}

function BlogView() {
  return (
    <>
      <div className="hero">
        <h1>Blog & Stories</h1>
        <p>Template articolo lungo in arrivo.</p>
      </div>
      <div className="empty">Nessun articolo pubblicato. Alimenta dal CMS o MDX.</div>
    </>
  );
}

function AboutView() {
  return (
    <>
      <div className="hero">
        <h1>About</h1>
        <p>Runshift: scopri gare e costruisci il tuo percorso di avvicinamento con pochi clic.</p>
      </div>
      <div className="section">
        <h2>Roadmap</h2>
        <ul>
          <li>🔌 Collegamento al DB gare reale (provider) — fatto</li>
          <li>🗺️ Scheda gara estesa (Percorso, Logistica, Meteo storico)</li>
          <li>❤️ Wishlist & alert email</li>
          <li>🌍 Localizzazioni (IT/EN/FR/DE/ES)</li>
        </ul>
      </div>
    </>
  );
}

// ---------- App ----------
export default function App() {
  const [route, setRoute] = useState(parseHashRoute());
  const wishlist = useWishlist();

  useEffect(() => {
    const onHash = () => setRoute(parseHashRoute());
    window.addEventListener('hashchange', onHash);
    if (!window.location.hash) navigate('/home');
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const goQuick = (params) => navigate('/gare', params);

  let view;
  const base = route.path.split('/')[1] || 'home';
  switch (base) {
    case 'home': view = <HomeView onQuickSearch={goQuick} />; break;
    case 'gare': view = <RacesView route={route} wishlist={wishlist} />; break;
    case 'destinazioni': view = <DestinationsView />; break;
    case 'strumenti': view = <ToolsView />; break;
    case 'blog': view = <BlogView />; break;
    case 'about': view = <AboutView />; break;
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
      <Header route={route} />
      <main className="main">
        <div className="container">
          {view}
        </div>
      </main>
      <Footer />
    </>
  );
}

