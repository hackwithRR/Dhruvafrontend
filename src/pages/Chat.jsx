import React, { useEffect, useState, useRef } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import { FaPaperPlane, FaCamera, FaLock, FaSyncAlt, FaTimes, FaUndo, FaImage, FaPlus, FaHistory, FaUnlock, FaYoutube, FaArrowDown, FaTrash, FaClock, FaPlay, FaPause, FaStop } from "react-icons/fa";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { doc, getDoc, updateDoc, arrayUnion, setDoc, collection, query, where, getDocs, orderBy, limit, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";
import imageCompression from "browser-image-compression";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";

const API_BASE = (process.env.REACT_APP_API_URL || "https://dhruva-backend-production.up.railway.app").replace(/\/$/, "");

const formatContent = (text) => {
    return text.replace(/\$\$/g, '').replace(/\n\s*\n/g, '\n\n').trim();
};

// --- DRAGGABLE STUDY TIMER COMPONENT ---
const StudyTimer = ({ currentTheme }) => {
    const [timeLeft, setTimeLeft] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const timerRef = useRef(null);

    const playAlarm = () => {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "beep";
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

    const startTimer = (mins) => {
        setTimeLeft(mins * 60);
        setIsActive(true);
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    return (
        <motion.div 
            drag
            dragMomentum={false}
            initial={{ x: 20, y: 500 }}
            className="fixed z-[100] cursor-grab active:cursor-grabbing"
        >
            <motion.div 
                animate={{ width: isOpen ? "240px" : "64px", height: isOpen ? "280px" : "64px" }}
                className={`overflow-hidden rounded-[2rem] border backdrop-blur-3xl shadow-2xl flex flex-col ${currentTheme.aiBubble} border-white/20`}
            >
                {!isOpen ? (
                    <button onClick={() => setIsOpen(true)} className="w-full h-full flex items-center justify-center text-indigo-500">
                        <FaClock size={24} className={isActive ? "animate-spin-slow" : "animate-pulse"} />
                    </button>
                ) : (
                    <div className="p-5 flex flex-col h-full">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Focus Timer</span>
                            <button onClick={() => setIsOpen(false)}><FaTimes size={12} /></button>
                        </div>
                        
                        <div className="flex-1 flex flex-col items-center justify-center">
                            <h2 className="text-4xl font-black mb-6 font-mono tracking-tighter">
                                {formatTime(timeLeft)}
                            </h2>
                            
                            {timeLeft === 0 ? (
                                <div className="grid grid-cols-2 gap-2 w-full">
                                    {[15, 30, 45, 60].map(m => (
                                        <button key={m} onClick={() => startTimer(m)} className="py-2 rounded-xl bg-white/5 hover:bg-indigo-500 hover:text-white transition-all text-[10px] font-bold">
                                            {m}m
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex gap-4">
                                    <button onClick={() => setIsActive(!isActive)} className="p-4 rounded-full bg-indigo-500 text-white">
                                        {isActive ? <FaPause /> : <FaPlay />}
                                    </button>
                                    <button onClick={() => {setTimeLeft(0); setIsActive(false)}} className="p-4 rounded-full bg-red-500/20 text-red-500">
                                        <FaStop />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
};

const Typewriter = ({ text, onComplete }) => {
    const [displayedText, setDisplayedText] = useState("");
    const [cursor, setCursor] = useState(true);

    useEffect(() => {
        let i = 0;
        const interval = setInterval(() => {
            setDisplayedText(text.substring(0, i + 1));
            i++;
            if (i >= text.length) {
                clearInterval(interval);
                setCursor(false);
                if (onComplete) onComplete();
            }
        }, 15); 
        return () => clearInterval(interval);
    }, [text]);

    return (
        <div className="relative">
            <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                    p: ({node, ...props}) => <p className="mb-4 last:mb-0 leading-relaxed" {...props} />,
                    ul: ({node, ...props}) => <ul className="list-disc ml-4 mb-4" {...props} />,
                    ol: ({node, ...props}) => <ol className="list-decimal ml-4 mb-4" {...props} />,
                    li: ({node, ...props}) => <li className="mb-1" {...props} />,
                }}
            >
                {formatContent(displayedText)}
            </ReactMarkdown>
            {cursor && <motion.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.5 }} className="inline-block w-1 h-5 bg-indigo-500 ml-1" />}
        </div>
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
    const [theme, setTheme] = useState("dark");
    const [userData, setUserData] = useState({ board: "", class: "", language: "English" });
    const [showSetup, setShowSetup] = useState(false);
    const [showScrollBtn, setShowScrollBtn] = useState(false);

    const [isLocked, setIsLocked] = useState(false);
    const [subjectInput, setSubjectInput] = useState("");
    const [chapterInput, setChapterInput] = useState("");

    const [showSidebar, setShowSidebar] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [cameraFacing, setCameraFacing] = useState("environment");

    const messagesEndRef = useRef(null);
    const chatContainerRef = useRef(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const fileInputRef = useRef(null);

    const themes = {
        dark: { container: "bg-[#050505] text-white", nav: "bg-white/5 border-white/10 backdrop-blur-md", aiBubble: "bg-white/5 border border-white/10", userBubble: "bg-indigo-600 shadow-lg shadow-indigo-500/20", input: "bg-white/[0.03] border-white/10 text-white", button: "bg-indigo-600", sidebar: "bg-[#0A0A0A] border-r border-white/10", glow: "shadow-none" },
        light: { 
            container: "bg-gradient-to-br from-[#F8FAFF] via-[#F0F4FF] to-[#E0E7FF] text-[#1E293B]", 
            nav: "bg-white/40 border-white/40 backdrop-blur-xl shadow-[0_8px_32px_rgba(31,38,135,0.07)]", 
            aiBubble: "bg-white/70 backdrop-blur-md border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]", 
            userBubble: "bg-gradient-to-tr from-indigo-600 to-blue-500 text-white shadow-[0_10px_25px_rgba(79,70,229,0.4)]", 
            input: "bg-white/80 backdrop-blur-2xl border-white shadow-[0_20px_50px_rgba(31,38,135,0.1)] text-[#1E293B]", 
            button: "bg-gradient-to-r from-indigo-600 to-blue-600 hover:shadow-[0_0_20px_rgba(79,70,229,0.5)]", 
            sidebar: "bg-white/60 backdrop-blur-xl border-r border-white/20",
            glow: "shadow-[0_0_40px_rgba(255,255,255,0.8)]"
        },
        electric: { container: "bg-[#0F172A] text-white", nav: "bg-indigo-600/10 border-indigo-500/20", aiBubble: "bg-white/10 border border-indigo-500/30", userBubble: "bg-gradient-to-r from-purple-600 to-indigo-600", input: "bg-white/5 border-indigo-500/20 text-white", button: "bg-gradient-to-r from-pink-500 to-violet-600", sidebar: "bg-[#0F172A] border-r border-indigo-500/20", glow: "shadow-none" }
    };
    const currentTheme = themes[theme] || themes.dark;

    useEffect(() => {
        if (!currentUser) return;
        const initData = async () => {
            const userDoc = await getDoc(doc(db, "users", currentUser.uid));
            if (userDoc.exists()) {
                const data = userDoc.data();
                setUserData({ board: data.board || "", class: data.class || "", language: data.language || "English" });
                if (!data.board || !data.class) setShowSetup(true);
            } else { setShowSetup(true); }
            fetchSessions();
        };
        initData();
    }, [currentUser]);

    const fetchSessions = async () => {
        const q = query(collection(db, `users/${currentUser.uid}/sessions`), orderBy("lastUpdate", "desc"));
        const snap = await getDocs(q);
        setSessions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };

    const loadSession = async (sid) => {
        setCurrentSessionId(sid);
        const sDoc = await getDoc(doc(db, `users/${currentUser.uid}/sessions`, sid));
        if (sDoc.exists()) {
            const data = sDoc.data();
            setMessages(data.messages || []);
            // Optional: extract subject/chapter from title if you want to restore bar state
        }
        setShowSidebar(false);
    };

    const startNewSession = () => {
        setMessages([]);
        setCurrentSessionId(Date.now().toString());
        setSubjectInput("");
        setChapterInput("");
        setIsLocked(false);
        setShowSidebar(false);
    };

    const deleteSession = async (e, sid) => {
        e.stopPropagation();
        try {
            await deleteDoc(doc(db, `users/${currentUser.uid}/sessions`, sid));
            if (currentSessionId === sid) startNewSession();
            fetchSessions();
            toast.success("Session deleted");
        } catch (err) { toast.error("Failed to delete session"); }
    };

    const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    
    useEffect(() => { scrollToBottom(); }, [messages, isSending]);

    const handleScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 400);
    };

    const sendMessage = async () => {
        if (!currentUser || isSending || (!input.trim() && !selectedFile)) return;
        const file = selectedFile;
        const text = input;
        setIsSending(true);
        setSelectedFile(null);
        setInput("");

        const userMsg = { role: "user", content: text || "Analyzing attachment...", image: file ? URL.createObjectURL(file) : null, timestamp: Date.now() };
        const newMessages = [...messages, userMsg];
        setMessages(newMessages);

        try {
            const payload = { 
                userId: currentUser.uid, 
                message: text || "Explain this image", 
                mode, 
                subject: subjectInput || "General", 
                chapter: chapterInput || "General", 
                language: userData.language, 
                classLevel: userData.class,
                instructions: "Use emojis, be engaging, and use proper spacing between paragraphs."
            };
            
            let res;
            if (file) {
                const formData = new FormData();
                const compressed = await imageCompression(file, { maxSizeMB: 0.7 });
                formData.append("photo", compressed);
                Object.keys(payload).forEach(k => formData.append(k, payload[k]));
                res = await axios.post(`${API_BASE}/chat/photo`, formData);
            } else {
                res = await axios.post(`${API_BASE}/chat`, payload);
            }

            const queryParts = [userData.board, userData.class, subjectInput, chapterInput, text.slice(0, 40)].filter(Boolean);
            const searchQuery = `${queryParts.join(" ")} full explanation`;

            const aiMsg = { 
                role: "ai", 
                content: res.data.reply, 
                ytLink: `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`,
                timestamp: Date.now() 
            };
            
            const finalMessages = [...newMessages, aiMsg];
            setMessages(finalMessages);

            // Automatic Session Naming Logic
            const sessionTitle = subjectInput 
                ? `${subjectInput.toUpperCase()} - ${chapterInput || 'LESSON'}` 
                : (text.slice(0, 25) || "New Study Session");

            await setDoc(doc(db, `users/${currentUser.uid}/sessions`, currentSessionId), {
                messages: finalMessages,
                lastUpdate: Date.now(),
                title: sessionTitle
            }, { merge: true });
            
            fetchSessions();
        } catch (e) { toast.error("Server connection failed"); }
        setIsSending(false);
    };

    const closeCamera = () => { if (videoRef.current?.srcObject) videoRef.current.srcObject.getTracks().forEach(t => t.stop()); setIsCameraOpen(false); };
    const openCamera = async () => { setIsCameraOpen(true); try { const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: cameraFacing } }); if (videoRef.current) videoRef.current.srcObject = s; } catch (e) { setIsCameraOpen(false); } };
    const capturePhoto = () => { const c = canvasRef.current; const v = videoRef.current; c.width = v.videoWidth; c.height = v.videoHeight; c.getContext("2d").drawImage(v, 0, 0); c.toBlob(b => { setSelectedFile(new File([b], "cap.jpg", { type: "image/jpeg" })); closeCamera(); }, "image/jpeg", 0.8); };

    return (
        <div className={`flex h-screen w-full overflow-hidden transition-all duration-700 ${currentTheme.container}`}>
            <ToastContainer theme="dark" position="top-center" limit={1} />
            <style>{`.custom-y-scroll::-webkit-scrollbar { width: 4px; } .custom-y-scroll::-webkit-scrollbar-thumb { background: rgba(128, 128, 128, 0.2); border-radius: 10px; } .animate-spin-slow { animation: spin 3s linear infinite; } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

            <AnimatePresence>
                {showSidebar && (
                    <motion.div initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }} className={`fixed lg:relative z-[150] w-72 h-full flex flex-col p-6 overflow-hidden ${currentTheme.sidebar}`}>
                        <div className="flex justify-between items-center mb-10">
                            <span className="text-[10px] font-black tracking-widest uppercase opacity-40">Chat History</span>
                            <button onClick={() => setShowSidebar(false)} className={`${theme === 'light' ? 'text-black/50' : 'text-white/50'}`}><FaTimes /></button>
                        </div>
                        <motion.button 
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={startNewSession} 
                            className="w-full py-4 mb-6 rounded-2xl bg-indigo-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
                        >
                            <FaPlus /> New Session
                        </motion.button>
                        <div className="flex-1 overflow-y-auto space-y-3 custom-y-scroll">
                            {sessions.map((s) => (
                                <motion.div 
                                    layout
                                    key={s.id} 
                                    onClick={() => loadSession(s.id)} 
                                    className={`group relative w-full text-left p-4 rounded-2xl cursor-pointer transition-all ${currentSessionId === s.id ? 'bg-indigo-500/15 text-indigo-500 border border-indigo-500/20' : 'opacity-60 hover:opacity-100 hover:bg-black/5'}`}
                                >
                                    <div className="text-[10px] font-black uppercase truncate pr-8 tracking-tight">{s.title || "Untitled Chat"}</div>
                                    <div className="text-[8px] opacity-40 mt-1 font-bold">{new Date(s.lastUpdate).toLocaleDateString()}</div>
                                    <button onClick={(e) => deleteSession(e, s.id)} className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:scale-125 transition-all">
                                        <FaTrash size={10} />
                                    </button>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden">
                <Navbar currentUser={currentUser} theme={theme} setTheme={setTheme} logout={logout} />
                
                {/* DRAGGABLE TIMER */}
                <StudyTimer currentTheme={currentTheme} />

                {/* --- MODERN SESSION BAR --- */}
                <div className="max-w-4xl mx-auto w-full px-4 pt-4 flex flex-col md:flex-row items-stretch md:items-center gap-3">
                    <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowSidebar(!showSidebar)} 
                        className={`hidden md:flex items-center justify-center p-4 rounded-2xl border transition-all ${currentTheme.aiBubble} border-white/10 shadow-xl`}
                    >
                        <FaHistory size={16} className={theme === 'light' ? 'text-indigo-600' : 'text-indigo-400'} />
                    </motion.button>
                    
                    <motion.div 
                        layout
                        className={`flex-1 flex flex-col md:flex-row items-center gap-2 p-2 rounded-[2rem] border transition-all duration-500 relative overflow-hidden ${isLocked ? 'border-emerald-500/40 bg-emerald-500/5' : `${currentTheme.aiBubble} border-white/10 shadow-2xl`}`}
                    >
                        {/* Auto-Naming State Indicator */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2">
                             <div className={`text-[6px] font-black uppercase tracking-[0.2em] px-3 py-0.5 rounded-b-lg ${isLocked ? 'bg-emerald-500 text-white' : 'bg-indigo-500/20 text-indigo-500'}`}>
                                {isLocked ? "Session Locked" : "Setup Session"}
                             </div>
                        </div>

                        {/* INPUTS GROUP */}
                        <div className="flex items-center w-full flex-1 gap-3 px-4 py-2 mt-1">
                            <div className="flex-1 flex flex-col">
                                <label className={`text-[8px] font-bold uppercase tracking-wider mb-0.5 ${isLocked ? 'text-emerald-500' : 'text-indigo-500/60'}`}>Subject</label>
                                <input 
                                    disabled={isLocked} 
                                    value={subjectInput} 
                                    onChange={e => setSubjectInput(e.target.value)} 
                                    placeholder="Physics, Bio..." 
                                    className={`bg-transparent text-sm font-bold outline-none placeholder:opacity-20 ${isLocked ? 'text-emerald-500/90' : 'text-current'}`} 
                                />
                            </div>
                            
                            <div className="h-8 w-
