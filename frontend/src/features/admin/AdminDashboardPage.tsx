import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { Button } from '../../components/ui/Button';
import {
  LayoutDashboard,
  Layers,
  Calendar,
  Users,
  Image as ImageIcon,
  Plus,
  Sparkles,
  TrendingUp,
  Activity,
  CheckCircle,
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [totalUsersCount, setTotalUsersCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [statsData, usersData] = await Promise.all([
        api.getAdminStats(),
        api.getAdminUsers({ limit: 20 }),
      ]);
      setStats(statsData);
      setUsers(usersData.users || []);
      setTotalUsersCount(usersData.total || 0);
    } catch (err) {
      console.error('Failed to load admin dashboard data', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <LayoutDashboard className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-extrabold font-heading text-white">Admin Command Center</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Manage reusable templates, publishing programs, registered users, and poster generation statistics
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/admin/templates">
            <Button variant="secondary" size="sm" leftIcon={<Layers className="w-4 h-4" />}>
              Templates Engine
            </Button>
          </Link>
          <Link to="/admin/programs">
            <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
              Create Program
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Programs</span>
            <Calendar className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="text-3xl font-black text-white font-heading">
            {stats?.totalPrograms ?? 0}
          </div>
          <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> {stats?.publishedPrograms ?? 0} Published
          </span>
        </div>

        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Templates</span>
            <Layers className="w-5 h-5 text-violet-400" />
          </div>
          <div className="text-3xl font-black text-white font-heading">
            {stats?.totalTemplates ?? 0}
          </div>
          <span className="text-[11px] text-slate-400">Reusable Configurations</span>
        </div>

        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Poster Generations</span>
            <Sparkles className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-white font-heading">
            {stats?.totalPosterGenerations ?? 0}
          </div>
          <span className="text-[11px] text-emerald-400 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> High-Res Downloads
          </span>
        </div>

        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Registered Users</span>
            <Users className="w-5 h-5 text-pink-400" />
          </div>
          <div className="text-3xl font-black text-white font-heading">
            {stats?.totalUsers ?? users.length ?? 0}
          </div>
          <span className="text-[11px] text-slate-400">Super Admin & Active Users</span>
        </div>
      </div>

      {/* Quick Action Navigation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link to="/admin/programs" className="glass-card glass-card-hover p-6 rounded-3xl border border-slate-800 space-y-3 group">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold">
            <Calendar className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white group-hover:text-indigo-300">Manage Programs</h3>
          <p className="text-xs text-slate-400">
            Create, publish, or archive public poster programs tied to design templates.
          </p>
        </Link>

        <Link to="/admin/templates" className="glass-card glass-card-hover p-6 rounded-3xl border border-slate-800 space-y-3 group">
          <div className="w-10 h-10 rounded-2xl bg-violet-500/10 text-violet-400 flex items-center justify-center font-bold">
            <Layers className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white group-hover:text-violet-300">Template Editor</h3>
          <p className="text-xs text-slate-400">
            Upload Photoshop PSD frames, adjust edge curves, drop shadows, and photo slots.
          </p>
        </Link>

        <Link to="/admin/assets" className="glass-card glass-card-hover p-6 rounded-3xl border border-slate-800 space-y-3 group">
          <div className="w-10 h-10 rounded-2xl bg-pink-500/10 text-pink-400 flex items-center justify-center font-bold">
            <ImageIcon className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white group-hover:text-pink-300">Asset Management</h3>
          <p className="text-xs text-slate-400">
            Upload reusable background frames, logos, and graphic overlays.
          </p>
        </Link>

        <a href="#users-section" className="glass-card glass-card-hover p-6 rounded-3xl border border-slate-800 space-y-3 group">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white group-hover:text-emerald-300">Manage Users</h3>
          <p className="text-xs text-slate-400">
            Inspect registered accounts, user roles, active statuses, and details.
          </p>
        </a>
      </div>

      {/* Super Admin User Management Table Section */}
      <div id="users-section" className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white">Registered Users Directory</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
              {totalUsersCount} Accounts
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {users.length > 0 ? (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="px-4 py-3 flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-xs">
                        {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <span className="font-bold text-white">
                        {u.email === 'swalimohd048@gmail.com' || u.name === 'Super Admin' ? 'PosterCraft Admin' : u.name}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-400">{u.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] uppercase font-bold border ${
                          u.role === 'admin'
                            ? 'bg-amber-950/50 text-amber-300 border-amber-500/30'
                            : 'bg-slate-900 text-slate-400 border-slate-800'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-950/40 text-emerald-400 border border-emerald-500/20">
                        {u.status || 'active'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                    No user accounts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
