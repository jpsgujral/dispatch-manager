import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Send, 
  Paperclip, 
  FileText, 
  Image as ImageIcon, 
  Search, 
  Users, 
  Lock, 
  ArrowLeft, 
  X, 
  Download, 
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  User as UserIcon,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../firebase';
import { collection, onSnapshot, addDoc, serverTimestamp, query, doc, deleteDoc } from 'firebase/firestore';
import { AppUser } from '../types';

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderEmail: string;
  receiverId: string; // 'global' or a specific userId
  content: string;
  fileUrl?: string; // base64 representation of PDF or image
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  createdAt: any;
}

interface InteractiveChatProps {
  activeUser: AppUser;
  users: AppUser[];
  onBack?: () => void;
  themeMode?: 'light' | 'dark';
}

export default function InteractiveChat({ activeUser, users, onBack, themeMode = 'light' }: InteractiveChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeRecipient, setActiveRecipient] = useState<AppUser | 'global'>('global');
  const [textInput, setTextInput] = useState('');
  const [searchUserQuery, setSearchUserQuery] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  // Handlers for attachments
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    type: string;
    size: number;
    base64Data: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomScrollRef = useRef<HTMLDivElement>(null);

  // Load real-time messages from firestore
  useEffect(() => {
    const chatColRef = collection(db, 'chats');
    // Using simple unindexed snapshot to pull recent messages and then process in client-side Memory
    // This is 100% resilient and avoids any composite index error requirements on newly generated databases
    const unsubscribe = onSnapshot(chatColRef, (snapshot) => {
      const items: ChatMessage[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        items.push({
          id: doc.id,
          senderId: data.senderId || '',
          senderName: data.senderName || '',
          senderEmail: data.senderEmail || '',
          receiverId: data.receiverId || 'global',
          content: data.content || '',
          fileUrl: data.fileUrl,
          fileName: data.fileName,
          fileType: data.fileType,
          fileSize: data.fileSize,
          createdAt: data.createdAt ? (data.createdAt.seconds ? (data.createdAt.seconds * 1000) : data.createdAt) : Date.now()
        });
      });

      // Sort chronological ascending
      items.sort((a, b) => {
        const tA = typeof a.createdAt === 'number' ? a.createdAt : new Date(a.createdAt).getTime();
        const tB = typeof b.createdAt === 'number' ? b.createdAt : new Date(b.createdAt).getTime();
        return tA - tB;
      });

      setMessages(items);
    }, (err) => {
      console.error("Firestore real-time subscription error inside Chat Panel:", err);
    });

    return () => unsubscribe();
  }, []);

  // Auto scroll to bottom whenever messages list or target recipient changes
  useEffect(() => {
    setTimeout(() => {
      bottomScrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, [messages, activeRecipient]);

  // Filter messages based on active recipient
  const filteredMessages = messages.filter(msg => {
    if (activeRecipient === 'global') {
      return msg.receiverId === 'global';
    } else {
      // Direct message: Sent by activeUser to recipient, or sent by recipient to activeUser
      const recipientId = activeRecipient.id;
      return (msg.receiverId === recipientId && msg.senderId === activeUser.id) ||
             (msg.receiverId === activeUser.id && msg.senderId === recipientId);
    }
  });

  // Handle PDF/Image upload conversion to Base64
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 800000) {
      alert("Attachment too large. Please select a file lower than 800KB to fit safely dans the database ledger limit.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedFile({
        name: file.name,
        type: file.type,
        size: file.size,
        base64Data: reader.result as string
      });
    };
    reader.readAsDataURL(file);
    
    // Clear target so it triggers on re-upload
    if (e.target) {
      e.target.value = '';
    }
  };

  // Dispatch message to Firestore
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() && !selectedFile) return;

    setIsSending(true);
    try {
      const payload: any = {
        senderId: activeUser.id,
        senderName: activeUser.name,
        senderEmail: activeUser.email,
        receiverId: activeRecipient === 'global' ? 'global' : activeRecipient.id,
        content: textInput.trim(),
        createdAt: serverTimestamp()
      };

      if (selectedFile) {
        payload.fileUrl = selectedFile.base64Data;
        payload.fileName = selectedFile.name;
        payload.fileType = selectedFile.type;
        payload.fileSize = selectedFile.size;
      }

      await addDoc(collection(db, 'chats'), payload);
      
      setTextInput('');
      setSelectedFile(null);
    } catch (err) {
      console.error("Failed to append chat record to ledger:", err);
      alert("Relational Sync error. Message could not be processed.");
    } finally {
      setIsSending(false);
    }
  };

  // Helper to delete message
  const handleDeleteMessage = async (msgId: string) => {
    if (window.confirm("Are you sure you want to delete this message?")) {
      try {
        await deleteDoc(doc(db, 'chats', msgId));
      } catch (err) {
        console.error("Deletion error:", err);
      }
    }
  };

  // Clear file attachment
  const handleClearSelectedFile = () => {
    setSelectedFile(null);
  };

  // Filter users inside contact drawer
  const otherUsers = users.filter(u => u.id !== activeUser.id);
  const filteredUsers = otherUsers.filter(u => 
    u.name.toLowerCase().includes(searchUserQuery.toLowerCase()) || 
    u.email.toLowerCase().includes(searchUserQuery.toLowerCase()) ||
    u.role.toLowerCase().includes(searchUserQuery.toLowerCase())
  );

  // Helper to format bytes
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Open PDF Base64 in separate printable tab smoothly
  const handleOpenPdf = (base64String: string, fileName: string) => {
    try {
      const newTab = window.open();
      if (!newTab) {
        alert("Pop-up blocked. Please enable pop-ups to open the PDF attachment.");
        return;
      }
      newTab.document.write(
        `<title>${fileName}</title>` +
        `<body style="margin:0; background: #333; height: 100vh; overflow: hidden; display: flex; flex-direction: column;">` +
        `<div style="padding: 10px; background: #222; color: #fff; font-family: sans-serif; display: flex; justify-content: space-between; align-items: center;">` +
        `<span style="font-weight: bold; font-size: 14px;">${fileName}</span>` +
        `<a href="${base64String}" download="${fileName}" style="color: #FF9800; text-decoration: none; font-size: 14px; font-weight: bold; border: 1px solid #FF9800; padding: 4px 12px; border-radius: 4px;">Download PDF</a>` +
        `</div>` +
        `<iframe src="${base64String}" style="width:100%; height:100%; border:none; flex-grow:1;"></iframe>` +
        `</body>`
      );
    } catch (e) {
      console.error("Could not render base64 iframe:", e);
      // Fallback direct download
      const link = document.createElement('a');
      link.href = base64String;
      link.download = fileName;
      link.click();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      {/* Back button and navigation header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#FFFFFF] dark:bg-[#15161B] border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 text-xs font-serif italic hover:bg-stone-50 transition-all cursor-pointer shadow-xs"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Return to Dashboard</span>
          </button>
          <div className="hidden sm:flex items-center space-x-1 text-slate-400 font-mono text-[9px] uppercase">
            <span>Terminal</span>
            <ChevronRight className="h-2.5 w-2.5" />
            <span className="text-stone-700 dark:text-stone-300 font-bold">Interactive Messaging Hub</span>
          </div>
        </div>
        
        {/* Connection/Identity status label */}
        <div className="flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-[9px] font-mono uppercase text-emerald-600 dark:text-emerald-400 tracking-wider">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Sync Live Terminal Server</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 border-2 border-black dark:border-zinc-800 bg-[#FFFFFF] dark:bg-[#0B0C10] shadow-md min-h-[580px] h-[580px] overflow-hidden">
        
        {/* Left Side: Users list / Contacts directory (4 cols) */}
        <div className="md:col-span-4 border-r-2 border-black dark:border-zinc-800 flex flex-col h-full bg-[#FAFAF9] dark:bg-[#0E1014]">
          <div className="p-4 border-b border-stone-200 dark:border-zinc-800">
            <h3 className="font-serif font-black italic text-stone-900 dark:text-white text-sm mb-3">
              TSG Communications Desk
            </h3>
            
            {/* User Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-stone-400" />
              <input
                type="text"
                value={searchUserQuery}
                onChange={(e) => setSearchUserQuery(e.target.value)}
                placeholder="Search staff & agents..."
                className="w-full text-xs pl-8.5 pr-3 py-2 border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#15161B] text-stone-900 dark:text-white focus:outline-hidden rounded-none font-mono font-medium"
              />
            </div>
          </div>

          {/* Quick Active channels lists */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            <span className="block text-[8px] font-bold text-stone-400 uppercase tracking-widest font-mono px-2 mb-1.5 mt-2">
              Corporate Channels
            </span>
            
            {/* Global Broadcast channel */}
            <button
              onClick={() => setActiveRecipient('global')}
              className={`w-full flex items-center space-x-2.5 px-3 py-2.5 text-left transition-all ${
                activeRecipient === 'global'
                  ? 'bg-[#E65100] text-white border-l-4 border-black dark:border-zinc-300'
                  : 'text-stone-700 dark:text-stone-350 hover:bg-stone-100 dark:hover:bg-zinc-900'
              }`}
            >
              <Users className="h-4.5 w-4.5 shrink-0 inline text-inherit" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold font-sans truncate m-0 leading-tight">
                  All Terminal Staff
                </p>
                <p className="text-[10px] opacity-75 font-serif italic truncate m-0 leading-none mt-0.5">
                  Public bulletin broadcast channel
                </p>
              </div>
            </button>

            <span className="block text-[8px] font-bold text-stone-400 uppercase tracking-widest font-mono px-2 mb-1.5 mt-4">
              Direct Peer Messages
            </span>

            {filteredUsers.length === 0 ? (
              <p className="text-[10px] text-stone-400 italic px-2 py-4">No staff members found matching query.</p>
            ) : (
              filteredUsers.map((u) => {
                const isActive = activeRecipient !== 'global' && activeRecipient.id === u.id;
                const statusColor = u.status === 'Active' ? 'bg-emerald-500' : 'bg-stone-400';
                
                return (
                  <button
                    key={u.id}
                    onClick={() => setActiveRecipient(u)}
                    className={`w-full flex items-center space-x-2.5 px-3 py-2 text-left transition-all relative ${
                      isActive
                        ? 'bg-[#031E51] text-white border-l-4 border-black dark:border-amber-400'
                        : 'text-stone-700 dark:text-stone-350 hover:bg-stone-100 dark:hover:bg-zinc-900'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <div className="h-8 w-8 rounded-full bg-stone-200 dark:bg-stone-800 flex items-center justify-center text-stone-600 dark:text-stone-400 text-xs font-bold font-mono">
                        {u.name.substring(0, 2).toUpperCase()}
                      </div>
                      <span className={`absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full border border-white dark:border-[#0E1014] ${statusColor}`} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold font-sans truncate m-0 leading-tight">
                          {u.name}
                        </p>
                        <span className={`text-[8px] font-mono px-1 border uppercase leading-tight ${u.role === 'Admin' ? 'border-red-500/30 text-red-500 bg-red-500/5' : 'border-zinc-500/35 text-zinc-500'}`}>
                          {u.role}
                        </span>
                      </div>
                      <p className="text-[10px] opacity-75 font-mono truncate m-0 leading-none mt-0.5">
                        {u.email}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Current profile block footer */}
          <div className="p-3 bg-stone-100 dark:bg-[#13151A] border-t border-stone-200 dark:border-zinc-800 flex items-center space-x-2.5">
            <div className="h-7 w-7 rounded-full bg-[#E65100]/20 flex items-center justify-center text-[#E65100] font-mono text-xs font-black shrink-0">
              {activeUser.name.substring(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold text-stone-800 dark:text-stone-250 truncate leading-tight leading-none m-0">
                Logged in as: {activeUser.name}
              </p>
              <p className="text-[9px] text-[#E65100] font-mono font-bold uppercase tracking-wider m-0 leading-none mt-0.5">
                {activeUser.role} Clearance
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Logged Messages & controls (8 cols) */}
        <div className="md:col-span-8 flex flex-col h-full bg-white dark:bg-[#0B0C10]">
          
          {/* Active Conversation Header information */}
          <div className="px-5 py-3 border-b border-stone-200 dark:border-zinc-800 bg-[#FAFAF9] dark:bg-[#0E1014] flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="h-7 w-7 rounded-full bg-stone-200 dark:bg-stone-800 flex items-center justify-center text-stone-600 dark:text-stone-400">
                {activeRecipient === 'global' ? <Users className="h-4 w-4" /> : <UserIcon className="h-4 w-4" />}
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold font-sans text-stone-900 dark:text-white truncate m-0 leading-none">
                  {activeRecipient === 'global' ? 'All Team Public Channel' : activeRecipient.name}
                </h4>
                <p className="text-[10px] text-stone-400 font-serif italic truncate m-0 leading-tight mt-1">
                  {activeRecipient === 'global' 
                    ? 'Broadcast updates, attachments and logistics news to everybody.' 
                    : `Encrypted direct terminal connection with ${activeRecipient.name} (${activeRecipient.role})`
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-1 font-mono text-[9px] uppercase border px-2 py-0.5 border-stone-200 dark:border-zinc-800 text-stone-450">
              <Lock className="h-3 w-3 text-stone-400 shrink-0" />
              <span>TLS Secured</span>
            </div>
          </div>

          {/* Conversation Core view container */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#F5F5F3] dark:bg-[#0B0C10] relative">
            <AnimatePresence initial={false}>
              {filteredMessages.length === 0 ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-stone-400">
                  <MessageSquare className="h-8 w-8 text-stone-300 dark:text-stone-700 stroke-[1.5] mb-2" />
                  <p className="text-xs font-serif italic">No transmission packets loaded in this node.</p>
                  <p className="text-[10px] font-mono uppercase mt-1">Type below to seed the transaction.</p>
                </div>
              ) : (
                filteredMessages.map((msg, index) => {
                  const isOwnMessage = msg.senderId === activeUser.id;
                  const timeString = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}
                    >
                      {/* Subtitle meta element */}
                      <div className="flex items-center space-x-1.5 text-[9px] text-stone-400 font-mono mb-1">
                        <span className="font-bold">{msg.senderName}</span>
                        <span>•</span>
                        <span>{timeString}</span>
                        {isOwnMessage && (
                          <>
                            <span>•</span>
                            <button
                              onClick={() => handleDeleteMessage(msg.id)}
                              className="text-stone-400 hover:text-red-500 transition-colors"
                              title="Delete message"
                            >
                              <Trash2 className="h-3 w-3 inline" />
                            </button>
                          </>
                        )}
                      </div>

                      {/* Bubble frame */}
                      <div
                        className={`max-w-[85%] px-4 py-2.5 shadow-xs border text-xs leading-relaxed ${
                          isOwnMessage
                            ? 'bg-[#031E51] text-white border-[#031E51] rounded-tl-xl rounded-b-xl'
                            : 'bg-white dark:bg-[#15161B] text-stone-950 dark:text-stone-200 border-stone-200 dark:border-stone-800 rounded-tr-xl rounded-b-xl'
                        }`}
                      >
                        {/* Action Text content */}
                        {msg.content && <p className="whitespace-pre-wrap break-all select-text m-0">{msg.content}</p>}

                        {/* File Attachment Presentation card */}
                        {msg.fileUrl && (
                          <div className={`mt-2 p-2 border flex flex-col space-y-1.5 ${
                            isOwnMessage 
                              ? 'bg-black/10 border-white/10 text-white' 
                              : 'bg-stone-50 dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-900 dark:text-slate-100'
                          }`}>
                            <div className="flex items-start space-x-2">
                              {msg.fileType?.includes('pdf') || msg.fileName?.toLowerCase().endsWith('.pdf') ? (
                                <FileText className="h-6 w-6 text-red-500 shrink-0 mt-0.5" />
                              ) : msg.fileType?.startsWith('image/') ? (
                                <ImageIcon className="h-6 w-6 text-[#E65100] shrink-0 mt-0.5" />
                              ) : (
                                <FileText className="h-6 w-6 text-neutral-500 shrink-0 mt-0.5" />
                              )}
                              
                              <div className="min-w-0 flex-1">
                                <p className="text-[10px] font-bold font-sans truncate m-0">
                                  {msg.fileName}
                                </p>
                                <p className="text-[9px] font-mono opacity-75 m-0 leading-none mt-0.5">
                                  {msg.fileSize ? formatBytes(msg.fileSize) : 'Contract Document'}
                                </p>
                              </div>
                            </div>

                            {/* Render image preview directly inline if it's an image */}
                            {msg.fileType?.startsWith('image/') && (
                              <div className="relative border-2 border-black/15 overflow-hidden max-h-48 mt-1.5">
                                <img src={msg.fileUrl} alt={msg.fileName} referrerPolicy="no-referrer" className="object-cover w-full h-auto" />
                              </div>
                            )}

                            {/* Actions bar for file */}
                            <div className="pt-2 border-t border-black/10 dark:border-white/10 flex items-center justify-between">
                              <span className="text-[8px] font-mono uppercase tracking-widest opacity-60">
                                {msg.fileType?.includes('pdf') ? 'PDF Document' : 'Attachment Asset'}
                              </span>
                              
                              <div className="flex items-center space-x-2">
                                {msg.fileType?.includes('pdf') && (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenPdf(msg.fileUrl!, msg.fileName || 'document.pdf')}
                                    className="flex items-center space-x-1 text-[9px] font-bold text-amber-500 dark:text-amber-400 hover:underline cursor-pointer"
                                  >
                                    <ExternalLink className="h-2.5 w-2.5" />
                                    <span>View PDF</span>
                                  </button>
                                )}
                                <a
                                  href={msg.fileUrl}
                                  download={msg.fileName || 'attachment'}
                                  className="flex items-center space-x-1 text-[9px] font-bold text-emerald-500 dark:text-emerald-400 hover:underline cursor-pointer"
                                >
                                  <Download className="h-2.5 w-2.5" />
                                  <span>Download</span>
                                </a>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
            <div ref={bottomScrollRef} />
          </div>

          {/* Form control bar with attachment view */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-stone-250 dark:border-zinc-800 bg-[#FAFAF9] dark:bg-[#0E1014] shrink-0">
            {/* Render selected attachment preview if present */}
            {selectedFile && (
              <div className="mb-3 px-3.5 py-2.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-500/20 text-[#1A1A1A] flex justify-between items-center text-xs">
                <div className="flex items-center space-x-2">
                  {selectedFile.type.includes('pdf') ? (
                    <FileText className="h-4.5 w-4.5 text-red-500" />
                  ) : (
                    <ImageIcon className="h-4.5 w-4.5 text-[#E65100]" />
                  )}
                  <span className="font-bold text-stone-900 dark:text-stone-100 truncate max-w-xs">{selectedFile.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono">({formatBytes(selectedFile.size)})</span>
                </div>
                <button
                  type="button"
                  onClick={handleClearSelectedFile}
                  className="text-stone-400 hover:text-red-500 p-0.5 bg-stone-200/40 hover:bg-stone-200 cursor-pointer"
                  title="Remove attachment file"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Input Controls row */}
            <div className="flex items-center space-x-2">
              {/* File input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf,image/*"
                className="hidden"
              />
              
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="h-9 w-9 flex items-center justify-center border border-stone-250 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-zinc-900 bg-white dark:bg-[#15161B] text-stone-500 dark:text-stone-300 cursor-pointer transition-colors active:scale-95"
                title="Attach dispatch PDF or Image file (<800KB)"
              >
                <Paperclip className="h-4 w-4" />
              </button>

              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder={selectedFile ? "Type standard message descriptor or press Send..." : "Enter workspace transmission packet..."}
                className="flex-1 text-xs px-3.5 h-9 border border-stone-250 dark:border-stone-700 bg-white dark:bg-[#15161B] text-stone-900 dark:text-white rounded-none focus:outline-hidden"
              />

              <button
                type="submit"
                disabled={isSending || (!textInput.trim() && !selectedFile)}
                className="h-9 px-4.5 bg-[#E65100] hover:bg-black text-white text-xs font-bold font-mono tracking-widest uppercase transition-colors shrink-0 flex items-center space-x-1.5 cursor-pointer disabled:opacity-40 disabled:hover:bg-[#E65100] active:scale-95"
              >
                <span>Send</span>
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </form>

        </div>

      </div>
    </div>
  );
}
