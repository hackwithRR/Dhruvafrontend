import React, { useEffect, useState, useRef, useMemo } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import {
    FaPaperPlane, FaTimes, FaImage, FaHistory, FaDownload, FaChevronLeft, 
    FaHeadphones, FaCheck, FaClock, FaSignOutAlt, FaBrain, FaChevronDown, 
    FaPalette, FaTrophy, FaChartLine, FaLightbulb, FaFilePdf, FaCheckSquare,
    FaCalendarCheck, FaGraduationCap, FaLayerGroup, FaFire, FaCircle, FaBolt,
    FaMicrophone, FaVolumeUp, FaRobot, FaUserGraduate, FaPercentage
} from "react-icons/fa";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import 'katex/dist/katex.min.css';
import { 
    doc, setDoc, collection, query, updateDoc, increment, onSnapshot, 
    orderBy, limit, getDoc, arrayUnion 
} from "firebase/firestore";
import { db, auth } from "../firebase";
import imageCompression from "browser-image-compression";
import { motion, AnimatePresence } from "framer-motion";
import jsPDF from "jspdf";

const API_BASE = (process.env.REACT_APP_API_URL || "https://dhruva-backend-production.up.railway.app").replace(/\/$/, "");

// --- 🎨 NEURAL DESIGN SYSTEM ---
const themes = {
    DeepSpace: { bg: "bg-[#050505]", card: "bg-white/5", border: "border-white/10", primary: "indigo-600", text: "text-white", accent: "indigo-400" },
    Light: { bg: "bg-[#f8fafc]", card: "bg-white shadow-xl", border: "border-slate-200", primary: "indigo-600", text: "text-slate-900", accent: "indigo-600" },
    Cyberpunk: { bg: "bg-[#0a0a0f]", card: "bg-cyan-950/20", border: "border-cyan-500/30", primary: "cyan-500", text: "text-cyan-50", accent: "cyan-400" },
    Crimson: { bg: "bg-[#0d0202]", card: "bg-red-950/10", border: "border-red-500/20", primary: "red-600", text: "text-red-50", accent: "red-400" },
    Forest: { bg: "bg-[#020503]", card: "bg-emerald-950/10", border: "border-emerald-500/20", primary: "emerald-600", text: "text-emerald-50", accent: "emerald-400" }
};

// --- 📚 COMPREHENSIVE KNOWLEDGE GRAPH (SYLLABUS) ---
const syllabusData = {
    CBSE: {
        "8": { 
            "MATHEMATICS": ["Rational Numbers", "Linear Equations", "Quadrilaterals", "Data Handling", "Squares and Roots", "Cubes and Roots", "Comparing Quantities", "Algebraic Expressions", "Mensuration", "Exponents", "Factorisation", "Graphs"], 
            "SCIENCE": ["Crop Production", "Microorganisms", "Metals/Non-Metals", "Coal", "Combustion", "Conservation", "Cells", "Reproduction", "Force", "Friction", "Sound", "Light"] 
        },
        "9": { 
            "MATHEMATICS": ["Number Systems", "Polynomials", "Coordinate Geometry", "Linear Equations", "Lines/Angles", "Triangles", "Quadrilaterals", "Circles", "Heron’s Formula", "Surface Areas", "Statistics"], 
            "SCIENCE": ["Matter", "Atoms", "Structure of Atom", "Cell", "Tissues", "Motion", "Force", "Gravitation", "Work", "Sound"] 
        },
        "10": { 
            "MATHEMATICS": ["Real Numbers", "Polynomials", "Linear Equations", "Quadratic Equations", "Arithmetic Progression", "Triangles", "Trigonometry", "Circles", "Surface Areas", "Statistics", "Probability"], 
            "SCIENCE": ["Chemical Reactions", "Acids/Bases", "Metals", "Carbon", "Life Processes", "Control", "Reproduction", "Heredity", "Light", "Human Eye", "Electricity", "Magnetism"] 
        }
    },
    ICSE: {
        "8": { 
            "MATHEMATICS": ["Rational Numbers", "Exponents", "Algebra", "Linear Equations", "Factorisation", "Ratio", "Percentages", "Interest", "Mensuration", "Data"], 
            "PHYSICS": ["Matter", "Force", "Energy", "Light", "Heat", "Sound", "Electricity"] 
        },
        "10": { 
            "MATHEMATICS": ["Quadratic Equations", "Matrices", "AP", "Coordinate Geometry", "Similarity", "Trigonometry", "Mensuration", "Statistics"], 
            "PHYSICS": ["Force", "Work/Power/Energy", "Machines", "Refraction", "Spectrum", "Sound", "Electricity", "Radioactivity"] 
        }
    }
};

