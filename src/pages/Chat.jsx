import React, { useEffect, useState, useRef } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import { 
  FaPaperPlane, FaLock, FaSyncAlt, FaTimes, FaImage, 
  FaPlus, FaHistory, FaUnlock, FaYoutube, FaClock, 
  FaPlay, FaStop 
} from "react-icons/fa";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { doc, getDoc, setDoc, collection, query, getDocs, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import imageCompression from "browser-image-compression";
import { motion, AnimatePresence } from "framer-motion";

const API_BASE = (process.env.REACT_APP_API_URL || "https://dhruva-backend-production.up.railway.app").replace(/\/$/, "");

// Helper for cleaning text
const formatContent = (text) => text?.replace(/\$\$/g, '').replace(/\n\s*\n/g, '\n\n').trim() || "";

// --- UX ENHANCED STUDY TIMER ---
const StudyTimer = ({ currentTheme }) => {
    const [timeLeft, setTimeLeft] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const timerRef = useRef(null);

    const playAlarm = () => {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain); gain.connect(ctx.destination);
            osc.start(); osc.stop(ctx.currentTime + 1);
        } catch (e) { console.log("Audio blocked"); }
    };

    useEffect(() => {
        if (isActive && timeLeft > 0) {
            timerRef.current = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        } else if (timeLeft === 0 && isActive) {
            playAlarm();
            setIsActive(false);
            toast.info("Deep Work Session Finished!");
        }
        return () => clearInterval(timerRef.current);
    }, [isActive, timeLeft]);

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    return (
        <motion.div drag dragMomentum={false} className="fixed z-[100] right-6 top-24 hidden md:block">
            <motion.div 
                animate={{ 
                    width: isOpen ? "200px" : "50px", 
                    height: isOpen ? "200px" : "50px", 
                    borderRadius: isOpen ? "24px" : "50%" 
                }}
                className={`flex flex-col overflow-hidden border shadow-2xl backdrop-blur-2xl ${currentTheme.aiBubble} border-white/10`}
            >
                {!isOpen ? (
                    <button onClick={() => setIsOpen(true)} className="w-full h-full flex items-center justify-center text-indigo-400">
                        <FaClock size={18} className={isActive ? "animate-pulse" : ""} />
                    </button>
                ) : (
                    <div className="p-4 flex flex-col h-full">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-[8px] font-black uppercase opacity-40">Focus</span>
                            <button onClick={() => setIsOpen(false)}><FaTimes size={10}/></button>
                        </div>
                        <div className="flex-1 flex flex-col items-center justify-center">
                            <h2 className="text-3xl font-mono font-bold mb-4">{formatTime(timeLeft)}</h2>
                            {timeLeft === 0 ? (
                                <div className="grid grid-cols-2 gap-2 w-full">
                                    {[25, 45].map(m => (
                                        <button key={m} onClick={() => {setTimeLeft(m*60); setIsActive(true)}} className="py-2 rounded-lg bg-white/5 hover:bg-indigo-600 text-[10px] transition-all">{m}m</button>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex gap-2">
                                    <button onClick={() => setIsActive(!isActive)} className="p-3 rounded-full bg-indigo-600"><FaPlay size={10}/></button>
                                    <button onClick={() => {setTimeLeft(0); setIsActive(false)}} className="p-3 rounded-full bg-red-500/20"><FaStop size={10}/></button>
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

    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    const themes = {
        DeepSpace: { container: "bg-[#050505] text-white", aiBubble: "bg-white/[0.03] border-white/10", userBubble: "bg-indigo-600 shadow-indigo-500/20", input: "bg-white/[0.02] border-white/10", button: "bg-indigo-600", sidebar: "bg-[#0A0A0A] border-white/5" },
        Sakura: { container: "bg-[#1a0f12] text-rose-50", aiBubble: "bg-rose-500/10 border-rose-500/20", userBubble: "bg-rose-600 shadow-rose-500/20", input: "bg-rose-500/5 border-rose-500/10", button: "bg-rose-600", sidebar: "bg-[#221418] border-rose-500/10" },
        Forest: { container: "bg-[#0a120a] text-emerald-50", aiBubble: "bg-emerald-500/10 border-emerald-500/20", userBubble: "bg-emerald-600 shadow-emerald-500/20", input: "bg-emerald-500/5 border-emerald-500/10", button: "bg-emerald-600", sidebar: "bg-[#0e1a0e] border-emerald-500/10" },
        Cyberpunk: { container: "bg-[#0a0512] text-cyan-50", aiBubble: "bg-cyan-500/10 border-cyan-500/30", userBubble: "bg-fuchsia-600 shadow-fuchsia-500/20", input: "bg-cyan-500/5 border-cyan-500/10", button: "bg-cyan-600", sidebar: "bg-[#120a1a] border-cyan-500/20" }
    };
    const currentTheme = themes[theme] || themes.DeepSpace;

    useEffect(() => {
        if (!currentUser) return;
        const fetchData = async () => {
            const snap = await getDoc(doc(db, "users", currentUser.uid));
            if (snap.exists()) setUserData(snap.data());
            fetchSessions();
        };
        fetchData();
    }, [currentUser]);

    const fetchSessions = async () => {
        const q = query(collection(db, `users/${currentUser.uid}/sessions`), orderBy("lastUpdate", "desc"));
        const snap = await getDocs(q);
        setSessions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };

    const sendMessage = async () => {
        if (!input.trim() && !selectedFile) return;
        setIsSending(true);
        const text = input;
        const file = selectedFile;
        setInput("");
        setSelectedFile(null);

        const userMsg = { role: "user", content: text || "Analyze this image", image: file ? URL.createObjectURL(file) : null };
        setMessages(prev => [...prev, userMsg]);

        try {
            const payload = { userId: currentUser.uid, message: text, mode, subject: subjectInput, chapter: chapterInput, language: userData.language, classLevel: userData.class };
            let res;
            if (file) {
                const formData = new FormData();
                formData.append("photo", await imageCompression(file, { maxSizeMB: 0.5 }));
                Object.keys(payload).forEach(k => formData.append(k, payload[k]));
                res = await axios.post(`${API_BASE}/chat/photo`, formData);
            } else {
                res = await axios.post(`${API_BASE}/chat`, payload);
            }

            const aiMsg = { role: "ai", content: res.data.reply, ytLink: subjectInput ? `https://www.youtube.com/results?search_query=${encodeURIComponent(subjectInput)}` : null };
            const newMsgs = [...messages, userMsg, aiMsg];
            setMessages(newMsgs);
            
            await setDoc(doc(db, `users/${currentUser.uid}/sessions`, currentSessionId), {
                messages: newMsgs, lastUpdate: Date.now(), title: subjectInput || text.slice(0, 15)
            }, { merge: true });
        } catch (e) { toast.error("Server error. Try again."); }
        setIsSending(false);
    };

    return (
        <div className={`flex h-screen w-full overflow-hidden transition-all duration-700 ${currentTheme.container}`}>
            <ToastContainer theme="dark" position="top-center" />
            
            {/* SIDEBAR */}
            <AnimatePresence>
                {showSidebar && (
                    <motion.div initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }} className={`fixed lg:relative z-[200] w-72 h-full flex flex-col p-6 shadow-2xl backdrop-blur-xl ${currentTheme.sidebar}`}>
                        <div className="flex justify-between items-center mb-8">
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Session History</span>
                            <button onClick={() => setShowSidebar(false)} className="p-2"><FaTimes/></button>
                        </div>
                        <button onClick={() => {setMessages([]); setCurrentSessionId(Date.now().toString()); setShowSidebar(false)}} className="w-full py-3 mb-6 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center justify-center gap-2">
                            <FaPlus size={10}/> NEW CHAT
                        </button>
                        <div className="flex-1 overflow-y-auto space-y-2 no-scrollbar">
                            {sessions.map(s => (
                                <div key={s.id} onClick={() => {setCurrentSessionId(s.id); setMessages(s.messages || []); setShowSidebar(false)}} className="p-3 rounded-xl cursor-pointer hover:bg-white/5 border border-transparent hover:border-white/10 transition-all">
                                    <div className="text-xs font-bold truncate opacity-80">{s.title || "Untitled"}</div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex-1 flex flex-col min-w-0 h-full">
                <Navbar currentUser={currentUser} theme={theme} setTheme={setTheme} logout={logout} />
                <StudyTimer currentTheme={currentTheme} />

                {/* SUBJECT CONTROLS */}
                <div className="w-full max-w-4xl mx-auto px-4 mt-6">
                    <div className="flex flex-col md:flex-row gap-3">
                        <div className={`flex-1 flex items-center gap-2 p-1.5 rounded-2xl border ${currentTheme.input}`}>
                            <input disabled={isLocked} value={subjectInput} onChange={e => setSubjectInput(e.target.value)} placeholder="Subject..." className="flex-1 bg-transparent px-4 py-2 text-xs font-bold outline-none" />
                            <input disabled={isLocked} value={chapterInput} onChange={e => setChapterInput(e.target.value)} placeholder="Chapter..." className="flex-1 bg-transparent px-4 py-2 text-xs font-bold outline-none border-l border-white/5" />
                            <button onClick={() => setIsLocked(!isLocked)} className={`p-3 rounded-xl transition-all ${isLocked ? 'bg-emerald-600' : 'bg-white/5 text-indigo-400'}`}>
                                {isLocked ? <FaLock size={12}/> : <FaUnlock size={12}/>}
                            </button>
                        </div>
                        <div className={`flex p-1 rounded-2xl border ${currentTheme.input}`}>
                            {["Explain", "Quiz"].map(m => (
                                <button key={m} onClick={() => setMode(m)} className={`px-6 py-2 text-[10px] font-black uppercase rounded-xl transition-all ${mode === m ? 'bg-indigo-600 text-white shadow-lg' : 'opacity-40'}`}>
                                    {m}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* MESSAGES */}
                <div className="flex-1 overflow-y-auto px-4 py-8 no-scrollbar">
                    <div className="max-w-3xl mx-auto space-y-6">
                        {messages.map((msg, i) => (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={i} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                                <div className={`max-w-[85%] p-5 rounded-[1.5rem] ${msg.role === "user" ? `${currentTheme.userBubble} rounded-tr-none` : `${currentTheme.aiBubble} rounded-tl-none backdrop-blur-md`}`}>
                                    {msg.image && <img src={msg.image} className="rounded-xl mb-3 max-h-48 w-full object-cover" alt="upload" />}
                                    <div className="prose prose-sm prose-invert max-w-none text-sm leading-relaxed">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{formatContent(msg.content)}</ReactMarkdown>
                                    </div>
                                    {msg.role === "ai" && msg.ytLink && (
                                        <a href={msg.ytLink} target="_blank" rel="noreferrer" className="mt-4 flex items-center gap-2 text-[10px] font-black text-red-400 hover:text-red-300 transition-colors">
                                            <FaYoutube size={14}/> WATCH VIDEO GUIDE
                                        </a>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                        {isSending && <div className="text-[10px] font-bold opacity-30 animate-pulse uppercase tracking-widest">Dhruva is processing...</div>}
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                {/* INPUT BAR */}
                <div className="p-4 md:p-8">
                    <div className="max-w-3xl mx-auto relative">
                        <AnimatePresence>
                            {selectedFile && (
                                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} className="absolute bottom-full mb-4 left-0">
                                    <div className="relative group">
                                        <img src={URL.createObjectURL(selectedFile)} className="w-24 h-24 object-cover rounded-2xl border-2 border-indigo-600 shadow-2xl" alt="preview" />
                                        <button onClick={() => setSelectedFile(null)} className="absolute -top-2 -right-2 bg-red-600 p-1.5 rounded-full"><FaTimes size={10}/></button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className={`flex items-center gap-2 p-2 rounded-[2rem] border shadow-2xl ${currentTheme.input} backdrop-blur-xl`}>
                            <button onClick={() => setShowSidebar(true)} className="p-3 text-indigo-400 lg:hidden"><FaHistory/></button>
                            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMessage()} placeholder="Describe what you want to learn..." className="flex-1 bg-transparent px-4 py-3 outline-none text-sm font-medium" />
                            <div className="flex items-center gap-1">
                                <input type="file" ref={fileInputRef} hidden onChange={e => setSelectedFile(e.target.files[0])} />
                                <button onClick={() => fileInputRef.current.click()} className="p-3 opacity-50 hover:opacity-100 transition-all"><FaImage size={18}/></button>
                                <button onClick={sendMessage} disabled={isSending} className={`p-4 rounded-full ${currentTheme.button} text-white transition-transform active:scale-90`}>
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
