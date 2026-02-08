import React, { useEffect, useState, useRef, useMemo } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import {
    FaPaperPlane, FaTimes, FaImage, FaHistory, FaDownload, FaChevronLeft, 
    FaHeadphones, FaCheck, FaClock, FaSignOutAlt, FaBrain, FaChevronDown, 
    FaPalette, FaTrophy, FaChartLine, FaLightbulb, FaMicrophone, FaVolumeUp,
    FaBook, FaFilePdf, FaRegSquare, FaCheckSquare
} from "react-icons/fa";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import 'katex/dist/katex.min.css';
import { 
    doc, setDoc, collection, query, updateDoc, increment, onSnapshot, 
    orderBy, limit, getDoc 
} from "firebase/firestore";
import { db, auth } from "../firebase";
import imageCompression from "browser-image-compression";
import { motion, AnimatePresence } from "framer-motion";
import jsPDF from "jspdf";

const API_BASE = (process.env.REACT_APP_API_URL || "https://dhruva-backend-production.up.railway.app").replace(/\/$/, "");

// --- 🎨 ENHANCED THEME ENGINE ---
const themes = {
    DeepSpace: { bg: "bg-[#050505]", card: "bg-white/5", border: "border-white/10", primary: "indigo-600", text: "text-white", secondary: "text-indigo-400" },
    Light: { bg: "bg-[#f8fafc]", card: "bg-white shadow-xl", border: "border-slate-200", primary: "indigo-600", text: "text-slate-900", secondary: "text-indigo-600" },
    Cyberpunk: { bg: "bg-[#0a0a0f]", card: "bg-cyan-950/20", border: "border-cyan-500/30", primary: "cyan-500", text: "text-cyan-50", secondary: "text-cyan-400" },
    Midnight: { bg: "bg-[#0f172a]", card: "bg-slate-800/50", border: "border-slate-700", primary: "blue-500", text: "text-slate-100", secondary: "text-blue-400" }
};

