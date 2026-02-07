import React, { useEffect, useState, useRef } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import { 
    FaPaperPlane, FaCamera, FaLock, FaSyncAlt, FaTimes, FaUndo, 
    FaImage, FaPlus, FaHistory, FaUnlock, FaYoutube, FaArrowDown, 
    FaClock, FaPlay, FaPause, FaStop, FaLightbulb, FaQuestion, 
    FaBookOpen, FaGraduationCap, FaRocket, FaChevronDown, FaMicrophone, FaCheckCircle 
} from "react-icons/fa";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { doc, getDoc, setDoc, updateDoc, collection, query, getDocs, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import imageCompression from "browser-image-compression";
import { motion, AnimatePresence } from "framer-motion";

import 'katex/dist/katex.min.css';

const API_BASE = (process.env.REACT_APP_API_URL || "https://dhruva-backend-production.up.railway.app").replace(/\/$/, "");

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

// --- UPDATED ONBOARDING: EDIT PROFILE DIRECTLY ---
const OnboardingModal = ({ currentUser, onComplete, currentTheme }) => {
    const [loading, setLoading] = useState(false);
    const [profile, setProfile] = useState({ board: "CBSE", classLevel: "10", gender: "Male" });

    const handleSave = async () => {
        setLoading(true);
        try {
            await updateDoc(doc(db, "users", currentUser.uid), {
                ...profile,
                onboarded: true
            });
            onComplete(profile);
        } catch (e) {
            toast.error("Error saving profile");
        }
        setLoading(false);
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className={`max-w-md w-full p-8 rounded-[3rem] border-2 border-white/20 shadow-2xl text-center ${currentTheme.aiBubble}`}>
                <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-indigo-500/20">
                    <FaRocket className="text-white text-2xl animate-bounce" />
                </div>
                <h2 className="text-2xl font-black mb-2 italic">Complete Profile</h2>
                <p className="text-xs font-bold opacity-50 mb-6 uppercase tracking-tighter">Setup your vibe to start studying</p>
                
                <div className="space-y-4 text-left">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-black opacity-40 ml-2">BOARD</label>
                            <select onChange={e => setProfile({...profile, board: e.target.value})} className="bg-white/5 border border-white/10 p-3 rounded-xl font-bold outline-none text-sm">
                                <option value="CBSE">CBSE</option>
                                <option value="ICSE">ICSE</option>
                            </select>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-black opacity-40 ml-2">CLASS</label>
                            <select onChange={e => setProfile({...profile, classLevel: e.target.value})} className="bg-white/5 border border-white/10 p-3 rounded-xl font-bold outline-none text-sm">
                                {["8","9","10","11","12"].map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-black opacity-40 ml-2">GENDER</label>
                        <select onChange={e => setProfile({...profile, gender: e.target.value})} className="bg-white/5 border border-white/10 p-3 rounded-xl font-bold outline-none text-sm">
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

// --- TYPEWRITER & TIMER (Unchanged) ---
const Typewriter = ({ text, onComplete, scrollRef }) => {
    const [displayedText, setDisplayedText] = useState("");
    const [cursor, setCursor] = useState(true);
    useEffect(() => {
        let i = 0;
        const interval = setInterval(() => {
            setDisplayedText(text.substring(0, i + 1));
            i++;
            if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            if (i >= text.length) { clearInterval(interval); setCursor(false); if (onComplete) onComplete(); }
        }, 10);
        return () => clearInterval(interval);
    }, [text]);
    return (
        <div className="relative markdown-container prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{formatContent(displayedText)}</ReactMarkdown>
            {cursor && <motion.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.5 }} className="inline-block w-1 h-4 bg-indigo-500 ml-1 align-middle" />}
        </div>
    );
};

const StudyTimer = ({ currentTheme }) => {
    const [timeLeft, setTimeLeft] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const timerRef = useRef(null);
    const playAlarm = () => { const ctx = new (window.AudioContext || window.webkitAudioContext)(); const osc = ctx.createOscillator(); const gain = ctx.createGain(); osc.connect(gain); gain.connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + 1.5); };
    useEffect(() => {
        if (isActive && timeLeft > 0) { timerRef.current = setInterval(() => setTimeLeft(prev => prev - 1), 1000); }
        else if (timeLeft === 0 && isActive) { playAlarm(); setIsActive(false); toast.info("Session Complete! ☕"); }
        return () => clearInterval(timerRef.current);
    }, [isActive, timeLeft]);
    const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
    return (
        <motion.div drag dragMomentum={false} initial={{ x: 20, y: 400 }} className="fixed z-[100] cursor-grab active:cursor-grabbing">
            <motion.div animate={{ width: isOpen ? "240px" : "64px", height: isOpen ? "280px" : "64px" }} className={`overflow-hidden rounded-[2rem] border backdrop-blur-3xl shadow-2xl flex flex-col ${currentTheme.aiBubble} border-white/20`}>
                {!isOpen ? (<button onClick={() => setIsOpen(true)} className="w-full h-full flex items-center justify-center text-indigo-500"><FaClock size={24} className={isActive ? "animate-spin-slow" : "animate-pulse"} /></button>) : (
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
    const [userData, setUserData] = useState({ board: "", class: "", gender: "", language: "English" });
    const [isLocked, setIsLocked] = useState(false);
    const [subjectInput, setSubjectInput] = useState("");
    const [chapterInput, setChapterInput] = useState("");
    const [showSidebar, setShowSidebar] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [cameraFacing, setCameraFacing] = useState("environment");
    const [showScrollBtn, setShowScrollBtn] = useState(false);
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

    useEffect(() => {
        if (!currentUser) return;
        const initData = async () => {
            const userDoc = await getDoc(doc(db, "users", currentUser.uid));
            if (userDoc.exists()) {
                const data = userDoc.data();
                setUserData({ 
                    board: data.board || "", 
                    class: data.classLevel || data.class || "", 
                    gender: data.gender || "",
                    language: data.language || "English" 
                });
                if (!data.board || (!data.class && !data.classLevel) || !data.gender) setShowOnboarding(true);
            } else setShowOnboarding(true);
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

    // --- UPDATED: VOICE LOOP & MALE PERSONALITY ---
    const speakText = (text) => {
        window.speechSynthesis.cancel(); 
        const cleanText = text.replace(/[*#_~]/g, "").replace(/\[.*?\]/g, "");
        const utterance = new SpeechSynthesisUtterance(cleanText);
        const voices = window.speechSynthesis.getVoices();
        
        // Attempt to find a deep Male Indian Voice
        const maleVoice = voices.find(v => 
            (v.name.toLowerCase().includes("male") || v.name.toLowerCase().includes("ravi") || v.name.toLowerCase().includes("rishi")) &&
            (v.lang.includes("en-IN") || v.lang.includes("en-GB"))
        ) || voices.find(v => v.lang.includes("en-IN"));

        utterance.voice = maleVoice;
        utterance.pitch = 0.9; // Lower pitch for masculine tone
        utterance.rate = 1.0;

        utterance.onend = () => { 
            if (isLiveMode) {
                // Wait briefly so AI doesn't listen to its own echo
                setTimeout(() => startVoiceMode(), 600); 
            }
        };
        window.speechSynthesis.speak(utterance);
    };

    const startVoiceMode = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return toast.error("Voice not supported");
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-IN';
        setIsListening(true);
        recognition.start();
        recognition.onresult = (e) => {
            const t = e.results[0][0].transcript;
            setInput(t);
            setIsListening(false);
            sendMessage(t); // Trigger AI response
        };
        recognition.onerror = () => { setIsListening(false); setIsLiveMode(false); };
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
            const payload = { userId: currentUser.uid, message: text || "Explain this image", mode, subject: subjectInput || "General", chapter: mappedChapter, language: userData.language, classLevel: userData.class };
            let res;
            if (file) {
                const formData = new FormData();
                const comp = await imageCompression(file, { maxSizeMB: 0.7 });
                formData.append("photo", comp);
                Object.keys(payload).forEach(k => formData.append(k, payload[k]));
                res = await axios.post(`${API_BASE}/chat/photo`, formData);
            } else res = await axios.post(`${API_BASE}/chat`, payload);

            let ytLink = (mode === "Explain" || mode === "Doubt") && subjectInput ? `https://www.youtube.com/results?search_query=${encodeURIComponent(`${userData.board} class ${userData.class} ${subjectInput} ${mappedChapter}`)}` : null;
            const aiMsg = { role: "ai", content: res.data.reply, ytLink, timestamp: Date.now() };
            const finalMessages = [...newMessages, aiMsg];
            setMessages(finalMessages);
            
            // Trigger Voice if in Live Mode or if user used Microphone
            if (isLiveMode || voiceInput) speakText(res.data.reply);

            await setDoc(doc(db, `users/${currentUser.uid}/sessions`, currentSessionId), { messages: finalMessages, lastUpdate: Date.now(), title: subjectInput ? `${subjectInput.toUpperCase()}: ${mappedChapter}` : "Study Session" }, { merge: true });
            fetchSessions();
        } catch (e) { 
            toast.error("Connection failed"); 
            setIsLiveMode(false); 
        }
        setIsSending(false);
    };

    // --- CAMERA & FILE LOGIC ---
    const closeCamera = () => { videoRef.current?.srcObject?.getTracks().forEach(t => t.stop()); setIsCameraOpen(false); };
    const openCamera = async () => { setIsCameraOpen(true); try { const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: cameraFacing } }); if (videoRef.current) videoRef.current.srcObject = s; } catch (e) { setIsCameraOpen(false); } };
    const capturePhoto = () => { const c = canvasRef.current; const v = videoRef.current; c.width = v.videoWidth; c.height = v.videoHeight; c.getContext("2d").drawImage(v, 0, 0); c.toBlob(b => { setSelectedFile(new File([b], "cap.jpg", { type: "image/jpeg" })); closeCamera(); }, "image/jpeg", 0.8); };

    return (
        <div className={`flex h-screen w-full overflow-hidden transition-all duration-700 ${currentTheme.container}`}>
            <ToastContainer theme="dark" position="top-center" limit={1} />
            
            <AnimatePresence>
                {showOnboarding && (
                    <OnboardingModal 
                        currentUser={currentUser}
                        onComplete={(data) => { setUserData(data); setShowOnboarding(false); }} 
                        currentTheme={currentTheme} 
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showSidebar && (
                    <motion.div initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }} className={`fixed lg:relative z-[150] w-72 h-full flex flex-col p-6 overflow-hidden ${currentTheme.sidebar}`}>
                        <div className="flex justify-between items-center mb-10"><span className="text-[10px] font-black uppercase opacity-40">History</span><button onClick={() => setShowSidebar(false)}><FaTimes /></button></div>
                        <button onClick={() => { setMessages([]); setCurrentSessionId(Date.now().toString()); setShowSidebar(false); }} className="w-full py-4 mb-6 rounded-2xl bg-indigo-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg"><FaPlus /> New Session</button>
                        <div className="flex-1 overflow-y-auto space-y-3 custom-y-scroll">
                            {sessions.map((s) => (<div key={s.id} onClick={() => loadSession(s.id)} className={`p-4 rounded-2xl cursor-pointer transition-all ${currentSessionId === s.id ? 'bg-indigo-500/15 text-indigo-500 border border-indigo-500/20' : 'opacity-60'}`}><div className="text-[10px] font-black uppercase truncate">{s.title || "Untitled Chat"}</div></div>))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden">
                <Navbar currentUser={currentUser} theme={theme} setTheme={setTheme} logout={logout} />
                <StudyTimer currentTheme={currentTheme} />

                <div className="max-w-4xl mx-auto w-full px-4 pt-4 overflow-x-auto no-scrollbar">
                    <div className="flex gap-2 p-1.5 rounded-[1.5rem] bg-white/5 border border-white/10 w-max mx-auto">
                        {modes.map((m) => (<button key={m.id} onClick={() => setMode(m.id)} className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${mode === m.id ? 'bg-indigo-600 text-white shadow-lg' : 'opacity-40'}`}>{m.icon} {m.label}</button>))}
                    </div>
                </div>

                <div className="max-w-4xl mx-auto w-full px-4 pt-4 flex items-center gap-3">
                    <button onClick={() => setShowSidebar(!showSidebar)} className={`p-4 rounded-2xl border ${currentTheme.aiBubble} border-white/10 shadow-xl`}><FaHistory size={16} /></button>
                    <motion.div layout className={`flex-1 flex items-center gap-2 p-2 rounded-[2rem] border transition-all duration-500 ${isLocked ? 'border-emerald-500/40 bg-emerald-500/5' : `${currentTheme.aiBubble} border-white/10 shadow-2xl`}`}>
                        <div className="flex items-center w-full flex-1 gap-3 px-4 py-2">
                            <div className="flex-1 flex flex-col"><label className="text-[8px] font-bold uppercase opacity-50">Subject</label><input disabled={isLocked} value={subjectInput} onChange={e => setSubjectInput(e.target.value)} placeholder="Physics..." className="bg-transparent text-sm font-bold outline-none w-full" /></div>
                            <div className="h-8 w-[1px] bg-white/10" />
                            <div className="flex-1 flex flex-col"><label className="text-[8px] font-bold uppercase opacity-50">Ch #</label><input disabled={isLocked} value={chapterInput} onChange={e => setChapterInput(e.target.value)} placeholder="1" className="bg-transparent text-sm font-bold outline-none w-full" /></div>
                            <button onClick={() => setIsLocked(!isLocked)} className={`p-3.5 rounded-2xl transition-all ${isLocked ? "bg-emerald-500 text-white" : "bg-white/5 text-indigo-500"}`}>{isLocked ? <FaLock size={14} /> : <FaUnlock size={14} />}</button>
                        </div>
                    </motion.div>
                </div>

                <div ref={chatContainerRef} className="flex-1 overflow-y-auto px-4 py-8 custom-y-scroll relative">
                    <div className="max-w-3xl mx-auto space-y-12 pb-20">
                        {messages.length === 0 && <div className="text-center py-20 opacity-20"><FaGraduationCap size={48} className="mx-auto mb-4" /><p className="font-bold text-sm">Select a subject to start.</p></div>}
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                                <div className={`max-w-[85%] p-6 rounded-[2.2rem] ${msg.role === "user" ? `${currentTheme.userBubble} rounded-tr-none` : `${currentTheme.aiBubble} rounded-tl-none`}`}>
                                    {msg.image && <img src={msg.image} className="rounded-2xl mb-4 max-h-64 w-full object-cover" alt="upload" />}
                                    {msg.role === "ai" && i === messages.length - 1 && !isSending ? (<Typewriter text={msg.content} scrollRef={chatContainerRef} onComplete={() => messagesEndRef.current?.scrollIntoView()} />) : (
                                        <div className="prose prose-sm dark:prose-invert max-w-none"><ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{formatContent(msg.content)}</ReactMarkdown></div>
                                    )}
                                    {msg.ytLink && (<div className="mt-6 pt-4 border-t border-white/10"><a href={msg.ytLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-3 px-5 py-3 bg-red-600/10 text-red-600 rounded-2xl text-xs font-bold border border-red-500/20"><FaYoutube size={18} /> Watch Video Guide</a></div>)}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} className="h-4" />
                    </div>
                </div>

                {/* --- INPUT AREA --- */}
                <div className="p-4 md:p-10 shrink-0">
                    <div className="max-w-3xl mx-auto relative">
                        <AnimatePresence>{selectedFile && (<motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="absolute bottom-full left-0 mb-4 p-2 rounded-2xl bg-indigo-600 flex items-center gap-3"><img src={URL.createObjectURL(selectedFile)} className="w-12 h-12 rounded-lg object-cover" alt="preview" /><button onClick={() => setSelectedFile(null)} className="p-2 text-white/60"><FaTimes /></button></motion.div>)}</AnimatePresence>
                        <div className={`flex items-center p-1 md:p-2 rounded-[2.8rem] border transition-all ${currentTheme.input} ${isListening ? 'ring-2 ring-indigo-500 bg-indigo-500/5' : ''}`}>
                            {isLiveMode && <div className="pl-4"><span className="flex h-2 w-2 rounded-full bg-red-500 animate-ping"></span></div>}
                            <input value={input} onChange={e => setInput(e.target.value)} placeholder={isListening ? "Listening..." : isLiveMode ? "Live Tutor..." : "Ask Dhruva..."} className="flex-1 bg-transparent px-4 md:px-6 py-4 outline-none font-bold text-xs md:text-sm" onKeyDown={e => e.key === "Enter" && sendMessage()} />
                            <div className="flex items-center gap-1 md:gap-2 px-1">
                                {isLiveMode && <button onClick={() => { setIsLiveMode(false); window.speechSynthesis.cancel(); }} className="p-2 md:p-3 text-red-500 bg-red-500/10 rounded-full"><FaStop size={12} /></button>}
                                <button onClick={() => { setIsLiveMode(!isLiveMode); if(!isLiveMode) startVoiceMode(); else window.speechSynthesis.cancel(); }} className={`p-3 md:p-4 rounded-full transition-all ${isLiveMode ? 'bg-indigo-600 text-white shadow-lg' : 'opacity-30 hover:opacity-100'}`}><FaMicrophone size={16} className={isListening ? "animate-bounce" : ""} /></button>
                                <input type="file" ref={fileInputRef} hidden onChange={(e) => setSelectedFile(e.target.files[0])} accept="image/*" />
                                <button onClick={() => fileInputRef.current.click()} className="p-2 md:p-3 opacity-30 hover:opacity-100"><FaImage size={16} /></button>
                                <button onClick={openCamera} className="p-2 md:p-3 opacity-30 hover:opacity-100"><FaCamera size={16} /></button>
                                <button onClick={() => sendMessage()} disabled={isSending} className={`p-4 md:p-5 rounded-full ${currentTheme.button} hidden sm:flex`}>{isSending ? <FaSyncAlt className="animate-spin text-white" /> : <FaPaperPlane className="text-white" size={14} />}</button>
                            </div>
                        </div>
                    </div>
                </div>

                <AnimatePresence>
                    {isCameraOpen && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[600] bg-black flex flex-col items-center justify-between p-6">
                            <div className="w-full flex justify-between p-4 text-white"><button onClick={closeCamera} className="p-4 bg-white/5 rounded-full"><FaTimes size={20} /></button><button onClick={() => setCameraFacing(f => f === 'user' ? 'environment' : 'user')} className="p-4 bg-white/5 rounded-full"><FaUndo /></button></div>
                            <video ref={videoRef} autoPlay playsInline className="w-full max-w-md aspect-[3/4] object-cover rounded-[3rem] border border-white/20" />
                            <button onClick={capturePhoto} className="mb-10 w-24 h-24 rounded-full border-4 border-white flex items-center justify-center active:scale-95"><div className="w-16 h-16 bg-white rounded-full" /></button>
                            <canvas ref={canvasRef} className="hidden" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
