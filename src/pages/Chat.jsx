import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import {
    FaPaperPlane, FaSyncAlt, FaTimes, FaImage, FaHistory, FaYoutube, FaTrash,
    FaPlay, FaStop, FaTrophy, FaChevronLeft, FaHeadphones, FaChartLine, 
    FaLayerGroup, FaBookOpen, FaHashtag, FaFolderOpen, FaMicrophone, FaVolumeUp, 
    FaFire, FaWaveSquare, FaSun, FaEdit, FaCheck, FaClock, FaSignOutAlt, FaMedal, FaBrain
} from "react-icons/fa";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import 'katex/dist/katex.min.css';
import { 
    doc, setDoc, collection, query, updateDoc, increment, onSnapshot, 
    orderBy, limit, deleteDoc, getDocs, where 
} from "firebase/firestore";
import { db, auth } from "../firebase";
import imageCompression from "browser-image-compression";
import { motion, AnimatePresence } from "framer-motion";

const API_BASE = (process.env.REACT_APP_API_URL || "https://dhruva-backend-production.up.railway.app").replace(/\\/$/, "");

const syllabusData = {
    CBSE: {
        "8": {
            "MATHEMATICS": ["Rational Numbers", "Linear Equations", "Understanding Quadrilaterals", "Data Handling", "Squares and Roots", "Cubes and Roots", "Comparing Quantities", "Algebraic Expressions", "Mensuration", "Exponents", "Factorisation"],
            "SCIENCE": ["Crop Production", "Microorganisms", "Coal and Petroleum", "Combustion", "Cell Structure", "Force and Pressure", "Friction", "Sound", "Light"]
        },
        "10": {
            "MATHEMATICS": ["Real Numbers", "Polynomials", "Linear Equations", "Quadratic Equations", "Arithmetic Progressions", "Triangles", "Coordinate Geometry", "Trigonometry", "Circles", "Surface Areas", "Statistics", "Probability"],
            "SCIENCE": ["Chemical Reactions", "Acids, Bases and Salts", "Metals and Non-metals", "Carbon Compounds", "Life Processes", "Control and Coordination", "Reproduction", "Heredity", "Light Reflection", "Human Eye", "Electricity", "Magnetic Effects"]
        },
        "12": {
            "PHYSICS": ["Electrostatics", "Current Electricity", "Magnetic Effects", "EMI", "Alternating Current", "EM Waves", "Ray Optics", "Wave Optics", "Dual Nature", "Atoms", "Nuclei", "Semiconductors"],
            "CHEMISTRY": ["Solutions", "Electrochemistry", "Chemical Kinetics", "d & f Block", "Coordination Compounds", "Haloalkanes", "Alcohols & Phenols", "Aldehydes & Ketones", "Amines", "Biomolecules"]
        }
    },
    ICSE: {
        "10": {
            "MATHEMATICS": ["Quadratic Equations", "Linear Inequations", "Ratio & Proportion", "Matrices", "Arithmetic Progression", "Similarity", "Trigonometry", "Statistics"],
            "PHYSICS": ["Force", "Work, Power, Energy", "Machines", "Refraction", "Spectrum", "Sound", "Electricity", "Radioactivity"]
        }
    }
};

const themes = {
    DeepSpace: { bg: "bg-[#050505]", primary: "indigo-600", primaryHex: "#4f46e5", text: "text-white", accent: "text-indigo-400", card: "bg-white/[0.03]", border: "border-white/10", isDark: true },
    Light: { bg: "bg-[#f8fafc]", primary: "indigo-600", primaryHex: "#4f46e5", text: "text-slate-900", accent: "text-indigo-600", card: "bg-white shadow-sm", border: "border-slate-200", isDark: false },
    Cyberpunk: { bg: "bg-[#0a0a0f]", primary: "cyan-500", primaryHex: "#06b6d4", text: "text-cyan-50", accent: "text-cyan-400", card: "bg-cyan-950/20", border: "border-cyan-500/20", isDark: true }
};

