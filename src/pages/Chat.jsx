import React, { useEffect, useState, useRef } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import { 
    FaPaperPlane, FaCamera, FaLock, FaSyncAlt, FaTimes, 
    FaImage, FaPlus, FaHistory, FaUnlock, FaYoutube, 
    FaClock, FaLightbulb, FaQuestion, 
    FaBookOpen, FaGraduationCap, FaMicrophone, FaArrowRight, FaSparkles, FaUserEdit, FaPalette
} from "react-icons/fa";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { doc, getDoc, setDoc, collection, query, getDocs, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import imageCompression from "browser-image-compression";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

import 'katex/dist/katex.min.css';

const API_BASE = (process.env.REACT_APP_API_URL || "https://dhruva-backend-production.up.railway.app").replace(/\/$/, "");

// --- 8 ELITE THEMES ---
const THEME_CONFIG = {
    dark: {
        name: "Deep Dark",
        bg: "bg-[#050505] text-white",
        bubble: "bg-white/[0.03] border-white/10 backdrop-blur-xl",
        user: "bg-indigo-600 text-white",
        input: "bg-[#111] border-white/10 text-white",
        sidebar: "bg-[#0A0A0A] border-white/5",
        btn: "bg-indigo-600 hover:bg-indigo-500",
        accent: "text-indigo-500"
    },
    light: {
        name: "Pure Light",
        bg: "bg-[#F8FAFF] text-slate-900",
        bubble: "bg-white border-slate-200 shadow-xl shadow-slate-200/50",
        user: "bg-indigo-600 text-white",
        input: "bg-white border-indigo-100 text-slate-900",
        sidebar: "bg-white border-slate-100",
        btn: "bg-indigo-600 hover:bg-indigo-700",
        accent: "text-indigo-600"
    },
    cosmic: {
        name: "Cosmic Gradient",
        bg: "bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] text-white",
        bubble: "bg-white/10 border-white/20 backdrop-blur-md shadow-2xl",
        user: "bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white",
        input: "bg-white/5 border-white/10 text-white",
        sidebar: "bg-black/30 border-white/5",
        btn: "bg-purple-500 hover:bg-purple-400",
        accent: "text-fuchsia-400"
    },
    emerald: {
        name: "Emerald Forest",
        bg: "bg-[#020d08] text-emerald-50",
        bubble: "bg-emerald-900/20 border-emerald-500/20 shadow-2xl",
        user: "bg-emerald-600 text-white",
        input: "bg-[#041a10] border-emerald-500/30 text-emerald-50",
        sidebar: "bg-[#010a06] border-emerald-500/10",
        btn: "bg-emerald-500 hover:bg-emerald-400",
        accent: "text-emerald-400"
    },
    sunset: {
        name: "Sunset Vibes",
        bg: "bg-gradient-to-b from-[#1a0a05] to-[#000] text-orange-50",
        bubble: "bg-orange-900/10 border-orange-500/20 shadow-2xl",
        user: "bg-gradient-to-r from-orange-600 to-red-600 text-white",
        input: "bg-white/5 border-orange-500/20 text-orange-50",
        sidebar: "bg-[#110602] border-orange-500/10",
        btn: "bg-orange-600 hover:bg-orange-500",
        accent: "text-orange-400"
    },
    cyber: {
        name: "Cyber Neon",
        bg: "bg-black text-[#00ff9f]",
        bubble: "bg-[#0a0a0a] border-[#00ff9f]/30 shadow-[0_0_15px_rgba(0,255,159,0.1)]",
        user: "bg-[#00ff9f] text-black font-black",
        input: "bg-[#0a0a0a] border-[#00ff9f]/50 text-[#00ff9f]",
        sidebar: "bg-black border-[#00ff9f]/10",
        btn: "bg-[#00ff9f] !text-black",
        accent: "text-[#00ff9f]"
    },
    ocean: {
        name: "Deep Ocean",
        bg: "bg-gradient-to-tr from-[#000428] to-[#004e92] text-blue-50",
        bubble: "bg-white/5 border-blue-400/20 shadow-2xl",
        user: "bg-blue-500 text-white shadow-lg shadow-blue-500/30",
        input: "bg-white/5 border-blue-400/20 text-white",
        sidebar: "bg-black/20 border-white/5",
        btn: "bg-blue-400 hover:bg-blue-300",
        accent: "text-blue-300"
    },
    royal: {
        name: "Royal Gold",
        bg: "bg-[#0f172a] text-slate-100",
        bubble: "bg-slate-800/50 border-yellow-500/20 shadow-2xl",
        user: "bg-gradient-to-r from-yellow-600 to-amber-700 text-white font-bold",
        input: "bg-slate-900 border-yellow-500/10 text-white",
        sidebar: "bg-[#020617] border-white/5",
        btn: "bg-amber-600 hover:bg-amber-500",
        accent: "text-yellow-500"
    }
};

// --- MAIN CHAT MODULE ---

export default function Chat() {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    
    // States
    const [currentThemeKey, setCurrentThemeKey] = useState("dark");
    const [messages, setMessages] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [currentSessionId, setCurrentSessionId] = useState(Date.now().toString());
    const [input, setInput] = useState("");
    const [subjectInput, setSubjectInput] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [showSidebar, setShowSidebar] = useState(false);
    const [isLocked, setIsLocked] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(false);

    const chatContainerRef = useRef(null);
    const messagesEndRef = useRef(null);
    const theme = THEME_CONFIG[currentThemeKey];

    // Initialize User Data
    useEffect(() => {
        if (!currentUser) return;
        const checkUser = async () => {
            const userDoc = await getDoc(doc(db, "users", currentUser.uid));
            if (!userDoc.exists() || !userDoc.data().board) {
                setShowOnboarding(true);
            }
            fetchSessions();
        };
        checkUser();
    }, [currentUser]);

    const fetchSessions = async () => {
        const q = query(collection(db, `users/${currentUser.uid}/sessions`), orderBy("lastUpdate", "desc"));
        const snap = await getDocs(q);
        setSessions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };

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
            const aiMsg = { role: "ai", content: res.data.reply };
            const finalMsgs = [...updatedMessages, aiMsg];
            setMessages(finalMsgs);
            
            // Sync to Firestore
            await setDoc(doc(db, `users/${currentUser.uid}/sessions`, currentSessionId), {
                messages: finalMsgs,
                lastUpdate: Date.now(),
                title: subjectInput ? `${subjectInput} Session` : "Study Session"
            }, { merge: true });
            
        } catch (e) {
            toast.error("Communication error with Dhruva engine.");
        }
        setIsSending(false);
    };

    return (
        <div className={`flex h-screen w-full overflow-hidden transition-all duration-700 ${theme.bg}`}>
            <ToastContainer position="top-center" theme={currentThemeKey === 'light' ? 'light' : 'dark'} />

            {/* Premium Onboarding Modal */}
            <AnimatePresence>
                {showOnboarding && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/80 backdrop-blur-lg">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={`max-w-sm w-full p-8 rounded-[3rem] border shadow-2xl text-center ${theme.bubble}`}>
                            <div className={`w-20 h-20 mx-auto mb-6 rounded-[2rem] flex items-center justify-center text-white shadow-xl ${theme.btn}`}>
                                <FaUserEdit size={30} />
                            </div>
                            <h2 className="text-2xl font-black mb-2">Welcome to Dhruva</h2>
                            <p className="text-sm opacity-60 mb-8 leading-relaxed">Setup your Class and Board so we can provide syllabus-accurate solutions.</p>
                            <button onClick={() => navigate("/profile")} className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-sm text-white shadow-lg active:scale-95 transition-all ${theme.btn}`}>Setup Profile</button>
                            <button onClick={() => setShowOnboarding(false)} className="mt-4 text-[10px] font-black opacity-30 uppercase tracking-widest">Skip for now</button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Dynamic Sidebar */}
            <AnimatePresence>
                {showSidebar && (
                    <motion.div initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }} className={`fixed lg:relative z-[600] w-80 h-full p-6 shadow-2xl flex flex-col ${theme.sidebar}`}>
                        <div className="flex justify-between items-center mb-8">
                            <div className="flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white ${theme.btn}`}><FaSparkles size={14}/></div>
                                <span className="font-black text-xs uppercase tracking-widest">Dhruva AI</span>
                            </div>
                            <button onClick={() => setShowSidebar(false)}><FaTimes /></button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto space-y-2 no-scrollbar">
                            <p className="text-[10px] font-black opacity-30 mb-4 tracking-widest uppercase">Visual Themes</p>
                            <div className="grid grid-cols-2 gap-2 mb-8">
                                {Object.keys(THEME_CONFIG).map(k => (
                                    <button key={k} onClick={() => setCurrentThemeKey(k)} 
                                        className={`p-3 rounded-xl text-[10px] font-black border transition-all ${currentThemeKey === k ? `border-indigo-500 ${theme.bubble} text-indigo-400` : 'border-white/5 opacity-40'}`}>
                                        {THEME_CONFIG[k].name}
                                    </button>
                                ))}
                            </div>
                            
                            <p className="text-[10px] font-black opacity-30 mb-4 tracking-widest uppercase">History</p>
                            {sessions.map(s => (
                                <button key={s.id} onClick={() => { setMessages(s.messages); setCurrentSessionId(s.id); setShowSidebar(false); }}
                                    className="w-full p-4 rounded-2xl text-left text-xs font-bold border border-white/5 hover:bg-white/5 truncate">
                                    {s.title || "Previous Session"}
                                </button>
                            ))}
                        </div>
                        
                        <button onClick={logout} className="mt-4 p-4 rounded-2xl bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-widest">Sign Out</button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Chat Stage */}
            <div className="flex-1 flex flex-col min-w-0 relative">
                <Navbar currentUser={currentUser} theme={currentThemeKey} />

                {/* Subject Control Center */}
                <div className="w-full max-w-4xl mx-auto px-4 mt-4 flex items-center gap-2">
                    <button onClick={() => setShowSidebar(true)} className={`p-4 rounded-2xl border ${theme.bubble}`}><FaHistory/></button>
                    <div className={`flex-1 flex items-center gap-2 p-2 rounded-3xl border transition-all ${theme.bubble}`}>
                        <div className="flex-1 px-4">
                            <label className="text-[8px] font-black opacity-30 block uppercase">Current Subject</label>
                            <input disabled={isLocked} value={subjectInput} onChange={e => setSubjectInput(e.target.value)} placeholder="Physics, Maths, etc." className="bg-transparent text-xs font-bold outline-none w-full" />
                        </div>
                        <button onClick={() => setIsLocked(!isLocked)} className={`p-3 rounded-xl transition-all ${isLocked ? 'bg-emerald-500 text-white' : 'bg-white/10 opacity-50'}`}>
                            {isLocked ? <FaLock size={12}/> : <FaUnlock size={12}/>}
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div ref={chatContainerRef} className="flex-1 overflow-y-auto px-4 py-8 no-scrollbar">
                    <div className="max-w-3xl mx-auto space-y-8 pb-32">
                        {messages.length === 0 ? (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center min-h-[50vh] text-center">
                                <div className={`w-20 h-20 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-2xl ${theme.bubble}`}>
                                    <FaSparkles className={`text-3xl animate-pulse ${theme.accent}`} />
                                </div>
                                <h1 className="text-3xl font-black mb-4">How can I help you study?</h1>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-xl">
                                    {[
                                        { t: "Explain Photosynthesis", s: "Biology", i: <FaLightbulb/> },
                                        { t: "Math Doubt: Trigonometry", s: "Maths", i: <FaGraduationCap/> },
                                        { t: "Summary of WW1", s: "History", i: <FaBookOpen/> },
                                        { t: "Solve this Physics Problem", s: "Physics", i: <FaQuestion/> }
                                    ].map((card, i) => (
                                        <button key={i} onClick={() => { setSubjectInput(card.s); sendMessage(card.t); }}
                                            className={`p-5 rounded-[2rem] border text-left flex items-center gap-4 transition-all hover:scale-[1.02] active:scale-95 ${theme.bubble}`}>
                                            <div className={`p-3 rounded-2xl text-white ${theme.btn}`}>{card.i}</div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black uppercase opacity-30">{card.s}</span>
                                                <span className="text-sm font-bold truncate w-40">{card.t}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        ) : (
                            messages.map((msg, i) => (
                                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                                    <div className={`max-w-[85%] p-6 rounded-[2.5rem] shadow-2xl ${msg.role === "user" ? `${theme.user} rounded-tr-none` : `${theme.bubble} rounded-tl-none`}`}>
                                        <div className="prose prose-sm dark:prose-invert max-w-none">
                                            <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                                                {msg.content}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                {/* Floating Action Bar */}
                <div className="absolute bottom-0 left-0 w-full p-4 md:p-10 bg-gradient-to-t from-black/20 to-transparent pointer-events-none">
                    <div className="max-w-3xl mx-auto pointer-events-auto">
                        <div className={`flex items-center gap-2 p-2 rounded-[3rem] border shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-all duration-500 ${theme.input}`}>
                            <input 
                                value={input} 
                                onChange={e => setInput(e.target.value)}
                                placeholder="Message Dhruva..."
                                className="flex-1 bg-transparent px-6 py-4 outline-none font-black text-sm md:text-base"
                                onKeyDown={e => e.key === "Enter" && sendMessage()}
                            />
                            <div className="flex items-center gap-1 pr-2">
                                <button className="hidden md:flex p-4 rounded-full bg-white/5 opacity-50 hover:opacity-100 transition-all"><FaCamera size={18}/></button>
                                <button onClick={() => sendMessage()} disabled={isSending} 
                                    className={`p-5 rounded-full shadow-lg transition-all active:scale-95 text-white ${theme.btn}`}>
                                    {isSending ? <FaSyncAlt className="animate-spin" size={20} /> : <FaPaperPlane size={20} />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
