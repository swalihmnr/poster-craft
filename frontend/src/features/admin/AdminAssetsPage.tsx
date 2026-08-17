import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Asset } from '../../types';
import { Button } from '../../components/ui/Button';
import { Image as ImageIcon, Upload, Trash2, Loader2, Copy, Check, FileCode } from 'lucide-react';

import { toast } from '../../components/ui/Toast';

export const AdminAssetsPage: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [assetType, setAssetType] = useState<'psd' | 'frame' | 'logo' | 'background'>('psd');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    setIsLoading(true);
    try {
      const data = await api.listAssets();
      setAssets(data);
    } catch (err) {
      console.error('Failed to load assets', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check extension if PSD
    const isPsd = file.name.toLowerCase().endsWith('.psd');
    const selectedType = isPsd ? 'psd' : assetType;

    setIsUploading(true);
    try {
      await api.uploadAsset(file, selectedType as any);
      fetchAssets();
      toast.success(`Uploaded ${file.name} successfully as ${selectedType.toUpperCase()}`);
    } catch (err: any) {
      toast.error(err.message || 'Asset upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this asset?')) return;
    try {
      await api.deleteAsset(id);
      toast.success('Asset deleted successfully');
      fetchAssets();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete asset');
    }
  };

  const handleCopyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.info('Asset URL copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-extrabold font-heading text-white flex items-center gap-2">
            <FileCode className="w-6 h-6 text-indigo-400" />
            Asset & PSD Template Library
          </h1>
          <p className="text-xs text-slate-400 mt-1">Upload PSD templates, background frames, overlays, and logos for admin design</p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={assetType}
            onChange={(e) => setAssetType(e.target.value as any)}
            className="bg-slate-900 text-slate-100 text-xs font-bold rounded-xl px-3 py-2 border border-slate-800 focus:outline-none"
          >
            <option value="psd">PSD Photoshop File (.psd)</option>
            <option value="frame">Background Frame (.png)</option>
            <option value="logo">Logo / Overlay (.png)</option>
            <option value="background">Background Image (.jpg/webp)</option>
          </select>

          <label className="inline-flex items-center">
            <Button variant="primary" size="md" isLoading={isUploading} leftIcon={<Upload className="w-4 h-4" />}>
              Upload File (PSD / Image)
            </Button>
            <input type="file" accept="image/*,.psd,.png,.jpg,.jpeg,.webp,.svg,.tiff,.bmp" onChange={handleUpload} className="hidden" />
          </label>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      ) : assets.length === 0 ? (
        <div className="text-center py-16 glass-panel rounded-3xl p-8 max-w-md mx-auto border border-slate-800">
          <FileCode className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No Assets or PSD Files Uploaded Yet</h3>
          <p className="text-xs text-slate-400 mt-1">Upload PSD files or background frames to use in your poster templates.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {assets.map((asset) => (
            <div key={asset._id} className="glass-panel p-3 rounded-2xl border border-slate-800 space-y-2 group">
              <div className="aspect-square rounded-xl bg-slate-900 overflow-hidden relative border border-slate-800 flex items-center justify-center">
                {asset.url.endsWith('.psd') || asset.type === 'psd' ? (
                  <div className="flex flex-col items-center justify-center text-indigo-400 p-4 text-center">
                    <FileCode className="w-10 h-10 mb-2" />
                    <span className="text-[11px] font-bold uppercase tracking-wider">PSD File</span>
                    <span className="text-[9px] text-slate-500 truncate max-w-full">{asset.publicId}</span>
                  </div>
                ) : (
                  <img src={asset.url} alt="Asset" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                )}
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] font-mono text-slate-400 uppercase font-bold">{asset.type}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleCopyUrl(asset.url, asset._id)}
                    className="p-1 text-slate-400 hover:text-indigo-300"
                    title="Copy File URL"
                  >
                    {copiedId === asset._id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => handleDelete(asset._id)}
                    className="p-1 text-red-400 hover:text-red-300"
                    title="Delete Asset"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
