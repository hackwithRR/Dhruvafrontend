import React, { useEffect, useState, useRef } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import { 
    FaPaperPlane, FaCamera, FaLock, FaSyncAlt, FaTimes, FaUndo, 
    FaImage, FaPlus, FaHistory, FaUnlock, FaYoutube, 
    FaClock, FaPlay, FaPause, FaStop, FaLightbulb, FaQuestion, 
    FaBookOpen, FaGraduationCap, FaRocket, FaMicrophone, FaCheckCircle 
} from "react-icons/fa";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { doc, getDoc, setDoc, collection, query, getDocs, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import imageCompression from "browser-image-compression";
import { motion, AnimatePresence } from "framer-motion";

import 'katex/dist/katex.min.css';

const API_BASE = (process.env.REACT_APP_API_URL || "https://dhruva-backend-production.up.railway.app").replace(/\/$/, "");

// --- CHAPTER MAP ---
const CHAPTER_MAP = {
    CBSE: {
        "8": {
            MATHEMATICS: { "1": "Rational Numbers", "2": "Linear Equations", "3": "Understanding Quadrilaterals", "11": "Mensuration", "12": "Exponents and Powers", "14": "Factorisation" },
            SCIENCE: { "1": "Crop Production", "8": "Cell Structure", "11": "Force and Pressure", "13": "Sound", "16": "Light" }
        },
        "9": {
            MATHEMATICS: { "1": "Number Systems", "2": "Polynomials", "7": "Triangles", "13": "Surface Areas" },
            SCIENCE: { "1": "Matter", "5": "Fundamental Unit of Life", "8": "Motion", "10": "Gravitation" }
        },
        "10": {
            MATHEMATICS: { "1": "Real Numbers", "4": "Quadratic Equations", "8": "Trigonometry" },
            SCIENCE: { "1": "Chemical Reactions", "6": "Control and Coordination", "10": "Human Eye", "11": "Electricity" }
        }
    }
};

const formatContent = (text) => text.trim();

// --- ONBOARDING MODAL (FIXED SAVE LOGIC) ---
const OnboardingModal = ({ currentUser, onComplete, currentTheme }) => {
    const [loading, setLoading] = useState(false);
    const [profile, setProfile] = useState({ board: "CBSE", classLevel: "10", gender: "Male" });

    const handleSave = async () => {
        if (!currentUser) return;
        setLoading(true);
        try {
            // FIX: Use setDoc with merge:true to avoid "document not found" error
            const userRef = doc(db, "users", currentUser.uid);
            const updateData = {
                ...profile,
                onboarded: true,
                uid: currentUser.uid,
                email: currentUser.email,
                photoURL: currentUser.photoURL // Keeps the Google PFP in the DB
            };
            
            await setDoc(userRef, updateData, { merge: true });
            onComplete(updateData);
            toast.success("Welcome to Dhruva AI!");
        } catch (e) {
            console.error(e);
            toast.error("Save failed. Check Firestore rules.");
        }
        setLoading(false);
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className={`max-w-md w-full p-8 rounded-[3rem] border-2 border-white/20 shadow-2xl text-center ${currentTheme.aiBubble}`}>
                <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-indigo-500/20">
                    <FaRocket className="text-white text-2xl animate-bounce" />
                </div>
                <h2 className="text-2xl font-black mb-2 italic">Setup Profile</h2>
                <div className="space-y-4 text-left mt-6">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-black opacity-40 ml-2">BOARD</label>
                            <select value={profile.board} onChange={e => setProfile({...profile, board: e.target.value})} className="bg-white/5 border border-white/10 p-3 rounded-xl font-bold outline-none text-sm">
                                <option value="CBSE">CBSE</option>
                                <option value="ICSE">ICSE</option>
                            </select>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-black opacity-40 ml-2">CLASS</label>
                            <select value={profile.classLevel} onChange={e => setProfile({...profile, classLevel: e.target.value})} className="bg-white/5 border border-white/10 p-3 rounded-xl font-bold outline-none text-sm">
                                {["8","9","10","11","12"].map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-black opacity-40 ml-2">GENDER</label>
                        <select value={profile.gender} onChange={e => setProfile({...profile, gender: e.target.value})} className="bg-white/5 border border-white/10 p-3 rounded-xl font-bold outline-none text-sm">
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                        </select>
                    </div>
                </div>
                <button onClick={handleSave} disabled={loading} className="w-full mt-8 py-5 bg-indigo-600 text-white font-black rounded-2xl flex items-center justify-center gap-2 hover:bg-indigo-500 transition-all shadow-xl">
                    {loading ? <FaSyncAlt className="animate-spin" /> : <><FaCheckCircle /> SAVE & START</>}
                </button>
            </motion.div>
        </motion.div>
    );
};

// --- TYPEWRITER & TIMER ---
const Typewriter = ({ text, onComplete, scrollRef }) => {
    const [displayedText, setDisplayedText] = useState("");
    useEffect(() => {
        let i = 0;
        const interval = setInterval(() => {
            setDisplayedText(text.substring(0, i + 1));
            i++;
            if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            if (i >= text.length) { clearInterval(interval); if (onComplete) onComplete(); }
        }, 10);
        return () => clearInterval(interval);
    }, [text]);
    return (
        <div className="relative markdown-container prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{formatContent(displayedText)}</ReactMarkdown>
        </div>
    );
};

const StudyTimer = ({ currentTheme }) => {
    const [timeLeft, setTimeLeft] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const timerRef = useRef(null);
    useEffect(() => {
        if (isActive && timeLeft > 0) { timerRef.current = setInterval(() => setTimeLeft(prev => prev - 1), 1000); }
        else if (timeLeft === 0 && isActive) { setIsActive(false); toast.info("Time's up!"); }
        return () => clearInterval(timerRef.current);
    }, [isActive, timeLeft]);
    const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
    return (
        <motion.div drag dragMomentum={false} initial={{ x: 20, y: 400 }} className="fixed z-[100] cursor-grab active:cursor-grabbing">
            <motion.div animate={{ width: isOpen ? "240px" : "64px", height: isOpen ? "280px" : "64px" }} className={`overflow-hidden rounded-[2rem] border backdrop-blur-3xl shadow-2xl flex flex-col ${currentTheme.aiBubble} border-white/20`}>
                {!isOpen ? (<button onClick={() => setIsOpen(true)} className="w-full h-full flex items-center justify-center text-indigo-500"><FaClock size={24} /></button>) : (
                    <div className="p-5 flex flex-col h-full">
                        <div className="flex justify-between items-center mb-4"><span className="text-[10px] font-black uppercase opacity-50">Timer</span><button onClick={() => setIsOpen(false)}><FaTimes size={12} /></button></div>
                        <div className="flex-1 flex flex-col items-center justify-center">
                            <h2 className="text-4xl font-black mb-6 font-mono">{formatTime(timeLeft)}</h2>
                            {timeLeft === 0 ? (<div className="grid grid-cols-2 gap-2 w-full">{[15, 25, 45, 60].map(m => (<button key={m} onClick={() => { setTimeLeft(m * 60); setIsActive(true); }} className="py-2 rounded-xl bg-white/5 hover:bg-indigo-500 text-[10px] font-bold transition-all">{m}m</button>))}</div>) : (
                                <div className="flex gap-4"><button onClick={() => setIsActive(!isActive)} className="p-4 rounded-full bg-indigo-500 text-white">{isActive ? <FaPause /> : <FaPlay />}</button><button onClick={() => { setTimeLeft(0); setIsActive(false); }} className="p-4 rounded-full bg-red-500/20 text-red-500"><FaStop /></button></div>
                            )}
                        </div>
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
};

export default function Chat() {
    const { currentUser, logout, theme, setTheme } = useAuth();
    const [messages, setMessages] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [currentSessionId, setCurrentSessionId] = useState(Date.now().toString());
    const [input, setInput] = useState("");
    const [mode, setMode] = useState("Explain");
    const [isSending, setIsSending] = useState(false);
    const [userData, setUserData] = useState({ board: "", class: "", gender: "", photoURL: "" });
    const [isLocked, setIsLocked] = useState(false);
    const [subjectInput, setSubjectInput] = useState("");
    const [chapterInput, setChapterInput] = useState("");
    const [showSidebar, setShowSidebar] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isLiveMode, setIsLiveMode] = useState(false);

    const chatContainerRef = useRef(null);
    const messagesEndRef = useRef(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const fileInputRef = useRef(null);

    const themes = {
        dark: { container: "bg-[#050505] text-white", aiBubble: "bg-white/5 border border-white/10", userBubble: "bg-indigo-600 shadow-lg shadow-indigo-500/20", input: "bg-white/[0.03] border-white/10 text-white", button: "bg-indigo-600", sidebar: "bg-[#0A0A0A] border-r border-white/10" },
        light: { container: "bg-[#F8FAFF] text-[#1E293B]", aiBubble: "bg-white/70 backdrop-blur-md border border-white shadow-sm", userBubble: "bg-indigo-600 text-white shadow-lg", input: "bg-white/80 border-white text-[#1E293B]", button: "bg-indigo-600", sidebar: "bg-white/60 backdrop-blur-xl border-r border-white/20" }
    };
    const currentTheme = themes[theme] || themes.dark;
    const modes = [{ id: "Explain", icon: <FaBookOpen />, label: "Explain" }, { id: "Doubt", icon: <FaQuestion />, label: "Doubt" }, { id: "Quiz", icon: <FaGraduationCap />, label: "Quiz" }, { id: "Summary", icon: <FaLightbulb />, label: "Summary" }];

    // --- FETCH DATA ---
    useEffect(() => {
        if (!currentUser) return;
        const initData = async () => {
            const userDoc = await getDoc(doc(db, "users", currentUser.uid));
            const baseData = { board: "", class: "", gender: "", photoURL: currentUser.photoURL };

            if (userDoc.exists()) {
                const data = userDoc.data();
                setUserData({ ...baseData, ...data, class: data.classLevel || data.class });
                if (!data.board || !data.gender) setShowOnboarding(true);
            } else {
                setShowOnboarding(true);
            }
            fetchSessions();
        };
        initData();
    }, [currentUser]);

    const fetchSessions = async () => {
        const q = query(collection(db, `users/${currentUser.uid}/sessions`), orderBy("lastUpdate", "desc"));
        const snap = await getDocs(q);
        setSessions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };

    const loadSession = async (sid) => {
        setCurrentSessionId(sid);
        const sDoc = await getDoc(doc(db, `users/${currentUser.uid}/sessions`, sid));
        if (sDoc.exists()) setMessages(sDoc.data().messages || []);
        setShowSidebar(false);
    };

    // --- VOICE LOGIC ---
    const speakText = (text) => {
        window.speechSynthesis.cancel();
        const cleanText = text.replace(/[*#_~]/g, "");
        const utterance = new SpeechSynthesisUtterance(cleanText);
        const voices = window.speechSynthesis.getVoices();
        const maleVoice = voices.find(v => (v.name.toLowerCase().includes("male") || v.name.includes("Rishi")) && v.lang.includes("en-IN")) || voices[0];
        utterance.voice = maleVoice;
        utterance.pitch = 0.9;
        utterance.onend = () => { if (isLiveMode) startVoiceMode(); };
        window.speechSynthesis.speak(utterance);
    };

    const startVoiceMode = () => {
        const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRec) return;
        const rec = new SpeechRec();
        rec.lang = 'en-IN';
        setIsListening(true);
        rec.start();
        rec.onresult = (e) => {
            const t = e.results[0][0].transcript;
            setInput(t);
            setIsListening(false);
            sendMessage(t);
        };
        rec.onerror = () => { setIsListening(false); setIsLiveMode(false); };
    };

    const sendMessage = async (voiceInput = null) => {
        const text = voiceInput || input;
        if (!currentUser || isSending || (!text.trim() && !selectedFile)) return;
        const file = selectedFile;
        setIsSending(true);
        setSelectedFile(null);
        setInput("");

        const subUpper = subjectInput.toUpperCase();
        const mappedChapter = CHAPTER_MAP[userData.board]?.[userData.class]?.[subUpper]?.[chapterInput] || `Chapter ${chapterInput}`;
        const userMsg = { role: "user", content: text || "Analyzing image...", image: file ? URL.createObjectURL(file) : null, timestamp: Date.now() };
        const newMessages = [...messages, userMsg];
        setMessages(newMessages);

        try {
            const payload = { userId: currentUser.uid, message: text || "Explain this image", mode, subject: subjectInput || "General", chapter: mappedChapter, language: "English", classLevel: userData.class };
            let res;
            if (file) {
                const formData = new FormData();
                const comp = await imageCompression(file, { maxSizeMB: 0.7 });
                formData.append("photo", comp);
                Object.keys(payload).forEach(k => formData.append(k, payload[k]));
                res = await axios.post(`${API_BASE}/chat/photo`, formData);
            } else res = await axios.post(`${API_BASE}/chat`, payload);

            const aiMsg = { role: "ai", content: res.data.reply, timestamp: Date.now() };
            const finalMessages = [...newMessages, aiMsg];
            setMessages(finalMessages);

            if (isLiveMode || voiceInput) speakText(res.data.reply);

            await setDoc(doc(db, `users/${currentUser.uid}/sessions`, currentSessionId), { messages: finalMessages, lastUpdate: Date.now(), title: subjectInput ? `${subjectInput.toUpperCase()}` : "Session" }, { merge: true });
            fetchSessions();
        } catch (e) { toast.error("Offline"); setIsLiveMode(false); }
        setIsSending(false);
    };

    const openCamera = async () => { setIsCameraOpen(true); const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }); if (videoRef.current) videoRef.current.srcObject = s; };
    const capturePhoto = () => { const c = canvasRef.current; const v = videoRef.current; c.width = v.videoWidth; c.height = v.videoHeight; c.getContext("2d").drawImage(v, 0, 0); c.toBlob(b => { setSelectedFile(new File([b], "cap.jpg", { type: "image/jpeg" })); setIsCameraOpen(false); v.srcObject.getTracks().forEach(t => t.stop()); }, "image/jpeg", 0.8); };

    return (
        <div className={`flex h-screen w-full overflow-hidden transition-all duration-700 ${currentTheme.container}`}>
            <ToastContainer theme="dark" position="top-center" />
            
            <AnimatePresence>
                {showOnboarding && <OnboardingModal currentUser={currentUser} onComplete={(d) => { setUserData(d); setShowOnboarding(false); }} currentTheme={currentTheme} />}
            </AnimatePresence>

            {/* Sidebar */}
            <AnimatePresence>
                {showSidebar && (
                    <motion.div initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }} className={`fixed lg:relative z-[150] w-72 h-full flex flex-col p-6 overflow-hidden ${currentTheme.sidebar}`}>
                        <div className="flex justify-between items-center mb-10"><span className="text-[10px] font-black opacity-40">History</span><button onClick={() => setShowSidebar(false)}><FaTimes /></button></div>
                        <button onClick={() => { setMessages([]); setCurrentSessionId(Date.now().toString()); setShowSidebar(false); }} className="w-full py-4 mb-6 rounded-2xl bg-indigo-600 text-white font-bold text-xs flex items-center justify-center gap-2"><FaPlus /> New Session</button>
                        <div className="flex-1 overflow-y-auto space-y-3">
                            {sessions.map((s) => (<div key={s.id} onClick={() => loadSession(s.id)} className={`p-4 rounded-2xl cursor-pointer transition-all ${currentSessionId === s.id ? 'bg-indigo-500/15 text-indigo-500' : 'opacity-60'}`}><div className="text-[10px] font-black uppercase truncate">{s.title || "Untitled Chat"}</div></div>))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden">
                <Navbar currentUser={currentUser} theme={theme} setTheme={setTheme} logout={logout} />
                <StudyTimer currentTheme={currentTheme} />

                {/* Modes */}
                <div className="max-w-4xl mx-auto w-full px-4 pt-4 overflow-x-auto no-scrollbar">
                    <div className="flex gap-2 p-1.5 rounded-[1.5rem] bg-white/5 border border-white/10 w-max mx-auto">
                        {modes.map((m) => (<button key={m.id} onClick={() => setMode(m.id)} className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase transition-all duration-300 ${mode === m.id ? 'bg-indigo-600 text-white' : 'opacity-40'}`}>{m.icon} {m.label}</button>))}
                    </div>
                </div>

                {/* Subject Selector */}
                <div className="max-w-4xl mx-auto w-full px-4 pt-4 flex items-center gap-3">
                    <button onClick={() => setShowSidebar(!showSidebar)} className={`p-4 rounded-2xl border ${currentTheme.aiBubble} border-white/10`}><FaHistory size={16} /></button>
                    <div className={`flex-1 flex items-center gap-2 p-2 rounded-[2rem] border transition-all ${isLocked ? 'border-emerald-500/40 bg-emerald-500/5' : `${currentTheme.aiBubble} border-white/10`}`}>
                        <div className="flex items-center w-full flex-1 gap-3 px-4 py-2">
                            <div className="flex-1 flex flex-col"><label className="text-[8px] font-bold opacity-50">Subject</label><input disabled={isLocked} value={subjectInput} onChange={e => setSubjectInput(e.target.value)} placeholder="Physics..." className="bg-transparent text-sm font-bold outline-none" /></div>
                            <div className="flex-1 flex flex-col"><label className="text-[8px] font-bold opacity-50">Ch #</label><input disabled={isLocked} value={chapterInput} onChange={e => setChapterInput(e.target.value)} placeholder="1" className="bg-transparent text-sm font-bold outline-none" /></div>
                            <button onClick={() => setIsLocked(!isLocked)} className={`p-3.5 rounded-2xl ${isLocked ? "bg-emerald-500 text-white" : "bg-white/5 text-indigo-500"}`}>{isLocked ? <FaLock size={14} /> : <FaUnlock size={14} />}</button>
                        </div>
                    </div>
                </div>

                {/* Chat Display */}
                <div ref={chatContainerRef} className="flex-1 overflow-y-auto px-4 py-8 relative">
                    <div className="max-w-3xl mx-auto space-y-12 pb-20">
                        {messages.length === 0 && <div className="text-center py-20 opacity-20"><FaGraduationCap size={48} className="mx-auto" /></div>}
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                                <div className={`max-w-[85%] p-6 rounded-[2.2rem] ${msg.role === "user" ? `${currentTheme.userBubble} rounded-tr-none` : `${currentTheme.aiBubble} rounded-tl-none`}`}>
                                    {msg.image && <img src={msg.image} className="rounded-2xl mb-4 max-h-64 w-full object-cover" alt="upload" />}
                                    {msg.role === "ai" && i === messages.length - 1 && !isSending ? (<Typewriter text={msg.content} scrollRef={chatContainerRef} onComplete={() => messagesEndRef.current?.scrollIntoView()} />) : (
                                        <div className="prose prose-sm dark:prose-invert max-w-none"><ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{msg.content}</ReactMarkdown></div>
                                    )}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                {/* Input Area */}
                <div className="p-4 md:p-10">
                    <div className="max-w-3xl mx-auto relative">
                        <div className={`flex items-center p-2 rounded-[2.8rem] border ${currentTheme.input} ${isListening ? 'ring-2 ring-indigo-500' : ''}`}>
                            <input value={input} onChange={e => setInput(e.target.value)} placeholder={isListening ? "Listening..." : "Ask Dhruva..."} className="flex-1 bg-transparent px-6 py-4 outline-none font-bold text-sm" onKeyDown={e => e.key === "Enter" && sendMessage()} />
                            <div className="flex items-center gap-2 px-1">
                                <button onClick={() => { setIsLiveMode(!isLiveMode); if(!isLiveMode) startVoiceMode(); else window.speechSynthesis.cancel(); }} className={`p-4 rounded-full transition-all ${isLiveMode ? 'bg-indigo-600 text-white' : 'opacity-30'}`}><FaMicrophone size={16} /></button>
                                <button onClick={() => fileInputRef.current.click()} className="p-3 opacity-30"><FaImage size={16} /></button>
                                <input type="file" ref={fileInputRef} hidden onChange={(e) => setSelectedFile(e.target.files[0])} accept="image/*" />
                                <button onClick={openCamera} className="p-3 opacity-30"><FaCamera size={16} /></button>
                                <button onClick={() => sendMessage()} disabled={isSending} className={`p-5 rounded-full ${currentTheme.button} hidden sm:flex text-white`}>{isSending ? <FaSyncAlt className="animate-spin" /> : <FaPaperPlane size={14} />}</button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Camera Modal */}
                <AnimatePresence>
                    {isCameraOpen && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[600] bg-black flex flex-col items-center justify-center p-6">
                            <video ref={videoRef} autoPlay playsInline className="w-full max-w-md aspect-[3/4] object-cover rounded-[3rem]" />
                            <div className="mt-10 flex gap-6">
                                <button onClick={() => { setIsCameraOpen(false); videoRef.current.srcObject.getTracks().forEach(t => t.stop()); }} className="p-6 bg-white/10 rounded-full text-white"><FaTimes size={24} /></button>
                                <button onClick={capturePhoto} className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center"><div className="w-14 h-14 bg-white rounded-full" /></button>
                            </div>
                            <canvas ref={canvasRef} className="hidden" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
        </div>
    );
}
