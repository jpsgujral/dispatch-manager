import React, { useState } from 'react';
import { Vendor } from '../types';
import { Users, Plus, Trash2, Edit, Save, X, Phone, Layers, MapPin, Sparkles, AlertTriangle } from 'lucide-react';

interface VendorMasterProps {
  vendors: Vendor[];
  onAddVendor: (vendor: Omit<Vendor, 'id' | 'createdAt'>) => void;
  onEditVendor: (vendor: Vendor) => void;
  onDeleteVendor: (id: string) => void;
  onBack?: () => void;
  autoOpenForm?: boolean;
}

export default function VendorMaster({
  vendors,
  onAddVendor,
  onEditVendor,
  onDeleteVendor,
  onBack,
  autoOpenForm = false,
}: VendorMasterProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);

  React.useEffect(() => {
    if (autoOpenForm) {
      openAddModal();
    }
  }, [autoOpenForm]);
  
  // Safe confirmation state
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [gstin, setGstin] = useState('');
  const [contactNo, setContactNo] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  
  // Plants/Camps Sub-state
  const [plants, setPlants] = useState<string[]>([]);
  const [newPlant, setNewPlant] = useState('');

  const openAddModal = () => {
    setEditingVendor(null);
    setName('');
    setAddress('');
    setGstin('');
    setContactNo('');
    setEmail('');
    setStatus('Active');
    setPlants(['Camp-1', 'Camp-2']); // helpful defaults
    setNewPlant('');
    setIsModalOpen(true);
  };

  const openEditModal = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setName(vendor.name);
    setAddress(vendor.address);
    setGstin(vendor.gstin || '');
    setContactNo(vendor.contactNo || '');
    setEmail(vendor.email || '');
    setStatus(vendor.status || 'Active');
    setPlants([...vendor.plants]);
    setNewPlant('');
    setIsModalOpen(true);
  };

  const addPlantItem = () => {
    if (newPlant.trim() && !plants.includes(newPlant.trim())) {
      setPlants([...plants, newPlant.trim()]);
      setNewPlant('');
    }
  };

  const removePlantItem = (idx: number) => {
    setPlants(plants.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !address.trim()) {
      alert('Vendor Name and general Address are required.');
      return;
    }
    if (plants.length === 0) {
      alert('Include at least 1 Plant site (e.g. Camp-1) for despatch delivery.');
      return;
    }

    const payload = {
      name,
      address,
      gstin: gstin.toUpperCase(),
      plants,
      contactNo,
      email,
      status,
    };

    if (editingVendor) {
      onEditVendor({
        ...editingVendor,
        ...payload,
      });
    } else {
      onAddVendor(payload);
    }
    setIsModalOpen(false);
  };

  return (
    <div id="vendor-master-panel" className="space-y-6 animate-fade-in">
      
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
            <Users className="h-5 w-5 text-indigo-600" />
            <span>Vendor Master Database</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">Register construction contractors, developers, or clients who purchase bulk materials and operate plant camps.</p>
        </div>
        <button
          id="btn-add-vendor"
          onClick={openAddModal}
          className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-505 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Add Vendor</span>
        </button>
      </div>

      {/* Grid of registered vendors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {vendors.length === 0 ? (
          <div className="lg:col-span-2 bg-slate-50 border border-dashed border-slate-300 rounded-xl py-12 text-center text-slate-500">
            <Users className="h-10 w-10 mx-auto text-slate-300 mb-3" />
            <p className="font-semibold">No vendors registered yet</p>
            <p className="text-xs text-slate-400 mt-1">Add a vendor and tag their multiple mixing camps/plants.</p>
          </div>
        ) : (
          vendors.map((vendor) => (
            <div 
              key={vendor.id} 
              className="bg-white rounded-xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow p-6 flex flex-col justify-between"
            >
              <div className="space-y-5">
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{vendor.name}</h3>
                    <div className="flex items-center space-x-2 mt-1 flex-wrap gap-y-1">
                      {vendor.status === 'Inactive' ? (
                        <span className="inline-block text-[9px] font-bold bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded border border-rose-100 uppercase shrink-0">
                          ● Inactive
                        </span>
                      ) : (
                        <span className="inline-block text-[9px] font-bold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-100 uppercase shrink-0">
                          ● Active
                        </span>
                      )}
                      {vendor.gstin ? (
                        <span className="inline-block text-[9px] font-mono font-bold bg-slate-50 text-slate-600 px-2 py-0.5 rounded border border-slate-150 shrink-0">
                          GSTIN: {vendor.gstin}
                        </span>
                      ) : (
                        <span className="inline-block text-[9px] text-slate-400 italic shrink-0">No GSTIN</span>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => openEditModal(vendor)}
                      className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-md transition-colors"
                      title="Edit Vendor"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        setDeleteConfirmationId(vendor.id);
                      }}
                      className="p-1.5 hover:bg-red-50 text-slate-500 hover:text-red-600 rounded-md transition-colors"
                      title="Delete Vendor"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Info summary */}
                <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="flex items-start space-x-1.5">
                    <MapPin className="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0" />
                    <span><b>HQ:</b> {vendor.address}</span>
                  </div>
                  {vendor.contactNo && (
                    <div className="flex items-center space-x-1.5">
                      <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>{vendor.contactNo}</span>
                    </div>
                  )}
                </div>

                {/* Registered plant camps under this vendor */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Tagged In-Project Plants / Site Camps:</span>
                  <div className="flex flex-wrap gap-2">
                    {vendor.plants.map((plant, idx) => (
                      <span 
                        key={idx}
                        className="inline-flex items-center space-x-1 bg-indigo-50/70 text-indigo-700 text-xs px-2.5 py-1 rounded-md border border-indigo-100 font-medium"
                      >
                        <Layers className="h-3 w-3 text-indigo-400 inline" />
                        <span>{plant}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 font-mono text-right mt-6 pt-2 border-t border-slate-50">
                Created on: {vendor.createdAt}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
              <h3 className="font-bold text-slate-800 text-base">
                {editingVendor ? 'Edit Vendor Master File' : 'Register New Vendor Contract'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 min-h-0">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Vendor / Client Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Larsen & Toubro (L&T)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-sm px-3.5 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Corporate HQ Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Main office street, city, state and country details"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full text-sm px-3.5 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">GSTIN Certificate ID</label>
                  <input
                    type="text"
                    maxLength={15}
                    placeholder="e.g. 27AAACL1234E1ZP"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value)}
                    className="w-full text-sm px-3.5 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 uppercase font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Purchase / Logistics Contacts</label>
                  <input
                    type="tel"
                    placeholder="e.g. +91 22 6752 5656"
                    value={contactNo}
                    onChange={(e) => setContactNo(e.target.value)}
                    className="w-full text-sm px-3.5 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Vendor Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'Active' | 'Inactive')}
                    className="w-full text-sm px-3.5 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 bg-white font-bold"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Plant / Camps tags sub-form */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center space-x-1 text-slate-700">
                  <Layers className="h-4 w-4 text-indigo-600" />
                  <span className="text-xs font-bold uppercase tracking-wider">Configure Plants & Site Camps (Unloading sites):</span>
                </div>
                <p className="text-[11px] text-slate-400">Add the exact camp designations (e.g. Camp-1 Gurgaon, Site-B Ring Road). Same purchase order supports multiple camp locations.</p>
                
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Add camp label (e.g. Camp-3 Sohna)"
                    value={newPlant}
                    onChange={(e) => setNewPlant(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addPlantItem();
                      }
                    }}
                    className="flex-1 text-xs px-3 py-1.5 bg-white border border-slate-200 rounded-md focus:outline-hidden focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={addPlantItem}
                    className="px-3 bg-slate-900 text-white rounded-md text-xs font-semibold hover:bg-slate-800 transition-colors shrink-0"
                  >
                    Add site
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-2">
                  {plants.length === 0 ? (
                    <span className="text-[11px] text-red-500 italic">No camp unloading destinations specified. Please add at least 1!</span>
                  ) : (
                    plants.map((pl, index) => (
                      <span 
                        key={index} 
                        className="inline-flex items-center space-x-1 px-2.5 py-1 bg-white border border-slate-200 text-slate-700 font-medium text-xs rounded-md"
                      >
                        <span>{pl}</span>
                        <button
                          type="button"
                          onClick={() => removePlantItem(index)}
                          className="text-slate-400 hover:text-red-500 text-xs font-bold pl-1 border-l border-slate-200"
                        >
                          &times;
                        </button>
                      </span>
                    ))
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
                  <span>{editingVendor ? 'Save Master Changes' : 'Register Vendor'}</span>
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
                <h3 className="font-bold text-slate-900 text-base">Delete Vendor Record?</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Are you sure you want to permanently delete this vendor and all associated camps/locations? Existing transaction logs will match with the stored database but active forms will prevent picking this vendor.
                </p>
              </div>
            </div>
            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setDeleteConfirmationId(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Cancel, Keep Record
              </button>
              <button
                onClick={() => {
                  if (deleteConfirmationId) {
                    onDeleteVendor(deleteConfirmationId);
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
