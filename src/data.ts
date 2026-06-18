import { Company, Vendor, PurchaseOrder, Transporter, Agent, DespatchOrder, AppUser, AgentPayment, TransporterPayment, SourceLocation } from './types';

export const INITIAL_SOURCES: SourceLocation[] = [
  { id: 'src-1', name: 'Ropar Thermal Power Plant Stage II', pincode: '140125', createdAt: '2026-01-01' },
  { id: 'src-2', name: 'Panipat Thermal Plant Loading Yards', pincode: '132105', createdAt: '2026-02-01' },
  { id: 'src-3', name: 'Dadri Coal Slag Silos', pincode: '203207', createdAt: '2026-03-01' }
];

export const INITIAL_COMPANIES: Company[] = [
  {
    id: 'co-1',
    name: 'TSG Impex India Pvt Ltd',
    address: 'SCF-24, Sector 7-C, Madhya Marg, Chandigarh - 160019',
    gstin: '03AADCS7291F1Z2',
    contactNo: '+91 98765 43210',
    email: 'info@tsgimpex.com',
    createdAt: '2026-01-10',
  },
  {
    id: 'co-2',
    name: 'Apex Powders & Logistics Pvt Ltd',
    address: 'Plot No. 12, Industrial Area Phase II, Panchkula, Haryana - 134113',
    gstin: '06AAXCA1024D1ZH',
    contactNo: '+91 99887 76655',
    email: 'ops@apexpowders.co.in',
    createdAt: '2026-02-15',
  }
];

export const INITIAL_VENDORS: Vendor[] = [
  {
    id: 'v-1',
    name: 'Larsen & Toubro (L&T) Construction',
    address: 'L&T House, Ballard Estate, Mumbai, MH - 400001',
    gstin: '27AAACL1234E1ZP',
    plants: ['Camp-1 (Delhi-Vadodara Expressway Project, Sohna)', 'Camp-2 (Sector-102 Gurgaon Project)', 'Camp-3 (Jewar Airport Batching Plant)'],
    contactNo: '+91 22 6752 5656',
    email: 'epc.procurement@lntecc.com',
    createdAt: '2026-01-15',
  },
  {
    id: 'v-2',
    name: 'UltraTech Cement Ltd (RMC Division)',
    address: 'Ahura Centre, B-Wing, Mahakali Caves Road, Andheri East, Mumbai - 400093',
    gstin: '27AAACU2345A1ZO',
    plants: ['Chandigarh Plant RMC', 'Ludhiana Bypass Camp', 'Ambala Highway Site'],
    contactNo: '+91 22 6691 7800',
    email: 'rmc.procure@ultratech.adityabirla.com',
    createdAt: '2026-02-01',
  },
  {
    id: 'v-3',
    name: 'Tata Projects Limited',
    address: 'One Boulevard, Lake Boulevard Road, Powai, Mumbai - 400076',
    gstin: '27AAACT9876B1ZK',
    plants: ['Camp-A (Noida Metro Line Addition)', 'Camp-B (Ganga Expressway Segment 3)', 'Camp-C (Sardar Sarovar Canal Site)'],
    contactNo: '+91 22 6625 4000',
    email: 'materials@tataprojects.com',
    createdAt: '2026-02-10',
  }
];

export const INITIAL_TRANSPORTERS: Transporter[] = [
  {
    id: 't-1',
    name: 'National Bulk Carriers (NBC)',
    address: 'Sanjay Gandhi Transport Nagar, New Delhi - 110042',
    contactNo: '+91 94140 12345',
    vehicleCount: 22,
    gstin: '07AAAFN5522D1ZC',
    createdAt: '2026-01-20',
    rates: [
      { vendorId: 'v-1', rate: 1020 },
      { vendorId: 'v-2', rate: 940 },
      { vendorId: 'v-3', rate: 3150 }
    ]
  },
  {
    id: 't-2',
    name: 'Sher-E-Punjab Logistics Co',
    address: 'G.T. Road, Near Bypass, Ludhiana, Punjab - 141008',
    contactNo: '+91 98141 87654',
    vehicleCount: 15,
    gstin: '03AAAFS1212B1ZA',
    createdAt: '2026-01-25',
    rates: [
      { vendorId: 'v-1', rate: 1050 },
      { vendorId: 'v-2', rate: 1060 },
      { vendorId: 'v-3', rate: 3200 }
    ]
  },
  {
    id: 't-3',
    name: 'Direct Tankers Transport Association',
    address: 'Transport Yard No 4, Sector 26, Gandhinagar, GJ - 382026',
    contactNo: '+91 93771 22334',
    vehicleCount: 35,
    gstin: '24AAAFD3434C1ZX',
    createdAt: '2026-02-05',
    rates: [
      { vendorId: 'v-1', rate: 980 },
      { vendorId: 'v-2', rate: 910 },
      { vendorId: 'v-3', rate: 3000 }
    ]
  }
];

