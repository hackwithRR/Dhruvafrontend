import React, { useEffect, useState, useRef } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import { 
    FaPaperPlane, FaCamera, FaLock, FaSyncAlt, FaTimes, FaMicrophone, 
    FaImage, FaPlus, FaHistory, FaYoutube, FaTrash, 
    FaClock, FaPlay, FaStop, FaTrophy, FaMagic, FaCheckCircle,
    FaVolumeUp, FaVolumeMute 
} from "react-icons/fa";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import 'katex/dist/katex.min.css';
import { doc, getDoc, setDoc, collection, query, getDocs, orderBy, deleteDoc, updateDoc, increment } from "firebase/firestore";
import { db } from "../firebase";
import imageCompression from "browser-image-compression";
import { motion, AnimatePresence } from "framer-motion";

const API_BASE = (process.env.REACT_APP_API_URL || "https://dhruva-backend-production.up.railway.app").replace(/\/$/, "");

const MASTER_SYLLABUS = `
CBSE CLASS 8-12 & ICSE 8-10 Chapter Registry:
CBSE 8 MATH: Rational Numbers, Linear Eq, Quadrilaterals, Practical Geo, Data Handling, Squares/Cubes, Comparing Quantities, Algebra, Mensuration, Exponents, Proportions, Factorisation.
...
Standardize all queries for 'Maths' to 'Mathematics'.
`;

const Typewriter = ({ text }) => {
    const [displayedText, setDisplayedText] = useState("");
    useEffect(() => {
        let i = 0;
        const interval = setInterval(() => {
            setDisplayedText(text.slice(0, i));
            i++;
            if (i > text.length) clearInterval(interval);
        }, 5); 
        return () => clearInterval(interval);
    }, [text]);

    return (
        <ReactMarkdown 
            remarkPlugins={[remarkGfm, remarkMath]} 
            rehypePlugins={[rehypeKatex]}
            className="prose prose-sm prose-invert max-w-none text-xs md:text-sm font-medium leading-relaxed prose-p:mb-5"
        >
            {displayedText}
        </ReactMarkdown>
    );
};

