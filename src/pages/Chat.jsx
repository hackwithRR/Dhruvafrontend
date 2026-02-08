import React, { useEffect, useState, useRef } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import { 
    FaPaperPlane, FaCamera, FaLock, FaSyncAlt, FaTimes, FaMicrophone, 
    FaImage, FaPlus, FaHistory, FaUnlock, FaYoutube, FaTrash, 
    FaClock, FaPlay, FaStop, FaVolumeUp, FaMedal, FaTrophy, FaStar, FaMagic 
} from "react-icons/fa";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { doc, getDoc, setDoc, collection, query, getDocs, orderBy, deleteDoc, updateDoc, increment } from "firebase/firestore";
import { db } from "../firebase";
import imageCompression from "browser-image-compression";
import { motion, AnimatePresence } from "framer-motion";

const API_BASE = (process.env.REACT_APP_API_URL || "https://dhruva-backend-production.up.railway.app").replace(/\/$/, "");

// --- UPGRADED STUDY TIMER (SUPER UX) ---
const StudyTimer = ({ currentTheme, onComplete }) => {
    const [timeLeft, setTimeLeft] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const timerRef = useRef(null);

    useEffect(() => {
        if (isActive && timeLeft > 0) {
            timerRef.current = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        } else if (timeLeft === 0 && isActive) {
            setIsActive(false);
            onComplete(true); // Bonus XP for timer
            toast.success("Focus Session Complete! Rank Points Added! 🏆");
        }
        return () => clearInterval(timerRef.current);
    }, [isActive, timeLeft, onComplete]);

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    return (
        <motion.div drag dragMomentum={false} className="fixed z-[100] right-6 top-24 hidden md:block">
            <motion.div 
                animate={{ width: isOpen ? "240px" : "60px", height: isOpen ? "280px" : "60px", borderRadius: isOpen ? "32px" : "50%" }}
                className={`flex flex-col overflow-hidden border shadow-[0_20px_50px_rgba(0,0,0,0.3)] backdrop-blur-3xl ${currentTheme.aiBubble} border-white/10 cursor-pointer relative group`}
            >
                {!isOpen ? (
                    <button onClick={() => setIsOpen(true)} className="w-full h-full flex items-center justify-center text-indigo-400 relative">
                        <FaClock size={22}/>
                        {isActive && <span className="absolute inset-0 rounded-full border-2 border-indigo-500 animate-ping opacity-50"/>}
                    </button>
                ) : (
                    <div className="p-5 flex flex-col h-full items-center justify-between">
                        <div className="flex justify-between w-full items-center">
                            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Zen Mode</span>
                            <button onClick={() => setIsOpen(false)} className="hover:rotate-90 transition-transform"><FaTimes size={14}/></button>
                        </div>
                        <div className="relative">
                             <h2 className={`text-5xl font-black font-mono transition-all ${isActive ? 'scale-110 text-white' : 'opacity-40'}`}>{formatTime(timeLeft)}</h2>
                        </div>
                        <div className="flex gap-2 w-full">
                            {[10, 25, 45].map(m => (
                                <button key={m} onClick={() => {setTimeLeft(m*60); setIsActive(true)}} className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-indigo-600 text-[10px] font-black transition-all border border-white/5">{m}m</button>
                            ))}
                        </div>
                        <div className="flex gap-4">
                            <button onClick={() => setIsActive(!isActive)} className="w-14 h-14 rounded-full bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">{isActive ? <FaStop size={14}/> : <FaPlay size={14}/>}</button>
                            <button onClick={() => {setTimeLeft(0); setIsActive(false)}} className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center border border-white/10"><FaTrash size={14}/></button>
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
    const [userData, setUserData] = useState({ board: "", class: "", language: "English", xp: 0 });
    const [showSidebar, setShowSidebar] = useState(false);
    const [isLocked, setIsLocked] = useState(false);
    const [subjectInput, setSubjectInput] = useState("");
    const [chapterInput, setChapterInput] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [isListening, setIsListening] = useState(false);

    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const recognitionRef = useRef(null);

    const themes = {
        DeepSpace: { container: "bg-[#050505] text-white", aiBubble: "bg-white/[0.03] border-white/10", userBubble: "bg-indigo-600", input: "bg-white/[0.02] border-white/10", button: "bg-indigo-600", sidebar: "bg-[#0A0A0A] border-white/5", accent: "text-indigo-400" },
        Light: { container: "bg-gray-50 text-gray-900", aiBubble: "bg-white border-gray-200 shadow-sm", userBubble: "bg-indigo-600 text-white", input: "bg-white border-gray-300 shadow-inner", button: "bg-indigo-600", sidebar: "bg-white border-gray-200", accent: "text-indigo-600" },
        Sakura: { container: "bg-[#1a0f12] text-rose-50", aiBubble: "bg-rose-500/10 border-rose-500/20", userBubble: "bg-rose-600", input: "bg-rose-500/5 border-rose-500/10", button: "bg-rose-600", sidebar: "bg-[#221418] border-rose-500/10", accent: "text-rose-400" },
        Cyberpunk: { container: "bg-[#0a0512] text-cyan-50", aiBubble: "bg-cyan-500/10 border-cyan-500/30", userBubble: "bg-fuchsia-600", input: "bg-cyan-500/5 border-cyan-500/10", button: "bg-cyan-600", sidebar: "bg-[#120a1a] border-cyan-500/20", accent: "text-cyan-400" }
    };
    const currentTheme = themes[theme] || themes.DeepSpace;

    // --- VOICE FEATURE (CONTINUOUS LOOP) ---
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
            
            recognitionRef.current.onresult = (event) => {
                const transcript = Array.from(event.results)
                    .map(result => result[0])
                    .map(result => result.transcript)
                    .join('');
                setInput(transcript);
            };

            recognitionRef.current.onend = () => {
                if (isListening) recognitionRef.current.start(); // Auto-restart loop
            };
        }
    }, [isListening]);

    const toggleVoice = () => {
        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
            if (input.trim()) sendMessage();
        } else {
            setInput("");
            recognitionRef.current.start();
            setIsListening(true);
        }
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isSending]);

    useEffect(() => {
        if (!currentUser) return;
        const init = async () => {
            const snap = await getDoc(doc(db, "users", currentUser.uid));
            if (snap.exists()) setUserData(snap.data());
            fetchSessions();
        };
        init();
    }, [currentUser]);

    const fetchSessions = async () => {
        const q = query(collection(db, `users/${currentUser.uid}/sessions`), orderBy("lastUpdate", "desc"));
        const snap = await getDocs(q);
        setSessions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };

    const handleAchievement = async (isTimer = false) => {
        const userRef = doc(db, "users", currentUser.uid);
        const xpGain = isTimer ? 50 : 10;
        await updateDoc(userRef, { xp: increment(xpGain) });
        setUserData(prev => ({ ...prev, xp: prev.xp + xpGain }));
    };

    const sendMessage = async (customInput = null) => {
        const textToUse = customInput || input;
        if (isSending || (!textToUse.trim() && !selectedFile)) return;
        
        setIsSending(true);
        const textToSend = textToUse;
        const file = selectedFile;
        setInput(""); setSelectedFile(null);

        const userMsg = { role: "user", content: textToSend || "Image Analysis", image: file ? URL.createObjectURL(file) : null };
        const updatedMsgs = [...messages, userMsg];
        setMessages(updatedMsgs);

        try {
            const payload = { 
                userId: currentUser.uid, 
                message: textToSend, 
                mode, 
                subject: subjectInput, 
                chapter: chapterInput, 
                language: userData.language, 
                classLevel: userData.class, 
                board: userData.board 
            };
            let res;
            if (file) {
                const compressed = await imageCompression(file, { maxSizeMB: 0.4 });
                const fd = new FormData();
                fd.append("photo", compressed);
                Object.keys(payload).forEach(k => fd.append(k, payload[k]));
                res = await axios.post(`${API_BASE}/chat/photo`, fd);
            } else {
                res = await axios.post(`${API_BASE}/chat`, payload);
            }

            // SMART YOUTUBE LOGIC: Only trigger if the user asks "How", "Explain", "Show me", or if it's a new concept.
            const needsVideo = /(how|explain|show|visual|understand|steps|experiment|diagram|process)/i.test(textToSend);
            const ytQuery = `${userData.board} class ${userData.class} ${subjectInput} ${chapterInput} ${textToSend}`.trim();
            
            const aiMsg = { 
                role: "ai", 
                content: res.data.reply, 
                ytLink: (needsVideo || mode === "Explain") ? `https://www.youtube.com/results?search_query=${encodeURIComponent(ytQuery)}` : null,
                suggestions: ["Give Examples", "Key Equations", "Quiz Me", "Simpler Version"]
            };
            
            const finalMsgs = [...updatedMsgs, aiMsg];
            setMessages(finalMsgs);
            
            await setDoc(doc(db, `users/${currentUser.uid}/sessions`, currentSessionId), {
                messages: finalMsgs, lastUpdate: Date.now(), title: subjectInput || textToSend.slice(0, 15)
            }, { merge: true });
            fetchSessions();
            handleAchievement();
        } catch (e) { toast.error("Error connecting to AI"); }
        setIsSending(false);
    };

    return (
        <div className={`flex h-screen w-full overflow-hidden transition-all duration-500 ${currentTheme.container}`}>
            <ToastContainer theme="dark" position="top-center" />
            
            {/* SIDEBAR */}
            <AnimatePresence>
                {showSidebar && (
                    <motion.div initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }} className={`fixed lg:relative z-[200] w-72 h-full flex flex-col p-6 shadow-2xl backdrop-blur-xl ${currentTheme.sidebar}`}>
                        <div className="flex justify-between items-center mb-8">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-500 border border-yellow-500/20"><FaTrophy size={14}/></div>
                                <div className="flex flex-col leading-none">
                                    <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Global Rank</span>
                                    <span className="text-sm font-black italic">{userData.xp} <span className="text-[10px] opacity-50">Points</span></span>
                                </div>
                            </div>
                            <button onClick={() => setShowSidebar(false)} className="p-2 opacity-30 hover:opacity-100 transition-opacity"><FaTimes/></button>
                        </div>
                        <button onClick={() => {setMessages([]); setCurrentSessionId(Date.now().toString()); setShowSidebar(false)}} className="w-full py-4 mb-6 rounded-2xl bg-indigo-600 text-white font-black text-[10px] tracking-widest shadow-[0_10px_30px_rgba(99,102,241,0.3)] flex items-center justify-center gap-2 active:scale-95 transition-all uppercase">
                            <FaPlus size={10}/> Initialise New Core
                        </button>
                        <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar">
                            {sessions.map(s => (
                                <div key={s.id} onClick={() => {setCurrentSessionId(s.id); setMessages(s.messages || []); setShowSidebar(false)}} className={`group p-4 rounded-2xl cursor-pointer transition-all border ${currentSessionId === s.id ? 'bg-indigo-600/10 border-indigo-600/20' : 'border-transparent hover:bg-white/5'}`}>
                                    <div className="flex justify-between items-center">
                                        <div className="flex flex-col overflow-hidden">
                                             <span className="text-xs font-black truncate text-indigo-400 uppercase tracking-tighter">{s.title || "Study Core"}</span>
                                             <span className="text-[8px] font-bold opacity-30 uppercase">Updated: {new Date(s.lastUpdate).toLocaleDateString()}</span>
                                        </div>
                                        <FaTrash onClick={(e) => {e.stopPropagation(); deleteDoc(doc(db, `users/${currentUser.uid}/sessions`, s.id)); fetchSessions();}} className="opacity-0 group-hover:opacity-100 text-red-500 text-[10px] hover:scale-125 transition-all"/>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex-1 flex flex-col h-full relative min-w-0">
                <Navbar currentUser={currentUser} theme={theme} setTheme={setTheme} logout={logout} userData={userData}/>
                <StudyTimer currentTheme={currentTheme} onComplete={handleAchievement} />

                {/* MODE SELECTOR (UPGRADED UI) */}
                <div className="w-full max-w-5xl mx-auto px-4 pt-6">
                    <div className="flex flex-col md:flex-row gap-4 items-center">
                        <div className={`flex-1 flex items-center gap-2 p-2 rounded-2xl border ${currentTheme.input} backdrop-blur-md group focus-within:ring-1 ring-indigo-500/50 transition-all`}>
                            <div className="px-3 opacity-30 group-focus-within:opacity-100 transition-opacity"><FaMagic size={12}/></div>
                            <input disabled={isLocked} value={subjectInput} onChange={e => setSubjectInput(e.target.value)} placeholder="Enter Subject..." className="flex-1 bg-transparent py-1 text-xs font-black uppercase tracking-tighter outline-none" />
                            <div className="h-4 w-[1px] bg-white/10"/>
                            <input disabled={isLocked} value={chapterInput} onChange={e => setChapterInput(e.target.value)} placeholder="Topic/Chapter..." className="flex-1 bg-transparent py-1 text-xs font-black uppercase tracking-tighter outline-none" />
                            <button onClick={() => setIsLocked(!isLocked)} className={`p-3 rounded-xl transition-all ${isLocked ? 'bg-emerald-600 text-white shadow-lg' : 'text-indigo-500 bg-white/5'}`}>
                                {isLocked ? <FaLock size={12}/> : <FaUnlock size={12}/>}
                            </button>
                        </div>
                        <div className={`flex p-1 rounded-2xl border ${currentTheme.input} gap-1 overflow-x-auto no-scrollbar max-w-full`}>
                            {["Explain", "Quiz", "Summary", "Homework"].map(m => (
                                <button key={m} onClick={() => setMode(m)} className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap ${mode === m ? 'bg-indigo-600 text-white shadow-xl scale-105' : 'opacity-30 hover:opacity-100 hover:bg-white/5'}`}>
                                    {m}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* MESSAGES */}
                <div className="flex-1 overflow-y-auto px-4 py-8 no-scrollbar scroll-smooth">
                    <div className="max-w-4xl mx-auto space-y-12 pb-20">
                        {messages.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center opacity-20 py-20 text-center">
                                <FaMagic size={40} className="mb-4 animate-pulse text-indigo-500"/>
                                <h1 className="text-2xl font-black uppercase tracking-[0.3em]">Neural Core Active</h1>
                                <p className="text-[10px] font-bold mt-2">Select a mode and begin the neural exchange.</p>
                            </div>
                        )}
                        {messages.map((msg, i) => (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} key={i} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                                <div className={`max-w-[85%] p-8 rounded-[2.5rem] shadow-2xl relative ${msg.role === "user" ? `${currentTheme.userBubble} rounded-tr-none text-white ring-1 ring-white/20` : `${currentTheme.aiBubble} rounded-tl-none backdrop-blur-xl border-white/5`}`}>
                                    {msg.image && <img src={msg.image} className="rounded-3xl mb-6 max-h-80 w-full object-cover shadow-2xl border border-white/10" alt="input" />}
                                    <div className="prose prose-sm prose-invert max-w-none text-sm font-bold leading-relaxed tracking-tight">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                                    </div>
                                    
                                    {msg.role === "ai" && msg.ytLink && (
                                        <div className="mt-8 pt-8 border-t border-white/5">
                                            <a href={msg.ytLink} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-4 py-4 bg-red-600 text-white rounded-2xl text-[10px] font-black hover:bg-red-700 transition-all shadow-xl shadow-red-600/20 uppercase tracking-[0.2em]">
                                                <FaYoutube size={18}/> Stream Visual Simulation
                                            </a>
                                        </div>
                                    )}

                                    {/* QUICK SUGGESTIONS */}
                                    {msg.role === "ai" && i === messages.length - 1 && (
                                        <div className="mt-8 flex flex-wrap gap-2">
                                            {msg.suggestions?.map((s, idx) => (
                                                <button key={idx} onClick={() => sendMessage(s)} className="px-4 py-2 rounded-full border border-white/10 bg-white/5 text-[9px] font-black uppercase hover:bg-indigo-600 hover:text-white transition-all">
                                                    {s}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                        {isSending && (
                            <div className="flex items-center gap-3 px-8 text-indigo-500">
                                <FaSyncAlt className="animate-spin" size={12}/>
                                <span className="text-[9px] font-black uppercase tracking-[0.3em] animate-pulse">Synthesis in Progress...</span>
                            </div>
                        )}
                        <div ref={messagesEndRef} className="h-10" />
                    </div>
                </div>

                {/* DOCK BAR (UPGRADED) */}
                <div className="p-4 md:p-10 relative">
                    <div className="max-w-3xl mx-auto relative group">
                        {isListening && <div className="absolute -top-16 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded-full text-[10px] font-black animate-bounce shadow-2xl uppercase tracking-widest"><FaMicrophone/> Listening...</div>}
                        
                        <div className={`flex items-center gap-1 p-2 rounded-[3rem] border shadow-[0_30px_60px_rgba(0,0,0,0.5)] backdrop-blur-3xl transition-all focus-within:ring-2 ring-indigo-600/30 ${currentTheme.input}`}>
                            <button onClick={() => setShowSidebar(true)} className="p-5 text-indigo-500 lg:hidden hover:bg-white/5 rounded-full transition-all active:scale-75"><FaHistory/></button>
                            <input 
                                value={input} 
                                onChange={e => setInput(e.target.value)} 
                                onKeyDown={e => e.key === "Enter" && sendMessage()} 
                                placeholder={`Exchange data in ${mode.toLowerCase()} mode...`} 
                                className="flex-1 bg-transparent px-6 py-3 outline-none text-sm font-black placeholder:opacity-20 placeholder:uppercase" 
                            />
                            
                            <div className="flex items-center gap-2 pr-2">
                                <button onClick={toggleVoice} className={`p-4 rounded-full transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-indigo-500 hover:bg-white/5'}`}>
                                    <FaMicrophone size={18}/>
                                </button>
                                <button onClick={() => setIsCameraOpen(true)} className="p-4 text-indigo-500 hover:bg-white/5 rounded-full transition-all hidden sm:block"><FaCamera size={18}/></button>
                                <input type="file" ref={fileInputRef} hidden onChange={e => setSelectedFile(e.target.files[0])} />
                                <button onClick={() => fileInputRef.current.click()} className="p-4 text-indigo-500 hover:bg-white/5 rounded-full transition-all"><FaImage size={18}/></button>
                                
                                <button onClick={() => sendMessage()} disabled={isSending} className={`p-6 rounded-full ${currentTheme.button} text-white shadow-2xl active:scale-75 transition-all flex items-center justify-center hover:brightness-125`}>
                                    {isSending ? <FaSyncAlt className="animate-spin" size={16}/> : <FaPaperPlane size={16}/>}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CAMERA VIEWPORT */}
                <AnimatePresence>
                    {isCameraOpen && (
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="fixed inset-0 z-[600] bg-black flex flex-col p-4 md:p-12">
                            <div className="relative flex-1 rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl">
                                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                                <div className="absolute inset-0 border-[40px] border-black/20 pointer-events-none"/>
                                <canvas ref={canvasRef} className="hidden" />
                                
                                <div className="absolute bottom-12 left-0 right-0 flex justify-center items-center gap-12 px-12">
                                    <button onClick={() => setIsCameraOpen(false)} className="p-6 bg-white/10 backdrop-blur-md rounded-full text-white border border-white/20 hover:bg-red-500 transition-all"><FaTimes size={24}/></button>
                                    <button onClick={() => {
                                        const context = canvasRef.current.getContext("2d");
                                        canvasRef.current.width = videoRef.current.videoWidth;
                                        canvasRef.current.height = videoRef.current.videoHeight;
                                        context.drawImage(videoRef.current, 0, 0);
                                        canvasRef.current.toBlob(blob => {
                                            setSelectedFile(new File([blob], "capture.jpg", { type: "image/jpeg" }));
                                            setIsCameraOpen(false);
                                        }, "image/jpeg", 0.7);
                                    }} className="w-24 h-24 bg-white rounded-full border-[8px] border-white/30 shadow-2xl active:scale-90 transition-all flex items-center justify-center">
                                        <div className="w-16 h-16 rounded-full border-2 border-black/5"/>
                                    </button>
                                    <div className="w-16"/> {/* Spacer */}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
