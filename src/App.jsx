import React, { useEffect, useMemo, useRef, useState } from 'react';

/**
 * RUNNING SITE — Light Minimal + Build-Up Races
 * - Tema chiaro: sfondo bianco, testo nero, bottoni verde scuro.
 * - Carousel minimalista in Home (senza librerie).
 * - Motore di ricerca gare (provider adattivo: /api/races o mock).
 * - Scheda gara con "Build-Up Races": suggerisce 2–4 gare di avvicinamento in base alla distanza target e alle date.
 *
 * Compatibilità:
 * - React + Vite standard, nessuna dipendenza nuova.
 * - RaceDataProvider: usa window.RaceDataProvider se presente, altrimenti prova /api/races; fallback su mock.
 */

// ---------- THEME (Light Minimal) ----------
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

// ---------- Minimal hash router ----------
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
const fmtDate = (iso) => new Date(iso).toLocaleDateString(undefined, { day:'2-digit', month:'short', year:'numeric' });
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

// ---------- Data types ----------
/**
 * @typedef {Object} Race
 * @prop {string} id
 * @prop {string} name
 * @prop {string} city
 * @prop {string} country
 * @prop {string} dateStart  // YYYY-MM-DD
 * @prop {string=} dateEnd
 * @prop {string[]} distances // ["5K","10K","21K","42K",...]
 * @prop {'road'|'trail'|'mixed'} surface
 * @prop {'flat'|'rolling'|'hilly'=} elevationProfile
 * @prop {boolean=} pbFriendly
 * @prop {number=} priceFrom
 * @prop {string=} website
 */

// ---------- Mock (fallback) ----------
const mockRaces = [
  { id:'romemm25', name:'Rome Marathon', city:'Roma', country:'Italy', dateStart:'2025-10-19', distances:['42K'], surface:'road', elevationProfile:'rolling', pbFriendly:false, priceFrom:95, website:'https://www.runrome.com/' },
  { id:'milano21_25', name:'Milano21 Half Marathon', city:'Milano', country:'Italy', dateStart:'2025-11-23', distances:['21K','10K'], surface:'road', elevationProfile:'flat', pbFriendly:true, priceFrom:35 },
  { id:'berlin10_25', name:'Berlin 10K City', city:'Berlin', country:'Germany', dateStart:'2025-09-14', distances:['10K'], surface:'road', elevationProfile:'flat', pbFriendly:true, priceFrom:29 },
  { id:'valencia26', name:'Valencia Marathon', city:'Valencia', country:'Spain', dateStart:'2026-12-06', distances:['42K'], surface:'road', elevationProfile:'flat', pbFriendly:true, priceFrom:120 },
  { id:'amsHalf26', name:'Amsterdam Half', city:'Amsterdam', country:'Netherlands', dateStart:'2026-10-18', distances:['21K'], surface:'road', elevationProfile:'flat', pbFriendly:true, priceFrom:45 },
  { id:'edin10_26', name:'Edinburgh 10K', city:'Edinburgh', country:'UK', dateStart:'2026-05-24', distances:['10K'], surface:'road', elevationProfile:'rolling', pbFriendly:false, priceFrom:30 },
  { id:'parisHalf26', name:'Paris Half', city:'Paris', country:'France', dateStart:'2026-03-08', distances:['21K'], surface:'road', elevationProfile:'flat', pbFriendly:true, priceFrom:49 },
  { id:'madeiraTrail25', name:'Madeira Trail 25K', city:'Funchal', country:'Portugal', dateStart:'2025-12-07', distances:['25K'], surface:'trail', elevationProfile:'hilly', pbFriendly:false, priceFrom:40 },
  { id:'pragueMar26', name:'Prague Marathon', city:'Prague', country:'Czech Republic', dateStart:'2026-05-11', distances:['42K'], surface:'road', elevationProfile:'rolling', pbFriendly:false, priceFrom:98 },
  { id:'cphHalf26', name:'Copenhagen Half', city:'Copenhagen', country:'Denmark', dateStart:'2026-09-20', distances:['21K'], surface:'road', elevationProfile:'flat', pbFriendly:true, priceFrom:58 },
  { id:'munich10_26', name:'Munich 10K Night', city:'Munich', country:'Germany', dateStart:'2026-07-04', distances:['10K'], surface:'road', elevationProfile:'flat', pbFriendly:true, priceFrom:25 },
  { id:'osloHalf26', name:'Oslo Half', city:'Oslo', country:'Norway', dateStart:'2026-09-13', distances:['21K'], surface:'road', elevationProfile:'rolling', pbFriendly:false, priceFrom:55 },
  { id:'zurichMar26', name:'Zurich Marathon', city:'Zurich', country:'Switzerland', dateStart:'2026-04-19', distances:['42K','10K'], surface:'road', elevationProfile:'rolling', pbFriendly:false, priceFrom:110 },
  { id:'viennaMar26', name:'Vienna City Marathon', city:'Vienna', country:'Austria', dateStart:'2026-04-12', distances:['42K','21K'], surface:'road', elevationProfile:'flat', pbFriendly:true, priceFrom:99 },
  { id:'seville26', name:'Seville Marathon', city:'Seville', country:'Spain', dateStart:'2026-02-23', distances:['42K'], surface:'road', elevationProfile:'flat', pbFriendly:true, priceFrom:85 },
];

