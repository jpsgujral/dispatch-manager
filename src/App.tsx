import React, { useState, useEffect } from 'react';
import { 
  Company, 
  Vendor, 
  PurchaseOrder, 
  Transporter, 
  Agent, 
  DespatchOrder,
  AppUser,
  UserRights,
  AgentPayment,
  TransporterPayment,
  SourceLocation
} from './types';
import { 
  INITIAL_COMPANIES, 
  INITIAL_VENDORS, 
  INITIAL_TRANSPORTERS, 
  INITIAL_AGENTS, 
  INITIAL_POS, 
  INITIAL_DOS,
  INITIAL_USERS,
  INITIAL_PAYMENTS,
  INITIAL_TRANSPORTER_PAYMENTS,
  INITIAL_SOURCES
} from './data';
import { subscribeToCollection, saveDocument, deleteDocument, resetCollectionWithSeeds } from './firebaseService';

// Component Imports
import Dashboard from './components/Dashboard';
import CompanyMaster from './components/CompanyMaster';
import TSGLogo from './components/TSGLogo';
import VendorMaster from './components/VendorMaster';
import POMaster from './components/POMaster';
import TransporterMaster from './components/TransporterMaster';
import AgentMaster from './components/AgentMaster';
import DOMaster from './components/DOMaster';
import ChallanModal from './components/ChallanModal';
import CommissionLedger from './components/CommissionLedger';
import UserAdminPanel from './components/UserAdminPanel';
import TransporterPaymentPanel from './components/TransporterPaymentPanel';
import SourceMaster from './components/SourceMaster';
import Reports from './components/Reports';
import NotificationCenter from './components/NotificationCenter';
import LoginScreen from './components/LoginScreen';

// Icon Imports
import { 
  LayoutDashboard, 
  Building, 
  Users, 
  FileCheck, 
  Truck, 
  UserSquare2, 
  FileText, 
  Download, 
  Upload, 
  RefreshCw, 
  Layers,
  ChevronRight,
  Database,
  Menu,
  X,
  ShieldCheck,
  Lock,
  Unlock,
  DollarSign,
  TrendingUp,
  Mail
} from 'lucide-react';


