export type MaterialType = 'Fly Ash' | 'GGBS' | 'Micro Silica';

export interface Company {
  id: string;
  name: string;
  address: string;
  gstin?: string;
  contactNo?: string;
  email?: string;
  createdAt: string;
}

export interface Vendor {
  id: string;
  name: string;
  address: string;
  gstin?: string;
  plants: string[]; // e.g. ["Camp-1", "Camp-2"]
  contactNo?: string;
  email?: string;
  status?: 'Active' | 'Inactive';
  createdAt: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string; // unique PO number
  companyId: string; // our billing company
  vendorId: string; // vendor who placed order
  material: MaterialType;
  totalQuantity: number; // in Metric Tons (MT)
  vendorRate: number; // price per MT in Rs.
  effectiveDate: string; // YYYY-MM-DD
  status: 'Active' | 'Completed' | 'Cancelled';
  notes?: string;
  createdAt: string;
}

export interface TransporterRate {
  vendorId: string;
  rate: number;
  wef?: string; // with effect from date YYYY-MM-DD
}

export interface Transporter {
  id: string;
  name: string;
  address: string;
  contactNo?: string;
  email?: string;
  vehicleCount?: number;
  gstin?: string;
  status?: 'Active' | 'Inactive';
  createdAt: string;
  rates?: TransporterRate[];
}

export interface Agent {
  id: string;
  name: string;
  contactNo?: string;
  email?: string;
  createdAt: string;
}

export interface SourceLocation {
  id: string;
  name: string; // The single text box for the source name / loading point
  pincode: string; // Pincode associated with the source
  createdAt: string;
}

export interface DespatchOrder {
  id: string;
  doNumber: string; // unique DO number (e.g. DO-2026-001)
  date: string; // YYYY-MM-DD
  poId: string; // linked PO
  vendorPlant: string; // delivery location from Vendor's plants (e.g., "Camp-1")
  transporterId: string; // linked transporter
  vehicleNumber: string; // manually typed
  agentId: string | null; // linked agent (null if direct by company)
  sourceId?: string; // linked source location from Source Master
  
  transporterRate: number; // transporter charge per MT in Rs.
  loadedWeight: number | null; // loaded weight in MT at supplier site (optional, can be null)
  receivedWeight: number | null; // received weight in MT at vendor's plant
  
  status: 'In Transit' | 'Delivered' | 'Cancelled';
  driverName?: string;
  driverPhone?: string;
  remarks?: string;
  deliveryDocUrl?: string; // base64 or object URL of proof of delivery
  deliveryDocName?: string; // name of file
  
  // Invoice Details
  invoiceNo?: string;
  invoiceDate?: string;
  invoiceReceived?: boolean;
  invoiceType?: 'Digital' | 'HardCopy';
  invoiceDigitallySigned?: boolean; // if Digital, was it digitally signed?
  invoiceHardCopyReceived?: boolean; // tracking if the hard copy is received or missing
  invoiceDocUrl?: string; // base64 or object URL of the uploaded invoice
  invoiceDocName?: string; // file name of the invoice
  
  // Payment ID linkage
  transporterPaymentId?: string; // links to TransporterPayment once settled
  
  createdAt: string;
}

export interface TransporterPayment {
  id: string;
  transporterId: string;
  paymentDate: string; // YYYY-MM-DD
  amountPaid: number;
  referenceNo: string;
  paymentMethod: string; // e.g., "NEFT", "RTGS", "Bank Transfer", "Cheque"
  paidByCompanyId: string; // linked billing company
  despatchOrderIds: string[]; // paid for multiple invoices/deliveries at once
  notes?: string;
  createdAt: string;
}

export interface UserRights {
  manageCompanies: boolean;
  manageVendors: boolean;
  managePOs: boolean;
  manageTransporters: boolean;
  manageDespatches: boolean;
  manageLedger: boolean;
  manageAdmin: boolean;
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Executive' | 'Viewer';
  status: 'Active' | 'Inactive';
  rights: UserRights;
  createdAt: string;
}

export interface AgentPayment {
  id: string;
  agentId: string;
  year: number;
  month: string; // e.g. "January", "February", or date range
  paymentDate: string; // YYYY-MM-DD
  amountPaid: number;
  referenceNo: string;
  paidByCompanyId: string; // linked billing company
  notes?: string;
  createdAt: string;
}

