import React, { useState } from 'react';
import { Agent, DespatchOrder, PurchaseOrder, Company, Vendor, AgentPayment } from '../types';
import { getCommissionLogic } from '../data';
import { 
  DollarSign, 
  Plus, 
  Trash2, 
  Calendar, 
  Building, 
  FileText, 
  ArrowRight, 
  Users, 
  TrendingUp, 
  Clock, 
  Award, 
  ClipboardList, 
  Download, 
  Printer, 
  Search, 
  Layers, 
  CheckCircle,
  X,
  AlertCircle
} from 'lucide-react';

interface CommissionLedgerProps {
  agents: Agent[];
  dos: DespatchOrder[];
  pos: PurchaseOrder[];
  companies: Company[];
  vendors: Vendor[];
  payments: AgentPayment[];
  currentUser: { role: string; rights: { manageLedger: boolean } } | null;
  onAddPayment: (payout: Omit<AgentPayment, 'id' | 'createdAt'>) => void;
  onDeletePayment: (id: string) => void;
  onBack?: () => void;
}

export default function CommissionLedger({
  agents,
  dos,
  pos,
  companies,
  vendors,
  payments,
  currentUser,
  onAddPayment,
  onDeletePayment,
  onBack,
}: CommissionLedgerProps) {
  const [selectedAgentId, setSelectedAgentId] = useState<string>('all');
  const [payoutModalOpen, setPayoutModalOpen] = useState(false);
  const [advicePayment, setAdvicePayment] = useState<AgentPayment | null>(null);

  // Filter & Form States
  const [paymentAgentId, setPaymentAgentId] = useState('');
  const [paymentYear, setPaymentYear] = useState(new Date().getFullYear());
  const [paymentMonth, setPaymentMonth] = useState('June');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().substring(0, 10));
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentCompanyId, setPaymentCompanyId] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Delete confirmation
  const [payoutToDeleteId, setPayoutToDeleteId] = useState<string | null>(null);

  // DEVELOPMENT STAGE BYPASS: Lift all security restrictions for managing commission ledger
  const canManageLedger = true;

  // Months lists
  const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Map DO date to month name & year
  const getDoMonthYear = (dateStr: string) => {
    try {
      const dt = new Date(dateStr);
      if (isNaN(dt.getTime())) return { monthName: 'Unknown', yearVal: 2026, key: 'Unknown-2026' };
      const mName = MONTHS[dt.getMonth()];
      const yVal = dt.getFullYear();
      return { monthName: mName, yearVal: yVal, key: `${mName} ${yVal}` };
    } catch {
      return { monthName: 'Unknown', yearVal: 2026, key: 'Unknown-2026' };
    }
  };

  // 1. Calculate All Earned Commissions for delivered DOs
  const deliveredDos = dos.filter(d => d.status === 'Delivered' && d.agentId);

  const calculatedCommissions = deliveredDos.map(d => {
    const po = pos.find(p => p.id === d.poId);
    const agent = agents.find(a => a.id === d.agentId);
    const vendor = po ? vendors.find(v => v.id === po.vendorId) : undefined;
    const { monthName, yearVal, key: monthYearKey } = getDoMonthYear(d.date);

    let commPercentage = 0;
    let commPerMT = 0;
    let totalCommission = 0;
    let profitPerMT = 0;

    if (po) {
      const math = getCommissionLogic(po.vendorRate, d.transporterRate, d.receivedWeight);
      commPercentage = math.commissionPercentage;
      commPerMT = math.commissionPerMT;
      totalCommission = math.totalCommission;
      profitPerMT = math.profitPerMT;
    }

    return {
      doItem: d,
      po,
      agent,
      vendor,
      monthName,
      yearVal,
      monthYearKey,
      profitPerMT,
      commPercentage,
      commPerMT,
      totalCommission,
    };
  });

  // Filter commissions for selected agent if not 'all'
  const selectedAgentCommissions = selectedAgentId === 'all'
    ? calculatedCommissions
    : calculatedCommissions.filter(c => c.agent?.id === selectedAgentId);

  // Grouped by Agent Name logic
  const groupings: Record<string, {
    agentId: string;
    agentName: string;
    agent?: Agent;
    entries: typeof selectedAgentCommissions;
    totalWeight: number;
    totalCommission: number;
  }> = {};

  selectedAgentCommissions.forEach(item => {
    const aId = item.agent?.id || 'direct-deliveries';
    const aName = item.agent?.name || 'Local Direct Deliveries';

    if (!groupings[aId]) {
      groupings[aId] = {
        agentId: aId,
        agentName: aName,
        agent: item.agent,
        entries: [],
        totalWeight: 0,
        totalCommission: 0,
      };
    }

    groupings[aId].entries.push(item);
    groupings[aId].totalWeight += (item.doItem.receivedWeight || 0);
    groupings[aId].totalCommission += item.totalCommission;
  });

  const flattenedGroupings = Object.values(groupings);

  // Total Summary stats
  const totalEarned = selectedAgentCommissions.reduce((sum, item) => sum + item.totalCommission, 0);
  const agentPayments = selectedAgentId === 'all'
    ? payments
    : payments.filter(p => p.agentId === selectedAgentId);
  const totalPaid = agentPayments.reduce((sum, p) => sum + p.amountPaid, 0);
  
  const balanceOutstanding = selectedAgentId === 'all'
    ? Object.values(groupings).reduce((sum, group) => {
        const paysForAgent = payments.filter(p => p.agentId === group.agentId);
        const agentPaidAmt = paysForAgent.reduce((pSum, p) => pSum + p.amountPaid, 0);
        return sum + Math.max(0, group.totalCommission - agentPaidAmt);
      }, 0)
    : Math.max(0, totalEarned - totalPaid);

  const selectedAgent = selectedAgentId === 'all' ? undefined : agents.find(a => a.id === selectedAgentId);

  const handleOpenPayoutModal = (agentId?: string, suggestedAmt?: number, customNotes?: string) => {
    if (!canManageLedger) return;
    setPaymentAgentId(agentId || (selectedAgentId !== 'all' ? selectedAgentId : '') || (agents[0]?.id || ''));
    
    const d = new Date();
    setPaymentMonth(MONTHS[d.getMonth()]);
    setPaymentYear(d.getFullYear());

    if (suggestedAmt) {
      setPaymentAmount(suggestedAmt.toFixed(2));
    } else {
      setPaymentAmount('');
    }
    setPaymentCompanyId(companies[0]?.id || '');
    setPaymentNotes(customNotes || '');
    setPaymentReference('');
    setPayoutModalOpen(true);
  };

  const handleCreatePayoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentAgentId) {
      alert('Please select an agent.');
      return;
    }
    if (!paymentAmount || isNaN(Number(paymentAmount)) || Number(paymentAmount) <= 0) {
      alert('Please enter a valid payout amount.');
      return;
    }
    if (!paymentCompanyId) {
      alert('Please choose the issuing company.');
      return;
    }
    if (!paymentReference.trim()) {
      alert('Please enter transaction reference no (e.g. UPI ID or IMPS code).');
      return;
    }

    onAddPayment({
      agentId: paymentAgentId,
      year: Number(paymentYear),
      month: paymentMonth,
      paymentDate,
      amountPaid: Number(paymentAmount),
      referenceNo: paymentReference.trim(),
      paidByCompanyId: paymentCompanyId,
      notes: paymentNotes.trim()
    });

    setPayoutModalOpen(false);
  };

  // Simulated PDF or Print Friendly document
  const triggerPrintAdvice = () => {
    window.print();
  };

  return (
    <div id="commission-ledger" className="space-y-6 animate-fade-in print:bg-white print:p-0">
      
      {/* Hide controls during printing */}
      <div className="print:hidden">
        {onBack && (
          <div className="flex justify-start mb-4">
            <button
              onClick={onBack}
              className="inline-flex items-center space-x-2 px-4 py-2 border border-[#D1D1CF] hover:border-black bg-white hover:bg-[#F9F8F6] text-xs font-serif font-bold italic text-neutral-900 transition-colors cursor-pointer"
            >
              <span>← Back to Operations Home</span>
            </button>
          </div>
        )}

        {/* Detailed Section Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-[#D1D1CF] pb-4">
          <div>
            <h2 className="text-xl font-serif font-bold italic text-[#1A1A1A] flex items-center space-x-2">
              <Layers className="h-5 w-5 text-[#E65100]" />
              <span>Broker Commission Ledgers</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Group delivered transit movements month-wise & vendor-wise, audit active brokerage earnings, and record banking settlements.
            </p>
          </div>
          {canManageLedger ? (
            <button
              onClick={() => handleOpenPayoutModal()}
              className="flex items-center space-x-2 px-5 py-2.5 bg-[#E65100] hover:bg-black text-white text-xs uppercase tracking-wider font-bold rounded-none transition-colors cursor-pointer shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span>Record Commission Payout</span>
            </button>
          ) : (
            <span className="text-xs bg-amber-50 text-amber-700 px-3 py-1 border border-amber-200 uppercase font-mono font-bold tracking-tight">
              🔒 View Only Access
            </span>
          )}
        </div>

        {/* Agent selection & Quick statistics cards */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mt-6">
          <div className="bg-white border border-[#D1D1CF] p-4 flex flex-col justify-between">
            <div>
              <label className="block text-[10px] font-bold text-[#888884] uppercase tracking-wider mb-2">Select Active Transport Broker</label>
              <select
                value={selectedAgentId}
                onChange={(e) => setSelectedAgentId(e.target.value)}
                className="w-full text-sm py-2 px-3 border border-[#D1D1CF] focus:ring-0 focus:border-black focus:outline-hidden bg-white text-stone-900 font-bold font-serif italic"
              >
                {agents.length === 0 ? (
                  <option value="">No brokers registered</option>
                ) : (
                  <>
                    <option value="all">All Brokers / Agents</option>
                    {agents.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </>
                )}
              </select>
            </div>
            {selectedAgent ? (
              <div className="mt-4 border-t border-dashed border-[#D1D1CF] pt-3 text-xs leading-relaxed text-slate-500 font-medium">
                <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-bold">Broker Contacts:</span>
                Phone: <span className="text-neutral-800 font-semibold">{selectedAgent.contactNo || 'N/A'}</span><br />
                Email: <span className="text-neutral-800 font-semibold">{selectedAgent.email || 'N/A'}</span>
              </div>
            ) : (
              <div className="mt-4 border-t border-dashed border-[#D1D1CF] pt-3 text-xs leading-relaxed text-slate-500 font-medium">
                <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-bold">Central Overview:</span>
                Showing consolidated ledger profiles for all {agents.length} registered brokers and direct deliveries.
              </div>
            )}
          </div>

          <div className="bg-white border border-[#D1D1CF] p-5">
            <span className="text-[10px] uppercase tracking-wider text-[#888884] block font-bold">Total Brokerage Earned</span>
            <span className="text-2xl font-mono font-bold text-slate-900 mt-1 block">
              ₹ {Math.round(totalEarned).toLocaleString('en-IN')}
            </span>
            <div className="text-[10px] text-slate-400 mt-2 flex items-center">
              <Clock className="h-3.5 w-3.5 mr-1" />
              <span>Calculated on {selectedAgentCommissions.length} deliveries</span>
            </div>
          </div>

          <div className="bg-white border border-[#D1D1CF] p-5">
            <span className="text-[10px] uppercase tracking-wider text-[#888884] block font-bold">Total Commission Settled</span>
            <span className="text-2xl font-mono font-bold text-emerald-700 mt-1 block">
              ₹ {Math.round(totalPaid).toLocaleString('en-IN')}
            </span>
            <div className="text-[10px] text-emerald-600 mt-2 flex items-center font-semibold">
              <CheckCircle className="h-3.5 w-3.5 mr-1" />
              <span>{agentPayments.length} Bank payouts executed</span>
            </div>
          </div>

          <div className="bg-[#1A1A1A] text-white p-5">
            <span className="text-[10px] uppercase tracking-widest text-[#D1D1CF] block font-bold">Ledger Balance Owed</span>
            <span className="text-2xl font-mono font-bold text-[#E65100] mt-1 block">
              ₹ {Math.round(balanceOutstanding).toLocaleString('en-IN')}
            </span>
            <span className="text-[9px] text-stone-400 mt-2 block font-mono">
              CREDIT LEDGER STATUS: {balanceOutstanding > 0 ? 'PAYMENTS PENDING' : 'SETTLED / CLEARED'}
            </span>
          </div>
        </div>

        {/* LEDGER ENTRIES GROUPED BY AGENT NAME */}
        <div className="mt-8 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold uppercase text-slate-805 tracking-wider font-serif">
              Grouped Account Ledger (Grouped by Agent Name)
            </h3>
            <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded font-mono font-semibold">
              {flattenedGroupings.length} Active Ledger Segments
            </span>
          </div>

          {flattenedGroupings.length === 0 ? (
            <div className="bg-white p-12 border border-[#D1D1CF] text-center text-slate-400">
              <ClipboardList className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="font-bold font-serif italic text-stone-800">No delivered transport brokerages recorded</p>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                Commission ledgers generate automatically when you pair an agent broker with despatches on the 
                <b> "Despatch & Challan"</b> tab, update status to <b>"Delivered"</b>, and log the weighbridge received weight.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {flattenedGroupings.map((group, gIdx) => {
                const paysForGroup = payments.filter(
                  p => p.agentId === group.agentId
                );
                const groupedPaidAmt = paysForGroup.reduce((sum, p) => sum + p.amountPaid, 0);
                const groupOutstanding = Math.max(0, group.totalCommission - groupedPaidAmt);

                return (
                  <div key={`${group.agentId}-${gIdx}`} className="bg-white border border-[#D1D1CF] overflow-hidden">
                    {/* Segment Header */}
                    <div className="bg-slate-50 border-b border-[#D1D1CF] px-4 md:px-5 py-3 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-[#E65100] px-2 py-0.5 border border-[#E65100]/30 font-mono">
                            Broker Agent
                          </span>
                          <h4 className="text-xs font-black uppercase text-stone-900 tracking-tight">
                            {group.agentName}
                          </h4>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 font-medium font-mono">
                          RECORD COUNT: {group.entries.length} Deliveries | Cumulative volume: {group.totalWeight.toFixed(2)} MT
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 justify-end text-xs font-mono">
                        <div className="px-2 py-1 text-right">
                          <span className="block text-[8px] text-slate-400 font-mono font-bold leading-none">COMMISSION EARNED</span>
                          <strong className="text-slate-950 font-bold">₹{Math.round(group.totalCommission).toLocaleString('en-IN')}</strong>
                        </div>
                        <div className="px-2 py-1 text-right bg-emerald-50/20">
                          <span className="block text-[8px] text-slate-400 font-mono font-bold leading-none">SETTLED</span>
                          <strong className="text-emerald-700 font-bold">₹{Math.round(groupedPaidAmt).toLocaleString('en-IN')}</strong>
                        </div>
                        <div className="px-2 py-1 text-right bg-rose-50/20">
                          <span className="block text-[8px] text-slate-400 font-mono font-bold leading-none">OUTSTANDING</span>
                          <strong className="text-[#E65100] font-black">₹{Math.round(groupOutstanding).toLocaleString('en-IN')}</strong>
                        </div>

                        {canManageLedger && groupOutstanding > 0 && group.agentId !== 'direct-deliveries' && (
                          <button
                            type="button"
                            onClick={() => handleOpenPayoutModal(group.agentId, groupOutstanding, `Commission payout settlement for broker ${group.agentName}`)}
                            className="bg-[#1A1A1A] hover:bg-neutral-800 text-white font-sans font-bold text-[10px] uppercase tracking-wider px-2.5 py-1.5 leading-none transition-colors cursor-pointer border border-[#D1D1CF]"
                          >
                            Payout Agent
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Collapsible / Detailed Movement list inside segment */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left font-serif text-[11px] text-slate-600 border-none">
                        <thead className="bg-[#F9F8F6] text-[9px] font-bold text-slate-500 uppercase tracking-widest border-b border-[#D1D1CF] font-mono select-none">
                          <tr>
                            <th className="px-4 py-2">DO Number</th>
                            <th className="px-4 py-2">Vendor Name</th>
                            <th className="px-4 py-2">Date</th>
                            <th className="px-4 py-2">Weighed (MT)</th>
                            <th className="px-4 py-2">Vehicle</th>
                            <th className="px-4 py-2">Transporter Charge</th>
                            <th className="px-4 py-2">Spread (Profit/MT)</th>
                            <th className="px-4 py-2 text-right">Commission Rate</th>
                            <th className="px-4 py-2 text-right">Net Share (Rs.)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-sans font-medium text-slate-800">
                          {group.entries.map((entry, eIdx) => (
                            <tr key={`${entry.doItem.id}-${eIdx}`} className="hover:bg-slate-50/40">
                              <td className="px-4 py-2 font-mono font-bold text-slate-900">{entry.doItem.doNumber}</td>
                              <td className="px-4 py-2 text-xs font-semibold text-slate-700">{entry.vendor?.name || 'Local'}</td>
                              <td className="px-4 py-2 text-xs text-slate-400 font-mono">{entry.doItem.date}</td>
                              <td className="px-4 py-2 font-mono text-slate-705 font-bold">{(entry.doItem.receivedWeight || 0).toFixed(2)} MT</td>
                              <td className="px-4 py-2 font-mono text-[10px] text-slate-500">{entry.doItem.vehicleNumber}</td>
                              <td className="px-4 py-2 font-mono text-xs">Rs. {entry.doItem.transporterRate.toFixed(2)}/MT</td>
                              <td className="px-4 py-2 text-emerald-800 font-bold bg-emerald-50/5 font-mono">
                                Rs. {entry.profitPerMT.toFixed(2)}/MT
                              </td>
                              <td className="px-4 py-2 text-right font-mono text-indigo-700">
                                Rs. {entry.commPerMT.toFixed(2)}/MT ({entry.commPercentage}%)
                              </td>
                              <td className="px-4 py-2 text-right font-mono font-extrabold text-[#E65100]">
                                ₹ {entry.totalCommission.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* BANKING SETTLEMENT HISTORY */}
        <div className="mt-10 border-t border-[#D1D1CF] pt-8 space-y-4">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-bold uppercase text-slate-805 tracking-wider font-serif">
                Monthly Payout & Clearance History
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-none font-medium">Record of completed disbursements cleared to the transport broker's active accounts.</p>
            </div>
            <span className="text-xs bg-emerald-100 text-emerald-800 px-3 py-1 font-mono font-bold">
              ₹ {payments.reduce((sum, p) => sum + p.amountPaid, 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })} TOTAL PAID
            </span>
          </div>

          <div className="bg-white border border-[#D1D1CF] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left font-serif text-xs text-slate-700">
                <thead className="bg-[#1A1A1A] text-[10px] font-bold text-stone-200 uppercase tracking-widest font-mono select-none">
                  <tr>
                    <th className="px-4 py-3">Reference No</th>
                    <th className="px-4 py-3">Broker Agent</th>
                    <th className="px-4 py-3">Statement Limit</th>
                    <th className="px-4 py-3">Payment Date</th>
                    <th className="px-4 py-3">Debited Billing Company</th>
                    <th className="px-4 py-3 text-right">Amount Outlay (Rs.)</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm font-sans font-medium">
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                        No previous payment disbursements recorded in system storage.
                      </td>
                    </tr>
                  ) : (
                    payments.map((pay) => {
                      const broker = agents.find(a => a.id === pay.agentId);
                      const bcomp = companies.find(c => c.id === pay.paidByCompanyId);
                      return (
                        <tr key={pay.id} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3">
                            <span className="font-mono font-bold block text-slate-900">{pay.referenceNo}</span>
                            {pay.notes && (
                              <span className="text-[10px] text-slate-400 font-medium font-serif block italic mt-0.5 max-w-sm truncate" title={pay.notes}>
                                "{pay.notes}"
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-800">{broker?.name || 'Unknown Broker'}</td>
                          <td className="px-4 py-3">
                            <span className="inline-block bg-[#F4F4F1] border border-[#D1D1CF] px-2 py-0.5 rounded-none font-mono text-[10px] font-bold text-slate-700">
                              {pay.month} {pay.year}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-400 text-xs">{pay.paymentDate}</td>
                          <td className="px-4 py-3 text-xs text-[#E65100] font-semibold">{bcomp?.name || 'TSG Impex Ltd'}</td>
                          <td className="px-4 py-3 text-right font-mono font-extrabold text-emerald-700">
                            ₹ {pay.amountPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center space-x-1">
                              <button
                                type="button"
                                onClick={() => setAdvicePayment(pay)}
                                className="inline-flex items-center space-x-1 text-xs text-indigo-700 border border-indigo-200 px-2.5 py-1 bg-indigo-50/10 hover:bg-neutral-900 hover:text-white hover:border-black font-sans font-bold uppercase transition-colors cursor-pointer"
                                title="Generate corporate remittance advisory document"
                              >
                                <FileText className="h-3 w-3 shrink-0" />
                                <span>Advice</span>
                              </button>

                              {canManageLedger && (
                                <button
                                  type="button"
                                  onClick={() => setPayoutToDeleteId(pay.id)}
                                  className="p-1 px-1.5 border border-[#D1D1CF] text-slate-400 hover:text-red-650 hover:text-red-600 hover:border-red-100 bg-white hover:bg-red-50 rounded"
                                  title="Delete transaction log (revert ledger credit)"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

      {/* DETAILED PRINTABLE REMITTANCE ADVICE MODAL */}
      {advicePayment && (() => {
        const ag = agents.find(a => a.id === advicePayment.agentId);
        const coP = companies.find(c => c.id === advicePayment.paidByCompanyId) || companies[0];
        
        // Find despatches matched with this payout period
        const matchedDos = calculatedCommissions.filter(
          c => c.agent?.id === advicePayment.agentId && 
               c.monthName === advicePayment.month && 
               c.yearVal === advicePayment.year
        );

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-none border-2 border-black shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]">
              
              {/* Header block hidden during system OS print triggers */}
              <div className="px-6 py-4 border-b border-[#D1D1CF] bg-[#F4F4F1] flex justify-between items-center shrink-0 print:hidden">
                <div className="flex items-center space-x-2">
                  <Award className="h-5 w-5 text-emerald-600" />
                  <h3 className="font-serif font-bold italic text-slate-900 text-sm">
                    Remittance Settlement Advice - Generated Document
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

              {/* CORPORATE STATEMENT CONTENT PREVIEW - OPTIMIZED FOR A4 PORTRAIT PRINTING */}
              <div className="p-8 md:p-12 overflow-y-auto flex-1 font-serif text-[#1a1a1a] print-container print:overflow-visible print:p-0 print:m-0" id="advice-print-sheet">
                
                {/* Official Letterhead Header */}
                <div className="border-b-4 border-[#1a1a1a] pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="text-xl md:text-2xl font-black uppercase text-slate-900 tracking-tight leading-none font-serif font-serif-display">
                      {coP?.name || 'TSG IMPEX INDIA PRIVATE LTD'}
                    </h2>
                    <p className="text-[10px] uppercase font-bold tracking-widest text-[#E65100] mt-1 font-mono">
                      Industrial Powders & Bulk Transport Contractors
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1 max-w-sm leading-tight font-serif italic text-[#888884]">
                      {coP?.address || 'SCF-24, Sector 7-C, Madhya Marg, Chandigarh - 160019'}
                    </p>
                  </div>
                  <div className="text-right sm:text-right text-xs shrink-0 font-mono">
                    <span className="block font-black text-slate-900 uppercase">REMITTANCE ADVICE</span>
                    <span>Document Ref No: <b>{advicePayment.referenceNo}</b></span><br />
                    <span>Issued Date: <b>{advicePayment.paymentDate}</b></span>
                  </div>
                </div>

                {/* Sender/Recipient Detail splits */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8 text-xs font-serif leading-relaxed">
                  <div className="bg-[#F4F4F1]/30 p-4 border border-[#D1D1CF]">
                    <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">ISSUED BY SENDER:</span>
                    <strong className="text-slate-900 block text-xs mt-1">{coP?.name}</strong>
                    <span>GSTIN Reg No: <b>{coP?.gstin || 'Unrecorded'}</b></span><br />
                    <span>Tel: {coP?.contactNo || 'N/A'}</span><br />
                    <span>Email: {coP?.email || 'N/A'}</span>
                  </div>

                  <div className="bg-[#F4F4F1]/30 p-4 border border-[#D1D1CF]">
                    <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">REMITTED TO RECIPIENT Broker:</span>
                    <strong className="text-slate-900 block text-xs mt-1">{ag?.name || 'External Broker Agent'}</strong>
                    <span>Statement Period: <b>{advicePayment.month} {advicePayment.year}</b></span><br />
                    <span>Broker Contact: {ag?.contactNo || 'N/A'}</span><br />
                    <span>Broker Email: {ag?.email || 'N/A'}</span>
                  </div>
                </div>

                {/* Payment summary status callout */}
                <div className="mt-8 bg-slate-950 text-white p-5 rounded-none flex justify-between items-center font-mono">
                  <div>
                    <span className="block text-[9px] uppercase tracking-widest text-slate-300">TOTAL OUTLAY CLEARED</span>
                    <span className="text-xl md:text-2xl font-bold font-mono">
                      ₹ {advicePayment.amountPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="text-right text-[10px] opacity-90 leading-relaxed font-sans font-medium">
                    STATUS: <span className="bg-emerald-600 text-white px-2 py-0.5 font-bold uppercase shrink-0">PAID & RELEASED</span><br />
                    REF ID: <span className="font-mono bg-neutral-800 text-neutral-200 px-1 font-bold">{advicePayment.referenceNo}</span>
                  </div>
                </div>

                {/* Supporting despatches audit details */}
                <div className="mt-8 space-y-3">
                  <h4 className="text-xs font-black uppercase text-slate-900 tracking-tight font-serif-display">
                    Schedule of supporting Despatch Orders for this Period ({matchedDos.length} Deliveries)
                  </h4>
                  <p className="text-[10px] text-slate-400 font-serif leading-relaxed italic">
                    The following transport movements were delivered and signed during {advicePayment.month} {advicePayment.year}. Commissions were audited and credited on actual received weighbridge tonnage:
                  </p>

                  <div className="border border-[#1a1a1a] rounded-none overflow-hidden bg-white">
                    <table className="w-full text-left text-[10px] font-sans">
                      <thead className="bg-[#F4F4F1] text-[9px] font-bold text-slate-800 uppercase tracking-wider border-b border-[#1a1a1a] font-mono">
                        <tr>
                          <th className="px-3 py-1.5">DO Number</th>
                          <th className="px-3 py-1.5">Date</th>
                          <th className="px-3 py-1.5">Destination Site</th>
                          <th className="px-3 py-1.5 text-right">Weighed (MT)</th>
                          <th className="px-3 py-1.5 text-right">Spread /MT</th>
                          <th className="px-3 py-1.5 text-right font-bold">Commission Earned</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {matchedDos.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-3 py-4 text-center text-slate-400 italic font-medium">
                              Note: No specific delivery order was bound manually to this payout log, or associated items are archived. Standard clearing ledger payout implemented.
                            </td>
                          </tr>
                        ) : (
                          matchedDos.map((item, idX) => (
                            <tr key={`${item.doItem.id}-${idX}`} className="text-slate-800">
                              <td className="px-3 py-2 font-mono font-bold text-slate-900">{item.doItem.doNumber}</td>
                              <td className="px-3 py-2 font-mono text-slate-400">{item.doItem.date}</td>
                              <td className="px-3 py-2 truncate max-w-[150px] font-serif font-bold text-stone-700" title={item.doItem.vendorPlant}>
                                {item.doItem.vendorPlant}
                              </td>
                              <td className="px-3 py-2 font-mono text-right font-semibold text-slate-705">{(item.doItem.receivedWeight || 0).toFixed(2)} MT</td>
                              <td className="px-3 py-2 text-right font-mono text-slate-500">
                                Rs. {item.profitPerMT.toFixed(2)}
                              </td>
                              <td className="px-3 py-2 text-right font-mono font-extrabold text-neutral-900">
                                ₹ {item.totalCommission.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                      {matchedDos.length > 0 && (
                        <tfoot className="bg-[#F4F4F1]/40 text-[10px] border-t border-[#D1D1CF] font-mono font-bold">
                          <tr>
                            <td colSpan={3} className="px-3 py-2 text-right uppercase">CUMULATIVE AUDIT SHARE:</td>
                            <td className="px-3 py-2 text-right font-mono text-slate-900">
                              {matchedDos.reduce((sum, item) => sum + (item.doItem.receivedWeight || 0), 0).toFixed(2)} MT
                            </td>
                            <td></td>
                            <td className="px-3 py-2 text-right font-mono font-black text-[#E65100]">
                              ₹ {matchedDos.reduce((sum, item) => sum + item.totalCommission, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                </div>

                {/* Advice Notes block */}
                {advicePayment.notes && (
                  <div className="mt-8 p-4 bg-[#F4F4F1]/30 border border-[#D1D1CF] text-[11px] leading-relaxed italic font-serif">
                    <span className="block font-bold uppercase tracking-wider text-[8px] font-mono leading-none mb-1 text-slate-400">AUDITOR SYSTEM MEMO / CLINICAL NOTES:</span>
                    "{advicePayment.notes}"
                  </div>
                )}

                {/* Final Corporate Sign-off blocks */}
                <div className="mt-12 pt-8 border-t border-dashed border-[#D1D1CF] flex justify-between items-end gap-12 font-serif text-xs">
                  <div className="text-center w-40 shrink-0">
                    <div className="h-10 border-b border-[#1a1a1a]" />
                    <span className="block text-[8px] font-mono text-slate-500 uppercase font-bold mt-1 tracking-wider">RECIPIENT Broker SIGN</span>
                  </div>

                  <div className="text-center w-full max-w-sm mt-4 italic text-slate-400 text-[10px] leading-tight text-center">
                    This is a secure, authenticated, system-validated administrative document registered under ID {advicePayment.id}. No physical signature is required for TSG clearance ledger reconciliation.
                  </div>

                  <div className="text-center w-48 shrink-0">
                    <div className="h-10 font-mono font-bold leading-none text-neutral-800 text-[10px] flex items-end justify-center pb-2 uppercase tracking-tighter">
                      TSG FINANCE DESK
                    </div>
                    <div className="border-b border-[#1a1a1a]" />
                    <span className="block text-[8px] font-mono text-slate-500 uppercase font-bold mt-1 tracking-wider">AUTHORIZED APPROVER</span>
                  </div>
                </div>

              </div>

              {/* Action utilities bar print-hidden */}
              <div className="px-6 py-4 border-t border-[#D1D1CF] bg-slate-50 flex justify-end space-x-3 shrink-0 print:hidden">
                <button
                  type="button"
                  onClick={() => {
                    // Simulates pdf export by opening the print dialog
                    triggerPrintAdvice();
                  }}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 bg-neutral-900 hover:bg-black text-white font-sans font-bold text-xs uppercase cursor-pointer"
                >
                  <Printer className="h-4 w-4" />
                  <span>Print / Save PDF Advice</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    // Download structured text version of the document
                    const contentStr = `
================================================================================
                     REMITTANCE SETTLEMENT ADVICE
================================================================================
SENDER COMPANY:     ${coP?.name}
GSTIN NO:          ${coP?.gstin || 'N/A'}
ADDRESS:           ${coP?.address}

RECIPIENT BROKER:  ${ag?.name}
STATEMENT PERIOD:  ${advicePayment.month} ${advicePayment.year}
REMITTANCE DATE:   ${advicePayment.paymentDate}

--------------------------------------------------------------------------------
TRANSACTION ID:    ${advicePayment.referenceNo}
TRANSACTION DATE:  ${advicePayment.paymentDate}
SETTLED OUTLAY:    INR ${advicePayment.amountPaid.toFixed(2)}
--------------------------------------------------------------------------------

SUPPORTING DESPATCH ORDERS AUDITED:
${matchedDos.map(m => ` - ${m.doItem.doNumber} | ${m.doItem.date} | ${m.doItem.receivedWeight?.toFixed(2)} MT | Net Share: Rs. ${m.totalCommission.toFixed(2)}`).join('\n')}

MEMO NOTES:
"${advicePayment.notes || 'None recorded'}"

Verified by TSG Finance Ledger Sync system.
================================================================================
Generated on ${new Date().toISOString()} via Corporate Accounting Terminal.
`;
                    const blob = new Blob([contentStr], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `TSG_Advice_${advicePayment.referenceNo}.txt`;
                    link.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 border border-[#D1D1CF] bg-white text-slate-700 hover:bg-neutral-100 font-sans font-bold text-xs uppercase cursor-pointer"
                >
                  <Download className="h-4 w-4" />
                  <span>Download text Advice</span>
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* PAYOUT RECORDING WRITE MODAL */}
      {payoutModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-none border-2 border-black shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
              <h3 className="font-serif font-bold italic text-slate-800 text-sm">
                Record Physical Payout Settle Log
              </h3>
              <button
                type="button"
                className="text-slate-400 hover:text-black font-mono text-sm"
                onClick={() => setPayoutModalOpen(false)}
              >
                [X]
              </button>
            </div>

            <form onSubmit={handleCreatePayoutSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-[#888884] uppercase mb-1">Target Broker Agent <span className="text-red-500">*</span></label>
                  <select
                    value={paymentAgentId}
                    onChange={(e) => setPaymentAgentId(e.target.value)}
                    className="w-full text-xs py-2 px-2.5 border border-slate-200 bg-white font-serif font-bold italic text-[#1A1A1A] focus:outline-hidden"
                    required
                  >
                    <option value="">-- Select Broker --</option>
                    {agents.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#888884] uppercase mb-1">Payout Amount (Rs.) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 3450.50"
                    min={1}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full text-xs py-2 px-2.5 border border-slate-200 font-mono font-bold text-stone-900 focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-[#888884] uppercase mb-1">Statement Year</label>
                  <select
                    value={paymentYear}
                    onChange={(e) => setPaymentYear(Number(e.target.value))}
                    className="w-full text-xs py-2 px-2 border border-slate-200 bg-white font-semibold focus:outline-hidden"
                  >
                    <option value={2026}>2026</option>
                    <option value={2027}>2027</option>
                    <option value={2025}>2025</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#888884] uppercase mb-1">Statement Month</label>
                  <select
                    value={paymentMonth}
                    onChange={(e) => setPaymentMonth(e.target.value)}
                    className="w-full text-xs py-2 px-2 border border-slate-200 bg-white font-semibold focus:outline-hidden"
                  >
                    {MONTHS.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#888884] uppercase mb-1">Transaction date</label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full text-xs py-2 px-2 border border-slate-200 focus:outline-hidden font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-[#888884] uppercase mb-1">Issuing Billed Company <span className="text-red-500">*</span></label>
                  <select
                    value={paymentCompanyId}
                    onChange={(e) => setPaymentCompanyId(e.target.value)}
                    className="w-full text-xs py-2 px-2.5 border border-slate-200 bg-white font-medium focus:outline-hidden"
                    required
                  >
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#888884] uppercase mb-1">UPI/Transaction Reference <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    placeholder="e.g. TXN-HDFC-991204"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    className="w-full text-xs py-2 px-2.5 border border-slate-200 font-mono font-bold focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#888884] uppercase mb-1">Notes / Remittance Memorandum</label>
                <textarea
                  placeholder="Record banking details, confirmation dates, site receipts verified, etc."
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full text-xs p-3.5 border border-slate-200 rounded focus:outline-hidden font-serif"
                  rows={3}
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setPayoutModalOpen(false)}
                  className="px-4 py-2 border border-[#D1D1CF] hover:bg-[#F9F8F6] font-serif italic text-xs text-[#1A1A1A] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#E65100] hover:bg-black text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Settle to Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PAYOUT ARCHIVE REMOVE MODAL */}
      {payoutToDeleteId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-none border-2 border-black p-6 max-w-sm w-full space-y-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-6 w-6 text-red-650 text-red-600 shrink-0" />
              <div>
                <h4 className="font-serif font-black uppercase text-xs text-stone-900 leading-tight">Revert Payout Clearing?</h4>
                <p className="text-xs text-slate-500 leading-relaxed mt-1">
                  Are you sure you want to void payout reference <b>{payments.find(p => p.id === payoutToDeleteId)?.referenceNo}</b>? 
                  Once voided, this transaction is permanently archived and the broker's outstanding credit ledger balance will increase accordingly.
                </p>
              </div>
            </div>
            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setPayoutToDeleteId(null)}
                className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-xs font-mono select-none transition-colors"
              >
                No, Retain
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeletePayment(payoutToDeleteId);
                  setPayoutToDeleteId(null);
                }}
                className="px-4 py-1.5 bg-red-650 bg-red-600 hover:bg-red-700 text-white font-mono text-xs text-center font-bold"
              >
                Yes, Revert
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
