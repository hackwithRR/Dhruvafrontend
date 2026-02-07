import React, { useEffect, useState, useRef } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import { 
    FaPaperPlane, FaCamera, FaLock, FaSyncAlt, FaTimes, FaUndo, 
    FaImage, FaPlus, FaHistory, FaUnlock, FaYoutube, 
    FaClock, FaPlay, FaPause, FaStop, FaLightbulb, FaQuestion, 
    FaBookOpen, FaGraduationCap, FaUserCog, FaMicrophone,
    FaBolt, FaChartLine, FaMedal, FaTrophy, FaStar 
} from "react-icons/fa";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { doc, getDoc, setDoc, collection, query, getDocs, orderBy, updateDoc, increment } from "firebase/firestore";
import { db } from "../firebase";
import imageCompression from "browser-image-compression";
import { motion, AnimatePresence } from "framer-motion";

import 'katex/dist/katex.min.css';

const API_BASE = (process.env.REACT_APP_API_URL || "https://dhruva-backend-production.up.railway.app").replace(/\/$/, "");

// --- AUDIO HELPERS ---
const playVictorySound = () => {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const notes = [
        { freq: 523.25, time: 0 },    // C5
        { freq: 659.25, time: 0.15 }, // E5
        { freq: 783.99, time: 0.3 },  // G5
        { freq: 1046.50, time: 0.5 }  // C6
    ];
    notes.forEach(note => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(note.freq, audioCtx.currentTime + note.time);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime + note.time);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + note.time + 0.4);
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start(audioCtx.currentTime + note.time);
        osc.stop(audioCtx.currentTime + note.time + 0.5);
    });
};

// --- SUB-COMPONENTS ---
const ActionChips = ({ mode, onChipClick }) => {
    const chips = {
        Explain: ["Explain like a friend", "Real-world example", "Is this for exams?"],
        Doubt: ["I'm still confused", "One more example", "Quick shortcut?"],
        Quiz: ["Give me a hint", "Did I get it right?", "Next question buddy!"],
        Summary: ["Just the main points", "Make a simple table", "TL;DR version"]
    };
    return (
        <div className="flex flex-wrap gap-2 mt-4 animate-in fade-in slide-in-from-bottom-2">
            {chips[mode]?.map((chip) => (
                <button key={chip} onClick={() => onChipClick(chip)} className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-[10px] font-bold uppercase hover:bg-indigo-600 transition-all flex items-center gap-2">
                    <FaBolt className="text-yellow-400" /> {chip}
                </button>
            ))}
        </div>
    );
};

