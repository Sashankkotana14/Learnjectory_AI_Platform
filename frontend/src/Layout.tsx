import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { GraduationCap, Search, Menu, LogOut } from 'lucide-react';
import { nav } from './config';
import { logout } from './api';
import { HeaderAvatar, HeaderDate } from './components/HeaderExtras';
import NotificationBell from './components/NotificationBell';
import SuccessToasts from './components/SuccessToasts';
import AchievementToasts from './components/AchievementToasts';
export default function Layout() {
  const [open, setOpen] = useState(false), [q, setQ] = useState(''), nv = useNavigate();
  return (
    <div className="flex min-h-screen">
      <aside className={`fixed z-40 h-full w-60 shrink-0 overflow-y-auto border-r border-[rgba(167,139,250,.18)] bg-[#18112A]/95 backdrop-blur-xl p-4 transition lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${open ? '' : '-translate-x-full'}`}>
        <div className="mb-5 flex items-center gap-3"><GraduationCap className="h-9 w-9 text-sky-300" /><div><div className="text-lg font-extrabold leading-none">Learnjectory</div><div className="text-[9px] font-bold tracking-widest text-sky-300">YOUR GROWTH SPACE</div></div></div>
        {nav.map(g => (
          <div key={g.group} className="mb-3">
            <div className="mb-1 px-2 text-[10px] font-bold tracking-widest text-sky-200/60">{g.group}</div>
            {g.items.map(([to, label, Icon]) => (
              <NavLink key={to} to={to} end={to === '/'} onClick={() => setOpen(false)}
                className={({ isActive }) => `mb-1 flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold ${isActive ? 'bg-gradient-to-r from-violet-500 to-pink-500 shadow-[0_0_20px_rgba(139,92,246,.55)]' : 'text-sky-100/80 hover:bg-white/5'}`}>
                <Icon className="h-4 w-4" />{label}
              </NavLink>))}
          </div>))}
        <button onClick={async () => { await logout(); nv('/login', { replace: true }); }} className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-sky-100/70 hover:bg-white/5"><LogOut className="h-4 w-4" />Log out</button>
      </aside>
      <div className="min-w-0 flex-1 p-4 lg:p-5">
        <header className="mb-4 flex items-center gap-3">
          <button className="lg:hidden" onClick={() => setOpen(!open)}><Menu /></button>
          <form className="relative max-w-xl flex-1" onSubmit={e => { e.preventDefault(); nv('/search?q=' + encodeURIComponent(q)); }}>
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-sky-300" />
            <input className="inp rounded-full pl-9" placeholder="Search anything..." value={q} onChange={e => setQ(e.target.value)} />
          </form>
          <div className="ml-auto flex items-center gap-3 sm:gap-4"><HeaderDate /><NotificationBell /><HeaderAvatar /></div>
        </header>
        <Outlet />
      </div>
      <SuccessToasts />
      <AchievementToasts />
    </div>
  );
}
