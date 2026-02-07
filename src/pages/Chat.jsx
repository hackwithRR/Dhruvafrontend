import React, { useEffect, useState, useRef } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import { 
    FaPaperPlane, FaTimes, FaPlus, FaHistory, 
    FaClock, FaPlay, FaPause, FaStop, 
    FaBookOpen, FaGraduationCap, FaMicrophone,
    FaBolt, FaMedal, FaTrophy, FaSyncAlt, FaPalette,
    FaCamera, FaImage
} from "react-icons/fa";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { doc, getDoc, updateDoc, increment } from "firebase/firestore";
import { db } from "../firebase";
import { motion, AnimatePresence } from "framer-motion";
import imageCompression from "browser-image-compression";

import 'katex/dist/katex.min.css';

const API_BASE = (process.env.REACT_APP_API_URL || "https://dhruva-backend-production.up.railway.app").replace(/\/$/, "");

// --- THEME PRESETS ---
const THEME_PRESETS = {
    DeepSpace: { container: "bg-[#050505] text-white", aiBubble: "bg-white/5 border-white/10", userBubble: "bg-indigo-600 shadow-lg", accent: "text-indigo-400", btn: "bg-indigo-600", sidebar: "bg-[#0A0A0A]" },
    Sakura: { container: "bg-[#1a0f12] text-rose-100", aiBubble: "bg-rose-500/10 border-rose-500/20", userBubble: "bg-rose-600 shadow-lg", accent: "text-rose-400", btn: "bg-rose-600", sidebar: "bg-[#221418]" },
    Forest: { container: "bg-[#0a120a] text-emerald-100", aiBubble: "bg-emerald-500/10 border-emerald-500/20", userBubble: "bg-emerald-600 shadow-lg", accent: "text-emerald-400", btn: "bg-emerald-600", sidebar: "bg-[#0e1a0e]" },
    Cyberpunk: { container: "bg-[#0a0512] text-cyan-100", aiBubble: "bg-fuchsia-500/10 border-cyan-500/30", userBubble: "bg-fuchsia-600 shadow-lg", accent: "text-fuchsia-400", btn: "bg-cyan-600", sidebar: "bg-[#120a1a]" },
    Midnight: { container: "bg-[#000000] text-blue-100", aiBubble: "bg-blue-900/20 border-blue-500/20", userBubble: "bg-blue-700 shadow-lg", accent: "text-blue-400", btn: "bg-blue-700", sidebar: "bg-[#050510]" },
    Sunset: { container: "bg-[#120a05] text-orange-100", aiBubble: "bg-orange-500/10 border-orange-500/20", userBubble: "bg-orange-600 shadow-lg", accent: "text-orange-400", btn: "bg-orange-600", sidebar: "bg-[#1a0f0a]" },
    Lavender: { container: "bg-[#0f0a12] text-purple-100", aiBubble: "bg-purple-500/10 border-purple-500/20", userBubble: "bg-purple-600 shadow-lg", accent: "text-purple-400", btn: "bg-purple-600", sidebar: "bg-[#160e1c]" },
    Ghost: { container: "bg-[#0a0a0a] text-gray-100", aiBubble: "bg-white/5 border-white/5", userBubble: "bg-gray-700 shadow-lg", accent: "text-gray-400", btn: "bg-gray-800", sidebar: "bg-[#111111]" }
};

// --- AUDIO HELPERS ---
const playVictorySound = () => {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const notes = [{ f: 523, t: 0 }, { f: 659, t: 0.15 }, { f: 783, t: 0.3 }, { f: 1046, t: 0.5 }];
    notes.forEach(n => {
        const osc = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        osc.frequency.setValueAtTime(n.f, audioCtx.currentTime + n.t);
        g.gain.setValueAtTime(0.1, audioCtx.currentTime + n.t);
        g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + n.t + 0.4);
        osc.connect(g); g.connect(audioCtx.destination);
        osc.start(audioCtx.currentTime + n.t); osc.stop(audioCtx.currentTime + n.t + 0.5);
    });
};