const StudyTimer = ({ currentTheme, onSessionComplete }) => {
    const [timeLeft, setTimeLeft] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [initialTime, setInitialTime] = useState(0);
    const timerRef = useRef(null);

    useEffect(() => {
        if (isActive && timeLeft > 0) { timerRef.current = setInterval(() => setTimeLeft(prev => prev - 1), 1000); }
        else if (timeLeft === 0 && isActive) { 
            setIsActive(false); 
            toast.success("Awesome focus, buddy! Take a breather. ☕"); 
            if (onSessionComplete) onSessionComplete(Math.floor(initialTime / 60));
        }
        return () => clearInterval(timerRef.current);
    }, [isActive, timeLeft, initialTime, onSessionComplete]);

    const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
    return (
        <motion.div drag dragMomentum={false} initial={{ x: 20, y: 150 }} className="fixed z-[100] cursor-grab active:cursor-grabbing">
            <motion.div animate={{ width: isOpen ? "240px" : "64px", height: isOpen ? "280px" : "64px" }} className={`overflow-hidden rounded-[2rem] border backdrop-blur-3xl shadow-2xl flex flex-col ${currentTheme.aiBubble} border-white/20`}>
                {!isOpen ? (<button onClick={() => setIsOpen(true)} className="w-full h-full flex items-center justify-center text-indigo-500"><FaClock size={24} className={isActive ? "animate-spin-slow" : "animate-pulse"} /></button>) : (
                    <div className="p-5 flex flex-col h-full">
                        <div className="flex justify-between items-center mb-4"><span className="text-[10px] font-black uppercase opacity-50 italic">Focus Timer</span><button onClick={() => setIsOpen(false)}><FaTimes size={12} /></button></div>
                        <div className="flex-1 flex flex-col items-center justify-center">
                            <h2 className="text-4xl font-black mb-6 font-mono">{formatTime(timeLeft)}</h2>
                            {timeLeft === 0 ? (<div className="grid grid-cols-2 gap-2 w-full">{[15, 25, 45, 60].map(m => (<button key={m} onClick={() => { setTimeLeft(m * 60); setInitialTime(m * 60); setIsActive(true); }} className="py-2 rounded-xl bg-white/5 hover:bg-indigo-500 text-[10px] font-bold transition-all">{m}m</button>))}</div>) : (
                                <div className="flex gap-4"><button onClick={() => setIsActive(!isActive)} className="p-4 rounded-full bg-indigo-500 text-white">{isActive ? <FaPause /> : <FaPlay />}</button><button onClick={() => { setTimeLeft(0); setIsActive(false); }} className="p-4 rounded-full bg-red-500/20 text-red-500"><FaStop /></button></div>
                            )}
                        </div>
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
};

// --- MAIN CHAT ENGINE ---
export default function Chat() {
    const { currentUser, logout, theme, setTheme } = useAuth();
   // --- STATE MANAGEMENT ---
    const [messages, setMessages] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [currentSessionId, setCurrentSessionId] = useState(Date.now().toString());
    const [input, setInput] = useState("");
    const [mode, setMode] = useState("Explain");
    const [isSending, setIsSending] = useState(false);
    const [userData, setUserData] = useState({ stats: { totalMinutes: 0 } });
    const [showSidebar, setShowSidebar] = useState(false);
    const [showAchievement, setShowAchievement] = useState(null);
    const [isListening, setIsListening] = useState(false);
    const [isLiveMode, setIsLiveMode] = useState(false);
    
    // Fixed: Added missing state for Subject and Chapter
    const [subjectInput, setSubjectInput] = useState("");
    const [chapterInput, setChapterInput] = useState("");

    const chatContainerRef = useRef(null);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    const currentTheme = { container: "bg-[#050505] text-white", aiBubble: "bg-white/5 border border-white/10", userBubble: "bg-indigo-600 shadow-lg", input: "bg-white/[0.03] border-white/10 text-white", button: "bg-indigo-600", sidebar: "bg-[#0A0A0A] border-r border-white/10" };

    // --- VOICE CONTROL ---
    const speakText = (text) => {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text.replace(/[*#_~]/g, ""));
        const voices = window.speechSynthesis.getVoices();
        const indianMale = voices.find(v => v.lang.includes("en-IN") && v.name.toLowerCase().includes("male")) || voices.find(v => v.lang.includes("en-IN"));
        if (indianMale) utterance.voice = indianMale;
        utterance.onend = () => { if (isLiveMode) startVoiceMode(); };
        window.speechSynthesis.speak(utterance);
    };

    const startVoiceMode = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return;
        const rec = new SpeechRecognition();
        rec.lang = 'en-IN';
        setIsListening(true);
        rec.start();
        rec.onresult = (e) => { 
            const t = e.results[0][0].transcript;
            setIsListening(false); 
            sendMessage(t); 
        };
        rec.onerror = () => { setIsListening(false); if (isLiveMode) setTimeout(startVoiceMode, 1000); };
    };

    // --- PROGRESS TRACKING ---
    useEffect(() => {
        if (!currentUser) return;
        const fetchUserData = async () => {
            const snap = await getDoc(doc(db, "users", currentUser.uid));
            if (snap.exists()) setUserData(prev => ({ ...prev, ...snap.data() }));
        };
        fetchUserData();
    }, [currentUser]);

    const trackStudyProgress = async (minutes) => {
        if (!currentUser) return;
        const userRef = doc(db, "users", currentUser.uid);
        const oldMins = userData.stats?.totalMinutes || 0;
        const newMins = oldMins + minutes;
        
        await updateDoc(userRef, { "stats.totalMinutes": increment(minutes) });
        
        const milestones = [
            { limit: 60, title: "Advanced Scholar", icon: <FaMedal />, desc: "1 Hour of Deep Work! Keep going buddy!" },
            { limit: 300, title: "Expert Scholar", icon: <FaTrophy />, desc: "5 Hours of Mastery! You're crushing it!" }
        ];

        const newlyUnlocked = milestones.find(m => oldMins < m.limit && newMins >= m.limit);
        if (newlyUnlocked) { playVictorySound(); setShowAchievement(newlyUnlocked); }
        setUserData(prev => ({ ...prev, stats: { totalMinutes: newMins } }));
    };

    const sendMessage = async (voiceInput = null) => {
        const text = voiceInput || input;
        if (isSending || !text.trim()) return;
        setIsSending(true); setInput("");
        const userMsg = { role: "user", content: text, timestamp: Date.now() };
        setMessages(prev => [...prev, userMsg]);

        try {
            // Friend-mode behavioral prompt
            const friendPrompt = `[System: You are a friendly, supportive Indian study buddy. Use terms like 'buddy', 'don't worry', and 'we'll solve this together'. Keep it conversational but accurate.] ${text}`;
            const res = await axios.post(`${API_BASE}/chat`, { userId: currentUser.uid, message: friendPrompt, mode });
            
            const aiMsg = { role: "ai", content: res.data.reply, timestamp: Date.now() };
            setMessages(prev => [...prev, aiMsg]);
            if (isLiveMode || voiceInput) speakText(res.data.reply);
        } catch (e) { toast.error("Oops! Connection issue buddy."); }
        setIsSending(false);
    };

    return (
        <div className={`flex h-screen w-full overflow-hidden ${currentTheme.container}`}>
            <ToastContainer theme="dark" position="top-center" />
            
            {/* SIDEBAR */}
            <AnimatePresence>
                {showSidebar && (
                    <motion.div initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }} className={`fixed lg:relative z-[150] w-80 h-full flex flex-col p-6 shadow-2xl ${currentTheme.sidebar}`}>
                        <div className="flex justify-between items-center mb-8">
                            <span className="text-[10px] font-black uppercase opacity-40 tracking-widest">Scholar Profile</span>
                            <button onClick={() => setShowSidebar(false)} className="p-2 hover:bg-white/5 rounded-full"><FaTimes /></button>
                        </div>
                        
                        <div className="mb-8 p-6 rounded-[2.5rem] bg-indigo-600/10 border border-indigo-500/20">
                            <h4 className="text-[10px] font-black uppercase opacity-40 mb-1 tracking-widest">Focus Level</h4>
                            <p className="text-xl font-black italic text-indigo-400">
                                {(userData.stats?.totalMinutes || 0) >= 300 ? "Master Scholar" : (userData.stats?.totalMinutes || 0) >= 60 ? "Advanced" : "Novice"}
                            </p>
                            <div className="flex gap-4 mt-6">
                                <div className="text-center">
                                    <p className="text-[8px] font-black opacity-30 uppercase">Time</p>
                                    <p className="text-sm font-bold">{Math.floor((userData.stats?.totalMinutes || 0) / 60)}h {(userData.stats?.totalMinutes || 0) % 60}m</p>
                                </div>
                                <div className="h-8 w-[1px] bg-white/10 mx-2" />
                                <div className="text-center">
                                    <p className="text-[8px] font-black opacity-30 uppercase">Badges</p>
                                    <div className="flex gap-1 justify-center">
                                        {(userData.stats?.totalMinutes || 0) >= 60 && <FaMedal className="text-yellow-500" />}
                                        {(userData.stats?.totalMinutes || 0) >= 300 && <FaTrophy className="text-orange-500" />}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button onClick={() => setMessages([])} className={`w-full py-4 rounded-2xl text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg ${currentTheme.button}`}>
                            <FaPlus /> New Session Buddy
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex-1 flex flex-col min-w-0 h-full relative">
                <Navbar currentUser={currentUser} theme={theme} setTheme={setTheme} logout={logout} />
                <StudyTimer currentTheme={currentTheme} onSessionComplete={trackStudyProgress} />

                {/* HEADER ACTIONS */}
                <div className="max-w-4xl mx-auto w-full px-4 pt-6 flex items-center gap-4">
                    <button onClick={() => setShowSidebar(!showSidebar)} className="p-4 rounded-2xl bg-white/5 border border-white/10 shadow-xl">
                        <FaHistory />
                    </button>
                    <div className="flex-1 p-4 rounded-[2rem] bg-white/5 border border-white/10 flex items-center gap-4 shadow-xl">
                        <FaBookOpen className="text-indigo-500" />
                        <input value={subjectInput} onChange={e => setSubjectInput(e.target.value)} placeholder="Which subject today?" className="bg-transparent text-sm font-bold outline-none flex-1" />
                    </div>
                </div>

                {/* MESSAGES */}
                <div ref={chatContainerRef} className="flex-1 overflow-y-auto px-4 py-8 no-scrollbar scroll-smooth">
                    <div className="max-w-3xl mx-auto space-y-10 pb-20">
                        {messages.length === 0 && (
                            <div className="text-center py-20 opacity-10">
                                <FaGraduationCap size={60} className="mx-auto mb-4" />
                                <p className="font-bold uppercase tracking-widest text-sm italic">Let's start learning, buddy!</p>
                            </div>
                        )}
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                                <div className={`max-w-[85%] p-7 rounded-[2.5rem] ${msg.role === "user" ? `${currentTheme.userBubble} rounded-tr-none` : `${currentTheme.aiBubble} rounded-tl-none`}`}>
                                    <div className="prose prose-sm dark:prose-invert max-w-none">
                                        <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{msg.content}</ReactMarkdown>
                                    </div>
                                    {msg.role === "ai" && i === messages.length - 1 && !isSending && (
                                        <ActionChips mode={mode} onChipClick={sendMessage} />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* INPUT BAR */}
                <div className="p-4 md:p-10 shrink-0">
                    <div className="max-w-3xl mx-auto flex items-center p-2 rounded-[3rem] border bg-white/5 border-white/10 shadow-2xl backdrop-blur-xl">
                        <input value={input} onChange={e => setInput(e.target.value)} placeholder={isListening ? "I'm listening buddy..." : "Tell me your doubt..."} className="flex-1 bg-transparent px-6 py-4 outline-none font-bold text-sm" onKeyDown={e => e.key === "Enter" && sendMessage()} />
                        <div className="flex items-center gap-2 pr-2">
                            <button onClick={() => { setIsLiveMode(!isLiveMode); if(!isLiveMode) startVoiceMode(); }} className={`p-4 rounded-full transition-all ${isLiveMode ? 'bg-indigo-600 shadow-lg scale-110' : 'opacity-30'}`}>
                                <FaMicrophone />
                            </button>
                            <button onClick={() => sendMessage()} disabled={isSending} className="p-5 bg-indigo-600 rounded-full text-white shadow-lg">
                                {isSending ? <FaSyncAlt className="animate-spin" /> : <FaPaperPlane />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ACHIEVEMENT POPUP */}
            <AnimatePresence>
                {showAchievement && (
                    <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5 }} className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/70 backdrop-blur-md">
                        <div className="bg-gradient-to-br from-indigo-600 to-purple-800 p-12 rounded-[4rem] text-center border-4 border-white/20 shadow-[0_0_100px_rgba(79,70,229,0.4)] max-w-sm">
                            <motion.div animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.2, 1] }} transition={{ duration: 0.5 }} className="text-7xl mb-6 flex justify-center text-yellow-400">
                                {showAchievement.icon}
                            </motion.div>
                            <h2 className="text-3xl font-black text-white italic tracking-tighter mb-2 uppercase">LEVEL UP!</h2>
                            <p className="text-white/80 font-bold mb-8 leading-relaxed">{showAchievement.desc}</p>
                            <button onClick={() => setShowAchievement(null)} className="w-full py-4 bg-white text-indigo-700 font-black rounded-3xl shadow-xl hover:bg-indigo-50 transition-all">
                                AWESOME BUDDY!
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
