import React, { useState, useMemo } from 'react';
import { DespatchOrder, Transporter, PurchaseOrder, SourceLocation, Vendor } from '../types';
import { Mail, Settings, Send, CheckCircle2, AlertTriangle, RefreshCw, X, MessageSquare, Info } from 'lucide-react';

export interface NotificationLog {
  id: string;
  doId: string;
  doNumber: string;
  transporterId: string;
  transporterName: string;
  recipientEmail: string;
  subject: string;
  body: string;
  status: 'Sent' | 'Failed' | 'Pending';
  sentAt: string;
}

interface NotificationCenterProps {
  notifications: NotificationLog[];
  transporters: Transporter[];
  dos: DespatchOrder[];
  pos: PurchaseOrder[];
  vendors: Vendor[];
  sources: SourceLocation[];
  onBack?: () => void;
  onSendTestEmail?: (email: string, subject: string, body: string) => void;
}

// System Default Templates
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

export default function NotificationCenter({
  notifications,
  transporters,
  dos,
  pos,
  vendors,
  sources,
  onBack,
  onSendTestEmail
}: NotificationCenterProps) {
  // Persistence for customize templates is local (or we just allow live testing and save settings in localState configuration)
  const [subjectTemplate, setSubjectTemplate] = useState(() => {
    return localStorage.getItem('cfg_notification_subject_template') || DEFAULT_SUBJECT_TEMPLATE;
  });
  const [bodyTemplate, setBodyTemplate] = useState(() => {
    return localStorage.getItem('cfg_notification_body_template') || DEFAULT_BODY_TEMPLATE;
  });

  const [activeSubTab, setActiveSubTab] = useState<'logs' | 'templates'>('logs');
  const [selectedLog, setSelectedLog] = useState<NotificationLog | null>(null);
  const [isSavedAlert, setIsSavedAlert] = useState(false);

  // Stats
  const stats = useMemo(() => {
    const total = notifications.length;
    const sent = notifications.filter(n => n.status === 'Sent').length;
    const failed = notifications.filter(n => n.status === 'Failed').length;
    return { total, sent, failed };
  }, [notifications]);

  const handleSaveTemplates = () => {
    localStorage.setItem('cfg_notification_subject_template', subjectTemplate);
    localStorage.setItem('cfg_notification_body_template', bodyTemplate);
    setIsSavedAlert(true);
    setTimeout(() => setIsSavedAlert(false), 3000);
  };

  const handleResetTemplates = () => {
    if (confirm("Reset templates back to original system defaults?")) {
      setSubjectTemplate(DEFAULT_SUBJECT_TEMPLATE);
      setBodyTemplate(DEFAULT_BODY_TEMPLATE);
      localStorage.setItem('cfg_notification_subject_template', DEFAULT_SUBJECT_TEMPLATE);
      localStorage.setItem('cfg_notification_body_template', DEFAULT_BODY_TEMPLATE);
    }
  };

  // Select a random recent DO to preview template mapping
  const previewData = useMemo(() => {
    const activeDos = dos.filter(d => d.status === 'In Transit');
    const demoDo = activeDos.length > 0 ? activeDos[0] : dos[0];
    if (!demoDo) return null;

    const po = pos.find(p => p.id === demoDo.poId);
    const transport = transporters.find(t => t.id === demoDo.transporterId);
    const v = po ? vendors.find(vd => vd.id === po.vendorId) : null;
    const src = sources.find(s => s.id === demoDo.sourceId);

    const dataMap: Record<string, string> = {
      doNumber: demoDo.doNumber,
      vehicleNumber: demoDo.vehicleNumber,
      transporterName: transport?.name || 'N/A',
      material: po?.material || 'Fly Ash',
      sourceLocation: src ? `${src.name} (${src.pincode})` : 'Main Mines loading',
      vendorPlant: demoDo.vendorPlant || 'Main Depot',
      loadedWeight: demoDo.loadedWeight !== null ? `${demoDo.loadedWeight.toFixed(2)}` : 'Pending',
      date: demoDo.date
    };

    let mappedSubject = subjectTemplate;
    let mappedBody = bodyTemplate;

    Object.keys(dataMap).forEach(key => {
      const value = dataMap[key];
      mappedSubject = mappedSubject.replaceAll(`{${key}}`, value);
      mappedBody = mappedBody.replaceAll(`{${key}}`, value);
    });

    return {
      recipient: transport?.email || 'N/A -- Email not set in Transporters profile',
      subject: mappedSubject,
      body: mappedBody
    };
  }, [dos, pos, transporters, vendors, sources, subjectTemplate, bodyTemplate]);

  return (
    <div id="notification-center-workspace" className="space-y-6 animate-fade-in">
      
      {/* Navigation and Back */}
      {onBack && (
        <div className="flex justify-start">
          <button
            onClick={onBack}
            className="inline-flex items-center space-x-2 px-4 py-2 border border-slate-200 hover:border-black bg-white hover:bg-slate-50 text-xs font-semibold text-slate-800 transition-colors cursor-pointer rounded-lg shadow-xs"
          >
            <span>← Back to Dashboard</span>
          </button>
        </div>
      )}

      {/* Header and Action Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#D1D1CF] pb-4">
        <div>
          <h2 className="text-xl font-bold font-serif italic text-neutral-900 flex items-center gap-2">
            <Mail className="h-5 w-5 text-[#E65100]" />
            <span>Transporter Automated Notification System</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Configure default email dispatch templates and inspect automated mail summary logs of active and transit fleets.
          </p>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => setActiveSubTab('logs')}
            className={`px-4 py-2 text-xs font-semibold border ${
              activeSubTab === 'logs'
                ? 'bg-neutral-800 text-white border-neutral-800'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Notification Logs ({stats.total})
          </button>
          <button
            onClick={() => setActiveSubTab('templates')}
            className={`px-4 py-2 text-xs font-semibold border ${
              activeSubTab === 'templates'
                ? 'bg-neutral-800 text-white border-neutral-800'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Template Configurator
          </button>
        </div>
      </div>

      {activeSubTab === 'logs' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Logs Column */}
          <div className="lg:col-span-2 bg-white border border-[#D1D1CF] p-5 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs uppercase tracking-wider font-bold text-neutral-800">
                Email Shipment Summary Logs
              </h3>
              <div className="flex space-x-4 text-[11px] font-mono">
                <span className="text-slate-500">Sent: <strong className="text-emerald-700">{stats.sent}</strong></span>
                <span className="text-slate-500">Failed: <strong className="text-rose-700">{stats.failed}</strong></span>
              </div>
            </div>

            {notifications.length === 0 ? (
              <div className="py-12 border border-dashed border-[#D1D1CF] bg-neutral-50 rounded-none text-center text-slate-500">
                <Mail className="h-9 w-9 mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-serif italic">No notification summaries generated yet.</p>
                <p className="text-[11px] text-slate-400 mt-1">Issue a new "In Transit" Despatch order to trigger transporter automated emails.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600 divide-y divide-[#F4F4F1]">
                  <thead className="bg-[#F4F4F1] text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-3 py-2">Despatch #</th>
                      <th className="px-3 py-2">Transporter Name</th>
                      <th className="px-3 py-2">Recipient Email</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2 text-right">Sent Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F4F4F1]">
                    {notifications.map((log) => (
                      <tr 
                        key={log.id} 
                        onClick={() => setSelectedLog(log)}
                        className={`hover:bg-neutral-50/80 cursor-pointer transition-colors ${selectedLog?.id === log.id ? 'bg-[#FFF8E1]/60' : ''}`}
                      >
                        <td className="px-3 py-3 font-mono font-bold text-stone-800">{log.doNumber}</td>
                        <td className="px-3 py-3 font-medium truncate max-w-[150px]">{log.transporterName}</td>
                        <td className="px-3 py-3 font-mono max-w-[180px] truncate">{log.recipientEmail || <span className="text-rose-500 font-sans italic text-[10px]">No registered email</span>}</td>
                        <td className="px-3 py-3">
                          {log.status === 'Sent' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-100 font-bold px-1.5 py-0.2 rounded-none">
                              <CheckCircle2 className="h-3 w-3" />
                              Delivered
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] bg-rose-50 text-rose-800 border border-rose-100 font-bold px-1.5 py-0.2 rounded-none">
                              <AlertTriangle className="h-3 w-3" />
                              Failed
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-right text-stone-400 font-mono text-[10px]">{log.sentAt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Email Preview Inspector Panel */}
          <div className="bg-white border border-[#D1D1CF] p-5 space-y-4">
            <h3 className="text-xs uppercase tracking-wider font-bold text-neutral-800">
              Email Delivery Inspector
            </h3>

            {selectedLog ? (
              <div className="space-y-4 border border-[#F4F4F1] p-4 bg-[#F9F8F6]">
                <div className="flex justify-between items-start border-b border-[#D1D1CF] pb-2 text-xs">
                  <div className="space-y-1 font-mono">
                    <div>
                      <span className="text-slate-400">TO: </span>
                      <strong className="text-neutral-800">{selectedLog.recipientEmail || "N/A"}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400">SUBJ: </span>
                      <strong className="text-neutral-800">{selectedLog.subject}</strong>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedLog(null)}
                    className="text-slate-400 hover:text-black p-0.5"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="whitespace-pre-line text-[11px] leading-relaxed text-zinc-700 font-mono max-h-[280px] overflow-y-auto pr-1">
                  {selectedLog.body}
                </div>

                <div className="pt-3 border-t border-[#D1D1CF] flex justify-between items-center text-[10px] font-mono">
                  <span className="text-slate-400">Status: {selectedLog.status}</span>
                  {selectedLog.status === 'Failed' && selectedLog.recipientEmail && (
                    <button
                      onClick={() => {
                        if (onSendTestEmail) {
                          onSendTestEmail(selectedLog.recipientEmail, selectedLog.subject, selectedLog.body);
                          alert('Resending notification triggered...');
                        }
                      }}
                      className="text-[#E65100] font-bold hover:underline"
                    >
                      Retry Delivery ↺
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-64 border border-dashed border-[#D1D1CF] bg-neutral-50/50 flex flex-col items-center justify-center p-6 text-center text-slate-400">
                <MessageSquare className="h-8 w-8 text-slate-300 mb-2" />
                <p className="text-xs font-serif italic">Select any notification record to inspect email template details, recipient lists, and body content maps.</p>
              </div>
            )}
          </div>

        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Editor block */}
          <div className="bg-white border border-[#D1D1CF] p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs uppercase tracking-wider font-bold text-neutral-800 flex items-center gap-1">
                <Settings className="h-4 w-4 text-[#E65100]" />
                <span>Default Notification Template Configurator</span>
              </h3>
              <button
                type="button"
                onClick={handleResetTemplates}
                className="text-[10px] text-slate-400 hover:text-black hover:underline"
              >
                Reset Default
              </button>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Use template brackets containing standard database references (e.g., <code className="bg-stone-100 px-1 py-0.2 font-mono font-bold text-neutral-800 text-[10px]">&#123;doNumber&#125;</code>, <code className="bg-stone-100 px-1 py-0.2 font-mono font-bold text-neutral-800 text-[10px]">&#123;vehicleNumber&#125;</code>, <code className="bg-stone-100 px-1 py-0.2 font-mono font-bold text-neutral-800 text-[10px]">&#123;transporterName&#125;</code>) to map live despatch metadata automatically.
            </p>

            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Subject Template</label>
                <input
                  type="text"
                  value={subjectTemplate}
                  onChange={(e) => setSubjectTemplate(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-[#D1D1CF] rounded-none focus:outline-hidden focus:border-black font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Body Template</label>
                <textarea
                  rows={14}
                  value={bodyTemplate}
                  onChange={(e) => setBodyTemplate(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-[#D1D1CF] rounded-none focus:outline-hidden focus:border-black font-mono resize-none leading-relaxed"
                />
              </div>

              <div className="flex justify-between items-center pt-2">
                <div>
                  {isSavedAlert && (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-1">
                      ✓ Templates updated successfully
                    </span>
                  )}
                </div>
                <button
                  onClick={handleSaveTemplates}
                  className="px-6 py-2 bg-[#E65100] text-white font-serif italic text-xs font-bold transition-all hover:bg-black"
                >
                  Save Active Layout
                </button>
              </div>
            </div>
          </div>

          {/* Real-time Preview Map */}
          <div className="bg-white border border-[#D1D1CF] p-6 space-y-4">
            <h3 className="text-xs uppercase tracking-wider font-bold text-neutral-800">
              Live Mock Recipient Variable Mapper & Sandbox
            </h3>
            <p className="text-[11px] text-slate-500">
              This preview simulates exact parameters when an active bulker truck departs containing fly ash.
            </p>

            {previewData ? (
              <div className="border border-[#F4F4F1] bg-[#F9F8F6] p-4 font-mono text-[11px] space-y-3.5">
                <div className="border-b border-[#D1D1CF] pb-2 space-y-1">
                  <div>
                    <span className="text-slate-400">SUBSCRIBED TO: </span>
                    <strong className="text-neutral-850 font-bold">{previewData.recipient}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">RENDERED SUBJ: </span>
                    <strong className="text-[#E65100] font-bold">{previewData.subject}</strong>
                  </div>
                </div>

                <div className="whitespace-pre-line leading-relaxed text-zinc-700 text-[10px] max-h-[320px] overflow-y-auto pr-1 font-mono">
                  {previewData.body}
                </div>

                {previewData.recipient.includes('@') ? (
                  <div className="pt-3 border-t border-[#D1D1CF] flex justify-between items-center text-[10px]">
                    <span className="text-emerald-700 flex items-center gap-1 font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                      Recipient status ready
                    </span>
                    <button
                      onClick={() => {
                        if (onSendTestEmail) {
                          onSendTestEmail(previewData.recipient, previewData.subject, previewData.body);
                          alert(`Test email summary dispatched successfully to: ${previewData.recipient}`);
                        }
                      }}
                      className="font-serif italic font-bold text-[#E65100] hover:underline"
                    >
                      Send Live Test Email summary →
                    </button>
                  </div>
                ) : (
                  <div className="pt-3 border-t border-[#D1D1CF] p-3 bg-red-50 text-rose-800 border border-red-150 rounded-none text-[10px] leading-relaxed flex items-start gap-2">
                    <Info className="h-4 w-4 shrink-0 mt-0.5 text-rose-500" />
                    <div>
                      <strong>Registered email missing:</strong> Ensure the correlated Transporter has a registered email configured in the "Transporter Master" profiles to transmit active dispatch reports automatically.
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 italic text-xs">
                Requires at least one Despatch Order record to preview sandbox variables.
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
