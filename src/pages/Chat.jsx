import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import { 
    FaPaperPlane, FaCamera, FaLock, FaSyncAlt, FaTimes, 
    FaPlus, FaHistory, FaUnlock, FaLightbulb, FaQuestion, 
    FaBookOpen, FaGraduationCap, FaUserEdit, FaPalette,
    FaMagic, FaSignOutAlt, FaChevronDown
} from "react-icons/fa";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { doc, getDoc, setDoc, collection, query, getDocs, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

import 'katex/dist/katex.min.css';

const API_BASE = (process.env.REACT_APP_API_URL || "https://dhruva-backend-production.up.railway.app").replace(/\/$/, "");

// --- 8 PREMIUM MODES (THEMES) ---
const THEME_CONFIG = {
    dark: { name: "Deep Dark", bg: "bg-[#050505] text-white", bubble: "bg-white/[0.03] border-white/10 backdrop-blur-xl", user: "bg-indigo-600 text-white", input: "bg-[#111] border-white/10 text-white", btn: "bg-indigo-600 hover:bg-indigo-500", accent: "text-indigo-500" },
    light: { name: "Pure Light", bg: "bg-[#F8FAFF] text-slate-900", bubble: "bg-white border-slate-200 shadow-xl shadow-slate-200/50", user: "bg-indigo-600 text-white", input: "bg-white border-indigo-100 text-slate-900", btn: "bg-indigo-600 hover:bg-indigo-700", accent: "text-indigo-600" },
    cosmic: { name: "Cosmic", bg: "bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] text-white", bubble: "bg-white/10 border-white/20 backdrop-blur-md shadow-2xl", user: "bg-gradient-to-r from-fuchsia-600 to-purple-600", input: "bg-white/5 border-white/10 text-white", btn: "bg-purple-500", accent: "text-fuchsia-400" },
    emerald: { name: "Emerald", bg: "bg-[#020d08] text-emerald-50", bubble: "bg-emerald-900/20 border-emerald-500/20 shadow-2xl", user: "bg-emerald-600", input: "bg-[#041a10] border-emerald-500/30 text-emerald-50", btn: "bg-emerald-500", accent: "text-emerald-400" },
    sunset: { name: "Sunset", bg: "bg-gradient-to-b from-[#1a0a05] to-[#000] text-orange-50", bubble: "bg-orange-900/10 border-orange-500/20 shadow-2xl", user: "bg-gradient-to-r from-orange-600 to-red-600", input: "bg-white/5 border-orange-500/20 text-orange-50", btn: "bg-orange-600", accent: "text-orange-400" },
    cyber: { name: "Cyber", bg: "bg-black text-[#00ff9f]", bubble: "bg-[#0a0a0a] border-[#00ff9f]/30 shadow-[0_0_15px_rgba(0,255,159,0.1)]", user: "bg-[#00ff9f] text-black font-black", input: "bg-[#0a0a0a] border-[#00ff9f]/50 text-[#00ff9f]", btn: "bg-[#00ff9f] !text-black", accent: "text-[#00ff9f]" },
    ocean: { name: "Ocean", bg: "bg-gradient-to-tr from-[#000428] to-[#004e92] text-blue-50", bubble: "bg-white/5 border-blue-400/20 shadow-2xl", user: "bg-blue-500", input: "bg-white/5 border-blue-400/20 text-white", btn: "bg-blue-400", accent: "text-blue-300" },
    royal: { name: "Royal", bg: "bg-[#0f172a] text-slate-100", bubble: "bg-slate-800/50 border-yellow-500/20 shadow-2xl", user: "bg-gradient-to-r from-yellow-600 to-amber-700", input: "bg-slate-900 border-yellow-500/10 text-white", btn: "bg-amber-600", accent: "text-yellow-500" }
};

export default function Chat() {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    
    // UI State
    const [currentThemeKey, setCurrentThemeKey] = useState("dark");
    const [showThemeDrop, setShowThemeDrop] = useState(false);
    const [showSidebar, setShowSidebar] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(false);
    
    // Chat State
    const [messages, setMessages] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [currentSessionId, setCurrentSessionId] = useState(Date.now().toString());
    const [input, setInput] = useState("");
    const [subjectInput, setSubjectInput] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [isLocked, setIsLocked] = useState(false);

    const theme = THEME_CONFIG[currentThemeKey];
    const messagesEndRef = useRef(null);
    const dropRef = useRef(null);

    // Initial Load: History & Onboarding Check
    useEffect(() => {
        if (!currentUser) return;
        const init = async () => {
            const userDoc = await getDoc(doc(db, "users", currentUser.uid));
            if (!userDoc.exists() || !userDoc.data().board) setShowOnboarding(true);
            
            const q = query(collection(db, `users/${currentUser.uid}/sessions`), orderBy("lastUpdate", "desc"));
            const snap = await getDocs(q);
            setSessions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        };
        init();
    }, [currentUser]);

    // Handle Clicks Outside Dropdown
    useEffect(() => {
        const closeDrop = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setShowThemeDrop(false); };
        document.addEventListener("mousedown", closeDrop);
        return () => document.removeEventListener("mousedown", closeDrop);
    }, []);

    const sendMessage = async (overrideInput = null) => {
        const finalInput = overrideInput || input;
        if (!finalInput.trim() || isSending) return;
        
        setIsSending(true);
        const userMsg = { role: "user", content: finalInput };
        const updatedMessages = [...messages, userMsg];
        setMessages(updatedMessages);
        setInput("");

        try {
            const res = await axios.post(`${API_BASE}/chat`, { 
                userId: currentUser.uid, 
                message: finalInput, 
                subject: subjectInput || "General" 
            });
            const finalMsgs = [...updatedMessages, { role: "ai", content: res.data.reply }];
            setMessages(finalMsgs);
            
            // Sync to History
            await setDoc(doc(db, `users/${currentUser.uid}/sessions`, currentSessionId), {
                messages: finalMsgs,
                lastUpdate: Date.now(),
                title: finalInput.substring(0, 30) + "..."
            }, { merge: true });
            
        } catch (e) { toast.error("Server connection failed"); }
        setIsSending(false);
    };

    return (
        <div className={`flex h-screen w-full overflow-hidden transition-all duration-700 ${theme.bg}`}>
            <ToastContainer position="top-center" theme={currentThemeKey === 'light' ? 'light' : 'dark'} />

            {/* CENTRERED ONBOARDING MODAL */}
            <AnimatePresence>
                {showOnboarding && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={`max-w-sm w-full p-8 rounded-[3rem] border shadow-2xl text-center ${theme.bubble}`}>
                            <div className={`w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center text-white ${theme.btn}`}><FaUserEdit size={24} /></div>
                            <h2 className="text-xl font-black mb-2">Setup Profile</h2>
                            <p className="text-xs opacity-60 mb-8">We need your class/board to provide syllabus-accurate answers.</p>
                            <button onClick={() => navigate("/profile")} className={`w-full py-4 rounded-2xl font-black uppercase text-xs text-white ${theme.btn}`}>Go to Profile</button>
                            <button onClick={() => setShowOnboarding(false)} className="mt-4 text-[10px] font-black opacity-30 uppercase">Later</button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* OLD UX: SIDEBAR (HISTORY) */}
            <AnimatePresence>
                {showSidebar && (
                    <motion.div initial={{ x: -320 }} animate={{ x: 0 }} exit={{ x: -320 }} className={`fixed lg:relative z-[600] w-80 h-full p-6 shadow-2xl flex flex-col bg-black/20 backdrop-blur-2xl border-r border-white/5`}>
                        <div className="flex justify-between items-center mb-8"><span className="font-black text-[10px] opacity-40 uppercase tracking-widest">History</span><button onClick={() => setShowSidebar(false)}><FaTimes /></button></div>
                        <button onClick={() => { setMessages([]); setCurrentSessionId(Date.now().toString()); setShowSidebar(false); }} className={`w-full py-4 rounded-2xl flex items-center justify-center gap-2 text-xs font-black text-white mb-6 ${theme.btn}`}><FaPlus /> NEW SESSION</button>
                        <div className="flex-1 overflow-y-auto space-y-2 no-scrollbar">
                            {sessions.map(s => (
                                <button key={s.id} onClick={() => { setMessages(s.messages); setCurrentSessionId(s.id); setShowSidebar(false); }} className="w-full p-4 rounded-xl text-left text-[10px] font-bold border border-white/5 hover:bg-white/5 truncate">{s.title || "Study Session"}</button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex-1 flex flex-col min-w-0 relative">
                {/* NAVBAR WITH THEME DROPDOWN NEXT TO LOGOUT */}
                <header className="h-20 flex items-center justify-between px-6 border-b border-white/5 backdrop-blur-md z-[500]">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setShowSidebar(true)} className={`p-3 rounded-xl border ${theme.bubble}`}><FaHistory/></button>
                        <span className="font-black text-xl tracking-tighter">DHRUVA</span>
                    </div>

                    <div className="flex items-center gap-3" ref={dropRef}>
                        {/* Theme Dropdown */}
                        <div className="relative">
                            <button onClick={() => setShowThemeDrop(!showThemeDrop)} className={`flex items-center gap-2 px-4 py-2.5 rounded-full border border-white/10 text-[10px] font-black uppercase tracking-widest transition-all ${theme.bubble}`}>
                                <FaPalette className={theme.accent} /> <span className="hidden sm:inline">{theme.name}</span> <FaChevronDown size={8} />
                            </button>
                            <AnimatePresence>
                                {showThemeDrop && (
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute right-0 mt-3 w-48 p-2 rounded-2xl bg-[#0a0a0a] border border-white/10 shadow-2xl">
                                        {Object.keys(THEME_CONFIG).map(key => (
                                            <button key={key} onClick={() => { setCurrentThemeKey(key); setShowThemeDrop(false); }} className="w-full text-left px-4 py-3 rounded-xl text-[10px] font-bold text-white hover:bg-white/10 transition-colors flex items-center justify-between">
                                                {THEME_CONFIG[key].name}
                                                {currentThemeKey === key && <div className={`w-1.5 h-1.5 rounded-full ${theme.btn}`} />}
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <button onClick={logout} className="p-3 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-600 hover:text-white transition-all"><FaSignOutAlt/></button>
                    </div>
                </header>

                {/* SUBJECT LOCK (Old UX Style) */}
                <div className="w-full max-w-4xl mx-auto px-4 mt-4">
                    <div className={`flex items-center gap-2 p-2 rounded-2xl border ${theme.bubble}`}>
                        <div className="flex-1 px-4"><label className="text-[7px] font-black opacity-30 block">SYLLABUS FOCUS</label><input disabled={isLocked} value={subjectInput} onChange={e => setSubjectInput(e.target.value)} placeholder="Subject (e.g. Physics)" className="bg-transparent text-xs font-bold outline-none w-full" /></div>
                        <button onClick={() => setIsLocked(!isLocked)} className={`p-3 rounded-xl transition-all ${isLocked ? 'bg-emerald-500 text-white' : 'bg-white/10'}`}>{isLocked ? <FaLock size={10}/> : <FaUnlock size={10}/>}</button>
                    </div>
                </div>

                {/* MAIN CHAT AREA */}
                <div className="flex-1 overflow-y-auto px-4 py-8 no-scrollbar">
                    <div className="max-w-3xl mx-auto space-y-6 pb-20">
                        {messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
                                <FaMagic className={`text-4xl mb-6 animate-pulse ${theme.accent}`} />
                                <h1 className="text-3xl font-black mb-10">Start Learning</h1>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                                    {[
                                        { t: "Explain Photosynthesis", s: "Biology", i: <FaLightbulb/> },
                                        { t: "Trigonometry Laws", s: "Maths", i: <FaGraduationCap/> }
                                    ].map((c, i) => (
                                        <button key={i} onClick={() => { setSubjectInput(c.s); sendMessage(c.t); }} className={`p-6 rounded-[2rem] border text-left flex items-center gap-4 transition-all hover:scale-[1.02] ${theme.bubble}`}>
                                            <div className={`p-3 rounded-xl text-white ${theme.btn}`}>{c.i}</div>
                                            <div className="flex flex-col"><span className="text-[9px] font-black uppercase opacity-30">{c.s}</span><span className="text-sm font-bold">{c.t}</span></div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            messages.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                                    <div className={`max-w-[85%] p-6 rounded-[2.5rem] shadow-xl ${msg.role === "user" ? `${theme.user} rounded-tr-none` : `${theme.bubble} rounded-tl-none`}`}>
                                        <div className="prose prose-sm dark:prose-invert max-w-none">
                                            <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{msg.content}</ReactMarkdown>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                {/* BOTTOM INPUT BAR */}
                <div className="p-4 md:p-10 bg-gradient-to-t from-black/10 to-transparent">
                    <div className="max-w-3xl mx-auto">
                        <div className={`flex items-center p-2 rounded-[2.5rem] border shadow-2xl transition-all duration-500 ${theme.input}`}>
                            <input value={input} onChange={e => setInput(e.target.value)} placeholder="Type your question..." className="flex-1 bg-transparent px-6 py-4 outline-none font-bold text-sm" onKeyDown={e => e.key === "Enter" && sendMessage()} />
                            <div className="flex items-center gap-2 pr-2">
                                <button className="hidden md:flex p-4 rounded-full opacity-30 hover:opacity-100 transition-all"><FaCamera/></button>
                                <button onClick={() => sendMessage()} disabled={isSending} className={`p-5 rounded-full text-white shadow-lg active:scale-90 transition-all ${theme.btn}`}>
                                    {isSending ? <FaSyncAlt className="animate-spin" /> : <FaPaperPlane />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