export const INITIAL_AGENTS: Agent[] = [
  {
    id: 'a-1',
    name: 'Gurmeet Singh Brar (Brar Logistics & Trading)',
    contactNo: '+91 98722 00112',
    email: 'gurmeet.brar@gmail.com',
    createdAt: '2026-01-05',
  },
  {
    id: 'a-2',
    name: 'Kashmiri Lal & Sons Agencies',
    contactNo: '+91 94170 44556',
    email: 'kashmiri_agents@rediffmail.com',
    createdAt: '2026-01-22',
  },
  {
    id: 'a-3',
    name: 'Rajinder Gupta Procurement Solutions',
    contactNo: '+91 98120 44221',
    email: 'info@guptasolutions.in',
    createdAt: '2026-02-18',
  }
];

export const INITIAL_POS: PurchaseOrder[] = [
  {
    id: 'po-1',
    poNumber: 'LNT/2026/FASH/304',
    companyId: 'co-1',
    vendorId: 'v-1',
    material: 'Fly Ash',
    totalQuantity: 500, // 500 MT
    vendorRate: 1150, // Rs. 1150 / MT
    effectiveDate: '2026-03-01',
    status: 'Active',
    notes: 'Premium dry Fly Ash supplying from approved Source (Ropar Thermal Power Plant Stage II).',
    createdAt: '2026-03-01',
  },
  {
    id: 'po-2',
    poNumber: 'UTC/RMC/GGBS/081',
    companyId: 'co-1',
    vendorId: 'v-2',
    material: 'GGBS',
    totalQuantity: 350, // 350 MT
    vendorRate: 3400, // Rs. 3400 / MT
    effectiveDate: '2026-04-05',
    status: 'Active',
    notes: 'Ground Granulated Blast-furnace Slag compliant with IS 16714.',
    createdAt: '2026-04-05',
  },
  {
    id: 'po-3',
    poNumber: 'TPL/DELHI-METRO/MS/012',
    companyId: 'co-2',
    vendorId: 'v-3',
    material: 'Micro Silica',
    totalQuantity: 120, // 120 MT
    vendorRate: 14500, // Rs. 14500 / MT
    effectiveDate: '2026-05-10',
    status: 'Active',
    notes: 'High-grade densified Silica Fume (Micro Silica) for 90 Grade Concrete.',
    createdAt: '2026-05-10',
  }
];

export const INITIAL_DOS: DespatchOrder[] = [
  {
    id: 'do-1',
    doNumber: 'DO-2026-0001',
    date: '2026-06-01',
    poId: 'po-1', // LNT/2026/FASH/304, vendorRate: 1150
    vendorPlant: 'Camp-1 (Delhi-Vadodara Expressway Project, Sohna)',
    transporterId: 't-1',
    vehicleNumber: 'HR-55-AJ-4321',
    agentId: 'a-1', // Gurmeet Singh
    sourceId: 'src-1', // Linked to Ropar Power Plant
    transporterRate: 1020, // Transporter rate: 1020
    // Profit calculation: 1150 (Vendor) - 1020 (Transporter) = 130 Rs/MT. Since 130 > 100, Agent gets 15% Comm.
    // Comm rate per MT = 15% of 130 = 19.5 Rs/MT.
    loadedWeight: 31.42, // Loaded weight: 31.42 MT
    receivedWeight: 31.25, // Received weight: 31.25 MT (vendor final cert)
    // Total Agent Comm = 19.5 * 31.25 = Rs. 609.375
    // Net profit after agent commission = (Profit * ReceivedWeight) - AgentCommission = (130 * 31.25) - 609.375 = 4062.5 - 609.375 = 3453.125 Rs
    status: 'Delivered',
    driverName: 'Sukhdev Singh',
    driverPhone: '+91 98888 12345',
    remarks: 'Delivered smoothly within scheduled hours, minimal weight transit loss (0.17 MT).',
    deliveryDocName: 'pod_ticket_89421.png',
    deliveryDocUrl: '#',
    invoiceReceived: true,
    invoiceNo: 'INV-NBC-9844',
    invoiceDate: '2026-06-02',
    invoiceType: 'Digital',
    invoiceDigitallySigned: true,
    invoiceHardCopyReceived: false,
    invoiceDocName: 'inv_nbc_9844_signed.pdf',
    invoiceDocUrl: '#',
    createdAt: '2026-06-01',
  },
  {
    id: 'do-2',
    doNumber: 'DO-2026-0002',
    date: '2026-06-03',
    poId: 'po-1', // LNT/2026/FASH/304, vendorRate: 1150
    vendorPlant: 'Camp-2 (Sector-102 Gurgaon Project)',
    transporterId: 't-2',
    vehicleNumber: 'PB-10-DF-8812',
    agentId: 'a-2', // Kashmiri Lal
    sourceId: 'src-2', // Linked to Panipat Loading Yards
    transporterRate: 1060, // Transporter rate: 1060 Rs/MT
    // Profit calculation: 1150 - 1060 = 90 Rs/MT. Since 90 <= 100, Agent gets 10% Comm.
    // Comm rate per MT = 10% of 90 = 9 Rs/MT.
    loadedWeight: 32.11,
    receivedWeight: 31.95,
    // Agent Commission = 9 * 31.95 = Rs. 287.55
    status: 'Delivered',
    driverName: 'Mandeep Singh',
    driverPhone: '+91 94171 99002',
    remarks: 'Discharged safely via pneumatic pressure. Accepted.',
    deliveryDocName: 'pod_ticket_90112.png',
    deliveryDocUrl: '#',
    invoiceReceived: true,
    invoiceNo: 'INV-SEP-4512',
    invoiceDate: '2026-06-04',
    invoiceType: 'Digital',
    invoiceDigitallySigned: false, // ALERT needed: Unsigned digital scan, require physical hard copy!
    invoiceHardCopyReceived: false, // Track as missing
    invoiceDocName: 'inv_sep_4512_unsigned_scan.pdf',
    invoiceDocUrl: '#',
    createdAt: '2026-06-03',
  },
  {
    id: 'do-3',
    doNumber: 'DO-2026-0003',
    date: '2026-06-15',
    poId: 'po-2', // UTC/RMC/GGBS/081, vendorRate: 3400
    vendorPlant: 'Chandigarh Plant RMC',
    transporterId: 't-1',
    vehicleNumber: 'HR-38-EF-2384',
    agentId: null, // Direct order! No agent.
    sourceId: 'src-1', // Linked to Ropar
    transporterRate: 3150, // Profit per MT = 3400 - 3150 = 250 Rs/MT
    loadedWeight: 28.50,
    receivedWeight: null, // Still in transit / not yet weighed by Vendor!
    status: 'In Transit',
    driverName: 'Ramesh Kumar',
    driverPhone: '+91 99912 34567',
    remarks: 'bulker crossed Ambala toll, expected delivery next morning.',
    createdAt: '2026-06-15',
  }
];

