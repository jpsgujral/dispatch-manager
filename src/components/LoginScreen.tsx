import React, { useState } from 'react';
import { AppUser } from '../types';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  ArrowRight, 
  UserCheck, 
  Eye, 
  EyeOff, 
  KeyRound, 
  CheckCircle2, 
  AlertTriangle,
  UserPlus
} from 'lucide-react';
import TSGLogo from './TSGLogo';

interface LoginScreenProps {
  users: AppUser[];
  onLogin: (user: AppUser) => void;
  onRegisterUser: (name: string, email: string, role: 'Admin' | 'Executive' | 'Viewer') => void;
}

export default function LoginScreen({ users, onLogin, onRegisterUser }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Registration inline form toggle
  const [isRegistering, setIsRegistering] = useState(false);
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regRole, setRegRole] = useState<'Admin' | 'Executive' | 'Viewer'>('Executive');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const normEmail = email.trim().toLowerCase();
    if (!normEmail) {
      setError('Please provide your corporate terminal email address.');
      return;
    }

    const foundUser = users.find(u => u.email.toLowerCase() === normEmail);

    if (!foundUser) {
      setError('E-mail address is not registered in the system. Use the Quick Access listing or Register Account below.');
      return;
    }

    if (foundUser.status === 'Inactive') {
      setError('TERMINAL BLOCKED: Your account status is marked as Inactive. Please contact J.P.S. Gujral to restore access.');
      return;
    }

    // Passcode validation (accept 1234, or let it slide for demo with a friendly prompt)
    if (password && password !== '1234') {
      setError('Security verification failed. Invalid passcode. (Demo default passcode is 1234)');
      return;
    }

    // Success
    onLogin(foundUser);
  };

  const handleQuickLogin = (user: AppUser) => {
    setError(null);
    if (user.status === 'Inactive') {
      setError(`TERMINAL BLOCKED: ${user.name}'s account is marked as Inactive.`);
      return;
    }
    setEmail(user.email);
    setPassword('1234');
    onLogin(user);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const name = regName.trim();
    const emailStr = regEmail.trim().toLowerCase();

    if (!name || !emailStr) {
      setError('Please fill out all registration fields.');
      return;
    }

    const alreadyExists = users.some(u => u.email.toLowerCase() === emailStr);
    if (alreadyExists) {
      setError('A corporate terminal with this email address already exists.');
      return;
    }

    onRegisterUser(name, emailStr, regRole);
    
    // Auto populate and show success
    setEmail(emailStr);
    setPassword('1234');
    setIsRegistering(false);
    
    // Clear forms
    setRegName('');
    setRegEmail('');
  };

  return (
    <div id="login-gateway" className="min-h-screen bg-[#F4F4F1] flex flex-col justify-between items-center p-6 text-[#1A1A1A]">
      <div className="w-full max-w-md my-auto space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center space-x-3 bg-white p-3 border border-[#D1D1CF] shadow-xs">
            <TSGLogo size={42} />
            <div className="text-left">
              <h1 className="text-sm font-serif font-black italic tracking-widest text-[#E65100]">SARDAR BULKERS</h1>
              <span className="block text-[9px] font-mono font-bold text-stone-500 tracking-wider">TSG LOGISTICS & DISPATCH PORTAL</span>
            </div>
          </div>
          <p className="text-xs text-stone-500 font-serif italic max-w-sm mx-auto">
            Accredited personnel terminal. Authentication required for module interaction and central ledger controls.
          </p>
        </div>

        {/* Core Card */}
        <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 space-y-6">
          <div className="border-b border-[#D1D1CF] pb-3 flex justify-between items-center">
            <h2 className="text-xs uppercase tracking-widest font-mono font-bold text-stone-800 flex items-center space-x-1.5">
              <Lock className="h-3.5 w-3.5 text-[#E65100]" />
              <span>{isRegistering ? 'REGISTER GATEWAY ENTRY' : 'TERMINAL ID VERIFICATION'}</span>
            </h2>
            <span className="text-[9px] font-mono bg-zinc-950 text-emerald-400 px-2 py-0.5 font-bold">
              SSL SECURE
            </span>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 p-3 flex items-start space-x-2 text-rose-800 text-xs font-sans leading-relaxed">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {!isRegistering ? (
            /* Login Form */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[9px] font-bold text-stone-500 uppercase tracking-wider">
                  Corporate Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-stone-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. jpsgujral@gmail.com"
                    className="w-full text-xs pl-9 pr-4 py-2.5 border border-[#D1D1CF] focus:outline-hidden font-mono bg-[#F9F8F6] text-stone-900 font-bold"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="block text-[9px] font-bold text-stone-500 uppercase tracking-wider">
                    Secured PIN / Password (Demo: 1234)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[9px] text-[#E65100] font-mono hover:underline focus:outline-hidden"
                  >
                    {showPassword ? 'Hide Secret' : 'View Secret'}
                  </button>
                </div>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-3 h-4 w-4 text-stone-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter security passcode key"
                    className="w-full text-xs pl-9 pr-4 py-2.5 border border-[#D1D1CF] focus:outline-hidden font-mono bg-[#F9F8F6] text-stone-900 font-bold tracking-widest"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center space-x-2 py-3 bg-[#E65100] hover:bg-black text-white text-xs uppercase tracking-widest font-bold transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
              >
                <span>Authorize Terminal Access</span>
                <ArrowRight className="h-4 w-4 font-black" />
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setIsRegistering(true)}
                  className="inline-flex items-center space-x-1.5 text-xs text-stone-600 hover:text-black font-serif italic"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>Don't have an account? Register Corporate Terminal</span>
                </button>
              </div>
            </form>
          ) : (
            /* Register Form */
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[9px] font-bold text-stone-500 uppercase tracking-wider">
                  Full Representative Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Jasmit Singh"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 border border-[#D1D1CF] focus:outline-hidden font-serif font-bold italic bg-[#F9F8F6] text-stone-900"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[9px] font-bold text-stone-500 uppercase tracking-wider">
                  Corporate Terminal Email
                </label>
                <input
                  type="email"
                  placeholder="e.g. jasmit@tsgimpex.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 border border-[#D1D1CF] focus:outline-hidden font-mono bg-[#F9F8F6] text-stone-900"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[9px] font-bold text-stone-500 uppercase tracking-wider">
                  Default Role Assignment
                </label>
                <select
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value as any)}
                  className="w-full text-xs py-2 px-2 border border-[#D1D1CF] bg-[#F9F8F6] font-serif font-bold italic focus:outline-hidden text-stone-900"
                >
                  <option value="Admin">Admin (Full access to all modules)</option>
                  <option value="Executive">Executive (Custom dispatch & operational control)</option>
                  <option value="Viewer">Viewer (Read-only access limits)</option>
                </select>
                <p className="text-[10px] text-stone-400 mt-1 italic leading-tight">
                  Note: Custom module permissions can be configured inside the "Security Desk" once logged in as an Admin.
                </p>
              </div>

              <div className="pt-2 flex space-x-3">
                <button
                  type="button"
                  onClick={() => setIsRegistering(false)}
                  className="w-1/2 py-2 border border-[#D1D1CF] text-xs font-serif italic text-stone-600 hover:text-black hover:bg-stone-50 transition-colors"
                >
                  Back to Sign In
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-black hover:bg-[#E65100] text-white text-xs uppercase tracking-wider font-extrabold transition-all cursor-pointer"
                >
                  Create Terminal
                </button>
              </div>
            </form>
          )}

          {/* Quick Access Swapper Panel inside Login Card */}
          <div className="border-t border-dashed border-[#D1D1CF] pt-4 mt-2">
            <span className="block text-[9px] font-mono font-bold tracking-widest uppercase text-[#888884] mb-2.5 text-center">
              DEMONSTRATION ACCESS KEYS (BYPASS SIGN IN)
            </span>
            <div className="grid grid-cols-1 gap-2">
              {users.map(u => (
                <button
                  key={u.id}
                  onClick={() => handleQuickLogin(u)}
                  className="flex items-center justify-between text-left p-2.5 border border-[#D1D1CF] hover:border-black hover:bg-amber-50/50 transition-colors cursor-pointer group"
                  title={`Fast Login as ${u.name}`}
                >
                  <div className="flex items-center space-x-2">
                    <UserCheck className="h-4 w-4 text-[#E65100] opacity-80" />
                    <div>
                      <span className="block text-xs font-serif font-bold italic text-stone-900 leading-none">
                        {u.name}
                      </span>
                      <span className="block text-[9px] font-mono text-stone-500 mt-0.5">
                        {u.email}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block text-[8px] tracking-wide uppercase font-black px-1.5 py-0.5 rounded border ${
                      u.role === 'Admin' ? 'bg-indigo-50 text-indigo-700 border-indigo-150' : 
                      u.role === 'Executive' ? 'bg-amber-50 text-amber-700 border-amber-150' : 'bg-slate-100 text-slate-650'
                    }`}>
                      {u.role}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer info block */}
        <div className="flex items-center justify-center space-x-2 text-[9px] font-mono text-[#888884]">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>SARDAR TERMINAL ID GENERATOR V2.4 • SECURE ENVIRONMENT</span>
        </div>

      </div>
    </div>
  );
}
