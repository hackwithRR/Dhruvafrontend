import React, { useEffect, useState, useRef } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import { FaPaperPlane, FaCamera, FaLock, FaSyncAlt, FaTimes, FaUndo, FaImage, FaPlus, FaHistory, FaUnlock, FaYoutube, FaArrowDown, FaTrash, FaClock, FaPlay, FaPause, FaStop } from "react-icons/fa";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { doc, getDoc, setDoc, collection, query, getDocs, orderBy, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";
import imageCompression from "browser-image-compression";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";

const API_BASE = (process.env.REACT_APP_API_URL || "https://dhruva-backend-production.up.railway.app").replace(/\/$/, "");

const formatContent = (text) => text.replace(/\$\$/g, '').replace(/\n\s*\n/g, '\n\n').trim();

// --- UX ENHANCED STUDY TIMER ---
const StudyTimer = ({ currentTheme }) => {
    const [timeLeft, setTimeLeft] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const timerRef = useRef(null);

    const playAlarm = () => {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 1.5);
    };

    useEffect(() => {
        if (isActive && timeLeft > 0) {
            timerRef.current = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        } else if (timeLeft === 0 && isActive) {
            playAlarm();
            setIsActive(false);
            toast.info("Session Complete! Take a break. ☕");
        }
        return () => clearInterval(timerRef.current);
    }, [isActive, timeLeft]);

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    return (
        <motion.div drag dragMomentum={false} initial={{ x: 20, y: 120 }} className="fixed z-[100] right-6 top-0 hidden md:block">
            <motion.div 
                animate={{ width: isOpen ? "220px" : "54px", height: isOpen ? "240px" : "54px", borderRadius: isOpen ? "24px" : "50%" }}
                className={`flex flex-col overflow-hidden border shadow-2xl backdrop-blur-2xl ${currentTheme.aiBubble} border-white/10`}
            >
                {!isOpen ? (
                    <button onClick={() => setIsOpen(true)} className="w-full h-full flex items-center justify-center text-indigo-400 hover:text-white transition-colors">
                        <FaClock size={20} className={isActive ? "animate-pulse" : ""} />
                    </button>
                ) : (
                    <div className="p-4 flex flex-col h-full">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-[9px] font-black uppercase tracking-widest opacity-50">Deep Focus</span>
                            <button onClick={() => setIsOpen(false)} className="hover:rotate-90 transition-transform"><FaTimes size={12}/></button>
                        </div>
                        <div className="flex-1 flex flex-col items-center justify-center">
                            <h2 className="text-4xl font-black mb-4 font-mono tracking-tighter">{formatTime(timeLeft)}</h2>
                            {timeLeft === 0 ? (
                                <div className="grid grid-cols-2 gap-2 w-full">
                                    {[25, 50].map(m => (
                                        <button key={m} onClick={() => {setTimeLeft(m*60); setIsActive(true)}} className="py-2.5 rounded-xl bg-white/5 hover:bg-indigo-600 font-bold text-[10px] transition-all">{m}m</button>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex gap-3">
                                    <button onClick={() => setIsActive(!isActive)} className="p-4 rounded-full bg-indigo-600 text-white shadow-lg"><FaPlay size={12}/></button>
                                    <button onClick={() => {setTimeLeft(0); setIsActive(false)}} className="p-4 rounded-full bg-red-500/20 text-red-500"><FaStop size={12}/></button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
};

export default function Chat() {
    const { currentUser, logout } = useAuth();
    const [messages, setMessages] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [currentSessionId, setCurrentSessionId] = useState(Date.now().toString());
    const [input, setInput] = useState("");
    const [mode, setMode] = useState("Explain");
    const [isSending, setIsSending] = useState(false);
    const [theme, setTheme] = useState("DeepSpace");
    const [userData, setUserData] = useState({ board: "", class: "", language: "English" });
    const [showSidebar, setShowSidebar] = useState(false);
    const [isLocked, setIsLocked] = useState(false);
    const [subjectInput, setSubjectInput] = useState("");
    const [chapterInput, setChapterInput] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);

    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    const themes = {
        DeepSpace: { container: "bg-[#050505] text-white", aiBubble: "bg-white/[0.03] border-white/10", userBubble: "bg-indigo-600 shadow-indigo-500/20", input: "bg-white/[0.02] border-white/10", button: "bg-indigo-600", sidebar: "bg-[#0A0A0A] border-white/5" },
        Sakura: { container: "bg-[#1a0f12] text-rose-50", aiBubble: "bg-rose-500/10 border-rose-500/20", userBubble: "bg-rose-600 shadow-rose-500/20", input: "bg-rose-500/5 border-rose-500/10", button: "bg-rose-600", sidebar: "bg-[#221418] border-rose-500/10" },
        Forest: { container: "bg-[#0a120a] text-emerald-50", aiBubble: "bg-emerald-500/10 border-emerald-500/20", userBubble: "bg-emerald-600 shadow-emerald-500/20", input: "bg-emerald-500/5 border-emerald-500/10", button: "bg-emerald-600", sidebar: "bg-[#0e1a0e] border-emerald-500/10" },
        Cyberpunk: { container: "bg-[#0a0512] text-cyan-50", aiBubble: "bg-cyan-500/10 border-cyan-500/30", userBubble: "bg-fuchsia-600 shadow-fuchsia-500/20", input: "bg-cyan-500/5 border-cyan-500/10", button: "bg-cyan-600", sidebar: "bg-[#120a1a] border-cyan-500/20" },
        Midnight: { container: "bg-black text-blue-50", aiBubble: "bg-blue-500/10 border-blue-500/20", userBubble: "bg-blue-700 shadow-blue-500/20", input: "bg-blue-500/5 border-blue-500/10", button: "bg-blue-600", sidebar: "bg-[#050510] border-blue-500/10" },
        Sunset: { container: "bg-[#120a05] text-orange-50", aiBubble: "bg-orange-500/10 border-orange-500/20", userBubble: "bg-orange-600 shadow-orange-500/20", input: "bg-orange-500/5 border-orange-500/10", button: "bg-orange-600", sidebar: "bg-[#1a0f0a] border-orange-500/10" },
        Lavender: { container: "bg-[#0f0a12] text-purple-50", aiBubble: "bg-purple-500/10 border-purple-500/20", userBubble: "bg-purple-600 shadow-purple-500/20", input: "bg-purple-500/5 border-purple-500/10", button: "bg-purple-600", sidebar: "bg-[#160e1c] border-purple-500/10" },
        Ghost: { container: "bg-[#0a0a0a] text-gray-100", aiBubble: "bg-white/[0.02] border-white/5", userBubble: "bg-gray-800 shadow-black/40", input: "bg-white/[0.01] border-white/5", button: "bg-white/10", sidebar: "bg-[#111111] border-white/5" }
    };
    const currentTheme = themes[theme] || themes.DeepSpace;

    useEffect(() => {
        if (!currentUser) return;
        const init = async () => {
            const snap = await getDoc(doc(db, "users", currentUser.uid));
            if (snap.exists()) setUserData(snap.data());
            fetchSessions();
        };
        init();
    }, [currentUser]);

    const fetchSessions = async () => {
        const q = query(collection(db, `users/${currentUser.uid}/sessions`), orderBy("lastUpdate", "desc"));
        const snap = await getDocs(q);
        setSessions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };

    const loadSession = async (sid) => {
        setCurrentSessionId(sid);
        const snap = await getDoc(doc(db, `users/${currentUser.uid}/sessions`, sid));
        if (snap.exists()) setMessages(snap.data().messages || []);
        setShowSidebar(false);
    };

    const sendMessage = async () => {
        if (!currentUser || isSending || (!input.trim() && !selectedFile)) return;
        const text = input;
        const file = selectedFile;
        setIsSending(true);
        setInput("");
        setSelectedFile(null);

        const userMsg = { role: "user", content: text || "Analyzing image...", image: file ? URL.createObjectURL(file) : null };
        setMessages(prev => [...prev, userMsg]);

        try {
            const payload = { userId: currentUser.uid, message: text || "Explain this", mode, subject: subjectInput, chapter: chapterInput, language: userData.language, classLevel: userData.class };
            let res;
            if (file) {
                const formData = new FormData();
                formData.append("photo", await imageCompression(file, { maxSizeMB: 0.5 }));
                Object.keys(payload).forEach(k => formData.append(k, payload[k]));
                res = await axios.post(`${API_BASE}/chat/photo`, formData);
            } else {
                res = await axios.post(`${API_BASE}/chat`, payload);
            }

            const aiMsg = { role: "ai", content: res.data.reply, ytLink: subjectInput ? `https://www.youtube.com/results?search_query=${encodeURIComponent(subjectInput + " lesson")}` : null };
            const newMsgs = [...messages, userMsg, aiMsg];
            setMessages(newMsgs);
            
            await setDoc(doc(db, `users/${currentUser.uid}/sessions`, currentSessionId), {
                messages: newMsgs, lastUpdate: Date.now(), title: subjectInput || text.slice(0, 15)
            }, { merge: true });
            fetchSessions();
        } catch (e) { toast.error("Connection lost"); }
        setIsSending(false);
    };

    return (
        <div className={`flex h-screen w-full overflow-hidden transition-colors duration-500 ${currentTheme.container}`}>
            <ToastContainer theme="dark" position="top-center" limit={1} />
            
            {/* SIDEBAR UX */}
            <AnimatePresence>
                {showSidebar && (
                    <motion.div initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }} className={`fixed lg:relative z-[200] w-80 h-full flex flex-col p-6 shadow-3xl backdrop-blur-xl ${currentTheme.sidebar}`}>
                        <div className="flex justify-between items-center mb-10">
                            <span className="text-[10px] font-black tracking-[0.2em] uppercase opacity-40">Learning Vault</span>
                            <button onClick={() => setShowSidebar(false)} className="p-2 hover:bg-white/5 rounded-full"><FaTimes/></button>
                        </div>
                        <button onClick={() => {setMessages([]); setCurrentSessionId(Date.now().toString()); setShowSidebar(false)}} className="w-full py-4 mb-8 rounded-2xl bg-indigo-600 text-white font-black text-[10px] tracking-widest shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-3 active:scale-95 transition-all">
                            <FaPlus size={10}/> NEW SESSION
                        </button>
                        <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar">
                            {sessions.map(s => (
                                <div key={s.id} onClick={() => loadSession(s.id)} className={`group p-4 rounded-2xl cursor-pointer transition-all border ${currentSessionId === s.id ? 'bg-indigo-600/10 border-indigo-600/30' : 'border-transparent hover:bg-white/5 opacity-60 hover:opacity-100'}`}>
                                    <div className="text-xs font-bold truncate uppercase tracking-tight">{s.title || "Untitled Session"}</div>
                                    <div className="text-[9px] opacity-30 mt-1 font-medium">{new Date(s.lastUpdate).toLocaleDateString()}</div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex-1 flex flex-col min-w-0 h-full relative">
                <Navbar currentUser={currentUser} theme={theme} setTheme={setTheme} logout={logout} />
                <StudyTimer currentTheme={currentTheme} />

                {/* HEADER / SUBJECT SELECTOR */}
                <div className="w-full max-w-4xl mx-auto px-4 pt-6 space-y-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className={`flex-1 flex items-center gap-2 p-2 rounded-[1.5rem] border transition-all ${isLocked ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-white/10 bg-white/5 shadow-xl'}`}>
                            <div className="flex-1 flex px-3 py-1">
                                <input disabled={isLocked} value={subjectInput} onChange={e => setSubjectInput(e.target.value)} placeholder="Subject (e.g. Physics)" className="w-full bg-transparent text-xs font-bold outline-none placeholder:opacity-30" />
                            </div>
                            <div className="w-px h-6 bg-white/10 hidden sm:block" />
                            <div className="flex-1 flex px-3 py-1">
                                <input disabled={isLocked} value={chapterInput} onChange={e => setChapterInput(e.target.value)} placeholder="Chapter" className="w-full bg-transparent text-xs font-bold outline-none placeholder:opacity-30" />
                            </div>
                            <button onClick={() => setIsLocked(!isLocked)} className={`p-3 rounded-xl transition-all shadow-md ${isLocked ? 'bg-emerald-600 text-white' : 'text-indigo-400 bg-white/5'}`}>
                                {isLocked ? <FaLock size={12}/> : <FaUnlock size={12}/>}
                            </button>
                        </div>
                        
                        <div className="flex bg-white/5 p-1.5 rounded-[1.5rem] border border-white/10 shadow-xl overflow-hidden">
                            {["Explain", "Quiz"].map(m => (
                                <button key={m} onClick={() => setMode(m)} className={`px-6 py-2.5 text-[10px] font-black tracking-widest uppercase rounded-xl transition-all ${mode === m ? 'bg-indigo-600 text-white shadow-lg' : 'opacity-40 hover:opacity-100'}`}>
                                    {m}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* CHAT AREA UX */}
                <div className="flex-1 overflow-y-auto px-4 py-10 no-scrollbar scroll-smooth">
                    <div className="max-w-3xl mx-auto space-y-8">
                        {messages.length === 0 && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col items-center justify-center py-20 opacity-20 text-center">
                                <FaPlus size={40} className="mb-4" />
                                <p className="text-sm font-bold uppercase tracking-[0.3em]">Ready to study?</p>
                            </motion.div>
                        )}
                        {messages.map((msg, i) => (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={i} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                                <div className={`max-w-[90%] md:max-w-[80%] p-5 md:p-6 rounded-[2rem] shadow-xl ${msg.role === "user" ? `${currentTheme.userBubble} text-white rounded-tr-none` : `${currentTheme.aiBubble} rounded-tl-none border-white/5 backdrop-blur-md`}`}>
                                    {msg.image && <img src={msg.image} className="rounded-2xl mb-4 max-h-60 w-full object-cover shadow-lg" alt="attachment" />}
                                    <div className="prose prose-sm prose-invert max-w-none text-sm leading-relaxed font-medium tracking-tight">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{formatContent(msg.content)}</ReactMarkdown>
                                    </div>
                                    {msg.role === "ai" && msg.ytLink && (
                                        <a href={msg.ytLink} target="_blank" rel="noreferrer" className="mt-5 flex items-center gap-3 p-3 bg-red-600/10 text-red-500 rounded-xl text-[10px] font-black tracking-widest hover:bg-red-600/20 transition-all border border-red-500/20 uppercase">
                                            <FaYoutube size={16}/> View visual guide
                                        </a>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                        {isSending && <div className="text-[9px] font-black uppercase tracking-[0.2em] opacity-30 animate-pulse px-4">Dhruva is thinking...</div>}
                        <div ref={messagesEndRef} className="h-20" />
                    </div>
                </div>

                {/* FLOATING ACTION BUTTONS */}
                <div className="p-4 md:p-10 bg-gradient-to-t from-black/20 to-transparent pointer-events-none">
                    <div className="max-w-3xl mx-auto relative pointer-events-auto">
                        <AnimatePresence>
                            {selectedFile && (
                                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="absolute bottom-full mb-6 left-6 group">
                                    <div className="relative">
                                        <img src={URL.createObjectURL(selectedFile)} className="w-28 h-28 object-cover rounded-3xl border-2 border-indigo-600 shadow-2xl transition-transform group-hover:scale-105" alt="preview" />
                                        <button onClick={() => setSelectedFile(null)} className="absolute -top-3 -right-3 bg-red-600 p-2 rounded-full text-white shadow-lg active:scale-90 transition-transform"><FaTimes size={12}/></button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className={`flex items-center gap-2 p-2 rounded-[2.5rem] border backdrop-blur-3xl shadow-2xl transition-all ${currentTheme.input}`}>
                            <button onClick={() => setShowSidebar(!showSidebar)} className="p-4 text-indigo-400 hover:text-indigo-300 transition-colors lg:hidden"><FaHistory/></button>
                            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMessage()} placeholder={`Ask Dhruva about ${subjectInput || 'anything'}...`} className="flex-1 bg-transparent px-4 py-4 outline-none font-bold text-sm tracking-tight" />
                            <div className="flex items-center gap-1 md:gap-2 px-2">
                                <input type="file" ref={fileInputRef} hidden onChange={e => setSelectedFile(e.target.files[0])} />
                                <button onClick={() => fileInputRef.current.click()} className="p-3 opacity-40 hover:opacity-100 transition-all text-indigo-400"><FaImage size={18}/></button>
                                <button onClick={sendMessage} disabled={isSending} className={`p-5 rounded-full shadow-lg active:scale-90 transition-all ${currentTheme.button} text-white`}>
                                    {isSending ? <FaSyncAlt className="animate-spin" size={14}/> : <FaPaperPlane size={14}/>}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
    );
}

