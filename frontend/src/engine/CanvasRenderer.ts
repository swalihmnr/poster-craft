import { TemplateConfig, TemplateLayer, UserPosterInput } from '../types';
import { readPsd } from 'ag-psd';

export interface RenderOptions {
  scale?: number; // Output resolution scale (default 1 for preview, 2 or 3 for high-res export)
  selectedLayerId?: string; // Highlight layer for admin template editor overlay
  showPlaceholders?: boolean; // If true, render empty placeholder box when user photo isn't uploaded yet
}

const imageCache: Map<string, HTMLImageElement> = new Map();

/**
 * Helper to load an image asynchronously with crossOrigin support, caching, and automatic Photoshop PSD decoding
 */
export async function loadImage(url: string): Promise<HTMLImageElement | null> {
  if (!url) return null;

  let fullUrl = url;
  if (url.startsWith('/uploads')) {
    fullUrl = `${window.location.protocol}//${window.location.hostname}:5000${url}`;
  }

  if (imageCache.has(fullUrl)) {
    const cached = imageCache.get(fullUrl)!;
    if (cached.complete && cached.naturalWidth > 0) return cached;
  }

  return new Promise((resolve) => {
    const img = new Image();
    if (fullUrl.startsWith('http') && !fullUrl.includes(window.location.host)) {
      img.crossOrigin = 'anonymous';
    }

    img.onload = () => {
      imageCache.set(fullUrl, img);
      resolve(img);
    };

    img.onerror = async () => {
      // Automatic fallback decoder for Adobe Photoshop (.psd) files
      if (fullUrl.toLowerCase().includes('.psd') || fullUrl.startsWith('blob:') || fullUrl.startsWith('data:')) {
        try {
          const res = await fetch(fullUrl);
          const buf = await res.arrayBuffer();
          const psd = readPsd(buf);
          if (psd && psd.canvas) {
            const dataUrl = psd.canvas.toDataURL('image/png');
            const psdImg = new Image();
            psdImg.onload = () => {
              imageCache.set(fullUrl, psdImg);
              resolve(psdImg);
            };
            psdImg.onerror = () => resolve(null);
            psdImg.src = dataUrl;
            return;
          }
        } catch (psdErr) {
          console.warn(`PSD decoding failed for ${fullUrl}:`, psdErr);
        }
      }

      console.warn(`Failed to load image from URL: ${fullUrl}`);
      resolve(null);
    };

    img.src = fullUrl;
  });
}

/**
 * Preload all required image assets for a template rendering cycle
 */
export async function preloadTemplateAssets(template: TemplateConfig, input?: UserPosterInput): Promise<void> {
  const urls: string[] = [];

  if (template.background.type === 'image' && template.background.value) {
    urls.push(template.background.value);
  }

  for (const layer of template.layers) {
    if (!layer.visible && layer.visible !== undefined) continue;
    if (layer.type === 'image') {
      if (layer.source === 'static' && layer.staticUrl) {
        urls.push(layer.staticUrl);
      } else if (layer.source === 'user-photo' && input?.photoUrl) {
        urls.push(input.photoUrl);
      }
    }
  }

  await Promise.all(urls.map((url) => loadImage(url)));
}

/**
 * Core Dynamic Canvas Engine Renderer
 */
export class CanvasRenderer {
  public static async render(
    canvas: HTMLCanvasElement,
    template: TemplateConfig,
    input: UserPosterInput,
    options: RenderOptions = {}
  ): Promise<void> {
    const scale = options.scale || 1;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions
    canvas.width = Math.round(template.width * scale);
    canvas.height = Math.round(template.height * scale);

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Save initial context state
    ctx.save();
    ctx.scale(scale, scale);

    // 1. Render Background
    if (template.background.type === 'color') {
      ctx.fillStyle = template.background.value || '#ffffff';
      ctx.fillRect(0, 0, template.width, template.height);
    } else if (template.background.type === 'image' && template.background.value) {
      const bgImg = await loadImage(template.background.value);
      if (bgImg) {
        ctx.drawImage(bgImg, 0, 0, template.width, template.height);
      } else {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, template.width, template.height);
      }
    }

    // Sort layers by zIndex ascending
    const sortedLayers = [...template.layers].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

