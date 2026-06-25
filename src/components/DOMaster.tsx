import React, { useState } from 'react';
import { DespatchOrder, PurchaseOrder, Company, Vendor, Transporter, Agent, SourceLocation, Product } from '../types';
import { getCommissionLogic } from '../data';
import { exportDOsToCSV } from '../excelUtils';
import { 
  FileText, 
  Plus, 
  Check, 
  Trash2, 
  FileSignature, 
  Printer, 
  X, 
  Layers, 
  Truck, 
  User, 
  TrendingUp, 
  Award,
  Filter,
  Eye,
  CheckCircle,
  HelpCircle,
  AlertTriangle,
  Upload,
  MapPin,
  Edit,
  Download,
  Clock,
  ArrowRight,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface DOMasterProps {
  dos: DespatchOrder[];
  pos: PurchaseOrder[];
  companies: Company[];
  vendors: Vendor[];
  products: Product[];
  transporters: Transporter[];
  agents: Agent[];
  sources: SourceLocation[];
  onAddSource: (name: string, pincode: string) => SourceLocation;
  
  onAddDO: (despatch: Omit<DespatchOrder, 'id' | 'doNumber' | 'createdAt'>) => void;
  onEditDO: (despatch: DespatchOrder) => void;
  onUpdateReceivedWeight: (
    id: string, 
    receivedWeight: number | null, 
    remarks?: string,
    deliveryDocUrl?: string,
    deliveryDocName?: string,
    status?: 'In Transit' | 'Delivered' | 'Cancelled'
  ) => void;
  onCancelDO: (id: string) => void;
  onSelectChallan: (doItem: DespatchOrder) => void;
  onBack?: () => void;
  autoOpenForm?: boolean;
}

export default function DOMaster({
  dos,
  pos,
  companies,
  vendors,
  products,
  transporters,
  agents,
  sources,
  onAddSource,
  onAddDO,
  onEditDO,
  onUpdateReceivedWeight,
  onCancelDO,
  onSelectChallan,
  onBack,
  autoOpenForm = false,
}: DOMasterProps) {
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [editingDO, setEditingDO] = useState<DespatchOrder | null>(null);
  const [isDeliverModalOpen, setIsDeliverModalOpen] = useState(false);
  const [currentDeliverDo, setCurrentDeliverDo] = useState<DespatchOrder | null>(null);

  // Safe sandbox-friendly confirmation state for voiding/cancelling slips
  const [cancelConfirmationId, setCancelConfirmationId] = useState<string | null>(null);

  // Filter states
  const [filterMaterial, setFilterMaterial] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterAgent, setFilterAgent] = useState<string>('All');

  // Financial Year Filter (starts 1 April and ends 31 March)
  const getInitialFinancialYear = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth(); // 0-indexed
    const startYear = month >= 3 ? year : year - 1;
    const endYear = startYear + 1;
    return `FY ${startYear}-${String(endYear).substring(2)}`;
  };
  const [filterFinancialYear, setFilterFinancialYear] = useState<string>(getInitialFinancialYear());

  const isDateInFinancialYear = (dateStr: string, fyStr: string) => {
    if (fyStr === 'All') return true;
    const match = fyStr.match(/FY (\d{4})-(\d{2})/);
    if (!match) return true;
    const startYear = parseInt(match[1]);
    const endYear = startYear + 1;
    const startDate = new Date(`${startYear}-04-01T00:00:00`);
    const endDate = new Date(`${endYear}-03-31T23:59:59`);
    const itemDate = new Date(dateStr);
    return itemDate >= startDate && itemDate <= endDate;
  };

  // Wizard States
  const [selectedPoId, setSelectedPoId] = useState('');
  const [selectedPlant, setSelectedPlant] = useState('');
  const [transporterId, setTransporterId] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [agentId, setAgentId] = useState('direct'); // 'direct' represents direct company delivery / no agent
  const [transporterRate, setTransporterRate] = useState<string>('');
  const [loadedWeightInput, setLoadedWeightInput] = useState<string>('');
  const [receivedWeightInput, setReceivedWeightInput] = useState<string>('');
  const [creationStatus, setCreationStatus] = useState<'In Transit' | 'Delivered'>('In Transit');
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [remarks, setRemarks] = useState('');

  // Source selection states
  const [selectedSourceId, setSelectedSourceId] = useState('');
  const [isAddingSourceInline, setIsAddingSourceInline] = useState(false);
  const [inlineSourceName, setInlineSourceName] = useState('');
  const [inlineSourcePincode, setInlineSourcePincode] = useState('');

  // Delivery states
  const [receivedWeight, setReceivedWeight] = useState<string>(''); 
  const [deliveryRemarks, setDeliveryRemarks] = useState('');

  // Proof of delivery base64 file upload states
  const [docUrlState, setDocUrlState] = useState('');
  const [docNameState, setDocNameState] = useState('');

  // Route Compliance expanded logs map tracking state
  const [expandedDoLogs, setExpandedDoLogs] = useState<Record<string, boolean>>({});

  const toggleDoLogs = (doId: string) => {
    setExpandedDoLogs(prev => ({
      ...prev,
      [doId]: !prev[doId]
    }));
  };

  React.useEffect(() => {
    if (autoOpenForm) {
      startDispatchWizard();
    }
  }, [autoOpenForm]);

  // Auto pick values on PO selection change (keeping empty for manual entry as requested)
  const handlePoChange = (poId: string) => {
    setSelectedPoId(poId);
    setSelectedPlant('');
    setTransporterRate('');
  };

  const startDispatchWizard = () => {
    if (pos.length === 0) {
      alert('You must have at least 1 active Purchase Order in the master database before raising a despatch.');
      return;
    }
    if (transporters.length === 0) {
      alert('You must have at least 1 registered Transporter first.');
      return;
    }
    
    setEditingDO(null);
    setSelectedPoId('');
    setSelectedPlant('');
    setTransporterId('');
    setVehicleNumber('');
    setAgentId('direct');
    setTransporterRate('');
    setLoadedWeightInput('');
    setReceivedWeightInput('');
    setCreationStatus('In Transit');
    setDriverName('');
    setDriverPhone('');
    setRemarks('');
    setDocUrlState('');
    setDocNameState('');
    setSelectedSourceId('');
    setIsAddingSourceInline(false);
    setInlineSourceName('');
    setInlineSourcePincode('');
    setIsWizardOpen(true);
  };

  const startEditDoWizard = (item: DespatchOrder) => {
    setEditingDO(item);
    setSelectedPoId(item.poId || '');
    setSelectedPlant(item.vendorPlant || '');
    setTransporterId(item.transporterId || '');
    setVehicleNumber(item.vehicleNumber || '');
    setAgentId(item.agentId || 'direct');
    setTransporterRate(item.transporterRate !== undefined ? String(item.transporterRate) : '');
    setLoadedWeightInput(item.loadedWeight !== null ? String(item.loadedWeight) : '');
    setReceivedWeightInput(item.receivedWeight !== null ? String(item.receivedWeight) : '');
    setCreationStatus(item.status);
    setDriverName(item.driverName || '');
    setDriverPhone(item.driverPhone || '');
    setRemarks(item.remarks || '');
    setDocUrlState(item.deliveryDocUrl || '');
    setDocNameState(item.deliveryDocName || '');
    setSelectedSourceId(item.sourceId || '');
    setIsAddingSourceInline(false);
    setInlineSourceName('');
    setInlineSourcePincode('');
    setIsWizardOpen(true);
  };

  const handleWizardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPoId || !selectedPlant || !transporterId || !vehicleNumber.trim()) {
      alert('All marked fields including bulk vehicle number must be entered.');
      return;
    }

    if (transporterRate.trim() === '' || isNaN(Number(transporterRate)) || Number(transporterRate) <= 0) {
      alert('Please enter a valid positive Transporter Delivery Rate.');
      return;
    }

    if (loadedWeightInput.trim() !== '') {
      const parsed = Number(loadedWeightInput);
      if (isNaN(parsed) || parsed <= 0) {
        alert('Please enter a valid positive Loaded Weight or leave it empty.');
        return;
      }
    }

    let finalSourceId = selectedSourceId;
    if (isAddingSourceInline) {
      if (!inlineSourceName.trim()) {
        alert('Please enter a Loading Source Name.');
        return;
      }
      if (!inlineSourcePincode.trim()) {
        alert('Please enter a postal pincode for the Loading Source.');
        return;
      }
      const pinRegex = /^[0-9]{4,10}$/;
      if (!pinRegex.test(inlineSourcePincode.trim())) {
        alert('Please enter a valid numeric Pincode (4-10 digits).');
        return;
      }
      // auto register source to master inline
      const newSrc = onAddSource(inlineSourceName.trim(), inlineSourcePincode.trim());
      finalSourceId = newSrc.id;
    } else {
      if (!selectedSourceId) {
        alert('Please choose a Material Loading Source from the Master or add one inline.');
        return;
      }
    }

    const loadedWParsed = loadedWeightInput.trim() === '' ? null : Number(loadedWeightInput);
    const receivedWParsed = receivedWeightInput.trim() === '' ? null : Number(receivedWeightInput);

    if (editingDO) {
      onEditDO({
        ...editingDO,
        poId: selectedPoId,
        vendorPlant: selectedPlant,
        transporterId,
        vehicleNumber: vehicleNumber.trim().toUpperCase(),
        agentId: agentId === 'direct' ? null : agentId,
        sourceId: finalSourceId,
        transporterRate: Number(transporterRate),
        loadedWeight: loadedWParsed,
        receivedWeight: receivedWParsed,
        status: creationStatus,
        driverName,
        driverPhone,
        remarks,
        deliveryDocUrl: docUrlState || undefined,
        deliveryDocName: docNameState || undefined,
      });
      setEditingDO(null);
    } else {
      onAddDO({
        date: new Date().toISOString().substring(0, 10),
        poId: selectedPoId,
        vendorPlant: selectedPlant,
        transporterId,
        vehicleNumber: vehicleNumber.trim().toUpperCase(),
        agentId: agentId === 'direct' ? null : agentId,
        sourceId: finalSourceId,
        transporterRate: Number(transporterRate),
        loadedWeight: loadedWParsed,
        receivedWeight: receivedWParsed,
        status: creationStatus,
        driverName,
        driverPhone,
        remarks,
        deliveryDocUrl: docUrlState || undefined,
        deliveryDocName: docNameState || undefined,
      });
    }

    setIsWizardOpen(false);
  };

  const openDeliveryModal = (item: DespatchOrder) => {
    setCurrentDeliverDo(item);
    setReceivedWeight(item.receivedWeight !== null ? String(item.receivedWeight) : (item.loadedWeight !== null ? String(item.loadedWeight) : '30.0'));
    setDeliveryRemarks(item.remarks || '');
    setDocUrlState(item.deliveryDocUrl || '');
    setDocNameState(item.deliveryDocName || '');
    setIsDeliverModalOpen(true);
  };

  const handleDeliverySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentDeliverDo) return;

    const parsedReceived = receivedWeight.trim() === '' ? null : Number(receivedWeight);

    onUpdateReceivedWeight(
      currentDeliverDo.id,
      parsedReceived,
      deliveryRemarks,
      docUrlState || undefined,
      docNameState || undefined,
      'Delivered'
    );
    setIsDeliverModalOpen(false);
    setCurrentDeliverDo(null);
  };

  const handleDirectFileUpload = (item: DespatchOrder, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File is too large! Please select a file under 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          onUpdateReceivedWeight(
            item.id,
            item.receivedWeight,
            item.remarks,
            reader.result,
            file.name,
            item.status
          );
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveDoc = (item: DespatchOrder) => {
    if (confirm('Are you sure you want to remove the delivery document from this record?')) {
      onUpdateReceivedWeight(
        item.id,
        item.receivedWeight,
        item.remarks,
        '',
        '',
        item.status
      );
    }
  };

  // Filter listings
  const filteredDos = dos.filter(item => {
    const po = pos.find(p => p.id === item.poId);
    const matMatch = filterMaterial === 'All' || (po && po.material === filterMaterial);
    const statusMatch = filterStatus === 'All' || item.status === filterStatus;
    const agentMatch = filterAgent === 'All' || 
                       (filterAgent === 'direct' && item.agentId === null) ||
                       (filterAgent !== 'direct' && item.agentId === filterAgent);
    const fyMatch = isDateInFinancialYear(item.date, filterFinancialYear);
    return matMatch && statusMatch && agentMatch && fyMatch;
  });

  return (
    <div id="dispatch-master-panel" className="space-y-6 animate-fade-in">
      
      {/* Home / Back Navigation key */}
      {onBack && (
        <div className="flex justify-start">
          <button
            onClick={onBack}
            className="inline-flex items-center space-x-2 px-4 py-2 border border-slate-200 hover:border-black bg-white hover:bg-slate-50 text-xs font-semibold text-slate-800 transition-colors cursor-pointer rounded-lg shadow-xs"
          >
            <span>← Back to Dashboard / Home</span>
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <FileText className="h-5 w-5 text-indigo-600" />
            <span>Despatch Order (DO) & Challan Registry</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">Issue bulker transit slips, record weighbridge receipt measurements, and examine commission structures.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => exportDOsToCSV(filteredDos, pos, companies, vendors, transporters, agents, sources)}
            className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-xs"
            title="Export filtered listings to Microsoft Excel compatible CSV file"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export to Excel</span>
          </button>
          <button
            id="btn-raise-do"
            onClick={startDispatchWizard}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-505 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Prepare Despatch Order (DO)</span>
          </button>
        </div>
      </div>

      {/* Filter and stats overview segment */}
      <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-xl flex flex-col md:flex-row gap-4 justify-between items-center text-xs">
        
        {/* Filters control list */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center space-x-1.5">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <span className="font-semibold text-slate-600">Filters:</span>
          </div>

          <div>
            <select
              value={filterMaterial}
              onChange={(e) => setFilterMaterial(e.target.value)}
              className="bg-white px-2 py-1 border border-slate-200 rounded font-medium focus:outline-hidden text-slate-700 font-sans"
            >
              <option value="All">All Materials</option>
              {products.map(p => (
                <option key={p.id} value={p.name}>{p.name}</option>
              ))}
              {/* Fallback for other materials found in active POs */}
              {Array.from(new Set(pos.map(postItem => postItem.material)))
                .filter(mat => !products.some(p => p.name.toLowerCase() === mat.toLowerCase()))
                .map(mat => (
                  <option key={mat} value={mat}>{mat}</option>
                ))}
            </select>
          </div>

          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-white px-2 py-1 border border-slate-200 rounded font-medium focus:outline-hidden text-slate-700"
            >
              <option value="All">All Statuses</option>
              <option value="In Transit">In Transit</option>
              <option value="Delivered">Delivered</option>
            </select>
          </div>

          <div>
            <select
              value={filterAgent}
              onChange={(e) => setFilterAgent(e.target.value)}
              className="bg-white px-2 py-1 border border-slate-200 rounded font-semibold focus:outline-hidden text-slate-700"
            >
              <option value="All">All Representation</option>
              <option value="direct">Direct Delivery</option>
              {agents.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={filterFinancialYear}
              onChange={(e) => setFilterFinancialYear(e.target.value)}
              className="bg-white px-2.5 py-1 border border-slate-200 rounded font-bold focus:outline-hidden text-[#E65100] font-sans"
            >
              <option value="All">All Financial Years</option>
              <option value="FY 2025-26">FY 2025-26 (1 Apr 25 - 31 Mar 26)</option>
              <option value="FY 2026-27">FY 2026-27 (1 Apr 26 - 31 Mar 27)</option>
              <option value="FY 2027-28">FY 2027-28 (1 Apr 27 - 31 Mar 28)</option>
            </select>
          </div>
        </div>

        {/* Clear indicators count */}
        <div className="text-slate-500 font-medium whitespace-nowrap">
          Showing <b>{filteredDos.length}</b> dispatch batches in real-time
        </div>
      </div>

      {/* Main Table listings */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-auto max-h-[70vh] relative">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200 shadow-xs">
              <tr className="bg-slate-50 font-semibold text-slate-400 uppercase tracking-wider">
                <th className="p-4 bg-slate-50 sticky top-0 z-10">Do Number</th>
                <th className="p-4 bg-slate-50 sticky top-0 z-10">Vendor Name</th>
                <th className="p-4 bg-slate-50 sticky top-0 z-10">Transporter</th>
                <th className="p-4 text-right bg-slate-50 sticky top-0 z-10">Received weight (MT)</th>
                <th className="p-4 text-right bg-slate-50 sticky top-0 z-10">Partners Profit</th>
                <th className="p-4 text-center bg-slate-50 sticky top-0 z-10">Status</th>
                <th className="p-4 text-right bg-slate-50 sticky top-0 z-10">Print & Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredDos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400">
                    <FileText className="h-10 w-10 mx-auto text-slate-300 mb-3" />
                    <p className="font-semibold">No dispatch orders matching filters</p>
                    <p className="text-xs text-slate-400 mt-1">Select other filters or click "Prepare Despatch Order" to route a new carrier bulk.</p>
                  </td>
                </tr>
              ) : (
                filteredDos.map((item) => {
                  const po = pos.find(p => p.id === item.poId);
                  const company = po ? companies.find(c => c.id === po.companyId) : null;
                  const vendor = po ? vendors.find(v => v.id === po.vendorId) : null;
                  const transporter = transporters.find(t => t.id === item.transporterId);
                  const agent = agents.find(a => a.id === item.agentId);

                  const mLog = po ? getCommissionLogic(po.vendorRate, item.transporterRate, item.receivedWeight ?? (item.loadedWeight ?? 0)) : null;

                  return (
                    <React.Fragment key={item.id}>
                      <tr className="hover:bg-slate-50/50 transition-colors">
                      {/* DO Title & Date */}
                      <td className="p-4 font-mono">
                        <span className="font-bold text-slate-900 block">{item.doNumber}</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">{item.date}</span>
                      </td>

                      {/* References (PO, Material, Owners) */}
                      <td className="p-4 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-indigo-700 bg-indigo-50/50 px-1.5 py-0.5 rounded border border-indigo-100">
                          {po?.material}
                        </span>
                        <div className="font-medium text-slate-800 pt-1">{vendor?.name || 'N/A'}</div>
                        <div className="text-[10px] text-slate-400">Via: <span className="font-medium">{company?.name.split(' ')[0]}</span></div>
                      </td>

                      {/* Carrier Details */}
                      <td className="p-4 space-y-1">
                        <strong className="font-mono text-slate-900 text-xs px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded block w-fit">
                          {item.vehicleNumber}
                        </strong>
                        <div className="text-slate-500 font-medium pt-1 text-[11px]">{transporter?.name || 'N/A'}</div>
                      </td>

                      <td className="p-4 text-right">
                        {item.receivedWeight !== null ? (
                          <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-1 rounded">
                            {item.receivedWeight.toFixed(2)}
                          </span>
                        ) : (
                          <div className="space-y-1">
                            <span className="text-[10px] text-slate-400 italic block">Weighment pending</span>
                            {item.status !== 'Cancelled' && (
                              <button
                                onClick={() => openDeliveryModal(item)}
                                className="px-2 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded font-semibold text-[10px] cursor-pointer"
                              >
                                Record delivery
                              </button>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Finances margins */}
                      <td className="p-4 text-right font-mono">
                        {mLog ? (
                          <div className="space-y-1 text-right">
                            {item.agentId ? (
                              <div className="text-[10px] text-amber-700 bg-amber-50 p-1 rounded border border-amber-100 inline-block">
                                Agent: {agent?.name.split(' ')[0]} <br />
                                Commission: <strong>Rs. {Math.round(mLog.totalCommission).toLocaleString()}</strong>
                              </div>
                            ) : (
                              <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider block">Direct Order / No Agent</span>
                            )}
                          </div>
                        ) : '--'}
                      </td>

                      {/* Status */}
                      <td className="p-4 text-center">
                        <div className="flex flex-col items-center space-y-1">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            item.status === 'Delivered' ? 'bg-emerald-100 text-emerald-800' :
                            item.status === 'Cancelled' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {item.status}
                          </span>
                          <button
                            onClick={() => toggleDoLogs(item.id)}
                            className="inline-flex items-center space-x-1 text-[10px] text-indigo-600 hover:text-indigo-800 hover:underline font-semibold cursor-pointer py-0.5 mt-1"
                            title="View Route Compliance Log & Turnaround Time Audit"
                          >
                            <Clock className="h-2.5 w-2.5 mr-0.5" />
                            <span>Log</span>
                            {expandedDoLogs[item.id] ? <ChevronUp className="h-2.5 w-2.5 ml-0.5" /> : <ChevronDown className="h-2.5 w-2.5 ml-0.5" />}
                          </button>
                        </div>
                      </td>

                      {/* Printing Actions and cancelling */}
                      <td className="p-4 text-right space-y-1 whitespace-nowrap">
                        <button
                          onClick={() => onSelectChallan(item)}
                          className="flex items-center space-x-1 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded text-[11px] font-semibold transition-colors mx-auto shrink-0 w-full justify-center border border-indigo-200"
                        >
                          <Printer className="h-3 w-3" />
                          <span>View Challan</span>
                        </button>

                        <button
                          onClick={() => startEditDoWizard(item)}
                          className="flex items-center space-x-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded text-[11px] font-semibold transition-colors mx-auto shrink-0 w-full justify-center border border-emerald-200 mt-1 cursor-pointer"
                        >
                          <Edit className="h-3 w-3" />
                          <span>Edit Details</span>
                        </button>

                        {item.status !== 'Cancelled' && (
                          <button
                            onClick={() => {
                              setCancelConfirmationId(item.id);
                            }}
                            className="text-[10px] text-slate-400 hover:text-red-600 block text-center w-full py-1 hover:underline transition-colors mt-1 cursor-pointer"
                          >
                            Cancel Slip
                          </button>
                        )}
                      </td>
                    </tr>
                    {expandedDoLogs[item.id] && (
                      <tr key={`log-row-${item.id}`} className="bg-slate-50/50">
                        <td colSpan={7} className="p-4 border-t border-b border-slate-100">
                          <div className="bg-white rounded-lg p-5 border border-slate-200/85 shadow-sm max-w-4xl mx-auto">
                            <div className="flex flex-col md:flex-row md:items-center justify-between mb-5 pb-3 border-b border-slate-100 gap-3">
                              <div className="flex items-center space-x-2.5">
                                <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                                  <Clock className="h-5 w-5" />
                                </div>
                                <div>
                                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Route Compliance Audit & Turnaround Time (TAT) Log</h4>
                                  <p className="text-[11px] text-slate-400">DO Reference Field: <span className="font-mono font-semibold">{item.doNumber}</span></p>
                                </div>
                              </div>
                              
                              {/* Summary Performance Info */}
                              {(() => {
                                const deliveryEntry = item.routeComplianceLog?.find(log => log.toStatus === 'Delivered');
                                const tat = deliveryEntry?.tatHours;
                                return (
                                  <div className="flex items-center space-x-4 text-right">
                                    {tat !== undefined ? (
                                      <>
                                        <div>
                                          <div className="text-[10px] text-slate-400 font-semibold block uppercase">Measured TAT</div>
                                          <div className="text-sm font-black font-mono text-indigo-700">{tat} <span className="text-[10px] font-medium text-slate-500 flex-1 block">hours</span></div>
                                        </div>
                                        <div className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                                          tat <= 48 
                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                                            : 'bg-amber-50 text-amber-700 border border-amber-100'
                                        }`}>
                                          {tat <= 48 ? '🎯 SLA Compliant (<= 48h)' : '⚠️ SLA Threshold Exceeded (> 48h)'}
                                        </div>
                                      </>
                                    ) : item.status === 'Cancelled' ? (
                                      <div className="text-[10px] uppercase font-bold text-red-500 tracking-wider bg-red-50 px-2 py-1 rounded border border-red-100">
                                        VOID / CANCELLED
                                      </div>
                                    ) : (
                                      <>
                                        <div>
                                          <div className="text-[10px] text-slate-400 font-semibold block uppercase">Transit Duration</div>
                                          <div className="text-xs font-mono font-bold text-amber-600 animate-pulse">In Transit...</div>
                                        </div>
                                        <div className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-[10px] font-bold uppercase tracking-wider border border-blue-100 animate-pulse">
                                          🚚 Active Route
                                        </div>
                                      </>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>

                            {/* Steps Timeline */}
                            <div className="space-y-4 relative before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
                              {(!item.routeComplianceLog || item.routeComplianceLog.length === 0) ? (
                                <div className="pl-8 py-3 text-xs text-slate-400 italic flex items-center space-x-2">
                                  <HelpCircle className="h-4 w-4 text-slate-300" />
                                  <span>No historical track records verified for this shipment. Real-time logging of transitions was introduced just now.</span>
                                </div>
                              ) : (
                                item.routeComplianceLog.map((log, index) => {
                                  const isDelivered = log.toStatus === 'Delivered';
                                  const isCancelled = log.toStatus === 'Cancelled';
                                  const isInTransit = log.toStatus === 'In Transit';
                                  
                                  return (
                                    <div key={log.id || index} className="flex items-start space-x-3.5 relative">
                                      <div className={`h-9 w-9 rounded-full flex items-center justify-center border z-10 shrink-0 ${
                                        isDelivered 
                                          ? 'bg-emerald-50 border-emerald-300 text-emerald-600 shadow-sm' 
                                          : isCancelled 
                                            ? 'bg-red-50 border-red-300 text-red-650 shadow-sm' 
                                            : isInTransit 
                                              ? 'bg-blue-50 border-blue-300 text-blue-600 shadow-sm' 
                                              : 'bg-slate-50 border-slate-300 text-slate-500'
                                      }`}>
                                        {isDelivered ? (
                                          <CheckCircle className="h-4 w-4" />
                                        ) : isCancelled ? (
                                          <AlertTriangle className="h-4 w-4" />
                                        ) : isInTransit ? (
                                          <Truck className="h-4 w-4" />
                                        ) : (
                                          <FileSignature className="h-4 w-4" />
                                        )}
                                      </div>

                                      <div className="flex-1 bg-slate-50/60 rounded-lg p-3 hover:bg-slate-50 transition-colors border border-slate-100">
                                        <div className="flex items-center justify-between flex-wrap gap-2 mb-1.5">
                                          <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                                            <span className="text-[11px] font-bold text-slate-600 capitalize text-[10px]">
                                              {log.fromStatus}
                                            </span>
                                            <ArrowRight className="h-3 w-3 text-slate-400" />
                                            <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded text-[10px] ${
                                              isDelivered ? 'bg-emerald-100 text-emerald-800' :
                                              isCancelled ? 'bg-red-100 text-red-800' :
                                              isInTransit ? 'bg-blue-100 text-blue-800' :
                                              'bg-slate-200 text-slate-700'
                                            }`}>
                                              {log.toStatus}
                                            </span>
                                          </div>
                                          <div className="text-[10px] text-slate-400 font-mono">
                                            {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                          </div>
                                        </div>

                                        <p className="text-xs text-slate-600 leading-normal font-medium bg-white p-2 rounded border border-slate-200/50 shadow-2xs">
                                          {log.remarks || `Successfully updated status to ${log.toStatus}`}
                                        </p>

                                        <div className="mt-2.5 pt-2 border-t border-slate-200/30 flex justify-between items-center text-[10px] text-slate-400">
                                          <div>
                                            Performed by: <span className="font-semibold text-slate-600">{log.updatedBy}</span>
                                          </div>
                                          {log.tatHours !== undefined && (
                                            <div className="bg-indigo-50 text-indigo-700 font-mono px-2 py-0.5 rounded font-bold text-[10px]">
                                              Turnaround Time (TAT): {log.tatHours} hrs
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Preparation Wizard Modal */}
      {isWizardOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
              <div className="flex items-center space-x-2">
                <FileSignature className="h-5 w-5 text-indigo-600" />
                <h3 className="font-bold text-slate-800 text-base">
                  {editingDO ? `Edit Despatch Order: ${editingDO.doNumber}` : 'New Despatch Order & Transit Challan'}
                </h3>
              </div>
              <button 
                onClick={() => setIsWizardOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleWizardSubmit} className="p-6 space-y-4 overflow-y-auto">
              
              {/* Linked PO selector */}
              <div className="bg-slate-50 p-4 border border-slate-100 rounded-lg space-y-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">1. Select Purchase Agreement</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                      Choose Contract PO <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={selectedPoId}
                      onChange={(e) => handlePoChange(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:border-indigo-500 bg-white"
                    >
                      <option value="">-- Choose Contract PO --</option>
                      {pos.filter(p => p.status === 'Active').map(p => {
                        const vendorName = vendors.find(v => v.id === p.vendorId)?.name || 'Unknown';
                        return (
                          <option key={p.id} value={p.id}>
                            {p.poNumber} ({vendorName.substring(0, 20)}... - {p.material})
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Smart Camp site display */}
                  {selectedPoId && (
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                        Select Destination Plant Camp <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={selectedPlant}
                        onChange={(e) => setSelectedPlant(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:border-indigo-500 bg-white"
                      >
                        <option value="">-- Choose Plant Camp Site --</option>
                        {vendors.find(v => v.id === pos.find(p => p.id === selectedPoId)?.vendorId)?.plants.map((pt, idx) => (
                          <option key={idx} value={pt}>{pt}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
                
                {selectedPoId && (() => {
                  const sPo = pos.find(p => p.id === selectedPoId);
                  const poDespatchedSum = dos
                    .filter(d => d.poId === selectedPoId && d.status !== 'Cancelled')
                    .reduce((sum, d) => sum + (d.receivedWeight || d.loadedWeight || 0), 0);
                  const poAvailableQty = Math.max(0, (sPo?.totalQuantity || 0) - poDespatchedSum);
                  const compName = companies.find(c => c.id === sPo?.companyId)?.name || '';
                  
                  return (
                    <div className="bg-indigo-50/50 p-3 rounded text-xs text-indigo-900 border border-indigo-100/60 leading-relaxed font-sans space-y-1.5">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-1">
                        <div>
                          <span>Commodity: <b>{sPo?.material}</b></span>
                          <span className="mx-2 text-slate-300">|</span>
                          <span>Committed Rate: <b>Rs. {sPo?.vendorRate.toFixed(2)}/MT</b></span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">Billed By: {compName}</span>
                      </div>
                      <div className="border-t border-indigo-100/40 pt-1.5 flex justify-between items-center text-[11px]">
                        <span>Total PO Contract Vol: <b>{(sPo?.totalQuantity || 0).toFixed(2)} MT</b></span>
                        <span>Already Despatched: <b>{poDespatchedSum.toFixed(2)} MT</b></span>
                        <span>Available Balance: <b className="bg-emerald-105 bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold font-mono text-[11px]">{poAvailableQty.toFixed(2)} MT</b></span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Material Loading Origin Source Selection / Inline Creation */}
              <div className="bg-[#FFFDF9] p-4 border border-amber-200 rounded-lg space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block">1.5. Locate Material Origin Source</span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingSourceInline(!isAddingSourceInline);
                      setSelectedSourceId('');
                    }}
                    className="text-[11px] font-mono font-bold text-[#E65100] underline hover:text-black cursor-pointer bg-transparent border-0"
                  >
                    {isAddingSourceInline ? "Back to Master list" : "[+] Add New Source Inline"}
                  </button>
                </div>

                {!isAddingSourceInline ? (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                      Choose Loading Point / Origin <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center space-x-2">
                      <span className="p-2 bg-amber-100 text-[#E65100] border border-amber-200">
                        <MapPin className="h-4 w-4" />
                      </span>
                      <select
                        required={!isAddingSourceInline}
                        value={selectedSourceId}
                        onChange={(e) => {
                          if (e.target.value === 'add-inline-action') {
                            setIsAddingSourceInline(true);
                            setSelectedSourceId('');
                          } else {
                            setSelectedSourceId(e.target.value);
                          }
                        }}
                        className="flex-1 text-xs px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:border-indigo-500 bg-white"
                      >
                        <option value="">-- Choose Loading Point Source --</option>
                        {sources.map(src => (
                          <option key={src.id} value={src.id}>
                            📍 {src.name} (PIN: {src.pincode})
                          </option>
                        ))}
                        <option value="add-inline-action" className="text-[#E65100] font-bold">
                          ➕ [Add New Loading Source Inline...]
                        </option>
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#FFFEEF] p-3 border border-dashed border-amber-300 space-y-3 rounded-md">
                    <span className="text-[10px] uppercase font-mono font-extrabold text-amber-800 block">
                      ⚡ Quick Add Origin Source Inline
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-stone-600 uppercase mb-1">
                          Source plant / Quarry Name *
                        </label>
                        <input
                          type="text"
                          required={isAddingSourceInline}
                          placeholder="e.g. Panipat Plant silos"
                          value={inlineSourceName}
                          onChange={(e) => setInlineSourceName(e.target.value)}
                          className="w-full text-xs px-2.5 py-1.5 border border-slate-200 bg-white rounded focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-stone-600 uppercase mb-1">
                          Postal Pincode *
                        </label>
                        <input
                          type="text"
                          maxLength={10}
                          placeholder="e.g. 132105"
                          value={inlineSourcePincode}
                          onChange={(e) => setInlineSourcePincode(e.target.value.replace(/[^0-9]/g, ''))}
                          className="w-full text-xs px-2.5 py-1.5 border border-slate-200 bg-white rounded font-mono focus:outline-hidden"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingSourceInline(false);
                          setInlineSourceName('');
                          setInlineSourcePincode('');
                        }}
                        className="px-3 py-1 text-[10px] bg-slate-200 hover:bg-slate-300 font-mono text-slate-700 uppercase"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!inlineSourceName.trim() || !inlineSourcePincode.trim()) {
                            alert('Source Name and Pincode are both required.');
                            return;
                          }
                          const pinRegex = /^[0-9]{4,10}$/;
                          if (!pinRegex.test(inlineSourcePincode.trim())) {
                            alert('Please enter a valid numeric Pincode (4-10 digits).');
                            return;
                          }
                          const newSrc = onAddSource(inlineSourceName.trim(), inlineSourcePincode.trim());
                          setSelectedSourceId(newSrc.id);
                          setIsAddingSourceInline(false);
                          setInlineSourceName('');
                          setInlineSourcePincode('');
                        }}
                        className="px-3 py-1 text-[10px] bg-amber-600 hover:bg-amber-700 font-mono text-white uppercase rounded-sm"
                      >
                        Save & Select Origin
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Transporter & Weight segment */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Logistics */}
                <div className="border border-slate-100 p-4 rounded-lg space-y-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">2. Setup Logistics & Carrier</span>
                  
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                      Choose Transporter <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={transporterId}
                      onChange={(e) => {
                        const nextTId = e.target.value;
                        setTransporterId(nextTId);
                        
                        // Auto-populate rate if PO and Transporter are selected
                        if (selectedPoId && nextTId) {
                          const po = pos.find(p => p.id === selectedPoId);
                          const transporter = transporters.find(t => t.id === nextTId);
                          if (po && transporter) {
                            const matchedRate = transporter.rates?.find(r => r.vendorId === po.vendorId);
                            if (matchedRate) {
                              setTransporterRate(String(matchedRate.rate));
                            } else {
                              // fallback to 90% of vendor rate if unconfigured
                              setTransporterRate(String(Math.round(po.vendorRate * 0.9)));
                            }
                          }
                        }
                      }}
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:border-indigo-500 bg-white"
                    >
                      <option value="">-- Choose Transporter --</option>
                      {transporters.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                      Bulker Plate Vehicle No. <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. HR-55-AJ-4321"
                      value={vehicleNumber}
                      onChange={(e) => setVehicleNumber(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:border-indigo-500 placeholder-slate-300 font-mono uppercase"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Driver Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Sukhdev Singh"
                        value={driverName}
                        onChange={(e) => setDriverName(e.target.value)}
                        className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Driver Phone</label>
                      <input
                        type="tel"
                        placeholder="+91 98XXX"
                        value={driverPhone}
                        onChange={(e) => setDriverPhone(e.target.value)}
                        className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded-md"
                      />
                    </div>
                  </div>
                </div>

                {/* Rates & Agents */}
                <div className="border border-slate-100 p-4 rounded-lg space-y-3 flex flex-col justify-between">
                  <div className="space-y-3">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">3. Pricing & Representation agent</span>
                    
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                        Transporter Delivery Rate (Rs. / MT) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min={0}
                        required
                        value={transporterRate}
                        onChange={(e) => setTransporterRate(Number(e.target.value))}
                        className="w-full text-xs px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:border-indigo-500 font-mono font-bold text-indigo-700"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                        Brokering Agent <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={agentId}
                        onChange={(e) => setAgentId(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:border-indigo-500 bg-white"
                      >
                        <option value="direct">Direct Company Order (No Agent Commission)</option>
                        {agents.map(a => (
                          <option key={a.id} value={a.id}>{a.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                        Loaded Weight at Source (Metric Tons)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min={0}
                        value={loadedWeightInput}
                        onChange={(e) => setLoadedWeightInput(e.target.value)}
                        placeholder="Optional / Leave empty for Null"
                        className="w-full text-xs px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:border-indigo-500 font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                        Dispatch Status <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={creationStatus}
                        onChange={(e) => {
                          const val = e.target.value as 'In Transit' | 'Delivered';
                          setCreationStatus(val);
                          if (val === 'In Transit') {
                            setReceivedWeightInput('');
                          } else if (receivedWeightInput.trim() === '') {
                            setReceivedWeightInput(loadedWeightInput);
                          }
                        }}
                        className="w-full text-xs px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:border-indigo-500 bg-white font-bold text-indigo-900"
                      >
                        <option value="In Transit">1 Transit</option>
                        <option value="Delivered">2 Delivered</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                        Received Weight By Vendor (MTons) {creationStatus === 'Delivered' && <span className="text-red-500">*</span>}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min={0}
                        required={creationStatus === 'Delivered'}
                        placeholder={creationStatus === 'In Transit' ? "Optional / Weighment pending" : "e.g. 32.4"}
                        value={receivedWeightInput}
                        onChange={(e) => setReceivedWeightInput(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden focus:border-indigo-500 font-mono font-bold text-emerald-800"
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* Delivery Document Upload inside Wizard */}
              {creationStatus === 'Delivered' && (
                <div className="mx-6 mb-6 bg-slate-50 border border-slate-200 p-4 rounded-lg space-y-2">
                  <span className="text-xs font-bold text-slate-700 block uppercase tracking-wider">Proof of Delivery (POD) Document</span>
                  <p className="text-[11px] text-slate-500">Upload the delivery challan or weight slip in PDF or Image form (Optional, or upload later).</p>
                  
                  <div className="flex items-center space-x-4">
                    <label
                      htmlFor="wizard-pod-file"
                      className="inline-flex items-center space-x-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold cursor-pointer transition-colors shadow-xs"
                    >
                      <Upload className="h-4 w-4" />
                      <span>{docUrlState ? 'Change File' : 'Select POD File'}</span>
                    </label>
                    <input
                      id="wizard-pod-file"
                      type="file"
                      accept="application/pdf,image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 5 * 1024 * 1024) {
                            alert('File is too large! Check size under 5MB.');
                            return;
                          }
                          const reader = new FileReader();
                          reader.onload = () => {
                            if (typeof reader.result === 'string') {
                              setDocUrlState(reader.result);
                              setDocNameState(file.name);
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />

                    {docUrlState && (
                      <div className="flex items-center space-x-2 bg-emerald-50 px-3 py-1.5 border border-emerald-200 rounded text-xs font-bold text-emerald-800">
                        <Check className="h-4 w-4 text-emerald-100" />
                        <span className="truncate max-w-[200px] font-mono">{docNameState}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setDocUrlState('');
                            setDocNameState('');
                          }}
                          className="text-red-500 hover:text-red-700 ml-2 font-bold hover:underline cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Dynamic live calculation panel right inside the wizard before saving! */}
              {selectedPoId && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-emerald-800 text-xs">
                  <div className="flex items-center space-x-1 mb-2">
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                    <span className="font-bold uppercase tracking-wider">Estimated Profitability & Commission Forecast:</span>
                  </div>
                  
                  {(() => {
                    const po = pos.find(p => p.id === selectedPoId);
                    if (!po) return null;
                    const profitMT = po.vendorRate - transporterRate;
                    const commissionPct = profitMT <= 100 ? 10 : 15;
                    const commissionMT = profitMT > 0 ? (profitMT * commissionPct) / 100 : 0;
                    
                    return (
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 leading-relaxed font-sans">
                        <div>
                          <p className="text-emerald-600 font-medium">Profit margin per MT:</p>
                          <p className="text-sm font-extrabold font-mono text-emerald-950">Rs. {profitMT.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-emerald-600 font-medium font-sans">Commission tier:</p>
                          <p className="text-sm font-extrabold text-emerald-950 font-mono">
                            {agentId === 'direct' ? '0% (Direct)' : `${commissionPct}% of Profit`}
                          </p>
                        </div>
                        <div>
                          <p className="text-emerald-600 font-medium">Agent share per MT:</p>
                          <p className="text-sm font-extrabold font-mono text-emerald-950">
                            Rs. {agentId === 'direct' ? '0.00' : commissionMT.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-emerald-600 font-medium">Estimated Company profit / trip:</p>
                          <p className="text-sm font-extrabold font-mono text-indigo-900">
                            Rs. {Math.round((profitMT - (agentId === 'direct' ? 0 : commissionMT)) * (loadedWeightInput.trim() === '' ? 0 : Number(loadedWeightInput))).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Driver/Weighbridge Instructions</label>
                <input
                  type="text"
                  placeholder="e.g. Ensure tarpaulin and seal checks before departures..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-md focus:outline-hidden"
                />
              </div>

              <div className="pt-4 flex justify-end space-x-3 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsWizardOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors border border-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center space-x-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors shadow-lg shadow-indigo-600/20 whitespace-nowrap"
                >
                  <Check className="h-4 w-4" />
                  <span>{editingDO ? 'Save & Update Despatch Order' : 'Issue Slip & Create Challan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Weighbridge measurement entry modal */}
      {isDeliverModalOpen && currentDeliverDo && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <FileSignature className="h-5 w-5 text-indigo-600" />
                <h3 className="font-bold text-slate-800 text-sm">Log Deliver / Unloading Weight</h3>
              </div>
              <button 
                onClick={() => setIsDeliverModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleDeliverySubmit} className="p-6 space-y-4 font-sans">
              
              <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3.5 text-xs text-indigo-900 space-y-1">
                <p>Bulker Vehicle: <strong className="font-mono text-indigo-950 font-bold">{currentDeliverDo.vehicleNumber}</strong></p>
                <p>Source Loaded Weight: <strong className="font-mono">{currentDeliverDo.loadedWeight !== null ? `${currentDeliverDo.loadedWeight.toFixed(2)} MT` : 'Pending'}</strong></p>
                <p className="text-[11px] text-slate-400 font-normal">Please input the final signed received weight from the site camp weighbridge certificate. Agent commission and vendor claims are calculated based on this returned value.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Received Weighbridge Weight (Metric Tons)
                </label>
                <input
                  type="number"
                  step="0.001"
                  min={0.1}
                  value={receivedWeight}
                  onChange={(e) => setReceivedWeight(e.target.value)}
                  placeholder="Leave empty or specify parsed received MT"
                  className="w-full text-base px-3.5 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 font-mono font-bold"
                />
              </div>

              {/* Transit loss warn notifier! */}
              {currentDeliverDo.loadedWeight !== null && receivedWeight.trim() !== '' && !isNaN(Number(receivedWeight)) && Number(receivedWeight) !== currentDeliverDo.loadedWeight && (
                <div className={`p-3 rounded-lg text-xs flex items-start space-x-1.5 ${
                  Number(receivedWeight) < currentDeliverDo.loadedWeight 
                    ? 'bg-amber-50 text-amber-800 border border-amber-100' 
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-100'
                }`}>
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    {Number(receivedWeight) < currentDeliverDo.loadedWeight ? (
                      <span>Weight short loss: <b>{(currentDeliverDo.loadedWeight - Number(receivedWeight)).toFixed(3)} MT</b> (In-transit loss of {(((currentDeliverDo.loadedWeight - Number(receivedWeight))/currentDeliverDo.loadedWeight)*100).toFixed(2)}%)</span>
                    ) : (
                      <span>Weight gain premium: <b>{(Number(receivedWeight) - currentDeliverDo.loadedWeight).toFixed(3)} MT</b> (Moisture addition etc.)</span>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Delivery Remarks</label>
                <input
                  type="text"
                  placeholder="e.g. pneumatic release completed, minimal moisture weight loss"
                  value={deliveryRemarks}
                  onChange={(e) => setDeliveryRemarks(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden"
                />
              </div>

              {/* Delivery Document Upload inside Modal */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg space-y-2">
                <span className="text-xs font-bold text-slate-700 block uppercase tracking-wider">Proof of Delivery (POD) Document</span>
                <p className="text-[11px] text-slate-500 font-sans">Upload the delivery challan or weight slip in PDF or Image form (Optional).</p>
                
                <div className="flex items-center space-x-4">
                  <label
                    htmlFor="delivery-pod-file"
                    className="inline-flex items-center space-x-1 px-3 py-1.5 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-400 bg-white text-indigo-700 rounded text-xs font-bold cursor-pointer transition-colors shadow-2xs"
                  >
                    <Upload className="h-3 w-3 mr-1 inline" />
                    <span>{docUrlState ? 'Change File' : 'Select POD File'}</span>
                  </label>
                  <input
                    id="delivery-pod-file"
                    type="file"
                    accept="application/pdf,image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 5 * 1024 * 1024) {
                          alert('File is too large! Check size under 5MB.');
                          return;
                        }
                        const reader = new FileReader();
                        reader.onload = () => {
                          if (typeof reader.result === 'string') {
                            setDocUrlState(reader.result);
                            setDocNameState(file.name);
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />

                  {docUrlState && (
                    <div className="flex items-center space-x-2 bg-emerald-50 px-2 py-1 border border-emerald-200 rounded text-[11px] font-bold text-emerald-800 max-w-[200px] overflow-hidden">
                      <Check className="h-3 w-3 text-emerald-600 shrink-0" />
                      <span className="truncate font-mono text-[10px] shrink">{docNameState}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setDocUrlState('');
                          setDocNameState('');
                        }}
                        className="text-red-500 hover:text-red-700 ml-1 font-bold hover:underline cursor-pointer text-[10px]"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 flex justify-end space-x-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsDeliverModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg border border-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center space-x-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors shadow-lg shadow-emerald-500/20"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>Unloaded & Deliver</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Void/Cancel Dispatch Confirmation Modal */}
      {cancelConfirmationId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-100">
            <div className="flex items-start space-x-3 text-red-650 text-red-600">
              <AlertTriangle className="h-6 w-6 mt-0.5 shrink-0" />
              <div>
                <h3 className="font-bold text-slate-900 text-base">Void Despatch Order / Challan?</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Are you sure you want to cancel and void despatch order <strong className="text-slate-900">{dos.find(d => d.id === cancelConfirmationId)?.doNumber}</strong>? Once voided, transit logs will status as "Cancelled" and commission ledgers will be zeroed.
                </p>
              </div>
            </div>
            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setCancelConfirmationId(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                No, Keep Active
              </button>
              <button
                onClick={() => {
                  if (cancelConfirmationId) {
                    onCancelDO(cancelConfirmationId);
                    setCancelConfirmationId(null);
                  }
                }}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Yes, Void Slip
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
