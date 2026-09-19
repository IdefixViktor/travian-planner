'use client';

import { useEffect, useMemo, useState } from 'react';

type Village = {
  id: number;
  x: number;
  y: number;
  tribe: number;
  villageId: number;
  name: string;
  playerId: number;
  player: string;
  allianceId: number;
  alliance: string;
  pop: number;
};
type Attack = { id: number; source?: Village; tx: number; ty: number; unit: string; arrival: string };
type Unit = readonly [string, number];

const units: Unit[] = [
  ['Mercenary', 7], ['Bowman', 6], ['Spotter', 19], ['Steppe Rider', 16], ['Marksman', 15], ['Marauder', 14],
  ['Imperian', 7], ['Legionnaire', 6], ['Equites Imperatoris', 14], ['Equites Caesaris', 10],
  ['Phalanx', 7], ['Swordsman', 6], ['Theutates Thunder', 19], ['Druidrider', 16], ['Haeduan', 13],
  ['Clubswinger', 7], ['Spearman', 7], ['Axeman', 6], ['Paladin', 10], ['Teutonic Knight', 9],
  ['Catapult', 3], ['Ram', 4], ['Scout', 9],
];

function distance(a: Village, bx: number, by: number) {
  const dx = Math.abs(a.x - bx), dy = Math.abs(a.y - by), size = 401;
  const wrapX = Math.min(dx, size - dx), wrapY = Math.min(dy, size - dy);
  return Math.sqrt(wrapX * wrapX + wrapY * wrapY);
}
function fmtTime(value: string) {
  if (!value) return '—';
  return new Date(value).toLocaleString('sv-SE', { hour: '2-digit', minute: '2-digit', second: '2-digit', day: '2-digit', month: '2-digit' });
}
function iso(date: Date) { return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 19); }
function speed(name: string) { return units.find(([unit]) => unit === name)?.[1] || 6; }
function departure(attack: Attack) {
  if (!attack.source || !attack.arrival) return null;
  const seconds = distance(attack.source, attack.tx, attack.ty) / (speed(attack.unit) * 2) * 3600;
  return new Date(new Date(attack.arrival).getTime() - seconds * 1000);
}

