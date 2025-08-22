import React, { useEffect, useMemo, useState } from 'react';

const API_BASE = "https://backend-db-corse-v2.onrender.com";

/* ============================ STILI ============================ */
const CSS = `
:root{
  --bg:#FFFFFF; --text:#0A0A0A; --muted:#585858; --border:#E6E6E0;
  --surface:#F7F7F5; --primary:#0B5D41; --primary-600:#094F37; --accent:#C2702B;
  --ring:rgba(11,93,65,.22);
}
*{box-sizing:border-box} html,body,#root{height:100%}
body{margin:0;background:var(--bg);color:var(--text);font-family:Inter,system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif}
a{color:inherit;text-decoration:none} button{font:inherit;cursor:pointer}

/* header standard (per pagine non-home) */
.header{position:sticky;top:0;z-index:20;background:rgba(255,255,255,.9);backdrop-filter:saturate(140%) blur(8px);border-bottom:1px solid var(--border)}
.header-inner{max-width:1280px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;height:68px;padding:0 20px}
.brand{display:flex;align-items:center;gap:10px;font-weight:800}
.logo{width:30px;height:30px;border-radius:7px;background:conic-gradient(from 190deg,#0B5D41,#0F6A4A,#0B5D41);position:relative}
.logo:after{content:'';position:absolute;left:7px;top:18px;width:16px;height:3px;background:#fff;border-radius:2px;transform:rotate(-28deg)}
.nav{display:flex;gap:8px}
.nav a{padding:8px 12px;border-radius:10px;color:var(--muted)}
.nav a.active,.nav a:hover{background:var(--surface);color:var(--text)}
.cta{background:var(--primary);color:#fff;border:0;padding:10px 14px;border-radius:12px;box-shadow:0 4px 14px rgba(11,93,65,.2)}
.cta:hover{background:var(--primary-600)}

main{padding:16px 0 60px}
.container{max-width:1280px;margin:0 auto;padding:0 20px}

/* HOME — Hero fullscreen senza top bar */
.hero-full{
  position:relative; min-height:80svh; width:100%;
  display:flex; flex-direction:column; justify-content:center; align-items:flex-start;
  gap:16px; padding:80px 26px; color:#fff; overflow:hidden;
  background-image:url('/runner-sunset.jpg'); background-size:cover; background-position:center;
}
.hero-full::after{content:''; position:absolute; inset:0; background:linear-gradient(180deg, rgba(0,0,0,.45), rgba(0,0,0,.25))}
.hero-content{position:relative; z-index:1; max-width:860px; text-align:center}
.hero-title{margin:0; font-size:48px; line-height:1.1; letter-spacing:-.5px}
.hero-sub{margin:10px 0 0 0; font-size:18px; color:#EFEFEF}
.hero-actions{display:flex; gap:12px; flex-wrap:wrap; justify-content:center; margin-top:18px}
.btn{background:var(--primary); color:#fff; border:0; border-radius:12px; padding:14px 16px; font-weight:700}
.btn:hover{background:var(--primary-600)}
.btn.secondary{background:#fff; color:#0A0A0A; border:1px solid var(--border)}
.btn.ghost{background:transparent; border:1px dashed var(--border); color:#0A0A0A}

/* Hamburger (home only) */
.hamburger{
  position:fixed; top:18px; right:18px; z-index:30;
  width:48px; height:48px; border-radius:12px; border:1px solid rgba(255,255,255,.4);
  background:rgba(0,0,0,.35); color:#fff; display:flex; align-items:center; justify-content:center;
  backdrop-filter: blur(6px);
}
.bar{width:22px; height:2px; background:#fff; display:block; margin:3px 0}

/* Overlay menu */
.overlay{position:fixed; inset:0; z-index:40; background:rgba(0,0,0,.5); display:flex; justify-content:flex-end}
.drawer{width:min(88vw,360px); height:100%; background:#fff; border-left:1px solid var(--border); padding:18px; display:flex; flex-direction:column; gap:10px}
.drawer a{padding:12px 14px; border-radius:10px; color:#0A0A0A}
.drawer a:hover{background:var(--surface)}
.drawer .close{align-self:flex-end; border:1px solid var(--border); background:#fff; color:#0A0A0A; border-radius:10px; padding:8px 12px}

/* sezioni generiche */
.section{background:#fff;border:1px solid var(--border);border-radius:20px;padding:18px;margin:14px 0}
.section.bg-soft{background-image:url('/section-bg.jpg');background-size:cover;background-position:center}
.section h2{margin:0 0 10px 0;font-size:22px}

/* form */
.input, select, .date input{width:100%;background:#fff;color:var(--text);border:1px solid var(--border);border-radius:12px;padding:12px 14px;outline:none;transition:border .15s, box-shadow .15s}
.input:focus, select:focus, .date input:focus{border-color:var(--primary);box-shadow:0 0 0 4px var(--ring)}
.group{display:flex;flex-direction:column} .label{font-size:12px;color:var(--muted);margin-bottom:6px}
.search-bar{display:grid;grid-template-columns:1.2fr .7fr .8fr .8fr .7fr auto;gap:10px}

/* cards */
.list{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.card{background:linear-gradient(180deg,#fff,#fbfbf9);border:1px solid var(--border);border-radius:16px;padding:14px;box-shadow:0 4px 18px rgba(0,0,0,.04)}
.card h3{margin:0 0 4px 0;font-size:16px}
.thumb{height:180px;border-radius:12px;background:linear-gradient(120deg,#EEE,#E9E9E2);border:1px solid var(--border);margin-bottom:10px}
.meta{color:var(--muted);font-size:13px} .badges{display:flex;gap:6px;margin-top:8px;flex-wrap:wrap}
.badge{font-size:11px;padding:4px 8px;border:1px solid var(--border);border-radius:999px;background:#fff}
.badge.good{background:rgba(19,121,91,.10);border-color:transparent;color:#0B5D41}
.card-actions{display:flex;gap:8px;margin-top:10px} .card-actions .btn{padding:8px 10px;font-size:13px}

/* empty + modal */
.empty{text-align:center;padding:26px;border:1px dashed var(--border);border-radius:14px;color:var(--muted)}
.modal{position:fixed;inset:0;background:rgba(0,0,0,.28);display:flex;align-items:center;justify-content:center;padding:20px;z-index:30}
.sheet{max-width:960px;width:100%;border-radius:18px;background:#fff;border:1px solid var(--border);color:#0A0A0A}
.sheet-header{display:flex;align-items:center;justify-content:space-between;padding:16px 18px;border-bottom:1px solid var(--border)}
.sheet-body{padding:18px;display:grid;gap:16px}
.sheet h3{margin:0} .sheet .sub{color:var(--muted);font-size:13px}

/* timeline build-up */
.timeline{position:relative;margin-top:8px;border-top:6px solid var(--border);height:70px}
.milestone{position:absolute;top:-16px;transform:translateX(-50%)} .dot{width:28px;height:28px;border-radius:999px;display:inline-block;background:var(--primary);border:2px solid #fff;box-shadow:0 3px 12px rgba(0,0,0,.06)}
.dot.target{background:var(--accent)} .milabel{display:block;margin-top:8px;text-align:center;font-size:12px;color:var(--muted)}
.slot{border:1px solid var(--border);border-radius:14px;padding:12px;background:#fff} .slot h4{margin:0 0 8px 0}
.altlist{display:grid;grid-template-columns:repeat(3,1fr);gap:10px} .altcard{border:1px solid var(--border);border-radius:12px;padding:10px;background:#fff}
.altcard .thumb{height:110px} .altcard .meta{font-size:12px}

.footer{border-top:1px solid var(--border);color:var(--muted);padding:22px 0;background:#fff}
@media (max-width:1100px){.list{grid-template-columns:repeat(2,1fr)}}
@media (max-width:740px){.search-bar{grid-template-columns:1fr 1fr}.list{grid-template-columns:1fr}.nav{display:none}}
`;