    // 2. Render Layers
    for (const layer of sortedLayers) {
      if (layer.visible === false) continue;

      ctx.save();

      // Handle layer opacity & rotation around center
      if (layer.style?.opacity !== undefined) {
        ctx.globalAlpha = layer.style.opacity;
      }

      const centerX = layer.x + layer.width / 2;
      const centerY = layer.y + layer.height / 2;

      ctx.translate(centerX, centerY);
      if (layer.rotation) {
        ctx.rotate((layer.rotation * Math.PI) / 180);
      }
      ctx.translate(-centerX, -centerY);

      // Render based on layer type
      if (layer.type === 'image') {
        await this.renderImageLayer(ctx, layer, input, options);
      } else if (layer.type === 'text') {
        this.renderTextLayer(ctx, layer, input);
      }

      // Render Interactive Selection Bounding Box & Handles for Admin Editor
      if (options.selectedLayerId === layer.id) {
        ctx.save();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 8]);
        ctx.strokeRect(layer.x, layer.y, layer.width, layer.height);

        // Draw 4 corner handles
        ctx.fillStyle = '#0284c7';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.setLineDash([]);
        const handleSize = 14;

        const corners = [
          { x: layer.x, y: layer.y },
          { x: layer.x + layer.width, y: layer.y },
          { x: layer.x, y: layer.y + layer.height },
          { x: layer.x + layer.width, y: layer.y + layer.height },
        ];

        corners.forEach((c) => {
          ctx.beginPath();
          ctx.rect(c.x - handleSize / 2, c.y - handleSize / 2, handleSize, handleSize);
          ctx.fill();
          ctx.stroke();
        });

        // Draw Top Rotation Handle (Knob)
        const rotX = layer.x + layer.width / 2;
        const rotY = layer.y - 35;

        // Connecting Line to Rotation Knob
        ctx.beginPath();
        ctx.moveTo(rotX, layer.y);
        ctx.lineTo(rotX, rotY);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Rotation Knob Circle
        ctx.beginPath();
        ctx.arc(rotX, rotY, 12, 0, Math.PI * 2);
        ctx.fillStyle = '#0284c7';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Rotation Icon
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🔄', rotX, rotY);

