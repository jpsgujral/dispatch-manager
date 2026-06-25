import React from 'react';
import { Company, DespatchOrder, Transporter, AppUser } from '../types';
import TSGLogo from './TSGLogo';
import { 
  Menu,
  Home,
  Gauge,
  MessageCircle,
  Moon,
  Sun,
  LogOut
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

interface DashboardProps {
  companies: Company[];
  dos: DespatchOrder[];
  transporters: Transporter[];
  onToggleSidebar: () => void;
  onTriggerQuickAction: (action: 'do' | 'po' | 'vendor' | 'transporter') => void;
  currentUser?: AppUser | null;
  themeMode?: 'light' | 'dark';
  onToggleTheme?: () => void;
  onLogout?: () => void;
}

export default function Dashboard({
  companies,
  dos = [],
  transporters = [],
  onToggleSidebar,
  onTriggerQuickAction,
  currentUser,
  themeMode = 'light',
  onToggleTheme,
  onLogout,
}: DashboardProps) {

  // Sort dispatch orders by createdAt descending (newest first) and take the last 5 created
  const recentDos = [...dos]
    .sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime())
    .slice(0, 5);

  const currentYear = new Date().getFullYear();
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // Initialize the 12 months with 0 tonnage
  const monthlyDataMap = monthNames.map((name, index) => ({
    monthIndex: index,
    name,
    tonnage: 0,
  }));

  dos.forEach(doItem => {
    // Suppress typescript warning by parsing reliably
    const itemDate = doItem.date ? new Date(doItem.date) : (doItem.createdAt ? new Date(doItem.createdAt) : null);
    if (itemDate && !isNaN(itemDate.getTime())) {
      const year = itemDate.getFullYear();
      if (year === currentYear && doItem.status !== 'Cancelled') {
        const month = itemDate.getMonth(); // 0 to 11
        const weight = doItem.receivedWeight !== null 
          ? doItem.receivedWeight 
          : (doItem.loadedWeight !== null ? doItem.loadedWeight : 0);
        if (month >= 0 && month < 12) {
          monthlyDataMap[month].tonnage += weight;
        }
      }
    }
  });

  // Format tonnage to 1 decimal place or keep as number
  const chartData = monthlyDataMap.map(item => ({
    name: item.name,
    Tonnage: parseFloat(item.tonnage.toFixed(1)),
  }));

  // Statistics
  const totalYtd = chartData.reduce((sum, item) => sum + item.Tonnage, 0);
  const avgMonthly = totalYtd / 12;

  return (
    <div className="w-full flex-1 flex flex-col justify-between p-4 md:p-8 select-none transition-all duration-300">

      {/* Main Centered Content Section (Bento Grid) */}
      <div className="flex-1 flex flex-col items-center justify-center py-4 text-center space-y-6 w-full">
        <div className="relative group transition-transform duration-300 transform hover:scale-105">
          {/* Subtle concentric frames */}
          <div className="absolute -inset-4 border border-dashed border-[#D1D1CF]/40 rounded-full animate-[spin_20s_linear_infinite]" />
          <div className="absolute -inset-8 border border-stone-200/50 rounded-full" />
          <TSGLogo size={120} className="border-[4px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rounded-xl relative z-10 bg-white" />
        </div>

        <div className="space-y-4 max-w-full">
          <h1 className={`text-xl sm:text-2xl md:text-3xl lg:text-4xl font-serif font-black italic tracking-tight leading-none truncate max-w-full px-4 ${
            themeMode === 'dark' ? 'text-white' : 'text-neutral-900'
          }`} title={companies[0]?.name || 'TSG Impex India'}>
            {companies[0]?.name || 'TSG Impex India'}
          </h1>
          <div className="flex items-center justify-center space-x-3">
            <span className="h-[2px] w-8 bg-[#E65100]" />
            <h2 className="text-xs uppercase tracking-[0.3em] font-sans font-extrabold text-[#E65100]">
              The Fly Ash People
            </h2>
            <span className="h-[2px] w-8 bg-[#E65100]" />
          </div>
        </div>

        {/* 2-Column Bento Grid: Tonnage Trend on left, Recent Activity on right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full max-w-6xl mx-auto mt-6 shrink-0 text-left">
          
          {/* Left Column: Tonnage Trend Chart Widget */}
          <div className={`lg:col-span-7 border-[3px] p-5 transition-all duration-300 flex flex-col justify-between ${
            themeMode === 'dark' 
              ? 'bg-[#12141a] border-slate-800 text-slate-100 shadow-[5px_5px_0px_0px_rgba(66,165,245,0.3)]' 
              : 'bg-white border-black text-[#1A1A1A] shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]'
          }`}>
            <div>
              <div className={`flex items-center justify-between border-b-[2px] pb-3 mb-4 ${
                themeMode === 'dark' ? 'border-slate-800' : 'border-black'
              }`}>
                <div className="flex items-center space-x-2">
                  <span className="h-2.5 w-2.5 bg-[#E65100] shrink-0 inline-block" />
                  <h3 className={`font-serif font-extrabold italic text-xs md:text-sm tracking-wide uppercase ${
                    themeMode === 'dark' ? 'text-white' : 'text-neutral-900'
                  }`}>
                    Annual despatch volume ({currentYear})
                  </h3>
                </div>
                <span className={`font-mono text-[9px] font-bold px-2 py-0.5 uppercase tracking-wide border ${
                  themeMode === 'dark' 
                    ? 'text-slate-300 bg-slate-800/60 border-slate-700' 
                    : 'text-neutral-500 bg-neutral-100 border-neutral-200'
                }`}>
                  Tonnage Trend (MT)
                </span>
              </div>

              {/* Chart Stats Row */}
              <div className={`grid grid-cols-2 gap-4 mb-3 p-2.5 font-mono border ${
                themeMode === 'dark' 
                  ? 'bg-slate-900/60 border-slate-800 text-slate-300' 
                  : 'bg-stone-50 border-stone-200 text-[#1A1A1A]'
              }`}>
                <div>
                  <span className={`text-[9px] uppercase block font-semibold leading-none mb-1 ${
                    themeMode === 'dark' ? 'text-slate-400' : 'text-stone-500'
                  }`}>Total Year-To-Date</span>
                  <span className={`text-xs sm:text-sm font-black ${
                    themeMode === 'dark' ? 'text-white' : 'text-neutral-900'
                  }`}>{totalYtd.toLocaleString()} MT</span>
                </div>
                <div>
                  <span className={`text-[9px] uppercase block font-semibold leading-none mb-1 ${
                    themeMode === 'dark' ? 'text-slate-400' : 'text-stone-500'
                  }`}>Monthly average</span>
                  <span className="text-xs sm:text-sm font-black text-[#E65100]">{avgMonthly.toFixed(1)} MT</span>
                </div>
              </div>

              {/* Recharts Bar Chart Container */}
              <div className="h-48 w-full mt-2 select-none">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={themeMode === 'dark' ? '#1E293B' : '#E5E7EB'} vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: themeMode === 'dark' ? '#94A3B8' : '#4B5563', fontSize: 9, fontFamily: 'monospace' }} 
                      axisLine={{ stroke: themeMode === 'dark' ? '#334155' : '#000000', strokeWidth: 1.5 }}
                      tickLine={{ stroke: themeMode === 'dark' ? '#334155' : '#000000', strokeWidth: 1.5 }}
                    />
                    <YAxis 
                      tick={{ fill: themeMode === 'dark' ? '#94A3B8' : '#4B5563', fontSize: 9, fontFamily: 'monospace' }}
                      axisLine={{ stroke: themeMode === 'dark' ? '#334155' : '#000000', strokeWidth: 1.5 }}
                      tickLine={{ stroke: themeMode === 'dark' ? '#334155' : '#000000', strokeWidth: 1.5 }}
                    />
                    <Tooltip 
                      cursor={{ fill: themeMode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }}
                      contentStyle={{ 
                        backgroundColor: themeMode === 'dark' ? '#0f1115' : '#FFFFFF', 
                        border: themeMode === 'dark' ? '2px solid #334155' : '2px solid #000000',
                        color: themeMode === 'dark' ? '#F1F5F9' : '#1A1A1A',
                        borderRadius: '0px',
                        fontFamily: 'monospace',
                        fontSize: '10px',
                        padding: '6px 10px'
                      }} 
                    />
                    <Bar dataKey="Tonnage" fill="#E65100" radius={0}>
                      {chartData.map((entry, index) => {
                        const isCurrentMonth = index === new Date().getMonth();
                        return (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={isCurrentMonth ? (themeMode === 'dark' ? '#90CAF9' : '#000000') : '#E65100'} 
                          />
                        );
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Right Column: Recent Activity Feed */}
          <div className={`lg:col-span-5 border-[3px] p-5 transition-all duration-300 flex flex-col justify-between ${
            themeMode === 'dark' 
              ? 'bg-[#12141a] border-slate-800 text-slate-100 shadow-[5px_5px_0px_0px_rgba(66,165,245,0.3)]' 
              : 'bg-white border-black text-[#1A1A1A] shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]'
          }`}>
            <div>
              <div className={`flex items-center justify-between border-b-[2px] pb-3 mb-4 ${
                themeMode === 'dark' ? 'border-slate-800' : 'border-black'
              }`}>
                <div className="flex items-center space-x-2">
                  <span className="h-2.5 w-2.5 bg-[#E65100] shrink-0 inline-block animate-pulse" />
                  <h3 className={`font-serif font-extrabold italic text-xs md:text-sm tracking-wide uppercase ${
                    themeMode === 'dark' ? 'text-white' : 'text-neutral-900'
                  }`}>
                    Recent Despatch Log Feed
                  </h3>
                </div>
                <span className={`font-mono text-[9px] font-bold px-2 py-0.5 uppercase tracking-wide border ${
                  themeMode === 'dark' 
                    ? 'text-slate-300 bg-slate-800/60 border-slate-700' 
                    : 'text-neutral-500 bg-neutral-100 border-neutral-200'
                }`}>
                  Live Entries
                </span>
              </div>

              {recentDos.length === 0 ? (
                <div className={`py-12 text-center border border-dashed rounded-none ${
                  themeMode === 'dark' ? 'border-slate-800 bg-slate-900/20' : 'border-[#D1D1CF] bg-[#F9F8F6]'
                }`}>
                  <p className="font-serif italic text-xs text-stone-500">
                    No active dispatch records found in database. Once new Despatch Orders are created, they will appear here in real-time.
                  </p>
                </div>
              ) : (
                <div className={`divide-y divide-dotted ${
                  themeMode === 'dark' ? 'divide-slate-800' : 'divide-stone-300'
                }`}>
                  {recentDos.map((doItem, idx) => {
                    const trName = transporters?.find(t => t.id === doItem.transporterId)?.name || 'Direct / Courier';
                    
                    // Status badge style
                    let statusColorBg = themeMode === 'dark' 
                      ? 'bg-amber-950/40 text-amber-350 border-amber-500/20' 
                      : 'bg-[#FFF9C4] text-[#7F5F00] border-[#FBC02D]/40';
                    if (doItem.status === 'Delivered') {
                      statusColorBg = themeMode === 'dark'
                        ? 'bg-emerald-950/40 text-emerald-350 border-emerald-550/20'
                        : 'bg-[#E8F5E9] text-emerald-800 border-emerald-500/30';
                    } else if (doItem.status === 'Cancelled') {
                      statusColorBg = themeMode === 'dark'
                        ? 'bg-red-950/40 text-red-350 border-red-500/20'
                        : 'bg-[#FFEBEE] text-red-700 border-red-500/20';
                    }

                    return (
                      <div key={doItem.id} className="flex flex-col sm:flex-row sm:items-center justify-between py-2.5 first:pt-0 last:pb-0 gap-2">
                        <div className="flex items-start space-x-2.5">
                          <div className={`h-6 w-6 flex items-center justify-center shrink-0 text-[10px] font-mono font-bold border transition-colors ${
                            themeMode === 'dark' 
                              ? 'bg-slate-800/80 border-slate-700 text-slate-300 shadow-[1px_1px_0px_0px_rgba(255,255,255,0.1)]' 
                              : 'bg-[#F9F8F6] border-black text-stone-700 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
                          }`}>
                            {idx + 1}
                          </div>
                          
                          <div className="space-y-0.5">
                            <div className="flex items-center space-x-2 flex-wrap gap-y-0.5">
                              <span className={`font-sans font-black text-xs tracking-tight ${
                                themeMode === 'dark' ? 'text-white' : 'text-neutral-900'
                              }`}>
                                {doItem.doNumber}
                              </span>
                              <span className={`font-mono text-[9px] px-1 border ${
                                themeMode === 'dark' 
                                  ? 'text-slate-300 bg-slate-800/40 border-slate-700' 
                                  : 'text-stone-500 bg-stone-100 border-[#D1D1CF]/40'
                              }`}>
                                {doItem.vehicleNumber || 'No Vehicle'}
                              </span>
                            </div>
                            
                            <p className="text-[10px] text-stone-500 leading-none">
                              Carrier: <span className={`font-semibold truncate block max-w-[150px] sm:inline-block ${
                                themeMode === 'dark' ? 'text-slate-300' : 'text-stone-800'
                              }`}>{trName}</span>
                              {doItem.loadedWeight !== null && (
                                <span className={`ml-1.5 font-mono text-[8px] px-0.5 border ${
                                  themeMode === 'dark' 
                                    ? 'bg-slate-800 text-slate-300 border-slate-700' 
                                    : 'bg-stone-150 border-stone-200'
                                }`}>
                                  {doItem.loadedWeight} MT
                                </span>
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0">
                          <span className="font-mono text-[9px] text-[#888884]">
                            {new Date(doItem.createdAt || doItem.date).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                          
                          <div className={`px-1.5 py-0.5 border text-[8px] font-bold uppercase tracking-wider ${statusColorBg}`}>
                            {doItem.status}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className={`border-t border-dotted pt-3 mt-3 flex justify-between items-center text-[9px] font-mono ${
              themeMode === 'dark' ? 'border-slate-800 text-slate-500' : 'border-stone-300 text-stone-400'
            }`}>
              <span>Automatic real-time sync active</span>
              <span>Showing last 5 entries</span>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