/* ============================ ROUTER + UTILS ============================ */
function parseHash(){
  const raw = window.location.hash || '#/home';
  const [p,q] = raw.replace(/^#/, '').split('?');
  return { path: p || '/home', query: new URLSearchParams(q||'') };
}
function nav(path, params){ const qs = params?`?${new URLSearchParams(params).toString()}`:''; window.location.hash = `${path}${qs}`; }

const fmtDate = (iso) => { if(!iso) return ''; try{ return new Date(iso).toLocaleDateString(undefined,{day:'2-digit',month:'short',year:'numeric'}) }catch{ return iso } };
const addDays = (iso, d)=>{ const x=new Date(iso); x.setDate(x.getDate()+d); return x.toISOString().slice(0,10); };
const hasKm = (race, km)=> (race.distances||[]).some(v=>String(v).includes(km));

/* ============================ API ============================ */
const RaceAPI = {
  async search(params){
    const url = `${API_BASE}/api/races?` + new URLSearchParams(params||{}).toString();
    const r = await fetch(url,{headers:{Accept:'application/json'}}).catch(()=>null);
    if(!r || !r.ok) return { races:[], total:0 };
    const data = await r.json().catch(()=>({races:[],total:0}));
    return { races: data.races||[], total: data.total||0 };
  },
  async getById(id){
    const r = await fetch(`${API_BASE}/api/races/${encodeURIComponent(id)}`,{headers:{Accept:'application/json'}}).catch(()=>null);
    if(!r || !r.ok) return null;
    return await r.json().catch(()=>null);
  }
};

/* ============================ HEADER (pagine non-home) ============================ */
function Header({ route }){
  const tab=route.path.replace(/^\//,'');
  const link = (href,label)=><a href={`#${href}`} className={tab===href.replace(/^\//,'')?'active':''}>{label}</a>;
  return (
    <header className="header">
      <div className="header-inner">
        <div className="brand"><div className="logo"/><div>Runshift</div></div>
        <nav className="nav">
          {link('/home','Home')}{link('/search','Gare')}{link('/build','Build‑Up')}{link('/about','About')}
        </nav>
        <button className="cta" onClick={()=>nav('/search')}>Trova gare</button>
      </div>
    </header>
  );
}

/* ============================ HAMBURGER + MENU OVERLAY (home) ============================ */
function HomeMenu({ open, onClose }){
  if(!open) return null;
  return (
    <div className="overlay" onClick={onClose}>
      <div className="drawer" onClick={(e)=>e.stopPropagation()}>
        <button className="close" onClick={onClose}>Chiudi ✕</button>
        <a href="#/search" onClick={onClose}>Gare</a>
        <a href="#/build" onClick={onClose}>Build‑Up</a>
        <a href="#/about" onClick={onClose}>About</a>
      </div>
    </div>
  );
}

/* ============================ HOME ============================ */
function Home({ onQuick }){
  const [featured,setFeatured]=useState([]);
  const [menuOpen,setMenuOpen]=useState(false);
  useEffect(()=>{(async()=>{ const d=await RaceAPI.search({limit:6,orderBy:'date_start',orderDir:'asc'}); setFeatured(d.races||[]); })()},[]);
  return (
    <>
      {/* Hero fullscreen senza top bar; hamburger in alto a destra */}
      <section className="hero-full">
        <button className="hamburger" aria-label="Apri menu" onClick={()=>setMenuOpen(true)}>
          <span className="bar"/><span className="bar"/><span className="bar"/>
        </button>
        <div className="hero-content">
          <h1 className="hero-title">Corri. Scopri. Superati.</h1>
          <p className="hero-sub">Trova la tua prossima sfida, costruisci il tuo percorso e vivi l’avventura della corsa.</p>
          <div className="hero-actions">
            <button className="btn" onClick={()=>onQuick({})}>Trova la tua gara</button>
            <button className="btn secondary" onClick={()=>onQuick({surface:'trail'})}>Esplora trail</button>
          </div>
        </div>
      </section>

      <HomeMenu open={menuOpen} onClose={()=>setMenuOpen(false)} />

      {/* Sezione gare in evidenza (dopo la hero) */}
      <div className="container">
        <div className="section bg-soft">
          <h2>Gare in evidenza</h2>
          {featured.length===0? <div className="empty">Nessun evento da mostrare.</div> :
            <div className="list">
              {featured.map(r=>(
                <div className="card" key={r.id}>
                  <div className="thumb" />
                  <h3>{r.name}</h3>
                  <div className="meta">{r.city} • {r.country} • {fmtDate(r.dateStart)}</div>
                  <div className="badges">
                    {Array.isArray(r.distances)&&r.distances.length>0 && <span className="badge">{r.distances.join(' / ')}</span>}
                  </div>
                  <div className="card-actions">
                    <a className="btn" href={`#/race?id=${encodeURIComponent(r.id)}`}>Dettagli</a>
                    <button className="btn secondary" onClick={()=>nav('/build',{targetId:r.id})}>Inizia il percorso</button>
                  </div>
                </div>
              ))}
            </div>}
        </div>

        <div className="section" style={{backgroundImage:'url("/paper-texture.jpg")',backgroundSize:'cover'}}>
          <h2>Perché Runshift</h2>
          <div className="list" style={{gridTemplateColumns:'repeat(3,1fr)'}}>
            {[
              {t:'🌍 Esplora',d:'Migliaia di gare nel mondo'},
              {t:'🏔 Vivi l’avventura',d:'Dalle strade ai trail epici'},
              {t:'⏱ Superati',d:'Pianifica e raggiungi obiettivi'},
            ].map((k,i)=>(
              <div key={i} className="card"><h3>{k.t}</h3><p className="meta">{k.d}</p></div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

/* ============================ SEARCH ============================ */
function SearchBar({initial,facets,onSearch}){
  const [q,setQ]=useState(initial.q||'');
  const [distance,setDistance]=useState(initial.distance||'');
  const [country,setCountry]=useState(initial.country||'');
  const [surface,setSurface]=useState(initial.surface||'');
  const [dateFrom,setDateFrom]=useState(initial.dateFrom||'');
  const [dateTo,setDateTo]=useState(initial.dateTo||'');

  const submit=(e)=>{e.preventDefault();
    const p={q,distance,country,surface,dateFrom,dateTo,page:1,limit:60}; Object.keys(p).forEach(k=>!p[k]&&delete p[k]); onSearch(p);
  };

  return (
    <form className="section" onSubmit={submit}>
      <h2>Trova la tua prossima gara</h2>
      <div className="search-bar" style={{marginTop:12}}>
        <div className="group"><label className="label">Parola chiave</label><input className="input" value={q} onChange={e=>setQ(e.target.value)} placeholder="Nome, città, paese…" /></div>
        <div className="group"><label className="label">Distanza</label>
          <select value={distance} onChange={e=>setDistance(e.target.value)}>
            <option value="">Tutte</option>
            {(facets.distances||[]).map(d=><option key={d} value={d}>{d} km</option>)}
          </select>
        </div>
        <div className="group"><label className="label">Paese</label><input className="input" value={country} onChange={e=>setCountry(e.target.value)} placeholder="Italy, Spain…" /></div>
        <div className="group"><label className="label">Superficie</label>
          <select value={surface} onChange={e=>setSurface(e.target.value)}>
            <option value="">Tutte</option>
            {(facets.surfaces||[]).map(s=><option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="group"><label className="label">Data</label>
          <div className="date" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
            <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} />
            <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} min={dateFrom||undefined} />
          </div>
        </div>
        <div className="group" style={{alignSelf:'end'}}><button className="btn" type="submit">Cerca</button></div>
      </div>
    </form>
  );
}

function SearchPage({ route }){
  const q=route.query.get('q')||''; const distance=route.query.get('distance')||''; const country=route.query.get('country')||'';
  const surface=route.query.get('surface')||''; const dateFrom=route.query.get('dateFrom')||''; const dateTo=route.query.get('dateTo')||'';
  const pageParam=parseInt(route.query.get('page')||'1',10); const limitParam=parseInt(route.query.get('limit')||'60',10);

  const [facets,setFacets]=useState({distances:[],surfaces:[]});
  const [loading,setLoading]=useState(false); const [races,setRaces]=useState([]); const [total,setTotal]=useState(0);
  const [page,setPage]=useState(pageParam); const limit=limitParam;

  // facet dinamici dal DB (per evitare mismatch)
  useEffect(()=>{(async()=>{
    const d=await RaceAPI.search({limit:400,orderBy:'date_start',orderDir:'asc'});
    const all=d.races||[]; const uniq=a=>Array.from(new Set(a.filter(Boolean)));
    const distances=uniq(all.map(r=>(r.distances&&r.distances[0])? String(r.distances[0]).replace(/[^0-9.,]/g,'').replace(',','.') : '').filter(Boolean))
      .sort((a,b)=>parseFloat(a)-parseFloat(b));
    const surfaces=uniq(all.map(r=>r.surface)).sort();
    setFacets({distances,surfaces});
  })()},[]);

  const run=async(params,pageTo,append=false)=>{
    setLoading(true);
    const d=await RaceAPI.search({...params,page:pageTo,limit,orderBy:'date_start',orderDir:'asc'});
    setRaces(prev=>append?[...prev,...(d.races||[])]: (d.races||[]));
    setTotal(d.total||0); setLoading(false);
  };
  useEffect(()=>{ const p={}; for(const [k,v] of route.query.entries()) p[k]=v; setPage(pageParam); run(p,pageParam,false); /* eslint-disable-next-line */ },[route.path,route.query.toString()]);
  const onSearch=(p)=>nav('/search',p);

  const loadMore=async()=>{ const p={}; for(const [k,v] of route.query.entries()) p[k]=v; const next=page+1; setPage(next); await run(p,next,true); };
  const initial=useMemo(()=>({q,distance,country,surface,dateFrom,dateTo}),[q,distance,country,surface,dateFrom,dateTo]);

  return (
    <div className="container">
      <SearchBar initial={initial} facets={facets} onSearch={onSearch}/>
      <div className="section">
        <h2>Risultati {loading?'…':`(${total})`}</h2>
        {loading && races.length===0 ? <div className="empty">Carico le gare…</div> :
          <>
            {races.length===0 ? <div className="empty">Nessuna gara trovata.</div> :
              <div className="list">
                {races.map(r=>(
                  <div className="card" key={r.id}>
                    <div className="thumb"/>
                    <h3>{r.name}</h3>
                    <div className="meta">{r.city} • {r.country} • {fmtDate(r.dateStart)} • {(r.surface||'').toUpperCase()}</div>
                    <div className="badges">
                      {Array.isArray(r.distances)&&r.distances.length>0 && <span className="badge">{r.distances.join(' / ')}</span>}
                    </div>
                    <div className="card-actions">
                      <a className="btn" href={`#/race?id=${encodeURIComponent(r.id)}`}>Dettagli</a>
                      <button className="btn secondary" onClick={()=>nav('/build',{targetId:r.id})}>Seleziona come target</button>
                    </div>
                  </div>
                ))}
              </div>}
            {races.length<total && <div style={{display:'flex',justifyContent:'center',marginTop:12}}>
              <button className="btn" onClick={loadMore} disabled={loading}>{loading?'Carico…':'Carica altri'}</button>
            </div>}
          </>
        }
      </div>
    </div>
  );
}

/* ============================ RACE DETAILS ============================ */
function RaceDetails({ route }){
  const id=route.query.get('id'); const [race,setRace]=useState(null);
  useEffect(()=>{(async()=>{ if(!id) return; const r=await RaceAPI.getById(id); setRace(r); })()},[id]);
  if(!id) return <div className="container"><div className="empty">Nessuna gara selezionata.</div></div>;
  if(!race) return <div className="container"><div className="empty">Carico dettagli…</div></div>;
  return (
    <div className="container">
      <div className="section">
        <h2>Race details</h2>
        <div className="list" style={{gridTemplateColumns:'2fr 1fr'}}>
          <div>
            <div className="thumb" style={{height:280,marginBottom:12}}/>
            <h3 style={{marginTop:0}}>{race.name}</h3>
            <div className="meta">{race.city} • {race.country} • {fmtDate(race.dateStart)}</div>
            <div className="badges" style={{marginTop:10}}>
              {Array.isArray(race.distances)&&race.distances.length>0 && <span className="badge">{race.distances.join(' / ')}</span>}
              {race.surface && <span className="badge">{race.surface}</span>}
            </div>
            {race.website && <div style={{marginTop:12}}><a className="btn secondary" href={race.website} target="_blank" rel="noreferrer">Sito ufficiale</a></div>}
          </div>
          <div>
            <div className="slot">
              <h4>Informazioni</h4>
              <div className="meta">Data: {fmtDate(race.dateStart)}</div>
              <div className="meta">Località: {race.city} ({race.country})</div>
              <div className="meta">Superficie: {race.surface || '—'}</div>
            </div>
            <div style={{display:'flex',gap:10,marginTop:12}}>
              <button className="btn" onClick={()=>nav('/build',{targetId:race.id})}>Inizia il percorso</button>
              <button className="btn secondary" onClick={()=>window.history.back()}>Torna indietro</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================ BUILD‑UP ============================ */
const SLOT_DEFS=[
  {key:'s5', label:'Test 5K', km:'5',  weeksMin:2, weeksMax:4},
  {key:'s10',label:'Tune‑up 10K', km:'10', weeksMin:4, weeksMax:8},
  {key:'s21',label:'Tune‑up 21K', km:'21', weeksMin:5, weeksMax:8},
];

function BuildPage({ route }){
  const targetId=route.query.get('targetId')||'';
  const [target,setTarget]=useState(null);
  const [slots,setSlots]=useState({});
  const [altFor,setAltFor]=useState(null);
  const [alternatives,setAlternatives]=useState([]);
  const [loadingAlts,setLoadingAlts]=useState(false);

  useEffect(()=>{(async()=>{ if(!targetId){setTarget(null);return;} const r=await RaceAPI.getById(targetId); setTarget(r); setSlots({}); })()},[targetId]);

  // suggerimenti iniziali per slot (stessa distanza e finestra rispetto alla target)
  useEffect(()=>{(async()=>{
    if(!target) return;
    const plan={};
    for(const def of SLOT_DEFS){
      const from=addDays(target.dateStart, -def.weeksMax*7);
      const to  =addDays(target.dateStart, -def.weeksMin*7);
      const d=await RaceAPI.search({distance:def.km, dateFrom:from, dateTo:to, surface:target.surface||'', limit:80, orderBy:'date_start', orderDir:'asc'});
      const list=(d.races||[]).filter(x=>x.id!==target.id).filter(x=>hasKm(x,def.km));
      plan[def.key]=list[0]||null; // primo suggerimento
    }
    setSlots(plan);
  })()},[target]);

  const openAlt=async(key)=>{
    if(!target) return;
    const def=SLOT_DEFS.find(d=>d.key===key); if(!def) return;
    setAltFor(key); setLoadingAlts(true);
    const from=addDays(target.dateStart, -def.weeksMax*7);
    const to  =addDays(target.dateStart, -def.weeksMin*7);
    const d=await RaceAPI.search({distance:def.km, dateFrom:from, dateTo:to, surface:target.surface||'', limit:120, orderBy:'date_start', orderDir:'asc'});
    const alts=(d.races||[]).filter(x=>x.id!==target.id).filter(x=>hasKm(x,def.km));
    setAlternatives(alts); setLoadingAlts(false);
  };
  const choose=(key,r)=>{ setSlots(prev=>({...prev,[key]:r})); setAltFor(null); setAlternatives([]); };
  const clearSlot=(key)=> setSlots(prev=>({...prev,[key]:null}));

  if(!targetId) return <div className="container"><div className="empty">Seleziona una gara target dalla pagina <a className="btn ghost" href="#/search" style={{padding:'4px 10px'}}>Gare</a>.</div></div>;
  if(!target) return <div className="container"><div className="empty">Carico gara target…</div></div>;

  const pos=[0.15,0.45,0.72,0.93];
  return (
    <div className="container">
      <div className="section">
        <h2>Build‑Up Planner</h2>
        <p>Target: <strong>{target.name}</strong> — {target.city}, {target.country} — {fmtDate(target.dateStart)} — {(target.distances||[]).join(' / ')}</p>
      </div>

      <div className="section">
        <h2>Timeline</h2>
        <div className="timeline">
          {pos.map((p,i)=>(
            <div className="milestone" key={i} style={{left:`${p*100}%`}}>
              <span className={'dot'+(i===pos.length-1?' target':'')}></span>
              <span className="milabel">{i===0?'5K':i===1?'10K':i===2?'21K':'TARGET'}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <h2>Slot & suggerimenti</h2>
        <div className="list">
          {SLOT_DEFS.map(def=>{
            const picked=slots[def.key]||null;
            const from=addDays(target.dateStart,-def.weeksMax*7);
            const to  =addDays(target.dateStart,-def.weeksMin*7);
            return (
              <div className="slot" key={def.key}>
                <h4>{def.label} <span className="meta">({fmtDate(from)} → {fmtDate(to)})</span></h4>
                {!picked?(
                  <div className="empty">Nessuna gara selezionata.
                    <button className="btn secondary" onClick={()=>openAlt(def.key)} style={{marginLeft:8}}>Mostra suggerimenti</button>
                  </div>
                ):(
                  <div className="card" style={{padding:12}}>
                    <div className="thumb"/>
                    <h3>{picked.name}</h3>
                    <div className="meta">{picked.city} • {picked.country} • {fmtDate(picked.dateStart)}</div>
                    <div className="badges">
                      {Array.isArray(picked.distances)&&picked.distances.length>0 && <span className="badge">{picked.distances.join(' / ')}</span>}
                      {picked.surface && <span className="badge">{picked.surface}</span>}
                    </div>
                    <div className="card-actions">
                      <a className="btn" href={`#/race?id=${encodeURIComponent(picked.id)}`}>Dettagli</a>
                      <button className="btn secondary" onClick={()=>openAlt(def.key)}>Sostituisci</button>
                      <button className="btn ghost" onClick={()=>clearSlot(def.key)}>Rimuovi</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {altFor && (
        <div className="modal" role="dialog" aria-modal="true">
          <div className="sheet">
            <div className="sheet-header">
              <div>
                <h3 style={{margin:0}}>Alternative — {SLOT_DEFS.find(d=>d.key===altFor)?.label}</h3>
                <div className="sub">Stessa distanza e finestra della target.</div>
              </div>
              <button className="btn secondary" onClick={()=>setAltFor(null)}>Chiudi</button>
            </div>
            <div className="sheet-body">
              {loadingAlts? <div className="empty">Carico proposte…</div> :
                (alternatives.length===0? <div className="empty">Nessuna alternativa trovata.</div> :
                  <div className="altlist">
                    {alternatives.map(r=>(
                      <div className="altcard" key={r.id}>
                        <div className="thumb"/>
                        <div style={{fontWeight:700,marginTop:6}}>{r.name}</div>
                        <div className="meta">{r.city} • {r.country}</div>
                        <div className="meta">{fmtDate(r.dateStart)} • {(r.distances||[]).join(' / ')}</div>
                        <div style={{display:'flex',gap:8,marginTop:8}}>
                          <a className="btn" href={`#/race?id=${encodeURIComponent(r.id)}`}>Dettagli</a>
                          <button className="btn secondary" onClick={()=>choose(altFor,r)}>Scegli</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              }
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================ ABOUT ============================ */
function About(){
  return (
    <div className="container">
      <div className="section"><h2>About</h2><p>Runshift: scopri gare e costruisci il tuo percorso di avvicinamento.</p></div>
    </div>
  );
}

/* ============================ APP ROOT ============================ */
export default function App(){
  const [route,setRoute]=useState(parseHash());
  useEffect(()=>{ const h=()=>setRoute(parseHash()); window.addEventListener('hashchange',h); if(!window.location.hash) nav('/home'); return ()=>window.removeEventListener('hashchange',h); },[]);
  const base=route.path.split('/')[1]||'home';

  // Su home: niente barra superiore (solo hamburger dentro la hero)
  const showHeader = base !== 'home';

  let view=null;
  switch(base){
    case 'home':   view=<Home onQuick={(p)=>nav('/search',p)}/>; break;
    case 'search': view=<SearchPage route={route}/>; break;
    case 'race':   view=<RaceDetails route={route}/>; break;
    case 'build':  view=<BuildPage route={route}/>; break;
    case 'about':  view=<About/>; break;
    default:
      view=<div className="container"><div className="section"><h2>Pagina non trovata</h2><p>Il percorso <code>{route.path}</code> non esiste.</p><div style={{marginTop:10}}><a className="btn" href="#/home">Torna alla Home</a></div></div></div>;
  }

  return (<>
    <style dangerouslySetInnerHTML={{__html:CSS}}/>
    {showHeader && <Header route={route}/>}
    <main>{view}</main>
    {showHeader && <footer className="footer"><div className="container" style={{display:'flex',justifyContent:'space-between',gap:14,flexWrap:'wrap'}}><div>© {new Date().getFullYear()} Runshift</div><div style={{display:'flex',gap:12}}><a href="#/privacy">Privacy</a><a href="#/cookies">Cookie</a><a href="#/contatti">Contatti</a></div></div></footer>}
  </>);
}