export default function Chat() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [messages, setMessages] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [leaderboard, setLeaderboard] = useState([]);
    const [currentSessionId, setCurrentSessionId] = useState(Date.now().toString());
    const [sessionTitle, setSessionTitle] = useState("New Lesson");
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    
    const [input, setInput] = useState("");
    const [mode, setMode] = useState("Explain");
    const [subject, setSubject] = useState("MATHEMATICS");
    const [chapter, setChapter] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [theme, setTheme] = useState("DeepSpace");
    const [userData, setUserData] = useState({ board: "CBSE", class: "10", xp: 0, dailyXp: 0, streak: 0 });
    const [timer, setTimer] = useState(0);
    const [showSidebar, setShowSidebar] = useState(false);
    const [showSessionPicker, setShowSessionPicker] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    // Voice States
    const [isLiveMode, setIsLiveMode] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isAiSpeaking, setIsAiSpeaking] = useState(false);

    const recognitionRef = useRef(null);
    const synthesisRef = useRef(window.speechSynthesis);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const activeTheme = themes[theme] || themes.DeepSpace;

    // --- 🤖 GEMINI LIVE VOICE ENGINE (FULLY FIXED) ---
    const getMaleVoice = useCallback(() => {
        const voices = synthesisRef.current.getVoices();
        return voices.find(v => 
            v.name.toLowerCase().includes("google uk english male") || 
            v.name.toLowerCase().includes("david") || 
            v.lang === 'en-GB'
        ) || voices.find(v => v.lang.startsWith('en')) || voices[0];
    }, []);

    const startListening = useCallback(() => {
        if (!isLiveMode || isAiSpeaking) return;
        
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            toast.error("Speech Recognition not supported. Try Chrome.");
            return;
        }

        // Stop any existing recognition
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }

        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'en-US';
        
        recognitionRef.current.onstart = () => {
            setIsListening(true);
            console.log('🔴 Listening started');
        };
        
        recognitionRef.current.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            setIsListening(false);
            if (event.error !== 'aborted') {
                toast.error(`Recognition error: ${event.error}`);
            }
        };
        
        recognitionRef.current.onend = () => {
            setIsListening(false);
            console.log('🔴 Listening ended');
            // Auto-restart for continuous listening
            if (isLiveMode && !isAiSpeaking) {
                setTimeout(startListening, 250);
            }
        };
        
        recognitionRef.current.onresult = (event) => {
            // Handle continuous results properly
            let transcript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                transcript += event.results[i][0].transcript;
            }
            transcript = transcript.trim();
            if (transcript) {
                console.log('🎤 Captured:', transcript);
                sendMessage(transcript);
            }
        };
        
        try {
            recognitionRef.current.start();
        } catch (error) {
            console.error('Start recognition failed:', error);
            toast.error("Microphone access denied or failed");
        }
    }, [isLiveMode, isAiSpeaking, sendMessage]);

    const speak = useCallback((text) => {
        if (!isLiveMode) return;
        
        synthesisRef.current.cancel();
        
        // FIXED REGEX - No invalid backslash flags
        const cleanText = text
            .replace(/[*_`~]/g, '')  // Remove markdown chars
            .replace(/\[[^\]]*\]/g, '')  // Remove [math] blocks safely
            .replace(/\n/g, ' ')
            .trim();
            
        if (!cleanText) return;

        const utterance = new SpeechSynthesisUtterance(cleanText);
        const voice = getMaleVoice();
        if (voice) utterance.voice = voice;
        utterance.rate = 1.0;
        utterance.pitch = 0.9;
        utterance.volume = 1;
        
        utterance.onstart = () => {
            setIsAiSpeaking(true);
            console.log('🔊 Speaking started');
        };
        
        utterance.onend = () => {
            setIsAiSpeaking(false);
            console.log('🔊 Speaking ended');
            if (isLiveMode) {
                setTimeout(startListening, 800);
            }
        };
        
        utterance.onerror = (event) => {
            console.error('Speech synthesis error:', event);
            setIsAiSpeaking(false);
            if (isLiveMode) {
                setTimeout(startListening, 500);
            }
        };
        
        synthesisRef.current.speak(utterance);
    }, [isLiveMode, getMaleVoice]);

    const toggleLiveMode = useCallback(() => {
        if (!isLiveMode) {
            // Starting live mode
            setIsLiveMode(true);
            toast.info("🔴 Neural Link Active - Speak now!");
            
            const intro = `Neural Link established. I am Dhruva. Ready for ${subject} ${chapter || 'concepts'}. Begin speaking.`;
            speak(intro);
            
        } else {
            // Stopping live mode
            setIsLiveMode(false);
            setIsListening(false);
            setIsAiSpeaking(false);
            
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
            synthesisRef.current.cancel();
            
            toast.info("🔴 Neural Link Disconnected");
        }
    }, [isLiveMode, subject, chapter, speak]);

    // --- 🕒 SYSTEM INITIALIZATION ---
    useEffect(() => {
        const interval = setInterval(() => setTimer(prev => prev + 1), 1000);
        
        const loadVoices = () => {
            const voices = synthesisRef.current.getVoices();
            if (voices.length > 0) {
                console.log('✅ Voices loaded:', voices.length);
            }
        };
        
        loadVoices();
        synthesisRef.current.onvoiceschanged = loadVoices;
        
        return () => {
            clearInterval(interval);
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
            synthesisRef.current.cancel();
        };
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Auto-manage voice states
    useEffect(() => {
        if (isLiveMode && !isAiSpeaking && !isListening) {
            const timeout = setTimeout(startListening, 1000);
            return () => clearTimeout(timeout);
        }
    }, [isLiveMode, isAiSpeaking, isListening, startListening]);

    const handleLogout = async () => {
        try { 
            await auth.signOut(); 
            navigate("/login"); 
        } catch (err) { 
            toast.error("Logout Failed"); 
        }
    };

    // --- 🏆 XP & LEADERBOARD SYSTEM ---
    useEffect(() => {
        if (!currentUser) return;
        const unsubUser = onSnapshot(doc(db, "users", currentUser.uid), (doc) => {
            if (doc.exists()) setUserData(doc.data());
        });
        const q = query(collection(db, "users"), orderBy("xp", "desc"), limit(5));
        const unsubLeader = onSnapshot(q, (snap) => {
            setLeaderboard(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return () => { unsubUser(); unsubLeader(); };
    }, [currentUser]);

    const incrementXP = async (amount) => {
        const userRef = doc(db, "users", currentUser.uid);
        await updateDoc(userRef, { xp: increment(amount), dailyXp: increment(amount) });
    };

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setSelectedFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result);
        reader.readAsDataURL(file);
    };

    // --- 📨 MESSAGE LOGIC ---
    const sendMessage = async (override = null) => {
        const text = override || input;
        if (isSending || (!text.trim() && !selectedFile)) return;
        
        setIsSending(true);
        setInput("");
        
        let imgBase64 = imagePreview;
        setImagePreview(null);
        setSelectedFile(null);

        const userMsg = { role: "user", content: text, image: imgBase64, timestamp: Date.now() };
        setMessages(prev => [...prev, userMsg]);

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

            const querySuffix = mode === "Quiz" ? "practice questions" : mode === "HW" ? "solved" : "tutorial";
            const ytLink = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${userData.board} class ${userData.class} ${subject} ${chapter} ${querySuffix}`)}`;

            const aiMsg = { 
                role: "ai", 
                content: res.data.reply, 
                timestamp: Date.now(),
                ytLink
            };

            setMessages(prev => [...prev, aiMsg]);
            if (isLiveMode) speak(res.data.reply);

            await setDoc(doc(db, `users/${currentUser.uid}/sessions`, currentSessionId), {
                messages: [...messages, userMsg, aiMsg],
                lastUpdate: Date.now(),
                title: messages.length === 0 ? text.slice(0, 20) : sessionTitle,
                subject, chapter
            }, { merge: true });

            await incrementXP(imgBase64 ? 30 : 15);

        } catch (err) {
            toast.error("Signal Lost. Check Connection.");
        }
        setIsSending(false);
    };

    const quickReplies = useMemo(() => {
        if (mode === "Quiz") return ["Start 5 MCQ Quiz", "Hard Mode", "Summary of Progress"];
        if (mode === "HW") return ["Step-by-step Solution", "Clarify this step", "Alternative Method"];
        return [`Summarize ${chapter || 'this'}`, "Real-world application?", "Simplified explanation"];
    }, [mode, chapter]);

    // Sessions loader
    useEffect(() => {
        if (!currentUser) return;
        const q = query(collection(db, `users/${currentUser.uid}/sessions`), orderBy("lastUpdate", "desc"), limit(10));
        return onSnapshot(q, (snap) => setSessions(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    }, [currentUser]);

    const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
    const calculateLevel = (xp) => Math.floor((xp || 0) / 1000) + 1;

    return (
        <div className={`flex h-[100dvh] w-full ${activeTheme.bg} ${activeTheme.text} overflow-hidden font-sans selection:bg-indigo-500/30`}>
            <ToastContainer theme={activeTheme.isDark ? "dark" : "light"} />

            {/* FULL VOICE OVERLAY */}
            <AnimatePresence>
                {isLiveMode && (
                    <motion.div 
                        initial={{ y: "100%" }} 
                        animate={{ y: 0 }} 
                        exit={{ y: "100%" }} 
                        className="fixed inset-0 z-[600] bg-black flex flex-col items-center justify-between py-20 px-6"
                    >
                        <div className="text-center">
                            <div className="flex items-center justify-center gap-2 mb-4">
                                <motion.div 
                                    animate={{ opacity: [0.3, 1, 0.3] }} 
                                    transition={{ repeat: Infinity, duration: 2 }} 
                                    className="w-2 h-2 bg-indigo-500 rounded-full" 
                                />
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Neural Stream: {mode}</span>
                            </div>
                            <h1 className="text-4xl font-black italic tracking-tighter uppercase text-white mb-2">{subject}</h1>
                            <p className="text-xs font-bold text-white/20 uppercase tracking-widest">{chapter || "Core Concepts"}</p>
                        </div>

                        <div className="relative flex items-center justify-center">
                            <motion.div 
                                animate={{ 
                                    scale: isAiSpeaking ? [1, 1.05, 1] : 1,
                                    borderColor: isAiSpeaking ? "rgba(79,70,229,1)" : "rgba(255,255,255,0.1)"
                                }} 
                                transition={{ repeat: Infinity, duration: 1.5 }}
                                className={`w-72 h-72 rounded-full border-[1px] flex items-center justify-center bg-white/[0.01] backdrop-blur-3xl shadow-[0_0_100px_rgba(79,70,229,0.1)]`}
                            >
                                <div className="flex items-end gap-2 h-16">
                                    {[...Array(7)].map((_, i) => (
                                        <motion.div 
                                            key={i} 
                                            animate={{ 
                                                height: isAiSpeaking ? [15, 80, 15] : isListening ? [15, 40, 15] : 6,
                                                backgroundColor: isAiSpeaking ? "#6366f1" : "#312e81"
                                            }} 
                                            transition={{ repeat: Infinity, duration: 0.4, delay: i * 0.05 }} 
                                            className="w-2 rounded-full" 
                                        />
                                    ))}
                                </div>
                            </motion.div>
                        </div>

                        <div className="flex flex-col items-center gap-8 w-full max-w-xs">
                            <p className="text-xs font-black tracking-[0.2em] uppercase text-indigo-400">
                                {isAiSpeaking ? "Dhruva is communicating..." : isListening ? "Neural Input Active..." : "Standing By"}
                            </p>
                            <button 
                                onClick={toggleLiveMode} 
                                className="w-full py-6 bg-white/5 hover:bg-red-500/20 rounded-3xl border border-white/10 text-white transition-all active:scale-95 flex items-center justify-center gap-4 group"
                            >
                                <FaTimes className="group-hover:rotate-90 transition-transform"/>
                                <span className="text-[10px] font-black uppercase tracking-widest">Disconnect Link</span>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* SIDEBAR */}
            <AnimatePresence>
                {showSidebar && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }} 
                            onClick={() => setShowSidebar(false)} 
                            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[450]" 
                        />
                        <motion.div 
                            initial={{ x: -400 }} 
                            animate={{ x: 0 }} 
                            exit={{ x: -400 }} 
                            className={`fixed inset-y-0 left-0 w-80 ${activeTheme.isDark ? 'bg-[#080808]' : 'bg-white'} border-r ${activeTheme.border} z-[451] p-8 flex flex-col`}
                        >
                            <div className="flex justify-between items-center mb-10">
                                <div className="flex items-center gap-2">
                                    <FaBrain className="text-indigo-500"/>
                                    <h3 className="text-xl font-black italic uppercase tracking-tighter">Dhruva OS</h3>
                                </div>
                                <button onClick={() => setShowSidebar(false)} className="p-2 opacity-40 hover:opacity-100">
                                    <FaChevronLeft/>
                                </button>
                            </div>

                            <div className="space-y-8 flex-1 overflow-y-auto no-scrollbar">
                                {/* XP Card */}
                                <div className={`p-6 rounded-[2rem] border ${activeTheme.border} ${activeTheme.card} bg-gradient-to-br from-indigo-600/5 to-transparent`}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-3 bg-indigo-600/20 rounded-2xl text-indigo-500">
                                            <FaTrophy size={20}/>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-3xl font-black tracking-tighter">LVL {calculateLevel(userData.xp)}</div>
                                            <div className="text-[9px] font-bold opacity-40 uppercase tracking-widest">{userData.xp} Total XP</div>
                                        </div>
                                    </div>
                                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mb-2">
                                        <motion.div 
                                            initial={{ width: 0 }} 
                                            animate={{ width: `${(userData.dailyXp / 500) * 100}%` }} 
                                            className="h-full bg-indigo-500" 
                                        />
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <p className="text-[9px] font-black uppercase text-indigo-400">Daily Goal</p>
                                        <p className="text-[9px] font-black uppercase opacity-40">{userData.dailyXp}/500 XP</p>
                                    </div>
                                </div>

                                {/* Leaderboard */}
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30 px-2 flex items-center gap-2">
                                        <FaMedal/> Top Scholars
                                    </label>
                                    <div className="space-y-2">
                                        {leaderboard.map((user, idx) => (
                                            <div key={user.id} className={`flex items-center justify-between p-4 rounded-2xl border ${activeTheme.border} ${user.id === currentUser?.uid ? 'bg-indigo-600/10 border-indigo-500/30' : 'bg-white/[0.02]'}`}>
                                                <div className="flex items-center gap-3">
                                                    <span className={`text-xs font-black ${idx === 0 ? 'text-yellow-500' : 'opacity-20'}`}>0{idx+1}</span>
                                                    <span className="text-xs font-bold truncate w-24 uppercase tracking-tight">{user.displayName || "Anonymous"}</span>
                                                </div>
                                                <span className="text-[10px] font-black text-indigo-500">{user.xp}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <button 
                                onClick={handleLogout} 
                                className="mt-6 flex items-center justify-center gap-3 p-5 rounded-2xl bg-red-500/5 text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all border border-red-500/10"
                            >
                                <FaSignOutAlt /> Terminate Session
                            </button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <div className="flex-1 flex flex-col relative h-full">
                <Navbar currentUser={currentUser} userData={userData} />

                {/* CONTEXT HEADER */}
                <div className="w-full max-w-3xl mx-auto px-4 mt-4 space-y-3 z-[100]">
                    <div className={`flex items-center justify-between p-4 rounded-3xl ${activeTheme.card} border ${activeTheme.border} backdrop-blur-md`}>
                        <div className="flex items-center gap-3">
                            <FaHistory size={14} className="opacity-20 text-indigo-500"/>
                            {isEditingTitle ? (
                                <input 
                                    autoFocus 
                                    value={sessionTitle} 
                                    onChange={(e) => setSessionTitle(e.target.value)} 
                                    onBlur={() => setIsEditingTitle(false)} 
                                    className="bg-transparent border-none focus:ring-0 text-xs font-black uppercase p-0 w-32" 
                                />
                            ) : (
                                <span 
                                    onClick={() => setIsEditingTitle(true)} 
                                    className="text-xs font-black uppercase tracking-tighter cursor-pointer hover:text-indigo-400 transition-colors"
                                >
                                    {sessionTitle}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-4 text-[10px] font-black opacity-40 uppercase tracking-widest">
                            <span className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full">
                                <FaClock className="text-indigo-500"/> {formatTime(timer)}
                            </span>
                            <span className="text-indigo-500">{userData.board} CLS {userData.class}</span>
                        </div>
                    </div>

                    <div className={`flex gap-3 p-2 rounded-[2rem] ${activeTheme.card} border ${activeTheme.border}`}>
                        <div className="flex-1 relative">
                            <select 
                                value={subject} 
                                onChange={(e) => setSubject(e.target.value)} 
                                className="w-full bg-white/5 border-none focus:ring-1 focus:ring-indigo-500/50 rounded-2xl text-[10px] font-black uppercase py-3 px-4 appearance-none cursor-pointer"
                            >
                                {Object.keys(syllabusData[userData.board]?.[userData.class] || {}).map(s => (
                                    <option key={s} value={s} className="bg-black">{s}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex-1 relative">
                            <select 
                                value={chapter} 
                                onChange={(e) => setChapter(e.target.value)} 
                                className="w-full bg-white/5 border-none focus:ring-1 focus:ring-indigo-500/50 rounded-2xl text-[10px] font-black uppercase py-3 px-4 appearance-none cursor-pointer"
                            >
                                <option value="" className="bg-black">Select Chapter</option>
                                {(syllabusData[userData.board]?.[userData.class]?.[subject] || []).map(ch => (
                                    <option key={ch} value={ch} className="bg-black">{ch}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* CHAT MESSAGES */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 no-scrollbar pb-64">
                    <div className="max-w-3xl mx-auto space-y-10">
                        {messages.length === 0 && (
                            <div className="h-64 flex flex-col items-center justify-center">
                                <motion.div 
                                    animate={{ rotate: 360 }} 
                                    transition={{ repeat: Infinity, duration: 10, ease: "linear" }} 
                                    className="mb-6 opacity-10"
                                >
                                    <FaWaveSquare size={60} className="text-indigo-500"/>
                                </motion.div>
                                <h2 className="text-lg font-black uppercase tracking-[0.8em] opacity-10">Neural Interface Ready</h2>
                            </div>
                        )}
                        {messages.map((msg, i) => (
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }} 
                                animate={{ opacity: 1, y: 0 }} 
                                key={i} 
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`p-6 rounded-[2.5rem] max-w-[90%] shadow-2xl relative ${
                                    msg.role === 'user' 
                                        ? `bg-indigo-600 text-white rounded-tr-none` 
                                        : `${activeTheme.card} border ${activeTheme.border} rounded-tl-none`
                                }`}>
                                    {msg.image && (
                                        <div className="mb-4 overflow-hidden rounded-2xl border border-white/10">
                                            <img src={msg.image} alt="analysis" className="w-full max-h-72 object-contain bg-black/20" />
                                        </div>
                                    )}
                                    <ReactMarkdown 
                                        remarkPlugins={[remarkGfm, remarkMath]} 
                                        rehypePlugins={[rehypeKatex]} 
                                        className={`prose ${activeTheme.isDark ? 'prose-invert' : 'prose-slate'} text-sm leading-relaxed prose-p:my-2`}
                                    >
                                        {msg.content}
                                    </ReactMarkdown>
                                    {msg.ytLink && (
                                        <a 
                                            href={msg.ytLink} 
                                            target="_blank" 
                                            rel="noreferrer" 
                                            className="mt-6 flex items-center justify-center gap-3 py-4 bg-red-600 text-white text-[10px] font-black uppercase rounded-2xl hover:bg-red-700 transition-all shadow-lg shadow-red-600/20"
                                        >
                                            <FaYoutube size={16}/> Visual Supplement Found
                                        </a>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                {/* ACTION POD */}
                <div className={`absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t ${
                    activeTheme.isDark ? 'from-black via-black/90' : 'from-white via-white/90'
                } to-transparent z-[500]`}>
                    <div className="max-w-3xl mx-auto space-y-4">
                        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                            {quickReplies.map(q => (
                                <button 
                                    key={q} 
                                    onClick={() => sendMessage(q)} 
                                    className={`whitespace-nowrap px-6 py-3 rounded-2xl border ${activeTheme.border} ${activeTheme.card} text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all hover:scale-105 active:scale-95`}
                                >
                                    {q}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center justify-between">
                            <div className={`flex gap-1 p-1.5 ${
                                activeTheme.isDark ? 'bg-white/5' : 'bg-slate-200'
                            } rounded-2xl border ${activeTheme.border}`}>
                                {["Explain", "Quiz", "HW"].map(m => (
                                    <button 
                                        key={m} 
                                        onClick={() => setMode(m)} 
                                        className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${
                                            mode === m 
                                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' 
                                                : 'opacity-40 hover:opacity-100'
                                        }`}
                                    >
                                        {m}
                                    </button>
                                ))}
                            </div>
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => setShowSessionPicker(true)} 
                                    className={`p-4 rounded-2xl border ${activeTheme.border} ${activeTheme.card} hover:text-indigo-500 transition-colors`}
                                >
                                    <FaLayerGroup size={16}/>
                                </button>
                                <button 
                                    onClick={() => setShowSidebar(true)} 
                                    className={`p-4 rounded-2xl border ${activeTheme.border} ${activeTheme.card} hover:text-indigo-500 transition-colors`}
                                >
                                    <FaChartLine size={16}/>
                                </button>
                            </div>
                        </div>

                        {/* Image Preview */}
                        <AnimatePresence>
                            {imagePreview && (
                                <motion.div 
                                    initial={{ y: 20, opacity: 0 }} 
                                    animate={{ y: 0, opacity: 1 }} 
                                    exit={{ y: 20, opacity: 0 }} 
                                    className="relative w-20 h-20 ml-4 mb-2"
                                >
                                    <img 
                                        src={imagePreview} 
                                        className="w-full h-full object-cover rounded-2xl border-2 border-indigo-500" 
                                        alt="preview" 
                                    />
                                    <button 
                                        onClick={() => {
                                            setImagePreview(null); 
                                            setSelectedFile(null);
                                        }} 
                                        className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-xl"
                                    >
                                        <FaTimes size={10}/>
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className={`${
                            activeTheme.isDark 
                                ? 'bg-[#111] border-white/10 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]' 
                                : 'bg-white border-slate-200 shadow-2xl'
                        } border rounded-[2.5rem] p-2 flex items-end gap-2 transition-all focus-within:border-indigo-500/50`}>
                            <button 
                                onClick={() => fileInputRef.current.click()} 
                                className="p-5 opacity-30 hover:opacity-100 transition-all hover:text-indigo-500"
                            >
                                <FaImage size={22}/>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    hidden 
                                    accept="image/*" 
                                    onChange={handleFileSelect} 
                                />
                            </button>
                            <textarea 
                                value={input} 
                                onChange={(e) => setInput(e.target.value)} 
                                placeholder={`Neural inquiry: ${chapter || subject}...`} 
                                rows="1" 
                                className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-5 resize-none no-scrollbar font-medium placeholder:opacity-20" 
                                onKeyDown={(e) => { 
                                    if(e.key === 'Enter' && !e.shiftKey) { 
                                        e.preventDefault(); 
                                        sendMessage(); 
                                    }
                                }}
                                onInput={(e) => { 
                                    e.target.style.height = 'auto'; 
                                    e.target.style.height = e.target.scrollHeight + 'px'; 
                                }}
                            />
                            <div className="flex gap-2 pr-2 pb-2">
                                <button 
                                    onClick={toggleLiveMode} 
                                    className={`p-5 rounded-full transition-all ${
                                        isLiveMode 
                                            ? 'bg-indigo-600 text-white animate-pulse' 
                                            : 'bg-white/5 hover:bg-white/10'
                                    }`}
                                >
                                    <FaHeadphones size={22}/>
                                </button>
                                <button 
                                    onClick={() => sendMessage()} 
                                    disabled={isSending} 
                                    className="p-5 bg-indigo-600 text-white rounded-full shadow-lg shadow-indigo-600/30 active:scale-90 transition-all disabled:opacity-50"
                                >
                                    <FaPaperPlane size={22}/>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* VAULT MODAL */}
            <AnimatePresence>
                {showSessionPicker && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }} 
                        className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-3xl p-8 flex flex-col items-center"
                    >
                        <div className="w-full max-w-4xl flex justify-between items-center mb-12">
                            <div>
                                <h2 className="text-4xl font-black uppercase italic tracking-tighter text-indigo-500">The Vault</h2>
                                <p className="text-[10px] font-black opacity-30 uppercase tracking-[0.5em] mt-2">Historical Neural Patterns</p>
                            </div>
                            <button 
                                onClick={() => setShowSessionPicker(false)} 
                                className="p-6 bg-white/5 hover:bg-white/10 rounded-full transition-all"
                            >
                                <FaTimes size={20}/>
                            </button>
                        </div>
                        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto no-scrollbar">
                            {sessions.map(s => (
                                <div 
                                    key={s.id} 
                                    onClick={() => { 
                                        setMessages(s.messages || []); 
                                        setCurrentSessionId(s.id); 
                                        setSessionTitle(s.title || "Untitled"); 
                                        setShowSessionPicker(false); 
                                    }} 
                                    className={`p-8 rounded-[3rem] border ${activeTheme.border} ${activeTheme.card} hover:border-indigo-500/50 cursor-pointer transition-all flex justify-between items-center group relative overflow-hidden`}
                                >
                                    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 opacity-0 group-hover:opacity-100 transition-all"/>
                                    <div>
                                        <h4 className="font-black uppercase text-sm tracking-tight group-hover:text-indigo-400 transition-colors">
                                            {s.title || "Untitled Lesson"}
                                        </h4>
                                        <p className="text-[9px] opacity-30 mt-3 uppercase font-black tracking-widest">
                                            {s.subject} • {new Date(s.lastUpdate).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <button 
                                        onClick={(e) => { 
                                            e.stopPropagation(); 
                                            deleteDoc(doc(db, `users/${currentUser.uid}/sessions`, s.id)); 
                                        }} 
                                        className="opacity-0 group-hover:opacity-100 text-red-500 p-3 hover:bg-red-500/10 rounded-xl transition-all"
                                    >
                                        <FaTrash size={14}/>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

