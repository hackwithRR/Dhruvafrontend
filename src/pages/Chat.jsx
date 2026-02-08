import React, { useEffect, useState, useRef, useMemo } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import {
    FaPaperPlane, FaSyncAlt, FaTimes, FaImage, FaHistory, FaYoutube, FaTrash,
    FaPlay, FaStop, FaTrophy, FaChevronLeft, FaHeadphones, FaChartLine, 
    FaLayerGroup, FaBookOpen, FaHashtag, FaFolderOpen, FaMicrophone, FaVolumeUp, 
    FaFire, FaWaveSquare, FaSun, FaEdit, FaCheck, FaClock, FaSignOutAlt, FaMedal
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

const API_BASE = (process.env.REACT_APP_API_URL || "https://dhruva-backend-production.up.railway.app").replace(/\/$/, "");

// --- 📚 FULL SYLLABUS DATA ---
const syllabusData = {
    CBSE: {
        "8": {
            "MATHEMATICS": ["Rational Numbers", "Linear Equations in One Variable", "Understanding Quadrilaterals", "Practical Geometry", "Data Handling", "Squares and Square Roots", "Cubes and Cube Roots", "Comparing Quantities", "Algebraic Expressions and Identities", "Visualising Solid Shapes", "Mensuration", "Exponents and Powers", "Direct and Inverse Proportions", "Factorisation", "Introduction to Graphs", "Playing with Numbers"],
            "SCIENCE": ["Crop Production and Management", "Microorganisms", "Synthetic Fibres and Plastics", "Metals and Non-Metals", "Coal and Petroleum", "Combustion and Flame", "Conservation of Plants and Animals", "Cell Structure", "Reproduction in Animals", "Adolescence", "Force and Pressure", "Friction", "Sound", "Chemical Effects of Electric Current", "Light", "Solar System"]
        },
        "10": {
            "MATHEMATICS": ["Real Numbers", "Polynomials", "Linear Equations", "Quadratic Equations", "Arithmetic Progressions", "Triangles", "Coordinate Geometry", "Trigonometry", "Circles", "Surface Areas and Volumes", "Statistics", "Probability"],
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

    // Voice States
    const [isLiveMode, setIsLiveMode] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isAiSpeaking, setIsAiSpeaking] = useState(false);

    const recognitionRef = useRef(null);
    const synthesisRef = useRef(window.speechSynthesis);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const activeTheme = themes[theme] || themes.DeepSpace;

    // --- 🕒 SYSTEM INITIALIZATION ---
    useEffect(() => {
        const interval = setInterval(() => setTimer(prev => prev + 1), 1000);
        return () => clearInterval(interval);
    }, []);

    const handleLogout = async () => {
        try {
            await auth.signOut();
            navigate("/login");
        } catch (err) {
            toast.error("Logout Failed");
        }
    };

    // --- 🤖 GEMINI LIVE VOICE ENGINE ---
    const getMaleVoice = () => {
        const voices = synthesisRef.current.getVoices();
        return voices.find(v => v.name.toLowerCase().includes("male") || v.name.toLowerCase().includes("david")) || voices[0];
    };

    const startListening = () => {
        if (!recognitionRef.current) {
            const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new Speech();
            recognitionRef.current.continuous = false;
            recognitionRef.current.onstart = () => setIsListening(true);
            recognitionRef.current.onend = () => setIsListening(false);
            recognitionRef.current.onresult = (e) => {
                const text = e.results[0][0].transcript;
                if (text) sendMessage(text);
            };
        }
        try { recognitionRef.current.start(); } catch(e) {}
    };

    const speak = (text) => {
        if (!isLiveMode) return;
        synthesisRef.current.cancel();
        const utter = new SpeechSynthesisUtterance(text.replace(/[*#_]/g, ""));
        utter.voice = getMaleVoice();
        utter.onstart = () => setIsAiSpeaking(true);
        utter.onend = () => {
            setIsAiSpeaking(false);
            if (isLiveMode) setTimeout(startListening, 400);
        };
        synthesisRef.current.speak(utter);
    };

    const toggleLiveMode = () => {
        if (!isLiveMode) {
            setIsLiveMode(true);
            const intro = "Neural Link Established. I am Dhruva. Go ahead.";
            const utter = new SpeechSynthesisUtterance(intro);
            utter.voice = getMaleVoice();
            utter.onend = () => startListening();
            synthesisRef.current.speak(utter);
        } else {
            setIsLiveMode(false);
            synthesisRef.current.cancel();
            recognitionRef.current?.stop();
        }
    };

    // --- 🏆 XP & LEADERBOARD SYSTEM ---
    useEffect(() => {
        if (!currentUser) return;
        
        // Listen to current user data
        const unsubUser = onSnapshot(doc(db, "users", currentUser.uid), (doc) => {
            if (doc.exists()) setUserData(doc.data());
        });

        // Listen to Leaderboard
        const q = query(collection(db, "users"), orderBy("xp", "desc"), limit(5));
        const unsubLeader = onSnapshot(q, (snap) => {
            setLeaderboard(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        return () => { unsubUser(); unsubLeader(); };
    }, [currentUser]);

    const incrementXP = async (amount) => {
        const userRef = doc(db, "users", currentUser.uid);
        await updateDoc(userRef, {
            xp: increment(amount),
            dailyXp: increment(amount)
        });
    };

    // --- 🧠 QUICK REPLIES & SYLLABUS ---
    const quickReplies = useMemo(() => {
        if (mode === "Quiz") return ["Generate 5 MCQs", "Check Progress", "Hard Mode"];
        if (mode === "HW") return ["Step-by-step Solution", "Check my Image", "Concept Summary"];
        return [`Explain ${chapter || 'this'}`, "How is this used in real life?", "Show Diagram"];
    }, [mode, chapter]);

    // --- 📨 MESSAGE LOGIC ---
    const sendMessage = async (override = null) => {
        const text = override || input;
        if (isSending || (!text.trim() && !selectedFile)) return;
        
        setIsSending(true);
        setInput("");
        
        let imgBase64 = null;
        if (selectedFile) imgBase64 = await imageCompression.getDataUrlFromFile(selectedFile);

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

            // YouTube Logic based on mode
            const querySuffix = mode === "Quiz" ? "questions" : mode === "HW" ? "solution" : "concept";
            const ytLink = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${userData.board} ${userData.class} ${subject} ${chapter} ${querySuffix}`)}`;

            const aiMsg = { 
                role: "ai", 
                content: res.data.reply, 
                timestamp: Date.now(),
                ytLink
            };

            setMessages(prev => [...prev, aiMsg]);
            if (isLiveMode) speak(res.data.reply);

            // Update Firebase Session
            await setDoc(doc(db, `users/${currentUser.uid}/sessions`, currentSessionId), {
                messages: [...messages, userMsg, aiMsg],
                lastUpdate: Date.now(),
                title: messages.length === 0 ? text.slice(0, 20) : sessionTitle,
                subject,
                chapter
            }, { merge: true });

            await incrementXP(selectedFile ? 30 : 15);

        } catch (err) {
            toast.error("Connection Failed");
        }
        setIsSending(false);
        setSelectedFile(null);
    };

    // Archive Loader
    useEffect(() => {
        if (!currentUser) return;
        const q = query(collection(db, `users/${currentUser.uid}/sessions`), orderBy("lastUpdate", "desc"), limit(10));
        return onSnapshot(q, (snap) => setSessions(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    }, [currentUser]);

    const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

    return (
        <div className={`flex h-[100dvh] w-full ${activeTheme.bg} ${activeTheme.text} overflow-hidden font-sans`}>
            <ToastContainer theme={activeTheme.isDark ? "dark" : "light"} />

            {/* --- 💎 FULL VOICE OVERLAY (GEMINI LIVE STYLE) --- */}
            <AnimatePresence>
                {isLiveMode && (
                    <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="fixed inset-0 z-[600] bg-black flex flex-col items-center justify-between py-20 px-6">
                        <div className="text-center">
                            <div className="flex items-center justify-center gap-2 mb-2">
                                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-ping" />
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Neural Stream Active</span>
                            </div>
                            <h1 className="text-3xl font-black italic tracking-tighter uppercase text-white">{subject}</h1>
                        </div>

                        <div className="relative flex items-center justify-center">
                            <motion.div 
                                animate={{ scale: isAiSpeaking ? [1, 1.1, 1] : 1 }} 
                                transition={{ repeat: Infinity, duration: 1.5 }}
                                className={`w-64 h-64 rounded-full border-4 ${isAiSpeaking ? 'border-indigo-500 shadow-[0_0_50px_rgba(79,70,229,0.4)]' : 'border-white/10'} flex items-center justify-center bg-white/[0.02] backdrop-blur-3xl`}
                            >
                                <div className="flex items-end gap-1.5 h-12">
                                    {[...Array(5)].map((_, i) => (
                                        <motion.div 
                                            key={i} 
                                            animate={{ height: isAiSpeaking ? [10, 60, 10] : isListening ? [10, 30, 10] : 4 }} 
                                            transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }} 
                                            className="w-1.5 bg-indigo-500 rounded-full" 
                                        />
                                    ))}
                                </div>
                            </motion.div>
                        </div>

                        <div className="flex flex-col items-center gap-8">
                            <p className="text-xs font-bold tracking-widest uppercase text-white/40">
                                {isAiSpeaking ? "Dhruva is explaining..." : isListening ? "Listening to you..." : "Ready"}
                            </p>
                            <button onClick={toggleLiveMode} className="p-8 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 text-white transition-all active:scale-90 shadow-2xl">
                                <FaTimes size={24} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- 🛠️ SIDEBAR (LEADERBOARD & LOGOUT) --- */}
            <AnimatePresence>
                {showSidebar && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowSidebar(false)} className="fixed inset-0 bg-black/60 backdrop-blur-md z-[450]" />
                        <motion.div initial={{ x: -400 }} animate={{ x: 0 }} exit={{ x: -400 }} className={`fixed inset-y-0 left-0 w-80 ${activeTheme.isDark ? 'bg-[#0a0a0a]' : 'bg-white'} border-r ${activeTheme.border} z-[451] p-8 flex flex-col`}>
                            <div className="flex justify-between items-center mb-10">
                                <h3 className="text-xl font-black italic uppercase">System</h3>
                                <button onClick={() => setShowSidebar(false)} className="p-2"><FaChevronLeft/></button>
                            </div>

                            <div className="space-y-8 flex-1 overflow-y-auto no-scrollbar">
                                {/* XP Card */}
                                <div className={`p-6 rounded-[2rem] border ${activeTheme.border} ${activeTheme.card} bg-gradient-to-br from-indigo-600/10 to-transparent`}>
                                    <div className="flex justify-between items-start mb-4">
                                        <FaTrophy className="text-yellow-500" size={24}/>
                                        <div className="text-right">
                                            <div className="text-2xl font-black">{userData.xp}</div>
                                            <div className="text-[9px] font-bold opacity-40 uppercase tracking-widest">Total XP</div>
                                        </div>
                                    </div>
                                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-indigo-500" style={{ width: `${(userData.dailyXp / 500) * 100}%` }} />
                                    </div>
                                    <p className="text-[9px] font-black uppercase mt-2 text-indigo-400">Daily: {userData.dailyXp}/500 XP</p>
                                </div>

                                {/* Leaderboard */}
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-widest opacity-30 px-2">Top Performers</label>
                                    <div className="space-y-2">
                                        {leaderboard.map((user, idx) => (
                                            <div key={user.id} className={`flex items-center justify-between p-3 rounded-xl border ${activeTheme.border} ${user.id === currentUser.uid ? 'bg-indigo-600/10 border-indigo-500/30' : ''}`}>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs font-black opacity-20 w-4">#{idx+1}</span>
                                                    <span className="text-xs font-bold truncate w-24 uppercase">{user.displayName || "Scholar"}</span>
                                                </div>
                                                <span className="text-[10px] font-black text-indigo-500">{user.xp} XP</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Theme Switch */}
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest opacity-30 px-2">Themes</label>
                                    <div className="flex flex-wrap gap-2">
                                        {Object.keys(themes).map(t => (
                                            <button key={t} onClick={() => setTheme(t)} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase border ${theme === t ? 'bg-white text-black border-white' : 'border-white/10 opacity-40'}`}>{t}</button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <button onClick={handleLogout} className="mt-6 flex items-center justify-center gap-3 p-4 rounded-2xl bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">
                                <FaSignOutAlt /> Terminate Session
                            </button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <div className="flex-1 flex flex-col relative h-full">
                <Navbar currentUser={currentUser} userData={userData} />

                {/* --- 📟 CONTEXT HEADER --- */}
                <div className="w-full max-w-3xl mx-auto px-4 mt-4 space-y-2 z-[100]">
                    <div className={`flex items-center justify-between p-3 rounded-2xl ${activeTheme.card} border ${activeTheme.border}`}>
                        <div className="flex items-center gap-3">
                            <FaHistory size={14} className="opacity-20"/>
                            {isEditingTitle ? (
                                <input autoFocus value={sessionTitle} onChange={(e) => setSessionTitle(e.target.value)} onBlur={() => setIsEditingTitle(false)} className="bg-transparent border-none focus:ring-0 text-xs font-black uppercase p-0" />
                            ) : (
                                <span onClick={() => setIsEditingTitle(true)} className="text-xs font-black uppercase tracking-tighter cursor-pointer hover:text-indigo-400 transition-colors">{sessionTitle}</span>
                            )}
                        </div>
                        <div className="flex items-center gap-4 text-[10px] font-black opacity-40 uppercase tracking-widest">
                            <span className="flex items-center gap-1.5"><FaClock/> {formatTime(timer)}</span>
                            <span className="text-indigo-500">{userData.board} {userData.class}</span>
                        </div>
                    </div>

                    <div className={`flex gap-2 p-1.5 rounded-2xl ${activeTheme.card} border ${activeTheme.border}`}>
                        <select value={subject} onChange={(e) => setSubject(e.target.value)} className="flex-1 bg-transparent border-none focus:ring-0 text-[10px] font-black uppercase">
                            {Object.keys(syllabusData[userData.board]?.[userData.class] || {}).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <select value={chapter} onChange={(e) => setChapter(e.target.value)} className="flex-1 bg-transparent border-none focus:ring-0 text-[10px] font-black uppercase">
                            <option value="">Chapter List</option>
                            {(syllabusData[userData.board]?.[userData.class]?.[subject] || []).map(ch => <option key={ch} value={ch}>{ch}</option>)}
                        </select>
                    </div>
                </div>

                {/* --- 💬 CHAT MESSAGES --- */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 no-scrollbar pb-64">
                    <div className="max-w-3xl mx-auto space-y-8">
                        {messages.length === 0 && (
                            <div className="h-64 flex flex-col items-center justify-center opacity-10">
                                <FaWaveSquare size={50} className="mb-6 animate-pulse text-indigo-500"/>
                                <h2 className="text-lg font-black uppercase tracking-[0.8em]">Awaiting Input</h2>
                            </div>
                        )}
                        {messages.map((msg, i) => (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`p-6 rounded-[2.5rem] max-w-[90%] shadow-2xl ${msg.role === 'user' ? `bg-${activeTheme.primary} text-white rounded-tr-none` : `${activeTheme.card} border ${activeTheme.border} rounded-tl-none`}`}>
                                    {msg.image && <img src={msg.image} alt="visual" className="w-full rounded-2xl mb-4 max-h-64 object-cover" />}
                                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]} className={`prose ${activeTheme.isDark ? 'prose-invert' : 'prose-slate'} text-sm leading-relaxed`}>
                                        {msg.content}
                                    </ReactMarkdown>
                                    {msg.ytLink && (
                                        <a href={msg.ytLink} target="_blank" rel="noreferrer" className="mt-6 flex items-center justify-center gap-2 py-3 bg-red-600/10 hover:bg-red-600 text-[10px] font-black uppercase rounded-xl transition-all"><FaYoutube/> View supplement</a>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                {/* --- 🚀 ACTION POD --- */}
                <div className={`absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t ${activeTheme.isDark ? 'from-black' : 'from-white'} to-transparent z-[500]`}>
                    <div className="max-w-3xl mx-auto space-y-4">
                        
                        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                            {quickReplies.map(q => (
                                <button key={q} onClick={() => sendMessage(q)} className={`whitespace-nowrap px-5 py-2.5 rounded-full border ${activeTheme.border} ${activeTheme.card} text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all`}>
                                    {q}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center justify-between mb-2">
                            <div className={`flex gap-1 p-1 ${activeTheme.isDark ? 'bg-black/40' : 'bg-slate-200'} rounded-xl border ${activeTheme.border}`}>
                                {["Explain", "Quiz", "HW"].map(m => (
                                    <button key={m} onClick={() => setMode(m)} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${mode === m ? 'bg-indigo-600 text-white' : 'opacity-40 hover:opacity-100'}`}>{m}</button>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setShowSessionPicker(true)} className={`p-3 rounded-xl border ${activeTheme.border} ${activeTheme.card}`}><FaLayerGroup size={14}/></button>
                                <button onClick={() => setShowSidebar(true)} className={`p-3 rounded-xl border ${activeTheme.border} ${activeTheme.card}`}><FaChartLine size={14}/></button>
                            </div>
                        </div>

                        <div className={`${activeTheme.isDark ? 'bg-[#111] border-white/10' : 'bg-white border-slate-200 shadow-2xl'} border rounded-[2.5rem] p-2 flex items-end gap-2`}>
                            <button onClick={() => fileInputRef.current.click()} className="p-4 opacity-30 hover:opacity-100 transition-all">
                                <FaImage size={20}/>
                                <input type="file" ref={fileInputRef} hidden onChange={(e) => setSelectedFile(e.target.files[0])} />
                            </button>
                            <textarea 
                                value={input} 
                                onChange={(e) => setInput(e.target.value)} 
                                placeholder={`Neural inquiry: ${chapter || subject}...`} 
                                rows="1" 
                                className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-4 resize-none no-scrollbar font-medium" 
                                onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }}
                            />
                            <div className="flex gap-2 pr-2 pb-2">
                                <button onClick={toggleLiveMode} className={`p-4 rounded-full transition-all ${isLiveMode ? 'bg-indigo-600 text-white animate-pulse' : 'bg-white/5'}`}><FaHeadphones size={20}/></button>
                                <button onClick={() => sendMessage()} className="p-4 bg-indigo-600 text-white rounded-full shadow-lg active:scale-90 transition-all"><FaPaperPlane size={20}/></button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- 📁 VAULT MODAL --- */}
            <AnimatePresence>
                {showSessionPicker && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-3xl p-8 flex flex-col items-center">
                        <div className="w-full max-w-4xl flex justify-between items-center mb-12">
                            <div>
                                <h2 className="text-4xl font-black uppercase italic tracking-tighter">The Vault</h2>
                                <p className="text-[10px] font-black opacity-30 uppercase tracking-[0.4em] mt-2">Neural patterns archived</p>
                            </div>
                            <button onClick={() => setShowSessionPicker(false)} className="p-5 bg-white/5 rounded-full"><FaTimes size={20}/></button>
                        </div>
                        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto no-scrollbar">
                            {sessions.map(s => (
                                <div key={s.id} onClick={() => { setMessages(s.messages || []); setCurrentSessionId(s.id); setSessionTitle(s.title || "Untitled"); setShowSessionPicker(false); }} className={`p-8 rounded-[2.5rem] border ${activeTheme.border} ${activeTheme.card} hover:border-indigo-500/50 cursor-pointer transition-all flex justify-between items-center group`}>
                                    <div>
                                        <h4 className="font-black uppercase text-sm tracking-tight">{s.title || "Untitled Lesson"}</h4>
                                        <p className="text-[9px] opacity-30 mt-2 uppercase font-black tracking-widest">{s.subject} • {new Date(s.lastUpdate).toLocaleDateString()}</p>
                                    </div>
                                    <button onClick={(e) => { e.stopPropagation(); deleteDoc(doc(db, `users/${currentUser.uid}/sessions`, s.id)); }} className="opacity-0 group-hover:opacity-100 text-red-500 p-2 hover:bg-red-500/10 rounded-lg transition-all"><FaTrash/></button>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
