import React, { useState, useEffect } from 'react';
import { 
  Company, 
  Vendor, 
  Product,
  PurchaseOrder, 
  Transporter, 
  Agent, 
  DespatchOrder,
  AppUser,
  UserRights,
  AgentPayment,
  TransporterPayment,
  SourceLocation,
  RouteComplianceLogEntry
} from './types';
import { 
  INITIAL_COMPANIES, 
  INITIAL_VENDORS, 
  INITIAL_PRODUCTS,
  INITIAL_TRANSPORTERS, 
  INITIAL_AGENTS, 
  INITIAL_POS, 
  INITIAL_DOS,
  INITIAL_USERS,
  INITIAL_PAYMENTS,
  INITIAL_TRANSPORTER_PAYMENTS,
  INITIAL_SOURCES
} from './data';
import { subscribeToCollection, saveDocument, deleteDocument, resetCollectionWithSeeds, fetchCollectionOnce } from './firebaseService';
import { auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

// Component Imports
import Dashboard from './components/Dashboard';
import CompanyMaster from './components/CompanyMaster';
import TSGLogo from './components/TSGLogo';
import VendorMaster from './components/VendorMaster';
import POMaster from './components/POMaster';
import ProductMaster from './components/ProductMaster';
import TransporterMaster from './components/TransporterMaster';
import AgentMaster from './components/AgentMaster';
import DOMaster from './components/DOMaster';
import ChallanModal from './components/ChallanModal';
import BottomFloatingMenu from './components/BottomFloatingMenu';
import CommissionLedger from './components/CommissionLedger';
import UserAdminPanel from './components/UserAdminPanel';
import TransporterPaymentPanel from './components/TransporterPaymentPanel';
import SourceMaster from './components/SourceMaster';
import Reports from './components/Reports';
import NotificationCenter from './components/NotificationCenter';
import LoginScreen from './components/LoginScreen';
import InteractiveChat from './components/InteractiveChat';

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
  Mail,
  Home,
  MessageCircle,
  Sun,
  Moon,
  LogOut,
  MessageSquare,
  Wifi,
  WifiOff
} from 'lucide-react';


