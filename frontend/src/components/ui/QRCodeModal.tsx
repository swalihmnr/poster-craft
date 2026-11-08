import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { X, Copy, Check, Download, ExternalLink, Share2, QrCode } from 'lucide-react';
import { Button } from './Button';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title: string;
  subtitle?: string;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  isOpen,
  onClose,
  url,
  title,
  subtitle = 'Scan with any smartphone camera to start creating your personalized poster.',
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (isOpen && url) {
      setIsGenerating(true);
      QRCode.toDataURL(url, {
        width: 360,
        margin: 2,
        color: {
          dark: '#090d16',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'H',
      })
        .then((dataUrl) => {
          setQrDataUrl(dataUrl);
        })
        .catch((err) => {
          console.error('Failed to generate QR code', err);
        })
        .finally(() => {
          setIsGenerating(false);
        });
    }
  }, [isOpen, url]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch (err) {
      console.error('Clipboard copy failed', err);
    }
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    const safeTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    a.download = `${safeTitle || 'poster'}-qr-code.png`;
    a.href = qrDataUrl;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: `Create your poster for ${title}:`,
          url,
        });
      } catch (err) {
        // User cancelled share
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Backdrop */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative z-10 w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl shadow-indigo-950/40 text-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-heading text-white line-clamp-1">{title}</h2>
              <p className="text-xs text-indigo-400 font-medium">Poster Creation Link & QR</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* QR Code Presentation Box */}
        <div className="flex flex-col items-center justify-center bg-slate-950/80 border border-slate-800/80 rounded-2xl p-5 mb-5 shadow-inner">
          <div className="bg-white p-3 rounded-2xl shadow-lg border border-slate-200">
            {isGenerating || !qrDataUrl ? (
              <div className="w-52 h-52 sm:w-60 sm:h-60 flex items-center justify-center text-slate-500 text-xs">
                Generating QR code...
              </div>
            ) : (
              <img
                src={qrDataUrl}
                alt={`QR code for ${title}`}
                className="w-52 h-52 sm:w-60 sm:h-60 object-contain rounded-lg"
              />
            )}
          </div>
          <p className="text-center text-xs text-slate-400 mt-4 max-w-xs leading-relaxed">
            {subtitle}
          </p>
        </div>

        {/* URL Box & Copy */}
        <div className="space-y-3 mb-5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Direct Shareable URL
          </label>
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl p-1.5 pl-3">
            <input
              type="text"
              readOnly
              value={url}
              className="bg-transparent text-xs text-slate-300 w-full focus:outline-none select-all font-mono"
            />
            <Button
              variant={copied ? 'secondary' : 'primary'}
              size="sm"
              onClick={handleCopy}
              className={`shrink-0 text-xs transition-all ${copied ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : ''}`}
              leftIcon={copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            >
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleDownload}
            leftIcon={<Download className="w-4 h-4 text-indigo-400" />}
            className="w-full text-xs"
          >
            Download QR
          </Button>

          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full"
          >
            <Button
              variant="outline"
              size="sm"
              leftIcon={<ExternalLink className="w-4 h-4" />}
              className="w-full text-xs"
            >
              Open Page
            </Button>
          </a>
        </div>

        {typeof navigator !== 'undefined' && 'share' in navigator && (
          <div className="mt-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNativeShare}
              leftIcon={<Share2 className="w-4 h-4 text-slate-400" />}
              className="w-full text-xs text-slate-400 hover:text-slate-200"
            >
              Share via device apps...
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