// --- FOCUS TIMER ---
const StudyTimer = ({ currentTheme, onSessionComplete }) => {
    const [timeLeft, setTimeLeft] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [initialTime, setInitialTime] = useState(0);
    const timerRef = useRef(null);

    useEffect(() => {
        if (isActive && timeLeft > 0) { 
            timerRef.current = setInterval(() => setTimeLeft(prev => prev - 1), 1000); 
        } else if (timeLeft === 0 && isActive) { 
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
                {!isOpen ? (
                    <button onClick={() => setIsOpen(true)} className="w-full h-full flex items-center justify-center text-white">
                        <FaClock size={24} className={isActive ? "animate-spin-slow" : "animate-pulse"} />
                    </button>
                ) : (
                    <div className="p-5 flex flex-col h-full text-white">
                        <div className="flex justify-between items-center mb-4"><span className="text-[10px] font-black uppercase opacity-50 italic">Focus Timer</span><button onClick={() => setIsOpen(false)}><FaTimes size={12} /></button></div>
                        <div className="flex-1 flex flex-col items-center justify-center">
                            <h2 className="text-4xl font-black mb-6 font-mono">{formatTime(timeLeft)}</h2>
                            {timeLeft === 0 ? (
                                <div className="grid grid-cols-2 gap-2 w-full">
                                    {[15, 25, 45, 60].map(m => (
                                        <button key={m} onClick={() => { setTimeLeft(m * 60); setInitialTime(m * 60); setIsActive(true); }} className={`py-2 rounded-xl text-white text-[10px] font-bold transition-all ${currentTheme.btn}`}>{m}m</button>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex gap-4">
                                    <button onClick={() => setIsActive(!isActive)} className={`p-4 rounded-full text-white ${currentTheme.btn}`}>{isActive ? <FaPause /> : <FaPlay />}</button>
                                    <button onClick={() => { setTimeLeft(0); setIsActive(false); }} className="p-4 rounded-full bg-red-500/20 text-red-500"><FaStop /></button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
};

// --- CHAT ENGINE ---
export default function Chat() {
    const { currentUser, logout, theme, setTheme } = useAuth();
    
    // --- ALL STATE VARIABLES ---
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [mode, setMode] = useState("Explain");
    const [isSending, setIsSending] = useState(false);
    const [userData, setUserData] = useState({ stats: { totalMinutes: 0 } });
    const [showSidebar, setShowSidebar] = useState(false);
    const [showAchievement, setShowAchievement] = useState(null);
    const [isListening, setIsListening] = useState(false);
    const [isLiveMode, setIsLiveMode] = useState(false);
    const [subjectInput, setSubjectInput] = useState("");
    const [selectedImage, setSelectedImage] = useState(null);
    const [isCameraActive, setIsCameraActive] = useState(false);

    const chatContainerRef = useRef(null);
    const fileInputRef = useRef(null);
    const videoRef = useRef(null);
    const currentTheme = THEME_PRESETS[theme] || THEME_PRESETS.DeepSpace;

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
            setIsListening(false); sendMessage(t); 
        };
        rec.onerror = () => { setIsListening(false); if (isLiveMode) setTimeout(startVoiceMode, 1000); };
    };

    // --- PHOTO / GALLERY LOGIC ---
    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const compressedFile = await imageCompression(file, { maxSizeMB: 1, maxWidthOrHeight: 1024 });
        const reader = new FileReader();
        reader.readAsDataURL(compressedFile);
        reader.onloadend = () => setSelectedImage(reader.result);
    };

    const startCamera = async () => {
        setIsCameraActive(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) videoRef.current.srcObject = stream;
        } catch (err) {
            toast.error("Camera access denied buddy!");
            setIsCameraActive(false);
        }
    };

    const capturePhoto = () => {
        const canvas = document.createElement("canvas");
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        canvas.getContext("2d").drawImage(videoRef.current, 0, 0);
        setSelectedImage(canvas.toDataURL("image/jpeg"));
        stopCamera();
    };

    const stopCamera = () => {
        if (videoRef.current?.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(track => track.stop());
        }
        setIsCameraActive(false);
    };

    // --- DATA HANDLING ---
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
            { limit: 60, title: "Advanced Scholar", icon: <FaMedal />, desc: "1 Hour buddy! Proud of you!" },
            { limit: 300, title: "Expert Scholar", icon: <FaTrophy />, desc: "5 Hours! You're a beast!" }
        ];
        const newlyUnlocked = milestones.find(m => oldMins < m.limit && newMins >= m.limit);
        if (newlyUnlocked) { playVictorySound(); setShowAchievement(newlyUnlocked); }
        setUserData(prev => ({ ...prev, stats: { totalMinutes: newMins } }));
    };

    const sendMessage = async (voiceInput = null) => {
        const text = voiceInput || input;
        if (isSending || (!text.trim() && !selectedImage)) return;
        
        setIsSending(true);
        const currentImage = selectedImage;
        setSelectedImage(null);
        setInput("");

        const userMsg = { role: "user", content: text, image: currentImage, timestamp: Date.now() };
        setMessages(prev => [...prev, userMsg]);

        try {
            const res = await axios.post(`${API_BASE}/chat`, { 
                userId: currentUser.uid, 
                message: `[Subject: ${subjectInput}] ${text}`,
                mode,
                image: currentImage
            });
            const aiMsg = { role: "ai", content: res.data.reply, timestamp: Date.now() };
            setMessages(prev => [...prev, aiMsg]);
            if (isLiveMode || voiceInput) speakText(res.data.reply);
        } catch (e) { toast.error("Connection hiccup buddy!"); }
        setIsSending(false);
    };

    return (
        <div className={`flex h-screen w-full overflow-hidden transition-colors duration-700 ${currentTheme.container}`}>
            <ToastContainer theme="dark" position="top-center" />
            
            {/* CAMERA MODAL */}
            <AnimatePresence>
                {isCameraActive && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[500] bg-black flex flex-col items-center justify-center p-4">
                        <video ref={videoRef} autoPlay playsInline className="w-full max-w-lg rounded-3xl shadow-2xl border-2 border-white/20" />
                        <div className="flex gap-6 mt-8">
                            <button onClick={stopCamera} className="p-5 bg-white/10 rounded-full text-white hover:bg-white/20 transition-all"><FaTimes /></button>
                            <button onClick={capturePhoto} className="p-8 bg-white rounded-full text-black shadow-xl hover:scale-110 transition-all"><FaCamera size={24} /></button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* SIDEBAR */}
            <AnimatePresence>
                {showSidebar && (
                    <motion.div initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }} className={`fixed lg:relative z-[150] w-80 h-full flex flex-col p-6 shadow-2xl border-r border-white/10 ${currentTheme.sidebar}`}>
                        <div className="flex justify-between items-center mb-8 text-white"><span className="text-[10px] font-black uppercase opacity-40">Scholar Space</span><button onClick={() => setShowSidebar(false)}><FaTimes /></button></div>
                        
                        {/* THEME SELECTOR */}
                        <div className="mb-8">
                            <h4 className="text-[10px] font-black uppercase opacity-40 mb-3 flex items-center gap-2 text-white"><FaPalette /> Themes</h4>
                            <div className="grid grid-cols-4 gap-2">
                                {Object.keys(THEME_PRESETS).map((t) => (
                                    <button key={t} onClick={() => setTheme(t)} className={`h-8 w-full rounded-lg border border-white/10 ${THEME_PRESETS[t].container} hover:scale-110 transition-transform`} />
                                ))}
                            </div>
                        </div>

                        <div className="mb-8 p-6 rounded-[2.5rem] bg-white/5 border border-white/10 text-white">
                            <p className="text-[10px] font-black opacity-30 uppercase">Time Focused</p>
                            <p className="text-2xl font-black italic">{Math.floor((userData.stats?.totalMinutes || 0) / 60)}h {(userData.stats?.totalMinutes || 0) % 60}m</p>
                        </div>
                        <button onClick={() => setMessages([])} className={`w-full py-4 rounded-2xl text-white font-bold text-xs flex items-center justify-center gap-2 ${currentTheme.btn}`}><FaPlus /> New Session</button>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex-1 flex flex-col min-w-0 h-full relative">
                <Navbar currentUser={currentUser} theme={theme} setTheme={setTheme} logout={logout} />
                <StudyTimer currentTheme={currentTheme} onSessionComplete={trackStudyProgress} />

                {/* TOP INPUTS */}
                <div className="max-w-4xl mx-auto w-full px-4 pt-6 flex items-center gap-4">
                    <button onClick={() => setShowSidebar(!showSidebar)} className="p-4 rounded-2xl bg-white/5 border border-white/10 text-white shadow-xl hover:bg-white/10 transition-all"><FaHistory /></button>
                    <div className="flex-1 p-4 rounded-[2rem] bg-white/5 border border-white/10 flex items-center gap-4 shadow-xl">
                        <FaBookOpen className={currentTheme.accent} />
                        <input value={subjectInput} onChange={e => setSubjectInput(e.target.value)} placeholder="Subject buddy?" className="bg-transparent text-sm font-bold outline-none flex-1 text-white placeholder-white/20" />
                    </div>
                </div>

                {/* CHAT DISPLAY */}
                <div ref={chatContainerRef} className="flex-1 overflow-y-auto px-4 py-8 no-scrollbar scroll-smooth">
                    <div className="max-w-3xl mx-auto space-y-10 pb-20">
                        {messages.length === 0 && (
                            <div className="text-center py-20 opacity-10 text-white">
                                <FaGraduationCap size={60} className="mx-auto mb-4" />
                                <p className="font-bold uppercase tracking-widest text-sm italic">Ready to learn together?</p>
                            </div>
                        )}
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                                <div className={`max-w-[85%] p-7 rounded-[2.5rem] ${msg.role === "user" ? `${currentTheme.userBubble} rounded-tr-none text-white` : `${currentTheme.aiBubble} rounded-tl-none text-white`}`}>
                                    {msg.image && <img src={msg.image} alt="uploaded" className="mb-4 rounded-2xl max-h-64 object-contain shadow-lg border border-white/10" />}
                                    <div className="prose prose-sm dark:prose-invert max-w-none">
                                        <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{msg.content}</ReactMarkdown>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* BOTTOM CONTROL BAR */}
                <div className="p-4 md:p-10 shrink-0">
                    <div className="max-w-3xl mx-auto">
                        {selectedImage && (
                            <div className="mb-4 relative inline-block animate-bounce-short">
                                <img src={selectedImage} alt="preview" className="h-24 w-24 object-cover rounded-2xl border-2 border-white/20 shadow-2xl" />
                                <button onClick={() => setSelectedImage(null)} className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 text-white shadow-lg hover:scale-110 transition-all"><FaTimes size={10}/></button>
                            </div>
                        )}
                        <div className="flex items-center p-2 rounded-[3rem] border bg-white/5 border-white/10 shadow-2xl backdrop-blur-xl">
                            <input value={input} onChange={e => setInput(e.target.value)} placeholder={isListening ? "Listening..." : "Tell me buddy..."} className="flex-1 bg-transparent px-6 py-4 outline-none font-bold text-sm text-white" onKeyDown={e => e.key === "Enter" && sendMessage()} />
                            <div className="flex items-center gap-1 pr-2">
                                <button onClick={() => fileInputRef.current.click()} className="p-4 rounded-full text-white opacity-40 hover:opacity-100 transition-all"><FaImage /></button>
                                <button onClick={startCamera} className="p-4 rounded-full text-white opacity-40 hover:opacity-100 transition-all"><FaCamera /></button>
                                <button onClick={() => { setIsLiveMode(!isLiveMode); if(!isLiveMode) startVoiceMode(); }} className={`p-4 rounded-full transition-all ${isLiveMode ? currentTheme.btn : 'opacity-40 text-white'}`}><FaMicrophone /></button>
                                <button onClick={() => sendMessage()} disabled={isSending} className={`p-5 rounded-full ml-2 text-white shadow-lg ${currentTheme.btn} hover:scale-105 transition-all`}>
                                    {isSending ? <FaSyncAlt className="animate-spin" /> : <FaPaperPlane />}
                                </button>
                            </div>
                        </div>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} />
                    </div>
                </div>
            </div>

            {/* ACHIEVEMENT ALERT */}
            <AnimatePresence>
                {showAchievement && (
                    <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5 }} className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/80 backdrop-blur-md">
                        <div className={`p-12 rounded-[4rem] text-center border-4 border-white/20 shadow-2xl max-w-sm ${currentTheme.btn}`}>
                            <div className="text-7xl mb-6 text-yellow-400 drop-shadow-lg">{showAchievement.icon}</div>
                            <h2 className="text-3xl font-black text-white italic mb-2 uppercase">LEVEL UP!</h2>
                            <p className="text-white/80 font-bold mb-8">{showAchievement.desc}</p>
                            <button onClick={() => setShowAchievement(null)} className="w-full py-4 bg-white text-black font-black rounded-3xl shadow-xl hover:bg-gray-100 transition-all">AWESOME BUDDY!</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
