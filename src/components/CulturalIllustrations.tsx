import React from 'react';
import { Volume2 } from 'lucide-react';

export function HeroBengaluruScene({ onPlaySample }: { onPlaySample: (kanglish: string, script: string) => void }) {
  return (
    <div className="relative w-full h-full min-h-[360px] bg-stone-900 rounded-2xl overflow-hidden border border-stone-800 flex flex-col justify-between p-6 sm:p-8 text-stone-100">
      {/* Warm architectural background SVG illustration */}
      <svg
        className="absolute inset-0 w-full h-full object-cover opacity-35 pointer-events-none"
        viewBox="0 0 800 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="bgGlow" x1="0" y1="0" x2="800" y2="500" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#D97706" stopOpacity="0.45" />
            <stop offset="50%" stopColor="#78350F" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#1C1917" stopOpacity="0.9" />
          </linearGradient>
        </defs>
        <rect width="800" height="500" fill="url(#bgGlow)" />
        {/* Rain tree canopy arcs */}
        <path d="M-40 120 Q200 20 420 110 T840 90" stroke="#F59E0B" strokeWidth="2" strokeOpacity="0.3" fill="none" />
        <circle cx="650" cy="110" r="64" fill="#F59E0B" fillOpacity="0.18" />
        {/* Architectural Heritage Pillars & Cafe Archway */}
        <rect x="460" y="190" width="280" height="260" rx="16" stroke="#FDE68A" strokeOpacity="0.25" strokeWidth="2" />
        <path d="M490 450 V260 C490 220 590 220 590 260 V450" stroke="#F59E0B" strokeOpacity="0.4" strokeWidth="2" />
        <path d="M620 450 V260 C620 220 710 220 710 260 V450" stroke="#F59E0B" strokeOpacity="0.4" strokeWidth="2" />
        {/* Large subtle Kannada character 'ಕ' (Ka) emblem */}
        <text
          x="535"
          y="375"
          fill="#F59E0B"
          fillOpacity="0.22"
          fontSize="180"
          fontWeight="700"
          fontFamily="sans-serif"
        >
          ಕ
        </text>
      </svg>

      {/* Top cultural context header */}
      <div className="relative z-10 flex items-start justify-between gap-4 border-b border-stone-800 pb-4">
        <div>
          <p className="text-xs text-amber-400 font-medium">Bengaluru Scene · Indiranagar 100ft Rd</p>
          <h3 className="text-lg font-semibold text-white mt-0.5">Interactive Conversation Preview</h3>
        </div>
        <span className="text-xs text-stone-400 font-mono-tabular whitespace-nowrap shrink-0 pt-0.5">
          Tap to listen
        </span>
      </div>

      {/* Interactive Live Dialogue Cards inside Hero */}
      <div className="relative z-10 my-6 space-y-3.5">
        <div className="bg-stone-800/90 border border-stone-700 rounded-xl p-4 max-w-md">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-xs text-stone-400">Ramesh · Auto Rickshaw Driver</span>
            <button
              type="button"
              onClick={() => onPlaySample('Namaskara sir, ellige hogabeku?', 'ನಮಸ್ಕಾರ ಸರ್, ಎಲ್ಲಿಗೆ ಹೋಗಬೇಕು?')}
              aria-label="Listen to Ramesh say Namaskara sir, ellige hogabeku"
              className="min-h-[36px] px-2.5 py-1 rounded-lg bg-stone-700 hover:bg-stone-600 text-amber-300 text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Listen</span>
            </button>
          </div>
          <p className="text-base font-semibold text-white">&ldquo;Namaskara! Ellige hogabeku?&rdquo;</p>
          <p className="text-xs text-amber-300/90 mt-0.5">ನಮಸ್ಕಾರ! ಎಲ್ಲಿಗೆ ಹೋಗಬೇಕು?</p>
          <p className="text-xs text-stone-300 mt-1">Hello! Where would you like to go?</p>
        </div>

        <div className="bg-amber-500/15 border border-amber-500/40 rounded-xl p-4 max-w-md ml-auto">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-xs text-amber-300">You · Spoken Kanglish + Breakdown</span>
            <button
              type="button"
              onClick={() =>
                onPlaySample(
                  'Anna, Cubbon Park Metro-ge bartheera? Meter haaki.',
                  'ಅಣ್ಣ, ಕಬ್ಬನ್ ಪಾರ್ಕ್ ಮೆಟ್ರೋಗೆ ಬರ್ತೀರಾ? ಮೀಟರ್ ಹಾಕಿ.'
                )
              }
              aria-label="Listen to reply Anna, Cubbon Park Metro-ge bartheera"
              className="min-h-[36px] px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Listen</span>
            </button>
          </div>
          <p className="text-base font-semibold text-white">
            &ldquo;Anna, Cubbon Park Metro-ge bartheera? Meter haaki.&rdquo;
          </p>
          <p className="text-xs text-amber-200 mt-0.5">ಅಣ್ಣ, ಕಬ್ಬನ್ ಪಾರ್ಕ್ ಮೆಟ್ರೋಗೆ ಬರ್ತೀರಾ? ಮೀಟರ್ ಹಾಕಿ.</p>
          <p className="text-xs text-stone-200 mt-1">
            Brother, will you come to Cubbon Park Metro? Please put on the meter.
          </p>
        </div>
      </div>

      {/* Bottom breakdown bar */}
      <div className="relative z-10 pt-3 border-t border-stone-800 flex flex-wrap items-center justify-between gap-2 text-xs text-stone-300">
        <span>
          <strong className="text-amber-300">-ge</strong> = to a place
        </span>
        <span aria-hidden="true">·</span>
        <span>
          <strong className="text-amber-300">Bartheera?</strong> = Will you come?
        </span>
        <span aria-hidden="true">·</span>
        <span>
          <strong className="text-amber-300">Haaki</strong> = Put on
        </span>
      </div>
    </div>
  );
}

