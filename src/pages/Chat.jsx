import React, { useEffect, useState, useRef, useMemo } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import {
    FaPaperPlane, FaTimes, FaImage, FaHistory, FaYoutube, FaTrash,
    FaTrophy, FaChevronLeft, FaHeadphones, FaChartLine, 
    FaLayerGroup, FaBookOpen, FaHashtag, FaMicrophone, FaVolumeUp, 
    FaFire, FaWaveSquare, FaEdit, FaCheck, FaClock, FaSignOutAlt
} from "react-icons/fa";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import 'katex/dist/katex.min.css';
import { 
    doc, setDoc, collection, query, updateDoc, increment, onSnapshot, 
    orderBy, limit, deleteDoc, getDoc, serverTimestamp 
} from "firebase/firestore";
import { db, auth } from "../firebase";
import imageCompression from "browser-image-compression";
import { motion, AnimatePresence } from "framer-motion";

const SYLLABUS = {
    CBSE: {
        "8": {
            "MATHEMATICS": ["Rational Numbers", "Linear Equations", "Quadrilaterals", "Practical Geometry", "Data Handling", "Squares", "Cubes", "Quantities", "Algebraic Expressions", "Solid Shapes", "Mensuration", "Exponents", "Proportions", "Factorisation", "Graphs", "Numbers"],
            "SCIENCE": ["Crop Production", "Microorganisms", "Fibres & Plastics", "Metals", "Coal", "Combustion", "Conservation", "Cell Structure", "Reproduction", "Adolescence", "Force", "Friction", "Sound", "Chemical Effects", "Light", "Solar System"]
        },
        "10": {
            "MATHEMATICS": ["Real Numbers", "Polynomials", "Linear Equations", "Quadratic Equations", "Arithmetic Progressions", "Triangles", "Coordinate Geometry", "Trigonometry", "Circles", "Surface Areas", "Statistics", "Probability"],
            "SCIENCE": ["Chemical Reactions", "Acids, Bases", "Metals", "Carbon", "Life Processes", "Control", "Reproduction", "Heredity", "Light", "Human Eye", "Electricity", "Magnetism", "Environment"]
        },
        "12": {
            "PHYSICS": ["Electrostatics", "Current", "Magnetism", "EMI", "AC", "EM Waves", "Ray Optics", "Wave Optics", "Dual Nature", "Atoms", "Nuclei", "Semiconductors"]
        }
    },
    ICSE: {
        "10": {
            "MATHEMATICS": ["Quadratic Equations", "Inequations", "Ratio", "Matrices", "Progression", "Geometry", "Similarity", "Trigonometry", "Statistics"],
            "PHYSICS": ["Force", "Work", "Machines", "Refraction", "Spectrum", "Sound", "Electricity", "Magnetism", "Radioactivity"]
        }
    }
};

const themes = {
    DeepSpace: { bg: "bg-[#050505]", primary: "indigo-600", primaryHex: "#4f46e5", text: "text-white", accent: "text-indigo-400", card: "bg-white/[0.04]", border: "border-white/10", isDark: true },
    Light: { bg: "bg-[#f8fafc]", primary: "indigo-600", primaryHex: "#4f46e5", text: "text-slate-900", accent: "text-indigo-600", card: "bg-white shadow-xl", border: "border-slate-200", isDark: false }
};

