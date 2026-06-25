import React, { useState } from 'react';
import { PurchaseOrder, Company, Vendor, Product, MaterialType, DespatchOrder } from '../types';
import { FileCheck, Plus, Trash2, Edit, Save, X, Calendar, DollarSign, Box, AlertTriangle, Eye, EyeOff, Filter } from 'lucide-react';

interface POMasterProps {
  pos: PurchaseOrder[];
  companies: Company[];
  vendors: Vendor[];
  products: Product[];
  dos: DespatchOrder[];
  onAddPO: (po: Omit<PurchaseOrder, 'id' | 'createdAt'>) => void;
  onEditPO: (po: PurchaseOrder) => void;
  onDeletePO: (id: string) => void;
  onBack?: () => void;
  autoOpenForm?: boolean;
}

export default function POMaster({
  pos,
  companies,
  vendors,
  products,
  dos,
  onAddPO,
  onEditPO,
  onDeletePO,
  onBack,
  autoOpenForm = false,
}: POMasterProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPO, setEditingPO] = useState<PurchaseOrder | null>(null);

  React.useEffect(() => {
    if (autoOpenForm) {
      openAddModal();
    }
  }, [autoOpenForm]);
  
  // Safe confirmation state
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);

  // Default filtering for PO Master (Active/Open vs Closed/Completed/Cancelled)
  const [poStatusFilter, setPoStatusFilter] = useState<'Active' | 'Completed' | 'Cancelled' | 'All'>('Active');

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

  // Form State
  const [poNumber, setPoNumber] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [vendorId, setVendorId] = useState('');
  const [material, setMaterial] = useState<string>('');
  const [totalQuantity, setTotalQuantity] = useState(100);
  const [vendorRate, setVendorRate] = useState(1000);
  const [effectiveDate, setEffectiveDate] = useState('');
  const [status, setStatus] = useState<'Active' | 'Completed' | 'Cancelled'>('Active');
  const [notes, setNotes] = useState('');

  const openAddModal = () => {
    setEditingPO(null);
    setPoNumber('');
    setCompanyId(companies[0]?.id || '');
    setVendorId(vendors[0]?.id || '');
    
    // Set material to first active product in master catalogs
    const firstActiveProduct = products.find(p => p.status === 'Active');
    setMaterial(firstActiveProduct ? firstActiveProduct.name : '');
    
    setTotalQuantity(500);
    setVendorRate(1100);
    setEffectiveDate(new Date().toISOString().substring(0, 10));
    setStatus('Active');
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (po: PurchaseOrder) => {
    setEditingPO(po);
    setPoNumber(po.poNumber);
    setCompanyId(po.companyId);
    setVendorId(po.vendorId);
    setMaterial(po.material);
    setTotalQuantity(po.totalQuantity);
    setVendorRate(po.vendorRate);
    setEffectiveDate(po.effectiveDate);
    setStatus(po.status);
    setNotes(po.notes || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!poNumber.trim()) {
      alert('POs must have a unique PO Identification Number.');
      return;
    }
    if (!companyId || !vendorId) {
      alert('Pick a valid Supplier Company and client Vendor.');
      return;
    }

    const payload = {
      poNumber: poNumber.trim(),
      companyId,
      vendorId,
      material,
      totalQuantity: Number(totalQuantity),
      vendorRate: Number(vendorRate),
      effectiveDate,
      status,
      notes,
    };

    if (editingPO) {
      onEditPO({
        ...editingPO,
        ...payload,
      });
    } else {
      onAddPO(payload);
    }
    setIsModalOpen(false);
  };

  return (
    <div id="po-master-panel" className="space-y-6 animate-fade-in">
      
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

      {/* Detail Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <FileCheck className="h-5 w-5 text-indigo-600" />
            <span>Vendor Purchase Order (PO) Master</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">Register purchase contracts. All pricing rates (Rs./MT) and logistics orders refer back to these contracted parameters.</p>
        </div>
        <button
          id="btn-add-po"
          onClick={openAddModal}
          className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>New PO Contract</span>
        </button>
      </div>

      {/* Filtering Controls for PO Open vs Closed */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-slate-50 border border-slate-200/85 p-4 rounded-xl gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Filters:</span>
          </div>
          
          <select
            value={filterFinancialYear}
            onChange={(e) => setFilterFinancialYear(e.target.value)}
            className="bg-white px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-bold focus:outline-hidden text-[#E65100]"
          >
            <option value="All">All Financial Years</option>
            <option value="FY 2025-26">FY 2025-26 (1 Apr 25 - 31 Mar 26)</option>
            <option value="FY 2026-27">FY 2026-27 (1 Apr 26 - 31 Mar 27)</option>
            <option value="FY 2027-28">FY 2027-28 (1 Apr 27 - 31 Mar 28)</option>
          </select>
        </div>
        <div className="flex flex-wrap gap-1.5 justify-end">
          <button
            type="button"
            onClick={() => setPoStatusFilter('Active')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              poStatusFilter === 'Active' 
                ? 'bg-indigo-600 text-white shadow-xs font-bold text-xs' 
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            ● Open / Active ({pos.filter(p => p.status === 'Active').length})
          </button>
          <button
            type="button"
            onClick={() => setPoStatusFilter('Completed')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              poStatusFilter === 'Completed' 
                ? 'bg-slate-700 text-white shadow-xs font-bold text-xs' 
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            ✓ Closed / Completed ({pos.filter(p => p.status === 'Completed').length})
          </button>
          <button
            type="button"
            onClick={() => setPoStatusFilter('Cancelled')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              poStatusFilter === 'Cancelled' 
                ? 'bg-red-600 text-white shadow-xs font-bold text-xs' 
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            ✕ Cancelled ({pos.filter(p => p.status === 'Cancelled').length})
          </button>
          <button
            type="button"
            onClick={() => setPoStatusFilter('All')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              poStatusFilter === 'All' 
                ? 'bg-slate-800 text-white shadow-xs font-bold text-xs' 
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Show All ({pos.length})
          </button>
        </div>
      </div>

      {/* Grid of registered PO contracts */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <th className="p-4">PO Number</th>
                <th className="p-4">Supplier Company</th>
                <th className="p-4">Client Vendor</th>
                <th className="p-4">Material Commodity</th>
                <th className="p-4 text-right">Contracted Vol</th>
                <th className="p-4 text-right text-emerald-600 font-semibold">Despatched Vol</th>
                <th className="p-4 text-right text-indigo-700 font-semibold bg-indigo-50/20">Balance Qty</th>
                <th className="p-4 text-right">Vendor rate / MT</th>
                <th className="p-4">Setup Date</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {(() => {
                const filteredPOs = pos.filter(po => {
                  const statusMatch = poStatusFilter === 'All' || po.status === poStatusFilter;
                  const fyMatch = isDateInFinancialYear(po.effectiveDate, filterFinancialYear);
                  return statusMatch && fyMatch;
                });

                if (filteredPOs.length === 0) {
                  return (
                    <tr>
                      <td colSpan={11} className="p-8 text-center text-slate-400">
                        <FileCheck className="h-10 w-10 mx-auto text-slate-300 mb-3" />
                        <p className="font-semibold text-xs">No PO contracts found for selected status filter</p>
                        <p className="text-xs text-slate-400 mt-0.5">Toggle status filters above to inspect active or ended PO records.</p>
                      </td>
                    </tr>
                  );
                }

                return filteredPOs.map((po) => {
                  const company = companies.find((c) => c.id === po.companyId);
                  const vendor = vendors.find((v) => v.id === po.vendorId);
                  const despatchedQty = dos
                    .filter((d) => d.poId === po.id && d.status !== 'Cancelled')
                    .reduce((sum, d) => sum + (d.receivedWeight || d.loadedWeight || 0), 0);
                  const balanceQty = Math.max(0, po.totalQuantity - despatchedQty);
                  
                  return (
                    <tr key={po.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-mono font-bold text-slate-900">{po.poNumber}</td>
                      <td className="p-4 text-slate-700 font-semibold">{company?.name || 'Unknown'}</td>
                      <td className="p-4 text-slate-600">{vendor?.name || 'Unknown'}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                          po.material === 'Fly Ash' ? 'bg-slate-100 text-slate-800' :
                          po.material === 'GGBS' ? 'bg-emerald-50 text-emerald-700' :
                          po.material === 'Micro Silica' ? 'bg-indigo-50 text-indigo-700' :
                          'bg-amber-50 text-amber-850 border border-amber-200'
                        }`}>
                          {po.material}
                        </span>
                      </td>
                      <td className="p-4 text-right font-mono font-medium">{po.totalQuantity.toFixed(2)} MT</td>
                      <td className="p-4 text-right font-mono font-medium text-emerald-600 bg-emerald-50/10">
                        {despatchedQty.toFixed(2)} MT
                      </td>
                      <td className="p-4 text-right font-mono font-bold text-indigo-700 bg-indigo-50/20">
                        {balanceQty.toFixed(2)} MT
                      </td>
                      <td className="p-4 text-right font-mono font-bold text-indigo-800">Rs. {po.vendorRate.toFixed(2)}</td>
                      <td className="p-4 text-slate-500 text-xs font-mono">{po.effectiveDate}</td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                          po.status === 'Active' ? 'bg-green-100 text-green-800' :
                          po.status === 'Completed' ? 'bg-slate-100 text-slate-600' : 'bg-red-100 text-red-600'
                        }`}>
                          {po.status === 'Active' ? 'Open / Active' : po.status === 'Completed' ? 'Closed' : po.status}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-1">
                        <button
                          onClick={() => openEditModal(po)}
                          className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded"
                          title="Edit PO details"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setDeleteConfirmationId(po.id);
                          }}
                          className="p-1 text-slate-400 hover:text-red-650 hover:text-red-600 hover:bg-red-50 rounded"
                          title="Delete PO"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
              <h3 className="font-bold text-slate-800 text-base">
                {editingPO ? 'Configure Purchase Contract' : 'Record New Purchase Order'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 min-h-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    PO Order/Ref No. <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. LNT/PO/2026/04"
                    value={poNumber}
                    onChange={(e) => setPoNumber(e.target.value)}
                    className="w-full text-sm px-3.5 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Material Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={material}
                    onChange={(e) => setMaterial(e.target.value)}
                    className="w-full text-sm px-3.5 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 bg-white shadow-xs"
                    required
                  >
                    <option value="">-- Select Registered Product --</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.name}>
                        {p.name} {p.hsnCode ? `(${p.hsnCode})` : ''} {p.status === 'Inactive' ? '(INACTIVE)' : ''}
                      </option>
                    ))}
                    {material && !products.some(p => p.name.toLowerCase() === material.toLowerCase()) && (
                      <option value={material}>{material}</option>
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Bill / supply through Company <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={companyId}
                    onChange={(e) => setCompanyId(e.target.value)}
                    className="w-full text-sm px-3.5 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 bg-white"
                  >
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Client Vendor Name <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={vendorId}
                    onChange={(e) => setVendorId(e.target.value)}
                    className="w-full text-sm px-3.5 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 bg-white"
                  >
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Total Volume Contracted (MT) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={totalQuantity}
                    onChange={(e) => setTotalQuantity(Number(e.target.value))}
                    className="w-full text-sm px-3.5 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Vendor Buying Rate (Rs. / MT) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={vendorRate}
                    onChange={(e) => setVendorRate(Number(e.target.value))}
                    className="w-full text-sm px-3.5 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 font-mono text-indigo-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Effective Date</label>
                  <input
                    type="date"
                    required
                    value={effectiveDate}
                    onChange={(e) => setEffectiveDate(e.target.value)}
                    className="w-full text-sm px-3.5 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Contract Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'Active' | 'Completed' | 'Cancelled')}
                    className="w-full text-sm px-3.5 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 bg-white shadow-xs"
                  >
                    <option value="Active">Active</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Special Contract Clauses / Instructions</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Approved source verification from thermal project plant..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full text-sm px-3.5 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="pt-4 flex justify-end space-x-3 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center space-x-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  <Save className="h-4 w-4" />
                  <span>{editingPO ? 'Apply Changes' : 'Confirm Contract'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmationId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-100">
            <div className="flex items-start space-x-3 text-red-600">
              <AlertTriangle className="h-6 w-6 mt-0.5 shrink-0" />
              <div>
                <h3 className="font-bold text-slate-900 text-base">Delete Purchase Order Contract?</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Are you sure you want to permanently delete this Purchase Order? Once deleted, dispatch orders referring to this PO will become orphaned, and active transit entries cannot reference it anymore.
                </p>
              </div>
            </div>
            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setDeleteConfirmationId(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Cancel, Keep PO
              </button>
              <button
                onClick={() => {
                  if (deleteConfirmationId) {
                    onDeletePO(deleteConfirmationId);
                    setDeleteConfirmationId(null);
                  }
                }}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
