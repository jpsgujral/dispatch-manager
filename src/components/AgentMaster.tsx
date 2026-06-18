import React, { useState } from 'react';
import { Agent } from '../types';
import { UserSquare2, Plus, Trash2, Edit, Save, X, Phone, Mail, Award, AlertTriangle, Check, RotateCcw } from 'lucide-react';

interface AgentMasterProps {
  agents: Agent[];
  onAddAgent: (agent: Omit<Agent, 'id' | 'createdAt'>) => void;
  onEditAgent: (agent: Agent) => void;
  onDeleteAgent: (id: string) => void;
  onBack?: () => void;
}

export default function AgentMaster({
  agents,
  onAddAgent,
  onEditAgent,
  onDeleteAgent,
  onBack,
}: AgentMasterProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  
  // Safe sandbox-friendly confirmation state (replaces window.confirm)
  const [agentIdToDelete, setAgentIdToDelete] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [contactNo, setContactNo] = useState('');
  const [email, setEmail] = useState('');

  const openAddModal = () => {
    setEditingAgent(null);
    setName('');
    setContactNo('');
    setEmail('');
    setIsModalOpen(true);
  };

  const openEditModal = (a: Agent) => {
    setEditingAgent(a);
    setName(a.name);
    setContactNo(a.contactNo || '');
    setEmail(a.email || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      return;
    }

    const payload = {
      name: name.trim(),
      contactNo,
      email,
    };

    if (editingAgent) {
      onEditAgent({
        ...editingAgent,
        ...payload,
      });
    } else {
      onAddAgent(payload);
    }
    setIsModalOpen(false);
  };

  return (
    <div id="agent-master-panel" className="space-y-6 animate-fade-in">
      
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
            <UserSquare2 className="h-5 w-5 text-[#E65100]" />
            <span>Agent & Broker Registry</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">Register external transport brokers. Commissions are formulated based on business profit parameters (Profit &lt;= 100 Rs./MT receives 10%; Profit &gt; 100 Rs./MT receives 15%).</p>
        </div>
        <button
          id="btn-add-agent"
          onClick={openAddModal}
          className="flex items-center space-x-2 px-5 py-2.5 bg-[#E65100] hover:bg-black text-white text-xs uppercase tracking-wider font-bold rounded-none transition-colors cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Add Broker Agent</span>
        </button>
      </div>

      {/* Grid view of agents */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.length === 0 ? (
          <div className="md:col-span-3 bg-[#F9F8F6] border-2 border-dashed border-[#D1D1CF] rounded-none py-14 text-center text-slate-500">
            <UserSquare2 className="h-10 w-10 mx-auto text-slate-300 mb-3" />
            <p className="font-serif italic text-base text-black font-bold">No contract agents registered</p>
            <p className="text-xs text-slate-400 mt-1">Register agents to assign them to bulk despatches and automate local brokerage commission audits.</p>
          </div>
        ) : (
          agents.map((agent) => (
            <div 
              key={agent.id}
              className="bg-white rounded-none border border-[#D1D1CF] p-6 flex flex-col justify-between relative overflow-hidden"
            >
              {/* Dynamic Safe Delete Overlay Dialog inside Card */}
              {agentIdToDelete === agent.id ? (
                <div className="absolute inset-0 bg-[#FFF3CD] p-5 flex flex-col justify-between z-10 animate-fade-in border border-[#E65100]">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-[#E65100]">
                      <AlertTriangle className="h-5 w-5" />
                      <span className="font-serif font-bold italic text-neutral-900 text-sm">Delete Registry Agent?</span>
                    </div>
                    <p className="text-xs text-neutral-700 leading-relaxed font-sans">
                      Are you sure you want to remove <strong className="text-black">{agent.name}</strong> from active brokers ledger? This will not affect existing dispatches.
                    </p>
                  </div>
                  <div className="flex space-x-2 pt-2">
                    <button
                      onClick={() => {
                        onDeleteAgent(agent.id);
                        setAgentIdToDelete(null);
                      }}
                      className="flex-1 py-1.5 bg-[#E65100] hover:bg-black text-white text-xs font-serif font-bold italic transition-colors cursor-pointer text-center"
                    >
                      Yes, Delete Record
                    </button>
                    <button
                      onClick={() => setAgentIdToDelete(null)}
                      className="flex-1 py-1.5 bg-white border border-black hover:bg-neutral-100 text-black text-xs font-serif italic transition-colors cursor-pointer text-center"
                    >
                      Keep Agent
                    </button>
                  </div>
                </div>
              ) : null}

              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-2.5">
                    <div className="h-8 w-8 rounded-none bg-[#F9F8F6] text-[#E65100] border border-[#D1D1CF] font-serif font-bold italic text-base flex items-center justify-center shrink-0">
                      {agent.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-serif font-bold italic text-neutral-900 text-base leading-tight">{agent.name}</h3>
                      <span className="text-[10px] text-[#E65100] font-mono font-bold uppercase tracking-wider block mt-1">Verified Partner Broker</span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-1 shrink-0">
                    <button
                      onClick={() => openEditModal(agent)}
                      className="p-1.5 hover:bg-[#F4F4F1] text-slate-500 hover:text-black rounded-none transition-colors cursor-pointer border border-[#D1D1CF]"
                      title="Edit Agent Details"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setAgentIdToDelete(agent.id)}
                      className="p-1.5 hover:bg-orange-50 text-[#E65100] rounded-none transition-colors cursor-pointer border border-[#D1D1CF]"
                      title="Delete Agent Broker"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2.5 text-xs text-slate-700 border-t border-[#F4F4F1] pt-4 leading-relaxed font-sans">
                  {agent.contactNo ? (
                    <div className="flex items-center space-x-2">
                      <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>{agent.contactNo}</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 text-slate-400 italic">
                      <Phone className="h-3.5 w-3.5 shrink-0" />
                      <span>No hotline number registered</span>
                    </div>
                  )}
                  {agent.email ? (
                    <div className="flex items-center space-x-2">
                      <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>{agent.email}</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 text-slate-400 italic">
                      <Mail className="h-3.5 w-3.5 shrink-0" />
                      <span>No email registered</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2 text-[#E65100] bg-[#F9F8F6] p-2.5 border border-[#D1D1CF]">
                    <Award className="h-4 w-4 shrink-0" />
                    <span className="text-[11px] font-bold uppercase tracking-wide">Profit Tier Commission: <b>10% / 15%</b></span>
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-[#888884] font-mono text-right mt-6 pt-3 border-t border-[#F4F4F1]">
                BROKER LEDGER ID: {agent.id.slice(0, 8).toUpperCase()} | {agent.createdAt}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Write / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-neutral-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-none border border-black shadow-2xl w-full max-w-lg overflow-hidden font-sans">
            <div className="px-6 py-4 border-b border-[#D1D1CF] bg-[#F9F8F6] flex justify-between items-center">
              <h3 className="font-serif font-bold italic text-[#1A1A1A] text-base">
                {editingAgent ? 'Edit Broker Agent details' : 'Register New Broker Agent'}
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
                  Full Name / Agency Trade Name <span className="text-[#E65100]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Gurmeet Singh Brar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-sm px-3.5 py-2 border border-[#D1D1CF] rounded-none focus:outline-hidden focus:border-black bg-[#F9F8F6]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-800 uppercase tracking-wider mb-1.5">Contact Hotline</label>
                  <input
                    type="tel"
                    placeholder="e.g. +91 98722 XXXXX"
                    value={contactNo}
                    onChange={(e) => setContactNo(e.target.value)}
                    className="w-full text-sm px-3.5 py-2 border border-[#D1D1CF] rounded-none focus:outline-hidden focus:border-black bg-[#F9F8F6]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-neutral-800 uppercase tracking-wider mb-1.5">Email Coordinates</label>
                  <input
                    type="email"
                    placeholder="e.g. brar@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-sm px-3.5 py-2 border border-[#D1D1CF] rounded-none focus:outline-hidden focus:border-black bg-[#F9F8F6]"
                  />
                </div>
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
                  <span>{editingAgent ? 'Update Broker Record' : 'Save Broker Record'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
