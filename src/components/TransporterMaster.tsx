import React, { useState } from 'react';
import { Transporter, Vendor, TransporterRate } from '../types';
import { Truck, Plus, Trash2, Edit, Save, X, Phone, MapPin, Layers, AlertTriangle, DollarSign, Mail } from 'lucide-react';

interface TransporterMasterProps {
  transporters: Transporter[];
  vendors: Vendor[];
  onAddTransporter: (transporter: Omit<Transporter, 'id' | 'createdAt'>) => void;
  onEditTransporter: (transporter: Transporter) => void;
  onDeleteTransporter: (id: string) => void;
  onBack?: () => void;
}

export default function TransporterMaster({
  transporters,
  vendors,
  onAddTransporter,
  onEditTransporter,
  onDeleteTransporter,
   onBack,
}: TransporterMasterProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransporter, setEditingTransporter] = useState<Transporter | null>(null);
  
  // Safe confirmation state
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [contactNo, setContactNo] = useState('');
  const [email, setEmail] = useState('');
  const [gstin, setGstin] = useState('');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  
  // Interactive Rate Card state
  const [ratesList, setRatesList] = useState<TransporterRate[]>([]);
  
  // Interactive individual form entries
  const [vendorSearchQuery, setVendorSearchQuery] = useState('');
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [rateAmount, setRateAmount] = useState('');
  const [wefDate, setWefDate] = useState(new Date().toISOString().substring(0, 10));

  const openAddModal = () => {
    setEditingTransporter(null);
    setName('');
    setAddress('');
    setContactNo('');
    setEmail('');
    setGstin('');
    setStatus('Active');
    setRatesList([]);
    setSelectedVendorId('');
    setRateAmount('');
    setWefDate(new Date().toISOString().substring(0, 10));
    setVendorSearchQuery('');
    setIsModalOpen(true);
  };

  const openEditModal = (t: Transporter) => {
    setEditingTransporter(t);
    setName(t.name);
    setAddress(t.address);
    setContactNo(t.contactNo || '');
    setEmail(t.email || '');
    setGstin(t.gstin || '');
    setStatus(t.status || 'Active');
    setRatesList([...(t.rates || [])]);
    setSelectedVendorId('');
    setRateAmount('');
    setWefDate(new Date().toISOString().substring(0, 10));
    setVendorSearchQuery('');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !address.trim()) {
      alert('Transporter Name and Yard Depot Address are required.');
      return;
    }

    const payload = {
      name: name.trim(),
      address: address.trim(),
      contactNo: contactNo.trim(),
      email: email.trim(),
      gstin: gstin.toUpperCase(),
      status,
      rates: ratesList,
    };

    if (editingTransporter) {
      onEditTransporter({
        ...editingTransporter,
        ...payload,
      });
    } else {
      onAddTransporter(payload);
    }
    setIsModalOpen(false);
  };

  return (
    <div id="transporter-master-panel" className="space-y-6 animate-fade-in">
      
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
            <Truck className="h-5 w-5 text-indigo-600" />
            <span>Heavy Carrier Transporter Master</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">Register logistics providers who operate specialized bulkers to carry cement/minerals powder.</p>
        </div>
        <button
          id="btn-add-transporter"
          onClick={openAddModal}
          className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Add Transporter</span>
        </button>
      </div>

      {/* Grid view */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {transporters.length === 0 ? (
          <div className="md:col-span-3 bg-slate-50 border border-dashed border-slate-300 rounded-xl py-12 text-center text-slate-500">
            <Truck className="h-10 w-10 mx-auto text-slate-300 mb-3" />
            <p className="font-semibold text-xs">No registered transporters found</p>
            <p className="text-xs text-slate-400 mt-1">Add carrier agencies to transport bulk powders between approved site quarries and camps.</p>
          </div>
        ) : (
          transporters.map((t) => (
            <div 
              key={t.id}
              className="bg-white rounded-xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow p-5 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{t.name}</h3>
                    <div className="flex items-center space-x-2 mt-1 flex-wrap gap-y-1">
                      {t.status === 'Inactive' ? (
                        <span className="inline-block text-[9px] font-bold bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded border border-rose-100 uppercase shrink-0">
                          ● Inactive
                        </span>
                      ) : (
                        <span className="inline-block text-[9px] font-bold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-100 uppercase shrink-0">
                          ● Active
                        </span>
                      )}
                      {t.gstin ? (
                        <span className="inline-block text-[9px] font-mono font-bold bg-slate-50 text-slate-600 px-1.5 py-0.5 rounded border border-slate-150 shrink-0">
                          GSTIN: {t.gstin}
                        </span>
                      ) : (
                        <span className="inline-block text-[9px] text-slate-400 italic shrink-0">No GSTIN</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex space-x-1">
                    <button
                      onClick={() => openEditModal(t)}
                      className="p-1 hover:bg-slate-150 text-slate-500 hover:text-slate-800 rounded"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        setDeleteConfirmationId(t.id);
                      }}
                      className="p-1 hover:bg-red-50 text-slate-500 hover:text-red-600 rounded"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
                  <div className="flex items-start space-x-1.5">
                    <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>{t.address}</span>
                  </div>
                  {t.contactNo && (
                    <div className="flex items-center space-x-1.5">
                      <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>{t.contactNo}</span>
                    </div>
                  )}
                  {t.email && (
                    <div className="flex items-center space-x-1.5">
                      <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate" title={t.email}>{t.email}</span>
                    </div>
                  )}

                  {t.rates && t.rates.length > 0 ? (
                    <div className="mt-3 pt-2 border-t border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center">
                        <DollarSign className="h-3 w-3 mr-0.5 text-slate-400 shrink-0" /> Approved Rate Cards (Rs./MT)
                      </p>
                      <div className="space-y-1 text-[11px] max-h-[120px] overflow-y-auto pr-1">
                        {t.rates.map(r => {
                          const vName = vendors.find(vd => vd.id === r.vendorId)?.name || 'Unknown Vendor';
                          return (
                            <div key={r.vendorId} className="bg-slate-50/50 border border-slate-200/50 px-2 py-1 rounded flex justify-between items-center font-mono">
                              <div className="flex flex-col truncate max-w-[130px]">
                                <span className="truncate text-slate-700 font-semibold text-[10px]" title={vName}>{vName}</span>
                                {r.wef && <span className="text-[8px] text-slate-400">wef: {r.wef}</span>}
                              </div>
                              <span className="font-semibold text-indigo-700 shrink-0">Rs. {r.rate}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 pt-2 border-t border-slate-100 text-[10px] text-slate-400 italic">
                      No active vendor rates configured
                    </div>
                  )}
                </div>
              </div>

              <div className="text-[10px] text-slate-400 font-mono text-right mt-4 pt-2 border-t border-slate-50">
                Created: {t.createdAt}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Write / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
              <h3 className="font-bold text-slate-800 text-base">
                {editingTransporter ? 'Configure Transporter file' : 'Register New Transporter Network'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Transporter Representative / Agency Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. National Bulk Carriers (NBC)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-sm px-3.5 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Main Depot Station / Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Main depot station address and state description"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full text-sm px-3.5 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">GSTIN Number</label>
                  <input
                    type="text"
                    maxLength={15}
                    placeholder="e.g. 07AAAFN5522D1ZC"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value)}
                    className="w-full text-sm px-3.5 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 uppercase font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Carrier Registered Email (Notification Channel)</label>
                  <input
                    type="email"
                    placeholder="e.g. logistics@transporter.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-sm px-3.5 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Mobile Number</label>
                  <input
                    type="tel"
                    placeholder="e.g. +91 94140 XXXXX"
                    value={contactNo}
                    onChange={(e) => setContactNo(e.target.value)}
                    className="w-full text-sm px-3.5 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Carrier Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'Active' | 'Inactive')}
                    className="w-full text-sm px-3.5 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 bg-white font-bold text-slate-800"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Vendor Rate Card List */}
              <div className="border-t border-slate-150 pt-4 space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center">
                    <DollarSign className="h-4 w-4 text-emerald-600 mr-1 shrink-0" />
                    <span>Vendor Rate Cards (Interactive Configurator)</span>
                  </h4>
                  <p className="text-[11px] text-slate-400">Search and configure transport freight rates (Rs/MT) with effect from dates.</p>
                </div>

                {/* Search & Input Panel */}
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">1. Filter/Search Vendor name</label>
                      <input
                        type="text"
                        placeholder="Type to filter vendors..."
                        value={vendorSearchQuery}
                        onChange={(e) => setVendorSearchQuery(e.target.value)}
                        className="w-full text-xs px-2.5 py-1.5 border border-slate-200 bg-white rounded-md focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">2. Select Target Vendor</label>
                      <select
                        value={selectedVendorId}
                        onChange={(e) => setSelectedVendorId(e.target.value)}
                        className="w-full text-xs px-2.5 py-1.5 border border-slate-200 bg-white rounded-md focus:outline-hidden font-medium"
                      >
                        <option value="">-- Choose Vendor ({vendors.filter(v => v.name.toLowerCase().includes(vendorSearchQuery.toLowerCase())).length} found) --</option>
                        {vendors
                          .filter(v => v.name.toLowerCase().includes(vendorSearchQuery.toLowerCase()))
                          .map(v => (
                            <option key={v.id} value={v.id}>
                              {v.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Freight Rate (Rs./MT)</label>
                      <input
                        type="number"
                        placeholder="e.g. 1050"
                        min={0}
                        value={rateAmount}
                        onChange={(e) => setRateAmount(e.target.value)}
                        className="w-full text-xs px-2.5 py-1.5 border border-slate-200 bg-white rounded-md focus:outline-hidden font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">With Effect From (w.e.f)</label>
                      <input
                        type="date"
                        value={wefDate}
                        onChange={(e) => setWefDate(e.target.value)}
                        className="w-full text-xs px-2.5 py-1.5 border border-slate-200 bg-white rounded-md focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <button
                        type="button"
                        onClick={() => {
                          if (!selectedVendorId) {
                            alert('Please select a vendor from the list.');
                            return;
                          }
                          if (!rateAmount || isNaN(Number(rateAmount)) || Number(rateAmount) <= 0) {
                            alert('Please enter a valid carrying rate per MT.');
                            return;
                          }
                          if (!wefDate) {
                            alert('Please choose a valid with-effect-from (w.e.f) date.');
                            return;
                          }

                          // Add or update rate list
                          const existingIndex = ratesList.findIndex(r => r.vendorId === selectedVendorId);
                          if (existingIndex >= 0) {
                            const updated = [...ratesList];
                            updated[existingIndex] = {
                              vendorId: selectedVendorId,
                              rate: Number(rateAmount),
                              wef: wefDate,
                            };
                            setRatesList(updated);
                          } else {
                            setRatesList([
                              ...ratesList,
                              {
                                vendorId: selectedVendorId,
                                rate: Number(rateAmount),
                                wef: wefDate,
                              }
                            ]);
                          }

                          // Reset inputs for easy consecutive entry!
                          setSelectedVendorId('');
                          setRateAmount('');
                          setWefDate(new Date().toISOString().substring(0, 10));
                        }}
                        className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-md shadow-xs transition-colors cursor-pointer"
                      >
                        Set / Update Rate
                      </button>
                    </div>
                  </div>
                </div>

                {/* Display Selected Rate Cards in scrollable table */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Currently Configured Rates ({ratesList.length})</span>
                  {ratesList.length === 0 ? (
                    <p className="text-xs text-slate-400 italic bg-slate-50/50 rounded-lg p-3 text-center border border-dashed border-slate-200">No rates linked. Use the panel above to search a vendor and set their rates.</p>
                  ) : (
                    <div className="border border-slate-150 rounded-lg overflow-hidden bg-white max-h-[140px] overflow-y-auto">
                      <table className="w-full text-left text-xs text-slate-600">
                        <thead className="bg-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider sticky top-0">
                          <tr>
                            <th className="px-3 py-1.5">Vendor Name</th>
                            <th className="px-3 py-1.5 text-right">Freight Rate</th>
                            <th className="px-3 py-1.5 text-center">W.E.F Date</th>
                            <th className="px-3 py-1.5 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          {ratesList.map((r, i) => {
                            const v = vendors.find(vd => vd.id === r.vendorId);
                            return (
                              <tr key={r.vendorId} className="hover:bg-slate-50">
                                <td className="px-3 py-2 text-slate-800 truncate max-w-[150px]" title={v?.name || 'Unknown'}>
                                  {v?.name || 'Unknown Vendor'}
                                </td>
                                <td className="px-3 py-2 text-right font-mono font-bold text-indigo-700">
                                  Rs. {r.rate}/MT
                                </td>
                                <td className="px-3 py-2 text-center text-slate-400 font-mono">
                                  {r.wef || 'Immediate'}
                                </td>
                                <td className="px-3 py-2 text-center">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setRatesList(ratesList.filter((_, idx) => idx !== i));
                                    }}
                                    className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                                    title="Remove Rate Card"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
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
                  <span>{editingTransporter ? 'Update Transporter' : 'Register Transporter'}</span>
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
                <h3 className="font-bold text-slate-900 text-base">Delete Transporter Agency?</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Are you sure you want to permanently delete this logistics carrier record? This will result in active transit orders lacking validated freight billing.
                </p>
              </div>
            </div>
            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setDeleteConfirmationId(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                No, Keep Record
              </button>
              <button
                onClick={() => {
                  if (deleteConfirmationId) {
                    onDeleteTransporter(deleteConfirmationId);
                    setDeleteConfirmationId(null);
                  }
                }}
                className="px-5 py-2 bg-red-650 hover:bg-red-700 bg-red-600 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
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
