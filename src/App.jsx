import React, { useEffect, useMemo, useRef, useState } from 'react';

/**
 * Runshift Frontend — Home + Search + Race Details + Build-Up Planner
 * - Design: sfondo bianco, testo nero, pulsanti verde scuro (dark autumn)
 * - Router hash (#/home, #/search, #/race?id=..., #/build)
 * - Filtri con distanze dinamiche dal DB per evitare mismatch
 * - Race details con "Inizia il percorso"
 * - Ricerca: cards con foto (placeholder), "Dettagli" e "Seleziona come target" (una sola target)
 * - Build-Up Planner: 3 slot con suggerimenti; sostituzione con alternative (stessa distanza e finestra)
 */

const API_BASE = "https://backend-db-corse-v2.onrender.com";

/* ============================ STYLES ============================ */
const CSS = `
:root{
  --bg:#FFFFFF;
  --text:#0A0A0A;
  --muted:#585858;
  --border:#E6E6E0;
  --surface:#F7F7F5;
  --primary:#0B5D41;
  --primary-600:#094F37;
  --accent:#C2702B; /* warm autumn touch */
  --ring:rgba(11,93,65,.22);
}
*{box-sizing:border-box}
html,body,#root{height:100%}
body{margin:0;background:var(--bg);color:var(--text);font-family:Inter,system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased}
a{color:inherit;text-decoration:none}
button{font:inherit;cursor:pointer}

/* Header */
.header{position:sticky;top:0;z-index:20;background:rgba(255,255,255,.9);backdrop-filter:saturate(140%) blur(10px);border-bottom:1px solid var(--border)}
.header-inner{max-width:1280px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;height:68px;padding:0 20px}
.brand{display:flex;align-items:center;gap:10px;font-weight:800;letter-spacing:.2px}
.logo-box{width:30px;height:30px;border-radius:7px;position:relative;background:conic-gradient(from 190deg at 50% 50%, #0B5D41, #0F6A4A, #0B5D41)}
.logo-road{position:absolute;left:7px;top:18px;width:16px;height:3px;background:#fff;transform:rotate(-28deg);border-radius:2px}
.nav{display:flex;gap:8px}
.nav a{padding:8px 12px;border-radius:10px;color:var(--muted)}
.nav a.active,.nav a:hover{background:var(--surface);color:var(--text)}
.cta{background:var(--primary);color:#fff;border:0;padding:10px 14px;border-radius:12px;box-shadow:0 4px 14px rgba(11,93,65,.2)}
.cta:hover{background:var(--primary-600)}

main{padding:16px 0 60px}

/* Sections / Cards */
.container{max-width:1280px;margin:0 auto;padding:0 20px}
.hero{
  background:radial-gradient(1200px 600px at 10% -10%, #EDF6F3 0, transparent 60%),
             radial-gradient(1000px 500px at 100% 0%, #EEF7F5 0, transparent 60%),
             var(--surface);
  border:1px solid var(--border);border-radius:22px;padding:26px;margin-bottom:16px
}
.hero h1{margin:8px 0 6px 0;font-size:46px;line-height:1.05;letter-spacing:-.3px}
.hero p{margin:0;color:var(--muted);font-size:16px}
.hero-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:12px}
.btn{background:var(--primary);color:#fff;border:0;border-radius:12px;padding:12px 14px;font-weight:700}
.btn:hover{background:var(--primary-600)}
.btn.secondary{background:#fff;color:var(--text);border:1px solid var(--border)}
.btn.ghost{background:transparent;border:1px dashed var(--border);color:var(--text)}

.section{background:#fff;border:1px solid var(--border);border-radius:20px;padding:18px;margin:14px 0}
.section h2{margin:0 0 10px 0;font-size:22px}

/* Form */
.input, select, .date input{width:100%;background:#fff;color:var(--text);border:1px solid var(--border);border-radius:12px;padding:12px 14px;outline:none;transition:border .15s, box-shadow .15s}
.input:focus, select:focus, .date input:focus{border-color:var(--primary);box-shadow:0 0 0 4px var(--ring)}
.group{display:flex;flex-direction:column}
.label{font-size:12px;color:var(--muted);margin-bottom:6px}
.search-bar{display:grid;grid-template-columns:1.2fr .7fr .8fr .8fr .7fr auto;gap:10px}

/* Lists / Cards */
.list{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.card{background:linear-gradient(180deg,#fff,#fbfbf9);border:1px solid var(--border);border-radius:16px;padding:14px;box-shadow:0 4px 18px rgba(0,0,0,.04)}
.card h3{margin:0 0 4px 0;font-size:16px}
.meta{color:var(--muted);font-size:13px}
.badges{display:flex;gap:6px;margin-top:8px;flex-wrap:wrap}
.badge{font-size:11px;padding:4px 8px;border:1px solid var(--border);border-radius:999px;background:#fff}
.badge.good{background:rgba(19,121,91,.10);border-color:transparent;color:#0b5d41}
.card-actions{display:flex;gap:8px;margin-top:10px}
.card-actions .btn{padding:8px 10px;font-size:13px}

/* Placeholders immagini */
.thumb{height:180px;border-radius:12px;background:linear-gradient(120deg,#EEE,#E9E9E2);border:1px solid var(--border);margin-bottom:10px}

/* Empty */
.empty{text-align:center;padding:26px;border:1px dashed var(--border);border-radius:14px;color:var(--muted)}

/* Modal / Sheet */
.modal{position:fixed;inset:0;background:rgba(0,0,0,.28);display:flex;align-items:center;justify-content:center;padding:20px;z-index:30}
.sheet{max-width:960px;width:100%;border-radius:18px;background:#fff;border:1px solid var(--border);color:var(--text)}
.sheet-header{display:flex;align-items:center;justify-content:space-between;padding:16px 18px;border-bottom:1px solid var(--border)}
.sheet-body{padding:18px;display:grid;gap:16px}
.sheet h3{margin:0}
.sheet .sub{color:var(--muted);font-size:13px}

/* Build-up planner */
.timeline{position:relative;margin-top:8px;border-top:6px solid var(--border);height:70px}
.milestone{position:absolute;top:-16px;transform:translateX(-50%)}
.dot{width:28px;height:28px;border-radius:999px;display:inline-block;background:var(--primary);border:2px solid #fff;box-shadow:0 3px 12px rgba(0,0,0,.06)}
.dot.target{background:var(--accent)}
.milabel{display:block;margin-top:8px;text-align:center;font-size:12px;color:var(--muted)}
.slot{border:1px solid var(--border);border-radius:14px;padding:12px;background:#fff}
.slot h4{margin:0 0 8px 0}
.altlist{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.altcard{border:1px solid var(--border);border-radius:12px;padding:10px;background:#fff}
.altcard .thumb{height:110px}
.altcard .meta{font-size:12px}

.footer{border-top:1px solid var(--border);color:var(--muted);padding:22px 0;background:#fff}
@media (max-width:1100px){.list{grid-template-columns:repeat(2,1fr)}}
@media (max-width:740px){.search-bar{grid-template-columns:1fr 1fr}.list{grid-template-columns:1fr}.nav{display:none}}
`;

