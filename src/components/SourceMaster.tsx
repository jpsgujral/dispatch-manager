import React, { useState } from 'react';
import { SourceLocation, DespatchOrder } from '../types';
import { MapPin, Plus, Search, Trash2, Calendar, Hash, FileSpreadsheet } from 'lucide-react';

interface SourceMasterProps {
  sources: SourceLocation[];
  onAddSource: (name: string, pincode: string) => void;
  onDeleteSource: (id: string) => void;
  dos: DespatchOrder[];
  onBack?: () => void;
}

export default function SourceMaster({ sources, onAddSource, onDeleteSource, dos, onBack }: SourceMasterProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [newSourceName, setNewSourceName] = useState('');
  const [newSourcePincode, setNewSourcePincode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!newSourceName.trim()) {
      setError('Source name / loading point is required.');
      return;
    }
    if (!newSourcePincode.trim()) {
      setError('Pincode is required.');
      return;
    }

    // Basic pincode format validation (e.g. 6-digit Indian PIN or generic numeric check)
    const pinRegex = /^[0-9]{4,10}$/; // support 4 to 10 digit global/local pincodes
    if (!pinRegex.test(newSourcePincode.trim())) {
      setError('Please provide a valid numeric Pincode (4-10 digits).');
      return;
    }

    // Check duplicate
    const isDuplicate = sources.some(
      (s) => s.name.toLowerCase() === newSourceName.trim().toLowerCase()
    );

    if (isDuplicate) {
      setError('A source with this name already exists in the master.');
      return;
    }

    onAddSource(newSourceName.trim(), newSourcePincode.trim());
    setSuccess(`Source "${newSourceName.trim()}" successfully registered!`);
    
    // Clear inputs
    setNewSourceName('');
    setNewSourcePincode('');

    // Auto fadeout success message
    setTimeout(() => {
      setSuccess('');
    }, 4000);
  };

  // Filter sources
  const filteredSources = sources.filter((s) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      s.name.toLowerCase().includes(searchLower) ||
      s.pincode.includes(searchTerm)
    );
  });

  // Count dispatch orders linked to each source
  const getDoCountForSource = (sourceId: string) => {
    return dos.filter((d) => d.sourceId === sourceId).length;
  };

  return (
    <div className="space-y-6" id="source-master-section">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#D1D1CF] pb-4">
        <div>
          <div className="flex items-center space-x-3">
            {onBack && (
              <button
                onClick={onBack}
                className="px-3 py-1 border border-black text-xs font-serif italic hover:bg-black hover:text-white transition-colors cursor-pointer"
              >
                &larr; Back
              </button>
            )}
            <h1 className="text-2xl font-serif font-black italic tracking-tight text-[#1A1A1A]">
              📍 Loading Source Location Master
            </h1>
          </div>
          <p className="text-xs text-stone-500 font-mono mt-2 uppercase tracking-widest">
            Configure raw materials loading yards, power plant silos & mines (Point of Origin)
          </p>
        </div>
        <div className="text-xs font-mono bg-neutral-100 border border-[#D1D1CF] px-3 py-1.5 font-bold uppercase">
          Total Sources Registered: {sources.length}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Register New Source Form */}
        <div className="bg-white border border-[#D1D1CF] p-5 shadow-xs h-fit space-y-4">
          <h2 className="text-xs font-mono font-extrabold uppercase tracking-widest text-[#E65100] border-b border-[#D1D1CF] pb-2">
            🆕 Register origin loading source
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 text-[11px] p-2.5 font-mono font-bold uppercase rounded-none">
                ⚠️ {error}
              </div>
            )}
            {success && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] p-2.5 font-mono font-bold uppercase rounded-none">
                ✓ {success}
              </div>
            )}

            <div>
              <label htmlFor="source-name-input" className="block text-xs font-mono font-bold uppercase text-stone-700 mb-1.5">
                Loading Source / Plant Name <span className="text-red-500">*</span>
              </label>
              <input
                id="source-name-input"
                type="text"
                placeholder="e.g. Ropar Thermal Power Plant Stage II"
                value={newSourceName}
                onChange={(e) => setNewSourceName(e.target.value)}
                className="w-full text-xs p-2.5 bg-neutral-50 focus:bg-white border border-[#D1D1CF] rounded-none outline-none focus:ring-1 focus:ring-[#E65100] font-sans transition-all"
              />
              <p className="text-[10px] text-stone-400 mt-1">
                Enter the exact quarry, mine, silo, or power plant origin point name.
              </p>
            </div>

            <div>
              <label htmlFor="source-pincode-input" className="block text-xs font-mono font-bold uppercase text-stone-700 mb-1.5">
                Postal Pincode <span className="text-red-500">*</span>
              </label>
              <input
                id="source-pincode-input"
                type="text"
                maxLength={10}
                placeholder="e.g. 140125"
                value={newSourcePincode}
                onChange={(e) => setNewSourcePincode(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full text-xs p-2.5 bg-neutral-50 focus:bg-white border border-[#D1D1CF] rounded-none outline-none focus:ring-1 focus:ring-[#E65100] font-mono transition-all"
              />
              <p className="text-[10px] text-stone-400 mt-1">
                Required postal pincode for mineral taxation, carriage tolls & transit routing.
              </p>
            </div>

            <button
              id="source-submit-btn"
              type="submit"
              className="w-full py-2.5 bg-stone-900 border border-black hover:bg-[#E65100] hover:border-[#E65100] text-white text-xs font-mono uppercase tracking-widest font-extrabold transition-all cursor-pointer shadow-sm select-none"
            >
              Add Source to Master
            </button>
          </form>
        </div>

        {/* Right Column: Listing and Search */}
        <div className="lg:col-span-2 bg-white border border-[#D1D1CF] p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-[#D1D1CF] pb-2">
            <h2 className="text-xs font-mono font-extrabold uppercase tracking-widest text-[#1A1A1A]">
              📋 Registered Origin Sources Directory
            </h2>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-stone-400" />
              <input
                type="text"
                placeholder="Search name or pincode..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs pl-8 pr-2.5 py-1.5 bg-neutral-50 border border-[#D1D1CF] rounded-none outline-none focus:ring-1 focus:ring-[#E65100] font-sans"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-serif text-xs text-[#1A1A1A]">
              <thead className="bg-[#1A1A1A] text-[9.5px] font-bold text-neutral-200 uppercase tracking-widest font-mono select-none">
                <tr>
                  <th className="px-4 py-3">Source ID</th>
                  <th className="px-4 py-3">Loading Source Name</th>
                  <th className="px-4 py-3">Pincode</th>
                  <th className="px-4 py-3 text-center">Despatches Linked</th>
                  <th className="px-4 py-3 text-right">Registered On</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 font-sans font-medium">
                {filteredSources.length > 0 ? (
                  filteredSources.map((source) => {
                    const doCount = getDoCountForSource(source.id);
                    return (
                      <tr key={source.id} className="hover:bg-[#F9F8F6]/50 transition-colors">
                        <td className="px-4 py-3.5 font-mono text-stone-500 font-bold">
                          {source.id}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center space-x-2">
                            <span className="p-1 bg-amber-50 border border-amber-200 text-[#E65100]">
                              <MapPin className="h-3.5 w-3.5" />
                            </span>
                            <span className="font-bold text-stone-900 font-serif text-sm">
                              {source.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 font-mono font-bold text-[#E65100]">
                          {source.pincode}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          {doCount > 0 ? (
                            <span className="inline-flex items-center px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-800 font-mono text-[10px] font-bold">
                              {doCount} Contract DOs
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono text-stone-400">
                              No Active DOs
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-right text-[11px] text-stone-400 font-mono">
                          {source.createdAt}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          {doCount > 0 ? (
                            <button
                              disabled
                              title="Cannot delete source location linked to existing despatch orders"
                              className="text-stone-300 cursor-not-allowed p-1"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          ) : (
                            <button
                              id={`delete-source-${source.id}`}
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to remove "${source.name}" from the Source Master?`)) {
                                  onDeleteSource(source.id);
                                }
                              }}
                              className="text-stone-400 hover:text-red-600 transition-colors p-1 cursor-pointer"
                              title="Delete source location"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-xs text-stone-400 font-mono uppercase bg-neutral-50">
                      No matching registered sources found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
