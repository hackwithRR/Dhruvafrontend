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

const OnboardingModal = ({ currentUser, onComplete, currentTheme }) => {
    const [loading, setLoading] = useState(false);
    const [profile, setProfile] = useState({ board: "CBSE", classLevel: "10", gender: "Male" });

    const handleSave = async () => {
        if (!currentUser) return;
        setLoading(true);
        try {
            const userRef = doc(db, "users", currentUser.uid);
            const updateData = {
                ...profile,
                onboarded: true,
                uid: currentUser.uid,
                email: currentUser.email,
                photoURL: currentUser.photoURL 
            };
            await setDoc(userRef, updateData, { merge: true });
            onComplete(updateData);
            toast.success("Profile Saved!");
        } catch (e) {
            toast.error("Save failed.");
        }
        setLoading(false);
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className={`max-w-md w-full p-8 rounded-[3rem] border-2 border-white/20 shadow-2xl text-center ${currentTheme.aiBubble}`}>
                <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-4"><FaRocket className="text-white text-2xl animate-bounce" /></div>
                <h2 className="text-2xl font-black mb-6">Complete Profile</h2>
                <div className="space-y-4 text-left">
                    <select value={profile.board} onChange={e => setProfile({...profile, board: e.target.value})} className="w-full bg-white/5 border border-white/10 p-3 rounded-xl font-bold">
                        <option value="CBSE">CBSE</option>
                        <option value="ICSE">ICSE</option>
                    </select>
                    <select value={profile.classLevel} onChange={e => setProfile({...profile, classLevel: e.target.value})} className="w-full bg-white/5 border border-white/10 p-3 rounded-xl font-bold">
                        {["8","9","10","11","12"].map(c => <option key={c} value={c}>Class {c}</option>)}
                    </select>
                    <select value={profile.gender} onChange={e => setProfile({...profile, gender: e.target.value})} className="w-full bg-white/5 border border-white/10 p-3 rounded-xl font-bold">
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                    </select>
                </div>
                <button onClick={handleSave} disabled={loading} className="w-full mt-8 py-5 bg-indigo-600 text-white font-black rounded-2xl">
                    {loading ? <FaSyncAlt className="animate-spin mx-auto" /> : "SAVE & START"}
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
            if (i >= text.length) { clearInterval(interval); if (onComplete) onComplete(); }
        }, 10);
        return () => clearInterval(interval);
    }, [text, onComplete, scrollRef]);
    return (
        <div className="prose prose-sm dark:prose-invert max-w-none">
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
        else if (timeLeft === 0 && isActive) { setIsActive(false); toast.info("Break time!"); }
        return () => clearInterval(timerRef.current);
    }, [isActive, timeLeft]);
    return (
        <motion.div drag dragMomentum={false} className="fixed z-[100] left-5 bottom-24">
            <motion.div animate={{ width: isOpen ? "200px" : "60px", height: isOpen ? "200px" : "60px" }} className={`rounded-3xl border shadow-2xl flex flex-col items-center justify-center ${currentTheme.aiBubble} border-white/20`}>
                {!isOpen ? <button onClick={() => setIsOpen(true)}><FaClock size={20}/></button> : (
                    <div className="p-4 flex flex-col items-center w-full">
                        <button onClick={() => setIsOpen(false)} className="ml-auto"><FaTimes size={10}/></button>
                        <h2 className="text-2xl font-black font-mono mb-4">{Math.floor(timeLeft/60)}:{(timeLeft%60).toString().padStart(2,'0')}</h2>
                        {timeLeft === 0 ? (
                            <div className="grid grid-cols-2 gap-2 w-full">
                                {[25, 45].map(m => <button key={m} onClick={() => {setTimeLeft(m*60); setIsActive(true)}} className="bg-indigo-600 text-[10px] p-2 rounded-lg">{m}m</button>)}
                            </div>
                        ) : (
                            <button onClick={() => setTimeLeft(0)} className="bg-red-500 p-2 rounded-lg text-xs">Stop</button>
                        )}
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
    const [userData, setUserData] = useState({ board: "", class: "", gender: "" });
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
    const modes = [{ id: "Explain", icon: <FaBookOpen />, label: "Explain" }, { id: "Doubt", icon: <FaQuestion />, label: "Doubt" }, { id: "Quiz", icon: <FaGraduationCap />, label: "Quiz" }];

    useEffect(() => {
        if (!currentUser) return;
        const initData = async () => {
            const userDoc = await getDoc(doc(db, "users", currentUser.uid));
            if (userDoc.exists()) {
                const data = userDoc.data();
                setUserData({ ...data, class: data.classLevel || data.class });
                if (!data.board || !data.gender) setShowOnboarding(true);
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

    const speakText = (text) => {
        window.speechSynthesis.cancel();
        const ut = new SpeechSynthesisUtterance(text.replace(/[*#_~]/g, ""));
        ut.onend = () => { if (isLiveMode) startVoiceMode(); };
        window.speechSynthesis.speak(ut);
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

        const userMsg = { role: "user", content: text || "Analyzing image...", image: file ? URL.createObjectURL(file) : null };
        const newMessages = [...messages, userMsg];
        setMessages(newMessages);

        try {
            const payload = { userId: currentUser.uid, message: text || "Explain", mode, subject: subjectInput, chapter: chapterInput, classLevel: userData.class };
            let res;
            if (file) {
                const formData = new FormData();
                const comp = await imageCompression(file, { maxSizeMB: 0.5 });
                formData.append("photo", comp);
                Object.keys(payload).forEach(k => formData.append(k, payload[k]));
                res = await axios.post(`${API_BASE}/chat/photo`, formData);
            } else {
                res = await axios.post(`${API_BASE}/chat`, payload);
            }

            const aiMsg = { role: "ai", content: res.data.reply };
            const finalMessages = [...newMessages, aiMsg];
            setMessages(finalMessages);

            if (isLiveMode || voiceInput) speakText(res.data.reply);

            await setDoc(doc(db, `users/${currentUser.uid}/sessions`, currentSessionId), { messages: finalMessages, lastUpdate: Date.now(), title: subjectInput || "New Session" }, { merge: true });
            fetchSessions();
        } catch (e) { toast.error("Error"); }
        setIsSending(false);
    };

    const openCamera = async () => { setIsCameraOpen(true); const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }); if (videoRef.current) videoRef.current.srcObject = s; };
    const capturePhoto = () => { const c = canvasRef.current; const v = videoRef.current; c.width = v.videoWidth; c.height = v.videoHeight; c.getContext("2d").drawImage(v, 0, 0); c.toBlob(b => { setSelectedFile(new File([b], "c.jpg", { type: "image/jpeg" })); setIsCameraOpen(false); v.srcObject.getTracks().forEach(t => t.stop()); }, "image/jpeg", 0.8); };

    return (
        <div className={`flex h-screen w-full overflow-hidden ${currentTheme.container}`}>
            <ToastContainer theme="dark" position="top-center" />
            <AnimatePresence>{showOnboarding && <OnboardingModal currentUser={currentUser} onComplete={(d) => { setUserData(d); setShowOnboarding(false); }} currentTheme={currentTheme} />}</AnimatePresence>

            <AnimatePresence>
                {showSidebar && (
                    <motion.div initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }} className={`fixed lg:relative z-[150] w-72 h-full flex flex-col p-6 ${currentTheme.sidebar}`}>
                        <div className="flex justify-between items-center mb-10"><span className="text-xs font-black opacity-40">HISTORY</span><button onClick={() => setShowSidebar(false)}><FaTimes /></button></div>
                        <button onClick={() => { setMessages([]); setCurrentSessionId(Date.now().toString()); setShowSidebar(false); }} className="w-full py-4 mb-6 rounded-2xl bg-indigo-600 text-white font-bold text-xs flex items-center justify-center gap-2"><FaPlus /> NEW</button>
                        <div className="flex-1 overflow-y-auto space-y-3">
                            {sessions.map((s) => (<div key={s.id} onClick={() => loadSession(s.id)} className={`p-4 rounded-xl cursor-pointer ${currentSessionId === s.id ? 'bg-indigo-500/20' : 'opacity-60'}`}><div className="text-[10px] truncate">{s.title || "Session"}</div></div>))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex-1 flex flex-col min-w-0 relative">
                <Navbar currentUser={currentUser} theme={theme} setTheme={setTheme} logout={logout} />
                <StudyTimer currentTheme={currentTheme} />

                <div className="max-w-4xl mx-auto w-full px-4 pt-4 flex gap-2 overflow-x-auto no-scrollbar">
                    {modes.map(m => <button key={m.id} onClick={() => setMode(m.id)} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase whitespace-nowrap ${mode === m.id ? 'bg-indigo-600 text-white' : 'bg-white/5'}`}>{m.label}</button>)}
                </div>

                <div className="max-w-4xl mx-auto w-full px-4 pt-4 flex items-center gap-2">
                    <button onClick={() => setShowSidebar(true)} className="p-4 bg-white/5 rounded-2xl"><FaHistory/></button>
                    <div className="flex-1 flex bg-white/5 rounded-2xl p-2 border border-white/10">
                        <input value={subjectInput} onChange={e => setSubjectInput(e.target.value)} placeholder="Subject" className="bg-transparent text-xs p-2 outline-none w-1/2" />
                        <input value={chapterInput} onChange={e => setChapterInput(e.target.value)} placeholder="Ch" className="bg-transparent text-xs p-2 outline-none w-1/4" />
                        <button onClick={() => setIsLocked(!isLocked)} className={`p-2 rounded-xl ${isLocked ? 'text-emerald-500' : ''}`}>{isLocked ? <FaLock/> : <FaUnlock/>}</button>
                    </div>
                </div>

                <div ref={chatContainerRef} className="flex-1 overflow-y-auto px-4 py-8">
                    <div className="max-w-3xl mx-auto space-y-8 pb-20">
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                                <div className={`max-w-[90%] p-5 rounded-[2rem] ${msg.role === "user" ? currentTheme.userBubble : currentTheme.aiBubble}`}>
                                    {msg.image && <img src={msg.image} className="rounded-xl mb-4 max-h-48" alt="up" />}
                                    {msg.role === "ai" && i === messages.length - 1 && !isSending ? <Typewriter text={msg.content} scrollRef={chatContainerRef} /> : <div className="prose prose-sm dark:prose-invert"><ReactMarkdown>{msg.content}</ReactMarkdown></div>}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                <div className="p-4 md:p-10">
                    <div className="max-w-3xl mx-auto flex items-center p-2 rounded-full border border-white/10 bg-white/5">
                        <input value={input} onChange={e => setInput(e.target.value)} placeholder={isListening ? "Listening..." : "Ask..."} className="flex-1 bg-transparent px-4 py-3 outline-none text-sm" onKeyDown={e => e.key === "Enter" && sendMessage()} />
                        <div className="flex items-center gap-1">
                            <button onClick={() => { setIsLiveMode(!isLiveMode); if(!isLiveMode) startVoiceMode(); else window.speechSynthesis.cancel(); }} className={`p-3 rounded-full ${isLiveMode ? 'bg-indigo-600' : 'opacity-30'}`}><FaMicrophone/></button>
                            <button onClick={() => fileInputRef.current.click()} className="p-3 opacity-30"><FaImage/></button>
                            <button onClick={openCamera} className="p-3 opacity-30"><FaCamera/></button>
                            <button onClick={() => sendMessage()} disabled={isSending} className="p-4 bg-indigo-600 rounded-full text-white">{isSending ? <FaSyncAlt className="animate-spin" /> : <FaPaperPlane/>}</button>
                        </div>
                    </div>
                </div>

                <input type="file" ref={fileInputRef} hidden onChange={(e) => setSelectedFile(e.target.files[0])} />
                <AnimatePresence>
                    {isCameraOpen && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[600] bg-black flex flex-col items-center justify-center">
                            <video ref={videoRef} autoPlay playsInline className="w-full max-w-md" />
                            <div className="mt-10 flex gap-10">
                                <button onClick={() => setIsCameraOpen(false)} className="bg-white/10 p-5 rounded-full"><FaTimes/></button>
                                <button onClick={capturePhoto} className="w-20 h-20 border-4 border-white rounded-full flex items-center justify-center"><div className="w-14 h-14 bg-white rounded-full"/></button>
                            </div>
                            <canvas ref={canvasRef} className="hidden" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
