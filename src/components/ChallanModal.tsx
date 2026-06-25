import React, { useRef, useState, useEffect, useMemo } from 'react';
import { DespatchOrder, PurchaseOrder, Company, Vendor, Transporter, Agent, SourceLocation, Product } from '../types';
import { getCommissionLogic } from '../data';
import { Printer, X, FileText, CheckCircle, MessageSquare, Send, Copy, Check, Search, Download } from 'lucide-react';
import TSGLogo from './TSGLogo';

interface ChallanModalProps {
  doItem: DespatchOrder;
  po: PurchaseOrder | undefined;
  company: Company | undefined;
  vendor: Vendor | undefined;
  transporter: Transporter | undefined;
  agent: Agent | undefined;
  onClose: () => void;
  sources?: SourceLocation[];
  products?: Product[];
  vendorsList?: Vendor[];
  transportersList?: Transporter[];
  agentsList?: Agent[];
}

export default function ChallanModal({
  doItem,
  po,
  company,
  vendor,
  transporter,
  agent,
  onClose,
  sources = [],
  products = [],
  vendorsList = [],
  transportersList = [],
  agentsList = [],
}: ChallanModalProps) {
  const printAreaRef = useRef<HTMLDivElement>(null);
  const [showWhatsapp, setShowWhatsapp] = useState(false);
  const [whatsappPhone, setWhatsappPhone] = useState(doItem.driverPhone || '');
  const [whatsappMessage, setWhatsappMessage] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [contactSearch, setContactSearch] = useState('');

  // Auto-fill WhatsApp Phone when DO is updated
  useEffect(() => {
    if (doItem.driverPhone) {
      setWhatsappPhone(doItem.driverPhone);
    }
  }, [doItem.driverPhone]);

  // Build the compiled contacts list for WhatsApp searching
  const allContacts = useMemo(() => {
    const list: { name: string; phone: string; role: string; label: string }[] = [];
    const addedNumbers = new Set<string>();

    const add = (name: string, phone: string | undefined, role: string, label: string) => {
      if (!phone) return;
      const clean = phone.replace(/[^0-9]/g, '');
      if (!clean || clean.length < 5) return;
      if (addedNumbers.has(clean)) return;
      addedNumbers.add(clean);
      list.push({ name, phone, role, label });
    };

    // 1. Core Related Contacts
    if (doItem.driverPhone) {
      add(doItem.driverName || 'Driver', doItem.driverPhone, 'Driver', `Driver (Vehicle ${doItem.vehicleNumber})`);
    }
    if (transporter) {
      add(transporter.name, transporter.contactNo, 'Transporter', 'Transporter (Linked)');
    }
    if (vendor) {
      add(vendor.name, vendor.contactNo, 'Consignee', 'Consignee (Linked)');
    }
    if (agent) {
      add(agent.name, agent.contactNo, 'Agent', 'Agent Broker (Linked)');
    }
    if (company) {
      add(company.name, company.contactNo, 'Company', 'Billing Co');
    }

    // 2. Global Contacts Lists
    if (transportersList) {
      transportersList.forEach(t => {
        add(t.name, t.contactNo, 'Transporter', 'Transporter');
      });
    }
    if (vendorsList) {
      vendorsList.forEach(v => {
        add(v.name, v.contactNo, 'Consignee', 'Consignee');
      });
    }
    if (agentsList) {
      agentsList.forEach(a => {
        add(a.name, a.contactNo, 'Agent', 'Agent Broker');
      });
    }

    return list;
  }, [doItem, transporter, vendor, agent, company, transportersList, vendorsList, agentsList]);

  // Filter Contacts based on active search
  const filteredContacts = useMemo(() => {
    if (!contactSearch.trim()) return allContacts.slice(0, 5); // Show first 5 (related) by default
    const q = contactSearch.toLowerCase();
    return allContacts.filter(c => 
      c.name.toLowerCase().includes(q) || 
      c.phone.toLowerCase().includes(q) || 
      c.role.toLowerCase().includes(q) ||
      c.label.toLowerCase().includes(q)
    );
  }, [allContacts, contactSearch]);

  const matchedProduct = products.find(p => p.name.toLowerCase() === po?.material?.toLowerCase());
  const hsnCode = matchedProduct?.hsnCode || '382499';
  const productGst = matchedProduct?.gstRate !== undefined ? matchedProduct.gstRate : 18;

  const math = po ? getCommissionLogic(po.vendorRate, doItem.transporterRate, doItem.receivedWeight) : null;

  const handlePrint = () => {
    window.print();
  };

  const handleExportHTML = () => {
    const printElement = printAreaRef.current;
    if (!printElement) return;

    // Create a deep copy clone of the element to physically strip .no-print sections completely
    const clone = printElement.cloneNode(true) as HTMLElement;
    const noPrintItems = clone.querySelectorAll('.no-print');
    noPrintItems.forEach(el => el.remove());

    const cleanHtmlContent = clone.innerHTML;

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Despatch Challan - ${doItem.doNumber}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm;
    }
    body {
      background-color: #f3f4f6;
      font-family: 'Inter', sans-serif;
      padding: 2rem 1rem;
    }
    .print-ready-card {
      background-color: #ffffff;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      border: 1px solid #e5e7eb;
      max-width: 800px;
      margin: 0 auto;
      padding: 0;
    }
    .print-ready-card > div {
      box-shadow: none !important;
      border: none !important;
    }
    .page-break {
      margin-top: 2rem;
      margin-bottom: 2rem;
      border-top: 2px dashed #9ca3af;
      padding-top: 1.5rem;
    }
    @media print {
      @page {
        size: A4 portrait;
        margin: 8mm 10mm 8mm 10mm;
      }
      body {
        background-color: #ffffff !important;
        padding: 0 !important;
        margin: 0 !important;
      }
      .no-print {
        display: none !important;
      }
      .print-ready-card {
        box-shadow: none !important;
        border: none !important;
        padding: 0 !important;
        margin: 0 !important;
        max-width: 100% !important;
        width: 100% !important;
      }
      .page-break {
        page-break-before: always !important;
        break-before: page !important;
        margin: 0 !important;
        padding: 0 !important;
        border: none !important;
        height: 0 !important;
      }
    }
  </style>
</head>
<body>
  
  <div class="no-print max-w-[800px] mx-auto mb-6 bg-slate-900 text-white rounded-xl p-4 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-xl border border-slate-800">
    <div class="flex items-center space-x-3">
      <span class="bg-[#E65100] text-white px-3 py-1 text-xs font-black uppercase font-mono tracking-wider rounded">Challan Copy</span>
      <div class="text-xs sm:text-sm font-semibold text-slate-100">Self-contained print file. Save to PDF instantly!</div>
    </div>
    <button onclick="window.print()" class="bg-[#E65100] text-white font-bold text-xs px-5 py-2.5 rounded-lg hover:bg-amber-600 transition-all cursor-pointer shadow-md focus:outline-none">
      🖨️ Open Print Window & Save PDF
    </button>
  </div>

  <div class="print-ready-card">
    ${cleanHtmlContent}
  </div>

  <script>
    // Automatically trigger print dialog
    setTimeout(() => {
      window.print();
    }, 500);
  </script>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Despatch_Challan_${doItem.doNumber.replace(/[^a-zA-Z0-9]/g, '_')}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Compile the WhatsApp Message content
  const generateWhatsappMessage = () => {
    const materialCom = po?.material || 'Cementitious Material';
    const statusLabel = doItem.status === 'Delivered' ? '✅ DELIVERED & VERIFIED' : '🚚 IN TRANSIT';
    const loadingPoint = sources.find(s => s.id === doItem.sourceId)?.name || 'N/A';
    
    return `*TSG IMPEX INDIA PVT LTD*
*DESPATCH CHALLAN SLIP*
----------------------------------------
*DO Number:* ${doItem.doNumber}
*Date:* ${doItem.date}
*Status:* ${statusLabel}
----------------------------------------
*Material:* ${materialCom}
*Vehicle No:* ${doItem.vehicleNumber}
*Driver:* ${doItem.driverName || 'N/A'} (${doItem.driverPhone || 'N/A'})

*Origin Source:* ${loadingPoint}
*Unloading Site:* ${doItem.vendorPlant}
*Consignee Name:* ${vendor?.name || 'N/A'}

*Loaded Tonnage:* ${doItem.loadedWeight !== null ? `${doItem.loadedWeight.toFixed(3)} MT` : 'N/A'}
*Weighbridge Recv:* ${doItem.receivedWeight !== null ? `${doItem.receivedWeight.toFixed(3)} MT` : 'Pending Weigh'}
*Transit Loss:* ${doItem.loadedWeight !== null && doItem.receivedWeight !== null ? `${Math.max(0, doItem.loadedWeight - doItem.receivedWeight).toFixed(3)} MT` : 'N/A'}

*Remarks:* ${doItem.remarks || 'None'}
----------------------------------------
_Dispatched via TSG Logistics Ledger Sync_`;
  };

  useEffect(() => {
    setWhatsappMessage(generateWhatsappMessage());
  }, [doItem, po, company, vendor, sources]);

  const handleCopyText = () => {
    navigator.clipboard.writeText(whatsappMessage);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleOpenWhatsapp = () => {
    let cleanPhone = whatsappPhone.replace(/[^0-9]/g, '');
    if (cleanPhone.length === 10) {
      cleanPhone = '91' + cleanPhone; // auto-prepend India country code
    }
    const encoded = encodeURIComponent(whatsappMessage);
    window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank');
  };

  // Dry render of the actual DO Challan sheet content (avoiding duplicating 100s of lines)
  const renderSingleDoCopy = (copyType: 'ORIGINAL' | 'DUPLICATE') => {
    return (
      <div className="bg-white text-xs sm:text-sm leading-normal p-4 sm:p-6 print:p-2 border border-neutral-200 print:border-none print:shadow-none relative">
        
        {/* Copy Indicator Band */}
        <div className="flex justify-between items-center bg-[#F9F8F6] border border-[#D1D1CF] px-3 py-1 mb-3 print:mb-2 text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-600 print:py-0.5">
          <span>Despatch Challan Transit Slip &bull; Copy of DO</span>
          <span className={`px-2.5 py-0.5 border ${copyType === 'ORIGINAL' ? 'bg-amber-50 text-amber-800 border-amber-300' : 'bg-indigo-50 text-indigo-800 border-indigo-300'}`}>
            {copyType === 'ORIGINAL' ? 'ORIGINAL FOR RECIPIENT' : 'DUPLICATE FOR CARRIER'}
          </span>
        </div>

        {/* Watermark Status Stamp */}
        <div className="absolute right-10 top-14 opacity-15 pointer-events-none border-4 border-[#E65100] text-[#E65100] px-4 py-1 rounded-none text-sm font-bold uppercase tracking-widest rotate-12 print:top-10">
          {doItem.status === 'Delivered' ? 'DELIVERED & VERIFIED' : doItem.status}
        </div>

        {/* Top Header Grid */}
        <div className="border-b-2 border-black pb-3 mb-3 print:pb-2 print:mb-2">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-start space-x-3">
              <TSGLogo size={40} className="border border-black shadow-xs shrink-0 print:h-9 print:w-9" />
              <div>
                <h1 className="text-base sm:text-lg font-serif font-bold italic text-neutral-900 leading-tight">
                  {company?.name || 'TSG Group'}
                </h1>
                <p className="text-[10px] text-[#E65100] font-sans font-bold uppercase tracking-wider mt-0.5 print:text-[8px] print:mt-0">
                  The Fly Ash People
                </p>
                <p className="text-[10px] text-[#888884] mt-0.5 max-w-sm font-sans leading-normal print:text-[8px] print:mt-0">
                  {company?.address || 'SCF-24, Sector 7-C, Madhya Marg, Chandigarh - 160019'}
                </p>
                {company?.gstin && (
                  <p className="text-[9px] font-mono text-neutral-700 mt-0.5 uppercase font-bold print:text-[8px]">
                    GSTIN: {company.gstin}
                  </p>
                )}
              </div>
            </div>
            
            <div className="text-left md:text-right font-mono bg-[#F9F8F6] p-2.5 border border-[#D1D1CF] shrink-0 text-xs print:p-1.5 print:text-[9px]">
              <p className="text-[9px] print:text-[8px] uppercase tracking-wider text-[#888884] font-bold">Transit Challan No.</p>
              <p className="text-sm font-serif italic text-[#E65100] font-bold">{doItem.doNumber}</p>
              <p className="text-[9px] text-neutral-800 font-bold mt-0.5">Date: {doItem.date}</p>
            </div>
          </div>
        </div>

        {/* Core Subtitle Banner */}
        <div className="text-center py-1 bg-[#1A1A1A] text-white font-serif italic text-[10px] sm:text-xs mb-3 print:mb-2 uppercase tracking-widest leading-none">
          Industrial Mineral Logistics Dispatch slip &bull; Fly Ash / GGBS / Micro Silica
        </div>

        {/* Consignee and Contracts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:gap-2 mb-3 print:mb-2 pb-3 print:pb-2 border-b border-[#D1D1CF]">
          <div>
            <span className="text-[9px] uppercase tracking-wider text-[#888884] font-bold">Consignee Deliver To:</span>
            <div className="mt-0.5">
              <h3 className="font-serif font-bold italic text-neutral-900 text-sm sm:text-base print:text-xs">{vendor?.name}</h3>
              <p className="text-xs print:text-[9.5px] text-slate-500">{vendor?.address}</p>
              
              <div className="mt-2 bg-[#F9F8F6] p-1.5 border border-[#D1D1CF] text-xs print:p-1 print:mt-1">
                <span className="text-[9px] print:text-[8px] uppercase font-bold text-neutral-500 tracking-wide block">Unloading Plant Site / Camp:</span>
                <span className="font-serif italic font-semibold text-black print:text-xs">{doItem.vendorPlant}</span>
              </div>
              
              {doItem.sourceId && (() => {
                const src = sources.find(s => s.id === doItem.sourceId);
                if (!src) return null;
                return (
                  <div className="mt-2 bg-amber-50/40 p-2 border border-amber-200/60 rounded-xs text-xs print:p-1 print:mt-1">
                    <span className="text-[9px] print:text-[8px] uppercase font-bold text-[#E65100] tracking-wide block leading-none">Loading Point / Material Source:</span>
                    <span className="font-serif italic font-semibold text-[#E65100] block mt-0.5 print:text-xs">📍 {src.name}</span>
                    <span className="text-[9px] print:text-[8px] font-mono text-stone-500 block">Pincode: {src.pincode}</span>
                  </div>
                );
              })()}
              {vendor?.gstin && (
                <p className="text-[9px] font-mono text-neutral-600 mt-1 uppercase font-bold print:text-[8px]">
                  Consignee GSTIN: {vendor.gstin}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1 text-xs print:space-y-0.5 print:text-[9.5px]">
            <span className="text-[9px] uppercase tracking-wider text-[#888884] font-bold block mb-1">Contract Reference Details:</span>
            <div className="flex justify-between py-0.5 border-b border-[#F4F4F1]">
              <span className="text-[#888884]">Contract PO No:</span>
              <span className="font-bold text-black font-mono">{po?.poNumber}</span>
            </div>
            <div className="flex justify-between py-0.5 border-b border-[#F4F4F1]">
              <span className="text-[#888884]">Commodity:</span>
              <span className="font-serif italic font-bold text-[#E65100]">{po?.material}</span>
            </div>
            <div className="flex justify-between py-0.5 border-b border-[#F4F4F1]">
              <span className="text-[#888884]">HSN Code Classification:</span>
              <span className="font-mono font-bold text-blue-800 bg-blue-50 px-1 py-0.5 rounded-none print:py-0 print:px-0.5">{hsnCode}</span>
            </div>
            <div className="flex justify-between py-0.5 border-b border-[#F4F4F1]">
              <span className="text-[#888884]">Applicable GST Rate:</span>
              <span className="font-mono font-bold text-slate-800">{productGst}% GST Chargeable</span>
            </div>
            {agent && (
              <div className="flex justify-between py-0.5 border-b border-[#F4F4F1]">
                <span className="text-[#888884]">Commission Broker Agent:</span>
                <span className="font-serif italic font-bold text-slate-800">{agent.name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Carrier Transportation block */}
        <div className="bg-[#F9F8F6] border border-[#D1D1CF] p-3 print:p-2 mb-3 print:mb-2 text-xs print:text-[9.5px]">
          <span className="text-[9px] print:text-[8px] uppercase tracking-wider text-[#888884] font-bold block mb-1 print:mb-0.5">Transit vehicle & transporter parameters:</span>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:gap-2">
            <div>
              <p className="text-[#888884] uppercase text-[9px] print:text-[8px] font-bold">Logistics Fleet Carrier</p>
              <p className="font-serif italic font-bold text-[#1A1A1A] mt-0.5 print:text-xs">{transporter?.name}</p>
            </div>
            <div>
              <p className="text-[#888884] uppercase text-[9px] print:text-[8px] font-bold">Pressurized Bulker No.</p>
              <p className="font-mono font-bold text-[#E65100] bg-white border border-[#D1D1CF] px-2 py-0.5 text-xs inline-block mt-0.5 uppercase print:px-1 print:py-0 print:text-xs">
                {doItem.vehicleNumber}
              </p>
            </div>
            <div>
              <p className="text-[#888884] uppercase text-[9px] print:text-[8px] font-bold">Authorized Driver</p>
              <p className="font-bold text-slate-800 mt-0.5 print:text-xs">{doItem.driverName || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[#888884] uppercase text-[9px] print:text-[8px] font-bold">Driver Phone Contact</p>
              <p className="font-mono font-semibold text-slate-800 mt-0.5 print:text-xs">{doItem.driverPhone || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Material Tonnage table */}
        <div className="border border-black overflow-hidden mb-3 print:mb-2">
          <table className="w-full text-left border-collapse text-xs print:text-[9.5px]">
            <thead>
              <tr className="bg-[#1A1A1A] text-white text-[9px] print:text-[8px] uppercase tracking-wider font-bold">
                <th className="p-2 sm:p-2.5 print:p-1.5">Material Description</th>
                <th className="p-2 sm:p-2.5 print:p-1.5 text-right">Source Weight (MT)</th>
                <th className="p-2 sm:p-2.5 print:p-1.5 text-right">Received Tonnage (MT)</th>
                <th className="p-2 sm:p-2.5 print:p-1.5 text-right">Transit Loss (MT)</th>
                <th className="p-2 sm:p-2.5 print:p-1.5 text-right">Verification Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D1D1CF]">
              <tr>
                <td className="p-2 sm:p-2.5 print:p-1.5">
                  <span className="font-serif italic font-bold block text-[#1A1A1A] text-xs sm:text-sm print:text-xs">{po?.material} Mineral Bulk</span>
                  <span className="text-[#888884] text-[10px] print:text-[8.5px] block font-sans">Dust-free specialized transit &bull; GST rate: {productGst}% &bull; HSN: {hsnCode}</span>
                </td>
                <td className="p-2 sm:p-2.5 print:p-1.5 text-right font-mono font-bold text-[#1A1A1A]">
                  {doItem.loadedWeight !== null ? doItem.loadedWeight.toFixed(3) : 'N/A'}
                </td>
                <td className="p-2 sm:p-2.5 print:p-1.5 text-right font-mono font-bold text-[#E65100] bg-[#F9F8F6]">
                  {doItem.receivedWeight !== null ? `${doItem.receivedWeight.toFixed(3)}` : 'On Route / Weigh Pending'}
                </td>
                <td className="p-2 sm:p-2.5 print:p-1.5 text-right font-mono text-neutral-600">
                  {doItem.receivedWeight !== null && doItem.loadedWeight !== null
                    ? `${Math.max(0, doItem.loadedWeight - doItem.receivedWeight).toFixed(3)}` 
                    : '--'}
                </td>
                <td className="p-2 sm:p-2.5 print:p-1.5 text-right">
                  {doItem.status === 'Delivered' ? (
                    <span className="inline-flex items-center text-[9px] print:text-[8px] uppercase font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 border border-emerald-200">
                      Ref: Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-[9px] print:text-[8px] uppercase font-bold text-[#E65100] bg-orange-50 px-2 py-0.5 border border-[#E65100]/20">
                      In-Transit
                    </span>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Accounting spread calculations (Internal section) */}
        {math && doItem.receivedWeight !== null && (
          <div className="bg-[#F9F8F6] border border-[#D1D1CF] p-3 mb-3 text-xs no-print">
            <span className="text-[9px] uppercase tracking-wider text-[#888884] font-bold block mb-1">Commercial Billing Summary (Accounting Verification):</span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 divide-y divide-[#D1D1CF] md:divide-y-0 text-neutral-850">
              <div className="space-y-1 py-1 flex flex-col justify-center">
                <div className="flex justify-between">
                  <span className="text-[#888884]">Consignee Contract:</span>
                  <strong className="text-black">₹ {po?.vendorRate.toFixed(2)}/MT</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#888884]">Carrier Fleet Rate:</span>
                  <strong className="text-black">₹ {doItem.transporterRate.toFixed(2)}/MT</strong>
                </div>
                <div className="flex justify-between border-t border-dashed border-[#D1D1CF] pt-1 mt-1">
                  <span className="text-[#E65100] font-semibold">Tonnage Split Spread:</span>
                  <strong className="text-[#E65100] font-mono">₹ {math.profitPerMT.toFixed(2)}/MT</strong>
                </div>
              </div>

              <div className="space-y-1 py-1 md:border-l md:border-[#D1D1CF] md:pl-6 flex flex-col justify-center">
                <div className="flex justify-between">
                  <span className="text-[#888884]">Agent Broker Fee:</span>
                  <span className="font-serif italic font-bold">{math.commissionPercentage}% of split</span>
                </div>
                <div className="flex justify-between text-neutral-900 border-t border-[#F4F4F1] pt-1">
                  <span>Calculated Outlay:</span>
                  <strong className="font-bold text-[#E65100] font-mono">₹ {math.totalCommission.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</strong>
                </div>
                <div className="flex justify-between border-t border-black pt-1">
                  <span className="font-bold">Net Cleared Earnings:</span>
                  <strong className="font-bold font-mono text-emerald-800">₹ {math.netCompanyProfit.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</strong>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Remarks and Instructions */}
        {doItem.remarks && (
          <div className="mb-4 print:mb-2 text-xs text-stone-700">
            <span className="font-serif italic font-bold text-neutral-900 block print:text-[10px]">Dispatch General Directives:</span>
            <p className="mt-0.5 italic border-l border-[#E65100] pl-2 py-0.5 text-stone-950 font-serif print:text-[10px]">"{doItem.remarks}"</p>
          </div>
        )}

        {/* Signatures */}
        <div className="mt-6 print:mt-3 pt-4 print:pt-2 border-t border-[#D1D1CF]">
          <div className="grid grid-cols-3 gap-4 text-center text-[10px] print:text-[8.5px] text-slate-500">
            <div>
              <div className="h-6 print:h-4"></div>
              <p className="border-t border-slate-300 pt-1 font-medium text-[#1A1A1A]">Authorized Consignor Seal</p>
              <p className="text-[8px] print:text-[7.5px] text-[#888884] uppercase tracking-wide">{company?.name || 'TSG Impex'}</p>
            </div>
            <div>
              <div className="h-6 print:h-4"></div>
              <p className="border-t border-slate-300 pt-1 font-mono font-bold text-[#E65100]">{doItem.vehicleNumber}</p>
              <p className="text-[8px] print:text-[7.5px] text-[#888884] mt-0.5 uppercase tracking-wide">Bulker Driver Checkpost Sign</p>
            </div>
            <div>
              <div className="h-6 print:h-4"></div>
              <p className="border-t border-slate-300 pt-1 font-medium text-[#1A1A1A]">Consignee Receiver Stamp</p>
              <p className="text-[8px] print:text-[7.5px] text-[#888884] uppercase tracking-wide">{vendor?.name.split(' ')[0]} Site Agent</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div id="challan-modal" className="fixed inset-0 bg-neutral-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-none border-2 border-black shadow-2xl max-w-4xl w-full flex flex-col max-h-[96vh]">
        
        {/* Actions Header Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between p-3.5 sm:px-6 sm:py-4 border-b border-[#D1D1CF] bg-[#F9F8F6] rounded-none no-print gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-[#E65100] shrink-0" />
              <span className="text-[10px] uppercase font-mono px-2.5 py-0.5 bg-[#E65100] text-white rounded-none font-bold shrink-0">
                {doItem.doNumber}
              </span>
            </div>
            <h2 className="font-serif font-bold italic text-sm sm:text-base text-slate-800 leading-tight">
              Print Despatch Challan Slips (2 Copies Required)
            </h2>
          </div>
          
          <div className="flex items-center gap-2 w-full md:w-auto self-end md:self-auto justify-end">
            {/* WhatsApp toggle button */}
            <button
              onClick={() => setShowWhatsapp(!showWhatsapp)}
              className={`flex items-center justify-center space-x-1.5 px-3 py-2 text-xs font-serif italic transition-all font-medium border border-emerald-600 rounded-none cursor-pointer flex-1 md:flex-initial text-center ${
                showWhatsapp ? 'bg-emerald-700 text-white' : 'bg-white text-emerald-800 hover:bg-emerald-50'
              }`}
            >
              <MessageSquare className="h-4 w-4 shrink-0" />
              <span className="whitespace-nowrap">Share WhatsApp</span>
            </button>

            {/* Print trigger */}
            <button
              id="print-challan-btn"
              onClick={handlePrint}
              className="flex items-center justify-center space-x-1.5 px-3 py-2 bg-neutral-900 hover:bg-black text-white text-xs font-serif italic transition-colors font-medium border border-black cursor-pointer shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none flex-1 md:flex-initial text-center"
              title="Prints directly from this browser window"
            >
              <Printer className="h-4 w-4 shrink-0" />
              <span className="whitespace-nowrap">Print Direct</span>
            </button>

            {/* Offline Export PDF Download trigger */}
            <button
              id="export-challan-btn"
              onClick={handleExportHTML}
              className="flex items-center justify-center space-x-1.5 px-3 py-2 bg-[#E65100] hover:bg-black text-white text-xs font-serif italic transition-colors font-medium border border-black cursor-pointer shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none flex-1 md:flex-initial text-center"
              title="Highly recommended if browser printing is blocked by sandbox: downloads clean A4 printable HTML page"
            >
              <Download className="h-4 w-4 shrink-0" />
              <span className="whitespace-nowrap">Export & Save PDF</span>
            </button>
            
            <button
              id="close-challan-btn"
              onClick={onClose}
              className="p-2 bg-white text-black hover:bg-neutral-100 text-xs transition-colors border border-black cursor-pointer shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Dynamic Sandbox IFrame Warning */}
        <div className="no-print bg-amber-50 border-b-2 border-amber-200 px-5 py-4 text-xs text-amber-950 font-sans shrink-0 select-none space-y-2">
          <div className="flex items-center gap-2">
            <span className="bg-amber-600 text-white font-black text-[10px] px-2 py-0.5 rounded shadow-xs">⚠️ CRITICAL: PDF PRINT GUIDE</span>
            <span className="font-bold font-serif italic text-amber-900 text-sm">Action Needed for Sandbox Users:</span>
          </div>
          <p className="leading-relaxed">
            Inside the safe AI Studio preview container, browsers block the system print popup and downloads by default. 
            To print/export this Despatch Challan to PDF successfully:
          </p>
          <ol className="list-decimal pl-5 space-y-1.5 font-medium text-stone-800">
            <li>Click the <strong className="text-blue-700 bg-blue-100/50 px-1.5 py-0.5 border border-blue-200 rounded">"Open in a new tab" (↗)</strong> button at the bottom-right corner of your screen.</li>
            <li>In the new tab, click the dispatch slip to open this Challan modal.</li>
            <li>Click either <strong className="text-neutral-900 bg-white border border-stone-200 px-1.5 py-0.5 rounded">Print Direct</strong> or <strong className="text-[#E65100] bg-white border border-stone-200 px-1.5 py-0.5 rounded">Export & Save PDF</strong>.</li>
            <li>The print layout will open instantly, allowing you to choose <strong>"Save as PDF"</strong> or print!</li>
          </ol>
        </div>

        {/* WhatsApp Sharing Drawer/Section */}
        {showWhatsapp && (
          <div className="no-print bg-emerald-50/90 border-b border-emerald-200 p-5 space-y-4 animate-fade-in">
            <h3 className="text-emerald-950 font-serif font-bold italic text-sm flex items-center justify-between gap-1.5">
              <span className="flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4 text-emerald-700" />
                WhatsApp Share Assistant &bull; Bulker Carrier Dispatch Data
              </span>
              <span className="text-[9px] font-mono font-bold uppercase text-emerald-800 bg-white/70 border border-emerald-200 px-2 py-0.5">
                Ledger Contacts Engine Loaded
              </span>
            </h3>
            
            {/* Step-by-step PDF Instructions Container */}
            <div className="bg-white/80 p-3.5 border border-emerald-200 space-y-1.5 text-xs text-emerald-950 font-serif leading-relaxed">
              <div className="flex items-center space-x-1.5 text-emerald-800 font-bold mb-1 font-sans">
                <CheckCircle className="h-4 w-4 text-emerald-700" />
                <span>How to attach and send PDF Challan on WhatsApp:</span>
              </div>
              <ol className="list-decimal pl-4 space-y-1 text-[11px] leading-relaxed">
                <li>Click <strong>"Print to PDF"</strong> at the top right to download/save this dispatch slip as a PDF on your device.</li>
                <li>Search or select the contact from our system ledger directory on the right, or type the number below.</li>
                <li>Click <strong>"Send via WhatsApp"</strong> to open the chat window with the pre-filled detailed text slip.</li>
                <li>Inside WhatsApp, click the paperclip attachment icon and select the downloaded PDF file to send.</li>
              </ol>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Col 1: Recipient number & Actions */}
              <div className="space-y-3.5 md:col-span-1">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-emerald-800 mb-1">Recp Mobile (e.g. 9876543210)</label>
                  <div className="flex">
                    <span className="inline-flex items-center px-2.5 border border-r-0 border-emerald-300 bg-emerald-100 text-xs font-mono text-emerald-800 font-bold">
                      +91
                    </span>
                    <input
                      type="tel"
                      placeholder="Recipient No"
                      value={whatsappPhone}
                      onChange={(e) => setWhatsappPhone(e.target.value)}
                      className="flex-1 min-w-0 px-3 py-1.5 border border-emerald-300 focus:outline-[#1B5E20] text-xs bg-white text-neutral-800 font-semibold"
                    />
                  </div>
                  <p className="text-[10px] text-emerald-700/80 mt-1">Pre-filled dynamically based on recipient choice.</p>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={handleOpenWhatsapp}
                    className="w-full flex items-center justify-center space-x-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-serif italic transition-colors font-bold cursor-pointer uppercase tracking-wider border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Send via WhatsApp</span>
                  </button>
                  
                  <button
                    onClick={handleCopyText}
                    className="w-full flex items-center justify-center space-x-1.5 px-4 py-2 border border-emerald-600 bg-white hover:bg-emerald-50 text-emerald-800 text-xs font-serif italic transition-all font-bold cursor-pointer"
                  >
                    {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-700 font-black" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{isCopied ? 'Copied to Clipboard!' : 'Copy Text Cargo Slip'}</span>
                  </button>
                </div>
              </div>

              {/* Col 2: Search Contacts from Ledger */}
              <div className="space-y-1.5 md:col-span-1 border-t md:border-t-0 md:border-l md:border-r border-emerald-200/50 pt-3 md:pt-0 pl-0 md:pl-4 pr-0 md:pr-4">
                <label className="block text-[10px] uppercase font-bold text-emerald-800 mb-1">
                  Search Ledger Contacts
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Type name, partner or number..."
                    value={contactSearch}
                    onChange={(e) => setContactSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 border border-emerald-300 focus:outline-[#1B5E20] text-xs bg-white text-neutral-800 font-semibold mb-2"
                  />
                  <Search className="absolute left-2.5 top-2.5 h-3 w-3 text-emerald-600" />
                </div>
                <div className="max-h-[140px] overflow-y-auto border border-emerald-250 bg-white/70 divide-y divide-emerald-100 rounded-none shadow-xs">
                  {filteredContacts.length === 0 ? (
                    <p className="text-[10px] text-stone-500 italic p-3 text-center">No contacts matched</p>
                  ) : (
                    filteredContacts.map((c, idx) => {
                      const isActive = whatsappPhone.replace(/[^0-9]/g, '') === c.phone.replace(/[^0-9]/g, '');
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setWhatsappPhone(c.phone);
                          }}
                          className={`w-full text-left p-2 hover:bg-emerald-50 transition-colors flex justify-between items-center cursor-pointer ${
                            isActive
                              ? 'bg-emerald-100 border-l-2 border-emerald-600'
                              : ''
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <p className="text-[11px] font-bold text-neutral-800 truncate leading-none mb-1">
                              {c.name}
                            </p>
                            <p className="text-[9px] text-[#E65100] font-sans font-medium uppercase tracking-wider leading-none">
                              {c.label}
                            </p>
                          </div>
                          <p className="text-[11px] font-mono font-bold text-slate-700 shrink-0">
                            {c.phone}
                          </p>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Col 3: Message Text Preview */}
              <div className="space-y-1.5 md:col-span-1 pt-3 md:pt-0">
                <label className="block text-[10px] uppercase font-bold text-emerald-800 mb-1">Cargo Slip Message Preview</label>
                <textarea
                  rows={6}
                  readOnly
                  value={whatsappMessage}
                  className="w-full px-3 py-2 text-[11px] font-mono bg-white border border-emerald-200 outline-hidden tracking-normal leading-relaxed text-slate-800 rounded-none resize-none h-[180px] shadow-xs"
                />
              </div>
            </div>
          </div>
        )}

        {/* Scrollable Viewport */}
        <div className="p-6 overflow-y-auto bg-neutral-100 flex flex-col items-center gap-6">
          
          {/* Main Printable Block */}
          <div 
            ref={printAreaRef}
            className="print-container w-full max-w-[800px] flex flex-col gap-10"
          >
            
            {/* Copy 1: ORIGINAL COPY */}
            <div className="bg-white shadow-md relative">
              {renderSingleDoCopy('ORIGINAL')}
            </div>

            {/* Separator for page breaks */}
            <div className="no-print flex items-center justify-center py-2">
              <span className="w-full border-t border-dashed border-stone-400"></span>
              <span className="whitespace-nowrap px-4 font-mono text-[10px] font-bold text-stone-500 uppercase tracking-widest bg-neutral-100">
                📄 END OF ORIGINAL &mdash; START OF DUPLICATE
              </span>
              <span className="w-full border-t border-dashed border-stone-400"></span>
            </div>
            
            <div className="page-break"></div>

            {/* Copy 2: DUPLICATE COPY */}
            <div className="bg-white shadow-md relative">
              {renderSingleDoCopy('DUPLICATE')}
            </div>

          </div>

        </div>

        {/* Action Bottom utility footer */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-6 py-4 border-t border-[#D1D1CF] bg-[#F9F8F6] rounded-none no-print text-xs text-neutral-800">
          <p className="font-serif italic font-medium flex items-start gap-1">
            <span>💡</span> <span>Both <b>Consignee Original</b> &amp; <b>Carrier Duplicate</b> are generated. Use <b>Print to PDF</b> to save/print.</span>
          </p>
          <button
            onClick={onClose}
            className="text-center px-5 py-2 hover:bg-neutral-900 border border-black text-black hover:text-white rounded-none font-serif italic text-xs transition-colors cursor-pointer shrink-0"
          >
            Close Viewer
          </button>
        </div>

      </div>
    </div>
  );
}
