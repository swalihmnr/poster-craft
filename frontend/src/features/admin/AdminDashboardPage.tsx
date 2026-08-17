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
  AlertTriangle,
  X,
  CheckCircle2,
  Trash2,
  Code2,
  ArrowUpRight,
  Terminal,
  Cpu,
  Globe,
} from 'lucide-react';

import { useAuth } from '../auth/AuthContext';

export const AdminDashboardPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.isSuperAdmin || currentUser?.email?.toLowerCase() === 'swalimohd048@gmail.com';

  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [totalUsersCount, setTotalUsersCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [rejectModalTarget, setRejectModalTarget] = useState<{ id: string; name: string; email: string } | null>(null);
  const [deleteModalTarget, setDeleteModalTarget] = useState<{ id: string; name: string; email: string } | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (isSuperAdmin) {
        const [statsData, usersData, pendingData] = await Promise.all([
          api.getAdminStats(),
          api.getAdminUsers({ limit: 20 }).catch(() => ({ users: [], total: 0 })),
          api.getPendingAdminRequests().catch(() => ({ requests: [] })),
        ]);
        setStats(statsData);
        setUsers(usersData.users || []);
        setTotalUsersCount(usersData.total || 0);
        setPendingRequests(pendingData.requests || []);
      } else {
        const statsData = await api.getAdminStats();
        setStats(statsData);
        setUsers([]);
        setPendingRequests([]);
      }
    } catch (err) {
      console.error('Failed to load admin dashboard data', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (userId: string, targetEmail?: string) => {
    setActionLoadingId(userId);
    try {
      await api.approveAdminRequest(userId);
      setPendingRequests((prev) => prev.filter((r) => (r._id || r.id) !== userId));
      setToast({ type: 'success', text: `Admin access for ${targetEmail || 'user'} approved successfully!` });
      fetchData();
    } catch (err: any) {
      setToast({ type: 'error', text: err.message || 'Failed to approve admin request' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const openRejectModal = (userId: string, userName: string, userEmail: string) => {
    setRejectModalTarget({ id: userId, name: userName || 'User', email: userEmail });
  };

  const executeReject = async () => {
    if (!rejectModalTarget) return;
    const { id, email } = rejectModalTarget;
    setActionLoadingId(id);
    try {
      await api.rejectAdminRequest(id);
      setPendingRequests((prev) => prev.filter((r) => (r._id || r.id) !== id));
      setToast({ type: 'success', text: `Admin request for ${email} declined.` });
      fetchData();
    } catch (err: any) {
      setToast({ type: 'error', text: err.message || 'Failed to reject request' });
    } finally {
      setActionLoadingId(null);
      setRejectModalTarget(null);
    }
  };

  const executeDeleteUser = async () => {
    if (!deleteModalTarget) return;
    const { id, email } = deleteModalTarget;
    setActionLoadingId(id);
    try {
      await api.deleteUser(id);
      setToast({ type: 'success', text: `User ${email} permanently deleted from database.` });
      fetchData();
    } catch (err: any) {
      setToast({ type: 'error', text: err.message || 'Failed to delete user' });
    } finally {
      setActionLoadingId(null);
      setDeleteModalTarget(null);
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

      {/* Pending Admin Requests Section */}
      {isSuperAdmin && pendingRequests.length > 0 && (
        <div className="glass-panel p-6 rounded-3xl border border-amber-500/30 bg-amber-500/5 space-y-4">
          <div className="flex items-center justify-between border-b border-amber-500/20 pb-4">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Users className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-white">Pending Admin Registration Requests</h2>
                <p className="text-xs text-amber-200/70">Review and approve or decline requested admin access</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
              {pendingRequests.length} Pending
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-amber-300/80 uppercase text-[10px] tracking-wider font-semibold border-b border-amber-500/20">
                <tr>
                  <th className="px-4 py-3">Applicant Name</th>
                  <th className="px-4 py-3">Email Address</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Requested At</th>
                  <th className="px-4 py-3 text-right">Approval Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {pendingRequests.map((req) => {
                  const reqId = req._id || req.id;
                  const isProcessing = actionLoadingId === reqId;
                  return (
                    <tr key={reqId} className="hover:bg-slate-900/40 transition-colors">
                      <td className="px-4 py-3 font-bold text-white flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-xs">
                          {req.name ? req.name.charAt(0).toUpperCase() : 'A'}
                        </div>
                        <span>{req.name}</span>
                      </td>
                      <td className="px-4 py-3 font-mono text-amber-200">{req.email}</td>
                      <td className="px-4 py-3 text-slate-400">{req.phone || 'N/A'}</td>
                      <td className="px-4 py-3 text-slate-400">
                        {req.createdAt ? new Date(req.createdAt).toLocaleDateString() : 'Just now'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleApprove(reqId, req.email)}
                            disabled={isProcessing}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-md active:scale-95 disabled:opacity-50"
                          >
                            Approve Admin
                          </button>
                          <button
                            onClick={() => openRejectModal(reqId, req.name, req.email)}
                            disabled={isProcessing}
                            className="px-3 py-1.5 rounded-xl bg-red-600/80 hover:bg-red-600 text-white font-bold text-xs transition-all active:scale-95 disabled:opacity-50"
                          >
                            Decline
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Metrics Cards Grid */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${isSuperAdmin ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-6`}>
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

        {isSuperAdmin && (
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
        )}
      </div>

      {/* Quick Action Navigation */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${isSuperAdmin ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-6`}>
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

        {isSuperAdmin && (
          <a href="#users-section" className="glass-card glass-card-hover p-6 rounded-3xl border border-slate-800 space-y-3 group">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white group-hover:text-emerald-300">Manage Users</h3>
            <p className="text-xs text-slate-400">
              Inspect registered accounts, user roles, active statuses, and details.
            </p>
          </a>
        )}
      </div>

      {/* Super Admin User Management Table Section */}
      {isSuperAdmin && (
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
                <th className="px-4 py-3 text-right">Actions / Approval</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {users.length > 0 ? (
                users.map((u) => {
                  const uId = u._id || u.id;
                  const isSuper = u.email === 'swalimohd048@gmail.com' || u.isSuperAdmin;
                  const currentStatus = u.status || 'active';
                  const isProcessing = actionLoadingId === uId;

                  return (
                    <tr key={uId} className="hover:bg-slate-900/40 transition-colors">
                      <td className="px-4 py-3 flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-xs">
                          {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <span className="font-bold text-white">
                          {isSuper ? 'PosterCraft Admin' : u.name}
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
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] uppercase font-semibold border ${
                            currentStatus === 'active'
                              ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/20'
                              : currentStatus === 'pending'
                              ? 'bg-amber-950/40 text-amber-300 border-amber-500/30 animate-pulse'
                              : 'bg-red-950/40 text-red-400 border-red-500/20'
                          }`}
                        >
                          {currentStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isSuper ? (
                          <span className="text-[10px] font-semibold text-slate-500 italic">Primary Super Admin</span>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            {currentStatus !== 'active' && (
                              <button
                                onClick={() => handleApprove(uId, u.email)}
                                disabled={isProcessing}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition-all shadow-md active:scale-95 disabled:opacity-50"
                              >
                                Approve Admin
                              </button>
                            )}
                            {currentStatus !== 'rejected' && (
                              <button
                                onClick={() => openRejectModal(uId, u.name, u.email)}
                                disabled={isProcessing}
                                className="px-2.5 py-1 rounded-lg bg-red-600/80 hover:bg-red-600 text-white font-bold text-[11px] transition-all active:scale-95 disabled:opacity-50"
                              >
                                Decline
                              </button>
                            )}
                            <button
                              onClick={() => setDeleteModalTarget({ id: uId, name: u.name, email: u.email })}
                              disabled={isProcessing}
                              title="Delete User permanently"
                              className="p-1.5 rounded-lg bg-red-950/40 border border-red-500/30 text-red-400 hover:bg-red-900/60 hover:text-red-200 transition-all active:scale-95 disabled:opacity-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                    No user accounts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-up flex items-center gap-3 px-4 py-3 rounded-2xl glass-panel border shadow-2xl text-xs font-bold text-white transition-all bg-slate-900/95 border-slate-800">
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          )}
          <span>{toast.text}</span>
          <button onClick={() => setToast(null)} className="ml-2 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Custom Confirmation Modal */}
      {rejectModalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="max-w-md w-full glass-panel rounded-3xl p-6 border border-slate-800 shadow-2xl space-y-5 relative">
            <button
              onClick={() => setRejectModalTarget(null)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white font-heading">Decline Admin Request?</h3>
                <p className="text-xs text-slate-400 mt-0.5">This action will reject the applicant's access request.</p>
              </div>
            </div>

            <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-1 text-xs">
              <p className="text-slate-300">
                Are you sure you want to decline access for <strong className="text-white">{rejectModalTarget.name}</strong>?
              </p>
              <p className="font-mono text-slate-400 pt-1">{rejectModalTarget.email}</p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setRejectModalTarget(null)}
                disabled={!!actionLoadingId}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={executeReject}
                isLoading={!!actionLoadingId}
              >
                Decline Request
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Developer Showcase Banner (Dashboard Only) */}
      <div className="pt-4">
        <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 md:p-10 bg-gradient-to-r from-slate-900/90 via-indigo-950/40 to-slate-900/90 border border-indigo-500/30 shadow-2xl backdrop-blur-xl group hover:border-indigo-500/60 transition-all duration-500">
          {/* Animated Background Ambient Orbs */}
          <div className="absolute top-0 right-1/4 -mt-12 w-72 h-72 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none group-hover:bg-indigo-500/30 transition-all duration-700 animate-pulse-glow" />
          <div className="absolute bottom-0 left-10 -mb-12 w-72 h-72 bg-violet-600/20 rounded-full blur-3xl pointer-events-none group-hover:bg-pink-500/20 transition-all duration-700" />

          {/* Grid pattern overlay */}
          <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="space-y-4 max-w-3xl">
              {/* Status & Role Badges */}
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold shadow-sm">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span>Full-Stack Lead Engineer</span>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 text-xs font-medium">
                  <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Canvas Engine Architect</span>
                </div>
              </div>

              {/* Title & Headline */}
              <h3 className="text-2xl sm:text-3xl font-black font-heading text-white tracking-tight leading-tight">
                PosterCraft Engine & Web Platform Built by{' '}
                <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent font-black drop-shadow-md">
                  Muhammed Swalih
                </span>
              </h3>

              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                Specializing in scalable full-stack web architectures, high-performance canvas engine design, and automated poster generation workflows.
              </p>

              {/* Tech Stack Pills */}
              <div className="pt-1 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-slate-300">
                <span className="px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center gap-1.5 text-indigo-300">
                  <Code2 className="w-3 h-3 text-indigo-400" /> React 19
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center gap-1.5 text-sky-300">
                  <Terminal className="w-3 h-3 text-sky-400" /> TypeScript
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center gap-1.5 text-emerald-300">
                  <Globe className="w-3 h-3 text-emerald-400" /> Node.js & Express
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center gap-1.5 text-violet-300">
                  <Layers className="w-3 h-3 text-violet-400" /> MongoDB
                </span>
              </div>
            </div>

            {/* Interactive Call-To-Action Button */}
            <div className="shrink-0 flex items-center">
              <a
                href="https://personal-portfolio-tau-ashy.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 text-white font-bold text-xs shadow-2xl shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 border border-white/10 group/btn"
              >
                <Code2 className="w-4 h-4 text-indigo-200 group-hover/btn:rotate-12 transition-transform" />
                <span className="tracking-wide">Explore Portfolio & Projects</span>
                <ArrowUpRight className="w-4 h-4 text-pink-200 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Delete Confirmation Modal */}
      {deleteModalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="max-w-md w-full glass-panel rounded-3xl p-6 border border-slate-800 shadow-2xl space-y-5 relative">
            <button
              onClick={() => setDeleteModalTarget(null)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white font-heading">Delete User Account?</h3>
                <p className="text-xs text-slate-400 mt-0.5">This action will permanently delete the user from MongoDB.</p>
              </div>
            </div>

            <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-1 text-xs">
              <p className="text-slate-300">
                Are you sure you want to permanently delete <strong className="text-white">{deleteModalTarget.name}</strong>?
              </p>
              <p className="font-mono text-slate-400 pt-1">{deleteModalTarget.email}</p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setDeleteModalTarget(null)}
                disabled={!!actionLoadingId}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={executeDeleteUser}
                isLoading={!!actionLoadingId}
              >
                Delete Account
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
