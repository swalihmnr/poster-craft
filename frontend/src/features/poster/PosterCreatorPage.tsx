import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { api } from '../../services/api';
import { Program, UserPosterInput } from '../../types';
import { CanvasRenderer, preloadTemplateAssets } from '../../engine/CanvasRenderer';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import {
  Upload,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  User as UserIcon,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Sliders,
  Image as ImageIcon,
} from 'lucide-react';

export const PosterCreatorPage: React.FC = () => {
  const { programId } = useParams<{ programId: string }>();
  const navigate = useNavigate();

  const [program, setProgram] = useState<Program | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  // User input state
  const [name, setName] = useState('Swalih');
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [photos, setPhotos] = useState<Record<string, string>>({});
  const [crops, setCrops] = useState<Record<string, { zoom: number; offsetX: number; offsetY: number; rotation: number }>>({});
  const [activePhotoSlot, setActivePhotoSlot] = useState<string>('');

  const [crop, setCrop] = useState({
    zoom: 1,
    offsetX: 0,
    offsetY: 0,
    rotation: 0,
  });

  const [activeTab, setActiveTab] = useState<'upload' | 'adjust'>('upload');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const photoLayers = program?.templateId?.layers?.filter(
    (l) => l.type === 'image' && l.source !== 'static'
  ) || [];

  useEffect(() => {
    if (programId) {
      fetchProgram();
    }
  }, [programId]);

  useEffect(() => {
    if (photoLayers.length > 0 && !activePhotoSlot) {
      setActivePhotoSlot(photoLayers[0].id);
    }
  }, [photoLayers]);

  const fetchProgram = async () => {
    setIsLoading(true);
    try {
      const data = await api.getPublicProgramById(programId!);
      setProgram(data);
    } catch (err) {
      console.error('Failed to load program', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Re-render canvas whenever input or program updates
  useEffect(() => {
    if (program && program.templateId && canvasRef.current) {
      renderCanvas();
    }
  }, [program, name, photoUrl, photos, crop, crops]);

  const renderCanvas = async () => {
    if (!program?.templateId || !canvasRef.current) return;

    const primaryLayerId = photoLayers[0]?.id;
    const primaryPhoto = (primaryLayerId && photos[primaryLayerId]) || photos['user-photo'] || photoUrl;

    const inputData: UserPosterInput = {
      name,
      photoUrl: primaryPhoto,
      photos,
      crop: (primaryLayerId && crops[primaryLayerId]) || crop,
      crops,
    };

    await preloadTemplateAssets(program.templateId, inputData);
    await CanvasRenderer.render(canvasRef.current, program.templateId, inputData, {
      scale: 1,
      showPlaceholders: true,
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, slotId?: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('File size exceeds 10MB limit');
      return;
    }

    const targetSlot = slotId || activePhotoSlot || photoLayers[0]?.id || 'user-photo';

    try {
      const objectUrl = URL.createObjectURL(file);
      setPhotos((prev) => ({ ...prev, [targetSlot]: objectUrl, [photoLayers.find(l => l.id === targetSlot)?.source as string || targetSlot]: objectUrl }));
      setPhotoUrl(objectUrl);
      setActiveTab('adjust');

      if (!crops[targetSlot]) {
        setCrops((prev) => ({
          ...prev,
          [targetSlot]: { zoom: 1, offsetX: 0, offsetY: 0, rotation: 0 },
        }));
      }

      try {
        const asset = await api.uploadAsset(file, 'photo');
        if (asset.url) {
          setPhotos((prev) => ({ ...prev, [targetSlot]: asset.url, [photoLayers.find(l => l.id === targetSlot)?.source as string || targetSlot]: asset.url }));
          setPhotoUrl(asset.url);
        }
      } catch (err) {
        // Fallback to local object URL
      }
    } catch (err) {
      console.error('File upload error', err);
    }
  };

  const handleDownload = async (format: 'png' | 'webp' = 'png') => {
    if (!program?.templateId) return;
    setIsGenerating(true);

    try {
      const exportCanvas = document.createElement('canvas');
      const primaryLayerId = photoLayers[0]?.id;
      const primaryPhoto = (primaryLayerId && photos[primaryLayerId]) || photos['user-photo'] || photoUrl;
      const inputData: UserPosterInput = { name, photoUrl: primaryPhoto, photos, crop: (primaryLayerId && crops[primaryLayerId]) || crop, crops };

      await preloadTemplateAssets(program.templateId, inputData);
      await CanvasRenderer.render(exportCanvas, program.templateId, inputData, {
        scale: 2,
        showPlaceholders: false,
      });

      const mimeType = format === 'webp' ? 'image/webp' : 'image/png';
      const dataUrl = exportCanvas.toDataURL(mimeType, 0.95);

      const link = document.createElement('a');
      link.download = `${program.slug || 'personalized'}-poster.${format}`;
      link.href = dataUrl;
      link.click();

      try {
        await api.logPosterGeneration({
          programId: program._id,
          templateId: program.templateId._id,
          input: inputData,
          format,
        });
      } catch (logErr) {
        console.warn('Logging generation failed', logErr);
      }

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (err) {
      console.error('Poster generation failed', err);
      alert('Failed to generate poster download');
    } finally {
      setIsGenerating(false);
    }
  };

  const currentSlotId = activePhotoSlot || photoLayers[0]?.id || 'user-photo';
  const currentSlotCrop = crops[currentSlotId] || { zoom: 1, offsetX: 0, offsetY: 0, rotation: 0 };
  const currentSlotPhoto = photos[currentSlotId] || photos[photoLayers.find(l => l.id === currentSlotId)?.source as string || ''] || photoUrl;

  const updateCurrentSlotCrop = (updates: Partial<{ zoom: number; offsetX: number; offsetY: number; rotation: number }>) => {
    setCrops((prev) => {
      const existing = prev[currentSlotId] || { zoom: 1, offsetX: 0, offsetY: 0, rotation: 0 };
      const updated = { ...existing, ...updates };
      setCrop(updated);
      return { ...prev, [currentSlotId]: updated };
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
        <span className="text-sm font-semibold text-slate-400">Loading Program Details...</span>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold text-white">Program Not Found</h2>
        <Link to="/programs" className="text-indigo-400 text-sm hover:underline mt-2 inline-block">
          Return to Programs List
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button & Title */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/programs')}
            className="p-2 rounded-xl bg-slate-900 text-slate-300 hover:text-white border border-slate-800"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-black font-heading text-white">{program.name}</h1>
            <p className="text-xs text-slate-400">Personalize your custom poster badge</p>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: User Controls */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-6">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-400" />
              Poster Personalization
            </h3>

            {/* 1. Name Input */}
            <div className="space-y-1.5">
              <Input
                label="Your Full Name"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                leftIcon={<UserIcon className="w-4 h-4" />}
              />
            </div>

            {/* Tab navigation for Upload vs Adjust Crop */}
            <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'upload' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                1. Upload Photo
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('adjust')}
                disabled={!photoUrl}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'adjust' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white opacity-50'
                }`}
              >
                2. Adjust Photo
              </button>
            </div>

            {/* Photo Slots Selector if template contains multiple photo frames */}
            {photoLayers.length > 1 && (
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300">
                  Select Photo Slot to Edit
                </label>
                <div className="flex gap-1.5 overflow-x-auto pb-1">
                  {photoLayers.map((layer, idx) => (
                    <button
                      key={layer.id}
                      type="button"
                      onClick={() => setActivePhotoSlot(layer.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap border transition-all ${
                        currentSlotId === layer.id
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-500/20'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      📷 {layer.name || `Photo Slot ${idx + 1}`}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 2. Photo Upload Box */}
            {activeTab === 'upload' ? (
              <div className="space-y-3">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  {photoLayers.length > 1 ? `Upload Photo for ${photoLayers.find(l => l.id === currentSlotId)?.name || 'Selected Slot'}` : 'Select Your Photo'}
                </label>
                <label className="border-2 border-dashed border-slate-700 hover:border-indigo-500/80 bg-slate-900/60 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors group">
                  <div className="p-3 rounded-full bg-indigo-500/10 text-indigo-400 group-hover:scale-110 transition-transform mb-3">
                    <Upload className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-slate-200">
                    {currentSlotPhoto ? 'Change Selected Photo' : 'Click to Upload or Drag & Drop'}
                  </span>
                  <span className="text-[10px] text-slate-500 mt-1">JPEG, PNG, or WebP up to 10MB</span>
                  <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, currentSlotId)} className="hidden" />
                </label>

                {currentSlotPhoto && (
                  <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium pt-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Photo loaded! Switch to Adjust tab to set position and zoom.</span>
                  </div>
                )}
              </div>
            ) : (
              /* 3. Interactive Crop / Reposition Controls */
              <div className="space-y-5 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-slate-300">
                    {photoLayers.length > 1 ? `${photoLayers.find(l => l.id === currentSlotId)?.name || 'Photo'} Position & Alignment` : 'Photo Zoom & Alignment'}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateCurrentSlotCrop({ zoom: 1, offsetX: 0, offsetY: 0, rotation: 0 })}
                    className="text-[11px] font-semibold text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" /> Reset
                  </button>
                </div>

                {/* Zoom Slider */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1"><ZoomOut className="w-3.5 h-3.5" /> Zoom</span>
                    <span className="font-mono">{currentSlotCrop.zoom.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="3"
                    step="0.05"
                    value={currentSlotCrop.zoom}
                    onChange={(e) => updateCurrentSlotCrop({ zoom: parseFloat(e.target.value) })}
                    className="w-full accent-indigo-500 bg-slate-800 rounded-lg h-1.5 cursor-pointer"
                  />
                </div>

                {/* Offset X Slider */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Horizontal Shift (X Position)</span>
                    <span className="font-mono">{currentSlotCrop.offsetX}px</span>
                  </div>
                  <input
                    type="range"
                    min="-400"
                    max="400"
                    step="5"
                    value={currentSlotCrop.offsetX}
                    onChange={(e) => updateCurrentSlotCrop({ offsetX: parseInt(e.target.value) })}
                    className="w-full accent-indigo-500 bg-slate-800 rounded-lg h-1.5 cursor-pointer"
                  />
                </div>

                {/* Offset Y Slider */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Vertical Shift (Y Position)</span>
                    <span className="font-mono">{currentSlotCrop.offsetY}px</span>
                  </div>
                  <input
                    type="range"
                    min="-400"
                    max="400"
                    step="5"
                    value={currentSlotCrop.offsetY}
                    onChange={(e) => updateCurrentSlotCrop({ offsetY: parseInt(e.target.value) })}
                    className="w-full accent-indigo-500 bg-slate-800 rounded-lg h-1.5 cursor-pointer"
                  />
                </div>

                {/* Photo Rotation Slider */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1"><RotateCcw className="w-3.5 h-3.5" /> Photo Rotation</span>
                    <span className="font-mono">{currentSlotCrop.rotation || 0}°</span>
                  </div>
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    step="1"
                    value={currentSlotCrop.rotation || 0}
                    onChange={(e) => updateCurrentSlotCrop({ rotation: parseInt(e.target.value) })}
                    className="w-full accent-indigo-500 bg-slate-800 rounded-lg h-1.5 cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* Download Buttons */}
            <div className="pt-4 border-t border-slate-800 space-y-2">
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={() => handleDownload('png')}
                isLoading={isGenerating}
                leftIcon={<Download className="w-5 h-5" />}
              >
                Download Poster (PNG)
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="w-full"
                onClick={() => handleDownload('webp')}
                disabled={isGenerating}
              >
                Download Compact WebP
              </Button>
            </div>
          </div>
        </div>

        {/* Right Column: Live Poster Canvas Preview */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div className="w-full glass-panel rounded-3xl p-6 border border-slate-800 flex flex-col items-center">
            <div className="flex items-center justify-between w-full mb-4 px-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Live Poster Preview
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                {program.templateId?.width || 1080} × {program.templateId?.height || 1350} px
              </span>
            </div>

            {/* Canvas Container */}
            <div className="relative max-w-full overflow-hidden rounded-2xl border border-slate-800 shadow-2xl bg-slate-900/90 flex items-center justify-center p-2">
              <canvas
                ref={canvasRef}
                className="max-w-full max-h-[650px] w-auto h-auto object-contain rounded-xl shadow-inner"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
