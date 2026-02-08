import React, { useEffect, useState, useRef } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import {
    FaPaperPlane, FaCamera, FaSyncAlt, FaTimes, FaMicrophone,
    FaImage, FaPlus, FaHistory, FaYoutube, FaTrash,
    FaClock, FaPlay, FaStop, FaTrophy, FaCheckCircle,
    FaWaveSquare, FaEdit, FaChevronLeft, FaHeadphones, FaCheck, FaCoins
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
const MASTER_SYLLABUS = `CBSE/ICSE 8-10 MATH/SCIENCE Integrated.`;

const RankBadge = ({ xp, level }) => {
    const progress = (xp % 500) / 5;
    const ranks = ["Novice", "Scholar", "Sage", "Expert", "Master", "Grandmaster"];
    const currentRank = ranks[Math.min(Math.floor((level - 1) / 2), ranks.length - 1)];
    return (
        <div className="p-4 bg-gradient-to-br from-indigo-600/20 to-fuchsia-600/10 rounded-3xl border border-white/10 shadow-xl mb-6">
            <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg"><FaTrophy className="text-white" size={16} /></div>
                <div>
                    <h4 className="text-[9px] font-black uppercase tracking-widest text-indigo-400">{currentRank}</h4>
                    <h3 className="text-md font-black text-white leading-none">Level {level}</h3>
                </div>
            </div>
            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className="h-full bg-gradient-to-r from-indigo-500 to-fuchsia-500" />
            </div>
        </div>
    );
};

const StudyTimer = ({ currentTheme, onComplete }) => {
    const [timeLeft, setTimeLeft] = useState(() => Number(localStorage.getItem("dhruva_timeLeft")) || 0);
    const [isActive, setIsActive] = useState(() => localStorage.getItem("dhruva_timerActive") === "true");
    const [initialTime, setInitialTime] = useState(() => Number(localStorage.getItem("dhruva_initialTime")) || 0);
    const [isOpen, setIsOpen] = useState(false);
    const timerRef = useRef(null);

    useEffect(() => {
        localStorage.setItem("dhruva_timeLeft", timeLeft);
        localStorage.setItem("dhruva_timerActive", isActive);
        localStorage.setItem("dhruva_initialTime", initialTime);
        if (isActive && timeLeft > 0) {
            timerRef.current = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        } else if (timeLeft === 0 && isActive) {
            handleComplete(true);
        }
        return () => clearInterval(timerRef.current);
    }, [isActive, timeLeft]);

    const handleComplete = (isFinished) => {
        const secondsStudied = initialTime - timeLeft;
        // Logic: 1 XP every 3 minutes (180 seconds)
        const earnedXP = Math.floor(secondsStudied / 180);
        if (earnedXP > 0) { onComplete(earnedXP); toast.success(`+${earnedXP} XP Earned for studying!`); }
        setIsActive(false); setTimeLeft(0); setInitialTime(0);
    };

    return (
        <motion.div drag dragMomentum={false} className="fixed z-[100] right-4 top-24">
            <motion.div animate={{ width: isOpen ? "220px" : "50px", height: isOpen ? "240px" : "50px", borderRadius: "25px" }} className={`flex flex-col overflow-hidden border shadow-2xl backdrop-blur-3xl ${currentTheme.aiBubble} border-white/10`}>
                {!isOpen ? (
                    <button onClick={() => setIsOpen(true)} className="w-full h-full flex items-center justify-center text-indigo-400">
                        {isActive ? <span className="text-[10px] font-bold animate-pulse">{Math.ceil(timeLeft / 60)}m</span> : <FaClock size={18} />}
                    </button>
                ) : (
                    <div className="p-4 flex flex-col h-full justify-between">
                        <div className="flex justify-between items-center text-[8px] font-black uppercase opacity-40"><span>Study Sessions</span><button onClick={() => setIsOpen(false)}><FaTimes /></button></div>
                        <div className="text-3xl font-mono font-black text-center">{Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}</div>
                        <div className="grid grid-cols-3 gap-1">{[15, 30, 60].map(m => (<button key={m} onClick={() => { setTimeLeft(m * 60); setInitialTime(m * 60); setIsActive(true); }} className="py-2 rounded-xl bg-white/5 text-[9px] font-black hover:bg-indigo-600">{m}m</button>))}</div>
                        <div className="flex gap-2">
                            <button onClick={() => setIsActive(!isActive)} className="flex-1 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">{isActive ? <FaStop /> : <FaPlay />}</button>
                            <button onClick={() => handleComplete(false)} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center"><FaTrash size={12}/></button>
                        </div>
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
};

const VoiceWaveform = ({ isActive }) => (
    <div className={`flex items-center gap-0.5 h-4 px-2 ${isActive ? 'opacity-100' : 'opacity-0'} transition-all`}>
        {[1, 2, 3, 4, 5].map(i => (
            <motion.div key={i} animate={{ height: isActive ? [4, 16, 8, 14, 4] : 4 }} transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1 }} className="w-0.5 bg-indigo-400 rounded-full" />
        ))}
    </div>
);

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
    const [subjectInput, setSubjectInput] = useState("");
    const [chapterInput, setChapterInput] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isLiveMode, setIsLiveMode] = useState(false);
    const [isAiSpeaking, setIsAiSpeaking] = useState(false);
    const [editingSessionId, setEditingSessionId] = useState(null);
    const [newSessionName, setNewSessionName] = useState("");

    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const recognitionRef = useRef(null);

    const themes = {
        DeepSpace: { container: "bg-[#050505] text-white", aiBubble: "bg-white/[0.04] border-white/10", userBubble: "bg-indigo-600", input: "bg-[#111111] border-white/10", sidebar: "bg-[#080808] border-white/5" },
        Light: { container: "bg-gray-50 text-gray-900", aiBubble: "bg-white border-gray-200", userBubble: "bg-indigo-600 text-white", input: "bg-white border-gray-300", sidebar: "bg-white border-gray-200" },
        Sakura: { container: "bg-[#1a0f12] text-rose-50", aiBubble: "bg-rose-500/10 border-rose-500/20", userBubble: "bg-rose-600", input: "bg-[#221418] border-rose-500/10", sidebar: "bg-[#221418] border-rose-500/10" },
        Cyberpunk: { container: "bg-[#0a0512] text-cyan-50", aiBubble: "bg-cyan-500/10 border-cyan-500/30", userBubble: "bg-fuchsia-600", input: "bg-[#120a1a] border-cyan-500/10", sidebar: "bg-[#120a1a] border-cyan-500/20" }
    };
    const currentTheme = themes[theme] || themes.DeepSpace;
    const currentLevel = Math.floor((userData.xp || 0) / 500) + 1;

    // --- VOICE ENGINE ---
    const speak = (text) => {
        if (!isLiveMode) return;
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text.replace(/[*#_]/g, ""));
        utter.rate = 1.1;
        utter.onstart = () => {
            setIsAiSpeaking(true);
            if (recognitionRef.current) recognitionRef.current.stop();
        };
        utter.onend = () => {
            setIsAiSpeaking(false);
            if (isLiveMode) {
                setTimeout(() => handleVoiceToggle(true), 600);
            }
        };
        window.speechSynthesis.speak(utter);
    };

    useEffect(() => {
        const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (Speech) {
            recognitionRef.current = new Speech();
            recognitionRef.current.continuous = false;
            recognitionRef.current.onresult = (e) => {
                const t = e.results[0][0].transcript;
                setInput(t);
                if (t.length > 2) sendMessage(t);
            };
            recognitionRef.current.onend = () => setIsListening(false);
        }
    }, []);

    const handleVoiceToggle = (force = false) => {
        if (isListening && !force) {
            recognitionRef.current.stop();
        } else {
            try { recognitionRef.current.start(); setIsListening(true); } catch(e){}
        }
    };

    const toggleLiveMode = () => {
        if (!isLiveMode) {
            setIsLiveMode(true);
            handleVoiceToggle(true);
            toast.info("Live Mode Active");
        } else {
            setIsLiveMode(false);
            window.speechSynthesis.cancel();
            recognitionRef.current?.stop();
        }
    };

    const awardXP = async (amt) => {
        if (amt <= 0) return;
        await updateDoc(doc(db, "users", currentUser.uid), { xp: increment(amt) });
        setUserData(p => ({ ...p, xp: p.xp + amt }));
    };

    const sendMessage = async (override = null) => {
        const text = override || input;
        if (isSending || (!text.trim() && !selectedFile)) return;
        setIsSending(true);
        const file = selectedFile;
        setInput(""); setSelectedFile(null);

        const userMsg = { role: "user", content: text, image: file ? URL.createObjectURL(file) : null };
        setMessages(prev => [...prev, userMsg]);

        try {
            const payload = { userId: currentUser.uid, message: text, mode, subject: subjectInput, chapter: chapterInput, classLevel: userData.class, board: userData.board };
            let res = file ? await axios.post(`${API_BASE}/chat/photo`, payload) : await axios.post(`${API_BASE}/chat`, payload);
            
            const reply = res.data.reply;

            // --- YOUTUBE LINK LOGIC ---
            let yt = null;
            if (text.length > 5) { // Ensure it's not just "hi"
                if (mode === "Explain") {
                    yt = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${userData.board} Class ${userData.class} ${subjectInput} ${chapterInput} ${text}`)}`;
                } else if (mode === "Homework" || mode === "Quiz") {
                    yt = `https://www.youtube.com/results?search_query=${encodeURIComponent(`How to solve ${text}`)}`;
                }
            }

            // --- REWARD SYSTEM ---
            let earned = 0;
            if (mode === "Quiz" && (reply.toLowerCase().includes("correct") || reply.toLowerCase().includes("right"))) {
                earned = 20; 
                toast.success("+20 XP: Correct Answer!");
            } else if (mode === "Explain") {
                earned = 5; 
            }

            const aiMsg = { role: "ai", content: reply, ytLink: yt };
            const finalMsgs = [...messages, userMsg, aiMsg];
            setMessages(finalMsgs);
            
            if (isLiveMode) speak(reply);
            if (earned > 0) awardXP(earned);

            await setDoc(doc(db, `users/${currentUser.uid}/sessions`, currentSessionId), { messages: finalMsgs, lastUpdate: Date.now() }, { merge: true });
        } catch (err) { toast.error("Connection failed"); }
        setIsSending(false);
    };

    // Use effect for Rank and History loading
    useEffect(() => {
        if (!currentUser) return;
        (async () => {
            const snap = await getDoc(doc(db, "users", currentUser.uid));
            if (snap.exists()) setUserData(snap.data());
            const q = query(collection(db, `users/${currentUser.uid}/sessions`), orderBy("lastUpdate", "desc"));
            const sSnap = await getDocs(q);
            setSessions(sSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        })();
    }, [currentUser]);

    return (
        <div className={`flex h-[100dvh] w-full overflow-hidden ${currentTheme.container}`}>
            <ToastContainer theme="dark" position="top-center" autoClose={2000} />

            <AnimatePresence>
                {showSidebar && (
                    <motion.div initial={{ x: -320 }} animate={{ x: 0 }} exit={{ x: -320 }} className={`fixed lg:relative z-[200] w-72 h-full flex flex-col p-6 border-r ${currentTheme.sidebar} backdrop-blur-2xl shadow-2xl`}>
                        <div className="flex justify-between items-center mb-6"><span className="text-[10px] font-black uppercase opacity-40">Learning History</span><button onClick={() => setShowSidebar(false)} className="p-2 rounded-full hover:bg-white/5"><FaChevronLeft /></button></div>
                        <RankBadge xp={userData.xp} level={currentLevel} />
                        <button onClick={() => { setMessages([]); setCurrentSessionId(Date.now().toString()); setShowSidebar(false); }} className="w-full py-4 mb-6 rounded-2xl bg-indigo-600 text-white font-black text-[10px] uppercase flex items-center justify-center gap-2 shadow-lg"><FaPlus /> New Brainstorm</button>
                        <div className="flex-1 overflow-y-auto space-y-2 no-scrollbar">
                            {sessions.map(s => (
                                <div key={s.id} onClick={() => { setCurrentSessionId(s.id); setMessages(s.messages || []); setShowSidebar(false); }} className={`p-4 rounded-2xl border transition-all cursor-pointer ${currentSessionId === s.id ? 'bg-indigo-600/10 border-indigo-600/40' : 'border-transparent hover:bg-white/5'}`}>
                                    <span className="text-[10px] font-black truncate block uppercase">{s.title || "Study Session"}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex-1 flex flex-col h-full relative min-w-0">
                <Navbar currentUser={currentUser} theme={theme} setTheme={setTheme} logout={logout} userData={userData} />
                <StudyTimer currentTheme={currentTheme} onComplete={awardXP} />

                <div className="w-full max-w-4xl mx-auto px-4 pt-6 space-y-4">
                    <div className={`flex items-center gap-2 p-1 rounded-2xl border ${currentTheme.input}`}>
                        <input value={subjectInput} onChange={e => setSubjectInput(e.target.value)} placeholder="Subject" className="w-24 bg-transparent px-4 py-2 text-[10px] font-black uppercase outline-none" />
                        <input value={chapterInput} onChange={e => setChapterInput(e.target.value)} placeholder="Topic/Chapter" className="flex-1 bg-transparent px-4 py-2 text-[10px] font-black uppercase outline-none" />
                    </div>
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                        {["Explain", "Quiz", "Homework", "Summary"].map(m => (
                            <button key={m} onClick={() => setMode(m)} className={`px-4 py-2 text-[9px] font-black uppercase rounded-lg border transition-all ${mode === m ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white/5 border-white/5 opacity-50'}`}>{m}</button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-6 no-scrollbar">
                    <div className="max-w-4xl mx-auto space-y-8">
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                                <div className={`max-w-[85%] p-6 rounded-[2rem] shadow-2xl ${msg.role === "user" ? `${currentTheme.userBubble} rounded-tr-none text-white` : `${currentTheme.aiBubble} rounded-tl-none border border-white/5 backdrop-blur-3xl`}`}>
                                    {msg.image && <img src={msg.image} className="rounded-2xl mb-4 max-h-64 w-full object-cover" />}
                                    <ReactMarkdown className="prose prose-sm prose-invert text-sm leading-relaxed" remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{msg.content}</ReactMarkdown>
                                    {msg.ytLink && (
                                        <a href={msg.ytLink} target="_blank" rel="noreferrer" className="mt-6 flex items-center justify-center gap-2 py-4 bg-red-600/10 hover:bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase border border-red-600/20 transition-all">
                                            <FaYoutube size={16} /> Explore Video Content
                                        </a>
                                    )}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} className="h-20" />
                    </div>
                </div>

                <div className="p-4 md:p-8">
                    <div className="max-w-4xl mx-auto">
                        <div className={`flex flex-col w-full rounded-[2.5rem] border shadow-2xl ${currentTheme.input}`}>
                            <div className="flex items-end gap-1 p-2">
                                <button onClick={() => fileInputRef.current.click()} className="p-3 text-white/40"><FaImage size={18} /><input type="file" ref={fileInputRef} hidden onChange={e => setSelectedFile(e.target.files[0])} /></button>
                                <textarea 
                                    value={input} 
                                    onChange={e => setInput(e.target.value)}
                                    placeholder={isLiveMode ? "Listening..." : "Ask anything..."}
                                    className="flex-1 bg-transparent py-3 px-2 outline-none text-sm resize-none"
                                />
                                <div className="flex items-center gap-1 pb-1">
                                    <VoiceWaveform isActive={isListening || isAiSpeaking} />
                                    <button onClick={toggleLiveMode} className={`p-3 rounded-full ${isLiveMode ? 'bg-indigo-600' : 'text-white/40'}`}><FaHeadphones size={18} /></button>
                                    <button onClick={() => sendMessage()} className="p-3.5 bg-white text-black rounded-full"><FaPaperPlane size={14} /></button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
