import React, { useState } from 'react';
import { 
  Transporter, 
  DespatchOrder, 
  Company, 
  PurchaseOrder, 
  TransporterPayment,
  AppUser
} from '../types';
import { 
  Truck, 
  FileText, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  CornerDownRight, 
  Check, 
  Printer, 
  Calendar, 
  UserSquare2,
  DollarSign, 
  Inbox, 
  Lock,
  Plus,
  AlertCircle,
  Clock,
  ArrowRight,
  Filter,
  FileCheck2,
  Download,
  Activity,
  Award
} from 'lucide-react';

interface TransporterPaymentPanelProps {
  transporters: Transporter[];
  dos: DespatchOrder[];
  pos: PurchaseOrder[];
  companies: Company[];
  payments: TransporterPayment[];
  currentUser: AppUser | null;
  onAddPayment: (payout: Omit<TransporterPayment, 'id' | 'createdAt'>) => void;
  onDeletePayment: (paymentId: string) => void;
  onUpdatePayment: (payment: TransporterPayment) => void;
  onUpdateInvoiceDetails: (doId: string, invoiceData: {
    invoiceNo: string;
    invoiceDate: string;
    invoiceType: 'Digital' | 'HardCopy';
    invoiceDigitallySigned: boolean;
    invoiceHardCopyReceived: boolean;
    invoiceDocName?: string;
  }) => void;
  onUpdateHardCopyStatus: (doId: string, received: boolean) => void;
  onBack?: () => void;
}

