import React, { useState, useEffect, useRef } from 'react';
import { readPsd } from 'ag-psd';
import { api } from '../../services/api';
import { TemplateConfig, TemplateLayer, CropShape, Asset } from '../../types';
import { CanvasRenderer, preloadTemplateAssets } from '../../engine/CanvasRenderer';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { toast } from '../../components/ui/Toast';
import {
  Layers,
  Plus,
  Trash2,
  MoveUp,
  MoveDown,
  Save,
  Type,
  Image as ImageIcon,
  UserCheck,
  Upload,
  FileCode,
  Move,
  Maximize2,
  Target,
  Circle,
  Square,
} from 'lucide-react';

export const AdminTemplateEditorPage: React.FC = () => {
  const [templates, setTemplates] = useState<TemplateConfig[]>([]);
  const [currentTemplate, setCurrentTemplate] = useState<TemplateConfig | null>(null);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingFrame, setIsUploadingFrame] = useState(false);

  // Mouse Drag / Resize / Rotate interaction state
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number; initialX?: number; initialY?: number; initialW?: number; initialH?: number }>({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    fetchTemplatesAndAssets();
  }, []);

  const fetchTemplatesAndAssets = async () => {
    setIsLoading(true);
    try {
      const [tempData, assetData] = await Promise.all([
        api.getAdminTemplates(),
        api.listAssets(),
      ]);
      setTemplates(tempData);
      setAssets(assetData);
      if (tempData.length > 0) {
        setCurrentTemplate(tempData[0]);
        setSelectedLayerId(tempData[0].layers[0]?.id || null);
      }
    } catch (err) {
      console.error('Failed to load templates or assets', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentTemplate && canvasRef.current) {
      renderCanvas();
    }
  }, [currentTemplate, selectedLayerId]);

  const renderCanvas = async () => {
    if (!currentTemplate || !canvasRef.current) return;
    const sampleInput = { name: 'JOHN DOE', photoUrl: '' };
    await preloadTemplateAssets(currentTemplate, sampleInput);
    await CanvasRenderer.render(canvasRef.current, currentTemplate, sampleInput, {
      scale: 1,
      selectedLayerId: selectedLayerId || undefined,
      showPlaceholders: true,
    });
  };

  const selectedLayer = currentTemplate?.layers.find((l) => l.id === selectedLayerId);

  const updateSelectedLayer = (updates: Partial<TemplateLayer>) => {
    if (!currentTemplate || !selectedLayerId) return;
    const updatedLayers = currentTemplate.layers.map((l) =>
      l.id === selectedLayerId ? { ...l, ...updates } : l
    );
    setCurrentTemplate({ ...currentTemplate, layers: updatedLayers });
  };

  // --- Interactive Canvas Mouse Events (Drag-to-Move, Drag-to-Resize & Drag-to-Rotate) ---
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !currentTemplate || !selectedLayer) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = currentTemplate.width / rect.width;
    const scaleY = currentTemplate.height / rect.height;

    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    // Center of current selected layer
    const centerX = selectedLayer.x + selectedLayer.width / 2;
    const centerY = selectedLayer.y + selectedLayer.height / 2;

    // Convert mouse position to layer coordinate frame
    const rotRad = -((selectedLayer.rotation || 0) * Math.PI) / 180;
    const unrotMouseX = centerX + (mouseX - centerX) * Math.cos(rotRad) - (mouseY - centerY) * Math.sin(rotRad);
    const unrotMouseY = centerY + (mouseX - centerX) * Math.sin(rotRad) + (mouseY - centerY) * Math.cos(rotRad);

    // Top Rotation Knob position (35px above top-center)
    const rotX = selectedLayer.x + selectedLayer.width / 2;
    const rotY = selectedLayer.y - 35;
    const distToRot = Math.hypot(unrotMouseX - rotX, unrotMouseY - rotY);

    // Corner handle position (bottom-right)
    const cornerX = selectedLayer.x + selectedLayer.width;
    const cornerY = selectedLayer.y + selectedLayer.height;
    const distToCorner = Math.hypot(unrotMouseX - cornerX, unrotMouseY - cornerY);

    if (distToRot < 40) {
      setIsRotating(true);
    } else if (distToCorner < 45) {
      setIsResizing(true);
      setDragStart({
        x: mouseX,
        y: mouseY,
        initialW: selectedLayer.width,
        initialH: selectedLayer.height,
      });
    } else if (
      unrotMouseX >= selectedLayer.x - 20 &&
      unrotMouseX <= selectedLayer.x + selectedLayer.width + 20 &&
      unrotMouseY >= selectedLayer.y - 20 &&
      unrotMouseY <= selectedLayer.y + selectedLayer.height + 20
    ) {
      setIsDragging(true);
      setDragStart({
        x: mouseX,
        y: mouseY,
        initialX: selectedLayer.x,
        initialY: selectedLayer.y,
      });
    } else {
      // Find if clicking another layer
      const clicked = currentTemplate.layers.find(
        (l) =>
          mouseX >= l.x &&
          mouseX <= l.x + l.width &&
          mouseY >= l.y &&
          mouseY <= l.y + l.height
      );
      if (clicked) {
        setSelectedLayerId(clicked.id);
        setIsDragging(true);
        setDragStart({
          x: mouseX,
          y: mouseY,
          initialX: clicked.x,
          initialY: clicked.y,
        });
      }
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !currentTemplate || !selectedLayer) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = currentTemplate.width / rect.width;
    const scaleY = currentTemplate.height / rect.height;

    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    if (isRotating) {
      const centerX = selectedLayer.x + selectedLayer.width / 2;
      const centerY = selectedLayer.y + selectedLayer.height / 2;
      const angleRad = Math.atan2(mouseY - centerY, mouseX - centerX);
      let angleDeg = Math.round((angleRad * 180) / Math.PI) + 90;
      if (angleDeg > 180) angleDeg -= 360;
      if (angleDeg < -180) angleDeg += 360;

      updateSelectedLayer({ rotation: angleDeg });
    } else if (isResizing) {
      const deltaX = mouseX - dragStart.x;
      const deltaY = mouseY - dragStart.y;
      const newWidth = Math.max(50, Math.round((dragStart.initialW || 100) + deltaX));
      const newHeight = Math.max(50, Math.round((dragStart.initialH || 100) + deltaY));
      updateSelectedLayer({ width: newWidth, height: newHeight });
    } else if (isDragging) {
      const deltaX = mouseX - dragStart.x;
      const deltaY = mouseY - dragStart.y;
      const newX = Math.round((dragStart.initialX || 0) + deltaX);
      const newY = Math.round((dragStart.initialY || 0) + deltaY);
      updateSelectedLayer({ x: newX, y: newY });
    }
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setIsRotating(false);
  };

  // --- Photo Area Position Presets ---
  const applyPhotoPreset = (preset: 'center' | 'top-circle' | 'large-box' | 'full-frame') => {
    if (!currentTemplate || !selectedLayer) return;
    const tw = currentTemplate.width;
    const th = currentTemplate.height;

    if (preset === 'center') {
      const size = Math.round(Math.min(tw, th) * 0.45);
      updateSelectedLayer({
        x: Math.round((tw - size) / 2),
        y: Math.round((th - size) / 2),
        width: size,
        height: size,
      });
    } else if (preset === 'top-circle') {
      const size = Math.round(Math.min(tw, th) * 0.4);
      updateSelectedLayer({
        x: Math.round((tw - size) / 2),
        y: Math.round(th * 0.15),
        width: size,
        height: size,
        crop: { shape: 'circle' },
      });
    } else if (preset === 'large-box') {
      const w = Math.round(tw * 0.7);
      const h = Math.round(th * 0.55);
      updateSelectedLayer({
        x: Math.round((tw - w) / 2),
        y: Math.round((th - h) / 2),
        width: w,
        height: h,
        crop: { shape: 'rounded-rect', borderRadius: 30 },
      });
    } else if (preset === 'full-frame') {
      updateSelectedLayer({
        x: 0,
        y: 0,
        width: tw,
        height: th,
        crop: { shape: 'rect' },
      });
    }
  };

  const handleSelectTemplate = async (templateId: string) => {
    const found = templates.find((t) => t._id === templateId);
    if (found) {
      setCurrentTemplate(found);
      setSelectedLayerId(found.layers[0]?.id || null);
    }
  };

  const handleCreateNewTemplate = async () => {
    const newTemp: Partial<TemplateConfig> = {
      name: `Template ${Date.now().toString().slice(-4)}`,
      width: 1080,
      height: 1350,
      background: { type: 'color', value: '#0f172a' },
      version: 1,
      status: 'draft',
      layers: [
        {
          id: 'photo_placeholder',
          name: 'User Photo Area',
          type: 'image',
          source: 'user-photo',
          x: 290,
          y: 200,
          width: 500,
          height: 500,
          rotation: 0,
          zIndex: 1,
          crop: { shape: 'circle' },
        },
        {
          id: 'user_name_layer',
          name: 'User Name',
          type: 'text',
          source: 'user.name',
          x: 100,
          y: 760,
          width: 880,
          height: 80,
          rotation: 0,
          zIndex: 2,
          style: {
            fontFamily: 'Outfit',
            fontSize: 60,
            fontWeight: 'bold',
            color: '#ffffff',
            textAlign: 'center',
          },
        },
      ],
    };

    try {
      const created = await api.createTemplate(newTemp);
      setTemplates([created, ...templates]);
      setCurrentTemplate(created);
      setSelectedLayerId(created.layers[0]?.id || null);
    } catch (err) {
      console.error('Failed to create template', err);
    }
  };

  const handleSaveTemplate = async () => {
    if (!currentTemplate) return;
    setIsSaving(true);
    try {
      const { _id, createdBy, createdAt, updatedAt, version, __v, ...cleanPayload } = currentTemplate as any;
      if (Array.isArray(cleanPayload.layers)) {
        cleanPayload.layers = cleanPayload.layers.map((l: any) => {
          const { _id: layerId, ...rest } = l;
          return rest;
        });
      }

      let updated: TemplateConfig;
      const isValidMongoId = typeof _id === 'string' && /^[0-9a-fA-F]{24}$/.test(_id);

      if (isValidMongoId) {
        updated = await api.updateTemplate(_id, cleanPayload);
        setTemplates(templates.map((t) => (t._id === updated._id ? updated : t)));
      } else {
        updated = await api.createTemplate(cleanPayload);
        setTemplates([updated, ...templates.filter((t) => t !== currentTemplate)]);
      }

      setCurrentTemplate(updated);
      toast.success('Template configuration saved successfully!');
    } catch (err: any) {
      console.error('Failed to save template:', err);
      toast.error(err.message || 'Failed to save template');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTemplate = async () => {
    if (!currentTemplate) return;
    const confirmDelete = window.confirm(`Are you sure you want to delete the template "${currentTemplate.name}"?`);
    if (!confirmDelete) return;

    try {
      await api.deleteTemplate(currentTemplate._id);
      const remaining = templates.filter((t) => t._id !== currentTemplate._id);
      setTemplates(remaining);
      if (remaining.length > 0) {
        setCurrentTemplate(remaining[0]);
        setSelectedLayerId(remaining[0].layers[0]?.id || null);
      } else {
        setCurrentTemplate(null);
        setSelectedLayerId(null);
      }
      toast.success('Template deleted successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete template');
    }
  };

  const handleDeleteDraftTemplates = async () => {
    const draftTemplates = templates.filter((t) => t.name.startsWith('Template '));
    if (draftTemplates.length === 0) {
      toast.info('No auto-generated draft templates found to clean.');
      return;
    }

    const confirmClean = window.confirm(
      `Delete all ${draftTemplates.length} auto-generated draft templates?`
    );
    if (!confirmClean) return;

    try {
      for (const t of draftTemplates) {
        await api.deleteTemplate(t._id);
      }
      const remaining = templates.filter((t) => !t.name.startsWith('Template '));
      setTemplates(remaining);
      if (remaining.length > 0) {
        setCurrentTemplate(remaining[0]);
        setSelectedLayerId(remaining[0].layers[0]?.id || null);
      } else {
        setCurrentTemplate(null);
        setSelectedLayerId(null);
      }
      toast.success(`Successfully deleted ${draftTemplates.length} draft templates!`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to clean draft templates');
    }
  };

  const updateSelectedLayerStyle = (styleUpdates: any) => {
    if (!selectedLayer) return;
    updateSelectedLayer({
      style: { ...selectedLayer.style, ...styleUpdates },
    });
  };

  const updateSelectedLayerCrop = (cropUpdates: any) => {
    if (!selectedLayer) return;
    updateSelectedLayer({
      crop: { ...(selectedLayer.crop || { shape: 'rect' }), ...cropUpdates },
    });
  };

  const handleAddLayer = (type: 'user-photo' | 'user-photo-2' | 'user-photo-3' | 'user-name' | 'user-role' | 'user-company' | 'static-text' | 'psd-frame') => {
    if (!currentTemplate) return;
    const newId = `layer_${Date.now().toString().slice(-5)}`;
    let newLayer: TemplateLayer;

    if (type === 'user-photo') {
      newLayer = {
        id: newId,
        name: 'Main Photo Area',
        type: 'image',
        source: 'user-photo',
        x: 340,
        y: 200,
        width: 400,
        height: 400,
        rotation: 0,
        zIndex: currentTemplate.layers.length + 1,
        crop: { shape: 'circle', strokeWidth: 4, strokeColor: '#38bdf8' },
      };
    } else if (type === 'user-photo-2') {
      newLayer = {
        id: newId,
        name: 'Secondary Photo 2',
        type: 'image',
        source: 'user-photo-2',
        x: 100,
        y: 250,
        width: 200,
        height: 200,
        rotation: 0,
        zIndex: currentTemplate.layers.length + 1,
        crop: { shape: 'circle', strokeWidth: 4, strokeColor: '#fbbf24' },
      };
    } else if (type === 'user-photo-3') {
      newLayer = {
        id: newId,
        name: 'Extra Photo 3',
        type: 'image',
        source: 'user-photo-3',
        x: 780,
        y: 250,
        width: 200,
        height: 200,
        rotation: 0,
        zIndex: currentTemplate.layers.length + 1,
        crop: { shape: 'circle', strokeWidth: 4, strokeColor: '#a855f7' },
      };
    } else if (type === 'user-name') {
      newLayer = {
        id: newId,
        name: 'User Name Text',
        type: 'text',
        source: 'user.name',
        x: 100,
        y: 650,
        width: 880,
        height: 70,
        rotation: 0,
        zIndex: currentTemplate.layers.length + 1,
        style: {
          fontFamily: 'Outfit',
          fontSize: 54,
          fontWeight: 'bold',
          color: '#ffffff',
          textAlign: 'center',
        },
      };
    } else if (type === 'user-role') {
      newLayer = {
        id: newId,
        name: 'Role / Designation Text',
        type: 'text',
        source: 'static',
        staticText: 'KEYNOTE SPEAKER',
        x: 100,
        y: 730,
        width: 880,
        height: 50,
        rotation: 0,
        zIndex: currentTemplate.layers.length + 1,
        style: {
          fontFamily: 'Inter',
          fontSize: 32,
          fontWeight: 'bold',
          color: '#fbbf24',
          textAlign: 'center',
        },
      };
    } else if (type === 'user-company') {
      newLayer = {
        id: newId,
        name: 'Company / Location Text',
        type: 'text',
        source: 'static',
        staticText: 'SAN FRANCISCO, CA',
        x: 100,
        y: 790,
        width: 880,
        height: 45,
        rotation: 0,
        zIndex: currentTemplate.layers.length + 1,
        style: {
          fontFamily: 'Inter',
          fontSize: 24,
          fontWeight: 'normal',
          color: '#94a3b8',
          textAlign: 'center',
        },
      };
    } else if (type === 'static-text') {
      newLayer = {
        id: newId,
        name: 'Static Heading Banner',
        type: 'text',
        source: 'static',
        staticText: 'GLOBAL TECH SUMMIT 2026',
        x: 100,
        y: 100,
        width: 880,
        height: 60,
        rotation: 0,
        zIndex: currentTemplate.layers.length + 1,
        style: {
          fontFamily: 'Inter',
          fontSize: 36,
          fontWeight: 'bold',
          color: '#38bdf8',
          textAlign: 'center',
        },
      };
    } else {
      newLayer = {
        id: newId,
        name: 'Photoshop Frame Layer',
        type: 'image',
        source: 'static',
        staticUrl: assets.find((a) => a.type === 'frame' || a.type === 'psd')?.url || '',
        x: 0,
        y: 0,
        width: currentTemplate.width,
        height: currentTemplate.height,
        rotation: 0,
        zIndex: currentTemplate.layers.length + 1,
        crop: { shape: 'rect' },
      };
    }

    const nextLayers = [...currentTemplate.layers, newLayer];
    setCurrentTemplate({ ...currentTemplate, layers: nextLayers });
    setSelectedLayerId(newId);
    toast.success(`Added ${newLayer.name} to canvas`);
  };

  const handleUploadPhotoshopFrame = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentTemplate) return;

    setIsUploadingFrame(true);
    try {
      let fileToUpload = file;
      const isPsd = file.name.toLowerCase().endsWith('.psd');

      if (isPsd) {
        toast.info('Converting Photoshop PSD composite file to web image preview...');
        try {
          const arrayBuffer = await file.arrayBuffer();
          const psd = readPsd(arrayBuffer);
          if (psd && psd.canvas) {
            const pngBlob = await new Promise<Blob | null>((resolve) => psd.canvas!.toBlob(resolve, 'image/png'));
            if (pngBlob) {
              fileToUpload = new File([pngBlob], file.name.replace(/\.psd$/i, '.png'), { type: 'image/png' });
            }
          }
        } catch (psdErr) {
          console.warn('PSD client parsing fallback:', psdErr);
        }
      }

      const asset = await api.uploadAsset(fileToUpload, 'frame');
      setAssets([asset, ...assets]);

      // Filter out any duplicate static frame layers that use the same URL to prevent double rendering
      const cleanedLayers = currentTemplate.layers.filter(
        (l) => !(l.name === 'Photoshop Frame Layer' || (l.type === 'image' && l.source === 'static' && l.staticUrl === asset.url))
      );

      setCurrentTemplate({
        ...currentTemplate,
        background: { type: 'image', value: asset.url },
        layers: cleanedLayers,
      });

      toast.success('Photoshop frame converted & applied to template background!');
    } catch (err: any) {
      toast.error(err.message || 'Frame upload failed');
    } finally {
      setIsUploadingFrame(false);
    }
  };

  const handleDeleteLayer = (id: string) => {
    if (!currentTemplate) return;
    const nextLayers = currentTemplate.layers.filter((l) => l.id !== id);
    setCurrentTemplate({ ...currentTemplate, layers: nextLayers });
    setSelectedLayerId(nextLayers[0]?.id || null);
  };

  const handleMoveZIndex = (id: string, direction: 'up' | 'down') => {
    if (!currentTemplate) return;
    const index = currentTemplate.layers.findIndex((l) => l.id === id);
    if (index === -1) return;
    const targetIndex = direction === 'up' ? index + 1 : index - 1;
    if (targetIndex < 0 || targetIndex >= currentTemplate.layers.length) return;

    const layers = [...currentTemplate.layers];
    const temp = layers[index];
    layers[index] = layers[targetIndex];
    layers[targetIndex] = temp;

    const reindexed = layers.map((l, i) => ({ ...l, zIndex: i + 1 }));
    setCurrentTemplate({ ...currentTemplate, layers: reindexed });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-3">
          <Layers className="w-6 h-6 text-indigo-400" />
          <div>
            <h1 className="text-lg font-bold text-white">Visual Template Engine</h1>
            <p className="text-xs text-slate-400">Click & Drag photo area directly on canvas or use position presets</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={currentTemplate?._id || ''}
            onChange={(e) => handleSelectTemplate(e.target.value)}
            className="bg-slate-900 text-slate-100 text-xs font-semibold rounded-xl px-3 py-2 border border-slate-800 focus:outline-none"
          >
            {templates.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name} ({t.width}×{t.height})
              </option>
            ))}
          </select>

          {currentTemplate && (
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1">
              <span className="text-[10px] uppercase font-bold text-indigo-400">Name:</span>
              <input
                type="text"
                value={currentTemplate.name}
                onChange={(e) => setCurrentTemplate({ ...currentTemplate, name: e.target.value })}
                placeholder="Template Title"
                className="bg-transparent text-xs font-bold text-white focus:outline-none w-36 sm:w-48"
              />
            </div>
          )}

          <Button variant="secondary" size="sm" onClick={handleCreateNewTemplate} leftIcon={<Plus className="w-4 h-4" />}>
            New Template
          </Button>

          <Button variant="primary" size="sm" onClick={handleSaveTemplate} isLoading={isSaving} leftIcon={<Save className="w-4 h-4" />}>
            Save Template
          </Button>

          {currentTemplate && (
            <Button variant="danger" size="sm" onClick={handleDeleteTemplate} leftIcon={<Trash2 className="w-4 h-4" />}>
              Delete Template
            </Button>
          )}

          {templates.some((t) => t.name.startsWith('Template ')) && (
            <button
              type="button"
              onClick={handleDeleteDraftTemplates}
              className="text-xs text-rose-400 hover:text-rose-300 font-semibold px-3 py-2 rounded-xl border border-rose-500/30 bg-rose-950/20 hover:bg-rose-950/50 transition-colors"
              title="Delete all auto-created test draft templates"
            >
              Clean Test Drafts
            </button>
          )}
        </div>
      </div>

      {/* Photoshop Frame Banner */}
      {currentTemplate && (
        <div className="glass-panel p-4 rounded-2xl border border-indigo-500/20 bg-indigo-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <FileCode className="w-5 h-5 text-indigo-400" />
            <div>
              <span className="text-xs font-bold text-white uppercase tracking-wider block">Template Frame & Background</span>
              <span className="text-[11px] text-slate-400">
                Current Background: <strong className="text-indigo-300">{currentTemplate.background.type === 'color' ? currentTemplate.background.value : 'Photoshop Frame Image'}</strong>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setCurrentTemplate({
                  ...currentTemplate,
                  background: { type: 'color', value: '#0f172a' },
                })
              }
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                currentTemplate.background.type === 'color'
                  ? 'bg-indigo-600 text-white border-indigo-500'
                  : 'bg-slate-900 text-slate-400 border-slate-800'
              }`}
            >
              Solid Color
            </button>

            <label className="inline-flex items-center cursor-pointer">
              <span className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold shadow-md shadow-indigo-500/20 flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5" /> Upload Photoshop Frame
              </span>
              <input type="file" accept="image/*,.psd,.png,.jpg,.jpeg,.webp,.svg,.tiff,.bmp" onChange={handleUploadPhotoshopFrame} className="hidden" />
            </label>
          </div>
        </div>
      )}

      {/* Main 3-Column Designer Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Elements & Layers Tree */}
        <div className="lg:col-span-3 glass-panel rounded-2xl p-4 border border-slate-800 space-y-5">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">Add Elements</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleAddLayer('user-photo')}
                className="p-2 rounded-xl bg-sky-950/40 hover:bg-sky-900/60 border border-sky-500/40 text-[11px] font-semibold text-sky-300 flex flex-col items-center gap-1 transition-colors shadow-sm"
              >
                <UserCheck className="w-3.5 h-3.5 text-sky-400" />
                <span>+ Main Photo</span>
              </button>

              <button
                type="button"
                onClick={() => handleAddLayer('user-photo-2')}
                className="p-2 rounded-xl bg-sky-950/40 hover:bg-sky-900/60 border border-sky-500/40 text-[11px] font-semibold text-sky-300 flex flex-col items-center gap-1 transition-colors shadow-sm"
              >
                <UserCheck className="w-3.5 h-3.5 text-sky-400" />
                <span>+ Photo 2</span>
              </button>

              <button
                type="button"
                onClick={() => handleAddLayer('user-photo-3')}
                className="p-2 rounded-xl bg-sky-950/40 hover:bg-sky-900/60 border border-sky-500/40 text-[11px] font-semibold text-sky-300 flex flex-col items-center gap-1 transition-colors shadow-sm"
              >
                <UserCheck className="w-3.5 h-3.5 text-sky-400" />
                <span>+ Photo 3</span>
              </button>

              <button
                type="button"
                onClick={() => handleAddLayer('user-name')}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] font-semibold text-violet-300 flex flex-col items-center gap-1 transition-colors"
              >
                <Type className="w-3.5 h-3.5 text-violet-400" />
                <span>+ User Name</span>
              </button>

              <button
                type="button"
                onClick={() => handleAddLayer('user-role')}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] font-semibold text-amber-300 flex flex-col items-center gap-1 transition-colors"
              >
                <Type className="w-3.5 h-3.5 text-amber-400" />
                <span>+ Role / Tagline</span>
              </button>

              <button
                type="button"
                onClick={() => handleAddLayer('user-company')}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] font-semibold text-sky-300 flex flex-col items-center gap-1 transition-colors"
              >
                <Type className="w-3.5 h-3.5 text-sky-400" />
                <span>+ Company / City</span>
              </button>

              <button
                type="button"
                onClick={() => handleAddLayer('static-text')}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] font-semibold text-emerald-300 flex flex-col items-center gap-1 transition-colors"
              >
                <Type className="w-3.5 h-3.5 text-emerald-400" />
                <span>+ Heading Banner</span>
              </button>

              <button
                type="button"
                onClick={() => handleAddLayer('psd-frame')}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] font-semibold text-pink-300 flex flex-col items-center gap-1 transition-colors"
              >
                <FileCode className="w-3.5 h-3.5 text-pink-400" />
                <span>+ Photoshop Frame</span>
              </button>
            </div>
          </div>

          {/* Photo Area Position Presets */}
          {selectedLayer && (
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1">
                <Target className="w-3.5 h-3.5" /> Photo Position Presets
              </h3>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => applyPhotoPreset('center')}
                  className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 font-semibold flex items-center gap-1"
                >
                  <Target className="w-3 h-3 text-indigo-400" /> Center Box
                </button>
                <button
                  type="button"
                  onClick={() => applyPhotoPreset('top-circle')}
                  className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 font-semibold flex items-center gap-1"
                >
                  <Circle className="w-3 h-3 text-violet-400" /> Top Circle
                </button>
                <button
                  type="button"
                  onClick={() => applyPhotoPreset('large-box')}
                  className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 font-semibold flex items-center gap-1"
                >
                  <Square className="w-3 h-3 text-amber-400" /> Large Card
                </button>
                <button
                  type="button"
                  onClick={() => applyPhotoPreset('full-frame')}
                  className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 font-semibold flex items-center gap-1"
                >
                  <Maximize2 className="w-3 h-3 text-emerald-400" /> Full Frame
                </button>
              </div>
            </div>
          )}

          {/* Layer List Tree */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Layers Tree</h3>
            <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
              {currentTemplate?.layers.map((layer) => (
                <div
                  key={layer.id}
                  onClick={() => setSelectedLayerId(layer.id)}
                  className={`p-2.5 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition-all ${
                    selectedLayerId === layer.id
                      ? 'bg-indigo-600/20 border-indigo-500 text-white font-bold'
                      : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-[10px] text-slate-500 font-mono">#{layer.zIndex}</span>
                    <span className="truncate">{layer.name}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveZIndex(layer.id, 'up');
                      }}
                      className="p-1 text-slate-400 hover:text-white"
                    >
                      <MoveUp className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveZIndex(layer.id, 'down');
                      }}
                      className="p-1 text-slate-400 hover:text-white"
                    >
                      <MoveDown className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteLayer(layer.id);
                      }}
                      className="p-1 text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center Column: Live Dynamic Interactive Canvas View */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col items-center w-full">
            <div className="flex items-center justify-between w-full mb-3 px-2">
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                <Move className="w-3.5 h-3.5 text-indigo-400" />
                Drag area or handle on canvas to position photo
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                {currentTemplate?.width || 1080}×{currentTemplate?.height || 1350} px
              </span>
            </div>

            <div className="relative max-w-full overflow-hidden rounded-xl border border-slate-800 bg-slate-950 p-2 shadow-2xl">
              <canvas
                ref={canvasRef}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseUp}
                className="max-w-full max-h-[550px] w-auto h-auto object-contain rounded cursor-crosshair select-none"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Layer Properties Inspection Panel */}
        <div className="lg:col-span-4 glass-panel rounded-2xl p-4 border border-slate-800 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 border-b border-slate-800 pb-2">
            Layer Properties Inspector
          </h3>

          {selectedLayer ? (
            <div className="space-y-4 text-xs">
              <Input
                label="Layer Label Name"
                value={selectedLayer.name}
                onChange={(e) => updateSelectedLayer({ name: e.target.value })}
              />

              {/* Coordinates & Geometry */}
              <div className="grid grid-cols-2 gap-2">
                <Input
                  label="X Position (px)"
                  type="number"
                  value={selectedLayer.x}
                  onChange={(e) => updateSelectedLayer({ x: parseInt(e.target.value) || 0 })}
                />
                <Input
                  label="Y Position (px)"
                  type="number"
                  value={selectedLayer.y}
                  onChange={(e) => updateSelectedLayer({ y: parseInt(e.target.value) || 0 })}
                />
                <Input
                  label="Width (px)"
                  type="number"
                  value={selectedLayer.width}
                  onChange={(e) => updateSelectedLayer({ width: parseInt(e.target.value) || 100 })}
                />
                <Input
                  label="Height (px)"
                  type="number"
                  value={selectedLayer.height}
                  onChange={(e) => updateSelectedLayer({ height: parseInt(e.target.value) || 100 })}
                />
              </div>

              {/* Specific Properties for Image Layer */}
              {selectedLayer.type === 'image' && (
                <div className="space-y-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                  <span className="font-bold text-indigo-400 block">Photo Crop Shape</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['circle', 'rect', 'rounded-rect'] as CropShape[]).map((shape) => (
                      <button
                        key={shape}
                        type="button"
                        onClick={() => updateSelectedLayerCrop({ shape })}
                        className={`py-1.5 text-[11px] font-bold rounded-lg capitalize border ${
                          selectedLayer.crop?.shape === shape
                            ? 'bg-indigo-600 text-white border-indigo-500'
                            : 'bg-slate-900 text-slate-400 border-slate-800'
                        }`}
                      >
                        {shape}
                      </button>
                    ))}
                  </div>

                  {/* Corner Edge Curve Radius (px) */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-800">
                    <div className="flex items-center justify-between text-xs text-slate-300">
                      <span className="font-semibold text-[11px] text-amber-400">Corner Edge Curve Radius</span>
                      <span className="font-mono text-[11px] text-slate-400">
                        {selectedLayer.crop?.borderRadius ?? (selectedLayer.crop?.shape === 'rounded-rect' ? 30 : 0)}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      step="2"
                      value={selectedLayer.crop?.borderRadius ?? (selectedLayer.crop?.shape === 'rounded-rect' ? 30 : 0)}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        updateSelectedLayerCrop({
                          borderRadius: val,
                          shape: val > 0 ? 'rounded-rect' : 'rect',
                        });
                      }}
                      className="w-full accent-amber-500 bg-slate-900 rounded-lg h-1.5 cursor-pointer"
                    />
                  </div>

                  {/* Image Border / Stroke Outline Adjustment */}
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <span className="font-bold text-sky-400 block text-[11px]">Image Outline Border Stroke</span>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        label="Stroke Width (px)"
                        type="number"
                        min="0"
                        max="30"
                        value={selectedLayer.crop?.strokeWidth || 0}
                        onChange={(e) => updateSelectedLayerCrop({ strokeWidth: parseInt(e.target.value) || 0 })}
                      />
                      <div>
                        <label className="block text-[10px] font-semibold uppercase text-slate-400 mb-1">
                          Stroke Color
                        </label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="color"
                            value={selectedLayer.crop?.strokeColor || '#38bdf8'}
                            onChange={(e) => updateSelectedLayerCrop({ strokeColor: e.target.value })}
                            className="w-8 h-8 rounded border border-slate-800 bg-slate-900 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={selectedLayer.crop?.strokeColor || '#38bdf8'}
                            onChange={(e) => updateSelectedLayerCrop({ strokeColor: e.target.value })}
                            className="w-full bg-slate-900 text-slate-100 text-xs rounded-lg p-2 border border-slate-800 font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Photo Layer Drop Shadow Adjustment */}
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <span className="font-bold text-violet-400 block text-[11px]">Photo Drop Shadow Adjustment</span>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        label="Shadow Blur (px)"
                        type="number"
                        min="0"
                        max="60"
                        value={selectedLayer.crop?.shadowBlur || 0}
                        onChange={(e) => updateSelectedLayerCrop({ shadowBlur: parseInt(e.target.value) || 0, shadowColor: selectedLayer.crop?.shadowColor || '#000000' })}
                      />
                      <div>
                        <label className="block text-[10px] font-semibold uppercase text-slate-400 mb-1">
                          Shadow Color
                        </label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="color"
                            value={selectedLayer.crop?.shadowColor || '#000000'}
                            onChange={(e) => updateSelectedLayerCrop({ shadowColor: e.target.value })}
                            className="w-8 h-8 rounded border border-slate-800 bg-slate-900 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={selectedLayer.crop?.shadowColor || '#000000'}
                            onChange={(e) => updateSelectedLayerCrop({ shadowColor: e.target.value })}
                            className="w-full bg-slate-900 text-slate-100 text-xs rounded-lg p-2 border border-slate-800 font-mono"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <Input
                        label="Offset X (px)"
                        type="number"
                        min="-50"
                        max="50"
                        value={selectedLayer.crop?.shadowOffsetX || 0}
                        onChange={(e) => updateSelectedLayerCrop({ shadowOffsetX: parseInt(e.target.value) || 0 })}
                      />
                      <Input
                        label="Offset Y (px)"
                        type="number"
                        min="-50"
                        max="50"
                        value={selectedLayer.crop?.shadowOffsetY || 0}
                        onChange={(e) => updateSelectedLayerCrop({ shadowOffsetY: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>

                  {selectedLayer.source === 'static' && (
                    <div className="space-y-2">
                      <Input
                        label="Photoshop Frame / Image URL"
                        placeholder="https://..."
                        value={selectedLayer.staticUrl || ''}
                        onChange={(e) => updateSelectedLayer({ staticUrl: e.target.value })}
                      />

                      {assets.length > 0 && (
                        <div className="space-y-1">
                          <label className="block text-[10px] font-semibold uppercase text-slate-400">
                            Pick From Uploaded Asset Library
                          </label>
                          <select
                            onChange={(e) => updateSelectedLayer({ staticUrl: e.target.value })}
                            className="w-full bg-slate-900 text-slate-100 text-xs rounded-lg p-2 border border-slate-800"
                          >
                            <option value="">-- Choose Uploaded Frame Asset --</option>
                            {assets.map((asset) => (
                              <option key={asset._id} value={asset.url}>
                                {asset.type.toUpperCase()}: {asset.publicId}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Specific Properties for Text Layer */}
              {selectedLayer.type === 'text' && (
                <div className="space-y-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                  <span className="font-bold text-violet-400 block">Text Typography & Styling</span>

                  {selectedLayer.source === 'static' && (
                    <Input
                      label="Static Text Content"
                      value={selectedLayer.staticText || ''}
                      onChange={(e) => updateSelectedLayer({ staticText: e.target.value })}
                    />
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      label="Font Size (px)"
                      type="number"
                      value={selectedLayer.style?.fontSize || 48}
                      onChange={(e) => updateSelectedLayerStyle({ fontSize: parseInt(e.target.value) || 24 })}
                    />
                    <Input
                      label="Text Color (Hex)"
                      type="text"
                      value={selectedLayer.style?.color || '#ffffff'}
                      onChange={(e) => updateSelectedLayerStyle({ color: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-semibold uppercase text-slate-400">
                      Font Family
                    </label>
                    <select
                      value={selectedLayer.style?.fontFamily || 'Inter'}
                      onChange={(e) => updateSelectedLayerStyle({ fontFamily: e.target.value })}
                      className="w-full bg-slate-900 text-slate-100 text-xs rounded-lg p-2 border border-slate-800"
                    >
                      <option value="Inter">Inter (Sans)</option>
                      <option value="Outfit">Outfit (Bold Display)</option>
                      <option value="Playfair Display">Playfair Display (Serif)</option>
                      <option value="Space Grotesk">Space Grotesk (Tech)</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4 text-xs">
              <h4 className="font-bold text-indigo-400 border-b border-slate-800 pb-1 uppercase tracking-wider text-[11px]">
                Template Settings
              </h4>

              {currentTemplate && (
                <>
                  <Input
                    label="Template Title / Name"
                    value={currentTemplate.name}
                    onChange={(e) => setCurrentTemplate({ ...currentTemplate, name: e.target.value })}
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      label="Canvas Width (px)"
                      type="number"
                      value={currentTemplate.width}
                      onChange={(e) => setCurrentTemplate({ ...currentTemplate, width: parseInt(e.target.value) || 1080 })}
                    />
                    <Input
                      label="Canvas Height (px)"
                      type="number"
                      value={currentTemplate.height}
                      onChange={(e) => setCurrentTemplate({ ...currentTemplate, height: parseInt(e.target.value) || 1350 })}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-semibold uppercase text-slate-400">
                      Publish Status
                    </label>
                    <select
                      value={currentTemplate.status || 'draft'}
                      onChange={(e) => setCurrentTemplate({ ...currentTemplate, status: e.target.value as any })}
                      className="w-full bg-slate-900 text-slate-100 text-xs rounded-lg p-2 border border-slate-800"
                    >
                      <option value="draft">Draft (Private)</option>
                      <option value="published">Published (Public)</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
