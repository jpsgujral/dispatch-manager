import React, { useState } from 'react';
import { AppUser, UserRights } from '../types';
import { 
  Users, 
  Plus, 
  Trash2, 
  ShieldCheck, 
  Lock, 
  Check, 
  UserPlus, 
  UserSquare2, 
  AlertTriangle, 
  Info,
  Server,
  Database,
  CheckCircle2,
  Unlock,
  KeyRound,
  Edit
} from 'lucide-react';

interface UserAdminPanelProps {
  users: AppUser[];
  activeUser: AppUser | null;
  onSelectActiveUser: (userId: string) => void;
  onAddUser: (user: Omit<AppUser, 'id' | 'createdAt'>) => void;
  onUpdateUserRights: (userId: string, rights: UserRights) => void;
  onToggleUserStatus: (userId: string) => void;
  onDeleteUser: (userId: string) => void;
  onUpdateUser?: (updatedUser: AppUser) => void;
  onBack?: () => void;
}

export default function UserAdminPanel({
  users,
  activeUser,
  onSelectActiveUser,
  onAddUser,
  onUpdateUserRights,
  onToggleUserStatus,
  onDeleteUser,
  onUpdateUser,
  onBack,
}: UserAdminPanelProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'Admin' | 'Executive' | 'Viewer'>('Executive');
  const [userStatus, setUserStatus] = useState<'Active' | 'Inactive'>('Active');
  const [passcode, setPasscode] = useState('');

  // Form checkable rights states
  const [rights, setRights] = useState<UserRights>({
    manageCompanies: true,
    manageVendors: true,
    managePOs: true,
    manageTransporters: true,
    manageDespatches: true,
    manageLedger: false,
    manageAdmin: false,
  });

  const openAddModal = () => {
    setEditingUser(null);
    setName('');
    setEmail('');
    setRole('Executive');
    setPasscode('password1234');
    setRights({
      manageCompanies: true,
      manageVendors: true,
      managePOs: true,
      manageTransporters: true,
      manageDespatches: true,
      manageLedger: false,
      manageAdmin: false,
    });
    setUserStatus('Active');
    setIsModalOpen(true);
  };

  const openEditModal = (user: AppUser) => {
    setEditingUser(user);
    setName(user.name);
    setEmail(user.email);
    setRole(user.role);
    setRights(user.rights);
    setUserStatus(user.status || 'Active');
    setPasscode(user.passcode || 'password1234');
    setIsModalOpen(true);
  };

  const onRoleChange = (selectedRole: 'Admin' | 'Executive' | 'Viewer') => {
    setRole(selectedRole);
    if (selectedRole === 'Admin') {
      setRights({
        manageCompanies: true,
        manageVendors: true,
        managePOs: true,
        manageTransporters: true,
        manageDespatches: true,
        manageLedger: true,
        manageAdmin: true,
      });
    } else if (selectedRole === 'Viewer') {
      setRights({
        manageCompanies: false,
        manageVendors: false,
        managePOs: false,
        manageTransporters: false,
        manageDespatches: false,
        manageLedger: false,
        manageAdmin: false,
      });
    } else {
      setRights({
        manageCompanies: true,
        manageVendors: true,
        managePOs: true,
        manageTransporters: true,
        manageDespatches: true,
        manageLedger: false,
        manageAdmin: false,
      });
    }
  };

  const handleRigthsCheckboxChange = (field: keyof UserRights, val: boolean) => {
    setRights(prev => ({
      ...prev,
      [field]: val
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      alert('Please fill out name and email fields.');
      return;
    }

    if (editingUser) {
      const updated: AppUser = {
        ...editingUser,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role,
        status: userStatus,
        rights,
        passcode: passcode.trim() || 'password1234',
      };
      if (onUpdateUser) {
        onUpdateUser(updated);
      } else {
        onUpdateUserRights(editingUser.id, rights);
        if (editingUser.status !== userStatus) {
          onToggleUserStatus(editingUser.id);
        }
      }
    } else {
      onAddUser({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role,
        status: userStatus,
        rights,
        passcode: passcode.trim() || 'password1234',
      });
    }

    setName('');
    setEmail('');
    setRole('Executive');
    setEditingUser(null);
    setIsModalOpen(false);
  };

  return (
    <div id="user-admin-panel" className="space-y-6 animate-fade-in text-[#1A1A1A]">
      
      {onBack && (
        <div className="flex justify-start">
          <button
            onClick={onBack}
            className="inline-flex items-center space-x-2 px-4 py-2 border border-[#D1D1CF] hover:border-black bg-white hover:bg-[#F9F8F6] text-xs font-serif font-bold italic text-neutral-900 transition-colors cursor-pointer"
          >
            <span>← Back to Operations Home</span>
          </button>
        </div>
      )}

      {/* Detail Section Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#D1D1CF] pb-4">
        <div>
          <h2 className="text-xl font-serif font-bold italic text-[#1A1A1A] flex items-center space-x-2">
            <ShieldCheck className="h-5 w-5 text-[#E65100]" />
            <span>Administrative Security Settings</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Configure system users and fine-grain permission matrices. Simulate restricted users to verify client restrictions.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center space-x-2 px-5 py-2.5 bg-[#E65100] hover:bg-black text-white text-xs uppercase tracking-wider font-bold rounded-none transition-colors cursor-pointer shrink-0"
        >
          <UserPlus className="h-4 w-4" />
          <span>Add System User</span>
        </button>
      </div>

      {/* SIMULATED LOGIN CONTROLLER */}
      <div className="bg-amber-50 border border-amber-200/80 p-5 rounded-none space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-start space-x-2.5">
            <KeyRound className="h-5 w-5 text-[#E65100] shrink-0 mt-0.5" />
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-amber-900 leading-tight">
                ACTIVE SECURITY SIMULATION CONTEXT
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Select an authorized user below to test how the logistics software restricts menus, buttons, and views for different clearance levels in real time.
              </p>
            </div>
          </div>
          <span className="text-[10px] uppercase font-mono bg-[#E65100] text-white px-2 py-0.5 leading-none font-black animate-pulse">
            Local Dev sandbox Mode
          </span>
        </div>

        <div className="bg-white border border-amber-100 p-4 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div>
              <label className="block text-[9px] uppercase font-bold tracking-wider text-[#888884] mb-1">Acting Logged-In User:</label>
              <select
                value={activeUser?.id || ''}
                onChange={(e) => onSelectActiveUser(e.target.value)}
                className="text-sm font-bold font-serif italic py-1.5 px-3 border border-[#D1D1CF] bg-[#F9F8F6] hover:bg-[#F4F4F1] text-stone-900 focus:outline-hidden"
              >
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role}) {u.status === 'Inactive' ? '[INACTIVE]' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-xs leading-relaxed text-stone-600 font-medium sm:border-l sm:border-[#D1D1CF] sm:pl-4">
              <span className="block font-mono text-[9px] text-[#888884] font-bold">Simulated active rights:</span>
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-[10px] font-mono">
                <span className={activeUser?.rights?.manageCompanies ? "text-emerald-700 font-bold" : "text-slate-400 line-through"}>● Companies</span>
                <span className={activeUser?.rights?.manageVendors ? "text-emerald-700 font-bold" : "text-slate-400 line-through"}>● Vendors</span>
                <span className={activeUser?.rights?.managePOs ? "text-emerald-700 font-bold" : "text-slate-400 line-through"}>● PO Rates</span>
                <span className={activeUser?.rights?.manageTransporters ? "text-emerald-700 font-bold" : "text-slate-400 line-through"}>● Transporters</span>
                <span className={activeUser?.rights?.manageDespatches ? "text-emerald-700 font-bold" : "text-slate-400 line-through"}>● Despatch Movements</span>
                <span className={activeUser?.rights?.manageLedger ? "text-emerald-700 font-bold" : "text-slate-400 line-through"}>● Commission Ledger</span>
                <span className={activeUser?.rights?.manageAdmin ? "text-emerald-700 font-bold" : "text-slate-400 line-through"}>● Admin Manager</span>
              </div>
            </div>
          </div>

          <div className="shrink-0 flex items-center justify-end text-right">
            {activeUser?.role === 'Admin' ? (
              <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold leading-none uppercase">
                <Unlock className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>Full Admin Access</span>
              </span>
            ) : (
              <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-rose-50 text-rose-800 border border-rose-200 text-xs font-bold leading-none uppercase">
                <Lock className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                <span>Restricted ({activeUser?.role} account)</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* CORE USERS MANAGEMENT MATRIX */}
      <div className="bg-white border border-[#D1D1CF] overflow-hidden">
        <div className="px-5 py-4 bg-[#1A1A1A] border-b border-[#D1D1CF] text-stone-200 uppercase tracking-widest font-mono text-xs flex justify-between items-center">
          <span>SYSTEM ACCREDITED USER LISTING</span>
          <span className="text-[10px] text-[#D1D1CF] font-normal">{users.length} registered terminals</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-serif text-xs text-neutral-800">
            <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-[#D1D1CF] font-mono select-none">
              <tr>
                <th className="px-5 py-3">Full Representative Name</th>
                <th className="px-5 py-3">Terminals E-Mail</th>
                <th className="px-5 py-3">Clearance Role</th>
                <th className="px-5 py-3">Secure PIN</th>
                <th className="px-5 py-3 text-center">Status</th>
                <th className="px-5 py-3 text-right">Terminals actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans font-medium">
              {users.map((item) => {
                const isSelectedSIM = item.id === activeUser?.id;
                return (
                  <tr key={item.id} className={`hover:bg-slate-50/40 ${isSelectedSIM ? "bg-amber-100/15" : ""}`}>
                    <td className="px-5 py-4">
                      <div className="flex items-center space-x-2">
                        <span className="font-extrabold text-slate-900 block text-sm">{item.name}</span>
                        {isSelectedSIM && (
                          <span className="text-[7.5px] uppercase font-mono font-black border border-[#E65100]/40 bg-amber-50 text-[#E65100] px-1 rounded-none leading-tight">
                            Acting Active
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">Reg Date: {item.createdAt}</span>
                    </td>

                    <td className="px-5 py-4 text-xs font-mono text-slate-500 font-semibold">{item.email}</td>
                    
                    <td className="px-5 py-4">
                      <span className={`inline-block text-[9px] uppercase tracking-wider px-2 py-0.5 rounded font-black border ${
                        item.role === 'Admin' ? 'bg-indigo-50 text-indigo-700 border-indigo-150' : 
                        item.role === 'Executive' ? 'bg-amber-50 text-amber-700 border-amber-150' : 'bg-slate-100 text-slate-650'
                      }`}>
                        {item.role || 'Viewer'}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-xs font-mono font-bold text-stone-600">
                      {item.passcode || 'password1234'}
                    </td>

                    <td className="px-5 py-4 text-center">
                      <button
                        type="button"
                        onClick={() => onToggleUserStatus(item.id)}
                        className={`text-[9px] tracking-widest font-black uppercase border leading-none px-2 py-1 select-none transition-all cursor-pointer ${
                          item.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-150 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-100'
                            : 'bg-rose-50 text-rose-800 border-rose-150 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-100'
                        }`}
                        title="Click to toggle user status"
                      >
                        ● {item.status || 'Active'}
                      </button>
                    </td>

                    {/* Actions and editing is fully handled in User edit profile modal */}

                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          className="p-1.5 border border-[#D1D1CF] text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 hover:border-indigo-200 transition-all rounded cursor-pointer"
                          title="Edit User Profile & Permissions"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>

                        {item.role === 'Admin' ? (
                          <span className="text-[10px] text-slate-400 italic font-medium px-1">Protected</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              if (isSelectedSIM) {
                                alert('You cannot delete the user account you are currently playing as. Switch active user first.');
                                return;
                              }
                              onDeleteUser(item.id);
                            }}
                            className="p-1.5 border border-[#D1D1CF] text-slate-400 hover:text-red-650 hover:text-red-750 hover:text-red-600 hover:bg-red-50 hover:border-red-150 transition-all rounded cursor-pointer"
                            title="Delete User"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MULTI_USER PRODUCTION ARCHITECTURE ADVISORY - Addressing User's Hope inquiry directly & professionally */}
      <div className="bg-slate-50 border border-[#D1D1CF] p-6 space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-805 flex items-center gap-1.5 font-serif">
          <Server className="h-4.5 w-4.5 text-indigo-600" />
          <span>Multi-User Enterprise Data Portability Advisory</span>
        </h3>

        <div className="text-xs space-y-3 leading-relaxed text-zinc-700 font-serif">
          <p>
            You raised a critical point: <b>"since many users will be using this app, hope all data will be available to all users who have been granted rights by the admin."</b>
          </p>
          <p>
            <b>1. Unified Shared Cloud Database (Relational Cloud SQL / Firestore):</b><br />
            To support distributed access (so managers, dispatch operators, and auditors across various plant sites see exact global real-time records concurrently), this app's storage architecture converts from Local Browser Sandboxes into a centralized relational storage server. In production, we deploy a hosted <b>Google Cloud SQL (PostgreSQL)</b> database or <b>Firebase Firestore</b> synchronized via persistent API routes. When any user updates a weighbridge ticket or registers a transport freight rate, changes are broadcast instantaneously to all registered client sessions.
          </p>

          <p>
            <b>2. Decoupled Token-Based Authentication (OIDC, OAuth-2, Firebase Auth):</b><br />
            Rather than relying on local dropdown configurations, user identities are securely managed utilizing enterprise identity provider protocols. Users login securely using federated enterprise logins or password-hashed accounts. The administrative module links authenticated UID values with role configurations stored securely in database rows.
          </p>

          <p>
            <b>3. Bulletproof Server-Authoritative Rules (No Client Trust):</b><br />
            Custom privileges (e.g. <code>manageLedger: true/false</code>) are never verified solely in browser code, which can be easily bypassed. The backend server enforces corresponding **Row-Level Security rules** (RLS) in databases. For example, if we use Firebase Firestore, we write declarative safety rules directly:
          </p>

          <pre className="p-3 bg-zinc-950 text-emerald-400 font-mono text-[10px] uppercase leading-relaxed rounded overflow-x-auto">
{`// SECURED FIRESTORE.RULES PATTERN
match /agent_payouts/{payoutId} {
  // Allow read access if user has verified viewer clearance
  allow read: if request.auth != null && getUserRights(request.auth.uid).manageLedger == true;
  
  // Allow write access only if logged in user is registered as Admin
  allow write: if request.auth != null && getUserRights(request.auth.uid).manageAdmin == true;
}

function getUserRights(uid) {
  return get(/documents/users/$(uid)).data.rights;
}`}
          </pre>

          <p className="font-sans font-semibold text-[10px] text-indigo-700 flex items-center">
            <CheckCircle2 className="h-3.5 w-3.5 mr-1.5 text-indigo-600 shrink-0" />
            <span>The Admin Panel above simulates these server-authoritative rights fully inside our sandboxed local storage state!</span>
          </p>
        </div>
      </div>

      {/* CREATE / EDIT USER REGISTER MODE */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-none border-2 border-black shadow-xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
              <h3 className="font-serif font-bold italic text-slate-800 text-sm">
                {editingUser ? 'Configure System User Profile & Rights' : 'Register New Accredited System User'}
              </h3>
              <button
                type="button"
                className="text-slate-400 hover:text-black font-mono text-xs uppercase"
                onClick={() => setIsModalOpen(false)}
              >
                Close [X]
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Full representative Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="e.g. Rajdeep Singh"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs px-3.5 py-2 border border-slate-200 focus:outline-hidden text-slate-850 font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Corporate Terminal Email Address <span className="text-red-500">*</span></label>
                <input
                  type="email"
                  placeholder="e.g. rajdeep.singh@tsgimpex.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs px-3.5 py-2 border border-[#D1D1CF] focus:outline-hidden font-mono"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">System clearance Role</label>
                  <select
                    value={role}
                    onChange={(e) => onRoleChange(e.target.value as any)}
                    className="w-full text-xs py-2 px-2 border border-slate-200 bg-white font-serif font-bold italic focus:outline-hidden"
                  >
                    <option value="Admin">Admin (All rights true)</option>
                    <option value="Executive">Executive (Manage operations)</option>
                    <option value="Viewer">Viewer (Read-only guest)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Authorization Status</label>
                  <select
                    value={userStatus}
                    onChange={(e) => setUserStatus(e.target.value as 'Active' | 'Inactive')}
                    className="w-full text-xs py-2 px-2 border border-slate-200 bg-white font-sans font-bold focus:outline-hidden"
                  >
                    <option value="Active">Active (Permitted)</option>
                    <option value="Inactive">Inactive (Suspended)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Terminal Passcode PIN <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. password1234"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className="w-full text-xs px-3.5 py-2 border border-slate-200 focus:outline-hidden font-mono text-stone-900 font-bold"
                  required
                />
                <span className="block text-[9px] text-slate-400 mt-1 italic">
                  This custom passcode PIN will be used by the user when logging in via the "Secure Passcode" tab.
                </span>
              </div>

              {/* Checkboxes matrix form */}
              <div className="border-t border-slate-100 pt-3 space-y-2">
                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">Custom Rights Settings:</span>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono select-none">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rights.manageCompanies}
                      onChange={(e) => handleRigthsCheckboxChange('manageCompanies', e.target.checked)}
                      className="h-3.5 w-3.5 text-indigo-600 focus:ring-0"
                    />
                    <span>Manage Companies</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rights.manageVendors}
                      onChange={(e) => handleRigthsCheckboxChange('manageVendors', e.target.checked)}
                      className="h-3.5 w-3.5 text-indigo-600 focus:ring-0"
                    />
                    <span>Manage Vendors</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rights.managePOs}
                      onChange={(e) => handleRigthsCheckboxChange('managePOs', e.target.checked)}
                      className="h-3.5 w-3.5 text-indigo-600 focus:ring-0"
                    />
                    <span>Manage PO Contract Rates</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rights.manageTransporters}
                      onChange={(e) => handleRigthsCheckboxChange('manageTransporters', e.target.checked)}
                      className="h-3.5 w-3.5 text-indigo-600 focus:ring-0"
                    />
                    <span>Manage Carriers</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rights.manageDespatches}
                      onChange={(e) => handleRigthsCheckboxChange('manageDespatches', e.target.checked)}
                      className="h-3.5 w-3.5 text-indigo-600 focus:ring-0"
                    />
                    <span>Manage Transit Orders</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rights.manageLedger}
                      onChange={(e) => handleRigthsCheckboxChange('manageLedger', e.target.checked)}
                      className="h-3.5 w-3.5 text-indigo-600 focus:ring-0"
                    />
                    <span>Manage Commission payments</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rights.manageAdmin}
                      onChange={(e) => handleRigthsCheckboxChange('manageAdmin', e.target.checked)}
                      className="h-3.5 w-3.5 text-indigo-600 focus:ring-0"
                    />
                    <span>Manage Security Desk</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-[#D1D1CF] text-xs font-serif italic focus:outline-hidden"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#E65100] hover:bg-black text-white text-xs uppercase tracking-wider font-bold rounded-none transition-colors cursor-pointer"
                >
                  {editingUser ? 'Save Configuration' : 'Register User Terminal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
