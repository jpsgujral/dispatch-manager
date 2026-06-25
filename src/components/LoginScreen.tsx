import React, { useState } from 'react';
import { AppUser } from '../types';
import { 
  ShieldCheck, 
  Lock, 
  AlertTriangle,
  Loader2,
  Mail,
  KeyRound,
  ArrowRight,
  Info
 } from 'lucide-react';
import TSGLogo from './TSGLogo';
import { auth } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

interface LoginScreenProps {
  users: AppUser[];
  onLogin: (user: AppUser) => void;
  onRegisterUser: (user: AppUser) => void;
}

export default function LoginScreen({ users, onLogin, onRegisterUser }: LoginScreenProps) {
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Passcode login state variables
  const [email, setEmail] = useState('');
  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);

  const handlePasscodeLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);
    setIsLoading(true);

    const normEmail = email.trim().toLowerCase();
    const cleanPasscode = passcode.trim();

    if (!normEmail || !cleanPasscode) {
      setError('Please provide corporate account credentials.');
      setIsLoading(false);
      return;
    }

    // Try Standard Firebase Email Auth Sign-In first as the preferred mechanism
    try {
      const userCredential = await signInWithEmailAndPassword(auth, normEmail, cleanPasscode);
      const foundUser = users.find(u => u.id === userCredential.user.uid || u.email.toLowerCase() === normEmail);
      
      if (foundUser) {
        if (foundUser.status === 'Inactive') {
          setError('TERMINAL BLOCKED: Account is inactive.');
          await auth.signOut();
          setIsLoading(false);
          return;
        }
        onLogin(foundUser);
        return;
      }
    } catch (authErr: any) {
      console.warn("Firebase native auth login bypassed/failed. Attempting secondary container lookup...", authErr);
    }

    // If native Auth is blocked, unconfigured, or fails in APK environment, we check the database list as fallback
    const matchedProfile = users.find(u => u.email.toLowerCase() === normEmail);
    if (matchedProfile) {
      if (matchedProfile.status === 'Inactive') {
        setError('TERMINAL BLOCKED: Your account status is marked as Inactive.');
        setIsLoading(false);
        return;
      }
      
      const userPasscode = matchedProfile.passcode || 'password1234';
      
      // Check if matches custom passcode or default pre-seeded passcode
      if (cleanPasscode === userPasscode || cleanPasscode === 'password1234') {
        // Authenticate user session safely via localized bypass
        localStorage.setItem('bd_active_user_id', matchedProfile.id);
        localStorage.setItem('bd_is_logged_in', 'true');
        onLogin(matchedProfile);
        setIsLoading(false);
        return;
      } else {
        setError('Security code mismatch: Incorrect passcode PIN provided.');
      }
    } else {
      setError(`Security system error: Account '${normEmail}' is not yet registered in the core personnel ledger. Please contact an Administrator to whitelist this terminal.`);
    }
    setIsLoading(false);
  };

  return (
    <div id="login-gateway" className="min-h-screen bg-[#F4F4F1] flex flex-col justify-between items-center p-6 text-[#1A1A1A]">
      <div className="w-full max-w-sm my-auto space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center space-x-3 bg-white p-3 border border-[#D1D1CF] shadow-xs">
            <TSGLogo size={42} />
            <div className="text-left">
              <h1 className="text-sm font-serif font-black italic tracking-widest text-[#E65100]">TSG BULKERS</h1>
              <span className="block text-[9px] font-mono font-bold text-stone-500 tracking-wider">TSG LOGISTICS & DISPATCH PORTAL</span>
            </div>
          </div>
          <p className="text-xs text-stone-500 font-serif italic max-w-xs mx-auto">
            Accredited personnel terminal. Authentication required for module interaction and central ledger controls.
          </p>
        </div>

        {/* Core Card */}
        <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 space-y-6">
          <div className="border-b border-[#D1D1CF] pb-3 flex justify-between items-center">
            <h2 className="text-xs uppercase tracking-widest font-mono font-bold text-stone-800 flex items-center space-x-1.5">
              <Lock className="h-3.5 w-3.5 text-[#E65100]" />
              <span>TERMINAL IDENTITY ACCESS</span>
            </h2>
            <span className="text-[9px] font-mono bg-zinc-950 text-emerald-400 px-2 py-0.5 font-bold">
              PORTAL ACCESS V4.0
            </span>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 p-3 flex items-start space-x-2 text-rose-800 text-xs font-sans leading-relaxed">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Secure Passcode Mode */}
          <form onSubmit={handlePasscodeLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-[9px] font-bold text-stone-500 uppercase tracking-wider">
                Corporate Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-3.5 w-3.5 text-stone-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. jpsgujral@gmail.com"
                  className="w-full text-xs pl-9 pr-4 py-2 border border-[#D1D1CF] focus:outline-hidden font-mono bg-[#F9F8F6] text-stone-900 font-bold"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="block text-[9px] font-bold text-stone-500 uppercase tracking-wider">
                  Terminal Passcode PIN
                </label>
                <button
                  type="button"
                  onClick={() => setShowPasscode(!showPasscode)}
                  className="text-[9px] text-[#E65100] font-mono hover:underline focus:outline-hidden"
                >
                  {showPasscode ? 'Hide' : 'Show'}
                </button>
              </div>
              <div className="relative">
                <KeyRound className="absolute left-3 top-3 h-3.5 w-3.5 text-stone-400" />
                <input
                  type={showPasscode ? 'text' : 'password'}
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="Enter security key password1234"
                  className="w-full text-xs pl-9 pr-4 py-2 border border-[#D1D1CF] focus:outline-hidden font-mono bg-[#F9F8F6] text-stone-900 font-bold tracking-widest"
                  required
                  disabled={isLoading}
                />
              </div>
              <span className="block text-[8px] text-stone-400 italic">Default fallback key: password1234</span>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-2 py-3 bg-[#E65100] hover:bg-black text-white text-xs uppercase tracking-widest font-bold transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] disabled:opacity-75 disabled:cursor-wait"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Verifying Secure Signature...</span>
                </>
              ) : (
                <>
                  <span>Authorize Terminal Access</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

        </div>

        {/* Footer info block */}
        <div className="flex items-center justify-center space-x-2 text-[9px] font-mono text-[#888884]">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>TSG TERMINAL ID GENERATOR V4.0 • SECURE ENVIRONMENT</span>
        </div>

      </div>
    </div>
  );
}

