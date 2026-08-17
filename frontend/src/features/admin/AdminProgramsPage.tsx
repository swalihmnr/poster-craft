import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { Program, TemplateConfig } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import {
  Calendar,
  Plus,
  Edit2,
  Trash2,
  Globe,
  Archive,
  FileText,
  Search,
  Loader2,
  CheckCircle,
  XCircle,
  ExternalLink,
} from 'lucide-react';

export const AdminProgramsPage: React.FC = () => {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [templates, setTemplates] = useState<TemplateConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal state for Create / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [status, setStatus] = useState<'draft' | 'published' | 'archived'>('draft');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [search]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [progRes, tempRes] = await Promise.all([
        api.getAdminPrograms({ search }),
        api.getAdminTemplates(),
      ]);
      setPrograms(progRes);
      setTemplates(tempRes);
    } catch (err) {
      console.error('Error fetching admin programs', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingProgram(null);
    setName('');
    setDescription('');
    setTemplateId(templates[0]?._id || '');
    setStatus('draft');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (prog: Program) => {
    setEditingProgram(prog);
    setName(prog.name);
    setDescription(prog.description || '');
    setTemplateId(prog.templateId?._id || (prog.templateId as any) || '');
    setStatus(prog.status);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !templateId) return;

    setIsSaving(true);
    try {
      if (editingProgram) {
        await api.updateProgram(editingProgram._id, {
          name,
          description,
          templateId: templateId as any,
          status,
        });
      } else {
        await api.createProgram({
          name,
          description,
          templateId: templateId as any,
          status,
        });
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to save program');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (prog: Program) => {
    const nextStatus = prog.status === 'published' ? 'draft' : 'published';
    try {
      await api.updateProgramStatus(prog._id, nextStatus);
      fetchData();
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this program?')) return;
    try {
      await api.deleteProgram(id);
      fetchData();
    } catch (err) {
      console.error('Failed to delete program', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-extrabold font-heading text-white flex items-center gap-2">
            <Calendar className="w-6 h-6 text-indigo-400" />
            Program Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">Create events and attach them to design templates for users</p>
        </div>

        <Button variant="primary" size="md" onClick={handleOpenCreateModal} leftIcon={<Plus className="w-4 h-4" />}>
          Create New Program
        </Button>
      </div>

      {/* Filter / Search Bar */}
      <div className="max-w-md">
        <Input
          placeholder="Search programs by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search className="w-4 h-4" />}
        />
      </div>

      {/* Programs List Table */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      ) : programs.length === 0 ? (
        <div className="text-center py-16 glass-panel rounded-3xl p-8 max-w-md mx-auto border border-slate-800">
          <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No Programs Created Yet</h3>
          <p className="text-xs text-slate-400 mt-1">Click the button above to create your first event program.</p>
        </div>
      ) : (
        <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-300 font-semibold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Program Name & Slug</th>
                  <th className="px-6 py-4">Linked Template</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {programs.map((prog) => (
                  <tr key={prog._id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="px-6 py-4 font-medium text-white">
                      <div className="font-bold text-sm text-indigo-300">{prog.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">/{prog.slug}</div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-200">
                        {prog.templateId?.name || 'Default Template'}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {prog.templateId?.width || 1080}×{prog.templateId?.height || 1350} px
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleStatus(prog)}
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
                          prog.status === 'published'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {prog.status === 'published' ? (
                          <>
                            <CheckCircle className="w-3 h-3" /> Published
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" /> Draft
                          </>
                        )}
                      </button>
                    </td>

                    <td className="px-6 py-4 text-right space-x-2">
                      <Link to={`/create/${prog._id}`} target="_blank" className="inline-block p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300" title="Preview User Flow">
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleOpenEditModal(prog)}
                        className="p-2 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400"
                        title="Edit Program"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(prog._id)}
                        className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400"
                        title="Delete Program"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="max-w-md w-full glass-panel rounded-3xl p-6 border border-slate-800 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">
              {editingProgram ? 'Edit Program' : 'Create New Program'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Program Name"
                placeholder="e.g. Developer Summit 2026 Badge"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Program event details..."
                  className="w-full bg-slate-900/80 text-slate-100 placeholder-slate-500 text-xs rounded-xl p-3 border border-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Linked Design Template
                </label>
                <select
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value)}
                  className="w-full bg-slate-900 text-slate-100 text-xs rounded-xl p-3 border border-slate-800 focus:outline-none focus:border-indigo-500"
                  required
                >
                  <option value="">-- Select Template --</option>
                  {templates.map((temp) => (
                    <option key={temp._id} value={temp._id}>
                      {temp.name} ({temp.width}x{temp.height} px)
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Publication Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full bg-slate-900 text-slate-100 text-xs rounded-xl p-3 border border-slate-800 focus:outline-none focus:border-indigo-500"
                >
                  <option value="draft">Draft (Private to Admin)</option>
                  <option value="published">Published (Public to Users)</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-900">
                <Button type="button" variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" isLoading={isSaving}>
                  Save Program
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
