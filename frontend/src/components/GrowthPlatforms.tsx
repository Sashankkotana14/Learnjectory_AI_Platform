import { useState } from 'react';
import { ExternalLink, Pencil, Check, X, Bot, Code2, BookOpen, Terminal } from 'lucide-react';

// Growth Engine → Platforms: quick-launch cards for practice / learning platforms.
// Self-contained: no backend, no shared state. Optional per-platform link + username are kept in this browser only.
type P = { key: string; name: string; tag: string; desc: string; url: string; icon: any };
const PLATFORMS: P[] = [
  { key: 'coach-afo', name: 'Coach AFO', tag: 'AI coaching', desc: 'Your coaching platform for guided practice and feedback. Add its link below to launch it from here.', url: '', icon: Bot },
  { key: 'leetcode', name: 'LeetCode', tag: 'Coding practice', desc: 'Solve data-structure and algorithm problems, join contests and prepare for interviews.', url: 'https://leetcode.com/', icon: Code2 },
  { key: 'geeksforgeeks', name: 'GeeksforGeeks', tag: 'Learn & practice', desc: 'Tutorials, articles and practice problems across programming, CS fundamentals and interviews.', url: 'https://www.geeksforgeeks.org/', icon: BookOpen },
  { key: 'hackerrank', name: 'HackerRank', tag: 'Skills & challenges', desc: 'Practice coding challenges, earn skill badges and take certification tests.', url: 'https://www.hackerrank.com/', icon: Terminal },
];
const KEY = 'growth_platforms_v1';
const read = (): Record<string, { url?: string; user?: string }> => { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch { return {}; } };
const write = (v: any) => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch { /* storage unavailable */ } };
const safeUrl = (u: string) => { const s = u.trim(); if (!s) return ''; const full = /^https?:\/\//i.test(s) ? s : 'https://' + s; try { const p = new URL(full); return p.protocol === 'http:' || p.protocol === 'https:' ? p.href : ''; } catch { return ''; } };

export function GrowthPlatforms() {
  const [saved, setSaved] = useState(read), [edit, setEdit] = useState<string | null>(null), [url, setUrl] = useState(''), [user, setUser] = useState(''), [err, setErr] = useState('');
  const start = (p: P) => { setErr(''); setEdit(p.key); setUrl(saved[p.key]?.url || ''); setUser(saved[p.key]?.user || ''); };
  const commit = (p: P) => {
    const u = safeUrl(url);
    if (url.trim() && !u) { setErr('Enter a valid web address'); return; }
    const next = { ...saved, [p.key]: { url: u, user: user.trim().slice(0, 60) } };
    setSaved(next); write(next); setEdit(null); setErr('');
  };
  return (
    <div>
      <div className="mb-4"><h1 className="text-2xl font-extrabold">Growth Engine <span className="text-base font-semibold text-sky-300">· Platforms</span></h1><p className="text-sm text-sky-100/70">Your practice and learning platforms in one place. Open them in a new tab, and optionally save your username or a custom link.</p></div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {PLATFORMS.map(p => {
          const s = saved[p.key] || {}, link = s.url || p.url, I = p.icon, editing = edit === p.key;
          return (
            <div key={p.key} className="card flex flex-col">
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-sky-400/20 text-sky-200"><I className="h-5 w-5" /></div><div><div className="font-bold">{p.name}</div><span className="chip bg-indigo-400/20 text-indigo-100">{p.tag}</span></div></div>
                {!editing && <button aria-label={`Edit ${p.name}`} className="text-sky-300" onClick={() => start(p)}><Pencil className="h-4 w-4" /></button>}
              </div>
              <p className="mb-3 flex-1 text-xs text-sky-100/70">{p.desc}</p>
              {s.user && !editing && <div className="mb-2 text-xs text-sky-100/80">Username: <b>{s.user}</b></div>}
              {editing ? (
                <div className="grid gap-2">
                  <input className="inp" aria-label={`${p.name} link`} placeholder="Link, e.g. https://…" value={url} onChange={e => setUrl(e.target.value)} />
                  <input className="inp" aria-label={`${p.name} username`} maxLength={60} placeholder="Username (optional)" value={user} onChange={e => setUser(e.target.value)} />
                  {err && <div className="text-xs text-rose-300">{err}</div>}
                  <div className="flex gap-2"><button className="btn !px-3 !py-1" onClick={() => commit(p)}><Check className="h-3 w-3" />Save</button><button className="btn-ghost !px-3 !py-1" onClick={() => { setEdit(null); setErr(''); }}><X className="h-3 w-3" />Cancel</button></div>
                </div>
              ) : link ? (
                <a className="btn !px-3 !py-1.5 self-start text-xs" href={link} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3 w-3" />Open {p.name}</a>
              ) : (
                <button className="btn-ghost !px-3 !py-1.5 self-start text-xs" onClick={() => start(p)}>Add link</button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
