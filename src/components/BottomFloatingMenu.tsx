import React from 'react';
import { 
  FileSignature, 
  FileCheck, 
  Building, 
  Truck 
} from 'lucide-react';

interface BottomFloatingMenuProps {
  onTriggerQuickAction: (action: 'do' | 'po' | 'vendor' | 'transporter') => void;
}

export default function BottomFloatingMenu({
  onTriggerQuickAction
}: BottomFloatingMenuProps) {
  return (
    <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-[500px] px-4 no-print">
      
      {/* Main Pill/Capsule Bottom Navigation Bar strictly matching the glossy dark rounded look */}
      <nav className="relative flex items-center justify-between px-3 sm:px-4 py-3 bg-gradient-to-r from-[#031E51] via-[#051130] to-[#041D4C] text-slate-300 shadow-[0_15px_35px_rgba(3,30,81,0.5)] border border-white/10 backdrop-blur-md rounded-[40px]">
        
        {/* Shine gloss highlight overlay */}
        <div className="absolute inset-0 rounded-[40px] bg-gradient-to-b from-white/15 to-transparent pointer-events-none h-1/2" />

        {/* Shortcut 1: NEW DO */}
        <button 
          onClick={() => onTriggerQuickAction('do')}
          className="flex flex-col items-center justify-start flex-1 cursor-pointer focus:outline-none transition-all duration-150 group text-center min-w-0"
          title="Create New Despatch Order (DO)"
        >
          <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-gradient-to-tr from-[#1565C0] to-[#1E88E5] hover:from-[#1E88E5] hover:to-[#42A5F5] text-white border border-[#1E88E5]/40 shadow-[0_4px_12px_rgba(21,101,192,0.4)] transition-all group-hover:scale-105 flex items-center justify-center mb-2 shrink-0">
            <FileSignature className="h-[18px] w-[18px] sm:h-5 sm:w-5 stroke-[2]" />
          </div>
          <span className="text-[8px] sm:text-[9px] font-sans font-black tracking-wider text-[#90CAF9] uppercase transition-colors group-hover:text-white text-center leading-tight">
            NEW<br />DO
          </span>
        </button>

        {/* Shortcut 2: NEW PO */}
        <button 
          onClick={() => onTriggerQuickAction('po')}
          className="flex flex-col items-center justify-start flex-1 cursor-pointer focus:outline-none transition-all duration-150 group text-center min-w-0"
          title="Create New Purchase Contract (PO)"
        >
          <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-slate-800/40 text-[#90CAF9] hover:text-white border border-white/5 shadow-inner transition-all group-hover:scale-105 flex items-center justify-center mb-2 shrink-0">
            <FileCheck className="h-[18px] w-[18px] sm:h-5 sm:w-5 stroke-[2]" />
          </div>
          <span className="text-[8px] sm:text-[9px] font-sans font-black tracking-wider text-[#90CAF9]/80 uppercase transition-colors group-hover:text-white text-center leading-tight">
            NEW<br />PO
          </span>
        </button>

        {/* Shortcut 3: NEW VENDOR */}
        <button 
          onClick={() => onTriggerQuickAction('vendor')}
          className="flex flex-col items-center justify-start flex-1 cursor-pointer focus:outline-none transition-all duration-150 group text-center min-w-0"
          title="Create New Vendor Profile"
        >
          <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-slate-800/40 text-[#90CAF9] hover:text-white border border-white/5 shadow-inner transition-all group-hover:scale-105 flex items-center justify-center mb-2 shrink-0">
            <Building className="h-[18px] w-[18px] sm:h-5 sm:w-5 stroke-[2]" />
          </div>
          <span className="text-[8px] sm:text-[9px] font-sans font-black tracking-wider text-[#90CAF9]/80 uppercase transition-colors group-hover:text-white text-center leading-tight">
            NEW<br />VENDOR
          </span>
        </button>

        {/* Shortcut 4: NEW TRANSPORTER */}
        <button 
          onClick={() => onTriggerQuickAction('transporter')}
          className="flex flex-col items-center justify-start flex-1 cursor-pointer focus:outline-none transition-all duration-150 group text-center min-w-0"
          title="Create New Transporter Profile"
        >
          <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-slate-800/40 text-[#90CAF9] hover:text-[#E040FB] border border-white/5 shadow-inner transition-all group-hover:scale-105 flex items-center justify-center mb-2 shrink-0">
            <Truck className="h-[18px] w-[18px] sm:h-5 sm:w-5 stroke-[2]" />
          </div>
          <span className="text-[8px] sm:text-[9px] font-sans font-black tracking-wider text-[#90CAF9]/80 uppercase transition-colors group-hover:text-white text-center leading-tight">
            NEW<br />TRANSPORTER
          </span>
        </button>

      </nav>
    </div>
  );
}