export default function TransporterPaymentPanel({
  transporters,
  dos,
  pos,
  companies,
  payments,
  currentUser,
  onAddPayment,
  onDeletePayment,
  onUpdatePayment,
  onUpdateInvoiceDetails,
  onUpdateHardCopyStatus,
  onBack,
}: TransporterPaymentPanelProps) {
  
  // Navigation & Tabs
  const [activeSubTab, setActiveSubTab] = useState<'pending' | 'ledger'>('pending');
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTransporterFilter, setSelectedTransporterFilter] = useState<string>('');

  // GST withholding and rate selection
  const [transporterGstRate, setTransporterGstRate] = useState<number>(12);
  const [carrierGstCompliant, setCarrierGstCompliant] = useState<boolean>(true);

  // Re-release withheld GST state
  const [releasingPayment, setReleasingPayment] = useState<TransporterPayment | null>(null);
  const [gstReleaseRefInput, setGstReleaseRefInput] = useState('');
  const [gstReleaseDateInput, setGstReleaseDateInput] = useState(new Date().toISOString().substring(0, 10));

  // Invoice Register Modal
  const [registeringDo, setRegisteringDo] = useState<DespatchOrder | null>(null);
  const [invoiceNoInput, setInvoiceNoInput] = useState('');
  const [invoiceDateInput, setInvoiceDateInput] = useState(new Date().toISOString().substring(0, 10));
  const [invoiceTypeInput, setInvoiceTypeInput] = useState<'Digital' | 'HardCopy'>('Digital');
  const [isDigitallySignedInput, setIsDigitallySignedInput] = useState(false);
  const [isHardCopyReceivedInput, setIsHardCopyReceivedInput] = useState(false);
  const [invoiceDocNameInput, setInvoiceDocNameInput] = useState('');

  // Batch Payment State
  const [selectedDoIds, setSelectedDoIds] = useState<Record<string, boolean>>({});
  const [selectedPaymentTransporterId, setSelectedPaymentTransporterId] = useState<string>('');

  // Process Payout Modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().substring(0, 10));
  const [payingCompanyId, setPayingCompanyId] = useState(companies[0]?.id || '');
  const [referenceNo, setReferenceNo] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('NEFT');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Printable Remittance state
  const [advicePayment, setAdvicePayment] = useState<TransporterPayment | null>(null);

  // Helper resolvers
  const getTransporterName = (id: string) => transporters.find(t => t.id === id)?.name || 'Unknown Transporter';
  const getPO = (id: string) => pos.find(p => p.id === id);
  const getCompany = (id: string) => companies.find(c => c.id === id);

  // Filter Despatch Orders
  // Transporter became eligible if: status === 'Delivered', and has POD (has deliveryDocName or url), and has NOT been paid
  const deliveredDos = dos.filter(item => {
    const isTransporterMatch = !selectedTransporterFilter || item.transporterId === selectedTransporterFilter;
    const isSearchMatch = !searchQuery || 
      item.doNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.vehicleNumber && item.vehicleNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.invoiceNo && item.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return item.status === 'Delivered' && isTransporterMatch && isSearchMatch;
  });

  // Split into Eligible for Payment vs Awaiting Registration (POD/Invoice)
  const eligibleForPaymentDos = deliveredDos.filter(item => 
    !item.transporterPaymentId && item.invoiceReceived && (item.deliveryDocName || item.deliveryDocUrl)
  );

  const awaitingSpecsDos = deliveredDos.filter(item => 
    !item.transporterPaymentId && (!item.invoiceReceived || !(item.deliveryDocName || item.deliveryDocUrl))
  );

  // Hard Copy Alert count state for active warning notices
  const hardCopyWarningsCount = dos.filter(d => 
    d.status === 'Delivered' && 
    !d.transporterPaymentId && 
    d.invoiceReceived && 
    d.invoiceType === 'Digital' && 
    !d.invoiceDigitallySigned && 
    !d.invoiceHardCopyReceived
  ).length;

  // Handles select/unselect checkboxes for batch payments
  const handleToggleDoSelection = (doId: string, transporterId: string) => {
    // Check if switching transporter - user can only batch pay multiple invoices for the SAME transporter at once!
    if (selectedPaymentTransporterId && selectedPaymentTransporterId !== transporterId) {
      // Auto clear previous ones if they try to switch transporters for consistency
      setSelectedDoIds({ [doId]: true });
      setSelectedPaymentTransporterId(transporterId);
      return;
    }

    if (!selectedPaymentTransporterId) {
      setSelectedPaymentTransporterId(transporterId);
    }

    const nextState = {
      ...selectedDoIds,
      [doId]: !selectedDoIds[doId]
    };

    // Clean up empty states
    const hasValues = Object.keys(nextState).some(k => nextState[k]);
    if (!hasValues) {
      setSelectedPaymentTransporterId('');
    }
    setSelectedDoIds(nextState);
  };

  const getSelectedDosCount = () => {
    return Object.keys(selectedDoIds).filter(id => selectedDoIds[id]).length;
  };

  const calculateSelectedTotalAmount = () => {
    return Object.keys(selectedDoIds)
      .filter(id => selectedDoIds[id])
      .reduce((sum, id) => {
        const order = dos.find(d => d.id === id);
        if (order) {
          const weight = order.receivedWeight || order.loadedWeight || 0;
          return sum + (weight * order.transporterRate);
        }
        return sum;
      }, 0);
  };

  const calculateSelectedTotalTons = () => {
    return Object.keys(selectedDoIds)
      .filter(id => selectedDoIds[id])
      .reduce((sum, id) => {
        const order = dos.find(d => d.id === id);
        if (order) {
          const weight = order.receivedWeight || order.loadedWeight || 0;
          return sum + weight;
        }
        return sum;
      }, 0);
  };

  const handleOpenRegisterInvoiceModal = (item: DespatchOrder) => {
    setRegisteringDo(item);
    setInvoiceNoInput(item.invoiceNo || `MINV-${item.doNumber.replace('DO-', '')}`);
    setInvoiceDateInput(item.invoiceDate || new Date().toISOString().substring(0, 10));
    setInvoiceTypeInput(item.invoiceType || 'Digital');
    setIsDigitallySignedInput(item.invoiceDigitallySigned || false);
    setIsHardCopyReceivedInput(item.invoiceHardCopyReceived || false);
    setInvoiceDocNameInput(item.invoiceDocName || `invoice_${item.doNumber.toLowerCase()}_copy.pdf`);
  };

  const handleSaveInvoiceDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (!registeringDo) return;

    onUpdateInvoiceDetails(registeringDo.id, {
      invoiceNo: invoiceNoInput,
      invoiceDate: invoiceDateInput,
      invoiceType: invoiceTypeInput,
      invoiceDigitallySigned: invoiceTypeInput === 'Digital' ? isDigitallySignedInput : false,
      invoiceHardCopyReceived: invoiceTypeInput === 'Digital' ? isDigitallySignedInput ? true : isHardCopyReceivedInput : true,
      invoiceDocName: invoiceDocNameInput || `invoice_${registeringDo.doNumber.toLowerCase()}.pdf`,
    });

    setRegisteringDo(null);
  };

  const handleOpenPaymentPrompt = () => {
    const selectedCount = getSelectedDosCount();
    if (selectedCount === 0) {
      alert('Please select at least one eligible outstanding invoice in the checkboxes below.');
      return;
    }
    
    // Auto-prefill the total amount
    setIsPaymentModalOpen(true);
  };

  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();

    // DEVELOPMENT STAGE BYPASS: Lift all security restrictions for transporter payments ledger
    const checkRight = true;

    const selectedIds = Object.keys(selectedDoIds).filter(id => selectedDoIds[id]);
    const baseFreight = calculateSelectedTotalAmount();
    const gstAmt = baseFreight * (transporterGstRate / 100);
    const totalPayout = carrierGstCompliant ? (baseFreight + gstAmt) : baseFreight;

    onAddPayment({
      transporterId: selectedPaymentTransporterId,
      paymentDate,
      amountPaid: totalPayout,
      referenceNo,
      paymentMethod,
      paidByCompanyId: payingCompanyId,
      despatchOrderIds: selectedIds,
      notes: paymentNotes || `Settle multiple transport service bills in batch. Invoices cleared: ${selectedIds.map(id => dos.find(d => d.id === id)?.invoiceNo).join(', ')}`,
      freightAmount: baseFreight,
      gstRate: transporterGstRate,
      gstAmount: gstAmt,
      isGstCompliant: carrierGstCompliant,
      gstWithheld: !carrierGstCompliant,
      gstWithheldStatus: carrierGstCompliant ? undefined : 'Withheld',
    });

    // Reset states
    setSelectedDoIds({});
    setSelectedPaymentTransporterId('');
    setIsPaymentModalOpen(false);
    setReferenceNo('');
    setPaymentNotes('');
    setTransporterGstRate(12);
    setCarrierGstCompliant(true);
    
    // Switch to ledger view to view success
    setActiveSubTab('ledger');
  };

  // Grouping outstanding do records by Transporter
  const outstandingByTransporter: Record<string, DespatchOrder[]> = {};
  dos.forEach(d => {
    if (d.status === 'Delivered' && !d.transporterPaymentId) {
      if (!outstandingByTransporter[d.transporterId]) {
        outstandingByTransporter[d.transporterId] = [];
      }
      outstandingByTransporter[d.transporterId].push(d);
    }
  });

  const getOutstandingFreightSum = (transporterId: string) => {
    const arr = outstandingByTransporter[transporterId] || [];
    return arr.reduce((sum, order) => {
      if (!order.invoiceReceived || !(order.deliveryDocName || order.deliveryDocUrl)) return sum;
      const t = order.receivedWeight || order.loadedWeight || 0;
      return sum + (t * order.transporterRate);
    }, 0);
  };

  return (
    <div id="transporter-payment-panel" className="space-y-6 animate-fade-in text-[#1A1A1A]">
      
      {/* Return Navigation Back */}
      {onBack && (
        <div className="flex justify-start print:hidden">
          <button
            onClick={onBack}
            className="inline-flex items-center space-x-2 px-4 py-2 border border-[#D1D1CF] hover:border-black bg-white hover:bg-[#F9F8F6] text-xs font-serif font-bold italic text-neutral-900 transition-colors cursor-pointer"
          >
            <span>← Back to Operations Home</span>
          </button>
        </div>
      )}

      {/* Main Header Desk */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#D1D1CF] pb-4 print:hidden">
        <div>
          <h2 className="text-xl font-serif font-bold italic text-[#1A1A1A] flex items-center space-x-2">
            <Truck className="h-6 w-6 text-[#E65100]" />
            <span>Transporter Billing & Freight Payouts Desk</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Reconcile signed POD weight certificate receipts, track digitally signed scans, audit hard copy statuses, and bundle multiple transport invoices into single transaction remittances.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 bg-neutral-100 p-1.5 border border-[#D1D1CF] rounded-none">
          <button
            id="subtab-bills-reconciler"
            onClick={() => setActiveSubTab('pending')}
            className={`px-4 py-2.5 text-xs font-mono font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
              activeSubTab === 'pending'
                ? 'bg-[#E65100] text-white shadow-sm'
                : 'bg-white text-stone-600 border border-[#D1D1CF] hover:text-black hover:bg-slate-50'
            }`}
          >
            📋 Point 1 & 2 & 3 Reconciler ({eligibleForPaymentDos.length} / {dos.filter(d => d.status === 'Delivered' && !d.transporterPaymentId).length} Cleared)
          </button>
          
          <button
            id="subtab-remittance-register"
            onClick={() => setActiveSubTab('ledger')}
            className={`px-4 py-2.5 text-xs font-mono font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
              activeSubTab === 'ledger'
                ? 'bg-zinc-900 text-white shadow-sm'
                : 'bg-white text-stone-600 border border-[#D1D1CF] hover:text-black hover:bg-slate-50'
            }`}
          >
            🏦 Remittance Settlement Register ({payments.length} Transactions Settled)
          </button>
        </div>
      </div>

      {/* WARNING COMPACT RIBBON FOR SCAN AUDITING */}
      {hardCopyWarningsCount > 0 && activeSubTab === 'pending' && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 shrink-0 flex items-start space-x-3 print:hidden">
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <h4 className="font-bold text-amber-900 uppercase font-sans tracking-wide">
              {hardCopyWarningsCount} Document Verification Alerts - Unsigned Scans Recieved
            </h4>
            <p className="text-slate-650 mt-1">
              The transporters have sent unsigned digital scan copies of their tax invoices. We are holding these or tracking their physical copies. Please secure the physical hard copies of these invoices before releasing bank payments, and toggle the "Track Hard Copy" verification to record their receipt.
            </p>
          </div>
        </div>
      )}

      {/* 3-STEP INTEGRITY CHECKLIST GUIDELINES (POINTS 1, 2, & 3) */}
      {activeSubTab === 'pending' && (
        <div id="reconciliation-process-info" className="bg-neutral-50 border border-[#D1D1CF] p-5 space-y-4 print:hidden">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-[#D1D1CF] pb-2">
            <h3 className="text-xs uppercase tracking-widest font-mono font-extrabold text-[#E65100]">
              🚀 Carrier Payout Authorization Guide (Compliance Points 1, 2 & 3)
            </h3>
            <span className="text-[10px] font-mono text-stone-500 font-bold">STRICT AUDIT CONTROLS ACTIVE</span>
          </div>
          
          <p className="text-xs text-stone-650 font-serif leading-relaxed">
            To unlock the billing select checkboxes and record bank transfer remittances on the <b>Remittance Settlement Register</b>, each shipment Despatch Order (DO) contract must verify and satisfy all three compliance points below:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Step 1 Card */}
            <div className="bg-white p-4 border border-[#D1D1CF] space-y-1.5 relative">
              <span className="absolute -top-2.5 -right-2 bg-stone-900 text-white font-mono text-[9px] font-bold px-2 py-0.5 shadow-xs">
                POINT 1
              </span>
              <div className="flex items-center space-x-1 text-stone-900 font-bold font-serif text-xs italic">
                <span className="text-stone-300 font-mono text-[10px]">01 //</span>
                <span>Physical Delivery Complete</span>
              </div>
              <p className="text-[11px] text-stone-500 leading-relaxed font-sans">
                The bulker truck shipment has completed its path from quarry mines. The status is set to <b className="text-emerald-700">Delivered</b>.
              </p>
            </div>

            {/* Step 2 Card */}
            <div className="bg-white p-4 border border-[#D1D1CF] space-y-1.5 relative">
              <span className="absolute -top-2.5 -right-2 bg-stone-900 text-white font-mono text-[9px] font-bold px-2 py-0.5 shadow-xs">
                POINT 2
              </span>
              <div className="flex items-center space-x-1 text-stone-900 font-bold font-serif text-xs italic">
                <span className="text-stone-300 font-mono text-[10px]">02 //</span>
                <span>Signed POD File Uploaded</span>
              </div>
              <p className="text-[11px] text-stone-500 leading-relaxed font-sans">
                The physical Proof of Delivery (certified weighment receipt) has been scanned and attached under the <b className="text-slate-800">Despatch Desk</b>.
              </p>
            </div>

            {/* Step 3 Card */}
            <div className="bg-white p-4 border border-[#D1D1CF] space-y-1.5 relative">
              <span className="absolute -top-2.5 -right-2 bg-[#E65100] text-white font-mono text-[9px] font-bold px-2 py-0.5 shadow-xs animate-pulse">
                POINT 3 (AUDIT)
              </span>
              <div className="flex items-center space-x-1 text-[#E65100] font-bold font-serif text-xs italic">
                <span className="text-amber-500 font-mono text-[10px]">03 //</span>
                <span>Tax Invoice Filing & Check</span>
              </div>
              <div className="text-[10px] text-stone-600 space-y-1 leading-normal font-sans">
                <span className="block font-bold">Rules to clear Point 3 (Audit Gate):</span>
                <span className="block italic">• <b>Digital Sign Scan:</b> Cleared automatically.</span>
                <span className="block italic">• <b>Unsigned Digital Scan:</b> System holds for original hard copy. Click <b className="text-[#E65100]">"Mark Received [✓]"</b> to clear step manually!</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FILTER CONTROLS BAR */}
      {activeSubTab === 'pending' && (
        <div className="bg-white border border-[#D1D1CF] p-4 flex flex-wrap gap-4 items-center justify-between print:hidden">
          <div className="flex flex-wrap gap-3 items-center">
            <div>
              <label className="block text-[9px] uppercase font-bold text-slate-400 mb-1 font-mono">Filter by Transporter</label>
              <select
                value={selectedTransporterFilter}
                onChange={(e) => setSelectedTransporterFilter(e.target.value)}
                className="text-xs font-bold font-serif italic py-1.5 px-3 border border-[#D1D1CF] bg-[#F9F8F6] focus:outline-hidden"
              >
                <option value="">-- All Bulk Carriers --</option>
                {transporters.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[9px] uppercase font-bold text-slate-400 mb-1 font-mono">Dynamic Search Filter</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Seach vehicle number, invoice, do..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="text-xs px-3 py-1.5 w-60 border border-[#D1D1CF] focus:outline-hidden font-mono"
                />
              </div>
            </div>
          </div>

          <div className="text-right text-xs">
            <span className="text-[#888884] block font-mono text-[9px] uppercase">Combined Outstanding Bills Value</span>
            <span className="text-lg font-serif font-black text-slate-900 leading-tight">
              Rs. {dos.filter(d => d.status === 'Delivered' && !d.transporterPaymentId).reduce((s, o) => {
                const w = o.receivedWeight || o.loadedWeight || 0;
                return s + (w * o.transporterRate);
              }, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      )}

      {/* PENDING / BILLS RECONCILER TAB VIEW */}
      {activeSubTab === 'pending' && (
        <div className="space-y-8">
          
          {/* BATCH PAYMENT ACTION OVERLAY RAIL */}
          {getSelectedDosCount() > 0 && (
            <div className="bg-indigo-600 text-white p-5 shadow-lg flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 animate-fade-in print:hidden">
              <div className="flex items-center space-x-3.5">
                <div className="p-2.5 bg-indigo-700">
                  <FileCheck2 className="h-6 w-6 text-[#FFD54F]" />
                </div>
                <div>
                  <h3 className="text-xs font-bold font-mono tracking-widest uppercase text-indigo-200">
                    Settle Multi Invoices in Batches
                  </h3>
                  <p className="text-sm font-serif font-semibold italic text-white mt-1">
                    You have selected {getSelectedDosCount()} tax invoice/s from <b>{getTransporterName(selectedPaymentTransporterId)}</b> totaling <b>{calculateSelectedTotalTons().toFixed(2)} MT</b>.
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4 shrink-0 text-right">
                <div className="text-right flex flex-col font-mono">
                  <span className="text-[10px] text-indigo-200 uppercase leading-none font-bold">Total Payout Amount:</span>
                  <span className="text-xl font-bold font-serif-display text-[#FFB300]">Rs. {calculateSelectedTotalAmount().toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                
                <button
                  onClick={handleOpenPaymentPrompt}
                  className="px-5 py-3 bg-[#E65100] hover:bg-black text-white font-bold text-xs uppercase tracking-widest transition-colors cursor-pointer rounded-none border border-black shadow-md flex items-center space-x-1.5"
                >
                  <Plus className="h-4 w-4" />
                  <span>Record Aggregate Payment</span>
                </button>
              </div>
            </div>
          )}

          {/* GROUPS ACCORDION BY TRANSPORTER CARRIER */}
          {transporters.map(transporter => {
            // Filter movements for this transporter only
            const transMatches = dos.filter(d => 
              d.transporterId === transporter.id && 
              d.status === 'Delivered' && 
              !d.transporterPaymentId
            );

            // Filter down matching query
            const visibleMatches = transMatches.filter(item => {
              const isSearchMatch = !searchQuery || 
                item.doNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (item.vehicleNumber && item.vehicleNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (item.invoiceNo && item.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase()));
              return isSearchMatch;
            });

            if (transMatches.length === 0) return null;
            if (visibleMatches.length === 0) return null;

            return (
              <div key={transporter.id} className="border border-[#D1D1CF] bg-white overflow-hidden">
                
                {/* Transporter Header Block */}
                <div className="bg-slate-100 px-5 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-[#D1D1CF]">
                  <div>
                    <h3 className="font-serif font-black text-base text-stone-900 flex items-center space-x-2">
                      <Truck className="h-5 w-5 text-[#E65100]" />
                      <span>{transporter.name}</span>
                    </h3>
                    <p className="text-[10px] text-slate-500 font-mono tracking-widest mt-0.5">
                      Carrier ID: {transporter.id} | Contact: {transporter.contactNo || 'N/A'} | GSTIN: {transporter.gstin || 'None recorded'}
                    </p>
                  </div>

                  <div className="text-right sm:text-right text-xs">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block font-mono">Approved Eligible Outstanding Freight</span>
                    <span className="font-bold text-[#E65100] text-sm font-mono">
                      Rs. {getOutstandingFreightSum(transporter.id).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Sub-moving Contract Despatch Orders Table */}
                <div className="overflow-x-auto p-1.5 bg-slate-50">
                  <table className="w-full text-left font-serif text-xs text-[#1A1A1A]">
                    <thead className="bg-[#1A1A1A] text-[9.5px] font-bold text-neutral-200 uppercase tracking-widest border-b border-[#D1D1CF] font-mono select-none">
                      <tr>
                        <th className="px-5 py-3 text-center w-12 bg-neutral-900 border-r border-[#D1D1CF]/10">Batch</th>
                        <th className="px-5 py-3">Movement DO #</th>
                        <th className="px-5 py-3 text-center bg-stone-850 border-r border-[#D1D1CF]/10 text-emerald-300">Point 1: Shipment Delv</th>
                        <th className="px-5 py-3 text-center bg-zinc-850 border-r border-[#D1D1CF]/10 text-amber-300">Point 2: POD Received</th>
                        <th className="px-5 py-3 text-center bg-neutral-800 text-sky-300">Point 3: Invoice filed (Audit Gate)</th>
                        <th className="px-5 py-3 text-right">Freight Charges</th>
                        <th className="px-5 py-3 text-right">Action Gate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150 font-sans font-medium text-xs bg-white">
                      {visibleMatches.map(order => {
                        const po = getPO(order.poId);
                        const weight = order.receivedWeight || order.loadedWeight || 0;
                        const freightVal = weight * order.transporterRate;
                        
                        // Eligibility Checklist Boolean
                        const isPODUploaded = !!(order.deliveryDocName || order.deliveryDocUrl);
                        const isInvoiceUploaded = !!order.invoiceReceived;
                        
                        // Explicitly check hard copy receipts state
                        const isDigitalUnsigned = order.invoiceReceived && order.invoiceType === 'Digital' && !order.invoiceDigitallySigned;
                        const isHardCopyMissing = isDigitalUnsigned && !order.invoiceHardCopyReceived;
                        
                        // True step clearance matrix
                        const step1Delivered = order.status === 'Delivered';
                        const step2PodOk = isPODUploaded;
                        const step3InvoiceOk = isInvoiceUploaded && !isHardCopyMissing;
                        
                        const isEligibleForPayment = step1Delivered && step2PodOk && step3InvoiceOk;

                        // Checkbox selection status
                        const isChecked = !!selectedDoIds[order.id];

                        return (
                          <tr 
                            key={order.id} 
                            className={`hover:bg-[#F9F8F6]/40 transition-colors border-b border-stone-200 ${
                              isHardCopyMissing ? 'bg-rose-50/10' : ''
                            } ${isChecked ? 'bg-indigo-50/40' : ''}`}
                          >
                            {/* Checkbox selector for batching */}
                            <td className="px-4 py-4 text-center border-r border-slate-100">
                              {isEligibleForPayment ? (
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleToggleDoSelection(order.id, order.transporterId)}
                                  className="h-4 w-4 text-indigo-600 border-slate-300 rounded-none focus:ring-0 cursor-pointer mx-auto block"
                                  title="Add to multi invoice payload"
                                />
                              ) : (
                                <span className="text-[8.5px] bg-amber-100 text-amber-800 font-mono tracking-wider font-extrabold px-1.5 py-0.5 uppercase block text-center rounded-xs select-none" title="All points 1, 2, and 3 must pass to release check checkbox">
                                  Hold
                                </span>
                              )}
                            </td>

                            <td className="px-4 py-4 font-serif">
                              <span className="font-bold text-slate-950 block text-xs">{order.doNumber}</span>
                              <span className="text-[10px] text-slate-400 font-mono">Date: {order.date}</span>
                              {po && (
                                <span className="block text-[9px] font-sans font-bold text-indigo-600 mt-1 uppercase">
                                  PO: {po.poNumber} ({po.material})
                                </span>
                              )}
                            </td>

                            {/* Point 1: Shipment Delv */}
                            <td className="px-4 py-4 text-center border-r border-slate-100">
                              {step1Delivered ? (
                                <div className="inline-flex flex-col items-center">
                                  <span className="inline-flex items-center space-x-0.5 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-none font-mono uppercase text-[9px]">
                                    <Check className="h-2.5 w-2.5 shrink-0" />
                                    <span>DELIVERED [ok]</span>
                                  </span>
                                  <span className="block text-[10px] text-zinc-900 font-mono font-bold mt-1">
                                    {weight.toFixed(2)} MT
                                  </span>
                                </div>
                              ) : (
                                <span className="inline-flex items-center space-x-0.5 text-xs font-bold text-rose-800 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-none font-mono uppercase text-[9px]">
                                  <span>In Transit</span>
                                </span>
                              )}
                            </td>

                            {/* Point 2: POD Received */}
                            <td className="px-4 py-4 text-center border-r border-slate-100">
                              {step2PodOk ? (
                                <div className="space-y-1 text-center">
                                  <span className="inline-flex items-center space-x-0.5 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-none font-mono uppercase text-[9px]">
                                    <Check className="h-2.5 w-2.5 shrink-0" />
                                    <span>POD RECV [ok]</span>
                                  </span>
                                  {order.deliveryDocUrl && (
                                    <a
                                      href={order.deliveryDocUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="block text-[9px] text-[#E65100] font-sans font-bold hover:underline uppercase"
                                    >
                                      📄 View Receipt
                                    </a>
                                  )}
                                </div>
                              ) : (
                                <span className="inline-flex items-center space-x-0.5 text-xs font-bold text-rose-805 bg-rose-50 border border-rose-105 px-2 py-0.5 rounded-none font-mono uppercase text-[9px]">
                                  <span>No POD File</span>
                                </span>
                              )}
                            </td>

                            {/* Point 3: Invoice Filed & Audited */}
                            <td className="px-4 py-4 text-center border-r border-slate-100">
                              {isInvoiceUploaded ? (
                                <div className="space-y-1 inline-block text-center w-full">
                                  <div className="flex items-center justify-center space-x-1.5">
                                    <span className="text-[10px] font-bold text-slate-800 font-mono">Ref: {order.invoiceNo}</span>
                                    <span className="text-[9px] text-slate-400 font-mono">({order.invoiceDate})</span>
                                  </div>

                                  <div className="flex flex-col items-center gap-1">
                                    {order.invoiceType === 'HardCopy' ? (
                                      <span className="inline-flex items-center px-1.5 py-0.5 bg-sky-50 text-sky-805 border border-sky-100 font-mono text-[9px] font-bold uppercase rounded-none leading-none">
                                        📰 Original Hard Copy Recv
                                      </span>
                                    ) : order.invoiceDigitallySigned ? (
                                      <span className="inline-flex items-center px-1.5 py-0.5 bg-emerald-50 text-emerald-805 border border-emerald-100 font-mono text-[9px] font-bold uppercase rounded-none leading-none">
                                        ✍️ Digitally Signed Scan
                                      </span>
                                    ) : (
                                      <div className="space-y-1 w-full flex flex-col items-center">
                                        <span className="inline-flex items-center px-1.5 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 font-mono text-[9px] font-bold uppercase rounded-none leading-none">
                                          ⚠️ Unsigned scan copy
                                        </span>
                                        
                                        {/* Physical copy verification monitor */}
                                        {order.invoiceHardCopyReceived ? (
                                          <div className="flex items-center justify-center text-teal-700 font-mono text-[9px] font-extrabold bg-teal-50 border border-teal-100 px-1.5 py-0.5">
                                            <Check className="h-2.5 w-2.5 mr-0.5 shrink-0" />
                                            <span>Hard Copy Recvd</span>
                                          </div>
                                        ) : (
                                          <div className="bg-rose-50 border border-rose-200 p-1.5 w-full max-w-[170px] space-y-1 rounded-none text-[9.5px]">
                                            <span className="text-rose-700 font-bold block font-mono text-[8.5px] leading-tight">⚠️ ORIGINAL HARD COPY REQUIRED</span>
                                            
                                            <button
                                              type="button"
                                              onClick={() => onUpdateHardCopyStatus(order.id, true)}
                                              className="text-[8px] font-mono tracking-wider font-extrabold uppercase px-1.5 py-0.5 bg-white hover:bg-[#E65100] hover:text-white text-stone-900 border border-[#D1D1CF] hover:border-black transition-colors cursor-pointer select-none mx-auto block"
                                            >
                                              Received original copy [✓]
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-1 text-center">
                                  <span className="inline-flex items-center space-x-0.5 text-xs font-bold text-amber-800 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-none font-mono uppercase text-[9px]">
                                    <Clock className="h-2.5 w-2.5 text-amber-600 shrink-0" />
                                    <span>Awaiting Bill Filing</span>
                                  </span>
                                  <button
                                    onClick={() => handleOpenRegisterInvoiceModal(order)}
                                    className="block text-[10px] text-indigo-700 hover:text-[#E65100] font-bold hover:underline cursor-pointer font-mono"
                                  >
                                    File Invoice Now
                                  </button>
                                </div>
                              )}
                            </td>

                            <td className="px-4 py-4 text-right font-mono text-xs font-bold text-slate-805">
                              <span>Rs. {freightVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                              <span className="block text-[9.5px] text-slate-400 font-normal">@{order.transporterRate}/MT</span>
                            </td>

                            {/* Singular Action column */}
                            <td className="px-5 py-4 text-right">
                              {order.invoiceReceived ? (
                                <button
                                  type="button"
                                  onClick={() => handleOpenRegisterInvoiceModal(order)}
                                  className="text-[9.5px] uppercase font-mono tracking-wider border border-[#D1D1CF] px-2 py-1 bg-[#F9F8F6] text-slate-650 hover:bg-[#F4F4F1] transition-all cursor-pointer rounded"
                                >
                                  Edit Bill
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleOpenRegisterInvoiceModal(order)}
                                  className="text-[9.5px] uppercase font-mono tracking-wider bg-indigo-600 text-white px-2 py-1 hover:bg-black transition-all cursor-pointer rounded-none border-none font-bold"
                                >
                                  File Invoice
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

              </div>
            );
          })}

          {/* Fallback Empty Outstanding status */}
          {Object.keys(outstandingByTransporter).length === 0 && (
            <div className="bg-white border border-[#D1D1CF] p-12 text-center space-y-3">
              <Inbox className="h-10 w-10 text-stone-300 mx-auto" />
              <h3 className="font-serif font-black italic text-stone-705 text-sm">
                No Outstanding Carrier Invoices Found
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                All delivered material shipments have been cleared, or there are no delivered dispatch movements in this system session. Add a dispatch movement in the Despatches tab to begin!
              </p>
            </div>
          )}

        </div>
      )}

      {/* REMITTANCES DIRECT SETTLEMENT REGISTER TAB VIEW */}
      {activeSubTab === 'ledger' && (
        <div className="bg-white border border-[#D1D1CF]">
          
          <div className="px-5 py-4 bg-[#1A1A1A] border-b border-[#D1D1CF] text-stone-200 uppercase tracking-widest font-mono text-xs flex justify-between items-center">
            <span>SAVED TRANSPORTER BANK SETTLEMENT REMITTANCES</span>
            <span className="text-[10px] text-stone-400 font-normal">{payments.length} transactions logged</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-serif text-xs text-neutral-800">
              <thead className="bg-[#F9F8F6] text-[10px] font-bold text-slate-555 uppercase tracking-widest border-b border-[#D1D1CF] font-mono">
                <tr>
                  <th className="px-5 py-3">Settlement Date</th>
                  <th className="px-5 py-3">Carrier / Transporter</th>
                  <th className="px-5 py-3">Paying Company Context</th>
                  <th className="px-5 py-3">Transaction Reference / Method</th>
                  <th className="px-5 py-3">Cleared Invoice Count</th>
                  <th className="px-5 py-3 text-right">Sum Disbursed Amount</th>
                  <th className="px-5 py-3 text-right">remittance receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans font-medium">
                {payments.map(pay => {
                  const company = getCompany(pay.paidByCompanyId);
                  return (
                    <tr key={pay.id} className="hover:bg-slate-50/50">
                      <td className="px-5 py-4 font-mono text-xs">
                        <span className="font-bold text-slate-900 block">{pay.paymentDate}</span>
                        <span className="text-[10px] text-slate-450 font-normal">Id: {pay.id}</span>
                      </td>

                      <td className="px-5 py-4">
                        <strong className="text-slate-900 text-xs block">{getTransporterName(pay.transporterId)}</strong>
                        <span className="text-[10px] text-slate-400 text-ellipsis font-mono block max-w-xs truncate">{pay.notes}</span>
                      </td>

                      <td className="px-5 py-4 text-xs font-serif text-slate-700 italic font-semibold">
                        {company?.name || 'Unknown Corporate Context'}
                      </td>

                      <td className="px-5 py-4">
                        <span className="font-mono font-bold text-slate-900 block text-xs">{pay.referenceNo}</span>
                        <span className="inline-block text-[10px] uppercase font-mono tracking-wider font-extrabold text-blue-700 bg-blue-50 px-1.5 py-0.2 select-none border border-blue-100 rounded">
                          {pay.paymentMethod || 'NEFT'}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-center font-mono font-black text-xs text-indigo-705">
                        {pay.despatchOrderIds?.length || 0} bills cleared
                      </td>

                      <td className="px-5 py-4 text-right font-mono text-xs font-black text-slate-900">
                        Rs. {pay.amountPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        
                        {pay.freightAmount !== undefined && (
                          <div className="text-[10px] text-slate-400 font-normal leading-normal mt-1.5">
                            <span>Base Freight: ₹ {pay.freightAmount.toLocaleString('en-IN')}</span>
                            {pay.gstAmount !== undefined && pay.gstAmount > 0 && (
                              <span className="block mt-0.5 font-semibold text-slate-500">
                                GST ({pay.gstRate}%): ₹ {pay.gstAmount.toLocaleString('en-IN')}
                              </span>
                            )}
                          </div>
                        )}

                        {pay.gstAmount !== undefined && pay.gstAmount > 0 && (
                          <div className="mt-2 text-right">
                            {pay.gstWithheldStatus === 'Withheld' ? (
                              <div className="inline-block space-y-1">
                                <span className="inline-block text-[9px] font-black uppercase tracking-wider text-rose-800 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded-xs animate-pulse">
                                  GST WITHHELD (NON-COMPLIANT)
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setReleasingPayment(pay);
                                    setGstReleaseRefInput('');
                                    setGstReleaseDateInput(new Date().toISOString().substring(0, 10));
                                  }}
                                  className="block text-[10px] font-bold text-indigo-700 hover:text-indigo-950 underline mt-0.5 w-full text-right cursor-pointer"
                                >
                                  Release Held GST Now
                                </button>
                              </div>
                            ) : pay.gstWithheld ? (
                              <div className="inline-block text-[9px] leading-tight text-emerald-800 bg-emerald-50 border border-emerald-200 p-1.5 font-sans text-left">
                                <span className="font-extrabold uppercase block select-none">GST Released Post-Compliance</span>
                                <span className="block select-none text-[8.5px] mt-0.5 text-slate-500 font-mono">Date: {pay.gstReleaseDate}</span>
                                <span className="block select-none text-[8.5px] text-[#E65100] font-mono font-bold">UTR: {pay.gstReleaseRef || 'N/A'}</span>
                              </div>
                            ) : (
                              <span className="inline-block text-[9px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 select-none text-center">
                                GST Paid (Compliant Standing)
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center space-x-2.5 justify-end">
                          <button
                            type="button"
                            onClick={() => setAdvicePayment(pay)}
                            className="inline-flex items-center space-x-1 px-2 py-1.5 border border-[#D1D1CF] hover:border-black bg-white font-serif italic text-stone-900 hover:bg-[#F9F8F6] text-[11px] transition-all cursor-pointer rounded font-bold"
                          >
                            <Printer className="h-3 w-3 shrink-0" />
                            <span>Statement Advice</span>
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm('Verify: Delete the payment remittance ledger line? (This actions resets corresponding invoices back to unpaid open balance)')) {
                                onDeletePayment(pay.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-red-650 hover:bg-red-50 hover:border-red-100 border border-slate-200 rounded transition-all cursor-pointer leading-none"
                            title="Rollback/Delete Payment"
                          >
                            ×
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {payments.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-slate-400 font-serif italic">
                      No transporter settlement remittances recorded. Release bank funds in the Bills Reconciler tab.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* MODAL 1: REGISTER INVOICE DETAILS FORM */}
      {registeringDo && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto print:hidden">
          <div className="bg-white rounded-none border-2 border-black shadow-xl w-full max-w-md overflow-hidden">
            
            <div className="px-6 py-4 border-b border-slate-100 bg-[#F4F4F1] flex justify-between items-center shrink-0">
              <h3 className="font-serif font-black italic text-stone-850 text-sm">
                Register Transporter Sales Tax Invoice ({registeringDo.doNumber})
              </h3>
              <button
                type="button"
                className="text-slate-400 hover:text-black font-mono text-xs uppercase"
                onClick={() => setRegisteringDo(null)}
              >
                Close [X]
              </button>
            </div>

            <form onSubmit={handleSaveInvoiceDetails} className="p-6 space-y-4">
              
              <div className="bg-blue-50 border border-blue-150 p-3 text-[11px] text-blue-900 leading-normal font-sans">
                <strong>Weighbridge Certified Receipts Match:</strong><br />
                Delivery Weight: <b>{registeringDo.receivedWeight || registeringDo.loadedWeight || 0} MT</b>. freight value outstanding: 
                <strong className="text-indigo-700 ml-1">Rs. {((registeringDo.receivedWeight || registeringDo.loadedWeight || 0) * registeringDo.transporterRate).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Invoice Number / ID <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="e.g. TAXINV-2026-904"
                  value={invoiceNoInput}
                  onChange={(e) => setInvoiceNoInput(e.target.value)}
                  className="w-full text-xs px-3.5 py-2 border border-[#D1D1CF] focus:outline-hidden text-slate-850 font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Invoice Issue Date <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  value={invoiceDateInput}
                  onChange={(e) => setInvoiceDateInput(e.target.value)}
                  className="w-full text-xs px-3.5 py-2 border border-[#D1D1CF] focus:outline-hidden font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Invoice Receipt Category</label>
                <select
                  value={invoiceTypeInput}
                  onChange={(e) => setInvoiceTypeInput(e.target.value as any)}
                  className="w-full text-xs py-2 px-2 border border-[#D1D1CF] bg-white font-serif font-bold italic focus:outline-hidden"
                >
                  <option value="Digital">Digital PDF Scan File</option>
                  <option value="HardCopy">Physical Invoice Hard Copy Delivered</option>
                </select>
              </div>

              {invoiceTypeInput === 'Digital' ? (
                <div className="bg-amber-50 border border-amber-200 p-4 space-y-3 rounded">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isDigitallySigned"
                      checked={isDigitallySignedInput}
                      onChange={(e) => {
                        setIsDigitallySignedInput(e.target.checked);
                        if (e.target.checked) {
                          setIsHardCopyReceivedInput(true); // Auto-clear physical alert
                        }
                      }}
                      className="h-4 w-4 text-indigo-600 focus:outline-hidden"
                    />
                    <label htmlFor="isDigitallySigned" className="text-xs font-bold text-amber-900 select-none cursor-pointer">
                      ✍️ This digital PDF scan copy is DIGITALLY SIGNED
                    </label>
                  </div>
                  
                  <p className="text-[10px] text-slate-500 leading-tight">
                    According to accounting protocols, if the scan copy is digitally signed, the transporter remains fully eligible. If unchecked, the app will flag a Physical Hard Copy Alert.
                  </p>

                  {!isDigitallySignedInput && (
                    <div className="border-t border-amber-200/60 pt-3 flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isHardCopyReceived"
                        checked={isHardCopyReceivedInput}
                        onChange={(e) => setIsHardCopyReceivedInput(e.target.checked)}
                        className="h-4 w-4 text-indigo-600 focus:outline-hidden"
                      />
                      <label htmlFor="isHardCopyReceived" className="text-xs font-bold text-red-900 select-none cursor-pointer">
                        📰 Original physical hard copy RECEIVED by us!
                      </label>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 bg-[#F9F8F6] text-[10px] text-slate-500 font-serif italic border border-[#D1D1CF]">
                  Original paper hard copy has been physically delivered & filed in our corporate registry.
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Simulate Document attachment</label>
                <input
                  type="text"
                  placeholder="e.g. invoice_march_43.pdf"
                  value={invoiceDocNameInput}
                  onChange={(e) => setInvoiceDocNameInput(e.target.value)}
                  className="w-full text-xs px-3.5 py-1.5 border border-[#D1D1CF] focus:outline-hidden font-mono"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setRegisteringDo(null)}
                  className="px-4 py-2 border border-[#D1D1CF] text-xs font-serif italic focus:outline-hidden"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#E65100] hover:bg-black text-white text-xs uppercase tracking-wider font-bold rounded-none transition-colors cursor-pointer"
                >
                  Register Invoice
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: RECORD PAYMENT DETAILS FORM */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto print:hidden">
          <div className="bg-white rounded-none border-2 border-black shadow-xl w-full max-w-lg overflow-hidden">
            
            <div className="px-6 py-4 border-b border-slate-100 bg-[#F4F4F1] flex justify-between items-center shrink-0">
              <h3 className="font-serif font-black italic text-stone-850 text-sm">
                Disburse Bank Remittance for {getTransporterName(selectedPaymentTransporterId)}
              </h3>
              <button
                type="button"
                className="text-slate-400 hover:text-black font-mono text-xs uppercase"
                onClick={() => setIsPaymentModalOpen(false)}
              >
                Close [X]
              </button>
            </div>

            <form onSubmit={handleSubmitPayment} className="p-6 space-y-4">
              
              <div className="bg-indigo-50 border border-indigo-150 p-4 rounded text-xs select-none space-y-1.5">
                <p className="font-mono text-[9px] text-indigo-750 uppercase tracking-widest font-bold leading-none">REMITTANCE SUMMARY</p>
                <p className="font-serif text-slate-800">
                  You are clearing <b>{getSelectedDosCount()} outstanding tax invoices</b>.
                </p>
                <div className="flex justify-between items-center pt-1 border-t border-indigo-200/60 font-mono">
                  <span className="font-bold">Total Settling Weighed Tons:</span>
                  <span className="font-black text-stone-900">{calculateSelectedTotalTons().toFixed(2)} MT</span>
                </div>
                <div className="flex justify-between items-center pt-1 font-mono">
                  <span className="font-black text-indigo-900">Aggregate Net Freight Value:</span>
                  <span className="font-black text-indigo-700 text-sm">Rs. {calculateSelectedTotalAmount().toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono font-mono">Paying Corporate Entity <span className="text-red-500">*</span></label>
                <select
                  value={payingCompanyId}
                  onChange={(e) => setPayingCompanyId(e.target.value)}
                  className="w-full text-xs py-2 px-2 border border-[#D1D1CF] bg-white font-serif font-bold italic focus:outline-hidden"
                  required
                >
                  {companies.map(co => (
                    <option key={co.id} value={co.id}>{co.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Payment Date <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-[#D1D1CF] focus:outline-hidden font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Payout Mode</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full text-xs py-2 px-2 border border-[#D1D1CF] bg-white font-mono focus:outline-hidden font-bold"
                  >
                    <option value="NEFT">NEFT (Bank Transfer)</option>
                    <option value="RTGS">RTGS (Large Value)</option>
                    <option value="IMPS">IMPS Immediate Pay</option>
                    <option value="Cheque">Original physical paper Cheque</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">UTR Reference # / Transaction ID / Cheque # <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="e.g. UTR-HDFCR-202619024"
                  value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value)}
                  className="w-full text-xs px-3.5 py-2 border border-[#D1D1CF] focus:outline-hidden font-mono text-[#E65100] font-bold uppercase"
                  required
                />
              </div>

              {/* GST rate & Compliance Setup */}
              <div className="bg-amber-50/65 border border-amber-200 p-4 space-y-3">
                <p className="font-mono text-[9px] text-amber-800 uppercase tracking-widest font-black leading-none">GST TAX COMPLIANCE CONVENIENT SETTING</p>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1 font-mono">Applicable GST Rate (%)</label>
                    <select
                      value={transporterGstRate}
                      onChange={(e) => setTransporterGstRate(Number(e.target.value))}
                      className="w-full text-xs py-1.5 px-2 border border-[#D1D1CF] bg-white font-mono focus:outline-hidden"
                    >
                      <option value="12">12% Forward Charge GST</option>
                      <option value="5">5% Reverse Charge / Road GST</option>
                      <option value="0">0% Exempted / Nil Rated GST</option>
                    </select>
                  </div>
                  
                  <div className="flex flex-col justify-end">
                    <span className="text-[10px] text-stone-500 font-mono block leading-none">
                      Calculated GST Portion:
                    </span>
                    <span className="text-xs font-mono font-extrabold text-[#E65100] mt-1 block">
                      ₹ {(calculateSelectedTotalAmount() * (transporterGstRate / 100)).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <div className="border-t border-amber-200/50 pt-2.5">
                  <label className="flex items-start space-x-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={carrierGstCompliant}
                      onChange={(e) => setCarrierGstCompliant(e.target.checked)}
                      className="h-4 w-4 bg-emerald-600 border-[#D1D1CF] focus:ring-emerald-500 mt-0.5 rounded-none"
                    />
                    <div className="text-[11px] leading-tight">
                      <span className="font-bold text-stone-900 block">Carrier is active & compliant with GST department</span>
                      {carrierGstCompliant ? (
                        <span className="text-[10px] text-emerald-750 font-semibold block mt-1">
                          ✔ Paid and included in remittance. Ready to disburse <b>₹ {(calculateSelectedTotalAmount() * (1 + transporterGstRate / 100)).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</b>.
                        </span>
                      ) : (
                        <span className="text-[10px] text-red-700 font-semibold block mt-1">
                          ⚠ <b>GST portion held back!</b> Disbursing only base freight amount (<b>₹ {calculateSelectedTotalAmount().toLocaleString('en-IN', { maximumFractionDigits: 2 })}</b>). Will pay held GST later once carrier file reports are verified.
                        </span>
                      )}
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono font-mono">Remittance Settlement memo / Notes</label>
                <textarea
                  placeholder="Memo details for accounts audit logs..."
                  rows={2}
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full text-xs px-3.5 py-2 border border-[#D1D1CF] focus:outline-hidden font-sans font-medium text-slate-705"
                />
              </div>

              {/* Clearance and Simulation Disclaimer */}
              <div className="bg-[#F9F8F6] border border-[#D1D1CF] p-3 text-[10.5px] leading-relaxed text-slate-500 font-serif italic">
                <span>By clearing this payment, you confirm that physical or digitally verified tax invoices have been received in match with certified weighbridge receipts.</span>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 border border-[#D1D1CF] text-xs font-serif italic focus:outline-hidden"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-650 bg-indigo-600 hover:bg-black text-white text-xs uppercase tracking-wider font-bold rounded-none transition-colors cursor-pointer"
                >
                  Authorize Remittance
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* RELEASE WITHELD GST MODAL */}
      {releasingPayment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto print:hidden">
          <div className="bg-white rounded-none border-2 border-black shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-stone-200 bg-[#F4F4F1] flex justify-between items-center shrink-0">
              <h3 className="font-serif font-black italic text-stone-850 text-xs uppercase tracking-wider">
                Release Withheld GST Portion
              </h3>
              <button
                type="button"
                className="text-stone-400 hover:text-black font-mono text-xs uppercase"
                onClick={() => setReleasingPayment(null)}
              >
                Close [X]
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!gstReleaseRefInput.trim()) {
                  alert('Please enter a release UTR reference number.');
                  return;
                }
                const updatedPayment: TransporterPayment = {
                  ...releasingPayment,
                  gstWithheldStatus: 'Released',
                  gstReleaseRef: gstReleaseRefInput,
                  gstReleaseDate: gstReleaseDateInput,
                  amountPaid: (releasingPayment.amountPaid || 0) + (releasingPayment.gstAmount || 0), // Include released GST in total paid amount
                };
                onUpdatePayment(updatedPayment);
                setReleasingPayment(null);
                setGstReleaseRefInput('');
              }}
              className="p-6 space-y-4 text-xs text-stone-700"
            >
              <div className="bg-emerald-50 border border-emerald-200 p-4 text-[11px] space-y-1.5 rounded-none text-emerald-950">
                <p className="font-mono font-extrabold uppercase text-[9.5px] leading-tight select-none text-emerald-800">TAX DISBURSAL RECONCILIATION SUMMARY</p>
                <p className="font-serif italic font-medium">Releasing the previously withheld GST portion of <b>{getTransporterName(releasingPayment.transporterId)}</b> post tax compliance clearance.</p>
                <div className="flex justify-between font-mono pt-1.5 mt-1 border-t border-emerald-200/50">
                  <span>Withheld GST Amount:</span>
                  <strong className="font-extrabold text-[#E65100]">₹ {releasingPayment.gstAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1 font-mono">GST Release Disbursal Date <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  value={gstReleaseDateInput}
                  onChange={(e) => setGstReleaseDateInput(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-[#D1D1CF] focus:outline-hidden font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1 font-mono font-mono">Disbursal Ref No / UTR Transaction ID <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="e.g. UTR-GSTREL-202619024"
                  value={gstReleaseRefInput}
                  onChange={(e) => setGstReleaseRefInput(e.target.value)}
                  className="w-full text-xs px-3.5 py-2 border border-[#D1D1CF] focus:outline-hidden font-mono text-[#E65100] font-bold uppercase"
                  required
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setReleasingPayment(null)}
                  className="px-4 py-2 border border-[#D1D1CF] text-xs font-serif italic focus:outline-hidden"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-black text-white text-xs uppercase tracking-wider font-bold rounded-none transition-colors cursor-pointer"
                >
                  Confirm GST Released
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAILED PRINTABLE REMITTANCE ADVICE MODAL SPECIFICALLY OPTIMIZED FOR SYSTEM PDF EXPORT */}
      {advicePayment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-none border-2 border-black shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]">
            
            {/* Header block hidden during OS print triggers */}
            <div className="px-6 py-4 border-b border-[#D1D1CF] bg-[#F4F4F1] flex justify-between items-center shrink-0 print:hidden">
              <div className="flex items-center space-x-2">
                <Award className="h-5 w-5 text-indigo-600" />
                <h3 className="font-serif font-bold italic text-slate-900 text-sm">
                  Transporter Remittance Settlement Advice - Generated Document
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setAdvicePayment(null)}
                className="p-1 px-2 border border-black hover:bg-neutral-200 text-xs font-mono uppercase bg-white cursor-pointer"
              >
                Close [X]
              </button>
            </div>

            {/* PREVIEW CONTAINER - USES CUSTOM PRINT-CONTAINER HOOKS */}
            <div className="p-8 md:p-12 overflow-y-auto flex-1 font-serif text-[#1a1a1a] print-container print:overflow-visible print:p-0 print:m-0" id="transporter-print-sheet">
              
              {/* Header Letterhead */}
              <div className="border-b-4 border-[#1a1a1a] pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-xl md:text-2xl font-black uppercase text-slate-900 tracking-tight leading-none font-serif">
                    {getCompany(advicePayment.paidByCompanyId)?.name || 'TSG IMPEX INDIA PRIVATE LTD'}
                  </h2>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-[#E65100] mt-1 font-mono">
                    Bulk Materials & industrial logistics Service Providers
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1 max-w-sm leading-tight italic font-serif text-slate-500">
                    {getCompany(advicePayment.paidByCompanyId)?.address || 'SCF-24, Sector 7-C, Madhya Marg, Chandigarh - 160019'}
                  </p>
                </div>
                <div className="text-right sm:text-right text-xs shrink-0 font-mono">
                  <span className="block font-black text-slate-900 uppercase">TRANSPORTER REMITTANCE SLIP</span>
                  <span>Document Ref No: <b>{advicePayment.referenceNo}</b></span><br />
                  <span>Issued Date: <b>{advicePayment.paymentDate}</b></span>
                </div>
              </div>

              {/* Sender/Recipient Info split */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8 text-xs font-serif leading-relaxed">
                <div className="bg-[#F4F4F1]/30 p-4 border border-[#D1D1CF]">
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">ISSUED BY SENDER:</span>
                  <strong className="text-slate-900 block text-xs mt-1">{getCompany(advicePayment.paidByCompanyId)?.name}</strong>
                  <span>GSTIN Reg No: <b>{getCompany(advicePayment.paidByCompanyId)?.gstin || 'GSTIN unrecorded'}</b></span><br />
                  <span>Address: <b>{getCompany(advicePayment.paidByCompanyId)?.address}</b></span>
                </div>

                <div className="bg-indigo-50/15 p-4 border border-indigo-150">
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono text-indigo-750">PAYEE CARRIER DETAILS:</span>
                  <strong className="text-indigo-900 block text-xs mt-1">{getTransporterName(advicePayment.transporterId)}</strong>
                  <span>Transporter ID: <b>{advicePayment.transporterId}</b></span><br />
                  <span>GSTIN Reg No: <b>{transporters.find(t => t.id === advicePayment.transporterId)?.gstin || 'None Registered'}</b></span><br />
                  <span>Terminal Contact: <b>{transporters.find(t => t.id === advicePayment.transporterId)?.contactNo || 'N/A'}</b></span>
                </div>
              </div>

              {/* Payment details summary in bold display block */}
              <div className="mt-8 bg-zinc-900 text-white p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 rounded-none font-mono text-xs select-none">
                <div>
                  <span className="text-stone-400 text-[9px] block uppercase">TRANSACTION VALUE</span>
                  <strong className="text-base text-[#FFD54F]">Rs. {advicePayment.amountPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                </div>
                <div>
                  <span className="text-stone-400 text-[9px] block uppercase">SETTLEMENT METHOD</span>
                  <strong className="font-bold block uppercase text-white">{advicePayment.paymentMethod}</strong>
                </div>
                <div>
                  <span className="text-stone-400 text-[9px] block uppercase">UTR TRANSACTION ID</span>
                  <strong className="font-bold block uppercase text-emerald-400">{advicePayment.referenceNo}</strong>
                </div>
                <div>
                  <span className="text-stone-400 text-[9px] block uppercase">STATUS STATUS</span>
                  <strong className="text-emerald-400 block font-bold">● RECONCILED</strong>
                </div>
              </div>

              {/* Cleared Despatch Invoice breakdowns */}
              <div className="mt-8 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider font-mono border-b border-black pb-1.5 text-stone-850">
                  Schedule of Supporting Converted Despatch Invoices Clearance ({advicePayment.despatchOrderIds?.length || 0} Bills)
                </h4>
                
                <div className="border border-black overflow-hidden bg-white">
                  <table className="w-full text-left font-serif text-xs text-neutral-800">
                    <thead className="bg-[#F4F4F1] font-mono text-[9.5px] font-bold border-b border-black">
                      <tr>
                        <th className="px-4 py-2">Movement DO #</th>
                        <th className="px-4 py-2 text-center">Tax Invoice ID</th>
                        <th className="px-4 py-2 text-center">Weighed Net tons</th>
                        <th className="px-4 py-2 text-right">Freight Rate / MT</th>
                        <th className="px-4 py-2 text-right">Calculated Freight Charges</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200 font-sans">
                      {advicePayment.despatchOrderIds?.map(id => {
                        const order = dos.find(d => d.id === id);
                        if (!order) return null;
                        const tons = order.receivedWeight || order.loadedWeight || 0;
                        const sumCharge = tons * order.transporterRate;
                        
                        return (
                          <tr key={id} className="text-[11px] font-medium leading-relaxed">
                            <td className="px-4 py-3 font-serif">
                              <strong className="block text-slate-900">{order.doNumber}</strong>
                              <span className="text-[9.5px] text-slate-450 font-mono">Date: {order.date} | Vehicle: {order.vehicleNumber}</span>
                            </td>

                            <td className="px-4 py-3 text-center font-mono font-bold text-slate-800">
                              {order.invoiceNo || 'N/A'}
                            </td>

                            <td className="px-4 py-3 text-center font-mono">
                              {tons.toFixed(2)} MT
                            </td>

                            <td className="px-4 py-3 text-right font-mono">
                              Rs. {order.transporterRate.toFixed(2)}
                            </td>

                            <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                              Rs. {sumCharge.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-slate-100 font-mono font-bold border-t border-black text-[11px]">
                      <tr>
                        <td colSpan={2} className="px-4 py-3 text-left uppercase">Aggregate Sum Total:</td>
                        <td className="px-4 py-3 text-center">
                          {advicePayment.despatchOrderIds?.reduce((sum, id) => {
                            const o = dos.find(d => d.id === id);
                            return sum + (o ? (o.receivedWeight || o.loadedWeight || 0) : 0);
                          }, 0).toFixed(2)} MT
                        </td>
                        <td></td>
                        <td className="px-4 py-3 text-right text-indigo-700 text-xs">
                          Rs. {advicePayment.amountPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Memo block */}
              <div className="mt-8 border-t border-[#D1D1CF] pt-6 font-serif block text-xs leading-relaxed text-[#1a1a1a]">
                <span className="block font-mono text-[9px] font-bold text-slate-400 uppercase tracking-widest">PAYMENT MEMO NOTES:</span>
                <p className="mt-1 text-slate-700 italic">
                  {advicePayment.notes || 'No custom audit ledger notes provided.'}
                </p>
              </div>

              {/* Signature stamp blocks with spacing */}
              <div className="mt-16 grid grid-cols-2 gap-12 font-serif text-center text-xs select-none">
                <div className="border-t border-black pt-2 max-w-xs mx-auto w-full">
                  <span className="block font-mono text-[9px] font-bold text-slate-400 uppercase tracking-widest">PREPARED BY (Auditor)</span>
                  <span className="block text-slate-805 font-bold italic mt-1 font-serif">{currentUser?.name || '(System Terminal)'}</span>
                </div>
                <div className="border-t border-black pt-2 max-w-xs mx-auto w-full">
                  <span className="block font-mono text-[9px] font-bold text-slate-400 uppercase tracking-widest">AUTHORIZED signatory</span>
                  <span className="block text-slate-400 italic mt-3 font-mono text-[10px]">TSG ERP Digital Seal</span>
                </div>
              </div>

            </div>

            {/* Print trigger utilities bar */}
            <div className="px-6 py-4 bg-slate-50 border-t border-[#D1D1CF] flex justify-end space-x-3 shrink-0 print:hidden">
              <button
                type="button"
                onClick={() => setAdvicePayment(null)}
                className="px-4 py-2 border border-[#D1D1CF] text-xs font-serif font-black hover:bg-slate-100 cursor-pointer"
              >
                Close Preview
              </button>
              
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center space-x-2 px-5 py-2.5 bg-[#E65100] hover:bg-black text-white text-xs font-serif font-bold italic transition-colors cursor-pointer"
              >
                <Printer className="h-4 w-4 shrink-0" />
                <span>Print Remittance Slip / Save PDF</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