export default function Chat() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [messages, setMessages] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [leaderboard, setLeaderboard] = useState([]);
    const [currentSessionId, setCurrentSessionId] = useState(Date.now().toString());
    const [sessionTitle, setSessionTitle] = useState("Uncharted Lesson");
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [input, setInput] = useState("");
    const [mode, setMode] = useState("Explain");
    const [subject, setSubject] = useState("");
    const [chapter, setChapter] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [theme, setTheme] = useState("DeepSpace");
    const [userData, setUserData] = useState({ xp: 0, dailyXp: 0, streak: 0, board: "CBSE", class: "10" });
    const [timer, setTimer] = useState(0);
    const [showSidebar, setShowSidebar] = useState(false);
    const [showSessionPicker, setShowSessionPicker] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);

    // Live Mode States
    const [isLiveMode, setIsLiveMode] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isAiSpeaking, setIsAiSpeaking] = useState(false);

    const recognitionRef = useRef(null);
    const synthesisRef = useRef(window.speechSynthesis);
    const scrollRef = useRef(null);
    const fileInputRef = useRef(null);
    const activeTheme = themes[theme] || themes.DeepSpace;

    // --- 🛠️ CORE LOGIC: LOGOUT & XP ---
    const handleLogout = async () => {
        try {
            await auth.signOut();
            localStorage.clear();
            navigate("/login");
            window.location.reload(); 
        } catch (err) {
            toast.error("Logout Signal Interrupted");
        }
    };

    useEffect(() => {
        if (!currentUser) return;
        const unsub = onSnapshot(doc(db, "users", currentUser.uid), (d) => d.exists() && setUserData(d.data()));
        const q = query(collection(db, "users"), orderBy("xp", "desc"), limit(5));
        const unsubLeader = onSnapshot(q, (s) => setLeaderboard(s.docs.map(doc => ({id: doc.id, ...doc.data()}))));
        return () => { unsub(); unsubLeader(); };
    }, [currentUser]);

    const awardXP = async (amt) => {
        const ref = doc(db, "users", currentUser.uid);
        await updateDoc(ref, { xp: increment(amt), dailyXp: increment(amt) });
    };

    // --- 🤖 GEMINI LIVE VOICE LOOP ---
    const startListening = () => {
        const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!Speech) return toast.error("Voice not supported");
        recognitionRef.current = new Speech();
        recognitionRef.current.onstart = () => setIsListening(true);
        recognitionRef.current.onend = () => setIsListening(false);
        recognitionRef.current.onresult = (e) => sendMessage(e.results[0][0].transcript);
        recognitionRef.current.start();
    };

    const speak = (text) => {
        synthesisRef.current.cancel();
        const utter = new SpeechSynthesisUtterance(text.replace(/[*#_]/g, ""));
        const voices = synthesisRef.current.getVoices();
        utter.voice = voices.find(v => v.name.includes("Male")) || voices[0];
        utter.onstart = () => setIsAiSpeaking(true);
        utter.onend = () => {
            setIsAiSpeaking(false);
            if (isLiveMode) setTimeout(startListening, 600);
        };
        synthesisRef.current.speak(utter);
    };

    const toggleLive = () => {
        if (!isLiveMode) {
            setIsLiveMode(true);
            speak("Neural Link Established.");
        } else {
            setIsLiveMode(false);
            synthesisRef.current.cancel();
            recognitionRef.current?.stop();
        }
    };

    // --- 📨 DYNAMIC MESSAGING ---
    const sendMessage = async (override = null) => {
        const text = override || input;
        if (isSending || (!text.trim() && !selectedFile)) return;
        setIsSending(true); setInput("");

        let imgBase64 = null;
        if (selectedFile) imgBase64 = await imageCompression.getDataUrlFromFile(selectedFile);

        const newMsg = { role: "user", content: text, image: imgBase64, timestamp: Date.now() };
        setMessages(prev => [...prev, newMsg]);

        try {
            const res = await axios.post(`https://dhruva-backend-production.up.railway.app/chat`, {
                userId: currentUser.uid, message: text, mode, subject, chapter, image: imgBase64,
                board: userData.board, class: userData.class
            });

            const aiMsg = { 
                role: "ai", 
                content: res.data.reply, 
                ytLink: `https://www.youtube.com/results?search_query=${userData.board}+${subject}+${chapter}+${mode}`,
                timestamp: Date.now() 
            };

            setMessages(prev => [...prev, aiMsg]);
            if (isLiveMode) speak(res.data.reply);
            awardXP(selectedFile ? 50 : 20);

            await setDoc(doc(db, `users/${currentUser.uid}/sessions`, currentSessionId), {
                messages: [...messages, newMsg, aiMsg],
                lastUpdate: serverTimestamp(),
                title: messages.length === 0 ? text.slice(0, 20) : sessionTitle,
                subject, chapter
            }, { merge: true });

        } catch (e) { toast.error("Sync Failed"); }
        setIsSending(false); setSelectedFile(null);
    };

    // --- 📱 UI UTILS ---
    useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }); }, [messages]);
    useEffect(() => {
        const t = setInterval(() => setTimer(p => p + 1), 1000);
        return () => clearInterval(t);
    }, []);

    const subList = useMemo(() => Object.keys(SYLLABUS[userData.board]?.[userData.class] || {}), [userData]);
    const chList = useMemo(() => SYLLABUS[userData.board]?.[userData.class]?.[subject] || [], [subject, userData]);

    return (
        <div className={`flex flex-col h-[100dvh] w-full ${activeTheme.bg} ${activeTheme.text} overflow-hidden`}>
            <ToastContainer />

            {/* --- 💎 SIDEBAR (STATISTICS & LOGOUT) --- */}
            <AnimatePresence>
                {showSidebar && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowSidebar(false)} className="fixed inset-0 bg-black/80 backdrop-blur-md z-[1000]" />
                        <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} className={`fixed inset-y-0 left-0 w-80 ${activeTheme.isDark ? 'bg-[#0a0a0a]' : 'bg-white'} border-r ${activeTheme.border} z-[1001] p-8 flex flex-col`}>
                            <div className="flex justify-between items-center mb-10">
                                <h2 className="text-2xl font-black italic">DASHBOARD</h2>
                                <button onClick={() => setShowSidebar(false)}><FaTimes/></button>
                            </div>

                            <div className="flex-1 space-y-8">
                                {/* XP SYSTEM & DAILY GOAL */}
                                <div className={`p-6 rounded-3xl ${activeTheme.card} border ${activeTheme.border}`}>
                                    <div className="flex justify-between items-end mb-4">
                                        <FaFire className="text-orange-500 mb-1" size={24}/>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black opacity-40 uppercase">Daily Goal</p>
                                            <p className="text-xl font-black text-indigo-500">{userData.dailyXp} / 500 XP</p>
                                        </div>
                                    </div>
                                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                        <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min((userData.dailyXp / 500) * 100, 100)}%` }} className="h-full bg-indigo-500" />
                                    </div>
                                    <div className="mt-6 flex justify-between items-center">
                                        <span className="text-[10px] font-bold opacity-30">STREAK: {userData.streak} DAYS</span>
                                        <span className="text-[10px] font-bold opacity-30">TOTAL: {userData.xp} XP</span>
                                    </div>
                                </div>

                                {/* LEADERBOARD */}
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black opacity-30 tracking-[0.2em]">TOP SCHOLARS</h4>
                                    {leaderboard.map((user, idx) => (
                                        <div key={user.id} className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-white/[0.02]">
                                            <span className="text-xs font-black opacity-20">0{idx + 1}</span>
                                            <span className="text-xs font-bold uppercase flex-1 px-4 truncate">{user.displayName || "Scholar"}</span>
                                            <span className="text-xs font-black text-indigo-400">{user.xp}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button onClick={handleLogout} className="w-full p-5 rounded-2xl bg-red-500/10 text-red-500 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-red-500 hover:text-white transition-all">
                                <FaSignOutAlt/> Terminate Session
                            </button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* --- 📟 HEADER CONTEXT (STICKY) --- */}
            <div className={`z-[400] w-full p-4 border-b ${activeTheme.border} backdrop-blur-xl`}>
                <div className="max-w-4xl mx-auto space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button onClick={() => setShowSidebar(true)} className="p-2 hover:bg-white/5 rounded-lg transition-colors"><FaChartLine size={18} className="text-indigo-500"/></button>
                            {isEditingTitle ? (
                                <input autoFocus value={sessionTitle} onChange={e => setSessionTitle(e.target.value)} onBlur={() => setIsEditingTitle(false)} className="bg-transparent border-none text-sm font-black uppercase focus:ring-0 p-0" />
                            ) : (
                                <h1 onClick={() => setIsEditingTitle(true)} className="text-sm font-black uppercase tracking-tighter cursor-pointer flex items-center gap-2">{sessionTitle} <FaEdit size={10} className="opacity-20"/></h1>
                            )}
                        </div>
                        <div className="flex items-center gap-4 text-[10px] font-black opacity-40">
                            <span className="flex items-center gap-1.5"><FaClock/> {Math.floor(timer/60)}:{(timer%60).toString().padStart(2,'0')}</span>
                            <span className="text-indigo-500">{userData.board} {userData.class}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl ${activeTheme.card} border ${activeTheme.border}`}>
                            <FaBookOpen size={12} className="opacity-20"/>
                            <select value={subject} onChange={e => {setSubject(e.target.value); setChapter("")}} className="w-full bg-transparent border-none text-[10px] font-black uppercase focus:ring-0 cursor-pointer">
                                <option className="bg-black">Subject</option>
                                {subList.map(s => <option key={s} className="bg-black">{s}</option>)}
                            </select>
                        </div>
                        <div className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl ${activeTheme.card} border ${activeTheme.border}`}>
                            <FaHashtag size={12} className="opacity-20"/>
                            <select value={chapter} onChange={e => setChapter(e.target.value)} className="w-full bg-transparent border-none text-[10px] font-black uppercase focus:ring-0 cursor-pointer">
                                <option className="bg-black">Chapter</option>
                                {chList.map(c => <option key={c} className="bg-black">{c}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- 💬 CHAT ZONE (SCROLLABLE) --- */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar pt-6 pb-96 px-4">
                <div className="max-w-3xl mx-auto space-y-10">
                    {messages.length === 0 && (
                        <div className="h-[40vh] flex flex-col items-center justify-center opacity-10">
                            <FaWaveSquare size={60} className="mb-6 animate-pulse text-indigo-500"/>
                            <p className="text-sm font-black tracking-[1em] uppercase">Ready to Learn</p>
                        </div>
                    )}
                    {messages.map((m, i) => (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] p-6 rounded-[2.5rem] shadow-2xl ${m.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : `${activeTheme.card} border ${activeTheme.border} rounded-tl-none`}`}>
                                {m.image && <img src={m.image} alt="study-ref" className="w-full rounded-2xl mb-4 border border-white/10" />}
                                <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]} className="prose prose-invert prose-sm leading-relaxed">
                                    {m.content}
                                </ReactMarkdown>
                                {m.ytLink && (
                                    <a href={m.ytLink} target="_blank" rel="noreferrer" className="mt-6 flex items-center justify-center gap-2 p-4 bg-red-600/10 hover:bg-red-600 rounded-2xl text-[10px] font-black uppercase transition-all">
                                        <FaYoutube size={16}/> View Visual Aid
                                    </a>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* --- 🚀 ACTION POD (FLOATING) --- */}
            <div className="fixed bottom-0 left-0 w-full p-6 z-[500] pointer-events-none">
                <div className="max-w-3xl mx-auto space-y-4 pointer-events-auto">
                    
                    {/* Mode & Quick Reply Bar */}
                    <div className="flex flex-col gap-3">
                        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                            {["Explain Step-by-Step", "Simplify this", "Give 3 Questions", "Real World Example"].map(q => (
                                <button key={q} onClick={() => sendMessage(q)} className={`whitespace-nowrap px-5 py-2.5 rounded-full border ${activeTheme.border} ${activeTheme.card} text-[10px] font-bold uppercase backdrop-blur-xl hover:bg-indigo-600 transition-all`}>{q}</button>
                            ))}
                        </div>
                        <div className="flex justify-between items-center bg-black/40 backdrop-blur-2xl p-1.5 rounded-2xl border border-white/5 w-fit">
                            {["Explain", "Quiz", "HW"].map(m => (
                                <button key={m} onClick={() => setMode(m)} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${mode === m ? 'bg-indigo-600 shadow-lg shadow-indigo-500/40' : 'opacity-40 hover:opacity-100'}`}>{m}</button>
                            ))}
                        </div>
                    </div>

                    {/* Main Input Pod */}
                    <div className={`group ${activeTheme.isDark ? 'bg-[#0f0f0f]' : 'bg-white'} border border-white/10 rounded-[2.5rem] p-2 flex items-end gap-2 shadow-2xl focus-within:border-indigo-500/50 transition-all duration-300`}>
                        <button onClick={() => fileInputRef.current.click()} className="p-4 opacity-40 hover:opacity-100 hover:text-indigo-500 transition-all">
                            <FaImage size={22}/>
                            <input type="file" ref={fileInputRef} hidden onChange={e => setSelectedFile(e.target.files[0])} />
                        </button>
                        
                        <textarea 
                            value={input} 
                            onChange={e => setInput(e.target.value)} 
                            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
                            placeholder={selectedFile ? "File selected. Ask anything..." : `Discuss ${chapter || 'lessons'}...`} 
                            rows="1" 
                            className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-4 resize-none font-medium no-scrollbar"
                            onInput={e => {e.target.style.height='auto'; e.target.style.height=e.target.scrollHeight+'px'}}
                        />

                        <div className="flex gap-2 pr-2 pb-2">
                            <button onClick={toggleLive} className={`p-4 rounded-full transition-all ${isLiveMode ? 'bg-indigo-600 animate-pulse text-white' : 'bg-white/5 opacity-40 hover:opacity-100'}`}>
                                <FaHeadphones size={20}/>
                            </button>
                            <button onClick={() => sendMessage()} className="p-4 bg-indigo-600 text-white rounded-full shadow-xl hover:scale-105 active:scale-95 transition-all">
                                <FaPaperPlane size={20}/>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- 🎤 GEMINI LIVE OVERLAY --- */}
            <AnimatePresence>
                {isLiveMode && (
                    <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="fixed inset-0 z-[2000] bg-black flex flex-col items-center justify-between py-24 px-10">
                        <div className="text-center space-y-2">
                            <div className="flex justify-center items-center gap-2 opacity-40">
                                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping"/>
                                <span className="text-[10px] font-black uppercase tracking-[0.5em]">Neural Link</span>
                            </div>
                            <h2 className="text-3xl font-black italic uppercase tracking-tighter">{subject}</h2>
                        </div>

                        <div className="w-64 h-64 rounded-full border border-white/10 flex items-center justify-center relative">
                            {isAiSpeaking && <motion.div animate={{ scale: [1, 1.4, 1], opacity: [0.1, 0, 0.1] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute inset-0 bg-indigo-500 rounded-full" />}
                            <div className="flex items-end gap-1.5 h-16">
                                {[...Array(5)].map((_, i) => (
                                    <motion.div key={i} animate={{ height: isAiSpeaking ? [10, 60, 10] : isListening ? [10, 30, 10] : 4 }} transition={{ repeat: Infinity, duration: 0.4, delay: i * 0.1 }} className="w-2 bg-indigo-500 rounded-full" />
                                ))}
                            </div>
                        </div>

                        <button onClick={toggleLive} className="p-10 bg-white/5 rounded-full border border-white/10 hover:bg-white/10 transition-all">
                            <FaTimes size={30}/>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