// ---------- Provider adattivo ----------
const RaceDataProvider = (() => {
  if (typeof window !== 'undefined' && window.RaceDataProvider && typeof window.RaceDataProvider.search === 'function') {
    return window.RaceDataProvider;
  }
  const restProvider = {
    async search(params) {
      try {
        const url = '/api/races?' + new URLSearchParams(params).toString();
        const res = await fetch(url, { headers:{ 'Accept':'application/json' } });
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.races)) return data;
        }
      } catch (e) { /* fallback */ }
      // Fallback mock
      const { q, distance, country, surface, elevation, dateFrom, dateTo } = params || {};
      let filtered = [...mockRaces];
      if (q) {
        const s = String(q).toLowerCase();
        filtered = filtered.filter(r =>
          r.name.toLowerCase().includes(s) ||
          r.city.toLowerCase().includes(s) ||
          r.country.toLowerCase().includes(s)
        );
      }
      if (distance) {
        const wanted = distance.split(',').map(x=>x.trim());
        filtered = filtered.filter(r => r.distances.some(d => wanted.includes(d)));
      }
      if (country) {
        const c = String(country).toLowerCase();
        filtered = filtered.filter(r => r.country.toLowerCase().includes(c));
      }
      if (surface) {
        const s = surface.split(',').map(x=>x.trim());
        filtered = filtered.filter(r => s.includes(r.surface));
      }
      if (elevation) {
        const e = elevation.split(',').map(x=>x.trim());
        filtered = filtered.filter(r => e.includes(r.elevationProfile || ''));
      }
      if (dateFrom || dateTo) {
        filtered = filtered.filter(r => withinDate(r.dateStart, dateFrom, dateTo));
      }
      return { races: filtered, total: filtered.length };
    },
    async getById(id) {
      try {
        const res = await fetch('/api/races/' + id, { headers:{ 'Accept':'application/json' } });
        if (res.ok) return await res.json();
      } catch (_) {}
      return mockRaces.find(r => r.id === id) || null;
    }
  };
  return restProvider;
})();

// ---------- Wishlist (localStorage) ----------
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

// ---------- Components ----------
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

// ---- Carousel minimalista (Home) ----
function Carousel({ slides = [], autoMs = 4500 }) {
  const [idx, setIdx] = useState(0);
  const trackRef = useRef(null);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i+1)%slides.length), slides.length ? autoMs : 99999999);
    return () => clearInterval(t);
  }, [slides.length, autoMs]);
  useEffect(() => {
    if (trackRef.current) {
      trackRef.current.style.transform = `translateX(-${idx*100}%)`;
    }
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
    const params = { q, distance, country, surface, elevation, dateFrom, dateTo };
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
            <option value="25K">25K</option>
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
        <span className="badge">{r.distances.join(' / ')}</span>
        <span className="badge">{r.surface}</span>
        {r.elevationProfile && <span className="badge">{r.elevationProfile}</span>}
        {r.pbFriendly && <span className="badge good">PB-friendly</span>}
        {r.priceFrom ? <span className="badge">€{r.priceFrom}+</span> : null}
      </div>
      <div className="card-actions">
        <button className="btn secondary" onClick={() => onOpen(r)}>Dettagli</button>
        <button className="btn" onClick={() => onWish(r.id)}>{wished ? 'Rimuovi wishlist' : 'Aggiungi wishlist'}</button>
      </div>
    </div>
  );
}