/**
 * Calculators for business profit and agent commission logic
 */
export function getCommissionLogic(vendorRate: number, transporterRate: number, receivedWeight: number | null) {
  const profitPerMT = vendorRate - transporterRate;
  const direct = profitPerMT;
  
  // Commission logic:
  // if profit is less than Rs. 100/MT, get 10% commission.
  // if profit is > Rs. 100/MT, get 15% commission.
  // Let's treat exactly 100/MT as 10% (from prompt: "if profit is Rs. 100/mt and agent gets Rs. 10/mt" i.e. 10%)
  const commissionPercentage = profitPerMT <= 100 ? 10 : 15;
  const commissionPerMT = profitPerMT > 0 ? (profitPerMT * commissionPercentage) / 100 : 0;
  
  const effectiveWeight = receivedWeight ?? 0;
  const totalCommission = commissionPerMT * effectiveWeight;
  const totalGrossProfit = profitPerMT * effectiveWeight;
  const netCompanyProfit = totalGrossProfit - totalCommission;

  return {
    profitPerMT,
    commissionPercentage,
    commissionPerMT,
    totalGrossProfit,
    totalCommission,
    netCompanyProfit
  };
}

export const INITIAL_USERS: AppUser[] = [
  {
    id: 'u-1',
    name: 'J.P.S. Gujral',
    email: 'jpsgujral@gmail.com',
    role: 'Admin',
    status: 'Active',
    rights: {
      manageCompanies: true,
      manageVendors: true,
      managePOs: true,
      manageTransporters: true,
      manageDespatches: true,
      manageLedger: true,
      manageAdmin: true,
    },
    createdAt: '2026-01-01',
  },
  {
    id: 'u-2',
    name: 'Rajdeep Singh',
    email: 'rajdeep.singh@tsgimpex.com',
    role: 'Executive',
    status: 'Active',
    rights: {
      manageCompanies: true,
      manageVendors: true,
      managePOs: true,
      manageTransporters: true,
      manageDespatches: true,
      manageLedger: false,
      manageAdmin: false,
    },
    createdAt: '2026-02-15',
  },
  {
    id: 'u-3',
    name: 'Simran Kaur',
    email: 'guest.simran@tsgimpex.com',
    role: 'Viewer',
    status: 'Active',
    rights: {
      manageCompanies: false,
      manageVendors: false,
      managePOs: false,
      manageTransporters: false,
      manageDespatches: false,
      manageLedger: false,
      manageAdmin: false,
    },
    createdAt: '2026-03-10',
  }
];

export const INITIAL_PAYMENTS: AgentPayment[] = [
  {
    id: 'pay-1',
    agentId: 'a-2', // Kashmiri Lal
    year: 2026,
    month: 'June',
    paymentDate: '2026-06-10',
    amountPaid: 287.55,
    referenceNo: 'TXN-HDFC-90214811',
    paidByCompanyId: 'co-1',
    notes: 'Cleared brokerage commission for fly ash supply order (DO-0002). Verified with weighbridge receipt.',
    createdAt: '2026-06-10',
  }
];

export const INITIAL_TRANSPORTER_PAYMENTS: TransporterPayment[] = [];