/* ============================ MINI-ROUTER ============================ */
function parseHashRoute(){
  const raw = window.location.hash || '#/home';
  const [pathPart, queryPart] = raw.replace(/^#/, '').split('?');
  const path = pathPart || '/home';
  const query = new URLSearchParams(queryPart || '');
  return { path, query };
}
function navigate(path, params){
  const qs = params ? `?${new URLSearchParams(params).toString()}` : '';
  window.location.hash = `${path}${qs}`;
}

/* ============================ HELPERS ============================ */
const fmtDate = (iso) => {
  if (!iso) return '';
  try { return new Date(iso).toLocaleDateString(undefined, { day:'2-digit', month:'short', year:'numeric' }); }
  catch { return iso; }
};
const addDays = (iso, days) => { const d=new Date(iso); d.setDate(d.getDate()+days); return d.toISOString().slice(0,10); };
const weeksBetween = (a,b) => Math.round((new Date(b)-new Date(a))/(7*24*3600*1000));
const withinDate = (iso, from, to) => {
  if (!iso) return false;
  const d = new Date(iso).setHours(0,0,0,0);
  if (from && d < new Date(from).setHours(0,0,0,0)) return false;
  if (to && d > new Date(to).setHours(0,0,0,0)) return false;
  return true;
};
const hasKm = (race, kmText) => (race.distances||[]).some(d => String(d).includes(kmText));

/* ============================ API PROVIDER ============================ */
const RaceAPI = {
  async search(params){
    const url = `${API_BASE}/api/races?` + new URLSearchParams(params || {}).toString();
    const res = await fetch(url, { headers:{ 'Accept':'application/json' } }).catch(()=>null);
    if (!res || !res.ok) return { races:[], total:0 };
    const data = await res.json().catch(()=>({races:[], total:0}));
    return { races: data.races || [], total: data.total || 0 };
  },
  async getById(id){
    const res = await fetch(`${API_BASE}/api/races/${encodeURIComponent(id)}`, { headers:{ 'Accept':'application/json' } }).catch(()=>null);
    if (!res || !res.ok) return null;
    return await res.json().catch(()=>null);
  }
};

/* ============================ HEADER / FOOTER ============================ */
function Header({ route }){
  const tab = route.path.replace(/^\//,'');
  const link = (href, label) => <a href={`#${href}`} className={tab===href.replace(/^\//,'') ? 'active' : ''}>{label}</a>;
  return (
    <header className="header">
      <div className="header-inner">
        <div className="brand">
          <div className="logo-box"><div className="logo-road" /></div>
          <div>Runshift</div>
        </div>
        <nav className="nav" aria-label="Primary">
          {link('/home','Home')}
          {link('/search','Gare')}
          {link('/build','Build‑Up')}
          {link('/about','About')}
        </nav>
        <button className="cta" onClick={()=>navigate('/search')}>Trova gare</button>
      </div>
    </header>
  );
}
function Footer(){
  return (
    <footer className="footer">
      <div className="container" style={{display:'flex',justifyContent:'space-between',gap:14,flexWrap:'wrap'}}>
        <div>© {new Date().getFullYear()} Runshift</div>
        <div style={{display:'flex',gap:12}}>
          <a href="#/privacy">Privacy</a>
          <a href="#/cookies">Cookie</a>
          <a href="#/contatti">Contatti</a>
        </div>
      </div>
    </footer>
  );
}

/* ============================ HOME ============================ */
function Home({ onQuickSearch }){
  const [featured, setFeatured] = useState([]);
  useEffect(()=>{ (async()=>{
    const data = await RaceAPI.search({ limit: 6, orderBy:'date_start', orderDir:'asc' });
    setFeatured(data.races||[]);
  })(); },[]);
  return (
    <>
      <div className="container">
        <div className="hero">
          <h1>Corri. Scopri. Superati.</h1>
          <p>Trova la tua prossima sfida, costruisci il tuo percorso e vivi l’avventura della corsa.</p>
          <div className="hero-actions">
            <button className="btn" onClick={()=>onQuickSearch({})}>Trova la tua gara</button>
            <button className="btn secondary" onClick={()=>onQuickSearch({ surface:'trail' })}>Esplora trail</button>
          </div>
        </div>

        <div className="section">
          <h2>Gare in evidenza</h2>
          {featured.length===0 ? <div className="empty">Nessun evento da mostrare.</div> : (
            <div className="list">
              {featured.map(r=>(
                <div className="card" key={r.id}>
                  <div className="thumb" />
                  <h3>{r.name}</h3>
                  <div className="meta">{r.city} • {r.country} • {fmtDate(r.dateStart)}</div>
                  <div className="badges">
                    {Array.isArray(r.distances) && r.distances.length>0 && <span className="badge">{r.distances.join(' / ')}</span>}
                    {r.pbFriendly && <span className="badge good">PB-friendly</span>}
                  </div>
                  <div className="card-actions">
                    <a className="btn" href={`#/race?id=${encodeURIComponent(r.id)}`}>Dettagli</a>
                    <button className="btn secondary" onClick={()=>navigate('/build', { targetId:r.id })}>Inizia il percorso</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="section">
          <h2>Perché Runshift</h2>
          <div className="list" style={{gridTemplateColumns:'repeat(3,1fr)'}}>
            {[
              {t:'🌍 Esplora',d:'Migliaia di gare nel mondo'},
              {t:'🏔 Vivi l’avventura',d:'Dalle strade ai trail epici'},
              {t:'⏱ Superati',d:'Pianifica e raggiungi obiettivi'},
            ].map((k,i)=>(
              <div key={i} className="card">
                <h3>{k.t}</h3>
                <p className="meta">{k.d}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

/* ============================ SEARCH ============================ */
function SearchBar({ initial, facets, onSearch }){
  const [q,setQ] = useState(initial.q||'');
  const [distance,setDistance] = useState(initial.distance||'');
  const [country,setCountry] = useState(initial.country||'');
  const [surface,setSurface] = useState(initial.surface||'');
  const [dateFrom,setDateFrom] = useState(initial.dateFrom||'');
  const [dateTo,setDateTo] = useState(initial.dateTo||'');

  const submit = (e) => {
    e.preventDefault();
    const params = { q, distance, country, surface, dateFrom, dateTo, page:1, limit:60 };
    Object.keys(params).forEach(k=>{ if(!params[k]) delete params[k]; });
    onSearch(params);
  };

  return (
    <form className="hero" onSubmit={submit}>
      <h1>Trova la tua prossima gara</h1>
      <p>Filtri sincronizzati ai dati reali del DB.</p>
      <div className="search-bar" style={{marginTop:12}}>
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
          <label className="label">Data</label>
          <div className="date" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
            <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} />
            <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} min={dateFrom || undefined} />
          </div>
        </div>
        <div className="group" style={{alignSelf:'end'}}>
          <button className="btn" type="submit">Cerca</button>
        </div>
      </div>
    </form>
  );
}
function SearchPage({ route }){
  const q = route.query.get('q') || '';
  const distance = route.query.get('distance') || '';
  const country = route.query.get('country') || '';
  const surface = route.query.get('surface') || '';
  const dateFrom = route.query.get('dateFrom') || '';
  const dateTo = route.query.get('dateTo') || '';
  const pageParam = parseInt(route.query.get('page') || '1', 10);
  const limitParam = parseInt(route.query.get('limit') || '60', 10);

  const [facets, setFacets] = useState({ distances:[], surfaces:[] });
  const [loading, setLoading] = useState(false);
  const [races, setRaces] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(pageParam);
  const limit = limitParam;

  // facets dinamiche
  useEffect(()=>{ (async()=>{
    const data = await RaceAPI.search({ limit: 400, orderBy:'date_start', orderDir:'asc' });
    const all = data.races || [];
    const uniq = (arr) => Array.from(new Set(arr.filter(Boolean)));
    const distances = uniq(all.map(r => (r.distances&&r.distances[0])? String(r.distances[0]).replace(/[^0-9.,]/g,'').replace(',', '.') : '').filter(Boolean))
      .sort((a,b)=>parseFloat(a)-parseFloat(b));
    const surfaces = uniq(all.map(r => r.surface)).sort();
    setFacets({ distances, surfaces });
  })(); },[]);

  // ricerca
  const runSearch = async (params, pageToLoad, append=false) => {
    setLoading(true);
    const data = await RaceAPI.search({ ...params, page: pageToLoad, limit, orderBy:'date_start', orderDir:'asc' });
    setRaces(prev => append ? [...prev, ...(data.races||[])] : (data.races||[]));
    setTotal(data.total||0);
    setLoading(false);
  };
  useEffect(()=>{ 
    const params = {}; for (const [k,v] of route.query.entries()) params[k]=v;
    setPage(pageParam);
    runSearch(params, pageParam, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.path, route.query.toString()]);

  const onSearch = (params) => navigate('/search', params);

  const selectTarget = (race) => {
    navigate('/build', { targetId: race.id });
  };

  const loadMore = async () => {
    const params = {}; for (const [k,v] of route.query.entries()) params[k]=v;
    const next = page+1; setPage(next);
    await runSearch(params, next, true);
  };

  const initial = useMemo(()=>({ q, distance, country, surface, dateFrom, dateTo }), [q,distance,country,surface,dateFrom,dateTo]);

  return (
    <div className="container">
      <SearchBar initial={initial} facets={facets} onSearch={onSearch} />
      <div className="section">
        <h2>Risultati {loading ? '…' : `(${total})`}</h2>
        {loading && races.length===0 ? <div className="empty">Carico le gare…</div> : (
          <>
            {races.length===0 ? <div className="empty">Nessuna gara trovata.</div> : (
              <div className="list">
                {races.map(r=>(
                  <div className="card" key={r.id}>
                    <div className="thumb" />
                    <h3>{r.name}</h3>
                    <div className="meta">{r.city} • {r.country} • {fmtDate(r.dateStart)} • {(r.surface||'').toUpperCase()}</div>
                    <div className="badges">
                      {Array.isArray(r.distances) && r.distances.length>0 && <span className="badge">{r.distances.join(' / ')}</span>}
                      {r.elevationProfile && <span className="badge">{r.elevationProfile}</span>}
                    </div>
                    <div className="card-actions">
                      <a className="btn" href={`#/race?id=${encodeURIComponent(r.id)}`}>Dettagli</a>
                      <button className="btn secondary" onClick={()=>selectTarget(r)}>Seleziona come target</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {races.length < total && (
              <div style={{display:'flex',justifyContent:'center',marginTop:12}}>
                <button className="btn" onClick={loadMore} disabled={loading}>{loading?'Carico…':'Carica altri'}</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ============================ RACE DETAILS ============================ */
function RaceDetails({ route }){
  const id = route.query.get('id');
  const [race, setRace] = useState(null);
  useEffect(()=>{ (async()=>{ if(!id) return; const r = await RaceAPI.getById(id); setRace(r); })(); },[id]);
  if (!id) return <div className="container"><div className="empty">Nessuna gara selezionata.</div></div>;
  if (!race) return <div className="container"><div className="empty">Carico dettagli…</div></div>;
  return (
    <div className="container">
      <div className="hero" style={{marginBottom:14}}>
        <h1>Race details</h1>
        <p>{race.name} — {race.city}, {race.country} — {fmtDate(race.dateStart)}</p>
      </div>
      <div className="section">
        <div className="list" style={{gridTemplateColumns:'2fr 1fr'}}>
          <div>
            <div className="thumb" style={{height:280, marginBottom:12}} />
            <h2 style={{marginTop:0}}>{race.name}</h2>
            <div className="meta">{race.city} • {race.country} • {fmtDate(race.dateStart)}</div>
            <div className="badges" style={{marginTop:10}}>
              {Array.isArray(race.distances)&&race.distances.length>0 && <span className="badge">{race.distances.join(' / ')}</span>}
              {race.surface && <span className="badge">{race.surface}</span>}
              {race.elevationProfile && <span className="badge">{race.elevationProfile}</span>}
              {race.pbFriendly && <span className="badge good">PB-friendly</span>}
              {typeof race.priceFrom==='number' && <span className="badge">€{race.priceFrom}+</span>}
            </div>
            {race.website && <div style={{marginTop:12}}><a className="btn secondary" href={race.website} target="_blank" rel="noreferrer">Sito ufficiale</a></div>}
          </div>
          <div>
            <div className="slot">
              <h4>Informazioni</h4>
              <div className="meta">Data: {fmtDate(race.dateStart)}</div>
              <div className="meta">Località: {race.city} ({race.country})</div>
              <div className="meta">Superficie: {race.surface || '—'}</div>
              <div className="meta">Altimetria: {race.elevationProfile || '—'}</div>
            </div>
            <div style={{display:'flex', gap:10, marginTop:12}}>
              <button className="btn" onClick={()=>navigate('/build', { targetId: race.id })}>Inizia il percorso</button>
              <button className="btn secondary" onClick={()=>window.history.back()}>Torna indietro</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================ BUILD-UP PLANNER ============================ */
const SLOT_DEFS = [
  { key:'s5',  label:'Test 5K',        kmText:'5',  weeksMin:2, weeksMax:4 },
  { key:'s10', label:'Tune‑up 10K',    kmText:'10', weeksMin:4, weeksMax:8 },
  { key:'s21', label:'Tune‑up 21K',    kmText:'21', weeksMin:5, weeksMax:8 },
];

function BuildPlanner({ route }){
  const targetId = route.query.get('targetId') || '';
  const [target, setTarget] = useState(null);
  const [slots, setSlots] = useState({});            // {key: selectedRace}
  const [altFor, setAltFor] = useState(null);        // key dello slot aperto per alternative
  const [alternatives, setAlternatives] = useState([]); // lista gare alternative per lo slot aperto
  const [loadingAlts, setLoadingAlts] = useState(false);

  // carica target
  useEffect(()=>{ (async()=>{
    if (!targetId) { setTarget(null); return; }
    const r = await RaceAPI.getById(targetId);
    setTarget(r);
    setSlots({}); // reset piano se cambia la target
  })(); }, [targetId]);

  // genera suggerimenti iniziali per ogni slot (auto-pick primo suggerimento)
  useEffect(()=>{ (async()=>{
    if (!target) return;
    const plan = {};
    for (const def of SLOT_DEFS) {
      const windowFrom = addDays(target.dateStart, -def.weeksMax*7);
      const windowTo   = addDays(target.dateStart, -def.weeksMin*7);
      const res = await RaceAPI.search({
        distance: def.kmText, dateFrom: windowFrom, dateTo: windowTo,
        surface: target.surface || '', limit: 60, orderBy:'date_start', orderDir:'asc'
      });
      // ranking: stesso surface prima, poi più vicino alla metà della finestra
      const mid = new Date(addDays(windowFrom, Math.round((new Date(windowTo)-new Date(windowFrom))/(2*24*3600*1000)))).getTime();
      const list = (res.races||[])
        .filter(r => r.id !== target.id)
        .filter(r => hasKm(r, def.kmText))
        .sort((a,b)=>{
          const sA = (a.surface===target.surface)?0:1;
          const sB = (b.surface===target.surface)?0:1;
          if (sA!==sB) return sA - sB;
          const dA = Math.abs(new Date(a.dateStart).getTime() - mid);
          const dB = Math.abs(new Date(b.dateStart).getTime() - mid);
          return dA - dB;
        });
      plan[def.key] = list[0] || null;
    }
    setSlots(plan);
  })(); }, [target]);

  const openAlternatives = async (slotKey) => {
    if (!target) return;
    const def = SLOT_DEFS.find(d=>d.key===slotKey);
    if (!def) return;
    setAltFor(slotKey);
    setLoadingAlts(true);
    const windowFrom = addDays(target.dateStart, -def.weeksMax*7);
    const windowTo   = addDays(target.dateStart, -def.weeksMin*7);
    const res = await RaceAPI.search({
      distance: def.kmText, dateFrom: windowFrom, dateTo: windowTo,
      surface: target.surface || '', limit: 100, orderBy:'date_start', orderDir:'asc'
    });
    const alts = (res.races||[])
      .filter(r => r.id !== target.id)
      .filter(r => hasKm(r, def.kmText));
    setAlternatives(alts);
    setLoadingAlts(false);
  };

  const chooseAlternative = (slotKey, race) => {
    setSlots(prev => ({ ...prev, [slotKey]: race }));
    setAltFor(null);
    setAlternatives([]);
  };

  const clearSlot = (slotKey) => setSlots(prev => ({ ...prev, [slotKey]: null }));

  if (!targetId) {
    return (
      <div className="container">
        <div className="hero">
          <h1>Build‑Up Planner</h1>
          <p>Seleziona una gara target dalla pagina <a href="#/search" className="btn ghost" style={{padding:'4px 10px'}}>Gare</a> per iniziare.</p>
        </div>
      </div>
    );
  }
  if (!target) return <div className="container"><div className="empty">Carico gara target…</div></div>;

  // timeline positions
  const positions = [0.15, 0.45, 0.72, 0.93]; // 3 slot + target
  return (
    <div className="container">
      <div className="hero" style={{marginBottom:14}}>
        <h1>Build‑Up Planner</h1>
        <p>Target: <strong>{target.name}</strong> — {target.city}, {target.country} — {fmtDate(target.dateStart)} — {(target.distances||[]).join(' / ')}</p>
      </div>

      <div className="section">
        <h2>Timeline</h2>
        <div className="timeline">
          {positions.map((p,i)=>(
            <div className="milestone" key={i} style={{left: `${p*100}%`}}>
              <span className={'dot'+(i===positions.length-1?' target':'')}></span>
              <span className="milabel">{i===0?'5K': i===1?'10K': i===2?'21K':'TARGET'}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <h2>Slot & suggerimenti</h2>
        <div className="list">
          {SLOT_DEFS.map(def => {
            const picked = slots[def.key] || null;
            const windowFrom = addDays(target.dateStart, -def.weeksMax*7);
            const windowTo   = addDays(target.dateStart, -def.weeksMin*7);
            return (
              <div className="slot" key={def.key}>
                <h4>{def.label} <span className="meta">({fmtDate(windowFrom)} → {fmtDate(windowTo)})</span></h4>
                {!picked ? (
                  <div className="empty">
                    Nessuna gara selezionata. <button className="btn secondary" onClick={()=>openAlternatives(def.key)} style={{marginLeft:8}}>Mostra suggerimenti</button>
                  </div>
                ) : (
                  <div className="card" style={{padding:12}}>
                    <div className="thumb" />
                    <h3>{picked.name}</h3>
                    <div className="meta">{picked.city} • {picked.country} • {fmtDate(picked.dateStart)}</div>
                    <div className="badges">
                      {Array.isArray(picked.distances)&&picked.distances.length>0 && <span className="badge">{picked.distances.join(' / ')}</span>}
                      {picked.surface && <span className="badge">{picked.surface}</span>}
                    </div>
                    <div className="card-actions">
                      <a className="btn" href={`#/race?id=${encodeURIComponent(picked.id)}`}>Dettagli</a>
                      <button className="btn secondary" onClick={()=>openAlternatives(def.key)}>Sostituisci</button>
                      <button className="btn ghost" onClick={()=>clearSlot(def.key)}>Rimuovi</button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Modal alternative */}
      {altFor && (
        <div className="modal" role="dialog" aria-modal="true">
          <div className="sheet">
            <div className="sheet-header">
              <div>
                <h3 style={{margin:0}}>Alternative — {SLOT_DEFS.find(d=>d.key===altFor)?.label}</h3>
                <div className="sub">Stessa distanza e finestra temporale della target.</div>
              </div>
              <button className="btn secondary" onClick={()=>setAltFor(null)}>Chiudi</button>
            </div>
            <div className="sheet-body">
              {loadingAlts ? (
                <div className="empty">Carico proposte…</div>
              ) : (
                <>
                  {alternatives.length===0 ? (
                    <div className="empty">Nessuna alternativa trovata. Prova a cambiare target o allargare la finestra.</div>
                  ) : (
                    <div className="altlist">
                      {alternatives.map(r=>(
                        <div className="altcard" key={r.id}>
                          <div className="thumb" />
                          <div style={{fontWeight:700, marginTop:6}}>{r.name}</div>
                          <div className="meta">{r.city} • {r.country}</div>
                          <div className="meta">{fmtDate(r.dateStart)} • {(r.distances||[]).join(' / ')}</div>
                          <div style={{display:'flex',gap:8,marginTop:8}}>
                            <a className="btn" href={`#/race?id=${encodeURIComponent(r.id)}`}>Dettagli</a>
                            <button className="btn secondary" onClick={()=>chooseAlternative(altFor, r)}>Scegli</button>
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
      )}

    </div>
  );
}

/* ============================ ABOUT (semplice) ============================ */
function About(){
  return (
    <div className="container">
      <div className="hero">
        <h1>About</h1>
        <p>Runshift ti aiuta a scoprire gare e a costruire un percorso di avvicinamento intelligente e personalizzato.</p>
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
    </div>
  );
}

/* ============================ APP ROOT ============================ */
export default function App(){
  const [route, setRoute] = useState(parseHashRoute());
  useEffect(()=>{
    const onHash = () => setRoute(parseHashRoute());
    window.addEventListener('hashchange', onHash);
    if (!window.location.hash) navigate('/home');
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const base = route.path.split('/')[1] || 'home';
  let view = null;
  switch (base) {
    case 'home':   view = <Home onQuickSearch={(p)=>navigate('/search', p)} />; break;
    case 'search': view = <SearchPage route={route} />; break;
    case 'race':   view = <RaceDetails route={route} />; break;
    case 'build':  view = <BuildPlanner route={route} />; break;
    case 'about':  view = <About />; break;
    default:
      view = (
        <div className="container">
          <div className="hero">
            <h1>Pagina non trovata</h1>
            <p>Il percorso <code>{route.path}</code> non esiste.</p>
            <div className="hero-actions"><a className="btn" href="#/home">Torna alla Home</a></div>
          </div>
        </div>
      );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <Header route={route} />
      <main>{view}</main>
      <Footer />
    </>
  );
}