// --- 📚 COMPREHENSIVE SYLLABUS (PRODUCTION READY) ---
const syllabusData = {
    CBSE: {
        "8": {
            "MATHEMATICS": ["Rational Numbers", "Linear Equations", "Understanding Quadrilaterals", "Practical Geometry", "Data Handling", "Squares and Roots", "Cubes and Roots", "Comparing Quantities", "Algebraic Expressions", "Visualising Solid Shapes", "Mensuration", "Exponents and Powers", "Direct and Inverse Proportions", "Factorisation", "Introduction to Graphs", "Playing with Numbers"],
            "SCIENCE": ["Crop Production", "Microorganisms", "Synthetic Fibres", "Metals and Non-Metals", "Coal and Petroleum", "Combustion", "Conservation", "Cell Structure", "Reproduction", "Adolescence", "Force", "Friction", "Sound", "Chemical Effects", "Light", "Solar System", "Pollution"]
        },
        "9": {
            "MATHEMATICS": ["Number Systems", "Polynomials", "Coordinate Geometry", "Linear Equations", "Euclid Geometry", "Lines and Angles", "Triangles", "Quadrilaterals", "Areas", "Circles", "Constructions", "Heron’s Formula", "Surface Areas", "Statistics", "Probability"],
            "SCIENCE": ["Matter", "Pure Matter", "Atoms and Molecules", "Atomic Structure", "Fundamental Unit", "Tissues", "Diversity", "Motion", "Force", "Gravitation", "Work", "Sound", "Why Do We Fall Ill", "Natural Resources", "Food Resources"]
        },
        "10": {
            "MATHEMATICS": ["Real Numbers", "Polynomials", "Linear Equations", "Quadratic Equations", "Arithmetic Progression", "Triangles", "Coordinate Geometry", "Trigonometry", "Heights and Distances", "Circles", "Constructions", "Areas", "Surface Areas", "Statistics", "Probability"],
            "SCIENCE": ["Chemical Reactions", "Acids and Bases", "Metals", "Carbon Compounds", "Life Processes", "Control", "Reproduction", "Heredity", "Light", "Human Eye", "Electricity", "Magnetism", "Environment", "Energy Sources"]
        }
    },
    ICSE: {
        "8": {
            "MATHEMATICS": ["Rational Numbers", "Exponents", "Squares", "Cubes", "Algebra", "Linear Equations", "Factorisation", "Ratio", "Percentages", "Profit and Loss", "Interest", "Polygons", "Quadrilaterals", "Construction", "Mensuration", "Data Handling"],
            "PHYSICS": ["Matter", "Measurement", "Force", "Energy", "Light", "Heat", "Sound", "Electricity"],
            "CHEMISTRY": ["Matter", "Changes", "Elements", "Atomic Structure", "Reactions", "Hydrogen", "Water", "Carbon"],
            "BIOLOGY": ["Plant Tissues", "Animal Tissues", "Transport", "Reproduction", "Ecosystem", "Human Body", "Health"]
        },
        "9": {
            "MATHEMATICS": ["Rational Numbers", "Indices", "Algebraic Expressions", "Factorisation", "Linear Equations", "Expansions", "Coordinate Geometry", "Triangles", "Pythagoras", "Rectilinear Figures", "Circles", "Mensuration", "Statistics", "Trigonometry"],
            "PHYSICS": ["Measurements", "Motion", "Laws of Motion", "Fluids", "Heat", "Light", "Sound"],
            "CHEMISTRY": ["Matter", "Atomic Structure", "Periodic Table", "Chemical Bonding", "Gases", "Acids, Bases and Salts"],
            "BIOLOGY": ["Cell", "Tissues", "Diversity", "Plant Physiology", "Human Physiology", "Health and Hygiene"]
        },
        "10": {
            "MATHEMATICS": ["Quadratic Equations", "Linear Inequations", "Ratio", "Matrices", "Arithmetic Progression", "Coordinate Geometry", "Similarity", "Trigonometry", "Heights", "Mensuration", "Probability", "Statistics"],
            "PHYSICS": ["Force", "Work, Power and Energy", "Machines", "Refraction", "Spectrum", "Sound", "Electricity", "Magnetism", "Induction", "Radioactivity"],
            "CHEMISTRY": ["Periodic Properties", "Chemical Bonding", "Acids", "Analytical Chemistry", "Metallurgy", "Organic Chemistry"],
            "BIOLOGY": ["Cell Cycle", "Genetics", "Plant Physiology", "Human Anatomy", "Population", "Environment"]
        }
    }
};

// --- 📟 COMPONENTS ---
const Typewriter = ({ text, speed = 7 }) => {
    const [displayed, setDisplayed] = useState("");
    useEffect(() => {
        let i = 0;
        const t = setInterval(() => {
            setDisplayed(text.slice(0, i));
            i++; if (i > text.length) clearInterval(t);
        }, speed);
        return () => clearInterval(t);
    }, [text]);
    return <span>{displayed}</span>;
};

