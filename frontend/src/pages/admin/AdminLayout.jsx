// /frontend/src/pages/admin/AdminLayout.jsx
import { Outlet, NavLink } from 'react-router-dom';
import { Shield, Users, Activity, Database } from 'lucide-react';

export default function AdminLayout() {
  const navStyle = ({ isActive }) => 
    `flex items-center gap-3 p-3 rounded transition-colors ${
      isActive ? 'bg-green-900/40 text-green-400 border-r-4 border-green-500' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
    }`;

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 flex font-mono selection:bg-green-900 selection:text-green-400">
      {/* Admin Sidebar */}
      <aside className="w-64 bg-zinc-950 border-r border-zinc-800 flex flex-col">
        <div className="p-6 border-b border-zinc-800 flex items-center gap-3">
          <Shield className="text-green-500" />
          <div>
            <h2 className="font-bold tracking-widest text-sm uppercase">Aegis System</h2>
            <p className="text-[10px] text-zinc-500">ADMINISTRATOR LEVEL 5</p>
          </div>
        </div>
        
        <nav className="flex-1 p-4 flex flex-col gap-2 text-sm uppercase tracking-wider">
          <NavLink to="/admin/members" className={navStyle}><Users size={18} /> Personnel File</NavLink>
          <NavLink to="/admin/enrollment" className={navStyle}><Database size={18} /> New Enrollment</NavLink>
          <NavLink to="/admin/history" className={navStyle}><Activity size={18} /> System Logs</NavLink>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}