// ---- Build-Up logic ----
const ROLE_ORDER = ['Tune-up 10K', 'Tune-up 21K', 'Test 5K', 'Dress rehearsal'];
function chooseRole(distanceList) {
  if (distanceList.includes('42K')) return 'Target Marathon';
  if (distanceList.includes('21K')) return 'Target Half';
  if (distanceList.includes('10K')) return 'Target 10K';
  return 'Target Race';
}

function recommendBuildUp(target, candidates) {
  // Regole base:
  // - Finestra: da -16 settimane a -1 settimana dalla target
  // - Priorità distanze: per 42K -> 21K (–5/–8w) e 10K (–10/–12w); per 21K -> 10K (–4/–6w) e 5K (–2/–4w)
  // - Coerenza superficie: preferisci stessa surface target
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

  const isMarathon = target.distances.includes('42K');
  const isHalf = target.distances.includes('21K');

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
    pickOne(r => r.distances.includes('21K') && r.weeks>=5 && r.weeks<=8);   // Half chiave
    pickOne(r => r.distances.includes('10K') && r.weeks>=10 && r.weeks<=12); // 10K
    pickOne(r => r.distances.includes('5K') && r.weeks>=2 && r.weeks<=4);    // 5K
  } else if (isHalf) {
    pickOne(r => r.distances.includes('10K') && r.weeks>=4 && r.weeks<=6);
    pickOne(r => r.distances.includes('5K') && r.weeks>=2 && r.weeks<=4);
  } else {
    // Target 10K o altro
    pickOne(r => r.distances.includes('5K') && r.weeks>=2 && r.weeks<=4);
    pickOne(r => r.distances.includes('10K') && r.weeks>=3 && r.weeks<=8);
  }

  // Riempimento se pochi risultati
  if (picks.length < 2) {
    const filler = base.filter(r => !picks.find(p=>p.id===r.id)).slice(0, 2 - picks.length);
    picks.push(...filler);
  }

  // Assegna ruolo
  return picks.map(r => {
    let role = 'Tune-up';
    if (isMarathon) {
      if (r.distances.includes('21K')) role = 'Tune-up 21K';
      else if (r.distances.includes('10K')) role = 'Tune-up 10K';
      else if (r.distances.includes('5K')) role = 'Test 5K';
    } else if (isHalf) {
      if (r.distances.includes('10K')) role = 'Tune-up 10K';
      else if (r.distances.includes('5K')) role = 'Test 5K';
    } else {
      if (r.distances.includes('5K')) role = 'Test 5K';
      else if (r.distances.includes('10K')) role = 'Tune-up 10K';
    }
    return { ...r, role };
  }).sort((a,b) => ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role));
}