        // Label banner displaying rotation angle
        const rotDegree = layer.rotation || 0;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.fillRect(layer.x, layer.y - 28, Math.max(layer.width, 240), 24);
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 12px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(
          `📍 ${layer.name} (${Math.round(layer.x)}, ${Math.round(layer.y)}) — ${Math.round(layer.width)}×${Math.round(layer.height)}px (${rotDegree}°)`,
          layer.x + 6,
          layer.y - 12
        );
        ctx.restore();
      }

      ctx.restore();
    }

    ctx.restore();
  }

  /**
   * Render Image Layer (supports circle/rounded/rect cropping, object-fit zoom & offsets)
   */
  private static async renderImageLayer(
    ctx: CanvasRenderingContext2D,
    layer: TemplateLayer,
    input: UserPosterInput,
    options: RenderOptions
  ): Promise<void> {
    let imgUrl: string | undefined;
    const isUserPhoto = layer.source === 'user-photo' || (typeof layer.source === 'string' && layer.source.startsWith('user-photo'));

    if (layer.source === 'static') {
      imgUrl = layer.staticUrl;
    } else if (layer.source === 'user-photo') {
      imgUrl = input.photoUrl || input.photos?.['primary'] || input.photos?.['user-photo'];
    } else if (typeof layer.source === 'string' && layer.source.startsWith('user-photo')) {
      const slotKey = layer.source;
      imgUrl = input.photos?.[slotKey] || input.photos?.[layer.id] || input.customFields?.[slotKey];
    }

    const shape = layer.crop?.shape || 'rect';
    const borderRadius = layer.crop?.borderRadius !== undefined ? layer.crop.borderRadius : (shape === 'rounded-rect' ? 30 : 0);
    const strokeWidth = layer.crop?.strokeWidth || layer.style?.strokeWidth || 0;
    const strokeColor = layer.crop?.strokeColor || layer.style?.strokeColor || '#ffffff';

    const shadowColor = layer.crop?.shadowColor || layer.style?.shadowColor;
    const shadowBlur = layer.crop?.shadowBlur ?? layer.style?.shadowBlur ?? 0;
    const shadowOffsetX = layer.crop?.shadowOffsetX ?? layer.style?.shadowOffsetX ?? 0;
    const shadowOffsetY = layer.crop?.shadowOffsetY ?? layer.style?.shadowOffsetY ?? 0;

    // Render Drop Shadow projection behind photo frame
    if (shadowBlur > 0 && shadowColor) {
      ctx.save();
      ctx.shadowColor = shadowColor;
      ctx.shadowBlur = shadowBlur;
      ctx.shadowOffsetX = shadowOffsetX;
      ctx.shadowOffsetY = shadowOffsetY;
      ctx.fillStyle = shadowColor;

      ctx.beginPath();
      if (shape === 'circle') {
        const radius = Math.min(layer.width, layer.height) / 2;
        ctx.arc(layer.x + layer.width / 2, layer.y + layer.height / 2, radius, 0, Math.PI * 2);
      } else if ((shape === 'rounded-rect' || shape === 'rect') && borderRadius > 0) {
        const x = layer.x;
        const y = layer.y;
        const w = layer.width;
        const h = layer.height;
        const r = Math.min(borderRadius, w / 2, h / 2);
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
      } else {
        ctx.rect(layer.x, layer.y, layer.width, layer.height);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // Apply Clipping Mask
    ctx.save();
    ctx.beginPath();

    if (shape === 'circle') {
      const radius = Math.min(layer.width, layer.height) / 2;
      ctx.arc(layer.x + layer.width / 2, layer.y + layer.height / 2, radius, 0, Math.PI * 2);
    } else if ((shape === 'rounded-rect' || shape === 'rect') && borderRadius > 0) {
      const x = layer.x;
      const y = layer.y;
      const w = layer.width;
      const h = layer.height;
      const r = Math.min(borderRadius, w / 2, h / 2);
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
    } else {
      ctx.rect(layer.x, layer.y, layer.width, layer.height);
    }

    ctx.closePath();
    ctx.clip();

    const img = imgUrl ? await loadImage(imgUrl) : null;

    if (img) {
      // Calculate crop & cover fit math
      const specificCrop = input.crops?.[layer.id] || input.crops?.[layer.source as string];
      const userZoom = specificCrop?.zoom !== undefined ? specificCrop.zoom : (isUserPhoto && input.crop?.zoom ? input.crop.zoom : (layer.crop?.zoom || 1));
      const userOffX = specificCrop?.offsetX !== undefined ? specificCrop.offsetX : (isUserPhoto && input.crop?.offsetX !== undefined ? input.crop.offsetX : (layer.crop?.offsetX || 0));
      const userOffY = specificCrop?.offsetY !== undefined ? specificCrop.offsetY : (isUserPhoto && input.crop?.offsetY !== undefined ? input.crop.offsetY : (layer.crop?.offsetY || 0));
      const userRot = specificCrop?.rotation !== undefined ? specificCrop.rotation : (isUserPhoto && input.crop?.rotation !== undefined ? input.crop.rotation : (layer.rotation || 0));

      // Object fit cover calculations
      const imgAspect = img.naturalWidth / img.naturalHeight;
      const boxAspect = layer.width / layer.height;

      let renderW = layer.width;
      let renderH = layer.height;

      if (imgAspect > boxAspect) {
        renderW = layer.height * imgAspect;
      } else {
        renderH = layer.width / imgAspect;
      }

      // Apply zoom & offsets
      renderW *= userZoom;
      renderH *= userZoom;

      const centerX = layer.x + layer.width / 2;
      const centerY = layer.y + layer.height / 2;

      ctx.save();
      ctx.translate(centerX, centerY);
      if (userRot !== 0) {
        ctx.rotate((userRot * Math.PI) / 180);
      }

      const localDrawX = (layer.width - renderW) / 2 + userOffX - layer.width / 2;
      const localDrawY = (layer.height - renderH) / 2 + userOffY - layer.height / 2;

      ctx.drawImage(img, localDrawX, localDrawY, renderW, renderH);
      ctx.restore();
    } else {
      // Draw Placeholder box with vibrant light blue tone if no image loaded
      ctx.fillStyle = 'rgba(56, 189, 248, 0.22)';
      ctx.fillRect(layer.x, layer.y, layer.width, layer.height);
      ctx.strokeStyle = '#38bdf8';
      ctx.setLineDash([6, 6]);
      ctx.lineWidth = 2.5;
      ctx.strokeRect(layer.x, layer.y, layer.width, layer.height);

      if (options.showPlaceholders !== false) {
        ctx.fillStyle = '#0284c7';
        ctx.font = 'bold 24px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`📷 ${layer.name || 'Photo Slot'}`, layer.x + layer.width / 2, layer.y + layer.height / 2);
      }
    }

    ctx.restore();

    // Render Outline / Stroke Adjustment over the shape border if specified
    if (strokeWidth > 0) {
      ctx.save();
      ctx.beginPath();
      if (shape === 'circle') {
        const radius = Math.min(layer.width, layer.height) / 2;
        ctx.arc(layer.x + layer.width / 2, layer.y + layer.height / 2, radius, 0, Math.PI * 2);
      } else if ((shape === 'rounded-rect' || shape === 'rect') && borderRadius > 0) {
        const x = layer.x;
        const y = layer.y;
        const w = layer.width;
        const h = layer.height;
        const r = Math.min(borderRadius, w / 2, h / 2);
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
      } else {
        ctx.rect(layer.x, layer.y, layer.width, layer.height);
      }
      ctx.closePath();
      ctx.lineWidth = strokeWidth;
      ctx.strokeStyle = strokeColor;
      ctx.stroke();
      ctx.restore();
    }
  }

  /**
   * Render Text Layer with dynamic text wrapping, shadow, weight & font family
   */
  private static renderTextLayer(
    ctx: CanvasRenderingContext2D,
    layer: TemplateLayer,
    input: UserPosterInput
  ): void {
    let rawText = '';

    if (layer.source === 'static') {
      rawText = layer.staticText || '';
    } else if (layer.source === 'user.name') {
      rawText = input.name || 'Your Name';
    } else if (layer.source.startsWith('user.') && input.customFields) {
      const fieldKey = layer.source.replace('user.', '');
      rawText = input.customFields[fieldKey] || '';
    }

    if (!rawText) return;

    const style = layer.style || {};
    const fontSize = style.fontSize || 48;
    const fontFamily = style.fontFamily || 'Inter';
    const fontWeight = style.fontWeight || 'bold';
    const fontStyle = style.fontStyle || 'normal';
    const color = style.color || '#ffffff';
    const textAlign = style.textAlign || 'center';

    let formattedText = rawText;
    if (style.textTransform === 'uppercase') formattedText = rawText.toUpperCase();
    else if (style.textTransform === 'lowercase') formattedText = rawText.toLowerCase();

    ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px "${fontFamily}", sans-serif`;
    ctx.fillStyle = color;
    ctx.textAlign = textAlign;

    // Apply shadow if specified
    if (style.shadowColor) {
      ctx.shadowColor = style.shadowColor;
      ctx.shadowBlur = style.shadowBlur || 4;
      ctx.shadowOffsetX = style.shadowOffsetX || 0;
      ctx.shadowOffsetY = style.shadowOffsetY || 4;
    }

    // Multi-line wrap calculations
    const words = formattedText.split(' ');
    const lines: string[] = [];
    let currentLine = words[0] || '';

    for (let i = 1; i < words.length; i++) {
      const testLine = currentLine + ' ' + words[i];
      const metrics = ctx.measureText(testLine);
      if (metrics.width > layer.width) {
        lines.push(currentLine);
        currentLine = words[i];
      } else {
        currentLine = testLine;
      }
    }
    lines.push(currentLine);

    const lineHeight = fontSize * (style.lineHeight || 1.2);
    const totalTextHeight = lines.length * lineHeight;

    let startY = layer.y + fontSize;
    if (style.verticalAlign === 'middle') {
      startY = layer.y + (layer.height - totalTextHeight) / 2 + fontSize * 0.8;
    } else if (style.verticalAlign === 'bottom') {
      startY = layer.y + layer.height - totalTextHeight + fontSize;
    }

    let startX = layer.x;
    if (textAlign === 'center') {
      startX = layer.x + layer.width / 2;
    } else if (textAlign === 'right') {
      startX = layer.x + layer.width;
    }

    lines.forEach((line, index) => {
      ctx.fillText(line, startX, startY + index * lineHeight);
    });
  }
}
