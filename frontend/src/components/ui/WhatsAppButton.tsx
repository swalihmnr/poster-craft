import React, { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';

interface WhatsAppButtonProps {
  phoneNumber?: string;
  defaultMessage?: string;
  position?: 'bottom-right' | 'bottom-left';
}

export const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({
  phoneNumber = '918589869676',
  defaultMessage = 'Hi Muhammed Swalih, I would like to inquire about PosterCraft.',
  position = 'bottom-right',
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // UX Rule 1: International standard URL encoding without '+' or '-'
  const encodedText = encodeURIComponent(defaultMessage);
  const whatsappUrl = `https://wa.me/${phoneNumber.replace(/\D/g, '')}?text=${encodedText}`;

  // Clean formatted number for display UX: +91 85898 69676
  const formattedDisplay = '+91 85898 69676';

  const positionClasses =
    position === 'bottom-right'
      ? 'bottom-6 right-6'
      : 'bottom-6 left-6';

  return (
    <aside
      aria-label="WhatsApp Support and Inquiries"
      className={`fixed ${positionClasses} z-50 flex flex-col items-end gap-2 select-none print:hidden`}
    >
      {/* UX Rule 2: Floating Prompt / Help Callout with Quick Dismiss */}
      {!isDismissed && (
        <div
          role="region"
          aria-label="WhatsApp prompt"
          className="relative bg-slate-900/95 backdrop-blur-md border border-slate-700/80 shadow-2xl rounded-2xl p-3.5 max-w-[280px] text-xs text-slate-200 animate-in fade-in slide-in-from-bottom-3 duration-300 group"
        >
          <button
            onClick={() => setIsDismissed(true)}
            aria-label="Dismiss WhatsApp prompt"
            className="absolute top-2 right-2 text-slate-400 hover:text-white p-0.5 rounded-full transition-colors focus:outline-none focus:ring-1 focus:ring-slate-500"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          
          <div className="flex items-center gap-2 mb-1.5 pr-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-semibold text-white tracking-wide">Muhammed Swalih</span>
            <span className="text-[10px] text-emerald-400 font-medium bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/20">
              Online
            </span>
          </div>

          <p className="text-slate-300 text-[11px] leading-relaxed mb-2.5">
            Need custom templates, feature requests, or technical support? Chat directly on WhatsApp!
          </p>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 w-full py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-medium text-[11px] transition-all shadow-md shadow-emerald-900/30"
          >
            <span>Start Chat</span>
            <span className="text-[10px] text-emerald-200 font-mono">({formattedDisplay})</span>
          </a>
        </div>
      )}

      {/* UX Rule 3: Main Floating Button with Recognizable WhatsApp Branding */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        aria-label="Chat with Muhammed Swalih on WhatsApp (Opens in new tab)"
        className="group relative flex items-center justify-center w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-xl shadow-emerald-950/50 hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-emerald-500/40"
      >
        {/* Subtle Ping Wave */}
        <span className="absolute -inset-1 rounded-full bg-emerald-400 opacity-20 group-hover:opacity-40 animate-pulse pointer-events-none" />

        {/* WhatsApp Icon */}
        <svg
          viewBox="0 0 24 24"
          className="w-7 h-7 fill-white relative z-10 drop-shadow-sm"
          aria-hidden="true"
        >
          <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 6.46 17.5 2 12.04 2ZM12.04 20.15C10.56 20.15 9.11 19.76 7.85 19.01L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.8 13.47 3.8 11.91C3.8 7.37 7.5 3.67 12.05 3.67C16.6 3.67 20.3 7.37 20.3 11.91C20.3 16.45 16.59 20.15 12.04 20.15ZM16.56 14.39C16.31 14.26 15.09 13.66 14.86 13.58C14.63 13.5 14.47 13.46 14.3 13.7C14.14 13.95 13.66 14.52 13.51 14.68C13.37 14.85 13.22 14.87 12.97 14.75C12.72 14.62 11.92 14.36 10.97 13.51C10.23 12.85 9.73 12.04 9.59 11.79C9.44 11.54 9.57 11.41 9.7 11.28C9.81 11.17 9.95 10.99 10.07 10.85C10.2 10.71 10.24 10.61 10.32 10.45C10.4 10.28 10.36 10.14 10.3 10.02C10.24 9.9 9.75 8.7 9.55 8.2C9.35 7.72 9.15 7.78 9 7.77H8.53C8.36 7.77 8.1 7.83 7.87 8.08C7.65 8.33 7.02 8.92 7.02 10.12C7.02 11.32 7.89 12.48 8.01 12.64C8.14 12.81 9.73 15.26 12.18 16.31C12.76 16.56 13.21 16.71 13.57 16.82C14.15 17.01 14.68 16.98 15.1 16.92C15.57 16.85 16.54 16.33 16.75 15.76C16.95 15.19 16.95 14.7 16.89 14.6C16.83 14.5 16.71 14.45 16.46 14.33L16.56 14.39Z" />
        </svg>

        {/* Hover Pill / Tooltip when prompt is closed */}
        {isDismissed && showTooltip && (
          <span className="absolute right-16 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-medium whitespace-nowrap shadow-lg">
            Chat on WhatsApp ({formattedDisplay})
          </span>
        )}
      </a>
    </aside>
  );
};
