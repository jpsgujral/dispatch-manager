import React, { useState, useMemo } from 'react';
import { Agent, DespatchOrder, PurchaseOrder, Company, Vendor, SourceLocation } from '../types';
import { getCommissionLogic } from '../data';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Calendar, 
  TrendingUp, 
  DollarSign, 
  Truck, 
  Layers, 
  HelpCircle,
  FileText,
  Building,
  UserSquare2
} from 'lucide-react';

interface ReportsProps {
  agents: Agent[];
  dos: DespatchOrder[];
  pos: PurchaseOrder[];
  companies: Company[];
  vendors: Vendor[];
  sources: SourceLocation[];
  onBack?: () => void;
}

const COLORS = ['#E65100', '#008080', '#5c5c5c', '#B58900', '#2aa198', '#cb4b16'];

export default function Reports({
  agents,
  dos,
  pos,
  companies,
  vendors,
  sources,
  onBack,
}: ReportsProps) {
  // Filters
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<number>(5); // 0-indexed, so 5 is June. June 2026 is our primary seed data month

  const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const YEARS = [2025, 2026, 2027];

  // Helper: check if a DO is in the selected month & year
  const isDoInSelectedMonth = (doDateStr: string) => {
    try {
      const date = new Date(doDateStr);
      return date.getFullYear() === selectedYear && date.getMonth() === selectedMonth;
    } catch {
      return false;
    }
  };

  // 1. Process active (non-cancelled) DOs for KPIs & Commodity calculations
  const monthDos = useMemo(() => {
    return dos.filter(d => isDoInSelectedMonth(d.date) && d.status !== 'Cancelled');
  }, [dos, selectedYear, selectedMonth]);

  // 2. Deliveries with commissions
  const deliveredMonthDos = useMemo(() => {
    return dos.filter(d => isDoInSelectedMonth(d.date) && d.status === 'Delivered' && d.agentId);
  }, [dos, selectedYear, selectedMonth]);

  // 3. KPI Metrics
  const metrics = useMemo(() => {
    let flyAshWeight = 0;
    let ggbsWeight = 0;
    let microSilicaWeight = 0;
    let totalWeight = 0;
    let totalCommission = 0;

    // Commodity specific dispatches
    monthDos.forEach(d => {
      const po = pos.find(p => p.id === d.poId);
      const weight = d.receivedWeight ?? d.loadedWeight ?? 0;
      totalWeight += weight;

      if (po) {
        const material = (po.material || '').toLowerCase();
        if (material.includes('fly ash')) {
          flyAshWeight += weight;
        } else if (material.includes('ggbs')) {
          ggbsWeight += weight;
        } else if (material.includes('silica') || material.includes('micro silica')) {
          microSilicaWeight += weight;
        }
      }
    });

    // Delivered Agent Commissions for current month
    deliveredMonthDos.forEach(d => {
      const po = pos.find(p => p.id === d.poId);
      if (po) {
        const math = getCommissionLogic(po.vendorRate, d.transporterRate, d.receivedWeight);
        totalCommission += math.totalCommission;
      }
    });

    return {
      totalWeight,
      flyAshWeight,
      ggbsWeight,
      microSilicaWeight,
      totalCommission,
      activeDispatches: monthDos.length,
    };
  }, [monthDos, deliveredMonthDos, pos]);

  // 4. Transform data for Daily Dispatches Stacked Bar Chart
  const dailyChartData = useMemo(() => {
    // Generate all days in the selected month
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const daysArray = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const formattedDay = day < 10 ? `0${day}` : `${day}`;
      const monthNum = selectedMonth + 1;
      const formattedMonth = monthNum < 10 ? `0${monthNum}` : `${monthNum}`;
      return {
        dateStr: `${selectedYear}-${formattedMonth}-${formattedDay}`,
        dayLabel: `${MONTHS[selectedMonth].substring(0, 3)} ${day}`,
        'Fly Ash': 0,
        'GGBS': 0,
        'Micro Silica': 0,
        'Total Dispatched': 0,
        'Commission': 0,
      };
    });

    // Fill dispatch values
    monthDos.forEach(d => {
      const po = pos.find(p => p.id === d.poId);
      if (!po) return;

      const dayIdx = new Date(d.date).getDate() - 1;
      if (dayIdx >= 0 && dayIdx < daysArray.length) {
        const weight = d.receivedWeight ?? d.loadedWeight ?? 0;
        const material = (po.material || '').toLowerCase();

        if (material.includes('fly ash')) {
          daysArray[dayIdx]['Fly Ash'] += parseFloat(weight.toFixed(2));
        } else if (material.includes('ggbs')) {
          daysArray[dayIdx]['GGBS'] += parseFloat(weight.toFixed(2));
        } else if (material.includes('silica') || material.includes('micro silica')) {
          daysArray[dayIdx]['Micro Silica'] += parseFloat(weight.toFixed(2));
        }
        daysArray[dayIdx]['Total Dispatched'] += parseFloat(weight.toFixed(2));
      }
    });

    // Fill matching commission values (Strictly delivered DOs)
    deliveredMonthDos.forEach(d => {
      const po = pos.find(p => p.id === d.poId);
      if (!po) return;

      const dayIdx = new Date(d.date).getDate() - 1;
      if (dayIdx >= 0 && dayIdx < daysArray.length) {
        const math = getCommissionLogic(po.vendorRate, d.transporterRate, d.receivedWeight);
        daysArray[dayIdx]['Commission'] += parseFloat(math.totalCommission.toFixed(2));
      }
    });

    // Clean decimals
    return daysArray.map(day => ({
      ...day,
      'Fly Ash': parseFloat(day['Fly Ash'].toFixed(2)),
      'GGBS': parseFloat(day['GGBS'].toFixed(2)),
      'Micro Silica': parseFloat(day['Micro Silica'].toFixed(2)),
      'Total Dispatched': parseFloat(day['Total Dispatched'].toFixed(2)),
      'Commission': parseFloat(day['Commission'].toFixed(2)),
    })).filter(day => day['Total Dispatched'] > 0 || day['Commission'] > 0 || new Date(day.dateStr).getTime() <= Date.now());
  }, [monthDos, deliveredMonthDos, pos, selectedYear, selectedMonth]);

  // 4b. Monthly Trend Data (Last 6 Months)
  const monthlyTrendData = useMemo(() => {
    const trend = [];
    for (let i = 5; i >= 0; i--) {
      const targetDate = new Date(selectedYear, selectedMonth - i, 1);
      const year = targetDate.getFullYear();
      const month = targetDate.getMonth();
      const monthLabel = `${MONTHS[month].substring(0, 3)} ${year}`;

      // Filter non-cancelled DOs for this target month
      const filterDos = dos.filter(d => {
        try {
          const date = new Date(d.date);
          return date.getFullYear() === year && date.getMonth() === month && d.status !== 'Cancelled';
        } catch {
          return false;
        }
      });

      let flyAsh = 0;
      let ggbs = 0;
      let microSilica = 0;
      let total = 0;

      filterDos.forEach(d => {
        const po = pos.find(p => p.id === d.poId);
        const weight = d.receivedWeight ?? d.loadedWeight ?? 0;
        total += weight;

        if (po) {
          const material = (po.material || '').toLowerCase();
          if (material.includes('fly ash')) {
            flyAsh += weight;
          } else if (material.includes('ggbs')) {
            ggbs += weight;
          } else if (material.includes('silica') || material.includes('micro silica')) {
            microSilica += weight;
          }
        }
      });

      trend.push({
        name: monthLabel,
        'Fly Ash': parseFloat(flyAsh.toFixed(2)),
        'GGBS': parseFloat(ggbs.toFixed(2)),
        'Micro Silica': parseFloat(microSilica.toFixed(2)),
        'Total Dispatched': parseFloat(total.toFixed(2)),
      });
    }
    return trend;
  }, [dos, pos, selectedYear, selectedMonth]);

  // Insights based on monthly trend
  const trendInsights = useMemo(() => {
    if (monthlyTrendData.length === 0) return null;

    let peakMonth = '';
    let peakVal = 0;
    let totalSixMonthWeight = 0;

    monthlyTrendData.forEach(m => {
      totalSixMonthWeight += m['Total Dispatched'];
      if (m['Total Dispatched'] > peakVal) {
        peakVal = m['Total Dispatched'];
        peakMonth = m.name;
      }
    });

    const averageMonthly = totalSixMonthWeight / monthlyTrendData.length;
    const currentMonthVal = monthlyTrendData[monthlyTrendData.length - 1]['Total Dispatched'];
    const changePct = averageMonthly > 0 ? ((currentMonthVal - averageMonthly) / averageMonthly) * 100 : 0;

    return {
      peakMonth,
      peakVal: parseFloat(peakVal.toFixed(2)),
      averageMonthly: parseFloat(averageMonthly.toFixed(2)),
      changePct: parseFloat(changePct.toFixed(2)),
      totalSixMonthWeight: parseFloat(totalSixMonthWeight.toFixed(2)),
    };
  }, [monthlyTrendData]);

  // 5. Agent Payout Leaderboard
  const agentCommissions = useMemo(() => {
    const table: Record<string, { agentName: string; totalCommission: number; weight: number; count: number }> = {};
    
    deliveredMonthDos.forEach(d => {
      const agent = agents.find(a => a.id === d.agentId);
      if (!agent) return;

      const po = pos.find(p => p.id === d.poId);
      if (!po) return;

      const math = getCommissionLogic(po.vendorRate, d.transporterRate, d.receivedWeight);
      if (!table[agent.id]) {
        table[agent.id] = {
          agentName: agent.name,
          totalCommission: 0,
          weight: 0,
          count: 0
        };
      }

      table[agent.id].totalCommission += math.totalCommission;
      table[agent.id].weight += d.receivedWeight ?? 0;
      table[agent.id].count += 1;
    });

    return Object.keys(table).map(id => ({
      id,
      name: table[id].agentName,
      value: parseFloat(table[id].totalCommission.toFixed(2)),
      weight: parseFloat(table[id].weight.toFixed(2)),
      count: table[id].count
    })).sort((a, b) => b.value - a.value);
  }, [deliveredMonthDos, agents, pos]);

  // 6. Detailed Table view of Daily Operations
  const dailyBreakdown = useMemo(() => {
    return dailyChartData.map(day => {
      const dateString = day.dateStr;
      const dayDos = monthDos.filter(d => d.date === dateString);
      return {
        date: dateString,
        label: day.dayLabel,
        flyAsh: day['Fly Ash'],
        ggbs: day['GGBS'],
        microSilica: day['Micro Silica'],
        total: day['Total Dispatched'],
        commissions: day['Commission'],
        count: dayDos.length,
      };
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [dailyChartData, monthDos]);

  return (
    <div id="reports-interface" className="space-y-6 animate-fade-in font-sans">
      
      {/* Title block */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white p-6 border border-[#D1D1CF] rounded-none">
        <div>
          <h1 className="text-xl font-serif italic text-[#1A1A1A] font-extrabold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-[#E65100]" />
            <span>Industrial Logistics Reports & Analytics</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time material dispatched analytics, commodity distribution charts, and agent commission payouts.
          </p>
        </div>

        {/* Filter Toolbar */}
        <div className="flex items-center space-x-3 self-start md:self-auto">
          <div className="flex items-center space-x-2 bg-neutral-50 px-3 py-2 border border-[#D1D1CF]">
            <Calendar className="h-4 w-4 text-[#E65100]" />
            <select
              id="report-month-select"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="bg-transparent border-none text-xs font-serif italic font-bold focus:outline-hidden text-neutral-800 cursor-pointer"
            >
              {MONTHS.map((m, idx) => (
                <option key={m} value={idx}>{m}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2 bg-neutral-50 px-3 py-2 border border-[#D1D1CF]">
            <select
              id="report-year-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="bg-transparent border-none text-xs font-serif italic font-bold focus:outline-hidden text-neutral-800 cursor-pointer"
            >
              {YEARS.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {onBack && (
            <button
              onClick={onBack}
              className="px-4 py-2 border border-black hover:bg-black hover:text-white transition-colors text-xs font-serif italic cursor-pointer"
            >
              Exit View
            </button>
          )}
        </div>
      </div>

      {/* KPI Overviews */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* KPI: Total Dispatches */}
        <div className="bg-white p-5 border border-[#D1D1CF] rounded-none shadow-xs">
          <span className="block text-[10px] uppercase tracking-wider font-bold text-slate-500">Total Despatched</span>
          <span className="block text-2xl font-mono font-extrabold text-[#1A1A1A] mt-1">
            {metrics.totalWeight.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MT
          </span>
          <p className="text-[10px] text-[#E65100] font-serif italic mt-1.5 font-medium">
            Across {metrics.activeDispatches} Transit Challans
          </p>
        </div>

        {/* KPI: Fly Ash */}
        <div className="bg-white p-5 border border-[#D1D1CF] rounded-none shadow-xs border-l-4 border-l-[#E65100]">
          <span className="block text-[10px] uppercase tracking-wider font-bold text-[#E65100]">Fly Ash Dispatched</span>
          <span className="block text-xl font-mono font-extrabold text-neutral-800 mt-1">
            {metrics.flyAshWeight.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MT
          </span>
          <div className="w-full bg-neutral-100 h-1 mt-3">
            <div 
              className="bg-[#E65100] h-1" 
              style={{ width: `${metrics.totalWeight > 0 ? (metrics.flyAshWeight / metrics.totalWeight) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* KPI: GGBS */}
        <div className="bg-white p-5 border border-[#D1D1CF] rounded-none shadow-xs border-l-4 border-l-[#008080]">
          <span className="block text-[10px] uppercase tracking-wider font-bold text-[#008080]">GGBS Dispatched</span>
          <span className="block text-xl font-mono font-extrabold text-neutral-800 mt-1">
            {metrics.ggbsWeight.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MT
          </span>
          <div className="w-full bg-neutral-100 h-1 mt-3">
            <div 
              className="bg-[#008080] h-1" 
              style={{ width: `${metrics.totalWeight > 0 ? (metrics.ggbsWeight / metrics.totalWeight) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* KPI: Micro Silica */}
        <div className="bg-white p-5 border border-[#D1D1CF] rounded-none shadow-xs border-l-4 border-l-[#5c5c5c]">
          <span className="block text-[10px] uppercase tracking-wider font-bold text-[#5c5c5c]">Micro Silica</span>
          <span className="block text-xl font-mono font-extrabold text-neutral-800 mt-1">
            {metrics.microSilicaWeight.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MT
          </span>
          <div className="w-full bg-neutral-100 h-1 mt-3">
            <div 
              className="bg-[#5c5c5c] h-1" 
              style={{ width: `${metrics.totalWeight > 0 ? (metrics.microSilicaWeight / metrics.totalWeight) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* KPI: Agent Commissions */}
        <div className="bg-[#FFF8E1] p-5 border border-[#FFE082] rounded-none shadow-xs">
          <span className="block text-[10px] uppercase tracking-wider font-bold text-amber-800">Agent Commissions</span>
          <span className="block text-2xl font-mono font-extrabold text-amber-900 mt-1">
            ₹{metrics.totalCommission.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <p className="text-[10px] text-amber-700 font-serif italic mt-1.5 font-medium flex items-center gap-1">
            <DollarSign className="h-3 w-3 shrink-0" />
            Accrued on Delivered Shipments
          </p>
        </div>
      </div>

      {/* Main Graph Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Commodity Daily Dispatches Bar Chart */}
        <div className="bg-white p-6 border border-[#D1D1CF] rounded-none lg:col-span-2 space-y-4">
          <div>
            <h3 className="text-xs uppercase tracking-wider font-bold text-neutral-800 flex items-center justify-between">
              <span>Daily Commodity Dispatches (MT)</span>
              <span className="font-serif italic font-medium text-[11px] text-slate-500 lowercase">Stacked Metric Tons (MT)</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">Daily dispatch volume distribution filtered by Fly Ash, GGBS, and Micro Silica.</p>
          </div>

          <div className="h-[320px]">
            {dailyChartData.length === 0 ? (
              <div className="w-full h-full flex flex-col items-center justify-center border border-dashed border-[#D1D1CF] bg-neutral-50 p-6 text-center text-slate-500">
                <Truck className="h-8 w-8 text-slate-300 mb-2" />
                <p className="text-xs font-serif italic">No dispatches recorded in {MONTHS[selectedMonth]} {selectedYear}.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dailyChartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis 
                    dataKey="dayLabel" 
                    tick={{ fontSize: 10, fill: '#6B7280' }} 
                    stroke="#D1D5DB"
                  />
                  <YAxis 
                    tick={{ fontSize: 10, fill: '#6B7280' }} 
                    stroke="#D1D5DB"
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1A1A1A', color: '#FFF', borderRadius: '0', border: 'none', fontSize: '11px', fontFamily: 'sans-serif' }}
                    labelStyle={{ fontWeight: 'bold', color: '#FFA726', marginBottom: '4px' }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconType="rect"
                    wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                  />
                  <Bar dataKey="Fly Ash" stackId="a" fill="#E65100" name="Fly Ash (MT)" />
                  <Bar dataKey="GGBS" stackId="a" fill="#008080" name="GGBS (MT)" />
                  <Bar dataKey="Micro Silica" stackId="a" fill="#5c5c5c" name="Micro Silica (MT)" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Agent Commissions Share */}
        <div className="bg-white p-6 border border-[#D1D1CF] rounded-none space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-xs uppercase tracking-wider font-bold text-neutral-800">
              Agent Commissions Share (₹)
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">
              Top performing commission agents by accrued dispatch payouts for {MONTHS[selectedMonth]} {selectedYear}.
            </p>
          </div>

          <div className="h-[220px] relative flex items-center justify-center">
            {agentCommissions.length === 0 ? (
              <div className="w-full h-full flex flex-col items-center justify-center border border-dashed border-[#D1D1CF] bg-neutral-50 p-4 text-center text-slate-500">
                <DollarSign className="h-8 w-8 text-slate-300 mb-2" />
                <p className="text-xs font-serif italic">No agency commissions accrued for this period.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={agentCommissions}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {agentCommissions.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => `₹${parseFloat(value).toLocaleString()}`}
                    contentStyle={{ backgroundColor: '#1A1A1A', color: '#FFF', borderRadius: '0', border: 'none', fontSize: '11px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Legend Table */}
          <div className="border-t border-[#F4F4F1] pt-3 space-y-2">
            <span className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider">Accrual Details</span>
            {agentCommissions.length === 0 ? (
              <p className="text-[10px] text-slate-400 italic">No rankings available.</p>
            ) : (
              <div className="max-h-[110px] overflow-y-auto space-y-1.5 pr-1 divide-y divide-[#F4F4F1]">
                {agentCommissions.map((agent, index) => (
                  <div key={agent.id} className="flex items-center justify-between text-xs pt-1.5 first:pt-0">
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="font-semibold text-neutral-800 truncate max-w-[120px]">{agent.name}</span>
                    </div>
                    <div className="text-right font-mono text-[11px]">
                      <span className="font-bold text-neutral-800">₹{agent.value.toLocaleString()}</span>
                      <span className="text-zinc-400 block text-[9px] font-sans">{agent.weight} MT ({agent.count} DOs)</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Monthly Demand Trends (Recharts Line Chart) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 6-Month Tonnage Trend Line Chart */}
        <div className="bg-white p-6 border border-[#D1D1CF] rounded-none lg:col-span-2 space-y-4">
          <div>
            <h3 className="text-xs uppercase tracking-wider font-bold text-neutral-800 flex items-center justify-between">
              <span>6-Month Monthly Tonnage Trend (MT)</span>
              <span className="font-serif italic font-medium text-[11px] text-[#E65100] lowercase">Seasonal Demand Tracking</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">
              Historical aggregate and commodity-specific dispatch trends across the last six months.
            </p>
          </div>

          <div className="h-[320px]">
            {monthlyTrendData.length === 0 ? (
              <div className="w-full h-full flex flex-col items-center justify-center border border-dashed border-[#D1D1CF] bg-neutral-50 p-6 text-center text-slate-500">
                <Truck className="h-8 w-8 text-slate-300 mb-2" />
                <p className="text-xs font-serif italic">No historical dispatches available.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={monthlyTrendData}
                  margin={{ top: 15, right: 15, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 10, fill: '#6B7280' }} 
                    stroke="#D1D5DB"
                  />
                  <YAxis 
                    tick={{ fontSize: 10, fill: '#6B7280' }} 
                    stroke="#D1D5DB"
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1A1A1A', color: '#FFF', borderRadius: '0', border: 'none', fontSize: '11px', fontFamily: 'sans-serif' }}
                    labelStyle={{ fontWeight: 'bold', color: '#FFA726', marginBottom: '4px' }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconType="plainline"
                    wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                  />
                  <Line type="monotone" dataKey="Fly Ash" stroke="#E65100" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Fly Ash (MT)" />
                  <Line type="monotone" dataKey="GGBS" stroke="#008080" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} name="GGBS (MT)" />
                  <Line type="monotone" dataKey="Micro Silica" stroke="#5c5c5c" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Micro Silica (MT)" />
                  <Line type="monotone" dataKey="Total Dispatched" stroke="#1A1A1A" strokeWidth={3} strokeDasharray="5 5" dot={{ r: 5 }} activeDot={{ r: 7 }} name="Total Dispatched (MT)" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Seasonal Insights Block */}
        <div className="bg-white p-6 border border-[#D1D1CF] rounded-none space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <h3 className="text-xs uppercase tracking-wider font-bold text-neutral-800">
                Seasonal Demand Insights
              </h3>
              <p className="text-[11px] text-slate-500 mt-1">
                Data-driven analysis extracted from active dispatch registry records.
              </p>
            </div>

            {trendInsights ? (
              <div className="space-y-4">
                {/* Metric list */}
                <div className="divide-y divide-[#F4F4F1]">
                  <div className="py-2.5 flex justify-between items-center text-xs">
                    <span className="text-slate-500">6-Month Cumulative Vol</span>
                    <span className="font-mono font-bold text-neutral-800">
                      {trendInsights.totalSixMonthWeight.toLocaleString()} MT
                    </span>
                  </div>
                  <div className="py-2.5 flex justify-between items-center text-xs">
                    <span className="text-slate-500">Peak Demand Period</span>
                    <span className="font-serif italic font-bold text-[#E65100] bg-[#FFF8E1] px-2 py-0.5 border border-[#FFE082]">
                      {trendInsights.peakMonth} ({trendInsights.peakVal.toLocaleString()} MT)
                    </span>
                  </div>
                  <div className="py-2.5 flex justify-between items-center text-xs">
                    <span className="text-slate-500">Monthly Avg Volume</span>
                    <span className="font-mono font-bold text-neutral-800">
                      {trendInsights.averageMonthly.toLocaleString()} MT
                    </span>
                  </div>
                  <div className="py-2.5 flex justify-between items-center text-xs">
                    <span className="text-slate-500">Deviation vs Avg</span>
                    <span className={`font-mono font-bold flex items-center gap-0.5 ${
                      trendInsights.changePct >= 0 ? 'text-emerald-700' : 'text-rose-700'
                    }`}>
                      {trendInsights.changePct >= 0 ? '+' : ''}{trendInsights.changePct}%
                    </span>
                  </div>
                </div>

                {/* Analytical explanation text */}
                <div className="bg-neutral-50 p-3.5 border border-[#D1D1CF] space-y-2">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Seasonal Analysis</span>
                  <p className="text-[11px] text-stone-600 leading-relaxed">
                    Peak industrial dispatches reached <strong className="text-black font-semibold">{trendInsights.peakVal.toLocaleString()} MT</strong> in <strong className="text-black font-semibold">{trendInsights.peakMonth}</strong>. 
                    The current window is operating at <strong className="text-black font-semibold">{Math.abs(trendInsights.changePct)}% {trendInsights.changePct >= 0 ? 'above' : 'below'}</strong> the 6-month average demand baseline.
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 italic text-xs">
                No insights could be generated for the current window.
              </div>
            )}
          </div>

          <div className="text-[10px] text-slate-400 italic pt-2 border-t border-[#F4F4F1] flex items-center gap-1.5 leading-tight">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
            <span>Refreshes dynamically based on active filters</span>
          </div>
        </div>

      </div>

      {/* Daily Operating Breakdown Ledger Table */}
      <div className="bg-white p-6 border border-[#D1D1CF] rounded-none space-y-4">
        <div>
          <h3 className="text-xs uppercase tracking-wider font-bold text-neutral-800 flex items-center justify-between">
            <span>Daily Operations Breakdown</span>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-neutral-100 text-slate-600 border border-[#D1D1CF] normal-case">
              {MONTHS[selectedMonth]} {selectedYear} Registry
            </span>
          </h3>
          <p className="text-[11px] text-slate-500 mt-1">Detailed day-by-day tonnage logged and total commissions accrued.</p>
        </div>

        <div className="overflow-x-auto border border-[#D1D1CF]">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-[#1A1A1A] text-white uppercase tracking-wider text-[10px] font-sans">
              <tr>
                <th className="px-4 py-3 font-semibold">Dispatch Day</th>
                <th className="px-4 py-3 font-semibold text-right">Fly Ash (MT)</th>
                <th className="px-4 py-3 font-semibold text-right">GGBS (MT)</th>
                <th className="px-4 py-3 font-semibold text-right">Micro Silica (MT)</th>
                <th className="px-4 py-3 font-semibold text-center">Active DOs</th>
                <th className="px-4 py-3 font-semibold text-right">Day Dispatched Total</th>
                <th className="px-4 py-3 font-semibold text-right">Agent Commissions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F4F4F1]">
              {dailyBreakdown.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500 font-serif italic">
                    No logs recorded for this month.
                  </td>
                </tr>
              ) : (
                dailyBreakdown.map((row) => (
                  <tr key={row.date} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-4 py-3 font-bold text-zinc-900 font-serif italic">
                      {row.label}, {selectedYear}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-stone-600">
                      {row.flyAsh > 0 ? `${row.flyAsh.toFixed(2)} MT` : '-'}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-stone-600">
                      {row.ggbs > 0 ? `${row.ggbs.toFixed(2)} MT` : '-'}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-stone-600">
                      {row.microSilica > 0 ? `${row.microSilica.toFixed(2)} MT` : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-1.5 py-0.5 rounded-none font-mono text-[10px] ${
                        row.count > 0 ? 'bg-amber-100 text-amber-800' : 'bg-neutral-100 text-slate-400'
                      }`}>
                        {row.count} DOs
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-[#E65100]">
                      {row.total > 0 ? `${row.total.toFixed(2)} MT` : '-'}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-emerald-800 font-bold">
                      {row.commissions > 0 ? `₹${row.commissions.toLocaleString()}` : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
