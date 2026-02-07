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

// --- SUB-COMPONENTS ---

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
            toast.success("Neural Link Established!");
        } catch (e) {
            toast.error("Error saving profile");
        } finally {
            setLoading(false);
        }
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
                            <select value={profile.board} onChange={e => setProfile({...profile, board: e.target.value})} className="bg-white/5 border border-white/10 p-3 rounded-xl font-bold outline-none text-sm w-full">
                                <option value="CBSE">CBSE</option>
                                <option value="ICSE">ICSE</option>
                            </select>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-black opacity-40 ml-2">CLASS</label>
                            <select value={profile.classLevel} onChange={e => setProfile({...profile, classLevel: e.target.value})} className="bg-white/5 border border-white/10 p-3 rounded-xl font-bold outline-none text-sm w-full">
                                {["8","9","10","11","12"].map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-black opacity-40 ml-2">GENDER</label>
                        <select value={profile.gender} onChange={e => setProfile({...profile, gender: e.target.value})} className="bg-white/5 border border-white/10 p-3 rounded-xl font-bold outline-none text-sm w-full">
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
        }, 10);
        return () => clearInterval(interval);
    }, [text, onComplete, scrollRef]);

    return (
        <div className="markdown-container prose prose-sm dark:prose-invert max-w-none">
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
        <motion.div drag dragMomentum={false} className="fixed z-[100] right-5 bottom-24 lg:bottom-10 cursor-pointer">
            <motion.div animate={{ width: isOpen ? "240px" : "64px", height: isOpen ? "280px" : "64px" }} className={`rounded-[2rem] border backdrop-blur-3xl shadow-2xl flex flex-col items-center justify-center ${currentTheme.aiBubble} border-white/20 overflow-hidden`}>
                {!isOpen ? (
                    <button onClick={() => setIsOpen(true)} className="w-full h-full flex items-center justify-center text-indigo-500">
                        <FaClock size={24} className={isActive ? "animate-spin-slow" : ""} />
                    </button>
                ) : (
                    <div className="p-5 w-full flex flex-col items-center">
                        <button onClick={() => setIsOpen(false)} className="self-end mb-2 opacity-40"><FaTimes size={12}/></button>
                        <h2 className="text-4xl font-black font-mono mb-6">{formatTime(timeLeft)}</h2>
                        {timeLeft === 0 ? (
                            <div className="grid grid-cols-2 gap-2 w-full">
                                {[15, 25, 45, 60].map(m => (
                                    <button key={m} onClick={() => { setTimeLeft(m * 60); setIsActive(true); }} className="bg-indigo-600/10 text-[10px] font-bold py-2 rounded-xl border border-indigo-500/20">
                                        {m}m
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="flex gap-4">
                                <button onClick={() => setIsActive(!isActive)} className="p-4 bg-indigo-600 text-white rounded-full">{isActive ? <FaPause/> : <FaPlay/>}</button>
                                <button onClick={() => { setTimeLeft(0); setIsActive(false); }} className="p-4 bg-red-500/10 text-red-500 rounded-full"><FaStop/></button>
                            </div>
                        )}
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
};

// --- MAIN CHAT COMPONENT ---

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
    const [isListening, setIsListening] = useState(false);
    const [isLiveMode, setIsLiveMode] = useState(false);

    const chatContainerRef = useRef(null);
    const messagesEndRef = useRef(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const fileInputRef = useRef(null);

    const themes = {
        dark: { 
            container: "bg-[#050505] text-white", 
            aiBubble: "bg-white/5 border border-white/10 shadow-2xl", 
            userBubble: "bg-indigo-600 shadow-lg shadow-indigo-500/20 text-white", 
            input: "bg-white/[0.03] border-white/10 text-white", 
            button: "bg-indigo-600", 
            sidebar: "bg-[#0A0A0A] border-r border-white/10" 
        },
        light: { 
            container: "bg-[#F8FAFF] text-[#1E293B]", 
            aiBubble: "bg-white/70 backdrop-blur-md border border-white shadow-xl shadow-indigo-100/20", 
            userBubble: "bg-indigo-600 text-white shadow-lg", 
            input: "bg-white/80 border-indigo-100 text-[#1E293B]", 
            button: "bg-indigo-600", 
            sidebar: "bg-white/60 backdrop-blur-xl border-r border-gray-100" 
        }
    };
    const currentTheme = themes[theme] || themes.dark;
    const modesList = [{ id: "Explain", icon: <FaBookOpen />, label: "Explain" }, { id: "Doubt", icon: <FaQuestion />, label: "Doubt" }, { id: "Quiz", icon: <FaGraduationCap />, label: "Quiz" }, { id: "Summary", icon: <FaLightbulb />, label: "Summary" }];

    useEffect(() => {
        if (!currentUser) return;
        const init = async () => {
            const docSnap = await getDoc(doc(db, "users", currentUser.uid));
            if (docSnap.exists()) {
                const data = docSnap.data();
                setUserData({ 
                    board: data.board || "", 
                    class: data.classLevel || data.class || "", 
                    gender: data.gender || "",
                    language: data.language || "English" 
                });
                if (!data.board || !data.gender) setShowOnboarding(true);
            } else {
                setShowOnboarding(true);
            }
            fetchSessions();
        };
        init();
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
            const payload = { userId: currentUser.uid, message: text || "Explain", mode, subject: subjectInput, chapter: mappedChapter, classLevel: userData.class, language: userData.language };
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
        if (!SR) return toast.error("Voice recognition not supported");
        const rec = new SR();
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

    return (
        <div className={`flex h-screen w-full overflow-hidden transition-all duration-700 ${currentTheme.container}`}>
            <ToastContainer theme={theme === "dark" ? "dark" : "light"} position="top-center" />
            <AnimatePresence>{showOnboarding && <OnboardingModal currentUser={currentUser} onComplete={(d) => { setUserData(d); setShowOnboarding(false); }} currentTheme={currentTheme} />}</AnimatePresence>

            {/* Sidebar */}
            <AnimatePresence>
                {showSidebar && (
                    <motion.div initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }} className={`fixed lg:relative z-[150] w-72 h-full flex flex-col p-6 shadow-2xl ${currentTheme.sidebar}`}>
                        <div className="flex justify-between items-center mb-8"><span className="text-[10px] font-black opacity-40 uppercase">History</span><button onClick={() => setShowSidebar(false)}><FaTimes /></button></div>
                        <button onClick={() => { setMessages([]); setCurrentSessionId(Date.now().toString()); setShowSidebar(false); }} className="w-full py-4 mb-4 rounded-2xl bg-indigo-600 text-white font-bold text-xs flex items-center justify-center gap-2"><FaPlus /> NEW CHAT</button>
                        <div className="flex-1 overflow-y-auto space-y-2 no-scrollbar">
                            {sessions.map(s => <div key={s.id} onClick={() => loadSession(s.id)} className={`p-4 rounded-xl cursor-pointer text-[10px] font-bold border ${currentSessionId === s.id ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-500' : 'border-transparent opacity-50'}`}>{s.title || "Untitled"}</div>)}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex-1 flex flex-col min-w-0 relative">
                <Navbar currentUser={currentUser} theme={theme} setTheme={setTheme} logout={logout} />
                <StudyTimer currentTheme={currentTheme} />

                {/* Mode Selector */}
                <div className="max-w-4xl mx-auto w-full px-4 pt-4 overflow-x-auto no-scrollbar flex justify-center">
                    <div className="flex gap-2 p-1.5 rounded-[1.5rem] bg-white/5 border border-white/10">
                        {modesList.map(m => (
                            <button key={m.id} onClick={() => setMode(m.id)} className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase transition-all ${mode === m.id ? 'bg-indigo-600 text-white shadow-lg' : 'opacity-40 hover:opacity-100'}`}>{m.icon} {m.label}</button>
                        ))}
                    </div>
                </div>

                {/* Subject Inputs */}
                <div className="max-w-4xl mx-auto w-full px-4 pt-4 flex items-center gap-2">
                    <button onClick={() => setShowSidebar(true)} className={`p-4 rounded-2xl border ${currentTheme.aiBubble}`}><FaHistory/></button>
                    <div className={`flex-1 flex items-center gap-2 p-2 rounded-[2rem] border transition-all ${isLocked ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-white/10 bg-white/5 shadow-2xl'}`}>
                        <div className="flex-1 px-4"><label className="text-[8px] font-bold uppercase opacity-50 block">Subject</label><input disabled={isLocked} value={subjectInput} onChange={e => setSubjectInput(e.target.value)} placeholder="Physics" className="bg-transparent text-xs font-bold outline-none w-full" /></div>
                        <div className="w-px h-8 bg-white/10" />
                        <div className="flex-1 px-4"><label className="text-[8px] font-bold uppercase opacity-50 block">Ch #</label><input disabled={isLocked} value={chapterInput} onChange={e => setChapterInput(e.target.value)} placeholder="1" className="bg-transparent text-xs font-bold outline-none w-full" /></div>
                        <button onClick={() => setIsLocked(!isLocked)} className={`p-3 rounded-xl ${isLocked ? 'bg-emerald-500 text-white' : 'bg-white/5 text-indigo-500'}`}>{isLocked ? <FaLock/> : <FaUnlock/>}</button>
                    </div>
                </div>

                {/* Messages Container */}
                <div ref={chatContainerRef} className="flex-1 overflow-y-auto px-4 py-8 scroll-smooth no-scrollbar">
                    <div className="max-w-3xl mx-auto space-y-10 pb-20">
                        {messages.length === 0 && (
                            <div className="text-center py-20 opacity-10 flex flex-col items-center">
                                <FaGraduationCap size={60} />
                                <p className="mt-4 font-black uppercase">Start Your Session</p>
                            </div>
                        )}
                        {messages.map((msg, i) => (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={i} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                                <div className={`max-w-[85%] p-6 rounded-[2.5rem] ${msg.role === "user" ? `${currentTheme.userBubble} rounded-tr-none` : `${currentTheme.aiBubble} rounded-tl-none`}`}>
                                    {msg.image && <img src={msg.image} alt="upload" className="rounded-2xl mb-4 max-h-60 w-full object-cover" />}
                                    {msg.role === "ai" && i === messages.length - 1 && !isSending ? (
                                        <Typewriter text={msg.content} scrollRef={chatContainerRef} onComplete={() => messagesEndRef.current?.scrollIntoView()} />
                                    ) : (
                                        <div className="prose prose-sm dark:prose-invert max-w-none">
                                            <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{formatContent(msg.content)}</ReactMarkdown>
                                        </div>
                                    )}
                                    {msg.ytLink && (
                                        <div className="mt-4 pt-4 border-t border-white/10">
                                            <a href={msg.ytLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-red-600/10 text-red-500 rounded-xl text-[10px] font-black uppercase border border-red-500/20"><FaYoutube/> Watch Video</a>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                {/* Bottom Input Area */}
                <div className="p-4 md:p-10 shrink-0">
                    <div className="max-w-3xl mx-auto relative">
                        <div className={`flex items-center p-1 md:p-2 rounded-[2.8rem] border transition-all ${currentTheme.input} ${isListening ? 'ring-4 ring-indigo-500/30' : 'border-white/10 shadow-2xl'}`}>
                            <input value={input} onChange={e => setInput(e.target.value)} placeholder={isListening ? "Listening..." : "Ask Dhruva..."} className="flex-1 bg-transparent px-6 py-4 outline-none font-bold text-sm" onKeyDown={e => e.key === "Enter" && sendMessage()} />
                            <div className="flex items-center gap-1 pr-2">
                                <button onClick={() => { setIsLiveMode(!isLiveMode); if(!isLiveMode) startVoiceMode(); }} className={`p-4 rounded-full transition-all ${isLiveMode ? 'bg-indigo-600 text-white shadow-lg animate-pulse' : 'opacity-30 hover:opacity-100'}`}><FaMicrophone/></button>
                                <button onClick={() => fileInputRef.current.click()} className="p-3 opacity-30 hover:opacity-100"><FaImage/></button>
                                <button onClick={() => setIsCameraOpen(true)} className="p-3 opacity-30 hover:opacity-100"><FaCamera/></button>
                                <button onClick={() => sendMessage()} disabled={isSending} className={`p-5 rounded-full ${currentTheme.button} shadow-xl shadow-indigo-500/40`}>
                                    {isSending ? <FaSyncAlt className="animate-spin" /> : <FaPaperPlane/>}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <input type="file" ref={fileInputRef} hidden onChange={(e) => setSelectedFile(e.target.files[0])} accept="image/*" />
            </div>

            {/* Camera Overlay */}
            <AnimatePresence>
                {isCameraOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[600] bg-black flex flex-col items-center justify-center p-6">
                        <video ref={videoRef} autoPlay playsInline className="w-full max-w-md rounded-[3rem] border border-white/20" onLoadedMetadata={() => videoRef.current.play()} />
                        <div className="mt-10 flex gap-8">
                            <button onClick={() => { videoRef.current.srcObject.getTracks().forEach(t => t.stop()); setIsCameraOpen(false); }} className="p-6 bg-white/10 rounded-full text-white"><FaTimes size={24}/></button>
                            <button onClick={() => {
                                const c = canvasRef.current;
                                const v = videoRef.current;
                                c.width = v.videoWidth;
                                c.height = v.videoHeight;
                                c.getContext("2d").drawImage(v, 0, 0);
                                c.toBlob(b => {
                                    setSelectedFile(new File([b], "capture.jpg", { type: "image/jpeg" }));
                                    v.srcObject.getTracks().forEach(t => t.stop());
                                    setIsCameraOpen(false);
                                }, "image/jpeg", 0.8);
                            }} className="w-24 h-24 rounded-full border-4 border-white flex items-center justify-center"><div className="w-18 h-18 bg-white rounded-full"/></button>
                        </div>
                        <canvas ref={canvasRef} className="hidden" />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