// --- UPDATED PERSISTENT STUDY TIMER ---
const StudyTimer = ({ currentTheme, onComplete }) => {
    const [timeLeft, setTimeLeft] = useState(() => Number(localStorage.getItem("studyTimeLeft")) || 0);
    const [isActive, setIsActive] = useState(() => localStorage.getItem("studyTimerActive") === "true");
    const [initialDuration, setInitialDuration] = useState(() => Number(localStorage.getItem("studyInitialDuration")) || 0);
    const [isOpen, setIsOpen] = useState(false);
    const timerRef = useRef(null);

    useEffect(() => {
        localStorage.setItem("studyTimeLeft", timeLeft);
        localStorage.setItem("studyTimerActive", isActive);
        localStorage.setItem("studyInitialDuration", initialDuration);

        if (isActive && timeLeft > 0) {
            timerRef.current = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        } else if (timeLeft === 0 && isActive) {
            handleStop(true);
        }
        return () => clearInterval(timerRef.current);
    }, [isActive, timeLeft]);

    const handleStop = (isFinished = false) => {
        const timeSpentSeconds = initialDuration - timeLeft;
        const xpEarned = Math.floor(timeSpentSeconds / 60); // 1 XP per minute
        
        if (xpEarned > 0) {
            onComplete(xpEarned);
            toast.success(`Session ${isFinished ? 'Finished' : 'Ended'}: +${xpEarned} XP 🏆`);
        }
        
        setIsActive(false);
        setTimeLeft(0);
        setInitialDuration(0);
        localStorage.removeItem("studyTimeLeft");
        localStorage.removeItem("studyTimerActive");
        localStorage.removeItem("studyInitialDuration");
    };

    const startTimer = (minutes) => {
        const seconds = minutes * 60;
        setTimeLeft(seconds);
        setInitialDuration(seconds);
        setIsActive(true);
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    return (
        <motion.div drag dragMomentum={false} className="fixed z-[100] right-4 top-20 md:right-6 md:top-24 scale-90 md:scale-100">
            <motion.div 
                animate={{ width: isOpen ? "220px" : "48px", height: isOpen ? "250px" : "48px", borderRadius: isOpen ? "24px" : "50%" }}
                className={`flex flex-col overflow-hidden border shadow-2xl backdrop-blur-3xl ${currentTheme.aiBubble} border-white/10 cursor-pointer`}
            >
                {!isOpen ? (
                    <button onClick={() => setIsOpen(true)} className="w-full h-full flex items-center justify-center text-indigo-400">
                        {isActive ? <span className="text-[10px] font-bold text-emerald-400 animate-pulse">{formatTime(timeLeft)}</span> : <FaClock size={18}/>}
                    </button>
                ) : (
                    <div className="p-4 flex flex-col h-full items-center justify-between">
                        <div className="flex justify-between w-full items-center"><span className="text-[9px] font-black uppercase opacity-40">Zen Mode</span><button onClick={() => setIsOpen(false)}><FaTimes size={12}/></button></div>
                        <h2 className="text-4xl font-black font-mono">{formatTime(timeLeft)}</h2>
                        <div className="grid grid-cols-3 gap-1 w-full">{[15, 25, 45].map(m => (<button key={m} onClick={() => startTimer(m)} className="py-2 rounded-lg bg-white/5 text-[8px] font-black">{m}m</button>))}</div>
                        <div className="flex gap-3">
                            <button onClick={() => setIsActive(!isActive)} className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center">{isActive ? <FaStop size={12}/> : <FaPlay size={12}/>}</button>
                            <button onClick={() => handleStop(false)} className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10"><FaTrash size={12}/></button>
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
    const [userData, setUserData] = useState({ board: "CBSE", class: "10", language: "English", xp: 0 });
    const [showSidebar, setShowSidebar] = useState(false);
    const [isLocked, setIsLocked] = useState(false);
    const [subjectInput, setSubjectInput] = useState("");
    const [chapterInput, setChapterInput] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [showLevelUp, setShowLevelUp] = useState(false);
    const [isVoiceActive, setIsVoiceActive] = useState(true);

    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const recognitionRef = useRef(null);

    const themes = {
        DeepSpace: { container: "bg-[#050505] text-white", aiBubble: "bg-white/[0.04] border-white/10", userBubble: "bg-indigo-600", input: "bg-white/[0.03] border-white/10", button: "bg-indigo-600", sidebar: "bg-[#080808] border-white/5" },
        Light: { container: "bg-gray-50 text-gray-900", aiBubble: "bg-white border-gray-200 shadow-sm", userBubble: "bg-indigo-600 text-white", input: "bg-white border-gray-300 shadow-inner", button: "bg-indigo-600", sidebar: "bg-white border-gray-200" },
        Sakura: { container: "bg-[#1a0f12] text-rose-50", aiBubble: "bg-rose-500/10 border-rose-500/20", userBubble: "bg-rose-600", input: "bg-rose-500/5 border-rose-500/10", button: "bg-rose-600", sidebar: "bg-[#221418] border-rose-500/10" },
        Cyberpunk: { container: "bg-[#0a0512] text-cyan-50", aiBubble: "bg-cyan-500/10 border-cyan-500/30", userBubble: "bg-fuchsia-600", input: "bg-cyan-500/5 border-cyan-500/10", button: "bg-cyan-600", sidebar: "bg-[#120a1a] border-cyan-500/20" }
    };
    const currentTheme = themes[theme] || themes.DeepSpace;
    const currentLevel = Math.floor((userData.xp || 0) / 500) + 1;

    const speak = (text) => {
        if (!isVoiceActive) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text.replace(/[*#_~]/g, ""));
        utterance.rate = 1.0;
        window.speechSynthesis.speak(utterance);
    };

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.onresult = (e) => setInput(e.results[0][0].transcript);
            recognitionRef.current.onend = () => setIsListening(false);
        }
    }, []);

    const toggleVoice = () => {
        if (isListening) { recognitionRef.current.stop(); setIsListening(false); }
        else { setInput(""); recognitionRef.current.start(); setIsListening(true); }
    };

    const openCamera = async () => {
        setIsCameraOpen(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
            if (videoRef.current) videoRef.current.srcObject = stream;
        } catch (err) { toast.error("Camera access denied"); setIsCameraOpen(false); }
    };

    const closeCamera = () => {
        if (videoRef.current?.srcObject) videoRef.current.srcObject.getTracks().forEach(track => track.stop());
        setIsCameraOpen(false);
    };

    const capturePhoto = () => {
        const ctx = canvasRef.current.getContext("2d");
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        ctx.drawImage(videoRef.current, 0, 0);
        canvasRef.current.toBlob(async (blob) => {
            setSelectedFile(new File([blob], "capture.jpg", { type: "image/jpeg" }));
            closeCamera();
        }, "image/jpeg", 0.8);
    };

    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isSending]);

    useEffect(() => {
        if (!currentUser) return;
        (async () => {
            const snap = await getDoc(doc(db, "users", currentUser.uid));
            if (snap.exists()) setUserData(snap.data());
            loadSessions();
        })();
    }, [currentUser]);

    const loadSessions = async () => {
        const q = query(collection(db, `users/${currentUser.uid}/sessions`), orderBy("lastUpdate", "desc"));
        const snap = await getDocs(q);
        setSessions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };

    const awardXP = async (amt) => {
        const userRef = doc(db, "users", currentUser.uid);
        const oldLvl = Math.floor((userData.xp || 0) / 500) + 1;
        const newXP = (userData.xp || 0) + amt;
        const newLvl = Math.floor(newXP / 500) + 1;
        await updateDoc(userRef, { xp: increment(amt) });
        setUserData(prev => ({ ...prev, xp: newXP }));
        if (newLvl > oldLvl) setShowLevelUp(true);
    };

    const sendMessage = async (overrideText = null) => {
        const text = overrideText || input;
        if (isSending || (!text.trim() && !selectedFile)) return;

        setIsSending(true);
        const file = selectedFile;
        setInput(""); setSelectedFile(null);

        const userMsg = { role: "user", content: text || "Analyzing image...", image: file ? URL.createObjectURL(file) : null };
        const updatedMsgs = [...messages, userMsg];
        setMessages(updatedMsgs);

        try {
            const stdSub = subjectInput.toLowerCase().startsWith("math") ? "Mathematics" : subjectInput;
            const payload = { userId: currentUser.uid, message: text, mode, subject: stdSub, chapter: chapterInput, language: userData.language, classLevel: userData.class, board: userData.board, syllabusRegistry: MASTER_SYLLABUS };

            let res;
            if (file) {
                const comp = await imageCompression(file, { maxSizeMB: 0.4 });
                const fd = new FormData();
                fd.append("photo", comp);
                Object.keys(payload).forEach(k => fd.append(k, payload[k]));
                res = await axios.post(`${API_BASE}/chat/photo`, fd);
            } else {
                res = await axios.post(`${API_BASE}/chat`, payload);
            }

            const aiMsg = {
                role: "ai",
                content: res.data.reply,
                ytLink: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${userData.board} ${userData.class} ${stdSub} ${text}`)}`,
                suggestions: ["Show Example", "Concept Map", "Quiz Me"]
            };

            const finalMsgs = [...updatedMsgs, aiMsg];
            setMessages(finalMsgs);
            speak(res.data.reply);
            await setDoc(doc(db, `users/${currentUser.uid}/sessions`, currentSessionId), { messages: finalMsgs, lastUpdate: Date.now(), title: stdSub || text.slice(0, 20) }, { merge: true });
            loadSessions();
            awardXP(10); // Standard message XP
        } catch (err) { toast.error("Synthesis failed."); }
        setIsSending(false);
    };

    const deleteSession = async (id, e) => {
        e.stopPropagation();
        await deleteDoc(doc(db, `users/${currentUser.uid}/sessions`, id));
        if (id === currentSessionId) { setMessages([]); setCurrentSessionId(Date.now().toString()); }
        loadSessions();
    };

    return (
        <div className={`flex h-[100dvh] w-full overflow-hidden transition-all duration-500 ${currentTheme.container}`}>
            <ToastContainer theme="dark" position="top-center" autoClose={2000} hideProgressBar />
            
            {/* PERSISTENT SIDEBAR - Works on Desktop and Mobile */}
            <AnimatePresence>
                {(showSidebar || window.innerWidth > 1024) && (
                    <>
                        {showSidebar && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowSidebar(false)} className="fixed inset-0 bg-black/80 z-[150] backdrop-blur-md lg:hidden" />}
                        <motion.div initial={{ x: -300 }} animate={{ x: 0 }} className={`fixed lg:relative z-[200] w-[85%] md:w-80 h-full flex flex-col p-6 border-r ${currentTheme.sidebar}`}>
                            <div className="flex justify-between items-center mb-10">
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-2"><FaTrophy className="text-yellow-500"/><span className="text-[10px] font-black uppercase text-white/50">Level {currentLevel}</span></div>
                                    <div className="w-32 h-1.5 bg-white/5 mt-2 rounded-full overflow-hidden"><div className="h-full bg-indigo-600" style={{ width: `${(userData.xp % 500) / 5}%` }} /></div>
                                </div>
                                <button onClick={() => setShowSidebar(false)} className="lg:hidden p-2 opacity-30"><FaTimes/></button>
                            </div>
                            <button onClick={() => {setMessages([]); setCurrentSessionId(Date.now().toString());}} className="w-full py-4 mb-8 rounded-2xl bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all"><FaPlus className="inline mr-2"/> New Brainstorm</button>
                            <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar">
                                {sessions.map(s => (
                                    <div key={s.id} onClick={() => {setCurrentSessionId(s.id); setMessages(s.messages || []);}} className={`group p-4 rounded-2xl border transition-all cursor-pointer relative ${currentSessionId === s.id ? 'bg-indigo-600/10 border-indigo-600/30' : 'border-transparent hover:bg-white/5'}`}>
                                        <span className="text-[10px] font-black truncate block uppercase tracking-tighter w-[80%]">{s.title || "Study Session"}</span>
                                        <button onClick={(e) => deleteSession(s.id, e)} className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-30 transition-opacity"><FaTrash size={10}/></button>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <div className="flex-1 flex flex-col h-full relative min-w-0">
                <Navbar currentUser={currentUser} theme={theme} setTheme={setTheme} logout={logout} userData={userData}/>
                <StudyTimer currentTheme={currentTheme} onComplete={awardXP} />

                {/* MAIN CHAT CONTENT */}
                <div className="flex-1 overflow-y-auto px-4 py-6 no-scrollbar">
                    <div className="max-w-4xl mx-auto space-y-12">
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-96 opacity-10 text-center uppercase tracking-[0.4em] text-xs"><FaMagic size={40} className="mb-4"/><p>Select a Mode to Start</p></div>
                        )}
                        {messages.map((msg, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                                <div className={`max-w-[95%] md:max-w-[85%] p-5 md:p-8 rounded-3xl md:rounded-[3rem] shadow-2xl relative ${msg.role === "user" ? `${currentTheme.userBubble} text-white` : `${currentTheme.aiBubble} backdrop-blur-3xl`}`}>
                                    {msg.image && <img src={msg.image} className="rounded-2xl mb-6 max-h-72 w-full object-cover" alt="input" />}
                                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]} className="prose prose-sm prose-invert max-w-none text-xs md:text-sm prose-p:mb-4">
                                        {msg.content}
                                    </ReactMarkdown>
                                    {msg.role === "ai" && msg.ytLink && (
                                        <a href={msg.ytLink} target="_blank" rel="noreferrer" className="mt-6 flex items-center justify-center gap-3 py-4 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase"><FaYoutube size={18}/> Watch Lesson</a>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                        <div ref={messagesEndRef} className="h-32" />
                    </div>
                </div>

                {/* FOOTER INPUT */}
                <div className="p-3 md:p-10 bg-gradient-to-t from-black/80 to-transparent">
                    <div className="max-w-4xl mx-auto">
                        <div className={`flex items-center gap-1 p-2 rounded-[4rem] border ${currentTheme.input} backdrop-blur-3xl`}>
                            <button onClick={() => setShowSidebar(true)} className="p-4 text-indigo-500 rounded-full"><FaHistory size={20}/></button>
                            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMessage()} placeholder="Ask anything..." className="flex-1 bg-transparent px-4 py-2 outline-none text-sm font-bold" />
                            <div className="flex items-center gap-1">
                                <button onClick={toggleVoice} className={`p-4 rounded-full ${isListening ? 'bg-red-500 text-white' : 'text-indigo-500'}`}><FaMicrophone size={20}/></button>
                                <button onClick={() => fileInputRef.current.click()} className="p-4 text-indigo-500"><FaImage size={20}/><input type="file" ref={fileInputRef} hidden onChange={e => setSelectedFile(e.target.files[0])} /></button>
                                <button onClick={() => sendMessage()} disabled={isSending} className={`p-6 rounded-full ${currentTheme.button} text-white`}>
                                    {isSending ? <FaSyncAlt className="animate-spin" size={16}/> : <FaPaperPlane size={16}/>}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
