import React, { useEffect, useState, useRef } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import {
    FaPaperPlane, FaCamera, FaSyncAlt, FaTimes, FaMicrophone,
    FaImage, FaPlus, FaHistory, FaYoutube, FaTrash,
    FaClock, FaPlay, FaStop, FaTrophy, FaCheckCircle,
    FaWaveSquare, FaEdit, FaChevronLeft, FaHeadphones, FaCheck, FaCoins, FaBullseye, FaFire, FaChartLine, FaLayerGroup, FaBookOpen, FaHashtag, FaFolderOpen
} from "react-icons/fa";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import 'katex/dist/katex.min.css';
import { doc, getDoc, setDoc, collection, query, getDocs, orderBy, deleteDoc, updateDoc, increment, onSnapshot, limit } from "firebase/firestore";
import { db } from "../firebase";
import imageCompression from "browser-image-compression";
import { motion, AnimatePresence } from "framer-motion";

const API_BASE = (process.env.REACT_APP_API_URL || "https://dhruva-backend-production.up.railway.app").replace(/\/$/, "");

// --- 👑 CELEBRATION COMPONENTS ---
const CelebrationOverlay = ({ type, onClose }) => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[999] flex items-center justify-center bg-black/90 backdrop-blur-xl p-6">
        <motion.div initial={{ scale: 0.8, y: 100 }} animate={{ scale: 1, y: 0 }} className="bg-gradient-to-b from-indigo-500 to-purple-900 p-10 rounded-[3rem] text-center shadow-[0_0_80px_rgba(99,102,241,0.4)] border border-white/20 max-w-sm w-full">
            <div className="text-7xl mb-6">{type === 'level' ? '👑' : '🎯'}</div>
            <h2 className="text-4xl font-black text-white mb-2 italic tracking-tighter">{type === 'level' ? 'LEVEL UP' : 'GOAL REACHED'}</h2>
            <p className="text-indigo-100 text-sm mb-8 font-medium">{type === 'level' ? "New tier unlocked! Your knowledge is growing." : "Consistency pays off. +50 Bonus XP added!"}</p>
            <button onClick={onClose} className="w-full py-4 bg-white text-indigo-900 font-black rounded-2xl uppercase tracking-widest active:scale-95 transition-all">Continue</button>
        </motion.div>
    </motion.div>
);

// --- THEME DEFINITIONS ---
const themes = {
    DeepSpace: { bg: "bg-[#050505]", primary: "indigo-600", secondary: "fuchsia-600", text: "text-white" },
    Cyberpunk: { bg: "bg-[#0a0a0f]", primary: "cyan-500", secondary: "pink-500", text: "text-cyan-50" },
    Forest: { bg: "bg-[#050a05]", primary: "emerald-600", secondary: "lime-500", text: "text-emerald-50" },
    Sunset: { bg: "bg-[#0a0505]", primary: "orange-600", secondary: "rose-600", text: "text-orange-50" }
};

