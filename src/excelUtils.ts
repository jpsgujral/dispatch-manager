import { DespatchOrder, PurchaseOrder, Company, Vendor, Transporter, Agent, SourceLocation } from './types';
import { getCommissionLogic } from './data';

/**
 * Escapes a cell value for CSV formatting.
 * Handles double quotes, commas, and newlines.
 */
function escapeCSV(val: any): string {
  if (val === null || val === undefined) {
    return '';
  }
  let str = String(val).trim();
  // If contain formatting characters, enclose in double quotes and escape internal quotes
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    str = '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

/**
 * Exports lists of despatch orders or general records into an excel-cooperative CSV download.
 */
export function exportDOsToCSV(
  dos: DespatchOrder[],
  pos: PurchaseOrder[],
  companies: Company[],
  vendors: Vendor[],
  transporters: Transporter[],
  agents: Agent[],
  sources: SourceLocation[]
) {
  // Column definitions
  const headers = [
    'DO Number',
    'Date',
    'Material',
    'Vendor Name',
    'Company',
    'Vehicle Number',
    'Transporter',
    'Received Weight (MT)',
    'Loaded Weight (MT)',
    'Transporter Rate (Rs/MT)',
    'Agent Name',
    'Gross Profit (Rs)',
    'Agent Commission (Rs)',
    'Net Company Profit (Rs)',
    'Status',
    'Driver Name',
    'Driver Phone',
    'Remarks'
  ];

  const rows = dos.map((item) => {
    const po = pos.find((p) => p.id === item.poId);
    const company = po ? companies.find((c) => c.id === po.companyId) : null;
    const vendor = po ? vendors.find((v) => v.id === po.vendorId) : null;
    const transporter = transporters.find((t) => t.id === item.transporterId);
    const agent = agents.find((a) => a.id === item.agentId);

    const mLog = po 
      ? getCommissionLogic(
          po.vendorRate, 
          item.transporterRate, 
          item.receivedWeight ?? (item.loadedWeight ?? 0)
        ) 
      : null;

    return [
      item.doNumber,
      item.date,
      po?.material || 'N/A',
      vendor?.name || 'N/A',
      company?.name || 'N/A',
      item.vehicleNumber,
      transporter?.name || 'N/A',
      item.receivedWeight !== null ? item.receivedWeight.toFixed(2) : 'Pending',
      item.loadedWeight !== null ? item.loadedWeight.toFixed(2) : 'N/A',
      item.transporterRate.toFixed(2),
      agent?.name || 'Direct Delivery',
      mLog ? mLog.totalGrossProfit.toFixed(2) : '0.00',
      mLog ? mLog.totalCommission.toFixed(2) : '0.00',
      mLog ? mLog.netCompanyProfit.toFixed(2) : '0.00',
      item.status,
      item.driverName || 'N/A',
      item.driverPhone || 'N/A',
      item.remarks || ''
    ];
  });

  // Combine headers and rows
  const csvContent = [
    headers.map(escapeCSV).join(','),
    ...rows.map((row) => row.map(escapeCSV).join(','))
  ].join('\r\n');

  // Trigger download with BOM for Excel UTF-8 support
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  const timestamp = new Date().toISOString().slice(0, 10);
  link.setAttribute('href', url);
  link.setAttribute('download', `TSG_Despatch_Orders_${timestamp}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