const tabDisplayNames: Record<string, string> = {
  dashboard: 'Dashboard',
  company: 'Company Master',
  vendor: 'Vendor Master',
  po: 'Purchase Orders',
  transporter: 'Transporters',
  agent: 'Agent Registry',
  sources: 'Source Master',
  dispatch: 'Transit Movements',
  freight: 'Freight Board',
  advances: 'Cash Advances',
  receipts: 'POD Receipts',
  'transporter-payments': 'Settlements',
  reports: 'Analytics',
  admin: 'Security Desk',
  notifications: 'Logs & Alerts',
  chat: 'Communications'
};

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('bd_is_logged_in') === 'true';
  });

  // Auto/Manual Refresh configuration
  const [isAutoRefresh, setIsAutoRefresh] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Theme support
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('tsg_theme_mode') as 'light' | 'dark') || 'light';
  });

  const toggleTheme = () => {
    const nextTheme = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(nextTheme);
    localStorage.setItem('tsg_theme_mode', nextTheme);
  };

  // Master State Managed in LocalStorage
  const [companies, setCompanies] = useState<Company[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [transporters, setTransporters] = useState<Transporter[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [sources, setSources] = useState<SourceLocation[]>([]);
  const [pos, setPos] = useState<PurchaseOrder[]>([]);
  const [dos, setDos] = useState<DespatchOrder[]>([]);

  // Administrative Users State & broker payouts state
  const [users, setUsers] = useState<AppUser[]>([]);
  const [activeUser, setActiveUser] = useState<AppUser | null>(null);
  const [isChangePinOpen, setIsChangePinOpen] = useState(false);
  const [tempNewPin, setTempNewPin] = useState('');
  const [payments, setPayments] = useState<AgentPayment[]>([]);
  const [transporterPayments, setTransporterPayments] = useState<TransporterPayment[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Selected Challan Preview Overlay
  const [selectedChallanDo, setSelectedChallanDo] = useState<DespatchOrder | null>(null);

  // Workflow auto launch state trigger definitions
  const [autoOpenForm, setAutoOpenForm] = useState<'do' | 'po' | 'vendor' | 'transporter' | null>(null);

  // Function to manually pull everything once from the Firestore database
  const triggerManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        fetchCollectionOnce<Company>('companies', setCompanies),
        fetchCollectionOnce<Vendor>('vendors', setVendors),
        fetchCollectionOnce<Product>('products', setProducts),
        fetchCollectionOnce<Transporter>('transporters', setTransporters),
        fetchCollectionOnce<Agent>('agents', setAgents),
        fetchCollectionOnce<SourceLocation>('sources', setSources),
        fetchCollectionOnce<PurchaseOrder>('pos', setPos),
        fetchCollectionOnce<DespatchOrder>('dos', setDos),
        fetchCollectionOnce<AppUser>('users', setUsers),
        fetchCollectionOnce<AgentPayment>('payments', setPayments),
        fetchCollectionOnce<TransporterPayment>('transporter_payments', setTransporterPayments),
        fetchCollectionOnce<any>('notifications', setNotifications),
      ]);
    } catch (err) {
      console.error("Manual refresh encountered issues:", err);
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
      }, 500);
    }
  };

  // Synchronize state with Firebase Firestore in real-time or manually
  useEffect(() => {
    if (!isAutoRefresh) {
      triggerManualRefresh();
      return;
    }

    const unsubCompanies = subscribeToCollection<Company>('companies', setCompanies, INITIAL_COMPANIES);
    const unsubVendors = subscribeToCollection<Vendor>('vendors', setVendors, INITIAL_VENDORS);
    const unsubProducts = subscribeToCollection<Product>('products', setProducts, INITIAL_PRODUCTS);
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
      unsubProducts();
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
  }, [isAutoRefresh]);

  // Synchronize state with Firebase Authentication in real-time
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        localStorage.setItem('bd_active_user_id', firebaseUser.uid);
        localStorage.setItem('bd_is_logged_in', 'true');
        setIsLoggedIn(true);
      } else {
        localStorage.removeItem('bd_active_user_id');
        localStorage.removeItem('bd_is_logged_in');
        setIsLoggedIn(false);
        setActiveUser(null);
      }
    });
    return () => unsubAuth();
  }, []);

  // Sync activeUser whenever users list updates from firestore
  useEffect(() => {
    if (users.length > 0) {
      const savedActiveUserId = localStorage.getItem('bd_active_user_id');
      const savedIsLoggedIn = localStorage.getItem('bd_is_logged_in') === 'true';

      if (savedActiveUserId && savedIsLoggedIn) {
        const found = users.find((u) => u.id === savedActiveUserId);
        if (found) {
          if (found.status === 'Inactive') {
            setActiveUser(null);
            setIsLoggedIn(false);
            localStorage.removeItem('bd_is_logged_in');
            signOut(auth);
          } else {
            setActiveUser(found);
            setIsLoggedIn(true);
          }
        }
      } else {
        setActiveUser(null);
        setIsLoggedIn(false);
      }
    }
  }, [users]);

  // Cleanup autoOpenForm state when navigating away to prevent re-opening modal forms on subsequent clicks
  useEffect(() => {
    if (autoOpenForm === 'do' && activeTab !== 'dispatch') setAutoOpenForm(null);
    if (autoOpenForm === 'po' && activeTab !== 'po') setAutoOpenForm(null);
    if (autoOpenForm === 'vendor' && activeTab !== 'vendor') setAutoOpenForm(null);
    if (autoOpenForm === 'transporter' && activeTab !== 'transporter') setAutoOpenForm(null);
  }, [activeTab]);

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

  const handleEditSource = (src: SourceLocation) => {
    saveDocument('sources', src);
  };

  // Product Master Actions
  const handleAddProduct = (name: string, hsnCode: string, description: string, category: string, gstRate: number) => {
    const newProd: Product = {
      id: `prod-${Date.now()}`,
      name,
      hsnCode,
      gstRate,
      description,
      category,
      status: 'Active',
      createdAt: new Date().toISOString().substring(0, 10)
    };
    saveDocument('products', newProd);
  };

  const handleDeleteProduct = (id: string) => {
    deleteDocument('products', id);
  };

  const handleUpdateProductStatus = (id: string, status: 'Active' | 'Inactive') => {
    const p = products.find(prod => prod.id === id);
    if (p) {
      saveDocument('products', { ...p, status });
    }
  };

  const handleEditProduct = (p: Product) => {
    // 1. Find the old product name from the current state
    const oldProduct = products.find(prod => prod.id === p.id);
    const oldName = oldProduct ? oldProduct.name : '';

    // 2. Save the updated product
    saveDocument('products', p);

    // 3. Keep data integrity! If name changed from oldName, cascade rename in all linked PO documents to prevent orphan items
    if (oldName && oldName.trim().toLowerCase() !== p.name.trim().toLowerCase()) {
      pos.forEach(po => {
        if (po.material.trim().toLowerCase() === oldName.trim().toLowerCase()) {
          saveDocument('pos', {
            ...po,
            material: p.name.trim()
          });
        }
      });
    }
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

  const updateRouteComplianceLog = (
    oldDo: DespatchOrder,
    newStatus: 'In Transit' | 'Delivered' | 'Cancelled',
    updatedByEmail: string,
    remarksText?: string
  ): RouteComplianceLogEntry[] => {
    const currentLog = oldDo.routeComplianceLog || [];
    
    if (oldDo.status === newStatus) {
      return currentLog;
    }
    
    let tatHours: number | undefined = undefined;
    if (newStatus === 'Delivered') {
      const transitStartLog = [...currentLog]
        .reverse()
        .find((log) => log.toStatus === 'In Transit');
      
      const startTimeStr = transitStartLog ? transitStartLog.timestamp : oldDo.createdAt;
      try {
        const startTime = new Date(startTimeStr).getTime();
        const endTime = Date.now();
        const diffMs = endTime - startTime;
        tatHours = Number((diffMs / (1000 * 60 * 60)).toFixed(2));
      } catch (e) {
        console.error('Error calculating TAT:', e);
      }
    }

    const newEntry: RouteComplianceLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      fromStatus: oldDo.status === 'In Transit' || oldDo.status === 'Delivered' || oldDo.status === 'Cancelled' ? oldDo.status : 'Created',
      toStatus: newStatus,
      timestamp: new Date().toISOString(),
      updatedBy: updatedByEmail,
      remarks: remarksText || `Status changed from ${oldDo.status} to ${newStatus}`,
      tatHours
    };

    return [...currentLog, newEntry];
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

    const logEntries: RouteComplianceLogEntry[] = [
      {
        id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        fromStatus: 'Created',
        toStatus: item.status || 'In Transit',
        timestamp: new Date().toISOString(),
        updatedBy: activeUser?.email || activeUser?.name || 'System',
        remarks: 'Order prepared and placed in transit.'
      }
    ];

    const newDo: DespatchOrder = {
      ...item,
      id: `do-${Date.now()}`,
      doNumber: generatedDoNumber,
      createdAt: new Date().toISOString().substring(0, 10),
      routeComplianceLog: logEntries,
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
TSG Group`;

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
      const targetStatus = status || 'Delivered';
      const email = activeUser?.email || activeUser?.name || 'System';
      const updatedLog = updateRouteComplianceLog(item, targetStatus, email, remarks);
      const updatedDo: DespatchOrder = {
        ...item,
        receivedWeight,
        remarks: remarks !== undefined ? remarks : item.remarks,
        status: targetStatus,
        deliveryDocUrl: deliveryDocUrl !== undefined ? deliveryDocUrl : item.deliveryDocUrl,
        deliveryDocName: deliveryDocName !== undefined ? deliveryDocName : item.deliveryDocName,
        routeComplianceLog: updatedLog,
      };
      saveDocument('dos', updatedDo);
    }
  };

  const handleCancelDO = (id: string) => {
    const item = dos.find(d => d.id === id);
    if (item) {
      const email = activeUser?.email || activeUser?.name || 'System';
      const updatedLog = updateRouteComplianceLog(item, 'Cancelled', email, 'Logistics Despatch Order cancelled by user');
      const updatedDo: DespatchOrder = {
        ...item,
        status: 'Cancelled',
        routeComplianceLog: updatedLog,
      };
      saveDocument('dos', updatedDo);
    }
  };

  const handleEditDO = (item: DespatchOrder) => {
    const oldItem = dos.find(d => d.id === item.id);
    const updatedItem = { ...item };
    if (oldItem && oldItem.status !== item.status) {
      const email = activeUser?.email || activeUser?.name || 'System';
      const updatedLog = updateRouteComplianceLog(oldItem, item.status, email, item.remarks);
      updatedItem.routeComplianceLog = updatedLog;
    }
    saveDocument('dos', updatedItem);
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
    signOut(auth).catch(err => console.error('Signout error:', err));
    setIsLoggedIn(false);
    localStorage.removeItem('bd_active_user_id');
    localStorage.removeItem('bd_is_logged_in');
    setActiveUser(null);
  };

  const handleRegisterUser = (newUser: AppUser) => {
    saveDocument('users', newUser);
    setActiveUser(newUser);
    setIsLoggedIn(true);
    localStorage.setItem('bd_active_user_id', newUser.id);
    localStorage.setItem('bd_is_logged_in', 'true');
  };

  const handleChangePasscode = (newPin: string) => {
    if (activeUser) {
      const updated: AppUser = {
        ...activeUser,
        passcode: newPin.trim(),
      };
      saveDocument('users', updated);
      setActiveUser(updated);
    }
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

  // Update User fully (profile & rights)
  const handleUpdateUser = (updatedUser: AppUser) => {
    saveDocument('users', updatedUser);
    if (activeUser && activeUser.id === updatedUser.id) {
      setActiveUser(updatedUser);
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

  const handleUpdateTransporterPayment = (payment: TransporterPayment) => {
    saveDocument('transporter_payments', payment);
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
          resetCollectionWithSeeds('products', INITIAL_PRODUCTS),
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
      products,
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
          (parsed.products || []).forEach((x: any) => saveDocument('products', x));
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
      case 'product': return !activeUser.rights?.managePOs;
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

  const handleTriggerQuickAction = (action: 'do' | 'po' | 'vendor' | 'transporter') => {
    setIsMobileMenuOpen(false);
    if (action === 'do') {
      setActiveTab('dispatch');
      setAutoOpenForm('do');
    } else if (action === 'po') {
      setActiveTab('po');
      setAutoOpenForm('po');
    } else if (action === 'vendor') {
      setActiveTab('vendor');
      setAutoOpenForm('vendor');
    } else if (action === 'transporter') {
      setActiveTab('transporter');
      setAutoOpenForm('transporter');
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
            dos={dos}
            transporters={transporters}
            currentUser={activeUser}
            themeMode={themeMode}
            onToggleTheme={toggleTheme}
            onLogout={handleLogout}
            onToggleSidebar={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            onTriggerQuickAction={handleTriggerQuickAction}
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
            autoOpenForm={autoOpenForm === 'vendor'}
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
            products={products}
            dos={dos}
            onAddPO={handleAddPO}
            onEditPO={handleEditPO}
            onDeletePO={handleDeletePO}
            onBack={() => setActiveTab('dashboard')}
            autoOpenForm={autoOpenForm === 'po'}
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
            autoOpenForm={autoOpenForm === 'transporter'}
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
      case 'product':
        return secureAction(
          'managePOs',
          <ProductMaster
            products={products}
            onAddProduct={handleAddProduct}
            onEditProduct={handleEditProduct}
            onDeleteProduct={handleDeleteProduct}
            onUpdateProductStatus={handleUpdateProductStatus}
            pos={pos}
            onBack={() => setActiveTab('dashboard')}
          />,
          'Product Catalog Master'
        );
      case 'dispatch':
        return secureAction(
          'manageDespatches',
          <DOMaster 
            dos={dos}
            pos={pos}
            companies={companies}
            vendors={vendors}
            products={products}
            transporters={transporters}
            agents={agents}
            sources={sources}
            onAddSource={handleAddSource}
            onAddDO={handleAddDO}
            onEditDO={handleEditDO}
            onUpdateReceivedWeight={handleUpdateReceivedWeight}
            onCancelDO={handleCancelDO}
            onSelectChallan={(item) => setSelectedChallanDo(item)}
            onBack={() => setActiveTab('dashboard')}
            autoOpenForm={autoOpenForm === 'do'}
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
            onEditSource={handleEditSource}
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
            onUpdatePayment={handleUpdateTransporterPayment}
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
            onUpdateUser={handleUpdateUser}
            onBack={() => setActiveTab('dashboard')}
          />,
          'Administrative Security Settings'
        );
      case 'chat':
        return (
          <InteractiveChat 
            activeUser={activeUser}
            users={users}
            onBack={() => setActiveTab('dashboard')}
            themeMode={themeMode}
          />
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

  const isDashboardMode = activeTab === 'dashboard';

  return (
    <div className={`min-h-screen w-full max-w-full overflow-x-hidden flex flex-col font-sans transition-colors duration-300 ${
      themeMode === 'dark' ? 'bg-[#0b0c10] text-[#E0E6ED]' : 'bg-[#EBF3FC] text-[#1A1A1A]'
    }`}>
      
      {/* Top Professional Admin Bar */}
      <div className="fixed top-0 left-0 right-0 z-30 w-full shrink-0 px-4 py-3 bg-[#EBF3FC]/90 dark:bg-[#0b0c10]/95 backdrop-blur-md border-b border-[#D1D1CF]/40 dark:border-white/5 shadow-xs">
        <div className="w-full max-w-4xl mx-auto">
          <div className="relative flex items-center justify-between px-2 sm:px-4 py-2 bg-gradient-to-r from-[#031E51] via-[#051130] to-[#041D4C] text-slate-300 shadow-[0_12px_28px_rgba(3,30,81,0.35)] border border-white/10 backdrop-blur-md rounded-[32px]">
            {/* Shine gloss highlight overlay */}
            <div className="absolute inset-0 rounded-[32px] bg-gradient-to-b from-white/12 to-transparent pointer-events-none h-1/2" />
            
            {/* Left Controls Group */}
            <div className="flex items-center space-x-1 sm:space-x-1.5 relative z-10 min-w-0">
              {/* Menu trigger button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 hover:text-white transition-all cursor-pointer border border-white/5 active:scale-95 shrink-0"
                title="Open Navigation Menu"
              >
                <Menu className="h-4.5 w-4.5 text-white" />
              </button>

              {/* Home utility action */}
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`hidden min-[420px]:flex h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/25 hover:text-white transition-all cursor-pointer border border-white/5 active:scale-95 shrink-0 ${themeMode === 'dark' ? 'text-amber-400' : 'text-slate-200'}`}
                title="Go to Dashboard"
              >
                <Home className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
              </button>

              {/* Active Module badge indicator (Speedometer / Gauge removed as requested) */}
              <div className="flex items-center px-2.5 py-1 sm:py-1.5 bg-white/15 border border-white/5 rounded-full shadow-inner min-w-0 shrink-0 select-none">
                <span className="text-[8px] sm:text-[9px] md:text-xs font-sans font-black tracking-wider uppercase text-white leading-none truncate col-span-1">
                  {tabDisplayNames[activeTab] || activeTab}
                </span>
              </div>
            </div>

            {/* Right Controls Group */}
            <div className="flex items-center space-x-1 sm:space-x-1.5 relative z-10 shrink-0">
              {/* Dynamic AUTO/MANUAL Refresh Control Cluster */}
              <div className="flex items-center space-x-1.5 p-1 bg-white/5 border border-white/10 rounded-full shrink-0 select-none">
                {/* Auto Sync Toggle Button */}
                <button
                  onClick={() => setIsAutoRefresh(!isAutoRefresh)}
                  className={`h-7 px-2 sm:px-2.5 rounded-full flex items-center space-x-1 transition-all cursor-pointer text-[10px] uppercase font-mono font-bold ${
                    isAutoRefresh 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                  title={isAutoRefresh ? "Auto Sync is LIVE (Click to switch to Manual Sync Mode)" : "Manual Sync Mode (Click to enable real-time Auto Sync)"}
                >
                  {isAutoRefresh ? (
                    <>
                      <Wifi className="h-2.5 w-2.5 shrink-0" />
                      <span className="hidden min-[360px]:inline">Auto</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="h-2.5 w-2.5 text-amber-300 shrink-0" />
                      <span className="hidden min-[360px]:inline">Manual</span>
                    </>
                  )}
                </button>

                {/* Manual Trigger Trigger Refresh Icon */}
                <button
                  onClick={triggerManualRefresh}
                  disabled={isRefreshing}
                  className={`h-7 w-7 flex items-center justify-center rounded-full transition-all cursor-pointer active:scale-95 text-slate-200 border border-white/5 ${
                    isRefreshing ? 'bg-indigo-600/30 text-indigo-200' : 'bg-white/10 hover:bg-white/25 hover:text-white'
                  }`}
                  title="Force DB Sync & Refresh"
                >
                  <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {/* Interactive Team Chat Board shortcut */}
              <button
                id="interactive-chat-shortcut-btn"
                onClick={() => setActiveTab('chat')}
                className={`flex h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 items-center justify-center rounded-full bg-orange-500/15 hover:bg-orange-500/35 text-orange-350 hover:text-orange-200 transition-all cursor-pointer border border-[#E65100]/30 active:scale-95`}
                title="Secure Terminal Interactive Messaging"
              >
                <MessageSquare className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
              </button>

              {/* Chat button - redirects to notification center log */}
              <button
                onClick={() => setActiveTab('notifications')}
                className={`hidden min-[480px]:flex h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/25 hover:text-white text-slate-200 transition-all cursor-pointer border border-white/5 active:scale-95`}
                title="Notifications Center"
              >
                <MessageCircle className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
              </button>

              {/* Moon/Sun Toggle */}
              <button
                onClick={toggleTheme}
                className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/25 hover:text-white text-slate-350 transition-all cursor-pointer border border-white/5 active:scale-95"
                title={themeMode === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {themeMode === 'dark' ? (
                  <Sun className="h-4 w-4 sm:h-[18px] sm:w-[18px] text-amber-400 fill-amber-400/20" />
                ) : (
                  <Moon className="h-4 w-4 sm:h-[18px] sm:w-[18px] text-[#90CAF9]" />
                )}
              </button>

              {/* Logout Action */}
              <button
                onClick={handleLogout}
                className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 flex items-center justify-center rounded-full bg-rose-500/10 hover:bg-rose-500/25 text-rose-300 border border-rose-500/20 hover:text-rose-200 transition-all cursor-pointer active:scale-95"
                title="Disconnect Session"
              >
                <LogOut className="h-4 w-4 sm:h-[16px] sm:w-[16px]" />
              </button>
            </div>
          </div>

          {/* Global Centered Subtitle - Exactly matching user screenshot */}
          <div className={`mt-2 text-center text-[9px] uppercase font-mono tracking-[0.25em] font-extrabold ${
            themeMode === 'dark' ? 'text-slate-400' : 'text-[#888884]'
          }`}>
            TSG LOGISTICS SYSTEMS v4.0
          </div>
        </div>
      </div>

      {/* Main Grid Workspace split into navigation left, active panel right */}
      <div className={isDashboardMode 
        ? "w-full flex-1 flex flex-col relative pb-32 sm:pb-36 md:pb-8 mt-[104px]"
        : "max-w-7xl mx-auto w-full flex-1 flex flex-col p-4 md:p-8 relative pb-32 sm:pb-36 md:pb-8 mt-[104px] min-w-0"
      }>
        
        {/* Grey Backdrop Overlay when open */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/60 z-40"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Navigation Sidebar panel / Slide-out drawer */}
        <aside 
          className={`fixed top-0 left-0 h-full w-72 ${themeMode === 'dark' ? 'bg-[#12141a] border-slate-800 text-slate-100' : 'bg-[#EBF3FC] border-[#D1D1CF] text-[#1A1A1A]'} z-50 flex flex-col gap-4 p-5 border-r shadow-2xl overflow-y-auto shrink-0 transition-all duration-300 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
          {/* Mobile/Dashboard Sidebar Brand Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#D1D1CF] mb-2 shrink-0">
            <div className="flex items-center space-x-2.5">
              <TSGLogo size={32} />
              <span className="font-serif font-bold italic text-xs tracking-wider text-[#E65100]">TSG NAVIGATION</span>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-1 px-2 border-2 border-black text-[10px] font-mono tracking-tighter uppercase bg-white cursor-pointer hover:bg-neutral-100 transition-colors"
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
                <div className="flex items-center space-x-1.5">
                  <button 
                    onClick={() => { setIsChangePinOpen(true); setIsMobileMenuOpen(false); }} 
                    className="hover:text-white text-amber-500 transition-all cursor-pointer font-bold bg-transparent border-none p-0 whitespace-nowrap"
                    title="Change secure passcode PIN"
                  >
                    Change PIN
                  </button>
                  <span className="text-zinc-600">|</span>
                  <button 
                    onClick={() => { setActiveTab('admin'); setIsMobileMenuOpen(false); }} 
                    className="hover:text-white text-zinc-400 underline transition-all cursor-pointer font-bold bg-transparent border-none p-0 whitespace-nowrap"
                    title="Open security settings matrix"
                  >
                    Rights Desk
                  </button>
                  <span className="text-zinc-600">|</span>
                  <button 
                    onClick={handleLogout} 
                    className="hover:text-rose-400 text-rose-500 transition-all cursor-pointer font-bold bg-transparent border-none p-0 whitespace-nowrap"
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

                {/* Menu: Product Master */}
                <button
                  id="tab-product-btn"
                  onClick={() => { setActiveTab('product'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center justify-between py-2 text-left transition-colors cursor-pointer ${
                    activeTab === 'product'
                      ? 'text-[#E65100] font-bold underline underline-offset-8 decoration-2'
                      : 'text-[#1A1A1A] hover:text-[#E65100]'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Layers className={`h-4 w-4 shrink-0 inline ${isTabLocked('product') ? 'text-zinc-455' : 'opacity-70'}`} />
                    <span className={isTabLocked('product') ? 'text-zinc-400 font-normal line-through decoration-stone-300' : ''}>Product Master</span>
                    {isTabLocked('product') && <Lock className="h-3 w-3 text-[#E65100]/80 inline shrink-0" />}
                  </div>
                  <ChevronRight className={`h-3 w-3 ${activeTab === 'product' ? 'text-[#E65100]' : 'opacity-0'}`} />
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

                {/* Menu: Communications Hub */}
                <button
                  id="tab-chat-btn"
                  onClick={() => { setActiveTab('chat'); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center justify-between py-2.5 text-left transition-colors cursor-pointer ${
                    activeTab === 'chat'
                      ? 'text-[#E65100] font-bold underline underline-offset-8 decoration-2'
                      : 'text-neutral-700 hover:text-[#E65100]'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <MessageSquare className="h-4 w-4 shrink-0 inline text-[#E65100]" />
                    <span>Communications Hub</span>
                  </div>
                  <ChevronRight className="h-3 w-3 text-[#E65100]" />
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
        <main className={isDashboardMode
          ? "flex-1 relative w-full h-full min-h-screen"
          : "flex-1 min-w-0 bg-white rounded-none border border-[#D1D1CF] p-6 md:p-10 min-h-[500px]"
        }>
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
          products={products}
          vendorsList={vendors}
          transportersList={transporters}
          agentsList={agents}
          onClose={() => setSelectedChallanDo(null)}
        />
      )}

      {/* Change Passcode PIN Modal */}
      {isChangePinOpen && activeUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-55">
          <div className="bg-white rounded-none border-2 border-black shadow-xl w-full max-w-sm overflow-hidden text-[#1A1A1A]">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
              <h3 className="font-serif font-bold italic text-slate-805 text-sm">
                Update Secure Terminal PIN Key
              </h3>
              <button
                type="button"
                className="text-slate-400 hover:text-black font-mono text-xs uppercase cursor-pointer"
                onClick={() => {
                  setIsChangePinOpen(false);
                  setTempNewPin('');
                }}
              >
                Close [X]
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              const pin = tempNewPin.trim();
              if (pin.length < 4) {
                alert('For security, passcode PIN must be at least 4 characters long.');
                return;
              }
              handleChangePasscode(pin);
              setIsChangePinOpen(false);
              setTempNewPin('');
              alert('Passcode PIN changed successfully! You can now use this passcode PIN to log in on your compiled APK.');
            }} className="p-6 space-y-4">
              <div>
                <span className="block text-[10px] text-zinc-400 font-mono tracking-wider uppercase mb-1">
                  Logged In Terminal User
                </span>
                <p className="text-xs font-bold text-stone-900 font-sans">
                  {activeUser.name} ({activeUser.email})
                </p>
                <p className="text-[10px] text-zinc-500 italic font-serif mt-1">
                  Current PIN key in central ledger: <code className="font-mono font-black text-[#E65100] bg-stone-50 px-1 border border-stone-200">{activeUser.passcode || 'password1234'}</code>
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Configure New PIN Passcode <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter custom passcode PIN"
                  value={tempNewPin}
                  onChange={(e) => setTempNewPin(e.target.value)}
                  className="w-full text-xs px-3.5 py-2 border border-slate-200 focus:outline-hidden font-mono text-stone-900 font-bold bg-[#F9F8F6]"
                  required
                />
                <span className="block text-[9px] text-slate-400 mt-1.5 italic leading-relaxed">
                  Avoid simple configurations. Use a phrase, code, or private token that only you know.
                </span>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setIsChangePinOpen(false);
                    setTempNewPin('');
                  }}
                  className="px-4 py-2 border border-[#D1D1CF] text-xs font-serif italic cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#E65100] hover:bg-black text-white text-xs uppercase tracking-wider font-bold rounded-none transition-colors cursor-pointer"
                >
                  Save New PIN Key
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Glossy Interactive Bottom Navigation Menu representation */}
      {activeUser && (
        <div className="md:hidden">
          <BottomFloatingMenu 
            onTriggerQuickAction={handleTriggerQuickAction}
          />
        </div>
      )}

      {/* System Legal Corporate Footer */}
      {!isDashboardMode && (
        <footer className="bg-white border-t border-[#D1D1CF] py-4 text-center text-[10px] text-[#888884] uppercase tracking-widest shrink-0 font-sans">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <span>&copy; 2026 TSG Impex India Pvt Ltd. Approved fly ash & cements transport systems.</span>
          </div>
        </footer>
      )}

    </div>
  );
}