export default function Chat() {
    const { currentUser } = useAuth();
    const [messages, setMessages] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [currentSessionId, setCurrentSessionId] = useState(Date.now().toString());
    const [input, setInput] = useState("");
    const [mode, setMode] = useState("Explain");
    const [subject, setSubject] = useState("");
    const [chapter, setChapter] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [theme, setTheme] = useState("DeepSpace");
    const [userData, setUserData] = useState({ board: "CBSE", class: "10", xp: 0, dailyXP: 0, streak: 0, lastLogin: Date.now() });
    const [showSidebar, setShowSidebar] = useState(false);
    const [showSessionPicker, setShowSessionPicker] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [isListening, setIsListening] = useState(false);
    const [isLiveMode, setIsLiveMode] = useState(false);
    const [isAiSpeaking, setIsAiSpeaking] = useState(false);
    const [celebration, setCelebration] = useState(null);

    // Timer States
    const [timerActive, setTimerActive] = useState(false);
    const [timerTime, setTimerTime] = useState(0);
    const timerInterval = useRef(null);

    const messagesEndRef = useRef(null);
    const recognitionRef = useRef(null);
    const synthesisRef = useRef(window.speechSynthesis);
    const fileInputRef = useRef(null);

    const activeTheme = themes[theme] || themes.DeepSpace;

    // --- INITIAL DATA LOAD ---
    useEffect(() => {
        if (!currentUser) return;
        
        const userRef = doc(db, "users", currentUser.uid);
        const unsubscribe = onSnapshot(userRef, (snap) => {
            if (snap.exists()) setUserData(snap.data());
        });

        const q = query(collection(db, `users/${currentUser.uid}/sessions`), orderBy("lastUpdate", "desc"), limit(15));
        const unsubSessions = onSnapshot(q, (snap) => {
            setSessions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        return () => { unsubscribe(); unsubSessions(); };
    }, [currentUser]);

    // --- XP & LEVEL LOGIC ---
    const awardXP = async (amt) => {
        if (amt <= 0) return;
        const userRef = doc(db, "users", currentUser.uid);
        const currentLevel = Math.floor(userData.xp / 500);
        
        await updateDoc(userRef, { xp: increment(amt), dailyXP: increment(amt) });
        
        // Local state update for immediate celebration feedback
        const nextXP = (userData.xp || 0) + amt;
        const nextDaily = (userData.dailyXP || 0) + amt;
        if (Math.floor(nextXP / 500) > currentLevel) setCelebration('level');
        if (nextDaily >= 50 && userData.dailyXP < 50) {
            setCelebration('goal');
            awardXP(50); // Daily Goal Bonus
        }
    };

    // --- TIMER LOGIC ---
    useEffect(() => {
        if (timerActive) {
            timerInterval.current = setInterval(() => {
                setTimerTime(prev => prev + 1);
            }, 1000);
        } else {
            clearInterval(timerInterval.current);
            if (timerTime > 180) { // Every 3 mins
                awardXP(Math.floor(timerTime / 180));
                setTimerTime(0);
            }
        }
        return () => clearInterval(timerInterval.current);
    }, [timerActive]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // --- VOICE ENGINE ---
    const speak = (text) => {
        if (!isLiveMode) return;
        synthesisRef.current.cancel(); 
        const utter = new SpeechSynthesisUtterance(text.replace(/[*#_]/g, ""));
        
        const voices = synthesisRef.current.getVoices();
        utter.voice = voices.find(v => v.lang.includes("en") && v.localService) || voices[0];
        utter.rate = 1.0;

        utter.onstart = () => {
            setIsAiSpeaking(true);
            if (isListening) try { recognitionRef.current.stop(); } catch(e){}
        };
        utter.onend = () => {
            setIsAiSpeaking(false);
            if (isLiveMode) {
                setTimeout(() => {
                    try { recognitionRef.current.start(); } catch(e){}
                }, 1000);
            }
        };
        synthesisRef.current.speak(utter);
    };

    // --- MIC SETUP ---
    useEffect(() => {
        const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (Speech && !recognitionRef.current) {
            recognitionRef.current = new Speech();
            recognitionRef.current.continuous = false;
            recognitionRef.current.onstart = () => setIsListening(true);
            recognitionRef.current.onend = () => setIsListening(false);
            recognitionRef.current.onresult = (e) => {
                const text = e.results[0][0].transcript;
                setInput(text);
                sendMessage(text);
            };
        }
    }, []);

    // --- SEND LOGIC ---
    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const options = { maxSizeMB: 0.5, maxWidthOrHeight: 1024, useWebWorker: true };
        try {
            const compressed = await imageCompression(file, options);
            setSelectedFile(compressed);
            toast.success("Image Optimized");
        } catch (err) { toast.error("Compression Failed"); }
    };

    const sendMessage = async (override = null) => {
        const text = override || input;
        if (isSending || (!text.trim() && !selectedFile)) return;

        setIsSending(true);
        setInput("");
        const userMsg = { 
            role: "user", 
            content: text, 
            image: selectedFile ? await imageCompression.getDataUrlFromFile(selectedFile) : null 
        };
        setMessages(prev => [...prev, userMsg]);
        setSelectedFile(null);

        try {
            const payload = {
                userId: currentUser.uid,
                message: text,
                mode,
                subject,
                chapter,
                board: userData.board,
                classLevel: userData.class,
                hasImage: !!userMsg.image
            };

            const res = await axios.post(`${API_BASE}/chat`, payload);
            const reply = res.data.reply;

            let yt = null;
            if (text.length > 5) {
                yt = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${userData.board} ${userData.class} ${subject} ${text} lesson`)}`;
            }

            const aiMsg = { role: "ai", content: reply, ytLink: yt };
            setMessages(prev => [...prev, aiMsg]);

            if (isLiveMode) speak(reply);
            
            // Tiered XP Points
            let pts = 5;
            if (mode === "Quiz" && (reply.toLowerCase().includes("correct") || reply.toLowerCase().includes("right"))) pts = 20;
            awardXP(pts);

            // Save Session to Firebase
            await setDoc(doc(db, `users/${currentUser.uid}/sessions`, currentSessionId), {
                messages: [...messages, userMsg, aiMsg],
                lastUpdate: Date.now(),
                title: messages.length === 0 ? text.slice(0, 30) : null,
                subject, chapter
            }, { merge: true });

        } catch (err) {
            toast.error("Network Latency - Try Again");
        }
        setIsSending(false);
    };

    const loadSession = (s) => {
        setMessages(s.messages || []);
        setCurrentSessionId(s.id);
        setSubject(s.subject || "");
        setChapter(s.chapter || "");
        setShowSessionPicker(false);
        toast.info("Context Reloaded");
    };

    const deleteSession = async (id, e) => {
        e.stopPropagation();
        await deleteDoc(doc(db, `users/${currentUser.uid}/sessions`, id));
        toast.dark("Session Deleted");
    };

    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

    return (
        <div className={`flex h-[100dvh] w-full ${activeTheme.bg} ${activeTheme.text} overflow-hidden font-sans`}>
            <ToastContainer theme="dark" autoClose={2000} />
            
            <AnimatePresence>
                {celebration && <CelebrationOverlay type={celebration} onClose={() => setCelebration(null)} />}
            </AnimatePresence>

            {/* --- SIDEBAR --- */}
            <AnimatePresence>
                {showSidebar && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowSidebar(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" />
                        <motion.div initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }} className={`fixed inset-y-0 left-0 w-80 bg-[#0a0a0a] border-r border-white/10 z-[101] p-6 shadow-2xl flex flex-col`}>
                            <div className="flex justify-between items-center mb-8">
                                <span className="text-[10px] font-black opacity-40 uppercase tracking-widest">Dhruva Profile</span>
                                <button onClick={() => setShowSidebar(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors"><FaChevronLeft/></button>
                            </div>

                            {/* User Rank Card */}
                            <div className="p-5 bg-white/5 rounded-[2rem] border border-white/10 mb-6">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/20"><FaTrophy size={20}/></div>
                                    <div>
                                        <h3 className="text-lg font-black leading-none">Level {Math.floor((userData.xp || 0)/500) + 1}</h3>
                                        <p className="text-[10px] font-bold opacity-40 uppercase tracking-tight mt-1">Total {userData.xp || 0} XP</p>
                                    </div>
                                </div>
                                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden mb-2">
                                    <motion.div initial={{ width: 0 }} animate={{ width: `${((userData.xp || 0) % 500) / 5}%` }} className="h-full bg-gradient-to-r from-indigo-500 to-fuchsia-500" />
                                </div>
                                <div className="flex justify-between text-[10px] font-black opacity-30"><span>LVL {Math.floor((userData.xp || 0)/500) + 1}</span><span>{500 - ((userData.xp || 0) % 500)} XP TO NEXT</span></div>
                            </div>

                            <div className="flex-1 space-y-4 overflow-y-auto no-scrollbar">
                                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-[10px] font-black text-emerald-400 uppercase flex items-center gap-2"><FaBullseye/> Daily Goal</span>
                                        <span className="text-[10px] font-black text-emerald-400">{userData.dailyXP || 0}/50</span>
                                    </div>
                                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                        <motion.div animate={{ width: `${Math.min(((userData.dailyXP || 0) / 50) * 100, 100)}%` }} className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                    </div>
                                </div>

                                <div className="text-[10px] font-black opacity-20 uppercase tracking-widest pl-2">Personalize Theme</div>
                                <div className="grid grid-cols-2 gap-2">
                                    {Object.keys(themes).map(t => (
                                        <button key={t} onClick={() => setTheme(t)} className={`p-3 rounded-2xl border text-[10px] font-black uppercase transition-all ${theme === t ? 'bg-white text-black border-white shadow-lg' : 'bg-white/5 border-white/5 text-white/40 hover:border-white/20'}`}>{t}</button>
                                    ))}
                                </div>
                            </div>

                            <button onClick={() => { if(window.confirm("Logout?")) window.location.reload(); }} className="mt-6 flex items-center justify-center gap-2 p-4 bg-white/5 hover:bg-red-500/10 hover:text-red-500 rounded-3xl text-xs font-black uppercase tracking-widest transition-all">Logout</button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* --- MAIN CHAT LAYOUT --- */}
            <div className="flex-1 flex flex-col relative h-full">
                <Navbar currentUser={currentUser} userData={userData} />

                {/* --- CONTEXT BAR (SUBJECT/CHAPTER) --- */}
                <div className="w-full max-w-3xl mx-auto px-4 mt-2 z-[20]">
                    <div className="flex flex-wrap gap-2 p-2 bg-white/5 backdrop-blur-xl rounded-[2rem] border border-white/10 shadow-2xl">
                        <div className="flex items-center gap-2 bg-black/40 px-3 py-2 rounded-2xl border border-white/5 flex-1 min-w-[140px]">
                            <FaBookOpen size={12} className="text-indigo-400 opacity-60"/>
                            <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject..." className="bg-transparent border-none focus:ring-0 text-[10px] font-black uppercase w-full p-0 placeholder:opacity-30" />
                        </div>
                        <div className="flex items-center gap-2 bg-black/40 px-3 py-2 rounded-2xl border border-white/5 flex-1 min-w-[140px]">
                            <FaHashtag size={12} className="text-fuchsia-400 opacity-60"/>
                            <input value={chapter} onChange={(e) => setChapter(e.target.value)} placeholder="Chapter..." className="bg-transparent border-none focus:ring-0 text-[10px] font-black uppercase w-full p-0 placeholder:opacity-30" />
                        </div>
                        <div className="flex gap-1">
                            {["Explain", "Quiz", "HW"].map(m => (
                                <button key={m} onClick={() => setMode(m)} className={`px-4 py-2 rounded-2xl text-[10px] font-black transition-all uppercase ${mode === m ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-white/30 hover:bg-white/5'}`}>{m}</button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* --- CHAT AREA --- */}
                <div className="flex-1 overflow-y-auto p-4 md:p-10 no-scrollbar pb-60">
                    <div className="max-w-3xl mx-auto space-y-8">
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-20 opacity-20 grayscale scale-110 pointer-events-none">
                                <FaWaveSquare size={50} className="mb-4 animate-pulse text-indigo-500" />
                                <h1 className="text-sm font-black uppercase tracking-[0.5em]">Neural Link Online</h1>
                                <p className="text-[10px] mt-2 font-bold tracking-widest">{userData.board} {userData.class} Syllabus Loaded</p>
                            </div>
                        )}
                        {messages.map((msg, i) => (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`group relative p-6 rounded-[2.8rem] shadow-2xl max-w-[90%] transition-all ${msg.role === 'user' ? `bg-${activeTheme.primary} rounded-tr-none text-white` : 'bg-white/[0.03] border border-white/10 rounded-tl-none backdrop-blur-xl'}`}>
                                    {msg.image && <img src={msg.image} className="rounded-3xl mb-4 max-h-64 w-full object-cover border border-white/10 shadow-lg" alt="Upload" />}
                                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]} className="prose prose-invert text-[15px] leading-relaxed selection:bg-white/20">{msg.content}</ReactMarkdown>
                                    
                                    {msg.ytLink && (
                                        <a href={msg.ytLink} target="_blank" rel="noreferrer" className="mt-6 flex items-center justify-center gap-3 py-3.5 bg-red-600/10 hover:bg-red-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-wider border border-red-600/20 transition-all shadow-lg active:scale-95">
                                            <FaYoutube size={18}/> Visual Academy Link
                                        </a>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                        <div ref={messagesEndRef} className="h-10" />
                    </div>
                </div>

                {/* --- OVERLAY: SESSION PICKER --- */}
                <AnimatePresence>
                    {showSessionPicker && (
                        <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }} className="absolute inset-0 bg-black/95 z-[100] p-6 flex flex-col backdrop-blur-3xl">
                            <div className="flex justify-between items-center mb-10">
                                <div>
                                    <h3 className="text-2xl font-black uppercase italic tracking-tighter">Your Archive</h3>
                                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Select a previous neural session</p>
                                </div>
                                <button onClick={() => setShowSessionPicker(false)} className="p-4 bg-white/5 rounded-full hover:bg-white/10 transition-colors"><FaTimes size={20}/></button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto no-scrollbar pb-20">
                                {sessions.map(s => (
                                    <div key={s.id} onClick={() => loadSession(s)} className="group flex items-center justify-between p-6 bg-white/[0.03] border border-white/10 rounded-[2.5rem] hover:bg-indigo-600/20 hover:border-indigo-500/50 transition-all cursor-pointer">
                                        <div className="flex items-center gap-5">
                                            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all"><FaFolderOpen size={20}/></div>
                                            <div>
                                                <h4 className="text-sm font-black truncate max-w-[150px]">{s.title || "New Study Burst"}</h4>
                                                <p className="text-[9px] font-bold opacity-30 uppercase mt-1 tracking-widest">{new Date(s.lastUpdate).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <button onClick={(e) => deleteSession(s.id, e)} className="p-3 opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-500 transition-all"><FaTrash size={14}/></button>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* --- 🚀 DYNAMIC BOTTOM UI --- */}
                <div className="absolute bottom-0 left-0 w-full p-4 md:p-10 bg-gradient-to-t from-black via-black/90 to-transparent z-[50]">
                    <div className="max-w-3xl mx-auto space-y-6">
                        
                        {/* THE MODERN ACTION BUTTONS */}
                        <div className="flex items-center justify-between px-2">
                            <div className="flex gap-3">
                                <button onClick={() => setShowSidebar(true)} className="flex items-center gap-3 px-6 py-3.5 bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] text-indigo-300 hover:bg-white/10 hover:border-indigo-500/40 transition-all active:scale-95 shadow-2xl">
                                    <FaChartLine /> Statistics
                                </button>
                                <button onClick={() => setShowSessionPicker(true)} className="flex items-center gap-3 px-6 py-3.5 bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] text-fuchsia-300 hover:bg-white/10 hover:border-fuchsia-500/40 transition-all active:scale-95 shadow-2xl">
                                    <FaLayerGroup /> Sessions
                                </button>
                            </div>

                            {/* Timer Display */}
                            <div className="hidden md:flex items-center gap-4 bg-white/5 px-6 py-3 rounded-2xl border border-white/5">
                                <div className="flex flex-col items-end">
                                    <span className="text-[8px] font-black opacity-30 uppercase">Study Timer</span>
                                    <span className="text-xs font-mono font-black text-emerald-400">{formatTime(timerTime)}</span>
                                </div>
                                <button onClick={() => setTimerActive(!timerActive)} className={`p-2 rounded-xl transition-all ${timerActive ? 'bg-red-500/20 text-red-500' : 'bg-emerald-500/20 text-emerald-500'}`}>
                                    {timerActive ? <FaStop size={14}/> : <FaPlay size={14}/>}
                                </button>
                            </div>
                        </div>

                        {/* PREMIUM INPUT CAPSULE */}
                        <div className="bg-[#121212] border border-white/10 rounded-[2.8rem] p-2 flex items-end gap-2 shadow-[0_30px_70px_rgba(0,0,0,0.7)] focus-within:ring-2 ring-indigo-500/40 transition-all">
                            <button onClick={() => fileInputRef.current.click()} className="p-4 text-white/20 hover:text-white transition-colors">
                                <FaImage size={22}/>
                                <input type="file" ref={fileInputRef} hidden onChange={handleFileSelect} />
                            </button>
                            
                            <textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder={isLiveMode ? "AI is listening..." : `Ask about ${subject || 'your studies'}...`} rows="1" className="flex-1 bg-transparent border-none focus:ring-0 text-[16px] py-4 resize-none no-scrollbar font-medium placeholder:opacity-30" onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }} />

                            <div className="flex items-center gap-2 pr-2 pb-1.5">
                                {/* Waveform Visualizer */}
                                {(isAiSpeaking || isListening) && (
                                    <div className="flex gap-1 px-2 items-center h-5">
                                        {[1,2,3,4].map(i => <motion.div key={i} animate={{ height: [4, 22, 4] }} transition={{ repeat: Infinity, duration: 0.5, delay: i*0.1 }} className="w-1 bg-indigo-500 rounded-full"/>)}
                                    </div>
                                )}

                                <button 
                                    onClick={() => {
                                        setIsLiveMode(!isLiveMode);
                                        if(!isLiveMode) {
                                            const wake = new SpeechSynthesisUtterance("Listening");
                                            wake.volume = 0; synthesisRef.current.speak(wake); // Audio Unlock
                                            setTimeout(() => { try { recognitionRef.current.start(); } catch(e) {} }, 200);
                                        } else {
                                            synthesisRef.current.cancel();
                                            try { recognitionRef.current.stop(); } catch(e) {}
                                        }
                                    }}
                                    className={`p-4 rounded-full transition-all ${isLiveMode ? 'bg-indigo-600 text-white shadow-indigo-600/50 scale-110' : 'bg-white/5 text-white/30 hover:bg-white/10'}`}
                                >
                                    <FaHeadphones size={22} />
                                </button>
                                
                                <button onClick={() => sendMessage()} className={`p-4.5 rounded-full transition-all ${!input.trim() && !selectedFile ? 'bg-white/5 text-white/10' : 'bg-white text-black hover:bg-indigo-50 shadow-xl active:scale-95'}`}>
                                    {isSending ? <FaSyncAlt className="animate-spin" size={18}/> : <FaPaperPlane size={18} />}
                                </button>
                            </div>
                        </div>
                        
                        <div className="flex justify-center md:hidden">
                             <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                                <span className="text-xs font-mono font-black text-emerald-400">{formatTime(timerTime)}</span>
                                <button onClick={() => setTimerActive(!timerActive)} className={`p-1.5 rounded-lg ${timerActive ? 'text-red-500' : 'text-emerald-500'}`}>
                                    {timerActive ? <FaStop size={12}/> : <FaPlay size={12}/>}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
