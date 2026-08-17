import React from 'react';
import {
  Sparkles,
  Shield,
  Zap,
  Image as ImageIcon,
  ExternalLink,
  Code2,
  ArrowUpRight,
  Terminal,
  Cpu,
  Layers,
  Globe,
} from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 border-t border-slate-900 text-slate-400 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        <div className="space-y-4 md:col-span-1">
          <div>
            <span className="text-lg font-extrabold text-white font-heading">
              Poster<span className="gradient-text">Craft</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Enterprise data-driven poster personalization engine. Design once, personalize for thousands instantly.
          </p>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">Platform</h4>
          <ul className="space-y-2 text-xs">
            <li><a href="/programs" className="hover:text-indigo-400 transition-colors">Browse Programs</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">Features</h4>
          <ul className="space-y-2 text-xs">
            <li className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-amber-400" /> Dynamic Canvas Engine</li>
            <li className="flex items-center gap-1.5"><ImageIcon className="w-3.5 h-3.5 text-indigo-400" /> Instant PNG / WebP Export</li>
            <li className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-emerald-400" /> Multi-Tenant Ready</li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">Architecture</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Built with React, TypeScript, Express, Mongoose, Zod & HTML Canvas. Clean separation of Admin Design & User Personalization.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
        <div>&copy; 2026 PosterCraft. All rights reserved.</div>

        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 transition-all group">
          <span className="text-slate-400">Designed & Engineered by</span>
          <a
            href="https://personal-portfolio-tau-ashy.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 transition-colors"
          >
            <span>Muhammed Swalih</span>
            <ExternalLink className="w-3.5 h-3.5 text-indigo-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </a>
        </div>

        <div className="flex items-center gap-4 text-slate-500">
          <span>Privacy Policy</span>
          <span>Terms of Service</span>
        </div>
      </div>
    </footer>
  );
};