export default function Chat() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    
    // --- CORE LOGIC STATES ---
    const [messages, setMessages] = useState([]);
    const [userData, setUserData] = useState({ board: "CBSE", class: "10", xp: 0, score: 0, streak: 1, completedChapters: [] });
    const [input, setInput] = useState("");
    const [mode, setMode] = useState("Explain");
    const [subject, setSubject] = useState("MATHEMATICS");
    const [chapter, setChapter] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);
    
    // --- UI STATES ---
    const [showGallery, setShowGallery] = useState(false);
    const [showSidebar, setShowSidebar] = useState(false);
    const [showStudyPlan, setShowStudyPlan] = useState(false);
    const [gallery, setGallery] = useState([]);
    const [themeName, setThemeName] = useState("DeepSpace");
    const activeTheme = themes[themeName];
    const [selectedOption, setSelectedOption] = useState(null);
    const [activeTab, setActiveTab] = useState("chat");

    // --- SPEECH & LIVE MODE ---
    const [isLiveMode, setIsLiveMode] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef(null);
    const synthRef = useRef(window.speechSynthesis);
    const scrollRef = useRef(null);

    // --- 📊 NEURAL ANALYTICS ---
    const subjectProgress = useMemo(() => {
        const list = syllabusData[userData.board]?.[userData.class]?.[subject] || [];
        if (list.length === 0) return 0;
        const done = (userData.completedChapters || []).filter(ch => list.includes(ch)).length;
        return Math.round((done / list.length) * 100);
    }, [userData, subject]);

    // --- 📄 ADVANCED PDF GENERATOR ---
    const downloadSolution = (content) => {
        const doc = new jsPDF();
        doc.setFillColor(20, 20, 20);
        doc.rect(0, 0, 210, 297, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(22);
        doc.text("DHRUVA AI STUDY SOLUTION", 20, 25);
        
        doc.setDrawColor(99, 102, 241);
        doc.line(20, 30, 190, 30);
        
        doc.setFontSize(10);
        doc.setTextColor(150, 150, 150);
        doc.text(`Subject: ${subject} | Chapter: ${chapter || 'General'} | Mode: ${mode}`, 20, 38);
        
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        const splitText = doc.splitTextToSize(content.replace(/[*#]/g, ""), 170);
        doc.text(splitText, 20, 50);
        
        doc.save(`Dhruva_${subject}_Report.pdf`);
        toast.success("Study Report Exported!");
    };

    // --- 🎙️ SPEECH ENGINE ---
    const startVoice = () => {
        const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!Speech) {
            toast.error("Your browser doesn't support Voice AI");
            return;
        }
        recognitionRef.current = new Speech();
        recognitionRef.current.continuous = false;
        recognitionRef.current.onstart = () => setIsListening(true);
        recognitionRef.current.onend = () => setIsListening(false);
        recognitionRef.current.onresult = (e) => {
            const transcript = e.results[0][0].transcript;
            sendMessage(transcript);
        };
        try { recognitionRef.current.start(); } catch (err) { console.log(err); }
    };

    const speak = (text) => {
        if (!isLiveMode) return;
        synthRef.current.cancel();
        const utterance = new SpeechSynthesisUtterance(text.replace(/[*#_~]/g, ""));
        utterance.rate = 1.1;
        utterance.onend = () => { if (isLiveMode) startVoice(); };
        synthRef.current.speak(utterance);
    };

    // --- 💾 DATA SYNC & FIREBASE ---
    useEffect(() => {
        if (!currentUser) return;
        const unsub = onSnapshot(doc(db, "users", currentUser.uid), (d) => {
            if (d.exists()) setUserData(d.data());
        });
        const q = query(collection(db, `users/${currentUser.uid}/gallery`), orderBy("timestamp", "desc"), limit(20));
        const unsubGallery = onSnapshot(q, (s) => setGallery(s.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
        return () => { unsub(); unsubGallery(); };
    }, [currentUser]);

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // --- 📨 CORE MESSAGE HANDLER ---
    const sendMessage = async (overrideText = null) => {
        const text = overrideText || input;
        if (!text.trim() && !imagePreview) return;

        setIsSending(true);
        setInput("");
        const img = imagePreview;
        setImagePreview(null);
        setSelectedOption(null);

        const uMsg = { role: "user", content: text, image: img, timestamp: new Date() };
        setMessages(prev => [...prev, uMsg]);

        if (img) {
            await setDoc(doc(collection(db, `users/${currentUser.uid}/gallery`)), {
                url: img, timestamp: Date.now(), subject, mode
            });
        }

        try {
            const res = await axios.post(`${API_BASE}/chat`, {
                userId: currentUser.uid, 
                message: text, 
                mode: mode === "HW" ? "Step-by-Step Problem Solver" : mode,
                subject, 
                chapter, 
                image: img, 
                board: userData.board, 
                class: userData.class
            });

            const reply = res.data.reply;
            const quizOptions = reply.split("\n").filter(l => /^[A-D][).:]/i.test(l.trim()));

            const aiMsg = { 
                role: "ai", 
                content: reply, 
                quiz: quizOptions.length > 1 ? quizOptions : null,
                isNew: true 
            };
            
            setMessages(prev => [...prev, aiMsg]);
            if (isLiveMode) speak(reply);

            // Reward System
            if (reply.toLowerCase().includes("correct")) {
                await updateDoc(doc(db, "users", currentUser.uid), { 
                    score: increment(15), 
                    xp: increment(40),
                    completedChapters: chapter ? arrayUnion(chapter) : userData.completedChapters
                });
                toast.success("+40 XP: Knowledge Gained!");
            }
        } catch (err) { 
            toast.error("Neural Bridge Failed. Check Backend."); 
        }
        setIsSending(false);
    };

    return (
        <div className={`flex h-[100dvh] ${activeTheme.bg} ${activeTheme.text} overflow-hidden font-sans transition-all duration-500`}>
            <ToastContainer theme="dark" />

            {/* --- 📅 STUDY PLANNER OVERLAY --- */}
            <AnimatePresence>
                {showStudyPlan && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowStudyPlan(false)} className="fixed inset-0 bg-black/80 backdrop-blur-md z-[700]" />
                        <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className={`fixed bottom-0 left-0 right-0 h-[85vh] ${activeTheme.bg} border-t ${activeTheme.border} z-[701] p-12 rounded-t-[4rem] overflow-y-auto shadow-[0_-20px_50px_rgba(0,0,0,0.5)]`}>
                            <div className="max-w-4xl mx-auto">
                                <div className="flex justify-between items-center mb-12">
                                    <div>
                                        <h2 className="text-4xl font-black uppercase tracking-tighter">Dhruva Roadmap</h2>
                                        <p className="text-[10px] font-black uppercase opacity-40 tracking-widest mt-2">Active Subject: {subject}</p>
                                    </div>
                                    <button onClick={() => setShowStudyPlan(false)} className="p-5 bg-white/5 rounded-full hover:bg-red-500/20 transition-all"><FaTimes/></button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                                    <div className={`p-8 rounded-[3rem] ${activeTheme.card} border ${activeTheme.border} text-center group transition-all`}>
                                        <FaFire className="text-orange-500 mx-auto mb-4" size={40}/>
                                        <div className="text-3xl font-black">{userData.streak || 1} Days</div>
                                        <div className="text-[10px] font-black uppercase opacity-30 tracking-widest">Learning Streak</div>
                                    </div>
                                    <div className={`p-8 rounded-[3rem] ${activeTheme.card} border ${activeTheme.border} text-center`}>
                                        <FaTrophy className="text-yellow-500 mx-auto mb-4" size={40}/>
                                        <div className="text-3xl font-black">Lvl {Math.floor(userData.xp/1500) + 1}</div>
                                        <div className="text-[10px] font-black uppercase opacity-30 tracking-widest">Neural Rank</div>
                                    </div>
                                    <div className={`p-8 rounded-[3rem] ${activeTheme.card} border ${activeTheme.border} text-center`}>
                                        <FaBolt className="text-indigo-400 mx-auto mb-4" size={40}/>
                                        <div className="text-3xl font-black">{userData.xp}</div>
                                        <div className="text-[10px] font-black uppercase opacity-30 tracking-widest">Total Energy (XP)</div>
                                    </div>
                                </div>

                                <div className="mb-12">
                                    <div className="flex justify-between text-[11px] font-black uppercase mb-4 tracking-widest">
                                        <span className="flex items-center gap-2"><FaChartLine/> {subject} Mastery</span>
                                        <span className="text-indigo-400">{subjectProgress}%</span>
                                    </div>
                                    <div className="w-full h-4 bg-white/5 rounded-full overflow-hidden p-1 border border-white/5">
                                        <motion.div initial={{ width: 0 }} animate={{ width: `${subjectProgress}%` }} className="h-full bg-gradient-to-r from-indigo-600 to-cyan-400 rounded-full shadow-[0_0_20px_rgba(99,102,241,0.6)]" />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-sm font-black uppercase tracking-[0.3em] opacity-40 mb-6 flex items-center gap-2"><FaLayerGroup/> Curriculum Chapters</h3>
                                    {(syllabusData[userData.board]?.[userData.class]?.[subject] || []).map((ch, i) => {
                                        const isDone = userData.completedChapters?.includes(ch);
                                        return (
                                            <motion.div whileHover={{ scale: 1.02, x: 10 }} key={i} className={`flex justify-between items-center p-8 rounded-[2.5rem] border transition-all cursor-pointer ${isDone ? 'bg-indigo-600/10 border-indigo-500/30' : 'bg-white/5 border-white/5'}`} onClick={() => { setChapter(ch); setShowStudyPlan(false); }}>
                                                <div className="flex items-center gap-6">
                                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black ${isDone ? 'bg-indigo-500 text-white' : 'bg-white/5 text-white/20'}`}>
                                                        {isDone ? <FaCheck/> : i + 1}
                                                    </div>
                                                    <span className={`text-lg font-bold ${isDone ? 'text-white' : 'text-white/70'}`}>{ch}</span>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    {isDone && <span className="text-[9px] font-black uppercase text-indigo-400 bg-indigo-400/10 px-3 py-1 rounded-full">Completed</span>}
                                                    <FaChevronLeft className="rotate-180 opacity-20"/>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* --- 🛠️ SIDEBAR SETTINGS --- */}
            <AnimatePresence>
                {showSidebar && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowSidebar(false)} className="fixed inset-0 bg-black/60 z-[500] backdrop-blur-sm" />
                        <motion.div initial={{ x: -400 }} animate={{ x: 0 }} exit={{ x: -400 }} className={`fixed inset-y-0 left-0 w-96 ${activeTheme.bg} border-r ${activeTheme.border} z-[501] p-12 flex flex-col shadow-2xl`}>
                            <div className="flex items-center gap-4 mb-16">
                                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/40">
                                    <FaRobot size={24} className="text-white"/>
                                </div>
                                <h3 className="text-2xl font-black italic tracking-tighter">DHRUVA_CORE</h3>
                            </div>
                            
                            <div className="space-y-12 flex-1">
                                <div>
                                    <label className="text-[10px] font-black uppercase opacity-30 tracking-[0.3em] mb-8 block">System Skins</label>
                                    <div className="grid grid-cols-1 gap-4">
                                        {Object.keys(themes).map(t => (
                                            <button key={t} onClick={() => setThemeName(t)} className={`w-full p-6 rounded-3xl border-2 transition-all text-left flex justify-between items-center ${themeName === t ? 'bg-indigo-600 border-indigo-500 shadow-xl' : 'bg-white/5 border-transparent hover:bg-white/10'}`}>
                                                <span className="text-xs font-bold uppercase tracking-widest">{t}</span>
                                                <div className={`w-4 h-4 rounded-full ${themeName === t ? 'bg-white' : 'bg-white/10'}`} />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                
                                <div className={`p-6 rounded-[2rem] ${activeTheme.card} border ${activeTheme.border}`}>
                                    <h4 className="text-[10px] font-black uppercase tracking-widest mb-4 flex items-center gap-2 opacity-40"><FaUserGraduate/> Profile Status</h4>
                                    <p className="text-xs font-bold opacity-70">{currentUser?.email}</p>
                                    <p className="text-[10px] mt-2 font-black uppercase text-indigo-400">{userData.board} | Class {userData.class}</p>
                                </div>
                            </div>

                            <button onClick={() => auth.signOut()} className="w-full p-6 bg-red-500/10 text-red-500 rounded-3xl font-black text-[11px] uppercase tracking-[0.4em] hover:bg-red-500 hover:text-white transition-all shadow-xl">Terminate Session</button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* --- 🖼️ IMAGE VAULT --- */}
            <AnimatePresence>
                {showGallery && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowGallery(false)} className="fixed inset-0 bg-black/80 z-[600]" />
                        <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} className={`fixed inset-y-0 right-0 w-[450px] ${activeTheme.bg} border-l ${activeTheme.border} z-[601] p-12 overflow-y-auto shadow-2xl`}>
                            <div className="flex justify-between items-center mb-12">
                                <h3 className="text-xs font-black uppercase tracking-[0.5em] opacity-40">Neural Memory</h3>
                                <button onClick={() => setShowGallery(false)} className="p-3 bg-white/5 rounded-full"><FaTimes/></button>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                {gallery.map((img) => (
                                    <motion.div whileHover={{ scale: 1.05 }} key={img.id} className="aspect-square rounded-3xl overflow-hidden border border-white/10 bg-black relative group cursor-pointer shadow-xl">
                                        <img src={img.url} className="w-full h-full object-cover opacity-50 group-hover:opacity-100 transition-opacity" alt="vault" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent flex flex-col justify-end p-5">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">{img.subject}</span>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <div className="flex-1 flex flex-col relative h-full">
                <Navbar currentUser={currentUser} userData={userData} />

                {/* --- 📟 NEURAL HUD --- */}
                <div className="w-full max-w-5xl mx-auto px-10 mt-10 space-y-6 z-[100]">
                    <div className={`flex justify-between items-center ${activeTheme.card} border ${activeTheme.border} p-6 rounded-[2.5rem] px-12 shadow-2xl backdrop-blur-md`}>
                        <div className="flex gap-12">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase opacity-30 tracking-widest flex items-center gap-2"><FaChartLine/> Knowledge Points</span>
                                <span className="text-xl font-black">{userData.score}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase opacity-30 tracking-widest flex items-center gap-2"><FaBolt/> Rank Tier</span>
                                <span className="text-xl font-black text-indigo-400">{userData.xp > 5000 ? 'Architect' : 'Scholar'}</span>
                            </div>
                        </div>
                        <button onClick={() => setShowStudyPlan(true)} className="flex items-center gap-4 px-8 py-4 bg-indigo-600 rounded-full text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-indigo-600/40 hover:scale-105 active:scale-95 transition-all">
                            <FaLightbulb size={18}/> Study Strategy
                        </button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-5">
                        <div className="relative group">
                            <select value={subject} onChange={(e)=>setSubject(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-3xl p-6 text-[11px] font-black uppercase outline-none focus:border-indigo-500 transition-all cursor-pointer appearance-none shadow-xl">
                                {Object.keys(syllabusData[userData.board]?.[userData.class] || {}).map(s => <option key={s} value={s} className="bg-black">{s}</option>)}
                            </select>
                            <FaChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 opacity-20 pointer-events-none"/>
                        </div>
                        <div className="relative group">
                            <select value={chapter} onChange={(e)=>setChapter(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-3xl p-6 text-[11px] font-black uppercase outline-none focus:border-indigo-500 transition-all cursor-pointer appearance-none shadow-xl">
                                <option value="">Universal Query</option>
                                {(syllabusData[userData.board]?.[userData.class]?.[subject] || []).map(ch => <option key={ch} value={ch} className="bg-black">{ch}</option>)}
                            </select>
                            <FaChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 opacity-20 pointer-events-none"/>
                        </div>
                    </div>
                </div>

                {/* --- 💬 NEURAL FEED --- */}
                <div className="flex-1 overflow-y-auto p-6 md:p-16 no-scrollbar pb-80">
                    <div className="max-w-4xl mx-auto space-y-16">
                        {messages.length === 0 && (
                            <div className="text-center py-20 opacity-20 flex flex-col items-center">
                                <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }}>
                                    <FaBrain size={80} className="mb-8 text-indigo-400"/>
                                </motion.div>
                                <p className="text-xs font-black uppercase tracking-[1em]">Core Interface Online</p>
                                <p className="text-[10px] font-black uppercase tracking-widest mt-4">Waiting for learning query...</p>
                            </div>
                        )}
                        {messages.map((msg, i) => (
                            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`p-10 md:p-14 rounded-[4rem] max-w-[85%] shadow-3xl relative ${msg.role === 'user' ? 'bg-indigo-600 rounded-tr-none' : `${activeTheme.card} border ${activeTheme.border} rounded-tl-none`}`}>
                                    {msg.image && <img src={msg.image} className="w-full rounded-[2.5rem] mb-10 shadow-2xl border border-white/10" alt="input-scan" />}
                                    <div className="prose prose-invert prose-md leading-relaxed font-medium selection:bg-indigo-500">
                                        <ReactMarkdown 
                                            remarkPlugins={[remarkGfm, remarkMath]} 
                                            rehypePlugins={[rehypeKatex]}
                                        >
                                            {msg.content}
                                        </ReactMarkdown>
                                    </div>
                                    {msg.role === 'ai' && (
                                        <div className="mt-12 pt-8 border-t border-white/5 flex flex-wrap gap-6">
                                            <button onClick={() => downloadSolution(msg.content)} className="flex items-center gap-3 text-[10px] font-black uppercase opacity-30 hover:opacity-100 transition-all bg-white/5 px-6 py-3 rounded-2xl border border-white/5">
                                                <FaFilePdf className="text-red-500"/> Neural Report
                                            </button>
                                            <button onClick={() => speak(msg.content)} className="flex items-center gap-3 text-[10px] font-black uppercase opacity-30 hover:opacity-100 transition-all bg-white/5 px-6 py-3 rounded-2xl border border-white/5">
                                                <FaVolumeUp className="text-indigo-400"/> Audio Synthesis
                                            </button>
                                        </div>
                                    )}
                                    {msg.quiz && msg.role === 'ai' && (
                                        <div className="mt-12 space-y-5">
                                            <div className="h-px bg-white/10 w-full mb-10" />
                                            {msg.quiz.map((opt, idx) => (
                                                <div key={idx} onClick={() => setSelectedOption(opt)} className={`flex items-center gap-6 p-8 rounded-[2.5rem] cursor-pointer border-2 transition-all ${selectedOption === opt ? 'bg-indigo-600/20 border-indigo-500 shadow-xl' : 'bg-white/5 border-transparent hover:border-white/10'}`}>
                                                    <div className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all ${selectedOption === opt ? 'bg-indigo-500 border-indigo-500 rotate-0' : 'border-white/20 rotate-45'}`}>
                                                        {selectedOption === opt && <FaCheck size={14} className="-rotate-0"/>}
                                                    </div>
                                                    <span className="text-base font-bold tracking-tight">{opt}</span>
                                                </div>
                                            ))}
                                            <button disabled={!selectedOption || isSending} onClick={() => sendMessage(`My answer is: ${selectedOption}`)} className="w-full py-8 bg-indigo-600 rounded-[2.5rem] text-[12px] font-black uppercase tracking-[0.4em] shadow-3xl shadow-indigo-600/50 disabled:opacity-20 active:scale-95 transition-all mt-6">Confirm Answer</button>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                        <div ref={scrollRef} />
                    </div>
                </div>

                {/* --- 🚀 ACTION POD --- */}
                <div className="absolute bottom-0 left-0 w-full p-10 md:p-14 bg-gradient-to-t from-black via-black/95 to-transparent">
                    <div className="max-w-4xl mx-auto">
                        {imagePreview && (
                            <motion.div initial={{ scale: 0, rotate: -10 }} animate={{ scale: 1, rotate: 0 }} className="relative w-40 h-40 mb-10">
                                <img src={imagePreview} className="w-full h-full object-cover rounded-[3rem] border-4 border-indigo-500 shadow-3xl" alt="hw-scan" />
                                <button onClick={() => setImagePreview(null)} className="absolute -top-4 -right-4 bg-red-500 p-3 rounded-full shadow-2xl hover:scale-110 transition-transform"><FaTimes/></button>
                            </motion.div>
                        )}
                        <div className="flex justify-between items-center mb-10 px-8">
                            <div className="flex gap-4">
                                {["Explain", "Quiz", "HW"].map(m => (
                                    <button key={m} onClick={() => setMode(m)} className={`px-12 py-4 rounded-full text-[11px] font-black uppercase tracking-[0.2em] transition-all ${mode === m ? 'bg-indigo-600 shadow-2xl shadow-indigo-600/50 scale-105' : 'bg-white/5 opacity-40 hover:opacity-100 hover:bg-white/10'}`}>{m}</button>
                                ))}
                            </div>
                            <div className="flex gap-5">
                                <button onClick={() => setShowGallery(true)} className="p-5 bg-white/5 rounded-3xl border border-white/10 hover:bg-white/10 transition-all shadow-xl"><FaHistory size={20} className="opacity-40"/></button>
                                <button onClick={() => setShowSidebar(true)} className="p-5 bg-white/5 rounded-3xl border border-white/10 hover:bg-white/10 transition-all shadow-xl"><FaPalette size={20} className="opacity-40"/></button>
                            </div>
                        </div>
                        <div className="bg-[#0c0c0c] border border-white/10 rounded-[4rem] p-4 flex items-center gap-5 shadow-3xl focus-within:border-indigo-500/50 focus-within:ring-4 ring-indigo-500/10 transition-all">
                            <button onClick={() => document.getElementById('hw-up').click()} className="p-6 text-white/20 hover:text-indigo-400 transition-colors"><FaImage size={24}/></button>
                            <input type="file" id="hw-up" hidden onChange={async (e) => {
                                const file = e.target.files[0];
                                if (file) {
                                    const options = { maxSizeMB: 0.5, maxWidthOrHeight: 1024 };
                                    const compressed = await imageCompression(file, options);
                                    setImagePreview(await imageCompression.getDataUrlFromFile(compressed));
                                }
                            }} />
                            <input 
                                value={input} onChange={(e) => setInput(e.target.value)} 
                                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                placeholder={`Ask Dhruva AI about ${subject}...`}
                                className="flex-1 bg-transparent border-none focus:ring-0 text-lg py-8 placeholder:text-white/10 font-medium"
                            />
                            <div className="flex gap-4 mr-4">
                                <button onClick={() => { setIsLiveMode(!isLiveMode); if(!isLiveMode) startVoice(); }} className={`p-6 rounded-full transition-all ${isLiveMode ? 'bg-red-500/20 text-red-500 animate-pulse' : 'bg-white/5 text-white/20 hover:text-indigo-400'}`}>
                                    {isLiveMode ? <FaMicrophone size={24}/> : <FaHeadphones size={24}/>}
                                </button>
                                <button disabled={isSending} onClick={() => sendMessage()} className="p-8 bg-indigo-600 rounded-full hover:scale-110 active:scale-90 transition-all shadow-2xl shadow-indigo-600/50 disabled:opacity-20">
                                    {isSending ? <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"/> : <FaPaperPlane size={24}/>}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