export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('bd_is_logged_in') === 'true';
  });

  // Master State Managed in LocalStorage
  const [companies, setCompanies] = useState<Company[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [transporters, setTransporters] = useState<Transporter[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [sources, setSources] = useState<SourceLocation[]>([]);
  const [pos, setPos] = useState<PurchaseOrder[]>([]);
  const [dos, setDos] = useState<DespatchOrder[]>([]);

  // Administrative Users State & broker payouts state
  const [users, setUsers] = useState<AppUser[]>([]);
  const [activeUser, setActiveUser] = useState<AppUser | null>(null);
  const [payments, setPayments] = useState<AgentPayment[]>([]);
  const [transporterPayments, setTransporterPayments] = useState<TransporterPayment[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Selected Challan Preview Overlay
  const [selectedChallanDo, setSelectedChallanDo] = useState<DespatchOrder | null>(null);

  // Synchronize state with Firebase Firestore in real-time
  useEffect(() => {
    const unsubCompanies = subscribeToCollection<Company>('companies', setCompanies, INITIAL_COMPANIES);
    const unsubVendors = subscribeToCollection<Vendor>('vendors', setVendors, INITIAL_VENDORS);
    const unsubTransporters = subscribeToCollection<Transporter>('transporters', setTransporters, INITIAL_TRANSPORTERS);
    const unsubAgents = subscribeToCollection<Agent>('agents', setAgents, INITIAL_AGENTS);
    const unsubSources = subscribeToCollection<SourceLocation>('sources', setSources, INITIAL_SOURCES);
    const unsubPos = subscribeToCollection<PurchaseOrder>('pos', setPos, INITIAL_POS);
    const unsubDos = subscribeToCollection<DespatchOrder>('dos', setDos, INITIAL_DOS);
    const unsubUsers = subscribeToCollection<AppUser>('users', setUsers, INITIAL_USERS);
    const unsubPayments = subscribeToCollection<AgentPayment>('payments', setPayments, INITIAL_PAYMENTS);
    const unsubTransporterPayments = subscribeToCollection<TransporterPayment>('transporter_payments', setTransporterPayments, INITIAL_TRANSPORTER_PAYMENTS);
    const unsubNotifications = subscribeToCollection<any>('notifications', setNotifications, []);

    return () => {
      unsubCompanies();
      unsubVendors();
      unsubTransporters();
      unsubAgents();
      unsubSources();
      unsubPos();
      unsubDos();
      unsubUsers();
      unsubPayments();
      unsubTransporterPayments();
      unsubNotifications();
    };
  }, []);

  // Sync activeUser whenever users list updates from firestore
  useEffect(() => {
    if (users.length > 0) {
      const savedActiveUserId = localStorage.getItem('bd_active_user_id');
      const found = users.find((u) => u.id === savedActiveUserId);
      const savedIsLoggedIn = localStorage.getItem('bd_is_logged_in') === 'true';

      if (found && savedIsLoggedIn) {
        if (found.status === 'Inactive') {
          setActiveUser(null);
          setIsLoggedIn(false);
          localStorage.removeItem('bd_is_logged_in');
        } else {
          setActiveUser(found);
          setIsLoggedIn(true);
        }
      } else {
        setActiveUser(null);
        setIsLoggedIn(false);
        localStorage.removeItem('bd_is_logged_in');
      }
    }
  }, [users]);

  // Companies Actions
  const handleAddCompany = (item: Omit<Company, 'id' | 'createdAt'>) => {
    const newCo: Company = {
      ...item,
      id: `co-${Date.now()}`,
      createdAt: new Date().toISOString().substring(0, 10),
    };
    saveDocument('companies', newCo);
  };

  const handleEditCompany = (item: Company) => {
    saveDocument('companies', item);
  };

  const handleDeleteCompany = (id: string) => {
    deleteDocument('companies', id);
  };

  // Vendors Actions
  const handleAddVendor = (item: Omit<Vendor, 'id' | 'createdAt'>) => {
    const newV: Vendor = {
      ...item,
      id: `v-${Date.now()}`,
      createdAt: new Date().toISOString().substring(0, 10),
    };
    saveDocument('vendors', newV);
  };

  const handleEditVendor = (item: Vendor) => {
    saveDocument('vendors', item);
  };

  const handleDeleteVendor = (id: string) => {
    deleteDocument('vendors', id);
  };

  // Transporters Actions
  const handleAddTransporter = (item: Omit<Transporter, 'id' | 'createdAt'>) => {
    const newT: Transporter = {
      ...item,
      id: `t-${Date.now()}`,
      createdAt: new Date().toISOString().substring(0, 10),
    };
    saveDocument('transporters', newT);
  };

  const handleEditTransporter = (item: Transporter) => {
    saveDocument('transporters', item);
  };

  const handleDeleteTransporter = (id: string) => {
    deleteDocument('transporters', id);
  };

  // Agents Actions
  const handleAddAgent = (item: Omit<Agent, 'id' | 'createdAt'>) => {
    const newA: Agent = {
      ...item,
      id: `a-${Date.now()}`,
      createdAt: new Date().toISOString().substring(0, 10),
    };
    saveDocument('agents', newA);
  };

  const handleEditAgent = (item: Agent) => {
    saveDocument('agents', item);
  };

  const handleDeleteAgent = (id: string) => {
    deleteDocument('agents', id);
  };

  // Source Master Actions
  const handleAddSource = (name: string, pincode: string) => {
    const newSrc: SourceLocation = {
      id: `src-${Date.now()}`,
      name,
      pincode,
      createdAt: new Date().toISOString().substring(0, 10),
    };
    saveDocument('sources', newSrc);
    return newSrc;
  };

  const handleDeleteSource = (id: string) => {
    if (dos.some(d => d.sourceId === id && d.status !== 'Cancelled')) {
      alert("Error: This Source Location is currently referenced inside active Despatch Orders. Please delete those orders or reassign their source first.");
      return;
    }
    deleteDocument('sources', id);
  };

  // Purchase Order Actions
  const handleAddPO = (item: Omit<PurchaseOrder, 'id' | 'createdAt'>) => {
    const newP: PurchaseOrder = {
      ...item,
      id: `po-${Date.now()}`,
      createdAt: new Date().toISOString().substring(0, 10),
    };
    saveDocument('pos', newP);
  };

  const handleEditPO = (item: PurchaseOrder) => {
    saveDocument('pos', item);
  };

  const handleDeletePO = (id: string) => {
    deleteDocument('pos', id);
  };

  // Despatch Order Actions
  const handleAddDO = (item: Omit<DespatchOrder, 'id' | 'doNumber' | 'createdAt'>) => {
    // Determine next sequential DO Number
    const activeYear = new Date().getFullYear();
    const prefix = `DO-${activeYear}-`;
    
    // Find all DOs with same year and extract sequence
    const yearDos = dos.filter(d => d.doNumber.startsWith(prefix));
    let nextNum = 1;

    if (yearDos.length > 0) {
      const numbers = yearDos.map(d => {
        const parts = d.doNumber.split('-');
        const parsed = parseInt(parts[parts.length - 1]);
        return isNaN(parsed) ? 0 : parsed;
      });
      nextNum = Math.max(...numbers) + 1;
    } else {
      nextNum = dos.length + 1;
    }

    const paddedSeq = String(nextNum).padStart(4, '0');
    const generatedDoNumber = `${prefix}${paddedSeq}`;

    const newDo: DespatchOrder = {
      ...item,
      id: `do-${Date.now()}`,
      doNumber: generatedDoNumber,
      createdAt: new Date().toISOString().substring(0, 10),
    };

    saveDocument('dos', newDo);

    // Trigger automated email summaries for new 'In Transit' orders using the template system
    const transporter = transporters.find(t => t.id === newDo.transporterId);
    const po = pos.find(p => p.id === newDo.poId);
    const src = sources.find(s => s.id === newDo.sourceId);

    const DEFAULT_SUBJECT_TEMPLATE = "New Despatch Issued: {doNumber} is In Transit ({vehicleNumber})";
    const DEFAULT_BODY_TEMPLATE = `Dear {transporterName},

This is an automated notification of a new In-Transit order dispatched under our network.

Order Details:
- Despatch Order Number: {doNumber}
- Vehicle/Bulker Number: {vehicleNumber}
- Commodity Type: {material}
- Source Location: {sourceLocation}
- Dispatch Plant: {vendorPlant}
- Loaded Tonnage: {loadedWeight} MT
- Date of Despatch: {date}

Please ensure safety guidelines are followed during transit. For live updates or concerns, reply directly to this notification.

Best regards,
Logistics Team
Sardar Infrastructure & Minerals Ltd`;

    const subjectTemplate = localStorage.getItem('cfg_notification_subject_template') || DEFAULT_SUBJECT_TEMPLATE;
    const bodyTemplate = localStorage.getItem('cfg_notification_body_template') || DEFAULT_BODY_TEMPLATE;

    const dataMap: Record<string, string> = {
      doNumber: newDo.doNumber,
      vehicleNumber: newDo.vehicleNumber,
      transporterName: transporter?.name || 'N/A',
      material: po?.material || 'Fly Ash',
      sourceLocation: src ? `${src.name} (${src.pincode})` : 'Main Mines loading',
      vendorPlant: newDo.vendorPlant || 'Main Depot',
      loadedWeight: newDo.loadedWeight !== null ? `${newDo.loadedWeight.toFixed(2)}` : 'Pending',
      date: newDo.date
    };

    let finalSubject = subjectTemplate;
    let finalBody = bodyTemplate;

    Object.keys(dataMap).forEach(key => {
      const value = dataMap[key];
      finalSubject = finalSubject.replaceAll(`{${key}}`, value);
      finalBody = finalBody.replaceAll(`{${key}}`, value);
    });

    const mockEmailStatus = transporter?.email ? 'Sent' : 'Failed';

    const notifLog = {
      id: `notif-${Date.now()}`,
      doId: newDo.id,
      doNumber: newDo.doNumber,
      transporterId: newDo.transporterId,
      transporterName: transporter?.name || 'N/A',
      recipientEmail: transporter?.email || '',
      subject: finalSubject,
      body: finalBody,
      status: mockEmailStatus as 'Sent' | 'Failed',
      sentAt: new Date().toLocaleTimeString() + ' ' + new Date().toISOString().substring(0, 10)
    };

    saveDocument('notifications', notifLog);
  };

  const handleSendTestEmail = (email: string, subject: string, body: string) => {
    const mockLog = {
      id: `notif-test-${Date.now()}`,
      doId: '',
      doNumber: 'SANDBOX-TEST',
      transporterId: 'SANDBOX',
      transporterName: 'Sandbox Test Recipient',
      recipientEmail: email,
      subject: subject,
      body: body,
      status: 'Sent' as 'Sent',
      sentAt: new Date().toLocaleTimeString() + ' ' + new Date().toISOString().substring(0, 10)
    };
    saveDocument('notifications', mockLog);
  };

  const handleUpdateReceivedWeight = (
    id: string, 
    receivedWeight: number | null, 
    remarks?: string,
    deliveryDocUrl?: string,
    deliveryDocName?: string,
    status?: 'In Transit' | 'Delivered' | 'Cancelled'
  ) => {
    const item = dos.find(d => d.id === id);
    if (item) {
      const updatedDo: DespatchOrder = {
        ...item,
        receivedWeight,
        remarks: remarks !== undefined ? remarks : item.remarks,
        status: status || 'Delivered',
        deliveryDocUrl: deliveryDocUrl !== undefined ? deliveryDocUrl : item.deliveryDocUrl,
        deliveryDocName: deliveryDocName !== undefined ? deliveryDocName : item.deliveryDocName,
      };
      saveDocument('dos', updatedDo);
    }
  };

  const handleCancelDO = (id: string) => {
    const item = dos.find(d => d.id === id);
    if (item) {
      const updatedDo: DespatchOrder = {
        ...item,
        status: 'Cancelled',
      };
      saveDocument('dos', updatedDo);
    }
  };

  // Simulated Login Selector
  const handleSelectActiveUser = (userId: string) => {
    const selected = users.find(u => u.id === userId);
    if (selected) {
      setActiveUser(selected);
      setIsLoggedIn(true);
      localStorage.setItem('bd_active_user_id', userId);
      localStorage.setItem('bd_is_logged_in', 'true');
    }
  };

  const handleLogin = (user: AppUser) => {
    setActiveUser(user);
    setIsLoggedIn(true);
    localStorage.setItem('bd_active_user_id', user.id);
    localStorage.setItem('bd_is_logged_in', 'true');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('bd_is_logged_in');
    setActiveUser(null);
  };

  const handleRegisterUser = (name: string, email: string, role: 'Admin' | 'Executive' | 'Viewer') => {
    const defaultRights: UserRights = {
      manageCompanies: role === 'Admin' || role === 'Executive',
      manageVendors: role === 'Admin' || role === 'Executive',
      managePOs: role === 'Admin' || role === 'Executive',
      manageTransporters: role === 'Admin' || role === 'Executive',
      manageDespatches: role === 'Admin' || role === 'Executive',
      manageLedger: role === 'Admin',
      manageAdmin: role === 'Admin',
    };
    const newUser: AppUser = {
      id: `u-${Date.now()}`,
      name,
      email,
      role,
      status: 'Active',
      rights: defaultRights,
      createdAt: new Date().toISOString().substring(0, 10),
    };
    saveDocument('users', newUser);
    setActiveUser(newUser);
    setIsLoggedIn(true);
    localStorage.setItem('bd_active_user_id', newUser.id);
    localStorage.setItem('bd_is_logged_in', 'true');
  };

  // Add User
  const handleAddUser = (item: Omit<AppUser, 'id' | 'createdAt'>) => {
    const newUser: AppUser = {
      ...item,
      id: `u-${Date.now()}`,
      createdAt: new Date().toISOString().substring(0, 10),
    };
    saveDocument('users', newUser);
  };

  // Update User Rights Matrix
  const handleUpdateUserRights = (userId: string, targetRights: UserRights) => {
    const u = users.find(user => user.id === userId);
    if (u) {
      const uCopy = { ...u, rights: targetRights };
      saveDocument('users', uCopy);
    }
  };

  // Toggle User Status
  const handleToggleUserStatus = (userId: string) => {
    const u = users.find(user => user.id === userId);
    if (u) {
      const nextStatus = u.status === 'Active' ? 'Inactive' : 'Active';
      const uCopy: AppUser = { ...u, status: nextStatus };
      saveDocument('users', uCopy);
    }
  };

  // Delete User
  const handleDeleteUser = (userId: string) => {
    deleteDocument('users', userId);
  };

  // Payout actions
  const handleAddPayment = (payout: Omit<AgentPayment, 'id' | 'createdAt'>) => {
    const newPayout: AgentPayment = {
      ...payout,
      id: `pay-${Date.now()}`,
      createdAt: new Date().toISOString().substring(0, 10),
    };
    saveDocument('payments', newPayout);
  };

  const handleDeletePayment = (paymentId: string) => {
    deleteDocument('payments', paymentId);
  };

  // Transporter Payments & Documents Actions
  const handleAddTransporterPayment = (payout: Omit<TransporterPayment, 'id' | 'createdAt'>) => {
    const newDocId = `tpay-${Date.now()}`;
    const newPayout: TransporterPayment = {
      ...payout,
      id: newDocId,
      createdAt: new Date().toISOString().substring(0, 10),
    };

    saveDocument('transporter_payments', newPayout);

    // Lock corresponding despatch orders to this payment ID
    payout.despatchOrderIds.forEach(doId => {
      const foundDo = dos.find(d => d.id === doId);
      if (foundDo) {
        saveDocument('dos', {
          ...foundDo,
          transporterPaymentId: newDocId
        });
      }
    });
  };

  const handleDeleteTransporterPayment = (paymentId: string) => {
    // Unlock and reset linked movements
    dos.forEach(foundDo => {
      if (foundDo.transporterPaymentId === paymentId) {
        saveDocument('dos', {
          ...foundDo,
          transporterPaymentId: undefined
        });
      }
    });

    // Delete remittance record
    deleteDocument('transporter_payments', paymentId);
  };

  const handleUpdateInvoiceDetails = (doId: string, invoiceData: {
    invoiceNo: string;
    invoiceDate: string;
    invoiceType: 'Digital' | 'HardCopy';
    invoiceDigitallySigned: boolean;
    invoiceHardCopyReceived: boolean;
    invoiceDocName?: string;
  }) => {
    const foundDo = dos.find(d => d.id === doId);
    if (foundDo) {
      saveDocument('dos', {
        ...foundDo,
        ...invoiceData,
        invoiceReceived: true,
        invoiceDocUrl: '#'
      });
    }
  };

  const handleUpdateHardCopyStatus = (doId: string, received: boolean) => {
    const foundDo = dos.find(d => d.id === doId);
    if (foundDo) {
      saveDocument('dos', {
        ...foundDo,
        invoiceHardCopyReceived: received
      });
    }
  };


  // Reset database with original mock preseed data
  const handleResetToSeeds = async () => {
    if (confirm('Are you sure you want to reset the database? This will clear all custom edits and restore gorgeous default demo accounts.')) {
      try {
        await Promise.all([
          resetCollectionWithSeeds('companies', INITIAL_COMPANIES),
          resetCollectionWithSeeds('vendors', INITIAL_VENDORS),
          resetCollectionWithSeeds('transporters', INITIAL_TRANSPORTERS),
          resetCollectionWithSeeds('agents', INITIAL_AGENTS),
          resetCollectionWithSeeds('sources', INITIAL_SOURCES),
          resetCollectionWithSeeds('pos', INITIAL_POS),
          resetCollectionWithSeeds('dos', INITIAL_DOS),
          resetCollectionWithSeeds('users', INITIAL_USERS),
          resetCollectionWithSeeds('payments', INITIAL_PAYMENTS),
          resetCollectionWithSeeds('transporter_payments', INITIAL_TRANSPORTER_PAYMENTS),
          resetCollectionWithSeeds('notifications', []),
        ]);
        
        // Also clean local active user
        setActiveUser(INITIAL_USERS[0] || null);
        if (INITIAL_USERS[0]) {
          localStorage.setItem('bd_active_user_id', INITIAL_USERS[0].id);
        }
      } catch (error) {
        console.error("Error resetting database:", error);
        alert("Failed to reset database automatically. Please refresh or try again.");
      }
    }
  };

  // Export database backup to physical JSON file download
  const handleExportBackup = () => {
    const databaseBackup = {
      companies,
      vendors,
      transporters,
      agents,
      pos,
      dos,
      users,
      payments,
      transporterPayments,
      notifications,
      timestamp: new Date().toISOString(),
      source: 'Bulker Dispatch Manager'
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(databaseBackup, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `bulker_db_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import database backup from JSON file
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const files = e.target.files;
    if (!files || files.length === 0) return;

    fileReader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.companies && parsed.vendors && parsed.pos && parsed.dos) {
          // Sync all imported items to Firestore
          parsed.companies.forEach((x: any) => saveDocument('companies', x));
          parsed.vendors.forEach((x: any) => saveDocument('vendors', x));
          (parsed.transporters || []).forEach((x: any) => saveDocument('transporters', x));
          (parsed.agents || []).forEach((x: any) => saveDocument('agents', x));
          (parsed.sources || []).forEach((x: any) => saveDocument('sources', x));
          parsed.pos.forEach((x: any) => saveDocument('pos', x));
          parsed.dos.forEach((x: any) => saveDocument('dos', x));
          (parsed.users || []).forEach((x: any) => saveDocument('users', x));
          (parsed.payments || []).forEach((x: any) => saveDocument('payments', x));
          (parsed.transporterPayments || []).forEach((x: any) => saveDocument('transporter_payments', x));
          (parsed.notifications || []).forEach((x: any) => saveDocument('notifications', x));

          alert('Database backup imported successfully and synchronized with cloud database!');
        } else {
          alert('Failed: Corrupted structure inside backup JSON.');
        }
      } catch (err) {
        alert('Invalid JSON configuration or file structure.');
      }
    };
    fileReader.readAsText(files[0]);
  };


  const isTabLocked = (tabName: string): boolean => {
    if (!activeUser) return true;
    switch (tabName) {
      case 'company': return !activeUser.rights?.manageCompanies;
      case 'vendor': return !activeUser.rights?.manageVendors;
      case 'po': return !activeUser.rights?.managePOs;
      case 'transporter': return !activeUser.rights?.manageTransporters;
      case 'agent': return !activeUser.rights?.manageVendors;
      case 'sources': return !activeUser.rights?.manageVendors;
      case 'dispatch': return !activeUser.rights?.manageDespatches;
      case 'notifications': return !activeUser.rights?.manageDespatches;
      case 'ledger': return !activeUser.rights?.manageLedger;
      case 'transporter-payments': return !activeUser.rights?.manageLedger;
      case 'reports': return !activeUser.rights?.manageLedger;
      case 'admin': return !activeUser.rights?.manageAdmin;
      default: return false;
    }
  };

  // Render navigation tab views
  const renderTabContent = () => {
    // Permission Interceptor Helper
    const secureAction = (key: keyof UserRights, element: React.ReactNode, title: string) => {
      const allowed = activeUser?.rights?.[key] ?? false;

      if (!allowed) {
        return (
          <div className="bg-white border-2 border-black p-8 text-center space-y-6 max-w-xl mx-auto my-12 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] animate-fade-in text-[#1A1A1A]">
            <div className="inline-flex items-center justify-center h-16 w-16 bg-[#F4F4F1] border border-[#D1D1CF]">
              <Lock className="h-8 w-8 text-[#E65100]" />
            </div>
            <div className="space-y-2">
              <h3 className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#E65100]">
                Access Restricted: Insufficient Clearances
              </h3>
              <h2 className="text-lg font-serif font-bold italic text-[#1A1A1A] leading-tight">
                {title} Module is Locked
              </h2>
              <p className="text-xs text-stone-500 font-serif italic max-w-md mx-auto leading-relaxed">
                Your current active corporate clearance role as <span className="font-extrabold font-sans text-stone-900">{activeUser?.name || 'Guest'} ({activeUser?.role || 'Viewer'})</span> does not possess the active permission <span className="font-mono bg-[#F4F4F1] text-stone-900 px-1.5 py-0.5 border border-[#D1D1CF] text-[9.5px] uppercase font-bold">{key}</span>.
              </p>
            </div>
            <div className="bg-amber-50 border border-amber-200 p-4 text-left space-y-1">
              <h4 className="text-[10px] font-mono font-bold tracking-wider text-amber-900 uppercase flex items-center space-x-1">
                <ShieldCheck className="h-4 w-4 text-[#E65100]" />
                <span>Security Desk Instruction:</span>
              </h4>
              <p className="text-xs text-stone-700 leading-normal font-sans">
                To test this view or execute actions here, request the administrator <b className="font-serif italic font-bold text-stone-900">J.P.S. Gujral</b> to grant you <span className="font-mono font-bold text-[#E65100]">{key}</span> module access from the Security Control Center under "Security Desk".
              </p>
            </div>
            <div className="flex items-center justify-center space-x-3">
              {activeUser?.role === 'Admin' ? (
                <button
                  onClick={() => {
                    if (activeUser) {
                      const rightsCopy = { ...activeUser.rights, [key]: true };
                      handleUpdateUserRights(activeUser.id, rightsCopy);
                    }
                  }}
                  className="inline-flex items-center space-x-2 px-5 py-2.5 bg-[#E65100] hover:bg-black text-white text-xs uppercase tracking-wider font-extrabold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
                >
                  <Unlock className="h-4 w-4 shrink-0" />
                  <span>Instantly Grant Access</span>
                </button>
              ) : (
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="inline-flex items-center space-x-2 px-5 py-2.5 bg-black hover:bg-stone-800 text-white text-xs uppercase tracking-widest font-extrabold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
                >
                  <span>Return to Dash</span>
                </button>
              )}
            </div>
          </div>
        );
      }
      return element;
    };

    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard 
            companies={companies}
            vendors={vendors}
            transporters={transporters}
            agents={agents}
            pos={pos}
            dos={dos}
            onNavigate={(tab) => setActiveTab(tab)}
            onSelectChallan={(item) => setSelectedChallanDo(item)}
            onUpdateReceivedWeight={handleUpdateReceivedWeight}
          />
        );
      case 'company':
        return secureAction(
          'manageCompanies',
          <CompanyMaster 
            companies={companies}
            onAddCompany={handleAddCompany}
            onEditCompany={handleEditCompany}
            onDeleteCompany={handleDeleteCompany}
            onBack={() => setActiveTab('dashboard')}
          />,
          'Company Master'
        );
      case 'vendor':
        return secureAction(
          'manageVendors',
          <VendorMaster 
            vendors={vendors}
            onAddVendor={handleAddVendor}
            onEditVendor={handleEditVendor}
            onDeleteVendor={handleDeleteVendor}
            onBack={() => setActiveTab('dashboard')}
          />,
          'Vendor Master'
        );
      case 'po':
        return secureAction(
          'managePOs',
          <POMaster 
            pos={pos}
            companies={companies}
            vendors={vendors}
            dos={dos}
            onAddPO={handleAddPO}
            onEditPO={handleEditPO}
            onDeletePO={handleDeletePO}
            onBack={() => setActiveTab('dashboard')}
          />,
          'PO Contracts Master'
        );
      case 'transporter':
        return secureAction(
          'manageTransporters',
          <TransporterMaster 
            transporters={transporters}
            vendors={vendors}
            onAddTransporter={handleAddTransporter}
            onEditTransporter={handleEditTransporter}
            onDeleteTransporter={handleDeleteTransporter}
            onBack={() => setActiveTab('dashboard')}
          />,
          'Transporter Master'
        );
      case 'agent':
        return secureAction(
          'manageVendors',
          <AgentMaster 
            agents={agents}
            onAddAgent={handleAddAgent}
            onEditAgent={handleEditAgent}
            onDeleteAgent={handleDeleteAgent}
            onBack={() => setActiveTab('dashboard')}
          />,
          'Agent Master'
        );
      case 'dispatch':
        return secureAction(
          'manageDespatches',
          <DOMaster 
            dos={dos}
            pos={pos}
            companies={companies}
            vendors={vendors}
            transporters={transporters}
            agents={agents}
            sources={sources}
            onAddSource={handleAddSource}
            onAddDO={handleAddDO}
            onUpdateReceivedWeight={handleUpdateReceivedWeight}
            onCancelDO={handleCancelDO}
            onSelectChallan={(item) => setSelectedChallanDo(item)}
            onBack={() => setActiveTab('dashboard')}
          />,
          'Dispatch Movements'
        );
      case 'sources':
        return secureAction(
          'manageVendors',
          <SourceMaster 
            sources={sources}
            dos={dos}
            onAddSource={handleAddSource}
            onDeleteSource={handleDeleteSource}
            onBack={() => setActiveTab('dashboard')}
          />,
          'Loading Source Master'
        );
      case 'notifications':
        return secureAction(
          'manageDespatches',
          <NotificationCenter 
            notifications={notifications}
            transporters={transporters}
            dos={dos}
            pos={pos}
            vendors={vendors}
            sources={sources}
            onSendTestEmail={handleSendTestEmail}
            onBack={() => setActiveTab('dashboard')}
          />,
          'Notification Center'
        );
      case 'ledger':
        return secureAction(
          'manageLedger',
          <CommissionLedger 
            agents={agents}
            dos={dos}
            pos={pos}
            companies={companies}
            vendors={vendors}
            payments={payments}
            currentUser={activeUser}
            onAddPayment={handleAddPayment}
            onDeletePayment={handleDeletePayment}
            onBack={() => setActiveTab('dashboard')}
          />,
          'Commission Ledger'
        );
      case 'transporter-payments':
        return secureAction(
          'manageLedger',
          <TransporterPaymentPanel 
            transporters={transporters}
            dos={dos}
            pos={pos}
            companies={companies}
            payments={transporterPayments}
            currentUser={activeUser}
            onAddPayment={handleAddTransporterPayment}
            onDeletePayment={handleDeleteTransporterPayment}
            onUpdateInvoiceDetails={handleUpdateInvoiceDetails}
            onUpdateHardCopyStatus={handleUpdateHardCopyStatus}
            onBack={() => setActiveTab('dashboard')}
          />,
          'Transporter Payments Desk'
        );
      case 'reports':
        return secureAction(
          'manageLedger',
          <Reports 
            agents={agents}
            dos={dos}
            pos={pos}
            companies={companies}
            vendors={vendors}
            sources={sources}
            onBack={() => setActiveTab('dashboard')}
          />,
          'Reports & Analytics'
        );
      case 'admin':
        return secureAction(
          'manageAdmin',
          <UserAdminPanel 
            users={users}
            activeUser={activeUser}
            onSelectActiveUser={handleSelectActiveUser}
            onAddUser={handleAddUser}
            onUpdateUserRights={handleUpdateUserRights}
            onToggleUserStatus={handleToggleUserStatus}
            onDeleteUser={handleDeleteUser}
            onBack={() => setActiveTab('dashboard')}
          />,
          'Administrative Security Settings'
        );
      default:
        return <div>Tab not loaded</div>;
    }
  };

  // Correlated fields for modal slip
  const getSelectedChallanCorrelations = () => {
    if (!selectedChallanDo) return null;
    const po = pos.find(p => p.id === selectedChallanDo.poId);
    const company = po ? companies.find(c => c.id === po.companyId) : undefined;
    const vendor = po ? vendors.find(v => v.id === po.vendorId) : undefined;
    const transporter = transporters.find(t => t.id === selectedChallanDo.transporterId);
    const agent = agents.find(a => a.id === selectedChallanDo.agentId);

    return { po, company, vendor, transporter, agent };
  };

  const correlations = getSelectedChallanCorrelations();

  if (!isLoggedIn || !activeUser) {
    return (
      <LoginScreen 
        users={users} 
        onLogin={handleLogin} 
        onRegisterUser={handleRegisterUser} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F8F6] flex flex-col font-sans text-[#1A1A1A]">
      
      {/* Top Professional Admin Bar */}
      <header className="bg-white border-b border-[#D1D1CF] sticky top-0 z-30 shadow-xs px-4 md:px-8 py-3 shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
          
          <div className="flex justify-between items-center w-full md:w-auto">
            <div className="flex items-center space-x-3">
              <TSGLogo size={42} className="border-2 border-black shadow-xs shrink-0" />
              <div>
                <div className="flex items-center space-x-1.5 flex-wrap">
                  <h1 className="text-sm sm:text-base md:text-lg font-serif font-bold italic tracking-tight text-neutral-900 leading-tight">
                    {companies[0]?.name || 'Sardar Infrastructure & Minerals Ltd'}
                  </h1>
                  <span className="text-[8px] bg-[#F4F4F1] text-black px-1.5 py-0.5 font-bold border border-[#D1D1CF]">
                    v4.0
                  </span>
                </div>
                <p className="text-[10px] text-[#E65100] uppercase tracking-[0.2em] font-bold mt-0.5">
                  The Fly Ash People
                </p>
              </div>
            </div>

            {/* Mobile Burger Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2.5 border border-black bg-white text-black hover:bg-neutral-100 transition-colors cursor-pointer shrink-0"
              title="Toggle Menu"
            >
              {isMobileMenuOpen ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
            </button>
          </div>

          {/* Backup Database Management Sync controls - Desktop hidden on mobile to avoid layout crowding */}
          <div className="hidden md:flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportBackup}
              className="inline-flex items-center space-x-1 px-4 py-2 border border-black font-serif italic text-xs hover:bg-[#1A1A1A] hover:text-white transition-colors cursor-pointer"
              title="Download full database as local JSON backup"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export DB</span>
            </button>

            <label className="inline-flex items-center space-x-1 px-4 py-2 border border-black font-serif italic text-xs hover:bg-[#1A1A1A] hover:text-white transition-colors cursor-pointer">
              <Upload className="h-3.5 w-3.5" />
              <span>Import DB</span>
              <input 
                type="file" 
                accept=".json"
                onChange={handleImportBackup}
                className="hidden" 
              />
            </label>

            <button
              onClick={handleResetToSeeds}
              className="inline-flex items-center space-x-1 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 font-serif italic text-xs transition-colors cursor-pointer border border-red-200"
              title="Wipe database and reset to clean industry demo seeds"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Reset Demo</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Grid Workspace split into navigation left, active panel right */}
      <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col md:flex-row gap-6 p-4 md:p-8">
        
        {/* Grey Backdrop Overlay when open on mobile */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/60 z-40 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Navigation Sidebar panel / Slide-out drawer on mobile */}
        <aside 
          className={`fixed md:relative top-0 left-0 h-full md:h-auto w-72 md:w-64 bg-[#F9F8F6] md:bg-transparent z-50 md:z-auto transition-transform duration-300 transform md:transform-none flex flex-col gap-4 p-5 md:p-0 border-r md:border-r-0 border-[#D1D1CF] md:border-none shadow-2xl md:shadow-none overflow-y-auto shrink-0 ${
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
        >
          {/* Mobile Sidebar Brand Header */}
          <div className="flex md:hidden items-center justify-between pb-3 border-b border-[#D1D1CF] mb-2">
            <div className="flex items-center space-x-2.5">
              <TSGLogo size={32} />
              <span className="font-serif font-bold italic text-xs tracking-wider text-[#E65100]">TSG NAVIGATION</span>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-1 px-2 border border-black text-[10px] font-mono tracking-tighter uppercase bg-white cursor-pointer"
            >
              Close [X]
            </button>
          </div>

          {/* Simulated acting identity card */}
          {activeUser && (
            <div className="bg-[#1A1A1A] text-stone-200 p-4 border border-black space-y-2 select-none shrink-0">
              <div className="flex items-center space-x-2">
                <div className={`h-2 w-2 rounded-full animate-pulse shrink-0 ${activeUser.status === 'Active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                <span className="text-[8px] font-mono tracking-widest uppercase text-stone-400">
                  {activeUser.status === 'Active' ? 'ACTIVE TERMINAL SESSION' : 'INACTIVE TERMINAL BLOCKED'}
                </span>
              </div>
              <div>
                <span className="block text-xs font-bold font-serif italic text-white leading-tight">{activeUser.name}</span>
                <span className="block text-[9px] font-mono text-zinc-400 mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">{activeUser.email}</span>
              </div>
              <div className="flex items-center justify-between text-[8px] font-mono border-t border-neutral-800 pt-1.5 mt-1.5 leading-none">
                <span className="text-[#E65100] font-black uppercase">{activeUser.role} clearance</span>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => { setActiveTab('admin'); setIsMobileMenuOpen(false); }} 
                    className="hover:text-white text-zinc-400 underline transition-all cursor-pointer font-bold bg-transparent border-none p-0"
                    title="Open security settings matrix"
                  >
                    Rights Desk
                  </button>
                  <span className="text-zinc-600">|</span>
                  <button 
                    onClick={handleLogout} 
                    className="hover:text-rose-400 text-rose-500 transition-all cursor-pointer font-bold bg-transparent border-none p-0"
                    title="Terminate active session"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-none border border-[#D1D1CF] p-6 space-y-6">

            
            <div>
              <p className="text-[10px] uppercase tracking-widest text-[#888884] mb-3 font-semibold">Master Records</p>
              <nav className="space-y-1 font-serif italic text-base">
                
                {/* Menu: Dashboard */}
                <button
                  id="tab-dashboard-btn"
                  onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center justify-between py-2 text-left transition-colors cursor-pointer ${
                    activeTab === 'dashboard'
                      ? 'text-[#E65100] font-bold underline underline-offset-8 decoration-2'
                      : 'text-[#1A1A1A] hover:text-[#E65100]'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <LayoutDashboard className="h-4 w-4 shrink-0 inline opacity-70" />
                    <span>Operations Summary</span>
                  </div>
                  <ChevronRight className={`h-3 w-3 ${activeTab === 'dashboard' ? 'text-[#E65100]' : 'opacity-0'}`} />
                </button>

                {/* Menu: Company Master */}
                <button
                  id="tab-company-btn"
                  onClick={() => { setActiveTab('company'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center justify-between py-2 text-left transition-colors cursor-pointer ${
                    activeTab === 'company'
                      ? 'text-[#E65100] font-bold underline underline-offset-8 decoration-2'
                      : 'text-[#1A1A1A] hover:text-[#E65100]'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Building className={`h-4 w-4 shrink-0 inline ${isTabLocked('company') ? 'text-zinc-450' : 'opacity-70'}`} />
                    <span className={isTabLocked('company') ? 'text-zinc-400 font-normal line-through decoration-stone-300' : ''}>Company Master</span>
                    {isTabLocked('company') && <Lock className="h-3 w-3 text-[#E65100]/80 inline shrink-0" />}
                  </div>
                  <ChevronRight className={`h-3 w-3 ${activeTab === 'company' ? 'text-[#E65100]' : 'opacity-0'}`} />
                </button>

                {/* Menu: Vendor Master */}
                <button
                  id="tab-vendor-btn"
                  onClick={() => { setActiveTab('vendor'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center justify-between py-2 text-left transition-colors cursor-pointer ${
                    activeTab === 'vendor'
                      ? 'text-[#E65100] font-bold underline underline-offset-8 decoration-2'
                      : 'text-[#1A1A1A] hover:text-[#E65100]'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Users className={`h-4 w-4 shrink-0 inline ${isTabLocked('vendor') ? 'text-zinc-455' : 'opacity-70'}`} />
                    <span className={isTabLocked('vendor') ? 'text-zinc-400 font-normal line-through decoration-stone-300' : ''}>Vendor Master</span>
                    {isTabLocked('vendor') && <Lock className="h-3 w-3 text-[#E65100]/80 inline shrink-0" />}
                  </div>
                  <ChevronRight className={`h-3 w-3 ${activeTab === 'vendor' ? 'text-[#E65100]' : 'opacity-0'}`} />
                </button>

                {/* Menu: Purchase Orders */}
                <button
                  id="tab-po-btn"
                  onClick={() => { setActiveTab('po'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center justify-between py-2 text-left transition-colors cursor-pointer ${
                    activeTab === 'po'
                      ? 'text-[#E65100] font-bold underline underline-offset-8 decoration-2'
                      : 'text-[#1A1A1A] hover:text-[#E65100]'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <FileCheck className={`h-4 w-4 shrink-0 inline ${isTabLocked('po') ? 'text-zinc-455' : 'opacity-70'}`} />
                    <span className={isTabLocked('po') ? 'text-zinc-400 font-normal line-through decoration-stone-300' : ''}>Purchase Orders</span>
                    {isTabLocked('po') && <Lock className="h-3 w-3 text-[#E65100]/80 inline shrink-0" />}
                  </div>
                  <ChevronRight className={`h-3 w-3 ${activeTab === 'po' ? 'text-[#E65100]' : 'opacity-0'}`} />
                </button>

                {/* Menu: Transporter Master */}
                <button
                  id="tab-transporter-btn"
                  onClick={() => { setActiveTab('transporter'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center justify-between py-2 text-left transition-colors cursor-pointer ${
                    activeTab === 'transporter'
                      ? 'text-[#E65100] font-bold underline underline-offset-8 decoration-2'
                      : 'text-[#1A1A1A] hover:text-[#E65100]'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Truck className={`h-4 w-4 shrink-0 inline ${isTabLocked('transporter') ? 'text-zinc-455' : 'opacity-70'}`} />
                    <span className={isTabLocked('transporter') ? 'text-zinc-400 font-normal line-through decoration-stone-300' : ''}>Transporters</span>
                    {isTabLocked('transporter') && <Lock className="h-3 w-3 text-[#E65100]/80 inline shrink-0" />}
                  </div>
                  <ChevronRight className={`h-3 w-3 ${activeTab === 'transporter' ? 'text-[#E65100]' : 'opacity-0'}`} />
                </button>

                {/* Menu: Agent Master */}
                <button
                  id="tab-agent-btn"
                  onClick={() => { setActiveTab('agent'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center justify-between py-2 text-left transition-colors cursor-pointer ${
                    activeTab === 'agent'
                      ? 'text-[#E65100] font-bold underline underline-offset-8 decoration-2'
                      : 'text-[#1A1A1A] hover:text-[#E65100]'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <UserSquare2 className={`h-4 w-4 shrink-0 inline ${isTabLocked('agent') ? 'text-zinc-455' : 'opacity-70'}`} />
                    <span className={isTabLocked('agent') ? 'text-zinc-400 font-normal line-through decoration-stone-300' : ''}>Agent Registry</span>
                    {isTabLocked('agent') && <Lock className="h-3 w-3 text-[#E65100]/80 inline shrink-0" />}
                  </div>
                  <ChevronRight className={`h-3 w-3 ${activeTab === 'agent' ? 'text-[#E65100]' : 'opacity-0'}`} />
                </button>

                {/* Menu: Source Master */}
                <button
                  id="tab-source-btn"
                  onClick={() => { setActiveTab('sources'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center justify-between py-2 text-left transition-colors cursor-pointer ${
                    activeTab === 'sources'
                      ? 'text-[#E65100] font-bold underline underline-offset-8 decoration-2'
                      : 'text-[#1A1A1A] hover:text-[#E65100]'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Database className={`h-4 w-4 shrink-0 inline ${isTabLocked('sources') ? 'text-zinc-455' : 'opacity-70'}`} />
                    <span className={isTabLocked('sources') ? 'text-zinc-400 font-normal line-through decoration-stone-300' : ''}>Source Master</span>
                    {isTabLocked('sources') && <Lock className="h-3 w-3 text-[#E65100]/80 inline shrink-0" />}
                  </div>
                  <ChevronRight className={`h-3 w-3 ${activeTab === 'sources' ? 'text-[#E65100]' : 'opacity-0'}`} />
                </button>

              </nav>
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-widest text-[#888884] mb-3 font-semibold">Operations</p>
              <nav className="space-y-1 font-serif italic text-base">
                
                {/* Menu: Despatch & Transit */}
                <button
                  id="tab-dispatch-btn"
                  onClick={() => { setActiveTab('dispatch'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center justify-between py-2.5 text-left transition-colors cursor-pointer ${
                    activeTab === 'dispatch'
                      ? 'text-[#E65100] font-bold underline underline-offset-8 decoration-2'
                      : 'text-neutral-700 hover:text-[#E65100]'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <FileText className={`h-4 w-4 shrink-0 inline ${isTabLocked('dispatch') ? 'text-zinc-400' : 'text-[#E65100]'}`} />
                    <span className={isTabLocked('dispatch') ? 'text-zinc-400 font-normal line-through decoration-stone-300' : ''}>Despatch & Challan</span>
                    {isTabLocked('dispatch') && <Lock className="h-3 w-3 text-[#E65100]/80 inline shrink-0" />}
                  </div>
                  <div className="flex items-center space-x-1">
                    {dos.filter(d => d.status === 'In Transit').length > 0 && !isTabLocked('dispatch') && (
                      <span className="text-[10px] bg-[#E65100] text-white font-mono px-1.5 py-0.5 rounded-none leading-none">
                        {dos.filter(d => d.status === 'In Transit').length}
                      </span>
                    )}
                    <ChevronRight className="h-3 w-3 text-[#E65100]" />
                  </div>
                </button>

                {/* Menu: Notification Center */}
                <button
                  id="tab-notifications-btn"
                  onClick={() => { setActiveTab('notifications'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center justify-between py-2.5 text-left transition-colors cursor-pointer ${
                    activeTab === 'notifications'
                      ? 'text-[#E65100] font-bold underline underline-offset-8 decoration-2'
                      : 'text-neutral-700 hover:text-[#E65100]'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Mail className={`h-4 w-4 shrink-0 inline ${isTabLocked('notifications') ? 'text-zinc-400' : 'text-[#E65100]'}`} />
                    <span className={isTabLocked('notifications') ? 'text-zinc-400 font-normal line-through decoration-stone-300' : ''}>Notification Center</span>
                    {isTabLocked('notifications') && <Lock className="h-3 w-3 text-[#E65100]/80 inline shrink-0" />}
                  </div>
                  <div className="flex items-center space-x-1">
                    {notifications.filter(n => n.status === 'Failed').length > 0 && !isTabLocked('notifications') && (
                      <span className="text-[10px] bg-rose-600 text-white font-mono px-1 rounded-none leading-none" title="Unsent/Failed Email Summaries">
                        {notifications.filter(n => n.status === 'Failed').length}
                      </span>
                    )}
                    <ChevronRight className="h-3 w-3 text-[#E65100]" />
                  </div>
                </button>

                {/* Menu: Ledger */}
                <button
                  id="tab-ledger-btn"
                  onClick={() => { setActiveTab('ledger'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center justify-between py-2 text-left transition-colors cursor-pointer ${
                    activeTab === 'ledger'
                      ? 'text-[#E65100] font-bold underline underline-offset-8 decoration-2'
                      : 'text-neutral-700 hover:text-[#E65100]'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <DollarSign className={`h-4 w-4 shrink-0 inline ${isTabLocked('ledger') ? 'text-zinc-400' : 'opacity-70'}`} />
                    <span className={isTabLocked('ledger') ? 'text-zinc-400 font-normal line-through decoration-stone-300' : ''}>Commission Ledger</span>
                    {isTabLocked('ledger') && <Lock className="h-3 w-3 text-[#E65100]/80 inline shrink-0" />}
                  </div>
                  <ChevronRight className={`h-3 w-3 ${activeTab === 'ledger' ? 'text-[#E65100]' : 'opacity-0'}`} />
                </button>

                {/* Menu: Transporter Payments */}
                <button
                  id="tab-transporter-payments-btn"
                  onClick={() => { setActiveTab('transporter-payments'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center justify-between py-2 text-left transition-colors cursor-pointer ${
                    activeTab === 'transporter-payments'
                      ? 'text-[#E65100] font-bold underline underline-offset-8 decoration-2'
                      : 'text-neutral-700 hover:text-[#E65100]'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Truck className={`h-4 w-4 shrink-0 inline ${isTabLocked('transporter-payments') ? 'text-zinc-400' : 'text-[#E65100]'}`} />
                    <span className={isTabLocked('transporter-payments') ? 'text-zinc-400 font-normal line-through decoration-stone-300' : ''}>Transporter Payouts</span>
                    {isTabLocked('transporter-payments') && <Lock className="h-3 w-3 text-[#E65100]/80 inline shrink-0" />}
                  </div>
                  <div className="flex items-center space-x-1">
                    {dos.filter(d => d.status === 'Delivered' && !d.transporterPaymentId && d.invoiceReceived && d.invoiceType === 'Digital' && !d.invoiceDigitallySigned && !d.invoiceHardCopyReceived).length > 0 && !isTabLocked('transporter-payments') && (
                      <span className="text-[10px] bg-amber-500 text-white font-mono px-1 rounded-none leading-none animate-pulse" title="Hard Copy Alerts pending">
                        !
                      </span>
                    )}
                    <ChevronRight className={`h-3 w-3 ${activeTab === 'transporter-payments' ? 'text-[#E65100]' : 'opacity-0'}`} />
                  </div>
                </button>

                {/* Menu: Reports */}
                <button
                  id="tab-reports-btn"
                  onClick={() => { setActiveTab('reports'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center justify-between py-2 text-left transition-colors cursor-pointer ${
                    activeTab === 'reports'
                      ? 'text-[#E65100] font-bold underline underline-offset-8 decoration-2'
                      : 'text-neutral-700 hover:text-[#E65100]'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <TrendingUp className={`h-4 w-4 shrink-0 inline ${isTabLocked('reports') ? 'text-zinc-400' : 'text-[#E65100]'}`} />
                    <span className={isTabLocked('reports') ? 'text-zinc-400 font-normal line-through decoration-stone-300' : ''}>Reports & Analytics</span>
                    {isTabLocked('reports') && <Lock className="h-3 w-3 text-[#E65100]/80 inline shrink-0" />}
                  </div>
                  <ChevronRight className={`h-3 w-3 ${activeTab === 'reports' ? 'text-[#E65100]' : 'opacity-0'}`} />
                </button>

                {/* Menu: Admin */}
                <button
                  id="tab-admin-btn"
                  onClick={() => { setActiveTab('admin'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center justify-between py-2 text-left transition-colors cursor-pointer ${
                    activeTab === 'admin'
                      ? 'text-[#E65100] font-bold underline underline-offset-8 decoration-2'
                      : 'text-neutral-700 hover:text-[#E65100]'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <ShieldCheck className={`h-4 w-4 shrink-0 inline ${isTabLocked('admin') ? 'text-zinc-400' : 'opacity-70'}`} />
                    <span className={isTabLocked('admin') ? 'text-zinc-400 font-normal line-through decoration-stone-300' : ''}>Security Desk</span>
                    {isTabLocked('admin') && <Lock className="h-3 w-3 text-[#E65100]/80 inline shrink-0" />}
                  </div>
                  <ChevronRight className={`h-3 w-3 ${activeTab === 'admin' ? 'text-[#E65100]' : 'opacity-0'}`} />
                </button>


              </nav>
            </div>

          </div>

          {/* Mobile-only Database Sync actions */}
          <div className="md:hidden flex flex-col gap-2 p-4 bg-[#F4F4F1] border border-[#D1D1CF] rounded-none">
            <p className="text-[10px] uppercase font-bold tracking-widest text-[#888884]">Database Sync</p>
            <button
              onClick={() => {
                handleExportBackup();
                setIsMobileMenuOpen(false);
              }}
              className="flex items-center justify-center space-x-2 py-2 border border-black font-serif italic text-xs bg-white text-black hover:bg-neutral-100 transition-colors cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export DB</span>
            </button>

            <label className="flex items-center justify-center space-x-2 py-2 border border-black font-serif italic text-xs bg-white text-black hover:bg-neutral-100 transition-colors cursor-pointer">
              <Upload className="h-3.5 w-3.5" />
              <span>Import DB</span>
              <input 
                type="file" 
                accept=".json"
                onChange={(e) => {
                  handleImportBackup(e);
                  setIsMobileMenuOpen(false);
                }}
                className="hidden" 
              />
            </label>

            <button
              onClick={() => {
                handleResetToSeeds();
                setIsMobileMenuOpen(false);
              }}
              className="flex items-center justify-center space-x-2 py-2 bg-red-50 hover:bg-red-100 text-red-700 font-serif italic text-xs transition-colors cursor-pointer border border-[#D1D1CF]"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Reset Demo</span>
            </button>
          </div>

          {/* Commission Logic box matching design markup */}
          <div className="p-4 bg-[#F4F4F1] border border-[#D1D1CF] rounded-none">
            <p className="text-xs font-serif font-bold italic text-[#1A1A1A]">Commission Logic</p>
            <div className="mt-2 text-[11px] leading-relaxed opacity-80 font-mono">
              Profit &lt; ₹100/MT: <span className="font-bold">10%</span><br />
              Profit &ge; ₹100/MT: <span className="font-bold text-[#E65100]">15%</span>
            </div>
          </div>

          {/* Quick info footer */}
          <div className="bg-[#1A1A1A] text-white rounded-none p-5 text-xs space-y-3 border border-black">
            <div className="flex items-center space-x-1.5 text-[#D1D1CF]">
              <Database className="h-3.5 w-3.5 text-[#E65100]" />
              <span className="font-serif italic text-xs">Indexed Database</span>
            </div>
            <p className="text-[#D1D1CF] font-serif italic leading-relaxed text-[11px]">
              Offline ledger secure status: {companies.length} Companies, {vendors.length} Vendors, and {dos.length} Transit movements.
            </p>
            <div className="font-mono text-[9px] text-[#888884] flex justify-between pt-1 border-t border-neutral-800">
              <span>LEDGER SYNC:</span>
              <span className="text-[#E65100] font-bold">● ONLINE LOCAL</span>
            </div>
          </div>
        </aside>

        {/* Dynamic Context Working Canvas */}
        <main className="flex-1 bg-white rounded-none border border-[#D1D1CF] p-6 md:p-10 min-h-[500px]">
          {renderTabContent()}
        </main>

      </div>

      {/* Challan Printing Slip Overlay */}
      {selectedChallanDo && correlations && (
        <ChallanModal 
          doItem={selectedChallanDo}
          po={correlations.po}
          company={correlations.company}
          vendor={correlations.vendor}
          transporter={correlations.transporter}
          agent={correlations.agent}
          sources={sources}
          onClose={() => setSelectedChallanDo(null)}
        />
      )}

      {/* System Legal Corporate Footer */}
      <footer className="bg-white border-t border-[#D1D1CF] py-4 text-center text-[10px] text-[#888884] uppercase tracking-widest shrink-0 font-sans">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <span>&copy; 2026 TSG Impex India Pvt Ltd. Approved fly ash & cements transport systems.</span>
        </div>
      </footer>

    </div>
  );
}
