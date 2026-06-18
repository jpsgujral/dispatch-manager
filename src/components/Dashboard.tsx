import React from 'react';
import { Company, Vendor, Transporter, Agent, PurchaseOrder, DespatchOrder } from '../types';
import { getCommissionLogic } from '../data';
import { 
  Building, 
  Users, 
  Truck, 
  UserSquare2, 
  FileCheck, 
  TrendingUp, 
  CircleDollarSign, 
  Scale, 
  Inbox,
  Clock,
  ArrowRight,
  Sparkles,
  Search,
  X,
  FileText,
  Download
} from 'lucide-react';

interface DashboardProps {
  companies: Company[];
  vendors: Vendor[];
  transporters: Transporter[];
  agents: Agent[];
  pos: PurchaseOrder[];
  dos: DespatchOrder[];
  onNavigate: (tab: string) => void;
  onSelectChallan?: (doItem: DespatchOrder) => void;
  onUpdateReceivedWeight?: (
    id: string, 
    receivedWeight: number | null, 
    remarks?: string,
    deliveryDocUrl?: string,
    deliveryDocName?: string,
    status?: 'In Transit' | 'Delivered' | 'Cancelled'
  ) => void;
}

export default function Dashboard({
  companies,
  vendors,
  transporters,
  agents,
  pos,
  dos,
  onNavigate,
  onSelectChallan,
  onUpdateReceivedWeight,
}: DashboardProps) {

  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedTransitIds, setSelectedTransitIds] = React.useState<string[]>([]);

  const handleBulkDeliver = () => {
    if (selectedTransitIds.length === 0) return;
    if (onUpdateReceivedWeight) {
      if (confirm(`Are you sure you want to change the status of ${selectedTransitIds.length} selected transit orders to "Delivered"? This will also copy their Loaded Weight to Received Weight by default to enable accurate commission calculations.`)) {
        selectedTransitIds.forEach(id => {
          const item = dos.find(d => d.id === id);
          if (item) {
            const finalReceived = item.receivedWeight !== null ? item.receivedWeight : item.loadedWeight;
            onUpdateReceivedWeight(id, finalReceived, item.remarks || '', item.deliveryDocUrl || '', item.deliveryDocName || '', 'Delivered');
          }
        });
        setSelectedTransitIds([]);
      }
    }
  };

  const handleExportCSV = () => {
    // CSV Headers
    const headers = [
      'DO Number',
      'Date',
      'Status',
      'Vehicle/Bulker Number',
      'Driver Name',
      'Driver Phone',
      'Dispatch Plant',
      'Loaded Weight (MT)',
      'Received Weight (MT)',
      'Transporter Name',
      'Transporter Rate (INR)',
      'Purchase Order #',
      'Commodity Type',
      'Vendor Name',
      'Commission Agent Name',
      'Agent Commission (INR)',
      'Invoice No',
      'Invoice Received',
      'Remarks'
    ];

    const rows = dos.map(d => {
      const po = pos.find(p => p.id === d.poId);
      const vendor = po ? vendors.find(v => v.id === po.vendorId) : null;
      const transporter = transporters.find(t => t.id === d.transporterId);
      const agent = d.agentId ? agents.find(a => a.id === d.agentId) : null;
      
      let commissionVal = '0.00';
      if (po && d.receivedWeight !== null) {
        const math = getCommissionLogic(po.vendorRate, d.transporterRate, d.receivedWeight);
        commissionVal = math.totalCommission.toFixed(2);
      }

      const values = [
        d.doNumber || '',
        d.date || '',
        d.status || '',
        d.vehicleNumber || '',
        d.driverName || '',
        d.driverPhone || '',
        d.vendorPlant || '',
        d.loadedWeight !== null ? d.loadedWeight.toString() : '',
        d.receivedWeight !== null ? d.receivedWeight.toString() : '',
        transporter ? transporter.name : 'N/A',
        d.transporterRate !== null ? d.transporterRate.toString() : '',
        po ? po.poNumber : 'N/A',
        po ? po.material : 'N/A',
        vendor ? vendor.name : 'N/A',
        agent ? agent.name : 'N/A',
        commissionVal,
        d.invoiceNo || '',
        d.invoiceReceived ? 'Yes' : 'No',
        d.remarks || ''
      ];

      return values.map(val => {
        const escaped = ('' + val).replace(/"/g, '""');
        return `"${escaped}"`;
      }).join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `despatch_orders_archive_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredDos = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];

    return dos.filter(item => {
      const doNum = (item.doNumber || '').toLowerCase();
      const vehicleNum = (item.vehicleNumber || '').toLowerCase();
      
      const transporter = transporters.find(t => t.id === item.transporterId);
      const transporterName = transporter ? transporter.name.toLowerCase() : '';

      return doNum.includes(query) || vehicleNum.includes(query) || transporterName.includes(query);
    });
  }, [searchQuery, dos, transporters]);

  // Global calculations
  const totalLMT = dos.reduce((sum, item) => sum + (item.loadedWeight ?? 0), 0);
  const totalRMT = dos.reduce((sum, item) => sum + (item.receivedWeight ?? 0), 0);
  const pendingWeighmentsCount = dos.filter(item => item.receivedWeight === null && item.status !== 'Cancelled').length;
  
  let totalCommissionsPaid = 0;
  let totalGrossProfitValue = 0;
  let netCompanyEarnings = 0;
  let flyAshMT = 0;
  let ggbsMT = 0;
  let silicaMT = 0;

  dos.forEach(item => {
    if (item.status === 'Cancelled') return;
    
    const po = pos.find(p => p.id === item.poId);
    if (!po) return;

    // Track material volumes
    const effectiveWeight = item.receivedWeight ?? (item.loadedWeight ?? 0);
    if (po.material === 'Fly Ash') flyAshMT += effectiveWeight;
    else if (po.material === 'GGBS') ggbsMT += effectiveWeight;
    else if (po.material === 'Micro Silica') silicaMT += effectiveWeight;

    // Track financial math (using receivedWeight for delivered items, or temporary gross calculation for transit if desired)
    // The prompt says commission is paid on received weight. Let's strictly calculate commission for "received weight" records
    if (item.receivedWeight !== null) {
      const math = getCommissionLogic(po.vendorRate, item.transporterRate, item.receivedWeight);
      totalGrossProfitValue += math.totalGrossProfit;
      if (item.agentId) {
        totalCommissionsPaid += math.totalCommission;
      }
      netCompanyEarnings += math.netCompanyProfit;
    }
  });

  const materialDistribution = [
    { name: 'Fly Ash Powder', value: flyAshMT, color: 'bg-slate-500', barColor: 'indigo' },
    { name: 'GGBS Granules', value: ggbsMT, color: 'bg-emerald-600', barColor: 'emerald' },
    { name: 'Micro Silica', value: silicaMT, color: 'bg-indigo-600', barColor: 'blue' },
  ];

  const maxMaterialVol = Math.max(...materialDistribution.map(m => m.value), 1);

  return (
    <div id="dashboard-tab" className="space-y-8 animate-fade-in">
      
      {/* Welcome Banner */}
      <div className="bg-[#1A1A1A] text-white rounded-none p-8 border border-black relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[#E65100]/5 pointer-events-none"></div>
        <div className="space-y-3 z-10">
          <div className="inline-flex items-center space-x-2 bg-[#E65100]/20 text-[#E65100] px-3 py-1 rounded-none text-xs font-bold uppercase tracking-widest border border-[#E65100]">
            <Sparkles className="h-3 w-3" />
            <span>The Fly Ash People</span>
          </div>
          <h1 className="text-3xl font-serif font-bold italic tracking-tight">
            {companies[0]?.name || 'Sardar & Apex Bulker Logistics'}
          </h1>
          <p className="text-neutral-300 text-sm max-w-xl font-sans leading-relaxed">
            Real-time management ledger for Fly Ash, GGBS, and Micro Silica logistics. Monitor contracted PO quantities, trigger dispatch orders, audit agent commission payouts, and export instant Challans.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 z-10 w-full md:w-auto">
          <button
            id="export-csv-btn"
            onClick={handleExportCSV}
            className="flex items-center justify-center space-x-2 px-5 py-3 border border-neutral-600 bg-neutral-800 hover:bg-neutral-700 text-white font-serif italic text-sm transition-all whitespace-nowrap cursor-pointer"
          >
            <Download className="h-4 w-4 text-[#E65100]" />
            <span>Export Despatch Ledger (.CSV)</span>
          </button>

          <button
            id="quick-despatch-btn"
            onClick={() => onNavigate('dispatch')}
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-[#E65100] hover:bg-white hover:text-black hover:border-black border border-[#E65100] text-white font-serif italic text-sm transition-all whitespace-nowrap cursor-pointer"
          >
            <span>Issue New Despatch</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Global Search Console */}
      <div className="bg-white p-6 border border-[#D1D1CF] rounded-none space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xs uppercase tracking-[0.2em] font-bold text-[#1A1A1A]">Global Despatch Search</h2>
            <p className="text-xs text-slate-500 mt-1">
              Find any Despatch Order or Transit Challan instantly by DO number, Transporter name, or Bulker/Vehicle plate number.
            </p>
          </div>
          <div className="relative w-full md:max-w-md">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="h-4 w-4" />
            </span>
            <input
              id="global-search-input"
              type="text"
              placeholder="Search DO#, transporter name, or vehicle number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-neutral-50 text-[#1A1A1A] text-sm border border-[#D1D1CF] focus:outline-hidden focus:border-[#E65100] focus:ring-1 focus:ring-[#E65100] transition-all rounded-none placeholder:text-slate-400 placeholder:italic"
            />
            {searchQuery && (
              <button
                id="clear-search-btn"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-black cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Search Results Drawer */}
        {searchQuery.trim() !== '' && (
          <div className="mt-4 pt-4 border-t border-[#F4F4F1] animate-fade-in space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-serif italic text-neutral-600">
                Found <strong className="text-black font-semibold font-sans">{filteredDos.length}</strong> match{filteredDos.length === 1 ? '' : 'es'} for "{searchQuery}"
              </span>
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs text-[#E65100] hover:underline font-serif italic cursor-pointer"
              >
                Clear Search
              </button>
            </div>

            {filteredDos.length === 0 ? (
              <div className="py-8 text-center border border-dashed border-[#D1D1CF] text-slate-500 rounded-none bg-neutral-50">
                <Inbox className="h-6 w-6 mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-serif italic">No matching despatch orders found.</p>
                <p className="text-[10px] text-slate-400 mt-1">Please edit your query or check for typo errors.</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-[#D1D1CF]">
                <table className="w-full text-left border-collapse bg-white text-xs">
                  <thead className="bg-[#1A1A1A] text-white uppercase tracking-wider text-[10px] font-sans">
                    <tr>
                      <th className="px-4 py-3 font-semibold">DO Number / Date</th>
                      <th className="px-4 py-3 font-semibold">Transporter / Vehicle</th>
                      <th className="px-4 py-3 font-semibold">Destination / Plant</th>
                      <th className="px-4 py-3 font-semibold text-right">Tonnage (MT)</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold text-center">Challan Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F4F4F1]">
                    {filteredDos.map((item) => {
                      const t = transporters.find(trans => trans.id === item.transporterId);
                      const po = pos.find(p => p.id === item.poId);
                      const effectiveWeight = item.receivedWeight !== null ? item.receivedWeight : item.loadedWeight;

                      return (
                        <tr key={item.id} className="hover:bg-neutral-50 transition-colors">
                          <td className="px-4 py-3.5">
                            <div className="font-bold text-[#1A1A1A] font-mono">{item.doNumber}</div>
                            <div className="text-[10px] text-slate-500 mt-0.5">{item.date}</div>
                          </td>
                          <td className="px-4 py-3.5 flex flex-col items-start">
                            <div className="font-semibold text-zinc-900">{t?.name || 'Unknown Transporter'}</div>
                            <div className="font-bold text-[10px] text-neutral-800 bg-neutral-100 px-1.5 py-0.5 border border-[#D1D1CF] inline-block font-mono mt-1 uppercase">
                              {item.vehicleNumber}
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="font-semibold text-zinc-900">{item.vendorPlant}</div>
                            {po && (
                              <div className="text-[10px] text-slate-500 mt-0.5 italic">
                                PO: {po.poNumber} &bull; <span className="text-[#E65100] font-sans font-medium">{po.material}</span>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-right font-mono font-semibold">
                            <div>{effectiveWeight !== null ? `${effectiveWeight.toFixed(2)} MT` : 'Pending'}</div>
                            {item.receivedWeight !== null && (
                              <div className="text-[9px] text-emerald-700 bg-emerald-50 border border-emerald-200 inline-block px-1 mt-0.5">
                                Verified Weighment
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3.5">
                            <span className={`inline-block px-2.5 py-0.5 font-sans font-bold uppercase tracking-wider text-[9px] border ${
                              item.status === 'Cancelled'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : item.status === 'Delivered'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <div className="flex items-center justify-center space-x-2">
                              {onSelectChallan && (
                                <button
                                  id={`search-item-challan-${item.id}`}
                                  onClick={() => onSelectChallan(item)}
                                  className="px-2.5 py-1.5 bg-[#E65100] hover:bg-black text-white rounded-none font-serif italic text-[11px] transition-all cursor-pointer font-medium flex items-center space-x-1"
                                >
                                  <FileText className="h-3.5 w-3.5" />
                                  <span>Preview & Print PDF</span>
                                </button>
                              )}
                              <button
                                id={`search-item-edit-${item.id}`}
                                onClick={() => {
                                  onNavigate('dispatch');
                                }}
                                className="px-2.5 py-1.5 border border-[#D1D1CF] hover:bg-neutral-900 hover:text-white rounded-none font-serif italic text-[11px] transition-all cursor-pointer font-medium"
                              >
                                Edit / View in Registry
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* KPI: Total Tonnage */}
        <div className="bg-white rounded-none p-6 border border-[#D1D1CF] flex flex-col justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-[#888884] font-semibold">Total Tonnage Shipped</p>
            <p className="text-4xl font-serif text-[#1A1A1A] mt-2">
              {totalLMT.toFixed(2)} <span className="text-xs font-sans text-[#888884]">MT</span>
            </p>
          </div>
          <div className="mt-4 pt-2 border-t border-[#F4F4F1] flex justify-between items-center text-xs text-slate-500">
            <span>Delivered weight:</span>
            <span className="font-mono font-bold text-black">{totalRMT.toFixed(2)} MT</span>
          </div>
        </div>

        {/* KPI: Net Company Profit */}
        <div className="bg-white rounded-none p-6 border border-[#D1D1CF] flex flex-col justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-[#888884] font-semibold">Net Company Profit</p>
            <p className="text-4xl font-serif text-[#1A1A1A] mt-2 font-bold">
              ₹ {Math.round(netCompanyEarnings).toLocaleString('en-IN')}
            </p>
          </div>
          <div className="mt-4 pt-2 border-t border-[#F4F4F1] flex justify-between items-center text-xs text-slate-500">
            <span>Gross Profit:</span>
            <span className="font-mono text-emerald-800 font-bold">₹{Math.round(totalGrossProfitValue).toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* KPI: Active Agent Commissions */}
        <div className="bg-white rounded-none p-6 border border-[#D1D1CF] flex flex-col justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-[#888884] font-semibold">Agent Commissions Pending</p>
            <p className="text-4xl font-serif text-[#E65100] mt-2">
              ₹ {Math.round(totalCommissionsPaid).toLocaleString('en-IN')}
            </p>
          </div>
          <div className="mt-4 pt-2 border-t border-[#F4F4F1] text-[11px] text-slate-500 italic">
            Calculated over actual delivered tons
          </div>
        </div>

        {/* KPI: Weight Weighments Pending */}
        <div className="bg-[#1A1A1A] text-white rounded-none p-6 flex flex-col justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-neutral-400 font-semibold">Weighments In Transit</p>
            <p className="text-4xl font-serif mt-2 font-bold text-[#E65100]">{pendingWeighmentsCount}</p>
          </div>
          <div className="mt-4 pt-2 border-t border-neutral-800 text-[11px] text-neutral-400">
            Active bulkers on delivery path
          </div>
        </div>

      </div>

      {/* Main Layout Divided Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns: Material Split & Masters Summary */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Material Volumes Chart */}
          <div className="bg-white p-6 rounded-none border border-[#D1D1CF]">
            <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-[#1A1A1A] mb-1">Material Volume Distribution (MT)</h3>
            <p className="text-xs text-slate-500 mb-6">Aggregate dry-power transport loads processed across all dispatches.</p>
            
            <div className="space-y-5">
              {materialDistribution.map((item) => {
                const pct = Math.max(8, (item.value / maxMaterialVol) * 100);
                return (
                  <div key={item.name} className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-serif italic text-sm text-[#1A1A1A]">{item.name}</span>
                      <strong className="font-mono text-xs text-[#1A1A1A] bg-[#F4F4F1] px-2.5 py-0.5 border border-[#D1D1CF]">
                        {item.value.toFixed(2)} MT
                      </strong>
                    </div>
                    <div className="h-2 w-full bg-[#F4F4F1] rounded-none overflow-hidden">
                      <div 
                        className="h-full bg-[#E65100] transition-all duration-1000" 
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Masters counts grid */}
          <div className="bg-white p-6 rounded-none border border-[#D1D1CF]">
            <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-[#1A1A1A] mb-5">Master Registry Inventories</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <button 
                onClick={() => onNavigate('company')}
                className="p-4 rounded-none border border-[#D1D1CF] bg-[#F9F8F6] hover:bg-[#F4F4F1] text-left transition-colors cursor-pointer group"
              >
                <div className="h-8 w-8 bg-[#1A1A1A] text-white flex items-center justify-center mb-3">
                  <Building className="h-4 w-4" />
                </div>
                <p className="text-[10px] font-bold text-[#888884] uppercase tracking-wider">Company</p>
                <p className="text-2xl font-serif text-black mt-1">{companies.length}</p>
                <span className="text-[10px] text-[#E65100] font-serif italic group-hover:underline mt-2 inline-block">Edit Ledger →</span>
              </button>

              <button 
                onClick={() => onNavigate('vendor')}
                className="p-4 rounded-none border border-[#D1D1CF] bg-[#F9F8F6] hover:bg-[#F4F4F1] text-left transition-colors cursor-pointer group"
              >
                <div className="h-8 w-8 bg-[#1A1A1A] text-white flex items-center justify-center mb-3">
                  <Users className="h-4 w-4" />
                </div>
                <p className="text-[10px] font-bold text-[#888884] uppercase tracking-wider">Vendors</p>
                <p className="text-2xl font-serif text-black mt-1">{vendors.length}</p>
                <span className="text-[10px] text-[#E65100] font-serif italic group-hover:underline mt-2 inline-block">Edit Ledger →</span>
              </button>

              <button 
                onClick={() => onNavigate('transporter')}
                className="p-4 rounded-none border border-[#D1D1CF] bg-[#F9F8F6] hover:bg-[#F4F4F1] text-left transition-colors cursor-pointer group"
              >
                <div className="h-8 w-8 bg-[#E65100] text-white flex items-center justify-center mb-3">
                  <Truck className="h-4 w-4" />
                </div>
                <p className="text-[10px] font-bold text-[#888884] uppercase tracking-wider">Transports</p>
                <p className="text-2xl font-serif text-black mt-1">{transporters.length}</p>
                <span className="text-[10px] text-[#E65100] font-serif italic group-hover:underline mt-2 inline-block">Edit Ledger →</span>
              </button>

              <button 
                onClick={() => onNavigate('agent')}
                className="p-4 rounded-none border border-[#D1D1CF] bg-[#F9F8F6] hover:bg-[#F4F4F1] text-left transition-colors cursor-pointer group"
              >
                <div className="h-8 w-8 bg-[#1A1A1A] text-white flex items-center justify-center mb-3">
                  <UserSquare2 className="h-4 w-4" />
                </div>
                <p className="text-[10px] font-bold text-[#888884] uppercase tracking-wider">Brokers</p>
                <p className="text-2xl font-serif text-black mt-1">{agents.length}</p>
                <span className="text-[10px] text-[#E65100] font-serif italic group-hover:underline mt-2 inline-block">Edit Ledger →</span>
              </button>

              <button 
                onClick={() => onNavigate('po')}
                className="p-4 rounded-none border border-[#D1D1CF] bg-[#F9F8F6] hover:bg-[#F4F4F1] text-left transition-colors cursor-pointer group col-span-2 md:col-span-1"
              >
                <div className="h-8 w-8 bg-[#1A1A1A] text-white flex items-center justify-center mb-3">
                  <FileCheck className="h-4 w-4" />
                </div>
                <p className="text-[10px] font-bold text-[#888884] uppercase tracking-wider">Active POs</p>
                <p className="text-2xl font-serif text-black mt-1">{pos.length}</p>
                <span className="text-[10px] text-[#E65100] font-serif italic group-hover:underline mt-2 inline-block">Edit Ledger →</span>
              </button>
            </div>
          </div>

        </div>

        {/* Right Column: Live In-Transit Monitor */}
        <div className="space-y-6">
          
          {/* Ongoing Transits list */}
          <div className="bg-white p-6 rounded-none border border-[#D1D1CF] flex flex-col h-full">
            <div className="flex justify-between items-center mb-2 border-b border-[#F4F4F1] pb-3">
              <h3 className="text-xs uppercase tracking-[0.1em] font-bold text-[#1A1A1A]">Transit Bulkers</h3>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] bg-[#E65100] text-white px-2 py-0.5 rounded-none font-mono font-bold uppercase">
                  {dos.filter(item => item.status === 'In Transit').length} Active
                </span>
              </div>
            </div>

            {/* Select All Toggle & Bulk Actions Box */}
            {dos.filter(item => item.status === 'In Transit').length > 0 && (
              <div className="flex flex-col gap-2 mb-4">
                <div className="flex items-center justify-between text-xs py-1 text-slate-500">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input 
                      type="checkbox"
                      checked={
                        dos.filter(item => item.status === 'In Transit').length > 0 &&
                        dos.filter(item => item.status === 'In Transit').every(item => selectedTransitIds.includes(item.id))
                      }
                      onChange={(e) => {
                        const inTransitItems = dos.filter(item => item.status === 'In Transit');
                        if (e.target.checked) {
                          setSelectedTransitIds(inTransitItems.map(item => item.id));
                        } else {
                          setSelectedTransitIds([]);
                        }
                      }}
                      className="h-3.5 w-3.5 text-[#E65100] border-[#D1D1CF] focus:ring-[#E65100] accent-[#E65100]"
                    />
                    <span className="text-[11px] font-medium text-slate-600">Select All In Transit</span>
                  </label>
                  {selectedTransitIds.length > 0 && (
                    <button
                      onClick={() => setSelectedTransitIds([])}
                      className="text-[10px] text-slate-400 hover:text-black underline cursor-pointer"
                    >
                      Deselect All ({selectedTransitIds.length})
                    </button>
                  )}
                </div>

                {selectedTransitIds.length > 0 && (
                  <div className="bg-[#FFF8E1] p-3 border border-[#FFE082] flex flex-col gap-2 transition-all">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-1.5 text-amber-900">
                        <span className="font-bold font-mono bg-amber-200 px-1.5 py-0.5">
                          {selectedTransitIds.length}
                        </span>
                        <span>Bulkers Selected</span>
                      </div>
                    </div>
                    <button
                      id="bulk-deliver-btn"
                      onClick={handleBulkDeliver}
                      className="w-full text-center py-2 bg-[#E65100] text-white hover:bg-[#c64500] font-serif italic text-xs font-bold transition-all shadow-xs cursor-pointer animate-pulse"
                    >
                      Bulk Deliver Selected ({selectedTransitIds.length})
                    </button>
                  </div>
                )}
              </div>
            )}
            
            <div className="space-y-4 divide-y divide-[#F4F4F1] overflow-y-auto max-h-[380px] -mx-2 pr-2">
              {dos.filter(item => item.status === 'In Transit').length === 0 ? (
                <div className="py-12 text-center text-[#888884] space-y-2">
                  <Inbox className="h-8 w-8 mx-auto text-[#D1D1CF]" />
                  <p className="font-serif italic text-sm">No bulkers currently in transit.</p>
                  <p className="text-[10px] text-slate-400">All dispatches logged, weighed, and archived.</p>
                </div>
              ) : (
                dos.filter(item => item.status === 'In Transit').map((item, idx) => {
                  const correlatedPo = pos.find(p => p.id === item.poId);
                  const correlatedVendor = correlatedPo ? vendors.find(v => v.id === correlatedPo.vendorId) : null;
                  return (
                    <div key={item.id} className={`pt-4 ${idx === 0 ? 'pt-0' : ''} space-y-2.5 flex items-start gap-3`}>
                      <div className="pt-1 select-none">
                        <input 
                          type="checkbox"
                          checked={selectedTransitIds.includes(item.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTransitIds(prev => [...prev, item.id]);
                            } else {
                              setSelectedTransitIds(prev => prev.filter(uid => uid !== item.id));
                            }
                          }}
                          className="h-4 w-4 rounded-none text-[#E65100] border-[#D1D1CF] focus:ring-[#E65100] accent-[#E65100] cursor-pointer"
                        />
                      </div>
                      <div className="flex-1 space-y-2.5">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] font-mono text-white font-bold tracking-wide uppercase px-2 py-0.5 bg-[#1A1A1A]">
                              {item.vehicleNumber}
                            </span>
                            <h4 className="text-xs font-bold text-[#1A1A1A] mt-2">{correlatedVendor?.name}</h4>
                            <p className="text-[11px] text-[#888884] font-medium">{item.vendorPlant}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-base font-serif font-bold text-[#1A1A1A]">
                              {item.loadedWeight !== null ? `${item.loadedWeight.toFixed(2)} MT` : 'Pending'}
                            </p>
                            <span className="text-[10px] text-[#888884] block font-mono">{item.date}</span>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center text-[10px] text-neutral-800 bg-[#F4F4F1] py-1.5 px-2.5 border border-[#D1D1CF]">
                          <span>Material: <b className="font-serif italic text-[#E65100]">{correlatedPo?.material}</b></span>
                          <button
                            onClick={() => onNavigate('dispatch')}
                            className="text-[#E65100] hover:underline font-bold font-serif italic"
                          >
                            Deliver Weighment →
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
