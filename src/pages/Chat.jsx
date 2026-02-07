import React, { useEffect, useState, useRef } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import { 
    FaPaperPlane, FaCamera, FaLock, FaSyncAlt, FaTimes, 
    FaImage, FaPlus, FaHistory, FaUnlock, FaYoutube, 
    FaClock, FaPlay, FaPause, FaStop, FaLightbulb, FaQuestion, 
    FaBookOpen, FaGraduationCap, FaMicrophone, FaUserEdit, FaArrowRight 
} from "react-icons/fa";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { doc, getDoc, setDoc, collection, query, getDocs, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import imageCompression from "browser-image-compression";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

import 'katex/dist/katex.min.css';

const API_BASE = (process.env.REACT_APP_API_URL || "https://dhruva-backend-production.up.railway.app").replace(/\/$/, "");

const CHAPTER_MAP = {
    CBSE: {
        "10": {
            MATHEMATICS: { "1": "Real Numbers", "8": "Trigonometry" },
            SCIENCE: { "1": "Chemical Reactions", "11": "Electricity" }
        }
    }
};

const formatContent = (text) => text.trim();

// --- SUB-COMPONENTS ---

const OnboardingModal = ({ isOpen, onClose, theme }) => {
    const navigate = useNavigate();
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className={`relative w-full max-w-md overflow-hidden rounded-[2.5rem] border p-8 shadow-2xl ${
                            theme === 'dark' ? 'bg-[#0A0A0A] border-white/10 text-white' : 'bg-white border-slate-100 text-slate-900'
                        }`}
                    >
                        {/* Decorative Background Glow */}
                        <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-indigo-600/20 blur-3xl" />
                        
                        <div className="relative z-10 flex flex-col items-center text-center">
                            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-indigo-600 shadow-lg shadow-indigo-600/40">
                                <FaGraduationCap className="text-4xl text-white" />
                            </div>
                            
                            <h2 className="mb-2 text-2xl font-black tracking-tight">Welcome to Dhruva!</h2>
                            <p className="mb-8 text-sm font-medium opacity-60">
                                To give you the best study experience, we need to know your board and class. Let's set up your profile!
                            </p>

                            <div className="flex w-full flex-col gap-3">
                                <button 
                                    onClick={() => navigate("/profile")}
                                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-4 text-sm font-black uppercase tracking-wider text-white transition-all hover:bg-indigo-700 active:scale-95"
                                >
                                    Complete Profile <FaArrowRight size={12} />
                                </button>
                                <button 
                                    onClick={onClose}
                                    className="w-full py-3 text-xs font-bold opacity-40 hover:opacity-100 transition-opacity"
                                >
                                    I'll do it later
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

const Typewriter = ({ text, onComplete, scrollRef }) => {
    const [displayedText, setDisplayedText] = useState("");
    useEffect(() => {
        let i = 0;
        const interval = setInterval(() => {
            setDisplayedText(text.substring(0, i + 1));
            i++;
            if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            if (i >= text.length) { 
                clearInterval(interval); 
                if (onComplete) onComplete(); 
            }
        }, 12);
        return () => clearInterval(interval);
    }, [text, onComplete, scrollRef]);

    return (
        <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                {formatContent(displayedText)}
            </ReactMarkdown>
        </div>
    );
};

const StudyTimer = ({ currentTheme }) => {
    const [timeLeft, setTimeLeft] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const timerRef = useRef(null);

    useEffect(() => {
        if (isActive && timeLeft > 0) { 
            timerRef.current = setInterval(() => setTimeLeft(prev => prev - 1), 1000); 
        } else if (timeLeft === 0 && isActive) { 
            setIsActive(false); 
            toast.info("Session Complete! ☕"); 
        }
        return () => clearInterval(timerRef.current);
    }, [isActive, timeLeft]);

    const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

    return (
        <motion.div drag dragMomentum={false} className="fixed z-[100] right-4 bottom-32 lg:bottom-10 cursor-pointer">
            <motion.div animate={{ width: isOpen ? "220px" : "56px", height: isOpen ? "260px" : "56px" }} className={`rounded-[1.8rem] border backdrop-blur-3xl shadow-2xl flex flex-col items-center justify-center ${currentTheme.aiBubble} border-white/20 overflow-hidden`}>
                {!isOpen ? (
                    <button onClick={() => setIsOpen(true)} className="w-full h-full flex items-center justify-center text-indigo-500">
                        <FaClock size={20} className={isActive ? "animate-spin-slow" : ""} />
                    </button>
                ) : (
                    <div className="p-4 w-full flex flex-col items-center">
                        <button onClick={() => setIsOpen(false)} className="self-end mb-1 opacity-40"><FaTimes size={12}/></button>
                        <h2 className="text-3xl font-black font-mono mb-4">{formatTime(timeLeft)}</h2>
                        <div className="grid grid-cols-2 gap-2 w-full">
                            {[15, 25, 45, 60].map(m => (
                                <button key={m} onClick={() => { setTimeLeft(m * 60); setIsActive(true); }} className="bg-indigo-600/10 text-[10px] font-bold py-2 rounded-xl border border-indigo-500/20 hover:bg-indigo-600 hover:text-white transition-all">
                                    {m}m
                                </button>
                            ))}
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
    const [userData, setUserData] = useState({ board: "CBSE", class: "10", gender: "Male", language: "English" });
    const [isLocked, setIsLocked] = useState(false);
    const [subjectInput, setSubjectInput] = useState("");
    const [chapterInput, setChapterInput] = useState("");
    const [showSidebar, setShowSidebar] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [isListening, setIsListening] = useState(false);

    const chatContainerRef = useRef(null);
    const messagesEndRef = useRef(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const fileInputRef = useRef(null);

    const themes = {
        dark: { 
            container: "bg-[#050505] text-white", 
            aiBubble: "bg-white/5 border border-white/10 shadow-2xl", 
            userBubble: "bg-indigo-600 text-white", 
            input: "bg-[#111] border-white/10 text-white", 
            button: "bg-indigo-600", 
            sidebar: "bg-[#0A0A0A] border-r border-white/10" 
        },
        light: { 
            container: "bg-[#F8FAFF] text-[#1E293B]", 
            aiBubble: "bg-white border border-white shadow-lg", 
            userBubble: "bg-indigo-600 text-white", 
            input: "bg-white border-indigo-100 text-[#1E293B]", 
            button: "bg-indigo-600", 
            sidebar: "bg-white border-r border-gray-100" 
        }
    };
    const currentTheme = themes[theme] || themes.dark;

    useEffect(() => {
        if (!currentUser) return;
        const initData = async () => {
            const userDoc = await getDoc(doc(db, "users", currentUser.uid));
            if (userDoc.exists()) {
                const data = userDoc.data();
                setUserData({ 
                    board: data.board || "CBSE", 
                    class: data.classLevel || data.class || "10", 
                    gender: data.gender || "Male",
                    language: data.language || "English" 
                });
                if (!data.board) setShowOnboarding(true);
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

    const loadSession = async (id) => {
        setCurrentSessionId(id);
        const s = await getDoc(doc(db, `users/${currentUser.uid}/sessions`, id));
        if (s.exists()) setMessages(s.data().messages || []);
        setShowSidebar(false);
    };

    const sendMessage = async (vInput = null) => {
        const text = vInput || input;
        if (!currentUser || isSending || (!text.trim() && !selectedFile)) return;
        setIsSending(true);
        const file = selectedFile;
        setSelectedFile(null);
        setInput("");

        const subUpper = subjectInput.toUpperCase();
        const mappedChapter = CHAPTER_MAP[userData.board]?.[userData.class]?.[subUpper]?.[chapterInput] || `Chapter ${chapterInput}`;
        const userMsg = { role: "user", content: text || "Analyzing image...", image: file ? URL.createObjectURL(file) : null };
        const updatedMsgs = [...messages, userMsg];
        setMessages(updatedMsgs);

        try {
            const payload = { userId: currentUser.uid, message: text || "Explain", mode, subject: subjectInput || "General", chapter: mappedChapter, classLevel: userData.class, language: userData.language };
            let res;
            if (file) {
                const fd = new FormData();
                const comp = await imageCompression(file, { maxSizeMB: 0.5 });
                fd.append("photo", comp);
                Object.keys(payload).forEach(k => fd.append(k, payload[k]));
                res = await axios.post(`${API_BASE}/chat/photo`, fd);
            } else {
                res = await axios.post(`${API_BASE}/chat`, payload);
            }
            const aiMsg = { role: "ai", content: res.data.reply, ytLink: subjectInput ? `https://www.youtube.com/results?search_query=${encodeURIComponent(`${userData.board} class ${userData.class} ${subjectInput}`)}` : null };
            const final = [...updatedMsgs, aiMsg];
            setMessages(final);
            await setDoc(doc(db, `users/${currentUser.uid}/sessions`, currentSessionId), { messages: final, lastUpdate: Date.now(), title: subjectInput ? `${subjectInput}: ${mappedChapter}` : "Study Session" }, { merge: true });
            fetchSessions();
        } catch (e) { toast.error("Connection Failed"); }
        setIsSending(false);
    };

    const startVoiceMode = () => {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) return toast.error("Speech not supported");
        const rec = new SR();
        setIsListening(true);
        rec.start();
        rec.onresult = (e) => {
            const t = e.results[0][0].transcript;
            setInput(t);
            setIsListening(false);
            sendMessage(t);
        };
        rec.onerror = () => setIsListening(false);
    };

    return (
        <div className={`flex h-screen w-full overflow-hidden transition-all duration-500 ${currentTheme.container}`}>
            <ToastContainer theme={theme === "dark" ? "dark" : "light"} position="top-center" />
            
            {/* Onboarding Modal */}
            <OnboardingModal isOpen={showOnboarding} onClose={() => setShowOnboarding(false)} theme={theme} />

            {/* Sidebar Overlay for Mobile */}
            <AnimatePresence>
                {showSidebar && (
                    <motion.div initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }} className={`fixed lg:relative z-[600] w-72 h-full flex flex-col p-6 shadow-2xl ${currentTheme.sidebar}`}>
                        <div className="flex justify-between items-center mb-6"><span className="text-[10px] font-black opacity-40">HISTORY</span><button onClick={() => setShowSidebar(false)}><FaTimes /></button></div>
                        <button onClick={() => { setMessages([]); setCurrentSessionId(Date.now().toString()); setShowSidebar(false); }} className="w-full py-4 mb-4 rounded-2xl bg-indigo-600 text-white font-bold text-xs flex items-center justify-center gap-2"><FaPlus /> NEW CHAT</button>
                        <div className="flex-1 overflow-y-auto space-y-2 no-scrollbar">
                            {sessions.map(s => <div key={s.id} onClick={() => loadSession(s.id)} className={`p-4 rounded-xl cursor-pointer text-[10px] font-bold border ${currentSessionId === s.id ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-500' : 'border-transparent opacity-50'}`}>{s.title || "Untitled Session"}</div>)}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex-1 flex flex-col min-w-0 relative">
                <Navbar currentUser={currentUser} theme={theme} setTheme={setTheme} logout={logout} />
                <StudyTimer currentTheme={currentTheme} />

                {/* Subject Inputs Bar */}
                <div className="w-full max-w-4xl mx-auto px-4 pt-4 flex items-center gap-2">
                    <button onClick={() => setShowSidebar(true)} className={`p-4 rounded-2xl border ${currentTheme.aiBubble} lg:hidden`}><FaHistory/></button>
                    <div className={`flex-1 flex items-center gap-2 p-2 rounded-3xl border transition-all ${isLocked ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-white/10 bg-white/5 shadow-lg'}`}>
                        <div className="flex-1 px-3"><label className="text-[7px] font-black opacity-40 block">SUBJECT</label><input disabled={isLocked} value={subjectInput} onChange={e => setSubjectInput(e.target.value)} placeholder="E.g. Science" className="bg-transparent text-[11px] font-bold outline-none w-full" /></div>
                        <div className="w-px h-6 bg-white/10" />
                        <div className="flex-1 px-3"><label className="text-[7px] font-black opacity-40 block">CHAPTER</label><input disabled={isLocked} value={chapterInput} onChange={e => setChapterInput(e.target.value)} placeholder="Ch #" className="bg-transparent text-[11px] font-bold outline-none w-full" /></div>
                        <button onClick={() => setIsLocked(!isLocked)} className={`p-2.5 rounded-xl ${isLocked ? 'bg-emerald-500 text-white' : 'bg-white/5 text-indigo-500'}`}>{isLocked ? <FaLock size={12}/> : <FaUnlock size={12}/>}</button>
                    </div>
                </div>

                {/* Messages Container */}
                <div ref={chatContainerRef} className="flex-1 overflow-y-auto px-4 py-6 no-scrollbar">
                    <div className="max-w-3xl mx-auto space-y-8 pb-32">
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                                <div className={`max-w-[90%] p-5 rounded-3xl ${msg.role === "user" ? `${currentTheme.userBubble} rounded-tr-none shadow-xl shadow-indigo-500/10` : `${currentTheme.aiBubble} rounded-tl-none`}`}>
                                    {msg.image && <img src={msg.image} alt="upload" className="rounded-xl mb-3 max-h-48 w-full object-cover" />}
                                    {msg.role === "ai" && i === messages.length - 1 && !isSending ? (
                                        <Typewriter text={msg.content} scrollRef={chatContainerRef} onComplete={() => messagesEndRef.current?.scrollIntoView()} />
                                    ) : (
                                        <div className="prose prose-sm dark:prose-invert"><ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown></div>
                                    )}
                                    {msg.ytLink && <a href={msg.ytLink} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 px-3 py-2 bg-red-600/10 text-red-500 rounded-xl text-[9px] font-black border border-red-500/20"><FaYoutube/> VIDEO GUIDE</a>}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                {/* --- RESPONSIVE BOTTOM BAR --- */}
                <div className="absolute bottom-0 left-0 w-full p-4 md:p-8 bg-gradient-to-t from-black via-black/90 to-transparent md:from-transparent pointer-events-none">
                    <div className="max-w-3xl mx-auto pointer-events-auto">
                        <div className={`flex flex-col md:flex-row items-stretch md:items-center gap-2 p-1.5 md:p-2 rounded-[2rem] md:rounded-[3rem] border transition-all duration-300 ${currentTheme.input} ${isListening ? 'ring-2 ring-indigo-500' : 'border-white/10 shadow-2xl'}`}>
                            
                            {/* Input Field Area */}
                            <div className="flex items-center flex-1 px-4 py-2 md:py-0">
                                <input 
                                    value={input} 
                                    onChange={e => setInput(e.target.value)} 
                                    placeholder={isListening ? "Listening..." : "Message Dhruva..."} 
                                    className="flex-1 bg-transparent py-2 outline-none font-bold text-sm md:text-base" 
                                    onKeyDown={e => e.key === "Enter" && sendMessage()} 
                                />
                            </div>

                            {/* Action Buttons Area */}
                            <div className="flex items-center justify-between md:justify-end gap-1 px-2 pb-2 md:pb-0 md:pr-1">
                                <div className="flex items-center gap-1">
                                    <button onClick={startVoiceMode} className={`p-3 md:p-4 rounded-full transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-white/5 opacity-50 hover:opacity-100'}`}><FaMicrophone size={16}/></button>
                                    <button onClick={() => fileInputRef.current.click()} className="p-3 md:p-4 bg-white/5 opacity-50 hover:opacity-100 rounded-full transition-all"><FaImage size={16}/></button>
                                    <button onClick={() => setIsCameraOpen(true)} className="p-3 md:p-4 bg-white/5 opacity-50 hover:opacity-100 rounded-full transition-all"><FaCamera size={16}/></button>
                                </div>
                                
                                <button 
                                    onClick={() => sendMessage()} 
                                    disabled={isSending} 
                                    className={`p-4 md:p-5 rounded-full ${currentTheme.button} shadow-xl shadow-indigo-500/30 active:scale-95 transition-all ml-2`}
                                >
                                    {isSending ? <FaSyncAlt className="animate-spin" size={18} /> : <FaPaperPlane size={18} />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <input type="file" ref={fileInputRef} hidden onChange={(e) => setSelectedFile(e.target.files[0])} accept="image/*" />
            </div>

            {/* Neural Camera */}
            <AnimatePresence>
                {isCameraOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[1000] bg-black flex flex-col items-center justify-center p-6">
                        <video ref={videoRef} autoPlay playsInline className="w-full max-w-md rounded-[2.5rem] border border-white/10" onLoadedMetadata={() => videoRef.current.play()} />
                        <div className="mt-8 flex gap-6">
                            <button onClick={() => setIsCameraOpen(false)} className="p-5 bg-white/10 rounded-full text-white"><FaTimes size={20}/></button>
                            <button onClick={() => {
                                const c = canvasRef.current;
                                const v = videoRef.current;
                                c.width = v.videoWidth; c.height = v.videoHeight;
                                c.getContext("2d").drawImage(v, 0, 0);
                                c.toBlob(b => {
                                    setSelectedFile(new File([b], "shot.jpg", { type: "image/jpeg" }));
                                    v.srcObject.getTracks().forEach(t => t.stop());
                                    setIsCameraOpen(false);
                                }, "image/jpeg", 0.7);
                            }} className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center"><div className="w-14 h-14 bg-white rounded-full"/></button>
                        </div>
                        <canvas ref={canvasRef} className="hidden" />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
