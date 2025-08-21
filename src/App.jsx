import React, { useEffect, useMemo, useState } from 'react';

/**
 * RUNNING SITE — Dark Autumn + Race Search
 * - Hash router senza dipendenze (#/home, #/gare?...)
 * - Ricerca gare: keyword, distanza, paese, date, superficie, altimetria
 * - Provider adattivo:
 *     1) Se esiste /api/races (JSON: { races: Race[], total: number }), lo usa.
 *     2) Altrimenti mock locale (subset europeo 2025–2026).
 * - Wishlist su localStorage
 *
 * NOTE:
 * - Nessuna nuova libreria. Funziona con React + Vite standard.
 * - Facilmente collegabile al DB reale (basta implementare /api/races o esporre window.RaceDataProvider).
 */

// ---------- CSS THEME (Dark Autumn) ----------
const CSS = `
:root{
  --autumn-bg:#0F1210;
  --autumn-surface:#151915;
  --autumn-elevated:#1B211C;
  --autumn-primary:#C06B2C;
  --autumn-primary-600:#A85E26;
  --autumn-accent:#8E2F34;
  --autumn-accent-600:#75262A;
  --autumn-olive:#7A6E2F;
  --text-high:#F3F4F2;
  --text-medium:#C8CEC9;
  --text-muted:#96A099;
  --border:#2A2F2B;
  --success:#4C9A69;
  --warning:#C69C3A;
  --error:#D06A6A;
}
*{box-sizing:border-box}
html,body,#root{height:100%}
body{
  margin:0;
  background:var(--autumn-bg);
  color:var(--text-high);
  font-family:Inter,system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif;
  -webkit-font-smoothing:antialiased; -moz-osx-font-smoothing:grayscale;
}
a{color:inherit; text-decoration:none}
button{font:inherit}
.container{max-width:1200px; margin:0 auto; padding:0 20px}
.header{
  position:sticky; top:0; z-index:10;
  background:rgba(21,25,21,.9); backdrop-filter:saturate(150%) blur(8px);
  border-bottom:1px solid var(--border);
}
.header-inner{display:flex; align-items:center; justify-content:space-between; height:64px}
.brand{display:flex; align-items:center; gap:10px; font-weight:700}
.brand-logo{width:28px; height:28px; border-radius:8px; background:linear-gradient(135deg,var(--autumn-primary),var(--autumn-accent))}
.nav{display:flex; gap:14px; align-items:center}
.nav a{
  padding:8px 12px; border-radius:12px; color:var(--text-medium);
}
.nav a.active, .nav a:hover{ background:var(--autumn-elevated); color:var(--text-high) }
.cta{
  background:var(--autumn-primary); color:#0F0F0F; border:0; padding:10px 14px; border-radius:12px; cursor:pointer;
}
.cta:hover{ background:var(--autumn-primary-600) }

.main{padding:28px 0 60px}
.hero{
  background:radial-gradient(1200px 500px at 10% -10%, rgba(192,107,44,.14), transparent),
             radial-gradient(800px 400px at 95% 0%, rgba(142,47,52,.10), transparent),
             var(--autumn-surface);
  border:1px solid var(--border); border-radius:24px; padding:28px; margin-bottom:24px;
}
.hero h1{margin:0 0 10px 0; font-size:28px}
.hero p{margin:0; color:var(--text-medium)}

.search-bar{display:grid; grid-template-columns:1.2fr .8fr .8fr .9fr .7fr auto; gap:10px; margin-top:18px}
.input, select, .date input{
  width:100%; background:var(--autumn-elevated); color:var(--text-high);
  border:1px solid var(--border); border-radius:12px; padding:10px 12px;
}
.label{font-size:12px; color:var(--text-muted); margin-bottom:6px}
.group{display:flex; flex-direction:column}
.btn{
  background:var(--autumn-primary); color:#111; border:0; border-radius:12px; padding:12px 16px; cursor:pointer; font-weight:600;
}
.btn.secondary{ background:transparent; color:var(--text-high); border:1px solid var(--border) }
.btn:hover{ filter:saturate(110%) }
.filters-inline{display:flex; flex-wrap:wrap; gap:8px; margin:10px 0 0}
.chip{
  font-size:12px; color:var(--text-medium); background:transparent; border:1px solid var(--border);
  border-radius:999px; padding:6px 10px;
}
.chip.active{ color:var(--text-high); background:var(--autumn-elevated) }

.list{display:grid; grid-template-columns:repeat(3,1fr); gap:14px; margin-top:14px}
.card{
  background:var(--autumn-surface); border:1px solid var(--border); border-radius:20px; padding:14px;
}
.card h3{margin:0 0 2px 0; font-size:16px}
.meta{color:var(--text-medium); font-size:13px}
.badges{display:flex; gap:6px; margin-top:8px; flex-wrap:wrap}
.badge{font-size:11px; padding:4px 8px; border:1px solid var(--border); border-radius:999px; color:var(--text-medium)}
.badge.good{border-color:transparent; background:rgba(76,154,105,.18); color:#bfe4c9}
.card-actions{display:flex; gap:8px; margin-top:10px}
.card-actions .btn{padding:8px 10px; font-size:13px}
.empty{
  text-align:center; padding:30px; border:1px dashed var(--border); border-radius:20px; color:var(--text-medium);
  background:linear-gradient(180deg,rgba(255,255,255,0.00),rgba(255,255,255,0.02));
}

.section{background:var(--autumn-surface); border:1px solid var(--border); border-radius:20px; padding:18px; margin:14px 0}
.section h2{margin:0 0 10px 0; font-size:20px}

.footer{
  border-top:1px solid var(--border); color:var(--text-muted); padding:22px 0; background:var(--autumn-surface)
}

@media (max-width: 980px){
  .search-bar{ grid-template-columns:1fr 1fr; }
  .list{ grid-template-columns:1fr 1fr; }
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

// ---------- Data types ----------
/**
 * @typedef {Object} Race
 * @prop {string} id
 * @prop {string} name
 * @prop {string} city
 * @prop {string} country
 * @prop {string} dateStart  // YYYY-MM-DD
 * @prop {string=} dateEnd
 * @prop {string[]} distances // e.g. ["5K","10K","21K","42K"]
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
  // Priorità 1: provider custom già esposto (per integrazione tua)
  if (typeof window !== 'undefined' && window.RaceDataProvider && typeof window.RaceDataProvider.search === 'function') {
    return window.RaceDataProvider;
  }
  // Priorità 2: API REST /api/races
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
      // Fallback mock locale
      const { q, distance, country, surface, elevation, dateFrom, dateTo } = params;
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
      // prova REST, altrimenti mock
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
const readWishlist = () => {
  try { return JSON.parse(localStorage.getItem(wlKey) || '[]'); } catch { return []; }
};
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
        <div>© {new Date().getFullYear()} Runshift — Dark Autumn</div>
        <div style={{display:'flex', gap:12}}>
          <a href="#/privacy">Privacy</a>
          <a href="#/cookies">Cookie</a>
          <a href="#/contatti">Contatti</a>
        </div>
      </div>
    </footer>
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
    // pulizia params vuoti
    Object.keys(params).forEach(k => { if (!params[k]) delete params[k]; });
    onSearch(params);
  };

  return (
    <div className="hero">
      <h1>Trova la tua prossima gara</h1>
      <p>Ricerca per distanza, data, paese e terreno. Tema <strong>Dark Autumn</strong> sempre attivo.</p>
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

function RacesView({ route, wishlist }) {
  // Leggi parametri da URL
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

  const onSearch = (params) => {
    navigate('/gare', params);
  };

  const onOpen = (r) => {
    navigate('/gare/'+encodeURIComponent(r.id));
    alert(`Scheda gara (MVP): ${r.name}\n\nSuggerimento: in futuro qui si apre la pagina con tab Percorso/Logistica/Iscrizione.`);
  };

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
    </>
  );
}

function HomeView({ onQuickSearch }) {
  return (
    <>
      <div className="hero">
        <h1>Il tuo hub per correre e viaggiare</h1>
        <p>Scopri gare, destinazioni e strumenti per prepararti. Stile ispirato a un portale di viaggio, ma 100% running.</p>
        <div style={{display:'flex', gap:10, marginTop:12, flexWrap:'wrap'}}>
          <button className="btn" onClick={()=>onQuickSearch({ distance:'21K', surface:'road' })}>Mezze maratone</button>
          <button className="btn secondary" onClick={()=>onQuickSearch({ distance:'42K', surface:'road', elevation:'flat' })}>Maratone PB</button>
          <button className="btn secondary" onClick={()=>onQuickSearch({ surface:'trail' })}>Trail in Europa</button>
        </div>
      </div>
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
        <div className="empty">Template guide pronto. Potrai alimentarlo dal tuo CMS o MDX.</div>
      </div>
    </>
  );
}

function DestinationsView() {
  return (
    <>
      <div className="hero">
        <h1>Destinazioni</h1>
        <p>Esplora paesi e città: quando andare, clima, percorsi di allenamento e gare vicine.</p>
      </div>
      <div className="empty">MVP: griglia destinazioni. Integrazione futura col DB (conteggio gare per paese).</div>
    </>
  );
}

function ToolsView() {
  const [distKm, setDistKm] = useState('21.097');
  const [time, setTime] = useState('1:45:00');
  const pace = useMemo(() => {
    // pace in min/km
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
        <p>Template articolo lungo con TOC e callout in arrivo.</p>
      </div>
      <div className="empty">Nessun articolo pubblicato. Aggiungi contenuti dal tuo CMS o file MDX.</div>
    </>
  );
}

function AboutView() {
  return (
    <>
      <div className="hero">
        <h1>About</h1>
        <p>Runshift aiuta i runner a scoprire gare e destinazioni in Europa (2025–2026) con un motore di ricerca integrato.</p>
      </div>
      <div className="section">
        <h2>Roadmap</h2>
        <ul>
          <li>🔌 Collegamento al DB gare reale (provider)</li>
          <li>🗺️ Scheda gara completa (Percorso, Logistica, Meteo storico)</li>
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
