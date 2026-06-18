import React, { useRef } from 'react';
import { DespatchOrder, PurchaseOrder, Company, Vendor, Transporter, Agent, SourceLocation } from '../types';
import { getCommissionLogic } from '../data';
import { Printer, X, Download, ShieldCheck, FileText, CheckCircle } from 'lucide-react';
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
}: ChallanModalProps) {
  const printAreaRef = useRef<HTMLDivElement>(null);

  const math = po ? getCommissionLogic(po.vendorRate, doItem.transporterRate, doItem.receivedWeight) : null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div id="challan-modal" className="fixed inset-0 bg-neutral-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-none border-2 border-black shadow-2xl max-w-4xl w-full flex flex-col max-h-[95vh]">
        
        {/* Header Action Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#D1D1CF] bg-[#F9F8F6] rounded-none no-print">
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-[#E65100]" />
            <span className="font-serif font-bold italic text-base text-slate-800">Despatch Order Challan & Delivery Slip</span>
            <span className="text-[10px] uppercase font-mono px-2.5 py-0.5 bg-[#1A1A1A] text-white rounded-none font-bold">
              {doItem.doNumber}
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <button
              id="print-challan-btn"
              onClick={handlePrint}
              className="flex items-center space-x-2 px-5 py-2 bg-[#E65100] hover:bg-black text-white text-xs font-serif italic transition-colors font-medium cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              <span>Print to PDF</span>
            </button>
            <button
              id="close-challan-btn"
              onClick={onClose}
              className="p-1 px-2.5 bg-white text-black hover:bg-neutral-100 text-xs transition-colors border border-black cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Scrollable document viewport */}
        <div className="p-6 overflow-y-auto bg-neutral-100 flex justify-center">
          
          {/* Printable Sheet */}
          <div 
            ref={printAreaRef}
            className="print-container w-full bg-white p-8 md:p-12 shadow-xs rounded-none border border-[#D1D1CF] text-[#1A1A1A] text-sm max-w-[800px] leading-relaxed relative font-sans"
            style={{ minHeight: '297mm' }} /* standard A4 ratio roughly */
          >
            {/* Watermark status */}
            <div className="absolute right-10 top-12 opacity-15 pointer-events-none border-4 border-[#E65100] text-[#E65100] px-4 py-1 rounded-none text-xl font-bold uppercase tracking-widest rotate-12">
              {doItem.status === 'Delivered' ? 'DELIVERED & VERIFIED' : doItem.status}
            </div>

            {/* Top Company Header (Orchestrator) */}
            <div className="border-b-2 border-black pb-6 mb-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-start space-x-4">
                  <TSGLogo size={56} className="border-2 border-black shadow-xs shrink-0" />
                  <div>
                    <h1 className="text-xl font-serif font-bold italic text-neutral-900 leading-tight">
                      {company?.name || 'Sardar Infrastructure & Minerals Ltd'}
                    </h1>
                    <p className="text-xs text-[#E65100] font-sans font-bold uppercase tracking-wider mt-0.5">
                      The Fly Ash People
                    </p>
                    <p className="text-[11px] text-[#888884] mt-1 max-w-sm font-sans leading-normal">
                      {company?.address || 'SCF-24, Sector 7-C, Madhya Marg, Chandigarh - 160019'}
                    </p>
                    {company?.gstin && (
                      <p className="text-xs font-mono text-neutral-700 mt-1 uppercase font-bold">
                        GSTIN: {company.gstin}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-4 md:mt-0 text-left md:text-right font-mono bg-[#F9F8F6] p-4 border border-[#D1D1CF] shrink-0">
                  <p className="text-[9px] uppercase tracking-wider text-[#888884] font-bold">Challan Document</p>
                  <p className="text-lg font-serif italic text-[#E65100] font-bold">{doItem.doNumber}</p>
                  <p className="text-xs text-neutral-800 font-bold mt-1">Date: {doItem.date}</p>
                </div>
              </div>
            </div>

            {/* Document Subtitle / Details */}
            <div className="text-center py-1.5 bg-[#1A1A1A] text-white font-serif italic text-xs mb-6 uppercase tracking-widest">
              Despatch Challan &bull; Bulkers of Industrial Minerals (Fly Ash / GGBS / Micro Silica)
            </div>

            {/* Two-Column Parties Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6 pb-6 border-b border-[#D1D1CF]">
              {/* Left Column: Vendor & Plants */}
              <div>
                <span className="text-[10px] uppercase tracking-wider text-[#888884] font-bold">Consignee / Deliver to:</span>
                <div className="mt-1">
                  <h3 className="font-serif font-bold italic text-neutral-900 text-lg">{vendor?.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{vendor?.address}</p>
                  <div className="mt-4 bg-[#F9F8F6] p-3 border border-[#D1D1CF]">
                    <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wide block">Unloading Site / Plant Camp:</span>
                    <span className="text-sm font-serif italic font-semibold text-black">{doItem.vendorPlant}</span>
                  </div>
                  {doItem.sourceId && (() => {
                    const src = sources.find(s => s.id === doItem.sourceId);
                    if (!src) return null;
                    return (
                      <div className="mt-3 bg-amber-50/40 p-3 border border-amber-200/60 rounded-xs">
                        <span className="text-[10px] uppercase font-bold text-[#E65100] tracking-wide block leading-none">Point of Origin Loading Source:</span>
                        <span className="text-sm font-serif italic font-semibold text-[#E65100] block mt-1">📍 {src.name}</span>
                        <span className="text-[10px] font-mono text-stone-600 block mt-0.5">Physical Pincode: {src.pincode}</span>
                      </div>
                    );
                  })()}
                  {vendor?.gstin && (
                    <p className="text-xs font-mono text-neutral-700 mt-2 uppercase font-bold">
                      Consignee GSTIN: {vendor.gstin}
                    </p>
                  )}
                </div>
              </div>

              {/* Right Column: Key Contract References */}
              <div>
                <span className="text-[10px] uppercase tracking-wider text-[#888884] font-bold">Contract Details:</span>
                <div className="mt-1 space-y-2 font-sans text-xs">
                  <div className="flex justify-between py-1 border-b border-[#F4F4F1]">
                    <span className="text-[#888884]">Purchase Order No:</span>
                    <span className="font-bold text-black font-mono">{po?.poNumber}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#F4F4F1]">
                    <span className="text-[#888884]">Material Commodity:</span>
                    <span className="font-serif italic font-bold text-[#E65100]">{po?.material}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#F4F4F1]">
                    <span className="text-[#888884]">Vendor Rate/MT:</span>
                    <span className="font-mono font-bold text-right">₹ {po?.vendorRate.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#F4F4F1]">
                    <span className="text-[#888884]">Agent Represented:</span>
                    <span className="font-serif italic font-bold text-slate-800">
                      {agent ? agent.name : 'Direct Delivery (None)'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Transport & Vehicle Details Block */}
            <div className="bg-[#F9F8F6] border border-[#D1D1CF] p-4 mb-6">
              <span className="text-[10px] uppercase tracking-wider text-[#888884] font-bold block mb-2">Logistics vehicle & carrier details:</span>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <p className="text-[#888884] uppercase text-[9px] font-semibold">Transporter Name</p>
                  <p className="font-serif italic font-bold text-[#1A1A1A] mt-0.5">{transporter?.name}</p>
                </div>
                <div>
                  <p className="text-[#888884] uppercase text-[9px] font-semibold">Bulker Vehicle No</p>
                  <p className="font-mono font-bold text-[#E65100] bg-white border border-[#D1D1CF] px-2 py-0.5 text-sm inline-block mt-0.5">
                    {doItem.vehicleNumber}
                  </p>
                </div>
                <div>
                  <p className="text-[#888884] uppercase text-[9px] font-semibold">Driver Name</p>
                  <p className="font-bold text-slate-800 mt-0.5">{doItem.driverName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[#888884] uppercase text-[9px] font-semibold">Driver Contact No</p>
                  <p className="font-mono font-semibold text-slate-800 mt-0.5">{doItem.driverPhone || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Product & Weight Quantity Segment */}
            <div className="border border-black overflow-hidden mb-6">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#1A1A1A] text-white text-[10px] uppercase tracking-widest font-bold">
                    <th className="p-3">Material Description</th>
                    <th className="p-3 text-right">Source Weight (MT)</th>
                    <th className="p-3 text-right">Received Weight (MT)</th>
                    <th className="p-3 text-right">Transit Loss (MT)</th>
                    <th className="p-3 text-right">Compliance / Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D1D1CF]">
                  <tr className="text-xs md:text-sm">
                    <td className="p-3">
                      <span className="font-serif italic font-bold block text-[#1A1A1A] text-base">{po?.material} Cementitious</span>
                      <span className="text-[#888884] text-[11px] block">Supplied in pressurized dust bulker transports</span>
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-[#1A1A1A]">
                      {doItem.loadedWeight !== null ? doItem.loadedWeight.toFixed(3) : 'N/A'}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-[#E65100] bg-[#F9F8F6]">
                      {doItem.receivedWeight !== null ? `${doItem.receivedWeight.toFixed(3)}` : 'Pending Weigh'}
                    </td>
                    <td className="p-3 text-right font-mono text-neutral-600">
                      {doItem.receivedWeight !== null && doItem.loadedWeight !== null
                        ? `${Math.max(0, doItem.loadedWeight - doItem.receivedWeight).toFixed(3)}` 
                        : 'On Delivery'}
                    </td>
                    <td className="p-3 text-right">
                      {doItem.status === 'Delivered' ? (
                        <span className="inline-flex items-center text-[10px] uppercase font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 border border-emerald-200">
                          <CheckCircle className="h-3 w-3 mr-1 inline text-emerald-700" /> Received
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-[10px] uppercase font-bold text-[#E65100] bg-orange-50 px-2.5 py-1 border border-[#E65100]/20">
                          Transit
                        </span>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Calculations and Business Margin transparency */}
            {math && doItem.receivedWeight !== null && (
              <div className="bg-[#F9F8F6] border border-[#D1D1CF] p-4 mb-6">
                <span className="text-[10px] uppercase tracking-wider text-[#888884] font-bold block mb-2">Commercial Summary (For Internal Accounting Only):</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-xs divide-y divide-[#D1D1CF] md:divide-y-0 text-neutral-800">
                  <div className="space-y-1.5 pt-2">
                    <div className="flex justify-between">
                      <span className="text-[#888884]">Consignee Contract Rate:</span>
                      <strong className="text-black">₹ {po?.vendorRate.toFixed(2)}/MT</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#888884]">Transporter Bulk Rate:</span>
                      <strong className="text-black">₹ {doItem.transporterRate.toFixed(2)}/MT</strong>
                    </div>
                    <div className="flex justify-between border-t border-dashed border-[#D1D1CF] pt-1">
                      <span className="text-[#E65100] font-bold">Gross Spread / MT:</span>
                      <strong className="text-[#E65100] font-bold font-mono">₹ {math.profitPerMT.toFixed(2)}/MT</strong>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2 md:border-l md:border-[#D1D1CF] md:pl-8">
                    <div className="flex justify-between">
                      <span className="text-[#888884]">Broker Commission Share:</span>
                      <span className="font-serif italic font-bold">{math.commissionPercentage}% of spread</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#888884]">Commission per MT:</span>
                      <strong className="text-black">₹ {math.commissionPerMT.toFixed(2)}/MT</strong>
                    </div>
                    <div className="flex justify-between text-neutral-900 border-t border-[#F4F4F1] pt-1">
                      <span>Total Broker Fee Paid:</span>
                      <strong className="font-bold text-[#E65100] font-mono">₹ {math.totalCommission.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</strong>
                    </div>
                    <div className="flex justify-between border-t border-black pt-1.5 text-neutral-900">
                      <span className="font-bold">Net Company Earnings:</span>
                      <strong className="font-bold font-mono text-[13px] text-emerald-800">₹ {math.netCompanyProfit.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Remarks Footnote */}
            {doItem.remarks && (
              <div className="mb-10 text-xs text-neutral-700">
                <span className="font-serif italic font-bold text-neutral-900 block">General Instructions / Consignee Notes:</span>
                <p className="mt-1 italic border-l-2 border-[#E65100] pl-3 py-0.5 font-serif text-[#1A1A1A]">"{doItem.remarks}"</p>
              </div>
            )}

            {/* Signature Area */}
            <div className="mt-14 pt-10 border-t border-[#D1D1CF]">
              <div className="grid grid-cols-3 gap-6 text-center text-[11px] text-slate-500">
                <div>
                  <div className="h-10"></div>
                  <div className="border-t border-slate-400 pt-2 font-medium text-[#1A1A1A]">Authorized Carrier Despatcher</div>
                  <div className="text-[9px] text-[#888884] uppercase tracking-wider">{company?.name || 'Sardar Infra Ltd.'}</div>
                </div>
                <div>
                  <div className="h-10"></div>
                  <div className="border-t border-slate-400 pt-2 font-mono font-bold text-[#E65100]">
                    {doItem.vehicleNumber}
                  </div>
                  <div className="text-[9px] text-[#888884] mt-1 uppercase tracking-wider">Bulker Driver Signature</div>
                </div>
                <div>
                  <div className="h-10"></div>
                  <div className="border-t border-slate-400 pt-2 font-medium text-[#1A1A1A]">Receiver Stamp & Sign</div>
                  <div className="text-[9px] text-[#888884] uppercase tracking-wider">{vendor?.name.split(' ')[0]} Site Agent</div>
                </div>
              </div>
            </div>

            {/* Attached Proof of Delivery (POD) Document */}
            {doItem.deliveryDocUrl && (
              <div className="mt-8 p-4 bg-emerald-50/50 border border-emerald-200 rounded-none no-print">
                <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider block mb-2 flex items-center">
                  <CheckCircle className="h-3 w-3 mr-1 inline" /> Verified Proof of Delivery (POD) Attached
                </span>
                <div className="flex items-center justify-between text-xs text-emerald-950 font-mono p-2 bg-emerald-50 border border-emerald-100">
                  <span className="truncate max-w-[400px]">{doItem.deliveryDocName || 'proof_of_delivery_challan.pdf'}</span>
                  <a
                    href={doItem.deliveryDocUrl}
                    download={doItem.deliveryDocName || 'POD_document'}
                    className="px-3 py-1 bg-emerald-700 text-white font-sans hover:bg-emerald-800 text-[10px] uppercase tracking-wider font-bold transition-colors cursor-pointer"
                  >
                    Download File
                  </a>
                </div>
              </div>
            )}

            {/* Document Verification Footer */}
            <div className="mt-12 text-center text-[9px] text-neutral-400 border-t border-[#F4F4F1] pt-4 font-mono">
              TSG Impex India Pvt Ltd &bull; Integrated Billing &bull; Decarbonized Fly-Ash logistics systems &bull; Locked ledger
            </div>

          </div>

        </div>

        {/* Footer info/controls */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#D1D1CF] bg-[#F9F8F6] rounded-none no-print text-xs text-neutral-800">
          <span className="font-serif italic">Tip: Use <b>Print to PDF</b> to download/save to local storage as high-fidelity PDF.</span>
          <button
            onClick={onClose}
            className="px-5 py-2 hover:bg-neutral-900 border border-black text-black hover:text-white rounded-none font-serif italic text-xs transition-colors cursor-pointer"
          >
            Close Viewer
          </button>
        </div>

      </div>
    </div>
  );
}