export default function Home() {
  const [targetQuery, setTargetQuery] = useState('');
  const [sourceQuery, setSourceQuery] = useState('');
  const [results, setResults] = useState<Village[]>([]);
  const [target, setTarget] = useState<Village | null>(null);
  const [source, setSource] = useState<Village | null>(null);
  const [searchMode, setSearchMode] = useState<'target' | 'source'>('target');
  const [arrival, setArrival] = useState(iso(new Date(Date.now() + 3600000)));
  const [unit, setUnit] = useState('Marauder');
  const [attacks, setAttacks] = useState<Attack[]>([]);
  const [mapUpdated, setMapUpdated] = useState('—');
  const query = searchMode === 'target' ? targetQuery : sourceQuery;

  useEffect(() => {
    fetch('/api/health').then((r) => r.json()).then((data) => setMapUpdated(data.updatedAt || '—')).catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim().length < 1) { setResults([]); return; }
      fetch('/api/search?q=' + encodeURIComponent(query))
        .then((r) => r.json())
        .then((data) => setResults(data.villages || []))
        .catch(() => setResults([]));
    }, 180);
    return () => clearTimeout(timer);
  }, [query]);

  const chooseTarget = (value: string) => { setSearchMode('target'); setTargetQuery(value); setResults([]); };
  const chooseSource = (value: string) => { setSearchMode('source'); setSourceQuery(value); setResults([]); };
  const setResult = (village: Village) => {
    if (searchMode === 'target') { setTarget(village); setTargetQuery(''); }
    else { setSource(village); setSourceQuery(''); }
    setResults([]);
  };
  const add = () => {
    if (!source || !target) return;
    setAttacks((current) => [...current, { id: Date.now(), source, tx: target.x, ty: target.y, unit, arrival }]);
  };
  const stats = useMemo(() => attacks.map(departure).filter(Boolean) as Date[], [attacks]);

  return <div className="shell">
    <header className="top"><div className="brand"><div className="logo">⚔</div><div><b>TTQ Attack Planner</b><div className="muted">Tournament Europe · x2</div></div></div><div className="status"><span className="dot" /> Kartdata aktiv · {mapUpdated === '—' ? 'uppdateras automatiskt' : new Date(mapUpdated).toLocaleString('sv-SE')}</div></header>
    <div className="layout"><aside className="side"><div className="nav active">⚔ Attack Planner</div><h4>Server</h4><div className="notice"><b>TTQ Europe</b><br />x2 · map.sql daily sync</div><h4>Data</h4><div className="nav">Byar & spelare</div><div className="nav">Allianser</div></aside>
      <main className="main"><div className="headline"><div><h1>Attack Planner</h1><div className="muted">Planera exakta ankomster utan att importera map.sql.</div></div><button className="btn primary" onClick={add}>+ Lägg till attack</button></div>
        <div className="stats"><div className="stat"><b>{attacks.length}</b><span>ATTACKER</span></div><div className="stat"><b>{stats.length ? fmtTime(new Date(Math.min(...stats.map((x) => x.getTime()))).toISOString()) : '—'}</b><span>TIDIGASTE AVGÅNG</span></div><div className="stat"><b>{target ? `(${target.x}|${target.y})` : '—'}</b><span>MÅL</span></div></div>
        <div className="grid">
          <section className="panel"><h2>1. Välj mål</h2><div className="field"><label>Sök by, spelare, allians eller koordinat</label><input className="input" value={targetQuery} onFocus={() => setSearchMode('target')} onChange={(e) => chooseTarget(e.target.value)} placeholder="Tahara · Hector · 176|-25" /></div>{target && <div className="notice" style={{ marginBottom: 10 }}>🎯 <b>{target.name}</b> · {target.player} · ({target.x}|{target.y})</div>}{searchMode === 'target' && results.length > 0 && <div className="searchResults">{results.map((v) => <div className="result" key={v.id} onClick={() => setResult(v)}><b>{v.name}</b><br /><small>{v.player} · {v.alliance || 'Ingen allians'} · ({v.x}|{v.y}) · {v.pop} pop</small></div>)}</div>}</section>
          <section className="panel"><h2>2. Välj avsändarby</h2><div className="field"><label>Sök din by / spelare</label><input className="input" value={sourceQuery} onFocus={() => setSearchMode('source')} onChange={(e) => chooseSource(e.target.value)} placeholder="Sök spelare eller by" /></div>{source && <div className="notice" style={{ marginBottom: 10 }}>🚩 <b>{source.name}</b> · {source.player} · ({source.x}|{source.y})</div>}{searchMode === 'source' && results.length > 0 && <div className="searchResults">{results.map((v) => <div className="result" key={v.id} onClick={() => setResult(v)}><b>{v.name}</b><br /><small>{v.player} · {v.alliance || 'Ingen allians'} · ({v.x}|{v.y}) · {v.pop} pop</small></div>)}</div>}</section>
          <section className="panel"><h2>3. Attack</h2><div className="field"><label>Trupp</label><select className="select" value={unit} onChange={(e) => setUnit(e.target.value)}>{units.map(([name]) => <option key={name}>{name}</option>)}</select></div><div className="field"><label>Önskad landningstid</label><input className="input" type="datetime-local" step="1" value={arrival} onChange={(e) => setArrival(e.target.value)} /></div><button className="btn primary" onClick={add} style={{ width: '100%' }}>Beräkna avgång</button></section>
          <section className="panel"><h2>Operation</h2><div className="notice">TTQ kör x2. Avståndet beräknas med Travian-kartans wrap-around, och avgången räknas från vald trupphastighet.</div></section>
        </div>
        <section className="panel" style={{ marginTop: 16 }}><h2>Attackvågor</h2>{!attacks.length ? <div className="notice">Välj mål + avsändarby och lägg till en attack.</div> : <div style={{ overflowX: 'auto' }}><table className="table"><thead><tr><th>#</th><th>Från</th><th>Trupp</th><th>Mål</th><th>Avstånd</th><th>Landning</th><th>Avgång</th><th /></tr></thead><tbody>{attacks.map((a, i) => { const d = a.source ? distance(a.source, a.tx, a.ty) : 0; const dep = departure(a); return <tr key={a.id}><td>{i + 1}</td><td>{a.source?.name}<br /><span className="muted">({a.source?.x}|{a.source?.y})</span></td><td>{a.unit}</td><td>({a.tx}|{a.ty})</td><td>{d.toFixed(2)}</td><td>{fmtTime(a.arrival)}</td><td className="time ok">{dep ? fmtTime(dep.toISOString()) : '—'}</td><td><button className="btn" onClick={() => setAttacks((current) => current.filter((x) => x.id !== a.id))}>Ta bort</button></td></tr>; })}</tbody></table></div>}</section>
        <div className="footer">Data source: Travian map.sql · TTQ Europe · planner does not store Travian credentials.</div>
      </main>
    </div>
  </div>;
}
