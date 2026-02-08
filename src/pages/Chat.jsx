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
            className="prose prose-sm prose-invert max-w-none text-xs md:text-sm font-medium leading-relaxed 
                       prose-p:mb-5 prose-p:leading-relaxed prose-headings:mt-4 prose-headings:mb-2 prose-li:mb-2"
        >
            {displayedText}
        </ReactMarkdown>
    );
};

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
            onComplete(50);
            toast.success("Focus Session Complete! +50 XP 🏆");
        }
        return () => clearInterval(timerRef.current);
    }, [isActive, timeLeft, onComplete]);

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
                    <button onClick={() => setIsOpen(true)} className="w-full h-full flex items-center justify-center text-indigo-400"><FaClock size={18}/></button>
                ) : (
                    <div className="p-4 flex flex-col h-full items-center justify-between">
                        <div className="flex justify-between w-full items-center"><span className="text-[9px] font-black uppercase opacity-40">Zen Mode</span><button onClick={() => setIsOpen(false)}><FaTimes size={12}/></button></div>
                        <h2 className="text-4xl font-black font-mono">{formatTime(timeLeft)}</h2>
                        <div className="grid grid-cols-3 gap-1 w-full">{[15, 25, 45].map(m => (<button key={m} onClick={() => {setTimeLeft(m*60); setIsActive(true)}} className="py-2 rounded-lg bg-white/5 text-[8px] font-black">{m}m</button>))}</div>
                        <div className="flex gap-3">
                            <button onClick={() => setIsActive(!isActive)} className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center">{isActive ? <FaStop size={12}/> : <FaPlay size={12}/>}</button>
                            <button onClick={() => setTimeLeft(0)} className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10"><FaTrash size={12}/></button>
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

    // --- VOICE CHAT ENGINE ---
    const speak = (text) => {
        if (!isVoiceActive) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text.replace(/[*#_~]/g, ""));
        utterance.rate = 1.0;
        utterance.pitch = 1.1; // Friendly higher pitch
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
        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            setInput("");
            recognitionRef.current.start();
            setIsListening(true);
        }
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

            const isGreeting = /^(hi|hello|hey|hola|greetings|morning|evening|bye|thanks|thank you)$/i.test(text.trim());
            const eduTriggers = /(how|why|solve|explain|steps|formula|diagram|what is|define|derivation|theorem)/i;
            const needsVisual = !isGreeting && (eduTriggers.test(text) || text.length > 15);

            const aiMsg = {
                role: "ai",
                content: res.data.reply,
                ytLink: needsVisual ? `https://www.youtube.com/results?search_query=${encodeURIComponent(`${userData.board} ${userData.class} ${stdSub} ${text}`)}` : null,
                suggestions: isGreeting ? ["Explain a Topic", "Take a Quiz"] : ["Show Example", "Concept Map", "Quiz Me"]
            };

            const finalMsgs = [...updatedMsgs, aiMsg];
            setMessages(finalMsgs);
            speak(res.data.reply); // FRIENDLY VOICE OUTPUT
            await setDoc(doc(db, `users/${currentUser.uid}/sessions`, currentSessionId), { messages: finalMsgs, lastUpdate: Date.now(), title: stdSub || text.slice(0, 20) }, { merge: true });
            loadSessions();
            awardXP(20);
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
            
            <AnimatePresence>
                {showSidebar && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowSidebar(false)} className="fixed inset-0 bg-black/80 z-[150] backdrop-blur-md lg:hidden" />
                        <motion.div initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }} className={`fixed lg:relative z-[200] w-[85%] md:w-80 h-full flex flex-col p-6 border-r ${currentTheme.sidebar}`}>
                            <div className="flex justify-between items-center mb-10">
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-2"><FaTrophy className="text-yellow-500"/><span className="text-[10px] font-black uppercase text-white/50">XP: {userData.xp}</span></div>
                                    <div className="w-32 h-1.5 bg-white/5 mt-2 rounded-full overflow-hidden"><div className="h-full bg-indigo-600 shadow-[0_0_10px_#4f46e5]" style={{ width: `${(userData.xp % 500) / 5}%` }} /></div>
                                </div>
                                <button onClick={() => setShowSidebar(false)} className="p-2 opacity-30"><FaTimes/></button>
                            </div>
                            <button onClick={() => {setMessages([]); setCurrentSessionId(Date.now().toString()); setShowSidebar(false)}} className="w-full py-4 mb-8 rounded-2xl bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all"><FaPlus className="inline mr-2"/> New Brainstorm</button>
                            <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar">
                                {sessions.map(s => (
                                    <div key={s.id} onClick={() => {setCurrentSessionId(s.id); setMessages(s.messages || []); setShowSidebar(false)}} className={`group p-4 rounded-2xl border transition-all cursor-pointer relative ${currentSessionId === s.id ? 'bg-indigo-600/10 border-indigo-600/30' : 'border-transparent hover:bg-white/5'}`}>
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

                {/* HEADER INPUTS */}
                <div className="w-full max-w-5xl mx-auto px-4 pt-4 flex flex-col gap-3">
                    <div className={`flex items-center gap-2 p-1.5 rounded-2xl border ${currentTheme.input} backdrop-blur-2xl shadow-xl`}>
                        <div className="p-2 text-indigo-500/50 hidden md:block"><FaMagic size={12}/></div>
                        <input disabled={isLocked} value={subjectInput} onChange={e => setSubjectInput(e.target.value)} placeholder="Sub" className="w-[20%] md:w-[30%] bg-transparent px-2 py-1 text-[10px] font-black uppercase outline-none" />
                        <div className="h-4 w-[1px] bg-white/10"/>
                        <input disabled={isLocked} value={chapterInput} onChange={e => setChapterInput(e.target.value)} placeholder="Topic" className="flex-1 bg-transparent px-2 py-1 text-[10px] font-black uppercase outline-none" />
                        <button onClick={() => setIsLocked(!isLocked)} className={`p-2.5 rounded-xl transition-all ${isLocked ? 'bg-emerald-600 text-white' : 'bg-white/5 text-indigo-500'}`}>{isLocked ? <FaLock size={10}/> : <FaCheckCircle size={10}/>}</button>
                    </div>
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                        {["Explain", "Quiz", "Summary", "Homework"].map(m => (
                            <button key={m} onClick={() => setMode(m)} className={`px-4 py-2 text-[9px] font-black uppercase rounded-xl border transition-all whitespace-nowrap ${mode === m ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white/5 opacity-40'}`}>{m}</button>
                        ))}
                    </div>
                </div>

                {/* MESSAGES AREA */}
                <div className="flex-1 overflow-y-auto px-4 py-6 no-scrollbar">
                    <div className="max-w-4xl mx-auto space-y-12"> {/* SPACING BETWEEN SECTIONS */}
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-96 opacity-10 text-center uppercase tracking-[0.4em] text-xs"><FaMagic size={40} className="mb-4"/><p>Awaiting Neural Input</p></div>
                        )}
                        {messages.map((msg, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                                <div className={`max-w-[95%] md:max-w-[85%] p-5 md:p-8 rounded-3xl md:rounded-[3rem] shadow-2xl relative ${msg.role === "user" ? `${currentTheme.userBubble} rounded-tr-none text-white` : `${currentTheme.aiBubble} rounded-tl-none border-white/5 backdrop-blur-3xl`}`}>
                                    {msg.image && <img src={msg.image} className="rounded-2xl mb-6 max-h-72 w-full object-cover shadow-2xl border border-white/10" alt="input" />}
                                    {msg.role === "ai" && i === messages.length - 1 && !isSending ? 
                                        <Typewriter text={msg.content} /> : 
                                        <ReactMarkdown 
                                            remarkPlugins={[remarkGfm, remarkMath]} 
                                            rehypePlugins={[rehypeKatex]} 
                                            className="prose prose-sm prose-invert max-w-none text-xs md:text-sm font-medium leading-relaxed 
                                                       prose-p:mb-5 prose-li:mb-2 prose-headings:mb-3"
                                        >
                                            {msg.content}
                                        </ReactMarkdown>
                                    }
                                    {msg.role === "ai" && msg.ytLink && (
                                        <a href={msg.ytLink} target="_blank" rel="noreferrer" className="mt-6 flex items-center justify-center gap-3 py-4 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] shadow-xl shadow-red-600/20"><FaYoutube size={18}/> Access Visual Lab</a>
                                    )}
                                    {msg.role === "ai" && i === messages.length - 1 && (
                                        <div className="mt-8 flex flex-wrap gap-2">{msg.suggestions?.map((s, idx) => (<button key={idx} onClick={() => sendMessage(s)} className="px-5 py-2.5 rounded-xl border border-white/10 bg-white/5 text-[9px] font-black uppercase hover:bg-indigo-600 transition-all">{s}</button>))}</div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                        {isSending && <div className="flex items-center gap-3 px-6 text-[9px] font-black uppercase tracking-[0.3em] text-indigo-500 animate-pulse"><FaSyncAlt className="animate-spin"/> Processing...</div>}
                        <div ref={messagesEndRef} className="h-32" />
                    </div>
                </div>

                {/* BOTTOM INPUT BAR - MOBILE OPTIMIZED */}
                <div className="p-3 md:p-10 relative bg-gradient-to-t from-black/80 to-transparent backdrop-blur-sm">
                    <div className="max-w-4xl mx-auto">
                        <div className={`flex items-center gap-1 md:gap-2 p-1.5 md:p-2 rounded-[2.5rem] md:rounded-[4rem] border shadow-3xl backdrop-blur-3xl ${currentTheme.input}`}>
                            
                            <button onClick={() => setShowSidebar(true)} className="p-3 text-indigo-500 lg:hidden rounded-full"><FaHistory size={18}/></button>
                            
                            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMessage()} placeholder="Ask Dhruva..." className="flex-1 bg-transparent px-2 md:px-6 py-2 outline-none text-sm font-bold min-w-0" />
                            
                            <div className="flex items-center gap-0.5 md:gap-1">
                                <button onClick={() => setIsVoiceActive(!isVoiceActive)} className="p-3 text-indigo-500 hidden md:block">
                                    {isVoiceActive ? <FaVolumeUp size={18}/> : <FaVolumeMute size={18}/>}
                                </button>
                                <button onClick={toggleVoice} className={`p-3 rounded-full transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-indigo-500'}`}><FaMicrophone size={20}/></button>
                                <button onClick={openCamera} className="p-3 text-indigo-500 hidden sm:block"><FaCamera size={20}/></button>
                                <button onClick={() => fileInputRef.current.click()} className="p-3 text-indigo-500"><FaImage size={20}/><input type="file" ref={fileInputRef} hidden onChange={e => setSelectedFile(e.target.files[0])} /></button>
                                <button onClick={() => sendMessage()} disabled={isSending} className={`p-4 md:p-6 rounded-full ${currentTheme.button} text-white shadow-2xl active:scale-75 transition-all`}>
                                    {isSending ? <FaSyncAlt className="animate-spin" size={16}/> : <FaPaperPlane size={16}/>}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <AnimatePresence>
                    {isCameraOpen && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[600] bg-black flex flex-col">
                            <video ref={videoRef} autoPlay playsInline className="flex-1 object-cover" />
                            <canvas ref={canvasRef} className="hidden" />
                            <div className="p-10 flex justify-between items-center bg-black/90 border-t border-white/10">
                                <button onClick={closeCamera} className="p-5 bg-white/10 rounded-full text-white"><FaTimes size={24}/></button>
                                <button onClick={capturePhoto} className="w-20 h-20 bg-white rounded-full border-[6px] border-white/20 active:scale-90 transition-all" />
                                <div className="w-16" />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