export default function Chat() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    
    // Core State
    const [messages, setMessages] = useState([]);
    const [userData, setUserData] = useState({ board: "CBSE", class: "10", xp: 0, score: 0 });
    const [input, setInput] = useState("");
    const [mode, setMode] = useState("Explain");
    const [subject, setSubject] = useState("");
    const [chapter, setChapter] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);
    
    // UI State
    const [showGallery, setShowGallery] = useState(false);
    const [showSidebar, setShowSidebar] = useState(false);
    const [gallery, setGallery] = useState([]);
    const [themeName, setThemeName] = useState("DeepSpace");
    const activeTheme = themes[themeName];
    const [selectedOption, setSelectedOption] = useState(null);
    const [timer, setTimer] = useState(0);

    // Live Mode State
    const [isLiveMode, setIsLiveMode] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef(null);
    const synthRef = useRef(window.speechSynthesis);
    const scrollRef = useRef(null);

    // --- 📄 PDF EXPORTER ---
    const exportToPDF = (msgContent) => {
        const doc = new jsPDF();
        doc.setFillColor(5, 5, 5);
        doc.rect(0, 0, 210, 297, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.text("DHRUVA AI - STUDY REPORT", 20, 30);
        doc.setFontSize(10);
        doc.setTextColor(150, 150, 150);
        doc.text(`Subject: ${subject} | Chapter: ${chapter} | Mode: ${mode}`, 20, 40);
        doc.setDrawColor(79, 70, 229);
        doc.line(20, 45, 190, 45);
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(11);
        const splitText = doc.splitTextToSize(msgContent.replace(/[*#]/g, ""), 170);
        doc.text(splitText, 20, 55);
        doc.save(`Dhruva_Solution_${Date.now()}.pdf`);
        toast.info("PDF Saved to Downloads");
    };

    // --- 🎙️ VOICE HANDSHAKE ---
    const initVoice = () => {
        const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!Speech) return;
        recognitionRef.current = new Speech();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.onstart = () => setIsListening(true);
        recognitionRef.current.onend = () => setIsListening(false);
        recognitionRef.current.onresult = (e) => {
            const result = e.results[0][0].transcript;
            sendMessage(result);
        };
    };

    const speak = (text) => {
        if (!isLiveMode) return;
        synthRef.current.cancel();
        const cleanText = text.replace(/[*#_~]/g, "").replace(/\[.*?\]/g, "");
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.rate = 1.1;
        utterance.pitch = 1.0;
        utterance.onend = () => { if (isLiveMode) recognitionRef.current?.start(); };
        synthRef.current.speak(utterance);
    };

    // --- 💾 DATA SYNC ---
    useEffect(() => {
        if (!currentUser) return;
        initVoice();
        const unsub = onSnapshot(doc(db, "users", currentUser.uid), (d) => {
            if (d.exists()) setUserData(d.data());
        });
        const q = query(collection(db, `users/${currentUser.uid}/gallery`), orderBy("timestamp", "desc"), limit(20));
        const unsubGallery = onSnapshot(q, (s) => setGallery(s.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
        
        const tInterval = setInterval(() => setTimer(p => p + 1), 1000);
        return () => { unsub(); unsubGallery(); clearInterval(tInterval); };
    }, [currentUser]);

    useEffect(() => {
        if (userData.board && userData.class) {
            const subs = Object.keys(syllabusData[userData.board][userData.class]);
            if (!subject) setSubject(subs[0]);
        }
    }, [userData]);

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // --- 📨 SEND LOGIC ---
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
                mode: mode === "HW" ? "Analyze Homework Pic & Provide Solutions" : mode,
                subject, chapter, image: img, board: userData.board, class: userData.class
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

            if (reply.toLowerCase().includes("correct") || reply.toLowerCase().includes("well done")) {
                await updateDoc(doc(db, "users", currentUser.uid), { score: increment(15), xp: increment(30) });
            }
        } catch (err) { toast.error("Neural Link Failed."); }
        setIsSending(false);
    };

    return (
        <div className={`flex h-[100dvh] ${activeTheme.bg} ${activeTheme.text} overflow-hidden font-sans transition-colors duration-500`}>
            <ToastContainer />

            {/* --- 🛠️ SIDEBAR --- */}
            <AnimatePresence>
                {showSidebar && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowSidebar(false)} className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[500]" />
                        <motion.div initial={{ x: -400 }} animate={{ x: 0 }} exit={{ x: -400 }} className={`fixed inset-y-0 left-0 w-80 ${activeTheme.bg} border-r ${activeTheme.border} z-[501] p-8 flex flex-col shadow-2xl`}>
                            <div className="flex justify-between items-center mb-10">
                                <h3 className="text-xl font-black uppercase italic tracking-tighter">Dhruva OS</h3>
                                <button onClick={() => setShowSidebar(false)} className="p-2 bg-white/5 rounded-full"><FaChevronLeft/></button>
                            </div>
                            <div className="space-y-8 flex-1 overflow-y-auto no-scrollbar">
                                <section>
                                    <label className="text-[10px] font-black uppercase opacity-30 tracking-[0.2em] mb-4 block">Visual Interface</label>
                                    <div className="grid grid-cols-1 gap-3">
                                        {Object.keys(themes).map(t => (
                                            <button key={t} onClick={() => setThemeName(t)} className={`w-full p-4 rounded-2xl border ${activeTheme.border} text-left flex items-center justify-between transition-all ${themeName === t ? 'bg-indigo-600 border-indigo-500 scale-[1.02]' : 'bg-white/5 hover:bg-white/10'}`}>
                                                <span className="text-xs font-bold">{t}</span>
                                                <div className={`w-3 h-3 rounded-full ${t === 'Light' ? 'bg-indigo-600' : 'bg-white'}`} />
                                            </button>
                                        ))}
                                    </div>
                                </section>
                                <section className={`p-6 rounded-[2.5rem] ${activeTheme.card} border ${activeTheme.border} relative overflow-hidden`}>
                                    <FaTrophy className="text-yellow-500 mb-2 relative z-10" size={24}/>
                                    <div className="text-3xl font-black relative z-10">LVL {Math.floor(userData.xp/500) + 1}</div>
                                    <div className="text-[10px] opacity-40 uppercase tracking-widest relative z-10">{userData.xp} Total XP</div>
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-600/10 blur-3xl rounded-full -mr-10 -mt-10" />
                                </section>
                            </div>
                            <button onClick={() => auth.signOut()} className="mt-4 p-5 rounded-2xl bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-red-500 hover:text-white transition-all"><FaSignOutAlt className="inline mr-2"/> Shutdown</button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* --- 🖼️ IMAGE VAULT --- */}
            <AnimatePresence>
                {showGallery && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowGallery(false)} className="fixed inset-0 bg-black/80 z-[600]" />
                        <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} className={`fixed inset-y-0 right-0 w-85 ${activeTheme.bg} border-l ${activeTheme.border} z-[601] p-8 overflow-y-auto`}>
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="text-xs font-black uppercase tracking-[0.3em]">Knowledge Vault</h3>
                                <button onClick={() => setShowGallery(false)}><FaTimes/></button>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                {gallery.map((img) => (
                                    <motion.div whileHover={{ scale: 1.05 }} key={img.id} className="aspect-square rounded-2xl overflow-hidden border border-white/10 bg-black relative group cursor-pointer">
                                        <img src={img.url} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                                        <div className="absolute inset-0 flex flex-col justify-end p-3 bg-gradient-to-t from-black to-transparent">
                                            <p className="text-[8px] font-black uppercase truncate">{img.subject}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* --- 🎙️ LIVE OVERLAY --- */}
            <AnimatePresence>
                {isLiveMode && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[1000] bg-black flex flex-col items-center justify-center p-12">
                        <div className="relative">
                            <motion.div animate={{ scale: isListening ? [1, 1.2, 1] : 1, rotate: isListening ? [0, 5, -5, 0] : 0 }} transition={{ repeat: Infinity, duration: 2 }} className="w-56 h-56 rounded-full border-2 border-indigo-500/20 bg-indigo-500/5 flex items-center justify-center">
                                <FaBrain size={64} className="text-indigo-500" />
                            </motion.div>
                            {isListening && <div className="absolute inset-0 rounded-full border border-indigo-500 animate-ping" />}
                        </div>
                        <h2 className="mt-12 text-2xl font-black uppercase tracking-[0.4em] text-white">
                            {isListening ? "Listening..." : "Processing..."}
                        </h2>
                        <p className="mt-4 text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Dhruva Neural Link Active</p>
                        <button onClick={() => setIsLiveMode(false)} className="mt-24 p-8 rounded-full bg-white/5 border border-white/10 hover:bg-red-500/20 transition-all"><FaTimes size={24}/></button>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex-1 flex flex-col relative h-full">
                <Navbar currentUser={currentUser} userData={userData} />

                {/* --- 📟 INTERFACE CONTROLS --- */}
                <div className="w-full max-w-4xl mx-auto px-6 mt-8 space-y-4 z-[100]">
                    <div className={`flex justify-between items-center ${activeTheme.card} border ${activeTheme.border} p-4 rounded-2xl px-8 shadow-sm`}>
                        <div className="flex gap-6 items-center">
                            <div className="flex flex-col">
                                <span className="text-[8px] font-black uppercase opacity-40">Global Rank</span>
                                <span className={`text-xs font-black ${activeTheme.secondary}`}>#{Math.floor(1000 / (userData.score || 1))}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[8px] font-black uppercase opacity-40">Session Score</span>
                                <span className="text-xs font-black">{userData.score}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 px-4 py-1.5 bg-white/5 rounded-full border border-white/5">
                            <FaClock className="text-[10px] opacity-30"/>
                            <span className="text-[10px] font-black font-mono">{Math.floor(timer/60)}:{(timer%60).toString().padStart(2,'0')}</span>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="relative group">
                            <select value={subject} onChange={(e)=>setSubject(e.target.value)} className={`w-full appearance-none ${activeTheme.card} border ${activeTheme.border} rounded-2xl p-5 text-[10px] font-black uppercase tracking-[0.2em] outline-none cursor-pointer hover:border-indigo-500 transition-colors`}>
                                {Object.keys(syllabusData[userData.board][userData.class]).map(s => <option key={s} value={s} className="bg-black">{s}</option>)}
                            </select>
                            <FaChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 opacity-20 group-hover:opacity-100 transition-opacity" size={10}/>
                        </div>
                        <div className="relative group">
                            <select value={chapter} onChange={(e)=>setChapter(e.target.value)} className={`w-full appearance-none ${activeTheme.card} border ${activeTheme.border} rounded-2xl p-5 text-[10px] font-black uppercase tracking-[0.2em] outline-none cursor-pointer hover:border-indigo-500 transition-colors`}>
                                <option value="">Select Chapter</option>
                                {(syllabusData[userData.board][userData.class][subject] || []).map(ch => <option key={ch} value={ch} className="bg-black">{ch}</option>)}
                            </select>
                            <FaChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 opacity-20 group-hover:opacity-100 transition-opacity" size={10}/>
                        </div>
                    </div>
                </div>

                {/* --- 💬 NEURAL FEED --- */}
                <div className="flex-1 overflow-y-auto p-4 md:p-12 no-scrollbar pb-72">
                    <div className="max-w-4xl mx-auto space-y-14">
                        {messages.map((msg, i) => (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`p-8 rounded-[3rem] max-w-[85%] shadow-2xl relative group ${msg.role === 'user' ? 'bg-indigo-600 rounded-tr-none text-white' : `${activeTheme.card} border ${activeTheme.border} rounded-tl-none`}`}>
                                    {msg.image && <img src={msg.image} className="w-full rounded-3xl mb-6 border border-white/10 shadow-lg" alt="context" />}
                                    <div className="prose prose-invert prose-sm leading-[1.8] font-medium">
                                        {msg.role === 'ai' && msg.isNew ? (
                                            <Typewriter text={msg.content} />
                                        ) : (
                                            <ReactMarkdown 
                                                remarkPlugins={[remarkGfm, remarkMath]} 
                                                rehypePlugins={[rehypeKatex]}
                                            >
                                                {msg.content}
                                            </ReactMarkdown>
                                        )}
                                    </div>
                                    
                                    {msg.role === 'ai' && (
                                        <div className="flex gap-4 mt-6">
                                            <button onClick={() => exportToPDF(msg.content)} className="flex items-center gap-2 text-[9px] font-black uppercase opacity-30 hover:opacity-100 transition-all bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                                                <FaFilePdf/> Export Solution
                                            </button>
                                        </div>
                                    )}

                                    {/* --- ✅ NEURAL TICK BOXES --- */}
                                    {msg.quiz && msg.role === 'ai' && (
                                        <div className="mt-10 space-y-4">
                                            <div className="h-px bg-white/10 w-full mb-6" />
                                            {msg.quiz.map((opt, idx) => (
                                                <div key={idx} onClick={() => setSelectedOption(opt)} className={`flex items-center gap-5 p-5 rounded-3xl cursor-pointer transition-all border-2 ${selectedOption === opt ? 'bg-indigo-600/20 border-indigo-500 shadow-lg shadow-indigo-600/10' : 'bg-white/5 border-transparent hover:border-white/10'}`}>
                                                    <div className={`w-6 h-6 rounded-xl border-2 flex items-center justify-center transition-colors ${selectedOption === opt ? 'bg-indigo-500 border-indigo-500' : 'border-white/20'}`}>
                                                        {selectedOption === opt ? <FaCheck size={12} className="text-white" /> : <div className="w-1.5 h-1.5 rounded-full bg-white/10" />}
                                                    </div>
                                                    <span className="text-sm font-bold tracking-tight">{opt}</span>
                                                </div>
                                            ))}
                                            <button 
                                                disabled={!selectedOption || isSending} 
                                                onClick={() => sendMessage(`Option selected: ${selectedOption}`)} 
                                                className="w-full py-5 mt-4 bg-indigo-600 rounded-[2rem] text-[11px] font-black uppercase tracking-[0.3em] shadow-xl shadow-indigo-600/30 active:scale-95 disabled:opacity-20 transition-all"
                                            >
                                                Confirm Choice
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                        <div ref={scrollRef} className="h-10" />
                    </div>
                </div>

                {/* --- 🚀 COMMAND CENTER --- */}
                <div className="absolute bottom-0 left-0 w-full p-8 bg-gradient-to-t from-black via-black/90 to-transparent">
                    <div className="max-w-4xl mx-auto">
                        {imagePreview && (
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="relative w-28 h-28 mb-6 group">
                                <img src={imagePreview} className="w-full h-full object-cover rounded-[2rem] border-2 border-indigo-500 shadow-2xl shadow-indigo-600/40" alt="hw" />
                                <button onClick={() => setImagePreview(null)} className="absolute -top-3 -right-3 bg-red-500 p-2 rounded-full shadow-lg hover:scale-110 transition-transform"><FaTimes/></button>
                            </motion.div>
                        )}
                        <div className="flex items-center justify-between mb-5 px-2">
                            <div className="flex gap-3">
                                {["Explain", "Quiz", "HW"].map(m => (
                                    <button key={m} onClick={() => setMode(m)} className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${mode === m ? 'bg-indigo-600 shadow-lg shadow-indigo-600/40' : 'bg-white/5 hover:bg-white/10 opacity-60'}`}>{m}</button>
                                ))}
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => setShowGallery(true)} className="p-3.5 bg-white/5 border border-white/10 rounded-2xl text-white/40 hover:text-white transition-colors"><FaHistory/></button>
                                <button onClick={() => setShowSidebar(true)} className="p-3.5 bg-white/5 border border-white/10 rounded-2xl text-white/40 hover:text-white transition-colors"><FaChartLine/></button>
                            </div>
                        </div>
                        <div className="bg-[#111] border border-white/10 rounded-[3rem] p-3 flex items-center gap-3 shadow-2xl focus-within:border-indigo-500/50 transition-all">
                            <button onClick={() => document.getElementById('hw-up').click()} className="p-4 text-white/20 hover:text-indigo-400 transition-colors"><FaImage size={22}/></button>
                            <input type="file" id="hw-up" hidden onChange={async (e) => {
                                const file = e.target.files[0];
                                if (file) setImagePreview(await imageCompression.getDataUrlFromFile(file));
                            }} />
                            <input 
                                value={input} 
                                onChange={(e) => setInput(e.target.value)} 
                                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                placeholder={imagePreview ? "Context detected. Ask me to solve or explain..." : `Query Dhruva about ${subject}...`}
                                className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-4 placeholder:text-white/10 font-medium"
                            />
                            <div className="flex gap-3 mr-3">
                                <button onClick={() => { setIsLiveMode(true); startListening(); }} className="p-4 bg-white/5 rounded-full hover:bg-indigo-600/20 transition-all"><FaHeadphones/></button>
                                <button disabled={isSending} onClick={() => sendMessage()} className="p-4 bg-indigo-600 rounded-full hover:scale-110 transition-transform disabled:opacity-20 shadow-lg shadow-indigo-600/30"><FaPaperPlane size={20}/></button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