function RaceDetailModal({ race, onClose }) {
  const [loading, setLoading] = useState(false);
  const [build, setBuild] = useState(null);

  const generateBuild = async () => {
    setLoading(true);
    // cerca candidati nella finestra (le regole sono dentro recommendBuildUp)
    const windowFrom = addDays(race.dateStart, -16*7);
    const windowTo = addDays(race.dateStart, -7);
    // usa filters generici + stessa surface per priorità (comunque la logica pesa la surface)
    const data = await RaceDataProvider.search({
      surface: race.surface,
      dateFrom: windowFrom,
      dateTo: windowTo
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
            <div className="sub">{race.city} • {race.country} — {fmtDate(race.dateStart)} — {race.distances.join(' / ')}</div>
          </div>
          <button className="btn secondary" onClick={onClose}>Chiudi</button>
        </div>
        <div className="sheet-body">
          <div className="section" style={{margin:0}}>
            <h2>Overview</h2>
            <div className="badges" style={{marginTop:8}}>
              <span className="badge">{race.surface}</span>
              {race.elevationProfile && <span className="badge">{race.elevationProfile}</span>}
              {race.pbFriendly && <span className="badge good">PB-friendly</span>}
              {race.priceFrom ? <span className="badge">€{race.priceFrom}+</span> : null}
            </div>
          </div>

          <div className="section" style={{margin:0}}>
            <h2>Build‑Up Races</h2>
            <p className="sub">Seleziona questa gara come <strong>target</strong> e genera un percorso di avvicinamento automatico.</p>
            <div style={{display:'flex', gap:10, flexWrap:'wrap', marginTop:8}}>
              <button className="btn" onClick={generateBuild} disabled={loading}>{loading ? 'Calcolo…' : 'Genera Build‑Up'}</button>
              {race.website && <a className="btn secondary" href={race.website} target="_blank" rel="noreferrer">Sito ufficiale</a>}
            </div>

            {build && (
              <>
                {build.length === 0 ? (
                  <div className="empty" style={{marginTop:12}}>Nessuna gara di avvicinamento trovata nella finestra -16 → -1 settimane. Allarga i filtri o cambia target.</div>
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
                          <span className="build-chip">{b.distances.join(' / ')}</span>
                          <a className="btn secondary" href={`#${'/gare?id='+encodeURIComponent(b.id)}`} onClick={(e)=>{e.preventDefault(); alert('Apri la scheda di questa gara dalla ricerca.');}}>Dettagli</a>
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
  const initial = useMemo(()=>({ q, distance, country, surface, elevation, dateFrom, dateTo }), [q,distance,country,surface,elevation,dateFrom,dateTo]);

  const [loading, setLoading] = useState(false);
  const [races, setRaces] = useState([]);
  const [total, setTotal] = useState(0);
  const [open, setOpen] = useState(null);

  const runSearch = async (params) => {
    setLoading(true);
    const data = await RaceDataProvider.search(params);
    setRaces(data.races || []);
    setTotal(data.total || 0);
    setLoading(false);
  };

  useEffect(() => {
    const params = {};
    for (const [k,v] of route.query.entries()) params[k] = v;
    runSearch(params);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.path, route.query.toString()]);

  const onSearch = (params) => navigate('/gare', params);
  const onOpen = (r) => setOpen(r);

  return (
    <>
      <SearchHero initial={initial} onSearch={onSearch} />
      <div className="section">
        <h2>Risultati {loading ? '…' : `(${total})`}</h2>
        {loading ? <div className="empty">Carico le gare…</div> :
          (races.length === 0 ? <div className="empty">Nessuna gara trovata. Prova a cambiare filtri o data.</div> :
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
          )
        }
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
  return (
    <>
      <div className="hero">
        <h1>Hub per correre, semplice e pulito</h1>
        <p>Ricerca gare, destinazioni e strumenti. Design minimalista, pulsanti verde scuro.</p>
      </div>

      <Carousel slides={slides} />

      <div className="section">
        <h2>Prossimi eventi in evidenza</h2>
        <div className="list">
          {mockRaces.slice(0,6).map(r => (
            <div className="card" key={r.id}>
              <h3>{r.name}</h3>
              <div className="meta">{r.city} • {r.country} • {fmtDate(r.dateStart)}</div>
              <div className="badges">
                <span className="badge">{r.distances.join(' / ')}</span>
                {r.pbFriendly && <span className="badge good">PB-friendly</span>}
              </div>
              <div className="card-actions">
                <a className="btn" href="#/gare">Cerca gare</a>
                <button className="btn secondary" onClick={()=>onQuickSearch({ country:r.country })}>Vedi in {r.country}</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <h2>Guide essenziali</h2>
        <div className="empty">Template pronto. Puoi collegare il CMS in seguito.</div>
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
          <li>🔌 Collegamento al DB gare reale (provider)</li>
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
