import React, { useEffect, useState, useRef } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import {
    FaPaperPlane, FaSyncAlt, FaTimes, FaImage, FaHistory, FaYoutube, FaTrash,
    FaPlay, FaStop, FaTrophy, FaChevronLeft, FaHeadphones, FaChartLine, 
    FaLayerGroup, FaBookOpen, FaHashtag, FaFolderOpen, FaMicrophone, FaVolumeUp, FaFire, FaWaveSquare
} from "react-icons/fa";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import 'katex/dist/katex.min.css';
import { doc, setDoc, collection, query, updateDoc, increment, onSnapshot, orderBy, limit, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";
import imageCompression from "browser-image-compression";
import { motion, AnimatePresence } from "framer-motion";

const API_BASE = (process.env.REACT_APP_API_URL || "https://dhruva-backend-production.up.railway.app").replace(/\/$/, "");

// --- 🎨 THEME ENGINE DEFINITION ---
const themes = {
    DeepSpace: { 
        bg: "bg-[#050505]", 
        primary: "indigo-600", 
        primaryHex: "#4f46e5",
        secondary: "fuchsia-600", 
        text: "text-white", 
        accent: "text-indigo-400", 
        card: "bg-white/[0.03]",
        border: "border-white/10"
    },
    Cyberpunk: { 
        bg: "bg-[#0a0a0f]", 
        primary: "cyan-500", 
        primaryHex: "#06b6d4",
        secondary: "pink-500", 
        text: "text-cyan-50", 
        accent: "text-cyan-400", 
        card: "bg-cyan-950/20",
        border: "border-cyan-500/20"
    },
    Forest: { 
        bg: "bg-[#050a05]", 
        primary: "emerald-600", 
        primaryHex: "#059669",
        secondary: "lime-500", 
        text: "text-emerald-50", 
        accent: "text-emerald-400", 
        card: "bg-emerald-950/20",
        border: "border-emerald-500/20"
    },
    Sunset: { 
        bg: "bg-[#0a0505]", 
        primary: "orange-600", 
        primaryHex: "#ea580c",
        secondary: "rose-600", 
        text: "text-orange-50", 
        accent: "text-orange-400", 
        card: "bg-rose-950/20",
        border: "border-rose-500/20"
    },
    Midnight: { 
        bg: "bg-[#000000]", 
        primary: "blue-700", 
        primaryHex: "#1d4ed8",
        secondary: "slate-500", 
        text: "text-blue-50", 
        accent: "text-blue-400", 
        card: "bg-blue-900/10",
        border: "border-blue-500/20"
    }
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
    const [userData, setUserData] = useState({ board: "CBSE", class: "10", xp: 0, streak: 0 });
    const [showSidebar, setShowSidebar] = useState(false);
    const [showSessionPicker, setShowSessionPicker] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [isListening, setIsListening] = useState(false);
    const [isLiveMode, setIsLiveMode] = useState(false);
    const [isAiSpeaking, setIsAiSpeaking] = useState(false);

    const recognitionRef = useRef(null);
    const synthesisRef = useRef(window.speechSynthesis);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const activeTheme = themes[theme] || themes.DeepSpace;

    // --- 🔊 PRECISE MALE VOICE ENGINE ---
    const getMaleVoice = () => {
        const voices = synthesisRef.current.getVoices();
        // Look for common high-quality male voices across OS
        return voices.find(v => 
            (v.name.toLowerCase().includes("male") || 
             v.name.toLowerCase().includes("david") || 
             v.name.toLowerCase().includes("guy") || 
             v.name.toLowerCase().includes("james") ||
             v.name.toLowerCase().includes("google uk english male")) && v.lang.includes("en")
        ) || voices.find(v => v.lang.includes("en")) || voices[0];
    };

    // Priming voices (Required for Chrome/Safari delay)
    useEffect(() => {
        const loadVoices = () => { synthesisRef.current.getVoices(); };
        loadVoices();
        if (synthesisRef.current.onvoiceschanged !== undefined) {
            synthesisRef.current.onvoiceschanged = loadVoices;
        }
    }, []);

    const speak = (text) => {
        if (!isLiveMode) return;
        synthesisRef.current.cancel(); 
        const utter = new SpeechSynthesisUtterance(text.replace(/[*#_]/g, ""));
        utter.voice = getMaleVoice();
        utter.rate = 1.0;
        utter.pitch = 0.85; // Lower pitch for deeper male voice

        utter.onstart = () => {
            setIsAiSpeaking(true);
            if (recognitionRef.current) try { recognitionRef.current.stop(); } catch(e) {}
        };
        utter.onend = () => {
            setIsAiSpeaking(false);
            if (isLiveMode) {
                setTimeout(() => { 
                    try { recognitionRef.current.start(); } catch(e) {} 
                }, 500);
            }
        };
        synthesisRef.current.speak(utter);
    };

    // --- 🎤 MIC CONTROLLER ---
    useEffect(() => {
        const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (Speech && !recognitionRef.current) {
            recognitionRef.current = new Speech();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.onstart = () => setIsListening(true);
            recognitionRef.current.onend = () => setIsListening(false);
            recognitionRef.current.onresult = (e) => {
                const transcript = e.results[0][0].transcript;
                if (transcript.trim()) sendMessage(transcript);
            };
        }
    }, []);

    const toggleLiveMode = () => {
        if (!isLiveMode) {
            setIsLiveMode(true);
            const intro = new SpeechSynthesisUtterance("Neural link established. I'm ready.");
            intro.voice = getMaleVoice();
            synthesisRef.current.speak(intro);
            setTimeout(() => { try { recognitionRef.current.start(); } catch(e) {} }, 1200);
        } else {
            setIsLiveMode(false);
            synthesisRef.current.cancel();
            try { recognitionRef.current.stop(); } catch(e) {}
        }
    };

    // --- 📂 DATA SYNC (FIREBASE) ---
    useEffect(() => {
        if (!currentUser) return;
        const userRef = doc(db, "users", currentUser.uid);
        const unsubUser = onSnapshot(userRef, (snap) => snap.exists() && setUserData(snap.data()));
        
        const sessionsQuery = query(
            collection(db, `users/${currentUser.uid}/sessions`), 
            orderBy("lastUpdate", "desc"), 
            limit(20)
        );
        const unsubSessions = onSnapshot(sessionsQuery, (snap) => {
            setSessions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        
        return () => { unsubUser(); unsubSessions(); };
    }, [currentUser]);

    // --- 📸 IMAGE PROCESSING ---
    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            const options = { maxSizeMB: 0.5, maxWidthOrHeight: 1024, useWebWorker: true };
            const compressed = await imageCompression(file, options);
            setSelectedFile(compressed);
            toast.success("Image Ready for Analysis");
        } catch (err) { toast.error("File Error"); }
    };

    // --- 📩 MESSAGE HANDLER ---
    const sendMessage = async (override = null) => {
        const text = override || input;
        if (isSending || (!text.trim() && !selectedFile)) return;
        
        setIsSending(true);
        setInput("");
        
        let imgBase64 = null;
        if (selectedFile) {
            imgBase64 = await imageCompression.getDataUrlFromFile(selectedFile);
        }

        const userMsg = { role: "user", content: text, image: imgBase64, timestamp: Date.now() };
        const updatedMessages = [...messages, userMsg];
        setMessages(updatedMessages);
        setSelectedFile(null);

        try {
            const res = await axios.post(`${API_BASE}/chat`, {
                userId: currentUser.uid,
                message: text,
                mode,
                subject,
                chapter,
                image: imgBase64,
                board: userData.board,
                class: userData.class
            });

            const aiMsg = { 
                role: "ai", 
                content: res.data.reply, 
                timestamp: Date.now(),
                ytLink: text.length > 4 ? `https://www.youtube.com/results?search_query=${encodeURIComponent(`${userData.board} ${subject} ${text}`)}` : null
            };

            const finalMessages = [...updatedMessages, aiMsg];
            setMessages(finalMessages);
            if (isLiveMode) speak(res.data.reply);

            // Sync with Firebase
            await setDoc(doc(db, `users/${currentUser.uid}/sessions`, currentSessionId), {
                messages: finalMessages,
                lastUpdate: Date.now(),
                title: messages.length === 0 ? text.slice(0, 25) : null,
                subject,
                chapter
            }, { merge: true });

            await updateDoc(doc(db, "users", currentUser.uid), { xp: increment(selectedFile ? 25 : 10) });

        } catch (err) {
            toast.error("Connection Interrupted");
            console.error(err);
        }
        setIsSending(false);
    };

    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

    return (
        <div className={`flex h-[100dvh] w-full ${activeTheme.bg} ${activeTheme.text} overflow-hidden font-sans transition-all duration-700`}>
            <ToastContainer theme="dark" hideProgressBar />

            {/* --- 💎 FULLSCREEN LIVE OVERLAY --- */}
            <AnimatePresence>
                {isLiveMode && (
                    <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25 }} className="fixed inset-0 z-[600] bg-black flex flex-col items-center justify-between py-24 px-10">
                        <div className="flex flex-col items-center gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-ping" />
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Voice Interface Active</span>
                            </div>
                            <h1 className="text-4xl font-black italic tracking-tighter uppercase">{subject || "Learning"}</h1>
                        </div>

                        <div className="relative flex items-center justify-center">
                            <motion.div 
                                animate={{ 
                                    scale: isAiSpeaking ? [1, 1.1, 1] : 1,
                                    borderColor: isAiSpeaking ? activeTheme.primaryHex : "rgba(255,255,255,0.1)"
                                }} 
                                transition={{ repeat: Infinity, duration: 1.5 }}
                                className="w-64 h-64 rounded-full border-4 flex items-center justify-center bg-white/[0.02] backdrop-blur-3xl shadow-[0_0_100px_rgba(0,0,0,1)]"
                            >
                                <div className="flex items-end gap-1.5 h-16">
                                    {[...Array(6)].map((_, i) => (
                                        <motion.div 
                                            key={i} 
                                            animate={{ height: isAiSpeaking ? [10, 60, 10] : 4 }} 
                                            transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }} 
                                            className="w-2 bg-indigo-500 rounded-full" 
                                        />
                                    ))}
                                </div>
                            </motion.div>
                            {isListening && (
                                <motion.div 
                                    initial={{ scale: 0.8, opacity: 0 }} 
                                    animate={{ scale: 2, opacity: 0 }} 
                                    transition={{ repeat: Infinity, duration: 2 }} 
                                    className="absolute w-64 h-64 bg-indigo-500/20 rounded-full -z-10" 
                                />
                            )}
                        </div>

                        <div className="flex flex-col items-center gap-8">
                            <p className="text-sm font-bold tracking-widest uppercase text-white/40">
                                {isAiSpeaking ? "Dhruva is explaining..." : isListening ? "Listening to you..." : "Ready"}
                            </p>
                            <button onClick={toggleLiveMode} className="p-10 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 transition-all active:scale-90 shadow-2xl">
                                <FaTimes size={35} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- 🛠️ SIDEBAR SETTINGS --- */}
            <AnimatePresence>
                {showSidebar && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowSidebar(false)} className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[450]" />
                        <motion.div initial={{ x: -400 }} animate={{ x: 0 }} exit={{ x: -400 }} className="fixed inset-y-0 left-0 w-80 bg-[#0a0a0a] border-r border-white/10 z-[451] p-10 flex flex-col">
                            <div className="flex justify-between items-center mb-12">
                                <h3 className="text-xl font-black italic uppercase">System</h3>
                                <button onClick={() => setShowSidebar(false)} className="p-3 bg-white/5 rounded-full"><FaChevronLeft/></button>
                            </div>

                            <div className="space-y-10 overflow-y-auto no-scrollbar">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30 px-2">Core Theme</label>
                                    <div className="grid grid-cols-1 gap-2">
                                        {Object.keys(themes).map(t => (
                                            <button key={t} onClick={() => setTheme(t)} className={`p-5 rounded-2xl border text-left flex items-center justify-between transition-all ${theme === t ? 'bg-white text-black border-white' : 'bg-white/5 border-white/5 text-white/40'}`}>
                                                <span className="text-[11px] font-black uppercase tracking-wider">{t}</span>
                                                {theme === t && <div className="w-2 h-2 bg-black rounded-full" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="p-8 bg-white/5 rounded-[2rem] border border-white/5">
                                    <FaTrophy className="text-yellow-500 mb-4" size={24}/>
                                    <div className="text-4xl font-black tracking-tighter">{userData.xp || 0}</div>
                                    <div className="text-[10px] font-bold opacity-30 uppercase tracking-[0.3em] mt-1">Knowledge XP Earned</div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* --- 💬 MAIN CHAT HUB --- */}
            <div className="flex-1 flex flex-col relative h-full">
                <Navbar currentUser={currentUser} userData={userData} />

                {/* Sticky Context Bar */}
                <div className="w-full max-w-3xl mx-auto px-4 mt-4 z-50">
                    <div className="flex flex-wrap gap-2 p-2 bg-white/5 backdrop-blur-3xl rounded-3xl border border-white/10 shadow-2xl">
                        <div className="flex items-center gap-3 bg-black/40 px-5 py-3 rounded-2xl border border-white/5 flex-1 min-w-[140px]">
                            <FaBookOpen size={14} className={activeTheme.accent}/>
                            <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject..." className="bg-transparent border-none focus:ring-0 text-[11px] font-black uppercase w-full p-0 placeholder:opacity-20" />
                        </div>
                        <div className="flex items-center gap-3 bg-black/40 px-5 py-3 rounded-2xl border border-white/5 flex-1 min-w-[140px]">
                            <FaHashtag size={14} className="text-fuchsia-400"/>
                            <input value={chapter} onChange={(e) => setChapter(e.target.value)} placeholder="Chapter..." className="bg-transparent border-none focus:ring-0 text-[11px] font-black uppercase w-full p-0 placeholder:opacity-20" />
                        </div>
                    </div>
                </div>

                {/* Message Scroll */}
                <div className="flex-1 overflow-y-auto p-4 md:p-12 no-scrollbar pb-64">
                    <div className="max-w-3xl mx-auto space-y-12">
                        {messages.length === 0 && (
                            <div className="h-96 flex flex-col items-center justify-center opacity-10">
                                <FaWaveSquare size={80} className="mb-8 animate-pulse text-indigo-500"/>
                                <h2 className="text-2xl font-black uppercase tracking-[1em] text-center">Neural Ready</h2>
                            </div>
                        )}
                        {messages.map((msg, i) => (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`p-8 rounded-[3rem] shadow-2xl max-w-[94%] relative overflow-hidden transition-all ${msg.role === 'user' ? `bg-${activeTheme.primary} rounded-tr-none text-white` : `${activeTheme.card} border border-white/10 rounded-tl-none backdrop-blur-2xl`}`}>
                                    {msg.image && (
                                        <div className="mb-6 rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl">
                                            <img src={msg.image} className="w-full max-h-96 object-cover" alt="Neural Visual" />
                                        </div>
                                    )}
                                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]} className="prose prose-invert text-[16px] leading-relaxed selection:bg-indigo-500/30">{msg.content}</ReactMarkdown>
                                    {msg.ytLink && (
                                        <a href={msg.ytLink} target="_blank" rel="noreferrer" className="mt-8 flex items-center justify-center gap-3 py-5 bg-red-600/10 hover:bg-red-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] transition-all border border-red-600/20 shadow-xl"><FaYoutube size={20}/> Video Supplement</a>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                        <div ref={messagesEndRef} className="h-8" />
                    </div>
                </div>

                {/* --- 🚀 ACTION POD --- */}
                <div className="absolute bottom-0 left-0 w-full p-4 md:p-12 bg-gradient-to-t from-black via-black/90 to-transparent z-[400]">
                    <div className="max-w-3xl mx-auto space-y-6">
                        
                        <div className="flex items-center justify-between px-4">
                            <div className="flex gap-3">
                                <button onClick={() => setShowSidebar(true)} className="flex items-center gap-3 px-8 py-4.5 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-indigo-300 active:scale-95 transition-all"><FaChartLine /> System</button>
                                <button onClick={() => setShowSessionPicker(true)} className="flex items-center gap-3 px-8 py-4.5 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-fuchsia-300 active:scale-95 transition-all"><FaLayerGroup /> Archive</button>
                            </div>
                            <div className="flex gap-2 bg-black/60 p-1.5 rounded-2xl border border-white/5">
                                {["Explain", "Quiz", "HW"].map(m => (
                                    <button key={m} onClick={() => setMode(m)} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${mode === m ? 'bg-white text-black shadow-xl' : 'text-white/20 hover:text-white/40'}`}>{m}</button>
                                ))}
                            </div>
                        </div>

                        <div className="bg-[#111111] border border-white/10 rounded-[3.5rem] p-3 flex items-end gap-3 shadow-[0_40px_80px_-20px_rgba(0,0,0,1)] focus-within:ring-2 ring-indigo-500/50 transition-all">
                            <button onClick={() => fileInputRef.current.click()} className="p-5 text-white/20 hover:text-white transition-all hover:rotate-12">
                                <FaImage size={24}/>
                                <input type="file" ref={fileInputRef} hidden onChange={handleFileSelect} accept="image/*" />
                            </button>
                            
                            <textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask anything or upload a photo..." rows="1" className="flex-1 bg-transparent border-none focus:ring-0 text-[17px] py-5 resize-none no-scrollbar font-medium placeholder:opacity-20" onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }} />

                            <div className="flex items-center gap-3 pr-4 pb-3">
                                <button onClick={toggleLiveMode} className={`p-5 rounded-full transition-all ${isLiveMode ? 'bg-indigo-600 text-white' : 'bg-white/5 text-white/20 hover:bg-white/10 shadow-inner'}`}>
                                    <FaHeadphones size={24} />
                                </button>
                                <button onClick={() => sendMessage()} className={`p-5.5 rounded-full transition-all ${!input.trim() && !selectedFile ? 'bg-white/5 text-white/5' : 'bg-white text-black active:scale-90 shadow-2xl'}`}>
                                    {isSending ? <FaSyncAlt className="animate-spin" size={20}/> : <FaPaperPlane size={20} />}
                                </button>
                            </div>
                        </div>
                        {selectedFile && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[10px] text-indigo-400 font-black px-12 flex items-center gap-2">● Visual Capture Staged</motion.div>}
                    </div>
                </div>
            </div>

            {/* --- 📁 SESSION ARCHIVE --- */}
            <AnimatePresence>
                {showSessionPicker && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-0 z-[700] bg-black/95 backdrop-blur-3xl p-10 flex flex-col items-center">
                        <div className="w-full max-w-5xl flex justify-between items-center mb-16">
                            <div>
                                <h3 className="text-4xl font-black uppercase italic tracking-tighter">Your Archive</h3>
                                <p className="text-[11px] font-bold opacity-30 uppercase tracking-[0.4em] mt-2">Resume previous neural patterns</p>
                            </div>
                            <button onClick={() => setShowSessionPicker(false)} className="p-6 bg-white/5 rounded-full border border-white/10"><FaTimes size={25}/></button>
                        </div>
                        <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto no-scrollbar pb-32">
                            {sessions.map(s => (
                                <div key={s.id} onClick={() => { setMessages(s.messages || []); setCurrentSessionId(s.id); setShowSessionPicker(false); }} className="group p-8 bg-white/[0.03] border border-white/5 rounded-[3rem] hover:bg-indigo-600/10 hover:border-indigo-500/40 transition-all cursor-pointer relative">
                                    <div className="flex flex-col h-full justify-between">
                                        <div>
                                            <FaFolderOpen className="text-indigo-400/40 group-hover:text-indigo-400 mb-6 transition-colors" size={26}/>
                                            <h4 className="text-xl font-black truncate leading-tight">{s.title || "Untitled Lesson"}</h4>
                                            <p className="text-[10px] font-bold opacity-20 uppercase tracking-widest mt-2">{new Date(s.lastUpdate).toLocaleDateString()}</p>
                                        </div>
                                        <div className="flex justify-end mt-8">
                                            <button onClick={(e) => { e.stopPropagation(); deleteDoc(doc(db, `users/${currentUser.uid}/sessions`, s.id)); }} className="p-3 text-white/10 hover:text-red-500 transition-colors"><FaTrash size={15}/></button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
