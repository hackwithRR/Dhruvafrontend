import React, { useEffect, useState, useRef } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import { 
    FaPaperPlane, FaCamera, FaLock, FaSyncAlt, FaTimes, FaUndo, 
    FaImage, FaPlus, FaHistory, FaUnlock, FaYoutube, FaArrowDown, 
    FaTrash, FaClock, FaPlay, FaPause, FaStop, FaBookOpen, FaLayerGroup, FaLightbulb 
} from "react-icons/fa";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { doc, getDoc, updateDoc, setDoc, collection, query, getDocs, orderBy, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";
import imageCompression from "browser-image-compression";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";

import 'katex/dist/katex.min.css';

const API_BASE = (process.env.REACT_APP_API_URL || "https://dhruva-backend-production.up.railway.app").replace(/\/$/, "");

// --- THE 8 THEMES ENGINE ---
const THEME_PRESETS = {
    DeepSpace: { container: "bg-[#050505] text-white", aiBubble: "bg-white/5 border-white/10", userBubble: "bg-indigo-600 shadow-indigo-500/20", accent: "text-indigo-400", btn: "bg-indigo-600", sidebar: "bg-[#080808]", input: "bg-white/5 border-white/10" },
    Sakura: { container: "bg-[#1a0f12] text-rose-100", aiBubble: "bg-rose-500/10 border-rose-500/20", userBubble: "bg-rose-600 shadow-rose-500/20", accent: "text-rose-400", btn: "bg-rose-600", sidebar: "bg-[#221418]", input: "bg-rose-900/20 border-rose-500/20" },
    Forest: { container: "bg-[#0a120a] text-emerald-100", aiBubble: "bg-emerald-500/10 border-emerald-500/20", userBubble: "bg-emerald-600 shadow-emerald-500/20", accent: "text-emerald-400", btn: "bg-emerald-600", sidebar: "bg-[#0e1a0e]", input: "bg-emerald-900/20 border-emerald-500/20" },
    Cyberpunk: { container: "bg-[#0a0512] text-cyan-100", aiBubble: "bg-fuchsia-500/10 border-cyan-500/30", userBubble: "bg-fuchsia-600 shadow-fuchsia-500/20", accent: "text-fuchsia-400", btn: "bg-cyan-600", sidebar: "bg-[#120a1a]", input: "bg-fuchsia-900/20 border-fuchsia-500/20" },
    Midnight: { container: "bg-[#000000] text-blue-100", aiBubble: "bg-blue-900/20 border-blue-500/20", userBubble: "bg-blue-700 shadow-blue-500/20", accent: "text-blue-400", btn: "bg-blue-700", sidebar: "bg-[#050510]", input: "bg-blue-900/10 border-blue-500/20" },
    Sunset: { container: "bg-[#120a05] text-orange-100", aiBubble: "bg-orange-500/10 border-orange-500/20", userBubble: "bg-orange-600 shadow-orange-500/20", accent: "text-orange-400", btn: "bg-orange-600", sidebar: "bg-[#1a0f0a]", input: "bg-orange-900/20 border-orange-500/20" },
    Lavender: { container: "bg-[#0f0a12] text-purple-100", aiBubble: "bg-purple-500/10 border-purple-500/20", userBubble: "bg-purple-600 shadow-purple-500/20", accent: "text-purple-400", btn: "bg-purple-600", sidebar: "bg-[#160e1c]", input: "bg-purple-900/20 border-purple-500/20" },
    Ghost: { container: "bg-[#0a0a0a] text-gray-100", aiBubble: "bg-white/5 border-white/5", userBubble: "bg-gray-700 shadow-white/5", accent: "text-gray-400", btn: "bg-gray-800", sidebar: "bg-[#111111]", input: "bg-white/5 border-white/5" }
};

// --- STUDY TIMER COMPONENT ---
const StudyTimer = ({ currentTheme }) => {
    const [timeLeft, setTimeLeft] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const timerRef = useRef(null);

    const playAlarm = () => {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 2);
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
        <motion.div drag dragMomentum={false} initial={{ x: 20, y: 500 }} className="fixed z-[100] cursor-grab active:cursor-grabbing">
            <motion.div animate={{ width: isOpen ? "240px" : "64px", height: isOpen ? "280px" : "64px" }} className={`overflow-hidden rounded-[2rem] border backdrop-blur-3xl shadow-2xl flex flex-col ${currentTheme.aiBubble} border-white/20`}>
                {!isOpen ? (
                    <button onClick={() => setIsOpen(true)} className="w-full h-full flex items-center justify-center text-indigo-500">
                        <FaClock size={24} className={isActive ? "animate-spin-slow" : "animate-pulse"} />
                    </button>
                ) : (
                    <div className="p-5 flex flex-col h-full">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Timer</span>
                            <button onClick={() => setIsOpen(false)}><FaTimes size={12} /></button>
                        </div>
                        <div className="flex-1 flex flex-col items-center justify-center">
                            <h2 className="text-4xl font-black mb-6 font-mono">{formatTime(timeLeft)}</h2>
                            {timeLeft === 0 ? (
                                <div className="grid grid-cols-2 gap-2 w-full">
                                    {[15, 30, 45, 60].map(m => (
                                        <button key={m} onClick={() => {setTimeLeft(m * 60); setIsActive(true)}} className="py-2 rounded-xl bg-white/5 hover:bg-indigo-500 text-[10px] font-bold transition-all">
                                            {m}m
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex gap-4">
                                    <button onClick={() => setIsActive(!isActive)} className="p-4 rounded-full bg-indigo-500 text-white">{isActive ? <FaPause /> : <FaPlay />}</button>
                                    <button onClick={() => {setTimeLeft(0); setIsActive(false)}} className="p-4 rounded-full bg-red-500/20 text-red-500"><FaStop /></button>
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
    const { currentUser, logout, theme, setTheme } = useAuth();
    const [messages, setMessages] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [currentSessionId, setCurrentSessionId] = useState(Date.now().toString());
    const [input, setInput] = useState("");
    const [mode, setMode] = useState("Explain");
    const [isSending, setIsSending] = useState(false);
    const [isLocked, setIsLocked] = useState(false);
    const [subjectInput, setSubjectInput] = useState("");
    const [chapterInput, setChapterInput] = useState("");
    const [showSidebar, setShowSidebar] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [showScrollBtn, setShowScrollBtn] = useState(false);

    const messagesEndRef = useRef(null);
    const chatContainerRef = useRef(null);
    const videoRef = useRef(null);
    const fileInputRef = useRef(null);

    const currentTheme = THEME_PRESETS[theme] || THEME_PRESETS.DeepSpace;

    // --- FIREBASE DATA LOGIC ---
    useEffect(() => {
        if (!currentUser) return;
        fetchSessions();
    }, [currentUser]);

    const fetchSessions = async () => {
        const q = query(collection(db, `users/${currentUser.uid}/sessions`), orderBy("lastUpdate", "desc"));
        const snap = await getDocs(q);
        setSessions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };

    const loadSession = async (sid) => {
        setCurrentSessionId(sid);
        const sDoc = await getDoc(doc(db, `users/${currentUser.uid}/sessions`, sid));
        if (sDoc.exists()) setMessages(sDoc.data().messages || []);
        setShowSidebar(false);
    };

    const startNewSession = () => {
        setMessages([]);
        setCurrentSessionId(Date.now().toString());
        setSubjectInput("");
        setChapterInput("");
        setIsLocked(false);
    };

    const sendMessage = async () => {
        if (!currentUser || isSending || (!input.trim() && !selectedFile)) return;
        const file = selectedFile;
        const text = input;
        setIsSending(true);
        setSelectedFile(null);
        setInput("");

        const userMsg = { role: "user", content: text || "Analyzing...", image: file ? URL.createObjectURL(file) : null };
        const newMessages = [...messages, userMsg];
        setMessages(newMessages);

        try {
            const formData = new FormData();
            if (file) {
                const compressed = await imageCompression(file, { maxSizeMB: 0.7 });
                formData.append("photo", compressed);
            }
            formData.append("userId", currentUser.uid);
            formData.append("message", text || "Explain this image");
            formData.append("mode", mode);
            formData.append("subject", subjectInput);
            formData.append("chapter", chapterInput);

            const res = await axios.post(`${API_BASE}/chat${file ? '/photo' : ''}`, file ? formData : {
                userId: currentUser.uid, message: text, mode, subject: subjectInput, chapter: chapterInput
            });

            const aiMsg = { role: "ai", content: res.data.reply, timestamp: Date.now() };
            const finalMessages = [...newMessages, aiMsg];
            setMessages(finalMessages);

            await setDoc(doc(db, `users/${currentUser.uid}/sessions`, currentSessionId), {
                messages: finalMessages,
                lastUpdate: Date.now(),
                title: subjectInput ? `${subjectInput}: ${chapterInput}` : text.slice(0, 20)
            }, { merge: true });
            fetchSessions();
        } catch (e) { toast.error("Server error"); }
        setIsSending(false);
    };

    // --- CAMERA UTILS ---
    const openCamera = async () => { setIsCameraOpen(true); try { const s = await navigator.mediaDevices.getUserMedia({ video: true }); if (videoRef.current) videoRef.current.srcObject = s; } catch (e) { setIsCameraOpen(false); } };
    const closeCamera = () => { if (videoRef.current?.srcObject) videoRef.current.srcObject.getTracks().forEach(t => t.stop()); setIsCameraOpen(false); };

    return (
        <div className={`flex h-screen w-full overflow-hidden transition-all duration-500 ${currentTheme.container}`}>
            <ToastContainer theme="dark" position="top-center" limit={1} />
            <StudyTimer currentTheme={currentTheme} />

            {/* SIDEBAR FOR HISTORY AND THEMES */}
            <AnimatePresence>
                {showSidebar && (
                    <motion.div initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }} className={`fixed lg:relative z-[150] w-72 h-full flex flex-col p-6 ${currentTheme.sidebar}`}>
                        <div className="flex justify-between items-center mb-8">
                            <span className="text-[10px] font-black uppercase opacity-40">Sessions</span>
                            <button onClick={() => setShowSidebar(false)}><FaTimes /></button>
                        </div>

                        <div className="grid grid-cols-4 gap-2 mb-6">
                            {Object.keys(THEME_PRESETS).map(t => (
                                <button key={t} onClick={() => setTheme(t)} className={`h-8 rounded-lg border-2 ${theme === t ? 'border-white' : 'border-transparent'} ${THEME_PRESETS[t].container}`} />
                            ))}
                        </div>

                        <button onClick={startNewSession} className="w-full py-3 mb-4 rounded-xl bg-indigo-600 text-white text-xs font-bold flex items-center justify-center gap-2">
                            <FaPlus /> New Chat
                        </button>

                        <div className="flex-1 overflow-y-auto space-y-2 no-scrollbar">
                            {sessions.map(s => (
                                <div key={s.id} onClick={() => loadSession(s.id)} className={`p-3 rounded-xl cursor-pointer ${currentSessionId === s.id ? 'bg-white/10' : 'opacity-50'}`}>
                                    <p className="text-[10px] font-bold truncate">{s.title || "Study Session"}</p>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex-1 flex flex-col h-full relative">
                <Navbar currentUser={currentUser} theme={theme} setTheme={setTheme} logout={logout} />

                {/* --- CLASSIC UI TOP BAR (MODERNIZED) --- */}
                <div className="max-w-4xl mx-auto w-full px-4 pt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className={`flex items-center gap-3 p-3 rounded-2xl border ${currentTheme.input}`}>
                        <FaBookOpen className={`text-xs ${currentTheme.accent}`} />
                        <input disabled={isLocked} value={subjectInput} onChange={e => setSubjectInput(e.target.value)} placeholder="Subject..." className="bg-transparent text-xs font-bold outline-none flex-1" />
                    </div>
                    <div className={`flex items-center gap-3 p-3 rounded-2xl border ${currentTheme.input}`}>
                        <FaLayerGroup className={`text-xs ${currentTheme.accent}`} />
                        <input disabled={isLocked} value={chapterInput} onChange={e => setChapterInput(e.target.value)} placeholder="Chapter..." className="bg-transparent text-xs font-bold outline-none flex-1" />
                    </div>
                    <div className={`flex items-center gap-2 p-1.5 rounded-2xl border ${currentTheme.input}`}>
                        <select value={mode} onChange={e => setMode(e.target.value)} className="bg-transparent text-xs font-bold outline-none flex-1 px-2 appearance-none cursor-pointer">
                            <option value="Explain" className="bg-black text-white">Explain</option>
                            <option value="Doubt" className="bg-black text-white">Doubt</option>
                            <option value="Quiz" className="bg-black text-white">Quiz</option>
                        </select>
                        <button onClick={() => setIsLocked(!isLocked)} className={`p-3 rounded-xl transition-all ${isLocked ? "bg-emerald-500 text-white" : "bg-white/5"}`}>
                            {isLocked ? <FaLock size={12} /> : <FaUnlock size={12} />}
                        </button>
                    </div>
                </div>

                {/* CHAT AREA */}
                <div ref={chatContainerRef} className="flex-1 overflow-y-auto px-4 py-8 no-scrollbar">
                    <div className="max-w-3xl mx-auto space-y-8">
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                                <div className={`max-w-[85%] p-5 rounded-[2rem] border ${msg.role === "user" ? `${currentTheme.userBubble} border-white/10 rounded-tr-none` : `${currentTheme.aiBubble} rounded-tl-none`}`}>
                                    {msg.image && <img src={msg.image} className="rounded-xl mb-3 max-h-60" alt="study" />}
                                    <div className="prose prose-invert prose-sm">
                                        <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{msg.content}</ReactMarkdown>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* INPUT BAR */}
                <div className="p-4 md:p-8 shrink-0">
                    <div className="max-w-3xl mx-auto relative">
                        {selectedFile && (
                            <div className="absolute bottom-full mb-4 left-4 flex items-center">
                                <img src={URL.createObjectURL(selectedFile)} className="w-16 h-16 object-cover rounded-xl border-2 border-indigo-500" alt="prev" />
                                <button onClick={() => setSelectedFile(null)} className="ml-[-10px] mt-[-60px] bg-red-500 rounded-full p-1"><FaTimes size={10} /></button>
                            </div>
                        )}
                        <div className={`flex items-center p-2 rounded-[2.5rem] border shadow-2xl ${currentTheme.input}`}>
                            <button onClick={() => setShowSidebar(!showSidebar)} className="p-4 opacity-40 hover:opacity-100 transition-all"><FaHistory /></button>
                            <input value={input} onChange={e => setInput(e.target.value)} placeholder="Ask anything buddy..." className="flex-1 bg-transparent px-4 py-4 outline-none font-bold text-sm" onKeyDown={e => e.key === "Enter" && sendMessage()} />
                            <div className="flex items-center gap-2 pr-2">
                                <button onClick={() => fileInputRef.current.click()} className="p-3 opacity-40 hover:opacity-100"><FaImage /></button>
                                <button onClick={openCamera} className="p-3 opacity-40 hover:opacity-100"><FaCamera /></button>
                                <button onClick={sendMessage} disabled={isSending} className={`p-5 rounded-full ${currentTheme.btn} active:scale-95 transition-all`}>
                                    {isSending ? <FaSyncAlt className="animate-spin" /> : <FaPaperPlane size={14} />}
                                </button>
                            </div>
                        </div>
                        <input type="file" ref={fileInputRef} hidden onChange={e => setSelectedFile(e.target.files[0])} />
                    </div>
                </div>
            </div>

            {/* CAMERA MODAL */}
            <AnimatePresence>
                {isCameraOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[600] bg-black flex flex-col items-center justify-center p-6">
                        <video ref={videoRef} autoPlay playsInline className="w-full max-w-md rounded-[2rem] border border-white/10" />
                        <div className="flex gap-10 mt-10">
                            <button onClick={closeCamera} className="p-5 bg-white/10 rounded-full"><FaTimes size={20}/></button>
                            <button onClick={() => { /* capture logic */ closeCamera(); }} className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center"><div className="w-14 h-14 bg-white rounded-full"/></button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
