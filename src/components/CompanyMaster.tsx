import React, { useState } from 'react';
import { Company } from '../types';
import { Building, Plus, Trash2, Edit, Save, X, Phone, Mail, FileText, MapPin, AlertTriangle } from 'lucide-react';

interface CompanyMasterProps {
  companies: Company[];
  onAddCompany: (company: Omit<Company, 'id' | 'createdAt'>) => void;
  onEditCompany: (company: Company) => void;
  onDeleteCompany: (id: string) => void;
  onBack?: () => void;
}

export default function CompanyMaster({
  companies,
  onAddCompany,
  onEditCompany,
  onDeleteCompany,
  onBack,
}: CompanyMasterProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  
  // Safe confirmation state
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [gstin, setGstin] = useState('');
  const [contactNo, setContactNo] = useState('');
  const [email, setEmail] = useState('');

  const openAddModal = () => {
    setEditingCompany(null);
    setName('');
    setAddress('');
    setGstin('');
    setContactNo('');
    setEmail('');
    setIsModalOpen(true);
  };

  const openEditModal = (company: Company) => {
    setEditingCompany(company);
    setName(company.name);
    setAddress(company.address);
    setGstin(company.gstin || '');
    setContactNo(company.contactNo || '');
    setEmail(company.email || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !address.trim()) {
      alert('Company Name and Address are required.');
      return;
    }

    if (editingCompany) {
      onEditCompany({
        ...editingCompany,
        name,
        address,
        gstin: gstin.toUpperCase(),
        contactNo,
        email,
      });
    } else {
      onAddCompany({
        name,
        address,
        gstin: gstin.toUpperCase(),
        contactNo,
        email,
      });
    }
    setIsModalOpen(false);
  };

  return (
    <div id="company-master-panel" className="space-y-6 animate-fade-in">
      
      {/* Home / Back Navigation key */}
      {onBack && (
        <div className="flex justify-start">
          <button
            onClick={onBack}
            className="inline-flex items-center space-x-2 px-4 py-2 border border-[#D1D1CF] hover:border-black bg-white hover:bg-[#F9F8F6] text-xs font-serif font-bold italic text-neutral-900 transition-colors cursor-pointer"
          >
            <span>← Back to Dashboard / Home</span>
          </button>
        </div>
      )}

      {/* Detail Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#D1D1CF] pb-4">
        <div>
          <h2 className="text-xl font-serif font-bold italic text-[#1A1A1A] flex items-center space-x-2">
            <Building className="h-5 w-5 text-[#E65100]" />
            <span>Company Master DB</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">Register owning companies. Multiple entities can be maintained to issue separate delivery challans.</p>
        </div>
        <button
          id="btn-add-company"
          onClick={openAddModal}
          className="flex items-center space-x-2 px-5 py-2.5 bg-[#E65100] hover:bg-black text-white text-xs uppercase tracking-wider font-bold rounded-none transition-colors cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Add Company</span>
        </button>
      </div>

      {/* Grid of registered companies */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {companies.length === 0 ? (
          <div className="md:col-span-2 bg-[#F9F8F6] border-2 border-dashed border-[#D1D1CF] rounded-none py-14 text-center text-slate-500">
            <Building className="h-10 w-10 mx-auto text-slate-300 mb-3" />
            <p className="font-serif italic text-base text-black font-bold">No companies registered yet</p>
            <p className="text-xs text-slate-400 mt-1">Click "Add Company" above to register your first billing/supplying entity.</p>
          </div>
        ) : (
          companies.map((company) => (
            <div 
              key={company.id} 
              className="bg-white rounded-none border border-[#D1D1CF] p-6 flex flex-col justify-between"
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-serif font-bold italic text-neutral-900 text-lg leading-tight">{company.name}</h3>
                    {company.gstin ? (
                      <span className="inline-block mt-2 text-[10px] font-mono font-bold bg-[#F9F8F6] text-[#E65100] px-2.5 py-0.5 border border-[#D1D1CF]">
                        GSTIN: {company.gstin}
                      </span>
                    ) : (
                      <span className="inline-block mt-2 text-[10px] text-slate-400 italic">No GSTIN registered</span>
                    )}
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => openEditModal(company)}
                      className="p-1.5 hover:bg-[#F4F4F1] text-slate-500 hover:text-black rounded-none transition-colors cursor-pointer border border-[#D1D1CF]"
                      title="Edit Company"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setDeleteConfirmationId(company.id);
                      }}
                      className="p-1.5 hover:bg-orange-50 text-[#E65100] rounded-none transition-colors cursor-pointer border border-[#D1D1CF]"
                      title="Delete Company"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Details list */}
                <div className="space-y-2.5 text-xs text-slate-700 border-t border-[#F4F4F1] pt-4 leading-relaxed">
                  <div className="flex items-start space-x-2">
                    <MapPin className="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0" />
                    <span>{company.address}</span>
                  </div>
                  {company.contactNo && (
                    <div className="flex items-center space-x-2">
                      <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>{company.contactNo}</span>
                    </div>
                  )}
                  {company.email && (
                    <div className="flex items-center space-x-2">
                      <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>{company.email}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="text-[10px] text-[#888884] font-mono text-right mt-6 pt-3 border-t border-[#F4F4F1]">
                REGISTERED LEDGER ID: {company.id.slice(0, 8).toUpperCase()} | {company.createdAt}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Write/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-neutral-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-none border border-black shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-[#D1D1CF] bg-[#F9F8F6] flex justify-between items-center">
              <h3 className="font-serif font-bold italic text-[#1A1A1A] text-base">
                {editingCompany ? 'Edit Supplying Company' : 'Register New Supplying Company'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-black p-1 border border-[#D1D1CF] hover:border-black cursor-pointer bg-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-neutral-800 uppercase tracking-wider mb-1.5">
                  Company Name <span className="text-[#E65100]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sardar Infrastructure & Minerals Ltd"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-sm px-3.5 py-2 border border-[#D1D1CF] rounded-none focus:outline-hidden focus:border-black bg-[#F9F8F6]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-800 uppercase tracking-wider mb-1.5">
                  Registered Address <span className="text-[#E65100]">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Official office street, building description, and state pincode"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full text-sm px-3.5 py-2 border border-[#D1D1CF] rounded-none focus:outline-hidden focus:border-black bg-[#F9F8F6] resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-800 uppercase tracking-wider mb-1.5">GSTIN Number</label>
                  <input
                    type="text"
                    maxLength={15}
                    placeholder="e.g. 03AADCS7291F1Z2"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value)}
                    className="w-full text-sm px-3.5 py-2 border border-[#D1D1CF] rounded-none focus:outline-hidden focus:border-black bg-[#F9F8F6] uppercase font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-neutral-800 uppercase tracking-wider mb-1.5">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="e.g. +91 98765 43210"
                    value={contactNo}
                    onChange={(e) => setContactNo(e.target.value)}
                    className="w-full text-sm px-3.5 py-2 border border-[#D1D1CF] rounded-none focus:outline-hidden focus:border-black bg-[#F9F8F6]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-800 uppercase tracking-wider mb-1.5">Email Coordinates</label>
                <input
                  type="email"
                  placeholder="e.g. ops@sardarcompany.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-sm px-3.5 py-2 border border-[#D1D1CF] rounded-none focus:outline-hidden focus:border-black bg-[#F9F8F6]"
                />
              </div>

              <div className="pt-5 flex justify-end space-x-3 border-t border-[#D1D1CF]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2 bg-white border border-black hover:bg-neutral-100 text-black text-xs font-serif italic transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center space-x-2 px-6 py-2 bg-[#E65100] hover:bg-black text-white text-xs font-serif italic transition-colors cursor-pointer"
                >
                  <Save className="h-4 w-4" />
                  <span>{editingCompany ? 'Update Details' : 'Save Company Record'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmationId && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-none border-2 border-black max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-start space-x-3 text-[#E65100]">
              <AlertTriangle className="h-6 w-6 mt-0.5 shrink-0" />
              <div>
                <h3 className="font-serif font-bold italic text-[#1A1A1A] text-base">Delete Supplying Company?</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Are you sure you want to permanently delete this supplier entity from active records? This will prevent raising new orders/challans for this Company.
                </p>
              </div>
            </div>
            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setDeleteConfirmationId(null)}
                className="px-5 py-2 border border-black text-xs font-serif italic bg-white hover:bg-[#F9F8F6] cursor-pointer"
              >
                No, Keep Record
              </button>
              <button
                onClick={() => {
                  if (deleteConfirmationId) {
                    onDeleteCompany(deleteConfirmationId);
                    setDeleteConfirmationId(null);
                  }
                }}
                className="px-6 py-2 bg-[#E65100] text-white hover:bg-black text-xs font-serif italic font-bold cursor-pointer"
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
