import React, { useState } from 'react';
import { Product, PurchaseOrder } from '../types';
import { Layers, Plus, Search, Trash2, Tag, BookMarked, ToggleLeft, ToggleRight, Edit, X } from 'lucide-react';

interface ProductMasterProps {
  products: Product[];
  onAddProduct: (name: string, hsnCode: string, description: string, category: string, gstRate: number) => void;
  onEditProduct: (p: Product) => void;
  onDeleteProduct: (id: string) => void;
  onUpdateProductStatus: (id: string, status: 'Active' | 'Inactive') => void;
  pos: PurchaseOrder[];
  onBack?: () => void;
}

export default function ProductMaster({
  products,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  onUpdateProductStatus,
  pos,
  onBack,
}: ProductMasterProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [name, setName] = useState('');
  const [hsnCode, setHsnCode] = useState('');
  const [gstRate, setGstRate] = useState<number>(18);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Cementitious');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const startEditProduct = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setHsnCode(p.hsnCode || '');
    setGstRate(p.gstRate !== undefined && p.gstRate !== null ? p.gstRate : 18);
    setDescription(p.description || '');
    setCategory(p.category || 'Cementitious');
    setError('');
    setSuccess('');
    
    // Smooth scroll to top form and auto-focus name input
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      const inputEl = document.getElementById('product-name-input');
      if (inputEl) {
        inputEl.focus();
        (inputEl as HTMLInputElement).select();
      }
    }, 150);
  };

  const cancelEditProduct = () => {
    setEditingProduct(null);
    setName('');
    setHsnCode('');
    setGstRate(18);
    setDescription('');
    setCategory('Cementitious');
    setError('');
    setSuccess('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name.trim()) {
      setError('Product name is required.');
      return;
    }

    if (!hsnCode.trim()) {
      setError('HSN Code is required for GST compliance.');
      return;
    }

    // Check duplicate
    const isDuplicate = products.some(
      (p) => (p.name || '').toLowerCase() === name.trim().toLowerCase() && (!editingProduct || p.id !== editingProduct.id)
    );

    if (isDuplicate) {
      setError('A product with this commercial name already exists.');
      return;
    }

    if (editingProduct) {
      onEditProduct({
        ...editingProduct,
        name: name.trim(),
        hsnCode: hsnCode.trim(),
        description: description.trim(),
        category,
        gstRate,
      });
      setSuccess(`Product "${name.trim()}" successfully updated!`);
      setEditingProduct(null);
    } else {
      onAddProduct(
        name.trim(),
        hsnCode.trim(),
        description.trim(),
        category,
        gstRate
      );
      setSuccess(`Product "${name.trim()}" successfully added to product master!`);
    }
    
    // Reset
    setName('');
    setHsnCode('');
    setGstRate(18);
    setDescription('');
    setCategory('Cementitious');

    setTimeout(() => {
      setSuccess('');
    }, 4000);
  };

  const filteredProducts = products.filter((p) => {
    const term = searchTerm.toLowerCase();
    return (
      p.name.toLowerCase().includes(term) ||
      (p.hsnCode || '').toLowerCase().includes(term) ||
      (p.category || '').toLowerCase().includes(term)
    );
  });

  const getPoCountForProduct = (productName: string) => {
    return pos.filter((p) => p.material.toLowerCase() === productName.toLowerCase()).length;
  };

  return (
    <div className="space-y-6" id="product-master-section">
      {/* Header */}
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
              📦 Product Catalog Master
            </h1>
          </div>
          <p className="text-xs text-stone-500 font-mono mt-2 uppercase tracking-widest">
            Configure dynamic commercial product names, Cementitious raw materials, GGBS & fly ash grades
          </p>
        </div>
        <div className="text-xs font-mono bg-[#FFF3E0] text-[#E65100] border border-[#FFE0B2] px-3 py-1.5 font-bold uppercase">
          Total Products Registered: {products.length}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Registration Form */}
        <div className="bg-white border border-[#D1D1CF] p-5 shadow-xs h-fit space-y-4">
          <h2 className="text-xs font-mono font-extrabold uppercase tracking-widest text-[#E65100] border-b border-[#D1D1CF] pb-2 flex justify-between items-center">
            <span>{editingProduct ? '📝 Edit Product Catalog' : '🆕 Register commercial product'}</span>
            {editingProduct && (
              <button
                type="button"
                onClick={cancelEditProduct}
                className="text-stone-400 hover:text-red-500 font-sans normal-case text-[10px] font-bold inline-flex items-center space-x-0.5 cursor-pointer"
              >
                <X className="h-3 w-3" />
                <span>Cancel</span>
              </button>
            )}
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
              <label htmlFor="product-name-input" className="block text-xs font-mono font-bold uppercase text-stone-700 mb-1.5">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                id="product-name-input"
                type="text"
                required
                placeholder="e.g. Fly Ash (Grade I)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-xs p-2.5 bg-neutral-50 focus:bg-white border border-[#D1D1CF] rounded-none outline-none focus:ring-1 focus:ring-[#E65100] font-sans transition-all"
              />
              <p className="text-[10px] text-stone-400 mt-1">
                Enter name exactly as printed in purchase contracts & bulk cargo receipts.
              </p>
            </div>

            <div>
              <label htmlFor="product-hsn-input" className="block text-xs font-mono font-bold uppercase text-stone-700 mb-1.5">
                HSN Code <span className="text-red-500">*</span>
              </label>
              <input
                id="product-hsn-input"
                type="text"
                required
                placeholder="e.g. 382499"
                value={hsnCode}
                onChange={(e) => setHsnCode(e.target.value)}
                className="w-full text-xs p-2.5 bg-neutral-50 focus:bg-white border border-[#D1D1CF] rounded-none outline-none focus:ring-1 focus:ring-[#E65100] font-mono transition-all"
              />
              <p className="text-[10px] text-stone-400 mt-1">
                HSN Code is required on all GST tax invoices & dispatch order documentation.
              </p>
            </div>

            <div>
              <label htmlFor="product-gst-input" className="block text-xs font-mono font-bold uppercase text-stone-700 mb-1.5">
                GST Rate Chargeable (%) <span className="text-red-500">*</span>
              </label>
              <input
                id="product-gst-input"
                type="number"
                min="0"
                max="100"
                required
                placeholder="e.g. 18"
                value={gstRate !== undefined && gstRate !== null ? gstRate : ''}
                onChange={(e) => setGstRate(e.target.value === '' ? 18 : Number(e.target.value))}
                className="w-full text-xs p-2.5 bg-neutral-50 focus:bg-white border border-[#D1D1CF] rounded-none outline-none focus:ring-1 focus:ring-[#E65100] font-mono transition-all"
              />
            </div>

            <div>
              <label htmlFor="product-category-input" className="block text-xs font-mono font-bold uppercase text-stone-700 mb-1.5">
                Commodity Category
              </label>
              <select
                id="product-category-input"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs p-2.5 bg-neutral-50 focus:bg-white border border-[#D1D1CF] rounded-none outline-none  focus:ring-1 focus:ring-[#E65100] transition-all font-mono"
              >
                <option value="Cementitious">Cementitious</option>
                <option value="Minerals">Minerals</option>
                <option value="Aggregates">Aggregates</option>
                <option value="Industrial Ash">Industrial Ash</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="product-description-input" className="block text-xs font-mono font-bold uppercase text-stone-700 mb-1.5">
                Brief Specifications / Description
              </label>
              <textarea
                id="product-description-input"
                rows={3}
                placeholder="e.g. High grade pulverized ash collected from electrostatic precipitators."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full text-xs p-2.5 bg-neutral-50 focus:bg-white border border-[#D1D1CF] rounded-none outline-none focus:ring-1 focus:ring-[#E65100] font-sans transition-all"
              />
            </div>

            <button
              id="product-submit-btn"
              type="submit"
              className="w-full py-2.5 bg-stone-900 border border-black hover:bg-[#E65100] hover:border-[#E65100] text-white text-xs font-mono uppercase tracking-widest font-extrabold transition-all cursor-pointer shadow-sm select-none"
            >
              {editingProduct ? 'Update Product Details' : 'Register Product Catalog'}
            </button>
          </form>
        </div>

        {/* List Directory */}
        <div className="lg:col-span-2 bg-white border border-[#D1D1CF] p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-[#D1D1CF] pb-2">
            <h2 className="text-xs font-mono font-extrabold uppercase tracking-widest text-[#1A1A1A]">
              📋 Registered Commercial Products Catalog
            </h2>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-stone-400" />
              <input
                type="text"
                placeholder="Search name, category, code..."
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
                  <th className="px-4 py-3">Product ID</th>
                  <th className="px-4 py-3">HSN Code</th>
                  <th className="px-4 py-3">Commercial Name</th>
                  <th className="px-4 py-3 text-center">GST Rate</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3 text-center">Linked POs</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 font-sans font-medium">
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((p) => {
                    const linkedPoCount = getPoCountForProduct(p.name);
                    return (
                      <tr 
                        key={p.id} 
                        className={`text-[11px] transition-colors border-l-2 ${
                          editingProduct?.id === p.id 
                            ? 'bg-[#FFF3E0]/40 hover:bg-[#FFF3E0]/70 border-l-[#E65100]' 
                            : 'hover:bg-neutral-50 border-l-transparent'
                        }`}
                      >
                        <td className="px-4 py-3.5 font-mono text-stone-500">
                          {p.id}
                        </td>
                        <td className="px-4 py-3.5 font-mono font-semibold">
                          {p.hsnCode || 'N/A'}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="block font-bold text-slate-900">{p.name}</span>
                          {p.description && (
                            <span className="block text-[10px] text-stone-400 mt-0.5 line-clamp-1">
                              {p.description}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-center font-mono font-extrabold text-[#E65100]">
                          {p.gstRate !== undefined ? `${p.gstRate}%` : '18%'}
                        </td>
                        <td className="px-4 py-3.5 font-mono">
                          <span className="bg-[#F4F4F1] border border-[#D1D1CF] text-[10px] px-1.5 py-0.5 font-bold uppercase">
                            {p.category || 'Cementitious'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center font-mono font-bold text-stone-700">
                          {linkedPoCount}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <button
                            title="Toggle status"
                            onClick={() => onUpdateProductStatus(p.id, p.status === 'Active' ? 'Inactive' : 'Active')}
                            className="inline-flex items-center space-x-1 hover:text-[#E65100] transition-colors"
                          >
                            {p.status === 'Active' ? (
                              <div className="flex items-center space-x-1 text-emerald-700">
                                <ToggleRight className="h-5 w-5" />
                                <span className="text-[10px] font-bold font-mono">ACTIVE</span>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-1 text-stone-400">
                                <ToggleLeft className="h-5 w-5" />
                                <span className="text-[10px] font-bold font-mono">INACTIVE</span>
                              </div>
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              type="button"
                              onClick={() => startEditProduct(p)}
                              className="p-1 text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-200 transition-all rounded-none cursor-pointer"
                              title="Edit Product Details"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (linkedPoCount > 0) {
                                  alert(`Cannot delete product because it has ${linkedPoCount} linked Purchase Orders. Retire or make it inactive instead.`);
                                  return;
                                }
                                if (confirm(`Are you sure you want to delete "${p.name}"?`)) {
                                  onDeleteProduct(p.id);
                                }
                              }}
                              className={`p-1 text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all rounded-none ${
                                linkedPoCount > 0 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'
                              }`}
                              title={linkedPoCount > 0 ? 'Locked by active POs' : 'Delete Product Record'}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-stone-400 font-mono text-xs select-none">
                      ⚠️ No matching products registered in master catalog.
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
