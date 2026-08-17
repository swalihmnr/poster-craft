import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { Program } from '../../types';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Search, Sparkles, Calendar, ArrowRight, Loader2, Image as ImageIcon } from 'lucide-react';

export const ProgramListPage: React.FC = () => {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchPrograms();
  }, [search]);

  const fetchPrograms = async () => {
    setIsLoading(true);
    try {
      const data = await api.getPublicPrograms({ search });
      setPrograms(data);
    } catch (err) {
      console.error('Failed to load programs', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto mb-12 relative">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-4">
          <Sparkles className="w-4 h-4" />
          <span>Instant Poster Personalizer — No Sign-Up Required!</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black font-heading text-white tracking-tight leading-tight">
          Select a Program to Personalize Your <span className="gradient-text">Custom Poster</span>
        </h1>
        <p className="text-sm sm:text-base text-slate-400 mt-4 leading-relaxed">
          Choose an active event program below, upload your photo, enter your name, and download high-resolution customized poster badges in seconds.
        </p>

        {/* Search Input */}
        <div className="mt-8 max-w-md mx-auto">
          <Input
            placeholder="Search programs by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>
      </div>

      {/* Program Cards Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
          <span className="text-sm font-semibold text-slate-400">Loading Available Programs...</span>
        </div>
      ) : programs.length === 0 ? (
        <div className="text-center py-20 glass-panel rounded-3xl p-8 max-w-md mx-auto border border-slate-800">
          <ImageIcon className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white">No Published Programs Found</h3>
          <p className="text-xs text-slate-400 mt-1">
            {search ? `No programs match "${search}"` : 'Admin has not published any poster programs yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {programs.map((program) => (
            <div
              key={program._id}
              className="glass-card glass-card-hover rounded-3xl p-6 flex flex-col justify-between group border border-slate-800"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[11px] font-bold uppercase tracking-wider">
                    Official Template
                  </span>
                  <span className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                    <Calendar className="w-3 h-3" />
                    {program.createdAt ? new Date(program.createdAt).toLocaleDateString() : 'Active'}
                  </span>
                </div>

                <h3 className="text-xl font-bold font-heading text-white group-hover:text-indigo-300 transition-colors">
                  {program.name}
                </h3>
                <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                  {program.description || 'Customizable poster template for participants, speakers, and delegates.'}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <div className="text-xs text-slate-400">
                  Canvas: <span className="font-semibold text-slate-300">{program.templateId?.width || 1080}×{program.templateId?.height || 1350}</span>
                </div>

                <Link to={`/create/${program._id}`}>
                  <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                    Create Poster
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