export function SituationSceneIllustration({ type }: { type: 'auto' | 'darshini' | 'market' | 'delivery' | 'office' }) {
  if (type === 'auto') {
    return (
      <svg viewBox="0 0 240 140" className="w-full h-32 rounded-xl bg-amber-50 border border-amber-200/70" aria-hidden="true">
        <rect width="240" height="140" rx="12" fill="#FFFBEB" />
        <path d="M0 112 H240" stroke="#D6D3D1" strokeWidth="2" />
        {/* Auto Rickshaw body */}
        <path d="M65 95 L75 50 H145 L165 75 V95 Z" fill="#F59E0B" stroke="#78350F" strokeWidth="2.5" />
        <path d="M75 50 Q110 38 145 50" fill="#FEF3C7" stroke="#78350F" strokeWidth="2" />
        <rect x="65" y="78" width="100" height="17" fill="#1C1917" />
        <circle cx="82" cy="98" r="11" fill="#292524" stroke="#FAFAF9" strokeWidth="2" />
        <circle cx="152" cy="98" r="11" fill="#292524" stroke="#FAFAF9" strokeWidth="2" />
        <text x="20" y="32" fill="#92400E" fontSize="12" fontWeight="700">ಮೀಟರ್ ಹಾಕಿ · Meter Haaki</text>
      </svg>
    );
  }
  if (type === 'darshini') {
    return (
      <svg viewBox="0 0 240 140" className="w-full h-32 rounded-xl bg-orange-50 border border-orange-200/70" aria-hidden="true">
        <rect width="240" height="140" rx="12" fill="#FFF7ED" />
        {/* Brass Davara and Tumbler */}
        <ellipse cx="120" cy="98" rx="46" ry="12" fill="#F59E0B" stroke="#78350F" strokeWidth="2" />
        <path d="M102 56 H138 L133 94 H107 Z" fill="#FBBF24" stroke="#78350F" strokeWidth="2" />
        {/* Steam lines */}
        <path d="M114 46 Q110 36 116 28" stroke="#D97706" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M126 44 Q122 34 128 26" stroke="#D97706" strokeWidth="2" fill="none" strokeLinecap="round" />
        <text x="20" y="30" fill="#9A3412" fontSize="12" fontWeight="700">ಫಿಲ್ಟರ್ ಕಾಫಿ · Filter Coffee</text>
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 240 140" className="w-full h-32 rounded-xl bg-emerald-50 border border-emerald-200/70" aria-hidden="true">
      <rect width="240" height="140" rx="12" fill="#ECFDF5" />
      <circle cx="95" cy="78" r="24" fill="#10B981" fillOpacity="0.25" stroke="#065F46" strokeWidth="2" />
      <circle cx="145" cy="78" r="24" fill="#F59E0B" fillOpacity="0.25" stroke="#92400E" strokeWidth="2" />
      <text x="20" y="32" fill="#065F46" fontSize="12" fontWeight="700">ನಮಸ್ಕಾರ · Everyday Kannada</text>
    </svg>
  );
}
